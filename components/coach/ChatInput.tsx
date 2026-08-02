import { ArrowUp } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type ChatInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled?: boolean;
};

export default function ChatInput({ value, onChangeText, onSend, disabled }: ChatInputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const canSend = value.trim().length > 0 && !disabled;

  return (
    <View style={styles.row}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Écris un message..."
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        multiline
        editable={!disabled}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Envoyer"
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
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
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
