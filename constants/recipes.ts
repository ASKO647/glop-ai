import { Apple, Cake, Leaf, Moon, Sun, Sunrise, type LucideIcon } from 'lucide-react-native';

export type RecipeCategoryId = 'petit-dejeuner' | 'dejeuner' | 'diner' | 'collation' | 'dessert' | 'vegetarien';

export type RecipeCategoryInfo = {
  id: RecipeCategoryId;
  label: string;
  Icon: LucideIcon;
  /** How the category reads inside the generation prompt (French, lowercase). */
  promptLabel: string;
};

export const RECIPE_CATEGORIES: RecipeCategoryInfo[] = [
  { id: 'petit-dejeuner', label: 'Petit-déj', Icon: Sunrise, promptLabel: 'petit-déjeuner' },
  { id: 'dejeuner', label: 'Déjeuner', Icon: Sun, promptLabel: 'déjeuner' },
  { id: 'diner', label: 'Dîner', Icon: Moon, promptLabel: 'dîner' },
  { id: 'collation', label: 'Collation', Icon: Apple, promptLabel: 'collation ou en-cas' },
  { id: 'dessert', label: 'Dessert', Icon: Cake, promptLabel: 'dessert' },
  { id: 'vegetarien', label: 'Végé', Icon: Leaf, promptLabel: 'recette végétarienne' },
];

export function getRecipeCategoryInfo(id: RecipeCategoryId): RecipeCategoryInfo {
  return RECIPE_CATEGORIES.find((c) => c.id === id) ?? RECIPE_CATEGORIES[0];
}

/** Preselects the category matching the current time of day: before 10h30 → petit-déj, before 14h30 → déjeuner, before 17h30 → collation, else dîner. */
export function getDefaultRecipeCategory(date: Date = new Date()): RecipeCategoryId {
  const minutesSinceMidnight = date.getHours() * 60 + date.getMinutes();
  if (minutesSinceMidnight < 10 * 60 + 30) return 'petit-dejeuner';
  if (minutesSinceMidnight < 14 * 60 + 30) return 'dejeuner';
  if (minutesSinceMidnight < 17 * 60 + 30) return 'collation';
  return 'diner';
}
