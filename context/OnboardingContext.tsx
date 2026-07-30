import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type AnswerValue = string | string[] | number;

export type OnboardingAnswers = Record<string, AnswerValue>;

type OnboardingContextValue = {
  answers: OnboardingAnswers;
  setAnswer: (questionId: string, value: AnswerValue) => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<OnboardingAnswers>({});

  const setAnswer = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const value = useMemo(() => ({ answers, setAnswer }), [answers]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
