import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { TaskEntity } from './../src/tasks/entities/task.entity';
import { TaskStatus } from 'personal-task-tracker-core';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';
import { TasksController } from './../src/tasks/tasks.controller';
import { TasksService } from './../src/tasks/tasks.service';
import { HealthController } from './../src/health/health.controller';
import { HealthService } from './../src/health/health.service';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';

function createMockTaskRepository() {
  let tasks: TaskEntity[] = [];
  let nextId = 1;

  return {
    find: jest.fn().mockImplementation(
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

describe('PTT Tomei (Integration)', () => {
  let app: INestApplication<App>;
  let mockRepo: ReturnType<typeof createMockTaskRepository>;

  beforeAll(async () => {
    mockRepo = createMockTaskRepository();

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

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  beforeEach(() => {
    mockRepo._reset();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /', () => {
    it('should return Hello World', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('GET /health', () => {
    it('should return 200 with ok status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.database).toEqual({ status: 'ok' });
          expect(res.body.timestamp).toBeDefined();
        });
    });
  });

  describe('Task CRUD workflow', () => {
    it('should create, read, update, and delete a task', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'PTT Task', description: 'PTT Description' })
        .expect(201);

      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.title).toBe('PTT Task');
      expect(createRes.body.data.status).toBe(TaskStatus.TODO);
      const taskId = createRes.body.data.id as number;

      const listRes = await request(app.getHttpServer())
        .get('/tasks')
        .expect(200);

      expect(listRes.body.success).toBe(true);
      expect(listRes.body.data).toHaveLength(1);

      const getRes = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .expect(200);

      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data.id).toBe(taskId);

      const updateRes = await request(app.getHttpServer())
        .put(`/tasks/${taskId}`)
        .send({ status: TaskStatus.DONE })
        .expect(200);

      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.status).toBe(TaskStatus.DONE);

      const deleteRes = await request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .expect(200);

      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.message).toBe('Task deleted successfully');

      await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .expect(404);
    });
  });

  describe('Validation', () => {
    it('should return 400 when creating a task with empty title', async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: '' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 when creating a task with extra fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'Valid', unknownField: 'not allowed' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 when updating with invalid status', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'Test task' })
        .expect(201);

      const listRes = await request(app.getHttpServer())
        .get('/tasks')
        .expect(200);

      const taskId = listRes.body.data[0].id as number;

      const res = await request(app.getHttpServer())
        .put(`/tasks/${taskId}`)
        .send({ status: 'INVALID' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Not Found', () => {
    it('should return 404 for non-existent task', async () => {
      const res = await request(app.getHttpServer())
        .get('/tasks/99999')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 404 when updating non-existent task', async () => {
      await request(app.getHttpServer())
        .put('/tasks/99999')
        .send({ title: 'Nope' })
        .expect(404);
    });

    it('should return 404 when deleting non-existent task', async () => {
      await request(app.getHttpServer())
        .delete('/tasks/99999')
        .expect(404);
    });
  });

  describe('Status Filter', () => {
    it('should filter tasks by status query parameter', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'Task 1' })
        .expect(201);

      const res2 = await request(app.getHttpServer())
        .post('/tasks')
        .send({ title: 'Task 2' })
        .expect(201);

      const task2Id = res2.body.data.id as number;
      await request(app.getHttpServer())
        .put(`/tasks/${task2Id}`)
        .send({ status: TaskStatus.DONE })
        .expect(200);

      const todoRes = await request(app.getHttpServer())
        .get('/tasks?status=TODO')
        .expect(200);

      expect(todoRes.body.success).toBe(true);
      expect(todoRes.body.data).toHaveLength(1);
      expect(todoRes.body.data[0].status).toBe(TaskStatus.TODO);
    });
  });
});
