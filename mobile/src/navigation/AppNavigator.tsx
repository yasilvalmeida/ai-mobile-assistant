import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState } from '../store';
import { theme } from '../theme/theme';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Main App Screens
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { CreateReportScreen } from '../screens/reports/CreateReportScreen';
import { ReportDetailScreen } from '../screens/reports/ReportDetailScreen';
import { CameraScreen } from '../screens/camera/CameraScreen';
import { OCRResultScreen } from '../screens/ocr/OCRResultScreen';
import { LocationsScreen } from '../screens/locations/LocationsScreen';
import { AIAssistantScreen } from '../screens/ai/AIAssistantScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Reports':
              iconName = 'assignment';
              break;
            case 'Camera':
              iconName = 'camera-alt';
              break;
            case 'Locations':
              iconName = 'location-on';
              break;
            case 'AI Assistant':
              iconName = 'smart-toy';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceDisabled,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerTitle: 'Field Assistant',
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{
          title: 'Reports',
        }}
      />
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{
          title: 'Scan',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Locations" 
        component={LocationsScreen}
        options={{
          title: 'Locations',
        }}
      />
      <Tab.Screen 
        name="AI Assistant" 
        component={AIAssistantScreen}
        options={{
          title: 'AI Assistant',
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Auth Stack
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>
      ) : (
        // Main App Stack
        <Stack.Group>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen 
            name="CreateReport" 
            component={CreateReportScreen}
            options={{
              headerShown: true,
              title: 'Create Report',
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: theme.colors.onPrimary,
            }}
          />
          <Stack.Screen 
            name="ReportDetail" 
            component={ReportDetailScreen}
            options={{
              headerShown: true,
              title: 'Report Details',
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: theme.colors.onPrimary,
            }}
          />
          <Stack.Screen 
            name="OCRResult" 
            component={OCRResultScreen}
            options={{
              headerShown: true,
              title: 'OCR Results',
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: theme.colors.onPrimary,
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              headerShown: true,
              title: 'Settings',
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: theme.colors.onPrimary,
            }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{
              headerShown: true,
              title: 'Profile',
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: theme.colors.onPrimary,
            }}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}; 