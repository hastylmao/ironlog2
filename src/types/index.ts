// ============================================================
// IronLog — Type Definitions
// ============================================================

export interface UserProfile {
    id: string
    email: string
    username: string
    age: number
    gender: 'male' | 'female' | 'other'
    height: number
    height_unit: 'cm' | 'ft'
    start_weight: number
    current_weight: number
    goal_weight: number
    weight_unit: 'kg' | 'lbs'
    calorie_target: number
    protein_target: number
    carb_target: number
    fat_target: number
    water_target: number
    gemini_api_key: string | null
    workout_split: WorkoutSplit
    progress_score: number
    pinned_achievements: string[]
    accent_color: 'purple' | 'cyan' | 'blue' | 'green' | 'orange' | 'pink'
    created_at: string
    updated_at: string
}

export interface WorkoutSplit {
    monday: string[]
    tuesday: string[]
    wednesday: string[]
    thursday: string[]
    friday: string[]
    saturday: string[]
    sunday: string[]
}

export interface DailyLog {
    id: string
    user_id: string
    date: string
    water_ml: number
    progress_score: number
    notes: string | null
    created_at: string
}

export interface FoodLog {
    id: string
    daily_log_id: string
    user_id: string
    meal_type: MealType
    food_name: string
    calories: number
    protein: number
    carbs: number
    fats: number
    serving_size: string | null
    input_mode: FoodInputMode
    photo_url: string | null
    ai_prompt: string | null
    logged_at: string
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout'
export type FoodInputMode = 'manual' | 'text_ai' | 'photo_ai' | 'photo_text_ai'

export interface WorkoutLog {
    id: string
    daily_log_id: string
    user_id: string
    started_at: string
    completed_at: string | null
    notes: string | null
    input_mode: 'manual' | 'ai'
}

export interface WorkoutExercise {
    id: string
    workout_log_id: string
    exercise_name: string
    body_part: string
    order_index: number
    notes: string | null
    sets: ExerciseSet[]
}

export interface ExerciseSet {
    id: string
    workout_exercise_id: string
    set_number: number
    reps: number
    weight: number
    weight_unit: 'kg' | 'lbs'
    set_type: SetType
}

export type SetType = 'warmup' | 'working' | 'dropset' | 'failure'

export interface PostWorkoutPhoto {
    id: string
    user_id: string
    daily_log_id: string
    photo_url: string
    uploaded_at: string
}

export interface Achievement {
    id: string
    name: string
    description: string
    category: AchievementCategory
    tier: AchievementTier
    icon: string
    threshold_value: number | null
    threshold_type: string
}

export type AchievementCategory =
    | 'strength'
    | 'volume'
    | 'consistency'
    | 'transformation'
    | 'nutrition'
    | 'variety'
    | 'time'
    | 'social'
    | 'ai_usage'
    | 'special'

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'mythic'

export interface UserAchievement {
    id: string
    user_id: string
    achievement_id: string
    unlocked_at: string
    achievement?: Achievement
}

export interface WeightEntry {
    id: string
    user_id: string
    weight: number
    unit: 'kg' | 'lbs'
    recorded_at: string
}

// Onboarding types
export interface OnboardingData {
    username: string
    age: number
    gender: 'male' | 'female' | 'other'
    height: number
    height_unit: 'cm' | 'ft'
    start_weight: number
    current_weight: number
    goal_weight: number
    weight_unit: 'kg' | 'lbs'
    workout_split: WorkoutSplit
    calorie_target: number
    protein_target: number
    carb_target: number
    fat_target: number
}

// Split preset type
export interface SplitPreset {
    name: string
    layout: WorkoutSplit
}

// Macro calculation
export interface MacroBreakdown {
    calories: number
    protein: number
    carbs: number
    fats: number
}

// Gemini API types
export interface GeminiNutritionResponse {
    food_name: string
    calories: number
    protein: number
    carbs: number
    fats: number
    serving_size: string
    confidence: number
}

export interface GeminiWorkoutResponse {
    exercises: {
        name: string
        body_part: string
        sets: {
            reps: number
            weight: number
            weight_unit: string
            set_type: SetType
        }[]
    }[]
}

// Activity feed
export interface ActivityItem {
    id: string
    type: 'food' | 'water' | 'workout' | 'photo' | 'weight' | 'achievement'
    timestamp: string
    data: Record<string, unknown>
}

// Exercise database type
export interface ExerciseInfo {
    name: string
    bodyPart: string
    category: string
}
