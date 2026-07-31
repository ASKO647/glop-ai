import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppImage from '../../components/ui/AppImage';
import Button from '../../components/ui/Button';
import Logo from '../../components/ui/Logo';
import { colors, spacing, typography } from '../../constants/theme';

export default function WelcomeScreen() {
  return (
    <View style={styles.screen}>
      <AppImage
        source={require('../../assets/images/welcome-bg.jpg')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', colors.background, colors.background]}
        locations={[0, 0.34, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.content} edges={['top', 'bottom', 'left', 'right']}>
        <Logo variant="full" />

        <View style={styles.hero}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  hero: {
    gap: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
});
