import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const COLOR_TRANSITION_MS = 200;
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
  const scale = useSharedValue(1);
  const colorProgress = useSharedValue(selected ? 1 : 0);
  const entranceOpacity = useSharedValue(0);
  const entranceTranslateY = useSharedValue(CASCADE_RISE_DISTANCE);

  useEffect(() => {
    const delay = (index + 1) * CASCADE_STAGGER_MS;
    entranceOpacity.value = withDelay(
      delay,
      withTiming(1, { duration: CASCADE_DURATION_MS, easing: Easing.out(Easing.cubic) })
    );
    entranceTranslateY.value = withDelay(
      delay,
      withTiming(0, { duration: CASCADE_DURATION_MS, easing: Easing.out(Easing.cubic) })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    colorProgress.value = withTiming(selected ? 1 : 0, { duration: COLOR_TRANSITION_MS });
    if (selected && pulseOnAutoAdvance) {
      scale.value = withDelay(
        PULSE_DELAY_MS,
        withSequence(
          withTiming(1.02, { duration: PULSE_DURATION_MS }),
          withTiming(1, { duration: PULSE_DURATION_MS })
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withTiming(0.97, { duration: PRESS_SCALE_DURATION_MS }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    onPress();
  };

  const cardStyle = useAnimatedStyle(() => ({
    opacity: entranceOpacity.value,
    transform: [{ scale: scale.value }, { translateY: entranceTranslateY.value }],
    backgroundColor: interpolateColor(colorProgress.value, [0, 1], [colors.surface, colors.accent]),
    borderColor: interpolateColor(colorProgress.value, [0, 1], [colors.border, colors.accent]),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(colorProgress.value, [0, 1], [colors.textPrimary, colors.onAccent]),
  }));

  const iconCircleStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(colorProgress.value, [0, 1], [colors.background, colors.onAccent]),
  }));

  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={handlePress}>
      <Animated.View style={[styles.card, cardStyle]}>
        {Icon && (
          <Animated.View style={[styles.iconCircle, iconCircleStyle]}>
            <Icon color={colors.accent} size={16} />
          </Animated.View>
        )}
        <Animated.Text style={[styles.label, textStyle, Icon && styles.labelWithIcon]}>{label}</Animated.Text>
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
