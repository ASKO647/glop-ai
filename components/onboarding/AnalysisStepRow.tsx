import { Check } from 'lucide-react-native';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type AnalysisStepRowProps = {
  label: string;
  checked: boolean;
};

export default function AnalysisStepRow({ label, checked }: AnalysisStepRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const progress = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const wasChecked = useRef(checked);

  useEffect(() => {
    if (checked !== wasChecked.current) {
      wasChecked.current = checked;
      Animated.timing(progress, {
        toValue: checked ? 1 : 0,
        duration: 320,
        useNativeDriver: false,
      }).start();
    }
  }, [checked, progress]);

  const indicatorBackgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', colors.accent],
  });
  const indicatorBorderColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.borderMuted, colors.accent],
  });
  const textColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textTertiary, colors.stepTextDone],
  });

  return (
    <View style={styles.row}>
      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: indicatorBackgroundColor, borderColor: indicatorBorderColor },
        ]}
      >
        <Animated.View style={{ opacity: progress }}>
          <Check color={colors.onAccent} size={11} strokeWidth={3} />
        </Animated.View>
      </Animated.View>
      <Animated.Text style={[styles.label, { color: textColor }]}>{label}</Animated.Text>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    indicator: {
      width: 18,
      height: 18,
      borderRadius: radii.full,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
    },
  });
}
