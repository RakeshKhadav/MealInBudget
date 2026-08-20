import { loadEnvFile } from "node:process";

try {
  loadEnvFile(".env.local");
} catch {
  // .env.local not present - rely on process environment variables only
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  groqModel: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  rateLimitGenerateWindowMs: Math.max(Number(process.env.RATE_LIMIT_GENERATE_WINDOW_MS ?? 120000) || 120000, 1),
  rateLimitGenerateMax: Number(process.env.RATE_LIMIT_GENERATE_MAX ?? 1),
  rateLimitGlobalPerMin: Number(process.env.RATE_LIMIT_GLOBAL_PER_MIN ?? 120),
};