'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { exerciseDatabase, bodyParts, searchExercises } from '@/lib/exercises'
import { parseWorkoutFromText } from '@/lib/gemini'
import {
    X, Search, Plus, Trash2, Loader2, Check, Dumbbell, MessageSquare,
    ChevronDown, Clock, RefreshCw
} from 'lucide-react'
import type { SetType, ExerciseInfo, WorkoutLog } from '@/types'

interface WorkoutLogModalProps {
    onClose: () => void
}

interface LocalExercise {
    id: string
    name: string
    bodyPart: string
    sets: LocalSet[]
    notes: string
}

interface LocalSet {
    id: string
    reps: string
    weight: string
    setType: SetType
}

const setTypeOptions: { value: SetType; label: string; color: string }[] = [
    { value: 'warmup', label: 'Warmup', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    { value: 'working', label: 'Working', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    { value: 'dropset', label: 'Drop Set', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    { value: 'failure', label: 'Failure', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
]

export function WorkoutLogModal({ onClose }: WorkoutLogModalProps) {
    const { user, addWorkoutLog } = useAppStore()
    const [mode, setMode] = useState<'manual' | 'ai'>('manual')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Manual mode
    const [exercises, setExercises] = useState<LocalExercise[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedBodyPart, setSelectedBodyPart] = useState<string>('')
    const [showExerciseList, setShowExerciseList] = useState(false)
    const [workoutNotes, setWorkoutNotes] = useState('')

    // AI mode
    const [aiPrompt, setAiPrompt] = useState('')
    const [aiStep, setAiStep] = useState<'input' | 'review'>('input')

    const filteredExercises = useMemo(() => {
        return searchExercises(searchQuery, selectedBodyPart || undefined)
    }, [searchQuery, selectedBodyPart])

    const addExercise = (exercise: ExerciseInfo) => {
        setExercises(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                name: exercise.name,
                bodyPart: exercise.bodyPart,
                sets: [{ id: crypto.randomUUID(), reps: '', weight: '', setType: 'working' }],
                notes: '',
            },
        ])
        setShowExerciseList(false)
        setSearchQuery('')
    }

    const removeExercise = (id: string) => {
        setExercises(prev => prev.filter(e => e.id !== id))
    }

    const addSet = (exerciseId: string) => {
        setExercises(prev =>
            prev.map(e =>
                e.id === exerciseId
                    ? {
                        ...e,
                        sets: [
                            ...e.sets,
                            { id: crypto.randomUUID(), reps: '', weight: '', setType: 'working' },
                        ],
                    }
                    : e
            )
        )
    }

    const removeSet = (exerciseId: string, setId: string) => {
        setExercises(prev =>
            prev.map(e =>
                e.id === exerciseId
                    ? { ...e, sets: e.sets.filter(s => s.id !== setId) }
                    : e
            )
        )
    }

    const updateSet = (exerciseId: string, setId: string, field: string, value: string) => {
        setExercises(prev =>
            prev.map(e =>
                e.id === exerciseId
                    ? {
                        ...e,
                        sets: e.sets.map(s =>
                            s.id === setId ? { ...s, [field]: value } : s
                        ),
                    }
                    : e
            )
        )
    }

    const handleAIParse = async () => {
        if (!user?.gemini_api_key) {
            setError('Please add your Gemini API key in Settings')
            return
        }
        if (!aiPrompt.trim()) return

        setLoading(true)
        setError('')

        try {
            const result = await parseWorkoutFromText(user.gemini_api_key, aiPrompt)

            const parsedExercises: LocalExercise[] = result.exercises.map((ex) => ({
                id: crypto.randomUUID(),
                name: ex.name,
                bodyPart: ex.body_part,
                sets: ex.sets.map((s) => ({
                    id: crypto.randomUUID(),
                    reps: s.reps.toString(),
                    weight: s.weight.toString(),
                    setType: s.set_type || 'working',
                })),
                notes: '',
            }))

            setExercises(parsedExercises)
            setAiStep('review')
            setMode('manual') // Switch to manual for review/editing
        } catch {
            setError('AI parsing failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (exercises.length === 0) return

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

            if (!dailyLog) return

            // Create workout log
            const { data: workoutLog, error: wlError } = await supabase
                .from('workout_logs')
                .insert({
                    daily_log_id: dailyLog.id,
                    user_id: authUser.id,
                    started_at: new Date().toISOString(),
                    completed_at: new Date().toISOString(),
                    notes: workoutNotes || null,
                    input_mode: aiStep === 'review' ? 'ai' : 'manual',
                })
                .select()
                .single()

            if (wlError || !workoutLog) {
                setError('Failed to create workout log')
                return
            }

            // Save exercises and sets
            for (let i = 0; i < exercises.length; i++) {
                const ex = exercises[i]

                const { data: exerciseLog, error: exError } = await supabase
                    .from('workout_exercises')
                    .insert({
                        workout_log_id: workoutLog.id,
                        exercise_name: ex.name,
                        body_part: ex.bodyPart,
                        order_index: i,
                        notes: ex.notes || null,
                    })
                    .select()
                    .single()

                if (exError || !exerciseLog) continue

                // Save sets
                const setsData = ex.sets.map((s, j) => ({
                    workout_exercise_id: exerciseLog.id,
                    set_number: j + 1,
                    reps: parseInt(s.reps) || 0,
                    weight: parseFloat(s.weight) || 0,
                    weight_unit: user?.weight_unit || 'lbs',
                    set_type: s.setType,
                }))

                await supabase.from('exercise_sets').insert(setsData)
            }

            addWorkoutLog(workoutLog as WorkoutLog)
            onClose()
        } catch {
            setError('Failed to save workout')
        } finally {
            setLoading(false)
        }
    }

    // Calculate workout summary
    const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
    const totalVolume = exercises.reduce((acc, ex) =>
        acc + ex.sets.reduce((sacc, s) =>
            sacc + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0
        ), 0
    )

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
                            <h2 className="text-xl font-bold gradient-text">Log Workout</h2>
                            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Mode tabs */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setMode('manual')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === 'manual'
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                        : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                                    }`}
                            >
                                <Dumbbell className="w-4 h-4" />
                                Manual
                            </button>
                            <button
                                onClick={() => setMode('ai')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === 'ai'
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                        : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                                    }`}
                            >
                                <MessageSquare className="w-4 h-4" />
                                AI Prompt
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-5 space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        {/* AI Mode */}
                        {mode === 'ai' && aiStep === 'input' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Describe your workout</label>
                                    <textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="e.g., I did 4 sets of bench press, 135lbs for 10,8,8,6 reps, then 3 sets of incline dumbbell press 50lbs for 12,10,8"
                                        className="input-field min-h-[120px] resize-none"
                                        rows={4}
                                    />
                                </div>
                                <button
                                    onClick={handleAIParse}
                                    disabled={loading || !aiPrompt.trim()}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>✨ Parse with AI</>}
                                </button>
                            </div>
                        )}

                        {/* Manual Mode / AI Review */}
                        {(mode === 'manual' || aiStep === 'review') && (
                            <>
                                {/* Add Exercise Button */}
                                <button
                                    onClick={() => setShowExerciseList(true)}
                                    className="w-full py-3 rounded-xl border-2 border-dashed border-zinc-700 text-zinc-500 hover:border-purple-500/50 hover:text-purple-400 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add Exercise
                                </button>

                                {/* Exercise Picker */}
                                <AnimatePresence>
                                    {showExerciseList && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-3">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                    <input
                                                        type="text"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        placeholder="Search exercises..."
                                                        className="input-field pl-10 py-2 text-sm"
                                                        autoFocus
                                                    />
                                                </div>

                                                {/* Body part filter */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    <button
                                                        onClick={() => setSelectedBodyPart('')}
                                                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${!selectedBodyPart
                                                                ? 'bg-purple-500/20 text-purple-300'
                                                                : 'bg-zinc-800 text-zinc-500'
                                                            }`}
                                                    >
                                                        All
                                                    </button>
                                                    {bodyParts.map(bp => (
                                                        <button
                                                            key={bp}
                                                            onClick={() => setSelectedBodyPart(bp)}
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedBodyPart === bp
                                                                    ? 'bg-purple-500/20 text-purple-300'
                                                                    : 'bg-zinc-800 text-zinc-500'
                                                                }`}
                                                        >
                                                            {bp}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Exercise list */}
                                                <div className="max-h-48 overflow-y-auto space-y-1">
                                                    {filteredExercises.slice(0, 30).map(ex => (
                                                        <button
                                                            key={ex.name}
                                                            onClick={() => addExercise(ex)}
                                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors flex items-center justify-between"
                                                        >
                                                            <div>
                                                                <p className="text-sm font-medium text-white">{ex.name}</p>
                                                                <p className="text-xs text-zinc-500">{ex.bodyPart}</p>
                                                            </div>
                                                            <Plus className="w-4 h-4 text-purple-400" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Exercise List */}
                                <div className="space-y-4">
                                    {exercises.map((exercise, exIdx) => (
                                        <motion.div
                                            key={exercise.id}
                                            className="glass-card-solid rounded-xl p-4"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: exIdx * 0.05 }}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{exercise.name}</p>
                                                    <p className="text-xs text-zinc-500">{exercise.bodyPart}</p>
                                                </div>
                                                <button onClick={() => removeExercise(exercise.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Sets header */}
                                            <div className="grid grid-cols-[32px_1fr_1fr_80px_32px] gap-2 mb-2 px-1">
                                                <span className="text-[10px] text-zinc-600 text-center">#</span>
                                                <span className="text-[10px] text-zinc-600 text-center">Reps</span>
                                                <span className="text-[10px] text-zinc-600 text-center">Weight</span>
                                                <span className="text-[10px] text-zinc-600 text-center">Type</span>
                                                <span></span>
                                            </div>

                                            {/* Sets */}
                                            {exercise.sets.map((set, setIdx) => (
                                                <div key={set.id} className="grid grid-cols-[32px_1fr_1fr_80px_32px] gap-2 mb-2 items-center">
                                                    <span className="text-xs text-zinc-500 text-center font-mono-numbers">{setIdx + 1}</span>
                                                    <input
                                                        type="number"
                                                        value={set.reps}
                                                        onChange={(e) => updateSet(exercise.id, set.id, 'reps', e.target.value)}
                                                        placeholder="10"
                                                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-center text-white outline-none focus:border-purple-500"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={set.weight}
                                                        onChange={(e) => updateSet(exercise.id, set.id, 'weight', e.target.value)}
                                                        placeholder="135"
                                                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-center text-white outline-none focus:border-purple-500"
                                                    />
                                                    <select
                                                        value={set.setType}
                                                        onChange={(e) => updateSet(exercise.id, set.id, 'setType', e.target.value)}
                                                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-1 py-1.5 text-[10px] text-white outline-none appearance-none text-center"
                                                    >
                                                        {setTypeOptions.map(st => (
                                                            <option key={st.value} value={st.value}>{st.label}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => removeSet(exercise.id, set.id)}
                                                        className="text-zinc-700 hover:text-red-400 transition-colors"
                                                        disabled={exercise.sets.length <= 1}
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}

                                            <button
                                                onClick={() => addSet(exercise.id)}
                                                className="w-full py-1.5 text-xs text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors flex items-center justify-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" />
                                                Add Set
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Summary */}
                                {exercises.length > 0 && (
                                    <div className="glass-card-solid p-4 rounded-xl">
                                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Workout Summary</p>
                                        <div className="grid grid-cols-3 gap-3 text-center">
                                            <div>
                                                <p className="text-lg font-bold text-white font-mono-numbers">{exercises.length}</p>
                                                <p className="text-[10px] text-zinc-500">Exercises</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-white font-mono-numbers">{totalSets}</p>
                                                <p className="text-[10px] text-zinc-500">Total Sets</p>
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-white font-mono-numbers">
                                                    {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}K` : totalVolume}
                                                </p>
                                                <p className="text-[10px] text-zinc-500">Volume ({user?.weight_unit || 'lbs'})</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-zinc-400">Workout Notes (optional)</label>
                                    <textarea
                                        value={workoutNotes}
                                        onChange={(e) => setWorkoutNotes(e.target.value)}
                                        placeholder="How did the workout feel?"
                                        className="input-field min-h-[60px] resize-none text-sm"
                                        rows={2}
                                    />
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={handleSave}
                                    disabled={loading || exercises.length === 0}
                                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Save Workout</>}
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
