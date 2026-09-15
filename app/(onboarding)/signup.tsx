import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GoogleIcon from '../../components/onboarding/GoogleIcon';
import SocialButton from '../../components/onboarding/SocialButton';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import { ONBOARDING_MAX_WIDTH } from '../../constants/onboardingLayout';
import type { Colors } from '../../constants/theme';
import { spacing, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { mapAuthError } from '../../lib/authErrors';
import { buildOnboardingProfilePayload } from '../../lib/onboardingProfile';
import { generateUniqueReferralCode } from '../../lib/referral';
import { supabase } from '../../lib/supabase';
import { generateUniqueUsername } from '../../lib/username';

const MIN_PASSWORD_LENGTH = 6;

export default function SignupScreen() {
  const { signUp, signInWithGoogle } = useAuth();
  const { answers } = useOnboarding();
  const { colors } = useTheme();
  const { t } = useLocale();
  const { isDesktop } = useBreakpoint();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

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

    const [codeParrainage, username] = await Promise.all([
      generateUniqueReferralCode(email.trim()),
      generateUniqueUsername(email.trim()),
    ]);

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      email: email.trim(),
      code_parrainage: codeParrainage,
      username,
      ...buildOnboardingProfilePayload(answers),
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

  const handleGoogle = async () => {
    setFormError(undefined);
    setGoogleSubmitting(true);
    const { error } = await signInWithGoogle();
    setGoogleSubmitting(false);
    if (error) setFormError(mapAuthError(t, error).message);
    // No error, on web: the page is already navigating away to Google.
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={[styles.flex, isDesktop && styles.desktopBody]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={[typography.title, { color: colors.textPrimary }]}>{t('onboarding.signup.title')}</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {t('onboarding.signup.subtitle')}
          </Text>
        </View>

        <View style={styles.middle}>
          <SocialButton
            label={t('onboarding.auth.continueWithGoogle')}
            icon={<GoogleIcon size={18} />}
            onPress={handleGoogle}
            loading={googleSubmitting}
          />

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
    desktopBody: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: ONBOARDING_MAX_WIDTH,
    },
    header: {
      marginTop: spacing.lg,
      gap: spacing.xs,
    },
    middle: {
      gap: spacing.lg,
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
