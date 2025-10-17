// components/HaloFitBLE.tsx - REWRITTEN FOR RELIABILITY
import { Buffer } from 'buffer';
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

// CORRECT UUIDs from LightBlue inspection
const SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const TX_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"; // Device transmits to us
const RX_CHAR_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"; // We transmit to device

export interface BLEData {
  heartRate: number;
  calories: number;
  stepCount: number;
  timestamp: number;
}

export class HaloFitBLEManager {
  private manager: BleManager;
  private device: Device | null = null;
  private subscription: Subscription | null = null;
  
  private onDataCallback?: (data: BLEData) => void;
  private onConnectionCallback?: (connected: boolean) => void;

  constructor() {
    this.manager = new BleManager();
    console.log('✅ BLE Manager created');
  }

  setOnDataReceived(callback: (data: BLEData) => void) {
    this.onDataCallback = callback;
  }

  setOnConnectionChange(callback: (connected: boolean) => void) {
    this.onConnectionCallback = callback;
  }

  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(result).every(r => r === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true; // iOS handles permissions via Info.plist
  }

  async connect(): Promise<boolean> {
    console.log('🔍 Starting connection process...');

    // Step 1: Request permissions
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      console.log('❌ Permissions denied');
      this.onConnectionCallback?.(false);
      return false;
    }
    console.log('✅ Permissions granted');

    // Step 2: Check Bluetooth state
    const state = await this.manager.state();
    console.log('📡 Bluetooth state:', state);
    
    if (state !== 'PoweredOn') {
      console.log('❌ Bluetooth is not powered on');
      this.onConnectionCallback?.(false);
      return false;
    }

    // Step 3: Scan for HaloFit Headband
    return new Promise<boolean>((resolve) => {
      console.log('🔍 Scanning for HaloFit Headband...');
      let found = false;

      this.manager.startDeviceScan(null, null, async (error, scannedDevice) => {
        if (error) {
          console.log('❌ Scan error:', error);
          this.manager.stopDeviceScan();
          this.onConnectionCallback?.(false);
          resolve(false);
          return;
        }

        // Look for device named "HaloFit Headband"
        if (scannedDevice?.name === 'HaloFit Headband' && !found) {
          found = true;
          console.log('✅ Found HaloFit Headband!');
          console.log('   Device ID:', scannedDevice.id);
          this.manager.stopDeviceScan();

          try {
            // Step 4: Connect to device
            console.log('🔗 Connecting to device...');
            this.device = await scannedDevice.connect();
            console.log('✅ Connected!');

            // Step 5: Discover services
            console.log('🔍 Discovering services...');
            await this.device.discoverAllServicesAndCharacteristics();
            console.log('✅ Services discovered');

            // Step 6: Verify the service exists
            const services = await this.device.services();
            const targetService = services.find(s => 
              s.uuid.toLowerCase() === SERVICE_UUID.toLowerCase()
            );
            
            if (!targetService) {
              console.log('❌ Service not found on device');
              console.log('Available services:', services.map(s => s.uuid));
              this.onConnectionCallback?.(false);
              resolve(false);
              return;
            }
            console.log('✅ Found target service:', targetService.uuid);

            // Step 7: Get characteristics
            const characteristics = await this.device.characteristicsForService(SERVICE_UUID);
            console.log('✅ Found characteristics:', characteristics.map(c => c.uuid));

            // Step 8: Start monitoring notifications
            console.log('📡 Setting up notifications...');
            this.subscription = this.device.monitorCharacteristicForService(
              SERVICE_UUID,
              TX_CHAR_UUID,
              (error, characteristic) => {
                if (error) {
                  console.log('❌ Monitor error:', error);
                  return;
                }
                if (characteristic?.value) {
                  this.handleDataReceived(characteristic.value);
                }
              }
            );
            console.log('✅ Notifications active!');

            // Step 9: Notify success
            this.onConnectionCallback?.(true);
            resolve(true);

          } catch (err) {
            console.log('❌ Connection failed:', err);
            this.device = null;
            this.onConnectionCallback?.(false);
            resolve(false);
          }
        }
      });

      // Timeout after 15 seconds
      setTimeout(() => {
        if (!found) {
          console.log('⏱️ Scan timeout - device not found');
          this.manager.stopDeviceScan();
          this.onConnectionCallback?.(false);
          resolve(false);
        }
      }, 15000);
    });
  }

  private handleDataReceived(base64Value: string) {
    try {
      const decoded = Buffer.from(base64Value, 'base64').toString('utf-8');
      console.log('📨 Received data:', decoded);

      // Try parsing as JSON first
      try {
        const json = JSON.parse(decoded);
        const data: BLEData = {
          heartRate: json.hr || json.heartRate || 0,
          calories: json.cal || json.calories || 0,
          stepCount: json.steps || json.stepCount || 0,
          timestamp: Date.now(),
        };
        console.log('📊 Parsed data:', data);
        this.onDataCallback?.(data);
      } catch {
        // Try CSV format: "HR:75,CAL:120,STEPS:1500"
        const parts = decoded.split(',');
        const data: BLEData = {
          heartRate: parseInt(parts[0]?.split(':')[1]) || 0,
          calories: parseInt(parts[1]?.split(':')[1]) || 0,
          stepCount: parseInt(parts[2]?.split(':')[1]) || 0,
          timestamp: Date.now(),
        };
        console.log('📊 Parsed data (CSV):', data);
        this.onDataCallback?.(data);
      }
    } catch (error) {
      console.log('❌ Parse error:', error);
    }
  }

  async disconnect(): Promise<void> {
    console.log('🔌 Disconnecting...');
    
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }

    if (this.device) {
      await this.device.cancelConnection();
      this.device = null;
    }

    this.onConnectionCallback?.(false);
    console.log('✅ Disconnected');
  }

  isConnected(): boolean {
    return this.device !== null;
  }

  destroy() {
    console.log('🗑️ Destroying BLE manager...');
    if (this.subscription) {
      this.subscription.remove();
    }
    if (this.device) {
      this.device.cancelConnection().catch(() => {});
    }
    this.manager.destroy();
  }
}
