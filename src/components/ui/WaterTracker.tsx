'use client'

import { motion } from 'framer-motion'

interface WaterTrackerProps {
    current: number
    target: number
    onAdd: (ml: number) => void
}

export function WaterTracker({ current, target, onAdd }: WaterTrackerProps) {
    const percentage = Math.min((current / target) * 100, 100)

    return (
        <div className="glass-card-solid p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-400">Water Intake</h3>
                <span className="text-sm font-mono-numbers text-cyan-400">
                    {current}ml / {target}ml
                </span>
            </div>

            {/* Water bottle visualization */}
            <div className="flex items-end justify-center mb-5">
                <div className="relative w-20 h-32 rounded-xl border-2 border-cyan-500/30 bg-zinc-900/50 overflow-hidden">
                    {/* Water fill */}
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-500/60 to-cyan-400/30 water-fill"
                        initial={{ height: '0%' }}
                        animate={{ height: `${percentage}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                    {/* Wave effect */}
                    <motion.div
                        className="absolute left-0 right-0"
                        style={{ bottom: `${percentage}%` }}
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <svg viewBox="0 0 80 10" className="w-full h-3 text-cyan-400/40">
                            <path d="M0,5 Q10,2 20,5 Q30,8 40,5 Q50,2 60,5 Q70,8 80,5 L80,10 L0,10 Z" fill="currentColor" />
                        </svg>
                    </motion.div>
                    {/* Percentage text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-white/80 font-mono-numbers drop-shadow-lg">
                            {Math.round(percentage)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick add buttons */}
            <div className="flex gap-2">
                {[100, 250, 500].map((ml) => (
                    <motion.button
                        key={ml}
                        onClick={() => onAdd(ml)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ y: -1 }}
                    >
                        +{ml}ml
                    </motion.button>
                ))}
            </div>
        </div>
    )
}
