import express from "express";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { config } from "./constants/config.js";
import { mealsGenerateRouter } from "./routes/mealsGenerate.js";
import { mealsRouter } from "./routes/meals.js";
import { shoppingListRouter } from "./routes/shoppingList.js";
import { preferencesRouter } from "./routes/preferences.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { ZodError } from "zod";

const app = express();

app.use(cors({ origin: config.corsOrigin.split(",") }));
app.use(compression());
app.use(express.json());

const rateLimitMessage = (retryAfter: number) =>
  `Too many requests - please wait about ${Math.max(1, Math.ceil(retryAfter / 60))} minute(s) before trying again.`;

// Cache-control: dynamic API responses should not be cached by browsers
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    limit: config.rateLimitGlobalPerMin,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      res.status(429).json({ error: rateLimitMessage(options.windowMs) });
    },
  }),
);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    gemini: config.geminiApiKey ? "configured" : "missing",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/meals/generate", mealsGenerateRouter);
app.use("/api/meals", mealsRouter);
app.use("/api/shopping-list", shoppingListRouter);
app.use("/api/preferences", preferencesRouter);

app.use(notFound);
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: err.issues });
    return;
  }
  errorHandler(err, req, res, next);
});

app.listen(config.port, () => {
  console.log(`MealinBudget API listening on http://localhost:${config.port}`);
});