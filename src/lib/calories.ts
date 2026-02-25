// ============================================================
// IronLog — Calorie & Macro Calculations
// ============================================================
import type { MacroBreakdown } from '@/types'

// Mifflin-St Jeor Equation
export function calculateBMR(
    weight: number, // in kg
    height: number, // in cm
    age: number,
    gender: 'male' | 'female' | 'other'
): number {
    if (gender === 'male') {
        return 10 * weight + 6.25 * height - 5 * age + 5
    } else {
        // female and other use female formula
        return 10 * weight + 6.25 * height - 5 * age - 161
    }
}

export function calculateMaintenance(bmr: number): number {
    // Assume moderate activity (exercise 3-5 days/week)
    return Math.round(bmr * 1.55)
}

export function convertWeight(weight: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number {
    if (from === to) return weight
    if (from === 'lbs') return weight * 0.453592
    return weight * 2.20462
}

export function convertHeight(height: number, from: 'cm' | 'ft', to: 'cm' | 'ft'): number {
    if (from === to) return height
    if (from === 'ft') return height * 30.48
    return height / 30.48
}

export type CalorieGoalType =
    | 'maintenance'
    | 'low_cut'
    | 'mid_cut'
    | 'high_cut'
    | 'lean_bulk'
    | 'mid_bulk'
    | 'aggressive_bulk'
    | 'custom'

export interface CalorieOption {
    type: CalorieGoalType
    label: string
    description: string
    offset: number
}

export const calorieOptions: CalorieOption[] = [
    { type: 'maintenance', label: 'Maintenance', description: 'Maintain current weight', offset: 0 },
    { type: 'low_cut', label: 'Low Cut', description: '−250 kcal/day', offset: -250 },
    { type: 'mid_cut', label: 'Mid Cut', description: '−500 kcal/day', offset: -500 },
    { type: 'high_cut', label: 'High Cut', description: '−750 kcal/day', offset: -750 },
    { type: 'lean_bulk', label: 'Lean Bulk', description: '+250 kcal/day', offset: 250 },
    { type: 'mid_bulk', label: 'Mid Bulk', description: '+500 kcal/day', offset: 500 },
    { type: 'aggressive_bulk', label: 'Aggressive Bulk', description: '+750 kcal/day', offset: 750 },
]

export function calculateMacros(
    calories: number,
    weightKg: number,
    goalType: CalorieGoalType
): MacroBreakdown {
    // Protein: 2g per kg bodyweight for cuts, 1.6g for maintenance/bulk
    const isCutting = goalType.includes('cut')
    const proteinPerKg = isCutting ? 2.2 : 1.8
    const protein = Math.round(weightKg * proteinPerKg)
    const proteinCalories = protein * 4

    // Fat: 25-30% of calories
    const fatPercent = isCutting ? 0.25 : 0.3
    const fatCalories = calories * fatPercent
    const fats = Math.round(fatCalories / 9)

    // Carbs: remaining calories
    const carbCalories = calories - proteinCalories - fatCalories
    const carbs = Math.round(Math.max(0, carbCalories / 4))

    return { calories, protein, carbs, fats }
}

export function getCalorieTarget(maintenance: number, goalType: CalorieGoalType, customCalories?: number): number {
    if (goalType === 'custom' && customCalories) return customCalories
    const option = calorieOptions.find(o => o.type === goalType)
    return maintenance + (option?.offset || 0)
}
