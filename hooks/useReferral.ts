import { useEffect, useState } from 'react';
import { useLocale } from '../context/LocaleContext';
import type { Profile } from '../context/ProfileContext';
import { generateUniqueReferralCode } from '../lib/referral';
import { supabase } from '../lib/supabase';

export type RedeemResult = { ok: boolean; error?: string };

/** Referral count + code redemption. The code itself lives on `profiles.code_parrainage` (read via ProfileContext) — this hook backfills it if a profile somehow doesn't have one yet. */
export function useReferral(
  userId: string | undefined,
  profile: Profile | null,
  refreshProfile: () => Promise<void>
) {
  const { t } = useLocale();
  const [referredCount, setReferredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  const profileCode = profile?.code_parrainage ?? null;
  const profileEmail = profile?.email ?? null;

  useEffect(() => {
    if (!userId) {
      setReferredCount(0);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);

      if (!profileCode) {
        const code = await generateUniqueReferralCode(profileEmail ?? userId);
        await supabase.from('profiles').update({ code_parrainage: code }).eq('id', userId);
        if (!cancelled) await refreshProfile();
      }

      // Not head:true — this table is small enough that fetching the rows is cheap,
      // and HEAD requests are awkward to test/mock reliably.
      const { count } = await supabase.from('referrals').select('id', { count: 'exact' }).eq('parrain_id', userId);

      if (!cancelled) {
        setReferredCount(count ?? 0);
        setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, profileCode, profileEmail]);

  const redeemCode = async (inputCode: string): Promise<RedeemResult> => {
    if (!userId || !profile) return { ok: false, error: t('profile.referral.codeFailedGeneric') };

    const normalized = inputCode.trim().toUpperCase();
    if (!normalized) return { ok: false, error: t('profile.referral.codeRequired') };
    if (profile.parraine_par) return { ok: false, error: t('profile.referral.codeAlreadyUsed') };
    if (normalized === profile.code_parrainage) return { ok: false, error: t('profile.referral.codeOwn') };

    setRedeeming(true);
    try {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('code_parrainage', normalized)
        .maybeSingle();

      if (!referrer) {
        return { ok: false, error: t('profile.referral.codeInvalid') };
      }

      const { error: insertError } = await supabase.from('referrals').insert({
        parrain_id: referrer.id,
        filleul_id: userId,
        code_utilise: normalized,
      });
      if (insertError) {
        return { ok: false, error: t('profile.referral.codeFailed') };
      }

      await supabase.from('profiles').update({ parraine_par: referrer.id }).eq('id', userId);
      await refreshProfile();
      return { ok: true };
    } finally {
      setRedeeming(false);
    }
  };

  return { referredCount, loading, redeeming, redeemCode };
}
