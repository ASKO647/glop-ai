import { Link, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from './ui/Button';
import Card from './ui/Card';
import { colors, spacing, typography } from '../constants/theme';

type OnboardingStepProps = {
  step: string;
  title: string;
  description?: string;
  nextHref: Href;
  nextLabel?: string;
};

export default function OnboardingStep({
  step,
  title,
  description,
  nextHref,
  nextLabel = 'Continuer',
}: OnboardingStepProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.step}>{step}</Text>
        <Text style={typography.title}>{title}</Text>
      </View>

      <Card style={styles.card}>
        <Text style={typography.caption}>
          {description ?? 'Cet écran sera implémenté prochainement.'}
        </Text>
      </Card>

      <View style={styles.actions}>
        <Link href={nextHref} asChild>
          <Button label={nextLabel} variant="primary" />
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  step: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  card: {
    flex: 1,
    marginVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    marginBottom: spacing.lg,
  },
});
