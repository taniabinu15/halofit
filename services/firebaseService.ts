// services/firebaseService.ts
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  serverTimestamp,
  collectionGroup
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { WorkoutSession } from '../components/WorkoutDataContext';
import { BLEData } from '../components/HaloFitBLE';

// Initialize anonymous authentication
let currentUser: User | null = null;

export const initFirebaseAuth = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        console.log('✅ Firebase: User authenticated:', user.uid);
        resolve(user);
      } else {
        // Sign in anonymously
        try {
          const userCredential = await signInAnonymously(auth);
          currentUser = userCredential.user;
          console.log('✅ Firebase: Anonymous sign-in successful:', currentUser.uid);
          resolve(currentUser);
        } catch (error) {
          console.error('❌ Firebase: Auth error:', error);
          resolve(null);
        }
      }
    });
  });
};

// Get the current user ID (for data scoping)
export const getUserId = (): string | null => {
  return currentUser?.uid || null;
};

// Save workout session to Firebase
export const saveWorkoutToFirebase = async (
  workout: WorkoutSession
): Promise<boolean> => {
  try {
    const userId = getUserId();
    if (!userId) {
      console.warn('⚠️ Firebase: No user authenticated, skipping save');
      return false;
    }

    // Reference to user's workouts collection
    const workoutsRef = collection(db, 'users', userId, 'workouts');

    // Prepare workout data for Firebase
    const workoutData = {
      ...workout,
      userId: userId,
      createdAt: serverTimestamp(), // Server timestamp for consistency
      syncedAt: Timestamp.now(),
    };

    // Add document with auto-generated ID
    const docRef = await addDoc(workoutsRef, workoutData);
    
    console.log('✅ Firebase: Workout saved successfully:', docRef.id);
    return true;
  } catch (error) {
    console.error('❌ Firebase: Error saving workout:', error);
    return false;
  }
};

// Save individual BLE data point to Firebase (real-time tracking)
export const saveBLEDataToFirebase = async (
  workoutId: string,
  bleData: BLEData
): Promise<boolean> => {
  try {
    const userId = getUserId();
    if (!userId) {
      console.warn('⚠️ Firebase: No user authenticated, skipping BLE data save');
      return false;
    }

    // Reference to specific workout's data points subcollection
    const dataPointsRef = collection(
      db, 
      'users', 
      userId, 
      'workouts', 
      workoutId, 
      'dataPoints'
    );

    const dataPoint = {
      ...bleData,
      savedAt: serverTimestamp(),
    };

    await addDoc(dataPointsRef, dataPoint);
    console.log('✅ Firebase: BLE data point saved');
    return true;
  } catch (error) {
    console.error('❌ Firebase: Error saving BLE data:', error);
    return false;
  }
};

// Fetch all workouts for current user
export const fetchWorkoutsFromFirebase = async (): Promise<WorkoutSession[]> => {
  try {
    const userId = getUserId();
    if (!userId) {
      console.warn('⚠️ Firebase: No user authenticated');
      return [];
    }

    const workoutsRef = collection(db, 'users', userId, 'workouts');
    const q = query(workoutsRef, orderBy('startTime', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const workouts: WorkoutSession[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      workouts.push({
        id: data.id,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration,
        dataPoints: data.dataPoints || [],
        finalHeartRate: data.finalHeartRate,
        finalCalories: data.finalCalories,
        finalStepCount: data.finalStepCount,
        avgHeartRate: data.avgHeartRate,
      });
    });

    console.log(`✅ Firebase: Fetched ${workouts.length} workouts`);
    return workouts;
  } catch (error) {
    console.error('❌ Firebase: Error fetching workouts:', error);
    return [];
  }
};

// Save user profile/settings
export const saveUserProfile = async (profileData: {
  name?: string;
  email?: string;
  age?: number;
  weight?: number;
  height?: number;
}): Promise<boolean> => {
  try {
    const userId = getUserId();
    if (!userId) {
      console.warn('⚠️ Firebase: No user authenticated');
      return false;
    }

    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    console.log('✅ Firebase: User profile saved');
    return true;
  } catch (error) {
    console.error('❌ Firebase: Error saving profile:', error);
    return false;
  }
};

// Batch sync local data to Firebase
export const syncLocalWorkoutsToFirebase = async (
  localWorkouts: WorkoutSession[]
): Promise<number> => {
  let syncedCount = 0;
  
  for (const workout of localWorkouts) {
    const success = await saveWorkoutToFirebase(workout);
    if (success) syncedCount++;
  }

  console.log(`✅ Firebase: Synced ${syncedCount}/${localWorkouts.length} workouts`);
  return syncedCount;
};

// Update workout name in Firebase
export const updateWorkoutNameInFirebase = async (
  workoutId: string,
  newName: string
): Promise<boolean> => {
  try {
    const userId = getUserId();
    if (!userId) {
      console.warn('⚠️ Firebase: No user authenticated');
      return false;
    }

    // Find the workout document by ID
    const workoutsRef = collection(db, 'users', userId, 'workouts');
    const q = query(workoutsRef, where('id', '==', workoutId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn('⚠️ Firebase: Workout not found');
      return false;
    }

    // Update the first matching document
    const workoutDoc = querySnapshot.docs[0];
    await setDoc(doc(db, 'users', userId, 'workouts', workoutDoc.id), {
      name: newName,
    }, { merge: true });

    console.log('✅ Firebase: Workout name updated');
    return true;
  } catch (error) {
    console.error('❌ Firebase: Error updating workout name:', error);
    return false;
  }
};

// Fetch global statistics from all users
export const fetchGlobalStatsFromFirebase = async (): Promise<{
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
  totalSteps: number;
  avgHeartRate: number;
} | null> => {
  try {
    console.log('🌍 Firebase: Fetching global stats from all users...');
    
    // Use collectionGroup to query all workouts across all users
    const workoutsQuery = query(collection(db, 'workouts'));
    
    // First try: Query using collection group (more efficient)
    let allWorkouts: any[] = [];
    
    try {
      // Try collection group approach
      const workoutsRef = collectionGroup(db, 'workouts');
      const workoutsSnapshot = await getDocs(workoutsRef);
      allWorkouts = workoutsSnapshot.docs.map(doc => doc.data());
      console.log(`📊 Found ${allWorkouts.length} total workouts using collectionGroup`);
    } catch (collectionGroupError) {
      console.log('⚠️ collectionGroup failed, falling back to manual user iteration');
      
      // Fallback: Manually query each user
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      console.log(`📊 Found ${usersSnapshot.docs.length} users in database`);
      
      // Iterate through each user
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        console.log(`   Checking user: ${userId}`);
        
        // Query all workouts for this user
        const workoutsRef = collection(db, 'users', userId, 'workouts');
        const workoutsSnapshot = await getDocs(workoutsRef);
        
        console.log(`   - Found ${workoutsSnapshot.docs.length} workouts for user ${userId}`);
        
        workoutsSnapshot.forEach((workoutDoc) => {
          allWorkouts.push(workoutDoc.data());
        });
      }
    }
    
    // Aggregate all workouts
    let totalWorkouts = allWorkouts.length;
    let totalDuration = 0;
    let totalCalories = 0;
    let totalSteps = 0;
    let totalHeartRateSum = 0;
    let heartRateCount = 0;

    allWorkouts.forEach((workout) => {
      console.log(`   - Processing workout:`, {
        duration: workout.duration,
        calories: workout.finalCalories,
        steps: workout.finalStepCount,
        avgHR: workout.avgHeartRate
      });
      
      totalDuration += workout.duration || 0;
      totalCalories += workout.finalCalories || 0;
      totalSteps += workout.finalStepCount || 0;
      
      if (workout.avgHeartRate && workout.avgHeartRate > 0) {
        totalHeartRateSum += workout.avgHeartRate;
        heartRateCount++;
      }
    });

    const avgHeartRate = heartRateCount > 0 
      ? Math.round(totalHeartRateSum / heartRateCount) 
      : 0;

    const globalStats = {
      totalWorkouts,
      totalDuration,
      totalCalories: Math.round(totalCalories),
      totalSteps,
      avgHeartRate,
    };

    console.log('✅ Firebase: Global stats calculated:', globalStats);
    return globalStats;
  } catch (error) {
    console.error('❌ Firebase: Error fetching global stats:', error);
    return null;
  }
};

// Fetch weekly workouts from all users (Monday to Sunday of current week)
export const fetchWeeklyWorkoutsFromAllUsers = async (): Promise<WorkoutSession[]> => {
  try {
    console.log('📅 Firebase: Fetching weekly workouts from all users...');
    
    // Calculate Monday of current week (start of week)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0); // Start of Monday
    
    // Calculate Sunday of current week (end of week)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999); // End of Sunday
    
    console.log(`📅 Week range: ${monday.toLocaleDateString()} to ${sunday.toLocaleDateString()}`);
    console.log(`📅 Timestamp range: ${monday.getTime()} to ${sunday.getTime()}`);
    
    const weekStartTimestamp = monday.getTime();
    const weekEndTimestamp = sunday.getTime();
    
    let allWeeklyWorkouts: WorkoutSession[] = [];
    
    try {
      // Try collectionGroup approach for efficiency
      const workoutsRef = collectionGroup(db, 'workouts');
      const workoutsSnapshot = await getDocs(workoutsRef);
      
      console.log(`📊 Total workouts in database: ${workoutsSnapshot.docs.length}`);
      
      // Filter for workouts within the current week
      workoutsSnapshot.forEach((doc) => {
        const workout = doc.data();
        const workoutTime = workout.endTime || workout.startTime;
        
        if (workoutTime >= weekStartTimestamp && workoutTime <= weekEndTimestamp) {
          allWeeklyWorkouts.push({
            id: workout.id,
            name: workout.name,
            startTime: workout.startTime,
            endTime: workout.endTime,
            duration: workout.duration,
            dataPoints: workout.dataPoints || [],
            finalHeartRate: workout.finalHeartRate,
            finalCalories: workout.finalCalories,
            finalStepCount: workout.finalStepCount,
            avgHeartRate: workout.avgHeartRate,
          });
        }
      });
      
      console.log(`✅ Found ${allWeeklyWorkouts.length} workouts in current week`);
    } catch (collectionGroupError) {
      console.log('⚠️ collectionGroup failed, falling back to manual user iteration');
      
      // Fallback: Manually query each user
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const workoutsRef = collection(db, 'users', userId, 'workouts');
        const workoutsSnapshot = await getDocs(workoutsRef);
        
        workoutsSnapshot.forEach((workoutDoc) => {
          const workout = workoutDoc.data();
          const workoutTime = workout.endTime || workout.startTime;
          
          if (workoutTime >= weekStartTimestamp && workoutTime <= weekEndTimestamp) {
            allWeeklyWorkouts.push({
              id: workout.id,
              name: workout.name,
              startTime: workout.startTime,
              endTime: workout.endTime,
              duration: workout.duration,
              dataPoints: workout.dataPoints || [],
              finalHeartRate: workout.finalHeartRate,
              finalCalories: workout.finalCalories,
              finalStepCount: workout.finalStepCount,
              avgHeartRate: workout.avgHeartRate,
            });
          }
        });
      }
    }
    
    // Sort by endTime descending (most recent first)
    allWeeklyWorkouts.sort((a, b) => b.endTime - a.endTime);
    
    console.log(`✅ Returning ${allWeeklyWorkouts.length} weekly workouts`);
    return allWeeklyWorkouts;
  } catch (error) {
    console.error('❌ Firebase: Error fetching weekly workouts:', error);
    return [];
  }
};

// Fetch all workouts from all users (ever)
export const fetchAllWorkoutsFromAllUsers = async (): Promise<WorkoutSession[]> => {
  try {
    console.log('📊 Firebase: Fetching all workouts from all users...');
    
    let allWorkouts: WorkoutSession[] = [];
    
    try {
      // Try collectionGroup approach for efficiency
      const workoutsRef = collectionGroup(db, 'workouts');
      const workoutsSnapshot = await getDocs(workoutsRef);
      
      console.log(`📊 Total workouts in database: ${workoutsSnapshot.docs.length}`);
      
      // Map all workouts
      workoutsSnapshot.forEach((doc) => {
        const workout = doc.data();
        allWorkouts.push({
          id: workout.id,
          name: workout.name,
          startTime: workout.startTime,
          endTime: workout.endTime,
          duration: workout.duration,
          dataPoints: workout.dataPoints || [],
          finalHeartRate: workout.finalHeartRate,
          finalCalories: workout.finalCalories,
          finalStepCount: workout.finalStepCount,
          avgHeartRate: workout.avgHeartRate,
        });
      });
      
      console.log(`✅ Found ${allWorkouts.length} total workouts`);
    } catch (collectionGroupError) {
      console.log('⚠️ collectionGroup failed, falling back to manual user iteration');
      
      // Fallback: Manually query each user
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const workoutsRef = collection(db, 'users', userId, 'workouts');
        const workoutsSnapshot = await getDocs(workoutsRef);
        
        workoutsSnapshot.forEach((workoutDoc) => {
          const workout = workoutDoc.data();
          allWorkouts.push({
            id: workout.id,
            name: workout.name,
            startTime: workout.startTime,
            endTime: workout.endTime,
            duration: workout.duration,
            dataPoints: workout.dataPoints || [],
            finalHeartRate: workout.finalHeartRate,
            finalCalories: workout.finalCalories,
            finalStepCount: workout.finalStepCount,
            avgHeartRate: workout.avgHeartRate,
          });
        });
      }
    }
    
    // Sort by endTime descending (most recent first)
    allWorkouts.sort((a, b) => b.endTime - a.endTime);
    
    console.log(`✅ Returning ${allWorkouts.length} total workouts`);
    return allWorkouts;
  } catch (error) {
    console.error('❌ Firebase: Error fetching all workouts:', error);
    return [];
  }
};
