import { formatDisplayDate } from '../constants/dashboard';
import { formatWeight } from '../constants/progression';
import { SLOT_LABELS, type ProgressPhoto } from '../hooks/useProgressPhotos';
import { ANTHROPIC_API_URL, ANTHROPIC_MODEL, anthropicHeaders, describeAnthropicError, stripJsonFences } from './anthropic';

// Same rule as lib/coach.ts and lib/foodScanner.ts: no Anthropic SDK, ever — raw `fetch` only.
const MAX_TOKENS = 1000;

const ANALYSIS_INSTRUCTIONS = `Compare ces photos de progression et décris l'évolution physique visible entre elles.

Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après, et sans balises markdown (pas de \`\`\`json), au format exact suivant :

{"resume":"2-3 phrases sur l'évolution visible","points_positifs":["...","..."],"axes_travail":["...","..."],"score":0}

- "resume" : 2 à 3 phrases décrivant l'évolution visible entre les photos.
- "points_positifs" : 2 à 4 changements positifs visibles.
- "axes_travail" : 2 à 4 axes que l'utilisateur peut continuer à travailler, formulés de façon constructive et encourageante.
- "score" : note de progression visible sur 100 (nombre entier).

Si une seule photo est fournie ou si aucune évolution n'est observable, adapte le résumé en conséquence sans inventer de changement.`;

export type ProfileSummary = {
  objectif: string | null;
  poidsDepart: number | null;
  poidsActuel: number | null;
  poidsObjectif: number | null;
};

export type ProgressAnalysis = {
  resume: string;
  points_positifs: string[];
  axes_travail: string[];
  score: number;
};

type AnthropicMessageResponse = {
  content: { type: string; text?: string }[];
};

function buildSystemPrompt(profile: ProfileSummary): string {
  const lines = [
    "Tu es un coach fitness bienveillant qui compare des photos de progression prises par l'utilisateur au fil du temps.",
    '',
    'Règles strictes, à respecter en toute circonstance :',
    '- Commente uniquement des changements physiques visibles et objectifs (posture, silhouette, définition musculaire, etc.).',
    "- Ne fais jamais de remarque dévalorisante ou négative sur l'apparence de la personne, même formulée comme un axe de travail.",
    "- Ne donne aucun conseil médical, nutritionnel ou d'entraînement présenté comme un diagnostic — reste sur l'observation de la progression visible, pas sur des recommandations de santé.",
    '- Réponds uniquement en JSON valide, sans aucun texte hors du JSON demandé.',
  ];
  if (profile.objectif) lines.push(`Objectif de l'utilisateur : ${profile.objectif}.`);
  if (profile.poidsDepart != null) lines.push(`Poids de départ : ${formatWeight(profile.poidsDepart)} kg.`);
  if (profile.poidsActuel != null) lines.push(`Poids actuel : ${formatWeight(profile.poidsActuel)} kg.`);
  if (profile.poidsObjectif != null) lines.push(`Poids objectif : ${formatWeight(profile.poidsObjectif)} kg.`);
  return lines.join('\n');
}

/** Fetches a (signed-URL) image and returns its raw base64 body, for photos already in Storage rather than a fresh local URI. */
async function fetchImageAsBase64(url: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error("Impossible de récupérer une des photos pour l'analyse. Vérifie ta connexion et réessaie.");
  }
  if (!response.ok) {
    throw new Error("Impossible de récupérer une des photos pour l'analyse. Réessaie.");
  }
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire une des photos pour l'analyse. Réessaie."));
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] ?? '';
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

/** Sends the given progress photos (in order) + profile context to Claude and returns the parsed comparison. */
export async function analyzeProgress(photos: ProgressPhoto[], profile: ProfileSummary): Promise<ProgressAnalysis> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Clé API Anthropic manquante. Ajoute EXPO_PUBLIC_ANTHROPIC_API_KEY dans ton fichier .env.");
  }

  const withUrls = photos.filter((photo): photo is ProgressPhoto & { signedUrl: string } => !!photo.signedUrl);
  if (withUrls.length === 0) {
    throw new Error('Aucune photo disponible pour lancer l\'analyse.');
  }

  const content: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  > = [];

  for (const photo of withUrls) {
    const weightText = photo.poids != null ? `, poids : ${formatWeight(photo.poids)} kg` : '';
    content.push({ type: 'text', text: `Photo "${SLOT_LABELS[photo.slot]}" — ${formatDisplayDate(photo.date)}${weightText}` });
    const base64 = await fetchImageAsBase64(photo.signedUrl);
    content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } });
  }
  content.push({ type: 'text', text: ANALYSIS_INSTRUCTIONS });

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: anthropicHeaders(apiKey),
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        system: buildSystemPrompt(profile),
        messages: [{ role: 'user', content }],
      }),
    });
  } catch {
    throw new Error("Impossible d'analyser ta progression. Vérifie ta connexion internet et réessaie.");
  }

  if (!response.ok) {
    throw new Error(await describeAnthropicError(response, "L'analyse a échoué"));
  }

  let data: AnthropicMessageResponse;
  try {
    data = (await response.json()) as AnthropicMessageResponse;
  } catch {
    throw new Error('Réponse illisible. Réessaie dans un instant.');
  }

  const text = data.content?.[0]?.text;
  if (!text) {
    throw new Error("L'analyse n'a renvoyé aucun résultat. Réessaie.");
  }

  try {
    return JSON.parse(stripJsonFences(text)) as ProgressAnalysis;
  } catch {
    throw new Error("Impossible de lire le résultat de l'analyse. Réessaie.");
  }
}
