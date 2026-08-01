import { useCallback, useEffect, useState } from 'react';
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

/** Meals (and their totals) for `date` — 0 across the board when nothing was scanned that day. */
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
      .select('id, name, kcal, proteines, glucides, lipides, created_at')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: false });

    setMeals((data ?? []) as Meal[]);
    setLoading(false);
  }, [userId, date]);

  useEffect(() => {
    // Clear the previous date's meals immediately so a date switch never
    // shows stale totals while the new date's rows are still in flight.
    setMeals([]);
    load();
  }, [load]);

  const totals: MealTotals = meals.reduce(
    (acc, meal) => ({
      kcal: acc.kcal + meal.kcal,
      proteines: acc.proteines + meal.proteines,
      glucides: acc.glucides + meal.glucides,
      lipides: acc.lipides + meal.lipides,
    }),
    EMPTY_TOTALS
  );

  return { meals, totals, loading, refetch: load };
}
