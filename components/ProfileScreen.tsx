import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutData } from './WorkoutDataContext';

export default function ProfileScreen() {
  const { workoutStats, globalStats, workoutHistory, allWorkouts, refreshStats, refreshGlobalStats, refreshAllWorkouts, isFirebaseReady, syncToFirebase, updateWorkoutName } = useWorkoutData();
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showAllWorkouts, setShowAllWorkouts] = useState(false);

  // Load global stats and workouts when Firebase becomes ready
  useEffect(() => {
    if (isFirebaseReady) {
      console.log('🔄 ProfileScreen: Firebase ready, loading data...');
      refreshGlobalStats();
      refreshStats(); // Load personal workouts
      refreshAllWorkouts(); // Load all workouts from all users
    }
  }, [isFirebaseReady]);

  // Debug log to see workout data
  useEffect(() => {
    console.log('📊 ProfileScreen workoutHistory:', workoutHistory.length, 'workouts');
    console.log('📊 ProfileScreen allWorkouts:', allWorkouts.length, 'workouts');
  }, [workoutHistory, allWorkouts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshStats();
    await refreshGlobalStats();
    await refreshAllWorkouts();
    setRefreshing(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    await syncToFirebase();
    await refreshStats();
    setSyncing(false);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleEditWorkoutName = (workoutId: string, currentName?: string) => {
    Alert.prompt(
      'Rename Workout',
      'Enter a new name for this workout:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Save',
          onPress: async (newName?: string) => {
            if (newName && newName.trim()) {
              try {
                await updateWorkoutName(workoutId, newName.trim());
                Alert.alert('Success', 'Workout name updated!');
              } catch (error) {
                Alert.alert('Error', 'Failed to update workout name');
              }
            }
          },
        },
      ],
      'plain-text',
      currentName || ''
    );
  };

  const getDefaultWorkoutName = (date: number) => {
    const workoutDate = new Date(date);
    return `Workout ${workoutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* User Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>
        <Text style={styles.userName}>HaloFit User</Text>
        <View style={styles.firebaseStatus}>
          <Ionicons 
            name={isFirebaseReady ? "cloud-done" : "cloud-offline"} 
            size={16} 
            color={isFirebaseReady ? "#4CAF50" : "#999"} 
          />
          <Text style={[styles.firebaseStatusText, { color: isFirebaseReady ? "#4CAF50" : "#999" }]}>
            {isFirebaseReady ? "Synced to Cloud" : "Offline Mode"}
          </Text>
        </View>
      </View>

      {/* Global Community Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart-outline" size={24} color="#4CAF50" />
          <Text style={styles.sectionTitle}>Total Lifetime Statistics</Text>
        </View>
        
        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Ionicons name="barbell-outline" size={32} color="#4CAF50" style={{ marginBottom: 8 }} />
            <Text style={styles.statNumber}>{globalStats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Total Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons name="time-outline" size={32} color="#2196F3" style={{ marginBottom: 8 }} />
            <Text style={styles.statNumber}>
              {formatDuration(globalStats.totalDuration)}
            </Text>
            <Text style={styles.statLabel}>Total Duration</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Ionicons name="flame-outline" size={32} color="#FF5722" style={{ marginBottom: 8 }} />
            <Text style={styles.statNumber}>{Math.round(globalStats.totalCalories).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Calories</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons name="heart-outline" size={32} color="#E91E63" style={{ marginBottom: 8 }} />
            <Text style={styles.statNumber}>{Math.round(globalStats.avgHeartRate)}</Text>
            <Text style={styles.statLabel}>Avg Heart Rate</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Ionicons name="footsteps-outline" size={32} color="#9C27B0" style={{ marginBottom: 8 }} />
            <Text style={styles.statNumber}>{Math.round(globalStats.totalSteps).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Steps</Text>
          </View>
        </View>

        {/* Refresh Button for Global Stats */}
        <TouchableOpacity 
          style={styles.refreshGlobalButton}
          onPress={refreshGlobalStats}
          disabled={!isFirebaseReady}
        >
          <Ionicons name="refresh-outline" size={18} color={isFirebaseReady ? "#4CAF50" : "#999"} />
          <Text style={[styles.refreshGlobalText, { color: isFirebaseReady ? "#4CAF50" : "#999" }]}>
            Refresh Global Stats
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sync Button */}
      {isFirebaseReady && (
        <TouchableOpacity 
          style={styles.syncButton}
          onPress={handleSync}
          disabled={syncing}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
          <Text style={styles.syncButtonText}>
            {syncing ? 'Syncing...' : 'Sync to Cloud'}
          </Text>
        </TouchableOpacity>
      )}

      {/* All Workouts List */}
      {allWorkouts.length > 0 && (
        <View style={styles.allWorkoutsSection}>
          <View style={styles.allWorkoutsHeader}>
            <Text style={styles.allWorkoutsTitle}>All Workouts</Text>
            <Text style={styles.workoutCount}>({allWorkouts.length} total)</Text>
          </View>
          {(showAllWorkouts ? allWorkouts : allWorkouts.slice(0, 5)).map((workout, index) => (
            <View key={workout.id} style={styles.workoutItem}>
              <View style={styles.workoutLeft}>
                <TouchableOpacity 
                  style={styles.workoutIcon}
                  onPress={() => handleEditWorkoutName(workout.id, workout.name)}
                >
                  <Ionicons name="create-outline" size={24} color="#4CAF50" />
                </TouchableOpacity>
                <View style={styles.workoutContent}>
                  <Text style={styles.workoutName}>
                    {workout.name || getDefaultWorkoutName(workout.endTime)}
                  </Text>
                  <Text style={styles.workoutDetails}>
                    {workout.duration > 0 ? formatDuration(workout.duration) : 'N/A'} • {Math.round(workout.finalCalories)} cal • {Math.round(workout.finalStepCount)} steps
                  </Text>
                </View>
              </View>
              <View style={styles.workoutRight}>
                <Text style={styles.workoutDate}>
                  {formatDate(workout.endTime)}
                </Text>
              </View>
            </View>
          ))}
          
          {/* View All / Show Less Button */}
          {allWorkouts.length > 5 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => setShowAllWorkouts(!showAllWorkouts)}
            >
              <Text style={styles.viewAllText}>
                {showAllWorkouts ? 'Show Less' : `View All (${allWorkouts.length - 5} more)`}
              </Text>
              <Ionicons 
                name={showAllWorkouts ? "chevron-up" : "chevron-down"} 
                size={18} 
                color="#4CAF50" 
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Additional Profile Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        {/* Add your existing profile settings here */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  firebaseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  firebaseStatusText: {
    fontSize: 14,
    marginLeft: 5,
    fontWeight: '500',
  },
  statsSection: {
    margin: 15,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    margin: 15,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    margin: 15,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    marginLeft: 32,
  },
  refreshGlobalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: '#f0f9f0',
  },
  refreshGlobalText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  allWorkoutsSection: {
    margin: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  allWorkoutsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  allWorkoutsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  workoutCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  workoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  workoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workoutIcon: {
    marginRight: 12,
  },
  workoutContent: {
    flex: 1,
  },
  workoutRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  workoutName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
    textAlign: 'right',
  },
  workoutDetails: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  viewAllText: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '600',
    marginRight: 6,
  },
});