-- MealinBudget: meal_plans table (reference only — not wired until the cloud/auth phase)

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  budget INTEGER NOT NULL,
  people_count INTEGER NOT NULL,
  mood VARCHAR(50) NOT NULL,
  dietary_restrictions JSONB,
  appliances JSONB,

  meals JSONB NOT NULL,
  shopping_list JSONB NOT NULL,

  is_active BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans (user_id, week_start_date);