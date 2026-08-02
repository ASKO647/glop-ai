import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppImage from '../../components/ui/AppImage';
import Button from '../../components/ui/Button';
import { appImage } from '../../constants/images';
import { colors, spacing, typography } from '../../constants/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <AppImage
        source={appImage('welcome-bg.jpg')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(10,13,12,0.25)', 'rgba(10,13,12,0.7)', colors.background]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.hero}>
        <Text style={styles.brand}>GlowUp AI</Text>
        <Text style={typography.title}>Ta transformation, guidée par l'IA.</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          Coaching fitness personnalisé, suivi de progression et plan sur mesure.
        </Text>
      </View>

      <View style={styles.actions}>
        <Link href="/questionnaire" asChild>
          <Button label="Commencer" variant="primary" />
        </Link>
        <Link href="/login" asChild>
          <Button label="J'ai déjà un compte" variant="ghost" />
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  hero: {
    marginTop: spacing['2xl'],
    gap: spacing.sm,
  },
  brand: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
});
