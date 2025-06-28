import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';

import { DashboardScreen } from '../DashboardScreen';
import authReducer from '../../../store/slices/authSlice';
import reportsReducer from '../../../store/slices/reportsSlice';
import locationsReducer from '../../../store/slices/locationsSlice';
import syncReducer from '../../../store/slices/syncSlice';
import { LocationService } from '../../../services/LocationService';
import { SyncService } from '../../../services/SyncService';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock services
jest.mock('../../../services/LocationService', () => ({
  LocationService: {
    getCurrentLocation: jest.fn(),
    reverseGeocode: jest.fn(),
  },
}));

jest.mock('../../../services/SyncService', () => ({
  SyncService: {
    syncAll: jest.fn(),
  },
}));

const mockedLocationService = LocationService as jest.Mocked<typeof LocationService>;
const mockedSyncService = SyncService as jest.Mocked<typeof SyncService>;

describe('DashboardScreen', () => {
  let store: ReturnType<typeof configureStore>;

  const mockUser = {
    id: '1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'FIELD_AGENT' as any,
    organizationId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReports = [
    {
      id: '1',
      title: 'Weekly Inspection Report',
      description: 'Routine inspection of equipment',
      status: 'COMPLETED' as any,
      priority: 'MEDIUM' as any,
      category: 'INSPECTION' as any,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      userId: '1',
      locationId: '1',
      attachments: [],
      ocrResults: [],
      aiSummary: null,
      aiSuggestions: [],
      syncedAt: null,
    },
    {
      id: '2',
      title: 'Safety Check',
      description: 'Daily safety inspection',
      status: 'IN_PROGRESS' as any,
      priority: 'HIGH' as any,
      category: 'INSPECTION' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: '1',
      locationId: '2',
      attachments: [],
      ocrResults: [],
      aiSummary: null,
      aiSuggestions: [],
      syncedAt: null,
    },
  ];

  const mockLocations = [
    {
      id: '1',
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 5,
      address: 'San Francisco, CA',
      userId: '1',
      timestamp: new Date(),
      altitude: null,
      notes: null,
    },
  ];

  const renderDashboard = (initialState = {}) => {
    store = configureStore({
      reducer: {
        auth: authReducer,
        reports: reportsReducer,
        locations: locationsReducer,
        sync: syncReducer,
      },
      preloadedState: {
        auth: {
          user: mockUser,
          tokens: null,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
        reports: {
          reports: mockReports,
          currentReport: null,
          isLoading: false,
          error: null,
        },
        locations: {
          locations: mockLocations,
          currentLocation: null,
          routeHistory: [],
          isLoading: false,
          error: null,
        },
        sync: {
          syncStatus: {
            lastSyncAt: new Date(),
            pendingUploads: 0,
            pendingDownloads: 0,
            syncInProgress: false,
            errors: [],
          },
          isLoading: false,
        },
        ...initialState,
      },
    });

    return render(
      <Provider store={store}>
        <NavigationContainer>
          <DashboardScreen />
        </NavigationContainer>
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedLocationService.getCurrentLocation.mockResolvedValue({
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 5,
      timestamp: Date.now(),
    });
    mockedLocationService.reverseGeocode.mockResolvedValue('San Francisco, CA');
    mockedSyncService.syncAll.mockResolvedValue();
  });

  describe('Initial Render', () => {
    it('should display welcome message with user name', () => {
      const { getByText } = renderDashboard();
      
      expect(getByText('Welcome back, John!')).toBeTruthy();
    });

    it('should display user initials in avatar', () => {
      const { getByText } = renderDashboard();
      
      expect(getByText('JD')).toBeTruthy();
    });

    it('should load and display current location', async () => {
      const { getByText } = renderDashboard();

      await waitFor(() => {
        expect(getByText(/San Francisco, CA/)).toBeTruthy();
      });

      expect(mockedLocationService.getCurrentLocation).toHaveBeenCalled();
      expect(mockedLocationService.reverseGeocode).toHaveBeenCalledWith(37.7749, -122.4194);
    });

    it('should display sync status as synced when no pending uploads', () => {
      const { getByText } = renderDashboard();
      
      expect(getByText('All synced')).toBeTruthy();
    });
  });

  describe('Statistics Display', () => {
    it('should display correct report statistics', () => {
      const { getByText } = renderDashboard();
      
      // Total reports
      expect(getByText('2')).toBeTruthy();
      expect(getByText('Total Reports')).toBeTruthy();
      
      // Completed reports
      expect(getByText('1')).toBeTruthy();
      expect(getByText('Completed')).toBeTruthy();
      
      // Pending reports
      expect(getByText('1')).toBeTruthy();
      expect(getByText('Pending')).toBeTruthy();
    });

    it('should display today reports count', () => {
      const { getByText } = renderDashboard();
      
      expect(getByText('Today')).toBeTruthy();
      // One report created today
      expect(getByText('1')).toBeTruthy();
    });
  });

  describe('Quick Actions', () => {
    it('should navigate to create report when New Report button is pressed', () => {
      const { getByText } = renderDashboard();
      
      const newReportButton = getByText('New Report');
      fireEvent.press(newReportButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('CreateReport');
    });

    it('should navigate to camera when Scan Document button is pressed', () => {
      const { getByText } = renderDashboard();
      
      const scanButton = getByText('Scan Document');
      fireEvent.press(scanButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('Camera');
    });

    it('should navigate to locations when Check Location button is pressed', () => {
      const { getByText } = renderDashboard();
      
      const locationButton = getByText('Check Location');
      fireEvent.press(locationButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('Locations');
    });

    it('should navigate to AI assistant when AI Assistant button is pressed', () => {
      const { getByText } = renderDashboard();
      
      const aiButton = getByText('AI Assistant');
      fireEvent.press(aiButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('AI Assistant');
    });
  });

  describe('Recent Reports', () => {
    it('should display recent reports list', () => {
      const { getByText } = renderDashboard();
      
      expect(getByText('Weekly Inspection Report')).toBeTruthy();
      expect(getByText('Safety Check')).toBeTruthy();
    });

    it('should display report categories and dates', () => {
      const { getByText } = renderDashboard();
      
      expect(getByText(/INSPECTION/)).toBeTruthy();
    });

    it('should navigate to report detail when report is pressed', () => {
      const { getByText } = renderDashboard();
      
      const reportItem = getByText('Weekly Inspection Report');
      fireEvent.press(reportItem);
      
      expect(mockNavigate).toHaveBeenCalledWith('ReportDetail', { reportId: '1' });
    });

    it('should display empty state when no reports exist', () => {
      const { getByText } = renderDashboard({
        reports: {
          reports: [],
          currentReport: null,
          isLoading: false,
          error: null,
        },
      });
      
      expect(getByText('No reports yet. Create your first report!')).toBeTruthy();
    });
  });

  describe('Sync Status', () => {
    it('should display pending uploads count when there are pending uploads', () => {
      const { getByText } = renderDashboard({
        sync: {
          syncStatus: {
            lastSyncAt: new Date(),
            pendingUploads: 3,
            pendingDownloads: 0,
            syncInProgress: false,
            errors: [],
          },
          isLoading: false,
        },
      });
      
      expect(getByText('3 pending')).toBeTruthy();
    });

    it('should display syncing status when sync is in progress', () => {
      const { getByText } = renderDashboard({
        sync: {
          syncStatus: {
            lastSyncAt: new Date(),
            pendingUploads: 0,
            pendingDownloads: 0,
            syncInProgress: true,
            errors: [],
          },
          isLoading: false,
        },
      });
      
      expect(getByText('Syncing...')).toBeTruthy();
    });
  });

  describe('Pull to Refresh', () => {
    it('should trigger sync when pull to refresh is activated', async () => {
      const { getByTestId } = renderDashboard();
      
      // Note: In a real test, you'd need to properly simulate pull-to-refresh
      // This is a simplified version showing the concept
      fireEvent(getByTestId('dashboard-scroll-view'), 'refresh');
      
      expect(mockedSyncService.syncAll).toHaveBeenCalled();
    });
  });

  describe('FAB Button', () => {
    it('should navigate to create report when FAB is pressed', () => {
      const { getByTestId } = renderDashboard();
      
      const fab = getByTestId('dashboard-fab');
      fireEvent.press(fab);
      
      expect(mockNavigate).toHaveBeenCalledWith('CreateReport');
    });
  });

  describe('Location Loading States', () => {
    it('should display loading state for location initially', () => {
      const { getByText } = renderDashboard();
      
      expect(getByText('Getting location...')).toBeTruthy();
    });

    it('should display error state when location fails to load', async () => {
      mockedLocationService.getCurrentLocation.mockRejectedValue(new Error('Location error'));
      
      const { getByText } = renderDashboard();
      
      await waitFor(() => {
        expect(getByText('Location unavailable')).toBeTruthy();
      });
    });

    it('should display coordinates when reverse geocoding fails', async () => {
      mockedLocationService.reverseGeocode.mockResolvedValue(null);
      
      const { getByText } = renderDashboard();
      
      await waitFor(() => {
        expect(getByText(/37.7749, -122.4194/)).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle sync errors gracefully', async () => {
      mockedSyncService.syncAll.mockRejectedValue(new Error('Sync failed'));
      
      const { getByTestId } = renderDashboard();
      
      // Simulate refresh
      fireEvent(getByTestId('dashboard-scroll-view'), 'refresh');
      
      // Should not crash the app
      await waitFor(() => {
        expect(mockedSyncService.syncAll).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels for important elements', () => {
      const { getByLabelText } = renderDashboard();
      
      // Check if key elements have accessibility labels
      expect(getByLabelText(/welcome/i)).toBeTruthy();
    });
  });
}); 