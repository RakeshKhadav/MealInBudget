import { z } from "zod";

export const moodSchema = z.enum(["spicy_indian", "quick_easy", "protein_packed", "low_calorie", "budget_minimal"]);

export const dietaryRestrictionSchema = z.enum([
  "vegetarian",
  "non_vegetarian",
  "no_onions",
  "no_garlic",
  "no_dairy",
  "gluten_free",
  "no_eggs",
]);

export const applianceSchema = z.enum(["cooker", "microwave", "stove", "mixer", "oven"]);

export const generateSchema = z
  .object({
    budget: z.number().int().min(500).max(5000),
    people_count: z.number().int().min(1).max(6),
    moods: z.array(moodSchema).min(1),
    dietary_restrictions: z.array(dietaryRestrictionSchema).min(1),
    appliances: z.array(applianceSchema).min(1),
  })
  .strict();

export const preferencesSchema = z
  .object({
    budget_default: z.number().int().min(500).max(5000).optional(),
    people_count_default: z.number().int().min(1).max(6).optional(),
    dietary_restrictions: z.array(dietaryRestrictionSchema).min(1).optional(),
    appliances: z.array(applianceSchema).min(1).optional(),
  })
  .strict();