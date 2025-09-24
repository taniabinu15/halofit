import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  unit: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  timeframe: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  earned: boolean;
  color: string;
}

const goals: Goal[] = [
  {
    id: '1',
    title: 'Weekly Workouts',
    description: 'Complete 5 workouts this week',
    progress: 3,
    target: 5,
    unit: 'workouts',
    icon: 'fitness',
    color: '#3b82f6',
    timeframe: 'This Week'
  },
  {
    id: '2',
    title: 'Calories Burned',
    description: 'Burn 3,000 calories this week',
    progress: 2271,
    target: 3000,
    unit: 'kcal',
    icon: 'flame',
    color: '#f97316',
    timeframe: 'This Week'
  },
  {
    id: '3',
    title: 'Step Points',
    description: 'Earn 140 step points this week',
    progress: 100,
    target: 140,
    unit: 'points',
    icon: 'trophy',
    color: '#8b5cf6',
    timeframe: 'This Week'
  },
  {
    id: '4',
    title: 'Monthly Distance',
    description: 'Cover 100km this month',
    progress: 67,
    target: 100,
    unit: 'km',
    icon: 'walk',
    color: '#22c55e',
    timeframe: 'This Month'
  },
];

const achievements: Achievement[] = [
  {
    id: '1',
    title: 'First Workout',
    description: 'Complete your first workout',
    icon: 'ribbon',
    earned: true,
    color: '#fbbf24'
  },
  {
    id: '2',
    title: 'Week Warrior',
    description: 'Complete 5 workouts in one week',
    icon: 'medal',
    earned: true,
    color: '#f59e0b'
  },
  {
    id: '3',
    title: 'Calorie Crusher',
    description: 'Burn 500+ calories in one workout',
    icon: 'flame',
    earned: true,
    color: '#dc2626'
  },
  {
    id: '4',
    title: 'Consistency King',
    description: 'Workout 10 days in a row',
    icon: 'checkmark-circle',
    earned: false,
    color: '#6b7280'
  },
  {
    id: '5',
    title: 'Zone Master',
    description: 'Spend 20+ minutes in orange zone',
    icon: 'heart',
    earned: false,
    color: '#6b7280'
  },
  {
    id: '6',
    title: 'Monthly Hero',
    description: 'Complete 20 workouts in one month',
    icon: 'star',
    earned: false,
    color: '#6b7280'
  },
];

const GoalCard = ({ goal }: { goal: Goal }) => {
  const progressPercentage = (goal.progress / goal.target) * 100;
  
  return (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <View style={[styles.goalIcon, { backgroundColor: goal.color }]}>
          <Ionicons name={goal.icon} size={20} color="#fff" />
        </View>
        <View style={styles.goalInfo}>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          <Text style={styles.goalTimeframe}>{goal.timeframe}</Text>
        </View>
        <Text style={styles.goalProgress}>
          {goal.progress}/{goal.target} {goal.unit}
        </Text>
      </View>
      
      <Text style={styles.goalDescription}>{goal.description}</Text>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressBar,
              { 
                width: `${Math.min(progressPercentage, 100)}%`,
                backgroundColor: goal.color 
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
      </View>
    </View>
  );
};

const AchievementBadge = ({ achievement }: { achievement: Achievement }) => (
  <View style={[styles.achievementBadge, !achievement.earned && styles.achievementBadgeDisabled]}>
    <View style={[styles.achievementIcon, { backgroundColor: achievement.color }]}>
      <Ionicons 
        name={achievement.icon} 
        size={24} 
        color={achievement.earned ? "#fff" : "#9ca3af"} 
      />
    </View>
    <Text style={[styles.achievementTitle, !achievement.earned && styles.achievementTitleDisabled]}>
      {achievement.title}
    </Text>
    <Text style={[styles.achievementDescription, !achievement.earned && styles.achievementDescriptionDisabled]}>
      {achievement.description}
    </Text>
  </View>
);

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Goals</Text>
        <Text style={styles.headerSubtitle}>Track your progress</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Goals</Text>
          <View style={styles.goalsList}>
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsList}>
            {achievements.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </View>

        {/* Add New Goal */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.addGoalButton}>
            <Ionicons name="add-circle-outline" size={24} color="#6b7280" />
            <Text style={styles.addGoalText}>Set New Goal</Text>
          </TouchableOpacity>
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  goalsList: {
    gap: 16,
  },
  goalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  goalTimeframe: {
    fontSize: 12,
    color: '#6b7280',
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 30,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementBadge: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  achievementBadgeDisabled: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementTitleDisabled: {
    color: '#9ca3af',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  achievementDescriptionDisabled: {
    color: '#d1d5db',
  },
  addGoalButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#f3f4f6',
    borderStyle: 'dashed',
  },
  addGoalText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});