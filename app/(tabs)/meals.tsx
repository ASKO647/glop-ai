import { useRouter } from 'expo-router';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppImage from '../../components/ui/AppImage';
import { isoDaysAgo, todayISODate } from '../../constants/dashboard';
import { appImage } from '../../constants/images';
import type { Colors } from '../../constants/theme';
import { radii, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

const MEAL_BREAKFAST_IMAGE = appImage('meal-breakfast.jpg');
const MEAL_LUNCH_IMAGE = appImage('meal-lunch.jpg');
const MEAL_DINNER_IMAGE = appImage('meal-dinner.jpg');

/** Generic thumbnail for a meal with no photo of its own, picked from the hour it was logged. */
function getMealTimeThumbnail(createdAt: string): ImageSourcePropType {
  const hour = new Date(createdAt).getHours();
  if (hour < 11) return MEAL_BREAKFAST_IMAGE;
  if (hour < 17) return MEAL_LUNCH_IMAGE;
  return MEAL_DINNER_IMAGE;
}

type Meal = {
  id: string;
  name: string;
  kcal: number;
  date: string;
  created_at: string;
};

type DayGroup = {
  date: string;
  label: string;
  totalKcal: number;
  meals: Meal[];
};

function formatDayLabel(iso: string): string {
  if (iso === todayISODate()) return "Aujourd'hui";
  if (iso === isoDaysAgo(1)) return 'Hier';
  const label = new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function MealsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [groups, setGroups] = useState<DayGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('meals')
        .select('id, name, kcal, date, created_at')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (!cancelled) {
        const byDate = new Map<string, Meal[]>();
        (data ?? []).forEach((meal) => {
          const list = byDate.get(meal.date) ?? [];
          list.push(meal as Meal);
          byDate.set(meal.date, list);
        });
        const result: DayGroup[] = Array.from(byDate.entries()).map(([date, meals]) => ({
          date,
          label: formatDayLabel(date),
          totalKcal: meals.reduce((sum, meal) => sum + meal.kcal, 0),
          meals,
        }));
        setGroups(result);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

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
        <Text style={styles.headerTitle}>Mes repas</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.centered}>
          <UtensilsCrossed color={colors.textTertiary} size={32} />
          <Text style={styles.emptyTitle}>Aucun repas enregistré</Text>
          <Text style={styles.emptyText}>Scanne un repas pour commencer à suivre ton alimentation.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {groups.map((group) => (
            <View key={group.date} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupLabel}>{group.label}</Text>
                <Text style={styles.groupTotal}>{group.totalKcal} kcal</Text>
              </View>
              <View style={styles.mealsList}>
                {group.meals.map((meal) => (
                  <View key={meal.id} style={styles.mealRow}>
                    <AppImage source={getMealTimeThumbnail(meal.created_at)} style={styles.mealThumbnail} overlay={0.3} />
                    <Text style={styles.mealName} numberOfLines={1}>
                      {meal.name}
                    </Text>
                    <Text style={styles.mealKcal}>{meal.kcal} kcal</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
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
  headerTitle: {
    ...typography.heading,
    color: colors.textPrimary,
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
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
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
    gap: spacing.lg,
  },
  group: {
    gap: spacing.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  groupTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  mealsList: {
    gap: spacing.sm,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  mealThumbnail: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
  },
  mealName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  mealKcal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
  });
}
