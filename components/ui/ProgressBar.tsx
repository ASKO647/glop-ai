import { useMemo } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type ProgressBarProps = ViewProps & {
  /** Progress value between 0 and 1. */
  progress: number;
  height?: number;
};

export default function ProgressBar({ progress, height = 8, style, ...rest }: ProgressBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.track, { height, borderRadius: radii.full }, style]} {...rest}>
      <View
        style={[
          styles.fill,
          { width: `${clamped * 100}%`, borderRadius: radii.full },
        ]}
      />
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    track: {
      width: '100%',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: colors.accent,
    },
  });
}
