import * as ImagePicker from 'expo-image-picker';
import { Flag, Ruler, Target, TrendingUp } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PhotosCard from '../../components/progression/PhotosCard';
import ProgressAnalysisCard from '../../components/progression/ProgressAnalysisCard';
import StatTile from '../../components/progression/StatTile';
import StreakGrid from '../../components/progression/StreakGrid';
import WeightCard from '../../components/progression/WeightCard';
import WeightChart from '../../components/progression/WeightChart';
import WeightEntryModal from '../../components/progression/WeightEntryModal';
import { isoDaysAgo } from '../../constants/dashboard';
import { PERIOD_OPTIONS, computeProgressPercent, formatWeight, type PeriodId } from '../../constants/progression';
import { colors, radii, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { useMissionStreak } from '../../hooks/useMissionStreak';
import { PHOTO_SLOTS, SLOT_LABELS, useProgressPhotos, type PhotoSlot, type ProgressPhoto } from '../../hooks/useProgressPhotos';
import { useWeightLogs } from '../../hooks/useWeightLogs';
import { showAlert } from '../../lib/alert';
import { analyzeProgress, type ProgressAnalysis } from '../../lib/progressAnalysis';

const PHOTOS_PERMISSION_DENIED_MESSAGE =
  "GlowUp AI a besoin d'accéder à tes photos pour enregistrer ta progression. Active l'accès dans les réglages de ton téléphone.";

export default function ProgressionScreen() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { logs, loading: logsLoading, saving, saveTodayWeight } = useWeightLogs(user?.id);
  const { statusByDate, countsByDate, streak, activeDays, loading: streakLoading } = useMissionStreak(user?.id);
  const { photosBySlot, loading: photosLoading, addPhoto, deletePhoto } = useProgressPhotos(user?.id);

  const [period, setPeriod] = useState<PeriodId>('30');
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<PhotoSlot | null>(null);
  const [analysis, setAnalysis] = useState<ProgressAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const startWeight = profile?.poids_actuel ?? null;
  const targetWeight = profile?.poids_objectif ?? null;
  const currentWeight = logs.length > 0 ? logs[logs.length - 1].poids : startWeight;
  const previousWeight = logs.length > 1 ? logs[logs.length - 2].poids : null;

  const periodOption = PERIOD_OPTIONS.find((option) => option.id === period)!;
  const filteredLogs = useMemo(() => {
    const since = isoDaysAgo(periodOption.days - 1);
    return logs.filter((log) => log.date >= since);
  }, [logs, periodOption.days]);

  const gapRemaining =
    currentWeight != null && targetWeight != null ? Math.abs(currentWeight - targetWeight) : null;
  const progressPercent =
    startWeight != null && currentWeight != null && targetWeight != null
      ? computeProgressPercent(startWeight, currentWeight, targetWeight)
      : null;

  const handleSaveWeight = async (poids: number) => {
    const ok = await saveTodayWeight(poids);
    if (ok) {
      setModalVisible(false);
    } else {
      showAlert('Erreur', "Impossible d'enregistrer ton poids. Réessaie.");
    }
  };

  const presentPhotos = useMemo(
    () => PHOTO_SLOTS.map((slot) => photosBySlot[slot]).filter((photo): photo is ProgressPhoto => photo != null),
    [photosBySlot]
  );
  const canAnalyze = presentPhotos.length >= 2;

  const handlePressSlot = async (slot: PhotoSlot) => {
    const { status: existing } = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (existing !== 'granted') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Accès à tes photos refusé', PHOTOS_PERMISSION_DENIED_MESSAGE);
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled || result.assets.length === 0) return;

    const asset = result.assets[0];
    setUploadingSlot(slot);
    const outcome = await addPhoto(slot, asset.uri, asset.width, currentWeight);
    setUploadingSlot(null);
    if (!outcome.ok) {
      showAlert('Erreur', outcome.error ?? "Impossible d'enregistrer cette photo. Réessaie.");
    }
  };

  // PhotosCard already confirms via showConfirm before calling this — just perform the delete.
  const handleDeleteSlot = async (slot: PhotoSlot) => {
    const ok = await deletePhoto(slot);
    if (!ok) {
      showAlert('Erreur', 'Impossible de supprimer cette photo. Réessaie.');
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await analyzeProgress(presentPhotos, {
        objectif: profile?.objectif ?? null,
        poidsDepart: startWeight,
        poidsActuel: currentWeight,
        poidsObjectif: targetWeight,
      });
      setAnalysis(result);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Impossible d'analyser ta progression. Réessaie.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top']}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={typography.title}>Progression</Text>

        <WeightCard
          currentWeight={currentWeight}
          previousWeight={previousWeight}
          startWeight={startWeight}
          objectif={profile?.objectif ?? null}
          loading={logsLoading}
          onAddPress={() => setModalVisible(true)}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Évolution</Text>
            <View style={styles.periodRow}>
              {PERIOD_OPTIONS.map((option) => (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: period === option.id }}
                  onPress={() => setPeriod(option.id)}
                  style={({ pressed }) => [
                    styles.periodPill,
                    period === option.id && styles.periodPillActive,
                    pressed && period !== option.id && styles.pressed,
                  ]}
                >
                  <Text style={[styles.periodLabel, period === option.id && styles.periodLabelActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {logsLoading ? (
            <View style={styles.chartLoading}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <WeightChart logs={filteredLogs} target={targetWeight} />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          {logsLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <View style={styles.statsGrid}>
              <StatTile
                Icon={Flag}
                value={startWeight != null ? `${formatWeight(startWeight)} kg` : '-'}
                label="Poids de départ"
              />
              <StatTile
                Icon={Target}
                value={targetWeight != null ? `${formatWeight(targetWeight)} kg` : '-'}
                label="Poids objectif"
              />
              <StatTile
                Icon={Ruler}
                value={gapRemaining != null ? `${formatWeight(gapRemaining)} kg` : '-'}
                label="Écart restant"
              />
              <StatTile
                Icon={TrendingUp}
                value={progressPercent != null ? `${progressPercent}%` : '-'}
                label="Progression"
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Régularité</Text>
          {streakLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <StreakGrid
              statusByDate={statusByDate}
              countsByDate={countsByDate}
              streak={streak}
              activeDays={activeDays}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <PhotosCard
            photosBySlot={photosBySlot}
            loading={photosLoading}
            uploadingSlot={uploadingSlot}
            onPressSlot={handlePressSlot}
            onDeleteSlot={handleDeleteSlot}
          />
          <ProgressAnalysisCard
            analysis={analysis}
            loading={analyzing}
            error={analysisError}
            canAnalyze={canAnalyze}
            onAnalyze={handleAnalyze}
          />
        </View>
      </ScrollView>

      <WeightEntryModal
        visible={modalVisible}
        initialValue={currentWeight}
        saving={saving}
        onCancel={() => setModalVisible(false)}
        onSave={handleSaveWeight}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 100,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  periodPill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  periodPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  periodLabelActive: {
    color: colors.background,
  },
  chartLoading: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
