import {
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  TaskStatus,
  TASK_TITLE_MAX_LENGTH,
  TASK_DESCRIPTION_MAX_LENGTH,
  getErrorMessage,
  ErrorCode,
} from 'personal-task-tracker-core';

export class UpdateTaskDto {
  @ApiProperty({ example: 'Buy groceries', required: false })
  @IsOptional()
  @ValidateIf((o: UpdateTaskDto) => o.title !== undefined)
  @IsNotEmpty({ message: getErrorMessage(ErrorCode.TITLE_REQUIRED) })
  @IsString()
  @MaxLength(TASK_TITLE_MAX_LENGTH, {
    message: getErrorMessage(ErrorCode.TITLE_TOO_LONG),
  })
  title?: string;

  @ApiProperty({ example: 'Milk, eggs, bread', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(TASK_DESCRIPTION_MAX_LENGTH, {
    message: getErrorMessage(ErrorCode.DESCRIPTION_TOO_LONG),
  })
  description?: string | null;

  @ApiProperty({
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
    required: false,
  })
  @IsOptional()
  @IsEnum(TaskStatus, {
    message: getErrorMessage(ErrorCode.INVALID_STATUS),
  })
  status?: TaskStatus;
}
