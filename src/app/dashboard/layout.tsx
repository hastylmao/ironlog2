'use client'

import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, ClipboardList, CalendarDays, Users, User, Plus } from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'

const navItems = [
    { id: 'home', icon: Home, label: 'Home', href: '/dashboard' },
    { id: 'log', icon: ClipboardList, label: 'Log', href: '/dashboard/log' },
    { id: 'history', icon: CalendarDays, label: 'History', href: '/dashboard/history' },
    { id: 'social', icon: Users, label: 'Social', href: '/dashboard/social' },
    { id: 'profile', icon: User, label: 'Profile', href: '/dashboard/profile' },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [showQuickAdd, setShowQuickAdd] = useState(false)
    const { setShowFoodModal, setShowWaterModal, setShowWorkoutModal, setShowPhotoModal } = useAppStore()

    const activeTab = navItems.find(item => {
        if (item.href === '/dashboard') return pathname === '/dashboard'
        return pathname.startsWith(item.href)
    })?.id || 'home'

    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Main content area */}
            <main className="flex-1 pb-24 overflow-y-auto">
                {children}
            </main>

            {/* Floating Action Button */}
            <div className="fixed bottom-24 right-4 z-50">
                <motion.button
                    onClick={() => setShowQuickAdd(!showQuickAdd)}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-purple-500/30"
                    whileTap={{ scale: 0.9 }}
                    animate={{ rotate: showQuickAdd ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
                </motion.button>

                {/* Quick add menu */}
                <motion.div
                    className="absolute bottom-16 right-0 flex flex-col gap-3"
                    initial={false}
                    animate={showQuickAdd ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
                    transition={{ duration: 0.2 }}
                    style={{ pointerEvents: showQuickAdd ? 'auto' : 'none' }}
                >
                    {[
                        { label: '🍽️ Food', action: () => { setShowFoodModal(true); setShowQuickAdd(false) } },
                        { label: '💧 Water', action: () => { setShowWaterModal(true); setShowQuickAdd(false) } },
                        { label: '🏋️ Workout', action: () => { setShowWorkoutModal(true); setShowQuickAdd(false) } },
                        { label: '📸 Photo', action: () => { setShowPhotoModal(true); setShowQuickAdd(false) } },
                    ].map((item, i) => (
                        <motion.button
                            key={item.label}
                            onClick={item.action}
                            className="flex items-center gap-3 px-4 py-3 glass-card-solid rounded-xl whitespace-nowrap hover:bg-zinc-800 transition-colors shadow-lg"
                            initial={{ opacity: 0, x: 20 }}
                            animate={showQuickAdd ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                            transition={{ delay: showQuickAdd ? i * 0.05 : 0, duration: 0.2 }}
                        >
                            <span className="text-sm font-medium">{item.label}</span>
                        </motion.button>
                    ))}
                </motion.div>
            </div>

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-zinc-800/50 mobile-nav z-40">
                <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id
                        return (
                            <button
                                key={item.id}
                                onClick={() => router.push(item.href)}
                                className="flex flex-col items-center gap-1 py-1 px-3 relative"
                            >
                                {isActive && (
                                    <motion.div
                                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"
                                        layoutId="activeTab"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <item.icon
                                    className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-zinc-600'}`}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-white' : 'text-zinc-600'}`}>
                                    {item.label}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </nav>

            {/* Overlay for quick add */}
            {showQuickAdd && (
                <motion.div
                    className="fixed inset-0 bg-black/40 z-30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowQuickAdd(false)}
                />
            )}
        </div>
    )
}
