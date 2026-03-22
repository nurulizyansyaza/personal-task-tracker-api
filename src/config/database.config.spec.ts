import databaseConfig from './database.config';

describe('DatabaseConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return default values when no env vars are set', () => {
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_DATABASE;
    delete process.env.NODE_ENV;

    const config = databaseConfig();

    expect(config.host).toBe('localhost');
    expect(config.port).toBe(3306);
    expect(config.username).toBe('root');
    expect(config.password).toBe('password');
    expect(config.database).toBe('task_tracker');
    expect(config.type).toBe('mariadb');
  });

  it('should use env vars when set', () => {
    process.env.DB_HOST = 'db.example.com';
    process.env.DB_PORT = '5432';
    process.env.DB_USERNAME = 'admin';
    process.env.DB_PASSWORD = 'secret';
    process.env.DB_DATABASE = 'mydb';

    const config = databaseConfig();

    expect(config.host).toBe('db.example.com');
    expect(config.port).toBe(5432);
    expect(config.username).toBe('admin');
    expect(config.password).toBe('secret');
    expect(config.database).toBe('mydb');
  });

  it('should parse port as a number', () => {
    process.env.DB_PORT = '3307';

    const config = databaseConfig();

    expect(config.port).toBe(3307);
    expect(typeof config.port).toBe('number');
  });

  it('should set synchronize to true when NODE_ENV is not production', () => {
    process.env.NODE_ENV = 'development';
    expect(databaseConfig().synchronize).toBe(true);

    process.env.NODE_ENV = 'test';
    expect(databaseConfig().synchronize).toBe(true);

    delete process.env.NODE_ENV;
    expect(databaseConfig().synchronize).toBe(true);
  });

  it('should set synchronize to false when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production';

    const config = databaseConfig();

    expect(config.synchronize).toBe(false);
  });

  it('should set logging to true when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';

    const config = databaseConfig();

    expect(config.logging).toBe(true);
  });

  it('should set logging to false when NODE_ENV is not development', () => {
    process.env.NODE_ENV = 'production';
    expect(databaseConfig().logging).toBe(false);

    process.env.NODE_ENV = 'test';
    expect(databaseConfig().logging).toBe(false);

    delete process.env.NODE_ENV;
    expect(databaseConfig().logging).toBe(false);
  });
});
