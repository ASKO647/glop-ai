import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
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
  const { t } = useLocale();
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
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel={t('common.close')} onPress={onCancel} />

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.sheet}>
            <Text style={styles.title} numberOfLines={1}>
              {meal?.name ?? t('dashboard.editMeal.fallbackTitle')}
            </Text>

            <TextField
              label={t('dashboard.meals.portionLabel')}
              value={portion}
              onChangeText={setPortion}
              placeholder={t('dashboard.meals.portionPlaceholder')}
            />
            <TextField
              label={t('dashboard.meals.caloriesLabel')}
              value={kcalText}
              onChangeText={setKcalText}
              keyboardType="number-pad"
              placeholder={t('dashboard.meals.kcalPlaceholder')}
            />

            <View style={styles.actions}>
              <Button
                label={t('common.cancel')}
                variant="secondary"
                onPress={onCancel}
                disabled={saving}
                style={styles.actionButton}
              />
              <Button
                label={t('common.save')}
                onPress={handleSave}
                loading={saving}
                disabled={!isValid}
                style={styles.actionButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'flex-end',
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
