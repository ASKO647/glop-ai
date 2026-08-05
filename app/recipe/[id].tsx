import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, Flame, Gauge, Heart, Users } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MealTypePills from '../../components/dashboard/MealTypePills';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import { guessMealTypeNow, todayISODate, type MealType } from '../../constants/dashboard';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import { showAlert } from '../../lib/alert';
import type { RecipeIngredient } from '../../lib/recipes';
import { supabase } from '../../lib/supabase';

const DEFAULT_PORTIONS = 2;

// Loose enough to hold either a freshly-generated `Recipe`/`FridgeRecipe` (has `portions`,
// possibly `ingredients_manquants`) or a `saved_recipes` row (neither) — both arrive here as
// parsed JSON, so a single structural shape covers whichever one is actually in hand.
type DetailRecipe = {
  titre: string;
  description: string;
  kcal: number;
  proteines: number;
  glucides: number;
  lipides: number;
  temps_preparation: string;
  difficulte: string;
  portions?: number;
  ingredients: RecipeIngredient[];
  etapes: string[];
  ingredients_manquants?: string[];
};

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { id, recette: recetteParam, source: sourceParam, savedId: savedIdParam } = useLocalSearchParams<{
    id: string;
    recette?: string;
    source?: string;
    savedId?: string;
  }>();

  const [recipe, setRecipe] = useState<DetailRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(savedIdParam || null);
  const [favoriting, setFavoriting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [mealType, setMealType] = useState<MealType>(guessMealTypeNow());

  const isFavorite = !!savedId;

  useEffect(() => {
    if (recetteParam) {
      try {
        setRecipe(JSON.parse(recetteParam) as DetailRecipe);
      } catch {
        setLoadError(t('recipes.detail.loadError'));
      }
      setLoading(false);
      return;
    }

    if (!id || id === 'preview') {
      setLoadError(t('recipes.detail.notFound'));
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('saved_recipes').select('*').eq('id', id).maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setLoadError(t('recipes.detail.notFound'));
      } else {
        setRecipe(data as DetailRecipe);
        setSavedId(data.id as string);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // Params from expo-router are stable strings for the lifetime of this screen instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleFavorite = async () => {
    if (!recipe || !user || favoriting) return;
    setFavoriting(true);

    if (isFavorite && savedId) {
      const { error } = await supabase.from('saved_recipes').delete().eq('id', savedId);
      setFavoriting(false);
      if (error) {
        showAlert(t('common.error'), t('recipes.detail.removeFavoriteError'));
        return;
      }
      setSavedId(null);
      return;
    }

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
        source: sourceParam === 'frigo' ? 'frigo' : 'suggestion',
      })
      .select()
      .single();
    setFavoriting(false);
    if (error || !data) {
      showAlert(t('common.error'), t('recipes.addFavoriteError'));
      return;
    }
    setSavedId(data.id as string);
  };

  const handleAddToMeals = async () => {
    if (!recipe || !user || adding) return;
    setAdding(true);
    const { error } = await supabase.from('meals').insert({
      user_id: user.id,
      date: todayISODate(),
      name: recipe.titre,
      kcal: recipe.kcal,
      proteines: recipe.proteines,
      glucides: recipe.glucides,
      lipides: recipe.lipides,
      meal_type: mealType,
    });
    setAdding(false);

    if (error) {
      showAlert(t('common.error'), t('recipes.detail.addToMealsError'));
      return;
    }

    showAlert(t('recipes.detail.addedAlertTitle'), t('recipes.detail.addedAlertMessage', { title: recipe.titre }));
    router.replace('/');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top']}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  if (loadError || !recipe) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top']}>
        <Text style={styles.errorTitle}>{loadError ?? t('recipes.detail.notFound')}</Text>
        <Button label={t('recipes.detail.back')} variant="secondary" onPress={() => router.back()} style={styles.errorButton} />
      </SafeAreaView>
    );
  }

  const macroMax = Math.max(recipe.proteines, recipe.glucides, recipe.lipides, 1);
  const portions = recipe.portions ?? DEFAULT_PORTIONS;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
        >
          <ArrowLeft color={colors.textPrimary} size={22} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? t('recipes.favoriteToggle.remove') : t('recipes.favoriteToggle.add')}
          onPress={handleToggleFavorite}
          disabled={favoriting}
          hitSlop={12}
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
        >
          <Heart color={isFavorite ? colors.accent : colors.textPrimary} fill={isFavorite ? colors.accent : 'transparent'} size={20} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{recipe.titre}</Text>
          <Text style={styles.description}>{recipe.description}</Text>

          {recipe.ingredients_manquants && recipe.ingredients_manquants.length > 0 && (
            <View style={styles.missingBlock}>
              <Text style={styles.missingText}>
                {t('recipes.missingIngredients', { list: recipe.ingredients_manquants.join(', ') })}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.metaCard}>
          <MetaItem colors={colors} styles={styles} Icon={Flame} value={`${recipe.kcal}`} label={t('recipes.detail.kcal')} />
          <View style={styles.metaDivider} />
          <MetaItem colors={colors} styles={styles} Icon={Clock} value={recipe.temps_preparation} label={t('recipes.detail.time')} />
          <View style={styles.metaDivider} />
          <MetaItem colors={colors} styles={styles} Icon={Gauge} value={recipe.difficulte} label={t('recipes.detail.difficulty')} />
          <View style={styles.metaDivider} />
          <MetaItem colors={colors} styles={styles} Icon={Users} value={`${portions}`} label={t('recipes.detail.portions')} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('recipes.detail.macrosTitle')}</Text>
          <View style={styles.macroCard}>
            <MacroRow styles={styles} label={t('recipes.detail.proteins')} grams={recipe.proteines} max={macroMax} />
            <MacroRow styles={styles} label={t('recipes.detail.carbs')} grams={recipe.glucides} max={macroMax} />
            <MacroRow styles={styles} label={t('recipes.detail.fats')} grams={recipe.lipides} max={macroMax} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('recipes.detail.ingredientsTitle')}</Text>
          <View style={styles.ingredientsList}>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientRow}>
                <View style={styles.bullet} />
                <Text style={styles.ingredientText}>
                  {ingredient.nom} — {ingredient.quantite}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('recipes.detail.preparationTitle')}</Text>
          <View style={styles.stepsList}>
            {recipe.etapes.map((etape, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{etape}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.mealTypeBlock}>
          <Text style={styles.mealTypeLabel}>{t('recipes.detail.addTo')}</Text>
          <MealTypePills value={mealType} onChange={setMealType} />
        </View>

        <Button label={t('recipes.detail.addToMealsButton')} onPress={handleAddToMeals} loading={adding} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaItem({
  colors,
  styles,
  Icon,
  value,
  label,
}: {
  colors: Colors;
  styles: ReturnType<typeof makeStyles>;
  Icon: typeof Flame;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.metaItem}>
      <Icon color={colors.accent} size={18} />
      <Text style={styles.metaValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

function MacroRow({
  styles,
  label,
  grams,
  max,
}: {
  styles: ReturnType<typeof makeStyles>;
  label: string;
  grams: number;
  max: number;
}) {
  return (
    <View style={styles.macroRow}>
      <View style={styles.macroLabelRow}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>{grams} g</Text>
      </View>
      <ProgressBar progress={grams / max} height={6} />
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingScreen: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    errorTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    errorButton: {
      alignSelf: 'stretch',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    headerButton: {
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
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 100,
      gap: spacing.lg,
    },
    titleBlock: {
      gap: spacing.sm,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    description: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    missingBlock: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.sm,
    },
    missingText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.warning,
    },
    metaCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      paddingVertical: spacing.md,
    },
    metaItem: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    metaValue: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    metaLabel: {
      fontSize: 10,
      color: colors.labelMuted,
    },
    metaDivider: {
      width: 1,
      height: '60%',
      backgroundColor: colors.border,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    mealTypeBlock: {
      gap: spacing.sm,
    },
    mealTypeLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    macroCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.md,
    },
    macroRow: {
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
    ingredientsList: {
      gap: spacing.xs,
    },
    ingredientRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    bullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
    },
    ingredientText: {
      fontSize: 14,
      color: colors.textPrimary,
      flex: 1,
    },
    stepsList: {
      gap: spacing.md,
    },
    stepRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    stepCircle: {
      width: 28,
      height: 28,
      borderRadius: radii.full,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Step number sits on an accent-colored circle — must use onAccent, not `background`
    // (the old dark-only shortcut only worked because background happened to be dark).
    stepNumber: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.onAccent,
    },
    stepText: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 20,
    },
  });
}
