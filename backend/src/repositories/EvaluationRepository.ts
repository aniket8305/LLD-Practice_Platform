import { PrismaClient } from '@prisma/client';
import { Evaluation, EvaluationData } from '../domain/Evaluation.js';

export class EvaluationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(evaluation: Evaluation): Promise<void> {
    await this.prisma.evaluation.create({
      data: {
        id: evaluation.id,
        submissionId: evaluation.submissionId,
        evaluatorType: evaluation.evaluatorType,
        criterionResults: JSON.stringify(evaluation.criterionResults),
        overallSummary: evaluation.overallSummary,
        overallScore: evaluation.overallScore,
        metadata: evaluation.metadata ? JSON.stringify(evaluation.metadata) : null,
        evaluatedAt: evaluation.evaluatedAt,
      },
    });
  }

  async findBySubmissionId(submissionId: string): Promise<Evaluation | null> {
    const raw = await this.prisma.evaluation.findUnique({
      where: { submissionId },
    });
    return raw ? this.toDomain(raw) : null;
  }

  /** Replace an existing evaluation (for retry scenarios) */
  async upsert(evaluation: Evaluation): Promise<void> {
    await this.prisma.evaluation.upsert({
      where: { submissionId: evaluation.submissionId },
      create: {
        id: evaluation.id,
        submissionId: evaluation.submissionId,
        evaluatorType: evaluation.evaluatorType,
        criterionResults: JSON.stringify(evaluation.criterionResults),
        overallSummary: evaluation.overallSummary,
        overallScore: evaluation.overallScore,
        metadata: evaluation.metadata ? JSON.stringify(evaluation.metadata) : null,
        evaluatedAt: evaluation.evaluatedAt,
      },
      update: {
        evaluatorType: evaluation.evaluatorType,
        criterionResults: JSON.stringify(evaluation.criterionResults),
        overallSummary: evaluation.overallSummary,
        overallScore: evaluation.overallScore,
        metadata: evaluation.metadata ? JSON.stringify(evaluation.metadata) : null,
        evaluatedAt: evaluation.evaluatedAt,
      },
    });
  }

  private toDomain(raw: any): Evaluation {
    return new Evaluation({
      id: raw.id,
      submissionId: raw.submissionId,
      evaluatorType: raw.evaluatorType,
      criterionResults: JSON.parse(raw.criterionResults),
      overallSummary: raw.overallSummary,
      overallScore: raw.overallScore,
      metadata: raw.metadata ? JSON.parse(raw.metadata) : null,
      evaluatedAt: raw.evaluatedAt,
    });
  }
}
