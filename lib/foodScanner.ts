import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { ANTHROPIC_API_URL, ANTHROPIC_MODEL, anthropicHeaders, describeAnthropicError, languageInstruction, stripJsonFences } from './anthropic';
import type { Locale } from './i18n';

// Same rule as lib/coach.ts: no Anthropic SDK, ever — it pulls in `node:fs`
// and breaks the React Native bundle. Raw `fetch` only.
const MAX_TOKENS = 1000;

const MAX_WIDTH = 1024;
const COMPRESS_QUALITY = 0.5;

const ANALYSIS_PROMPT = `Analyse cette photo de repas. Identifie le plat principal et ses composants visibles, puis estime les valeurs nutritionnelles totales pour la portion visible sur la photo.

Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après, et sans balises markdown (pas de \`\`\`json), au format exact suivant :

{"nom":"Nom du plat","kcal":0,"proteines":0,"glucides":0,"lipides":0,"aliments":[{"nom":"...","portion":"..."}]}

- "kcal" est le total de calories estimées pour l'assiette entière (nombre entier).
- "proteines", "glucides" et "lipides" sont en grammes, pour le total de l'assiette (nombres entiers).
- "aliments" liste chaque aliment identifiable avec une portion estimée en texte court (ex: "150g", "1 portion", "2 tranches").

Si aucun aliment n'est visible sur la photo, réponds uniquement avec : {"erreur":"Aucun aliment détecté"}`;

export type MealAnalysis = {
  nom: string;
  kcal: number;
  proteines: number;
  glucides: number;
  lipides: number;
  aliments: { nom: string; portion: string }[];
};

export type MealAnalysisError = {
  erreur: string;
};

type AnthropicMessageResponse = {
  content: { type: string; text?: string }[];
};

export type CompressedImage = {
  base64: string;
  mimeType: string;
};

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** Downscales to at most 1024px wide (never upscales), re-encodes as JPEG at the given quality (0.5 by default). */
export async function compressImage(
  uri: string,
  originalWidth: number,
  t: Translate,
  quality: number = COMPRESS_QUALITY
): Promise<CompressedImage> {
  const targetWidth = originalWidth > 0 ? Math.min(originalWidth, MAX_WIDTH) : MAX_WIDTH;

  const context = ImageManipulator.manipulate(uri).resize({ width: targetWidth });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    compress: quality,
    format: SaveFormat.JPEG,
    base64: true,
  });

  if (!result.base64) {
    throw new Error(t('scanner.errors.prepareFailed'));
  }

  return { base64: result.base64, mimeType: 'image/jpeg' };
}

export async function analyzeMeal(
  base64Image: string,
  mimeType: string,
  locale: Locale,
  t: Translate
): Promise<MealAnalysis | MealAnalysisError> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(t('scanner.errors.missingApiKey'));
  }

  // Defensive: strip a data-URI prefix if one ever slips in — Anthropic expects raw base64
  // in `data`. compressImage() already returns a bare base64 string, so this is a no-op today.
  const rawBase64 = base64Image.replace(/^data:[^;]+;base64,/, '');

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: anthropicHeaders(apiKey),
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        system: languageInstruction(locale),
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mimeType, data: rawBase64 } },
              { type: 'text', text: ANALYSIS_PROMPT },
            ],
          },
        ],
      }),
    });
  } catch {
    throw new Error(t('scanner.errors.networkError'));
  }

  if (!response.ok) {
    throw new Error(await describeAnthropicError(t, response, t('scanner.errors.failedAction')));
  }

  let data: AnthropicMessageResponse;
  try {
    data = (await response.json()) as AnthropicMessageResponse;
  } catch {
    throw new Error(t('scanner.errors.unreadableResponse'));
  }

  const text = data.content?.[0]?.text;
  if (!text) {
    throw new Error(t('scanner.errors.emptyResult'));
  }

  try {
    return JSON.parse(stripJsonFences(text)) as MealAnalysis | MealAnalysisError;
  } catch {
    throw new Error(t('scanner.errors.unparsableResult'));
  }
}
