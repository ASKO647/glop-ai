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

const EXERCISE_LOWER_BODY_KEYWORDS = /squat|jambe|fente/i;
const EXERCISE_CARDIO_KEYWORDS = /course|cardio|corde/i;
const EXERCISE_CORE_KEYWORDS = /pompe|gainage|abdo/i;

/**
 * Matches an exercise's (French, internal) name against keywords to pick a representative
 * stock photo — "développé"/"épaules" and anything unmatched fall back to the dumbbells shot.
 *
 * ⚠️ `exercise-pushup.jpg` doesn't exist in the `app-images` bucket yet — the "pompes/gainage/
 * abdos" group uses `exercise-squat.jpg` in the meantime. Swap this to `exercise-pushup.jpg`
 * once that asset is uploaded.
 */
export function exerciseImage(nom: string): { uri: string } {
  if (EXERCISE_LOWER_BODY_KEYWORDS.test(nom)) return appImage('exercise-squat.jpg');
  if (EXERCISE_CARDIO_KEYWORDS.test(nom)) return appImage('exercise-cardio.jpg');
  if (EXERCISE_CORE_KEYWORDS.test(nom)) return appImage('exercise-squat.jpg');
  return appImage('exercise-dumbbells.jpg');
}
