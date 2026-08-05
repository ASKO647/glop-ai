import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';

type DeleteAccountModalProps = {
  visible: boolean;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteAccountModal({ visible, deleting, onCancel, onConfirm }: DeleteAccountModalProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [input, setInput] = useState('');
  const confirmWord = t('profile.deleteAccountModal.confirmWord');

  useEffect(() => {
    if (visible) setInput('');
  }, [visible]);

  const matches = input.trim().toUpperCase() === confirmWord;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel={t('common.close')} onPress={onCancel} />

        <View style={styles.sheet}>
          <Text style={styles.title}>{t('profile.deleteAccountModal.title')}</Text>
          <Text style={styles.description}>
            {t('profile.deleteAccountModal.description', { word: confirmWord })}
          </Text>

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={confirmWord}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            textAlign="center"
            style={styles.input}
          />

          <View style={styles.actions}>
            <Button label={t('common.cancel')} variant="secondary" onPress={onCancel} disabled={deleting} style={styles.actionButton} />
            <Button
              label={t('common.delete')}
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
}
