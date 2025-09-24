import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WorkoutType {
  id: string;
  name: string;
  duration: string;
  calories: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
}

const workoutTypes: WorkoutType[] = [
  {
    id: '1',
    name: 'Full Body Strength',
    duration: '45-60 min',
    calories: '400-500 kcal',
    icon: 'barbell',
    color: '#3b82f6',
    description: 'Complete strength training workout'
  },
  {
    id: '2',
    name: 'HIIT Cardio',
    duration: '30-45 min',
    calories: '350-450 kcal',
    icon: 'flash',
    color: '#f97316',
    description: 'High-intensity interval training'
  },
  {
    id: '3',
    name: 'Endurance Run',
    duration: '45-90 min',
    calories: '400-600 kcal',
    icon: 'walk',
    color: '#22c55e',
    description: 'Long-distance cardiovascular training'
  },
  {
    id: '4',
    name: 'Yoga Flow',
    duration: '30-60 min',
    calories: '200-300 kcal',
    icon: 'leaf',
    color: '#8b5cf6',
    description: 'Flexibility and mindfulness practice'
  },
  {
    id: '5',
    name: 'Cycling',
    duration: '45-75 min',
    calories: '350-500 kcal',
    icon: 'bicycle',
    color: '#06b6d4',
    description: 'Indoor or outdoor cycling workout'
  },
  {
    id: '6',
    name: 'Boxing',
    duration: '30-45 min',
    calories: '400-550 kcal',
    icon: 'fitness',
    color: '#dc2626',
    description: 'High-intensity boxing training'
  },
];

const WorkoutCard = ({ workout, onPress }: { workout: WorkoutType; onPress: () => void }) => (
  <TouchableOpacity style={styles.workoutCard} onPress={onPress}>
    <View style={[styles.workoutIcon, { backgroundColor: workout.color }]}>
      <Ionicons name={workout.icon} size={24} color="#fff" />
    </View>
    <View style={styles.workoutInfo}>
      <Text style={styles.workoutName}>{workout.name}</Text>
      <Text style={styles.workoutDescription}>{workout.description}</Text>
      <View style={styles.workoutStats}>
        <View style={styles.workoutStat}>
          <Ionicons name="time-outline" size={14} color="#6b7280" />
          <Text style={styles.workoutStatText}>{workout.duration}</Text>
        </View>
        <View style={styles.workoutStat}>
          <Ionicons name="flame-outline" size={14} color="#6b7280" />
          <Text style={styles.workoutStatText}>{workout.calories}</Text>
        </View>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#6b7280" />
  </TouchableOpacity>
);

export default function RecordScreen() {
  const insets = useSafeAreaInsets();
  const [isRecording, setIsRecording] = useState(false);

  const handleStartWorkout = (workout: WorkoutType) => {
    Alert.alert(
      'Start Workout',
      `Ready to start ${workout.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: () => {
            setIsRecording(true);
            Alert.alert('Workout Started!', `${workout.name} is now recording.`);
          }
        }
      ]
    );
  };

  const handleQuickStart = () => {
    Alert.alert(
      'Quick Start',
      'Start a general workout session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: () => {
            setIsRecording(true);
            Alert.alert('Quick Workout Started!', 'General workout is now recording.');
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Record Workout</Text>
        <Text style={styles.headerSubtitle}>Choose your workout type</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Start Button */}
        <View style={styles.quickStartContainer}>
          <TouchableOpacity 
            style={[styles.quickStartButton, isRecording && styles.quickStartButtonActive]}
            onPress={handleQuickStart}
          >
            <View style={styles.quickStartContent}>
              <Ionicons 
                name={isRecording ? "stop-circle" : "play-circle"} 
                size={32} 
                color={isRecording ? "#dc2626" : "#ffffff"} 
              />
              <View style={styles.quickStartText}>
                <Text style={[styles.quickStartTitle, isRecording && styles.quickStartTitleActive]}>
                  {isRecording ? 'Stop Recording' : 'Quick Start'}
                </Text>
                <Text style={[styles.quickStartSubtitle, isRecording && styles.quickStartSubtitleActive]}>
                  {isRecording ? 'Tap to end workout' : 'Start a general workout'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Workout Types */}
        <View style={styles.workoutTypesContainer}>
          <Text style={styles.sectionTitle}>Workout Types</Text>
          <View style={styles.workoutsList}>
            {workoutTypes.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onPress={() => handleStartWorkout(workout)}
              />
            ))}
          </View>
        </View>

        {/* Recent Templates */}
        <View style={styles.templatesContainer}>
          <Text style={styles.sectionTitle}>Recent Templates</Text>
          <View style={styles.templatesList}>
            <TouchableOpacity style={styles.templateItem}>
              <View style={styles.templateIcon}>
                <Ionicons name="bookmark" size={20} color="#6b7280" />
              </View>
              <View style={styles.templateInfo}>
                <Text style={styles.templateName}>Morning Routine</Text>
                <Text style={styles.templateDescription}>Full body + cardio mix</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#6b7280" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.templateItem}>
              <View style={styles.templateIcon}>
                <Ionicons name="bookmark" size={20} color="#6b7280" />
              </View>
              <View style={styles.templateInfo}>
                <Text style={styles.templateName}>Evening Burn</Text>
                <Text style={styles.templateDescription}>HIIT + strength combo</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  quickStartContainer: {
    padding: 16,
  },
  quickStartButton: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 20,
  },
  quickStartButtonActive: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#dc2626',
  },
  quickStartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quickStartText: {
    flex: 1,
  },
  quickStartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  quickStartTitleActive: {
    color: '#dc2626',
  },
  quickStartSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 2,
  },
  quickStartSubtitleActive: {
    color: '#6b7280',
  },
  workoutTypesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  workoutsList: {
    gap: 12,
  },
  workoutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  workoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutInfo: {
    flex: 1,
    gap: 4,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  workoutDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  workoutStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutStatText: {
    fontSize: 12,
    color: '#6b7280',
  },
  templatesContainer: {
    padding: 16,
  },
  templatesList: {
    gap: 8,
  },
  templateItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  templateIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  templateDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
});