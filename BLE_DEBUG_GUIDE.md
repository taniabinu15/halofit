# BLE Connection Debug Guide

## Recent Changes to Fix Connection Issues

### 1. Enhanced Logging
- Added detailed console logs throughout the connection flow
- Logs Bluetooth state changes (PoweredOn, PoweredOff, etc.)
- Logs each step: scanning, device found, connecting, service discovery, notifications setup

### 2. Improved Error Handling
- Wrapped all BLE operations in try-catch blocks
- Added specific handling for "Operation was cancelled" errors
- Added handling for "Unknown error" from BleManager
- Added safety timeout (20 seconds) in RecordScreen

### 3. Better Scan Management
- Added `scanStopped` flag to prevent duplicate stop calls
- Wrapped `stopDeviceScan()` in try-catch
- Added device found flag to prevent duplicate connection attempts
- Increased scan timeout to 15 seconds

### 4. Connection State Management
- Connection callback only fires after ALL setup is complete (including notifications)
- Properly cleanup subscriptions before destroying manager
- Added `isDestroyed` flag to prevent operations after cleanup

## How to Debug

### Check Console Logs
When you press "Pair Bluetooth Device", you should see this sequence:

```
1. "Scanning for HaloFit device..."
2. "Bluetooth state: PoweredOn" (or PoweredOff if BT is off)
3. "Found HaloFit device: [device name]"
4. "Device scan stopped"
5. "Attempting to connect..."
6. "Connected to device"
7. "Discovering services..."
8. "Services discovered"
9. "Setting up notifications..."
10. "Starting notifications for service: [UUID], characteristic: [UUID]"
11. "Started monitoring characteristic successfully"
12. "Device fully connected and ready"
13. Connection state changed: true
```

### Common Issues and Solutions

#### Issue: Stuck on "Searching..." forever
**Possible causes:**
- Bluetooth is off → Check for "Bluetooth state: PoweredOff" in logs
- Device not in range → No "Found HaloFit device" log appears
- Device name doesn't contain "HaloFit" → Check actual device name in logs
- Connection callback never fires → Check for errors in steps 5-12

**Solution:**
- Ensure Bluetooth is on
- Ensure device is powered on and in range
- Check device name matches the search pattern
- Look for specific error messages in console

#### Issue: "Unknown error occurred" BleError
**Possible causes:**
- BleManager in bad state
- Previous connection not properly cleaned up
- Service/characteristic UUIDs don't match device

**Solution:**
- Close and restart the app
- Check that device UUIDs match:
  - Service: `6c400001-b5a3-f393-e0a9-e50e24dcca9e`
  - TX Characteristic: `6c400003-b5a3-f393-e0a9-e50e24dcca9e`

#### Issue: Connects but no data received
**Possible causes:**
- Notifications not properly set up
- Data format doesn't match parser expectations

**Solution:**
- Check for "Started monitoring characteristic successfully" in logs
- Check "Received raw data:" logs to see what format data arrives in

### Testing Checklist

1. ✅ Bluetooth is enabled on device
2. ✅ App has Bluetooth permissions
3. ✅ HaloFit headband is powered on
4. ✅ HaloFit headband is in range (< 10 meters)
5. ✅ No other app is connected to HaloFit headband
6. ✅ Console shows detailed logs
7. ✅ Watch for 20 second timeout

### Next Steps if Still Failing

If the device still gets stuck on "Searching...":

1. **Check the exact error message** in console logs
2. **Note which step fails** (connection? service discovery? notifications?)
3. **Try these recovery steps:**
   - Force close the app completely
   - Turn Bluetooth off and on
   - Restart the HaloFit headband
   - Clear app data/cache
   - Reinstall the app

4. **Get device information:**
   - What is the exact name of your HaloFit device?
   - Can you see it in your phone's Bluetooth settings?
   - Can other BLE apps connect to it?

## Service UUIDs

Current UUIDs in code:
- NUS_SERVICE: `6c400001-b5a3-f393-e0a9-e50e24dcca9e`
- NUS_TX: `6c400003-b5a3-f393-e0a9-e50e24dcca9e`
- NUS_RX: `6e400002-b5a3-f393-e0a9-e50e24dcca9e`

These are Nordic UART Service (NUS) UUIDs. Verify your device uses these UUIDs.
