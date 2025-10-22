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
  serverTimestamp 
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
