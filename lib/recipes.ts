import { matchVisualCategoryFromTitle, type RecipeVisualCategory } from '../constants/images';
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
// ever — raw `fetch` only.
// Fridge recipes carry extra fields (`ingredients_manquants`) on top of a normal recipe, so they
// need a bit more per-recipe room than a category batch (see CATEGORY_BATCH_MAX_TOKENS below).
// Kept as low as the 4-recipe, detailed-steps shape allows (item 1 of the performance pass).
const FRIDGE_MAX_TOKENS = 3200;

// A single "give me 10 recipes" call regularly took 5-10 minutes and timed out or failed
// outright. Splitting the (now smaller) 6-recipe target into two smaller, parallel requests
// cuts each individual call's generation time and lets the UI show the first batch as soon as
// it lands instead of waiting for everything at once (see `onBatch` on `generateCategoryRecipes`).
const CATEGORY_BATCH_SIZE = 3;
const CATEGORY_BATCH_COUNT = 2;
export const RECIPES_PER_CATEGORY = CATEGORY_BATCH_SIZE * CATEGORY_BATCH_COUNT;
const CATEGORY_BATCH_MAX_TOKENS = 2400;

// Above this, a call is assumed stuck — abort it rather than leaving the user staring at a
// spinner indefinitely.
const REQUEST_TIMEOUT_MS = 45_000;

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

// Kept short on purpose (item 1 of the performance pass) — a shorter system prompt means fewer
// input tokens to process before generation even starts. The rules below are the only ones that
// actually change model behavior; everything else was flavor text.
function buildSystemPrompt(profile: RecipeProfile, locale: Locale): string {
  const lines = [
    'Tu es un chef nutritionniste. Propose des recettes savoureuses, réalistes et faciles à réaliser à la maison.',
    'Règles strictes : respecte impérativement toutes les restrictions alimentaires listées ci-dessous (aucun ingrédient interdit) ; adapte calories et macros à l\'objectif (perte de poids → modérément calorique et riche en protéines, prise de muscle → plus calorique et riche en protéines) ; réponds uniquement en JSON valide, sans markdown, sans texte hors JSON.',
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
  'Chaque étape doit être détaillée et exploitable (2 à 3 phrases) : température, durée de cuisson, technique.';

const CATEGORY_RECIPE_JSON_SHAPE =
  '{"titre":"...","description":"...","kcal":0,"proteines":0,"glucides":0,"lipides":0,"temps_preparation":"25 min","difficulte":"Facile","portions":2,"categorie_visuelle":"vegetarien","ingredients":[{"nom":"...","quantite":"..."}],"etapes":["Étape détaillée 1","Étape détaillée 2"]}';

function buildCategoryPrompt(categoryPromptLabel: string, count: number): string {
  return `Propose ${count} recettes variées de type "${categoryPromptLabel}", adaptées au profil de l'utilisateur décrit ci-dessus (objectif, poids actuel et cible, restrictions alimentaires, niveau d'activité). Varie les recettes proposées — ne répète pas le même plat sous des formes différentes.

Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après, et sans balises markdown (pas de \`\`\`json), au format exact suivant :

{"recettes":[${CATEGORY_RECIPE_JSON_SHAPE}]}

- "kcal", "proteines", "glucides", "lipides" sont pour une portion (nombres entiers, grammes pour les macros).
- "temps_preparation" est un texte court (ex : "25 min").
- "difficulte" vaut "Facile", "Moyen" ou "Difficile".
- "portions" est le nombre de portions que sert la recette (nombre entier).
- "categorie_visuelle" vaut exactement l'une de ces valeurs, celle qui correspond à l'INGRÉDIENT PRINCIPAL du plat, jamais à son accompagnement : "petit-dejeuner", "salade", "viande", "poisson", "pates", "vegetarien", "dessert", "snack". Exemples : "escalope de dinde à la moutarde" → "viande" (pas l'accompagnement, même si servi avec du riz) ; "saumon grillé" → "poisson" ; "salade de quinoa" → "salade".
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

/**
 * POSTs one Anthropic message with a 45s hard timeout (`AbortController`) and exactly one
 * automatic retry when the failure is a network error (not a timeout — retrying after already
 * waiting 45s would just double the wait). Logs each attempt's duration so slow calls are
 * identifiable in the console.
 */
async function postAnthropicMessage(
  apiKey: string,
  body: Record<string, unknown>,
  action: string,
  timeoutMessage: string,
  networkErrorMessage: string
): Promise<Response> {
  const attempt = (): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    return fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: anthropicHeaders(apiKey),
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
  };

  const start = Date.now();
  for (let attemptNumber = 1; attemptNumber <= 2; attemptNumber++) {
    try {
      const response = await attempt();
      console.log(`[Recettes] ${action} — ${Date.now() - start} ms${attemptNumber > 1 ? ' (après nouvelle tentative)' : ''}`);
      return response;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log(`[Recettes] ${action} — délai dépassé après ${Date.now() - start} ms`);
        throw new Error(timeoutMessage);
      }
      console.log(`[Recettes] ${action} — échec réseau après ${Date.now() - start} ms (tentative ${attemptNumber})`);
    }
  }
  throw new Error(networkErrorMessage);
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

/** The AI's `categorie_visuelle` gives way to a title keyword match whenever one applies (see `matchVisualCategoryFromTitle`). */
function applyVisualCategoryOverride(recipe: Recipe): Recipe {
  const override = matchVisualCategoryFromTitle(recipe.titre);
  return override ? { ...recipe, categorie_visuelle: override } : recipe;
}

async function requestCategoryBatch(
  apiKey: string,
  categoryPromptLabel: string,
  count: number,
  profile: RecipeProfile,
  locale: Locale,
  t: TranslateFn
): Promise<Recipe[]> {
  const response = await postAnthropicMessage(
    apiKey,
    {
      model: ANTHROPIC_MODEL,
      max_tokens: CATEGORY_BATCH_MAX_TOKENS,
      system: buildSystemPrompt(profile, locale),
      messages: [{ role: 'user', content: buildCategoryPrompt(categoryPromptLabel, count) }],
    },
    t('recipes.actions.generate'),
    t('recipes.errors.timeout'),
    t('recipes.errors.generateNetworkError')
  );
  const result = await parseAnthropicJson<SuggestionsResult>(t, response, t('recipes.actions.generate'));
  return result.recettes.map(applyVisualCategoryOverride);
}

/**
 * Generates `RECIPES_PER_CATEGORY` recipes for a given meal-time category
 * (`RecipeCategoryInfo.promptLabel`), matching the user's goal and dietary restrictions.
 *
 * Split into `CATEGORY_BATCH_COUNT` smaller requests fired in parallel rather than one big call:
 * each batch is faster and less likely to hit the timeout, and `onBatch` (if provided) fires as
 * soon as each individual batch resolves, so the caller can render recipes progressively instead
 * of waiting for the slowest one.
 */
export async function generateCategoryRecipes(
  categoryPromptLabel: string,
  profile: RecipeProfile,
  locale: Locale,
  t: TranslateFn,
  onBatch?: (recipes: Recipe[]) => void
): Promise<SuggestionsResult> {
  const apiKey = requireApiKey(t);

  const batches = await Promise.all(
    Array.from({ length: CATEGORY_BATCH_COUNT }, async () => {
      const recipes = await requestCategoryBatch(apiKey, categoryPromptLabel, CATEGORY_BATCH_SIZE, profile, locale, t);
      onBatch?.(recipes);
      return recipes;
    })
  );

  return { recettes: batches.flat() };
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

  const response = await postAnthropicMessage(
    apiKey,
    {
      model: ANTHROPIC_MODEL,
      max_tokens: FRIDGE_MAX_TOKENS,
      system: buildSystemPrompt(profile, locale),
      messages: [{ role: 'user', content }],
    },
    t('recipes.actions.fridgeAnalysis'),
    t('recipes.errors.timeout'),
    t('recipes.errors.fridgeNetworkError')
  );

  return parseAnthropicJson<FridgeAnalysis>(t, response, t('recipes.actions.fridgeAnalysis'));
}
