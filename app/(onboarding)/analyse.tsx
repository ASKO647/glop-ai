import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnalysisStepRow from '../../components/onboarding/AnalysisStepRow';
import ProgressRing from '../../components/onboarding/ProgressRing';
import type { Colors } from '../../constants/theme';
import { spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';

const TARGET_PROGRESS = 87;
const DURATION = 4000;
const RING_SIZE = 170;
const RING_STROKE_WIDTH = 10;

const STEP_KEYS = [
  'onboarding.analysis.steps.profile',
  'onboarding.analysis.steps.lifestyle',
  'onboarding.analysis.steps.habits',
  'onboarding.analysis.steps.improvementAreas',
  'onboarding.analysis.steps.planCreation',
];

export default function AnalyseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();
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

  const checkedCount = Math.min(STEP_KEYS.length, Math.floor((progress / TARGET_PROGRESS) * STEP_KEYS.length));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <Text style={styles.title}>{t('onboarding.analysis.title')}</Text>

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
          {STEP_KEYS.map((key, index) => (
            <AnalysisStepRow key={key} label={t(key)} checked={index < checkedCount} />
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
