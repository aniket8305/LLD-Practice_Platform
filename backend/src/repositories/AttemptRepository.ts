import { PrismaClient } from '@prisma/client';
import { Attempt, AttemptData } from '../domain/Attempt.js';
import { AttemptStatus } from '../domain/types.js';

export class AttemptRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(attempt: Attempt): Promise<void> {
    const data = attempt.toData();
    await this.prisma.attempt.create({
      data: {
        id: data.id,
        problemId: data.problemId,
        learnerIdentifier: data.learnerIdentifier,
        attemptNumber: data.attemptNumber,
        status: data.status,
        createdAt: data.createdAt,
        submittedAt: data.submittedAt,
        evaluatedAt: data.evaluatedAt,
        failureReason: data.failureReason,
        retryCount: data.retryCount,
        idempotencyKey: data.idempotencyKey,
      },
    });
  }

  async findById(id: string): Promise<Attempt | null> {
    const raw = await this.prisma.attempt.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findByLearnerAndProblem(
    learnerIdentifier: string,
    problemId: string
  ): Promise<Attempt[]> {
    const raws = await this.prisma.attempt.findMany({
      where: { learnerIdentifier, problemId },
      orderBy: { attemptNumber: 'desc' },
    });
    return raws.map(this.toDomain);
  }

  async findByLearner(learnerIdentifier: string): Promise<Attempt[]> {
    const raws = await this.prisma.attempt.findMany({
      where: { learnerIdentifier },
      orderBy: { createdAt: 'desc' },
    });
    return raws.map(this.toDomain);
  }

  async getNextAttemptNumber(
    problemId: string,
    learnerIdentifier: string
  ): Promise<number> {
    const lastAttempt = await this.prisma.attempt.findFirst({
      where: { problemId, learnerIdentifier },
      orderBy: { attemptNumber: 'desc' },
    });
    return (lastAttempt?.attemptNumber ?? 0) + 1;
  }

  async update(attempt: Attempt): Promise<void> {
    const data = attempt.toData();
    await this.prisma.attempt.update({
      where: { id: data.id },
      data: {
        status: data.status,
        submittedAt: data.submittedAt,
        evaluatedAt: data.evaluatedAt,
        failureReason: data.failureReason,
        retryCount: data.retryCount,
        idempotencyKey: data.idempotencyKey,
      },
    });
  }

  private toDomain(raw: any): Attempt {
    return new Attempt({
      id: raw.id,
      problemId: raw.problemId,
      learnerIdentifier: raw.learnerIdentifier,
      attemptNumber: raw.attemptNumber,
      status: raw.status as AttemptStatus,
      createdAt: raw.createdAt,
      submittedAt: raw.submittedAt,
      evaluatedAt: raw.evaluatedAt,
      failureReason: raw.failureReason,
      retryCount: raw.retryCount,
      idempotencyKey: raw.idempotencyKey,
    });
  }
}
