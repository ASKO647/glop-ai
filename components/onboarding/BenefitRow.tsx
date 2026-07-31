import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../../constants/theme';

type BenefitRowProps = {
  label: string;
};

export default function BenefitRow({ label }: BenefitRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.pastille}>
        <Check color={colors.background} size={10} strokeWidth={3} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pastille: {
    width: 16,
    height: 16,
    borderRadius: radii.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});
