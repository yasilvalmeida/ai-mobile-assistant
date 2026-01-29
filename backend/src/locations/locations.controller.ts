import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  async findAll(
    @Query('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.locationsService.findAll(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      page ? parseInt(String(page)) : 1,
      limit ? parseInt(String(limit)) : 100,
    );
  }

  @Post()
  async create(@Body() createLocationDto: any) {
    return this.locationsService.create(createLocationDto);
  }

  @Post('batch')
  async batchCreate(@Body('locations') locations: any[]) {
    return this.locationsService.batchCreate(locations);
  }

  @Get('routes')
  async getRouteHistory(
    @Query('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.locationsService.getRouteHistory(
      userId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('stats')
  async getStats(@Query('userId') userId: string) {
    return this.locationsService.getStats(userId);
  }
}
