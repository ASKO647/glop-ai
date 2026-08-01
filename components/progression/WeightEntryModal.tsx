import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';
import Button from '../ui/Button';

type WeightEntryModalProps = {
  visible: boolean;
  initialValue: number | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (poids: number) => void;
};

export default function WeightEntryModal({ visible, initialValue, saving, onCancel, onSave }: WeightEntryModalProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setText(initialValue != null ? String(initialValue).replace('.', ',') : '');
      setError(null);
    }
  }, [visible, initialValue]);

  const handleSave = () => {
    const parsed = parseFloat(text.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Entre un poids valide.');
      return;
    }
    onSave(Math.round(parsed * 10) / 10);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Fermer" onPress={onCancel} />

        <View style={styles.sheet}>
          <Text style={styles.title}>Ton poids aujourd'hui</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={(value) => {
                setText(value);
                setError(null);
              }}
              keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              autoFocus
              textAlign="center"
            />
            <Text style={styles.unit}>kg</Text>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <Button label="Annuler" variant="secondary" onPress={onCancel} disabled={saving} style={styles.actionButton} />
            <Button label="Enregistrer" onPress={handleSave} loading={saving} style={styles.actionButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  input: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.textPrimary,
    minWidth: 140,
    paddingVertical: spacing.sm,
  },
  unit: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
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
