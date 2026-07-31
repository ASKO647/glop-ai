import { useEffect, useState } from 'react';
import { todayISODate } from '../constants/dashboard';
import { supabase } from '../lib/supabase';

export type Meal = {
  id: string;
  name: string;
  kcal: number;
  proteines: number;
  glucides: number;
  lipides: number;
  created_at: string;
};

export type MealTotals = { kcal: number; proteines: number; glucides: number; lipides: number };

const EMPTY_TOTALS: MealTotals = { kcal: 0, proteines: 0, glucides: 0, lipides: 0 };

export function useTodayMeals(userId: string | undefined) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setMeals([]);
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('meals')
        .select('id, name, kcal, proteines, glucides, lipides, created_at')
        .eq('user_id', userId)
        .eq('date', todayISODate())
        .order('created_at', { ascending: false });

      if (!cancelled) {
        setMeals((data ?? []) as Meal[]);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const totals: MealTotals = meals.reduce(
    (acc, meal) => ({
      kcal: acc.kcal + meal.kcal,
      proteines: acc.proteines + meal.proteines,
      glucides: acc.glucides + meal.glucides,
      lipides: acc.lipides + meal.lipides,
    }),
    EMPTY_TOTALS
  );

  return { meals, totals, loading };
}
