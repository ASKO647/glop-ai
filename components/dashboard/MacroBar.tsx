import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { hexToRgba } from '../../lib/color';

type MacroBarProps = {
  label: string;
  current: number;
  target: number;
};

// Always rendered on top of CalorieCard's accent-colored background — reads against `accent`,
// so it uses `onAccent` throughout, never `background`/`textPrimary` directly.
export default function MacroBar({ label, current, target }: MacroBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const progress = target > 0 ? Math.min(1, current / target) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>
        {current}g / {target}g
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      gap: 4,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.onAccent,
    },
    value: {
      fontSize: 11,
      color: colors.onAccent,
      opacity: 0.7,
    },
    track: {
      height: 4,
      borderRadius: radii.full,
      backgroundColor: hexToRgba(colors.onAccent, 0.2),
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: radii.full,
      backgroundColor: colors.onAccent,
    },
  });
}
