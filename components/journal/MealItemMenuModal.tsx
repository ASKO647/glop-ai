import { ArrowRightLeft, Pencil, Trash2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type MealItemMenuModalProps = {
  visible: boolean;
  mealName: string | null;
  onCancel: () => void;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
};

/** Long-press action menu for a logged food row: edit quantity/calories, move to another meal, or delete. */
export default function MealItemMenuModal({
  visible,
  mealName,
  onCancel,
  onEdit,
  onMove,
  onDelete,
}: MealItemMenuModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Fermer" onPress={onCancel} />

        <View style={styles.sheet}>
          {mealName ? (
            <Text style={styles.title} numberOfLines={1}>
              {mealName}
            </Text>
          ) : null}

          <View style={styles.options}>
            <Pressable
              accessibilityRole="button"
              onPress={onEdit}
              style={({ pressed }) => [styles.option, pressed && styles.pressed]}
            >
              <Pencil color={colors.textPrimary} size={18} />
              <Text style={styles.optionLabel}>Modifier</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onMove}
              style={({ pressed }) => [styles.option, pressed && styles.pressed]}
            >
              <ArrowRightLeft color={colors.textPrimary} size={18} />
              <Text style={styles.optionLabel}>Déplacer vers</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onDelete}
              style={({ pressed }) => [styles.option, pressed && styles.pressed]}
            >
              <Trash2 color={colors.danger} size={18} />
              <Text style={[styles.optionLabel, styles.optionLabelDanger]}>Supprimer</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
          >
            <Text style={styles.cancelLabel}>Annuler</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii['2xl'],
      borderTopRightRadius: radii['2xl'],
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    options: {
      gap: spacing.xs,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    pressed: {
      opacity: 0.7,
    },
    optionLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    optionLabelDanger: {
      color: colors.danger,
    },
    cancel: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    cancelLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
    },
  });
}
