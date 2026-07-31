import Anthropic from '@anthropic-ai/sdk';
import type { Profile } from '../context/ProfileContext';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1000;

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

// Client-side key by design (EXPO_PUBLIC_*) — this app has no backend yet.
const client = apiKey ? new Anthropic({ apiKey, dangerouslyAllowBrowser: true }) : null;

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
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
  if (!client) {
    throw new Error(
      "Clé API Anthropic manquante. Ajoute EXPO_PUBLIC_ANTHROPIC_API_KEY dans ton fichier .env."
    );
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemPrompt(profile),
    messages: history.map((message) => ({ role: message.role, content: message.content })),
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Le coach n’a pas renvoyé de réponse.');
  }

  return textBlock.text;
}
