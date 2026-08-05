import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { computeBmr, computeTdee } from '../../constants/energy';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type EnergyExpenditureCardProps = {
  poidsKg: number | null;
  tailleCm: number | null;
  age: number | null;
  sexe: string | null;
  niveauActivite: string | null;
  objectif: string | null;
  consumedToday: number;
};

export default function EnergyExpenditureCard({
  poidsKg,
  tailleCm,
  age,
  sexe,
  niveauActivite,
  objectif,
  consumedToday,
}: EnergyExpenditureCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (poidsKg == null || tailleCm == null || age == null) {
    return (
      <View style={styles.card}>
        <Text style={styles.missingText}>
          Complète ton poids, ta taille et ton âge dans ton profil pour estimer tes dépenses énergétiques.
        </Text>
      </View>
    );
  }

  const bmr = computeBmr(poidsKg, tailleCm, age, sexe);
  const tdee = computeTdee(bmr, niveauActivite);
  const balance = tdee - consumedToday; // positive = deficit, negative = surplus
  const isDeficit = balance >= 0;
  const weightLossGoal = objectif === 'Perte de poids';
  // Deficit reads as "good" (accent) when the goal is weight loss, surplus otherwise — and
  // vice versa (e.g. a surplus serves a muscle-gain goal, a deficit works against it).
  const balanceColor = isDeficit === weightLossGoal ? colors.accent : colors.warning;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.itemValue}>{Math.round(bmr)} kcal</Text>
          <Text style={styles.itemLabel}>Métabolisme de base</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.itemValue}>{Math.round(tdee)} kcal</Text>
          <Text style={styles.itemLabel}>Dépense totale estimée</Text>
        </View>
      </View>

      <View style={styles.balanceRow}>
        <Text style={styles.balanceLabel}>{isDeficit ? 'Déficit du jour' : 'Surplus du jour'}</Text>
        <Text style={[styles.balanceValue, { color: balanceColor }]}>{Math.round(Math.abs(balance))} kcal</Text>
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
      gap: spacing.md,
    },
    row: {
      flexDirection: 'row',
    },
    item: {
      flex: 1,
      gap: 2,
    },
    itemValue: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    itemLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.sm,
    },
    balanceLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    balanceValue: {
      fontSize: 16,
      fontWeight: '800',
    },
    missingText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
  });
}
