// Example: How to add Firebase sync button to ProfileScreen

// Add this to your ProfileScreen.tsx imports:
import { useWorkoutData } from './WorkoutDataContext';

// Inside the component:
const { syncToFirebase, isFirebaseReady } = useWorkoutData();

// Add this button to your profile screen:
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Cloud Sync</Text>
  
  <View style={styles.syncContainer}>
    <View style={styles.syncStatus}>
      <Ionicons 
        name={isFirebaseReady ? "cloud-done" : "cloud-offline"} 
        size={24} 
        color={isFirebaseReady ? "#4CAF50" : "#9E9E9E"} 
      />
      <Text style={styles.syncText}>
        {isFirebaseReady ? "Firebase Connected" : "Firebase Offline"}
      </Text>
    </View>
    
    <TouchableOpacity 
      style={[
        styles.syncButton,
        !isFirebaseReady && styles.syncButtonDisabled
      ]}
      onPress={async () => {
        if (isFirebaseReady) {
          Alert.alert('Syncing...', 'Uploading workouts to Firebase');
          await syncToFirebase();
          Alert.alert('✅ Success', 'All workouts synced to cloud!');
        }
      }}
      disabled={!isFirebaseReady}
    >
      <Ionicons name="cloud-upload" size={20} color="#fff" />
      <Text style={styles.syncButtonText}>Sync to Cloud</Text>
    </TouchableOpacity>
  </View>
</View>

// Add these styles:
syncContainer: {
  padding: 15,
  backgroundColor: '#f5f5f5',
  borderRadius: 10,
},
syncStatus: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 15,
},
syncText: {
  fontSize: 16,
  marginLeft: 10,
  color: '#333',
},
syncButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#4CAF50',
  padding: 12,
  borderRadius: 8,
  gap: 8,
},
syncButtonDisabled: {
  backgroundColor: '#9E9E9E',
},
syncButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},
