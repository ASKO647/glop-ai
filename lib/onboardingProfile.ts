import { getOptionLabel } from '../constants/onboardingFlow';
import { asString, type OnboardingAnswers } from '../context/OnboardingContext';

/**
 * The subset of `profiles` columns filled in from the onboarding questionnaire — shared by
 * `signup.tsx` (fresh insert, classic email flow) and `plan.tsx` (update on an already
 * authenticated-but-unonboarded row, e.g. a Google sign-in that skipped straight to `/q/0`).
 */
export function buildOnboardingProfilePayload(answers: OnboardingAnswers) {
  const restrictionIds = Array.isArray(answers.dietary_restrictions) ? answers.dietary_restrictions : [];
  const restrictions = restrictionIds
    .map((id) => getOptionLabel('dietary_restrictions', id))
    .filter((label): label is string => Boolean(label));

  return {
    objectif: getOptionLabel('goal', asString(answers.goal)) ?? null,
    sexe: getOptionLabel('gender', asString(answers.gender)) ?? null,
    age: typeof answers.age === 'number' ? answers.age : null,
    taille: typeof answers.height === 'number' ? answers.height : null,
    poids_actuel: typeof answers.current_weight === 'number' ? answers.current_weight : null,
    poids_objectif: typeof answers.target_weight === 'number' ? answers.target_weight : null,
    vitesse: getOptionLabel('pace', asString(answers.pace)) ?? null,
    niveau_activite: getOptionLabel('activity_level', asString(answers.activity_level)) ?? null,
    frequence_entrainement: getOptionLabel('workouts_per_week', asString(answers.workouts_per_week)) ?? null,
    lieu_entrainement: getOptionLabel('training_location', asString(answers.training_location)) ?? null,
    alimentation: getOptionLabel('diet_quality', asString(answers.diet_quality)) ?? null,
    sommeil: getOptionLabel('sleep_hours', asString(answers.sleep_hours)) ?? null,
    blocage: getOptionLabel('blocker', asString(answers.blocker)) ?? null,
    restrictions,
    engagement: getOptionLabel('commitment_level', asString(answers.commitment_level)) ?? null,
  };
}
