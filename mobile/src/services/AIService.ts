import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIRequest, AIResponse, AIRequestType } from '../../../shared/src/types';
import { API_BASE_URL, STORAGE_KEYS, AI_CONFIG } from '../config/constants';

interface AICompletionRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
}

class AIServiceClass {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const tokensJson = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKENS);
    if (tokensJson) {
      const tokens = JSON.parse(tokensJson);
      return { Authorization: `Bearer ${tokens.accessToken}` };
    }
    return {};
  }

  async sendRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const headers = await this.getAuthHeaders();

    const response = await axios.post<{
      response: string;
      tokensUsed: number;
      confidence: number;
    }>(`${API_BASE_URL}/ai/process`, request, { headers });

    return {
      id: `ai_${Date.now()}`,
      request,
      response: response.data.response,
      confidence: response.data.confidence,
      tokensUsed: response.data.tokensUsed,
      processingTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  async summarizeReport(reportText: string): Promise<AIResponse> {
    return this.sendRequest({
      prompt: `Please summarize the following field report concisely, highlighting key findings and action items:\n\n${reportText}`,
      type: AIRequestType.SUMMARIZE,
      userId: '', // Will be set server-side
    });
  }

  async getSuggestions(reportContext: string): Promise<AIResponse> {
    return this.sendRequest({
      prompt: `Based on this field report, suggest next steps and potential areas of concern:\n\n${reportContext}`,
      type: AIRequestType.SUGGEST,
      userId: '',
    });
  }

  async askQuestion(question: string, context?: string): Promise<AIResponse> {
    const prompt = context
      ? `Based on the following context, answer this question: ${question}\n\nContext:\n${context}`
      : question;

    return this.sendRequest({
      prompt,
      context,
      type: AIRequestType.QUESTION,
      userId: '',
    });
  }

  async extractDataFromOCR(ocrText: string, documentType: string): Promise<AIResponse> {
    return this.sendRequest({
      prompt: `Extract and structure the key information from this ${documentType} document. Return the data in a structured format:\n\n${ocrText}`,
      type: AIRequestType.EXTRACT,
      userId: '',
    });
  }

  async translateText(text: string, targetLanguage: string): Promise<AIResponse> {
    return this.sendRequest({
      prompt: `Translate the following text to ${targetLanguage}:\n\n${text}`,
      type: AIRequestType.TRANSLATE,
      userId: '',
    });
  }

  async analyzeImage(imageDescription: string): Promise<AIResponse> {
    return this.sendRequest({
      prompt: `Analyze the following image description and provide insights relevant to field work:\n\n${imageDescription}`,
      type: AIRequestType.QUESTION,
      userId: '',
    });
  }

  // Local AI helpers (for basic operations without server)
  generateLocalSummary(text: string, maxWords = 50): string {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words: string[] = [];

    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(/\s+/);
      if (words.length + sentenceWords.length <= maxWords) {
        words.push(...sentenceWords);
      } else {
        break;
      }
    }

    return words.join(' ') + (words.length < text.split(/\s+/).length ? '...' : '');
  }

  extractKeywords(text: string): string[] {
    // Simple keyword extraction based on word frequency
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'shall', 'this', 'that',
      'these', 'those', 'it', 'its', 'as', 'if', 'then', 'than', 'so',
    ]);

    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const wordCount = new Map<string, number>();

    for (const word of words) {
      if (!stopWords.has(word) && word.length > 3) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    }

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  calculateSentiment(text: string): { score: number; label: string } {
    const positiveWords = new Set([
      'good', 'great', 'excellent', 'positive', 'success', 'complete',
      'working', 'fixed', 'resolved', 'satisfied', 'improved', 'better',
    ]);

    const negativeWords = new Set([
      'bad', 'poor', 'negative', 'failure', 'broken', 'issue', 'problem',
      'error', 'wrong', 'damaged', 'missing', 'incomplete', 'worse',
    ]);

    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of words) {
      if (positiveWords.has(word)) positiveCount++;
      if (negativeWords.has(word)) negativeCount++;
    }

    const total = positiveCount + negativeCount;
    if (total === 0) return { score: 0, label: 'neutral' };

    const score = (positiveCount - negativeCount) / total;
    const label = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';

    return { score, label };
  }
}

export const AIService = new AIServiceClass();
