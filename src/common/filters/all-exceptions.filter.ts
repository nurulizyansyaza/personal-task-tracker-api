import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { Request, Response } from 'express';
import {
  ErrorCode,
  AppError,
  ApiErrorResponse,
  createAppError,
  getErrorMessage,
} from 'personal-task-tracker-core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const result = this.buildErrorResponse(exception, request.url);
    this.logException(request, result, exception);
    response.status(result.statusCode).json(result);
  }

  private logException(
    request: Request,
    result: ApiErrorResponse,
    exception: unknown,
  ): void {
    const prefix = `${request.method} ${request.url} → ${result.statusCode}`;
    if (result.statusCode >= 500) {
      this.logger.error(
        prefix,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${prefix}: ${result.message}`);
    }
  }

  private buildErrorResponse(
    exception: unknown,
    path: string,
  ): ApiErrorResponse {
    const timestamp = new Date().toISOString();

    if (exception instanceof ThrottlerException) {
      return this.handleThrottler(timestamp, path);
    }

    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, timestamp, path);
    }

    if (exception instanceof QueryFailedError) {
      return this.handleQueryFailed(timestamp, path);
    }

    if (exception instanceof EntityNotFoundError) {
      return this.handleEntityNotFound(timestamp, path);
    }

    return this.handleUnknown(timestamp, path);
  }

  private handleThrottler(timestamp: string, path: string): ApiErrorResponse {
    return {
      success: false,
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      error: 'Too Many Requests',
      message: getErrorMessage(ErrorCode.RATE_LIMIT_EXCEEDED),
      errors: [createAppError(ErrorCode.RATE_LIMIT_EXCEEDED)],
      timestamp,
      path,
    };
  }

  private handleHttpException(
    exception: HttpException,
    timestamp: string,
    path: string,
  ): ApiErrorResponse {
    const status = exception.getStatus() as HttpStatus;
    const exceptionResponse = exception.getResponse();

    if (
      status === HttpStatus.BAD_REQUEST &&
      typeof exceptionResponse === 'object'
    ) {
      const resp = exceptionResponse as Record<string, unknown>;
      if (Array.isArray(resp.message)) {
        return this.handleValidationError(
          resp.message as string[],
          status,
          timestamp,
          path,
        );
      }
    }

    if (status === HttpStatus.NOT_FOUND) {
      return this.handleEntityNotFound(timestamp, path);
    }

    return this.handleGenericHttp(
      exception,
      exceptionResponse,
      status,
      timestamp,
      path,
    );
  }

  private handleValidationError(
    messages: string[],
    status: HttpStatus,
    timestamp: string,
    path: string,
  ): ApiErrorResponse {
    const errors: AppError[] = messages.map((msg) =>
      this.mapValidationMessage(msg),
    );
    return {
      success: false,
      statusCode: status,
      error: 'Bad Request',
      message: getErrorMessage(ErrorCode.VALIDATION_FAILED),
      errors,
      timestamp,
      path,
    };
  }

  private handleGenericHttp(
    exception: HttpException,
    exceptionResponse: string | object,
    status: HttpStatus,
    timestamp: string,
    path: string,
  ): ApiErrorResponse {
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as Record<string, unknown>).message as string) ||
          exception.message;

    return {
      success: false,
      statusCode: status,
      error: HttpStatus[status] || 'Error',
      message: typeof message === 'string' ? message : String(message),
      timestamp,
      path,
    };
  }

  private handleQueryFailed(timestamp: string, path: string): ApiErrorResponse {
    return {
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      message: getErrorMessage(ErrorCode.DATABASE_ERROR),
      errors: [createAppError(ErrorCode.DATABASE_ERROR)],
      timestamp,
      path,
    };
  }

  private handleEntityNotFound(
    timestamp: string,
    path: string,
  ): ApiErrorResponse {
    return {
      success: false,
      statusCode: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      message: getErrorMessage(ErrorCode.TASK_NOT_FOUND),
      errors: [createAppError(ErrorCode.TASK_NOT_FOUND)],
      timestamp,
      path,
    };
  }

  private handleUnknown(timestamp: string, path: string): ApiErrorResponse {
    return {
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: getErrorMessage(ErrorCode.INTERNAL_ERROR),
      errors: [createAppError(ErrorCode.INTERNAL_ERROR)],
      timestamp,
      path,
    };
  }

  private mapValidationMessage(msg: string): AppError {
    const lower = msg.toLowerCase();

    if (lower.includes('title') && lower.includes('empty')) {
      return createAppError(ErrorCode.TITLE_REQUIRED, 'title');
    }
    if (lower.includes('title') && lower.includes('longer')) {
      return createAppError(ErrorCode.TITLE_TOO_LONG, 'title');
    }
    if (lower.includes('description') && lower.includes('longer')) {
      return createAppError(ErrorCode.DESCRIPTION_TOO_LONG, 'description');
    }
    if (lower.includes('status must be')) {
      return createAppError(ErrorCode.INVALID_STATUS, 'status');
    }
    if (lower.includes('should not exist') || lower.includes('not allowed')) {
      return createAppError(ErrorCode.UNKNOWN_FIELDS, undefined, msg);
    }

    return createAppError(ErrorCode.VALIDATION_FAILED, undefined, msg);
  }
}
