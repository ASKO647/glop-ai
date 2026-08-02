import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import RadioDot from './RadioDot';

type PlanCardProps = {
  badge?: string;
  name: string;
  price: string;
  originalPrice: string;
  trialLabel: string;
  subline: string;
  selected: boolean;
  onPress: () => void;
};

export default function PlanCard({
  badge,
  name,
  price,
  originalPrice,
  trialLabel,
  subline,
  selected,
  onPress,
}: PlanCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.card, selected ? styles.cardSelected : styles.cardUnselected]}
    >
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}

      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[styles.name, selected && styles.nameSelected]}>{name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{price}</Text>
            <Text style={styles.originalPrice}>{originalPrice}</Text>
          </View>
          <View style={styles.trialPill}>
            <Text style={styles.trialText}>{trialLabel}</Text>
          </View>
          <Text style={styles.subline}>{subline}</Text>
        </View>
        <RadioDot selected={selected} />
      </View>
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      borderRadius: radii.lg,
      borderWidth: 1.5,
      padding: spacing.md,
      paddingTop: spacing.md + 4,
    },
    cardSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSurface,
    },
    cardUnselected: {
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    badge: {
      position: 'absolute',
      top: -10,
      left: 12,
      backgroundColor: colors.accent,
      borderRadius: radii.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.4,
      color: colors.onAccent,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    info: {
      flex: 1,
      gap: 6,
    },
    name: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    nameSelected: {
      color: colors.accent,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    price: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    originalPrice: {
      fontSize: 13,
      color: colors.textTertiary,
      textDecorationLine: 'line-through',
    },
    trialPill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accentMuted,
      borderRadius: radii.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    trialText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.accent,
    },
    subline: {
      fontSize: 11,
      color: colors.labelMuted,
    },
  });
}
