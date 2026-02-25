-- ============================================================
-- IronLog — Complete Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE NOT NULL,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  height FLOAT,
  height_unit TEXT DEFAULT 'cm' CHECK (height_unit IN ('cm', 'ft')),
  start_weight FLOAT,
  current_weight FLOAT,
  goal_weight FLOAT,
  weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  calorie_target INTEGER DEFAULT 2000,
  protein_target INTEGER DEFAULT 150,
  carb_target INTEGER DEFAULT 200,
  fat_target INTEGER DEFAULT 65,
  water_target INTEGER DEFAULT 3000,
  gemini_api_key TEXT,
  workout_split JSONB DEFAULT '{}',
  progress_score DECIMAL(5,2) DEFAULT 50.00,
  pinned_achievements TEXT[] DEFAULT '{}',
  accent_color TEXT DEFAULT 'purple',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== DAILY LOGS ====================
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  water_ml INTEGER DEFAULT 0,
  progress_score DECIMAL(5,2) DEFAULT 50.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ==================== FOOD LOGS ====================
CREATE TABLE IF NOT EXISTS food_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout')),
  food_name TEXT NOT NULL,
  calories FLOAT DEFAULT 0,
  protein FLOAT DEFAULT 0,
  carbs FLOAT DEFAULT 0,
  fats FLOAT DEFAULT 0,
  serving_size TEXT,
  input_mode TEXT CHECK (input_mode IN ('manual', 'text_ai', 'photo_ai', 'photo_text_ai')),
  photo_url TEXT,
  ai_prompt TEXT,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== WORKOUT LOGS ====================
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  input_mode TEXT CHECK (input_mode IN ('manual', 'ai'))
);

-- ==================== WORKOUT EXERCISES ====================
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  body_part TEXT,
  order_index INTEGER DEFAULT 0,
  notes TEXT
);

-- ==================== EXERCISE SETS ====================
CREATE TABLE IF NOT EXISTS exercise_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER DEFAULT 0,
  weight FLOAT DEFAULT 0,
  weight_unit TEXT DEFAULT 'lbs' CHECK (weight_unit IN ('kg', 'lbs')),
  set_type TEXT DEFAULT 'working' CHECK (set_type IN ('warmup', 'working', 'dropset', 'failure'))
);

-- ==================== POST-WORKOUT PHOTOS ====================
CREATE TABLE IF NOT EXISTS post_workout_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== ACHIEVEMENTS ====================
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'mythic')),
  icon TEXT DEFAULT '🏆',
  threshold_value FLOAT,
  threshold_type TEXT
);

-- ==================== USER ACHIEVEMENTS ====================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ==================== WEIGHT ENTRIES ====================
CREATE TABLE IF NOT EXISTS weight_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight FLOAT NOT NULL,
  unit TEXT DEFAULT 'kg' CHECK (unit IN ('kg', 'lbs')),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_food_logs_daily ON food_logs(daily_log_id);
CREATE INDEX IF NOT EXISTS idx_food_logs_user ON food_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_daily ON workout_logs(daily_log_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_exercise ON exercise_sets(workout_exercise_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_entries_user ON weight_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_workout_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;

-- Users: owner can do everything, public can read basic info
CREATE POLICY "Users can view own full profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Public can view basic user info" ON users FOR SELECT USING (true);

-- Daily logs: owner CRUD, public read
CREATE POLICY "Users can CRUD own daily logs" ON daily_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view daily logs" ON daily_logs FOR SELECT USING (true);

-- Food logs: owner CRUD, public read
CREATE POLICY "Users can CRUD own food logs" ON food_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view food logs" ON food_logs FOR SELECT USING (true);

-- Workout logs: owner CRUD, public read
CREATE POLICY "Users can CRUD own workout logs" ON workout_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view workout logs" ON workout_logs FOR SELECT USING (true);

-- Workout exercises: owner CRUD via workout logs, public read
CREATE POLICY "Users can manage workout exercises" ON workout_exercises FOR ALL USING (
  EXISTS (
    SELECT 1 FROM workout_logs 
    WHERE workout_logs.id = workout_exercises.workout_log_id 
    AND workout_logs.user_id = auth.uid()
  )
);
CREATE POLICY "Public can view workout exercises" ON workout_exercises FOR SELECT USING (true);

-- Exercise sets: owner CRUD via exercises, public read
CREATE POLICY "Users can manage exercise sets" ON exercise_sets FOR ALL USING (
  EXISTS (
    SELECT 1 FROM workout_exercises
    JOIN workout_logs ON workout_logs.id = workout_exercises.workout_log_id
    WHERE workout_exercises.id = exercise_sets.workout_exercise_id
    AND workout_logs.user_id = auth.uid()
  )
);
CREATE POLICY "Public can view exercise sets" ON exercise_sets FOR SELECT USING (true);

-- Post-workout photos: PRIVATE - owner only
CREATE POLICY "Users can CRUD own photos" ON post_workout_photos FOR ALL USING (auth.uid() = user_id);

-- Achievements: everyone can read
CREATE POLICY "Everyone can read achievements" ON achievements FOR SELECT USING (true);

-- User achievements: owner CRUD, public read
CREATE POLICY "Users can manage own achievements" ON user_achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view user achievements" ON user_achievements FOR SELECT USING (true);

-- Weight entries: owner CRUD
CREATE POLICY "Users can manage own weight entries" ON weight_entries FOR ALL USING (auth.uid() = user_id);

-- ==================== FUNCTIONS ====================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
