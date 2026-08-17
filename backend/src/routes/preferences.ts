import { Router } from "express";
import { preferencesSchema } from "../middleware/validation.js";
import { getPreferences, updatePreferences } from "../services/db.js";

export const preferencesRouter = Router();

preferencesRouter.get("/", (req, res) => {
  res.json(getPreferences());
});

preferencesRouter.put("/", (req, res) => {
  const patch = preferencesSchema.parse(req.body);
  const preferences = updatePreferences(patch);
  res.json({ success: true, preferences });
});