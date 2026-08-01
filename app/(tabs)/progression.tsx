import * as ImagePicker from 'expo-image-picker';
import { Flag, Ruler, Target, TrendingUp } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PhotosCard from '../../components/progression/PhotosCard';
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
import { useProgressPhotos } from '../../hooks/useProgressPhotos';
import { useWeightLogs } from '../../hooks/useWeightLogs';
import { showAlert } from '../../lib/alert';

const PHOTOS_PERMISSION_DENIED_MESSAGE =
  "GlowUp AI a besoin d'accéder à tes photos pour enregistrer ta progression. Active l'accès dans les réglages de ton téléphone.";

export default function ProgressionScreen() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { logs, loading: logsLoading, saving, saveTodayWeight } = useWeightLogs(user?.id);
  const { statusByDate, countsByDate, streak, activeDays, loading: streakLoading } = useMissionStreak(user?.id);
  const { photos, loading: photosLoading, uploading, addPhoto, deletePhoto } = useProgressPhotos(user?.id);

  const [period, setPeriod] = useState<PeriodId>('30');
  const [modalVisible, setModalVisible] = useState(false);

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

  const handleAddPhoto = async () => {
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
    const ok = await addPhoto(asset.uri, asset.width, currentWeight);
    if (!ok) {
      showAlert('Erreur', "Impossible d'enregistrer cette photo. Réessaie.");
    }
  };

  const handleDeletePhoto = async (photo: (typeof photos)[number]) => {
    const ok = await deletePhoto(photo);
    if (!ok) {
      showAlert('Erreur', 'Impossible de supprimer cette photo. Réessaie.');
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Pressable accessibilityRole="button" onPress={handleAddPhoto} disabled={uploading} hitSlop={8}>
              <Text style={styles.addLink}>Ajouter</Text>
            </Pressable>
          </View>
          <PhotosCard photos={photos} loading={photosLoading} uploading={uploading} onDelete={handleDeletePhoto} />
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
  addLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
});
