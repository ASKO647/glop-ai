import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BenefitRow from '../../components/onboarding/BenefitRow';
import PlanCard from '../../components/onboarding/PlanCard';
import Button from '../../components/ui/Button';
import { appImage } from '../../constants/images';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

const BENEFIT_KEYS = [
  { labelKey: 'onboarding.paywall.benefits.coach', image: appImage('benefit-coach.jpg') },
  { labelKey: 'onboarding.paywall.benefits.scanner', image: appImage('benefit-scanner.jpg') },
  { labelKey: 'onboarding.paywall.benefits.workout', image: appImage('benefit-workout.jpg') },
  { labelKey: 'onboarding.paywall.benefits.progress', image: appImage('benefit-progress.jpg') },
];

type PlanId = 'annual' | 'monthly';

export default function PaywallScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user, signOut, refreshSubscription } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Closing without subscribing must not grant access to the app — sign the user
  // out and send them back to the very start of onboarding.
  const handleClose = async () => {
    await signOut();
    router.replace('/welcome');
  };

  const handleSubscribe = async () => {
    if (!user) return;
    setError(undefined);
    setSubmitting(true);

    // TODO: remplacer par RevenueCat
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_subscribed: true })
      .eq('id', user.id);

    if (updateError) {
      setError(t('errors.generic'));
      setSubmitting(false);
      return;
    }

    await refreshSubscription();
    setSubmitting(false);
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
        onPress={handleClose}
        hitSlop={12}
        style={styles.closeButton}
      >
        <X color={colors.labelMuted} size={22} />
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>{t('onboarding.paywall.title')}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {t('onboarding.paywall.subtitle')}
        </Text>
      </View>

      <View style={styles.benefits}>
        {BENEFIT_KEYS.map((benefit) => (
          <BenefitRow key={benefit.labelKey} label={t(benefit.labelKey)} image={benefit.image} />
        ))}
      </View>

      <View style={styles.plans}>
        <PlanCard
          badge={t('onboarding.paywall.plans.annualBadge')}
          name={t('onboarding.paywall.plans.annualName')}
          price={t('onboarding.paywall.plans.annualPrice')}
          originalPrice={t('onboarding.paywall.plans.annualOriginalPrice')}
          trialLabel={t('onboarding.paywall.plans.trial')}
          subline={t('onboarding.paywall.plans.annualSubline')}
          selected={selectedPlan === 'annual'}
          onPress={() => setSelectedPlan('annual')}
        />
        <PlanCard
          name={t('onboarding.paywall.plans.monthlyName')}
          price={t('onboarding.paywall.plans.monthlyPrice')}
          originalPrice={t('onboarding.paywall.plans.monthlyOriginalPrice')}
          trialLabel={t('onboarding.paywall.plans.trial')}
          subline={t('onboarding.paywall.plans.monthlySubline')}
          selected={selectedPlan === 'monthly'}
          onPress={() => setSelectedPlan('monthly')}
        />
      </View>

      <View style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label={t('onboarding.paywall.cta')}
          variant="primary"
          style={styles.ctaButton}
          loading={submitting}
          onPress={handleSubscribe}
        />
        <View style={styles.linksRow}>
          <Text style={styles.link}>{t('onboarding.paywall.restore')}</Text>
          <Text style={styles.link}>·</Text>
          <Text style={styles.link}>{t('onboarding.paywall.terms')}</Text>
          <Text style={styles.link}>·</Text>
          <Text style={styles.link}>{t('onboarding.paywall.privacy')}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
    },
    closeButton: {
      width: 32,
      height: 32,
      marginTop: spacing.xs,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    header: {
      marginTop: spacing.xs,
      alignItems: 'center',
      gap: 6,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.5,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: spacing.sm,
    },
    benefits: {
      marginTop: spacing.lg,
      gap: 10,
    },
    plans: {
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    footer: {
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    error: {
      fontSize: 12,
      textAlign: 'center',
      color: colors.danger,
    },
    ctaButton: {
      height: 52,
      borderRadius: radii.lg,
    },
    linksRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    link: {
      fontSize: 10,
      color: colors.textTertiary,
    },
  });
}
