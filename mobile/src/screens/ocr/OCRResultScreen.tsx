import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Clipboard,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  ActivityIndicator,
  Divider,
  IconButton,
  Chip,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { RootState } from '../../store';
import { theme } from '../../theme/theme';
import { API_BASE_URL } from '../../config/constants';
import axios from 'axios';

type RouteParams = {
  OCRResult: {
    imageUri: string;
    extractedText: string;
    confidence: number;
  };
};

interface ExtractedData {
  date?: string;
  amount?: string;
  email?: string;
  phone?: string;
}

export const OCRResultScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'OCRResult'>>();
  const { imageUri, extractedText, confidence } = route.params;

  const { tokens } = useSelector((state: RootState) => state.auth);
  const token = tokens?.accessToken;

  const [text, setText] = useState(extractedText);
  const [isEditing, setIsEditing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const handleCopyText = () => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'Text copied to clipboard');
  };

  const handleExtractData = async () => {
    try {
      setExtracting(true);
      const apiClient = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await apiClient.post('/ai/extract', {
        text,
        userId: 'current-user',
      });

      // Parse the extracted data response
      const responseText = response.data.data?.response || response.data.response || '';
      const lines = responseText.split('\n');
      const data: ExtractedData = {};

      lines.forEach((line: string) => {
        if (line.includes('date:')) data.date = line.split('date:')[1]?.trim();
        if (line.includes('amount:')) data.amount = line.split('amount:')[1]?.trim();
        if (line.includes('email:')) data.email = line.split('email:')[1]?.trim();
        if (line.includes('phone:')) data.phone = line.split('phone:')[1]?.trim();
      });

      setExtractedData(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to extract data');
    } finally {
      setExtracting(false);
    }
  };

  const handleSummarize = async () => {
    try {
      setSummarizing(true);
      const apiClient = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await apiClient.post('/ai/summarize', {
        text,
        userId: 'current-user',
      });
      setSummary(response.data.data?.response || response.data.response);
    } catch (error) {
      Alert.alert('Error', 'Failed to summarize text');
    } finally {
      setSummarizing(false);
    }
  };

  const handleCreateReport = () => {
    navigation.navigate('CreateReport', {
      prefillData: {
        description: text,
        extractedData,
        summary,
        imageUri,
      },
    });
  };

  const getConfidenceColor = () => {
    if (confidence >= 0.8) return theme.colors.success;
    if (confidence >= 0.6) return theme.colors.warning;
    return theme.colors.error;
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.imageCard}>
        <Card.Title title="Scanned Image" />
        <Card.Content>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Extracted Text"
          subtitle={`Confidence: ${Math.round(confidence * 100)}%`}
          right={() => (
            <View style={styles.headerActions}>
              <IconButton
                icon={isEditing ? 'check' : 'pencil'}
                onPress={() => setIsEditing(!isEditing)}
              />
              <IconButton icon="content-copy" onPress={handleCopyText} />
            </View>
          )}
        />
        <Card.Content>
          <Chip
            style={[styles.confidenceChip, { backgroundColor: getConfidenceColor() }]}
            textStyle={styles.confidenceText}
          >
            {confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Medium' : 'Low'} Confidence
          </Chip>

          {isEditing ? (
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={10}
              value={text}
              onChangeText={setText}
              style={styles.textInput}
            />
          ) : (
            <Text variant="bodyMedium" style={styles.extractedText}>
              {text || 'No text was extracted from the image.'}
            </Text>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="AI Processing" />
        <Card.Content>
          <View style={styles.aiButtons}>
            <Button
              mode="outlined"
              onPress={handleExtractData}
              loading={extracting}
              disabled={extracting || !text}
              icon="database-search"
              style={styles.aiButton}
            >
              Extract Data
            </Button>
            <Button
              mode="outlined"
              onPress={handleSummarize}
              loading={summarizing}
              disabled={summarizing || !text}
              icon="text-box-outline"
              style={styles.aiButton}
            >
              Summarize
            </Button>
          </View>
        </Card.Content>
      </Card>

      {extractedData && Object.keys(extractedData).length > 0 && (
        <Card style={styles.card}>
          <Card.Title title="Extracted Data" />
          <Card.Content>
            {extractedData.date && (
              <View style={styles.dataRow}>
                <Text variant="labelLarge">Date:</Text>
                <Text variant="bodyMedium">{extractedData.date}</Text>
              </View>
            )}
            {extractedData.amount && (
              <View style={styles.dataRow}>
                <Text variant="labelLarge">Amount:</Text>
                <Text variant="bodyMedium">{extractedData.amount}</Text>
              </View>
            )}
            {extractedData.email && (
              <View style={styles.dataRow}>
                <Text variant="labelLarge">Email:</Text>
                <Text variant="bodyMedium">{extractedData.email}</Text>
              </View>
            )}
            {extractedData.phone && (
              <View style={styles.dataRow}>
                <Text variant="labelLarge">Phone:</Text>
                <Text variant="bodyMedium">{extractedData.phone}</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {summary && (
        <Card style={styles.card}>
          <Card.Title title="Summary" />
          <Card.Content>
            <Text variant="bodyMedium">{summary}</Text>
          </Card.Content>
        </Card>
      )}

      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={handleCreateReport}
          icon="file-document-outline"
          style={styles.createButton}
        >
          Create Report from OCR
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        >
          Scan Another Document
        </Button>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  imageCard: {
    margin: 16,
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  confidenceChip: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    maxHeight: 300,
  },
  extractedText: {
    lineHeight: 22,
  },
  aiButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  aiButton: {
    flex: 1,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  createButton: {
    paddingVertical: 4,
  },
  cancelButton: {
    paddingVertical: 4,
  },
  bottomSpacing: {
    height: 24,
  },
});
