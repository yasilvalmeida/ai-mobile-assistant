import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { List, Switch, Text, Divider, Button, Card } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import {
  setTheme,
  setNotifications,
  setPrivacy,
  setOCRProvider,
  setSyncInterval,
} from '../../store/slices/settingsSlice';
import { theme } from '../../theme/theme';

export const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const settings = useSelector((state: RootState) => state.settings);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text variant="titleMedium">{user?.firstName} {user?.lastName}</Text>
            <Text variant="bodySmall" style={styles.email}>{user?.email}</Text>
            <Text variant="bodySmall" style={styles.role}>{user?.role}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Appearance */}
      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <List.Item
          title="Theme"
          description={settings.theme === 'system' ? 'System default' : settings.theme}
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          onPress={() => {
            const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
            const currentIndex = themes.indexOf(settings.theme);
            const nextTheme = themes[(currentIndex + 1) % themes.length];
            dispatch(setTheme(nextTheme));
          }}
        />
      </List.Section>

      <Divider />

      {/* Notifications */}
      <List.Section>
        <List.Subheader>Notifications</List.Subheader>
        <List.Item
          title="Enable Notifications"
          left={(props) => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch
              value={settings.notifications.enabled}
              onValueChange={(value) =>
                dispatch(setNotifications({ enabled: value }))
              }
            />
          )}
        />
        <List.Item
          title="Sync Alerts"
          description="Notify when sync completes or fails"
          left={(props) => <List.Icon {...props} icon="sync" />}
          right={() => (
            <Switch
              value={settings.notifications.syncAlerts}
              onValueChange={(value) =>
                dispatch(setNotifications({ syncAlerts: value }))
              }
              disabled={!settings.notifications.enabled}
            />
          )}
        />
        <List.Item
          title="Report Reminders"
          description="Remind to complete draft reports"
          left={(props) => <List.Icon {...props} icon="file-clock" />}
          right={() => (
            <Switch
              value={settings.notifications.reportReminders}
              onValueChange={(value) =>
                dispatch(setNotifications({ reportReminders: value }))
              }
              disabled={!settings.notifications.enabled}
            />
          )}
        />
      </List.Section>

      <Divider />

      {/* Privacy */}
      <List.Section>
        <List.Subheader>Privacy</List.Subheader>
        <List.Item
          title="Share Location"
          description="Allow location tracking for reports"
          left={(props) => <List.Icon {...props} icon="map-marker" />}
          right={() => (
            <Switch
              value={settings.privacy.shareLocation}
              onValueChange={(value) =>
                dispatch(setPrivacy({ shareLocation: value }))
              }
            />
          )}
        />
        <List.Item
          title="Share Analytics"
          description="Help improve the app with anonymous data"
          left={(props) => <List.Icon {...props} icon="chart-line" />}
          right={() => (
            <Switch
              value={settings.privacy.shareAnalytics}
              onValueChange={(value) =>
                dispatch(setPrivacy({ shareAnalytics: value }))
              }
            />
          )}
        />
      </List.Section>

      <Divider />

      {/* OCR Settings */}
      <List.Section>
        <List.Subheader>OCR Processing</List.Subheader>
        <List.Item
          title="OCR Provider"
          description={settings.config.ocrProvider}
          left={(props) => <List.Icon {...props} icon="text-recognition" />}
          onPress={() => {
            const providers: ('tesseract' | 'google-vision' | 'aws-textract')[] = [
              'tesseract',
              'google-vision',
              'aws-textract',
            ];
            const currentIndex = providers.indexOf(settings.config.ocrProvider);
            const nextProvider = providers[(currentIndex + 1) % providers.length];
            dispatch(setOCRProvider(nextProvider));
          }}
        />
      </List.Section>

      <Divider />

      {/* Sync Settings */}
      <List.Section>
        <List.Subheader>Synchronization</List.Subheader>
        <List.Item
          title="Sync Interval"
          description={`Every ${settings.config.syncInterval / 1000} seconds`}
          left={(props) => <List.Icon {...props} icon="cloud-sync" />}
          onPress={() => {
            const intervals = [30000, 60000, 120000, 300000];
            const currentIndex = intervals.indexOf(settings.config.syncInterval);
            const nextInterval = intervals[(currentIndex + 1) % intervals.length];
            dispatch(setSyncInterval(nextInterval));
          }}
        />
        <List.Item
          title="Max Offline Storage"
          description={`${(settings.config.maxOfflineStorage / 1024 / 1024).toFixed(0)} MB`}
          left={(props) => <List.Icon {...props} icon="database" />}
        />
      </List.Section>

      <Divider />

      {/* About */}
      <List.Section>
        <List.Subheader>About</List.Subheader>
        <List.Item
          title="Version"
          description="1.0.0"
          left={(props) => <List.Icon {...props} icon="information" />}
        />
        <List.Item
          title="Terms of Service"
          left={(props) => <List.Icon {...props} icon="file-document" />}
        />
        <List.Item
          title="Privacy Policy"
          left={(props) => <List.Icon {...props} icon="shield-account" />}
        />
      </List.Section>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          icon="logout"
          textColor={theme.colors.error}
          style={styles.logoutButton}
        >
          Sign Out
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  profileCard: {
    margin: theme.spacing.md,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: theme.colors.onPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileInfo: {
    marginLeft: theme.spacing.md,
  },
  email: {
    color: theme.colors.onSurfaceVariant,
  },
  role: {
    color: theme.colors.primary,
    textTransform: 'capitalize',
  },
  logoutContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  logoutButton: {
    borderColor: theme.colors.error,
  },
});

export default SettingsScreen;
