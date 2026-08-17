import { Router } from "express";
import { generateSchema } from "../middleware/validation.js";
import { generateMealPlan, getSeasonalNote } from "../services/gemini.js";
import { savePlan } from "../services/db.js";

export const mealsGenerateRouter = Router();

mealsGenerateRouter.post("/", (req, res) => {
  const input = generateSchema.parse(req.body);
  const plan = generateMealPlan(input);
  savePlan(plan);
  res.status(201).json({ ...plan, seasonal_note: getSeasonalNote() });
});