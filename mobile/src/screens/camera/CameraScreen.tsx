import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, IconButton, ActivityIndicator, Card, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { AppDispatch, RootState } from '../../store';
import { processImage } from '../../store/slices/ocrSlice';
import { theme } from '../../theme/theme';

export const CameraScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { isProcessing, processingProgress, currentResult } = useSelector(
    (state: RootState) => state.ocr
  );

  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleCapture = async () => {
    try {
      const result: ImagePickerResponse = await launchCamera({
        mediaType: 'photo',
        quality: 0.9,
        saveToPhotos: false,
      });

      if (result.assets?.[0]?.uri) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const handleGallery = async () => {
    try {
      const result: ImagePickerResponse = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.9,
      });

      if (result.assets?.[0]?.uri) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleProcessOCR = async () => {
    if (!capturedImage) return;

    await dispatch(processImage(capturedImage));
    navigation.navigate('OCRResult' as never);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  if (isProcessing) {
    return (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="titleMedium" style={styles.processingText}>
          Processing image...
        </Text>
        <Text variant="bodyMedium" style={styles.progressText}>
          {processingProgress.toFixed(0)}%
        </Text>
      </View>
    );
  }

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Card style={styles.previewCard}>
          <Card.Cover source={{ uri: capturedImage }} style={styles.preview} />
        </Card>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            icon="camera"
            onPress={handleRetake}
            style={styles.actionButton}
          >
            Retake
          </Button>
          <Button
            mode="contained"
            icon="text-recognition"
            onPress={handleProcessOCR}
            style={styles.actionButton}
          >
            Process OCR
          </Button>
        </View>

        <Text variant="bodySmall" style={styles.hint}>
          Tap "Process OCR" to extract text from the image
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraPlaceholder}>
        <IconButton
          icon="camera"
          size={80}
          iconColor={theme.colors.onSurfaceVariant}
        />
        <Text variant="titleMedium" style={styles.placeholderText}>
          Capture or select a document
        </Text>
        <Text variant="bodySmall" style={styles.placeholderHint}>
          For best results, ensure good lighting and a clear view of the document
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={handleGallery}
        >
          <IconButton icon="image" size={32} iconColor={theme.colors.primary} />
          <Text variant="bodySmall">Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleCapture}
        >
          <View style={styles.captureInner} />
        </TouchableOpacity>

        <View style={styles.spacer} />
      </View>

      <Card style={styles.documentTypes}>
        <Card.Content>
          <Text variant="titleSmall" style={styles.docTypesTitle}>
            Supported Documents
          </Text>
          <View style={styles.docTypesList}>
            {['Invoice', 'Receipt', 'ID Card', 'Business Card', 'License Plate', 'Form'].map(
              (type) => (
                <Text key={type} variant="bodySmall" style={styles.docType}>
                  • {type}
                </Text>
              )
            )}
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  processingText: {
    marginTop: theme.spacing.lg,
  },
  progressText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.onSurfaceVariant,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 16,
    marginBottom: theme.spacing.lg,
  },
  placeholderText: {
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.md,
  },
  placeholderHint: {
    color: theme.colors.outline,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  galleryButton: {
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  spacer: {
    width: 60,
  },
  previewCard: {
    flex: 1,
    marginBottom: theme.spacing.lg,
  },
  preview: {
    flex: 1,
    height: undefined,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    flex: 0.48,
  },
  hint: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  documentTypes: {
    marginTop: theme.spacing.md,
  },
  docTypesTitle: {
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  docTypesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  docType: {
    width: '50%',
    color: theme.colors.onSurfaceVariant,
  },
});

export default CameraScreen;
