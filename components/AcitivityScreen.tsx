// ActivityScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useWorkoutData } from './WorkoutDataContext';

export default function ActivityScreen() {
  const { workoutStats, refreshStats } = useWorkoutData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshStats();
    setRefreshing(false);
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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity Dashboard</Text>
      </View>

      {/* Last Workout Summary */}
      {workoutStats.lastWorkout && (
        <View style={styles.lastWorkoutCard}>
          <Text style={styles.cardTitle}>Last Workout</Text>
          <Text style={styles.lastWorkoutDate}>
            {formatDate(workoutStats.lastWorkout.endTime)}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatDuration(workoutStats.lastWorkout.duration)}
              </Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {workoutStats.lastWorkout.finalCalories}
              </Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {workoutStats.lastWorkout.finalStepCount}
              </Text>
              <Text style={styles.statLabel}>Steps</Text>
            </View>
          </View>
        </View>
      )}

      {/* Overall Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{workoutStats.totalWorkouts}</Text>
          <Text style={styles.statCardLabel}>Total Workouts</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>
            {formatDuration(workoutStats.totalDuration)}
          </Text>
          <Text style={styles.statCardLabel}>Total Duration</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>
            {workoutStats.totalCalories}
          </Text>
          <Text style={styles.statCardLabel}>Total Calories</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>
            {workoutStats.avgHeartRate}
          </Text>
          <Text style={styles.statCardLabel}>Avg Heart Rate</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>
            {workoutStats.totalSteps.toLocaleString()}
          </Text>
          <Text style={styles.statCardLabel}>Total Steps</Text>
        </View>
      </View>

      {workoutStats.totalWorkouts === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No workouts yet!</Text>
          <Text style={styles.emptyStateSubtext}>
            Start your first workout to see your stats here
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  lastWorkoutCard: {
    margin: 15,
    padding: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 5,
  },
  lastWorkoutDate: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: '47%',
    margin: '1.5%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statCardLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});