import { toISODate } from './dashboard';

export type FastingProgramId = '16:8' | '18:6' | '20:4' | '14:10' | 'custom';

export type FastingProgramDef = {
  id: FastingProgramId;
  label: string;
  /** Target fasting duration in hours. `null` for "Personnalisé", whose duration is user-chosen. */
  hours: number | null;
  description: string;
};

export const FASTING_PROGRAMS: FastingProgramDef[] = [
  { id: '16:8', label: '16:8', hours: 16, description: '16h de jeûne, 8h de fenêtre alimentaire — le plus courant' },
  { id: '18:6', label: '18:6', hours: 18, description: '18h de jeûne' },
  { id: '20:4', label: '20:4', hours: 20, description: '20h de jeûne' },
  { id: '14:10', label: '14:10', hours: 14, description: '14h de jeûne, adapté aux débutants' },
  { id: 'custom', label: 'Personnalisé', hours: null, description: 'Durée libre entre 12 et 24h' },
];

export const CUSTOM_FASTING_MIN_HOURS = 12;
export const CUSTOM_FASTING_MAX_HOURS = 24;
export const DEFAULT_CUSTOM_FASTING_HOURS = 16;

export function clampCustomHours(hours: number): number {
  return Math.min(CUSTOM_FASTING_MAX_HOURS, Math.max(CUSTOM_FASTING_MIN_HOURS, Math.round(hours)));
}

export type ResolvedFastingProgram = {
  /** 'custom' for a free duration, otherwise the matching preset id. */
  programId: FastingProgramId;
  /** Display label — the preset label, or "Xh" for a custom duration (more informative than "Personnalisé" alone). */
  label: string;
  targetHours: number;
};

/**
 * `user_settings.programme_jeune` only has room for a single text column, so it stores either a
 * preset id ('16:8', '18:6', ...) or, for a custom duration, the plain hour count as a numeric
 * string (e.g. "15") — there's no separate column for the custom hour value. This resolves either
 * form back into a usable target duration, falling back to 16:8 if the value is unrecognized.
 */
export function resolveProgramSetting(programmeJeune: string): ResolvedFastingProgram {
  const preset = FASTING_PROGRAMS.find((p) => p.id === programmeJeune && p.hours != null);
  if (preset && preset.hours != null) {
    return { programId: preset.id, label: preset.label, targetHours: preset.hours };
  }

  const customHours = parseInt(programmeJeune, 10);
  if (!Number.isNaN(customHours)) {
    const targetHours = clampCustomHours(customHours);
    return { programId: 'custom', label: `${targetHours}h`, targetHours };
  }

  const fallback = FASTING_PROGRAMS[0];
  return { programId: fallback.id, label: fallback.label, targetHours: fallback.hours! };
}

/** "12h 34m" — zero-padded minutes. */
export function formatDurationHM(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

/** "20h30" — used for start/end-of-fast timestamps. */
export function formatHourMinute(date: Date): string {
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${date.getHours()}h${minutes}`;
}

export function computeExpectedEnd(debut: Date, targetHours: number): Date {
  return new Date(debut.getTime() + targetHours * 3600000);
}

export function computeFastingPercent(elapsedMs: number, targetHours: number): number {
  if (targetHours <= 0) return 0;
  const percent = (elapsedMs / (targetHours * 3600000)) * 100;
  return Math.min(100, Math.max(0, percent));
}

export type FastingSessionLike = {
  debut: string;
  fin: string | null;
};

export type FastingStats = {
  totalCount: number;
  averageDurationMs: number;
  longestDurationMs: number;
  currentStreakDays: number;
};

/**
 * Total/average/longest only consider completed sessions (an in-progress fast has no final
 * duration yet). The streak counts consecutive local-calendar days with at least one session
 * started (active or completed) — starting today's fast should immediately extend the streak,
 * mirroring `computeStreak` in `constants/dashboard.ts`.
 */
export function computeFastingStats(sessions: FastingSessionLike[]): FastingStats {
  const completed = sessions.filter((s) => s.fin != null);
  const durations = completed.map((s) => new Date(s.fin as string).getTime() - new Date(s.debut).getTime());
  const totalCount = completed.length;
  const averageDurationMs = totalCount > 0 ? durations.reduce((a, b) => a + b, 0) / totalCount : 0;
  const longestDurationMs = totalCount > 0 ? Math.max(...durations) : 0;

  const daysWithSession = new Set(sessions.map((s) => toISODate(new Date(s.debut))));
  let currentStreakDays = 0;
  const cursor = new Date();
  if (!daysWithSession.has(toISODate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const iso = toISODate(cursor);
    if (!daysWithSession.has(iso)) break;
    currentStreakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { totalCount, averageDurationMs, longestDurationMs, currentStreakDays };
}
