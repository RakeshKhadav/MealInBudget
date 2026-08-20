import Groq from "groq-sdk";
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
import {
  geminiMealPlanSchema,
  geminiPlanNamesSchema,
  geminiPricesSchema,
} from "./geminiSchemas.js";

const MAX_ATTEMPTS = 3;
const CALL_TIMEOUT_MS = 120_000;

export interface PlanNameEntry {
  day: number;
  meal_type: MealType;
  meal_name: string;
  cuisine: string;
}

export interface PriceEntry {
  name: string;
  est_weekly_cost_min: number;
  est_weekly_cost_max: number;
}

export interface ProgressUpdate {
  stage: string;
  pct: number;
  step: number;
  partial: {
    names?: PlanNameEntry[];
    seasonal_note?: string;
    meals?: Meal[];
    prices?: PriceEntry[];
  };
}

export type ProgressCallback = (update: ProgressUpdate) => void;

const groq = new Groq({ apiKey: config.groqApiKey });

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

function currentMonth(): string {
  return new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });
}

export function buildPlanPrompt(input: GenerateRequest): string {
  const restrictions = input.dietary_restrictions.map((r) => `- ${DIETARY_LABELS[r]}`).join("\n");
  const appliances = input.appliances.map((a) => APPLIANCE_LABELS[a]).join(", ");
  const moods = input.moods.map((m) => MOOD_LABELS[m]).join(", ");
  const month = currentMonth();

  return [
    `Create a 7-day meal plan (21 meals total: breakfast, lunch and dinner for each day) for a household in India. This step only names the 21 dishes; full recipes and prices come in later steps.`,
    ``,
    `USER REQUIREMENTS:`,
    `- Total weekly budget: Rs.${input.budget} for ${input.people_count} people.`,
    `- Meal moods to prioritise: ${moods}`,
    `- Dietary restrictions (ABSOLUTE, zero tolerance - never violate any of them):`,
    restrictions,
    `- Only these appliances are available (every dish MUST be cookable with only these): ${appliances}`,
    ``,
    `HARD RULES:`,
    `1. Exactly 21 meals: day 1 to day 7, one breakfast, one lunch, one dinner per day.`,
    `2. All ingredients must be commonly available on Indian quick-commerce apps (Blinkit, Zepto) in small pack sizes.`,
    `3. Never repeat the same meal more than twice across the whole week. Vary recipes, cuisines and cooking styles.`,
    `4. Prefer fresh, seasonal, affordable ingredients. Current month: ${month}.`,
    `5. seasonal_note: one short line about which seasonal produce to use this week (must match the current month: ${month}).`,
    `6. NEVER output placeholder or generic filler text such as "day 1 breakfast". Every meal must be a real, specific, named dish (for example "Paneer Butter Masala").`,
    ``,
    `RESPONSE FORMAT:`,
    `Return ONLY a single valid JSON object with exactly this shape:`,
    `{ "meals": [ { "day": 1, "meal_type": "breakfast", "meal_name": "", "cuisine": "" } ], "seasonal_note": "" }`,
    `meals must contain exactly 21 objects (day 1-7 x breakfast, lunch, dinner). No markdown, no text outside the JSON.`,
  ].join("\n");
}

export function buildDetailPrompt(input: GenerateRequest, names: PlanNameEntry[]): string {
  const restrictions = input.dietary_restrictions.map((r) => `- ${DIETARY_LABELS[r]}`).join("\n");
  const appliances = input.appliances.map((a) => APPLIANCE_LABELS[a]).join(", ");
  const moods = input.moods.map((m) => MOOD_LABELS[m]).join(", ");
  const nameLines = names
    .map((n) => `- Day ${n.day} ${n.meal_type}: ${n.meal_name} (${n.cuisine})`)
    .join("\n");

  return [
    `The following 21 meals were approved for a household in India (weekly budget Rs.${input.budget} for ${input.people_count} people):`,
    ``,
    nameLines,
    ``,
    `Now produce the FULL detail for each of these exact meals - same day, same meal_type, same meal_name, same cuisine.`,
    ``,
    `USER REQUIREMENTS:`,
    `- Meal moods to prioritise: ${moods}`,
    `- Dietary restrictions (ABSOLUTE, zero tolerance - never violate any of them):`,
    restrictions,
    `- Only these appliances are available (every recipe MUST be cookable with only these, and appliances_needed must only contain these): ${appliances}`,
    ``,
    `HARD RULES:`,
    `1. Ingredients must have realistic quantities for a single meal for ${input.people_count} people. Keep 4-6 ingredients per meal.`,
    `2. nutritional_info must be accurate per-serve estimates for the full meal for ${input.people_count} people (calories, protein_g, carbs_g, fat_g, fiber_g - all complete).`,
    `3. nutritional_info must be internally consistent: calories and carbs must reflect the staple quantities listed (for example 8 slices of whole-wheat bread is roughly 500+ kcal, and 100 g raw dal is roughly 350 kcal).`,
    `4. cooking_time_mins must be realistic for a home cook with the available appliances.`,
    `5. instructions must be 4-5 clear, short, ordered cooking steps using ONLY the available appliances.`,
    `6. For image_url: include a real, direct, hotlinkable photo URL of the dish if you recall one with confidence (e.g. a direct file URL from Unsplash or Wikimedia Commons). If you are not sure, use an empty string - NEVER fabricate or guess a URL.`,
    `7. NEVER output placeholder or generic filler text. Every meal must keep its exact approved name with complete realistic details.`,
    ``,
    `RESPONSE FORMAT:`,
    `Return ONLY a single valid JSON object with exactly this shape:`,
    `{ "meal_plan": [ { "day": 1, "meal_type": "breakfast", "meal_name": "", "image_url": "", "cuisine": "", "cooking_time_mins": 0, "difficulty": "", "ingredients": [ { "name": "", "qty": 0, "unit": "" } ], "nutritional_info": { "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0 }, "appliances_needed": [ "" ], "instructions": [ "" ] } ] }`,
    `meal_plan must contain exactly 21 objects (day 1-7 x breakfast, lunch, dinner). No markdown, no text outside the JSON.`,
  ].join("\n");
}

export function buildPricePrompt(ingredientLines: string[]): string {
  return [
    `Estimate current Blinkit and Zepto prices for a weekly grocery order in India.`,
    `For each ingredient below, estimate the TOTAL cost in INR (whole rupees) of buying the quantity needed for the WHOLE WEEK for the household:`,
    ``,
    ingredientLines.join("\n"),
    ``,
    `HARD RULES:`,
    `1. est_weekly_cost_min and est_weekly_cost_max are the low and high end of the expected weekly cost range across both apps, based on typical Indian quick-commerce pricing. Round to whole rupees.`,
    `2. Price EVERY ingredient in the list. Do not skip any.`,
    `3. Names must match the list exactly.`,
    `4. NEVER output placeholder or filler entries.`,
    ``,
    `RESPONSE FORMAT:`,
    `Return ONLY a single valid JSON object with exactly this shape:`,
    `{ "ingredient_prices": [ { "name": "", "est_weekly_cost_min": 0, "est_weekly_cost_max": 0 } ] }`,
    `ingredient_prices must contain one entry per ingredient. No markdown, no text outside the JSON.`,
  ].join("\n");
}

export function zodSchemaToOpenAI(schema: ZodTypeAny): Record<string, unknown> {
  const jsonSchema = schema.toJSONSchema() as Record<string, unknown>;
  delete jsonSchema.$schema;
  const strip = (node: Record<string, unknown>): void => {
    delete node.minLength;
    delete node.exclusiveMinimum;
    delete node.minItems;
    delete node.maxItems;
    for (const value of Object.values(node)) {
      if (value && typeof value === "object") strip(value as Record<string, unknown>);
    }
  };
  strip(jsonSchema);
  return jsonSchema;
}

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  return JSON.parse(cleaned);
}

async function callAI(prompt: string, schema: ZodTypeAny): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await groq.chat.completions.create(
        {
          model: config.groqModel,
          messages: [
            {
              role: "system",
              content: "You are a helpful Indian meal planning assistant. Always respond with valid JSON only. No markdown, no text outside the JSON.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 16384,
          response_format: { type: "json_object" },
        },
        { timeout: CALL_TIMEOUT_MS },
      );

      const text = response.choices?.[0]?.message?.content;
      if (!text) throw new Error("Groq returned an empty response");
      const parsed = extractJson(text);
      const result = schema.safeParse(parsed);
      if (!result.success) {
        const details = result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
        if (attempt < MAX_ATTEMPTS) {
          prompt = `${prompt}\n\nIMPORTANT: Your previous response was REJECTED. Fix ALL of these issues and return only the corrected JSON:\n${details}`;
          continue;
        }
        throw new Error(`AI response failed schema validation (${details})`);
      }
      return result.data;
    } catch (err) {
      lastError = err;
      if (attempt === MAX_ATTEMPTS) break;
    }
  }
  throw lastError;
}

interface MealDetail {
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
}

export async function generateMealPlan(
  input: GenerateRequest,
  onProgress?: ProgressCallback,
): Promise<GenerateResponse> {
  if (!config.groqApiKey) {
    throw new Error("GROQ_API_KEY is not configured in the backend environment.");
  }

  const report = (
    stage: string,
    pct: number,
    step: number,
    partial: ProgressUpdate["partial"],
  ) => onProgress?.({ stage, pct, step, partial });

  report("Planning your week", 5, 1, {});

  const namesResult = (await callAI(buildPlanPrompt(input), geminiPlanNamesSchema)) as {
    meals: PlanNameEntry[];
    seasonal_note?: string;
  };

  let partial: ProgressUpdate["partial"] = {
    names: namesResult.meals,
    seasonal_note: namesResult.seasonal_note,
  };
  report("Planning your week", 25, 1, partial);

  report("Writing recipes & nutrition", 25, 2, partial);
  const detailResult = (await callAI(buildDetailPrompt(input, namesResult.meals), geminiMealPlanSchema)) as {
    meal_plan: MealDetail[];
  };

  const weekStart = todayStartOfWeek();
  const meals: Meal[] = detailResult.meal_plan.map((m) => {
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

  partial = { ...partial, meals };
  report("Writing recipes & nutrition", 75, 2, partial);

  report("Checking Blinkit & Zepto prices", 75, 3, partial);
  const ingredientLines = buildIngredientLines(meals);
  const priceMap = new Map<string, PriceEntry>();
  const applyPrices = (entries: PriceEntry[]): void => {
    for (const p of entries) {
      const key = p.name.trim().toLowerCase();
      if (key && !priceMap.has(key)) priceMap.set(key, p);
    }
  };

  const pricesResult = (await callAI(buildPricePrompt(ingredientLines.map((l) => l.line)), geminiPricesSchema)) as {
    ingredient_prices: PriceEntry[];
  };
  applyPrices(pricesResult.ingredient_prices);

  const missing = ingredientLines.filter((l) => !priceMap.has(l.name.toLowerCase()));
  if (missing.length > 0) {
    const retryPrompt = `${buildPricePrompt(ingredientLines.map((l) => l.line))}\n\nIMPORTANT: You missed prices for these ingredients. Return the COMPLETE list with entries for ALL of them, matching these EXACT names:\n${missing.map((m) => m.line).join("\n")}`;
    const retryResult = (await callAI(retryPrompt, geminiPricesSchema)) as {
      ingredient_prices: PriceEntry[];
    };
    applyPrices(retryResult.ingredient_prices);
  }

  partial = { ...partial, prices: [...priceMap.values()] };
  report("Checking Blinkit & Zepto prices", 95, 3, partial);

  report("Finalising your week", 95, 4, partial);
  const shoppingList = buildShoppingList(meals, priceMap);
  const nutritionalSummary = buildNutritionalSummary(meals);

  const mealPlanId = crypto.randomUUID();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  report("Finalising your week", 100, 4, partial);
  return {
    meal_plan_id: mealPlanId,
    week_start_date: isoDate(weekStart),
    week_end_date: isoDate(weekEnd),
    meals,
    shopping_list: shoppingList,
    nutritional_summary: nutritionalSummary,
    seasonal_note: namesResult.seasonal_note,
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

function buildIngredientLines(meals: Meal[]): { name: string; line: string }[] {
  const grouped = new Map<string, { name: string; qty: number; unit: string }>();

  for (const meal of meals) {
    for (const ing of meal.ingredients) {
      const key = ing.name.trim().toLowerCase();
      if (!key) continue;
      const { unit, factor } = normalizeUnit(ing.unit);
      const qty = unit === "kg" || unit === "l" ? ing.qty / factor : ing.qty;
      const existing = grouped.get(key);
      if (existing) {
        existing.qty += qty;
      } else {
        grouped.set(key, { name: ing.name.trim(), qty, unit });
      }
    }
  }

  return [...grouped.values()].map(({ name, qty, unit }) => ({
    name,
    line: `- ${name} — ${Math.round(qty * 100) / 100} ${unit}`,
  }));
}

function buildShoppingList(meals: Meal[], priceMap: Map<string, PriceEntry>): ShoppingListCategory[] {
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
          est_price_min: price?.est_weekly_cost_min ?? 10,
          est_price_max: price?.est_weekly_cost_max ?? 20,
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