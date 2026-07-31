import type { Profile } from '../context/ProfileContext';

// No Anthropic SDK here on purpose: the SDK is a Node package (it pulls in
// `node:fs` at import time), and React Native has no Node standard library —
// bundling it breaks the app. Call the REST API directly with `fetch`
// instead. Follow this same pattern for every future Anthropic call in this
// app (e.g. the meal scanner) — never import `@anthropic-ai/sdk` here.
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1000;

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

type AnthropicMessageResponse = {
  content: { type: string; text?: string }[];
};

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

  let response: Response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: buildSystemPrompt(profile),
        messages: history.map((message) => ({ role: message.role, content: message.content })),
      }),
    });
  } catch {
    throw new Error('Impossible de contacter le coach. Vérifie ta connexion internet et réessaie.');
  }

  if (!response.ok) {
    throw new Error(`Le coach n'a pas pu répondre (erreur ${response.status}). Réessaie dans un instant.`);
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
