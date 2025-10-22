# Firebase Quick Start - HaloFit

## 🚀 Quick Setup (5 minutes)

### 1. Create Firebase Project
- Go to: https://console.firebase.google.com/
- Create project: "HaloFit"
- Add iOS app: Bundle ID `com.anonymous.halofit`
- Add Android app: Package `com.anonymous.halofit`

### 2. Enable Services
- **Firestore**: Build → Firestore Database → Create (Production mode)
- **Authentication**: Build → Authentication → Anonymous → Enable

### 3. Get Config
- Project Settings → Your apps → Web app
- Copy `firebaseConfig` object
- Paste into `config/firebase.ts`

### 4. Set Security Rules
- Firestore Database → Rules
- Copy from `firestore.rules` file
- Publish

### 5. Download Credentials
- Download `GoogleService-Info.plist` → save to `ios/halofit/`
- Download `google-services.json` → save to `android/app/`

---

## ✅ Verify It's Working

After recording a workout, check Firebase Console:
```
Firestore Database → Data
  users/
    [your-user-id]/
      workouts/
        [workout-doc] ← You should see your workout here!
```

---

## 🔒 Security Summary

**What's Protected:**
✅ Each user can only access their own data
✅ Anonymous authentication required
✅ Server-side timestamps prevent tampering
✅ Firebase config safe to commit (API keys aren't secrets for client apps)

**What NOT to Commit:**
❌ `google-services.json`
❌ `GoogleService-Info.plist`

*(Already added to .gitignore)*

---

## 📊 How Data Flows

```
HaloFit Headband
    ↓ (BLE)
HaloFitBLE.tsx
    ↓
RecordScreen.tsx (displays live data)
    ↓
WorkoutDataContext.tsx (saves)
    ↓ (parallel)
├─→ AsyncStorage (local backup)
└─→ Firebase Firestore (cloud sync) ← NEW!
    ↓
Available on any device with same user
```

---

## 🎯 What You Get

1. **Cloud Backup** - Never lose workout data
2. **Automatic Sync** - Happens after each workout
3. **Secure Storage** - User-scoped data
4. **Future Ready** - Can add cross-device sync later

---

## 🛠️ Commands

```bash
# Install dependencies (already done)
npm install firebase

# View logs
npx expo start

# Rebuild native apps
npm run ios
npm run android
```

---

## 📱 Testing

1. **Record a workout** in the app
2. **Check console logs** for:
   - ✅ `Firebase: User authenticated`
   - ✅ `Workout synced to Firebase`
3. **Open Firebase Console** and verify data appears

---

## 🆘 Quick Fixes

| Problem | Solution |
|---------|----------|
| "Firebase not initialized" | Replace config in `config/firebase.ts` |
| "Permission denied" | Enable Anonymous auth in Firebase Console |
| "Module not found" | Run `npm install` |
| Data not saving | Check Firestore rules are published |

---

## 📚 Full Documentation

See `FIREBASE_SETUP.md` for detailed instructions.
