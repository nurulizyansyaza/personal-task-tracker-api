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

    if (result.statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${result.statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} → ${result.statusCode}: ${result.message}`,
      );
    }

    response.status(result.statusCode).json(result);
  }

  private buildErrorResponse(
    exception: unknown,
    path: string,
  ): ApiErrorResponse {
    const timestamp = new Date().toISOString();

    // Rate limit (ThrottlerException)
    if (exception instanceof ThrottlerException) {
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

    // Validation errors from ValidationPipe
    if (exception instanceof HttpException) {
      const status = exception.getStatus() as HttpStatus;
      const exceptionResponse = exception.getResponse();

      if (
        status === HttpStatus.BAD_REQUEST &&
        typeof exceptionResponse === 'object'
      ) {
        const resp = exceptionResponse as Record<string, unknown>;
        if (Array.isArray(resp.message)) {
          const errors: AppError[] = this.mapValidationErrors(
            resp.message as string[],
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
      }

      // Not found from ParseIntPipe or NotFoundException
      if (status === HttpStatus.NOT_FOUND) {
        return {
          success: false,
          statusCode: status,
          error: 'Not Found',
          message: getErrorMessage(ErrorCode.TASK_NOT_FOUND),
          errors: [createAppError(ErrorCode.TASK_NOT_FOUND)],
          timestamp,
          path,
        };
      }

      // Generic HTTP exception
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : ((exceptionResponse as Record<string, unknown>)
              .message as string) || exception.message;

      return {
        success: false,
        statusCode: status,
        error: HttpStatus[status] || 'Error',
        message: typeof message === 'string' ? message : String(message),
        timestamp,
        path,
      };
    }

    // TypeORM: query failed (duplicate key, constraint violation, etc.)
    if (exception instanceof QueryFailedError) {
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

    // TypeORM: entity not found
    if (exception instanceof EntityNotFoundError) {
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

    // Unknown / unhandled
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

  private mapValidationErrors(messages: string[]): AppError[] {
    return messages.map((msg) => {
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
    });
  }
}
