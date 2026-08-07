import type { Profile } from '../context/ProfileContext';
import {
  ANTHROPIC_API_URL,
  ANTHROPIC_MODEL,
  anthropicHeaders,
  describeAnthropicError,
  extractJsonObject,
  FAST_MODEL,
  languageInstruction,
} from './anthropic';
import type { Locale } from './i18n';

// No Anthropic SDK here on purpose: the SDK is a Node package (it pulls in
// `node:fs` at import time), and React Native has no Node standard library —
// bundling it breaks the app. Call the REST API directly with `fetch`
// instead. Follow this same pattern for every future Anthropic call in this
// app (e.g. the meal scanner) — never import `@anthropic-ai/sdk` here.
// Bumped from 1000: a web-search-augmented reply carries citations/tool blocks in the same
// response budget as the visible text, even though the visible text itself stays short-form.
const MAX_TOKENS = 1500;
// Product questions ("où acheter", "quelle marque") legitimately need a search; anything else
// (motivation, general advice) should never trigger one — capped at 3 to bound latency either way.
const WEB_SEARCH_MAX_USES = 3;
// Enough room for {"approuve": false, "raison": "..."} without truncating mid-string — the
// previous 20-token budget was cutting the "raison" field off before its closing quote/brace,
// which is one of the ways the response ended up unparseable.
const MODERATION_MAX_TOKENS = 60;

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatImage = { base64: string; mimeType: string };

type AnthropicContentBlock = { type: string; text?: string };

type AnthropicMessageResponse = {
  content: AnthropicContentBlock[];
};

type Translate = (key: string, params?: Record<string, string | number>) => string;

/**
 * The Messages API requires strict user/assistant alternation. A caller's history can break
 * that without doing anything wrong — e.g. a failed reply leaves a user turn unanswered, and
 * the next message the user sends is then genuinely a second consecutive "user" turn. Rather
 * than rely on every caller to prevent that, merge consecutive same-role messages into one.
 */
function mergeConsecutiveRoles(history: ChatMessage[]): ChatMessage[] {
  const merged: ChatMessage[] = [];
  for (const message of history) {
    const last = merged[merged.length - 1];
    if (last && last.role === message.role) {
      last.content = `${last.content}\n\n${message.content}`;
    } else {
      merged.push({ ...message });
    }
  }
  return merged;
}

/** Concatenates every `text` block in a response — a web-search-augmented reply mixes `text` blocks with `server_tool_use`/`web_search_tool_result` blocks that carry no visible reply text of their own. */
function extractReplyText(content: AnthropicContentBlock[] | undefined): string {
  return (content ?? [])
    .filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text)
    .join('\n\n')
    .trim();
}

// A rough client-side heuristic only — the web_search tool runs server-side inside a single
// non-streaming response, so there's no live signal to know a search actually started. Used
// purely to pick which typing-indicator copy to show while waiting, not to gate the request
// itself (the model decides on its own, per the system prompt, whether to search).
const PRODUCT_QUERY_KEYWORDS =
  /\b(acheter|achete|prix|co(u|û)te|marque|produit|o[uù] trouver|recommand|meilleur[e]?s? .*(pour|contre)|shampoing|cr[eè]me|s[eé]rum|compl[eé]ment|appareil|mat[eé]riel|[eé]quipement)\b/i;

export function isLikelyProductQuery(text: string): boolean {
  return PRODUCT_QUERY_KEYWORDS.test(text);
}

function buildSystemPrompt(profile: Profile | null, locale: Locale): string {
  const lines = [
    "Tu es GlowUp, le coach fitness et bien-être IA de l'application. Tu tutoies toujours l'utilisateur et tu réponds uniquement en français.",
    'Réponds en 2 à 4 phrases courtes maximum. Ton style est motivant mais direct : pas de blabla, pas de formules toutes faites, va droit au but.',
    '',
    "Recherche web : n'utilise l'outil de recherche que pour des questions portant sur des produits, des marques, des prix ou des informations récentes — jamais pour de la motivation ou des conseils généraux, qui ne nécessitent aucune recherche.",
    'Quand tu recommandes un produit trouvé par la recherche : donne son nom exact, une fourchette de prix et où l\'acheter, en privilégiant les enseignes françaises.',
    'Tu ne recommandes jamais de compléments alimentaires, de médicaments, ni de traitements dermatologiques sur ordonnance. Pour tout problème de peau persistant, oriente vers un dermatologue.',
  ];

  if (profile) {
    const facts: string[] = [];
    if (profile.objectif) facts.push(`Objectif : ${profile.objectif}`);
    if (profile.poids_actuel != null) facts.push(`Poids actuel : ${profile.poids_actuel} kg`);
    if (profile.poids_objectif != null) facts.push(`Poids cible : ${profile.poids_objectif} kg`);
    if (profile.niveau_activite) facts.push(`Niveau d'activité : ${profile.niveau_activite}`);
    if (profile.restrictions && profile.restrictions.length > 0) {
      facts.push(`Restrictions alimentaires : ${profile.restrictions.join(', ')}`);
    }

    if (facts.length > 0) {
      lines.push('', "Ce que tu sais sur l'utilisateur :", ...facts.map((fact) => `- ${fact}`));
    }
  }

  lines.push(languageInstruction(locale));

  return lines.join('\n');
}

export async function sendMessage(
  history: ChatMessage[],
  profile: Profile | null,
  locale: Locale,
  t: Translate,
  image?: ChatImage
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(t('coach.errors.missingApiKey'));
  }

  // Empty content is rejected outright; consecutive same-role turns are merged so the
  // request always alternates strictly, regardless of what shape the caller's history is in.
  const messages = mergeConsecutiveRoles(history.filter((message) => message.content.trim().length > 0 || image));

  const apiMessages = messages.map((message, index) => {
    const isLast = index === messages.length - 1;
    if (!isLast || !image) {
      return { role: message.role, content: message.content };
    }
    const content: Array<
      { type: 'image'; source: { type: 'base64'; media_type: string; data: string } } | { type: 'text'; text: string }
    > = [{ type: 'image', source: { type: 'base64', media_type: image.mimeType, data: image.base64 } }];
    if (message.content.trim().length > 0) content.push({ type: 'text', text: message.content });
    return { role: message.role, content };
  });

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: anthropicHeaders(apiKey),
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        system: buildSystemPrompt(profile, locale),
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: WEB_SEARCH_MAX_USES }],
        messages: apiMessages,
      }),
    });
  } catch {
    throw new Error(t('coach.errors.networkError'));
  }

  if (!response.ok) {
    throw new Error(await describeAnthropicError(t, response, t('coach.errors.failedAction')));
  }

  let data: AnthropicMessageResponse;
  try {
    data = (await response.json()) as AnthropicMessageResponse;
  } catch {
    throw new Error(t('coach.errors.unreadableResponse'));
  }

  const text = extractReplyText(data.content);
  if (!text) {
    throw new Error(t('coach.errors.emptyResponse'));
  }

  return text;
}

const MODERATION_PROMPT = `Cette image va être envoyée à un coach fitness/bien-être IA dans une conversation de chat. Détermine si elle est appropriée à transmettre : refuse toute image contenant de la nudité ou du contenu suggestif, et toute image sans rapport avec la santé, l'alimentation, le sport ou la peau.

Réponds UNIQUEMENT en JSON, sans texte d'introduction, sans explication, sans balises markdown. Format exact : {"approuve": true} si l'image est appropriée, ou {"approuve": false, "raison": "..."} sinon (raison brève, en français).`;

// The prompt above already says "JSON only", but the model still sometimes opens with a
// sentence of prose regardless. The Messages API resumes generation from the exact text of a
// supplied assistant turn, so seeding one with "{" makes a JSON object the only thing it can
// produce — cheaper and more reliable than asking nicely a second time.
const JSON_PREFILL = '{';

export type ModerationOutcome = 'approved' | 'rejected' | 'check_failed';

/**
 * Pre-send moderation check, run before any upload — an image is never stored or transmitted
 * to the coach conversation unless this returns `'approved'`. Distinguishes a real rejection
 * (`'rejected'`) from the check itself failing (`'check_failed'`: network error, non-2xx, or an
 * unparseable/malformed response) so the caller can show a different message for each rather
 * than silently treating both as "inappropriate image" — either way sending is blocked, never
 * left to throw uncaught.
 */
export async function moderateCoachImage(image: ChatImage): Promise<ModerationOutcome> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) return 'check_failed';

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: anthropicHeaders(apiKey),
      body: JSON.stringify({
        model: FAST_MODEL,
        max_tokens: MODERATION_MAX_TOKENS,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: image.mimeType, data: image.base64 } },
              { type: 'text', text: MODERATION_PROMPT },
            ],
          },
          { role: 'assistant', content: JSON_PREFILL },
        ],
      }),
    });
    if (!response.ok) {
      console.error(`[Coach] Moderation check failed — HTTP ${response.status}`);
      return 'check_failed';
    }

    const data = (await response.json()) as AnthropicMessageResponse;
    // The prefill isn't echoed back in the response — the model continues from where it left
    // off, so it has to be prepended before this is valid JSON again.
    const rawText = JSON_PREFILL + extractReplyText(data.content);
    console.log('[Coach] Moderation raw response:', rawText);

    const parsed = JSON.parse(extractJsonObject(rawText)) as { approuve?: boolean; raison?: string };
    if (typeof parsed.approuve !== 'boolean') {
      console.error('[Coach] Moderation response missing a boolean "approuve" field:', rawText);
      return 'check_failed';
    }
    return parsed.approuve ? 'approved' : 'rejected';
  } catch (err) {
    console.error('Coach image moderation check failed:', err);
    return 'check_failed';
  }
}
