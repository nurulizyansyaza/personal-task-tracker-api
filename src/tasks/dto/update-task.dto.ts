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
} from 'personal-task-tracker-core';

export class UpdateTaskDto {
  @ApiProperty({ example: 'Buy groceries', required: false })
  @IsOptional()
  @ValidateIf((o: UpdateTaskDto) => o.title !== undefined)
  @IsNotEmpty({ message: 'Title cannot be empty' })
  @IsString()
  @MaxLength(TASK_TITLE_MAX_LENGTH)
  title?: string;

  @ApiProperty({ example: 'Milk, eggs, bread', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(TASK_DESCRIPTION_MAX_LENGTH)
  description?: string | null;

  @ApiProperty({
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
    required: false,
  })
  @IsOptional()
  @IsEnum(TaskStatus, {
    message: `Status must be one of: ${Object.values(TaskStatus).join(', ')}`,
  })
  status?: TaskStatus;
}
