export type Mood = "spicy_indian" | "quick_easy" | "protein_packed" | "low_calorie" | "budget_minimal";

export type DietaryRestriction = "vegetarian" | "non_vegetarian" | "no_onions" | "no_garlic" | "no_dairy" | "gluten_free" | "no_eggs";

export type Appliance = "cooker" | "microwave" | "stove" | "mixer" | "oven";

export type MealType = "breakfast" | "lunch" | "dinner";

export interface Ingredient {
  name: string;
  qty: number;
  unit: string;
}

export interface NutritionalInfo {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export interface Meal {
  day: number;
  date: string;
  meal_type: MealType;
  meal_name: string;
  cuisine: string;
  cooking_time_mins: number;
  difficulty: string;
  ingredients: Ingredient[];
  nutritional_info: NutritionalInfo;
  appliances_needed: string[];
  instructions: string[];
}

export interface ShoppingListItem {
  name: string;
  qty: number;
  unit: string;
  est_price_min: number;
  est_price_max: number;
  used_in: string[];
}

export interface ShoppingListCategory {
  category: string;
  items: ShoppingListItem[];
}

export interface NutritionalSummary {
  daily_avg_calories: number;
  daily_avg_protein: number;
  daily_avg_carbs: number;
  daily_avg_fat: number;
}

export interface GenerateRequest {
  budget: number;
  people_count: number;
  moods: Mood[];
  dietary_restrictions: DietaryRestriction[];
  appliances: Appliance[];
}

export interface GenerateResponse {
  meal_plan_id: string;
  week_start_date: string;
  week_end_date: string;
  meals: Meal[];
  shopping_list: ShoppingListCategory[];
  nutritional_summary: NutritionalSummary;
}

export interface PlanSummary {
  id: string;
  week_start_date: string;
  moods: Mood[];
  status: "active" | "archived";
}

export interface Preferences {
  budget_default: number;
  people_count_default: number;
  dietary_restrictions: DietaryRestriction[];
  appliances: Appliance[];
}