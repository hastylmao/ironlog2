'use client'

import { motion, useSpring, useTransform, useMotionValue, animate } from 'framer-motion'
import { useEffect } from 'react'

interface AnimatedCounterProps {
    value: number
    decimals?: number
    duration?: number
    className?: string
    suffix?: string
    prefix?: string
}

export function AnimatedCounter({
    value,
    decimals = 0,
    duration = 1,
    className = '',
    suffix = '',
    prefix = '',
}: AnimatedCounterProps) {
    const motionValue = useMotionValue(0)
    const springValue = useSpring(motionValue, { stiffness: 100, damping: 30 })
    const display = useTransform(springValue, (current) => {
        return `${prefix}${current.toFixed(decimals)}${suffix}`
    })

    useEffect(() => {
        const controls = animate(motionValue, value, { duration })
        return controls.stop
    }, [motionValue, value, duration])

    return (
        <motion.span className={`font-mono-numbers ${className}`}>
            {display}
        </motion.span>
    )
}
