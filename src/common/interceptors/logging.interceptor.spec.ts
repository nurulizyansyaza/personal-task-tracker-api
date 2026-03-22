import { LoggingInterceptor } from './logging.interceptor';
import { ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let logSpy: jest.SpyInstance;

  function createMockContext(
    reqOverrides: Record<string, unknown> = {},
    resOverrides: Record<string, unknown> = {},
  ): ExecutionContext {
    const mockRequest = {
      method: 'GET',
      url: '/tasks',
      originalUrl: '/tasks',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('jest-test-agent'),
      ...reqOverrides,
    };
    const mockResponse = { statusCode: 200, ...resOverrides };
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ExecutionContext;
  }

  function createMockCallHandler(
    value: unknown = { data: 'test' },
  ): CallHandler {
    return { handle: jest.fn().mockReturnValue(of(value)) };
  }

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should call next.handle()', async () => {
    const handler = createMockCallHandler();
    await lastValueFrom(interceptor.intercept(createMockContext(), handler));

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(handler.handle).toHaveBeenCalled();
  });

  it('should log request details including method, url, status, duration, ip, and user-agent', async () => {
    await lastValueFrom(
      interceptor.intercept(createMockContext(), createMockCallHandler()),
    );

    expect(logSpy).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const logMessage = logSpy.mock.calls[0][0] as string;
    expect(logMessage).toContain('GET');
    expect(logMessage).toContain('/tasks');
    expect(logMessage).toContain('200');
    expect(logMessage).toMatch(/\d+ms/);
    expect(logMessage).toContain('127.0.0.1');
    expect(logMessage).toContain('jest-test-agent');
  });

  it('should pass through response unchanged', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(createMockContext(), createMockCallHandler()),
    );

    expect(result).toEqual({ data: 'test' });
  });

  it('should handle missing user-agent header', async () => {
    const ctx = createMockContext({
      get: jest.fn().mockReturnValue(''),
    });

    await lastValueFrom(interceptor.intercept(ctx, createMockCallHandler()));

    expect(logSpy).toHaveBeenCalledTimes(1);
  });
});
