// ActivityRings.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ActivityRingsProps {
  calories: number;
  caloriesGoal: number;
  duration: number; // in minutes
  durationGoal: number; // in minutes
  steps: number;
  stepsGoal: number;
}

export default function ActivityRings({
  calories,
  caloriesGoal,
  duration,
  durationGoal,
  steps,
  stepsGoal,
}: ActivityRingsProps) {
  
  const size = 140;
  const strokeWidth = 12;
  const center = size / 2;
  
  // Calculate radii for concentric rings
  const radius1 = (size - strokeWidth) / 2 - 2; // Outer ring (calories)
  const radius2 = radius1 - strokeWidth - 4; // Middle ring (duration)
  const radius3 = radius2 - strokeWidth - 4; // Inner ring (steps)
  
  const circumference1 = 2 * Math.PI * radius1;
  const circumference2 = 2 * Math.PI * radius2;
  const circumference3 = 2 * Math.PI * radius3;
  
  // Calculate progress percentages
  const caloriesProgress = Math.min((calories / caloriesGoal) * 100, 100);
  const durationProgress = Math.min((duration / durationGoal) * 100, 100);
  const stepsProgress = Math.min((steps / stepsGoal) * 100, 100);
  
  // Calculate stroke dash offsets
  const caloriesOffset = circumference1 - (circumference1 * caloriesProgress) / 100;
  const durationOffset = circumference2 - (circumference2 * durationProgress) / 100;
  const stepsOffset = circumference3 - (circumference3 * stepsProgress) / 100;

  return (
    <View style={styles.container}>
      <View style={styles.ringsContainer}>
        <Svg width={size} height={size}>
          {/* Background circles */}
          <Circle
            cx={center}
            cy={center}
            r={radius1}
            stroke="#2a2a2a"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={radius2}
            stroke="#2a2a2a"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={radius3}
            stroke="#2a2a2a"
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Progress circles */}
          <Circle
            cx={center}
            cy={center}
            r={radius1}
            stroke="#FF5722"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference1}
            strokeDashoffset={caloriesOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
          <Circle
            cx={center}
            cy={center}
            r={radius2}
            stroke="#4CAF50"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference2}
            strokeDashoffset={durationOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
          <Circle
            cx={center}
            cy={center}
            r={radius3}
            stroke="#2196F3"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference3}
            strokeDashoffset={stepsOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF5722' }]} />
          <Text style={styles.legendText}>
            {Math.round(calories)}/{caloriesGoal} cal
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>
            {Math.round(duration)}/{durationGoal} min
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.legendText}>
            {Math.round(steps)}/{stepsGoal} steps
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  ringsContainer: {
    marginBottom: 20,
  },
  legend: {
    alignItems: 'flex-start',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
