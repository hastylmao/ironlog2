'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { CalendarDays, ChevronLeft, ChevronRight, Flame, Beef, Droplets, Dumbbell } from 'lucide-react'
import type { FoodLog, WorkoutLog } from '@/types'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function HistoryPage() {
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [dailyData, setDailyData] = useState<Record<string, unknown> | null>(null)
    const [foodLogs, setFoodLogs] = useState<FoodLog[]>([])
    const [workoutLogs, setWorkoutLogs] = useState<Record<string, unknown>[]>([])
    const [loading, setLoading] = useState(false)
    const [view, setView] = useState<'calendar' | 'trends'>('calendar')
    const [trendData, setTrendData] = useState<Record<string, unknown>[]>([])

    // Load data for selected date
    useEffect(() => {
        const loadDayData = async () => {
            setLoading(true)
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { setLoading(false); return }

            const dateStr = selectedDate.toISOString().split('T')[0]

            // Daily log
            const { data: dailyLog } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', dateStr)
                .single()

            setDailyData(dailyLog)

            if (dailyLog) {
                // Food logs
                const { data: foods } = await supabase
                    .from('food_logs')
                    .select('*')
                    .eq('daily_log_id', dailyLog.id)
                    .order('logged_at')

                setFoodLogs((foods || []) as FoodLog[])

                // Workout logs with exercises
                const { data: workouts } = await supabase
                    .from('workout_logs')
                    .select('*, workout_exercises(*, exercise_sets(*))')
                    .eq('daily_log_id', dailyLog.id)

                setWorkoutLogs(workouts || [])
            } else {
                setFoodLogs([])
                setWorkoutLogs([])
            }

            setLoading(false)
        }
        loadDayData()
    }, [selectedDate])

    // Load trend data
    useEffect(() => {
        const loadTrends = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const { data: logs } = await supabase
                .from('daily_logs')
                .select('date, water_ml, progress_score')
                .eq('user_id', user.id)
                .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
                .order('date')

            if (logs) {
                setTrendData(logs.map(l => ({
                    date: l.date,
                    water: l.water_ml,
                    score: l.progress_score,
                })))
            }
        }
        if (view === 'trends') loadTrends()
    }, [view])

    // Calendar helpers
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const calendarDays = Array.from({ length: 42 }, (_, i) => {
        const dayNum = i - firstDay + 1
        if (dayNum < 1 || dayNum > daysInMonth) return null
        return dayNum
    })

    const navigateMonth = (dir: number) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + dir, 1))
    }

    const isToday = (day: number) => {
        const today = new Date()
        return day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear()
    }

    const isSelected = (day: number) => {
        return day === selectedDate.getDate() &&
            currentMonth.getMonth() === selectedDate.getMonth() &&
            currentMonth.getFullYear() === selectedDate.getFullYear()
    }

    const totals = foodLogs.reduce(
        (acc, log) => ({
            calories: acc.calories + (log.calories || 0),
            protein: acc.protein + (log.protein || 0),
            carbs: acc.carbs + (log.carbs || 0),
            fats: acc.fats + (log.fats || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
    )

    return (
        <div className="max-w-2xl mx-auto px-4 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold gradient-text">History</h1>
                <div className="flex rounded-xl overflow-hidden border border-zinc-800">
                    <button
                        onClick={() => setView('calendar')}
                        className={`px-4 py-2 text-sm font-medium transition-all ${view === 'calendar' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-900 text-zinc-500'
                            }`}
                    >
                        Calendar
                    </button>
                    <button
                        onClick={() => setView('trends')}
                        className={`px-4 py-2 text-sm font-medium transition-all ${view === 'trends' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-900 text-zinc-500'
                            }`}
                    >
                        Trends
                    </button>
                </div>
            </div>

            {view === 'calendar' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Calendar */}
                    <div className="glass-card-solid p-4 rounded-2xl mb-5">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                                <ChevronLeft className="w-5 h-5 text-zinc-400" />
                            </button>
                            <h3 className="text-sm font-semibold text-white">
                                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </h3>
                            <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                                <ChevronRight className="w-5 h-5 text-zinc-400" />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                <div key={d} className="text-center text-[10px] text-zinc-600 font-medium py-1">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, i) => (
                                <button
                                    key={i}
                                    onClick={() => day && setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                                    disabled={!day}
                                    className={`aspect-square rounded-lg text-sm font-medium transition-all ${!day ? 'invisible' :
                                        isSelected(day) ? 'bg-gradient-to-br from-purple-500 to-cyan-500 text-white shadow-lg' :
                                            isToday(day) ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                                'text-zinc-400 hover:bg-zinc-800'
                                        }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Day Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-zinc-400">
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </h3>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : !dailyData ? (
                            <div className="glass-card-solid p-8 rounded-2xl text-center">
                                <p className="text-zinc-600 text-sm">No data logged for this day</p>
                            </div>
                        ) : (
                            <>
                                {/* Daily summaries */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="glass-card-solid p-3 rounded-xl">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                            <span className="text-xs text-zinc-500">Calories</span>
                                        </div>
                                        <p className="text-lg font-bold text-white font-mono-numbers">{Math.round(totals.calories)}</p>
                                    </div>
                                    <div className="glass-card-solid p-3 rounded-xl">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Beef className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                            <span className="text-xs text-zinc-500">Protein</span>
                                        </div>
                                        <p className="text-lg font-bold text-white font-mono-numbers">{Math.round(totals.protein)}g</p>
                                    </div>
                                    <div className="glass-card-solid p-3 rounded-xl">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                            <span className="text-xs text-zinc-500">Water</span>
                                        </div>
                                        <p className="text-lg font-bold text-white font-mono-numbers">{(dailyData as Record<string, unknown>).water_ml as number || 0}ml</p>
                                    </div>
                                    <div className="glass-card-solid p-3 rounded-xl">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Dumbbell className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                            <span className="text-xs text-zinc-500">Workouts</span>
                                        </div>
                                        <p className="text-lg font-bold text-white font-mono-numbers">{workoutLogs.length}</p>
                                    </div>
                                </div>

                                {/* Meals */}
                                {foodLogs.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs text-zinc-500 uppercase tracking-wider">Meals</h4>
                                        {foodLogs.map((log, i) => (
                                            <div key={log.id || i} className="glass-card-solid p-3 rounded-xl flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-xs">🍽️</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{log.food_name}</p>
                                                    <p className="text-xs text-zinc-500">{log.meal_type} • {Math.round(log.calories)} kcal</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Workouts */}
                                {workoutLogs.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs text-zinc-500 uppercase tracking-wider">Workouts</h4>
                                        {workoutLogs.map((workout: Record<string, unknown>, i) => (
                                            <div key={(workout.id as string) || i} className="glass-card-solid p-3 rounded-xl">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Dumbbell className="w-5 h-5 text-purple-400 shrink-0" />
                                                    <p className="text-sm font-semibold text-white">Workout {i + 1}</p>
                                                </div>
                                                {Array.isArray(workout.workout_exercises) && (workout.workout_exercises as Record<string, unknown>[]).map((ex: Record<string, unknown>) => (
                                                    <div key={ex.id as string} className="ml-8 py-1">
                                                        <p className="text-xs text-zinc-400">{ex.exercise_name as string}</p>
                                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                                            {Array.isArray(ex.exercise_sets) && (ex.exercise_sets as Record<string, unknown>[]).map((s: Record<string, unknown>, si: number) => (
                                                                <span key={si} className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 font-mono-numbers">
                                                                    {s.reps as number}×{s.weight as number}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Trends View */}
            {view === 'trends' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    <div className="glass-card-solid p-4 rounded-2xl">
                        <h3 className="text-sm font-semibold text-zinc-400 mb-3">Progress Score (30 Days)</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717A' }} />
                                <YAxis tick={{ fontSize: 10, fill: '#71717A' }} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="score" stroke="#8B5CF6" fill="url(#scoreGradient)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="glass-card-solid p-4 rounded-2xl">
                        <h3 className="text-sm font-semibold text-zinc-400 mb-3">Water Intake (30 Days)</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717A' }} />
                                <YAxis tick={{ fontSize: 10, fill: '#71717A' }} />
                                <Tooltip
                                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}
                                    labelStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="water" stroke="#06B6D4" fill="url(#waterGradient)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}

            <div className="h-8" />
        </div>
    )
}
