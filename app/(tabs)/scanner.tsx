import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera as CameraIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import { todayISODate } from '../../constants/dashboard';
import { colors, radii, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { showAlert } from '../../lib/alert';
import { analyzeMeal, compressImage, type MealAnalysis } from '../../lib/foodScanner';
import { supabase } from '../../lib/supabase';

type ScreenState = 'idle' | 'analyzing' | 'result' | 'error';

// Mirrors the floating tab bar's own geometry (app/(tabs)/_layout.tsx) so the
// action buttons never sit underneath it.
const TAB_BAR_BOTTOM_MIN = 24;
const TAB_BAR_HEIGHT = 64;

const CAMERA_DENIED_MESSAGE =
  "GlowUp AI a besoin d'accéder à l'appareil photo pour analyser tes repas. Active l'accès dans les réglages de ton téléphone.";
const LIBRARY_DENIED_MESSAGE =
  "GlowUp AI a besoin d'accéder à tes photos pour analyser tes repas. Active l'accès dans les réglages de ton téléphone.";

export default function ScannerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const actionsBottomPadding = Math.max(TAB_BAR_BOTTOM_MIN, insets.bottom + 12) + TAB_BAR_HEIGHT + spacing.sm;

  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoWidth, setPhotoWidth] = useState(0);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const busy = screenState === 'analyzing' || saving;

  const runAnalysis = async (uri: string, width: number) => {
    setScreenState('analyzing');
    setErrorMessage(null);

    try {
      const { base64, mimeType } = await compressImage(uri, width);
      const result = await analyzeMeal(base64, mimeType);

      if ('erreur' in result) {
        setErrorMessage(result.erreur || 'Aucun aliment détecté sur cette photo.');
        setScreenState('error');
        return;
      }

      setAnalysis(result);
      setScreenState('result');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Une erreur est survenue. Réessaie.');
      setScreenState('error');
    }
  };

  const handlePickerResult = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    setPhotoUri(asset.uri);
    setPhotoWidth(asset.width);
    setAnalysis(null);
    runAnalysis(asset.uri, asset.width);
  };

  const handleTakePhoto = async () => {
    if (busy) return;
    const { status: existing } = await ImagePicker.getCameraPermissionsAsync();
    if (existing !== 'granted') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert("Accès à l'appareil photo refusé", CAMERA_DENIED_MESSAGE);
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
    handlePickerResult(result);
  };

  const handlePickFromLibrary = async () => {
    if (busy) return;
    const { status: existing } = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (existing !== 'granted') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Accès à tes photos refusé', LIBRARY_DENIED_MESSAGE);
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    handlePickerResult(result);
  };

  const handleRetry = () => {
    if (photoUri) runAnalysis(photoUri, photoWidth);
  };

  const handleReset = () => {
    setScreenState('idle');
    setPhotoUri(null);
    setPhotoWidth(0);
    setAnalysis(null);
    setErrorMessage(null);
  };

  const handleSave = async () => {
    if (!analysis || !user || saving) return;
    setSaving(true);
    const { error } = await supabase.from('meals').insert({
      user_id: user.id,
      date: todayISODate(),
      name: analysis.nom,
      kcal: analysis.kcal,
      proteines: analysis.proteines,
      glucides: analysis.glucides,
      lipides: analysis.lipides,
    });
    setSaving(false);

    if (error) {
      showAlert('Erreur', "Impossible d'enregistrer ce repas. Réessaie.");
      return;
    }

    showAlert('Repas enregistré', `${analysis.nom} a été ajouté à ton suivi du jour.`);
    router.replace('/');
  };

  const maxMacro = analysis ? Math.max(analysis.proteines, analysis.glucides, analysis.lipides, 1) : 1;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        )}

        {screenState === 'idle' && !photoUri && (
          <View style={styles.idle}>
            <View style={styles.iconCircle}>
              <CameraIcon color={colors.accent} size={32} />
            </View>
            <Text style={styles.title}>Scanne ton repas</Text>
            <Text style={styles.subtitle}>Prends ton plat en photo pour connaître ses calories</Text>
          </View>
        )}

        {screenState === 'analyzing' && (
          <View style={styles.analyzing}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.analyzingText}>Analyse en cours...</Text>
          </View>
        )}

        {screenState === 'error' && (
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {screenState === 'result' && analysis && (
          <View style={styles.resultCard}>
            <Text style={styles.dishName}>{analysis.nom}</Text>

            <View style={styles.kcalRow}>
              <Text style={styles.kcalValue}>{analysis.kcal}</Text>
              <Text style={styles.kcalUnit}>kcal</Text>
            </View>

            <View style={styles.macros}>
              <MacroLine label="Protéines" grams={analysis.proteines} max={maxMacro} />
              <MacroLine label="Glucides" grams={analysis.glucides} max={maxMacro} />
              <MacroLine label="Lipides" grams={analysis.lipides} max={maxMacro} />
            </View>

            {analysis.aliments.length > 0 && (
              <View style={styles.foods}>
                {analysis.aliments.map((aliment, index) => (
                  <Text key={`${aliment.nom}-${index}`} style={styles.foodLine}>
                    {aliment.nom} · {aliment.portion}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: actionsBottomPadding }]}>
        {screenState === 'result' ? (
          <>
            <Button label="Enregistrer ce repas" onPress={handleSave} loading={saving} />
            <Button label="Recommencer" variant="secondary" onPress={handleReset} disabled={saving} />
          </>
        ) : screenState === 'error' ? (
          <>
            <Button label="Réessayer" onPress={handleRetry} />
            <Button label="Recommencer" variant="secondary" onPress={handleReset} />
          </>
        ) : (
          <>
            <Button
              label="Prendre une photo"
              onPress={handleTakePhoto}
              disabled={busy}
              loading={screenState === 'analyzing'}
            />
            <Button label="Choisir dans la galerie" variant="secondary" onPress={handlePickFromLibrary} disabled={busy} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function MacroLine({ label, grams, max }: { label: string; grams: number; max: number }) {
  return (
    <View style={styles.macroLine}>
      <View style={styles.macroLabelRow}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>{grams} g</Text>
      </View>
      <ProgressBar progress={grams / max} height={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  preview: {
    width: '100%',
    height: 240,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  idle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  analyzing: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  analyzingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  errorBlock: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  dishName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  kcalValue: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -1,
  },
  kcalUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 6,
  },
  macros: {
    gap: spacing.sm,
  },
  macroLine: {
    gap: 6,
  },
  macroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macroLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  macroValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  foods: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: 4,
  },
  foodLine: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
});
