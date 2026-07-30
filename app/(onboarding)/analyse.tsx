import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnalysisStepRow from '../../components/onboarding/AnalysisStepRow';
import ProgressRing from '../../components/onboarding/ProgressRing';
import { colors, spacing, typography } from '../../constants/theme';

const TARGET_PROGRESS = 87;
const DURATION = 4000;

const STEPS = [
  'Analyse de ton profil',
  'Évaluation de ton mode de vie',
  'Analyse de tes habitudes',
  "Identification de tes axes d'amélioration",
  'Création de ton plan perso',
];

export default function AnalyseScreen() {
  const router = useRouter();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) => setProgress(value));

    const animation = Animated.timing(progressAnim, {
      toValue: TARGET_PROGRESS,
      duration: DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        router.replace('/plan');
      }
    });

    return () => {
      progressAnim.removeListener(listenerId);
      animation.stop();
    };
  }, [progressAnim, router]);

  const checkedCount = Math.min(STEPS.length, Math.floor((progress / TARGET_PROGRESS) * STEPS.length));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={typography.title}>Analyse en cours</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          On construit ton plan personnalisé.
        </Text>
      </View>

      <View style={styles.ringWrapper}>
        <ProgressRing progress={progressAnim} displayValue={progress} />
      </View>

      <View style={styles.steps}>
        {STEPS.map((label, index) => (
          <AnalysisStepRow key={label} label={label} checked={index < checkedCount} />
        ))}
      </View>
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
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  ringWrapper: {
    alignItems: 'center',
    marginVertical: spacing['2xl'],
  },
  steps: {
    gap: spacing.md,
  },
});
