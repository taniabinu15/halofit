// RecordScreen.tsx - REWRITTEN FOR SIMPLICITY
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { HaloFitBLEManager, BLEData } from './HaloFitBLE';
import { useWorkoutData, WorkoutSession } from './WorkoutDataContext';

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
  const { saveWorkout } = useWorkoutData();

  // Setup BLE callbacks once
  useEffect(() => {
    console.log('🎬 RecordScreen mounted');

    bleManager.current.setOnDataReceived((data) => {
      console.log('📊 Data received in RecordScreen:', data);
      setCurrentBleData(data);
      if (isWorkoutActive) {
        setWorkoutData(prev => [...prev, data]);
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
    setIsWorkoutActive(true);
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

      await saveWorkout(workoutSession);
      
      Alert.alert(
        '✅ Workout Complete!',
        `Duration: ${formatTime(duration)}\n` +
        `Calories: ${currentBleData.calories} kcal\n` +
        `Steps: ${currentBleData.stepCount}\n` +
        `Avg HR: ${avgHeartRate} bpm`
      );
    } else {
      Alert.alert('⏹️ Workout Ended', 'No data was collected.');
    }

    setIsWorkoutActive(false);
    setWorkoutData([]);
    setElapsedTime(0);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏃‍♂️ Workout Session</Text>
      </View>

      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Device Status:</Text>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: isPairing ? '#FFA726' : (isConnected ? '#4CAF50' : '#FF5252') }
        ]} />
        <Text style={styles.statusText}>
          {isPairing ? '🔍 Searching...' : (isConnected ? '✅ Connected' : '❌ Disconnected')}
        </Text>
      </View>

      {/* Pair Button */}
      <View style={styles.buttonContainer}>
        <Button
          title={isPairing ? 'Searching for Device...' : '🔗 Pair HaloFit Headband'}
          onPress={handlePairDevice}
          disabled={isPairing || isConnected}
          color="#2196F3"
        />
      </View>

      {/* Workout Controls */}
      {isConnected && !isWorkoutActive && (
        <View style={styles.buttonContainer}>
          <Button
            title="▶️ Start Workout"
            onPress={handleStartWorkout}
            color="#4CAF50"
          />
        </View>
      )}

      {isWorkoutActive && (
        <>
          {/* Timer */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Duration</Text>
            <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
          </View>

          {/* Live Data */}
          {currentBleData && (
            <View style={styles.dataContainer}>
              <Text style={styles.dataTitle}>📊 Live Data</Text>
              
              <View style={styles.dataRow}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>{currentBleData.heartRate}</Text>
                  <Text style={styles.dataLabel}>❤️ Heart Rate (bpm)</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>{currentBleData.calories}</Text>
                  <Text style={styles.dataLabel}>🔥 Calories</Text>
                </View>
              </View>

              <View style={styles.dataRow}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>{currentBleData.stepCount}</Text>
                  <Text style={styles.dataLabel}>👟 Steps</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>{workoutData.length}</Text>
                  <Text style={styles.dataLabel}>📈 Data Points</Text>
                </View>
              </View>
            </View>
          )}

          {/* Stop Button */}
          <View style={styles.buttonContainer}>
            <Button
              title="⏹️ Stop Workout"
              onPress={handleStopWorkout}
              color="#F44336"
            />
          </View>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginVertical: 10,
  },
  timerContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 15,
    elevation: 2,
  },
  timerLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  dataContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 15,
    elevation: 2,
  },
  dataTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  dataItem: {
    alignItems: 'center',
    flex: 1,
  },
  dataValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  dataLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#ffe082',
    borderRadius: 5,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
