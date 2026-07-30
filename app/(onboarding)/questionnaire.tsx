import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QuestionInput from '../../components/onboarding/QuestionInput';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import { QUESTIONS, type Question } from '../../constants/questionnaire';
import { colors, spacing, typography } from '../../constants/theme';
import { useOnboarding, type AnswerValue } from '../../context/OnboardingContext';

const TOTAL = QUESTIONS.length;

function isAnswered(question: Question, value: AnswerValue | undefined): boolean {
  if (question.type === 'numeric') return true;
  if (question.type === 'multiple') return Array.isArray(value) && value.length > 0;
  return typeof value === 'string' && value.length > 0;
}

export default function QuestionnaireScreen() {
  const router = useRouter();
  const { answers, setAnswer } = useOnboarding();
  const [index, setIndex] = useState(0);

  const question = QUESTIONS[index];
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(12);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [index, opacity, translateY]);

  const handleBack = () => {
    if (index === 0) {
      router.back();
      return;
    }
    setIndex((current) => current - 1);
  };

  const handleContinue = () => {
    if (index === TOTAL - 1) {
      router.push('/analyse');
      return;
    }
    setIndex((current) => current + 1);
  };

  const answered = isAnswered(question, answers[question.id]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={handleBack} hitSlop={12} style={styles.backButton}>
          <ArrowLeft color={colors.textPrimary} size={22} />
        </Pressable>
        <View style={styles.progressRow}>
          <ProgressBar progress={(index + 1) / TOTAL} style={styles.progressBar} />
          <Text style={styles.progressLabel}>
            {index + 1} / {TOTAL}
          </Text>
        </View>
      </View>

      <Animated.View style={[styles.content, { opacity, transform: [{ translateY }] }]}>
        <Text style={styles.question}>{question.question}</Text>
        <QuestionInput
          question={question}
          value={answers[question.id]}
          onChange={(value) => setAnswer(question.id, value)}
        />
      </Animated.View>

      <View style={styles.footer}>
        <Button label="Continuer" variant="primary" disabled={!answered} onPress={handleContinue} />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
  },
  progressLabel: {
    ...typography.caption,
    minWidth: 44,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  question: {
    ...typography.title,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
});
