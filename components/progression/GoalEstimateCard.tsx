import { Target } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { computeGoalEstimate, formatEstimateDate, type WeightLogLike } from '../../constants/progression';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type GoalEstimateCardProps = {
  logs: WeightLogLike[];
  targetWeight: number | null;
};

export default function GoalEstimateCard({ logs, targetWeight }: GoalEstimateCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const estimate = computeGoalEstimate(logs, targetWeight);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Target color={colors.accent} size={18} />
        <Text style={styles.title}>Objectif estimé</Text>
      </View>

      {estimate.status === 'not-enough-data' ? (
        <Text style={styles.message}>Pèse-toi plus régulièrement pour voir une estimation.</Text>
      ) : estimate.status === 'no-trend' ? (
        <Text style={styles.message}>Continue tes efforts pour voir une estimation.</Text>
      ) : (
        <>
          <Text style={styles.date}>{formatEstimateDate(estimate.date)}</Text>
          <Text style={styles.daysAway}>dans {estimate.daysAway} jours</Text>
        </>
      )}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 2,
    },
    title: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    date: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    daysAway: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    message: {
      fontSize: 13,
      color: colors.textSecondary,
    },
  });
}
