import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RecipeCategoryId, RecipeCategoryInfo } from '../../constants/recipes';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { hexToRgba } from '../../lib/color';

const BUBBLE_SIZE = 64;

type CategoryStoryBarProps = {
  categories: RecipeCategoryInfo[];
  selected: RecipeCategoryId;
  onSelect: (id: RecipeCategoryId) => void;
};

/** Instagram-stories-style horizontal category picker. */
export default function CategoryStoryBar({ categories, selected, onSelect }: CategoryStoryBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {categories.map((category) => {
        const active = category.id === selected;
        const Icon = category.Icon;
        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={category.label}
            onPress={() => onSelect(category.id)}
            style={styles.item}
          >
            <View style={[styles.bubble, active && styles.bubbleActive]}>
              <Icon color={colors.accent} size={26} />
            </View>
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    item: {
      width: BUBBLE_SIZE,
      alignItems: 'center',
      gap: 6,
    },
    bubble: {
      width: BUBBLE_SIZE,
      height: BUBBLE_SIZE,
      borderRadius: radii.full,
      borderWidth: 2,
      borderColor: colors.accent,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bubbleActive: {
      borderWidth: 3,
      backgroundColor: hexToRgba(colors.accent, 0.12),
    },
    label: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    labelActive: {
      color: colors.textPrimary,
      fontWeight: '700',
    },
  });
}
