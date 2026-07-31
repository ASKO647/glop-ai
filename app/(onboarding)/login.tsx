import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import { colors, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { mapAuthError } from '../../lib/authErrors';

export default function LoginScreen() {
  const { signIn } = useAuth();

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
          <Text style={typography.title}>Content de te revoir</Text>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Connecte-toi pour retrouver ton plan.
          </Text>
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
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}
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

const styles = StyleSheet.create({
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
