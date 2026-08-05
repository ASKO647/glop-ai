import { ArrowDown, ArrowUp, Plus } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { computeWeightTrend, formatSignedWeight, formatWeight, type WeightTrend } from '../../constants/progression';
import type { Colors } from '../../constants/theme';
import { radii } from '../../constants/theme';
import { useLocale, type Locale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';

type WeightCardProps = {
  currentWeight: number | null;
  previousWeight: number | null;
  startWeight: number | null;
  objectif: string | null;
  loading: boolean;
  onAddPress: () => void;
};

// The card's background is the accent color, so a literal "green" arrow would
// vanish against it. Good direction stays onAccent (like the rest of the
// card's text); only the "wrong direction" case gets a color of its own.
function TrendLine({
  colors,
  trend,
  suffix,
  locale,
}: {
  colors: Colors;
  trend: WeightTrend;
  suffix: string;
  locale: Locale;
}) {
  const Icon = trend.direction === 'up' ? ArrowUp : trend.direction === 'down' ? ArrowDown : null;
  const color = trend.isGood ? colors.onAccent : colors.warning;

  return (
    <View style={styles(colors).trendRow}>
      {Icon && <Icon color={color} size={13} strokeWidth={3} />}
      <Text style={[styles(colors).delta, { color }]}>
        {formatSignedWeight(trend.diff, locale)} {suffix}
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
  const { colors } = useTheme();
  const { t, locale } = useLocale();
  const cardStyles = useMemo(() => styles(colors), [colors]);
  const sinceLastTrend =
    !loading && currentWeight != null && previousWeight != null
      ? computeWeightTrend(currentWeight, previousWeight, objectif)
      : null;
  const sinceStartTrend =
    !loading && currentWeight != null && startWeight != null
      ? computeWeightTrend(currentWeight, startWeight, objectif)
      : null;

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.info}>
        <Text style={cardStyles.label}>{t('progression.weightCard.currentLabel')}</Text>

        {loading ? (
          <Text style={cardStyles.value}>—</Text>
        ) : currentWeight != null ? (
          <View style={cardStyles.valueRow}>
            <Text style={cardStyles.value}>{formatWeight(currentWeight, locale)}</Text>
            <Text style={cardStyles.unit}>kg</Text>
          </View>
        ) : (
          <Text style={cardStyles.value}>—</Text>
        )}

        {sinceLastTrend && (
          <TrendLine colors={colors} trend={sinceLastTrend} suffix={t('progression.weightCard.sinceLast')} locale={locale} />
        )}
        {sinceStartTrend && (
          <TrendLine colors={colors} trend={sinceStartTrend} suffix={t('progression.weightCard.sinceStart')} locale={locale} />
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('progression.weightCard.addAccessibility')}
        onPress={onAddPress}
        style={({ pressed }) => [cardStyles.addButton, pressed && cardStyles.pressed]}
      >
        <Plus color={colors.accent} size={22} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

function styles(colors: Colors) {
  return StyleSheet.create({
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
      color: colors.onAccent,
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
      color: colors.onAccent,
    },
    unit: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.onAccent,
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
}
