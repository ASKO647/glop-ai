import { Clock, Flame, Gauge, Heart } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

type RecipeCardData = {
  titre: string;
  description: string;
  kcal: number;
  temps_preparation: string;
  difficulte: string;
};

type RecipeCardProps = {
  recipe: RecipeCardData;
  missingIngredients?: string[];
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
  onLongPress?: () => void;
};

/** List card shared by the Suggestions, Mon frigo and Favoris tabs. */
export default function RecipeCard({
  recipe,
  missingIngredients,
  isFavorite,
  onToggleFavorite,
  onPress,
  onLongPress,
}: RecipeCardProps) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        onPress={onToggleFavorite}
        hitSlop={8}
        style={({ pressed }) => [styles.favoriteButton, pressed && styles.favoriteButtonPressed]}
      >
        <Heart color={isFavorite ? colors.accent : colors.textTertiary} fill={isFavorite ? colors.accent : 'transparent'} size={20} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.body, pressed && styles.bodyPressed]}
      >
        <Text style={styles.title} numberOfLines={1}>
          {recipe.titre}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {recipe.description}
        </Text>

        {missingIngredients && missingIngredients.length > 0 && (
          <Text style={styles.missing} numberOfLines={2}>
            Ingrédients manquants : {missingIngredients.join(', ')}
          </Text>
        )}

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
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
  },
  favoriteButtonPressed: {
    opacity: 0.6,
  },
  body: {
    padding: spacing.md,
    paddingRight: spacing.xl,
    gap: spacing.sm,
  },
  bodyPressed: {
    opacity: 0.85,
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
  missing: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
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
