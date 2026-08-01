import type { Profile } from '../context/ProfileContext';
import { ANTHROPIC_API_URL, ANTHROPIC_MODEL, anthropicHeaders, describeAnthropicError } from './anthropic';

// No Anthropic SDK here on purpose: the SDK is a Node package (it pulls in
// `node:fs` at import time), and React Native has no Node standard library —
// bundling it breaks the app. Call the REST API directly with `fetch`
// instead. Follow this same pattern for every future Anthropic call in this
// app (e.g. the meal scanner) — never import `@anthropic-ai/sdk` here.
const MAX_TOKENS = 1000;

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

type AnthropicMessageResponse = {
  content: { type: string; text?: string }[];
};

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

function buildSystemPrompt(profile: Profile | null): string {
  const lines = [
    "Tu es GlowUp, le coach fitness et bien-être IA de l'application. Tu tutoies toujours l'utilisateur et tu réponds uniquement en français.",
    'Réponds en 2 à 4 phrases courtes maximum. Ton style est motivant mais direct : pas de blabla, pas de formules toutes faites, va droit au but.',
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

  return lines.join('\n');
}

export async function sendMessage(history: ChatMessage[], profile: Profile | null): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Clé API Anthropic manquante. Ajoute EXPO_PUBLIC_ANTHROPIC_API_KEY dans ton fichier .env."
    );
  }

  // Empty content is rejected outright; consecutive same-role turns are merged so the
  // request always alternates strictly, regardless of what shape the caller's history is in.
  const messages = mergeConsecutiveRoles(history.filter((message) => message.content.trim().length > 0));

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: anthropicHeaders(apiKey),
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        system: buildSystemPrompt(profile),
        messages: messages.map((message) => ({ role: message.role, content: message.content })),
      }),
    });
  } catch {
    throw new Error('Impossible de contacter le coach. Vérifie ta connexion internet et réessaie.');
  }

  if (!response.ok) {
    throw new Error(await describeAnthropicError(response, "Le coach n'a pas pu répondre"));
  }

  let data: AnthropicMessageResponse;
  try {
    data = (await response.json()) as AnthropicMessageResponse;
  } catch {
    throw new Error('Réponse du coach illisible. Réessaie dans un instant.');
  }

  const text = data.content?.[0]?.text;
  if (!text) {
    throw new Error('Le coach n’a pas renvoyé de réponse.');
  }

  return text;
}
