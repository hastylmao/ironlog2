'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Dumbbell, ArrowRight, Zap, Target, TrendingUp, Trophy } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in via localStorage flag
    const hasSession = document.cookie.includes('sb-')
    if (hasSession) {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)' }}
          animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo */}
        <motion.div
          className="mb-8 relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-2xl">
            <Dumbbell className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>
          <motion.div
            className="absolute inset-0 rounded-3xl"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}
            animate={{ opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-6xl sm:text-7xl font-black mb-4 tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <span className="gradient-text">Iron</span>
          <span className="text-white">Log</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg sm:text-xl text-zinc-400 mb-12 leading-relaxed max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Track your transformation. AI-powered workout &amp; nutrition logging for serious athletes.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {[
            { icon: Zap, text: 'AI Nutrition', color: 'from-purple-500/20 to-purple-600/5 border-purple-500/30' },
            { icon: Target, text: 'Smart Tracking', color: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30' },
            { icon: TrendingUp, text: 'Progress Score', color: 'from-blue-500/20 to-blue-600/5 border-blue-500/30' },
            { icon: Trophy, text: '1000+ Achievements', color: 'from-amber-500/20 to-amber-600/5 border-amber-500/30' },
          ].map((feature, i) => (
            <motion.div
              key={feature.text}
              className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${feature.color} border backdrop-blur-sm`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
            >
              <feature.icon className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <button
            onClick={() => router.push('/auth/signup')}
            className="btn-primary flex items-center justify-center gap-2 text-lg px-8 py-4"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => router.push('/auth/login')}
            className="btn-secondary flex items-center justify-center gap-2 text-lg px-8 py-4"
          >
            Sign In
          </button>
        </motion.div>
      </motion.div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  )
}
