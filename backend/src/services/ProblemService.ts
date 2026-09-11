import { ProblemRepository, ProblemRecord } from '../repositories/ProblemRepository.js';

export class ProblemService {
  constructor(private readonly problemRepo: ProblemRepository) {}

  async getAllProblems(): Promise<ProblemRecord[]> {
    return this.problemRepo.findAll();
  }

  async getProblemBySlug(slug: string): Promise<ProblemRecord> {
    const problem = await this.problemRepo.findBySlug(slug);
    if (!problem) {
      throw new NotFoundError(`Problem not found: ${slug}`);
    }
    return problem;
  }

  async getProblemById(id: string): Promise<ProblemRecord> {
    const problem = await this.problemRepo.findById(id);
    if (!problem) {
      throw new NotFoundError(`Problem not found: ${id}`);
    }
    return problem;
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
