import { Clock } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  computeExpectedEnd,
  computeFastingPercent,
  formatDurationHM,
  formatHourMinute,
} from '../../constants/fasting';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { hexToRgba } from '../../lib/color';
import CalorieRing from './CalorieRing';

type ActiveFastingSession = {
  debut: string;
  targetHours: number;
};

type FastingCardProps = {
  activeSession: ActiveFastingSession | null;
  elapsedMs: number;
  currentProgramLabel: string;
  lastCompletedTodayMs: number | null;
  onStart: () => void;
  onStop: () => void;
  onLongPressHeader: () => void;
  onHistoryPress: () => void;
};

export default function FastingCard({
  activeSession,
  elapsedMs,
  currentProgramLabel,
  lastCompletedTodayMs,
  onStart,
  onStop,
  onLongPressHeader,
  onHistoryPress,
}: FastingCardProps) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (activeSession) {
    const percent = computeFastingPercent(elapsedMs, activeSession.targetHours);
    const targetReached = elapsedMs >= activeSession.targetHours * 3600000;
    const startDate = new Date(activeSession.debut);
    const expectedEnd = computeExpectedEnd(startDate, activeSession.targetHours);

    return (
      <View style={styles.activeCard}>
        <View style={styles.activeTopRow}>
          <Text style={styles.eyebrow}>{t('dashboard.fasting.activeEyebrow')}</Text>
          <Pressable accessibilityRole="button" onPress={onHistoryPress} hitSlop={8}>
            {({ pressed }) => (
              <Text style={[styles.historyLinkActive, pressed && styles.pressed]}>
                {t('dashboard.fasting.historyLink')}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.activeMainRow}>
          <View style={styles.activeInfo}>
            <Text style={styles.elapsedValue}>{formatDurationHM(elapsedMs)}</Text>
            <Text style={styles.targetSubtitle}>
              {targetReached
                ? t('dashboard.fasting.goalReached')
                : t('dashboard.fasting.targetSubtitle', { hours: activeSession.targetHours })}
            </Text>
          </View>
          <CalorieRing percent={percent} size={72} />
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>

        <View style={styles.timesRow}>
          <Text style={styles.timeText}>{t('dashboard.fasting.startedAt', { time: formatHourMinute(startDate) })}</Text>
          <Text style={styles.timeText}>
            {t('dashboard.fasting.expectedEndAt', { time: formatHourMinute(expectedEnd) })}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onStop}
          style={({ pressed }) => [styles.stopButton, pressed && styles.stopButtonPressed]}
        >
          <Text style={styles.stopButtonText}>{t('dashboard.fasting.stopButton')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.idleCard}>
      <View style={styles.idleTopRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.fasting.headerAccessibility')}
          onLongPress={onLongPressHeader}
          delayLongPress={400}
          style={({ pressed }) => [styles.idleHeader, pressed && styles.pressed]}
        >
          <View style={styles.iconBox}>
            <Clock color={colors.accent} size={18} />
          </View>
          <Text style={styles.idleTitle}>{t('dashboard.fasting.idleTitle')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onHistoryPress} hitSlop={8}>
          {({ pressed }) => (
            <Text style={[styles.historyLinkIdle, pressed && styles.pressed]}>
              {t('dashboard.fasting.historyLink')}
            </Text>
          )}
        </Pressable>
      </View>

      <View style={styles.programPill}>
        <Text style={styles.programPillText}>{currentProgramLabel}</Text>
      </View>

      {lastCompletedTodayMs != null && (
        <Text style={styles.lastCompletedText}>
          {t('dashboard.fasting.lastCompleted', { duration: formatDurationHM(lastCompletedTodayMs) })}
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={onStart}
        style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
      >
        <Text style={styles.startButtonText}>{t('dashboard.fasting.startCtaLong')}</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    // Active state
    activeCard: {
      backgroundColor: colors.accent,
      borderRadius: radii.xl,
      padding: 20,
      gap: spacing.sm,
    },
    activeTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.onAccent,
      opacity: 0.6,
    },
    historyLinkActive: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.onAccent,
    },
    pressed: {
      opacity: 0.7,
    },
    activeMainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    activeInfo: {
      flexShrink: 1,
    },
    elapsedValue: {
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: -1,
      color: colors.onAccent,
    },
    targetSubtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.onAccent,
      opacity: 0.7,
      marginTop: 2,
    },
    progressTrack: {
      height: 8,
      borderRadius: radii.full,
      backgroundColor: hexToRgba(colors.onAccent, 0.2),
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radii.full,
      backgroundColor: colors.onAccent,
    },
    timesRow: {
      gap: 2,
    },
    timeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.onAccent,
      opacity: 0.8,
    },
    stopButton: {
      marginTop: spacing.xs,
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: radii.full,
      paddingVertical: spacing.md,
    },
    stopButtonPressed: {
      opacity: 0.8,
    },
    stopButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },

    // Idle state
    idleCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    idleTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    idleHeader: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      backgroundColor: colors.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    idleTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    historyLinkIdle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },
    programPill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accent,
      borderRadius: radii.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    programPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.onAccent,
    },
    lastCompletedText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    startButton: {
      alignItems: 'center',
      backgroundColor: colors.accent,
      borderRadius: radii.full,
      paddingVertical: spacing.md,
    },
    startButtonPressed: {
      opacity: 0.85,
    },
    startButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.onAccent,
    },
  });
}
