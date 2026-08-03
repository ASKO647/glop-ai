import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnalysisStepRow from '../../components/onboarding/AnalysisStepRow';
import ProgressRing from '../../components/onboarding/ProgressRing';
import type { Colors } from '../../constants/theme';
import { spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

const TARGET_PROGRESS = 87;
const DURATION = 4000;
const RING_SIZE = 170;
const RING_STROKE_WIDTH = 10;

const STEPS = [
  'Analyse de ton profil',
  'Évaluation de ton mode de vie',
  'Analyse de tes habitudes',
  "Identification de tes axes d'amélioration",
  'Création de ton plan perso',
];

export default function AnalyseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
      <Text style={styles.title}>Analyse en cours...</Text>

      <View style={styles.centerBlock}>
        <View style={styles.ringWrapper}>
          <ProgressRing
            progress={progressAnim}
            displayValue={progress}
            size={RING_SIZE}
            strokeWidth={RING_STROKE_WIDTH}
          />
        </View>

        <View style={styles.steps}>
          {STEPS.map((label, index) => (
            <AnalysisStepRow key={label} label={label} checked={index < checkedCount} />
          ))}
        </View>
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
    },
    title: {
      marginTop: spacing.lg,
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    centerBlock: {
      flex: 1,
      justifyContent: 'center',
    },
    ringWrapper: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    steps: {
      gap: 16,
    },
  });
}
