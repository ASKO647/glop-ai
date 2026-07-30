import OnboardingStep from '../../components/OnboardingStep';

// Note: navigating past this step currently loops back here — `isAuthenticated`
// in app/_layout.tsx is hardcoded to false until real auth/subscription logic exists.
export default function PaywallScreen() {
  return (
    <OnboardingStep
      step="Étape 5 / 5"
      title="Débloquer GlowUp AI"
      description="Offres d'abonnement à venir."
      nextHref="/"
      nextLabel="Commencer ma transformation"
    />
  );
}
