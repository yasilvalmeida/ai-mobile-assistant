import { MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  web: {
    regular: {
      fontFamily: 'System',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
  android: {
    regular: {
      fontFamily: 'Roboto',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'Roboto',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'Roboto',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'Roboto',
      fontWeight: '100',
    },
  },
  ios: {
    regular: {
      fontFamily: '-apple-system',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: '-apple-system',
      fontWeight: '500',
    },
    light: {
      fontFamily: '-apple-system',
      fontWeight: '300',
    },
    thin: {
      fontFamily: '-apple-system',
      fontWeight: '100',
    },
  },
};

export const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    // Primary colors - Blue theme for professional field work
    primary: '#1976D2',
    onPrimary: '#FFFFFF',
    primaryContainer: '#E3F2FD',
    onPrimaryContainer: '#0D47A1',
    
    // Secondary colors - Teal accent
    secondary: '#00796B',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E0F2F1',
    onSecondaryContainer: '#004D40',
    
    // Tertiary colors - Orange for warnings/urgent items
    tertiary: '#FF9800',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFF3E0',
    onTertiaryContainer: '#E65100',
    
    // Error colors
    error: '#D32F2F',
    onError: '#FFFFFF',
    errorContainer: '#FFEBEE',
    onErrorContainer: '#B71C1C',
    
    // Success colors (custom)
    success: '#388E3C',
    onSuccess: '#FFFFFF',
    successContainer: '#E8F5E8',
    onSuccessContainer: '#1B5E20',
    
    // Warning colors (custom)
    warning: '#F57C00',
    onWarning: '#FFFFFF',
    warningContainer: '#FFF8E1',
    onWarningContainer: '#E65100',

    // Info colors (custom)
    info: '#2196F3',
    onInfo: '#FFFFFF',
    infoContainer: '#E3F2FD',
    onInfoContainer: '#0D47A1',
    
    // Surface colors
    surface: '#FFFFFF',
    onSurface: '#1C1B1F',
    surfaceVariant: '#F5F5F5',
    onSurfaceVariant: '#49454E',
    
    // Background colors
    background: '#FEFBFF',
    onBackground: '#1C1B1F',
    
    // Outline colors
    outline: '#E0E0E0',
    outlineVariant: '#F0F0F0',
    
    // Other utility colors
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#313033',
    inverseOnSurface: '#F4EFF4',
    inversePrimary: '#90CAF9',
    
    // Custom app-specific colors
    locationPin: '#E53935',
    cameraOverlay: 'rgba(0, 0, 0, 0.3)',
    ocrHighlight: 'rgba(25, 118, 210, 0.2)',
    offlineMode: '#616161',
    syncProgress: '#4CAF50',
  },
  
  // Custom spacing system
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Custom border radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
  
  // Elevation/Shadow system
  elevation: {
    level0: 0,
    level1: 1,
    level2: 3,
    level3: 6,
    level4: 8,
    level5: 12,
  },
};

export type Theme = typeof theme; 