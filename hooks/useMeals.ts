import { useCallback, useEffect, useMemo, useState } from 'react';
import { MEAL_TYPES, type MealType } from '../constants/dashboard';
import { supabase } from '../lib/supabase';

export type Meal = {
  id: string;
  name: string;
  portion: string | null;
  kcal: number;
  proteines: number;
  glucides: number;
  lipides: number;
  mealType: MealType;
  created_at: string;
};

export type MealTotals = { kcal: number; proteines: number; glucides: number; lipides: number };

export type NewMealInput = {
  name: string;
  portion?: string | null;
  kcal: number;
  proteines?: number;
  glucides?: number;
  lipides?: number;
  mealType: MealType;
};

export type MealPatch = Partial<Pick<Meal, 'name' | 'portion' | 'kcal' | 'proteines' | 'glucides' | 'lipides'>>;

type MealRow = {
  id: string;
  name: string;
  portion: string | null;
  kcal: number;
  proteines: number;
  glucides: number;
  lipides: number;
  meal_type: MealType;
  created_at: string;
};

const MEAL_COLUMNS = 'id, name, portion, kcal, proteines, glucides, lipides, meal_type, created_at';

const EMPTY_TOTALS: MealTotals = { kcal: 0, proteines: 0, glucides: 0, lipides: 0 };

function fromRow(row: MealRow): Meal {
  return {
    id: row.id,
    name: row.name,
    portion: row.portion,
    kcal: row.kcal,
    proteines: row.proteines,
    glucides: row.glucides,
    lipides: row.lipides,
    mealType: row.meal_type,
    created_at: row.created_at,
  };
}

function sumTotals(meals: Meal[]): MealTotals {
  return meals.reduce(
    (acc, meal) => ({
      kcal: acc.kcal + meal.kcal,
      proteines: acc.proteines + meal.proteines,
      glucides: acc.glucides + meal.glucides,
      lipides: acc.lipides + meal.lipides,
    }),
    EMPTY_TOTALS
  );
}

function emptyMealsByType(): Record<MealType, Meal[]> {
  return { 'petit-dejeuner': [], dejeuner: [], diner: [], collation: [] };
}

/** Meals (grouped by meal_type, with per-meal and day totals) for `date` — empty across the board when nothing was logged that day. */
export function useMeals(userId: string | undefined, date: string) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setMeals([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data } = await supabase
      .from('meals')
      .select(MEAL_COLUMNS)
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: false });

    setMeals(((data ?? []) as MealRow[]).map(fromRow));
    setLoading(false);
  }, [userId, date]);

  useEffect(() => {
    // Clear the previous date's meals immediately so a date switch never
    // shows stale totals while the new date's rows are still in flight.
    setMeals([]);
    load();
  }, [load]);

  const mealsByType = useMemo(() => {
    const grouped = emptyMealsByType();
    for (const meal of meals) grouped[meal.mealType].push(meal);
    return grouped;
  }, [meals]);

  const totals = useMemo(() => sumTotals(meals), [meals]);

  const totalsByType = useMemo(() => {
    const result = {} as Record<MealType, MealTotals>;
    for (const { id } of MEAL_TYPES) result[id] = sumTotals(mealsByType[id]);
    return result;
  }, [mealsByType]);

  const addMeal = async (input: NewMealInput): Promise<boolean> => {
    if (!userId) return false;
    const { data, error } = await supabase
      .from('meals')
      .insert({
        user_id: userId,
        date,
        name: input.name,
        portion: input.portion || null,
        kcal: input.kcal,
        proteines: input.proteines ?? 0,
        glucides: input.glucides ?? 0,
        lipides: input.lipides ?? 0,
        meal_type: input.mealType,
      })
      .select(MEAL_COLUMNS)
      .single();

    if (error || !data) return false;
    setMeals((prev) => [fromRow(data as MealRow), ...prev]);
    return true;
  };

  const updateMeal = async (id: string, patch: MealPatch): Promise<boolean> => {
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.portion !== undefined) row.portion = patch.portion || null;
    if (patch.kcal !== undefined) row.kcal = patch.kcal;
    if (patch.proteines !== undefined) row.proteines = patch.proteines;
    if (patch.glucides !== undefined) row.glucides = patch.glucides;
    if (patch.lipides !== undefined) row.lipides = patch.lipides;

    const { error } = await supabase.from('meals').update(row).eq('id', id);
    if (error) return false;
    setMeals((prev) => prev.map((meal) => (meal.id === id ? { ...meal, ...patch } : meal)));
    return true;
  };

  const deleteMeal = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('meals').delete().eq('id', id);
    if (error) return false;
    setMeals((prev) => prev.filter((meal) => meal.id !== id));
    return true;
  };

  const moveMeal = async (id: string, mealType: MealType): Promise<boolean> => {
    const { error } = await supabase.from('meals').update({ meal_type: mealType }).eq('id', id);
    if (error) return false;
    setMeals((prev) => prev.map((meal) => (meal.id === id ? { ...meal, mealType } : meal)));
    return true;
  };

  return {
    meals,
    mealsByType,
    totals,
    totalsByType,
    loading,
    refetch: load,
    addMeal,
    updateMeal,
    deleteMeal,
    moveMeal,
  };
}
