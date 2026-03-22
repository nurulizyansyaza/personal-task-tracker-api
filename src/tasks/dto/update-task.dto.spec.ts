import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateTaskDto } from './update-task.dto';
import {
  TaskStatus,
  getErrorMessage,
  ErrorCode,
  TASK_TITLE_MAX_LENGTH,
  TASK_DESCRIPTION_MAX_LENGTH,
} from 'personal-task-tracker-core';

describe('UpdateTaskDto', () => {
  function createDto(partial: Partial<UpdateTaskDto>): UpdateTaskDto {
    return plainToInstance(UpdateTaskDto, partial);
  }

  it('should pass validation with an empty DTO (all fields optional)', async () => {
    const dto = createDto({});
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass validation with a valid title update', async () => {
    const dto = createDto({ title: 'Updated title' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass validation with a valid status of TODO', async () => {
    const dto = createDto({ status: TaskStatus.TODO });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass validation with a valid status of IN_PROGRESS', async () => {
    const dto = createDto({ status: TaskStatus.IN_PROGRESS });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass validation with a valid status of DONE', async () => {
    const dto = createDto({ status: TaskStatus.DONE });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail validation with an invalid status', async () => {
    const dto = createDto({ status: 'INVALID' as TaskStatus });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const statusError = errors.find((e) => e.property === 'status');
    expect(statusError).toBeDefined();
    const messages = Object.values(statusError!.constraints || {});
    expect(messages).toContain(getErrorMessage(ErrorCode.INVALID_STATUS));
  });

  it('should fail validation when title is empty string', async () => {
    const dto = createDto({ title: '' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const titleError = errors.find((e) => e.property === 'title');
    expect(titleError).toBeDefined();
    const messages = Object.values(titleError!.constraints || {});
    expect(messages).toContain(getErrorMessage(ErrorCode.TITLE_REQUIRED));
  });

  it('should fail validation when title exceeds max length', async () => {
    const dto = createDto({ title: 'a'.repeat(TASK_TITLE_MAX_LENGTH + 1) });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const titleError = errors.find((e) => e.property === 'title');
    expect(titleError).toBeDefined();
    const messages = Object.values(titleError!.constraints || {});
    expect(messages).toContain(getErrorMessage(ErrorCode.TITLE_TOO_LONG));
  });

  it('should fail validation when description exceeds max length', async () => {
    const dto = createDto({
      description: 'a'.repeat(TASK_DESCRIPTION_MAX_LENGTH + 1),
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const descError = errors.find((e) => e.property === 'description');
    expect(descError).toBeDefined();
    const messages = Object.values(descError!.constraints || {});
    expect(messages).toContain(getErrorMessage(ErrorCode.DESCRIPTION_TOO_LONG));
  });
});
