// WeeklyActivityChart.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutSession } from './WorkoutDataContext';

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
          <Text style={[styles.totalValue, { color }]}>
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
                        backgroundColor: day.value > 0 ? color : '#333'
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
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  goalText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  chartContainer: {
    height: 150,
  },
  chart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    height: '100%',
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  todayLabel: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  valueLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
});
