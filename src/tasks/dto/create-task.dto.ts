import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  TASK_TITLE_MAX_LENGTH,
  TASK_DESCRIPTION_MAX_LENGTH,
  getErrorMessage,
  ErrorCode,
} from 'personal-task-tracker-core';

export class CreateTaskDto {
  @ApiProperty({ example: 'Buy groceries', description: 'Task title' })
  @IsNotEmpty({ message: getErrorMessage(ErrorCode.TITLE_REQUIRED) })
  @IsString()
  @MaxLength(TASK_TITLE_MAX_LENGTH, {
    message: getErrorMessage(ErrorCode.TITLE_TOO_LONG),
  })
  title: string;

  @ApiProperty({
    example: 'Milk, eggs, bread',
    description: 'Task description',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(TASK_DESCRIPTION_MAX_LENGTH, {
    message: getErrorMessage(ErrorCode.DESCRIPTION_TOO_LONG),
  })
  description?: string | null;
}
