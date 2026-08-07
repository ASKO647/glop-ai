import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera as CameraIcon, Upload as UploadIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EvolutionResultCard from '../components/skincare/EvolutionResultCard';
import PhotoFrame from '../components/skincare/PhotoFrame';
import ProblemResultCard from '../components/skincare/ProblemResultCard';
import Button from '../components/ui/Button';
import { radii, spacing, type Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';
import { useSkinPhotos, type SkinPhoto } from '../hooks/useSkinPhotos';
import { showAlert, showConfirm } from '../lib/alert';
import { analyzeEvolution, analyzeProblem, isSkincareError, type EvolutionAnalysis, type ProblemAnalysis } from '../lib/skincare';

type Tab = 'evolution' | 'probleme';

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export default function SkincareScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t, locale } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { beforePhoto, nowPhoto, problemPhotos, loading, uploading, addPhoto, saveAnalysis } = useSkinPhotos(user?.id);

  const [activeTab, setActiveTab] = useState<Tab>('evolution');

  const [evolutionAnalysis, setEvolutionAnalysis] = useState<EvolutionAnalysis | null>(null);
  const [evolutionError, setEvolutionError] = useState<string | null>(null);
  const [analyzingEvolution, setAnalyzingEvolution] = useState(false);

  const [selectedProblemPhotoId, setSelectedProblemPhotoId] = useState<string | null>(null);
  const [problemError, setProblemError] = useState<string | null>(null);
  const [analyzingProblem, setAnalyzingProblem] = useState(false);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'evolution', label: t('skincare.tabs.evolution') },
    { key: 'probleme', label: t('skincare.tabs.problem') },
  ];

  const pickEvolutionPhoto = async () => {
    const { status: existing } = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (existing !== 'granted') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert(t('skincare.errors.permissionDeniedTitle'), t('skincare.errors.permissionDeniedMessage'));
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    setEvolutionAnalysis(null);
    setEvolutionError(null);
    const outcome = await addPhoto('evolution', asset.uri, asset.width);
    if (!outcome.ok) showAlert(t('common.error'), outcome.error ?? t('skincare.errors.photoError'));
  };

  const handlePressEvolutionFrame = () => {
    showConfirm(
      t('skincare.evolution.reminderTitle'),
      t('skincare.evolution.reminderMessage'),
      t('skincare.evolution.reminderConfirm'),
      pickEvolutionPhoto,
      t('common.cancel')
    );
  };

  const handleAnalyzeEvolution = async () => {
    if (!beforePhoto?.signedUrl || !nowPhoto?.signedUrl) return;
    setAnalyzingEvolution(true);
    setEvolutionError(null);
    try {
      const result = await analyzeEvolution({ signedUrl: beforePhoto.signedUrl }, { signedUrl: nowPhoto.signedUrl }, locale, t);
      if (isSkincareError(result)) {
        setEvolutionError(result.erreur);
        return;
      }
      setEvolutionAnalysis(result);
      await saveAnalysis(nowPhoto.id, result as unknown as Record<string, unknown>);
    } catch (error) {
      setEvolutionError(error instanceof Error ? error.message : t('skincare.errors.analysisFailed'));
    } finally {
      setAnalyzingEvolution(false);
    }
  };

  const handleTakeProblemPhoto = async () => {
    // No real camera capture on web (expo-image-picker's launchCameraAsync just falls back to a
    // plain file input there) — go straight to the gallery/file picker instead of a camera
    // permission prompt that wouldn't correspond to any actual camera access.
    let result: ImagePicker.ImagePickerResult;
    if (Platform.OS === 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert(t('skincare.errors.permissionDeniedTitle'), t('skincare.errors.permissionDeniedMessage'));
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    } else {
      const { status: existing } = await ImagePicker.getCameraPermissionsAsync();
      if (existing !== 'granted') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showAlert(t('skincare.errors.cameraPermissionDeniedTitle'), t('skincare.errors.cameraPermissionDeniedMessage'));
          return;
        }
      }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
    }
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];

    setProblemError(null);
    const outcome = await addPhoto('probleme', asset.uri, asset.width);
    if (!outcome.ok) {
      showAlert(t('common.error'), outcome.error ?? t('skincare.errors.photoError'));
      return;
    }
    if (!outcome.photo.signedUrl) {
      showAlert(t('common.error'), t('skincare.errors.photoError'));
      return;
    }

    setSelectedProblemPhotoId(outcome.photo.id);
    setAnalyzingProblem(true);
    try {
      const analysis = await analyzeProblem({ signedUrl: outcome.photo.signedUrl }, locale, t);
      if (isSkincareError(analysis)) {
        setProblemError(analysis.erreur);
        return;
      }
      await saveAnalysis(outcome.photo.id, analysis as unknown as Record<string, unknown>);
    } catch (error) {
      setProblemError(error instanceof Error ? error.message : t('skincare.errors.analysisFailed'));
    } finally {
      setAnalyzingProblem(false);
    }
  };

  const selectedProblemPhoto: SkinPhoto | null =
    problemPhotos.find((p) => p.id === selectedProblemPhotoId) ?? problemPhotos[0] ?? null;
  const selectedProblemAnalysis = selectedProblemPhoto?.analysis as ProblemAnalysis | undefined;

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
        <Text style={styles.headerTitle}>{t('skincare.header.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabPill, active && styles.tabPillActive]}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : activeTab === 'evolution' ? (
          <View style={styles.tabContent}>
            <View style={styles.framesRow}>
              <PhotoFrame
                label={t('skincare.evolution.before')}
                addPhotoLabel={t('skincare.evolution.addPhoto')}
                date={beforePhoto ? formatDate(beforePhoto.takenAt, locale) : null}
                signedUrl={beforePhoto?.signedUrl ?? null}
                uploading={uploading}
                onPress={handlePressEvolutionFrame}
              />
              <PhotoFrame
                label={t('skincare.evolution.now')}
                addPhotoLabel={t('skincare.evolution.addPhoto')}
                date={nowPhoto ? formatDate(nowPhoto.takenAt, locale) : null}
                signedUrl={nowPhoto?.signedUrl ?? null}
                uploading={uploading}
                onPress={handlePressEvolutionFrame}
              />
            </View>

            <Button
              label={t('skincare.evolution.analyzeButton')}
              onPress={handleAnalyzeEvolution}
              loading={analyzingEvolution}
              disabled={!beforePhoto?.signedUrl || !nowPhoto?.signedUrl || analyzingEvolution}
            />

            {evolutionError && <Text style={styles.errorText}>{evolutionError}</Text>}
            {evolutionAnalysis && <EvolutionResultCard analysis={evolutionAnalysis} />}
          </View>
        ) : (
          <View style={styles.tabContent}>
            <Pressable
              accessibilityRole="button"
              onPress={handleTakeProblemPhoto}
              disabled={uploading || analyzingProblem}
              style={({ pressed }) => [styles.captureButton, pressed && styles.pressed]}
            >
              {Platform.OS === 'web' ? (
                <UploadIcon color={colors.onAccent} size={20} />
              ) : (
                <CameraIcon color={colors.onAccent} size={20} />
              )}
              <Text style={styles.captureButtonLabel}>
                {t(Platform.OS === 'web' ? 'skincare.problem.choosePhotoButton' : 'skincare.problem.takePhotoButton')}
              </Text>
            </Pressable>

            {(uploading || analyzingProblem) && (
              <View style={styles.analyzingRow}>
                <ActivityIndicator color={colors.accent} size="small" />
                <Text style={styles.analyzingText}>{t('skincare.problem.analyzing')}</Text>
              </View>
            )}

            {problemError && <Text style={styles.errorText}>{problemError}</Text>}
            {selectedProblemAnalysis && <ProblemResultCard analysis={selectedProblemAnalysis} />}

            {problemPhotos.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.sectionLabel}>{t('skincare.problem.historyTitle')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyRow}>
                  {problemPhotos.map((photo) => (
                    <Pressable
                      key={photo.id}
                      accessibilityRole="button"
                      onPress={() => setSelectedProblemPhotoId(photo.id)}
                      style={[styles.historyThumbWrap, photo.id === selectedProblemPhoto?.id && styles.historyThumbWrapActive]}
                    >
                      {photo.signedUrl && <Image source={{ uri: photo.signedUrl }} style={styles.historyThumb} />}
                      <Text style={styles.historyDate}>{formatDate(photo.takenAt, locale)}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
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
    centered: {
      paddingTop: spacing.xl,
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
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
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    tabsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    tabPill: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radii.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabPillActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    tabLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    tabLabelActive: {
      color: colors.onAccent,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 100,
    },
    tabContent: {
      gap: spacing.md,
    },
    framesRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    errorText: {
      fontSize: 13,
      color: colors.danger,
      textAlign: 'center',
    },
    captureButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.accent,
      borderRadius: radii.full,
      height: 52,
    },
    captureButtonLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.onAccent,
    },
    analyzingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    analyzingText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    historySection: {
      gap: spacing.sm,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.labelMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    historyRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    historyThumbWrap: {
      alignItems: 'center',
      gap: 4,
      padding: 3,
      borderRadius: radii.md,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    historyThumbWrapActive: {
      borderColor: colors.accent,
    },
    historyThumb: {
      width: 56,
      height: 56,
      borderRadius: radii.sm,
      backgroundColor: colors.surface,
    },
    historyDate: {
      fontSize: 10,
      color: colors.textTertiary,
    },
  });
}
