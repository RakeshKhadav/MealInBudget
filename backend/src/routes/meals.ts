import { Router } from "express";
import { getPlan, listRecentPlans } from "../services/db.js";
import { AppError } from "../middleware/errorHandler.js";

export const mealsRouter = Router();

mealsRouter.get("/recent", (req, res) => {
  res.json(listRecentPlans());
});

mealsRouter.get("/:mealPlanId", (req, res) => {
  const plan = getPlan(req.params.mealPlanId);
  if (!plan) throw new AppError(404, "Meal plan not found");
  res.json({ meal_plan: plan, variants: [] });
});