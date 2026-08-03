import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from './ui/Card';
import type { Colors } from '../constants/theme';
import { spacing, typography } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

type ScreenPlaceholderProps = {
  title: string;
  description?: string;
};

export default function ScreenPlaceholder({ title, description }: ScreenPlaceholderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Card style={styles.card}>
        <Text style={styles.description}>
          {description ?? 'Cet écran sera implémenté prochainement.'}
        </Text>
      </Card>
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
    },
    header: {
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    title: {
      ...typography.title,
      color: colors.textPrimary,
    },
    card: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    description: {
      ...typography.caption,
      color: colors.textSecondary,
    },
  });
}
