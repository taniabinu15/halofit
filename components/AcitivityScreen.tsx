// ActivityScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useWorkoutData } from './WorkoutDataContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import WeeklyActivityChart from './WeeklyActivityChart';
import ActivityRings from './ActivityRings';
import HeartRateZonesChart from './HeartRateZonesChart';
import { HaloFitColors } from '@/constants/Colors';

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
        color={HaloFitColors.accent}
        unit="min"
      />
      
      <WeeklyActivityChart 
        workoutHistory={weeklyWorkouts}
        metricType="calories"
        title="Active Calories"
        color={HaloFitColors.accent}
        unit="cal"
      />

      <WeeklyActivityChart 
        workoutHistory={weeklyWorkouts}
        metricType="steps"
        title="Steps"
        color={HaloFitColors.accent}
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
          <Ionicons name="barbell-outline" size={28} color={HaloFitColors.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.statCardValue}>{weeklyStats.count}</Text>
          <Text style={styles.statCardLabel}>Workouts</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={28} color={HaloFitColors.primaryLight} style={{ marginBottom: 8 }} />
          <Text style={styles.statCardValue}>
            {formatDuration(weeklyStats.duration)}
          </Text>
          <Text style={styles.statCardLabel}>Total Duration</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="flame-outline" size={28} color={HaloFitColors.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.statCardValue}>
            {Math.round(weeklyStats.calories)}
          </Text>
          <Text style={styles.statCardLabel}>Active Calories</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="footsteps-outline" size={28} color={HaloFitColors.accent} style={{ marginBottom: 8 }} />
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
            <View key={`${workout.id}_${index}`} style={styles.recentWorkoutItem}>
              <View style={styles.recentWorkoutLeft}>
                <TouchableOpacity 
                  style={styles.recentWorkoutIcon}
                  onPress={() => handleEditWorkoutName(workout.id, workout.name)}
                >
                  <Ionicons name="create-outline" size={24} color={HaloFitColors.primary} />
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
                color={HaloFitColors.primary} 
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
    backgroundColor: HaloFitColors.background,
  },
  header: {
    padding: 25,
    backgroundColor: HaloFitColors.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: HaloFitColors.white,
  },
  headerSubtitle: {
    fontSize: 15,
    color: HaloFitColors.white,
    marginTop: 5,
    opacity: 0.9,
    fontWeight: '500',
  },
  ringsCard: {
    margin: 15,
    padding: 25,
    backgroundColor: HaloFitColors.cardBackground,
    borderRadius: 25,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: HaloFitColors.accentLight,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: HaloFitColors.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  weeklyCard: {
    margin: 15,
    padding: 25,
    backgroundColor: HaloFitColors.cardBackground,
    borderRadius: 25,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: HaloFitColors.accentLight,
  },
  weeklyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
  },
  weeklyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: HaloFitColors.primary,
    marginLeft: 10,
  },
  weeklyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weeklyStatItem: {
    alignItems: 'center',
    backgroundColor: HaloFitColors.accentLight,
    padding: 15,
    borderRadius: 15,
    minWidth: 90,
  },
  weeklyStatValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: HaloFitColors.primary,
  },
  weeklyStatLabel: {
    fontSize: 13,
    color: HaloFitColors.textSecondary,
    marginTop: 5,
    fontWeight: '600',
  },
  lastWorkoutCard: {
    margin: 15,
    padding: 25,
    backgroundColor: HaloFitColors.primary,
    borderRadius: 25,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    color: HaloFitColors.white,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  lastWorkoutDate: {
    fontSize: 15,
    color: HaloFitColors.white,
    opacity: 0.9,
    marginBottom: 15,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 15,
    minWidth: 80,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: HaloFitColors.white,
  },
  statLabel: {
    fontSize: 13,
    color: HaloFitColors.white,
    fontWeight: '600',
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
    backgroundColor: HaloFitColors.cardBackground,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: HaloFitColors.accentLight,
  },
  statCardValue: {
    fontSize: 34,
    fontWeight: 'bold',
    color: HaloFitColors.primary,
    marginBottom: 8,
  },
  statCardLabel: {
    fontSize: 14,
    color: HaloFitColors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  recentSection: {
    margin: 15,
    backgroundColor: HaloFitColors.cardBackground,
    borderRadius: 25,
    padding: 20,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: HaloFitColors.accentLight,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: HaloFitColors.accent,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: HaloFitColors.primary,
  },
  recentWorkoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: HaloFitColors.accentLight,
    backgroundColor: HaloFitColors.white,
    borderRadius: 12,
    marginBottom: 8,
  },
  recentWorkoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentWorkoutIcon: {
    marginRight: 12,
    backgroundColor: HaloFitColors.accentLight,
    padding: 8,
    borderRadius: 12,
  },
  recentWorkoutContent: {
    flex: 1,
  },
  recentWorkoutRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  recentWorkoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: HaloFitColors.textPrimary,
    marginBottom: 4,
  },
  recentWorkoutDate: {
    fontSize: 12,
    fontWeight: '600',
    color: HaloFitColors.primary,
    textAlign: 'right',
  },
  recentWorkoutDetails: {
    fontSize: 13,
    color: HaloFitColors.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
    marginTop: 50,
    marginHorizontal: 20,
    backgroundColor: HaloFitColors.cardBackground,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: HaloFitColors.accentLight,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: HaloFitColors.primary,
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: HaloFitColors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  weeklyStatsHeader: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 15,
    backgroundColor: HaloFitColors.background,
  },
  weeklyStatsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: HaloFitColors.primary,
  },
  workoutCount: {
    fontSize: 14,
    color: HaloFitColors.textSecondary,
    marginLeft: 8,
    fontWeight: '600',
    backgroundColor: HaloFitColors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginTop: 10,
    borderTopWidth: 2,
    borderTopColor: HaloFitColors.accent,
    backgroundColor: HaloFitColors.accentLight,
    borderRadius: 15,
  },
  viewAllText: {
    fontSize: 16,
    color: HaloFitColors.primary,
    fontWeight: 'bold',
    marginRight: 6,
  },
});