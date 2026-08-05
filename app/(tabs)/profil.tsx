import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  AtSign,
  Award,
  Bell,
  Download,
  Dumbbell,
  FileText,
  Gauge,
  Gift,
  Globe,
  IdCard,
  Info,
  Lock,
  LogOut,
  Mail,
  Moon,
  RotateCcw,
  Scale,
  Shield,
  Sunrise,
  Sunset,
  Target,
  Trash2,
  User,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Share, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileHeader from '../../components/profil/ProfileHeader';
import SubscriptionCard from '../../components/profil/SubscriptionCard';
import ChoiceModal, { type ChoiceOption } from '../../components/settings/ChoiceModal';
import DeleteAccountModal from '../../components/settings/DeleteAccountModal';
import EmailChangeModal from '../../components/settings/EmailChangeModal';
import ReferralCard from '../../components/settings/ReferralCard';
import ReferralCodeModal from '../../components/settings/ReferralCodeModal';
import SettingsRow, { SettingsSwitch, SettingsValue } from '../../components/settings/SettingsRow';
import SettingsSection from '../../components/settings/SettingsSection';
import TimePickerModal from '../../components/settings/TimePickerModal';
import NumberStepperModal from '../../components/ui/NumberStepperModal';
import TextInputModal from '../../components/ui/TextInputModal';
import { getProgramDay, PROGRAM_LENGTH_DAYS } from '../../constants/dashboard';
import { getDisplayName } from '../../constants/profile';
import { formatWeight, QUICK_ADJUSTMENTS, WEIGHT_STEP } from '../../constants/progression';
import { QUESTIONS, type SingleChoiceQuestion } from '../../constants/questionnaire';
import type { Colors } from '../../constants/theme';
import { spacing, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useProfile } from '../../context/ProfileContext';
import { useTheme, type ThemeMode } from '../../context/ThemeContext';
import { useAvatar } from '../../hooks/useAvatar';
import { useBadges } from '../../hooks/useBadges';
import { useMissionStreak } from '../../hooks/useMissionStreak';
import { useReferral } from '../../hooks/useReferral';
import { useSettings } from '../../hooks/useSettings';
import { useWeightLogs } from '../../hooks/useWeightLogs';
import { showAlert, showConfirm } from '../../lib/alert';
import { LANGUAGE_OPTIONS, type Locale } from '../../lib/i18n';
import { supabase } from '../../lib/supabase';

type Translate = (key: string, params?: Record<string, string | number>) => string;

// 2-30 chars, Unicode letters (accents included) plus spaces/hyphens/apostrophes.
const NAME_PATTERN = /^[\p{L}\s'-]+$/u;
function validateName(t: Translate, value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 30) return t('profile.nameValidation.length');
  if (!NAME_PATTERN.test(trimmed)) return t('profile.nameValidation.pattern');
  return undefined;
}

const USERNAME_PATTERN = /^[a-z0-9_]+$/;
function validateUsername(t: Translate, value: string): string | undefined {
  if (value.length < 3 || value.length > 20) return t('profile.usernameValidation.length');
  if (!USERNAME_PATTERN.test(value)) return t('profile.usernameValidation.pattern');
  return undefined;
}

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
  | 'appearance'
  | 'language'
  | 'deleteAccount'
  | 'prenom'
  | 'nom'
  | 'username'
  | 'email'
  | null;

export default function ProfilScreen() {
  const router = useRouter();
  const { user, isSubscribed, deleteAccount } = useAuth();
  const { colors, mode, setMode } = useTheme();
  const { t, locale, setLocale } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const APPEARANCE_LABELS: Record<ThemeMode, string> = useMemo(
    () => ({
      dark: t('profile.appearanceOptions.dark'),
      light: t('profile.appearanceOptions.light'),
      system: t('profile.appearanceOptions.system'),
    }),
    [t]
  );
  const APPEARANCE_OPTIONS: (ChoiceOption & { id: ThemeMode })[] = useMemo(
    () => [
      { id: 'dark', label: APPEARANCE_LABELS.dark },
      { id: 'light', label: APPEARANCE_LABELS.light },
      { id: 'system', label: APPEARANCE_LABELS.system },
    ],
    [APPEARANCE_LABELS]
  );
  // Each language names itself, in its own language — flag + label come straight from
  // lib/i18n.ts's LANGUAGE_OPTIONS, not from t(), since these are never translated.
  const LANGUAGE_CHOICE_OPTIONS: (ChoiceOption & { id: Locale })[] = useMemo(
    () => LANGUAGE_OPTIONS.map((option) => ({ id: option.id, label: `${option.flag} ${option.label}` })),
    []
  );
  const currentLanguageLabel = LANGUAGE_CHOICE_OPTIONS.find((option) => option.id === locale)?.label ?? null;
  const { profile, loading: profileLoading, refreshProfile } = useProfile();
  const { settings, loading: settingsLoading, update: updateSettings } = useSettings(user?.id);
  const { referredCount, loading: referralLoading, redeeming, redeemCode } = useReferral(
    user?.id,
    profile,
    refreshProfile
  );
  const { logs: weightLogs, loading: weightLoading, refetch: refetchWeightLogs } = useWeightLogs(user?.id);
  const { streak, loading: streakLoading, refetch: refetchStreak } = useMissionStreak(user?.id);
  const { earnedCount: badgesEarnedCount, totalCount: badgesTotalCount } = useBadges();
  const { signedUrl: avatarUrl, uploading: avatarUploading, uploadAvatar, deleteAvatar } = useAvatar(
    user?.id,
    profile?.avatar_path
  );

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [savingField, setSavingField] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [resettingProgress, setResettingProgress] = useState(false);
  const [emailChangeSent, setEmailChangeSent] = useState(false);

  const closeModal = () => setActiveModal(null);

  const updateProfileField = async (patch: Record<string, unknown>) => {
    if (!user) return;
    setSavingField(true);
    const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
    setSavingField(false);
    if (error) {
      showAlert(t('common.error'), t('profile.saveFailed'));
      return;
    }
    await refreshProfile();
    closeModal();
  };

  const handleSaveName = async (field: 'prenom' | 'nom', rawValue: string): Promise<string | undefined> => {
    if (!user) return t('profile.userNotFound');
    const { error } = await supabase.from('profiles').update({ [field]: rawValue.trim() }).eq('id', user.id);
    if (error) return t('profile.saveFailed');
    await refreshProfile();
    return undefined;
  };

  const handleSaveUsername = async (value: string): Promise<string | undefined> => {
    if (!user) return t('profile.userNotFound');
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', value)
      .neq('id', user.id)
      .maybeSingle();
    if (existing) return t('profile.usernameValidation.taken');

    const { error } = await supabase.from('profiles').update({ username: value }).eq('id', user.id);
    if (error) {
      // A concurrent signup/edit could still win the race between the check above and this write.
      if ((error as { code?: string }).code === '23505') return t('profile.usernameValidation.taken');
      return t('profile.saveFailed');
    }
    await refreshProfile();
    return undefined;
  };

  const handlePressAvatar = async () => {
    const { status: existing } = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (existing !== 'granted') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert(t('profile.avatar.permissionDeniedTitle'), t('profile.avatar.permissionDeniedMessage'));
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    const outcome = await uploadAvatar(asset.uri, asset.width);
    if (outcome.ok) {
      await refreshProfile();
    } else {
      showAlert(t('common.error'), outcome.error ?? t('profile.avatar.uploadFailed'));
    }
  };

  const handleLongPressAvatar = () => {
    showConfirm(
      t('profile.alerts.deletePhotoTitle'),
      t('profile.alerts.deletePhotoMessage'),
      t('common.delete'),
      async () => {
        const ok = await deleteAvatar();
        if (ok) {
          await refreshProfile();
        } else {
          showAlert(t('common.error'), t('profile.avatar.deleteFailed'));
        }
      }
    );
  };

  const handleResetPassword = () => {
    if (!user?.email) return;
    showConfirm(
      t('profile.alerts.resetPasswordTitle'),
      t('profile.alerts.resetPasswordMessage', { email: user.email }),
      t('profile.alerts.resetPasswordConfirm'),
      async () => {
        setResettingPassword(true);
        const { error } = await supabase.auth.resetPasswordForEmail(user.email!);
        setResettingPassword(false);
        if (error) {
          showAlert(t('common.error'), t('profile.alerts.resetPasswordFailed'));
        } else {
          showAlert(t('profile.alerts.resetPasswordSentTitle'), t('profile.alerts.resetPasswordSentMessage'));
        }
      }
    );
  };

  const handleRedeemCode = async (code: string) => {
    const result = await redeemCode(code);
    if (result.ok) {
      closeModal();
      showAlert(t('profile.alerts.codeValidatedTitle'), t('profile.alerts.codeValidatedMessage'));
    }
    return result;
  };

  const handleSignOut = () => {
    showConfirm(t('profile.sections.signOut'), t('profile.alerts.signOutMessage'), t('profile.sections.signOut'), async () => {
      await supabase.auth.signOut();
      router.replace('/welcome');
    });
  };

  const handleDeleteAccountRequest = () => {
    showConfirm(
      t('profile.alerts.deleteAccountTitle'),
      t('profile.alerts.deleteAccountMessage'),
      t('common.continue'),
      () => setActiveModal('deleteAccount')
    );
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);
    if (error) {
      showAlert(t('common.error'), error);
      return;
    }
    closeModal();
    router.replace('/welcome');
  };

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [weightRes, missionsRes, mealsRes, photosRes, messagesRes, settingsRes, referralsRes, badgesRes] =
        await Promise.all([
          supabase.from('weight_logs').select('*').eq('user_id', user.id),
          supabase.from('daily_missions').select('*').eq('user_id', user.id),
          supabase.from('meals').select('*').eq('user_id', user.id),
          // Metadata only — the actual image bytes live in Storage, not the export.
          supabase.from('progress_photos').select('id, slot, date, storage_path, poids, created_at').eq('user_id', user.id),
          supabase.from('messages').select('*').eq('user_id', user.id),
          supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('referrals').select('*').or(`filleul_id.eq.${user.id},parrain_id.eq.${user.id}`),
          supabase.from('user_badges').select('*').eq('user_id', user.id),
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
        badges: badgesRes.data ?? [],
      };

      await Share.share({
        title: t('profile.alerts.exportTitle'),
        message: JSON.stringify(exportPayload, null, 2),
      });
    } catch {
      showAlert(t('common.error'), t('profile.alerts.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const handleResetProgress = () => {
    showConfirm(
      t('profile.alerts.resetProgressTitle'),
      t('profile.alerts.resetProgressMessage'),
      t('common.continue'),
      () => {
        showConfirm(
          t('profile.alerts.resetProgressConfirmTitle'),
          t('profile.alerts.resetProgressConfirmMessage'),
          t('profile.alerts.resetProgressConfirmButton'),
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
              showAlert(t('profile.alerts.resetProgressDoneTitle'), t('profile.alerts.resetProgressDoneMessage'));
            } catch {
              showAlert(t('common.error'), t('profile.alerts.resetProgressFailed'));
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

  const displayName = getDisplayName(profile, user);
  const initial = (displayName ?? profile?.email ?? user?.email ?? '?').charAt(0).toUpperCase();
  const programDay = getProgramDay(profile?.created_at ?? null);
  const startWeight = profile?.poids_actuel ?? null;
  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].poids : startWeight;
  const weightLost = startWeight != null && currentWeight != null ? Math.max(0, startWeight - currentWeight) : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>{t('common.tabs.profile')}</Text>

        <ProfileHeader
          initial={initial}
          email={user?.email ?? profile?.email ?? '-'}
          isSubscribed={!!isSubscribed}
          programDay={programDay}
          programLength={PROGRAM_LENGTH_DAYS}
          weightLost={weightLost}
          streak={streak}
          statsLoading={weightLoading || streakLoading}
          avatarUrl={avatarUrl}
          avatarUploading={avatarUploading}
          onPressAvatar={handlePressAvatar}
          onLongPressAvatar={handleLongPressAvatar}
        />

        <SettingsSection title={t('profile.sections.personalInfo')}>
          <SettingsRow
            icon={User}
            label={t('profile.sections.firstName')}
            onPress={() => setActiveModal('prenom')}
            right={<SettingsValue value={profile?.prenom ?? '-'} />}
          />
          <SettingsRow
            icon={IdCard}
            label={t('profile.sections.lastName')}
            onPress={() => setActiveModal('nom')}
            right={<SettingsValue value={profile?.nom ?? '-'} />}
          />
          <SettingsRow
            icon={AtSign}
            label={t('profile.sections.username')}
            onPress={() => setActiveModal('username')}
            right={<SettingsValue value={profile?.username ? `@${profile.username}` : '-'} />}
          />
          <SettingsRow
            icon={Mail}
            label={t('profile.sections.email')}
            onPress={() => {
              setEmailChangeSent(false);
              setActiveModal('email');
            }}
            right={<SettingsValue value={user?.email ?? '-'} />}
          />
        </SettingsSection>

        <SubscriptionCard isSubscribed={!!isSubscribed} />

        <ReferralCard code={profile?.code_parrainage ?? null} referredCount={referredCount} loading={referralLoading} />

        <SettingsSection title={t('profile.sections.goals')}>
          <SettingsRow
            icon={Target}
            label={t('profile.sections.mainGoal')}
            onPress={() => setActiveModal('goal')}
            right={<SettingsValue value={profile?.objectif ?? '-'} />}
          />
          <SettingsRow
            icon={Scale}
            label={t('profile.sections.targetWeight')}
            onPress={() => setActiveModal('targetWeight')}
            right={<SettingsValue value={profile?.poids_objectif != null ? `${formatWeight(profile.poids_objectif)} kg` : '-'} />}
          />
          <SettingsRow
            icon={Gauge}
            label={t('profile.sections.pace')}
            onPress={() => setActiveModal('pace')}
            right={<SettingsValue value={profile?.vitesse ?? '-'} />}
          />
          <SettingsRow
            icon={Dumbbell}
            label={t('profile.sections.workoutsPerWeek')}
            onPress={() => setActiveModal('workouts')}
            right={<SettingsValue value={profile?.frequence_entrainement ?? '-'} />}
          />
          <SettingsRow
            icon={Award}
            label={t('badges.title')}
            onPress={() => router.push('/badges')}
            right={<SettingsValue value={`${badgesEarnedCount}/${badgesTotalCount}`} />}
          />
        </SettingsSection>

        <SettingsSection title={t('profile.sections.account')}>
          <SettingsRow
            icon={Lock}
            label={t('profile.sections.changePassword')}
            onPress={handleResetPassword}
            disabled={resettingPassword}
            right={resettingPassword ? <ActivityIndicator color={colors.accent} size="small" /> : undefined}
          />
          <SettingsRow
            icon={Gift}
            label={t('profile.sections.enterReferralCode')}
            onPress={() => setActiveModal('referralCode')}
            disabled={!!profile?.parraine_par}
            right={<SettingsValue value={profile?.parraine_par ? t('profile.sections.referralUsed') : ''} />}
          />
        </SettingsSection>

        <SettingsSection title={t('common.notifications.title')}>
          <SettingsRow
            icon={Bell}
            label={t('profile.sections.enableNotifications')}
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
            label={t('profile.sections.morningReminder')}
            disabled={!settings.notificationsActives}
            onPress={settings.notificationsActives ? () => setActiveModal('morningReminder') : undefined}
            right={<SettingsValue value={settings.rappelMatin} />}
          />
          <SettingsRow
            icon={Sunset}
            label={t('profile.sections.eveningReminder')}
            disabled={!settings.notificationsActives}
            onPress={settings.notificationsActives ? () => setActiveModal('eveningReminder') : undefined}
            right={<SettingsValue value={settings.rappelSoir} />}
          />
        </SettingsSection>

        <SettingsSection title={t('profile.sections.preferences')}>
          <SettingsRow
            icon={Scale}
            label={t('profile.sections.weightUnit')}
            onPress={() => updateSettings({ unitePoids: settings.unitePoids === 'kg' ? 'lb' : 'kg' })}
            right={<SettingsValue value={settings.unitePoids} />}
          />
          <SettingsRow
            icon={Globe}
            label={t('profile.sections.language')}
            onPress={() => setActiveModal('language')}
            right={<SettingsValue value={currentLanguageLabel ?? ''} />}
          />
          <SettingsRow
            icon={Moon}
            label={t('profile.sections.appearance')}
            onPress={() => setActiveModal('appearance')}
            right={<SettingsValue value={APPEARANCE_LABELS[mode]} />}
          />
        </SettingsSection>

        <SettingsSection title={t('profile.sections.about')}>
          <SettingsRow icon={FileText} label={t('common.legal.termsTitle')} onPress={() => router.push('/legal/terms')} />
          <SettingsRow icon={Shield} label={t('common.legal.privacyTitle')} onPress={() => router.push('/legal/privacy')} />
          <SettingsRow icon={Mail} label={t('profile.sections.contactUs')} onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)} />
          <SettingsRow
            icon={Info}
            label={t('profile.sections.version')}
            right={<Text style={styles.plainValue}>{Constants.expoConfig?.version ?? '-'}</Text>}
          />
        </SettingsSection>

        <SettingsSection title={t('profile.sections.data')}>
          <SettingsRow
            icon={Download}
            label={t('profile.sections.exportData')}
            onPress={handleExportData}
            disabled={exporting}
            right={exporting ? <ActivityIndicator color={colors.accent} size="small" /> : undefined}
          />
          <SettingsRow
            icon={RotateCcw}
            label={t('profile.sections.resetProgress')}
            onPress={handleResetProgress}
            disabled={resettingProgress}
            right={resettingProgress ? <ActivityIndicator color={colors.accent} size="small" /> : undefined}
          />
        </SettingsSection>

        <SettingsSection title={t('profile.sections.dangerZone')}>
          <SettingsRow icon={LogOut} label={t('profile.sections.signOut')} danger onPress={handleSignOut} />
          <SettingsRow icon={Trash2} label={t('profile.sections.deleteAccount')} danger onPress={handleDeleteAccountRequest} />
        </SettingsSection>
      </ScrollView>

      <ChoiceModal
        visible={activeModal === 'goal'}
        title={t('profile.sections.mainGoal')}
        options={GOAL_OPTIONS}
        selectedLabel={profile?.objectif ?? null}
        onCancel={closeModal}
        onSelect={(option) => updateProfileField({ objectif: option.label })}
      />

      <NumberStepperModal
        visible={activeModal === 'targetWeight'}
        title={t('profile.sections.targetWeight')}
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
        title={t('profile.sections.pace')}
        options={PACE_OPTIONS}
        selectedLabel={profile?.vitesse ?? null}
        onCancel={closeModal}
        onSelect={(option) => updateProfileField({ vitesse: option.label })}
      />

      <ChoiceModal
        visible={activeModal === 'workouts'}
        title={t('profile.sections.workoutsPerWeek')}
        options={WORKOUTS_OPTIONS}
        selectedLabel={profile?.frequence_entrainement ?? null}
        onCancel={closeModal}
        onSelect={(option) => updateProfileField({ frequence_entrainement: option.label })}
      />

      <ChoiceModal
        visible={activeModal === 'appearance'}
        title={t('profile.sections.appearance')}
        options={APPEARANCE_OPTIONS}
        selectedLabel={APPEARANCE_LABELS[mode]}
        onCancel={closeModal}
        onSelect={(option) => {
          setMode(option.id as ThemeMode);
          closeModal();
        }}
      />

      <ChoiceModal
        visible={activeModal === 'language'}
        title={t('profile.sections.language')}
        options={LANGUAGE_CHOICE_OPTIONS}
        selectedLabel={currentLanguageLabel}
        onCancel={closeModal}
        onSelect={(option) => {
          setLocale(option.id as Locale);
          closeModal();
        }}
      />

      <ReferralCodeModal
        visible={activeModal === 'referralCode'}
        redeeming={redeeming}
        onCancel={closeModal}
        onSubmit={handleRedeemCode}
      />

      <TimePickerModal
        visible={activeModal === 'morningReminder'}
        title={t('profile.sections.morningReminder')}
        initialValue={settings.rappelMatin}
        onCancel={closeModal}
        onSave={(value) => {
          updateSettings({ rappelMatin: value });
          closeModal();
        }}
      />

      <TimePickerModal
        visible={activeModal === 'eveningReminder'}
        title={t('profile.sections.eveningReminder')}
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

      <TextInputModal
        visible={activeModal === 'prenom'}
        title={t('profile.sections.firstName')}
        initialValue={profile?.prenom ?? ''}
        placeholder={t('profile.sections.firstNamePlaceholder')}
        autoCapitalize="words"
        validate={(value) => validateName(t, value)}
        onCancel={closeModal}
        onSave={(value) => handleSaveName('prenom', value)}
      />

      <TextInputModal
        visible={activeModal === 'nom'}
        title={t('profile.sections.lastName')}
        initialValue={profile?.nom ?? ''}
        placeholder={t('profile.sections.lastNamePlaceholder')}
        autoCapitalize="words"
        validate={(value) => validateName(t, value)}
        onCancel={closeModal}
        onSave={(value) => handleSaveName('nom', value)}
      />

      <TextInputModal
        visible={activeModal === 'username'}
        title={t('profile.sections.username')}
        subtitle={t('profile.usernameValidation.pattern')}
        initialValue={profile?.username ?? ''}
        placeholder={t('profile.sections.usernamePlaceholder')}
        autoCapitalize="none"
        transform={(value) => value.toLowerCase()}
        validate={(value) => validateUsername(t, value)}
        onCancel={closeModal}
        onSave={handleSaveUsername}
      />

      <EmailChangeModal
        visible={activeModal === 'email'}
        currentEmail={user?.email ?? null}
        sent={emailChangeSent}
        onSent={() => setEmailChangeSent(true)}
        onCancel={closeModal}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
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
  pageTitle: {
    ...typography.title,
    color: colors.textPrimary,
  },
  plainValue: {
    fontSize: 14,
    color: colors.textSecondary,
    maxWidth: 180,
  },
  });
}
