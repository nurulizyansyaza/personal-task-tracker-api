import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import {
  ErrorResponse,
  MockTaskRepository,
  createTestApp,
} from './helpers/ptt-tomei-setup';

describe('PTT Tomei — Not Found', () => {
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

  it('should return 404 for non-existent task', async () => {
    const res = await request(app.getHttpServer())
      .get('/tasks/99999')
      .expect(404);

    expect((res.body as ErrorResponse).success).toBe(false);
    expect((res.body as ErrorResponse).errors).toBeDefined();
  });

  it('should return 404 when updating non-existent task', async () => {
    await request(app.getHttpServer())
      .put('/tasks/99999')
      .send({ title: 'Nope' })
      .expect(404);
  });

  it('should return 404 when deleting non-existent task', async () => {
    await request(app.getHttpServer()).delete('/tasks/99999').expect(404);
  });
});
