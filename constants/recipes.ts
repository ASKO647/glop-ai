import { Apple, Cake, Leaf, Moon, Sun, Sunrise, type LucideIcon } from 'lucide-react-native';

export type RecipeCategoryId = 'petit-dejeuner' | 'dejeuner' | 'diner' | 'collation' | 'dessert' | 'vegetarien';

export type RecipeCategoryInfo = {
  id: RecipeCategoryId;
  label: string;
  Icon: LucideIcon;
  /** How the category reads inside the generation prompt (French, lowercase) — the AI prompt itself stays French regardless of app locale, so this is never translated. */
  promptLabel: string;
};

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

// Structural order + icon/prompt data only — `label` is translated on demand via getRecipeCategories/getRecipeCategoryInfo.
export const RECIPE_CATEGORY_IDS: RecipeCategoryId[] = [
  'petit-dejeuner',
  'dejeuner',
  'diner',
  'collation',
  'dessert',
  'vegetarien',
];

const RECIPE_CATEGORY_ICONS: Record<RecipeCategoryId, LucideIcon> = {
  'petit-dejeuner': Sunrise,
  dejeuner: Sun,
  diner: Moon,
  collation: Apple,
  dessert: Cake,
  vegetarien: Leaf,
};

const RECIPE_CATEGORY_PROMPT_LABELS: Record<RecipeCategoryId, string> = {
  'petit-dejeuner': 'petit-déjeuner',
  dejeuner: 'déjeuner',
  diner: 'dîner',
  collation: 'collation ou en-cas',
  dessert: 'dessert',
  vegetarien: 'recette végétarienne',
};

export function getRecipeCategories(t: TranslateFn): RecipeCategoryInfo[] {
  return RECIPE_CATEGORY_IDS.map((id) => ({
    id,
    label: t(`recipes.categories.${id}`),
    Icon: RECIPE_CATEGORY_ICONS[id],
    promptLabel: RECIPE_CATEGORY_PROMPT_LABELS[id],
  }));
}

export function getRecipeCategoryInfo(id: RecipeCategoryId, t: TranslateFn): RecipeCategoryInfo {
  const categories = getRecipeCategories(t);
  return categories.find((c) => c.id === id) ?? categories[0];
}

/** Preselects the category matching the current time of day: before 10h30 → petit-déj, before 14h30 → déjeuner, before 17h30 → collation, else dîner. */
export function getDefaultRecipeCategory(date: Date = new Date()): RecipeCategoryId {
  const minutesSinceMidnight = date.getHours() * 60 + date.getMinutes();
  if (minutesSinceMidnight < 10 * 60 + 30) return 'petit-dejeuner';
  if (minutesSinceMidnight < 14 * 60 + 30) return 'dejeuner';
  if (minutesSinceMidnight < 17 * 60 + 30) return 'collation';
  return 'diner';
}
