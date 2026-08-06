import { ArrowUp, Paperclip, X } from 'lucide-react-native';
import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';

type ChatInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
  pendingImageUri?: string | null;
  onPickImage: () => void;
  onRemoveImage: () => void;
};

export default function ChatInput({
  value,
  onChangeText,
  onSend,
  disabled,
  pendingImageUri,
  onPickImage,
  onRemoveImage,
}: ChatInputProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const canSend = (value.trim().length > 0 || !!pendingImageUri) && !disabled;

  return (
    <View style={styles.container}>
      {pendingImageUri && (
        <View style={styles.previewRow}>
          <Image source={{ uri: pendingImageUri }} style={styles.previewImage} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('coach.removeImageAccessibility')}
            onPress={onRemoveImage}
            hitSlop={8}
            style={styles.previewRemove}
          >
            <X color={colors.onAccent} size={12} />
          </Pressable>
        </View>
      )}
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('coach.attachImageAccessibility')}
          onPress={onPickImage}
          disabled={disabled}
          style={({ pressed }) => [styles.attachButton, disabled && styles.attachButtonDisabled, pressed && !disabled && styles.pressed]}
        >
          <Paperclip color={colors.textSecondary} size={18} />
        </Pressable>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={t('coach.inputPlaceholder')}
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          multiline
          editable={!disabled}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('coach.send')}
          onPress={onSend}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.sendButton,
            !canSend && styles.sendButtonDisabled,
            pressed && canSend && styles.pressed,
          ]}
        >
          <ArrowUp color={colors.onAccent} size={20} />
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    previewRow: {
      alignSelf: 'flex-start',
    },
    previewImage: {
      width: 60,
      height: 60,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
    },
    previewRemove: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 20,
      height: 20,
      borderRadius: radii.full,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    attachButton: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    attachButtonDisabled: {
      opacity: 0.4,
    },
    input: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.textPrimary,
      maxHeight: 100,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.4,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
