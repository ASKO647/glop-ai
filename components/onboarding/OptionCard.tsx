import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const PRESS_SCALE_DURATION_MS = 80;
// The whole pulse (delay + up + down) lands inside the 250ms auto-advance window.
const PULSE_DELAY_MS = 150;
const PULSE_DURATION_MS = 50;
// Cascade entrance — the title occupies slot 0, so the first option starts one stagger step in.
const CASCADE_STAGGER_MS = 60;
const CASCADE_DURATION_MS = 300;
const CASCADE_RISE_DISTANCE = 16;

type OptionCardProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: LucideIcon;
  /** Plays a brief "about to move on" pulse when this card becomes selected — single-choice screens only. */
  pulseOnAutoAdvance?: boolean;
  /** Position within the option list — drives the cascade entrance stagger delay. */
  index?: number;
};

export default function OptionCard({ label, selected, onPress, icon: Icon, pulseOnAutoAdvance, index = 0 }: OptionCardProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const scale = useRef(new Animated.Value(1)).current;
  const entranceOpacity = useRef(new Animated.Value(0)).current;
  const entranceTranslateY = useRef(new Animated.Value(CASCADE_RISE_DISTANCE)).current;

  useEffect(() => {
    const delay = (index + 1) * CASCADE_STAGGER_MS;
    Animated.parallel([
      Animated.timing(entranceOpacity, {
        toValue: 1,
        duration: CASCADE_DURATION_MS,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(entranceTranslateY, {
        toValue: 0,
        duration: CASCADE_DURATION_MS,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Background/border/text color flip with the `selected` prop rather than animating —
    // color transitions can't run on the native driver, and interpolating them on the JS
    // thread would add cost for no visible benefit on a card that's already snapping in a
    // scale pulse at the same moment.
    if (selected && pulseOnAutoAdvance) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.02, duration: PULSE_DURATION_MS, delay: PULSE_DELAY_MS, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: PULSE_DURATION_MS, useNativeDriver: true }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: PRESS_SCALE_DURATION_MS, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 15, stiffness: 300, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const cardColors = selected
    ? { backgroundColor: colors.accent, borderColor: colors.accent }
    : { backgroundColor: colors.surface, borderColor: colors.border };
  const textColor = selected ? colors.onAccent : colors.textPrimary;
  const iconCircleColor = selected ? colors.onAccent : colors.background;

  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={handlePress}>
      <Animated.View
        style={[
          styles.card,
          cardColors,
          { opacity: entranceOpacity, transform: [{ scale }, { translateY: entranceTranslateY }] },
        ]}
      >
        {Icon && (
          <View style={[styles.iconCircle, { backgroundColor: iconCircleColor }]}>
            <Icon color={colors.accent} size={16} />
          </View>
        )}
        <Text style={[styles.label, { color: textColor }, Icon && styles.labelWithIcon]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 60,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
    },
    iconCircle: {
      position: 'absolute',
      left: spacing.md,
      width: 32,
      height: 32,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      textAlign: 'center',
    },
    labelWithIcon: {
      fontWeight: '600',
    },
  });
}
