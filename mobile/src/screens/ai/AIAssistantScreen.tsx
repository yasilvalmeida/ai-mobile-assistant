import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Card, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { AIService } from '../../services/AIService';
import { AIResponse, AIRequestType } from '../../../../shared/src/types';
import { theme } from '../../theme/theme';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    tokensUsed?: number;
    processingTime?: number;
  };
}

export const AIAssistantScreen: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const { currentReport } = useSelector((state: RootState) => state.reports);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      type: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you with:\n\n• Summarizing reports\n• Answering questions about documents\n• Extracting key information\n• Providing suggestions\n\nHow can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<AIRequestType | null>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let response: AIResponse;

      if (selectedAction === AIRequestType.SUMMARIZE && currentReport) {
        response = await AIService.summarizeReport(
          `${currentReport.title}\n\n${currentReport.description}`
        );
      } else if (selectedAction === AIRequestType.SUGGEST && currentReport) {
        response = await AIService.getSuggestions(
          `${currentReport.title}\n\n${currentReport.description}`
        );
      } else {
        response = await AIService.askQuestion(
          input.trim(),
          currentReport ? `Report: ${currentReport.title}\n${currentReport.description}` : undefined
        );
      }

      const assistantMessage: Message = {
        id: `msg_${Date.now()}`,
        type: 'assistant',
        content: response.response,
        timestamp: new Date(),
        metadata: {
          confidence: response.confidence,
          tokensUsed: response.tokensUsed,
          processingTime: response.processingTime,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setSelectedAction(null);
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleQuickAction = (action: AIRequestType) => {
    setSelectedAction(action);
    switch (action) {
      case AIRequestType.SUMMARIZE:
        setInput('Please summarize the current report');
        break;
      case AIRequestType.SUGGEST:
        setInput('What suggestions do you have for the current report?');
        break;
      case AIRequestType.EXTRACT:
        setInput('Extract the key information from the document');
        break;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      {currentReport && (
        <Card style={styles.contextCard}>
          <Card.Content style={styles.contextContent}>
            <IconButton icon="file-document" size={20} />
            <View style={styles.contextText}>
              <Text variant="bodySmall" style={styles.contextLabel}>Current Report:</Text>
              <Text variant="bodyMedium" numberOfLines={1}>{currentReport.title}</Text>
            </View>
          </Card.Content>
        </Card>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.type === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text style={message.type === 'user' ? styles.userText : styles.assistantText}>
              {message.content}
            </Text>
            {message.metadata && (
              <View style={styles.metadata}>
                {message.metadata.confidence !== undefined && (
                  <Text variant="bodySmall" style={styles.metadataText}>
                    Confidence: {(message.metadata.confidence * 100).toFixed(0)}%
                  </Text>
                )}
                {message.metadata.processingTime !== undefined && (
                  <Text variant="bodySmall" style={styles.metadataText}>
                    {message.metadata.processingTime}ms
                  </Text>
                )}
              </View>
            )}
          </View>
        ))}
        {isLoading && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        )}
      </ScrollView>

      <View style={styles.quickActions}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip
            icon="file-document-outline"
            onPress={() => handleQuickAction(AIRequestType.SUMMARIZE)}
            style={styles.actionChip}
            disabled={!currentReport}
          >
            Summarize
          </Chip>
          <Chip
            icon="lightbulb-outline"
            onPress={() => handleQuickAction(AIRequestType.SUGGEST)}
            style={styles.actionChip}
            disabled={!currentReport}
          >
            Suggest
          </Chip>
          <Chip
            icon="format-list-bulleted"
            onPress={() => handleQuickAction(AIRequestType.EXTRACT)}
            style={styles.actionChip}
          >
            Extract
          </Chip>
        </ScrollView>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask me anything..."
          mode="outlined"
          style={styles.input}
          multiline
          maxLength={1000}
          right={
            <TextInput.Icon
              icon="send"
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
            />
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contextCard: {
    margin: theme.spacing.md,
    marginBottom: 0,
  },
  contextContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  contextText: {
    flex: 1,
  },
  contextLabel: {
    color: theme.colors.onSurfaceVariant,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: theme.spacing.md,
    borderRadius: 16,
    marginBottom: theme.spacing.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceVariant,
  },
  userText: {
    color: theme.colors.onPrimary,
  },
  assistantText: {
    color: theme.colors.onSurfaceVariant,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  metadataText: {
    fontSize: 10,
    color: theme.colors.outline,
  },
  quickActions: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceVariant,
  },
  actionChip: {
    marginRight: theme.spacing.sm,
  },
  inputContainer: {
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  input: {
    maxHeight: 100,
  },
});

export default AIAssistantScreen;
