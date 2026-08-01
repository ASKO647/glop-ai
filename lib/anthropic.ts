// Shared by every direct-fetch call to the Anthropic Messages API (lib/coach.ts,
// lib/foodScanner.ts). No @anthropic-ai/sdk anywhere in this app — it's a Node
// package (imports `node:fs` at import time) and breaks the React Native bundle.
// Every future Anthropic call must reuse this file rather than duplicating these
// values or re-deriving its own error messages.

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

/**
 * Logs the full response body from a failed Anthropic call — the API's own error message
 * names the exact problem (bad field, broken role sequence, etc.), which a bare status code
 * never does — then returns a French message tailored to the status code for the UI.
 */
export async function describeAnthropicError(response: Response, action: string): Promise<string> {
  const body = await response.text().catch(() => '');
  console.error(`[Anthropic] ${action} — HTTP ${response.status}:`, body);

  switch (response.status) {
    case 401:
      return `${action} : clé API Anthropic invalide ou expirée.`;
    case 402:
      return `${action} : crédit Anthropic insuffisant. Recharge le compte Anthropic pour continuer.`;
    case 429:
      return `${action} : trop de requêtes envoyées à l'IA pour le moment. Réessaie dans quelques instants.`;
    case 400:
      return `${action} : la requête envoyée était invalide. Réessaie dans un instant.`;
    default:
      return `${action} (erreur ${response.status}). Réessaie dans un instant.`;
  }
}
