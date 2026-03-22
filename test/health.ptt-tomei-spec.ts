import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import {
  HealthResponse,
  MockTaskRepository,
  createTestApp,
} from './helpers/ptt-tomei-setup';

describe('PTT Tomei — Health & Root', () => {
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
          const body = res.body as HealthResponse;
          expect(body.status).toBe('ok');
          expect(body.database).toEqual({ status: 'ok' });
          expect(body.timestamp).toBeDefined();
        });
    });
  });
});
