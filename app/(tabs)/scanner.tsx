import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Camera as CameraIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MealTypePills from '../../components/dashboard/MealTypePills';
import AppImage from '../../components/ui/AppImage';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import { guessMealTypeNow, todayISODate, type MealType } from '../../constants/dashboard';
import { appImage } from '../../constants/images';
import { TAB_BAR_BOTTOM_MARGIN_MIN, TAB_BAR_CLEARANCE, TAB_BAR_HEIGHT } from '../../constants/layout';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { showAlert } from '../../lib/alert';
import { analyzeMeal, compressImage, type MealAnalysis } from '../../lib/foodScanner';
import { supabase } from '../../lib/supabase';

type ScreenState = 'idle' | 'analyzing' | 'result' | 'error';

export default function ScannerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { locale, t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  // Mirrors the floating tab bar's own geometry (app/(tabs)/_layout.tsx) so the action
  // buttons never sit underneath it — insets-aware, unlike the flat TAB_BAR_CLEARANCE
  // used for plain scroll content, since this is a fixed footer whose own height must
  // clear the real per-device bar position, not just a safe minimum.
  const actionsBottomPadding = Math.max(TAB_BAR_BOTTOM_MARGIN_MIN, insets.bottom + 12) + TAB_BAR_HEIGHT + spacing.sm;

  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoWidth, setPhotoWidth] = useState(0);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mealType, setMealType] = useState<MealType>(guessMealTypeNow());

  const busy = screenState === 'analyzing' || saving;

  const runAnalysis = async (uri: string, width: number) => {
    setScreenState('analyzing');
    setErrorMessage(null);

    try {
      const { base64, mimeType } = await compressImage(uri, width, t);
      const result = await analyzeMeal(base64, mimeType, locale, t);

      if ('erreur' in result) {
        setErrorMessage(result.erreur || t('scanner.noFoodDetected'));
        setScreenState('error');
        return;
      }

      setAnalysis(result);
      setScreenState('result');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('errors.generic'));
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
        showAlert(t('scanner.cameraDeniedTitle'), t('scanner.cameraDeniedMessage'));
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
        showAlert(t('scanner.libraryDeniedTitle'), t('scanner.libraryDeniedMessage'));
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
    setMealType(guessMealTypeNow());
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
      meal_type: mealType,
    });
    setSaving(false);

    if (error) {
      showAlert(t('common.error'), t('scanner.saveErrorMessage'));
      return;
    }

    showAlert(t('scanner.savedTitle'), t('scanner.savedMessage', { name: analysis.nom }));
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
          <AppImage source={appImage('meal-example.jpg')} style={styles.idle} overlay={0.6}>
            <View style={styles.iconCircle}>
              <CameraIcon color={colors.accent} size={32} />
            </View>
            <Text style={styles.title}>{t('scanner.title')}</Text>
            <Text style={styles.subtitle}>{t('scanner.subtitle')}</Text>
          </AppImage>
        )}

        {screenState === 'analyzing' && (
          <View style={styles.analyzing}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.analyzingText}>{t('scanner.analyzing')}</Text>
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
              <MacroLine label={t('scanner.macros.proteins')} grams={analysis.proteines} max={maxMacro} styles={styles} />
              <MacroLine label={t('scanner.macros.carbs')} grams={analysis.glucides} max={maxMacro} styles={styles} />
              <MacroLine label={t('scanner.macros.fats')} grams={analysis.lipides} max={maxMacro} styles={styles} />
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

        {screenState === 'result' && (
          <View style={styles.mealTypeBlock}>
            <Text style={styles.mealTypeLabel}>{t('scanner.addTo')}</Text>
            <MealTypePills value={mealType} onChange={setMealType} />
          </View>
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: actionsBottomPadding }]}>
        {screenState === 'result' ? (
          <>
            <Button label={t('scanner.saveButton')} onPress={handleSave} loading={saving} />
            <Button label={t('scanner.restartButton')} variant="secondary" onPress={handleReset} disabled={saving} />
          </>
        ) : screenState === 'error' ? (
          <>
            <Button label={t('common.retry')} onPress={handleRetry} />
            <Button label={t('scanner.restartButton')} variant="secondary" onPress={handleReset} />
          </>
        ) : (
          <>
            {/* expo-image-picker has no real camera capture on web (launchCameraAsync falls back to
                the same file picker as the gallery) — offering it as a distinct button there would
                promise something the browser can't actually do, so only the gallery/upload option
                shows up on web, per platform. */}
            {Platform.OS !== 'web' && (
              <Button
                label={t('scanner.takePhotoButton')}
                onPress={handleTakePhoto}
                disabled={busy}
                loading={screenState === 'analyzing'}
              />
            )}
            <Button
              label={t('scanner.pickFromLibraryButton')}
              variant={Platform.OS === 'web' ? 'primary' : 'secondary'}
              onPress={handlePickFromLibrary}
              disabled={busy}
              loading={Platform.OS === 'web' && screenState === 'analyzing'}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function MacroLine({
  label,
  grams,
  max,
  styles,
}: {
  label: string;
  grams: number;
  max: number;
  styles: ReturnType<typeof makeStyles>;
}) {
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

function makeStyles(colors: Colors) {
  return StyleSheet.create({
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
    borderRadius: radii.lg,
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
  // Fixed white, not theme-reactive: this text sits directly on the AppImage's
  // always-dark photo scrim, which stays dark regardless of light/dark mode.
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  // Same fixed-color reasoning as `title` above.
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
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
  mealTypeBlock: {
    gap: spacing.sm,
  },
  mealTypeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  });
}
