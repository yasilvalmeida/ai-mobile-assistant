import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons, Chip, Card, IconButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { AppDispatch, RootState } from '../../store';
import { createReport } from '../../store/slices/reportsSlice';
import { getCurrentLocation } from '../../store/slices/locationsSlice';
import { processImage } from '../../store/slices/ocrSlice';
import { FieldReport, ReportCategory, Priority, ReportStatus, Attachment } from '../../../../shared/src/types';
import { theme } from '../../theme/theme';

const CATEGORIES = Object.values(ReportCategory);
const PRIORITIES = Object.values(Priority);

export const CreateReportScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentLocation } = useSelector((state: RootState) => state.locations);
  const { isLoading: isCreating } = useSelector((state: RootState) => state.reports);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>(ReportCategory.OTHER);
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    if (user?.id) {
      dispatch(getCurrentLocation(user.id));
    }
  }, [dispatch, user?.id]);

  const handleAddPhoto = () => {
    Alert.alert('Add Photo', 'Choose an option', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
          if (result.assets?.[0]) {
            const asset = result.assets[0];
            const attachment: Attachment = {
              id: `att_${Date.now()}`,
              fileName: asset.fileName || 'photo.jpg',
              filePath: asset.uri || '',
              fileSize: asset.fileSize || 0,
              mimeType: asset.type || 'image/jpeg',
              uploadedAt: new Date(),
            };
            setAttachments([...attachments, attachment]);

            // Process OCR if it's an image
            if (asset.uri) {
              dispatch(processImage(asset.uri));
            }
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
          if (result.assets?.[0]) {
            const asset = result.assets[0];
            const attachment: Attachment = {
              id: `att_${Date.now()}`,
              fileName: asset.fileName || 'photo.jpg',
              filePath: asset.uri || '',
              fileSize: asset.fileSize || 0,
              mimeType: asset.type || 'image/jpeg',
              uploadedAt: new Date(),
            };
            setAttachments([...attachments, attachment]);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the report');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Error', 'Unable to get current location');
      return;
    }

    const report: Omit<FieldReport, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: user?.id || '',
      title: title.trim(),
      description: description.trim(),
      status: ReportStatus.DRAFT,
      priority,
      category,
      location: currentLocation,
      attachments,
      ocrResults: [],
      aiSuggestions: [],
    };

    await dispatch(createReport(report));
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        label="Title"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        style={styles.input}
        placeholder="Enter report title"
      />

      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={4}
        style={styles.input}
        placeholder="Describe your findings..."
      />

      <Text variant="titleSmall" style={styles.sectionTitle}>Category</Text>
      <View style={styles.chipContainer}>
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            selected={category === cat}
            onPress={() => setCategory(cat)}
            style={styles.chip}
          >
            {cat.replace('_', ' ')}
          </Chip>
        ))}
      </View>

      <Text variant="titleSmall" style={styles.sectionTitle}>Priority</Text>
      <SegmentedButtons
        value={priority}
        onValueChange={(value) => setPriority(value as Priority)}
        buttons={PRIORITIES.map((p) => ({ value: p, label: p.toUpperCase() }))}
        style={styles.segmentedButtons}
      />

      <Text variant="titleSmall" style={styles.sectionTitle}>Location</Text>
      <Card style={styles.locationCard}>
        <Card.Content>
          {currentLocation ? (
            <>
              <Text variant="bodyMedium">
                {currentLocation.address || `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
              </Text>
              <Text variant="bodySmall" style={styles.accuracyText}>
                Accuracy: {currentLocation.accuracy.toFixed(0)}m
              </Text>
            </>
          ) : (
            <Text variant="bodyMedium">Getting location...</Text>
          )}
        </Card.Content>
      </Card>

      <Text variant="titleSmall" style={styles.sectionTitle}>
        Attachments ({attachments.length})
      </Text>
      <View style={styles.attachmentsContainer}>
        {attachments.map((att) => (
          <Card key={att.id} style={styles.attachmentCard}>
            <Card.Content style={styles.attachmentContent}>
              <Text variant="bodySmall" numberOfLines={1}>{att.fileName}</Text>
              <IconButton
                icon="close"
                size={16}
                onPress={() => handleRemoveAttachment(att.id)}
              />
            </Card.Content>
          </Card>
        ))}
        <Button
          mode="outlined"
          icon="camera"
          onPress={handleAddPhoto}
          style={styles.addPhotoButton}
        >
          Add Photo
        </Button>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isCreating}
          disabled={isCreating || !title.trim()}
          style={styles.button}
        >
          Create Report
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
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  segmentedButtons: {
    marginBottom: theme.spacing.md,
  },
  locationCard: {
    marginBottom: theme.spacing.md,
  },
  accuracyText: {
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
  },
  attachmentsContainer: {
    marginBottom: theme.spacing.lg,
  },
  attachmentCard: {
    marginBottom: theme.spacing.sm,
  },
  attachmentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 0,
  },
  addPhotoButton: {
    marginTop: theme.spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  button: {
    flex: 0.48,
  },
});

export default CreateReportScreen;
