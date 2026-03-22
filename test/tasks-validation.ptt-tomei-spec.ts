import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import {
  ErrorResponse,
  TaskListResponse,
  MockTaskRepository,
  createTestApp,
} from './helpers/ptt-tomei-setup';

describe('PTT Tomei — Validation', () => {
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

  it('should return 400 when creating a task with empty title', async () => {
    const res = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: '' })
      .expect(400);

    expect((res.body as ErrorResponse).success).toBe(false);
    expect((res.body as ErrorResponse).errors).toBeDefined();
  });

  it('should return 400 when creating a task with extra fields', async () => {
    const res = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'Valid', unknownField: 'not allowed' })
      .expect(400);

    expect((res.body as ErrorResponse).success).toBe(false);
  });

  it('should return 400 when updating with invalid status', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'Test task' })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/tasks')
      .expect(200);

    const taskId = (listRes.body as TaskListResponse).data[0].id;

    const res = await request(app.getHttpServer())
      .put(`/tasks/${taskId}`)
      .send({ status: 'INVALID' })
      .expect(400);

    expect((res.body as ErrorResponse).success).toBe(false);
  });
});
