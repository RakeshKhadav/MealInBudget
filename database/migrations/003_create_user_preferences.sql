-- MealinBudget: user_preferences table (reference only — not wired until the cloud/auth phase)

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  dietary_restrictions JSONB DEFAULT '[]',
  favorite_moods JSONB DEFAULT '[]',
  budget_range JSONB DEFAULT '{"min": 1000, "max": 5000}',

  notification_enabled BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT false,
  language VARCHAR(20) DEFAULT 'en',

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);