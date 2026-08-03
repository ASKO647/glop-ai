import { Link } from 'expo-router';
import { Apple } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GoogleIcon from '../../components/onboarding/GoogleIcon';
import SocialButton from '../../components/onboarding/SocialButton';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import type { Colors } from '../../constants/theme';
import { spacing, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { mapAuthError } from '../../lib/authErrors';

export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { signIn, signInWithApple, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const isDisabled = !email.trim() || !password;

  const handleSubmit = async () => {
    setEmailError(undefined);
    setPasswordError(undefined);
    setFormError(undefined);

    if (!email.trim()) {
      setEmailError("L'email est requis.");
      return;
    }
    if (!password) {
      setPasswordError('Le mot de passe est requis.');
      return;
    }

    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);

    if (error) {
      const mapped = mapAuthError(error);
      if (mapped.field === 'email') setEmailError(mapped.message);
      else if (mapped.field === 'password') setPasswordError(mapped.message);
      else setFormError(mapped.message);
      return;
    }

    // No explicit navigation here: app/_layout.tsx reacts to the new session (and its
    // subscription status) and routes to (tabs) or (onboarding)/paywall on its own.
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Content de te revoir</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Connecte-toi pour retrouver ton plan.
          </Text>
        </View>

        <View style={styles.middle}>
          <View style={styles.socialButtons}>
            <SocialButton
              label="Continuer avec Apple"
              // The "white" SocialButton variant is a fixed white surface regardless of theme
              // (see SocialButton.tsx), so this icon must stay a fixed dark color too —
              // colors.background would turn near-white in light mode and vanish on it.
              icon={<Apple color="#0a0d0c" size={18} fill="#0a0d0c" />}
              variant="white"
              onPress={signInWithApple}
            />
            <SocialButton
              label="Continuer avec Google"
              icon={<GoogleIcon size={18} />}
              variant="outline"
              onPress={signInWithGoogle}
            />
          </View>

          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.separatorLine} />
          </View>

          <View style={styles.form}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              error={emailError}
              placeholder="toi@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
            />
            <View>
              <TextField
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                error={passwordError}
                placeholder="Ton mot de passe"
                secureTextEntry
                autoCapitalize="none"
                textContentType="password"
                autoComplete="password"
              />
              <Link href="/forgot-password" asChild>
                <Pressable style={styles.forgotPasswordLink}>
                  <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
                </Pressable>
              </Link>
            </View>
            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label="Se connecter"
            variant="primary"
            disabled={isDisabled}
            loading={submitting}
            onPress={handleSubmit}
          />
          <Link href="/signup" asChild>
            <Pressable style={styles.signupLink}>
              <Text style={styles.signupLinkText}>Pas encore de compte ? Créer un compte</Text>
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
    title: {
      ...typography.title,
      color: colors.textPrimary,
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
    forgotPasswordLink: {
      alignSelf: 'flex-end',
      marginTop: spacing.xs,
      paddingVertical: spacing.xs,
    },
    forgotPasswordText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    formError: {
      fontSize: 13,
      color: colors.danger,
    },
    footer: {
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    signupLink: {
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    signupLinkText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.accent,
    },
  });
}
