import { GoogleGenAI, FunctionCallingConfigMode } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ZodTypeAny } from "zod";
import { config } from "../constants/config.js";
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
import { geminiMealPlanSchema, geminiPricesSchema } from "./geminiSchemas.js";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

const PRICE_CHUNK_SIZE = 20;
const MAX_ATTEMPTS = 2;

export interface ProgressUpdate {
  stage: string;
  pct: number;
}

export type ProgressCallback = (update: ProgressUpdate) => void;

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

const MOOD_LABELS: Record<Mood, string> = {
  spicy_indian: "spicy Indian classics with bold flavours",
  quick_easy: "quick & easy meals (under ~30 minutes)",
  protein_packed: "high-protein meals",
  low_calorie: "low-calorie, lighter meals",
  budget_minimal: "budget-friendly, minimal-ingredient meals",
};

const DIETARY_LABELS: Record<DietaryRestriction, string> = {
  vegetarian: "100% vegetarian (no meat, fish or poultry)",
  non_vegetarian: "non-vegetarian (meat, fish and poultry allowed)",
  no_onions: "no onions or onion derivatives in any dish (zero tolerance)",
  no_garlic: "no garlic in any dish (zero tolerance)",
  no_dairy: "no dairy at all - no milk, butter, ghee, cream, curd or paneer (zero tolerance)",
  gluten_free: "strictly gluten-free - no wheat, atta, bread, maida or wheat-based soy sauce (zero tolerance)",
  no_eggs: "no eggs in any dish (zero tolerance)",
};

const APPLIANCE_LABELS: Record<Appliance, string> = {
  cooker: "Pressure Cooker",
  microwave: "Microwave",
  stove: "Stovetop",
  mixer: "Blender/Mixer Grinder",
  oven: "Oven",
};

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function todayStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay() === 0 ? 7 : now.getDay();
  const diff = now.getDate() - day + 1;
  return new Date(now.getFullYear(), now.getMonth(), diff);
}

function buildMealPrompt(input: GenerateRequest): string {
  const restrictions = input.dietary_restrictions.map((r) => `- ${DIETARY_LABELS[r]}`).join("\n");
  const appliances = input.appliances.map((a) => APPLIANCE_LABELS[a]).join(", ");
  const moods = input.moods.map((m) => MOOD_LABELS[m]).join(", ");
  const perMealBudget = Math.round(input.budget / 21);

  return [
    `Create a 7-day meal plan (21 meals total: breakfast, lunch and dinner for each day) for a household in India.`,
    ``,
    `USER REQUIREMENTS:`,
    `- Total weekly budget: Rs.${input.budget} for ${input.people_count} people`,
    `- Budget per meal (a full meal for all ${input.people_count} people): about Rs.${perMealBudget} - never exceed it by more than 10%`,
    `- Meal moods to prioritise: ${moods}`,
    `- Dietary restrictions (ABSOLUTE, zero tolerance - never violate any of them):`,
    restrictions,
    `- Only these appliances are available (every recipe MUST be cookable with only these, and appliances_needed must only contain these): ${appliances}`,
    ``,
    `HARD RULES:`,
    `1. Exactly 21 meals: day 1 to day 7, one breakfast, one lunch, one dinner per day.`,
    `2. All ingredients must be commonly available on Indian quick-commerce apps (Blinkit, Zepto) in small pack sizes.`,
    `3. Never repeat the same meal more than twice across the whole week. Vary recipes, cuisines and cooking styles.`,
    `4. Prefer fresh, seasonal, affordable ingredients.`,
    `5. Ingredients must have realistic quantities for a single meal for ${input.people_count} people.`,
    `6. nutritional_info must be accurate per-serve estimates for the full meal for ${input.people_count} people (calories, protein_g, carbs_g, fat_g, fiber_g - all complete).`,
    `7. cooking_time_mins must be realistic for a home cook with the available appliances.`,
    `8. instructions must be clear, ordered cooking steps using ONLY the available appliances.`,
    `9. For image_url: use Google Search to find a REAL, direct, hotlinkable photo of the dish. Prefer direct file URLs from images.unsplash.com or upload.wikimedia.org. If no good direct image is found, return an empty string.`,
    `10. seasonal_note: one short line about which seasonal produce to use this week.`,
    ``,
    `RESPONSE FORMAT:`,
    `After your research, call submit_result with the complete plan as a single JSON object with exactly this shape:`,
    `{ "meal_plan": [ { "day": 1, "meal_type": "breakfast", "meal_name": "", "image_url": "", "cuisine": "", "cooking_time_mins": 0, "difficulty": "", "ingredients": [ { "name": "", "qty": 0, "unit": "" } ], "nutritional_info": { "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0 }, "appliances_needed": [ "" ], "instructions": [ "" ] } ], "seasonal_note": "" }`,
    `meal_plan must contain exactly 21 objects (day 1-7 x breakfast, lunch, dinner). Do not output anything except the submit_result function call.`,
  ].join("\n");
}

function buildPricePrompt(ingredients: string[]): string {
  return [
    `Search Blinkit and Zepto (Indian quick-commerce apps) for the current price of each ingredient below, for a standard pack size (for example 1 kg or 500 g - whatever is the standard pack).`,
    `For each ingredient return est_price_min and est_price_max in INR - the low and high end of the price range across both apps. Prices must be whole numbers of rupees.`,
    `If you cannot find a live price for an ingredient, give a sensible estimate based on typical quick-commerce pricing.`,
    ``,
    `INGREDIENTS (one per line):`,
    ...ingredients.map((name) => `- ${name}`),
    ``,
    `RESPONSE FORMAT:`,
    `After your research, call submit_result with a single JSON object with exactly this shape:`,
    `{ "ingredient_prices": [ { "name": "", "est_price_min": 0, "est_price_max": 0 } ] }`,
    `ingredient_prices must contain an entry for EVERY ingredient listed above. Do not output anything except the submit_result function call.`,
  ].join("\n");
}

function uniqueIngredients(meals: { ingredients: { name: string }[] }[]): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const meal of meals) {
    for (const ing of meal.ingredients) {
      const key = ing.name.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(ing.name.trim());
      }
    }
  }
  return list;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function zodSchemaToGemini(schema: ZodTypeAny): Record<string, unknown> {
  const jsonSchema = zodToJsonSchema(schema as unknown as Parameters<typeof zodToJsonSchema>[0]) as Record<string, unknown>;
  delete jsonSchema.$schema;
  return jsonSchema;
}

const SUBMIT_FUNCTION = "submit_result";

async function callGemini(prompt: string, schema: ZodTypeAny): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: config.geminiModel,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 32768,
          tools: [
            { googleSearch: {} },
            {
              functionDeclarations: [
                {
                  name: SUBMIT_FUNCTION,
                  description:
                    "Submit the complete result as a single JSON object matching the described schema.",
                  parametersJsonSchema: zodSchemaToGemini(schema),
                },
              ],
            },
          ],
          toolConfig: {
            functionCallingConfig: { mode: FunctionCallingConfigMode.ANY, allowedFunctionNames: [SUBMIT_FUNCTION] },
          },
        },
      });

      const call = response.candidates?.[0]?.content?.parts?.find(
        (p) => p.functionCall?.name === SUBMIT_FUNCTION,
      )?.functionCall;
      const args = call?.args;
      if (!args) throw new Error("Gemini did not return a submit_result function call");

      const result = schema.safeParse(args);
      if (!result.success) {
        const details = result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
        throw new Error(`Gemini response failed schema validation (${details})`);
      }
      return result.data;
    } catch (err) {
      lastError = err;
      if (attempt === MAX_ATTEMPTS) break;
    }
  }
  throw lastError;
}

export async function generateMealPlan(
  input: GenerateRequest,
  onProgress?: ProgressCallback,
): Promise<GenerateResponse> {
  if (!config.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the backend environment.");
  }

  const report = (stage: string, pct: number) => onProgress?.({ stage, pct });

  report("Finding your recipes & photos", 5);
  const mealPlanResult = (await callGemini(buildMealPrompt(input), geminiMealPlanSchema)) as {
    meal_plan: {
      day: number;
      meal_type: MealType;
      meal_name: string;
      image_url: string;
      cuisine: string;
      cooking_time_mins: number;
      difficulty: string;
      ingredients: { name: string; qty: number; unit: string }[];
      nutritional_info: { calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number };
      appliances_needed: string[];
      instructions: string[];
    }[];
    seasonal_note?: string;
  };
  report("Finding your recipes & photos", 55);

  const weekStart = todayStartOfWeek();
  const meals: Meal[] = mealPlanResult.meal_plan.map((m) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + m.day - 1);
    return {
      day: m.day,
      date: isoDate(date),
      meal_type: m.meal_type,
      meal_name: m.meal_name,
      image_url: m.image_url,
      cuisine: m.cuisine,
      cooking_time_mins: m.cooking_time_mins,
      difficulty: m.difficulty,
      ingredients: m.ingredients,
      nutritional_info: m.nutritional_info,
      appliances_needed: m.appliances_needed,
      instructions: m.instructions,
    };
  });

  const priceMap = new Map<string, { est_price_min: number; est_price_max: number }>();
  const priceChunks = chunk(uniqueIngredients(meals), PRICE_CHUNK_SIZE);

  for (let i = 0; i < priceChunks.length; i++) {
    const startPct = 55 + (i / priceChunks.length) * 35;
    const endPct = 55 + ((i + 1) / priceChunks.length) * 35;
    report("Checking Blinkit & Zepto prices", Math.round(startPct));
    const priceResult = (await callGemini(buildPricePrompt(priceChunks[i]), geminiPricesSchema)) as {
      ingredient_prices: { name: string; est_price_min: number; est_price_max: number }[];
    };
    for (const p of priceResult.ingredient_prices) {
      const key = p.name.trim().toLowerCase();
      if (key) priceMap.set(key, { est_price_min: p.est_price_min, est_price_max: p.est_price_max });
    }
    report("Checking Blinkit & Zepto prices", Math.round(endPct));
  }

  report("Finalising your week", 90);
  const shoppingList = buildShoppingList(meals, priceMap);
  const nutritionalSummary = buildNutritionalSummary(meals);

  const mealPlanId = crypto.randomUUID();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  report("Finalising your week", 100);
  return {
    meal_plan_id: mealPlanId,
    week_start_date: isoDate(weekStart),
    week_end_date: isoDate(weekEnd),
    meals,
    shopping_list: shoppingList,
    nutritional_summary: nutritionalSummary,
    seasonal_note: mealPlanResult.seasonal_note,
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
  if (["onion", "tomato", "potato", "spinach", "broccoli", "capsicum", "carrot", "peas", "cauliflower", "cucumber", "lettuce"].some((k) => n.includes(k)))
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

function buildShoppingList(
  meals: Meal[],
  priceMap: Map<string, { est_price_min: number; est_price_max: number }>,
): ShoppingListCategory[] {
  const grouped = new Map<string, ShoppingListItem>();

  for (const meal of meals) {
    for (const ing of meal.ingredients) {
      const category = categorize(ing.name);
      const { unit, factor } = normalizeUnit(ing.unit);
      const qty = unit === "kg" || unit === "l" ? ing.qty / factor : ing.qty;

      const key = `${category}|${ing.name}`;
      const existing = grouped.get(key);
      const price = priceMap.get(ing.name.trim().toLowerCase());
      if (existing) {
        existing.qty += qty;
        if (!existing.used_in.includes(`${meal.day} ${meal.meal_type}`)) {
          existing.used_in.push(`${meal.day} ${meal.meal_type}`);
        }
      } else {
        grouped.set(key, {
          name: ing.name,
          qty: Math.round(qty * 100) / 100,
          unit,
          est_price_min: price?.est_price_min ?? 10,
          est_price_max: price?.est_price_max ?? 20,
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
