import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import type { Meal } from '../../hooks/useMeals';
import Button from '../ui/Button';
import TextField from '../ui/TextField';

type EditMealModalProps = {
  visible: boolean;
  meal: Meal | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (patch: { portion: string; kcal: number }) => void;
};

/** Editing a logged food is scoped to quantity/calories — everything else (name, macros) stays as scanned/entered. */
export default function EditMealModal({ visible, meal, saving, onCancel, onSave }: EditMealModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [portion, setPortion] = useState('');
  const [kcalText, setKcalText] = useState('');

  useEffect(() => {
    if (visible && meal) {
      setPortion(meal.portion ?? '');
      setKcalText(String(meal.kcal));
    }
  }, [visible, meal]);

  const kcal = parseInt(kcalText, 10);
  const isValid = kcalText.trim().length > 0 && Number.isFinite(kcal) && kcal >= 0;

  const handleSave = () => {
    if (!isValid) return;
    onSave({ portion: portion.trim(), kcal });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Fermer" onPress={onCancel} />

        <View style={styles.sheet}>
          <Text style={styles.title} numberOfLines={1}>
            {meal?.name ?? 'Modifier'}
          </Text>

          <TextField label="Portion" value={portion} onChangeText={setPortion} placeholder="ex : 150 g, 1 bol..." />
          <TextField
            label="Calories"
            value={kcalText}
            onChangeText={setKcalText}
            keyboardType="number-pad"
            placeholder="kcal"
          />

          <View style={styles.actions}>
            <Button label="Annuler" variant="secondary" onPress={onCancel} disabled={saving} style={styles.actionButton} />
            <Button
              label="Enregistrer"
              onPress={handleSave}
              loading={saving}
              disabled={!isValid}
              style={styles.actionButton}
            />
          </View>
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
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    actionButton: {
      flex: 1,
    },
  });
}
