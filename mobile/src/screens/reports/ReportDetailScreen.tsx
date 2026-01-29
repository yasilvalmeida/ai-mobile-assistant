import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  ActivityIndicator,
  Divider,
  IconButton,
  Menu,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';

import { RootState } from '../../store';
import { theme } from '../../theme/theme';
import { API_BASE_URL } from '../../config/constants';
import axios from 'axios';

const { width } = Dimensions.get('window');

interface Report {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  attachments: Array<{
    id: string;
    url: string;
    type: string;
    filename: string;
  }>;
  aiSummary?: string;
}

type RouteParams = {
  ReportDetail: {
    reportId: string;
  };
};

export const ReportDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'ReportDetail'>>();
  const { reportId } = route.params;

  const { tokens } = useSelector((state: RootState) => state.auth);
  const token = tokens?.accessToken;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const apiClient = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await apiClient.get(`/reports/${reportId}`);
      setReport(response.data.data || response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load report details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAISummary = async () => {
    if (!report) return;

    try {
      setGeneratingAI(true);
      const apiClient = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await apiClient.post(`/reports/${reportId}/ai-summary`, {});
      const summary = response.data.data?.summary || response.data.summary;
      setReport({ ...report, aiSummary: summary });
      Alert.alert('Success', 'AI summary generated');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate AI summary');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleDeleteReport = async () => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const apiClient = axios.create({
                baseURL: API_BASE_URL,
                headers: { Authorization: `Bearer ${token}` },
              });

              await apiClient.delete(`/reports/${reportId}`);
              Alert.alert('Success', 'Report deleted');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete report');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return theme.colors.success;
      case 'in_progress':
        return theme.colors.warning;
      case 'pending':
        return theme.colors.info;
      default:
        return theme.colors.outline;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.warning;
      case 'low':
        return theme.colors.success;
      default:
        return theme.colors.outline;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading report...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.errorContainer}>
        <Text>Report not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text variant="headlineSmall" style={styles.title}>
                {report.title}
              </Text>
              <Text variant="bodySmall" style={styles.date}>
                Created: {new Date(report.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  // Navigate to edit
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  handleDeleteReport();
                }}
                title="Delete"
                leadingIcon="delete"
              />
            </Menu>
          </View>

          <View style={styles.chipRow}>
            <Chip
              style={[styles.chip, { backgroundColor: getStatusColor(report.status) }]}
              textStyle={styles.chipText}
            >
              {report.status}
            </Chip>
            <Chip
              style={[styles.chip, { backgroundColor: getPriorityColor(report.priority) }]}
              textStyle={styles.chipText}
            >
              {report.priority} priority
            </Chip>
            <Chip style={styles.typeChip}>{report.type}</Chip>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Description" />
        <Card.Content>
          <Text variant="bodyMedium">{report.description}</Text>
        </Card.Content>
      </Card>

      {report.location && (
        <Card style={styles.card}>
          <Card.Title title="Location" />
          <Card.Content>
            {report.location.address && (
              <Text variant="bodyMedium" style={styles.address}>
                {report.location.address}
              </Text>
            )}
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: report.location.latitude,
                  longitude: report.location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: report.location.latitude,
                    longitude: report.location.longitude,
                  }}
                />
              </MapView>
            </View>
          </Card.Content>
        </Card>
      )}

      {report.attachments && report.attachments.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title={`Attachments (${report.attachments.length})`} />
          <Card.Content>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {report.attachments.map((attachment, index) => (
                <View key={attachment.id} style={styles.attachmentItem}>
                  {attachment.type.startsWith('image/') ? (
                    <Image
                      source={{ uri: attachment.url }}
                      style={styles.attachmentImage}
                    />
                  ) : (
                    <View style={styles.fileIcon}>
                      <IconButton icon="file-document" size={40} />
                    </View>
                  )}
                  <Text variant="bodySmall" numberOfLines={1} style={styles.filename}>
                    {attachment.filename}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Title
          title="AI Summary"
          right={() => (
            <Button
              mode="text"
              onPress={handleGenerateAISummary}
              loading={generatingAI}
              disabled={generatingAI}
            >
              {report.aiSummary ? 'Regenerate' : 'Generate'}
            </Button>
          )}
        />
        <Card.Content>
          {report.aiSummary ? (
            <Text variant="bodyMedium">{report.aiSummary}</Text>
          ) : (
            <Text variant="bodyMedium" style={styles.noSummary}>
              No AI summary available. Click Generate to create one.
            </Text>
          )}
        </Card.Content>
      </Card>

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
  loadingText: {
    marginTop: 16,
    color: theme.colors.onSurfaceVariant,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
  },
  date: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  chip: {
    height: 28,
  },
  chipText: {
    color: 'white',
    fontSize: 12,
  },
  typeChip: {
    backgroundColor: theme.colors.surfaceVariant,
    height: 28,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  address: {
    marginBottom: 12,
    color: theme.colors.onSurfaceVariant,
  },
  mapContainer: {
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  attachmentItem: {
    marginRight: 12,
    width: 100,
  },
  attachmentImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  fileIcon: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filename: {
    marginTop: 4,
    textAlign: 'center',
  },
  noSummary: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 24,
  },
});
