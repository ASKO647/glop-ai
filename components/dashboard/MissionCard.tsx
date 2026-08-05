import { Check, Dumbbell, Footprints, Sparkles, Target } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMissionValue, getMissionLabel, type MissionKey } from '../../constants/dashboard';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import ProgressBar from '../ui/ProgressBar';

const MISSION_ICON: Record<MissionKey, typeof Target> = {
  objective: Target,
  steps: Footprints,
  workout: Dumbbell,
  skincare: Sparkles,
};

type MissionCardProps = {
  missionKey: MissionKey;
  current: number;
  target: number;
  completed: boolean;
  onPress: () => void;
  /** Read-only mode (e.g. viewing a past day) — blocks taps without implying "completed". */
  disabled?: boolean;
  /** `profile.objectif` — only meaningful for the `objective` mission's label. */
  objectif?: string | null;
};

export default function MissionCard({
  missionKey,
  current,
  target,
  completed,
  onPress,
  disabled = false,
  objectif,
}: MissionCardProps) {
  const { colors } = useTheme();
  const { t, locale } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const Icon = MISSION_ICON[missionKey];
  const label = getMissionLabel(missionKey, target, t, locale, objectif);
  const progress = target > 0 ? current / target : 0;
  const isInteractive = !completed && !disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !isInteractive }}
      onPress={onPress}
      disabled={!isInteractive}
      style={({ pressed }) => [
        styles.card,
        completed && styles.cardCompleted,
        pressed && isInteractive && styles.pressed,
      ]}
    >
      <View style={[styles.iconBox, completed && styles.iconBoxCompleted]}>
        {completed ? (
          <Check color={colors.onAccent} size={18} strokeWidth={3} />
        ) : (
          <Icon color={colors.accent} size={18} />
        )}
      </View>

      <View style={styles.content}>
        <Text style={[styles.label, completed && styles.labelCompleted]}>{label}</Text>
        {!completed && <ProgressBar progress={progress} height={4} style={styles.progressBar} />}
      </View>

      <Text style={styles.value}>
        {formatMissionValue(missionKey, current, locale)}/{formatMissionValue(missionKey, target, locale)}
      </Text>
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: 14,
    },
    cardCompleted: {
      borderColor: colors.accent,
    },
    pressed: {
      opacity: 0.7,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: radii.md,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBoxCompleted: {
      backgroundColor: colors.accent,
    },
    content: {
      flex: 1,
      gap: 6,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    labelCompleted: {
      color: colors.textTertiary,
      textDecorationLine: 'line-through',
    },
    progressBar: {
      borderWidth: 0,
    },
    value: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
}
