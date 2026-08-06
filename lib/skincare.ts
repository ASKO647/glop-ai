import {
  ANTHROPIC_API_URL,
  ANTHROPIC_MODEL,
  anthropicHeaders,
  describeAnthropicError,
  languageInstruction,
  stripJsonFences,
} from './anthropic';
import type { Locale } from './i18n';

// Same rule as lib/coach.ts, lib/foodScanner.ts and lib/progressAnalysis.ts: no Anthropic SDK,
// ever — raw `fetch` only.
const MAX_TOKENS = 1200;

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export type SkincareProduct = { nom: string; usage: string; prix_indicatif: string };

export type EvolutionAnalysis = {
  resume: string;
  ameliorations: string[];
  points_attention: string[];
  conseils: string[];
  produits_suggeres: SkincareProduct[];
};

export type ProblemAnalysis = {
  zone: string;
  observation: string;
  causes_probables: string[];
  actions: string[];
  produits_suggeres: SkincareProduct[];
  delai_amelioration: string;
};

export type SkincareError = { erreur: string };

/** A photo already uploaded to the `skin-photos` bucket — only the signed URL is needed to send it to the model. */
export type AnalyzableSkinPhoto = { signedUrl: string };

type AnthropicMessageResponse = {
  content: { type: string; text?: string }[];
};

// Guardrails shared by both prompts, word for word — deviating between the two would only
// invite one of them to drift out of compliance over time.
const GUARDRAILS = [
  'Règles strictes, à respecter en toute circonstance, sans aucune exception :',
  "- Ne pose jamais de diagnostic médical et ne nomme jamais de pathologie (n'utilise pas de termes comme \"acné\", \"eczéma\", \"rosacée\", \"dermatite\" en tant que diagnostic — décris uniquement ce qui est visible sur la photo, de façon descriptive).",
  '- Formulation toujours factuelle et bienveillante, jamais dévalorisante sur l\'apparence de la personne.',
  '- Ne suggère que des cosmétiques en vente libre (nettoyants, crèmes, sérums, protections solaires...) — jamais de traitement sur ordonnance, jamais de complément alimentaire.',
  '- Réponds uniquement en JSON valide, sans balises markdown, sans aucun texte hors du JSON demandé.',
  "- Si la photo ne montre pas de peau humaine, ou si son contenu est inapproprié, réponds uniquement avec : {\"erreur\":\"...\"} (un message expliquant pourquoi, dans le champ \"erreur\"), sans aucun autre champ.",
].join('\n');

const DERMATOLOGIST_LINE = 'Pour un problème persistant ou douloureux, consulte un dermatologue.';

function buildSystemPrompt(locale: Locale): string {
  return `Tu es un assistant skincare bienveillant qui observe des photos de peau et propose des conseils cosmétiques généraux.\n\n${GUARDRAILS}\n\n${languageInstruction(locale)}`;
}

const EVOLUTION_PROMPT = `Ces deux photos montrent la même personne : la première ("avant") et la plus récente ("maintenant"). Compare-les et décris l'évolution visible de la peau.

Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après, et sans balises markdown (pas de \`\`\`json), au format exact suivant :

{"resume":"...","ameliorations":["..."],"points_attention":["..."],"conseils":["..."],"produits_suggeres":[{"nom":"...","usage":"...","prix_indicatif":"..."}]}

- "resume" : 2 à 3 phrases décrivant l'évolution visible entre les deux photos.
- "ameliorations" : 1 à 4 changements positifs visibles (tableau vide si aucun n'est observable — ne jamais en inventer).
- "points_attention" : 1 à 4 points qui méritent de l'attention, formulés de façon factuelle et constructive, jamais dévalorisante.
- "conseils" : 2 à 4 conseils skincare concrets. Le DERNIER élément de ce tableau doit être exactement : "${DERMATOLOGIST_LINE}"
- "produits_suggeres" : 1 à 3 cosmétiques en vente libre pertinents, chacun avec son usage et une fourchette de prix indicative.

Si le contenu d'une des deux photos ne montre pas de peau humaine ou est inapproprié, ignore tout ce qui précède et réponds uniquement avec {"erreur":"..."}.`;

const PROBLEM_PROMPT = `Cette photo montre une zone de peau que l'utilisateur souhaite faire analyser. Observe-la et identifie la zone concernée.

Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après, et sans balises markdown (pas de \`\`\`json), au format exact suivant :

{"zone":"...","observation":"...","causes_probables":["..."],"actions":["..."],"produits_suggeres":[{"nom":"...","usage":"...","prix_indicatif":"..."}],"delai_amelioration":"..."}

- "zone" : la zone du visage ou du corps concernée (ex : "Joue gauche", "Front").
- "observation" : 1 à 2 phrases factuelles décrivant ce qui est visible, sans poser de diagnostic ni nommer de pathologie.
- "causes_probables" : 1 à 3 causes courantes et non médicales pouvant expliquer ce type d'observation (ex : manque d'hydratation, exposition au soleil, frottement).
- "actions" : 2 à 4 actions concrètes recommandées. Le DERNIER élément de ce tableau doit être exactement : "${DERMATOLOGIST_LINE}"
- "produits_suggeres" : 1 à 3 cosmétiques en vente libre pertinents, chacun avec son usage et une fourchette de prix indicative.
- "delai_amelioration" : une estimation textuelle courte du délai avant une amélioration visible avec des soins adaptés (ex : "2 à 4 semaines").

Si le contenu de la photo ne montre pas de peau humaine ou est inapproprié, ignore tout ce qui précède et réponds uniquement avec {"erreur":"..."}.`;

/** Fetches a (signed-URL) image and returns its raw base64 body — same approach as `lib/progressAnalysis.ts`'s photo comparison. */
async function fetchImageAsBase64(url: string, t: TranslateFn): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(t('skincare.errors.fetchPhotoNetwork'));
  }
  if (!response.ok) {
    throw new Error(t('skincare.errors.fetchPhotoFailed'));
  }
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(t('skincare.errors.readPhotoFailed')));
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? '';
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

async function postSkincareAnalysis<T>(
  content: Array<{ type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }>,
  locale: Locale,
  t: TranslateFn,
  action: string
): Promise<T | SkincareError> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(t('skincare.errors.missingApiKey'));
  }

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: anthropicHeaders(apiKey),
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        system: buildSystemPrompt(locale),
        messages: [{ role: 'user', content }],
      }),
    });
  } catch {
    throw new Error(t('skincare.errors.networkError'));
  }

  if (!response.ok) {
    throw new Error(await describeAnthropicError(t, response, action));
  }

  let data: AnthropicMessageResponse;
  try {
    data = (await response.json()) as AnthropicMessageResponse;
  } catch {
    throw new Error(t('skincare.errors.unreadableResponse'));
  }

  const text = data.content?.[0]?.text;
  if (!text) {
    throw new Error(t('skincare.errors.noResult'));
  }

  try {
    return JSON.parse(stripJsonFences(text)) as T | SkincareError;
  } catch {
    throw new Error(t('skincare.errors.unreadableResult'));
  }
}

export function isSkincareError(result: unknown): result is SkincareError {
  return !!result && typeof result === 'object' && 'erreur' in result;
}

/** Compares the "before" and "now" evolution photos and returns the parsed analysis (or `{erreur}` if a photo is unusable). */
export async function analyzeEvolution(
  before: AnalyzableSkinPhoto,
  now: AnalyzableSkinPhoto,
  locale: Locale,
  t: TranslateFn
): Promise<EvolutionAnalysis | SkincareError> {
  const [beforeBase64, nowBase64] = await Promise.all([
    fetchImageAsBase64(before.signedUrl, t),
    fetchImageAsBase64(now.signedUrl, t),
  ]);

  const content: Array<{ type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }> = [
    { type: 'text', text: 'Photo "avant"' },
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: beforeBase64 } },
    { type: 'text', text: 'Photo "maintenant"' },
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: nowBase64 } },
    { type: 'text', text: EVOLUTION_PROMPT },
  ];

  return postSkincareAnalysis<EvolutionAnalysis>(content, locale, t, t('skincare.actions.evolutionAnalysis'));
}

/** Analyzes a single problem-area photo and returns the parsed analysis (or `{erreur}` if the photo is unusable). */
export async function analyzeProblem(photo: AnalyzableSkinPhoto, locale: Locale, t: TranslateFn): Promise<ProblemAnalysis | SkincareError> {
  const base64 = await fetchImageAsBase64(photo.signedUrl, t);

  const content: Array<{ type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }> = [
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
    { type: 'text', text: PROBLEM_PROMPT },
  ];

  return postSkincareAnalysis<ProblemAnalysis>(content, locale, t, t('skincare.actions.problemAnalysis'));
}
