import OnboardingStep from '../../components/OnboardingStep';

export default function PlanScreen() {
  return (
    <OnboardingStep
      step="Étape 4 / 5"
      title="Ton plan personnalisé"
      description="Aperçu du plan généré par l'IA à venir."
      nextHref="/paywall"
    />
  );
}
