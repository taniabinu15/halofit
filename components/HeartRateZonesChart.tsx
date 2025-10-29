// HeartRateZonesChart.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutSession } from './WorkoutDataContext';

interface HeartRateZonesChartProps {
  workoutHistory: WorkoutSession[];
}

interface ZoneData {
  name: string;
  min: number;
  max: number;
  color: string;
  minutes: number;
  percentage: number;
}

export default function HeartRateZonesChart({ workoutHistory }: HeartRateZonesChartProps) {
  
  // Heart rate zones based on percentage of max HR (220 - age)
  // Assuming average user age of 30, max HR = 190
  const zones: Omit<ZoneData, 'minutes' | 'percentage'>[] = [
    { name: 'Resting', min: 50, max: 100, color: '#90A4AE' },
    { name: 'Fat Burn', min: 100, max: 133, color: '#4CAF50' },
    { name: 'Cardio', min: 133, max: 152, color: '#FFC107' },
    { name: 'Peak', min: 152, max: 220, color: '#FF5722' },
  ];

  const calculateZoneData = (): ZoneData[] => {
    const zoneMinutes: number[] = zones.map(() => 0);
    let totalMinutes = 0;

    // Go through all workouts and calculate time in each zone
    workoutHistory.forEach(workout => {
      workout.dataPoints.forEach(dataPoint => {
        const hr = dataPoint.heartRate;
        if (hr > 0) {
          // Find which zone this HR falls into
          zones.forEach((zone, index) => {
            if (hr >= zone.min && hr < zone.max) {
              // Each data point represents approximately 1 second
              zoneMinutes[index] += 1 / 60; // Convert to minutes
            }
          });
          totalMinutes += 1 / 60;
        }
      });
    });

    // Calculate percentages and round minutes
    return zones.map((zone, index) => ({
      ...zone,
      minutes: Math.round(zoneMinutes[index]),
      percentage: totalMinutes > 0 ? (zoneMinutes[index] / totalMinutes) * 100 : 0,
    }));
  };

  const zoneData = calculateZoneData();
  const totalMinutes = zoneData.reduce((sum, zone) => sum + zone.minutes, 0);
  const maxPercentage = Math.max(...zoneData.map(z => z.percentage), 1);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Heart Rate Zones</Text>
        <Text style={styles.totalTime}>{formatTime(totalMinutes)}</Text>
      </View>

      <View style={styles.chartContainer}>
        {zoneData.map((zone, index) => (
          <View key={index} style={styles.zoneRow}>
            <View style={styles.zoneInfo}>
              <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
              <View style={styles.zoneText}>
                <Text style={styles.zoneName}>{zone.name}</Text>
                <Text style={styles.zoneRange}>{zone.min}-{zone.max} bpm</Text>
              </View>
            </View>

            <View style={styles.barContainer}>
              <View style={styles.barBackground}>
                <View 
                  style={[
                    styles.barFill,
                    { 
                      width: `${(zone.percentage / maxPercentage) * 100}%`,
                      backgroundColor: zone.color 
                    }
                  ]}
                />
              </View>
              <Text style={styles.zoneValue}>
                {zone.minutes > 0 ? formatTime(zone.minutes) : '0m'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>
          Based on {workoutHistory.length} workout{workoutHistory.length !== 1 ? 's' : ''}
        </Text>
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
  totalTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  chartContainer: {
    marginBottom: 15,
  },
  zoneRow: {
    marginBottom: 16,
  },
  zoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  zoneText: {
    flex: 1,
  },
  zoneName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  zoneRange: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barBackground: {
    flex: 1,
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 10,
  },
  barFill: {
    height: '100%',
    borderRadius: 12,
    minWidth: 2,
  },
  zoneValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 60,
    textAlign: 'right',
  },
  legend: {
    marginTop: 10,
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
