import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from '../tasks/entities/task.entity';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
  ) {}

  async check() {
    const health: Record<string, unknown> = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    try {
      await this.taskRepository.query('SELECT 1');
      health.database = { status: 'ok' };
    } catch {
      health.status = 'degraded';
      health.database = { status: 'error', message: 'Database unreachable' };
    }

    const statusCode =
      health.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    if (statusCode !== HttpStatus.OK) {
      throw new HttpException(health, statusCode);
    }

    return health;
  }
}
