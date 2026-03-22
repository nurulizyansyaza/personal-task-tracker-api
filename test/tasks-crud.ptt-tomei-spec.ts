import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { TaskStatus } from 'personal-task-tracker-core';
import {
  TaskResponse,
  TaskListResponse,
  MockTaskRepository,
  createTestApp,
} from './helpers/ptt-tomei-setup';

describe('PTT Tomei — Task CRUD', () => {
  let app: INestApplication;
  let mockRepo: MockTaskRepository;

  beforeAll(async () => {
    ({ app, mockRepo } = await createTestApp());
  });

  beforeEach(() => {
    mockRepo._reset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create, read, update, and delete a task', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'PTT Task', description: 'PTT Description' })
      .expect(201);

    expect((createRes.body as TaskResponse).success).toBe(true);
    expect((createRes.body as TaskResponse).data.title).toBe('PTT Task');
    expect((createRes.body as TaskResponse).data.status).toBe(TaskStatus.TODO);
    const taskId = (createRes.body as TaskResponse).data.id;

    const listRes = await request(app.getHttpServer())
      .get('/tasks')
      .expect(200);

    expect((listRes.body as TaskListResponse).success).toBe(true);
    expect((listRes.body as TaskListResponse).data).toHaveLength(1);

    const getRes = await request(app.getHttpServer())
      .get(`/tasks/${taskId}`)
      .expect(200);

    expect((getRes.body as TaskResponse).success).toBe(true);
    expect((getRes.body as TaskResponse).data.id).toBe(taskId);

    const updateRes = await request(app.getHttpServer())
      .put(`/tasks/${taskId}`)
      .send({ status: TaskStatus.DONE })
      .expect(200);

    expect((updateRes.body as TaskResponse).success).toBe(true);
    expect((updateRes.body as TaskResponse).data.status).toBe(TaskStatus.DONE);

    const deleteRes = await request(app.getHttpServer())
      .delete(`/tasks/${taskId}`)
      .expect(200);

    expect((deleteRes.body as TaskResponse).success).toBe(true);
    expect((deleteRes.body as TaskResponse).message).toBe(
      'Task deleted successfully',
    );

    await request(app.getHttpServer()).get(`/tasks/${taskId}`).expect(404);
  });
});
