import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from 'personal-task-tracker-core';

@Entity('tasks')
export class TaskEntity {
  @ApiProperty({ example: 1, description: 'Auto-generated task ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Buy groceries', description: 'Task title' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    example: 'Milk, eggs, bread',
    description: 'Task description',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({
    enum: TaskStatus,
    example: TaskStatus.TODO,
    description: 'Task status',
  })
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @ApiProperty({
    example: '2026-03-22T10:00:00.000Z',
    description: 'Creation timestamp',
  })
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
