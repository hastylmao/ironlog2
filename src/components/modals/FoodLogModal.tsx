'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { estimateNutritionFromText, estimateNutritionFromImage } from '@/lib/gemini'
import {
    X, Camera, MessageSquare, PenLine, ImagePlus, Loader2,
    Check, Edit3, RefreshCw, ChevronDown
} from 'lucide-react'
import type { MealType, FoodInputMode, GeminiNutritionResponse, FoodLog } from '@/types'

const mealTypes: { value: MealType; label: string; emoji: string }[] = [
    { value: 'breakfast', label: 'Breakfast', emoji: '🌅' },
    { value: 'lunch', label: 'Lunch', emoji: '☀️' },
    { value: 'dinner', label: 'Dinner', emoji: '🌙' },
    { value: 'snack', label: 'Snack', emoji: '🍎' },
    { value: 'pre_workout', label: 'Pre-Workout', emoji: '⚡' },
    { value: 'post_workout', label: 'Post-Workout', emoji: '💪' },
]

const inputModes: { value: FoodInputMode; label: string; icon: typeof PenLine }[] = [
    { value: 'manual', label: 'Manual', icon: PenLine },
    { value: 'text_ai', label: 'Text AI', icon: MessageSquare },
    { value: 'photo_ai', label: 'Photo AI', icon: Camera },
    { value: 'photo_text_ai', label: 'Photo + Text', icon: ImagePlus },
]

interface FoodLogModalProps {
    onClose: () => void
}

export function FoodLogModal({ onClose }: FoodLogModalProps) {
    const { user, addFoodLog } = useAppStore()
    const [mode, setMode] = useState<FoodInputMode>('photo_text_ai')
    const [mealType, setMealType] = useState<MealType>('lunch')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [step, setStep] = useState<'input' | 'review'>('input')

    // Form fields
    const [foodName, setFoodName] = useState('')
    const [calories, setCalories] = useState('')
    const [protein, setProtein] = useState('')
    const [carbs, setCarbs] = useState('')
    const [fats, setFats] = useState('')
    const [servingSize, setServingSize] = useState('')
    const [textPrompt, setTextPrompt] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleAIEstimate = async () => {
        if (!user?.gemini_api_key) {
            setError('Please add your Gemini API key in Settings')
            return
        }

        setLoading(true)
        setError('')

        try {
            let result: GeminiNutritionResponse

            if (mode === 'text_ai' && textPrompt) {
                result = await estimateNutritionFromText(user.gemini_api_key, textPrompt)
            } else if (mode === 'photo_ai' && imageFile) {
                const base64 = imagePreview!.split(',')[1]
                result = await estimateNutritionFromImage(user.gemini_api_key, base64, imageFile.type)
            } else if (mode === 'photo_text_ai' && imageFile) {
                const base64 = imagePreview!.split(',')[1]
                result = await estimateNutritionFromImage(user.gemini_api_key, base64, imageFile.type, textPrompt)
            } else {
                setError('Please provide the required inputs')
                setLoading(false)
                return
            }

            // Populate form with AI results
            setFoodName(result.food_name)
            setCalories(result.calories.toString())
            setProtein(result.protein.toString())
            setCarbs(result.carbs.toString())
            setFats(result.fats.toString())
            setServingSize(result.serving_size)
            setStep('review')
        } catch (err) {
            setError('AI estimation failed. Please try again or enter manually.')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setLoading(true)
        setError('')

        try {
            const supabase = createClient()
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) return

            const today = new Date().toISOString().split('T')[0]

            // Get or create daily log
            let { data: dailyLog } = await supabase
                .from('daily_logs')
                .select('id')
                .eq('user_id', authUser.id)
                .eq('date', today)
                .single()

            if (!dailyLog) {
                const { data: newLog } = await supabase
                    .from('daily_logs')
                    .insert({ user_id: authUser.id, date: today, water_ml: 0, progress_score: 50 })
                    .select('id')
                    .single()
                dailyLog = newLog
            }

            if (!dailyLog) {
                setError('Failed to access daily log')
                return
            }

            // Upload photo if present
            let photoUrl: string | null = null
            if (imageFile) {
                const fileName = `${authUser.id}/${today}/${Date.now()}_${imageFile.name}`
                const { data: uploadData } = await supabase.storage
                    .from('food-photos')
                    .upload(fileName, imageFile)

                if (uploadData) {
                    const { data: publicUrl } = supabase.storage
                        .from('food-photos')
                        .getPublicUrl(uploadData.path)
                    photoUrl = publicUrl.publicUrl
                }
            }

            const foodLogData = {
                daily_log_id: dailyLog.id,
                user_id: authUser.id,
                meal_type: mealType,
                food_name: foodName,
                calories: parseFloat(calories) || 0,
                protein: parseFloat(protein) || 0,
                carbs: parseFloat(carbs) || 0,
                fats: parseFloat(fats) || 0,
                serving_size: servingSize || null,
                input_mode: mode,
                photo_url: photoUrl,
                ai_prompt: textPrompt || null,
                logged_at: new Date().toISOString(),
            }

            const { data: savedLog, error: saveError } = await supabase
                .from('food_logs')
                .insert(foodLogData)
                .select()
                .single()

            if (saveError) {
                setError(saveError.message)
                return
            }

            if (savedLog) {
                addFoodLog(savedLog as FoodLog)
            }

            onClose()
        } catch {
            setError('Failed to save food log')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-xl px-6 pt-6 pb-4 border-b border-zinc-800/50 z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold gradient-text">Log Food</h2>
                            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Mode Tabs */}
                        <div className="flex gap-1 bg-zinc-900 rounded-xl p-1">
                            {inputModes.map((m) => (
                                <button
                                    key={m.value}
                                    onClick={() => { setMode(m.value); setStep('input') }}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${mode === m.value
                                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    <m.icon className="w-3.5 h-3.5" />
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="px-6 py-5 space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        {/* Meal Type Selector */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Meal Type</label>
                            <div className="flex flex-wrap gap-2">
                                {mealTypes.map((mt) => (
                                    <button
                                        key={mt.value}
                                        onClick={() => setMealType(mt.value)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mealType === mt.value
                                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                                            }`}
                                    >
                                        {mt.emoji} {mt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {step === 'input' && (
                            <>
                                {/* Photo upload for photo modes */}
                                {(mode === 'photo_ai' || mode === 'photo_text_ai') && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400">Food Photo</label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
                                        >
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Food" className="max-h-48 mx-auto rounded-lg object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-zinc-500">
                                                    <Camera className="w-8 h-8" />
                                                    <p className="text-sm">Tap to upload / take photo</p>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handleImageSelect}
                                            className="hidden"
                                        />
                                    </div>
                                )}

                                {/* Text prompt for text modes */}
                                {(mode === 'text_ai' || mode === 'photo_text_ai') && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400">Describe your meal</label>
                                        <textarea
                                            value={textPrompt}
                                            onChange={(e) => setTextPrompt(e.target.value)}
                                            placeholder="e.g., 100g grilled chicken breast with 200g rice and mixed vegetables"
                                            className="input-field min-h-[100px] resize-none"
                                            rows={3}
                                        />
                                    </div>
                                )}

                                {/* AI Estimate button */}
                                {mode !== 'manual' && (
                                    <button
                                        onClick={handleAIEstimate}
                                        disabled={loading}
                                        className="btn-primary w-full flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>✨ Estimate with AI</>
                                        )}
                                    </button>
                                )}

                                {/* Manual entry fields */}
                                {mode === 'manual' && (
                                    <>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-400">Food Name</label>
                                            <input
                                                type="text"
                                                value={foodName}
                                                onChange={(e) => setFoodName(e.target.value)}
                                                placeholder="Grilled chicken breast"
                                                className="input-field"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-zinc-400">Calories</label>
                                                <input
                                                    type="number"
                                                    value={calories}
                                                    onChange={(e) => setCalories(e.target.value)}
                                                    placeholder="500"
                                                    className="input-field text-center"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-zinc-400">Protein (g)</label>
                                                <input
                                                    type="number"
                                                    value={protein}
                                                    onChange={(e) => setProtein(e.target.value)}
                                                    placeholder="40"
                                                    className="input-field text-center"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-zinc-400">Carbs (g)</label>
                                                <input
                                                    type="number"
                                                    value={carbs}
                                                    onChange={(e) => setCarbs(e.target.value)}
                                                    placeholder="50"
                                                    className="input-field text-center"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-zinc-400">Fats (g)</label>
                                                <input
                                                    type="number"
                                                    value={fats}
                                                    onChange={(e) => setFats(e.target.value)}
                                                    placeholder="15"
                                                    className="input-field text-center"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-zinc-400">Serving Size</label>
                                            <input
                                                type="text"
                                                value={servingSize}
                                                onChange={(e) => setServingSize(e.target.value)}
                                                placeholder="200g"
                                                className="input-field"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSave}
                                            disabled={loading || !foodName}
                                            className="btn-primary w-full flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Save</>}
                                        </button>
                                    </>
                                )}
                            </>
                        )}

                        {/* Review Step (AI results) */}
                        {step === 'review' && (
                            <div className="space-y-5">
                                <div className="glass-card p-5 rounded-xl border border-purple-500/20">
                                    <h3 className="text-sm font-semibold text-purple-400 mb-3">AI Estimation</h3>
                                    <p className="text-lg font-bold text-white mb-4">{foodName}</p>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-500">Calories</label>
                                            <input
                                                type="number"
                                                value={calories}
                                                onChange={(e) => setCalories(e.target.value)}
                                                className="input-field text-center text-lg font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-500">Protein (g)</label>
                                            <input
                                                type="number"
                                                value={protein}
                                                onChange={(e) => setProtein(e.target.value)}
                                                className="input-field text-center text-lg font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-500">Carbs (g)</label>
                                            <input
                                                type="number"
                                                value={carbs}
                                                onChange={(e) => setCarbs(e.target.value)}
                                                className="input-field text-center text-lg font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-500">Fats (g)</label>
                                            <input
                                                type="number"
                                                value={fats}
                                                onChange={(e) => setFats(e.target.value)}
                                                className="input-field text-center text-lg font-bold"
                                            />
                                        </div>
                                    </div>

                                    {servingSize && (
                                        <p className="text-xs text-zinc-500 mt-3">Serving: {servingSize}</p>
                                    )}
                                </div>

                                <p className="text-sm text-zinc-500 text-center">Does this look right? You can edit any value above.</p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleAIEstimate}
                                        disabled={loading}
                                        className="btn-secondary flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Re-estimate
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Confirm & Save</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
