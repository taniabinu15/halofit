// ActivityScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useWorkoutData } from './WorkoutDataContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import WeeklyActivityChart from './WeeklyActivityChart';
import ActivityRings from './ActivityRings';
import HeartRateZonesChart from './HeartRateZonesChart';

export default function ActivityScreen() {
  const { workoutStats, workoutHistory, weeklyWorkouts, refreshStats, refreshWeeklyWorkouts, updateWorkoutName, isFirebaseReady } = useWorkoutData();
  const [refreshing, setRefreshing] = useState(false);
  const [showAllWorkouts, setShowAllWorkouts] = useState(false);
  const router = useRouter();

  // Load weekly workouts when component mounts and Firebase is ready
  useEffect(() => {
    if (isFirebaseReady) {
      console.log('📅 ActivityScreen: Loading weekly workouts...');
      refreshWeeklyWorkouts();
    }
  }, [isFirebaseReady]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshStats();
    await refreshWeeklyWorkouts();
    setRefreshing(false);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    // Show seconds if less than a minute
    return `${secs}s`;
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

  // Calculate this week's stats from all users
  const getWeeklyStats = () => {
    const weeklyDuration = weeklyWorkouts.reduce((sum, w) => sum + w.duration, 0);
    const weeklyCalories = weeklyWorkouts.reduce((sum, w) => sum + w.finalCalories, 0);
    const weeklySteps = weeklyWorkouts.reduce((sum, w) => sum + w.finalStepCount, 0);

    return {
      count: weeklyWorkouts.length,
      duration: weeklyDuration,
      calories: weeklyCalories,
      steps: weeklySteps,
    };
  };

  const weeklyStats = getWeeklyStats();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity Dashboard</Text>
        <Text style={styles.headerSubtitle}>Track your fitness journey</Text>
      </View>

      {/* Activity Rings - Today's Progress */}
      <View style={styles.ringsCard}>
        <Text style={styles.sectionTitle}>Today's Activity</Text>
        <ActivityRings
          calories={weeklyStats.calories}
          caloriesGoal={500}
          duration={weeklyStats.duration / 60}
          durationGoal={30}
          steps={weeklyStats.steps}
          stepsGoal={10000}
        />
      </View>

      {/* Weekly Activity Charts - Using data from ALL users */}
      <WeeklyActivityChart 
        workoutHistory={weeklyWorkouts}
        metricType="duration"
        title="Exercise"
        color="#4CAF50"
        unit="min"
      />
      
      <WeeklyActivityChart 
        workoutHistory={weeklyWorkouts}
        metricType="calories"
        title="Active Calories"
        color="#FF5722"
        unit="cal"
      />

      <WeeklyActivityChart 
        workoutHistory={weeklyWorkouts}
        metricType="steps"
        title="Steps"
        color="#2196F3"
      />

      {/* Heart Rate Zones */}
      {workoutHistory.length > 0 && (
        <HeartRateZonesChart workoutHistory={workoutHistory} />
      )}

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
                {Math.round(workoutStats.lastWorkout.finalCalories)}
              </Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.round(workoutStats.lastWorkout.finalStepCount)}
              </Text>
              <Text style={styles.statLabel}>Steps</Text>
            </View>
          </View>
        </View>
      )}

      {/* This Week's Stats Header */}
      <View style={styles.weeklyStatsHeader}>
        <Text style={styles.weeklyStatsTitle}>This Week's Stats</Text>
      </View>

      {/* Overall Stats Grid - Using weekly data from ALL users */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="barbell-outline" size={28} color="#4CAF50" style={{ marginBottom: 8 }} />
          <Text style={styles.statCardValue}>{weeklyStats.count}</Text>
          <Text style={styles.statCardLabel}>Workouts</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={28} color="#2196F3" style={{ marginBottom: 8 }} />
          <Text style={styles.statCardValue}>
            {formatDuration(weeklyStats.duration)}
          </Text>
          <Text style={styles.statCardLabel}>Total Duration</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="flame-outline" size={28} color="#FF5722" style={{ marginBottom: 8 }} />
          <Text style={styles.statCardValue}>
            {Math.round(weeklyStats.calories)}
          </Text>
          <Text style={styles.statCardLabel}>Active Calories</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="footsteps-outline" size={28} color="#9C27B0" style={{ marginBottom: 8 }} />
          <Text style={styles.statCardValue}>
            {Math.round(weeklyStats.steps).toLocaleString()}
          </Text>
          <Text style={styles.statCardLabel}>Steps</Text>
        </View>
      </View>

      {/* Recent Workouts Preview - Using weekly data from ALL users */}
      {weeklyWorkouts.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Workouts</Text>
            <Text style={styles.workoutCount}>({weeklyWorkouts.length} this week)</Text>
          </View>
          {(showAllWorkouts ? weeklyWorkouts : weeklyWorkouts.slice(0, 5)).map((workout, index) => (
            <View key={workout.id} style={styles.recentWorkoutItem}>
              <View style={styles.recentWorkoutLeft}>
                <TouchableOpacity 
                  style={styles.recentWorkoutIcon}
                  onPress={() => handleEditWorkoutName(workout.id, workout.name)}
                >
                  <Ionicons name="create-outline" size={24} color="#4CAF50" />
                </TouchableOpacity>
                <View style={styles.recentWorkoutContent}>
                  <Text style={styles.recentWorkoutName}>
                    {workout.name || getDefaultWorkoutName(workout.endTime)}
                  </Text>
                  <Text style={styles.recentWorkoutDetails}>
                    {workout.duration > 0 ? formatDuration(workout.duration) : 'N/A'} • {Math.round(workout.finalCalories)} cal • {Math.round(workout.finalStepCount)} steps
                  </Text>
                </View>
              </View>
              <View style={styles.recentWorkoutRight}>
                <Text style={styles.recentWorkoutDate}>
                  {formatDate(workout.endTime)}
                </Text>
              </View>
            </View>
          ))}
          
          {/* View All / Show Less Button */}
          {weeklyWorkouts.length > 5 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => setShowAllWorkouts(!showAllWorkouts)}
            >
              <Text style={styles.viewAllText}>
                {showAllWorkouts ? 'Show Less' : `View All (${weeklyWorkouts.length - 5} more)`}
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
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  ringsCard: {
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
    marginBottom: 10,
    textAlign: 'center',
  },
  weeklyCard: {
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
  weeklyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  weeklyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  weeklyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weeklyStatItem: {
    alignItems: 'center',
  },
  weeklyStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  weeklyStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
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
  recentSection: {
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
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  recentWorkoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentWorkoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentWorkoutIcon: {
    marginRight: 12,
  },
  recentWorkoutContent: {
    flex: 1,
  },
  recentWorkoutRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  recentWorkoutName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recentWorkoutDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
    textAlign: 'right',
  },
  recentWorkoutDetails: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
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
  weeklyStatsHeader: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 15,
    backgroundColor: '#f8f9fa',
  },
  weeklyStatsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  workoutCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
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