import type { GenerateRequest, GenerateResponse } from "../types/index.js";
import { generateMealPlan, type ProgressUpdate } from "./gemini.js";
import { savePlan } from "./db.js";

export type JobStatus = "queued" | "generating" | "completed" | "failed";

export interface GenerateJob {
  job_id: string;
  status: JobStatus;
  stage: string;
  pct: number;
  step: number;
  partial: ProgressUpdate["partial"];
  error?: string;
  plan?: GenerateResponse;
  created_at: string;
}

const jobs = new Map<string, GenerateJob>();
const planCache = new Map<string, GenerateResponse>();
const JOB_TTL_MS = 3600_000; // 1 hour
const PLAN_CACHE_MAX = 50;
const CLEANUP_INTERVAL_MS = 60_000;

// Periodic cleanup of stale jobs to prevent memory leaks
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function startCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const cutoff = Date.now() - JOB_TTL_MS;
    for (const [id, job] of jobs) {
      if (new Date(job.created_at).getTime() < cutoff) {
        jobs.delete(id);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  // Unref so the timer doesn't keep the process alive
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    (cleanupTimer as NodeJS.Timeout).unref();
  }
}
startCleanup();

function cacheKey(input: GenerateRequest): string {
  return JSON.stringify({
    budget: input.budget,
    people_count: input.people_count,
    moods: [...input.moods].sort(),
    dietary_restrictions: [...input.dietary_restrictions].sort(),
    appliances: [...input.appliances].sort(),
  });
}

function weekKey(): string {
  const now = new Date();
  const day = now.getDay() === 0 ? 7 : now.getDay();
  const diff = now.getDate() - day + 1;
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().split("T")[0];
}

function rememberPlan(input: GenerateRequest, plan: GenerateResponse): void {
  const key = `${weekKey()}|${cacheKey(input)}`;
  // Move to end (most recent) if already present, then enforce cap
  planCache.delete(key);
  planCache.set(key, plan);
  while (planCache.size > PLAN_CACHE_MAX) {
    const oldest = planCache.keys().next().value;
    if (oldest) planCache.delete(oldest);
  }
}

export function getCachedPlan(input: GenerateRequest): GenerateResponse | undefined {
  return planCache.get(`${weekKey()}|${cacheKey(input)}`);
}

function createJobId(): string {
  return crypto.randomUUID();
}

export function createJob(input: GenerateRequest): GenerateJob {
  const job: GenerateJob = {
    job_id: createJobId(),
    status: "queued",
    stage: "Queued",
    pct: 0,
    step: 1,
    partial: {},
    created_at: new Date().toISOString(),
  };
  jobs.set(job.job_id, job);

  runJob(job, input).catch(() => {
    // job state is updated inside runJob; nothing to do here
  });

  return job;
}

export function getJob(jobId: string): GenerateJob | undefined {
  return jobs.get(jobId);
}

async function runJob(job: GenerateJob, input: GenerateRequest): Promise<void> {
  job.status = "generating";
  job.stage = "Starting";
  job.pct = 1;
  job.step = 1;
  job.partial = {};

  try {
    const onProgress = (u: ProgressUpdate) => {
      job.stage = u.stage;
      job.pct = u.pct;
      job.step = u.step;
      job.partial = u.partial;
    };
    const plan = await generateMealPlan(input, onProgress);
    savePlan(plan, input);
    rememberPlan(input, plan);
    job.status = "completed";
    job.stage = "Done";
    job.pct = 100;
    job.plan = plan;
  } catch (err) {
    job.status = "failed";
    job.stage = "Failed";
    job.error = err instanceof Error ? err.message : String(err);
  }
}