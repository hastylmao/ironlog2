'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Dumbbell, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const supabase = createClient()
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) {
                setError(authError.message)
                return
            }

            router.push('/dashboard')
            router.refresh()
        } catch {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden px-4">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-300px] right-[-200px] w-[600px] h-[600px] rounded-full opacity-15"
                    style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }} />
                <div className="absolute bottom-[-300px] left-[-200px] w-[600px] h-[600px] rounded-full opacity-15"
                    style={{ background: 'radial-gradient(circle, #06B6D4 0%, transparent 70%)' }} />
            </div>

            <motion.div
                className="w-full max-w-md relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Logo */}
                <motion.div
                    className="flex flex-col items-center mb-10"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg">
                        <Dumbbell className="w-8 h-8 text-white" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-bold">
                        <span className="gradient-text">Welcome back</span>
                    </h1>
                    <p className="text-zinc-500 mt-2">Sign in to continue your journey</p>
                </motion.div>

                {/* Form */}
                <motion.form
                    onSubmit={handleLogin}
                    className="glass-card-solid p-8 space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    {error && (
                        <motion.div
                            className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Email</label>
                        <div className="relative">
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="input-field"
                                style={{ paddingLeft: '3.5rem' }}
                                required
                            />
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Password</label>
                        <div className="relative">
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="input-field"
                                style={{ paddingLeft: '3.5rem', paddingRight: '3.5rem' }}
                                required
                            />
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={20} />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500"
                            />
                            <span className="text-sm text-zinc-400">Remember me</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Sign In
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </motion.form>

                <motion.p
                    className="text-center mt-6 text-zinc-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    Don&apos;t have an account?{' '}
                    <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                        Sign up
                    </Link>
                </motion.p>
            </motion.div>
        </div>
    )
}
