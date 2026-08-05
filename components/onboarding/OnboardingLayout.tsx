import * as Haptics from 'expo-haptics';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  // Width can't run on the native driver (it's a layout property, not opacity/transform), but
  // this is a single 3px-tall bar animated only on step changes — cheap enough on the JS thread
  // that pulling it off-thread wouldn't be noticeable.
  const progressWidth = useRef(new Animated.Value(progress * 100)).current;
  const progressFlash = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(CASCADE_RISE_DISTANCE)).current;

  useEffect(() => {
    if (!title) return;
    titleOpacity.setValue(0);
    titleTranslateY.setValue(CASCADE_RISE_DISTANCE);
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: CASCADE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: CASCADE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: progress * 100,
      duration: PROGRESS_DURATION_MS,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
    Animated.sequence([
      Animated.timing(progressFlash, { toValue: 0.4, duration: 80, useNativeDriver: true }),
      Animated.timing(progressFlash, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  const wasDisabled = useRef(continueDisabled);
  useEffect(() => {
    if (wasDisabled.current && !continueDisabled) {
      Animated.sequence([
        Animated.timing(buttonScale, { toValue: 1.03, duration: 90, useNativeDriver: true }),
        Animated.spring(buttonScale, { toValue: 1, damping: 15, stiffness: 300, useNativeDriver: true }),
      ]).start();
    }
    wasDisabled.current = continueDisabled;
    // Color itself (background/text) can't run on the native driver, and interpolating it on the
    // JS thread would add cost for no visible benefit here, so it flips instantly with the prop
    // instead of animating — only the scale pulse above stays animated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continueDisabled]);

  const progressFillStyle = {
    width: progressWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
    opacity: progressFlash,
  };

  const buttonColors = continueDisabled
    ? { backgroundColor: colors.border, textColor: colors.textTertiary }
    : { backgroundColor: colors.accent, textColor: colors.onAccent };

  const titleStyle = {
    opacity: titleOpacity,
    transform: [{ translateY: titleTranslateY }],
  };

  const handleContinuePress = () => {
    if (continueDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: BUTTON_PRESS_SCALE, duration: 80, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, damping: 15, stiffness: 300, useNativeDriver: true }),
    ]).start();
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
        <Animated.View
          style={[styles.button, { backgroundColor: buttonColors.backgroundColor, transform: [{ scale: buttonScale }] }]}
        >
          <Text style={[styles.buttonLabel, { color: buttonColors.textColor }]}>{continueLabel}</Text>
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
