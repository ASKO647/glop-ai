import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';

type ReferralCodeModalProps = {
  visible: boolean;
  redeeming: boolean;
  onCancel: () => void;
  onSubmit: (code: string) => Promise<{ ok: boolean; error?: string }>;
};

export default function ReferralCodeModal({ visible, redeeming, onCancel, onSubmit }: ReferralCodeModalProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
      setError(result.error ?? t('profile.referral.invalidCode'));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel={t('common.close')} onPress={onCancel} />

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.sheet}>
            <Text style={styles.title}>{t('profile.sections.enterReferralCode')}</Text>

            <TextInput
              value={code}
              onChangeText={(value) => {
                setCode(value.toUpperCase());
                setError(null);
              }}
              placeholder={t('profile.referral.codePlaceholder')}
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              textAlign="center"
              style={styles.input}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.actions}>
              <Button label={t('common.cancel')} variant="secondary" onPress={onCancel} disabled={redeeming} style={styles.actionButton} />
              <Button
                label={t('profile.referral.submit')}
                onPress={handleSubmit}
                loading={redeeming}
                disabled={!code.trim()}
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
}
