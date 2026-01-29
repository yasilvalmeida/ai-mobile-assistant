import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Avatar,
  Divider,
  List,
  ActivityIndicator,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';

import { RootState, AppDispatch } from '../../store';
import { logout, updateUser } from '../../store/slices/authSlice';
import { theme } from '../../theme/theme';
import { authAPI } from '../../services/api/authAPI';
import { API_BASE_URL } from '../../config/constants';
import axios from 'axios';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  organization?: string;
  role?: string;
  createdAt: string;
}

interface UserStats {
  totalReports: number;
  totalLocations: number;
  totalDistance: number;
  aiRequestsCount: number;
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { user, tokens } = useSelector((state: RootState) => state.auth);
  const token = tokens?.accessToken;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      if (token) {
        const userData = await authAPI.getProfile(token);
        setProfile({
          id: userData.id,
          email: userData.email,
          name: userData.name || '',
          createdAt: new Date().toISOString(),
        });
        setName(userData.name || '');
      }
    } catch (error) {
      // Use local user data if API fails
      if (user) {
        setProfile({
          id: user.id,
          email: user.email,
          name: user.name || '',
          createdAt: new Date().toISOString(),
        });
        setName(user.name || '');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const apiClient = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` },
      });

      const [reportsRes, locationsRes] = await Promise.all([
        apiClient.get('/reports?limit=1'),
        apiClient.get(`/locations/stats?userId=${user?.id}`),
      ]);

      setStats({
        totalReports: reportsRes.data.data?.pagination?.total || 0,
        totalLocations: locationsRes.data.data?.totalLocations || 0,
        totalDistance: locationsRes.data.data?.totalDistance || 0,
        aiRequestsCount: 0,
      });
    } catch (error) {
      setStats({
        totalReports: 0,
        totalLocations: 0,
        totalDistance: 0,
        aiRequestsCount: 0,
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const apiClient = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` },
      });

      await apiClient.patch('/auth/profile', { name, phone, organization });

      setProfile(prev => prev ? { ...prev, name, phone, organization } : null);
      dispatch(updateUser({ name }));
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeAvatar = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.8,
    });

    if (result.assets && result.assets[0]) {
      const asset = result.assets[0];
      try {
        const formData = new FormData();
        formData.append('avatar', {
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || 'avatar.jpg',
        } as any);

        await axios.post(`${API_BASE_URL}/auth/avatar`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        fetchProfile();
        Alert.alert('Success', 'Avatar updated successfully');
      } catch (error) {
        Alert.alert('Error', 'Failed to update avatar');
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <View style={styles.avatarContainer}>
            {profile?.avatar ? (
              <Avatar.Image size={100} source={{ uri: profile.avatar }} />
            ) : (
              <Avatar.Text
                size={100}
                label={profile?.name?.substring(0, 2).toUpperCase() || 'U'}
              />
            )}
            <Button
              mode="text"
              onPress={handleChangeAvatar}
              style={styles.changeAvatarBtn}
            >
              Change Photo
            </Button>
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <TextInput
                label="Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
              />
              <TextInput
                label="Organization"
                value={organization}
                onChangeText={setOrganization}
                mode="outlined"
                style={styles.input}
              />
              <View style={styles.editButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setEditing(false)}
                  style={styles.editButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveProfile}
                  loading={saving}
                  style={styles.editButton}
                >
                  Save
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.name}>
                {profile?.name || 'No name set'}
              </Text>
              <Text variant="bodyMedium" style={styles.email}>
                {profile?.email}
              </Text>
              {profile?.organization && (
                <Text variant="bodySmall" style={styles.organization}>
                  {profile.organization}
                </Text>
              )}
              <Button
                mode="outlined"
                onPress={() => setEditing(true)}
                style={styles.editProfileBtn}
                icon="pencil"
              >
                Edit Profile
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {stats && (
        <Card style={styles.statsCard}>
          <Card.Title title="Activity Statistics" />
          <Card.Content>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statValue}>
                  {stats.totalReports}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Reports
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statValue}>
                  {stats.totalLocations}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  Locations
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statValue}>
                  {stats.totalDistance.toFixed(1)}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>
                  km Traveled
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.actionsCard}>
        <List.Item
          title="Settings"
          description="App preferences and configuration"
          left={props => <List.Icon {...props} icon="cog" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Settings' as never)}
        />
        <Divider />
        <List.Item
          title="Help & Support"
          description="FAQ and contact support"
          left={props => <List.Icon {...props} icon="help-circle" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Alert.alert('Help', 'Support documentation coming soon')}
        />
        <Divider />
        <List.Item
          title="Privacy Policy"
          description="View our privacy policy"
          left={props => <List.Icon {...props} icon="shield-account" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon')}
        />
      </Card>

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        textColor={theme.colors.error}
        icon="logout"
      >
        Logout
      </Button>

      <Text variant="bodySmall" style={styles.version}>
        AI Mobile Assistant v1.0.0
      </Text>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    margin: 16,
  },
  profileContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  changeAvatarBtn: {
    marginTop: 8,
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    color: theme.colors.onSurfaceVariant,
  },
  organization: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  editProfileBtn: {
    marginTop: 16,
  },
  editForm: {
    width: '100%',
    paddingHorizontal: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    minWidth: 100,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderColor: theme.colors.error,
  },
  version: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  bottomSpacing: {
    height: 24,
  },
});
