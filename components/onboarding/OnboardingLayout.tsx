import * as Haptics from 'expo-haptics';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const PROGRESS_DURATION_MS = 400;
const BUTTON_COLOR_DURATION_MS = 250;
const BUTTON_PRESS_SCALE = 0.96;
const CASCADE_DURATION_MS = 300;
const CASCADE_RISE_DISTANCE = 16;

type OnboardingLayoutProps = {
  progress: number;
  /** Omitted for steps that render their own dedicated title inside `children` (breather/result/final). */
  title?: string;
  subtitle?: string;
  onBack: () => void;
  onContinue: () => void;
  continueDisabled: boolean;
  continueLabel: string;
  backAccessibilityLabel: string;
  children: ReactNode;
};

export default function OnboardingLayout({
  progress,
  title,
  subtitle,
  onBack,
  onContinue,
  continueDisabled,
  continueLabel,
  backAccessibilityLabel,
  children,
}: OnboardingLayoutProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const progressWidth = useSharedValue(progress * 100);
  const progressFlash = useSharedValue(1);
  const buttonActive = useSharedValue(continueDisabled ? 0 : 1);
  const buttonScale = useSharedValue(1);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(CASCADE_RISE_DISTANCE);

  useEffect(() => {
    if (!title) return;
    titleOpacity.value = 0;
    titleTranslateY.value = CASCADE_RISE_DISTANCE;
    titleOpacity.value = withTiming(1, { duration: CASCADE_DURATION_MS, easing: Easing.out(Easing.cubic) });
    titleTranslateY.value = withTiming(0, { duration: CASCADE_DURATION_MS, easing: Easing.out(Easing.cubic) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  useEffect(() => {
    progressWidth.value = withTiming(progress * 100, { duration: PROGRESS_DURATION_MS, easing: Easing.out(Easing.exp) });
    progressFlash.value = withSequence(withTiming(0.4, { duration: 80 }), withTiming(1, { duration: 220 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  const wasDisabled = useRef(continueDisabled);
  useEffect(() => {
    buttonActive.value = withTiming(continueDisabled ? 0 : 1, { duration: BUTTON_COLOR_DURATION_MS });
    if (wasDisabled.current && !continueDisabled) {
      buttonScale.value = withSequence(
        withTiming(1.03, { duration: 90 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
    }
    wasDisabled.current = continueDisabled;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continueDisabled]);

  const progressFillStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
    opacity: progressFlash.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(buttonActive.value, [0, 1], [colors.border, colors.accent]),
    transform: [{ scale: buttonScale.value }],
  }));

  const buttonTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(buttonActive.value, [0, 1], [colors.textTertiary, colors.onAccent]),
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const handleContinuePress = () => {
    if (continueDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    buttonScale.value = withSequence(
      withTiming(BUTTON_PRESS_SCALE, { duration: 80 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    onContinue();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backAccessibilityLabel}
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ArrowLeft color={colors.textPrimary} size={20} />
        </Pressable>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressFillStyle]} />
        </View>
      </View>

      {title ? <Animated.Text style={[styles.title, titleStyle]}>{title}</Animated.Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.content}>{children}</View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: continueDisabled }}
        disabled={continueDisabled}
        onPress={handleContinuePress}
        style={styles.buttonWrap}
      >
        <Animated.View style={[styles.button, buttonStyle]}>
          <Animated.Text style={[styles.buttonLabel, buttonTextStyle]}>{continueLabel}</Animated.Text>
        </Animated.View>
      </Pressable>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: spacing.sm,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.7,
    },
    progressTrack: {
      flex: 1,
      height: 3,
      borderRadius: radii.full,
      backgroundColor: colors.border,
      marginLeft: spacing.md,
      overflow: 'hidden',
    },
    progressFill: {
      height: 3,
      borderRadius: radii.full,
      backgroundColor: colors.accent,
    },
    title: {
      marginTop: spacing.lg,
      fontSize: 30,
      fontWeight: '800',
      lineHeight: 30 * 1.15,
      color: colors.textPrimary,
      textAlign: 'left',
    },
    subtitle: {
      marginTop: spacing.sm,
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'left',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    buttonWrap: {
      marginBottom: spacing.lg,
    },
    button: {
      height: 56,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonLabel: {
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
