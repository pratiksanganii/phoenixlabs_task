import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ScreenId } from '@phoenixlabs/form-engine';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';

describe('SessionController', () => {
  let controller: SessionController;
  let prisma: {
    session: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    sessionHistory: { create: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    prisma = {
      session: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      sessionHistory: {
        create: vi.fn(),
      },
      $transaction: vi.fn((operations: unknown[]) => Promise.all(operations)),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionController],
      providers: [
        SessionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<SessionController>(SessionController);
  });

  describe('POST /api/session/start', () => {
    it('creates a session and returns AGE as current screen', async () => {
      const sessionId = '11111111-1111-4111-8111-111111111111';
      prisma.session.create.mockResolvedValue({
        id: sessionId,
        savedAnswers: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await controller.startSession();

      expect(prisma.session.create).toHaveBeenCalledTimes(1);
      expect(prisma.session.create).toHaveBeenCalledWith({
        data: { savedAnswers: {} },
      });
      expect(result.sessionId).toBe(sessionId);
      expect(result.currentScreenId).toBe(ScreenId.AGE);
      expect(result.evaluationResult).toBeNull();
    });
  });

  describe('POST /api/session/answer', () => {
    const sessionId = '22222222-2222-4222-8222-222222222222';

    it('skips transaction when duplicate answer matches existing state', async () => {
      const duplicateAnswer = 30;
      prisma.session.findUnique.mockResolvedValue({
        id: sessionId,
        savedAnswers: { [ScreenId.AGE]: duplicateAnswer },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await controller.submitAnswer({
        sessionId,
        screenId: ScreenId.AGE,
        answer: duplicateAnswer,
      });

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result.sessionId).toBe(sessionId);
      expect(result.currentScreenId).toBe(ScreenId.WEIGHT);
    });

    it('runs transaction when answer is new or changed', async () => {
      prisma.session.findUnique.mockResolvedValue({
        id: sessionId,
        savedAnswers: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.session.update.mockResolvedValue({});
      prisma.sessionHistory.create.mockResolvedValue({});

      await controller.submitAnswer({
        sessionId,
        screenId: ScreenId.AGE,
        answer: 25,
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.session.update).toHaveBeenCalled();
      expect(prisma.sessionHistory.create).toHaveBeenCalled();
    });
  });

  describe('GET /api/session/:id', () => {
    it('throws 404 when session token is unknown', async () => {
      const unknownId = '33333333-3333-4333-8333-333333333333';
      prisma.session.findUnique.mockResolvedValue(null);

      await expect(controller.getSession(unknownId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
