import { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BMI_CATEGORIES, bmiCategoryColor } from '../../constants/bmi';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';

type BmiInfoModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function BmiInfoModal({ visible, onClose }: BmiInfoModalProps) {
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Fermer" onPress={onClose} />

        <View style={styles.sheet}>
          <Text style={styles.title}>Indice de masse corporelle</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {BMI_CATEGORIES.map((category) => (
              <View key={category.id} style={styles.categoryRow}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: bmiCategoryColor(colors, resolvedScheme, category.id) },
                  ]}
                />
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryLabel}>{category.label}</Text>
                    <Text style={styles.categoryRange}>{category.rangeLabel}</Text>
                  </View>
                  <Text style={styles.categoryDetail}>{category.detail}</Text>
                </View>
              </View>
            ))}

            <Text style={styles.disclaimer}>
              L'IMC est un indicateur général : il ne tient compte ni de la masse musculaire, ni de
              la répartition des graisses, ni de la morphologie individuelle. Il ne remplace pas
              l'avis d'un professionnel de santé.
            </Text>
          </ScrollView>

          <Button label="Fermer" variant="secondary" onPress={onClose} />
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
      maxHeight: '80%',
      gap: spacing.md,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    list: {
      flexGrow: 0,
    },
    categoryRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: radii.full,
      marginTop: 5,
    },
    categoryInfo: {
      flex: 1,
      gap: 2,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    categoryLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    categoryRange: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    categoryDetail: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 17,
    },
    disclaimer: {
      fontSize: 12,
      color: colors.textTertiary,
      lineHeight: 17,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
    },
  });
}
