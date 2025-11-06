import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HaloFitColors } from '@/constants/Colors';

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
    color: HaloFitColors.primary,
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
    color: HaloFitColors.accentCoral,
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
    color: HaloFitColors.accentPurple,
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
    color: HaloFitColors.primaryLight,
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
    color: HaloFitColors.accentCoral
  },
  {
    id: '2',
    title: 'Week Warrior',
    description: 'Complete 5 workouts in one week',
    icon: 'medal',
    earned: true,
    color: HaloFitColors.primary
  },
  {
    id: '3',
    title: 'Calorie Crusher',
    description: 'Burn 500+ calories in one workout',
    icon: 'flame',
    earned: true,
    color: HaloFitColors.primaryLight
  },
  {
    id: '4',
    title: 'Consistency King',
    description: 'Workout 10 days in a row',
    icon: 'checkmark-circle',
    earned: false,
    color: HaloFitColors.gray
  },
  {
    id: '5',
    title: 'Zone Master',
    description: 'Spend 20+ minutes in orange zone',
    icon: 'heart',
    earned: false,
    color: HaloFitColors.gray
  },
  {
    id: '6',
    title: 'Monthly Hero',
    description: 'Complete 20 workouts in one month',
    icon: 'star',
    earned: false,
    color: HaloFitColors.gray
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
    <View style={styles.container}>
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
    backgroundColor: HaloFitColors.white,
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
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: HaloFitColors.primary,
    marginBottom: 16,
  },
  goalsList: {
    gap: 16,
  },
  goalCard: {
    backgroundColor: HaloFitColors.cardBackground,
    borderRadius: 20,
    padding: 20,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: HaloFitColors.accentLight,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: HaloFitColors.textPrimary,
  },
  goalTimeframe: {
    fontSize: 13,
    color: HaloFitColors.textSecondary,
    fontWeight: '500',
  },
  goalProgress: {
    fontSize: 15,
    fontWeight: 'bold',
    color: HaloFitColors.primary,
  },
  goalDescription: {
    fontSize: 14,
    color: HaloFitColors.textSecondary,
    marginBottom: 14,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBackground: {
    flex: 1,
    height: 10,
    backgroundColor: HaloFitColors.accentLight,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: HaloFitColors.primary,
    minWidth: 35,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementBadge: {
    width: '47%',
    backgroundColor: HaloFitColors.cardBackground,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: HaloFitColors.accentLight,
  },
  achievementBadgeDisabled: {
    opacity: 0.5,
  },
  achievementIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: HaloFitColors.textPrimary,
    textAlign: 'center',
    marginBottom: 5,
  },
  achievementTitleDisabled: {
    color: HaloFitColors.textLight,
  },
  achievementDescription: {
    fontSize: 12,
    color: HaloFitColors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  achievementDescriptionDisabled: {
    color: HaloFitColors.textLight,
  },
  addGoalButton: {
    backgroundColor: HaloFitColors.cardBackground,
    borderRadius: 20,
    padding: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 3,
    borderColor: HaloFitColors.accent,
    borderStyle: 'dashed',
  },
  addGoalText: {
    fontSize: 17,
    color: HaloFitColors.primary,
    fontWeight: 'bold',
  },
});