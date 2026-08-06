import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import type { SkincareProduct } from '../../lib/skincare';

export default function ProductSuggestionCard({ product }: { product: SkincareProduct }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{product.nom}</Text>
      <Text style={styles.usage}>{product.usage}</Text>
      <Text style={styles.price}>{product.prix_indicatif}</Text>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.sm,
      gap: 2,
    },
    name: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    usage: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    price: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.accent,
    },
  });
}
