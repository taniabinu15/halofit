// components/WorkoutDataContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BLEData } from './HaloFitBLE';

export interface WorkoutSession {
  id: string;
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
  workoutHistory: WorkoutSession[];
  saveWorkout: (session: WorkoutSession) => Promise<void>;
  refreshStats: () => Promise<void>;
}

const WorkoutDataContext = createContext<WorkoutDataContextType | undefined>(undefined);

const STORAGE_KEY = '@halofit_workouts';

export const WorkoutDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats>({
    totalWorkouts: 0,
    totalDuration: 0,
    totalCalories: 0,
    totalSteps: 0,
    avgHeartRate: 0,
  });

  useEffect(() => {
    loadWorkouts();
  }, []);

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
      const updatedHistory = [...workoutHistory, session];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      setWorkoutHistory(updatedHistory);
      calculateStats(updatedHistory);
      console.log('Workout saved successfully');
    } catch (error) {
      console.error('Failed to save workout:', error);
      throw error;
    }
  };

  const refreshStats = async () => {
    await loadWorkouts();
  };

  return (
    <WorkoutDataContext.Provider value={{ workoutStats, workoutHistory, saveWorkout, refreshStats }}>
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