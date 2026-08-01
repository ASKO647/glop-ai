import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatWeight, formatWeightDelta } from '../../constants/progression';
import { colors, radii } from '../../constants/theme';

type WeightCardProps = {
  currentWeight: number | null;
  startWeight: number | null;
  loading: boolean;
  onAddPress: () => void;
};

export default function WeightCard({ currentWeight, startWeight, loading, onAddPress }: WeightCardProps) {
  const hasDelta = !loading && currentWeight != null && startWeight != null;

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.label}>POIDS ACTUEL</Text>

        {loading ? (
          <Text style={styles.value}>—</Text>
        ) : currentWeight != null ? (
          <View style={styles.valueRow}>
            <Text style={styles.value}>{formatWeight(currentWeight)}</Text>
            <Text style={styles.unit}>kg</Text>
          </View>
        ) : (
          <Text style={styles.value}>—</Text>
        )}

        {hasDelta && <Text style={styles.delta}>{formatWeightDelta(currentWeight!, startWeight!)}</Text>}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ajouter la pesée du jour"
        onPress={onAddPress}
        style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
      >
        <Plus color={colors.accent} size={22} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: colors.accent,
    borderRadius: radii.xl,
    padding: 20,
  },
  info: {
    flexShrink: 1,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.background,
    opacity: 0.6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  value: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
    color: colors.background,
  },
  unit: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
    marginBottom: 6,
  },
  delta: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.background,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
