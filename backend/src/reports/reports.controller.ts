import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async findAll(
    @Query('userId') userId: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('query') query?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.findAll(userId, {
      category,
      status,
      query,
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 20,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Post()
  async create(@Body() createReportDto: any) {
    return this.reportsService.create(createReportDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateReportDto: any) {
    return this.reportsService.update(id, updateReportDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.reportsService.delete(id);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  async addAttachment(
    @Param('id') reportId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const attachment = {
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
    };
    return this.reportsService.addAttachment(reportId, attachment);
  }

  @Delete(':id/attachments/:attachmentId')
  async deleteAttachment(
    @Param('id') reportId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.reportsService.deleteAttachment(reportId, attachmentId);
  }

  @Post(':id/ai-summary')
  async generateAISummary(@Param('id') reportId: string) {
    return this.reportsService.generateAISummary(reportId);
  }
}
