// RecordScreen.tsx - REWRITTEN FOR SIMPLICITY
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { HaloFitBLEManager, BLEData } from './HaloFitBLE';
import { useWorkoutData, WorkoutSession } from './WorkoutDataContext';
import { HaloFitColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function RecordScreen() {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [currentBleData, setCurrentBleData] = useState<BLEData | null>(null);
  const [workoutData, setWorkoutData] = useState<BLEData[]>([]);
  const [workoutStartTime, setWorkoutStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  
  const bleManager = useRef(new HaloFitBLEManager());
  const timerInterval = useRef<number | null>(null);
  const isWorkoutActiveRef = useRef(false); // Track workout state for BLE callback
  const baselineSteps = useRef<number>(0); // Store baseline steps at workout start
  const baselineCalories = useRef<number>(0); // Store baseline calories at workout start
  const { saveWorkout, isFirebaseReady } = useWorkoutData();

  // Setup BLE callbacks once
  useEffect(() => {
    console.log('🎬 RecordScreen mounted');
    console.log(`🔥 Firebase Ready: ${isFirebaseReady}`);

    bleManager.current.setOnDataReceived((data) => {
      console.log('📊 Data received in RecordScreen:', data);
      // Only update if we have non-zero values
      if (data.heartRate > 0 || data.calories > 0 || data.stepCount > 0) {
        // Adjust data relative to baseline if workout is active
        const adjustedData = {
          ...data,
          stepCount: data.stepCount - baselineSteps.current,
          calories: data.calories - baselineCalories.current,
        };
        
        setCurrentBleData(adjustedData);
        // Use ref to get current workout state (avoids stale closure)
        if (isWorkoutActiveRef.current) {
          console.log('✅ Adding data point to workout (adjusted):', adjustedData);
          setWorkoutData(prev => [...prev, adjustedData]);
        } else {
          console.log('⏸️ Workout not active, skipping data save');
        }
      }
    });

    bleManager.current.setOnConnectionChange((connected) => {
      console.log('🔌 Connection changed:', connected);
      setIsConnected(connected);
      setIsPairing(false);

      if (connected) {
        Alert.alert('✅ Connected!', 'HaloFit Headband is ready to track your workout.');
      }
    });

    return () => {
      console.log('🛑 RecordScreen unmounting');
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      bleManager.current.destroy();
    };
  }, []);

  // Monitor connection during workout
  useEffect(() => {
    if (isWorkoutActive && !isConnected) {
      Alert.alert(
        '⚠️ Connection Lost',
        'Lost connection to HaloFit Headband during workout.',
        [
          { text: 'Stop Workout', onPress: handleStopWorkout, style: 'destructive' },
          { text: 'Reconnect', onPress: handlePairDevice }
        ]
      );
    }
  }, [isConnected, isWorkoutActive]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePairDevice = async () => {
    console.log('🔵 Pair button pressed');
    setIsPairing(true);

    const success = await bleManager.current.connect();
    
    if (!success) {
      setIsPairing(false);
      Alert.alert('❌ Connection Failed', 'Could not connect to HaloFit Headband. Please ensure it is powered on and in range.');
    }
    // If successful, the onConnectionChange callback will handle UI updates
  };

  const handleStartWorkout = () => {
    if (!isConnected) {
      Alert.alert('❌ Not Connected', 'Please pair with HaloFit Headband first.');
      return;
    }

    console.log('▶️ Starting workout');
    
    // Capture baseline values from current BLE data
    if (currentBleData) {
      baselineSteps.current = currentBleData.stepCount;
      baselineCalories.current = currentBleData.calories;
      console.log('📍 Baseline set - Steps:', baselineSteps.current, 'Calories:', baselineCalories.current);
    } else {
      baselineSteps.current = 0;
      baselineCalories.current = 0;
      console.log('📍 No baseline data available, starting from 0');
    }
    
    setIsWorkoutActive(true);
    isWorkoutActiveRef.current = true; // Update ref for BLE callback
    setWorkoutData([]);
    setElapsedTime(0);

    const startTime = Date.now();
    setWorkoutStartTime(startTime);

    timerInterval.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000) as any;

    Alert.alert('▶️ Workout Started', 'Tracking your activity now!');
  };

  const handleStopWorkout = async () => {
    console.log('⏹️ Stopping workout');
    console.log(`🔥 Firebase status before save: ${isFirebaseReady ? 'READY' : 'NOT READY'}`);
    console.log(`📊 Workout data points collected: ${workoutData.length}`);
    console.log(`💓 Current BLE data:`, currentBleData);
    console.log(`⏱️ Elapsed time: ${elapsedTime} seconds`);
    
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }

    const endTime = Date.now();
    const duration = elapsedTime;

    if (workoutData.length > 0 && currentBleData) {
      const heartRates = workoutData.filter(d => d.heartRate > 0).map(d => d.heartRate);
      const avgHeartRate = heartRates.length > 0
        ? Math.round(heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length)
        : 0;

      const workoutSession: WorkoutSession = {
        id: `workout_${endTime}`,
        startTime: workoutStartTime,
        endTime: endTime,
        duration: duration,
        dataPoints: workoutData,
        finalHeartRate: currentBleData.heartRate,
        finalCalories: currentBleData.calories,
        finalStepCount: currentBleData.stepCount,
        avgHeartRate: avgHeartRate,
      };

      console.log('💾 Calling saveWorkout...');
      await saveWorkout(workoutSession);
      console.log('✅ saveWorkout completed');
      
      const firebaseStatus = isFirebaseReady ? '🔥 Synced to cloud' : '📱 Saved locally only';
      
      Alert.alert(
        '✅ Workout Complete!',
        `Duration: ${formatTime(duration)}\n` +
        `Calories: ${currentBleData.calories} kcal\n` +
        `Steps: ${currentBleData.stepCount}\n` +
        `Avg HR: ${avgHeartRate} bpm\n\n` +
        firebaseStatus
      );
    } else {
      console.log('❌ No workout data to save!');
      console.log(`   - workoutData.length: ${workoutData.length}`);
      console.log(`   - currentBleData:`, currentBleData);
      Alert.alert('⏹️ Workout Ended', 'No data was collected.');
    }

    setIsWorkoutActive(false);
    isWorkoutActiveRef.current = false; // Update ref for BLE callback
    setWorkoutData([]);
    setElapsedTime(0);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Session</Text>
        <Text style={styles.subtitle}>Track your fitness journey</Text>
      </View>

      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <View style={styles.statusHeader}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isPairing ? '#FFA726' : (isConnected ? '#4CAF50' : '#FF5252') }
          ]} />
          <Text style={styles.statusLabel}>Device Status</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: isPairing ? HaloFitColors.accentCoral : (isConnected ? HaloFitColors.primary : HaloFitColors.gray) }
        ]}>
          <View style={styles.statusIndicator} />
          <Text style={styles.statusText}>
            {isPairing ? 'Searching...' : (isConnected ? 'Connected' : 'Disconnected')}
          </Text>
        </View>
      </View>

      {/* Pair Button */}
      {!isConnected && (
        <TouchableOpacity 
          style={[styles.primaryButton, isPairing && styles.disabledButton]}
          onPress={handlePairDevice}
          disabled={isPairing}
        >
          <Ionicons name="bluetooth" size={22} color={HaloFitColors.white} />
          <Text style={styles.primaryButtonText}>
            {isPairing ? 'Searching for Device...' : 'Pair HaloFit Headband'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Workout Controls */}
      {isConnected && !isWorkoutActive && (
        <TouchableOpacity 
          style={styles.startButton}
          onPress={handleStartWorkout}
        >
          <Ionicons name="play-circle" size={26} color={HaloFitColors.white} />
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      )}

      {isWorkoutActive && (
        <>
          {/* Timer */}
          <View style={styles.timerContainer}>
            <Ionicons name="time" size={32} color={HaloFitColors.primary} style={{ marginBottom: 10 }} />
            <Text style={styles.timerLabel}>Duration</Text>
            <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
          </View>

          {/* Live Data */}
          {currentBleData && (
            <View style={styles.dataContainer}>
              <Text style={styles.dataTitle}>Live Data</Text>
              
              <View style={styles.dataGrid}>
                <View style={styles.dataCard}>
                  <Ionicons name="heart" size={32} color={HaloFitColors.primary} />
                  <Text style={styles.dataValue}>{currentBleData.heartRate}</Text>
                  <Text style={styles.dataLabel}>Heart Rate</Text>
                  <Text style={styles.dataUnit}>bpm</Text>
                </View>
                
                <View style={styles.dataCard}>
                  <Ionicons name="flame" size={32} color={HaloFitColors.accentCoral} />
                  <Text style={styles.dataValue}>{Math.round(currentBleData.calories)}</Text>
                  <Text style={styles.dataLabel}>Calories</Text>
                  <Text style={styles.dataUnit}>kcal</Text>
                </View>
              </View>

              <View style={styles.dataGrid}>
                <View style={styles.dataCard}>
                  <Ionicons name="footsteps" size={32} color={HaloFitColors.accentPurple} />
                  <Text style={styles.dataValue}>{currentBleData.stepCount}</Text>
                  <Text style={styles.dataLabel}>Steps</Text>
                  <Text style={styles.dataUnit}>count</Text>
                </View>
                
                <View style={styles.dataCard}>
                  <Ionicons name="analytics" size={32} color={HaloFitColors.primaryLight} />
                  <Text style={styles.dataValue}>{workoutData.length}</Text>
                  <Text style={styles.dataLabel}>Data Points</Text>
                  <Text style={styles.dataUnit}>recorded</Text>
                </View>
              </View>
            </View>
          )}

          {/* Stop Button */}
          <TouchableOpacity 
            style={styles.stopButton}
            onPress={handleStopWorkout}
          >
            <Ionicons name="stop-circle" size={26} color={HaloFitColors.white} />
            <Text style={styles.stopButtonText}>Stop Workout</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Debug Info */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            Connected: {isConnected ? 'Yes' : 'No'} | 
            Workout: {isWorkoutActive ? 'Active' : 'Inactive'} | 
            Data Points: {workoutData.length}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: HaloFitColors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: HaloFitColors.primary,
    padding: 25,
    borderRadius: 25,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: HaloFitColors.white,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: HaloFitColors.white,
    opacity: 0.9,
    fontWeight: '500',
  },
  statusContainer: {
    padding: 20,
    backgroundColor: HaloFitColors.cardBackground,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: HaloFitColors.accentLight,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: HaloFitColors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: HaloFitColors.white,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: HaloFitColors.white,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HaloFitColors.primary,
    padding: 18,
    borderRadius: 25,
    marginBottom: 15,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    gap: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: HaloFitColors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HaloFitColors.primary,
    padding: 20,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    gap: 12,
  },
  startButtonText: {
    color: HaloFitColors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HaloFitColors.error,
    padding: 18,
    borderRadius: 25,
    marginTop: 20,
    shadowColor: HaloFitColors.error,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    gap: 10,
  },
  stopButtonText: {
    color: HaloFitColors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: HaloFitColors.cardBackground,
    borderRadius: 25,
    marginVertical: 20,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 3,
    borderColor: HaloFitColors.accent,
  },
  timerLabel: {
    fontSize: 18,
    color: HaloFitColors.textSecondary,
    marginBottom: 10,
    fontWeight: '600',
  },
  timerText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: HaloFitColors.primary,
  },
  dataContainer: {
    padding: 20,
    backgroundColor: HaloFitColors.cardBackground,
    borderRadius: 25,
    marginVertical: 15,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: HaloFitColors.accentLight,
  },
  dataTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: HaloFitColors.primary,
  },
  dataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  dataCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: HaloFitColors.accentLight,
    padding: 20,
    borderRadius: 20,
  },
  dataValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: HaloFitColors.primary,
    marginTop: 10,
    marginBottom: 5,
  },
  dataLabel: {
    fontSize: 14,
    color: HaloFitColors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 2,
  },
  dataUnit: {
    fontSize: 12,
    color: HaloFitColors.textLight,
    textAlign: 'center',
    fontWeight: '500',
  },
  debugContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: HaloFitColors.accentLight,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: HaloFitColors.accent,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: HaloFitColors.textPrimary,
  },
});
