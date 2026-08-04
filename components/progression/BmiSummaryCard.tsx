import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BMI_CATEGORIES,
  BMI_SEGMENT_WIDTHS_PERCENT,
  bmiCategoryColor,
  bmiToPercent,
  computeBmi,
  formatBmi,
  getBmiCategory,
} from '../../constants/bmi';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type BmiSummaryCardProps = {
  weightKg: number | null;
  heightCm: number | null;
};

/** Compact IMC readout for the Progression screen: value, status, mini classification bar. */
export default function BmiSummaryCard({ weightKg, heightCm }: BmiSummaryCardProps) {
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (weightKg == null || heightCm == null) {
    return (
      <View style={styles.card}>
        <Text style={styles.missingText}>Renseigne ta taille dans ton profil pour voir ton IMC.</Text>
      </View>
    );
  }

  const bmi = computeBmi(weightKg, heightCm);
  const category = getBmiCategory(bmi);
  const categoryColor = bmiCategoryColor(colors, resolvedScheme, category.id);
  const cursorPercent = bmiToPercent(bmi);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.value}>{formatBmi(bmi)}</Text>
        <Text style={[styles.status, { color: categoryColor }]}>{category.label}</Text>
      </View>

      <View style={styles.barWrap}>
        <View style={[styles.cursor, { left: `${cursorPercent}%` }]} />
        <View style={styles.bar}>
          {BMI_CATEGORIES.map((cat, index) => (
            <View
              key={cat.id}
              style={[
                styles.segment,
                {
                  width: `${BMI_SEGMENT_WIDTHS_PERCENT[index]}%`,
                  backgroundColor: bmiCategoryColor(colors, resolvedScheme, cat.id),
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.sm,
    },
    value: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.accent,
    },
    status: {
      fontSize: 13,
      fontWeight: '700',
    },
    barWrap: {
      paddingTop: 6,
    },
    bar: {
      flexDirection: 'row',
      height: 6,
      borderRadius: radii.full,
      overflow: 'hidden',
    },
    segment: {
      height: '100%',
    },
    cursor: {
      position: 'absolute',
      top: 0,
      marginLeft: -1,
      width: 2,
      height: 6,
      backgroundColor: '#ffffff',
    },
    missingText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
  });
}
