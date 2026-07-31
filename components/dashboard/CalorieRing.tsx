import { StyleSheet, Text, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';
import { colors } from '../../constants/theme';
import { hexToRgba } from '../../lib/color';

const TRACK_COLOR = hexToRgba(colors.background, 0.2);

type CalorieRingProps = {
  percent: number; // 0-100
  size?: number;
  strokeWidth?: number;
};

export default function CalorieRing({ percent, size = 80, strokeWidth = 8 }: CalorieRingProps) {
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
          stroke={TRACK_COLOR}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.background}
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

const styles = StyleSheet.create({
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
    color: colors.background,
  },
});
