// WorkoutHistoryScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useWorkoutData, WorkoutSession } from './WorkoutDataContext';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutHistoryScreen() {
  const { workoutHistory, refreshStats } = useWorkoutData();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshStats();
    setRefreshing(false);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const toggleWorkoutDetails = (workoutId: string) => {
    setExpandedWorkoutId(expandedWorkoutId === workoutId ? null : workoutId);
  };

  const renderWorkoutCard = (workout: WorkoutSession, index: number) => {
    const isExpanded = expandedWorkoutId === workout.id;
    
    return (
      <TouchableOpacity 
        key={workout.id} 
        style={styles.workoutCard}
        onPress={() => toggleWorkoutDetails(workout.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.workoutNumber}>
            <Text style={styles.workoutNumberText}>#{workoutHistory.length - index}</Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.workoutDate}>{formatDate(workout.endTime)}</Text>
            <Text style={styles.workoutTime}>{formatTime(workout.startTime)} - {formatTime(workout.endTime)}</Text>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#666" 
          />
        </View>

        <View style={styles.workoutStats}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={20} color="#4CAF50" />
            <Text style={styles.statValue}>{formatDuration(workout.duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="flame-outline" size={20} color="#FF5722" />
            <Text style={styles.statValue}>{Math.round(workout.finalCalories)}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="footsteps-outline" size={20} color="#2196F3" />
            <Text style={styles.statValue}>{Math.round(workout.finalStepCount)}</Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={20} color="#E91E63" />
            <Text style={styles.statValue}>{Math.round(workout.avgHeartRate)}</Text>
            <Text style={styles.statLabel}>Avg HR</Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedDetails}>
            <View style={styles.divider} />
            <Text style={styles.detailsTitle}>Workout Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Start Time:</Text>
              <Text style={styles.detailValue}>{new Date(workout.startTime).toLocaleString()}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>End Time:</Text>
              <Text style={styles.detailValue}>{new Date(workout.endTime).toLocaleString()}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Final Heart Rate:</Text>
              <Text style={styles.detailValue}>{Math.round(workout.finalHeartRate)} bpm</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Data Points Collected:</Text>
              <Text style={styles.detailValue}>{workout.dataPoints.length}</Text>
            </View>

            {workout.dataPoints.length > 0 && (
              <View style={styles.dataPointsPreview}>
                <Text style={styles.detailLabel}>Heart Rate Range:</Text>
                <Text style={styles.detailValue}>
                  {Math.min(...workout.dataPoints.map(d => d.heartRate).filter(hr => hr > 0))} - {Math.max(...workout.dataPoints.map(d => d.heartRate))} bpm
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout History</Text>
        <Text style={styles.headerSubtitle}>
          {workoutHistory.length} workout{workoutHistory.length !== 1 ? 's' : ''} total
        </Text>
      </View>

      {workoutHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No workouts yet!</Text>
          <Text style={styles.emptyStateSubtext}>
            Your workout history will appear here
          </Text>
        </View>
      ) : (
        <View style={styles.workoutList}>
          {workoutHistory.slice().reverse().map((workout, index) => 
            renderWorkoutCard(workout, index)
          )}
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
  workoutList: {
    padding: 15,
  },
  workoutCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  workoutNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workoutNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  workoutDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  workoutTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  expandedDetails: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  dataPointsPreview: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
});
