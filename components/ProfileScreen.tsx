import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutData } from './WorkoutDataContext';
import { HaloFitColors } from '@/constants/Colors';
import { useAuth } from '@/components/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { workoutStats, globalStats, workoutHistory, allWorkouts, userProfile, refreshStats, refreshGlobalStats, refreshAllWorkouts, isFirebaseReady, syncToFirebase, updateWorkoutName, saveUserProfile } = useWorkoutData();
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showAllWorkouts, setShowAllWorkouts] = useState(false);
  
  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>(userProfile?.gender || 'male');
  const [age, setAge] = useState(userProfile?.age?.toString() || '');
  const [heightInches, setHeightInches] = useState(userProfile?.heightInches?.toString() || '');
  const [weightLbs, setWeightLbs] = useState(userProfile?.weightLbs?.toString() || '');

  // Update form when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setGender(userProfile.gender);
      setAge(userProfile.age?.toString() || '');
      setHeightInches(userProfile.heightInches.toString());
      setWeightLbs(userProfile.weightLbs.toString());
    }
  }, [userProfile]);

  // Load global stats and workouts when Firebase becomes ready
  useEffect(() => {
    if (isFirebaseReady) {
      console.log('🔄 ProfileScreen: Firebase ready, loading data...');
      refreshGlobalStats();
      refreshStats(); // Load personal workouts
      refreshAllWorkouts(); // Load all workouts from all users
    }
  }, [isFirebaseReady]);

  // Debug log to see workout data
  useEffect(() => {
    console.log('📊 ProfileScreen workoutHistory:', workoutHistory.length, 'workouts');
    console.log('📊 ProfileScreen allWorkouts:', allWorkouts.length, 'workouts');
  }, [workoutHistory, allWorkouts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshStats();
    await refreshGlobalStats();
    await refreshAllWorkouts();
    setRefreshing(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    await syncToFirebase();
    await refreshStats();
    setSyncing(false);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const handleEditWorkoutName = (workoutId: string, currentName?: string) => {
    Alert.prompt(
      'Rename Workout',
      'Enter a new name for this workout:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Save',
          onPress: async (newName?: string) => {
            if (newName && newName.trim()) {
              try {
                await updateWorkoutName(workoutId, newName.trim());
                Alert.alert('Success', 'Workout name updated!');
              } catch (error) {
                Alert.alert('Error', 'Failed to update workout name');
              }
            }
          },
        },
      ],
      'plain-text',
      currentName || ''
    );
  };

  const getDefaultWorkoutName = (date: number) => {
    const workoutDate = new Date(date);
    return `Workout ${workoutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const handleSaveProfile = async () => {
    const ageNum = age ? parseFloat(age) : undefined;
    const height = parseFloat(heightInches);
    const weight = parseFloat(weightLbs);

    // Validation
    if (age && (isNaN(ageNum!) || ageNum! < 10 || ageNum! > 120)) {
      Alert.alert('Invalid Age', 'Age must be between 10 and 120 years');
      return;
    }

    if (isNaN(height) || height < 36 || height > 96) {
      Alert.alert('Invalid Height', 'Height must be between 36 and 96 inches (3-8 feet)');
      return;
    }

    if (isNaN(weight) || weight < 50 || weight > 500) {
      Alert.alert('Invalid Weight', 'Weight must be between 50 and 500 pounds');
      return;
    }

    try {
      await saveUserProfile({ gender, age: ageNum, heightInches: height, weightLbs: weight });
      setEditingProfile(false);
      Alert.alert('Success', 'Profile saved! Your data will be synced to the device on next connection.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* User Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={50} color={HaloFitColors.primary} />
        </View>
        <Text style={styles.userName}>HaloFit User</Text>
        <View style={styles.firebaseStatus}>
          <Ionicons 
            name={isFirebaseReady ? "cloud-done" : "cloud-offline"} 
            size={16} 
            color={HaloFitColors.white} 
          />
          <Text style={styles.firebaseStatusText}>
            {isFirebaseReady ? "Synced to Cloud" : "Offline Mode"}
          </Text>
        </View>
      </View>

      {/* User Profile Info Section */}
      <View style={styles.profileInfoSection}>
        <View style={styles.profileInfoHeader}>
          <Ionicons name="body-outline" size={24} color={HaloFitColors.primary} />
          <Text style={styles.sectionTitle}>My Profile</Text>
          <TouchableOpacity 
            style={styles.editIconButton}
            onPress={() => setEditingProfile(!editingProfile)}
          >
            <Ionicons 
              name={editingProfile ? "close-circle" : "create-outline"} 
              size={24} 
              color={HaloFitColors.primary} 
            />
          </TouchableOpacity>
        </View>

        {editingProfile ? (
          <View style={styles.profileForm}>
            {/* Gender Selection */}
            <Text style={styles.formLabel}>Gender</Text>
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
                onPress={() => setGender('male')}
              >
                <Ionicons 
                  name="male" 
                  size={24} 
                  color={gender === 'male' ? HaloFitColors.white : HaloFitColors.primary} 
                />
                <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
                onPress={() => setGender('female')}
              >
                <Ionicons 
                  name="female" 
                  size={24} 
                  color={gender === 'female' ? HaloFitColors.white : HaloFitColors.primary} 
                />
                <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>
                  Female
                </Text>
              </TouchableOpacity>
            </View>

            {/* Age Input */}
            <Text style={styles.formLabel}>Age (years)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 25"
              placeholderTextColor={HaloFitColors.textSecondary}
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />

            {/* Height Input */}
            <Text style={styles.formLabel}>Height (inches)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 70 (5'10&quot;)"
              placeholderTextColor={HaloFitColors.textSecondary}
              keyboardType="numeric"
              value={heightInches}
              onChangeText={setHeightInches}
            />

            {/* Weight Input */}
            <Text style={styles.formLabel}>Weight (lbs)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 150"
              placeholderTextColor={HaloFitColors.textSecondary}
              keyboardType="numeric"
              value={weightLbs}
              onChangeText={setWeightLbs}
            />

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Ionicons name="checkmark-circle" size={20} color={HaloFitColors.white} />
              <Text style={styles.saveButtonText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.profileDisplay}>
            {userProfile ? (
              <>
                <View style={styles.profileRow}>
                  <Ionicons name={userProfile.gender === 'male' ? 'male' : 'female'} size={20} color={HaloFitColors.primary} />
                  <Text style={styles.profileValue}>
                    {userProfile.gender === 'male' ? 'Male' : 'Female'}
                  </Text>
                </View>
                {userProfile.age && (
                  <View style={styles.profileRow}>
                    <Ionicons name="calendar-outline" size={20} color={HaloFitColors.primary} />
                    <Text style={styles.profileValue}>{userProfile.age} years old</Text>
                  </View>
                )}
                <View style={styles.profileRow}>
                  <Ionicons name="resize-outline" size={20} color={HaloFitColors.primary} />
                  <Text style={styles.profileValue}>
                    {Math.floor(userProfile.heightInches / 12)}'{userProfile.heightInches % 12}" ({userProfile.heightInches}″)
                  </Text>
                </View>
                <View style={styles.profileRow}>
                  <Ionicons name="barbell-outline" size={20} color={HaloFitColors.primary} />
                  <Text style={styles.profileValue}>{userProfile.weightLbs} lbs</Text>
                </View>
              </>
            ) : (
              <Text style={styles.noProfileText}>
                Tap the edit icon to set your profile. This data will be sent to your HaloFit device for accurate calorie and fitness tracking.
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Global Community Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart-outline" size={24} color={HaloFitColors.primary} />
          <Text style={styles.sectionTitle}>Total Lifetime Statistics</Text>
        </View>
        
        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Ionicons name="barbell-outline" size={32} color={HaloFitColors.primary} style={{ marginBottom: 8 }} />
            <Text style={styles.statNumber}>{globalStats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Total Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons name="time-outline" size={32} color={HaloFitColors.primaryLight} style={{ marginBottom: 8 }} />
            <Text style={styles.statNumber}>
              {formatDuration(globalStats.totalDuration)}
            </Text>
            <Text style={styles.statLabel}>Total Duration</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Ionicons name="flame-outline" size={32} color={HaloFitColors.primary} style={{ marginBottom: 8 }} />
            <Text style={styles.statNumber}>{Math.round(globalStats.totalCalories).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Calories</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons name="heart-outline" size={32} color={HaloFitColors.accent} style={{ marginBottom: 8 }} />
            <Text style={styles.statNumber}>{Math.round(globalStats.avgHeartRate)}</Text>
            <Text style={styles.statLabel}>Avg Heart Rate</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Ionicons name="footsteps-outline" size={32} color={HaloFitColors.primaryDark} style={{ marginBottom: 8 }} />
            <Text style={styles.statNumber}>{Math.round(globalStats.totalSteps).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Steps</Text>
          </View>
        </View>

        {/* Refresh Button for Global Stats */}
        <TouchableOpacity 
          style={styles.refreshGlobalButton}
          onPress={refreshGlobalStats}
          disabled={!isFirebaseReady}
        >
          <Ionicons name="refresh-outline" size={18} color={isFirebaseReady ? HaloFitColors.primary : HaloFitColors.gray} />
          <Text style={[styles.refreshGlobalText, { color: isFirebaseReady ? HaloFitColors.primary : HaloFitColors.gray }]}>
            Refresh Global Stats
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sync Button */}
      {isFirebaseReady && (
        <TouchableOpacity 
          style={styles.syncButton}
          onPress={handleSync}
          disabled={syncing}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={HaloFitColors.white} />
          <Text style={styles.syncButtonText}>
            {syncing ? 'Syncing...' : 'Sync to Cloud'}
          </Text>
        </TouchableOpacity>
      )}

      {/* All Workouts List */}
      {allWorkouts.length > 0 && (
        <View style={styles.allWorkoutsSection}>
          <View style={styles.allWorkoutsHeader}>
            <Text style={styles.allWorkoutsTitle}>All Workouts</Text>
            <Text style={styles.workoutCount}>({allWorkouts.length} total)</Text>
          </View>
          {(showAllWorkouts ? allWorkouts : allWorkouts.slice(0, 5)).map((workout, index) => (
            <View key={`${workout.id}_${index}`} style={styles.workoutItem}>
              <View style={styles.workoutLeft}>
                <TouchableOpacity 
                  style={styles.workoutIcon}
                  onPress={() => handleEditWorkoutName(workout.id, workout.name)}
                >
                  <Ionicons name="create-outline" size={24} color={HaloFitColors.primary} />
                </TouchableOpacity>
                <View style={styles.workoutContent}>
                  <Text style={styles.workoutName}>
                    {workout.name || getDefaultWorkoutName(workout.endTime)}
                  </Text>
                  <Text style={styles.workoutDetails}>
                    {workout.duration > 0 ? formatDuration(workout.duration) : 'N/A'} • {Math.round(workout.finalCalories)} cal • {Math.round(workout.finalStepCount)} steps
                  </Text>
                </View>
              </View>
              <View style={styles.workoutRight}>
                <Text style={styles.workoutDate}>
                  {formatDate(workout.endTime)}
                </Text>
              </View>
            </View>
          ))}
          
          {/* View All / Show Less Button */}
          {allWorkouts.length > 5 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => setShowAllWorkouts(!showAllWorkouts)}
            >
              <Text style={styles.viewAllText}>
                {showAllWorkouts ? 'Show Less' : `View All (${allWorkouts.length - 5} more)`}
              </Text>
              <Ionicons 
                name={showAllWorkouts ? "chevron-up" : "chevron-down"} 
                size={18} 
                color={HaloFitColors.primary} 
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <Text style={{ color: HaloFitColors.textSecondary, marginBottom: 12 }}>
          {user?.isAnonymous ? 'Signed in as Guest' : user ? `Signed in: ${user.email ?? user.uid}` : 'Not signed in'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={{
              backgroundColor: HaloFitColors.primary,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
            }}
            onPress={() => {
              // Navigate to login screen
              // We use a dynamic import to avoid importing router at top-level for SSR safety
              import('expo-router').then(({ router }) => router.push('/login' as any));
            }}
          >
            <Text style={{ color: HaloFitColors.white, fontWeight: '700' }}>
              {user ? 'Switch Account' : 'Log In'}
            </Text>
          </TouchableOpacity>

          {user && (
            <TouchableOpacity
              style={{
                backgroundColor: HaloFitColors.accentLight,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: HaloFitColors.primary,
              }}
              onPress={async () => {
                try {
                  await signOut();
                } catch (e) {
                  Alert.alert('Sign out failed', 'Please try again.');
                }
              }}
            >
              <Text style={{ color: HaloFitColors.primary, fontWeight: '700' }}>Sign Out</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HaloFitColors.background,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: HaloFitColors.primary, // Hot pink background! 💕
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: HaloFitColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 4,
    borderColor: HaloFitColors.accentLight,
    shadowColor: HaloFitColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: HaloFitColors.white,
    marginBottom: 10,
  },
  firebaseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  firebaseStatusText: {
    fontSize: 14,
    marginLeft: 5,
    fontWeight: '600',
    color: HaloFitColors.white,
  },
  statsSection: {
    margin: 15,
    padding: 20,
    backgroundColor: HaloFitColors.cardBackground,
    borderRadius: 20,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: HaloFitColors.accentLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: HaloFitColors.textPrimary,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: HaloFitColors.accentLight,
    padding: 15,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  statDivider: {
    width: 1,
    backgroundColor: HaloFitColors.grayLight,
    marginHorizontal: 10,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: HaloFitColors.primary,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: HaloFitColors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  section: {
    margin: 15,
    padding: 20,
    backgroundColor: HaloFitColors.cardBackground,
    borderRadius: 15,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HaloFitColors.primary,
    margin: 15,
    padding: 18,
    borderRadius: 25,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  syncButtonText: {
    color: HaloFitColors.white,
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: HaloFitColors.textSecondary,
    marginBottom: 15,
    marginLeft: 32,
  },
  refreshGlobalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: HaloFitColors.primary,
    backgroundColor: HaloFitColors.accentLight,
  },
  refreshGlobalText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  allWorkoutsSection: {
    margin: 15,
    backgroundColor: HaloFitColors.cardBackground,
    borderRadius: 20,
    padding: 15,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: HaloFitColors.accentLight,
  },
  allWorkoutsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: HaloFitColors.accent,
  },
  allWorkoutsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: HaloFitColors.primary,
  },
  workoutCount: {
    fontSize: 14,
    color: HaloFitColors.textSecondary,
    marginLeft: 8,
    fontWeight: '600',
    backgroundColor: HaloFitColors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: HaloFitColors.accentLight,
    backgroundColor: HaloFitColors.white,
    borderRadius: 12,
    marginBottom: 8,
  },
  workoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workoutIcon: {
    marginRight: 12,
    backgroundColor: HaloFitColors.accentLight,
    padding: 8,
    borderRadius: 12,
  },
  workoutContent: {
    flex: 1,
  },
  workoutRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: HaloFitColors.textPrimary,
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 12,
    fontWeight: '600',
    color: HaloFitColors.primary,
    textAlign: 'right',
  },
  workoutDetails: {
    fontSize: 13,
    color: HaloFitColors.textSecondary,
    fontWeight: '500',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginTop: 10,
    borderTopWidth: 2,
    borderTopColor: HaloFitColors.accent,
    backgroundColor: HaloFitColors.accentLight,
    borderRadius: 15,
  },
  viewAllText: {
    fontSize: 16,
    color: HaloFitColors.primary,
    fontWeight: 'bold',
    marginRight: 6,
  },
  profileInfoSection: {
    margin: 15,
    padding: 20,
    backgroundColor: HaloFitColors.cardBackground,
    borderRadius: 20,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: HaloFitColors.accentLight,
  },
  profileInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  editIconButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  profileForm: {
    marginTop: 10,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: HaloFitColors.textPrimary,
    marginBottom: 8,
    marginTop: 12,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: HaloFitColors.primary,
    backgroundColor: HaloFitColors.white,
    gap: 8,
  },
  genderBtnActive: {
    backgroundColor: HaloFitColors.primary,
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
    color: HaloFitColors.primary,
  },
  genderTextActive: {
    color: HaloFitColors.white,
  },
  input: {
    backgroundColor: HaloFitColors.white,
    borderWidth: 2,
    borderColor: HaloFitColors.accentLight,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: HaloFitColors.textPrimary,
    marginBottom: 10,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HaloFitColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 15,
    marginTop: 20,
    gap: 8,
    shadowColor: HaloFitColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: HaloFitColors.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
  profileDisplay: {
    marginTop: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: HaloFitColors.accentLight,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '600',
    color: HaloFitColors.textPrimary,
  },
  noProfileText: {
    fontSize: 14,
    color: HaloFitColors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
