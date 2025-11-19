// WeeklyActivityChart.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutSession } from './WorkoutDataContext';
import { HaloFitColors } from '@/constants/Colors';

interface WeeklyActivityChartProps {
  workoutHistory: WorkoutSession[];
  metricType: 'duration' | 'calories' | 'steps';
  title: string;
  color: string;
  unit?: string;
}

interface DayData {
  dayName: string;
  value: number;
  date: Date;
}

export default function WeeklyActivityChart({ 
  workoutHistory, 
  metricType, 
  title, 
  color,
  unit = ''
}: WeeklyActivityChartProps) {
  
  const getDayData = (): DayData[] => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekData: DayData[] = [];

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayName = days[date.getDay()];
      
      // Filter workouts for this day
      const dayStart = date.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      
      const dayWorkouts = workoutHistory.filter(w => 
        w.endTime >= dayStart && w.endTime < dayEnd
      );

      let value = 0;
      if (metricType === 'duration') {
        value = dayWorkouts.reduce((sum, w) => sum + w.duration, 0) / 60; // Convert to minutes
      } else if (metricType === 'calories') {
        value = dayWorkouts.reduce((sum, w) => sum + w.finalCalories, 0);
      } else if (metricType === 'steps') {
        value = dayWorkouts.reduce((sum, w) => sum + w.finalStepCount, 0);
      }

      weekData.push({
        dayName,
        value: Math.round(value),
        date
      });
    }

    return weekData;
  };

  const weekData = getDayData();
  const maxValue = Math.max(...weekData.map(d => d.value), 1);
  const today = new Date().getDay();

  const formatValue = (value: number) => {
    if (metricType === 'steps' && value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  const getTotalValue = () => {
    const total = weekData.reduce((sum, d) => sum + d.value, 0);
    if (metricType === 'duration') {
      const hours = Math.floor(total / 60);
      const mins = Math.round(total % 60);
      return hours > 0 ? `${hours} h ${mins} m` : `${mins}`;
    }
    if (metricType === 'steps' && total >= 1000) {
      return `${(total / 1000).toFixed(1)}k`;
    }
    return Math.round(total).toString();
  };

  const getGoalValue = () => {
    // Set goals based on metric type
    if (metricType === 'duration') return '30 min';
    if (metricType === 'calories') return '500 cal';
    if (metricType === 'steps') return '10k';
    return '';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.stats}>
          <Text style={styles.totalValue}>
            {getTotalValue()}{unit}
          </Text>
          <Text style={styles.goalText}>/{getGoalValue()}</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {weekData.map((day, index) => {
            const heightPercentage = maxValue > 0 ? (day.value / maxValue) * 100 : 0;
            const isToday = day.date.getDay() === today;
            
            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View 
                    style={[
                      styles.bar,
                      { 
                        height: `${Math.max(heightPercentage, 3)}%`,
                        backgroundColor: day.value > 0 ? color : 'rgba(255, 255, 255, 0.2)' // Light bars for empty days
                      }
                    ]}
                  />
                </View>
                <Text style={[
                  styles.dayLabel,
                  isToday && styles.todayLabel
                ]}>
                  {day.dayName}
                </Text>
                {day.value > 0 && (
                  <Text style={styles.valueLabel}>{formatValue(day.value)}</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF69B4', // Hot pink background for contrast! 🎨💕
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 15,
    marginVertical: 10,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: HaloFitColors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: HaloFitColors.white, // White text for contrast
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: HaloFitColors.white, // White for total value
  },
  goalText: {
    fontSize: 14,
    color: HaloFitColors.white, // White for goal text
    marginLeft: 4,
    fontWeight: '500',
  },
  chartContainer: {
    height: 120,
    marginTop: 10,
  },
  chart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 5,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barWrapper: {
    width: '80%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: '100%',
    borderRadius: 8,
    minHeight: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  dayLabel: {
    fontSize: 11,
    color: HaloFitColors.white,
    marginTop: 4,
    fontWeight: '600',
    position: 'absolute',
    bottom: -20,
  },
  todayLabel: {
    color: HaloFitColors.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  valueLabel: {
    fontSize: 9,
    color: HaloFitColors.white,
    fontWeight: '600',
    position: 'absolute',
    top: -15,
  },
});
