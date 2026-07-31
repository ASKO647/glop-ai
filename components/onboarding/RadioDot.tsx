import { StyleSheet, View } from 'react-native';
import { colors, radii } from '../../constants/theme';

type RadioDotProps = {
  selected: boolean;
};

export default function RadioDot({ selected }: RadioDotProps) {
  return (
    <View style={[styles.outer, selected && styles.outerSelected]}>
      {selected && <View style={styles.inner} />}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.borderMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  inner: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.background,
  },
});
