import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Clock3, Flame, Hourglass, Trophy } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StatTile from '../components/progression/StatTile';
import { formatDisplayDate, toISODate } from '../constants/dashboard';
import { formatDurationHM } from '../constants/fasting';
import type { Colors } from '../constants/theme';
import { radii, spacing, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFasting, type FastingSession } from '../hooks/useFasting';
import { showConfirm } from '../lib/alert';

function formatAverage(ms: number): string {
  if (ms <= 0) return '-';
  return formatDurationHM(ms);
}

export default function FastingHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { history, stats, loading, deleteSession } = useFasting(user?.id);

  const handleDelete = (session: FastingSession) => {
    showConfirm(
      'Supprimer ce jeûne ?',
      "Cette session sera retirée de ton historique.",
      'Supprimer',
      () => deleteSession(session.id)
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ArrowLeft color={colors.textPrimary} size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Historique du jeûne</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatTile Icon={Hourglass} value={String(stats.totalCount)} label="Jeûnes réalisés" />
          <StatTile Icon={Clock3} value={formatAverage(stats.averageDurationMs)} label="Durée moyenne" />
          <StatTile Icon={Trophy} value={formatAverage(stats.longestDurationMs)} label="Plus long jeûne" />
          <StatTile Icon={Flame} value={`${stats.currentStreakDays} j`} label="Série en cours" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sessions</Text>

          {loading ? (
            <ActivityIndicator color={colors.accent} />
          ) : history.length === 0 ? (
            <Text style={styles.emptyText}>Aucun jeûne enregistré pour l'instant.</Text>
          ) : (
            <View style={styles.sessionsList}>
              {history.map((session) => {
                const durationMs = new Date(session.fin as string).getTime() - new Date(session.debut).getTime();
                const targetReached = durationMs >= session.duree_cible_heures * 3600000;
                return (
                  <Pressable
                    key={session.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Jeûne du ${formatDisplayDate(toISODate(new Date(session.debut)))}, appui long pour supprimer`}
                    onLongPress={() => handleDelete(session)}
                    delayLongPress={500}
                    style={({ pressed }) => [styles.sessionRow, pressed && styles.pressed]}
                  >
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionDate}>{formatDisplayDate(toISODate(new Date(session.debut)))}</Text>
                      <Text style={styles.sessionProgram}>{session.programme}</Text>
                    </View>
                    <View style={styles.sessionRight}>
                      <Text style={styles.sessionDuration}>{formatDurationHM(durationMs)}</Text>
                      {targetReached && (
                        <View style={styles.checkBadge}>
                          <Check color={colors.accent} size={14} strokeWidth={3} />
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    headerTitle: {
      ...typography.heading,
      flex: 1,
      textAlign: 'center',
      color: colors.textPrimary,
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.full,
      backgroundColor: colors.surface,
    },
    pressed: {
      opacity: 0.7,
    },
    headerSpacer: {
      width: 36,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 60,
      gap: spacing.lg,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    emptyText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    sessionsList: {
      gap: spacing.sm,
    },
    sessionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
    },
    sessionInfo: {
      flexShrink: 1,
      gap: 2,
    },
    sessionDate: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      textTransform: 'capitalize',
    },
    sessionProgram: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    sessionRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    sessionDuration: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.accent,
    },
    checkBadge: {
      width: 22,
      height: 22,
      borderRadius: radii.full,
      backgroundColor: colors.accentMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
