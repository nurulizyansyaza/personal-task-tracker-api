import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  TASK_TITLE_MAX_LENGTH,
  TASK_DESCRIPTION_MAX_LENGTH,
} from 'personal-task-tracker-core';

export class CreateTaskDto {
  @ApiProperty({ example: 'Buy groceries', description: 'Task title' })
  @IsNotEmpty({ message: 'Title is required and cannot be empty' })
  @IsString()
  @MaxLength(TASK_TITLE_MAX_LENGTH)
  title: string;

  @ApiProperty({
    example: 'Milk, eggs, bread',
    description: 'Task description',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(TASK_DESCRIPTION_MAX_LENGTH)
  description?: string | null;
}
