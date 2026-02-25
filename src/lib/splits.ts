// ============================================================
// IronLog — Workout Split Presets
// ============================================================
import type { WorkoutSplit, SplitPreset } from '@/types'

export const splitPresets: SplitPreset[] = [
    {
        name: 'Push/Pull/Legs (2x)',
        layout: {
            monday: ['Chest', 'Shoulders', 'Triceps'],
            tuesday: ['Back', 'Biceps', 'Forearms'],
            wednesday: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
            thursday: ['Chest', 'Shoulders', 'Triceps'],
            friday: ['Back', 'Biceps', 'Forearms'],
            saturday: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
            sunday: ['Rest Day'],
        },
    },
    {
        name: 'Push/Pull/Legs (1x)',
        layout: {
            monday: ['Chest', 'Shoulders', 'Triceps'],
            tuesday: ['Back', 'Biceps', 'Forearms'],
            wednesday: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
            thursday: ['Rest Day'],
            friday: ['Rest Day'],
            saturday: ['Rest Day'],
            sunday: ['Rest Day'],
        },
    },
    {
        name: 'Bro Split',
        layout: {
            monday: ['Chest'],
            tuesday: ['Back'],
            wednesday: ['Shoulders'],
            thursday: ['Biceps', 'Triceps'],
            friday: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
            saturday: ['Rest Day'],
            sunday: ['Rest Day'],
        },
    },
    {
        name: 'Upper/Lower (2x)',
        layout: {
            monday: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
            tuesday: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
            wednesday: ['Rest Day'],
            thursday: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
            friday: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
            saturday: ['Rest Day'],
            sunday: ['Rest Day'],
        },
    },
    {
        name: 'Arnold Split',
        layout: {
            monday: ['Chest', 'Back'],
            tuesday: ['Shoulders', 'Biceps', 'Triceps'],
            wednesday: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
            thursday: ['Chest', 'Back'],
            friday: ['Shoulders', 'Biceps', 'Triceps'],
            saturday: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
            sunday: ['Rest Day'],
        },
    },
    {
        name: 'Full Body (3x)',
        layout: {
            monday: ['Full Body'],
            tuesday: ['Rest Day'],
            wednesday: ['Full Body'],
            thursday: ['Rest Day'],
            friday: ['Full Body'],
            saturday: ['Rest Day'],
            sunday: ['Rest Day'],
        },
    },
    {
        name: 'PHUL',
        layout: {
            monday: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
            tuesday: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
            wednesday: ['Rest Day'],
            thursday: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
            friday: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
            saturday: ['Rest Day'],
            sunday: ['Rest Day'],
        },
    },
    {
        name: '5-Day Split',
        layout: {
            monday: ['Chest'],
            tuesday: ['Back'],
            wednesday: ['Shoulders'],
            thursday: ['Biceps', 'Triceps'],
            friday: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
            saturday: ['Rest Day'],
            sunday: ['Rest Day'],
        },
    },
    {
        name: 'Chest/Back Focus',
        layout: {
            monday: ['Chest', 'Triceps'],
            tuesday: ['Back', 'Biceps'],
            wednesday: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
            thursday: ['Chest', 'Shoulders'],
            friday: ['Back', 'Biceps', 'Triceps'],
            saturday: ['Rest Day'],
            sunday: ['Rest Day'],
        },
    },
    {
        name: 'Hybrid Athlete',
        layout: {
            monday: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
            tuesday: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
            wednesday: ['Cardio'],
            thursday: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'],
            friday: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
            saturday: ['Cardio'],
            sunday: ['Rest Day'],
        },
    },
]

export function getDayName(dayIndex: number): keyof WorkoutSplit {
    const days: (keyof WorkoutSplit)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    return days[dayIndex]
}

export function getTodaySplit(split: WorkoutSplit): string[] {
    const dayIndex = new Date().getDay()
    // getDay returns 0=Sunday, we need Monday=0
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1
    const dayName = getDayName(adjustedIndex)
    return split[dayName]
}

export function formatSplitDay(parts: string[]): string {
    if (parts.length === 0) return 'Rest Day'
    if (parts.includes('Rest Day')) return 'Rest Day'
    return parts.join(' + ')
}
