import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus, ErrorCode } from 'personal-task-tracker-core';

// -- Success response wrappers --

export class TaskResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Buy groceries' })
  title: string;

  @ApiProperty({ example: 'Milk, eggs, bread', nullable: true })
  description: string | null;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.TODO })
  status: TaskStatus;

  @ApiProperty({ example: '2026-03-22T10:00:00.000Z' })
  created_at: Date;
}

export class TaskListSuccessDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [TaskResponseDto] })
  data: TaskResponseDto[];
}

export class TaskSuccessDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: TaskResponseDto })
  data: TaskResponseDto;

  @ApiProperty({ example: 'Task created successfully', required: false })
  message?: string;
}

export class DeleteSuccessDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Task deleted successfully' })
  message: string;
}

// -- Error response schemas --

export class AppErrorDto {
  @ApiProperty({ enum: ErrorCode, example: ErrorCode.TITLE_REQUIRED })
  code: string;

  @ApiProperty({ example: 'Title is required' })
  message: string;

  @ApiProperty({ example: 'title', required: false })
  field?: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiProperty({ type: [AppErrorDto], required: false })
  errors?: AppErrorDto[];

  @ApiProperty({ example: '2026-03-22T10:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/tasks', required: false })
  path?: string;
}
