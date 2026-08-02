import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type RadioDotProps = {
  selected: boolean;
};

export default function RadioDot({ selected }: RadioDotProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.outer, selected && styles.outerSelected]}>
      {selected && <View style={styles.inner} />}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
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
      backgroundColor: colors.onAccent,
    },
  });
}
