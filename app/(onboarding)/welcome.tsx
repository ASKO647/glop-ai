import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppImage from '../../components/ui/AppImage';
import Button from '../../components/ui/Button';
import { appImage } from '../../constants/images';
import type { Colors } from '../../constants/theme';
import { spacing, typography } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <AppImage
        source={appImage('welcome-bg.jpg')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        darkPlaceholder
      />
      <LinearGradient
        colors={['rgba(10,13,12,0.25)', 'rgba(10,13,12,0.7)', colors.background]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.hero}>
        <Text style={styles.brand}>GlowUp AI</Text>
        <Text style={styles.title}>{t('onboarding.welcome.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.welcome.subtitle')}</Text>
      </View>

      <View style={styles.actions}>
        <Link href="/questionnaire" asChild>
          <Button label={t('onboarding.welcome.start')} variant="primary" />
        </Link>
        <Link href="/login" asChild>
          <Button label={t('onboarding.welcome.haveAccount')} variant="ghost" />
        </Link>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
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
    // Fixed brand lime, not `colors.accent`: this wordmark sits directly on the photo+scrim
    // hero like a logo, so (per the brand-logo rule) it stays constant across themes — the
    // light-mode accent is a dark green that would vanish against the dark photo scrim.
    brand: {
      color: '#c6ff3a',
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.2,
      marginBottom: spacing.md,
      textTransform: 'uppercase',
    },
    // Fixed light color, not `colors.textPrimary`: this title is drawn over the photo+scrim
    // hero, which is always dark regardless of theme, so the text must stay light regardless
    // of theme too (`colors.white` is a fixed '#ffffff' in both palettes).
    title: {
      ...typography.title,
      color: colors.white,
    },
    // Same reasoning as `title` above — over the photo scrim, so fixed light, not theme-reactive.
    subtitle: {
      ...typography.body,
      color: colors.white,
      opacity: 0.8,
    },
    actions: {
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
  });
}
