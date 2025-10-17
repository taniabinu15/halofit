// RecordScreen.tsx
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
  const pairingTimeoutRef = useRef<any>(null);
  const { saveWorkout } = useWorkoutData();

  useEffect(() => {
    bleManager.current.setOnDataReceived((data) => {
      setCurrentBleData(data);
      if (isWorkoutActive) {
        setWorkoutData(prev => [...prev, data]);
      }
    });

    bleManager.current.setOnConnectionChange((connected) => {
      console.log('Connection state changed:', connected);
      
      // Clear pairing timeout if it exists
      if (pairingTimeoutRef.current) {
        clearTimeout(pairingTimeoutRef.current);
        pairingTimeoutRef.current = null;
      }
      
      setIsConnected(connected);
      setIsPairing(false); // Stop showing "Pairing..." when connection state changes
      
      if (connected) {
        Alert.alert('Connected ✅', 'HaloFit Headband successfully paired and ready!');
      } else if (isPairing) {
        // Only show failure alert if we were actively trying to pair
        Alert.alert('Connection Failed', 'Could not connect to HaloFit device. Please try again.');
      }
    });

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      if (pairingTimeoutRef.current) {
        clearTimeout(pairingTimeoutRef.current);
      }
      if (bleManager.current.isConnected()) {
        bleManager.current.disconnect();
      }
      bleManager.current.destroy();
    };
  }, [isWorkoutActive, isPairing]);

  // ⏱ Timer functions
  const startTimer = () => {
    const startTime = Date.now();
    setWorkoutStartTime(startTime);
    timerInterval.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 🔹 Step 1: Pair Device
  const handlePairDevice = async () => {
    try {
      setIsPairing(true);
      Alert.alert('Pairing', 'Searching for HaloFit Headband...');
      
      // Set a safety timeout in case the callback never fires
      pairingTimeoutRef.current = setTimeout(() => {
        if (isPairing && !isConnected) {
          console.warn('Pairing timeout reached');
          setIsPairing(false);
          Alert.alert('Timeout', 'Could not find HaloFit device. Please ensure it is powered on and in range.');
        }
      }, 20000); // 20 second safety timeout
      
      // Start the connection process
      const success = await bleManager.current.connect();

      if (!success) {
        if (pairingTimeoutRef.current) {
          clearTimeout(pairingTimeoutRef.current);
          pairingTimeoutRef.current = null;
        }
        Alert.alert('Connection Failed', 'Could not start device search. Please check Bluetooth permissions.');
        setIsPairing(false);
      }
      // Note: Don't set isPairing to false here - wait for connection callback
      // The connection callback will update isConnected state automatically
    } catch (error) {
      console.error('Pairing error:', error);
      if (pairingTimeoutRef.current) {
        clearTimeout(pairingTimeoutRef.current);
        pairingTimeoutRef.current = null;
      }
      Alert.alert('Error', 'Failed to pair device.');
      setIsPairing(false);
    }
  };

  // 🔹 Step 2: Start Workout
  const handleStartWorkout = async () => {
    try {
      if (!isConnected) {
        Alert.alert('Device Not Connected', 'Please pair your HaloFit Headband first.');
        return;
      }

      setIsWorkoutActive(true);
      setWorkoutData([]);
      setElapsedTime(0);
      startTimer();

      Alert.alert('Workout Started', 'Tracking data from HaloFit Headband.');
    } catch (error) {
      console.error('Failed to start workout:', error);
      Alert.alert('Error', 'Could not start workout.');
    }
  };

  // Monitor connection status during workout
  useEffect(() => {
    if (isWorkoutActive && !isConnected) {
      Alert.alert(
        'Connection Lost',
        'Lost connection to HaloFit device during workout. Workout will be saved with data collected so far.',
        [
          {
            text: 'Stop Workout',
            onPress: handleStopWorkout,
            style: 'destructive'
          },
          {
            text: 'Try Reconnecting',
            onPress: handlePairDevice
          }
        ]
      );
    }
  }, [isConnected, isWorkoutActive]);

  // 🔹 Step 3: Stop Workout
  const handleStopWorkout = async () => {
    try {
      stopTimer();
      await bleManager.current.disconnect();

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
          'Workout Completed!',
          `Duration: ${formatTime(duration)}\n` +
          `Calories: ${currentBleData.calories} kcal\n` +
          `Steps: ${currentBleData.stepCount}\n` +
          `Avg HR: ${avgHeartRate} bpm`
        );
      } else {
        Alert.alert('Workout Ended', 'No data collected during workout.');
      }

      setIsWorkoutActive(false);
      setWorkoutData([]);
      setElapsedTime(0);
      setCurrentBleData(null);
    } catch (error) {
      console.error('Failed to stop workout:', error);
      Alert.alert('Error', 'Failed to stop workout properly.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Session</Text>
      </View>

      {/* Bluetooth Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Bluetooth Status:</Text>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: isPairing ? '#FFA726' : (isConnected ? '#4CAF50' : '#FF5252') }
          ]}
        />
        <Text style={styles.statusText}>
          {isPairing ? 'Searching...' : (isConnected ? 'Connected' : 'Disconnected')}
        </Text>
      </View>

      {/* Pair Device Button */}
      <View style={styles.buttonContainer}>
        <Button
          title={isPairing ? 'Pairing...' : 'Pair Bluetooth Device'}
          onPress={handlePairDevice}
          color="#1976D2"
          disabled={isPairing}
        />
      </View>

      {/* Timer Display */}
      {isWorkoutActive && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Duration</Text>
          <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
        </View>
      )}

      {/* Live Data Display */}
      {isWorkoutActive && currentBleData && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataTitle}>Live Data</Text>
          <View style={styles.dataRow}>
            <View style={styles.dataItem}>
              <Text style={styles.dataValue}>{currentBleData.heartRate}</Text>
              <Text style={styles.dataLabel}>BPM</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataValue}>{currentBleData.calories}</Text>
              <Text style={styles.dataLabel}>Calories</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataValue}>{currentBleData.stepCount}</Text>
              <Text style={styles.dataLabel}>Steps</Text>
            </View>
          </View>
          <Text style={styles.dataCount}>
            Data Points Collected: {workoutData.length}
          </Text>
        </View>
      )}

      {/* Start/Stop Workout */}
      <View style={styles.buttonContainer}>
        {!isWorkoutActive ? (
          <Button
            title="Start Workout"
            onPress={handleStartWorkout}
            color="#4CAF50"
            disabled={!isConnected}
          />
        ) : (
          <Button
            title="Stop Workout"
            onPress={handleStopWorkout}
            color="#FF5252"
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
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
    fontWeight: '600',
  },
  timerContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1976D2',
    borderRadius: 15,
    marginBottom: 20,
  },
  timerLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 5,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  dataContainer: {
    padding: 20,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    marginBottom: 20,
  },
  dataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  dataItem: {
    alignItems: 'center',
  },
  dataValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  dataLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  dataCount: {
    fontSize: 14,
    color: '#1976D2',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
  buttonContainer: {
    marginVertical: 15,
  },
});
