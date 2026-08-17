import { DISHES, SEASONAL } from "../constants/nutrition.js";
import type {
  Appliance,
  DietaryRestriction,
  GenerateRequest,
  GenerateResponse,
  Meal,
  MealType,
  Mood,
  NutritionalSummary,
  ShoppingListCategory,
  ShoppingListItem,
} from "../types/index.js";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function monthKey(d: Date): string {
  return MONTH_KEYS[d.getMonth()];
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function todayStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay() === 0 ? 7 : now.getDay();
  const diff = now.getDate() - day + 1;
  return new Date(now.getFullYear(), now.getMonth(), diff);
}

function roundToStep(n: number, step: number): number {
  return Math.round(n / step) * step;
}

export function generateMealPlan(input: GenerateRequest): GenerateResponse {
  const { budget, people_count, moods, dietary_restrictions, appliances } = input;

  const restrictions = new Set<DietaryRestriction>(dietary_restrictions);
  const has = (r: DietaryRestriction) => restrictions.has(r);

  const vegOnly = has("vegetarian") && !has("non_vegetarian");
  const nonVegOnly = has("non_vegetarian") && !has("vegetarian");
  const vegOK = (dish: (typeof DISHES)[number]) =>
    vegOnly ? dish.dietary.vegetarian : !nonVegOnly || !dish.dietary.vegetarian;

  const candidateDishes = DISHES.filter((dish) => {
    if (has("no_onions") && dish.dietary.onions) return false;
    if (has("no_garlic") && dish.dietary.garlic) return false;
    if (has("no_dairy") && dish.dietary.dairy) return false;
    if (has("gluten_free") && !dish.dietary.gluten) return false;
    if (has("no_eggs") && dish.dietary.eggs) return false;
    if (!vegOK(dish)) return false;
    if (dish.appliances_needed.some((a) => !appliances.includes(a as Appliance))) return false;
    return true;
  });

  if (candidateDishes.length === 0) {
    throw new Error("No dishes match the selected dietary restrictions and appliances.");
  }

  const budgetPerServe = budget / (people_count * 21);
  const affordable = candidateDishes.filter((d) => d.cost_per_serve <= budgetPerServe * 1.25);
  const pool = affordable.length >= 6 ? affordable : candidateDishes;

  const preferred = pool.filter((d) => d.tags.some((t) => moods.includes(t as Mood)));
  const dishPool = preferred.length >= 3 ? preferred : pool;

  const seasonal = SEASONAL[monthKey(new Date())];
  const seasonalBoosted = [...dishPool].sort((a, b) => {
    const aSeasonal = a.ingredients.some((i) => seasonal.cheap.includes(i.name));
    const bSeasonal = b.ingredients.some((i) => seasonal.cheap.includes(i.name));
    return Number(bSeasonal) - Number(aSeasonal);
  });

  const weekStart = todayStartOfWeek();
  const meals: Meal[] = [];
  let idx = 0;

  for (let day = 1; day <= 7; day++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + day - 1);

    for (const mealType of MEAL_TYPES) {
      const byType = seasonalBoosted.filter((d) => d.meal_type === mealType);
      const candidates = byType.length > 0 ? byType : seasonalBoosted;
      const dish = candidates[idx % candidates.length];
      idx++;

      const perServeIngredient = dish.ingredients.map((ing) => ({
        name: ing.name,
        qty: roundToStep((ing.qty / 4) * people_count, 5) || ing.qty,
        unit: ing.unit,
      }));

      meals.push({
        day,
        date: isoDate(date),
        meal_type: mealType,
        meal_name: dish.meal_name,
        cuisine: dish.cuisine,
        cooking_time_mins: dish.cooking_time_mins,
        difficulty: dish.difficulty,
        ingredients: perServeIngredient,
        nutritional_info: dish.nutritional_info,
        appliances_needed: dish.appliances_needed,
        instructions: dish.instructions,
      });
    }
  }

  const shoppingList = buildShoppingList(meals, budget);
  const nutritionalSummary = buildNutritionalSummary(meals);

  const mealPlanId = crypto.randomUUID();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    meal_plan_id: mealPlanId,
    week_start_date: isoDate(weekStart),
    week_end_date: isoDate(weekEnd),
    meals,
    shopping_list: shoppingList,
    nutritional_summary: nutritionalSummary,
  };
}

const CATEGORY_ORDER = [
  "STAPLES & GRAINS",
  "VEGETABLES",
  "PROTEIN",
  "SPICES & CONDIMENTS",
  "DAIRY & OTHERS",
];

function categorize(name: string): string {
  const n = name.toLowerCase();
  if (["rice", "atta", "semolina", "wheat flour", "poha", "bread"].some((k) => n.includes(k)))
    return "STAPLES & GRAINS";
  if (["dal", "lentil", "rajma", "kidney", "chickpea", "chana", "moong", "toor", "urad"].some((k) => n.includes(k)))
    return "STAPLES & GRAINS";
  if (["onion", "tomato", "potato", "spinach", "broccoli", "capsicum", "carrot", "peas", "cauliflower", "cucumber", "lettuce", "poha"].some((k) => n.includes(k)))
    return "VEGETABLES";
  if (["paneer", "chicken", "egg", "curd", "milk"].some((k) => n.includes(k)))
    return "PROTEIN";
  if (["turmeric", "cumin", "mustard", "salt", "oil", "ghee", "masala", "chilli", "ginger", "soy", "garam", "peanut", "curry", "cream", "butter", "coriander"].some((k) => n.includes(k)))
    return "SPICES & CONDIMENTS";
  return "DAIRY & OTHERS";
}

function normalizeUnit(unit: string): { unit: string; factor: number } {
  if (unit === "g") return { unit: "kg", factor: 1000 };
  if (unit === "ml") return { unit: "l", factor: 1000 };
  return { unit, factor: 1 };
}

function buildShoppingList(meals: Meal[], budget: number): ShoppingListCategory[] {
  const grouped = new Map<string, ShoppingListItem>();

  for (const meal of meals) {
    for (const ing of meal.ingredients) {
      const category = categorize(ing.name);
      const { unit, factor } = normalizeUnit(ing.unit);
      const qty = unit === "kg" || unit === "l" ? ing.qty / factor : ing.qty;

      const key = `${category}|${ing.name}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.qty += qty;
        existing.est_price_max = Math.round(existing.est_price_max * 1.02);
        if (!existing.used_in.includes(`${meal.day} ${meal.meal_type}`)) {
          existing.used_in.push(`${meal.day} ${meal.meal_type}`);
        }
      } else {
        grouped.set(key, {
          name: ing.name,
          qty: Math.round(qty * 100) / 100,
          unit,
          est_price_min: 10,
          est_price_max: 20,
          used_in: [`${meal.day} ${meal.meal_type}`],
        });
      }
    }
  }

  const byCategory = new Map<string, ShoppingListItem[]>();
  for (const item of grouped.values()) {
    const list = byCategory.get(categorize(item.name)) ?? [];
    list.push(item);
    byCategory.set(categorize(item.name), list);
  }

  return CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((category) => ({
    category,
    items: byCategory.get(category)!,
  }));
}

function buildNutritionalSummary(meals: Meal[]): NutritionalSummary {
  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.nutritional_info.calories,
      protein: acc.protein + m.nutritional_info.protein_g,
      carbs: acc.carbs + m.nutritional_info.carbs_g,
      fat: acc.fat + m.nutritional_info.fat_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return {
    daily_avg_calories: Math.round(totals.calories / 7),
    daily_avg_protein: Math.round(totals.protein / 7),
    daily_avg_carbs: Math.round(totals.carbs / 7),
    daily_avg_fat: Math.round(totals.fat / 7),
  };
}

export function getSeasonalNote(): string {
  const s = SEASONAL[monthKey(new Date())];
  return `${s.note} | Cheap now: ${s.cheap.join(", ")}`;
}