'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { validateGeminiKey } from '@/lib/gemini'
import {
    User, Settings, Key, LogOut, Shield, Palette, Droplets, Scale,
    Download, Trash2, Check, X, Loader2, ChevronRight, Trophy,
    Camera
} from 'lucide-react'
import type { UserProfile, UserAchievement } from '@/types'

export default function ProfilePage() {
    const router = useRouter()
    const { user, setUser } = useAppStore()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [achievements, setAchievements] = useState<UserAchievement[]>([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [geminiKey, setGeminiKey] = useState('')
    const [geminiStatus, setGeminiStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
    const [showSettings, setShowSettings] = useState(false)

    // Editable fields
    const [editUsername, setEditUsername] = useState('')
    const [editAge, setEditAge] = useState('')
    const [editCalories, setEditCalories] = useState('')
    const [editProtein, setEditProtein] = useState('')
    const [editCarbs, setEditCarbs] = useState('')
    const [editFats, setEditFats] = useState('')
    const [editWaterTarget, setEditWaterTarget] = useState('')

    useEffect(() => {
        const loadProfile = async () => {
            const supabase = createClient()
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) { router.push('/auth/login'); return }

            const { data } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single()

            if (data) {
                const p = data as UserProfile
                setProfile(p)
                setUser(p)
                setEditUsername(p.username)
                setEditAge(p.age?.toString() || '')
                setEditCalories(p.calorie_target?.toString() || '')
                setEditProtein(p.protein_target?.toString() || '')
                setEditCarbs(p.carb_target?.toString() || '')
                setEditFats(p.fat_target?.toString() || '')
                setEditWaterTarget(p.water_target?.toString() || '3000')
                if (p.gemini_api_key) {
                    setGeminiKey(p.gemini_api_key)
                    setGeminiStatus('valid')
                }
            }

            // Load achievements
            const { data: userAch } = await supabase
                .from('user_achievements')
                .select('*, achievement:achievements(*)')
                .eq('user_id', authUser.id)
                .order('unlocked_at', { ascending: false })
                .limit(10)

            if (userAch) setAchievements(userAch as UserAchievement[])

            setLoading(false)
        }
        loadProfile()
    }, [router, setUser])

    const handleSaveProfile = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return

        await supabase
            .from('users')
            .update({
                username: editUsername,
                age: parseInt(editAge),
                calorie_target: parseInt(editCalories),
                protein_target: parseInt(editProtein),
                carb_target: parseInt(editCarbs),
                fat_target: parseInt(editFats),
                water_target: parseInt(editWaterTarget),
            })
            .eq('id', authUser.id)

        setEditing(false)
        setLoading(false)
        window.location.reload()
    }

    const handleSaveGeminiKey = async () => {
        setGeminiStatus('checking')
        const isValid = await validateGeminiKey(geminiKey)
        setGeminiStatus(isValid ? 'valid' : 'invalid')

        if (isValid) {
            const supabase = createClient()
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) return

            await supabase
                .from('users')
                .update({ gemini_api_key: geminiKey })
                .eq('id', authUser.id)
        }
    }

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const handleExportData = async () => {
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return

        const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
        const { data: dailyLogs } = await supabase.from('daily_logs').select('*').eq('user_id', authUser.id)
        const { data: foodLogs } = await supabase.from('food_logs').select('*').eq('user_id', authUser.id)
        const { data: workoutLogs } = await supabase.from('workout_logs').select('*, workout_exercises(*, exercise_sets(*))').eq('user_id', authUser.id)

        const exportData = { profile, dailyLogs, foodLogs, workoutLogs, exportedAt: new Date().toISOString() }
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ironlog-export-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
            <h1 className="text-2xl font-bold gradient-text mb-6">Profile</h1>

            {/* Profile Card */}
            <motion.div
                className="glass-card-solid p-6 rounded-2xl mb-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">@{profile?.username}</h2>
                        <p className="text-sm text-zinc-500">{profile?.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold gradient-text font-mono-numbers">{(profile?.progress_score || 0).toFixed(1)}</p>
                        <p className="text-xs text-zinc-500">Score</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white font-mono-numbers">{profile?.current_weight}</p>
                        <p className="text-xs text-zinc-500">{profile?.weight_unit}</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white font-mono-numbers">{achievements.length}</p>
                        <p className="text-xs text-zinc-500">Achievements</p>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            {!editing ? (
                <div className="space-y-3 mb-5">
                    {[
                        { label: 'Calorie Target', value: `${profile?.calorie_target} kcal` },
                        { label: 'Protein Target', value: `${profile?.protein_target}g` },
                        { label: 'Carbs Target', value: `${profile?.carb_target}g` },
                        { label: 'Fats Target', value: `${profile?.fat_target}g` },
                        { label: 'Water Target', value: `${profile?.water_target}ml` },
                        { label: 'Goal Weight', value: `${profile?.goal_weight} ${profile?.weight_unit}` },
                    ].map((item) => (
                        <div key={item.label} className="glass-card-solid p-3 rounded-xl flex items-center justify-between">
                            <span className="text-sm text-zinc-400">{item.label}</span>
                            <span className="text-sm font-semibold text-white font-mono-numbers">{item.value}</span>
                        </div>
                    ))}
                    <button
                        onClick={() => setEditing(true)}
                        className="btn-secondary w-full"
                    >
                        Edit Profile
                    </button>
                </div>
            ) : (
                <div className="space-y-3 mb-5">
                    <div className="glass-card-solid p-4 rounded-xl space-y-3">
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500">Username</label>
                            <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="input-field py-2 text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-500">Calorie Target</label>
                                <input type="number" value={editCalories} onChange={(e) => setEditCalories(e.target.value)} className="input-field py-2 text-sm text-center" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-500">Protein (g)</label>
                                <input type="number" value={editProtein} onChange={(e) => setEditProtein(e.target.value)} className="input-field py-2 text-sm text-center" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-500">Carbs (g)</label>
                                <input type="number" value={editCarbs} onChange={(e) => setEditCarbs(e.target.value)} className="input-field py-2 text-sm text-center" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-zinc-500">Fats (g)</label>
                                <input type="number" value={editFats} onChange={(e) => setEditFats(e.target.value)} className="input-field py-2 text-sm text-center" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-zinc-500">Water Target (ml)</label>
                            <input type="number" value={editWaterTarget} onChange={(e) => setEditWaterTarget(e.target.value)} className="input-field py-2 text-sm" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setEditing(false)} className="btn-secondary flex-1">Cancel</button>
                        <button onClick={handleSaveProfile} className="btn-primary flex-1">Save</button>
                    </div>
                </div>
            )}

            {/* Gemini API Key */}
            <div className="glass-card-solid p-4 rounded-2xl mb-5">
                <div className="flex items-center gap-3 mb-3">
                    <Key className="text-purple-400 shrink-0" size={20} />
                    <h3 className="text-sm font-semibold text-white">Gemini API Key</h3>
                    {geminiStatus === 'valid' && <span className="text-xs text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> Connected</span>}
                    {geminiStatus === 'invalid' && <span className="text-xs text-red-400 flex items-center gap-1"><X className="w-3 h-3" /> Invalid</span>}
                </div>
                <div className="flex gap-2">
                    <input
                        type="password"
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        placeholder="Enter your Gemini API key"
                        className="input-field flex-1 py-2 text-sm"
                    />
                    <button
                        onClick={handleSaveGeminiKey}
                        disabled={geminiStatus === 'checking'}
                        className="btn-primary px-4 py-2 text-sm"
                    >
                        {geminiStatus === 'checking' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </button>
                </div>
            </div>

            {/* Recent Achievements */}
            {achievements.length > 0 && (
                <div className="mb-5">
                    <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        Recent Achievements
                    </h3>
                    <div className="space-y-2">
                        {achievements.slice(0, 5).map((ach) => (
                            <div key={ach.id} className={`glass-card-solid p-3 rounded-xl flex items-center gap-3 border tier-${ach.achievement?.tier || 'bronze'}`}>
                                <span className="text-lg">{ach.achievement?.icon || '🏆'}</span>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-white">{ach.achievement?.name}</p>
                                    <p className="text-xs text-zinc-500">{ach.achievement?.description}</p>
                                </div>
                                <span className="text-[10px] uppercase font-semibold text-zinc-500">
                                    {ach.achievement?.tier}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Settings Actions */}
            <div className="space-y-2">
                <button
                    onClick={handleExportData}
                    className="w-full glass-card-solid p-4 rounded-xl flex items-center gap-3 hover:bg-zinc-800/50 transition-colors relative z-10 text-left"
                >
                    <Download className="text-blue-400 shrink-0" size={20} />
                    <span className="text-sm font-medium flex-1 text-left">Export Data (JSON)</span>
                    <ChevronRight className="text-zinc-600 shrink-0" size={16} />
                </button>

                <button
                    onClick={handleLogout}
                    className="w-full glass-card-solid p-4 rounded-xl flex items-center gap-3 hover:bg-red-500/5 transition-colors relative z-10 text-left"
                >
                    <LogOut className="text-red-400 shrink-0" size={20} />
                    <span className="text-sm font-medium text-red-400 flex-1 text-left">Sign Out</span>
                    <ChevronRight className="text-zinc-600 shrink-0" size={16} />
                </button>
            </div>

            <div className="h-8" />
        </div>
    )
}
