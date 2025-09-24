import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ActivityData {
  date: string;
  workouts: number;
  calories: number;
  duration: number;
  splatPoints: number;
}

const weeklyData: ActivityData[] = [
  { date: 'Mon', workouts: 1, calories: 485, duration: 60, splatPoints: 18 },
  { date: 'Tue', workouts: 0, calories: 0, duration: 0, splatPoints: 0 },
  { date: 'Wed', workouts: 1, calories: 420, duration: 45, splatPoints: 22 },
  { date: 'Thu', workouts: 1, calories: 398, duration: 60, splatPoints: 15 },
  { date: 'Fri', workouts: 0, calories: 0, duration: 0, splatPoints: 0 },
  { date: 'Sat', workouts: 1, calories: 512, duration: 75, splatPoints: 25 },
  { date: 'Sun', workouts: 1, calories: 456, duration: 50, splatPoints: 20 },
];

const StatCard = ({ title, value, unit, icon, color }: {
  title: string;
  value: string;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color="#fff" />
    </View>
    <Text style={styles.statTitle}>{title}</Text>
    <View style={styles.statValueContainer}>
      <Text style={styles.statValue}>{value}</Text>
      {unit && <Text style={styles.statUnit}>{unit}</Text>}
    </View>
  </View>
);

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  
  const totalWorkouts = weeklyData.reduce((sum, day) => sum + day.workouts, 0);
  const totalCalories = weeklyData.reduce((sum, day) => sum + day.calories, 0);
  const totalDuration = weeklyData.reduce((sum, day) => sum + day.duration, 0);
  const totalSplatPoints = weeklyData.reduce((sum, day) => sum + day.splatPoints, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity</Text>
        <Text style={styles.headerSubtitle}>Your weekly summary</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Weekly Summary Cards */}
        <View style={styles.summaryGrid}>
          <StatCard
            title="Workouts"
            value={totalWorkouts.toString()}
            icon="fitness"
            color="#3b82f6"
          />
          <StatCard
            title="Calories"
            value={totalCalories.toLocaleString()}
            unit="kcal"
            icon="flame"
            color="#f97316"
          />
          <StatCard
            title="Duration"
            value={Math.round(totalDuration / 60).toString()}
            unit="hrs"
            icon="time"
            color="#22c55e"
          />
          <StatCard
            title="Step Points"
            value={totalSplatPoints.toString()}
            icon="trophy"
            color="#8b5cf6"
          />
        </View>

        {/* Weekly Activity Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>This Week</Text>
          <View style={styles.chart}>
            {weeklyData.map((day, index) => (
              <View key={index} style={styles.chartDay}>
                <View style={styles.chartBarContainer}>
                  <View 
                    style={[
                      styles.chartBar,
                      { 
                        height: day.workouts > 0 ? `${(day.calories / 600) * 100}%` : 4,
                        backgroundColor: day.workouts > 0 ? '#ffc0cb' : '#e5e7eb'
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.chartDayLabel}>{day.date}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Goals Section */}
        <View style={styles.goalsContainer}>
          <Text style={styles.goalsTitle}>Weekly Goals</Text>
          <View style={styles.goalItem}>
            <View style={styles.goalInfo}>
              <Ionicons name="fitness" size={20} color="#3b82f6" />
              <Text style={styles.goalLabel}>Workout Days</Text>
            </View>
            <Text style={styles.goalProgress}>5/7 days</Text>
          </View>
          <View style={styles.goalItem}>
            <View style={styles.goalInfo}>
              <Ionicons name="flame" size={20} color="#f97316" />
              <Text style={styles.goalLabel}>Calories Burned</Text>
            </View>
            <Text style={styles.goalProgress}>2,271/3,000 kcal</Text>
          </View>
          <View style={styles.goalItem}>
            <View style={styles.goalInfo}>
              <Ionicons name="trophy" size={20} color="#8b5cf6" />
              <Text style={styles.goalLabel}>Step Points</Text>
            </View>
            <Text style={styles.goalProgress}>100/140 points</Text>
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  statCard: {
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
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  statUnit: {
    fontSize: 12,
    color: '#6b7280',
  },
  chartContainer: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartDay: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  chartBarContainer: {
    height: 80,
    justifyContent: 'flex-end',
    width: 20,
  },
  chartBar: {
    width: '100%',
    borderRadius: 2,
    minHeight: 4,
  },
  chartDayLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  goalsContainer: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  goalsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalLabel: {
    fontSize: 16,
    color: '#000',
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
});