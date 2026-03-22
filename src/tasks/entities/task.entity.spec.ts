import { TaskEntity } from './task.entity';
import { TaskStatus } from 'personal-task-tracker-core';

describe('TaskEntity', () => {
  it('should create an entity with default values', () => {
    const task = new TaskEntity();

    expect(task).toBeDefined();
    expect(task).toBeInstanceOf(TaskEntity);
    expect(task.id).toBeUndefined();
    expect(task.title).toBeUndefined();
    expect(task.description).toBeUndefined();
    expect(task.created_at).toBeUndefined();
  });

  it('should allow setting all properties', () => {
    const task = new TaskEntity();
    task.id = 1;
    task.title = 'Test Task';
    task.description = 'A test description';
    task.status = TaskStatus.IN_PROGRESS;
    task.created_at = new Date('2026-01-01');

    expect(task.id).toBe(1);
    expect(task.title).toBe('Test Task');
    expect(task.description).toBe('A test description');
    expect(task.status).toBe(TaskStatus.IN_PROGRESS);
    expect(task.created_at).toEqual(new Date('2026-01-01'));
  });

  it('should accept null description', () => {
    const task = new TaskEntity();
    task.description = null;

    expect(task.description).toBeNull();
  });

  it('should accept all TaskStatus enum values', () => {
    const task = new TaskEntity();

    task.status = TaskStatus.TODO;
    expect(task.status).toBe('TODO');

    task.status = TaskStatus.IN_PROGRESS;
    expect(task.status).toBe('IN_PROGRESS');

    task.status = TaskStatus.DONE;
    expect(task.status).toBe('DONE');
  });
});
