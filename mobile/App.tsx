import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { theme } from './src/theme/theme';
import { LocationService } from './src/services/LocationService';
import { SyncService } from './src/services/SyncService';
import { LoadingScreen } from './src/components/LoadingScreen';

const App: React.FC = () => {
  useEffect(() => {
    // Initialize services
    LocationService.initialize();
    SyncService.initialize();

    return () => {
      // Cleanup services
      LocationService.cleanup();
      SyncService.cleanup();
    };
  }, []);

  return (
    <ReduxProvider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <StatusBar 
              barStyle="light-content" 
              backgroundColor={theme.colors.primary} 
            />
            <AppNavigator />
          </NavigationContainer>
        </PaperProvider>
      </PersistGate>
    </ReduxProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App; 