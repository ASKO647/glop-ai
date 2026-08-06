// Contournement temporaire : les images JPEG locales (`assets/images/*.jpg`) ne se chargent
// pas dans Expo Go malgré un `metro.config.js` correct et des fichiers valides. En attendant,
// tous les fichiers de `assets/images/` ont été téléversés dans le bucket public Supabase
// `app-images` sous les mêmes noms, et sont servis depuis là via `appImage(name)`. À réévaluer
// une fois l'app passée en development build (les `require()` locaux redeviennent alors l'option
// normale) — ne pas laisser ce contournement s'installer durablement.

const BASE = 'https://qzmntduiztddspskrqqc.supabase.co/storage/v1/object/public/app-images';

export function appImage(name: string): { uri: string } {
  return { uri: `${BASE}/${name}` };
}

// The AI classifies each generated recipe into one of these visual categories
// (`categorie_visuelle` in lib/recipes.ts) purely to pick a representative stock photo — it's
// unrelated to `constants/recipes.ts`'s meal-time categories (a "Déjeuner" idea can visually be
// a salade, viande, poisson, pates or vegetarien dish).
const RECIPE_VISUAL_CATEGORIES = [
  'petit-dejeuner',
  'salade',
  'viande',
  'poisson',
  'pates',
  'vegetarien',
  'dessert',
  'snack',
] as const;

export type RecipeVisualCategory = (typeof RECIPE_VISUAL_CATEGORIES)[number];

/** `recipe-{categorie}.jpg` from the `app-images` bucket, falling back to `recipe-vegetarien.jpg` for an unrecognized or missing category. */
export function recipeImage(categorie: string | undefined): { uri: string } {
  const isValid = (RECIPE_VISUAL_CATEGORIES as readonly string[]).includes(categorie ?? '');
  const safeCategorie = isValid ? (categorie as RecipeVisualCategory) : 'vegetarien';
  return appImage(`recipe-${safeCategorie}.jpg`);
}

const VISUAL_CATEGORY_TITLE_KEYWORDS: { pattern: RegExp; categorie: RecipeVisualCategory }[] = [
  { pattern: /poulet|dinde|b[oœ]uf|porc|veau|escalope/i, categorie: 'viande' },
  { pattern: /saumon|cabillaud|thon|poisson|crevette/i, categorie: 'poisson' },
  { pattern: /p[âa]tes|spaghetti|lasagne|risotto/i, categorie: 'pates' },
];

/**
 * The AI's own `categorie_visuelle` sometimes keys off a side dish instead of the main
 * ingredient (a mustard turkey escalope tagged as a fish-and-rice photo) — a title keyword match
 * is a stronger, cheaper signal and overrides it whenever one applies. Returns `null` when no
 * keyword matches, meaning the AI's own category (or the `vegetarien` fallback) should stand.
 */
export function matchVisualCategoryFromTitle(titre: string): RecipeVisualCategory | null {
  const match = VISUAL_CATEGORY_TITLE_KEYWORDS.find(({ pattern }) => pattern.test(titre));
  return match?.categorie ?? null;
}

const EXERCISE_LOWER_BODY_KEYWORDS =
  /squat|fente|jambe|cuisse|mollet|hip thrust|souleve|deadlift|presse|ischio|fessier/;
const EXERCISE_CORE_KEYWORDS = /pompe|push|gainage|planche|abdo|crunch|dips|traction|pull/;
const EXERCISE_CARDIO_KEYWORDS = /course|cardio|corde|burpee|jumping|mountain climber|velo|rameur|hiit|saut|tapis/;
const EXERCISE_UPPER_BODY_KEYWORDS = /developpe|epaule|biceps|triceps|curl|haltere|pectoraux|dos|rowing|elevation/;

/** Lowercases and strips accents so "Développé épaules" and "developpe epaules" match the same keywords. */
function normalizeExerciseName(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Matches an exercise's (French, internal) name against keywords to pick a representative stock
 * photo, matched against a normalized (lowercase, accent-stripped) name so accentless variants
 * ("developpe") match the same as the accented original ("développé"). Anything unmatched falls
 * back to the dumbbells shot and is logged so the keyword lists can be extended.
 */
export function exerciseImage(nom: string): { uri: string } {
  const normalized = normalizeExerciseName(nom);
  if (EXERCISE_LOWER_BODY_KEYWORDS.test(normalized)) return appImage('exercise-squat.jpg');
  if (EXERCISE_CORE_KEYWORDS.test(normalized)) return appImage('exercise-pushup.jpg');
  if (EXERCISE_CARDIO_KEYWORDS.test(normalized)) return appImage('exercise-cardio.jpg');
  if (EXERCISE_UPPER_BODY_KEYWORDS.test(normalized)) return appImage('exercise-dumbbells.jpg');
  console.log(`[exerciseImage] No keyword match for exercise name: "${nom}"`);
  return appImage('exercise-dumbbells.jpg');
}
