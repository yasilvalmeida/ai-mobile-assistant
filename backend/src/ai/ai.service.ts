import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async processRequest(request: {
    prompt: string;
    context?: string;
    type: string;
    userId: string;
    reportId?: string;
  }) {
    const startTime = Date.now();

    // Store the request
    const aiRequest = await this.prisma.aIRequest.create({
      data: {
        userId: request.userId,
        type: request.type as any,
        prompt: request.prompt,
        context: request.context,
        reportId: request.reportId,
      },
    });

    try {
      // Process based on type
      let response: string;
      let confidence: number;

      switch (request.type) {
        case 'summarize':
          response = this.generateSummary(request.prompt);
          confidence = 0.85;
          break;
        case 'suggest':
          response = this.generateSuggestions(request.prompt);
          confidence = 0.75;
          break;
        case 'extract':
          response = this.extractData(request.prompt);
          confidence = 0.80;
          break;
        case 'question':
          response = this.answerQuestion(request.prompt, request.context);
          confidence = 0.70;
          break;
        case 'translate':
          response = request.prompt; // Placeholder
          confidence = 0.90;
          break;
        default:
          response = 'I\'m not sure how to process that request.';
          confidence = 0.50;
      }

      const processingTime = Date.now() - startTime;
      const tokensUsed = Math.ceil(request.prompt.length / 4) + Math.ceil(response.length / 4);

      // Store the response
      await this.prisma.aIResponse.create({
        data: {
          requestId: aiRequest.id,
          response,
          confidence,
          tokensUsed,
          processingTimeMs: processingTime,
        },
      });

      // Update request status
      await this.prisma.aIRequest.update({
        where: { id: aiRequest.id },
        data: { status: 'COMPLETED' },
      });

      return {
        response,
        confidence,
        tokensUsed,
        processingTime,
      };
    } catch (error) {
      await this.prisma.aIRequest.update({
        where: { id: aiRequest.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  private generateSummary(text: string): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length <= 3) {
      return text;
    }

    // Return first 3 sentences as summary
    return sentences.slice(0, 3).join('. ') + '.';
  }

  private generateSuggestions(context: string): string {
    const suggestions = [
      'Consider documenting any issues found with photos',
      'Follow up on any action items within 24 hours',
      'Update the report status when work is completed',
      'Share findings with relevant team members',
      'Schedule a follow-up visit if needed',
    ];

    // Return 3 random suggestions
    const selected = suggestions
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    return 'Suggestions:\n' + selected.map((s, i) => `${i + 1}. ${s}`).join('\n');
  }

  private extractData(text: string): string {
    const extracted: Record<string, string> = {};

    // Extract dates
    const dateMatch = text.match(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/);
    if (dateMatch) extracted.date = dateMatch[0];

    // Extract numbers/amounts
    const amountMatch = text.match(/\$[\d,]+\.?\d*/);
    if (amountMatch) extracted.amount = amountMatch[0];

    // Extract email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) extracted.email = emailMatch[0];

    // Extract phone
    const phoneMatch = text.match(/[\d\s()-]{10,}/);
    if (phoneMatch) extracted.phone = phoneMatch[0].trim();

    if (Object.keys(extracted).length === 0) {
      return 'No structured data could be extracted from the text.';
    }

    return 'Extracted data:\n' +
      Object.entries(extracted)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n');
  }

  private answerQuestion(question: string, context?: string): string {
    if (!context) {
      return 'I need more context to answer that question. Please provide relevant information or select a report.';
    }

    // Simple keyword-based response
    const lowQuestion = question.toLowerCase();
    const lowContext = context.toLowerCase();

    if (lowQuestion.includes('status')) {
      if (lowContext.includes('completed') || lowContext.includes('done')) {
        return 'Based on the context, the status appears to be completed.';
      }
      if (lowContext.includes('in progress') || lowContext.includes('ongoing')) {
        return 'Based on the context, the work is still in progress.';
      }
    }

    if (lowQuestion.includes('when') || lowQuestion.includes('date')) {
      const dateMatch = context.match(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/);
      if (dateMatch) {
        return `The date mentioned is ${dateMatch[0]}.`;
      }
    }

    return 'Based on the provided context, I found the following relevant information: ' +
      context.substring(0, 200) + (context.length > 200 ? '...' : '');
  }
}
