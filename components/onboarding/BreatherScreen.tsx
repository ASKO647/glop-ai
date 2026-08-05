import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { PrivacyIcon } from '../../constants/onboardingFlow';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { hexToRgba } from '../../lib/color';

const CIRCLE_SIZE = 180;
const ICON_DELAY_MS = 150;
const BREATHE_HALF_DURATION_MS = 1500;

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

  const circleScale = useRef(new Animated.Value(0.8)).current;
  const circleRotation = useRef(new Animated.Value(-8)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(circleScale, { toValue: 1, damping: 15, stiffness: 220, useNativeDriver: true }).start();
    Animated.spring(circleRotation, { toValue: 0, damping: 15, stiffness: 220, useNativeDriver: true }).start();
    Animated.timing(iconOpacity, { toValue: 1, duration: 200, delay: ICON_DELAY_MS, useNativeDriver: true }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1.03,
          duration: BREATHE_HALF_DURATION_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 1,
          duration: BREATHE_HALF_DURATION_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const startTimeout = setTimeout(() => loop.start(), ICON_DELAY_MS + 200);
    return () => {
      clearTimeout(startTimeout);
      loop.stop();
    };
  }, []);

  const circleStyle = {
    transform: [
      { scale: Animated.multiply(circleScale, breathe) },
      { rotate: circleRotation.interpolate({ inputRange: [-8, 0], outputRange: ['-8deg', '0deg'] }) },
    ],
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, circleStyle]}>
        <Animated.View style={{ opacity: iconOpacity }}>
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
