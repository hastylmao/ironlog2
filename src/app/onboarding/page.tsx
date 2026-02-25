'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { User, Dumbbell, Target, ArrowRight, ArrowLeft, Check, Loader2, ChevronDown } from 'lucide-react'
import { splitPresets } from '@/lib/splits'
import { splitBodyParts } from '@/lib/exercises'
import { calculateBMR, calculateMaintenance, calculateMacros, convertWeight, convertHeight, calorieOptions, type CalorieGoalType } from '@/lib/calories'
import type { WorkoutSplit, OnboardingData } from '@/types'

const stepIcons = [User, Dumbbell, Target]
const stepLabels = ['Personal Info', 'Workout Split', 'Nutrition Goals']

const emptyWorkoutSplit: WorkoutSplit = {
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [],
}

const days: (keyof WorkoutSplit)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Step 1: Personal Info
    const [username, setUsername] = useState('')
    const [age, setAge] = useState('')
    const [gender, setGender] = useState<'male' | 'female' | 'other'>('male')
    const [height, setHeight] = useState('')
    const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm')
    const [startWeight, setStartWeight] = useState('')
    const [currentWeight, setCurrentWeight] = useState('')
    const [goalWeight, setGoalWeight] = useState('')
    const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')

    // Step 2: Workout Split
    const [workoutSplit, setWorkoutSplit] = useState<WorkoutSplit>(emptyWorkoutSplit)
    const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
    const [editingDay, setEditingDay] = useState<keyof WorkoutSplit | null>(null)

    // Step 3: Calories
    const [selectedGoal, setSelectedGoal] = useState<CalorieGoalType>('maintenance')
    const [customCalories, setCustomCalories] = useState('')

    // Calculate maintenance calories
    const getMaintenanceCalories = () => {
        const weightKg = weightUnit === 'kg' ? parseFloat(currentWeight) : convertWeight(parseFloat(currentWeight), 'lbs', 'kg')
        const heightCm = heightUnit === 'cm' ? parseFloat(height) : convertHeight(parseFloat(height), 'ft', 'cm')
        if (isNaN(weightKg) || isNaN(heightCm) || isNaN(parseInt(age))) return 2000
        const bmr = calculateBMR(weightKg, heightCm, parseInt(age), gender)
        return calculateMaintenance(bmr)
    }

    const maintenance = getMaintenanceCalories()

    const handlePresetSelect = (index: number) => {
        setSelectedPreset(index)
        setWorkoutSplit({ ...splitPresets[index].layout })
    }

    const toggleBodyPart = (day: keyof WorkoutSplit, bodyPart: string) => {
        setWorkoutSplit(prev => {
            const current = [...prev[day]]
            if (bodyPart === 'Rest Day') {
                return { ...prev, [day]: ['Rest Day'] }
            }
            const filtered = current.filter(p => p !== 'Rest Day')
            if (filtered.includes(bodyPart)) {
                return { ...prev, [day]: filtered.filter(p => p !== bodyPart) }
            }
            return { ...prev, [day]: [...filtered, bodyPart] }
        })
    }

    const handleSubmit = async () => {
        setError('')
        setLoading(true)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setError('Not authenticated')
                setLoading(false)
                return
            }

            const weightKg = weightUnit === 'kg' ? parseFloat(currentWeight) : convertWeight(parseFloat(currentWeight), 'lbs', 'kg')
            const targetCals = selectedGoal === 'custom' ? parseInt(customCalories) : maintenance + (calorieOptions.find(o => o.type === selectedGoal)?.offset || 0)
            const macros = calculateMacros(targetCals, weightKg, selectedGoal)

            const profileData = {
                id: user.id,
                email: user.email,
                username,
                age: parseInt(age),
                gender,
                height: parseFloat(height),
                height_unit: heightUnit,
                start_weight: parseFloat(startWeight),
                current_weight: parseFloat(currentWeight),
                goal_weight: parseFloat(goalWeight),
                weight_unit: weightUnit,
                calorie_target: macros.calories,
                protein_target: macros.protein,
                carb_target: macros.carbs,
                fat_target: macros.fats,
                water_target: 3000,
                workout_split: workoutSplit,
                progress_score: 50.0,
                pinned_achievements: [],
                accent_color: 'purple',
            }

            const { error: dbError } = await supabase
                .from('users')
                .upsert(profileData)

            if (dbError) {
                setError(dbError.message)
                return
            }

            router.push('/dashboard')
            router.refresh()
        } catch {
            setError('Failed to save profile')
        } finally {
            setLoading(false)
        }
    }

    const canProceed = () => {
        if (step === 0) {
            return username.trim() && age && height && startWeight && currentWeight && goalWeight
        }
        if (step === 1) {
            return Object.values(workoutSplit).some(d => d.length > 0)
        }
        return true
    }

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: { x: 0, opacity: 1 },
        exit: (direction: number) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0,
        }),
    }

    const [direction, setDirection] = useState(0)

    const goNext = () => {
        if (step < 2) {
            setDirection(1)
            setStep(step + 1)
        } else {
            handleSubmit()
        }
    }

    const goBack = () => {
        if (step > 0) {
            setDirection(-1)
            setStep(step - 1)
        }
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }} />
                <div className="absolute bottom-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)' }} />
            </div>

            {/* Header */}
            <div className="w-full max-w-lg mx-auto px-4 pt-8 pb-4 relative z-10">
                <h1 className="text-2xl font-bold gradient-text mb-6">Setup Your Profile</h1>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                    {stepLabels.map((label, i) => {
                        const Icon = stepIcons[i]
                        const isActive = i === step
                        const isComplete = i < step
                        return (
                            <div key={label} className="flex flex-col items-center relative">
                                <motion.div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 ${isActive
                                        ? 'bg-gradient-to-br from-purple-500 to-cyan-500 border-transparent shadow-lg shadow-purple-500/20'
                                        : isComplete
                                            ? 'bg-green-500/20 border-green-500/30'
                                            : 'bg-zinc-900 border-zinc-800'
                                        }`}
                                    animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    {isComplete ? (
                                        <Check className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-600'}`} />
                                    )}
                                </motion.div>
                                <span className={`text-xs mt-2 ${isActive ? 'text-white' : 'text-zinc-600'}`}>
                                    {label}
                                </span>
                                {i < 2 && (
                                    <div className={`absolute top-6 left-[calc(100%+8px)] w-[calc(100%-16px)] h-0.5 ${isComplete ? 'bg-green-500' : 'bg-zinc-800'
                                        }`} style={{ width: '60px' }} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Step Content */}
            <div className="w-full max-w-lg mx-auto px-4 flex-1 relative z-10 overflow-hidden">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
                        {error}
                    </div>
                )}

                <AnimatePresence mode="wait" custom={direction}>
                    {step === 0 && (
                        <motion.div
                            key="step-0"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                            className="space-y-5"
                        >
                            {/* Username */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Username</label>
                                <input
                                    id="onboard-username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    placeholder="username"
                                    className="input-field"
                                />
                            </div>

                            {/* Age & Gender */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Age</label>
                                    <input
                                        id="onboard-age"
                                        type="number"
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                        placeholder="25"
                                        className="input-field"
                                        min="13"
                                        max="100"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Gender</label>
                                    <select
                                        id="onboard-gender"
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
                                        className="input-field appearance-none cursor-pointer"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Height */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Height</label>
                                <div className="flex gap-3">
                                    <input
                                        id="onboard-height"
                                        type="number"
                                        value={height}
                                        onChange={(e) => setHeight(e.target.value)}
                                        placeholder={heightUnit === 'cm' ? '175' : '5.9'}
                                        className="input-field flex-1"
                                        step="0.1"
                                    />
                                    <div className="flex rounded-xl overflow-hidden border border-zinc-800">
                                        <button
                                            type="button"
                                            onClick={() => setHeightUnit('cm')}
                                            className={`px-4 py-2 text-sm font-medium transition-all ${heightUnit === 'cm' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-900 text-zinc-500'
                                                }`}
                                        >
                                            cm
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setHeightUnit('ft')}
                                            className={`px-4 py-2 text-sm font-medium transition-all ${heightUnit === 'ft' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-900 text-zinc-500'
                                                }`}
                                        >
                                            ft
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Weight Fields */}
                            <div className="flex justify-end mb-2">
                                <div className="flex rounded-xl overflow-hidden border border-zinc-800">
                                    <button
                                        type="button"
                                        onClick={() => setWeightUnit('kg')}
                                        className={`px-4 py-2 text-sm font-medium transition-all ${weightUnit === 'kg' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-900 text-zinc-500'
                                            }`}
                                    >
                                        kg
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setWeightUnit('lbs')}
                                        className={`px-4 py-2 text-sm font-medium transition-all ${weightUnit === 'lbs' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-900 text-zinc-500'
                                            }`}
                                    >
                                        lbs
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-zinc-400">Start Weight</label>
                                    <input
                                        id="onboard-start-weight"
                                        type="number"
                                        value={startWeight}
                                        onChange={(e) => setStartWeight(e.target.value)}
                                        placeholder="85"
                                        className="input-field text-center"
                                        step="0.1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-zinc-400">Current</label>
                                    <input
                                        id="onboard-current-weight"
                                        type="number"
                                        value={currentWeight}
                                        onChange={(e) => setCurrentWeight(e.target.value)}
                                        placeholder="80"
                                        className="input-field text-center"
                                        step="0.1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-zinc-400">Goal</label>
                                    <input
                                        id="onboard-goal-weight"
                                        type="number"
                                        value={goalWeight}
                                        onChange={(e) => setGoalWeight(e.target.value)}
                                        placeholder="75"
                                        className="input-field text-center"
                                        step="0.1"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div
                            key="step-1"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                            className="space-y-5"
                        >
                            {/* Presets */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-zinc-400">Quick Presets</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                                    {splitPresets.map((preset, i) => (
                                        <button
                                            key={preset.name}
                                            type="button"
                                            onClick={() => handlePresetSelect(i)}
                                            className={`text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedPreset === i
                                                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                                                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                                }`}
                                        >
                                            {preset.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom 7-day grid */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-zinc-400">Your Weekly Split</label>
                                <div className="space-y-2">
                                    {days.map((day, i) => (
                                        <div key={day} className="glass-card-solid p-3 rounded-xl">
                                            <button
                                                type="button"
                                                onClick={() => setEditingDay(editingDay === day ? null : day)}
                                                className="w-full flex items-center justify-between"
                                            >
                                                <span className="text-sm font-semibold text-white capitalize">{dayLabels[i]}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-zinc-500 max-w-[180px] truncate">
                                                        {workoutSplit[day].length > 0
                                                            ? workoutSplit[day].includes('Rest Day') ? '😴 Rest Day' : workoutSplit[day].join(', ')
                                                            : 'Not set'
                                                        }
                                                    </span>
                                                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${editingDay === day ? 'rotate-180' : ''}`} />
                                                </div>
                                            </button>

                                            <AnimatePresence>
                                                {editingDay === day && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-zinc-800">
                                                            {splitBodyParts.map(part => (
                                                                <button
                                                                    key={part}
                                                                    type="button"
                                                                    onClick={() => toggleBodyPart(day, part)}
                                                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${workoutSplit[day].includes(part)
                                                                        ? part === 'Rest Day'
                                                                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-600'
                                                                        }`}
                                                                >
                                                                    {part}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step-2"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                            className="space-y-5"
                        >
                            {/* Maintenance display */}
                            <div className="glass-card-solid p-5 rounded-xl text-center">
                                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Estimated Maintenance</p>
                                <p className="text-4xl font-bold gradient-text font-mono-numbers">{maintenance}</p>
                                <p className="text-sm text-zinc-500 mt-1">kcal / day</p>
                            </div>

                            {/* Goal options */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-zinc-400">Select Your Goal</label>

                                <div className="space-y-2">
                                    {/* Cut options */}
                                    <p className="text-xs text-red-400/70 font-medium uppercase tracking-wider mt-2">Cut (Weight Loss)</p>
                                    {calorieOptions.filter(o => o.type.includes('cut')).map(option => (
                                        <button
                                            key={option.type}
                                            type="button"
                                            onClick={() => setSelectedGoal(option.type)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${selectedGoal === option.type
                                                ? 'bg-purple-500/15 border border-purple-500/40'
                                                : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                                                }`}
                                        >
                                            <div className="text-left">
                                                <p className={`text-sm font-medium ${selectedGoal === option.type ? 'text-white' : 'text-zinc-400'}`}>
                                                    {option.label}
                                                </p>
                                                <p className="text-xs text-zinc-600">{option.description}</p>
                                            </div>
                                            <span className={`text-sm font-mono-numbers font-semibold ${selectedGoal === option.type ? 'text-purple-400' : 'text-zinc-600'}`}>
                                                {maintenance + option.offset}
                                            </span>
                                        </button>
                                    ))}

                                    {/* Maintenance */}
                                    <p className="text-xs text-yellow-400/70 font-medium uppercase tracking-wider mt-4">Maintenance</p>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedGoal('maintenance')}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${selectedGoal === 'maintenance'
                                            ? 'bg-purple-500/15 border border-purple-500/40'
                                            : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                                            }`}
                                    >
                                        <div className="text-left">
                                            <p className={`text-sm font-medium ${selectedGoal === 'maintenance' ? 'text-white' : 'text-zinc-400'}`}>
                                                Maintenance
                                            </p>
                                            <p className="text-xs text-zinc-600">Maintain current weight</p>
                                        </div>
                                        <span className={`text-sm font-mono-numbers font-semibold ${selectedGoal === 'maintenance' ? 'text-purple-400' : 'text-zinc-600'}`}>
                                            {maintenance}
                                        </span>
                                    </button>

                                    {/* Bulk options */}
                                    <p className="text-xs text-green-400/70 font-medium uppercase tracking-wider mt-4">Bulk (Muscle Gain)</p>
                                    {calorieOptions.filter(o => o.type.includes('bulk')).map(option => (
                                        <button
                                            key={option.type}
                                            type="button"
                                            onClick={() => setSelectedGoal(option.type)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${selectedGoal === option.type
                                                ? 'bg-purple-500/15 border border-purple-500/40'
                                                : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                                                }`}
                                        >
                                            <div className="text-left">
                                                <p className={`text-sm font-medium ${selectedGoal === option.type ? 'text-white' : 'text-zinc-400'}`}>
                                                    {option.label}
                                                </p>
                                                <p className="text-xs text-zinc-600">{option.description}</p>
                                            </div>
                                            <span className={`text-sm font-mono-numbers font-semibold ${selectedGoal === option.type ? 'text-purple-400' : 'text-zinc-600'}`}>
                                                {maintenance + option.offset}
                                            </span>
                                        </button>
                                    ))}

                                    {/* Custom */}
                                    <p className="text-xs text-zinc-400/70 font-medium uppercase tracking-wider mt-4">Custom</p>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedGoal('custom')}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${selectedGoal === 'custom'
                                            ? 'bg-purple-500/15 border border-purple-500/40'
                                            : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                                            }`}
                                    >
                                        <p className={`text-sm font-medium ${selectedGoal === 'custom' ? 'text-white' : 'text-zinc-400'}`}>
                                            Custom Target
                                        </p>
                                        {selectedGoal === 'custom' && (
                                            <input
                                                type="number"
                                                value={customCalories}
                                                onChange={(e) => setCustomCalories(e.target.value)}
                                                placeholder="2500"
                                                className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1 text-sm text-right text-purple-400 font-mono-numbers outline-none focus:border-purple-500"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Macro Breakdown Preview */}
                            {(() => {
                                const weightKg = weightUnit === 'kg' ? parseFloat(currentWeight) : convertWeight(parseFloat(currentWeight || '0'), 'lbs', 'kg')
                                const targetCals = selectedGoal === 'custom' ? parseInt(customCalories || '0') : maintenance + (calorieOptions.find(o => o.type === selectedGoal)?.offset || 0)
                                const macros = calculateMacros(targetCals, weightKg, selectedGoal)
                                return (
                                    <div className="glass-card-solid p-4 rounded-xl">
                                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Suggested Macro Split</p>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-purple-400 font-mono-numbers">{macros.protein}g</p>
                                                <p className="text-xs text-zinc-500">Protein</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-cyan-400 font-mono-numbers">{macros.carbs}g</p>
                                                <p className="text-xs text-zinc-500">Carbs</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-lg font-bold text-amber-400 font-mono-numbers">{macros.fats}g</p>
                                                <p className="text-xs text-zinc-500">Fats</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="w-full max-w-lg mx-auto px-4 py-6 flex gap-3 relative z-10">
                {step > 0 && (
                    <button
                        type="button"
                        onClick={goBack}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                )}
                <button
                    type="button"
                    onClick={goNext}
                    disabled={!canProceed() || loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : step === 2 ? (
                        <>
                            Complete Setup
                            <Check className="w-5 h-5" />
                        </>
                    ) : (
                        <>
                            Continue
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
