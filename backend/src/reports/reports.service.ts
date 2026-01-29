import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filters?: any) {
    const where: any = { userId };

    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    const reports = await this.prisma.fieldReport.findMany({
      where,
      include: {
        attachments: true,
        ocrResults: true,
        location: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: filters?.limit || 20,
      skip: ((filters?.page || 1) - 1) * (filters?.limit || 20),
    });

    const total = await this.prisma.fieldReport.count({ where });

    return {
      reports,
      pagination: {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        total,
        totalPages: Math.ceil(total / (filters?.limit || 20)),
        hasNext: (filters?.page || 1) * (filters?.limit || 20) < total,
        hasPrev: (filters?.page || 1) > 1,
      },
    };
  }

  async findOne(id: string) {
    const report = await this.prisma.fieldReport.findUnique({
      where: { id },
      include: {
        attachments: true,
        ocrResults: true,
        location: true,
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  async create(data: any) {
    const { location, attachments, ocrResults, ...reportData } = data;

    return this.prisma.fieldReport.create({
      data: {
        ...reportData,
        location: location ? { create: location } : undefined,
        attachments: attachments?.length ? { create: attachments } : undefined,
        ocrResults: ocrResults?.length ? { create: ocrResults } : undefined,
      },
      include: {
        attachments: true,
        ocrResults: true,
        location: true,
      },
    });
  }

  async update(id: string, data: any) {
    await this.findOne(id);

    return this.prisma.fieldReport.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        attachments: true,
        ocrResults: true,
        location: true,
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.fieldReport.delete({ where: { id } });
    return { success: true };
  }

  async addAttachment(reportId: string, attachment: any) {
    await this.findOne(reportId);

    return this.prisma.attachment.create({
      data: {
        ...attachment,
        reportId,
      },
    });
  }

  async deleteAttachment(reportId: string, attachmentId: string) {
    await this.prisma.attachment.delete({
      where: { id: attachmentId },
    });
    return { success: true };
  }

  async generateAISummary(reportId: string) {
    const report = await this.findOne(reportId);

    // Placeholder for AI integration
    const summary = `Summary of "${report.title}": ${report.description?.substring(0, 200)}...`;
    const suggestions = [
      'Consider adding more details to the description',
      'Attach relevant photos for documentation',
      'Mark the report as completed when finished',
    ];

    await this.prisma.fieldReport.update({
      where: { id: reportId },
      data: {
        aiSummary: summary,
        aiSuggestions: suggestions,
      },
    });

    return { summary, suggestions };
  }
}
