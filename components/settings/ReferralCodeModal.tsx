import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';
import Button from '../ui/Button';

type ReferralCodeModalProps = {
  visible: boolean;
  redeeming: boolean;
  onCancel: () => void;
  onSubmit: (code: string) => Promise<{ ok: boolean; error?: string }>;
};

export default function ReferralCodeModal({ visible, redeeming, onCancel, onSubmit }: ReferralCodeModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setCode('');
      setError(null);
    }
  }, [visible]);

  const handleSubmit = async () => {
    const result = await onSubmit(code);
    if (!result.ok) {
      setError(result.error ?? 'Code invalide.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Fermer" onPress={onCancel} />

        <View style={styles.sheet}>
          <Text style={styles.title}>Saisir un code de parrainage</Text>

          <TextInput
            value={code}
            onChangeText={(value) => {
              setCode(value.toUpperCase());
              setError(null);
            }}
            placeholder="EX: LUCAS4K2"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            textAlign="center"
            style={styles.input}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <Button label="Annuler" variant="secondary" onPress={onCancel} disabled={redeeming} style={styles.actionButton} />
            <Button
              label="Valider"
              onPress={handleSubmit}
              loading={redeeming}
              disabled={!code.trim()}
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
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.textPrimary,
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
