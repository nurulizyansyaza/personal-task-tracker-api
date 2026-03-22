import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HealthService } from './health.service';
import { TaskEntity } from '../tasks/entities/task.entity';

describe('HealthService', () => {
  let service: HealthService;
  let mockRepository: { query: jest.Mock };

  beforeEach(async () => {
    mockRepository = { query: jest.fn().mockResolvedValue([{ 1: 1 }]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: getRepositoryToken(TaskEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return ok status when database is reachable', async () => {
    const result = await service.check();

    expect(result.status).toBe('ok');
  });

  it('should include timestamp, uptime, and environment', async () => {
    const result = await service.check();

    expect(result.timestamp).toBeDefined();
    expect(typeof result.timestamp).toBe('string');
    expect(result.uptime).toBeDefined();
    expect(typeof result.uptime).toBe('number');
    expect(result.environment).toBeDefined();
  });

  it('should include database status ok when DB is reachable', async () => {
    const result = await service.check();

    expect(result.database).toEqual({ status: 'ok' });
  });

  it('should throw HttpException with 503 when database is unreachable', async () => {
    mockRepository.query.mockRejectedValue(new Error('Connection refused'));

    try {
      await service.check();
      fail('Expected HttpException to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  });

  it('should include degraded status when database is down', async () => {
    mockRepository.query.mockRejectedValue(new Error('Connection refused'));

    try {
      await service.check();
      fail('Expected HttpException to be thrown');
    } catch (error) {
      const response = (error as HttpException).getResponse() as Record<
        string,
        unknown
      >;
      expect(response.status).toBe('degraded');
      expect(response.database).toEqual({
        status: 'error',
        message: 'Database unreachable',
      });
    }
  });

  it('should default environment to development when NODE_ENV is not set', async () => {
    const originalEnv = process.env.NODE_ENV;
    delete process.env.NODE_ENV;

    const result = await service.check();

    expect(result.environment).toBe('development');

    process.env.NODE_ENV = originalEnv;
  });
});
