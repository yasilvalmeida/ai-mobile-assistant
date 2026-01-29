import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, startDate?: Date, endDate?: Date, page = 1, limit = 100) {
    const where: any = { userId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const locations = await this.prisma.gPSLocation.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const total = await this.prisma.gPSLocation.count({ where });

    return {
      locations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async create(data: any) {
    return this.prisma.gPSLocation.create({ data });
  }

  async batchCreate(locations: any[]) {
    let created = 0;
    let failed = 0;

    for (const location of locations) {
      try {
        await this.prisma.gPSLocation.create({ data: location });
        created++;
      } catch (error) {
        failed++;
      }
    }

    return { created, failed };
  }

  async getRouteHistory(userId: string, startDate: Date, endDate: Date) {
    return this.prisma.routeHistory.findMany({
      where: {
        userId,
        startTime: { gte: startDate },
        endTime: { lte: endDate },
      },
      include: {
        startLocation: true,
        endLocation: true,
        waypoints: {
          include: {
            location: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async getStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalLocations, todayLocations, allLocations] = await Promise.all([
      this.prisma.gPSLocation.count({ where: { userId } }),
      this.prisma.gPSLocation.count({
        where: { userId, timestamp: { gte: today } },
      }),
      this.prisma.gPSLocation.findMany({
        where: { userId },
        orderBy: { timestamp: 'asc' },
        select: { latitude: true, longitude: true, timestamp: true },
      }),
    ]);

    // Calculate total distance
    let totalDistance = 0;
    let todayDistance = 0;

    for (let i = 1; i < allLocations.length; i++) {
      const prev = allLocations[i - 1];
      const curr = allLocations[i];
      const distance = this.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude,
      );
      totalDistance += distance;

      if (new Date(curr.timestamp) >= today) {
        todayDistance += distance;
      }
    }

    return {
      totalLocations,
      todayLocations,
      totalDistance,
      todayDistance,
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
