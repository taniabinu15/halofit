// components/WorkoutDataContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BLEData } from './HaloFitBLE';
import { initFirebaseAuth, saveWorkoutToFirebase, syncLocalWorkoutsToFirebase, fetchWorkoutsFromFirebase, updateWorkoutNameInFirebase, fetchGlobalStatsFromFirebase, fetchWeeklyWorkoutsFromAllUsers, fetchAllWorkoutsFromAllUsers } from '../services/firebaseService';

export interface WorkoutSession {
  id: string;
  name?: string;              // Optional workout name
  startTime: number;
  endTime: number;
  duration: number; // in seconds
  dataPoints: BLEData[];
  finalHeartRate: number;    // Last HR reading
  finalCalories: number;     // Final calories from device
  finalStepCount: number;    // Final step count from device
  avgHeartRate: number;      // Calculated average HR during session
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalDuration: number; // in seconds
  totalCalories: number;
  totalSteps: number;
  avgHeartRate: number;
  lastWorkout?: WorkoutSession;
}

interface WorkoutDataContextType {
  workoutStats: WorkoutStats;
  globalStats: WorkoutStats;
  workoutHistory: WorkoutSession[];
  weeklyWorkouts: WorkoutSession[];
  allWorkouts: WorkoutSession[];
  saveWorkout: (session: WorkoutSession) => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshGlobalStats: () => Promise<void>;
  refreshWeeklyWorkouts: () => Promise<void>;
  refreshAllWorkouts: () => Promise<void>;
  isFirebaseReady: boolean;
  syncToFirebase: () => Promise<void>;
  updateWorkoutName: (workoutId: string, newName: string) => Promise<void>;
}

const WorkoutDataContext = createContext<WorkoutDataContextType | undefined>(undefined);

const STORAGE_KEY = '@halofit_workouts';

export const WorkoutDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<WorkoutSession[]>([]);
  const [allWorkouts, setAllWorkouts] = useState<WorkoutSession[]>([]);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats>({
    totalWorkouts: 0,
    totalDuration: 0,
    totalCalories: 0,
    totalSteps: 0,
    avgHeartRate: 0,
  });
  const [globalStats, setGlobalStats] = useState<WorkoutStats>({
    totalWorkouts: 0,
    totalDuration: 0,
    totalCalories: 0,
    totalSteps: 0,
    avgHeartRate: 0,
  });
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  useEffect(() => {
    loadWorkouts();
    initializeFirebase();
  }, []);

  const initializeFirebase = async () => {
    try {
      const user = await initFirebaseAuth();
      if (user) {
        console.log('✅ Firebase initialized successfully');
        setIsFirebaseReady(true);
        // After Firebase is ready, fetch data from Firebase
        const firebaseWorkouts = await fetchWorkoutsFromFirebase();
        if (firebaseWorkouts.length > 0) {
          console.log(`✅ Loaded ${firebaseWorkouts.length} workouts from Firebase on init`);
          setWorkoutHistory(firebaseWorkouts);
          calculateStats(firebaseWorkouts);
          // Update local storage with Firebase data
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(firebaseWorkouts));
        }
        
        // Load global stats on initialization
        const stats = await fetchGlobalStatsFromFirebase();
        if (stats) {
          setGlobalStats(stats);
          console.log('✅ Global stats loaded on init');
        }
        
        // Load weekly workouts on initialization
        const weeklyData = await fetchWeeklyWorkoutsFromAllUsers();
        setWeeklyWorkouts(weeklyData);
        console.log(`✅ Weekly workouts loaded on init: ${weeklyData.length} workouts`);
      } else {
        console.warn('⚠️ Firebase initialization failed');
        setIsFirebaseReady(false);
      }
    } catch (error) {
      console.error('❌ Error initializing Firebase:', error);
      setIsFirebaseReady(false);
    }
  };

  const loadWorkouts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const workouts: WorkoutSession[] = JSON.parse(stored);
        setWorkoutHistory(workouts);
        calculateStats(workouts);
      }
    } catch (error) {
      console.error('Failed to load workouts:', error);
    }
  };

  const calculateStats = (workouts: WorkoutSession[]) => {
    if (workouts.length === 0) {
      setWorkoutStats({
        totalWorkouts: 0,
        totalDuration: 0,
        totalCalories: 0,
        totalSteps: 0,
        avgHeartRate: 0,
      });
      return;
    }

    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const totalCalories = workouts.reduce((sum, w) => sum + w.finalCalories, 0);
    const totalSteps = workouts.reduce((sum, w) => sum + w.finalStepCount, 0);
    
    // Calculate average heart rate across all workouts
    const avgHeartRate = workouts.length > 0
      ? Math.round(workouts.reduce((sum, w) => sum + w.avgHeartRate, 0) / workouts.length)
      : 0;

    setWorkoutStats({
      totalWorkouts: workouts.length,
      totalDuration,
      totalCalories,
      totalSteps,
      avgHeartRate,
      lastWorkout: workouts[workouts.length - 1],
    });
  };

  const saveWorkout = async (session: WorkoutSession) => {
    try {
      // Save locally first
      const updatedHistory = [...workoutHistory, session];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      setWorkoutHistory(updatedHistory);
      calculateStats(updatedHistory);
      console.log('✅ Workout saved locally');

      // Then save to Firebase
      if (isFirebaseReady) {
        const firebaseSuccess = await saveWorkoutToFirebase(session);
        if (firebaseSuccess) {
          console.log('✅ Workout synced to Firebase');
        } else {
          console.warn('⚠️ Firebase sync failed, data saved locally only');
        }
      } else {
        console.warn('⚠️ Firebase not ready, workout saved locally only');
      }
    } catch (error) {
      console.error('❌ Failed to save workout:', error);
      throw error;
    }
  };

  const syncToFirebase = async () => {
    if (!isFirebaseReady) {
      console.warn('⚠️ Firebase not ready for sync');
      return;
    }

    console.log('🔄 Starting Firebase sync...');
    const syncedCount = await syncLocalWorkoutsToFirebase(workoutHistory);
    console.log(`✅ Synced ${syncedCount} workouts to Firebase`);
  };

  const refreshStats = async () => {
    console.log('🔄 Refreshing workout data from Firebase...');
    if (isFirebaseReady) {
      // Fetch from Firebase
      const firebaseWorkouts = await fetchWorkoutsFromFirebase();
      if (firebaseWorkouts.length > 0) {
        console.log(`✅ Loaded ${firebaseWorkouts.length} workouts from Firebase`);
        setWorkoutHistory(firebaseWorkouts);
        calculateStats(firebaseWorkouts);
        // Also update local storage with Firebase data
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(firebaseWorkouts));
      } else {
        // Fallback to local storage if Firebase has no data
        console.log('⚠️ No Firebase data, loading from local storage');
        await loadWorkouts();
      }
    } else {
      // Firebase not ready, load from local storage
      console.log('⚠️ Firebase not ready, loading from local storage');
      await loadWorkouts();
    }
  };

  const updateWorkoutName = async (workoutId: string, newName: string) => {
    try {
      // Update locally
      const updatedHistory = workoutHistory.map(workout =>
        workout.id === workoutId ? { ...workout, name: newName } : workout
      );
      setWorkoutHistory(updatedHistory);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      console.log('✅ Workout name updated locally');

      // Update in Firebase
      if (isFirebaseReady) {
        const firebaseSuccess = await updateWorkoutNameInFirebase(workoutId, newName);
        if (firebaseSuccess) {
          console.log('✅ Workout name synced to Firebase');
        } else {
          console.warn('⚠️ Firebase sync failed for workout name');
        }
      }
    } catch (error) {
      console.error('❌ Failed to update workout name:', error);
      throw error;
    }
  };

  const refreshGlobalStats = async () => {
    if (!isFirebaseReady) {
      console.warn('⚠️ Firebase not ready, cannot fetch global stats');
      return;
    }

    console.log('🌍 Fetching global stats from all users...');
    const stats = await fetchGlobalStatsFromFirebase();
    if (stats) {
      setGlobalStats(stats);
      console.log('✅ Global stats updated');
    } else {
      console.warn('⚠️ Failed to fetch global stats');
    }
  };

  const refreshWeeklyWorkouts = async () => {
    if (!isFirebaseReady) {
      console.warn('⚠️ Firebase not ready, cannot fetch weekly workouts');
      return;
    }

    console.log('📅 Fetching weekly workouts from all users...');
    const workouts = await fetchWeeklyWorkoutsFromAllUsers();
    setWeeklyWorkouts(workouts);
    console.log(`✅ Weekly workouts updated: ${workouts.length} workouts`);
  };

  const refreshAllWorkouts = async () => {
    if (!isFirebaseReady) {
      console.warn('⚠️ Firebase not ready, cannot fetch all workouts');
      return;
    }

    console.log('📊 Fetching all workouts from all users...');
    const workouts = await fetchAllWorkoutsFromAllUsers();
    setAllWorkouts(workouts);
    console.log(`✅ All workouts updated: ${workouts.length} workouts`);
  };

  return (
    <WorkoutDataContext.Provider value={{ workoutStats, globalStats, workoutHistory, weeklyWorkouts, allWorkouts, saveWorkout, refreshStats, refreshGlobalStats, refreshWeeklyWorkouts, refreshAllWorkouts, isFirebaseReady, syncToFirebase, updateWorkoutName }}>
      {children}
    </WorkoutDataContext.Provider>
  );
};

export const useWorkoutData = () => {
  const context = useContext(WorkoutDataContext);
  if (!context) {
    throw new Error('useWorkoutData must be used within WorkoutDataProvider');
  }
  return context;
};