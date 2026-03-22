import redisConfig from './redis.config';

describe('RedisConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return default values when no env vars are set', () => {
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_TTL;

    const config = redisConfig();

    expect(config.host).toBe('localhost');
    expect(config.port).toBe(6379);
    expect(config.ttl).toBe(60);
  });

  it('should use env vars when set', () => {
    process.env.REDIS_HOST = 'redis.example.com';
    process.env.REDIS_PORT = '6380';
    process.env.REDIS_TTL = '300';

    const config = redisConfig();

    expect(config.host).toBe('redis.example.com');
    expect(config.port).toBe(6380);
    expect(config.ttl).toBe(300);
  });

  it('should parse port and ttl as numbers', () => {
    process.env.REDIS_PORT = '6381';
    process.env.REDIS_TTL = '120';

    const config = redisConfig();

    expect(typeof config.port).toBe('number');
    expect(typeof config.ttl).toBe('number');
    expect(config.port).toBe(6381);
    expect(config.ttl).toBe(120);
  });
});
