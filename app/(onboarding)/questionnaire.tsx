import OnboardingStep from '../../components/OnboardingStep';

export default function QuestionnaireScreen() {
  return (
    <OnboardingStep
      step="Étape 2 / 5"
      title="Ton profil"
      description="Questionnaire objectifs, niveau et habitudes à venir."
      nextHref="/analyse"
    />
  );
}
