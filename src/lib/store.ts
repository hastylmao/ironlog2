// ============================================================
// IronLog — Zustand Global Store
// ============================================================
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, DailyLog, FoodLog, WorkoutLog, WorkoutExercise, ActivityItem } from '@/types'

interface AppState {
    // Auth
    user: UserProfile | null
    isLoading: boolean
    isOnboarded: boolean

    // Daily tracking
    todayLog: DailyLog | null
    foodLogs: FoodLog[]
    workoutLogs: WorkoutLog[]
    workoutExercises: WorkoutExercise[]
    waterMl: number

    // Activity feed
    activityFeed: ActivityItem[]

    // UI state
    activeTab: string
    showFoodModal: boolean
    showWaterModal: boolean
    showWorkoutModal: boolean
    showPhotoModal: boolean

    // Actions
    setUser: (user: UserProfile | null) => void
    setLoading: (loading: boolean) => void
    setOnboarded: (onboarded: boolean) => void
    setTodayLog: (log: DailyLog | null) => void
    setFoodLogs: (logs: FoodLog[]) => void
    addFoodLog: (log: FoodLog) => void
    setWorkoutLogs: (logs: WorkoutLog[]) => void
    addWorkoutLog: (log: WorkoutLog) => void
    setWorkoutExercises: (exercises: WorkoutExercise[]) => void
    setWaterMl: (ml: number) => void
    addWater: (ml: number) => void
    setActivityFeed: (feed: ActivityItem[]) => void
    addActivity: (item: ActivityItem) => void
    setActiveTab: (tab: string) => void
    setShowFoodModal: (show: boolean) => void
    setShowWaterModal: (show: boolean) => void
    setShowWorkoutModal: (show: boolean) => void
    setShowPhotoModal: (show: boolean) => void
    reset: () => void
}

const initialState = {
    user: null,
    isLoading: true,
    isOnboarded: false,
    todayLog: null,
    foodLogs: [],
    workoutLogs: [],
    workoutExercises: [],
    waterMl: 0,
    activityFeed: [],
    activeTab: 'home',
    showFoodModal: false,
    showWaterModal: false,
    showWorkoutModal: false,
    showPhotoModal: false,
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            ...initialState,

            setUser: (user) => set({ user }),
            setLoading: (isLoading) => set({ isLoading }),
            setOnboarded: (isOnboarded) => set({ isOnboarded }),
            setTodayLog: (todayLog) => set({ todayLog }),
            setFoodLogs: (foodLogs) => set({ foodLogs }),
            addFoodLog: (log) => set((state) => ({ foodLogs: [...state.foodLogs, log] })),
            setWorkoutLogs: (workoutLogs) => set({ workoutLogs }),
            addWorkoutLog: (log) => set((state) => ({ workoutLogs: [...state.workoutLogs, log] })),
            setWorkoutExercises: (workoutExercises) => set({ workoutExercises }),
            setWaterMl: (waterMl) => set({ waterMl }),
            addWater: (ml) => set((state) => ({ waterMl: state.waterMl + ml })),
            setActivityFeed: (activityFeed) => set({ activityFeed }),
            addActivity: (item) => set((state) => ({
                activityFeed: [item, ...state.activityFeed],
            })),
            setActiveTab: (activeTab) => set({ activeTab }),
            setShowFoodModal: (showFoodModal) => set({ showFoodModal }),
            setShowWaterModal: (showWaterModal) => set({ showWaterModal }),
            setShowWorkoutModal: (showWorkoutModal) => set({ showWorkoutModal }),
            setShowPhotoModal: (showPhotoModal) => set({ showPhotoModal }),
            reset: () => set(initialState),
        }),
        {
            name: 'ironlog-store',
            partialize: (state) => ({
                activeTab: state.activeTab,
                isOnboarded: state.isOnboarded,
            }),
        }
    )
)
