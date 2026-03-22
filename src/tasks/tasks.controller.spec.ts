import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskStatus } from 'personal-task-tracker-core';
import { TaskEntity } from './entities/task.entity';

const mockTask: TaskEntity = {
  id: 1,
  title: 'Test Task',
  description: 'Test description',
  status: TaskStatus.TODO,
  created_at: new Date('2026-01-01'),
};

const mockTasksService = {
  findAll: jest.fn().mockResolvedValue([mockTask]),
  findOne: jest.fn().mockResolvedValue(mockTask),
  create: jest.fn().mockResolvedValue(mockTask),
  update: jest.fn().mockResolvedValue({ ...mockTask, status: TaskStatus.DONE }),
  remove: jest.fn().mockResolvedValue(undefined),
};

describe('TasksController', () => {
  let controller: TasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: mockTasksService }],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /tasks', () => {
    it('should return all tasks', async () => {
      const result = await controller.findAll();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should filter by status', async () => {
      await controller.findAll(TaskStatus.TODO);
      expect(mockTasksService.findAll).toHaveBeenCalledWith(TaskStatus.TODO);
    });
  });

  describe('GET /tasks/:id', () => {
    it('should return a task', async () => {
      const result = await controller.findOne(1);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
    });
  });

  describe('POST /tasks', () => {
    it('should create a task', async () => {
      const result = await controller.create({ title: 'Test Task' });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Task created successfully');
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update a task', async () => {
      const result = await controller.update(1, { status: TaskStatus.DONE });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Task updated successfully');
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task', async () => {
      const result = await controller.remove(1);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Task deleted successfully');
    });
  });
});
