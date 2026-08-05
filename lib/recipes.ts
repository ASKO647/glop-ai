import type { RecipeVisualCategory } from '../constants/images';
import type { Locale } from '../context/LocaleContext';
import type { Profile } from '../context/ProfileContext';
import {
  ANTHROPIC_API_URL,
  ANTHROPIC_MODEL,
  anthropicHeaders,
  describeAnthropicError,
  languageInstruction,
  stripJsonFences,
} from './anthropic';

// Same rule as lib/coach.ts, lib/foodScanner.ts and lib/progressAnalysis.ts: no Anthropic SDK,
// ever — raw `fetch` only. Detailed multi-sentence steps need more headroom than the
// single-analysis calls elsewhere in the app.
const MAX_TOKENS = 4096;
// 10 category recipes (vs. 4 fridge recipes) need proportionally more room.
const CATEGORY_MAX_TOKENS = 6800;

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export type RecipeIngredient = { nom: string; quantite: string };

export type Recipe = {
  titre: string;
  description: string;
  kcal: number;
  proteines: number;
  glucides: number;
  lipides: number;
  temps_preparation: string;
  difficulte: string;
  portions: number;
  // Optional: only returned by the category-based suggestions prompt (`generateCategoryRecipes`),
  // absent from fridge recipes and from anything read back out of `saved_recipes` — callers that
  // display an image (RecipeIdeaCard) fall back to a default category via `recipeImage()`.
  categorie_visuelle?: RecipeVisualCategory;
  ingredients: RecipeIngredient[];
  etapes: string[];
};

export type FridgeRecipe = Recipe & { ingredients_manquants: string[] };

export type SuggestionsResult = { recettes: Recipe[] };
export type FridgeAnalysis = { ingredients_detectes: string[]; recettes: FridgeRecipe[] };

export type RecipeImage = { base64: string; mimeType: string };

/** A row from `saved_recipes` — note there's no `portions` column, unlike a freshly-generated `Recipe`. */
export type SavedRecipeRow = {
  id: string;
  titre: string;
  description: string;
  kcal: number;
  proteines: number;
  glucides: number;
  lipides: number;
  temps_preparation: string;
  difficulte: string;
  ingredients: RecipeIngredient[];
  etapes: string[];
  source: 'suggestion' | 'frigo';
  created_at: string;
};

export type RecipeProfile = {
  objectif: string | null;
  poidsActuel: number | null;
  poidsObjectif: number | null;
  niveauActivite: string | null;
  restrictions: string[] | null;
};

export function summarizeProfileForRecipes(profile: Profile | null): RecipeProfile {
  return {
    objectif: profile?.objectif ?? null,
    poidsActuel: profile?.poids_actuel ?? null,
    poidsObjectif: profile?.poids_objectif ?? null,
    niveauActivite: profile?.niveau_activite ?? null,
    restrictions: profile?.restrictions ?? null,
  };
}

type AnthropicMessageResponse = {
  content: { type: string; text?: string }[];
};

function buildSystemPrompt(profile: RecipeProfile, locale: Locale): string {
  const lines = [
    'Tu es un chef nutritionniste qui propose des recettes savoureuses, réalistes et faciles à réaliser à la maison.',
    '',
    'Règles strictes, à respecter en toute circonstance :',
    '- Les recettes doivent impérativement respecter toutes les restrictions alimentaires listées ci-dessous — aucun ingrédient interdit, sans aucune exception.',
    "- Les recettes doivent servir l'objectif de l'utilisateur via leurs calories et macronutriments (par exemple modérément caloriques et riches en protéines pour une perte de poids, plus caloriques et riches en protéines pour une prise de muscle).",
    '- Réponds uniquement en JSON valide, sans balises markdown, sans aucun texte hors du JSON demandé.',
  ];
  if (profile.objectif) lines.push(`Objectif : ${profile.objectif}.`);
  if (profile.poidsActuel != null) lines.push(`Poids actuel : ${profile.poidsActuel} kg.`);
  if (profile.poidsObjectif != null) lines.push(`Poids objectif : ${profile.poidsObjectif} kg.`);
  if (profile.niveauActivite) lines.push(`Niveau d'activité : ${profile.niveauActivite}.`);
  if (profile.restrictions && profile.restrictions.length > 0) {
    lines.push(`Restrictions alimentaires à respecter impérativement : ${profile.restrictions.join(', ')}.`);
  }
  return `${lines.join('\n')}\n\n${languageInstruction(locale)}`;
}

const STEPS_INSTRUCTION =
  "Chaque étape de préparation doit être détaillée et exploitable (2 à 3 phrases), jamais un simple résumé : précise les températures, les durées de cuisson et les techniques utilisées.";

const CATEGORY_RECIPE_JSON_SHAPE =
  '{"titre":"...","description":"...","kcal":0,"proteines":0,"glucides":0,"lipides":0,"temps_preparation":"25 min","difficulte":"Facile","portions":2,"categorie_visuelle":"vegetarien","ingredients":[{"nom":"...","quantite":"..."}],"etapes":["Étape détaillée 1","Étape détaillée 2"]}';

function buildCategoryPrompt(categoryPromptLabel: string): string {
  return `Propose 10 recettes variées de type "${categoryPromptLabel}", adaptées au profil de l'utilisateur décrit ci-dessus (objectif, poids actuel et cible, restrictions alimentaires, niveau d'activité). Varie les recettes proposées — ne répète pas le même plat sous des formes différentes.

Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après, et sans balises markdown (pas de \`\`\`json), au format exact suivant :

{"recettes":[${CATEGORY_RECIPE_JSON_SHAPE}]}

- "kcal", "proteines", "glucides", "lipides" sont pour une portion (nombres entiers, grammes pour les macros).
- "temps_preparation" est un texte court (ex : "25 min").
- "difficulte" vaut "Facile", "Moyen" ou "Difficile".
- "portions" est le nombre de portions que sert la recette (nombre entier).
- "categorie_visuelle" vaut exactement l'une de ces valeurs, celle qui décrit le mieux le plat : "petit-dejeuner", "salade", "viande", "poisson", "pates", "vegetarien", "dessert", "snack".
- "ingredients" liste chaque ingrédient avec sa quantité (ex : {"nom":"Blanc de poulet","quantite":"200g"}).
- "etapes" contient chaque étape de préparation. ${STEPS_INSTRUCTION}`;
}

const FRIDGE_PROMPT = `Ces photos montrent le contenu d'un frigo, d'un congélateur ou de placards. Identifie les ingrédients visibles, puis propose 4 recettes réalisables principalement avec ces ingrédients, adaptées au profil de l'utilisateur décrit ci-dessus.

Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après, et sans balises markdown (pas de \`\`\`json), au format exact suivant :

{"ingredients_detectes":["...","..."],"recettes":[{"titre":"...","description":"...","kcal":0,"proteines":0,"glucides":0,"lipides":0,"temps_preparation":"25 min","difficulte":"Facile","portions":2,"ingredients":[{"nom":"...","quantite":"..."}],"etapes":["Étape détaillée 1","Étape détaillée 2"],"ingredients_manquants":["..."]}]}

- "ingredients_detectes" liste chaque ingrédient identifiable sur les photos, en français, au singulier (ex : "Oeufs", "Tomates", "Riz").
- Chaque recette suit le même format qu'une recette normale, avec en plus "ingredients_manquants" : les ingrédients nécessaires mais absents des photos (tableau vide si la recette est entièrement réalisable avec ce qui est visible).
- Privilégie des recettes majoritairement réalisables avec les ingrédients détectés — les ingrédients manquants doivent rester des compléments mineurs (assaisonnements, un ou deux ingrédients de base), jamais l'essentiel de la recette.
- ${STEPS_INSTRUCTION}

Si aucun ingrédient n'est identifiable sur les photos, réponds avec : {"ingredients_detectes":[],"recettes":[]}`;

function requireApiKey(t: TranslateFn): string {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(t('recipes.errors.missingApiKey'));
  }
  return apiKey;
}

async function parseAnthropicJson<T>(t: TranslateFn, response: Response, action: string): Promise<T> {
  if (!response.ok) {
    throw new Error(await describeAnthropicError(t, response, action));
  }

  let data: AnthropicMessageResponse;
  try {
    data = (await response.json()) as AnthropicMessageResponse;
  } catch {
    throw new Error(t('recipes.errors.unreadableResponse'));
  }

  const text = data.content?.[0]?.text;
  if (!text) {
    throw new Error(t('recipes.errors.noResult', { action }));
  }

  try {
    return JSON.parse(stripJsonFences(text)) as T;
  } catch {
    throw new Error(t('recipes.errors.unreadableResult'));
  }
}

/** Generates 10 recipes for a given meal-time category (`RecipeCategoryInfo.promptLabel`), matching the user's goal and dietary restrictions. */
export async function generateCategoryRecipes(
  categoryPromptLabel: string,
  profile: RecipeProfile,
  locale: Locale,
  t: TranslateFn
): Promise<SuggestionsResult> {
  const apiKey = requireApiKey(t);

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: anthropicHeaders(apiKey),
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: CATEGORY_MAX_TOKENS,
        system: buildSystemPrompt(profile, locale),
        messages: [{ role: 'user', content: buildCategoryPrompt(categoryPromptLabel) }],
      }),
    });
  } catch {
    throw new Error(t('recipes.errors.generateNetworkError'));
  }

  return parseAnthropicJson<SuggestionsResult>(t, response, t('recipes.actions.generate'));
}

/** Sends up to 3 fridge/pantry photos + profile context and returns detected ingredients + 4 feasible recipes. */
export async function analyzeFridge(
  images: RecipeImage[],
  profile: RecipeProfile,
  locale: Locale,
  t: TranslateFn
): Promise<FridgeAnalysis> {
  const apiKey = requireApiKey(t);
  if (images.length === 0) {
    throw new Error(t('recipes.errors.noImageForAnalysis'));
  }

  const content: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  > = images.map((image) => ({
    type: 'image' as const,
    source: { type: 'base64' as const, media_type: image.mimeType, data: image.base64 },
  }));
  content.push({ type: 'text', text: FRIDGE_PROMPT });

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: anthropicHeaders(apiKey),
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        system: buildSystemPrompt(profile, locale),
        messages: [{ role: 'user', content }],
      }),
    });
  } catch {
    throw new Error(t('recipes.errors.fridgeNetworkError'));
  }

  return parseAnthropicJson<FridgeAnalysis>(t, response, t('recipes.actions.fridgeAnalysis'));
}
