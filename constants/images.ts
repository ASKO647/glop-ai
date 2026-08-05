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
