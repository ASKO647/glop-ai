import { Link, type Href } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from './ui/Button';
import Card from './ui/Card';
import type { Colors } from '../constants/theme';
import { spacing, typography } from '../constants/theme';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';

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
  nextLabel,
}: OnboardingStepProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.step}>{step}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.description}>
          {description ?? t('onboarding.step.defaultDescription')}
        </Text>
      </Card>

      <View style={styles.actions}>
        <Link href={nextHref} asChild>
          <Button label={nextLabel ?? t('onboarding.common.continue')} variant="primary" />
        </Link>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
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
    title: {
      ...typography.title,
      color: colors.textPrimary,
    },
    card: {
      flex: 1,
      marginVertical: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    description: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    actions: {
      marginBottom: spacing.lg,
    },
  });
}
