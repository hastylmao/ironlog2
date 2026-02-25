'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { UtensilsCrossed, Droplets, Dumbbell, Camera, Scale } from 'lucide-react'

export default function LogPage() {
    const { setShowFoodModal, setShowWorkoutModal, setShowWaterModal, setShowPhotoModal } = useAppStore()

    const actions = [
        {
            icon: UtensilsCrossed,
            label: 'Log Food',
            description: 'Track meals with AI or manually',
            color: 'from-green-500/20 to-emerald-500/20 border-green-500/20',
            iconColor: 'text-green-400',
            action: () => setShowFoodModal(true),
        },
        {
            icon: Droplets,
            label: 'Log Water',
            description: 'Track your daily water intake',
            color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/20',
            iconColor: 'text-cyan-400',
            action: () => setShowWaterModal(true),
        },
        {
            icon: Dumbbell,
            label: 'Log Workout',
            description: 'Record exercises, sets & reps',
            color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/20',
            iconColor: 'text-purple-400',
            action: () => setShowWorkoutModal(true),
        },
        {
            icon: Camera,
            label: 'Post-Workout Photo',
            description: 'Capture your progress',
            color: 'from-amber-500/20 to-orange-500/20 border-amber-500/20',
            iconColor: 'text-amber-400',
            action: () => setShowPhotoModal(true),
        },
        {
            icon: Scale,
            label: 'Log Weight',
            description: 'Record today\'s weight',
            color: 'from-pink-500/20 to-rose-500/20 border-pink-500/20',
            iconColor: 'text-pink-400',
            action: () => { },
        },
    ]

    return (
        <div className="max-w-2xl mx-auto px-4 pt-6">
            <h1 className="text-2xl font-bold gradient-text mb-6">Quick Log</h1>

            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                {actions.map((action, i) => (
                    <motion.button
                        key={action.label}
                        onClick={action.action}
                        className={`w-full glass-card-solid p-5 rounded-2xl flex items-center gap-4 hover:bg-zinc-800/50 transition-all border bg-gradient-to-r ${action.color}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.4 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className={`w-12 h-12 rounded-xl bg-zinc-900/50 flex items-center justify-center shrink-0`}>
                            <action.icon className={`w-6 h-6 ${action.iconColor} shrink-0`} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-white">{action.label}</p>
                            <p className="text-xs text-zinc-500">{action.description}</p>
                        </div>
                    </motion.button>
                ))}
            </div>

            <div className="h-8" />
        </div>
    )
}
