import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppImage from '../../components/ui/AppImage';
import { appImage } from '../../constants/images';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';

export default function WelcomeScreen() {
  const router = useRouter();
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
        colors={['rgba(10,13,12,0.25)', 'rgba(10,13,12,0.75)', colors.background]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.hero}>
        <Text style={styles.brand}>GlowUp AI</Text>
        <Text style={styles.title}>{t('onboarding.welcome.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.welcome.subtitle')}</Text>
      </View>

      <View style={styles.spacer} />

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/q/0')}
          style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
        >
          <Text style={styles.startButtonLabel}>{t('onboarding.welcome.start')}</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.push('/login')} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>{t('onboarding.welcome.haveAccount')}</Text>
        </Pressable>
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
      fontSize: 34,
      fontWeight: '800',
      lineHeight: 34 * 1.15,
      color: colors.white,
    },
    // Same reasoning as `title` above — over the photo scrim, so fixed light, not theme-reactive.
    subtitle: {
      marginTop: spacing.xs,
      fontSize: 15,
      color: colors.white,
      opacity: 0.8,
    },
    // Generous empty middle — the photo + gradient carry the screen, the content sits at the
    // very top and very bottom.
    spacer: {
      flex: 1,
    },
    actions: {
      gap: spacing.md,
      marginBottom: spacing.lg,
      alignItems: 'center',
    },
    startButton: {
      alignSelf: 'stretch',
      height: 56,
      borderRadius: radii.full,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.85,
    },
    startButtonLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.onAccent,
    },
    loginLink: {
      paddingVertical: spacing.xs,
    },
    loginLinkText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accent,
    },
  });
}
