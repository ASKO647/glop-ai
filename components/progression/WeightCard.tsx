import { ArrowDown, ArrowUp, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { computeWeightTrend, formatSignedWeight, formatWeight, type WeightTrend } from '../../constants/progression';
import { colors, radii } from '../../constants/theme';

type WeightCardProps = {
  currentWeight: number | null;
  previousWeight: number | null;
  startWeight: number | null;
  objectif: string | null;
  loading: boolean;
  onAddPress: () => void;
};

// The card's background is the lime accent, so a literal "green" arrow would
// vanish against it. Good direction stays on-brand black (like the rest of
// the card's text); only the "wrong direction" case gets a color of its own.
function TrendLine({ trend, suffix }: { trend: WeightTrend; suffix: string }) {
  const Icon = trend.direction === 'up' ? ArrowUp : trend.direction === 'down' ? ArrowDown : null;
  const color = trend.isGood ? colors.background : colors.warning;

  return (
    <View style={styles.trendRow}>
      {Icon && <Icon color={color} size={13} strokeWidth={3} />}
      <Text style={[styles.delta, { color }]}>
        {formatSignedWeight(trend.diff)} {suffix}
      </Text>
    </View>
  );
}

export default function WeightCard({
  currentWeight,
  previousWeight,
  startWeight,
  objectif,
  loading,
  onAddPress,
}: WeightCardProps) {
  const sinceLastTrend =
    !loading && currentWeight != null && previousWeight != null
      ? computeWeightTrend(currentWeight, previousWeight, objectif)
      : null;
  const sinceStartTrend =
    !loading && currentWeight != null && startWeight != null
      ? computeWeightTrend(currentWeight, startWeight, objectif)
      : null;

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

        {sinceLastTrend && <TrendLine trend={sinceLastTrend} suffix="depuis la dernière pesée" />}
        {sinceStartTrend && <TrendLine trend={sinceStartTrend} suffix="depuis le départ" />}
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
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  delta: {
    fontSize: 13,
    fontWeight: '600',
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
