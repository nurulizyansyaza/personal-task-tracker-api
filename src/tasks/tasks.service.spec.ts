/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskEntity } from './entities/task.entity';
import { TaskStatus } from 'personal-task-tracker-core';

const mockTask: TaskEntity = {
  id: 1,
  title: 'Test Task',
  description: 'Test description',
  status: TaskStatus.TODO,
  created_at: new Date('2026-01-01'),
};

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('TasksService', () => {
  let service: TasksService;
  let repository: jest.Mocked<Repository<TaskEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(TaskEntity),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    repository = module.get(getRepositoryToken(TaskEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      repository.find.mockResolvedValue([mockTask]);
      const result = await service.findAll();
      expect(result).toEqual([mockTask]);
      expect(repository.find).toHaveBeenCalledWith({
        where: {},
        order: { created_at: 'DESC' },
      });
    });

    it('should filter by status', async () => {
      repository.find.mockResolvedValue([mockTask]);
      await service.findAll(TaskStatus.TODO);
      expect(repository.find).toHaveBeenCalledWith({
        where: { status: TaskStatus.TODO },
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      repository.findOne.mockResolvedValue(mockTask);
      const result = await service.findOne(1);
      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a task', async () => {
      repository.create.mockReturnValue(mockTask);
      repository.save.mockResolvedValue(mockTask);
      const result = await service.create({
        title: 'Test Task',
        description: 'Test description',
      });
      expect(result).toEqual(mockTask);
      expect(repository.create).toHaveBeenCalledWith({
        title: 'Test Task',
        description: 'Test description',
        status: TaskStatus.TODO,
      });
    });

    it('should create a task without description', async () => {
      const taskNoDesc = { ...mockTask, description: null };
      repository.create.mockReturnValue(taskNoDesc);
      repository.save.mockResolvedValue(taskNoDesc);
      const result = await service.create({ title: 'Test Task' });
      expect(result.description).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updatedTask = {
        ...mockTask,
        title: 'Updated',
        status: TaskStatus.DONE,
      };
      repository.findOne.mockResolvedValue({ ...mockTask });
      repository.save.mockResolvedValue(updatedTask);
      const result = await service.update(1, {
        title: 'Updated',
        status: TaskStatus.DONE,
      });
      expect(result.title).toBe('Updated');
    });

    it('should throw NotFoundException for invalid id', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.update(999, { title: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a task', async () => {
      repository.findOne.mockResolvedValue(mockTask);
      repository.remove.mockResolvedValue(mockTask);
      await expect(service.remove(1)).resolves.toBeUndefined();
    });

    it('should throw NotFoundException for invalid id', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
