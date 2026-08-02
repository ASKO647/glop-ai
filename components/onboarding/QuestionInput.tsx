import { StyleSheet, View, type ImageSourcePropType } from 'react-native';
import type { AnswerValue } from '../../context/OnboardingContext';
import type { Question, QuestionOption } from '../../constants/questionnaire';
import { appImage } from '../../constants/images';
import { spacing } from '../../constants/theme';
import NumericStepper from './NumericStepper';
import OptionCard from './OptionCard';

// Only the "goal" question gets thumbnails — every other single/multiple-choice question
// renders as plain text rows.
const GOAL_IMAGES: Record<string, ImageSourcePropType> = {
  weight_loss: appImage('goal-weightloss.jpg'),
  muscle_gain: appImage('goal-muscle.jpg'),
  glow_up: appImage('goal-glowup.jpg'),
  discipline: appImage('goal-discipline.jpg'),
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
          imageSource={question.id === 'goal' ? GOAL_IMAGES[option.id] : undefined}
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
