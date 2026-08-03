import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';
import type { Colors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type ScoreRingProps = {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
};

export default function ScoreRing({ score, size = 96, strokeWidth = 10 }: ScoreRingProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const clamped = Math.min(100, Math.max(0, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * clamped) / 100;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.border} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.accent}
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
        <Text style={styles.score}>{Math.round(clamped)}</Text>
        <Text style={styles.total}>/100</Text>
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
      alignItems: 'baseline',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 2,
    },
    score: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    total: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
}
