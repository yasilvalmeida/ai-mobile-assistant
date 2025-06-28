import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock react-native-permissions
jest.mock('react-native-permissions', () =>
  require('react-native-permissions/mock')
);

// Mock react-native-vision-camera
jest.mock('react-native-vision-camera', () => ({
  Camera: {
    getCameraDevice: jest.fn(() => ({
      id: 'mock-camera',
      name: 'Mock Camera',
      position: 'back',
    })),
    requestCameraPermission: jest.fn(() => Promise.resolve('granted')),
  },
  useCameraDevices: jest.fn(() => ({
    back: {
      id: 'mock-camera',
      name: 'Mock Camera',
      position: 'back',
    },
  })),
  useFrameProcessor: jest.fn(),
}));

// Mock react-native-location
jest.mock('react-native-location', () => ({
  configure: jest.fn(),
  requestPermission: jest.fn(() => Promise.resolve(true)),
  getCurrentLocation: jest.fn(() => Promise.resolve({
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 5,
    timestamp: Date.now(),
  })),
  subscribeToLocationUpdates: jest.fn(),
}));

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const MockMapView = 'MapView';
  const MockMarker = 'Marker';
  const MockPolyline = 'Polyline';
  
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Polyline: MockPolyline,
  };
});

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
  MediaType: {
    photo: 'photo',
    video: 'video',
    mixed: 'mixed',
  },
}));

// Mock react-native-document-picker
jest.mock('react-native-document-picker', () => ({
  pick: jest.fn(),
  types: {
    images: 'images',
    pdf: 'pdf',
    allFiles: 'allFiles',
  },
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    type: 'wifi',
    isInternetReachable: true,
  })),
  addEventListener: jest.fn(() => jest.fn()),
  useNetInfo: jest.fn(() => ({
    isConnected: true,
    type: 'wifi',
    isInternetReachable: true,
  })),
}));

// Mock Tesseract.js
jest.mock('tesseract.js', () => ({
  recognize: jest.fn(() => Promise.resolve({
    data: {
      text: 'Mock OCR text',
      confidence: 95,
      words: [
        {
          text: 'Mock',
          confidence: 95,
          bbox: { x0: 0, y0: 0, x1: 50, y1: 20 },
        },
        {
          text: 'OCR',
          confidence: 95,
          bbox: { x0: 55, y0: 0, x1: 85, y1: 20 },
        },
        {
          text: 'text',
          confidence: 95,
          bbox: { x0: 90, y0: 0, x1: 120, y1: 20 },
        },
      ],
    },
  })),
}));

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Flipper
global.__DEV__ = true; 