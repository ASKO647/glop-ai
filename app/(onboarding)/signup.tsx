import { Link } from 'expo-router';
import { Apple } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GoogleIcon from '../../components/onboarding/GoogleIcon';
import SocialButton from '../../components/onboarding/SocialButton';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import { getOptionLabel } from '../../constants/questionnaire';
import type { Colors } from '../../constants/theme';
import { spacing, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { asString, useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { mapAuthError } from '../../lib/authErrors';
import { generateUniqueReferralCode } from '../../lib/referral';
import { supabase } from '../../lib/supabase';
import { generateUniqueUsername } from '../../lib/username';

const MIN_PASSWORD_LENGTH = 6;

export default function SignupScreen() {
  const { signUp, signInWithApple, signInWithGoogle } = useAuth();
  const { answers } = useOnboarding();
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const isDisabled = !email.trim() || password.length < MIN_PASSWORD_LENGTH;

  const handleSubmit = async () => {
    setEmailError(undefined);
    setPasswordError(undefined);
    setFormError(undefined);

    if (!email.trim()) {
      setEmailError(t('onboarding.auth.emailRequired'));
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(t('errors.auth.passwordTooShort'));
      return;
    }

    setSubmitting(true);
    const { error, userId } = await signUp(email.trim(), password);

    if (error || !userId) {
      const mapped = mapAuthError(t, error);
      if (mapped.field === 'email') setEmailError(mapped.message);
      else if (mapped.field === 'password') setPasswordError(mapped.message);
      else setFormError(mapped.message);
      setSubmitting(false);
      return;
    }

    const restrictionIds = Array.isArray(answers.dietary_restrictions) ? answers.dietary_restrictions : [];
    const restrictions = restrictionIds
      .map((id) => getOptionLabel('dietary_restrictions', id))
      .filter((label): label is string => Boolean(label));

    const [codeParrainage, username] = await Promise.all([
      generateUniqueReferralCode(email.trim()),
      generateUniqueUsername(email.trim()),
    ]);

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      email: email.trim(),
      code_parrainage: codeParrainage,
      username,
      objectif: getOptionLabel('goal', asString(answers.goal)) ?? null,
      sexe: getOptionLabel('gender', asString(answers.gender)) ?? null,
      age: typeof answers.age === 'number' ? answers.age : null,
      taille: typeof answers.height === 'number' ? answers.height : null,
      poids_actuel: typeof answers.current_weight === 'number' ? answers.current_weight : null,
      poids_objectif: typeof answers.target_weight === 'number' ? answers.target_weight : null,
      vitesse: getOptionLabel('pace', asString(answers.pace)) ?? null,
      niveau_activite: getOptionLabel('activity_level', asString(answers.activity_level)) ?? null,
      frequence_entrainement: getOptionLabel('workouts_per_week', asString(answers.workouts_per_week)) ?? null,
      lieu_entrainement: getOptionLabel('training_location', asString(answers.training_location)) ?? null,
      alimentation: getOptionLabel('diet_quality', asString(answers.diet_quality)) ?? null,
      sommeil: getOptionLabel('sleep_hours', asString(answers.sleep_hours)) ?? null,
      blocage: getOptionLabel('blocker', asString(answers.blocker)) ?? null,
      restrictions,
      engagement: getOptionLabel('commitment_level', asString(answers.commitment_level)) ?? null,
    });

    if (profileError) {
      // The account itself was created successfully — a failed profile insert
      // shouldn't trap the user on this screen with no way to retry.
      console.warn('Profile insert failed:', profileError.message);
    }

    setSubmitting(false);
    // No explicit navigation here: app/_layout.tsx reacts to the new session (and its
    // subscription status) and routes to (onboarding)/paywall on its own.
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={[typography.title, { color: colors.textPrimary }]}>{t('onboarding.signup.title')}</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {t('onboarding.signup.subtitle')}
          </Text>
        </View>

        <View style={styles.middle}>
          <View style={styles.socialButtons}>
            <SocialButton
              label={t('onboarding.auth.continueWithApple')}
              // The "white" SocialButton variant's background is a fixed white
              // regardless of theme, so the Apple glyph must stay fixed dark too.
              icon={<Apple color="#0a0d0c" size={18} fill="#0a0d0c" />}
              variant="white"
              onPress={signInWithApple}
            />
            <SocialButton
              label={t('onboarding.auth.continueWithGoogle')}
              icon={<GoogleIcon size={18} />}
              variant="outline"
              onPress={signInWithGoogle}
            />
          </View>

          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>{t('onboarding.auth.or')}</Text>
            <View style={styles.separatorLine} />
          </View>

          <View style={styles.form}>
            <TextField
              label={t('onboarding.auth.emailLabel')}
              value={email}
              onChangeText={setEmail}
              error={emailError}
              placeholder={t('onboarding.auth.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
            />
            <TextField
              label={t('onboarding.auth.passwordLabel')}
              value={password}
              onChangeText={setPassword}
              error={passwordError}
              placeholder={t('onboarding.signup.passwordPlaceholder')}
              secureTextEntry
              autoCapitalize="none"
              textContentType="newPassword"
              autoComplete="password-new"
            />
            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label={t('onboarding.signup.submit')}
            variant="primary"
            disabled={isDisabled}
            loading={submitting}
            onPress={handleSubmit}
          />
          <Link href="/login" asChild>
            <Pressable style={styles.loginLink}>
              <Text style={styles.loginLinkText}>{t('onboarding.signup.haveAccount')}</Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
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
    flex: {
      flex: 1,
      justifyContent: 'space-between',
    },
    header: {
      marginTop: spacing.lg,
      gap: spacing.xs,
    },
    middle: {
      gap: spacing.lg,
    },
    socialButtons: {
      gap: spacing.sm,
    },
    separatorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    separatorLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    separatorText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    form: {
      gap: spacing.md,
    },
    formError: {
      fontSize: 13,
      color: colors.danger,
    },
    footer: {
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    loginLink: {
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    loginLinkText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.accent,
    },
  });
}
