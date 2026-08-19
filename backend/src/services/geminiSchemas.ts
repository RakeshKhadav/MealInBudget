import { z } from "zod";

export const geminiIngredientSchema = z.object({
  name: z.string(),
  qty: z.number().positive(),
  unit: z.string(),
});

export const geminiNutritionSchema = z.object({
  calories: z.number().int().positive(),
  protein_g: z.number().nonnegative(),
  carbs_g: z.number().nonnegative(),
  fat_g: z.number().nonnegative(),
  fiber_g: z.number().nonnegative(),
});

export const geminiMealSchema = z.object({
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

export const geminiMealPlanSchema = z.object({
  meal_plan: z.array(geminiMealSchema).length(21),
  seasonal_note: z.string().optional(),
});

export const geminiPriceEntrySchema = z.object({
  name: z.string().min(1),
  est_price_min: z.number().int().nonnegative(),
  est_price_max: z.number().int().nonnegative(),
});

export const geminiPricesSchema = z.object({
  ingredient_prices: z.array(geminiPriceEntrySchema).min(1),
});
