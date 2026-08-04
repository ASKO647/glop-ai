import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getMealTypeInfo, type MealType } from '../../constants/dashboard';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';
import TextField from '../ui/TextField';

type AddFoodInput = {
  name: string;
  portion: string;
  kcal: number;
  proteines: number;
  glucides: number;
  lipides: number;
};

type AddFoodModalProps = {
  visible: boolean;
  mealType: MealType | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (input: AddFoodInput) => void;
};

function toInt(text: string): number {
  const value = parseInt(text, 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

/** Manual food entry, scoped to whichever meal's "+ Ajouter un aliment" row opened it. Macros are optional. */
export default function AddFoodModal({ visible, mealType, saving, onCancel, onSave }: AddFoodModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [portion, setPortion] = useState('');
  const [kcalText, setKcalText] = useState('');
  const [proteinesText, setProteinesText] = useState('');
  const [glucidesText, setGlucidesText] = useState('');
  const [lipidesText, setLipidesText] = useState('');

  useEffect(() => {
    if (visible) {
      setName('');
      setPortion('');
      setKcalText('');
      setProteinesText('');
      setGlucidesText('');
      setLipidesText('');
    }
  }, [visible]);

  const kcal = parseInt(kcalText, 10);
  const isValid = name.trim().length > 0 && portion.trim().length > 0 && Number.isFinite(kcal) && kcal >= 0;

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      name: name.trim(),
      portion: portion.trim(),
      kcal,
      proteines: toInt(proteinesText),
      glucides: toInt(glucidesText),
      lipides: toInt(lipidesText),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Fermer" onPress={onCancel} />

        <View style={styles.sheet}>
          <Text style={styles.title}>
            {mealType ? `Ajouter à ${getMealTypeInfo(mealType).label.toLowerCase()}` : 'Ajouter un aliment'}
          </Text>

          <ScrollView style={styles.form} contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
            <TextField label="Nom" value={name} onChangeText={setName} placeholder="ex : Poulet grillé" />
            <TextField label="Portion" value={portion} onChangeText={setPortion} placeholder="ex : 150 g, 1 bol..." />
            <TextField
              label="Calories"
              value={kcalText}
              onChangeText={setKcalText}
              keyboardType="number-pad"
              placeholder="kcal"
            />

            <Text style={styles.macrosLabel}>Macros (facultatif)</Text>
            <View style={styles.macrosRow}>
              <TextField
                label="Protéines"
                value={proteinesText}
                onChangeText={setProteinesText}
                keyboardType="number-pad"
                placeholder="g"
                style={styles.macroInput}
                containerStyle={styles.macroField}
              />
              <TextField
                label="Glucides"
                value={glucidesText}
                onChangeText={setGlucidesText}
                keyboardType="number-pad"
                placeholder="g"
                style={styles.macroInput}
                containerStyle={styles.macroField}
              />
              <TextField
                label="Lipides"
                value={lipidesText}
                onChangeText={setLipidesText}
                keyboardType="number-pad"
                placeholder="g"
                style={styles.macroInput}
                containerStyle={styles.macroField}
              />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Button label="Annuler" variant="secondary" onPress={onCancel} disabled={saving} style={styles.actionButton} />
            <Button
              label="Ajouter"
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
      maxHeight: '85%',
      gap: spacing.md,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    form: {
      flexGrow: 0,
    },
    formContent: {
      gap: spacing.md,
      paddingBottom: spacing.xs,
    },
    macrosLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      marginTop: -spacing.xs,
    },
    macrosRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    macroField: {
      flex: 1,
    },
    macroInput: {
      textAlign: 'center',
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
  });
}
