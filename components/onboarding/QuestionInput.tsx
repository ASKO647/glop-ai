import { StyleSheet, View, type ImageSourcePropType } from 'react-native';
import type { AnswerValue } from '../../context/OnboardingContext';
import type { Question, QuestionOption } from '../../constants/questionnaire';
import { spacing } from '../../constants/theme';
import NumericStepper from './NumericStepper';
import OptionCard from './OptionCard';

// Thumbnails for the "objectif principal" question only — every other question is text-only.
const GOAL_THUMBNAILS: Record<string, ImageSourcePropType> = {
  weight_loss: require('../../assets/images/goal-weightloss.jpg'),
  muscle_gain: require('../../assets/images/goal-muscle.jpg'),
  glow_up: require('../../assets/images/goal-glowup.jpg'),
  discipline: require('../../assets/images/goal-discipline.jpg'),
};

type QuestionInputProps = {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
};

export default function QuestionInput({ question, value, onChange }: QuestionInputProps) {
  if (question.type === 'numeric') {
    const numericValue = typeof value === 'number' ? value : question.defaultValue;
    return (
      <NumericStepper
        value={numericValue}
        min={question.min}
        max={question.max}
        step={question.step}
        unit={question.unit}
        onChange={onChange}
      />
    );
  }

  if (question.type === 'multiple') {
    const selectedIds = Array.isArray(value) ? value : [];
    return (
      <View style={styles.list}>
        {question.options.map((option) => (
          <OptionCard
            key={option.id}
            label={option.label}
            selected={selectedIds.includes(option.id)}
            onPress={() => onChange(toggleMultipleValue(question.options, selectedIds, option.id))}
          />
        ))}
      </View>
    );
  }

  const selectedId = typeof value === 'string' ? value : undefined;
  return (
    <View style={styles.list}>
      {question.options.map((option) => (
        <OptionCard
          key={option.id}
          label={option.label}
          selected={selectedId === option.id}
          onPress={() => onChange(option.id)}
          thumbnail={question.id === 'goal' ? GOAL_THUMBNAILS[option.id] : undefined}
        />
      ))}
    </View>
  );
}

function toggleMultipleValue(
  options: QuestionOption[],
  current: string[],
  optionId: string
): string[] {
  const option = options.find((o) => o.id === optionId);
  if (option?.exclusive) {
    return current.includes(optionId) ? [] : [optionId];
  }

  const withoutExclusive = current.filter((id) => !options.find((o) => o.id === id)?.exclusive);

  if (withoutExclusive.includes(optionId)) {
    return withoutExclusive.filter((id) => id !== optionId);
  }
  return [...withoutExclusive, optionId];
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
});
