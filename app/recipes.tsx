import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera as CameraIcon, Heart, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RecipeCard from '../components/recipes/RecipeCard';
import Button from '../components/ui/Button';
import { todayISODate } from '../constants/dashboard';
import { colors, radii, spacing, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { showAlert, showConfirm } from '../lib/alert';
import { compressImage } from '../lib/foodScanner';
import {
  analyzeFridge,
  generateSuggestions,
  summarizeProfileForRecipes,
  type FridgeAnalysis,
  type FridgeRecipe,
  type Recipe,
  type SavedRecipeRow,
} from '../lib/recipes';
import { supabase } from '../lib/supabase';

type Tab = 'suggestions' | 'frigo' | 'favoris';

const TABS: { key: Tab; label: string }[] = [
  { key: 'suggestions', label: 'Suggestions' },
  { key: 'frigo', label: 'Mon frigo' },
  { key: 'favoris', label: 'Favoris' },
];

const MAX_FRIDGE_PHOTOS = 3;
const LIBRARY_DENIED_MESSAGE =
  "GlowUp AI a besoin d'accéder à tes photos pour analyser ton frigo. Active l'accès dans les réglages de ton téléphone.";

type FridgeState = 'idle' | 'analyzing' | 'result' | 'error';
type FridgePhoto = { uri: string; width: number };

function suggestionsCacheKey(userId: string): string {
  return `recipes_suggestions_${userId}_${todayISODate()}`;
}

export default function RecipesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  const [activeTab, setActiveTab] = useState<Tab>('suggestions');

  // Suggestions
  const [suggestions, setSuggestions] = useState<Recipe[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [suggestionFavorites, setSuggestionFavorites] = useState<Record<number, string>>({});

  // Mon frigo
  const [fridgePhotos, setFridgePhotos] = useState<FridgePhoto[]>([]);
  const [fridgeState, setFridgeState] = useState<FridgeState>('idle');
  const [fridgeResult, setFridgeResult] = useState<FridgeAnalysis | null>(null);
  const [fridgeError, setFridgeError] = useState<string | null>(null);
  const [fridgeFavorites, setFridgeFavorites] = useState<Record<number, string>>({});

  // Favoris
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipeRow[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);

  const loadSuggestions = async (force: boolean) => {
    if (!user) return;
    if (force) setRegenerating(true);
    else setSuggestionsLoading(true);
    setSuggestionsError(null);

    try {
      if (!force) {
        const cached = await AsyncStorage.getItem(suggestionsCacheKey(user.id));
        if (cached) {
          const parsed = JSON.parse(cached) as { recettes?: Recipe[] };
          if (parsed.recettes && parsed.recettes.length > 0) {
            setSuggestions(parsed.recettes);
            setSuggestionFavorites({});
            setSuggestionsLoading(false);
            return;
          }
        }
      }

      const result = await generateSuggestions(summarizeProfileForRecipes(profile));
      setSuggestions(result.recettes);
      setSuggestionFavorites({});
      await AsyncStorage.setItem(suggestionsCacheKey(user.id), JSON.stringify(result));
    } catch (error) {
      setSuggestionsError(error instanceof Error ? error.message : 'Impossible de générer des recettes. Réessaie.');
    } finally {
      setSuggestionsLoading(false);
      setRegenerating(false);
    }
  };

  useEffect(() => {
    // Waits for the profile to finish loading so the very first generation is already
    // personalized — `loadSuggestions` closes over the current `profile`/`user`, so this only
    // needs to key off their identity/loading state, not be listed as a dependency itself.
    if (!user || profileLoading) return;
    loadSuggestions(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profileLoading]);

  useEffect(() => {
    if (!user) {
      setSavedLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('saved_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!cancelled) {
        setSavedRecipes((data ?? []) as SavedRecipeRow[]);
        setSavedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const insertSavedRecipe = async (recipe: Recipe, source: 'suggestion' | 'frigo'): Promise<SavedRecipeRow | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('saved_recipes')
      .insert({
        user_id: user.id,
        titre: recipe.titre,
        description: recipe.description,
        kcal: recipe.kcal,
        proteines: recipe.proteines,
        glucides: recipe.glucides,
        lipides: recipe.lipides,
        temps_preparation: recipe.temps_preparation,
        difficulte: recipe.difficulte,
        ingredients: recipe.ingredients,
        etapes: recipe.etapes,
        source,
      })
      .select()
      .single();
    if (error || !data) {
      showAlert('Erreur', "Impossible d'ajouter aux favoris. Réessaie.");
      return null;
    }
    return data as SavedRecipeRow;
  };

  const deleteSavedRecipe = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('saved_recipes').delete().eq('id', id);
    if (error) {
      showAlert('Erreur', 'Impossible de retirer ce favori. Réessaie.');
      return false;
    }
    return true;
  };

  const toggleSuggestionFavorite = async (index: number, recipe: Recipe) => {
    const existingId = suggestionFavorites[index];
    if (existingId) {
      if (!(await deleteSavedRecipe(existingId))) return;
      setSuggestionFavorites((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      setSavedRecipes((prev) => prev.filter((row) => row.id !== existingId));
      return;
    }
    const saved = await insertSavedRecipe(recipe, 'suggestion');
    if (!saved) return;
    setSuggestionFavorites((prev) => ({ ...prev, [index]: saved.id }));
    setSavedRecipes((prev) => [saved, ...prev]);
  };

  const toggleFridgeFavorite = async (index: number, recipe: FridgeRecipe) => {
    const existingId = fridgeFavorites[index];
    if (existingId) {
      if (!(await deleteSavedRecipe(existingId))) return;
      setFridgeFavorites((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      setSavedRecipes((prev) => prev.filter((row) => row.id !== existingId));
      return;
    }
    const saved = await insertSavedRecipe(recipe, 'frigo');
    if (!saved) return;
    setFridgeFavorites((prev) => ({ ...prev, [index]: saved.id }));
    setSavedRecipes((prev) => [saved, ...prev]);
  };

  const handleDeleteSaved = (row: SavedRecipeRow) => {
    showConfirm('Supprimer cette recette ?', 'Elle sera retirée de tes favoris.', 'Supprimer', async () => {
      if (!(await deleteSavedRecipe(row.id))) return;
      setSavedRecipes((prev) => prev.filter((r) => r.id !== row.id));
      setSuggestionFavorites((prev) => removeValue(prev, row.id));
      setFridgeFavorites((prev) => removeValue(prev, row.id));
    });
  };

  const openRecipe = (recipe: Recipe, source: 'suggestion' | 'frigo', savedId?: string) => {
    router.push({
      pathname: '/recipe/[id]',
      params: {
        id: savedId ?? 'preview',
        recette: JSON.stringify(recipe),
        source,
        savedId: savedId ?? '',
      },
    });
  };

  const openSavedRecipe = (row: SavedRecipeRow) => {
    router.push({
      pathname: '/recipe/[id]',
      params: { id: row.id, recette: JSON.stringify(row), source: row.source, savedId: row.id },
    });
  };

  const handleAddFridgePhoto = async () => {
    if (fridgePhotos.length >= MAX_FRIDGE_PHOTOS) return;
    const { status: existing } = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (existing !== 'granted') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Accès à tes photos refusé', LIBRARY_DENIED_MESSAGE);
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    setFridgePhotos((prev) => [...prev, { uri: asset.uri, width: asset.width }].slice(0, MAX_FRIDGE_PHOTOS));
  };

  const removeFridgePhoto = (index: number) => {
    setFridgePhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyzeFridge = async () => {
    if (fridgePhotos.length === 0) return;
    setFridgeState('analyzing');
    setFridgeError(null);
    try {
      const images = await Promise.all(fridgePhotos.map((photo) => compressImage(photo.uri, photo.width)));
      const result = await analyzeFridge(images, summarizeProfileForRecipes(profile));
      setFridgeResult(result);
      setFridgeFavorites({});
      setFridgeState('result');
    } catch (error) {
      setFridgeError(error instanceof Error ? error.message : "Impossible d'analyser tes ingrédients. Réessaie.");
      setFridgeState('error');
    }
  };

  const resetFridge = () => {
    setFridgePhotos([]);
    setFridgeResult(null);
    setFridgeError(null);
    setFridgeState('idle');
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
        <Text style={typography.heading}>Recettes</Text>
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
        {activeTab === 'suggestions' && (
          <View style={styles.tabContent}>
            {suggestionsLoading ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={colors.accent} size="large" />
                <Text style={styles.loadingText}>Génération de tes recettes...</Text>
              </View>
            ) : suggestionsError ? (
              <View style={styles.errorBlock}>
                <Text style={styles.errorText}>{suggestionsError}</Text>
                <Button label="Réessayer" onPress={() => loadSuggestions(true)} loading={regenerating} />
              </View>
            ) : (
              <>
                <View style={styles.list}>
                  {suggestions.map((recipe, index) => (
                    <RecipeCard
                      key={index}
                      recipe={recipe}
                      isFavorite={!!suggestionFavorites[index]}
                      onToggleFavorite={() => toggleSuggestionFavorite(index, recipe)}
                      onPress={() => openRecipe(recipe, 'suggestion', suggestionFavorites[index])}
                    />
                  ))}
                </View>
                <Button
                  label="Générer d'autres idées"
                  variant="secondary"
                  onPress={() => loadSuggestions(true)}
                  loading={regenerating}
                />
              </>
            )}
          </View>
        )}

        {activeTab === 'frigo' && (
          <View style={styles.tabContent}>
            {fridgeState !== 'result' && (
              <>
                {fridgePhotos.length === 0 ? (
                  <View style={styles.fridgeEmpty}>
                    <View style={styles.iconCircle}>
                      <CameraIcon color={colors.accent} size={32} />
                    </View>
                    <Text style={styles.fridgeTitle}>Qu'est-ce que tu as chez toi ?</Text>
                    <Text style={styles.fridgeSubtitle}>Photographie ton frigo, ton congélateur ou tes placards</Text>
                  </View>
                ) : (
                  <View style={styles.thumbRow}>
                    {fridgePhotos.map((photo, index) => (
                      <View key={photo.uri} style={styles.thumbWrap}>
                        <Image source={{ uri: photo.uri }} style={styles.thumb} />
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Supprimer cette photo"
                          onPress={() => removeFridgePhoto(index)}
                          hitSlop={8}
                          style={styles.thumbRemove}
                        >
                          <X color={colors.textPrimary} size={14} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}

                {fridgePhotos.length < MAX_FRIDGE_PHOTOS && (
                  <Button
                    label="Ajouter une photo"
                    variant="secondary"
                    onPress={handleAddFridgePhoto}
                    disabled={fridgeState === 'analyzing'}
                  />
                )}

                {fridgeState === 'analyzing' ? (
                  <View style={styles.loadingBlock}>
                    <ActivityIndicator color={colors.accent} size="large" />
                    <Text style={styles.loadingText}>Analyse de tes ingrédients...</Text>
                  </View>
                ) : (
                  <Button label="Trouver des recettes" onPress={handleAnalyzeFridge} disabled={fridgePhotos.length === 0} />
                )}

                {fridgeState === 'error' && fridgeError && (
                  <View style={styles.errorBlock}>
                    <Text style={styles.errorText}>{fridgeError}</Text>
                  </View>
                )}
              </>
            )}

            {fridgeState === 'result' && fridgeResult && (
              <>
                <View style={styles.ingredientsCard}>
                  <Text style={styles.ingredientsTitle}>Ingrédients détectés</Text>
                  <View style={styles.pillsWrap}>
                    {fridgeResult.ingredients_detectes.map((ingredient) => (
                      <View key={ingredient} style={styles.ingredientPill}>
                        <Text style={styles.ingredientPillText}>{ingredient}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.list}>
                  {fridgeResult.recettes.map((recipe, index) => (
                    <RecipeCard
                      key={index}
                      recipe={recipe}
                      missingIngredients={recipe.ingredients_manquants}
                      isFavorite={!!fridgeFavorites[index]}
                      onToggleFavorite={() => toggleFridgeFavorite(index, recipe)}
                      onPress={() => openRecipe(recipe, 'frigo', fridgeFavorites[index])}
                    />
                  ))}
                </View>

                <Button label="Recommencer" variant="secondary" onPress={resetFridge} />
              </>
            )}
          </View>
        )}

        {activeTab === 'favoris' && (
          <View style={styles.tabContent}>
            {savedLoading ? (
              <ActivityIndicator color={colors.accent} size="large" />
            ) : savedRecipes.length === 0 ? (
              <View style={styles.emptyBlock}>
                <Heart color={colors.textTertiary} size={32} />
                <Text style={styles.emptyTitle}>Aucune recette enregistrée</Text>
                <Text style={styles.emptyText}>
                  Mets une recette en favori depuis Suggestions ou Mon frigo pour la retrouver ici.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {savedRecipes.map((row) => (
                  <RecipeCard
                    key={row.id}
                    recipe={row}
                    isFavorite
                    onToggleFavorite={() => handleDeleteSaved(row)}
                    onPress={() => openSavedRecipe(row)}
                    onLongPress={() => handleDeleteSaved(row)}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function removeValue(map: Record<number, string>, value: string): Record<number, string> {
  const next = { ...map };
  for (const key of Object.keys(next)) {
    if (next[Number(key)] === value) delete next[Number(key)];
  }
  return next;
}

const styles = StyleSheet.create({
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
    color: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  tabContent: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  loadingBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  loadingText: {
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
    gap: spacing.sm,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
  },
  fridgeEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
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
  fridgeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  fridgeSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  thumbRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  thumbWrap: {
    width: 80,
    height: 80,
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  ingredientPill: {
    backgroundColor: colors.background,
    borderRadius: radii.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
  },
  ingredientPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptyBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
