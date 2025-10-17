// components/HaloFitBLE.tsx
import { Buffer } from 'buffer';
import { BleManager, Device, Characteristic, Subscription } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

// Correct UUIDs from LightBlue - NOTE: The service UUID starts with 6E, not 6C!
const NUS_SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const NUS_TX = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"; // TX characteristic (device sends data)
const NUS_RX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"; // RX characteristic (we send data)

export interface BLEData {
  heartRate: number;      // BPM from device
  calories: number;       // KCAL from device
  stepCount: number;      // Steps from device
  timestamp: number;      // Local timestamp when received
}

export class HaloFitBLEManager {
  private manager: BleManager;
  private device: Device | null = null;
  private onDataCallback?: (data: BLEData) => void;
  private onConnectionCallback?: (connected: boolean) => void;
  private monitorSubscription?: Subscription;
  private stateSubscription?: Subscription;
  private isDestroyed: boolean = false;

  constructor() {
    try {
      this.manager = new BleManager();
      console.log('BleManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize BleManager:', error);
      throw error;
    }
  }

  private cleanup() {
    if (this.monitorSubscription) {
      try {
        this.monitorSubscription.remove();
      } catch (e) {
        console.warn('Error removing monitor subscription:', e);
      }
      this.monitorSubscription = undefined;
    }

    if (this.stateSubscription) {
      try {
        this.stateSubscription.remove();
      } catch (e) {
        console.warn('Error removing state subscription:', e);
      }
      this.stateSubscription = undefined;
    }

    if (this.device) {
      try {
        this.device.cancelConnection().catch(() => {});
      } catch (e) {
        console.warn('Error cancelling connection:', e);
      }
      this.device = null;
    }
  }

  private handleOperationCancelled() {
    try {
      // Clean up current state
      this.cleanup();
      
      // Recreate the BLE manager
      console.log('Recreating BLE manager...');
      this.manager.destroy();
      this.manager = new BleManager();
      
      // Notify connection lost
      this.onConnectionCallback?.(false);
      
      // Optionally attempt to reconnect after a delay
      setTimeout(() => {
        if (!this.isDestroyed) {
          console.log('Attempting to reconnect...');
          this.connect();
        }
      }, 2000);
    } catch (error) {
      console.error('Error handling operation cancelled:', error);
    }
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
        // Android 12+
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        return (
          granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        // Android 11 and below
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true; // iOS handles permissions differently
  }

  async connect(): Promise<boolean> {
    if (this.isDestroyed) return false;

    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.error('Bluetooth permissions not granted');
        this.onConnectionCallback?.(false);
        return false;
      }

      console.log('Scanning for HaloFit device...');
      
      this.stateSubscription = this.manager.onStateChange((state) => {
        console.log('Bluetooth state:', state);
        if (state === 'PoweredOn') {
          this.scanAndConnect();
          if (this.stateSubscription) {
            this.stateSubscription.remove();
            this.stateSubscription = undefined;
          }
        } else if (state === 'PoweredOff') {
          console.error('Bluetooth is powered off');
          this.onConnectionCallback?.(false);
          if (this.stateSubscription) {
            this.stateSubscription.remove();
            this.stateSubscription = undefined;
          }
        }
      }, true);

      return true;
    } catch (error) {
      console.error('Connection failed:', error);
      this.onConnectionCallback?.(false);
      return false;
    }
  }

  private scanAndConnect() {
    if (this.isDestroyed) return;

    let deviceFound = false;
    let scanStopped = false;

    const stopScanning = () => {
      if (!scanStopped) {
        scanStopped = true;
        try {
          this.manager.stopDeviceScan();
          console.log('Device scan stopped');
        } catch (error) {
          console.warn('Error stopping device scan:', error);
        }
      }
    };

    try {
      this.manager.startDeviceScan(null, null, async (error, device) => {
        if (this.isDestroyed || scanStopped) return;

        if (error) {
          console.error('Scan error:', error);
          stopScanning();
          this.onConnectionCallback?.(false);
          return;
        }

        // Look for device with name containing "HaloFit"
        if (device?.name && device.name.includes('HaloFit') && !deviceFound) {
          deviceFound = true;
          console.log('Found HaloFit device:', device.name);
          stopScanning();

          try {
            // Connect to device
            console.log('Attempting to connect...');
            this.device = await device.connect();
            console.log('Connected to device');

            // Discover services and characteristics
            console.log('Discovering services...');
            await this.device.discoverAllServicesAndCharacteristics();
            console.log('Services discovered');

            // Start listening for notifications first
            console.log('Setting up notifications...');
            await this.startNotifications();

            // Only call connection callback after everything is set up
            this.onConnectionCallback?.(true);
            console.log('Device fully connected and ready');
          } catch (err) {
            console.error('Failed to connect or setup device:', err);
            this.device = null;
            this.onConnectionCallback?.(false);
          }
        }
      });

      // Stop scanning after 15 seconds if device not found
      setTimeout(() => {
        if (!deviceFound && !scanStopped) {
          console.log('Scan timeout: Device not found after 15 seconds');
          stopScanning();
          if (!this.device) {
            this.onConnectionCallback?.(false);
          }
        }
      }, 15000);
    } catch (error) {
      console.error('Error starting device scan:', error);
      stopScanning();
      this.onConnectionCallback?.(false);
    }
  }

  private async startNotifications() {
    if (!this.device || this.isDestroyed) {
      console.warn('Cannot start notifications: device not available');
      return;
    }

    try {
      // Remove existing subscription if any
      if (this.monitorSubscription) {
        try {
          this.monitorSubscription.remove();
        } catch (e) {
          console.warn('Error removing old subscription:', e);
        }
        this.monitorSubscription = undefined;
      }

      console.log(`Starting notifications for service: ${NUS_SERVICE}, characteristic: ${NUS_TX}`);

      this.monitorSubscription = this.device.monitorCharacteristicForService(
        NUS_SERVICE,
        NUS_TX,
        (error, characteristic) => {
          if (this.isDestroyed) return;
          
          if (error) {
            // Handle "Operation was cancelled" error by recreating the manager
            if (error.message && error.message.includes('Operation was cancelled')) {
              console.warn('BLE operation was cancelled, attempting to recover...');
              this.handleOperationCancelled();
              return;
            }
            console.error('Monitor error:', error);
            return;
          }

          if (characteristic?.value) {
            this.handleDataReceived(characteristic.value);
          }
        }
      );

      console.log('Started monitoring characteristic successfully');
    } catch (error: any) {
      console.error('Failed to start notifications:', error);
      throw error; // Re-throw so caller knows it failed
    }
  }

  private handleDataReceived(base64Value: string) {
    try {
      // Decode base64 to string
      const decodedData = Buffer.from(base64Value, 'base64').toString('utf-8');
      console.log('Received raw data:', decodedData);
      
      // Try parsing as JSON first
      try {
        const data = JSON.parse(decodedData);
        
        const parsedData: BLEData = {
          heartRate: data.hr || data.heartRate || 0,
          calories: data.cal || data.calories || 0,
          stepCount: data.steps || data.stepCount || 0,
          timestamp: Date.now(),
        };

        console.log('Parsed data:', parsedData);
        this.onDataCallback?.(parsedData);
      } catch (jsonError) {
        // If JSON parsing fails, try comma-separated format
        // Example: "HR:75,CAL:120,STEPS:1500"
        const parts = decodedData.split(',');
        
        const parsedData: BLEData = {
          heartRate: parseInt(parts[0]?.split(':')[1]) || 0,
          calories: parseInt(parts[1]?.split(':')[1]) || 0,
          stepCount: parseInt(parts[2]?.split(':')[1]) || 0,
          timestamp: Date.now(),
        };
        
        console.log('Parsed data (CSV format):', parsedData);
        this.onDataCallback?.(parsedData);
      }
    } catch (error) {
      console.error('Error parsing data:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.isDestroyed) return;
    
    try {
      this.cleanup();
      this.onConnectionCallback?.(false);
      console.log('Disconnected from HaloFit device');
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }

  isConnected(): boolean {
    return this.device !== null;
  }

  destroy() {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    
    try {
      this.cleanup();
      
      // Destroy manager last, after all other cleanup is done
      if (this.manager) {
        this.manager.destroy();
      }
    } catch (error) {
      console.warn('Error during destroy:', error);
    }
  }
}