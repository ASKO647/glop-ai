import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextInputProps,
} from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import Button from './Button';
import TextField from './TextField';

type TextInputModalProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  initialValue: string;
  placeholder?: string;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  /** Applied to every keystroke before validation/display — e.g. forcing a username to lowercase as it's typed. */
  transform?: (value: string) => string;
  /** Sync format check, run before `onSave`. Return an error message when invalid. */
  validate?: (value: string) => string | undefined;
  onCancel: () => void;
  /** Return an error message to keep the modal open and show it under the field (e.g. a uniqueness conflict) — return nothing on success, which closes the modal. */
  onSave: (value: string) => Promise<string | undefined | void> | string | undefined | void;
};

/** Generic single-field text editor: title, optional subtitle, field, Annuler/Enregistrer. */
export default function TextInputModal({
  visible,
  title,
  subtitle,
  initialValue,
  placeholder,
  autoCapitalize,
  transform,
  validate,
  onCancel,
  onSave,
}: TextInputModalProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      setError(undefined);
      setSubmitting(false);
    }
  }, [visible, initialValue]);

  const handleChangeText = (text: string) => {
    setValue(transform ? transform(text) : text);
    if (error) setError(undefined);
  };

  const handleCancel = () => {
    if (submitting) return;
    onCancel();
  };

  const handleSave = async () => {
    const validationError = validate?.(value);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    const result = await onSave(value);
    setSubmitting(false);
    if (result) {
      setError(result);
      return;
    }
    // No error back from onSave = the write already succeeded — close, same as Annuler.
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel={t('common.close')} onPress={handleCancel} />

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.sheet}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

            <TextField
              value={value}
              onChangeText={handleChangeText}
              error={error}
              placeholder={placeholder}
              autoCapitalize={autoCapitalize}
              autoCorrect={false}
              autoFocus
            />

            <View style={styles.actions}>
              <Button label={t('common.cancel')} variant="secondary" onPress={handleCancel} disabled={submitting} style={styles.actionButton} />
              <Button label={t('common.save')} onPress={handleSave} loading={submitting} style={styles.actionButton} />
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
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: -spacing.xs,
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
