import OnboardingStep from '../../components/OnboardingStep';

export default function SignupScreen() {
  return (
    <OnboardingStep
      step="Étape 1 / 5"
      title="Créer un compte"
      description="Formulaire d'inscription à venir."
      nextHref="/questionnaire"
    />
  );
}
