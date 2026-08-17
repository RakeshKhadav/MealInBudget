import type { GenerateResponse, PlanSummary, Preferences } from "../types/index.js";

const plans = new Map<string, GenerateResponse>();
const recentIds: string[] = [];

export function savePlan(plan: GenerateResponse): void {
  plans.set(plan.meal_plan_id, plan);
  recentIds.unshift(plan.meal_plan_id);
  if (recentIds.length > 20) recentIds.pop();
}

export function getPlan(id: string): GenerateResponse | undefined {
  return plans.get(id);
}

export function listRecentPlans(): PlanSummary[] {
  return recentIds.map((id) => {
    const p = plans.get(id)!;
    return {
      id: p.meal_plan_id,
      week_start_date: p.week_start_date,
      moods: ["spicy_indian"],
      status: "active",
    };
  });
}

let preferences: Preferences = {
  budget_default: 2000,
  people_count_default: 4,
  dietary_restrictions: ["vegetarian"],
  appliances: ["cooker", "microwave", "stove", "mixer", "oven"],
};

export function getPreferences(): Preferences {
  return preferences;
}

export function updatePreferences(patch: Partial<Preferences>): Preferences {
  preferences = { ...preferences, ...patch };
  return preferences;
}