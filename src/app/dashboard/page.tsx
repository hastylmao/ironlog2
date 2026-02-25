'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { getTodaySplit, formatSplitDay } from '@/lib/splits'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { WaterTracker } from '@/components/ui/WaterTracker'
import { FoodLogModal } from '@/components/modals/FoodLogModal'
import { WorkoutLogModal } from '@/components/modals/WorkoutLogModal'
import {
    TrendingUp, TrendingDown, Minus, Flame, Beef, Wheat, Droplets as Oil,
    UtensilsCrossed, Dumbbell, Camera, Droplets, CalendarDays
} from 'lucide-react'
import type { UserProfile, FoodLog } from '@/types'

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
}

export default function DashboardPage() {
    const {
        user, setUser, setLoading, isLoading,
        foodLogs, setFoodLogs, waterMl, setWaterMl, addWater,
        showFoodModal, setShowFoodModal,
        showWorkoutModal, setShowWorkoutModal,
        showWaterModal, setShowWaterModal,
    } = useAppStore()

    const [profile, setProfile] = useState<UserProfile | null>(null)

    // Load user data
    useEffect(() => {
        const loadUserData = async () => {
            setLoading(true)
            const supabase = createClient()

            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) {
                setLoading(false)
                return
            }

            // Fetch user profile
            const { data: profileData } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single()

            if (profileData) {
                setProfile(profileData as UserProfile)
                setUser(profileData as UserProfile)
            }

            // Fetch today's data
            const today = new Date().toISOString().split('T')[0]

            // Fetch or create daily log
            let { data: dailyLog } = await supabase
                .from('daily_logs')
                .select('*')
                .eq('user_id', authUser.id)
                .eq('date', today)
                .single()

            if (!dailyLog) {
                const { data: newLog } = await supabase
                    .from('daily_logs')
                    .insert({ user_id: authUser.id, date: today, water_ml: 0, progress_score: 50 })
                    .select()
                    .single()
                dailyLog = newLog
            }

            if (dailyLog) {
                setWaterMl(dailyLog.water_ml || 0)
            }

            // Fetch today's food logs
            if (dailyLog) {
                const { data: foods } = await supabase
                    .from('food_logs')
                    .select('*')
                    .eq('daily_log_id', dailyLog.id)
                    .order('logged_at', { ascending: true })

                if (foods) {
                    setFoodLogs(foods as FoodLog[])
                }
            }

            setLoading(false)
        }

        loadUserData()
    }, [setUser, setLoading, setFoodLogs, setWaterMl])

    // Calculate totals from food logs
    const totals = foodLogs.reduce(
        (acc, log) => ({
            calories: acc.calories + (log.calories || 0),
            protein: acc.protein + (log.protein || 0),
            carbs: acc.carbs + (log.carbs || 0),
            fats: acc.fats + (log.fats || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
    )

    const handleAddWater = useCallback(async (ml: number) => {
        addWater(ml)
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return

        const today = new Date().toISOString().split('T')[0]
        await supabase
            .from('daily_logs')
            .update({ water_ml: waterMl + ml })
            .eq('user_id', authUser.id)
            .eq('date', today)
    }, [addWater, waterMl])

    const todaySplit = profile?.workout_split ? getTodaySplit(profile.workout_split) : []
    const isRestDay = todaySplit.includes('Rest Day') || todaySplit.length === 0

    const now = new Date()
    const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

    // Get score trend arrow
    const scoreTrend = (profile?.progress_score || 50) > 50 ? 'up' : (profile?.progress_score || 50) < 50 ? 'down' : 'stable'

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm">Loading your data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto px-4 pt-6">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-5"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            {greeting}, <span className="gradient-text">{profile?.username || 'Athlete'}</span>
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                            {dateStr}
                        </p>
                    </div>
                </motion.div>

                {/* Progress Score */}
                <motion.div
                    variants={itemVariants}
                    className="glass-card-solid p-5 rounded-2xl flex items-center gap-5"
                >
                    <div className="flex-1">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Progress Score</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black gradient-text font-mono-numbers">
                                {(profile?.progress_score || 50).toFixed(2)}
                            </span>
                            {scoreTrend === 'up' && <TrendingUp className="w-5 h-5 text-green-400" />}
                            {scoreTrend === 'down' && <TrendingDown className="w-5 h-5 text-red-400" />}
                            {scoreTrend === 'stable' && <Minus className="w-5 h-5 text-zinc-500" />}
                        </div>
                        <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                                initial={{ width: '0%' }}
                                animate={{ width: `${profile?.progress_score || 50}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Today's Split */}
                <motion.div variants={itemVariants} className="glass-card-solid p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRestDay ? 'bg-blue-500/15' : 'bg-purple-500/15'}`}>
                            {isRestDay ? '😴' : <Dumbbell className="w-5 h-5 text-purple-400" />}
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">Today&apos;s Split</p>
                            <p className="text-sm font-semibold text-white">
                                {isRestDay ? 'Rest Day' : formatSplitDay(todaySplit)}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Macro Cards */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                    {/* Calories - Large card */}
                    <div className="col-span-2 glass-card-solid p-5 rounded-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-2">
                                    <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                    Calories
                                </p>
                                <div className="flex items-baseline gap-1">
                                    <AnimatedCounter value={Math.round(totals.calories)} className="text-3xl font-bold text-white" />
                                    <span className="text-lg text-zinc-600 font-mono-numbers">/ {profile?.calorie_target || 2000}</span>
                                </div>
                            </div>
                            <ProgressRing
                                progress={(totals.calories / (profile?.calorie_target || 2000)) * 100}
                                size={80}
                                strokeWidth={6}
                            >
                                <span className="text-xs font-semibold text-zinc-400">
                                    {Math.round((totals.calories / (profile?.calorie_target || 2000)) * 100)}%
                                </span>
                            </ProgressRing>
                        </div>
                    </div>

                    {/* Protein */}
                    <div className="glass-card-solid p-4 rounded-2xl">
                        <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-2">
                            <Beef className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            Protein
                        </p>
                        <div className="flex items-baseline gap-1">
                            <AnimatedCounter value={Math.round(totals.protein)} className="text-xl font-bold text-white" suffix="g" />
                        </div>
                        <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-red-400 rounded-full"
                                initial={{ width: '0%' }}
                                animate={{ width: `${Math.min((totals.protein / (profile?.protein_target || 150)) * 100, 100)}%` }}
                                transition={{ duration: 0.8 }}
                            />
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 font-mono-numbers">/ {profile?.protein_target || 150}g</p>
                    </div>

                    {/* Carbs */}
                    <div className="glass-card-solid p-4 rounded-2xl">
                        <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-2">
                            <Wheat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            Carbs
                        </p>
                        <div className="flex items-baseline gap-1">
                            <AnimatedCounter value={Math.round(totals.carbs)} className="text-xl font-bold text-white" suffix="g" />
                        </div>
                        <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-amber-400 rounded-full"
                                initial={{ width: '0%' }}
                                animate={{ width: `${Math.min((totals.carbs / (profile?.carb_target || 200)) * 100, 100)}%` }}
                                transition={{ duration: 0.8 }}
                            />
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 font-mono-numbers">/ {profile?.carb_target || 200}g</p>
                    </div>

                    {/* Fats */}
                    <div className="glass-card-solid p-4 rounded-2xl">
                        <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-2">
                            <Oil className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                            Fats
                        </p>
                        <div className="flex items-baseline gap-1">
                            <AnimatedCounter value={Math.round(totals.fats)} className="text-xl font-bold text-white" suffix="g" />
                        </div>
                        <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-yellow-400 rounded-full"
                                initial={{ width: '0%' }}
                                animate={{ width: `${Math.min((totals.fats / (profile?.fat_target || 60)) * 100, 100)}%` }}
                                transition={{ duration: 0.8 }}
                            />
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 font-mono-numbers">/ {profile?.fat_target || 60}g</p>
                    </div>

                    {/* Water - in the same grid */}
                    <div className="glass-card-solid p-4 rounded-2xl">
                        <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-2">
                            <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            Water
                        </p>
                        <div className="flex items-baseline gap-1">
                            <AnimatedCounter value={waterMl} className="text-xl font-bold text-white" suffix="ml" />
                        </div>
                        <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-cyan-400 rounded-full"
                                initial={{ width: '0%' }}
                                animate={{ width: `${Math.min((waterMl / (profile?.water_target || 3000)) * 100, 100)}%` }}
                                transition={{ duration: 0.8 }}
                            />
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1 font-mono-numbers">/ {profile?.water_target || 3000}ml</p>
                    </div>
                </motion.div>

                {/* Water Tracker */}
                <motion.div variants={itemVariants}>
                    <WaterTracker
                        current={waterMl}
                        target={profile?.water_target || 3000}
                        onAdd={handleAddWater}
                    />
                </motion.div>

                {/* Quick Action Buttons */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                    <motion.button
                        onClick={() => setShowFoodModal(true)}
                        className="glass-card-solid p-4 rounded-2xl flex items-center gap-3 hover:bg-zinc-800/50 transition-colors relative z-10"
                        whileTap={{ scale: 0.97 }}
                    >
                        <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                            <UtensilsCrossed className="text-green-400 shrink-0" size={20} />
                        </div>
                        <span className="text-sm font-semibold">Log Food</span>
                    </motion.button>

                    <motion.button
                        onClick={() => setShowWorkoutModal(true)}
                        className="glass-card-solid p-4 rounded-2xl flex items-center gap-3 hover:bg-zinc-800/50 transition-colors relative z-10"
                        whileTap={{ scale: 0.97 }}
                    >
                        <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                            <Dumbbell className="text-purple-400 shrink-0" size={20} />
                        </div>
                        <span className="text-sm font-semibold">Log Workout</span>
                    </motion.button>
                </motion.div>

                {/* Today's Activity Feed */}
                {foodLogs.length > 0 && (
                    <motion.div variants={itemVariants} className="space-y-3">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Today&apos;s Activity</h3>
                        {foodLogs.map((log, i) => (
                            <motion.div
                                key={log.id || i}
                                className="glass-card-solid p-4 rounded-xl flex items-center gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-sm">
                                    🍽️
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{log.food_name}</p>
                                    <p className="text-xs text-zinc-500">{log.meal_type} • {Math.round(log.calories)} kcal</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-zinc-600 font-mono-numbers">
                                        P:{Math.round(log.protein)}g C:{Math.round(log.carbs)}g F:{Math.round(log.fats)}g
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Spacer for bottom nav */}
                <div className="h-4" />
            </motion.div>

            {/* Modals */}
            {showFoodModal && <FoodLogModal onClose={() => setShowFoodModal(false)} />}
            {showWorkoutModal && <WorkoutLogModal onClose={() => setShowWorkoutModal(false)} />}
        </div>
    )
}
