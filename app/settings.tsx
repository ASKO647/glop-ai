import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  CreditCard,
  Dumbbell,
  FileText,
  Gauge,
  Gift,
  Globe,
  Info,
  Lock,
  LogOut,
  Mail,
  Scale,
  Shield,
  Sunrise,
  Sunset,
  Target,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChoiceModal, { type ChoiceOption } from '../components/settings/ChoiceModal';
import DeleteAccountModal from '../components/settings/DeleteAccountModal';
import ReferralCard from '../components/settings/ReferralCard';
import ReferralCodeModal from '../components/settings/ReferralCodeModal';
import SettingsRow, { SettingsSwitch, SettingsValue } from '../components/settings/SettingsRow';
import SettingsSection from '../components/settings/SettingsSection';
import TimePickerModal from '../components/settings/TimePickerModal';
import NumberStepperModal from '../components/ui/NumberStepperModal';
import { QUESTIONS, type SingleChoiceQuestion } from '../constants/questionnaire';
import { formatWeight, QUICK_ADJUSTMENTS, WEIGHT_STEP } from '../constants/progression';
import { colors, spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useReferral } from '../hooks/useReferral';
import { useSettings } from '../hooks/useSettings';
import { showAlert, showConfirm } from '../lib/alert';
import { supabase } from '../lib/supabase';

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

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isSubscribed, deleteAccount } = useAuth();
  const { profile, loading: profileLoading, refreshProfile } = useProfile();
  const { settings, loading: settingsLoading, update: updateSettings } = useSettings(user?.id);
  const { referredCount, loading: referralLoading, redeeming, redeemCode } = useReferral(
    user?.id,
    profile,
    refreshProfile
  );

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [savingField, setSavingField] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top']}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
            icon={CreditCard}
            label="Mon abonnement"
            onPress={isSubscribed ? undefined : () => router.push('/paywall')}
            right={
              isSubscribed ? (
                <Text style={styles.premiumValue}>Premium</Text>
              ) : (
                <SettingsValue value="Gratuit" />
              )
            }
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  plainValue: {
    fontSize: 14,
    color: colors.textSecondary,
    maxWidth: 180,
  },
  premiumValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
});
