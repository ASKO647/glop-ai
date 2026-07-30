import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

type AnalysisStepRowProps = {
  label: string;
  checked: boolean;
};

export default function AnalysisStepRow({ label, checked }: AnalysisStepRowProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.indicator, checked && styles.indicatorChecked]}>
        {checked && <Check color={colors.background} size={14} strokeWidth={3} />}
      </View>
      <Text style={[styles.label, checked && styles.labelChecked]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  labelChecked: {
    color: colors.accent,
  },
});
