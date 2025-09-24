import { StyleSheet } from 'react-native';
import ActivityScreen from '@/components/AcitivityScreen';
import GoalsScreen from '@/components/GoalsScreen';
import { Text, View } from '@/components/Themed';

export default function TabOneScreen() {
  // Render only the Activity screen for this tab
  return <ActivityScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
