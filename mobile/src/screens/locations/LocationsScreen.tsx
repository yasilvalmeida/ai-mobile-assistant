import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Card, Button, Chip, SegmentedButtons, List, IconButton } from 'react-native-paper';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchLocations, getCurrentLocation, startTracking, stopTracking } from '../../store/slices/locationsSlice';
import { GPSLocation } from '../../../../shared/src/types';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');

export const LocationsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { locations, currentLocation, isTracking, stats } = useSelector(
    (state: RootState) => state.locations
  );

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  useEffect(() => {
    if (user?.id) {
      dispatch(getCurrentLocation(user.id));
      dispatch(fetchLocations({}));
    }
  }, [dispatch, user?.id]);

  const handleToggleTracking = () => {
    if (isTracking) {
      dispatch(stopTracking());
    } else {
      dispatch(startTracking());
    }
  };

  const handleRefreshLocation = () => {
    if (user?.id) {
      dispatch(getCurrentLocation(user.id));
    }
  };

  const mapRegion = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  const routeCoordinates = locations.map((loc) => ({
    latitude: loc.latitude,
    longitude: loc.longitude,
  }));

  return (
    <View style={styles.container}>
      {/* Stats Card */}
      <Card style={styles.statsCard}>
        <Card.Content style={styles.statsContent}>
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={styles.statNumber}>
              {stats.todayLocations}
            </Text>
            <Text variant="bodySmall">Today's Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={styles.statNumber}>
              {stats.todayDistance.toFixed(1)}
            </Text>
            <Text variant="bodySmall">km Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text variant="headlineMedium" style={styles.statNumber}>
              {stats.totalDistance.toFixed(1)}
            </Text>
            <Text variant="bodySmall">km Total</Text>
          </View>
        </Card.Content>
      </Card>

      {/* View Mode Toggle */}
      <SegmentedButtons
        value={viewMode}
        onValueChange={(value) => setViewMode(value as 'map' | 'list')}
        buttons={[
          { value: 'map', label: 'Map', icon: 'map' },
          { value: 'list', label: 'List', icon: 'format-list-bulleted' },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Map View */}
      {viewMode === 'map' && (
        <View style={styles.mapContainer}>
          <MapView style={styles.map} region={mapRegion} showsUserLocation>
            {currentLocation && (
              <Marker
                coordinate={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }}
                title="Current Location"
                description={currentLocation.address}
                pinColor={theme.colors.primary}
              />
            )}
            {locations.map((location, index) => (
              <Marker
                key={location.id}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title={`Point ${index + 1}`}
                description={new Date(location.timestamp).toLocaleString()}
                pinColor={theme.colors.secondary}
                opacity={0.7}
              />
            ))}
            {routeCoordinates.length > 1 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor={theme.colors.primary}
                strokeWidth={3}
              />
            )}
          </MapView>

          {/* Map Controls */}
          <View style={styles.mapControls}>
            <IconButton
              icon="crosshairs-gps"
              mode="contained"
              size={24}
              onPress={handleRefreshLocation}
              style={styles.mapButton}
            />
          </View>
        </View>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <View style={styles.listContainer}>
          {locations.length > 0 ? (
            locations.slice(0, 20).map((location, index) => (
              <List.Item
                key={location.id}
                title={location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                description={new Date(location.timestamp).toLocaleString()}
                left={(props) => <List.Icon {...props} icon="map-marker" />}
                right={() => (
                  <Text variant="bodySmall" style={styles.accuracyBadge}>
                    ±{location.accuracy.toFixed(0)}m
                  </Text>
                )}
              />
            ))
          ) : (
            <View style={styles.emptyList}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No location history
              </Text>
              <Text variant="bodySmall" style={styles.emptySubtext}>
                Start tracking to record your locations
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Tracking Button */}
      <View style={styles.trackingContainer}>
        <Chip
          icon={isTracking ? 'record-circle' : 'record'}
          style={[
            styles.trackingChip,
            { backgroundColor: isTracking ? theme.colors.error : theme.colors.surfaceVariant },
          ]}
          textStyle={{ color: isTracking ? 'white' : theme.colors.onSurface }}
        >
          {isTracking ? 'Tracking Active' : 'Tracking Off'}
        </Chip>
        <Button
          mode={isTracking ? 'outlined' : 'contained'}
          onPress={handleToggleTracking}
          icon={isTracking ? 'stop' : 'play'}
        >
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statsCard: {
    margin: theme.spacing.md,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.outlineVariant,
  },
  segmentedButtons: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.md,
  },
  mapButton: {
    backgroundColor: theme.colors.surface,
  },
  listContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.onSurfaceVariant,
  },
  emptySubtext: {
    color: theme.colors.outline,
    marginTop: theme.spacing.sm,
  },
  accuracyBadge: {
    color: theme.colors.onSurfaceVariant,
    alignSelf: 'center',
  },
  trackingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  trackingChip: {
    height: 32,
  },
});

export default LocationsScreen;
