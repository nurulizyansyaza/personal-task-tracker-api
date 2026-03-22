import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskEntity } from './../../src/tasks/entities/task.entity';
import { TaskStatus } from 'personal-task-tracker-core';
import { AppController } from './../../src/app.controller';
import { AppService } from './../../src/app.service';
import { TasksController } from './../../src/tasks/tasks.controller';
import { TasksService } from './../../src/tasks/tasks.service';
import { HealthController } from './../../src/health/health.controller';
import { HealthService } from './../../src/health/health.service';
import { AllExceptionsFilter } from './../../src/common/filters/all-exceptions.filter';

export interface TaskResponse {
  success: boolean;
  data: {
    id: number;
    title: string;
    description?: string;
    status: TaskStatus;
  };
  message?: string;
  errors?: { code: string; message: string }[];
}

export interface TaskListResponse {
  success: boolean;
  data: { id: number; title: string; status: TaskStatus }[];
}

export interface HealthResponse {
  status: string;
  database: { status: string };
  timestamp: string;
}

export interface ErrorResponse {
  success: boolean;
  errors?: { code: string; message: string }[];
}

export function createMockTaskRepository() {
  let tasks: TaskEntity[] = [];
  let nextId = 1;

  return {
    find: jest
      .fn()
      .mockImplementation(
        (options?: {
          where?: { status?: TaskStatus };
          order?: Record<string, string>;
        }) => {
          let result = [...tasks];
          if (options?.where?.status) {
            result = result.filter((t) => t.status === options.where!.status);
          }
          return Promise.resolve(result);
        },
      ),
    findOne: jest
      .fn()
      .mockImplementation((options: { where: { id: number } }) => {
        const task = tasks.find((t) => t.id === options.where.id);
        return Promise.resolve(task || null);
      }),
    create: jest.fn().mockImplementation((data: Partial<TaskEntity>) => {
      const task = new TaskEntity();
      Object.assign(task, data);
      return task;
    }),
    save: jest.fn().mockImplementation((task: TaskEntity) => {
      if (!task.id) {
        task.id = nextId++;
        task.created_at = new Date();
        tasks.push(task);
      } else {
        const idx = tasks.findIndex((t) => t.id === task.id);
        if (idx !== -1) tasks[idx] = task;
      }
      return Promise.resolve(task);
    }),
    remove: jest.fn().mockImplementation((task: TaskEntity) => {
      tasks = tasks.filter((t) => t.id !== task.id);
      return Promise.resolve(task);
    }),
    query: jest.fn().mockResolvedValue([{ 1: 1 }]),
    _reset: () => {
      tasks = [];
      nextId = 1;
    },
  };
}

export type MockTaskRepository = ReturnType<typeof createMockTaskRepository>;

export async function createTestApp(): Promise<{
  app: INestApplication;
  mockRepo: MockTaskRepository;
}> {
  const mockRepo = createMockTaskRepository();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    controllers: [AppController, TasksController, HealthController],
    providers: [
      AppService,
      TasksService,
      HealthService,
      {
        provide: getRepositoryToken(TaskEntity),
        useValue: mockRepo,
      },
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();

  return { app, mockRepo };
}
