import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { TaskEntity } from '../tasks/entities/task.entity';

describe('HealthController', () => {
  let controller: HealthController;
  let mockRepository: { query: jest.Mock };

  beforeEach(async () => {
    mockRepository = { query: jest.fn().mockResolvedValue([{ 1: 1 }]) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: getRepositoryToken(TaskEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return healthy status when database is reachable', async () => {
    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.database).toEqual({ status: 'ok' });
    expect(result.timestamp).toBeDefined();
    expect(result.uptime).toBeDefined();
  });

  it('should return degraded when database is unreachable', async () => {
    mockRepository.query.mockRejectedValue(new Error('Connection refused'));

    await expect(controller.check()).rejects.toThrow();
  });
});
