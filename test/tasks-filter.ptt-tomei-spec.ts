import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { TaskStatus } from 'personal-task-tracker-core';
import {
  TaskResponse,
  TaskListResponse,
  MockTaskRepository,
  createTestApp,
} from './helpers/ptt-tomei-setup';

describe('PTT Tomei — Status Filter', () => {
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

  it('should filter tasks by status query parameter', async () => {
    await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'Task 1' })
      .expect(201);

    const res2 = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'Task 2' })
      .expect(201);

    const task2Id = (res2.body as TaskResponse).data.id;
    await request(app.getHttpServer())
      .put(`/tasks/${task2Id}`)
      .send({ status: TaskStatus.DONE })
      .expect(200);

    const todoRes = await request(app.getHttpServer())
      .get('/tasks?status=TODO')
      .expect(200);

    expect((todoRes.body as TaskListResponse).success).toBe(true);
    expect((todoRes.body as TaskListResponse).data).toHaveLength(1);
    expect((todoRes.body as TaskListResponse).data[0].status).toBe(
      TaskStatus.TODO,
    );
  });
});
