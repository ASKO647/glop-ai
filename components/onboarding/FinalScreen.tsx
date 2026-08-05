import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { hexToRgba } from '../../lib/color';

const CASCADE_STAGGER_MS = 60;
const CASCADE_DURATION_MS = 300;
const RISE_DISTANCE = 16;
const CIRCLE_SIZE = 120;

type FinalScreenProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

function useCascadeStyle(delay: number) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(RISE_DISTANCE)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: CASCADE_DURATION_MS,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: CASCADE_DURATION_MS,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { opacity, transform: [{ translateY }] };
}

export default function FinalScreen({ title, subtitle, icon: Icon }: FinalScreenProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const circleStyle = useCascadeStyle(0);
  const titleStyle = useCascadeStyle(CASCADE_STAGGER_MS);
  const subtitleStyle = useCascadeStyle(CASCADE_STAGGER_MS * 2);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, circleStyle]}>
        <Icon color={colors.accent} size={48} />
      </Animated.View>
      <Animated.Text style={[styles.title, titleStyle]}>{title}</Animated.Text>
      <Animated.Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Animated.Text>
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
      backgroundColor: hexToRgba(colors.accent, 0.1),
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
    },
  });
}
