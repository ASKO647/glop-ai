import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { PrivacyIcon } from '../../constants/onboardingFlow';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { hexToRgba } from '../../lib/color';

const CIRCLE_SIZE = 180;
const ICON_DELAY_MS = 150;
const BREATHE_DURATION_MS = 3000;

type BreatherScreenProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  privacyTitle?: string;
  privacyText?: string;
};

export default function BreatherScreen({ title, subtitle, icon: Icon, privacyTitle, privacyText }: BreatherScreenProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const circleScale = useSharedValue(0.8);
  const circleRotation = useSharedValue(-8);
  const iconOpacity = useSharedValue(0);
  const breathe = useSharedValue(1);

  useEffect(() => {
    circleScale.value = withSpring(1, { damping: 15, stiffness: 220 });
    circleRotation.value = withSpring(0, { damping: 15, stiffness: 220 });
    iconOpacity.value = withDelay(ICON_DELAY_MS, withTiming(1, { duration: 200 }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    breathe.value = withDelay(
      ICON_DELAY_MS + 200,
      withRepeat(
        withSequence(
          withTiming(1.03, { duration: BREATHE_DURATION_MS / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: BREATHE_DURATION_MS / 2, easing: Easing.inOut(Easing.sin) })
        ),
        -1
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value * breathe.value }, { rotate: `${circleRotation.value}deg` }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, circleStyle]}>
        <Animated.View style={iconStyle}>
          <Icon color={colors.accent} size={64} />
        </Animated.View>
      </Animated.View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {privacyTitle && privacyText ? (
        <View style={styles.privacyCard}>
          <PrivacyIcon color={colors.accent} size={18} />
          <View style={styles.privacyText}>
            <Text style={styles.privacyTitle}>{privacyTitle}</Text>
            <Text style={styles.privacyBody}>{privacyText}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    circle: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      borderWidth: 2,
      borderColor: hexToRgba(colors.accent, 0.3),
      backgroundColor: hexToRgba(colors.accent, 0.04),
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      marginTop: spacing.xl,
      fontSize: 28,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: spacing.sm,
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: spacing.md,
    },
    privacyCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginTop: spacing.xl,
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      padding: spacing.md,
      width: '100%',
    },
    privacyText: {
      flex: 1,
      gap: 2,
    },
    privacyTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    privacyBody: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
}
