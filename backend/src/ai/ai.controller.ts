import { Controller, Post, Body } from '@nestjs/common';
import { AIService } from './ai.service';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('process')
  async process(
    @Body() request: {
      prompt: string;
      context?: string;
      type: string;
      userId: string;
      reportId?: string;
    },
  ) {
    return this.aiService.processRequest(request);
  }

  @Post('summarize')
  async summarize(
    @Body() body: { text: string; userId: string; reportId?: string },
  ) {
    return this.aiService.processRequest({
      prompt: body.text,
      type: 'summarize',
      userId: body.userId,
      reportId: body.reportId,
    });
  }

  @Post('suggest')
  async suggest(
    @Body() body: { context: string; userId: string; reportId?: string },
  ) {
    return this.aiService.processRequest({
      prompt: body.context,
      type: 'suggest',
      userId: body.userId,
      reportId: body.reportId,
    });
  }

  @Post('extract')
  async extract(
    @Body() body: { text: string; userId: string },
  ) {
    return this.aiService.processRequest({
      prompt: body.text,
      type: 'extract',
      userId: body.userId,
    });
  }

  @Post('question')
  async question(
    @Body() body: { question: string; context?: string; userId: string },
  ) {
    return this.aiService.processRequest({
      prompt: body.question,
      context: body.context,
      type: 'question',
      userId: body.userId,
    });
  }
}
