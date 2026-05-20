import { Injectable, NotFoundException } from '@nestjs/common';
import {
  determineCurrentActiveScreen,
  evaluateEligibility,
  FormResponse,
  ScreenId,
} from '@phoenixlabs/form-engine';
import { Prisma } from '../../prisma/generated/client';
import { PrismaService } from '../prisma/prisma.service';
import { SessionStateResponse } from './dto/session-state-response.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async startSession(): Promise<SessionStateResponse> {
    const session = await this.prisma.session.create({
      data: { savedAnswers: {} },
    });

    return this.buildSessionState(session.id, {});
  }

  async submitAnswer(dto: SubmitAnswerDto): Promise<SessionStateResponse> {
    const session = await this.prisma.session.findUnique({
      where: { id: dto.sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session ${dto.sessionId} not found.`);
    }

    const savedAnswers = this.parseSavedAnswers(session.savedAnswers);
    const existingAnswer = savedAnswers[dto.screenId];

    if (
      existingAnswer !== undefined &&
      this.answersEqual(existingAnswer, dto.answer)
    ) {
      return this.buildSessionState(session.id, savedAnswers);
    }

    const mergedAnswers: Partial<FormResponse> = {
      ...savedAnswers,
      [dto.screenId]: dto.answer,
    } as Partial<FormResponse>;

    await this.prisma.$transaction([
      this.prisma.session.update({
        where: { id: dto.sessionId },
        data: {
          savedAnswers: mergedAnswers as Prisma.InputJsonValue,
        },
      }),
      this.prisma.sessionHistory.create({
        data: {
          sessionId: dto.sessionId,
          savedAnswers: mergedAnswers as Prisma.InputJsonValue,
        },
      }),
    ]);

    return this.buildSessionState(dto.sessionId, mergedAnswers);
  }

  async getSession(sessionId: string): Promise<SessionStateResponse> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found.`);
    }

    return this.buildSessionState(
      session.id,
      this.parseSavedAnswers(session.savedAnswers),
    );
  }

  private buildSessionState(
    sessionId: string,
    savedAnswers: Partial<FormResponse>,
  ): SessionStateResponse {
    const currentScreenId = determineCurrentActiveScreen(savedAnswers);
    const evaluationResult =
      currentScreenId === ScreenId.FINAL_SCREEN
        ? evaluateEligibility(savedAnswers)
        : null;

    return {
      sessionId,
      currentScreenId,
      savedAnswers,
      evaluationResult,
    };
  }

  private parseSavedAnswers(value: Prisma.JsonValue): Partial<FormResponse> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return value as Partial<FormResponse>;
  }

  private answersEqual(existing: unknown, incoming: unknown): boolean {
    return JSON.stringify(existing) === JSON.stringify(incoming);
  }
}
