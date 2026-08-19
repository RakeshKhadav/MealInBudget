import { Router } from "express";
import rateLimit from "express-rate-limit";
import { config } from "../constants/config.js";
import { generateSchema } from "../middleware/validation.js";
import { createJob, getCachedPlan, getJob } from "../services/jobQueue.js";

export const mealsGenerateRouter = Router();

const generateLimiter = rateLimit({
  windowMs: config.rateLimitGenerateWindowMs,
  limit: config.rateLimitGenerateMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429).json({ error: `Too many requests - please wait about ${Math.max(1, Math.ceil(options.windowMs / 60000))} minute(s) before trying again.` });
  },
});

mealsGenerateRouter.post("/", generateLimiter, (req, res) => {
  const input = generateSchema.parse(req.body);

  const cached = getCachedPlan(input);
  if (cached) {
    res.status(200).json({ job_id: cached.meal_plan_id, status: "completed", plan: cached });
    return;
  }

  const job = createJob(input);
  res.status(202).json({ job_id: job.job_id, status: job.status });
});

mealsGenerateRouter.get("/:jobId", (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.status(200).json({
    job_id: job.job_id,
    status: job.status,
    stage: job.stage,
    pct: job.pct,
    error: job.error,
    plan: job.status === "completed" ? job.plan : undefined,
  });
});