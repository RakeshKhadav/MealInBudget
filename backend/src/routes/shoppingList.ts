import { Router } from "express";
import { getPlan } from "../services/db.js";
import { AppError } from "../middleware/errorHandler.js";

export const shoppingListRouter = Router();

shoppingListRouter.get("/:mealPlanId", (req, res) => {
  const plan = getPlan(req.params.mealPlanId);
  if (!plan) throw new AppError(404, "Meal plan not found");

  const totalMin = plan.shopping_list.reduce((acc, c) => acc + c.items.reduce((a, i) => a + i.est_price_min, 0), 0);
  const totalMax = plan.shopping_list.reduce((acc, c) => acc + c.items.reduce((a, i) => a + i.est_price_max, 0), 0);

  res.json({
    meal_plan_id: plan.meal_plan_id,
    categories: plan.shopping_list,
    total_estimated_min: totalMin,
    total_estimated_max: totalMax,
  });
});