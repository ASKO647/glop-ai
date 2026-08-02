import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type MessageBubbleProps = {
  role: 'user' | 'assistant' | 'system';
  text: string;
};

export default function MessageBubble({ role, text }: MessageBubbleProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (role === 'system') {
    return (
      <View style={styles.systemRow}>
        <View style={styles.systemBubble}>
          <Text style={styles.systemText}>{text}</Text>
        </View>
      </View>
    );
  }

  const isUser = role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowCoach]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleCoach]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textCoach]}>{text}</Text>
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
    },
    rowCoach: {
      justifyContent: 'flex-start',
    },
    rowUser: {
      justifyContent: 'flex-end',
    },
    bubble: {
      maxWidth: '80%',
      borderRadius: radii.lg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    bubbleCoach: {
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 4,
    },
    bubbleUser: {
      backgroundColor: colors.accent,
      borderBottomRightRadius: 4,
    },
    text: {
      fontSize: 14,
      lineHeight: 20,
    },
    textCoach: {
      color: colors.stepTextDone,
    },
    textUser: {
      color: colors.onAccent,
    },
    systemRow: {
      alignItems: 'center',
    },
    systemBubble: {
      maxWidth: '90%',
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      paddingVertical: 6,
      paddingHorizontal: spacing.sm,
    },
    systemText: {
      fontSize: 12,
      color: colors.danger,
      textAlign: 'center',
    },
  });
}
