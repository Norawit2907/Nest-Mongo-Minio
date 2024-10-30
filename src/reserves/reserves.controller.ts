import {
  Controller, Get, Post, Put, Delete, Param, Body,
  Query
} from '@nestjs/common';
import { ReservesDto } from './dto/reserves.dto';
import { CreateWatDto } from 'src/wats/dto/create-wat.dto';
import { UpdateReservesDto } from './dto/update-reserves.dto';
import { ReservesService } from './reserves.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Reserves } from 'src/model/reserves.model';
import { ReservesMongo } from 'src/server-adaptor-mongo/reserves.schema.mongo';

@ApiTags('reserves')
@Controller('reserves')
export class ReservesController {
  constructor(private readonly reservesService: ReservesService) { }

  @Get()
  @ApiOperation({ summary: 'Retrieve all reserves' })
  @ApiResponse({ status: 200, description: 'List of all reserves' })
  findAll() {
    return this.reservesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a reserve by ID' })
  @ApiParam({ name: 'id', example: '6521d8e7abf8f1234567890', description: 'ID of the reserve' })
  @ApiResponse({ status: 200, description: 'Reserve found' })
  @ApiResponse({ status: 404, description: 'Reserve not found' })
  findOne(@Param('id') id: string) {
    return this.reservesService.findOne(id);
  }

  @Get('/wat/:id')
  @ApiOperation({ summary: 'Retrieve a reserve by ID' })
  @ApiParam({ name: 'id', example: '6521d8e7abf8f1234567890', description: 'ID of the reserve' })
  @ApiResponse({ status: 200, description: 'Reserve found' })
  @ApiResponse({ status: 404, description: 'Reserve not found' })
  getReservationsByWatId(@Param('id') id: string) {
    return this.reservesService.getReservationsByWatId(id);
  }

  @Get('/watwork/:id')
  @ApiOperation({ summary: 'Retrieve a reserve by ID' })
  @ApiParam({ name: 'id', example: '6521d8e7abf8f1234567890', description: 'ID of the reserve' })
  @ApiResponse({ status: 200, description: 'Reserve found' })
  @ApiResponse({ status: 404, description: 'Reserve not found' })
  getReservationsAmount(@Param('id') id: string) {
    return this.reservesService.getReservationsAmount(id);
  }

  @Get('/cremationsload/:id')
  @ApiOperation({ summary: 'Retrieve a reserve by ID' })
  @ApiParam({ name: 'id', example: '6521d8e7abf8f1234567890', description: 'ID of the reserve' })
  @ApiResponse({ status: 200, description: 'Reserve found' })
  @ApiResponse({ status: 404, description: 'Reserve not found' })
  getCremationsAmount(@Param('id') id: string) {
    return this.reservesService.getReservationsAmount(id);
  }

  

  @Post()
  @ApiOperation({ summary: 'Create a new reserve' })
  @ApiResponse({ status: 201, description: 'Reserve successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() createReserveDto: ReservesDto) {
    return this.reservesService.create(createReserveDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a reserve by ID' })
  @ApiParam({ name: 'id', example: '6521d8e7abf8f1234567890', description: 'ID of the reserve to update' })
  @ApiResponse({ status: 200, description: 'Reserve successfully updated' })
  @ApiResponse({ status: 404, description: 'Reserve not found' })
  update(
    @Param('id') id: string,
    @Body() updateReserveDto: UpdateReservesDto,
  ) {
    return this.reservesService.update(id, updateReserveDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reserve by ID' })
  @ApiParam({ name: 'id', example: '6521d8e7abf8f1234567890', description: 'ID of the reserve to delete' })
  @ApiResponse({ status: 200, description: 'Reserve successfully deleted' })
  @ApiResponse({ status: 404, description: 'Reserve not found' })
  delete(@Param('id') id: string) {
    return this.reservesService.delete(id);
  }
}
