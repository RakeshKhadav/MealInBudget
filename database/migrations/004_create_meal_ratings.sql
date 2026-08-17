-- MealinBudget: meal_ratings table (future — not in MVP, reference only)

CREATE TABLE IF NOT EXISTS meal_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,

  day_number INTEGER NOT NULL,
  meal_type VARCHAR(20) NOT NULL,
  meal_name VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL,
  notes TEXT,

  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_ratings_user_meal ON meal_ratings (user_id, meal_plan_id);