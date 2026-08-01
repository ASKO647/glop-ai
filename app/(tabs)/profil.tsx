import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import {
  Bell,
  Download,
  Dumbbell,
  FileText,
  Gauge,
  Gift,
  Globe,
  Info,
  Lock,
  LogOut,
  Mail,
  RotateCcw,
  Scale,
  Shield,
  Sunrise,
  Sunset,
  Target,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Linking, Share, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileHeader from '../../components/profil/ProfileHeader';
import SubscriptionCard from '../../components/profil/SubscriptionCard';
import ChoiceModal, { type ChoiceOption } from '../../components/settings/ChoiceModal';
import DeleteAccountModal from '../../components/settings/DeleteAccountModal';
import ReferralCard from '../../components/settings/ReferralCard';
import ReferralCodeModal from '../../components/settings/ReferralCodeModal';
import SettingsRow, { SettingsSwitch, SettingsValue } from '../../components/settings/SettingsRow';
import SettingsSection from '../../components/settings/SettingsSection';
import TimePickerModal from '../../components/settings/TimePickerModal';
import NumberStepperModal from '../../components/ui/NumberStepperModal';
import { getDisplayName, getProgramDay, PROGRAM_LENGTH_DAYS } from '../../constants/dashboard';
import { formatWeight, QUICK_ADJUSTMENTS, WEIGHT_STEP } from '../../constants/progression';
import { QUESTIONS, type SingleChoiceQuestion } from '../../constants/questionnaire';
import { colors, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useMissionStreak } from '../../hooks/useMissionStreak';
import { useReferral } from '../../hooks/useReferral';
import { useSettings } from '../../hooks/useSettings';
import { useWeightLogs } from '../../hooks/useWeightLogs';
import { showAlert, showConfirm } from '../../lib/alert';
import { supabase } from '../../lib/supabase';

const CONTACT_EMAIL = 'contact@glowupai.app';

const GOAL_OPTIONS = (QUESTIONS.find((q) => q.id === 'goal') as SingleChoiceQuestion).options as ChoiceOption[];
const PACE_OPTIONS = (QUESTIONS.find((q) => q.id === 'pace') as SingleChoiceQuestion).options as ChoiceOption[];
const WORKOUTS_OPTIONS = (QUESTIONS.find((q) => q.id === 'workouts_per_week') as SingleChoiceQuestion)
  .options as ChoiceOption[];

type ActiveModal =
  | 'goal'
  | 'targetWeight'
  | 'pace'
  | 'workouts'
  | 'referralCode'
  | 'morningReminder'
  | 'eveningReminder'
  | 'deleteAccount'
  | null;

export default function ProfilScreen() {
  const router = useRouter();
  const { user, isSubscribed, deleteAccount } = useAuth();
  const { profile, loading: profileLoading, refreshProfile } = useProfile();
  const { settings, loading: settingsLoading, update: updateSettings } = useSettings(user?.id);
  const { referredCount, loading: referralLoading, redeeming, redeemCode } = useReferral(
    user?.id,
    profile,
    refreshProfile
  );
  const { logs: weightLogs, loading: weightLoading, refetch: refetchWeightLogs } = useWeightLogs(user?.id);
  const { streak, loading: streakLoading, refetch: refetchStreak } = useMissionStreak(user?.id);

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [savingField, setSavingField] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [resettingProgress, setResettingProgress] = useState(false);

  const closeModal = () => setActiveModal(null);

  const updateProfileField = async (patch: Record<string, unknown>) => {
    if (!user) return;
    setSavingField(true);
    const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
    setSavingField(false);
    if (error) {
      showAlert('Erreur', "Impossible d'enregistrer ce changement. Réessaie.");
      return;
    }
    await refreshProfile();
    closeModal();
  };

  const handleResetPassword = () => {
    if (!user?.email) return;
    showConfirm(
      'Modifier ton mot de passe',
      `Un email de réinitialisation sera envoyé à ${user.email}.`,
      'Envoyer',
      async () => {
        setResettingPassword(true);
        const { error } = await supabase.auth.resetPasswordForEmail(user.email!);
        setResettingPassword(false);
        if (error) {
          showAlert('Erreur', "Impossible d'envoyer l'email pour le moment. Réessaie.");
        } else {
          showAlert('Email envoyé', 'Vérifie ta boîte de réception pour réinitialiser ton mot de passe.');
        }
      }
    );
  };

  const handleRedeemCode = async (code: string) => {
    const result = await redeemCode(code);
    if (result.ok) {
      closeModal();
      showAlert('Code validé', 'Le code de parrainage a bien été appliqué.');
    }
    return result;
  };

  const handleSignOut = () => {
    showConfirm('Se déconnecter', 'Tu devras te reconnecter pour accéder à ton compte.', 'Se déconnecter', async () => {
      await supabase.auth.signOut();
      router.replace('/welcome');
    });
  };

  const handleDeleteAccountRequest = () => {
    showConfirm(
      'Supprimer ton compte ?',
      'Cette action est irréversible : toutes tes données seront définitivement effacées.',
      'Continuer',
      () => setActiveModal('deleteAccount')
    );
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);
    if (error) {
      showAlert('Erreur', error);
      return;
    }
    closeModal();
    router.replace('/welcome');
  };

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [weightRes, missionsRes, mealsRes, photosRes, messagesRes, settingsRes, referralsRes] = await Promise.all([
        supabase.from('weight_logs').select('*').eq('user_id', user.id),
        supabase.from('daily_missions').select('*').eq('user_id', user.id),
        supabase.from('meals').select('*').eq('user_id', user.id),
        // Metadata only — the actual image bytes live in Storage, not the export.
        supabase.from('progress_photos').select('id, date, storage_path, poids, created_at').eq('user_id', user.id),
        supabase.from('messages').select('*').eq('user_id', user.id),
        supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('referrals').select('*').or(`filleul_id.eq.${user.id},parrain_id.eq.${user.id}`),
      ]);

      const exportPayload = {
        exported_at: new Date().toISOString(),
        profile,
        weight_logs: weightRes.data ?? [],
        daily_missions: missionsRes.data ?? [],
        meals: mealsRes.data ?? [],
        progress_photos: photosRes.data ?? [],
        messages: messagesRes.data ?? [],
        settings: settingsRes.data ?? null,
        referrals: referralsRes.data ?? [],
      };

      await Share.share({
        title: 'Mes données GlowUp AI',
        message: JSON.stringify(exportPayload, null, 2),
      });
    } catch {
      showAlert('Erreur', "Impossible d'exporter tes données pour l'instant. Réessaie.");
    } finally {
      setExporting(false);
    }
  };

  const handleResetProgress = () => {
    showConfirm(
      'Réinitialiser ta progression ?',
      'Tes pesées, missions, repas et photos de progression seront supprimés. Ton compte et ton profil resteront intacts.',
      'Continuer',
      () => {
        showConfirm(
          'Es-tu vraiment sûr ?',
          'Cette action est définitive et irréversible.',
          'Réinitialiser',
          async () => {
            if (!user) return;
            setResettingProgress(true);
            try {
              const { data: photos } = await supabase
                .from('progress_photos')
                .select('storage_path')
                .eq('user_id', user.id);
              const paths = (photos ?? []).map((photo) => photo.storage_path).filter(Boolean) as string[];
              if (paths.length > 0) {
                await supabase.storage.from('progress-photos').remove(paths);
              }

              await Promise.all([
                supabase.from('weight_logs').delete().eq('user_id', user.id),
                supabase.from('daily_missions').delete().eq('user_id', user.id),
                supabase.from('meals').delete().eq('user_id', user.id),
                supabase.from('progress_photos').delete().eq('user_id', user.id),
              ]);

              await Promise.all([refetchWeightLogs(), refetchStreak()]);
              showAlert('Progression réinitialisée', 'Tes données de suivi ont été effacées.');
            } catch {
              showAlert('Erreur', 'Impossible de réinitialiser ta progression. Réessaie.');
            } finally {
              setResettingProgress(false);
            }
          }
        );
      }
    );
  };

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top']}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  const displayName = getDisplayName(profile?.email ?? user?.email ?? null);
  const initial = (displayName ?? profile?.email ?? user?.email ?? '?').charAt(0).toUpperCase();
  const programDay = getProgramDay(profile?.created_at ?? null);
  const startWeight = profile?.poids_actuel ?? null;
  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].poids : startWeight;
  const weightLost = startWeight != null && currentWeight != null ? Math.max(0, startWeight - currentWeight) : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={typography.title}>Profil</Text>

        <ProfileHeader
          initial={initial}
          email={user?.email ?? profile?.email ?? '-'}
          isSubscribed={!!isSubscribed}
          programDay={programDay}
          programLength={PROGRAM_LENGTH_DAYS}
          weightLost={weightLost}
          streak={streak}
          statsLoading={weightLoading || streakLoading}
        />

        <SubscriptionCard isSubscribed={!!isSubscribed} />

        <ReferralCard code={profile?.code_parrainage ?? null} referredCount={referredCount} loading={referralLoading} />

        <SettingsSection title="Mes objectifs">
          <SettingsRow
            icon={Target}
            label="Objectif principal"
            onPress={() => setActiveModal('goal')}
            right={<SettingsValue value={profile?.objectif ?? '-'} />}
          />
          <SettingsRow
            icon={Scale}
            label="Poids objectif"
            onPress={() => setActiveModal('targetWeight')}
            right={<SettingsValue value={profile?.poids_objectif != null ? `${formatWeight(profile.poids_objectif)} kg` : '-'} />}
          />
          <SettingsRow
            icon={Gauge}
            label="Vitesse"
            onPress={() => setActiveModal('pace')}
            right={<SettingsValue value={profile?.vitesse ?? '-'} />}
          />
          <SettingsRow
            icon={Dumbbell}
            label="Entraînements par semaine"
            onPress={() => setActiveModal('workouts')}
            right={<SettingsValue value={profile?.frequence_entrainement ?? '-'} />}
          />
        </SettingsSection>

        <SettingsSection title="Compte">
          <SettingsRow icon={Mail} label="Email" right={<Text style={styles.plainValue}>{user?.email ?? '-'}</Text>} />
          <SettingsRow
            icon={Lock}
            label="Modifier mon mot de passe"
            onPress={handleResetPassword}
            disabled={resettingPassword}
            right={resettingPassword ? <ActivityIndicator color={colors.accent} size="small" /> : undefined}
          />
          <SettingsRow
            icon={Gift}
            label="Saisir un code de parrainage"
            onPress={() => setActiveModal('referralCode')}
            disabled={!!profile?.parraine_par}
            right={<SettingsValue value={profile?.parraine_par ? 'Utilisé' : ''} />}
          />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsRow
            icon={Bell}
            label="Activer les notifications"
            right={
              <SettingsSwitch
                value={settings.notificationsActives}
                onValueChange={(value) => updateSettings({ notificationsActives: value })}
                disabled={settingsLoading}
              />
            }
          />
          <SettingsRow
            icon={Sunrise}
            label="Rappel du matin"
            disabled={!settings.notificationsActives}
            onPress={settings.notificationsActives ? () => setActiveModal('morningReminder') : undefined}
            right={<SettingsValue value={settings.rappelMatin} />}
          />
          <SettingsRow
            icon={Sunset}
            label="Rappel du soir"
            disabled={!settings.notificationsActives}
            onPress={settings.notificationsActives ? () => setActiveModal('eveningReminder') : undefined}
            right={<SettingsValue value={settings.rappelSoir} />}
          />
        </SettingsSection>

        <SettingsSection title="Préférences">
          <SettingsRow
            icon={Scale}
            label="Unité de poids"
            onPress={() => updateSettings({ unitePoids: settings.unitePoids === 'kg' ? 'lb' : 'kg' })}
            right={<SettingsValue value={settings.unitePoids} />}
          />
          <SettingsRow icon={Globe} label="Langue" right={<Text style={styles.plainValue}>{settings.langue}</Text>} />
        </SettingsSection>

        <SettingsSection title="À propos">
          <SettingsRow icon={FileText} label="Conditions d'utilisation" onPress={() => router.push('/legal/terms')} />
          <SettingsRow icon={Shield} label="Politique de confidentialité" onPress={() => router.push('/legal/privacy')} />
          <SettingsRow icon={Mail} label="Nous contacter" onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)} />
          <SettingsRow
            icon={Info}
            label="Version"
            right={<Text style={styles.plainValue}>{Constants.expoConfig?.version ?? '-'}</Text>}
          />
        </SettingsSection>

        <SettingsSection title="Mes données">
          <SettingsRow
            icon={Download}
            label="Exporter mes données"
            onPress={handleExportData}
            disabled={exporting}
            right={exporting ? <ActivityIndicator color={colors.accent} size="small" /> : undefined}
          />
          <SettingsRow
            icon={RotateCcw}
            label="Réinitialiser ma progression"
            onPress={handleResetProgress}
            disabled={resettingProgress}
            right={resettingProgress ? <ActivityIndicator color={colors.accent} size="small" /> : undefined}
          />
        </SettingsSection>

        <SettingsSection title="Zone de danger">
          <SettingsRow icon={LogOut} label="Se déconnecter" danger onPress={handleSignOut} />
          <SettingsRow icon={Trash2} label="Supprimer mon compte" danger onPress={handleDeleteAccountRequest} />
        </SettingsSection>
      </ScrollView>

      <ChoiceModal
        visible={activeModal === 'goal'}
        title="Objectif principal"
        options={GOAL_OPTIONS}
        selectedLabel={profile?.objectif ?? null}
        onCancel={closeModal}
        onSelect={(option) => updateProfileField({ objectif: option.label })}
      />

      <NumberStepperModal
        visible={activeModal === 'targetWeight'}
        title="Poids objectif"
        initialValue={profile?.poids_objectif ?? 70}
        unit="kg"
        step={WEIGHT_STEP}
        quickAdjustments={QUICK_ADJUSTMENTS}
        saving={savingField}
        onCancel={closeModal}
        onSave={(value) => updateProfileField({ poids_objectif: value })}
      />

      <ChoiceModal
        visible={activeModal === 'pace'}
        title="Vitesse"
        options={PACE_OPTIONS}
        selectedLabel={profile?.vitesse ?? null}
        onCancel={closeModal}
        onSelect={(option) => updateProfileField({ vitesse: option.label })}
      />

      <ChoiceModal
        visible={activeModal === 'workouts'}
        title="Entraînements par semaine"
        options={WORKOUTS_OPTIONS}
        selectedLabel={profile?.frequence_entrainement ?? null}
        onCancel={closeModal}
        onSelect={(option) => updateProfileField({ frequence_entrainement: option.label })}
      />

      <ReferralCodeModal
        visible={activeModal === 'referralCode'}
        redeeming={redeeming}
        onCancel={closeModal}
        onSubmit={handleRedeemCode}
      />

      <TimePickerModal
        visible={activeModal === 'morningReminder'}
        title="Rappel du matin"
        initialValue={settings.rappelMatin}
        onCancel={closeModal}
        onSave={(value) => {
          updateSettings({ rappelMatin: value });
          closeModal();
        }}
      />

      <TimePickerModal
        visible={activeModal === 'eveningReminder'}
        title="Rappel du soir"
        initialValue={settings.rappelSoir}
        onCancel={closeModal}
        onSave={(value) => {
          updateSettings({ rappelSoir: value });
          closeModal();
        }}
      />

      <DeleteAccountModal
        visible={activeModal === 'deleteAccount'}
        deleting={deleting}
        onCancel={closeModal}
        onConfirm={handleConfirmDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  plainValue: {
    fontSize: 14,
    color: colors.textSecondary,
    maxWidth: 180,
  },
});
