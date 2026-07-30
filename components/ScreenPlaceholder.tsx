import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from './ui/Card';
import { colors, spacing, typography } from '../constants/theme';

type ScreenPlaceholderProps = {
  title: string;
  description?: string;
};

export default function ScreenPlaceholder({ title, description }: ScreenPlaceholderProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={typography.title}>{title}</Text>
      </View>
      <Card style={styles.card}>
        <Text style={typography.caption}>
          {description ?? 'Cet écran sera implémenté prochainement.'}
        </Text>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  card: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
});
