import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import BreatherScreen from '../../../components/onboarding/BreatherScreen';
import FinalScreen from '../../../components/onboarding/FinalScreen';
import NumericStepperScreen from '../../../components/onboarding/NumericStepperScreen';
import OnboardingLayout from '../../../components/onboarding/OnboardingLayout';
import OptionCard from '../../../components/onboarding/OptionCard';
import ResultScreen from '../../../components/onboarding/ResultScreen';
import { getStepByIndex, TOTAL_STEPS, type OnboardingOption } from '../../../constants/onboardingFlow';
import { spacing } from '../../../constants/theme';
import { useLocale } from '../../../context/LocaleContext';
import { useOnboarding } from '../../../context/OnboardingContext';

const TRANSITION_DURATION_MS = 280;
const SLIDE_DISTANCE = 32;
const AUTO_ADVANCE_DELAY_MS = 250;

export default function OnboardingStepScreen() {
  const { step, dir } = useLocalSearchParams<{ step: string; dir?: string }>();
  const router = useRouter();
  const { t } = useLocale();
  const { answers, setAnswer } = useOnboarding();

  const index = Number(step) || 0;
  const stepDef = getStepByIndex(index);

  const translateX = useSharedValue(dir === 'back' ? -SLIDE_DISTANCE : SLIDE_DISTANCE);
  const opacity = useSharedValue(0);
  const autoAdvanceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current);
    translateX.value = dir === 'back' ? -SLIDE_DISTANCE : SLIDE_DISTANCE;
    opacity.value = 0;
    translateX.value = withTiming(0, { duration: TRANSITION_DURATION_MS, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: TRANSITION_DURATION_MS, easing: Easing.out(Easing.cubic) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => () => {
    if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current);
  }, []);

  // Numeric steps carry no on-screen "select" action, so their answer must be seeded on
  // arrival — otherwise a user who never touches the stepper would leave this step unanswered.
  useEffect(() => {
    if (stepDef?.kind === 'numeric' && typeof answers[stepDef.id] !== 'number') {
      setAnswer(stepDef.id, stepDef.defaultValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepDef?.id]);

  const transitionStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  if (!stepDef) return null;

  const goToIndex = (nextIndex: number, direction: 'fwd' | 'back') => {
    router.replace(`/q/${nextIndex}?dir=${direction}`);
  };

  const handleBack = () => {
    if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current);
    if (index === 0) {
      router.back();
      return;
    }
    goToIndex(index - 1, 'back');
  };

  const handleContinue = () => {
    if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current);
    if (index === TOTAL_STEPS - 1) {
      router.replace('/analyse');
      return;
    }
    goToIndex(index + 1, 'fwd');
  };

  const handleSelectSingle = (optionId: string) => {
    setAnswer(stepDef.id, optionId);
    if (autoAdvanceTimeout.current) clearTimeout(autoAdvanceTimeout.current);
    autoAdvanceTimeout.current = setTimeout(() => {
      goToIndex(index + 1, 'fwd');
    }, AUTO_ADVANCE_DELAY_MS);
  };

  const selectedId = typeof answers[stepDef.id] === 'string' ? (answers[stepDef.id] as string) : undefined;
  const selectedIds = Array.isArray(answers[stepDef.id]) ? (answers[stepDef.id] as string[]) : [];

  const handleToggleMultiple = (option: OnboardingOption) => {
    if (stepDef.kind !== 'multiple') return;
    const exclusiveIds = stepDef.options.filter((o) => o.exclusive).map((o) => o.id);
    const isSelected = selectedIds.includes(option.id);
    let next: string[];
    if (option.exclusive) {
      next = isSelected ? [] : [option.id];
    } else {
      const base = selectedIds.filter((id) => !exclusiveIds.includes(id));
      next = isSelected ? base.filter((id) => id !== option.id) : [...base, option.id];
    }
    setAnswer(stepDef.id, next);
  };

  let continueDisabled = false;
  let title: string | undefined = 'titleKey' in stepDef ? t(stepDef.titleKey) : undefined;
  let subtitle: string | undefined =
    'subtitleKey' in stepDef && stepDef.subtitleKey ? t(stepDef.subtitleKey) : undefined;
  let content: React.ReactNode = null;

  switch (stepDef.kind) {
    case 'single': {
      continueDisabled = !selectedId;
      content = (
        <View style={styles.optionsList}>
          {stepDef.options.map((option, optionIndex) => (
            <OptionCard
              key={option.id}
              index={optionIndex}
              label={t(option.labelKey)}
              icon={option.icon}
              selected={selectedId === option.id}
              pulseOnAutoAdvance
              onPress={() => handleSelectSingle(option.id)}
            />
          ))}
        </View>
      );
      break;
    }
    case 'multiple': {
      continueDisabled = selectedIds.length === 0;
      content = (
        <View style={styles.optionsList}>
          {stepDef.options.map((option, optionIndex) => (
            <OptionCard
              key={option.id}
              index={optionIndex}
              label={t(option.labelKey)}
              icon={option.icon}
              selected={selectedIds.includes(option.id)}
              onPress={() => handleToggleMultiple(option)}
            />
          ))}
        </View>
      );
      break;
    }
    case 'numeric': {
      const value = typeof answers[stepDef.id] === 'number' ? (answers[stepDef.id] as number) : stepDef.defaultValue;
      content = (
        <NumericStepperScreen
          value={value}
          min={stepDef.min}
          max={stepDef.max}
          step={stepDef.step}
          unit={stepDef.unitKey ? t(stepDef.unitKey) : undefined}
          quickAdjustments={stepDef.quickAdjustments}
          onChange={(next) => setAnswer(stepDef.id, next)}
        />
      );
      break;
    }
    case 'breather': {
      title = undefined;
      subtitle = undefined;
      content = (
        <BreatherScreen
          title={t(stepDef.titleKey)}
          subtitle={stepDef.subtitleKey ? t(stepDef.subtitleKey) : ''}
          icon={stepDef.icon}
          privacyTitle={stepDef.privacyTitleKey ? t(stepDef.privacyTitleKey) : undefined}
          privacyText={stepDef.privacyTextKey ? t(stepDef.privacyTextKey) : undefined}
        />
      );
      break;
    }
    case 'result': {
      title = undefined;
      const currentWeight = typeof answers.current_weight === 'number' ? answers.current_weight : 70;
      const targetWeight = typeof answers.target_weight === 'number' ? answers.target_weight : 65;
      content = <ResultScreen currentWeight={currentWeight} targetWeight={targetWeight} />;
      break;
    }
    case 'final': {
      title = undefined;
      subtitle = undefined;
      content = (
        <FinalScreen title={t(stepDef.titleKey)} subtitle={stepDef.subtitleKey ? t(stepDef.subtitleKey) : ''} icon={stepDef.icon} />
      );
      break;
    }
  }

  return (
    <OnboardingLayout
      progress={(index + 1) / TOTAL_STEPS}
      title={title}
      subtitle={subtitle}
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={continueDisabled}
      continueLabel={t('onboarding.common.continue')}
      backAccessibilityLabel={t('onboarding.common.back')}
    >
      <Animated.View style={transitionStyle}>{content}</Animated.View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  optionsList: {
    gap: spacing.sm,
  },
});
