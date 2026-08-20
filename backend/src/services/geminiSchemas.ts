import { z } from "zod";

const geminiIngredientSchema = z.object({
  name: z.string(),
  qty: z.number().positive(),
  unit: z.string(),
});

const geminiNutritionSchema = z.object({
  calories: z.number().int().positive(),
  protein_g: z.number().nonnegative(),
  carbs_g: z.number().nonnegative(),
  fat_g: z.number().nonnegative(),
  fiber_g: z.number().nonnegative(),
});

const geminiMealSchema = z.object({
  day: z.number().int().min(1).max(7),
  meal_type: z.enum(["breakfast", "lunch", "dinner"]),
  meal_name: z.string().min(1),
  image_url: z.string(),
  cuisine: z.string().min(1),
  cooking_time_mins: z.number().int().positive(),
  difficulty: z.string().min(1),
  ingredients: z.array(geminiIngredientSchema).min(1),
  nutritional_info: geminiNutritionSchema,
  appliances_needed: z.array(z.string().min(1)),
  instructions: z.array(z.string().min(1)).min(1),
});

const geminiPlanNameSchema = z.object({
  day: z.number().int().min(1).max(7),
  meal_type: z.enum(["breakfast", "lunch", "dinner"]),
  meal_name: z.string().min(1),
  cuisine: z.string().min(1),
});

const geminiWeeklyCostSchema = z.object({
  name: z.string().min(1),
  est_weekly_cost_min: z.number().int().nonnegative(),
  est_weekly_cost_max: z.number().int().nonnegative(),
});

export const geminiPlanNamesSchema = z.object({
  meals: z.array(geminiPlanNameSchema).length(21),
  seasonal_note: z.string().optional(),
});

export const geminiMealPlanSchema = z.object({
  meal_plan: z.array(geminiMealSchema).length(21),
});

export const geminiPricesSchema = z.object({
  ingredient_prices: z.array(geminiWeeklyCostSchema).min(1),
});