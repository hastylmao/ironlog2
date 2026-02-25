'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Search, User, Trophy, Dumbbell, CalendarDays } from 'lucide-react'
import { formatSplitDay } from '@/lib/splits'
import type { UserProfile, WorkoutSplit } from '@/types'

export default function SocialPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [results, setResults] = useState<Partial<UserProfile>[]>([])
    const [selectedUser, setSelectedUser] = useState<Partial<UserProfile> | null>(null)
    const [userLogs, setUserLogs] = useState<Record<string, unknown>[]>([])
    const [loading, setLoading] = useState(false)

    const handleSearch = async (query: string) => {
        setSearchQuery(query)
        if (query.length < 2) {
            setResults([])
            return
        }

        setLoading(true)
        const supabase = createClient()
        const { data } = await supabase
            .from('users')
            .select('id, username, age, height, height_unit, current_weight, weight_unit, workout_split, progress_score')
            .ilike('username', `%${query}%`)
            .limit(10)

        setResults((data || []) as Partial<UserProfile>[])
        setLoading(false)
    }

    const viewUserProfile = async (user: Partial<UserProfile>) => {
        setSelectedUser(user)
        setLoading(true)

        const supabase = createClient()

        // Get recent daily logs
        const { data: logs } = await supabase
            .from('daily_logs')
            .select('*, food_logs(*), workout_logs(*, workout_exercises(*, exercise_sets(*)))')
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .limit(7)

        setUserLogs(logs || [])
        setLoading(false)
    }

    const days: (keyof WorkoutSplit)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    return (
        <div className="max-w-2xl mx-auto px-4 pt-6">
            <h1 className="text-2xl font-bold gradient-text mb-6">Community</h1>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search users by username..."
                    className="input-field pl-12"
                />
            </div>

            {!selectedUser ? (
                <>
                    {/* Search Results */}
                    {results.length > 0 && (
                        <div className="space-y-2">
                            {results.map((user) => (
                                <motion.button
                                    key={user.id}
                                    onClick={() => viewUserProfile(user)}
                                    className="w-full glass-card-solid p-4 rounded-xl flex items-center gap-4 hover:bg-zinc-800/50 transition-colors text-left"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/30 flex items-center justify-center">
                                        <User className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-white">@{user.username}</p>
                                        <p className="text-xs text-zinc-500">Score: {(user.progress_score || 0).toFixed(1)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-zinc-500">{user.current_weight}{user.weight_unit}</p>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}

                    {searchQuery.length >= 2 && results.length === 0 && !loading && (
                        <div className="glass-card-solid p-8 rounded-2xl text-center">
                            <User className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                            <p className="text-sm text-zinc-500">No users found</p>
                        </div>
                    )}

                    {!searchQuery && (
                        <div className="glass-card-solid p-8 rounded-2xl text-center">
                            <Search className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                            <p className="text-sm text-zinc-500">Search for users by username to view their profiles</p>
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* User Profile View */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                        <button
                            onClick={() => { setSelectedUser(null); setUserLogs([]) }}
                            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            ← Back to search
                        </button>

                        {/* Profile Header */}
                        <div className="glass-card-solid p-6 rounded-2xl text-center">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                                <User className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white">@{selectedUser.username}</h2>
                            <div className="flex justify-center gap-6 mt-4">
                                <div className="text-center">
                                    <p className="text-lg font-bold gradient-text font-mono-numbers">{(selectedUser.progress_score || 0).toFixed(1)}</p>
                                    <p className="text-xs text-zinc-500">Score</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-white font-mono-numbers">{selectedUser.current_weight}</p>
                                    <p className="text-xs text-zinc-500">{selectedUser.weight_unit}</p>
                                </div>
                                {selectedUser.age && (
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-white font-mono-numbers">{selectedUser.age}</p>
                                        <p className="text-xs text-zinc-500">Age</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Their Split */}
                        {selectedUser.workout_split && (
                            <div className="glass-card-solid p-4 rounded-2xl">
                                <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4" />
                                    Weekly Split
                                </h3>
                                <div className="space-y-1.5">
                                    {days.map((day, i) => (
                                        <div key={day} className="flex items-center gap-3">
                                            <span className="text-xs text-zinc-600 w-8">{dayLabels[i]}</span>
                                            <span className="text-xs text-zinc-400">
                                                {formatSplitDay((selectedUser.workout_split as WorkoutSplit)[day] || [])}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Activity */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-zinc-400">Recent Activity</h3>
                            {userLogs.map((log: Record<string, unknown>, i) => (
                                <div key={i} className="glass-card-solid p-4 rounded-xl">
                                    <p className="text-xs text-zinc-500 mb-2">{log.date as string}</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex items-center gap-1 text-zinc-400">
                                            <span>💧</span> {(log.water_ml as number) || 0}ml
                                        </div>
                                        <div className="flex items-center gap-1 text-zinc-400">
                                            <span>🏋️</span> {Array.isArray(log.workout_logs) ? (log.workout_logs as unknown[]).length : 0} workout{Array.isArray(log.workout_logs) && (log.workout_logs as unknown[]).length !== 1 ? 's' : ''}
                                        </div>
                                        <div className="flex items-center gap-1 text-zinc-400">
                                            <span>🍽️</span> {Array.isArray(log.food_logs) ? (log.food_logs as unknown[]).length : 0} meal{Array.isArray(log.food_logs) && (log.food_logs as unknown[]).length !== 1 ? 's' : ''}
                                        </div>
                                        <div className="flex items-center gap-1 text-zinc-400">
                                            <span>⭐</span> Score: {((log.progress_score as number) || 0).toFixed(1)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}

            <div className="h-8" />
        </div>
    )
}
