import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';
import { GPSLocation } from '../../../shared/src/types';
import { LOCATION_CONFIG } from '../config/constants';

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

interface GeolocationError {
  code: number;
  message: string;
}

class LocationServiceClass {
  private watchId: number | null = null;
  private locationCallbacks: ((location: GPSLocation) => void)[] = [];

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location for field reports.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS permissions handled via Info.plist
  }

  async getCurrentLocation(): Promise<GPSLocation> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const location: GPSLocation = {
            id: `loc_${Date.now()}`,
            userId: '', // Will be set by the calling code
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude || undefined,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp),
          };
          resolve(location);
        },
        (error: GeolocationError) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        {
          enableHighAccuracy: LOCATION_CONFIG.enableHighAccuracy,
          timeout: LOCATION_CONFIG.timeout,
          maximumAge: LOCATION_CONFIG.maximumAge,
        }
      );
    });
  }

  startTracking(callback: (location: GPSLocation) => void): void {
    this.locationCallbacks.push(callback);

    if (this.watchId === null) {
      this.watchId = Geolocation.watchPosition(
        (position: GeolocationPosition) => {
          const location: GPSLocation = {
            id: `loc_${Date.now()}`,
            userId: '',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude || undefined,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp),
          };

          this.locationCallbacks.forEach((cb) => cb(location));
        },
        (error: GeolocationError) => {
          console.error('Location tracking error:', error);
        },
        {
          enableHighAccuracy: LOCATION_CONFIG.enableHighAccuracy,
          distanceFilter: LOCATION_CONFIG.distanceFilter,
        }
      );
    }
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.locationCallbacks = [];
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();

      if (data.display_name) {
        // Simplify the address
        const parts = data.display_name.split(', ');
        if (parts.length >= 3) {
          return `${parts[0]}, ${parts[1]}, ${parts[2]}`;
        }
        return data.display_name;
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const LocationService = new LocationServiceClass();
