import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../../constants/theme';
import { hexToRgba } from '../../lib/color';

const TRACK_COLOR = hexToRgba(colors.background, 0.2);

type MacroBarProps = {
  label: string;
  current: number;
  target: number;
};

export default function MacroBar({ label, current, target }: MacroBarProps) {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.background,
  },
  value: {
    fontSize: 11,
    color: colors.background,
    opacity: 0.7,
  },
  track: {
    height: 4,
    borderRadius: radii.full,
    backgroundColor: TRACK_COLOR,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.full,
    backgroundColor: colors.background,
  },
});
