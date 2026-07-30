import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radii } from '../../constants/theme';

type ProgressBarProps = ViewProps & {
  /** Progress value between 0 and 1. */
  progress: number;
  height?: number;
};

export default function ProgressBar({ progress, height = 8, style, ...rest }: ProgressBarProps) {
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

const styles = StyleSheet.create({
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
