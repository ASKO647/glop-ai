import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type EmailChangeModalProps = {
  visible: boolean;
  currentEmail: string | null;
  // Lifted to the caller rather than kept as local state: `supabase.auth.updateUser()` fires a
  // `USER_UPDATED` auth event, which changes AuthContext's `user` object reference, which makes
  // ProfileContext reload and remounts this screen's whole content subtree (including this modal)
  // right after send — a local `sent` state would be wiped by that remount before it ever renders.
  sent: boolean;
  onSent: () => void;
  onCancel: () => void;
};

/** Explains that an email change needs confirmation, then calls `supabase.auth.updateUser({ email })` and shows a sent-confirmation state instead of just closing. */
export default function EmailChangeModal({ visible, currentEmail, sent, onSent, onCancel }: EmailChangeModalProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible) {
      setEmail('');
      setError(undefined);
      setSending(false);
    }
  }, [visible]);

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError(t('errors.auth.invalidEmail'));
      return;
    }
    setSending(true);
    const { error: updateError } = await supabase.auth.updateUser({ email: trimmed });
    setSending(false);
    if (updateError) {
      setError(t('profile.emailChange.sendFailed'));
      return;
    }
    onSent();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel={t('common.close')} onPress={onCancel} />

        <View style={styles.sheet}>
          <Text style={styles.title}>{t('profile.emailChange.title')}</Text>

          {sent ? (
            <>
              <Text style={styles.message}>{t('profile.emailChange.sentMessage')}</Text>
              <Button label={t('common.close')} onPress={onCancel} />
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>{t('profile.emailChange.subtitle')}</Text>
              <Text style={styles.currentEmail}>
                {t('profile.emailChange.currentEmail', { email: currentEmail ?? '-' })}
              </Text>

              <TextField
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError(undefined);
                }}
                error={error}
                placeholder={t('profile.emailChange.placeholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.actions}>
                <Button label={t('common.cancel')} variant="secondary" onPress={onCancel} disabled={sending} style={styles.actionButton} />
                <Button
                  label={t('profile.emailChange.sendLink')}
                  onPress={handleSend}
                  loading={sending}
                  style={styles.actionButton}
                />
              </View>
            </>
          )}
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
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    currentEmail: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    message: {
      fontSize: 14,
      color: colors.textPrimary,
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
