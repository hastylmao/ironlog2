// ============================================================
// IronLog — Google Gemini AI Integration
// ============================================================
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { GeminiNutritionResponse, GeminiWorkoutResponse } from '@/types'

export async function createGeminiClient(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey)
    return genAI
}

export async function validateGeminiKey(apiKey: string): Promise<boolean> {
    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        await model.generateContent('Hello, this is a test.')
        return true
    } catch {
        return false
    }
}

export async function estimateNutritionFromText(
    apiKey: string,
    description: string
): Promise<GeminiNutritionResponse> {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are a nutrition expert. Estimate the macronutrients of the following food/meal described by the user.

User description: "${description}"

Respond ONLY with valid JSON, no markdown no code blocks. Use this exact format:
{
  "food_name": "brief name of the food/meal",
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fats": number (grams),
  "serving_size": "estimated serving size",
  "confidence": number (0-1, how confident you are)
}

Be as accurate as possible. If multiple items, sum them up. Return only the JSON.`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    // Clean up the response - remove code blocks if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as GeminiNutritionResponse
}

export async function estimateNutritionFromImage(
    apiKey: string,
    imageBase64: string,
    mimeType: string,
    description?: string
): Promise<GeminiNutritionResponse> {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are a nutrition expert. Look at this food photo and estimate the macronutrients of the meal.
${description ? `The user also described it as: "${description}"` : ''}

Respond ONLY with valid JSON, no markdown no code blocks. Use this exact format:
{
  "food_name": "brief name of the food/meal",
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fats": number (grams),
  "serving_size": "estimated serving size",
  "confidence": number (0-1, how confident you are)
}

Be as accurate as possible. Return only the JSON.`

    const imagePart = {
        inlineData: {
            data: imageBase64,
            mimeType,
        },
    }

    const result = await model.generateContent([prompt, imagePart])
    const text = result.response.text().trim()
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as GeminiNutritionResponse
}

export async function parseWorkoutFromText(
    apiKey: string,
    description: string
): Promise<GeminiWorkoutResponse> {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are a fitness expert. Parse the following workout description into structured exercise data.

User description: "${description}"

Respond ONLY with valid JSON, no markdown no code blocks. Use this exact format:
{
  "exercises": [
    {
      "name": "exercise name (standard gym name)",
      "body_part": "primary muscle group (Chest/Back/Shoulders/Biceps/Triceps/Quads/Hamstrings/Glutes/Calves/Abs/Core/Forearms/Traps/Cardio/Full Body)",
      "sets": [
        {
          "reps": number,
          "weight": number,
          "weight_unit": "lbs" or "kg",
          "set_type": "working" or "warmup" or "dropset" or "failure"
        }
      ]
    }
  ]
}

Return only the JSON array. Be accurate with exercise names and match standard gym terminology.`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as GeminiWorkoutResponse
}

export async function calculateProgressScore(
    apiKey: string,
    data: {
        calorieTarget: number
        caloriesConsumed: number
        proteinTarget: number
        proteinConsumed: number
        waterTarget: number
        waterConsumed: number
        workedOut: boolean
        isRestDay: boolean
        currentWeight: number
        goalWeight: number
        previousWeight: number
        streakDays: number
    }
): Promise<number> {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are a fitness progress evaluator. Based on the following daily data, calculate a progress score from 0.00 to 100.00.

Data:
- Calorie target: ${data.calorieTarget}, consumed: ${data.caloriesConsumed}
- Protein target: ${data.proteinTarget}g, consumed: ${data.proteinConsumed}g
- Water target: ${data.waterTarget}ml, consumed: ${data.waterConsumed}ml
- Worked out today: ${data.workedOut}
- Is rest day: ${data.isRestDay}
- Current weight: ${data.currentWeight}, goal weight: ${data.goalWeight}, previous weight: ${data.previousWeight}
- Consistency streak: ${data.streakDays} days

Scoring guidelines:
- Hitting calorie target (±100 kcal): +15 points
- Hitting protein target (±10g): +15 points
- Adequate water (≥ target): +10 points
- Completed workout on non-rest day: +25 points
- Being on a rest day and resting: +25 points
- Weight moving toward goal: +10 points
- Streak bonus: +0.5 per day (max +25)

Penalties:
- Missing gym on non-rest day: -25 points
- Way off calorie target (>300 kcal): -10 points
- Low protein (<50% target): -10 points
- No water logged: -10 points

Respond with ONLY a single number (the score, 0.00 to 100.00), nothing else.`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const score = parseFloat(text)
    return isNaN(score) ? 50.0 : Math.min(100, Math.max(0, score))
}

// Fallback rule-based scoring when no API key
export function calculateProgressScoreLocal(data: {
    calorieTarget: number
    caloriesConsumed: number
    proteinTarget: number
    proteinConsumed: number
    waterTarget: number
    waterConsumed: number
    workedOut: boolean
    isRestDay: boolean
    currentWeight: number
    goalWeight: number
    previousWeight: number
    streakDays: number
}): number {
    let score = 50 // base score

    // Calories
    const calDiff = Math.abs(data.caloriesConsumed - data.calorieTarget)
    if (calDiff <= 100) score += 15
    else if (calDiff <= 300) score += 5
    else score -= 10

    // Protein
    const proteinRatio = data.proteinConsumed / (data.proteinTarget || 1)
    if (proteinRatio >= 0.9 && proteinRatio <= 1.1) score += 15
    else if (proteinRatio >= 0.7) score += 5
    else score -= 10

    // Water
    const waterRatio = data.waterConsumed / (data.waterTarget || 1)
    if (waterRatio >= 1) score += 10
    else if (waterRatio >= 0.7) score += 5
    else if (waterRatio < 0.3) score -= 10

    // Workout
    if (data.isRestDay) {
        score += 5
    } else if (data.workedOut) {
        score += 25
    } else {
        score -= 15
    }

    // Weight direction
    const goalDiff = Math.abs(data.currentWeight - data.goalWeight)
    const prevDiff = Math.abs(data.previousWeight - data.goalWeight)
    if (goalDiff < prevDiff) score += 5

    // Streak bonus
    score += Math.min(data.streakDays * 0.5, 10)

    return Math.min(100, Math.max(0, parseFloat(score.toFixed(2))))
}
