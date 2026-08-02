import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';
import type { Colors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { hexToRgba } from '../../lib/color';

type CalorieRingProps = {
  percent: number; // 0-100
  size?: number;
  strokeWidth?: number;
};

// Always rendered on top of CalorieCard's accent-colored background — every color here reads
// against `accent`, so it uses `onAccent`, never `background`/`textPrimary` directly.
export default function CalorieRing({ percent, size = 80, strokeWidth = 8 }: CalorieRingProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const trackColor = useMemo(() => hexToRgba(colors.onAccent, 0.2), [colors]);
  const clamped = Math.min(100, Math.max(0, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * clamped) / 100;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.onAccent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.labelContainer}>
        <Text style={styles.percent}>{Math.round(clamped)}%</Text>
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    labelContainer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    percent: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.onAccent,
    },
  });
}
