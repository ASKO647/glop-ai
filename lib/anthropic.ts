// Shared by every direct-fetch call to the Anthropic Messages API (lib/coach.ts,
// lib/foodScanner.ts). No @anthropic-ai/sdk anywhere in this app — it's a Node
// package (imports `node:fs` at import time) and breaks the React Native bundle.
// Every future Anthropic call must reuse this file rather than duplicating these
// values or re-deriving its own error messages.

import { LOCALE_NAME_FR, type Locale } from './i18n';

export const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_VERSION = '2023-06-01';

// claude-sonnet-4-6 doesn't exist — that name was producing 400s from every caller.
export const ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250929';

export function anthropicHeaders(apiKey: string): Record<string, string> {
  return {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': ANTHROPIC_VERSION,
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}

/** Strips a ```json ... ``` (or bare ```) fence Claude sometimes wraps its JSON response in. */
export function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

/**
 * Appended to every Anthropic system prompt (coach, scanner, recipes, progress analysis) so the
 * model answers in the user's active app language — the prompts themselves stay authored in
 * French, this is just an explicit language override for the reply.
 */
export function languageInstruction(locale: Locale): string {
  return `Réponds toujours en ${LOCALE_NAME_FR[locale]}, quelle que soit la langue utilisée ci-dessus.`;
}

type Translate = (key: string, params?: Record<string, string | number>) => string;

/**
 * Logs the full response body from a failed Anthropic call — the API's own error message
 * names the exact problem (bad field, broken role sequence, etc.), which a bare status code
 * never does — then returns a localized message tailored to the status code for the UI.
 */
export async function describeAnthropicError(t: Translate, response: Response, action: string): Promise<string> {
  const body = await response.text().catch(() => '');
  console.error(`[Anthropic] ${action} — HTTP ${response.status}:`, body);

  switch (response.status) {
    case 401:
      return t('errors.anthropic.invalidKey', { action });
    case 402:
      return t('errors.anthropic.insufficientCredit', { action });
    case 429:
      return t('errors.anthropic.rateLimited', { action });
    case 400:
      return t('errors.anthropic.invalidRequest', { action });
    default:
      return t('errors.anthropic.unknown', { action, status: response.status });
  }
}
