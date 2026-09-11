import { PrismaClient } from '@prisma/client';
import { Submission, SubmissionData } from '../domain/Submission.js';
import { SubmissionFormat } from '../domain/types.js';

export class SubmissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(submission: Submission): Promise<void> {
    await this.prisma.submission.create({
      data: {
        id: submission.id,
        attemptId: submission.attemptId,
        format: submission.format,
        content: JSON.stringify(submission.getContentData()),
        rawText: submission.rawText,
        submittedAt: submission.submittedAt,
      },
    });
  }

  async findByAttemptId(attemptId: string): Promise<Submission | null> {
    const raw = await this.prisma.submission.findUnique({
      where: { attemptId },
    });
    return raw ? this.toDomain(raw) : null;
  }

  private toDomain(raw: any): Submission {
    return new Submission({
      id: raw.id,
      attemptId: raw.attemptId,
      format: raw.format as SubmissionFormat,
      content: JSON.parse(raw.content),
      rawText: raw.rawText,
      submittedAt: raw.submittedAt,
    });
  }
}
