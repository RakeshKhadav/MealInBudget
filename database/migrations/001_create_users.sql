-- MealinBudget: users table (reference only — not wired until the cloud/auth phase)

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url VARCHAR(500),

  default_budget INTEGER DEFAULT 2000,
  default_people_count INTEGER DEFAULT 4
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);