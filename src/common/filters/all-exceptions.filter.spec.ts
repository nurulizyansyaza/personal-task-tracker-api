import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { AllExceptionsFilter } from './all-exceptions.filter';
import {
  ErrorCode,
  getErrorMessage,
  ApiErrorResponse,
} from 'personal-task-tracker-core';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockRequest: { method: string; url: string };
  let host: ArgumentsHost;

  function getBody(): ApiErrorResponse {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return mockResponse.json.mock.calls[0][0] as ApiErrorResponse;
  }

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = { method: 'GET', url: '/tasks' };
    host = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should handle NotFoundException', () => {
    filter.catch(new NotFoundException('Not found'), host);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    const body = getBody();
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(404);
    expect(body.message).toBe(getErrorMessage(ErrorCode.TASK_NOT_FOUND));
    expect(body.errors?.[0].code).toBe(ErrorCode.TASK_NOT_FOUND);
  });

  it('should handle validation errors (BadRequestException with array)', () => {
    const exception = new BadRequestException({
      message: ['Title is required and cannot be empty'],
      error: 'Bad Request',
      statusCode: 400,
    });
    filter.catch(exception, host);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = getBody();
    expect(body.success).toBe(false);
    expect(body.message).toBe(getErrorMessage(ErrorCode.VALIDATION_FAILED));
    expect(body.errors).toHaveLength(1);
  });

  it('should handle ThrottlerException', () => {
    filter.catch(new ThrottlerException(), host);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.TOO_MANY_REQUESTS,
    );
    const body = getBody();
    expect(body.success).toBe(false);
    expect(body.errors?.[0].code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
  });

  it('should handle QueryFailedError', () => {
    const exception = new QueryFailedError(
      'SELECT',
      [],
      new Error('Duplicate entry'),
    );
    filter.catch(exception, host);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(getBody().errors?.[0].code).toBe(ErrorCode.DATABASE_ERROR);
  });

  it('should handle EntityNotFoundError', () => {
    filter.catch(new EntityNotFoundError('TaskEntity', { id: 999 }), host);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(getBody().errors?.[0].code).toBe(ErrorCode.TASK_NOT_FOUND);
  });

  it('should handle unknown errors as 500', () => {
    filter.catch(new Error('Something broke'), host);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const body = getBody();
    expect(body.success).toBe(false);
    expect(body.errors?.[0].code).toBe(ErrorCode.INTERNAL_ERROR);
  });

  it('should handle non-Error objects as 500', () => {
    filter.catch('string error', host);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });

  it('should include timestamp and path in response', () => {
    filter.catch(new Error('test'), host);

    const body = getBody();
    expect(body.timestamp).toBeDefined();
    expect(body.path).toBe('/tasks');
  });

  it('should handle generic HttpException', () => {
    filter.catch(new HttpException('Forbidden', HttpStatus.FORBIDDEN), host);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(getBody().message).toBe('Forbidden');
  });

  it('should map title validation errors correctly', () => {
    const exception = new BadRequestException({
      message: [
        'Every task needs a title. Please add one.',
        'Your title is too long. Please keep it under 100 characters.',
      ],
      error: 'Bad Request',
      statusCode: 400,
    });
    filter.catch(exception, host);

    expect(getBody().errors).toHaveLength(2);
  });

  it('should map unknown field errors', () => {
    const exception = new BadRequestException({
      message: ['property unknownField should not exist'],
      error: 'Bad Request',
      statusCode: 400,
    });
    filter.catch(exception, host);

    expect(getBody().errors?.[0].code).toBe(ErrorCode.UNKNOWN_FIELDS);
  });
});
