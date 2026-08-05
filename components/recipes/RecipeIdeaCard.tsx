import { Clock, Flame, Gauge, Heart } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { recipeImage } from '../../constants/images';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import type { Recipe } from '../../lib/recipes';
import AppImage from '../ui/AppImage';

const IMAGE_HEIGHT = 120;

type RecipeIdeaCardProps = {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
};

/** Vertical, image-led recipe card used by the Suggestions tab's category browsing. */
export default function RecipeIdeaCard({ recipe, isFavorite, onToggleFavorite, onPress }: RecipeIdeaCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <AppImage source={recipeImage(recipe.categorie_visuelle)} style={styles.image} overlay={0.25}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          onPress={onToggleFavorite}
          hitSlop={8}
          style={({ pressed }) => [styles.favoriteButton, pressed && styles.favoriteButtonPressed]}
        >
          <Heart color={colors.white} fill={isFavorite ? colors.white : 'transparent'} size={16} />
        </Pressable>
      </AppImage>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {recipe.titre}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {recipe.description}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Flame color={colors.accent} size={12} />
            <Text style={styles.metaText}>{recipe.kcal} kcal</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock color={colors.accent} size={12} />
            <Text style={styles.metaText}>{recipe.temps_preparation}</Text>
          </View>
          <View style={styles.metaItem}>
            <Gauge color={colors.accent} size={12} />
            <Text style={styles.metaText}>{recipe.difficulte}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      overflow: 'hidden',
    },
    cardPressed: {
      opacity: 0.9,
    },
    image: {
      height: IMAGE_HEIGHT,
      width: '100%',
    },
    // Fixed black regardless of theme — it sits on top of a photo, not the app background, same
    // reasoning as AppImage's own `overlay` (see that file's comment).
    favoriteButton: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      width: 32,
      height: 32,
      borderRadius: radii.full,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    favoriteButtonPressed: {
      opacity: 0.7,
    },
    body: {
      padding: spacing.md,
      gap: 6,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    description: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    metaRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: 2,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
}
