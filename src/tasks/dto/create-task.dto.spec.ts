import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateTaskDto } from './create-task.dto';
import {
  getErrorMessage,
  ErrorCode,
  TASK_TITLE_MAX_LENGTH,
  TASK_DESCRIPTION_MAX_LENGTH,
} from 'personal-task-tracker-core';

describe('CreateTaskDto', () => {
  function createDto(partial: Partial<CreateTaskDto>): CreateTaskDto {
    return plainToInstance(CreateTaskDto, partial);
  }

  it('should pass validation with a valid title', async () => {
    const dto = createDto({ title: 'Buy groceries' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass validation with a valid title and description', async () => {
    const dto = createDto({
      title: 'Buy groceries',
      description: 'Milk, eggs, bread',
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail validation when title is empty', async () => {
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
      title: 'Valid title',
      description: 'a'.repeat(TASK_DESCRIPTION_MAX_LENGTH + 1),
    });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const descError = errors.find((e) => e.property === 'description');
    expect(descError).toBeDefined();
    const messages = Object.values(descError!.constraints || {});
    expect(messages).toContain(getErrorMessage(ErrorCode.DESCRIPTION_TOO_LONG));
  });

  it('should pass validation when description is null', async () => {
    const dto = createDto({ title: 'Valid title', description: null });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should fail validation when title is a number', async () => {
    const dto = createDto({ title: 123 as unknown as string });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const titleError = errors.find((e) => e.property === 'title');
    expect(titleError).toBeDefined();
    expect(titleError!.constraints).toHaveProperty('isString');
  });
});
