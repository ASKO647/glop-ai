import { Droplet, GlassWater } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { computeGlassCount, formatLiters, WATER_GLASS_ML } from '../../constants/hydration';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';

type HydrationCardProps = {
  totalMl: number;
  goalMl: number;
  onSetTotal: (targetMl: number) => void;
  onQuickAdd: (ml: number) => void;
  onLongPressHeader: () => void;
};

export default function HydrationCard({
  totalMl,
  goalMl,
  onSetTotal,
  onQuickAdd,
  onLongPressHeader,
}: HydrationCardProps) {
  const { colors } = useTheme();
  const { t, locale } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const glassCount = computeGlassCount(goalMl);
  const filledGlasses = Math.min(glassCount, Math.round(totalMl / WATER_GLASS_ML));
  const percent = goalMl > 0 ? Math.min(1, totalMl / goalMl) : 0;

  const handleGlassPress = (index: number) => {
    const level = index + 1;
    // Tapping the last already-filled glass unchecks it; tapping any other glass fills up to it.
    const targetGlasses = level === filledGlasses ? level - 1 : level;
    onSetTotal(targetGlasses * WATER_GLASS_ML);
  };

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.hydration.headerAccessibility', {
          current: formatLiters(totalMl, locale),
          goal: formatLiters(goalMl, locale),
        })}
        onLongPress={onLongPressHeader}
        delayLongPress={400}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <View style={styles.iconBox}>
          <Droplet color={colors.accent} size={18} />
        </View>
        <Text style={styles.title}>{t('dashboard.hydration.title')}</Text>
        <Text style={styles.value}>
          {t('dashboard.hydration.valueDisplay', { current: formatLiters(totalMl, locale), goal: formatLiters(goalMl, locale) })}
        </Text>
      </Pressable>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent * 100}%` }]} />
      </View>

      <View style={styles.glassesRow}>
        {Array.from({ length: glassCount }, (_, index) => {
          const filled = index < filledGlasses;
          return (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={t('dashboard.hydration.glassAccessibility', { index: index + 1, total: glassCount })}
              accessibilityState={{ selected: filled }}
              onPress={() => handleGlassPress(index)}
              hitSlop={4}
              style={({ pressed }) => [pressed && styles.glassPressed]}
            >
              <GlassWater
                color={filled ? colors.accent : colors.borderMuted}
                fill={filled ? colors.accent : 'none'}
                size={32}
                strokeWidth={filled ? 1.5 : 1.5}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.quickRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onQuickAdd(250)}
          style={({ pressed }) => [styles.quickPill, pressed && styles.quickPillPressed]}
        >
          <Text style={styles.quickLabel}>{t('dashboard.hydration.quickAdd', { ml: 250 })}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onQuickAdd(500)}
          style={({ pressed }) => [styles.quickPill, pressed && styles.quickPillPressed]}
        >
          <Text style={styles.quickLabel}>{t('dashboard.hydration.quickAdd', { ml: 500 })}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerPressed: {
      opacity: 0.8,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      backgroundColor: colors.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    value: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.accent,
    },
    progressTrack: {
      height: 8,
      borderRadius: radii.full,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radii.full,
      backgroundColor: colors.accent,
    },
    glassesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    glassPressed: {
      opacity: 0.6,
    },
    quickRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    quickPill: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.full,
      paddingVertical: spacing.sm,
    },
    quickPillPressed: {
      opacity: 0.7,
    },
    quickLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
  });
}
