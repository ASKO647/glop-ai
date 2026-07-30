import OnboardingStep from '../../components/OnboardingStep';

export default function AnalyseScreen() {
  return (
    <OnboardingStep
      step="Étape 1 / 4"
      title="Analyse en cours"
      description="Analyse IA du profil à venir."
      nextHref="/plan"
    />
  );
}
