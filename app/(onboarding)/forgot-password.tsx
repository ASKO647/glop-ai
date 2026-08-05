import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import type { Colors } from '../../constants/theme';
import { spacing, typography } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { mapAuthError } from '../../lib/authErrors';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const isDisabled = !email.trim();

  const handleSubmit = async () => {
    setEmailError(undefined);
    setFormError(undefined);

    if (!email.trim()) {
      setEmailError(t('onboarding.auth.emailRequired'));
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setSubmitting(false);

    if (error) {
      const mapped = mapAuthError(t, error.message);
      if (mapped.field === 'email') setEmailError(mapped.message);
      else setFormError(mapped.message);
      return;
    }

    setSent(true);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={[typography.title, { color: colors.textPrimary }]}>{t('onboarding.forgotPassword.title')}</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {t('onboarding.forgotPassword.subtitle')}
          </Text>
        </View>

        <View style={styles.form}>
          {sent ? (
            <Text style={styles.confirmation}>{t('onboarding.forgotPassword.confirmation')}</Text>
          ) : (
            <>
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
              {formError ? <Text style={styles.formError}>{formError}</Text> : null}
            </>
          )}
        </View>

        <View style={styles.footer}>
          {!sent && (
            <Button
              label={t('onboarding.forgotPassword.submit')}
              variant="primary"
              disabled={isDisabled}
              loading={submitting}
              onPress={handleSubmit}
            />
          )}
          <Link href="/login" asChild>
            <Pressable style={styles.backLink}>
              <Text style={styles.backLinkText}>{t('onboarding.forgotPassword.backToLogin')}</Text>
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
    form: {
      marginTop: spacing.xl,
      gap: spacing.md,
    },
    confirmation: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textPrimary,
    },
    formError: {
      fontSize: 13,
      color: colors.danger,
    },
    footer: {
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    backLink: {
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    backLinkText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.accent,
    },
  });
}
