import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';
import Button from '../ui/Button';

const CONFIRM_WORD = 'SUPPRIMER';

type DeleteAccountModalProps = {
  visible: boolean;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteAccountModal({ visible, deleting, onCancel, onConfirm }: DeleteAccountModalProps) {
  const [input, setInput] = useState('');

  useEffect(() => {
    if (visible) setInput('');
  }, [visible]);

  const matches = input.trim().toUpperCase() === CONFIRM_WORD;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Fermer" onPress={onCancel} />

        <View style={styles.sheet}>
          <Text style={styles.title}>Supprimer définitivement ton compte</Text>
          <Text style={styles.description}>
            Toutes tes données (repas, pesées, photos, historique du coach) seront effacées et cette action est
            irréversible. Tape "{CONFIRM_WORD}" pour confirmer.
          </Text>

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={CONFIRM_WORD}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            textAlign="center"
            style={styles.input}
          />

          <View style={styles.actions}>
            <Button label="Annuler" variant="secondary" onPress={onCancel} disabled={deleting} style={styles.actionButton} />
            <Button
              label="Supprimer"
              variant="danger"
              onPress={onConfirm}
              loading={deleting}
              disabled={!matches}
              style={styles.actionButton}
            />
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
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
