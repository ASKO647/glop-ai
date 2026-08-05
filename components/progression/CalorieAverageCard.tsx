import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type CalorieAverageCardProps = {
  average7: number;
  average30: number;
  target: number;
};

export default function CalorieAverageCard({ average7, average30, target }: CalorieAverageCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.column}>
        <Text style={styles.value}>{Math.round(average7)}</Text>
        <Text style={styles.label}>Moy. 7 jours</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.column}>
        <Text style={styles.value}>{Math.round(average30)}</Text>
        <Text style={styles.label}>Moy. 30 jours</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.column}>
        <Text style={styles.value}>{Math.round(target)}</Text>
        <Text style={styles.label}>Objectif</Text>
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
    },
    column: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    value: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.accent,
    },
    label: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    divider: {
      width: 1,
      height: 32,
      backgroundColor: colors.border,
    },
  });
}
