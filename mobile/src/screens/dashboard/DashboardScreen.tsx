import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Chip,
  Avatar,
  List,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootState, AppDispatch } from '../../store';
import { theme } from '../../theme/theme';
import { LocationService } from '../../services/LocationService';
import { SyncService } from '../../services/SyncService';

const { width } = Dimensions.get('window');

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { reports } = useSelector((state: RootState) => state.reports);
  const { locations } = useSelector((state: RootState) => state.locations);
  const { syncStatus } = useSelector((state: RootState) => state.sync);
  
  const [refreshing, setRefreshing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('Getting location...');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      const address = await LocationService.reverseGeocode(
        location.latitude,
        location.longitude
      );
      setCurrentLocation(address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
    } catch (error) {
      console.error('Error getting location:', error);
      setCurrentLocation('Location unavailable');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await SyncService.syncAll();
      await getCurrentLocation();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getReportStats = () => {
    const total = reports.length;
    const completed = reports.filter(r => r.status === 'COMPLETED').length;
    const pending = reports.filter(r => r.status === 'IN_PROGRESS' || r.status === 'DRAFT').length;
    const today = new Date().toDateString();
    const todayReports = reports.filter(r => 
      new Date(r.createdAt).toDateString() === today
    ).length;

    return { total, completed, pending, today: todayReports };
  };

  const stats = getReportStats();
  const recentReports = reports
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <Card style={styles.welcomeCard}>
          <Card.Content>
            <View style={styles.welcomeHeader}>
              <Avatar.Text 
                size={50} 
                label={user?.firstName?.charAt(0) + user?.lastName?.charAt(0) || 'FA'} 
                style={{ backgroundColor: theme.colors.primary }}
              />
              <View style={styles.welcomeText}>
                <Title style={styles.welcomeTitle}>
                  Welcome back, {user?.firstName}!
                </Title>
                <Paragraph style={styles.locationText}>
                  <Icon name="location-on" size={16} color={theme.colors.primary} />
                  {' ' + currentLocation}
                </Paragraph>
              </View>
            </View>
            
            {/* Sync Status */}
            <View style={styles.syncStatus}>
              <Chip
                icon={syncStatus.syncInProgress ? 'sync' : syncStatus.pendingUploads > 0 ? 'cloud-upload' : 'cloud-done'}
                style={[
                  styles.syncChip,
                  { backgroundColor: syncStatus.syncInProgress ? theme.colors.warning : 
                    syncStatus.pendingUploads > 0 ? theme.colors.error : theme.colors.success }
                ]}
                textStyle={{ color: 'white' }}
              >
                {syncStatus.syncInProgress ? 'Syncing...' : 
                 syncStatus.pendingUploads > 0 ? `${syncStatus.pendingUploads} pending` : 'All synced'}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="assignment" size={32} color={theme.colors.primary} />
              <Title style={styles.statNumber}>{stats.total}</Title>
              <Paragraph style={styles.statLabel}>Total Reports</Paragraph>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="check-circle" size={32} color={theme.colors.success} />
              <Title style={styles.statNumber}>{stats.completed}</Title>
              <Paragraph style={styles.statLabel}>Completed</Paragraph>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="pending" size={32} color={theme.colors.warning} />
              <Title style={styles.statNumber}>{stats.pending}</Title>
              <Paragraph style={styles.statLabel}>Pending</Paragraph>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Icon name="today" size={32} color={theme.colors.tertiary} />
              <Title style={styles.statNumber}>{stats.today}</Title>
              <Paragraph style={styles.statLabel}>Today</Paragraph>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Quick Actions</Title>
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                icon="add"
                style={styles.actionButton}
                onPress={() => navigation.navigate('CreateReport' as never)}
              >
                New Report
              </Button>
              <Button
                mode="outlined"
                icon="camera-alt"
                style={styles.actionButton}
                onPress={() => navigation.navigate('Camera' as never)}
              >
                Scan Document
              </Button>
            </View>
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                icon="location-on"
                style={styles.actionButton}
                onPress={() => navigation.navigate('Locations' as never)}
              >
                Check Location
              </Button>
              <Button
                mode="outlined"
                icon="smart-toy"
                style={styles.actionButton}
                onPress={() => navigation.navigate('AI Assistant' as never)}
              >
                AI Assistant
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Reports */}
        <Card style={styles.recentCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Recent Reports</Title>
            {recentReports.length > 0 ? (
              recentReports.map((report) => (
                <List.Item
                  key={report.id}
                  title={report.title}
                  description={`${report.category} • ${new Date(report.updatedAt).toLocaleDateString()}`}
                  left={(props) => (
                    <Avatar.Icon 
                      {...props} 
                      icon="assignment" 
                      size={40}
                      style={{ backgroundColor: theme.colors.primaryContainer }}
                    />
                  )}
                  right={(props) => (
                    <Chip 
                      {...props} 
                      style={[
                        styles.statusChip,
                        { backgroundColor: getStatusColor(report.status) }
                      ]}
                      textStyle={{ color: 'white', fontSize: 12 }}
                    >
                      {report.status}
                    </Chip>
                  )}
                  onPress={() => navigation.navigate('ReportDetail' as never, { reportId: report.id } as never)}
                />
              ))
            ) : (
              <Paragraph style={styles.emptyText}>
                No reports yet. Create your first report!
              </Paragraph>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="add"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateReport' as never)}
      />
    </View>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED': return theme.colors.success;
    case 'IN_PROGRESS': return theme.colors.warning;
    case 'DRAFT': return theme.colors.outline;
    case 'REVIEWED': return theme.colors.primary;
    default: return theme.colors.outline;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  welcomeCard: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  welcomeText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  locationText: {
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
  },
  syncStatus: {
    alignItems: 'center',
  },
  syncChip: {
    alignSelf: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  actionsCard: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  recentCard: {
    margin: theme.spacing.md,
    marginBottom: 100, // Space for FAB
  },
  statusChip: {
    alignSelf: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginVertical: theme.spacing.lg,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
}); 