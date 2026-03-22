import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TaskStatus } from 'personal-task-tracker-core';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskEntity } from './entities/task.entity';
import {
  TaskListSuccessDto,
  TaskSuccessDto,
  DeleteSuccessDto,
  ErrorResponseDto,
} from '../common/dto/response.dto';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List all tasks' })
  @ApiQuery({
    name: 'status',
    enum: TaskStatus,
    required: false,
    description: 'Filter tasks by status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of tasks',
    type: TaskListSuccessDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async findAll(
    @Query('status') status?: TaskStatus,
  ): Promise<{ success: boolean; data: TaskEntity[] }> {
    const tasks = await this.tasksService.findAll(status);
    return { success: true, data: tasks };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiResponse({ status: 200, description: 'Task found', type: TaskSuccessDto })
  @ApiResponse({
    status: 404,
    description: 'Task not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; data: TaskEntity }> {
    const task = await this.tasksService.findOne(id);
    return { success: true, data: task };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({
    status: 201,
    description: 'Task created',
    type: TaskSuccessDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async create(
    @Body() createTaskDto: CreateTaskDto,
  ): Promise<{ success: boolean; data: TaskEntity; message: string }> {
    const task = await this.tasksService.create(createTaskDto);
    return { success: true, data: task, message: 'Task created successfully' };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({
    status: 200,
    description: 'Task updated',
    type: TaskSuccessDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<{ success: boolean; data: TaskEntity; message: string }> {
    const task = await this.tasksService.update(id, updateTaskDto);
    return { success: true, data: task, message: 'Task updated successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({
    status: 200,
    description: 'Task deleted',
    type: DeleteSuccessDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; message: string }> {
    await this.tasksService.remove(id);
    return { success: true, message: 'Task deleted successfully' };
  }
}
