import { PrismaClient } from '@prisma/client';
import { RubricTemplate } from '../domain/types.js';

export interface ProblemRecord {
  id: string;
  title: string;
  slug: string;
  description: string;
  requirements: string[];
  hints: string[];
  rubricTemplate: RubricTemplate;
  difficulty: string;
  createdAt: Date;
}

export class ProblemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<ProblemRecord[]> {
    const problems = await this.prisma.problem.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return problems.map(this.toDomain);
  }

  async findBySlug(slug: string): Promise<ProblemRecord | null> {
    const problem = await this.prisma.problem.findUnique({ where: { slug } });
    return problem ? this.toDomain(problem) : null;
  }

  async findById(id: string): Promise<ProblemRecord | null> {
    const problem = await this.prisma.problem.findUnique({ where: { id } });
    return problem ? this.toDomain(problem) : null;
  }

  private toDomain(raw: any): ProblemRecord {
    return {
      ...raw,
      requirements: JSON.parse(raw.requirements),
      hints: raw.hints ? JSON.parse(raw.hints) : [],
      rubricTemplate: JSON.parse(raw.rubricTemplate),
    };
  }
}
