-- ============================================================
-- IronLog — Achievement Seeds
-- Run this AFTER the schema.sql in Supabase SQL Editor
-- ============================================================

INSERT INTO achievements (id, name, description, category, tier, icon, threshold_value, threshold_type) VALUES

-- ================== LOGGING STREAKS ==================
('first_log', 'First Steps', 'Log your first meal or workout', 'streak', 'bronze', '🌟', 1, 'total_logs'),
('7_day_streak', 'Week Warrior', 'Log something every day for 7 days', 'streak', 'silver', '🔥', 7, 'streak_days'),
('14_day_streak', 'Two Week Terror', 'Log something every day for 14 days', 'streak', 'gold', '💥', 14, 'streak_days'),
('30_day_streak', 'Monthly Monster', 'Log something every day for 30 days', 'streak', 'platinum', '👑', 30, 'streak_days'),
('90_day_streak', 'Quarter Master', 'Log something every day for 90 days', 'streak', 'diamond', '💎', 90, 'streak_days'),
('365_day_streak', 'Year of Iron', 'Log something every day for 365 days', 'streak', 'mythic', '🏛️', 365, 'streak_days'),

-- ================== FOOD TRACKING ==================
('first_meal', 'Gotta Eat', 'Log your first meal', 'food', 'bronze', '🍽️', 1, 'total_meals'),
('50_meals', 'Regular Eater', 'Log 50 meals', 'food', 'silver', '🥩', 50, 'total_meals'),
('100_meals', 'Nutrition Nerd', 'Log 100 meals', 'food', 'gold', '🧠', 100, 'total_meals'),
('500_meals', 'Calorie Counter', 'Log 500 meals', 'food', 'platinum', '📊', 500, 'total_meals'),
('protein_king', 'Protein King', 'Hit your protein goal 7 days in a row', 'food', 'gold', '💪', 7, 'protein_streak'),
('macro_master', 'Macro Master', 'Hit all macro goals in a single day', 'food', 'silver', '🎯', 1, 'all_macros_hit'),
('ai_scanner', 'AI Scanner', 'Use AI photo scanning 10 times', 'food', 'silver', '📸', 10, 'ai_photo_scans'),

-- ================== WORKOUT TRACKING ==================
('first_workout', 'Iron Baptism', 'Log your first workout', 'workout', 'bronze', '🏋️', 1, 'total_workouts'),
('10_workouts', 'Getting Serious', 'Complete 10 workouts', 'workout', 'silver', '💪', 10, 'total_workouts'),
('50_workouts', 'Gym Rat', 'Complete 50 workouts', 'workout', 'gold', '🐀', 50, 'total_workouts'),
('100_workouts', 'Iron Veteran', 'Complete 100 workouts', 'workout', 'platinum', '⚔️', 100, 'total_workouts'),
('500_workouts', 'Legend of Iron', 'Complete 500 workouts', 'workout', 'diamond', '🏛️', 500, 'total_workouts'),
('volume_1k', 'Volume Dealer', 'Log 1,000 lbs+ total volume in a single workout', 'workout', 'silver', '📈', 1000, 'single_workout_volume'),
('volume_10k', 'Volume Lord', 'Log 10,000 lbs+ total volume in a single workout', 'workout', 'gold', '🔱', 10000, 'single_workout_volume'),
('5_exercises', 'Full Session', 'Log 5+ exercises in a single workout', 'workout', 'bronze', '📋', 5, 'exercises_per_workout'),

-- ================== WATER TRACKING ==================
('first_water', 'Stay Hydrated', 'Log your first water entry', 'water', 'bronze', '💧', 1, 'total_water_logs'),
('water_goal_7', 'Hydration Station', 'Hit your water goal 7 days in a row', 'water', 'silver', '🌊', 7, 'water_goal_streak'),
('water_goal_30', 'Aqua Master', 'Hit your water goal 30 days in a row', 'water', 'gold', '🏊', 30, 'water_goal_streak'),
('gallon_day', 'Gallon Challenge', 'Drink 3,785ml+ (1 gallon) in a day', 'water', 'silver', '🥛', 3785, 'single_day_water'),

-- ================== PROGRESS SCORE ==================
('score_60', 'Rising Star', 'Reach a progress score of 60', 'score', 'bronze', '⬆️', 60, 'progress_score'),
('score_70', 'On Track', 'Reach a progress score of 70', 'score', 'silver', '📈', 70, 'progress_score'),
('score_80', 'Outstanding', 'Reach a progress score of 80', 'score', 'gold', '🌟', 80, 'progress_score'),
('score_90', 'Elite Status', 'Reach a progress score of 90', 'score', 'platinum', '👑', 90, 'progress_score'),
('score_95', 'Near Perfection', 'Reach a progress score of 95', 'score', 'diamond', '💎', 95, 'progress_score'),
('score_100', 'Perfect Day', 'Achieve a perfect 100 progress score', 'score', 'mythic', '🏆', 100, 'progress_score'),

-- ================== BODY GOALS ==================
('first_weight', 'Tracking Weight', 'Log your first weight measurement', 'body', 'bronze', '⚖️', 1, 'total_weight_logs'),
('weight_loss_5', 'Down 5', 'Lose 5 lbs from start weight', 'body', 'silver', '📉', 5, 'weight_lost'),
('weight_loss_10', 'Down 10', 'Lose 10 lbs from start weight', 'body', 'gold', '🔥', 10, 'weight_lost'),
('weight_loss_25', 'Down 25', 'Lose 25 lbs from start weight', 'body', 'platinum', '💥', 25, 'weight_lost'),
('muscle_gain_5', 'Gains!', 'Gain 5 lbs from start weight', 'body', 'silver', '💪', 5, 'weight_gained'),
('muscle_gain_10', 'Getting Big', 'Gain 10 lbs from start weight', 'body', 'gold', '🦍', 10, 'weight_gained'),
('first_photo', 'Smile!', 'Upload your first post-workout photo', 'body', 'bronze', '📷', 1, 'total_photos'),
('50_photos', 'Documenter', 'Upload 50 post-workout photos', 'body', 'gold', '🗂️', 50, 'total_photos'),

-- ================== SOCIAL ==================
('profile_complete', 'All Set', 'Complete your full profile', 'social', 'bronze', '✅', 1, 'profile_complete'),
('gemini_connected', 'AI Powered', 'Connect your Gemini API key', 'social', 'bronze', '🤖', 1, 'gemini_connected')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  tier = EXCLUDED.tier,
  icon = EXCLUDED.icon,
  threshold_value = EXCLUDED.threshold_value,
  threshold_type = EXCLUDED.threshold_type;
