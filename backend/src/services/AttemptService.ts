import { v4 as uuidv4 } from 'uuid';
import { Attempt } from '../domain/Attempt.js';
import { Submission } from '../domain/Submission.js';
import { TextContent } from '../domain/Submission.js';
import { Evaluation } from '../domain/Evaluation.js';
import {
  AttemptStatus,
  SubmissionFormat,
  TextSubmissionContent,
} from '../domain/types.js';
import { AttemptRepository } from '../repositories/AttemptRepository.js';
import { SubmissionRepository } from '../repositories/SubmissionRepository.js';
import { EvaluationRepository } from '../repositories/EvaluationRepository.js';
import { ProblemRepository, ProblemRecord } from '../repositories/ProblemRepository.js';
import { EvaluatorRegistry } from '../evaluators/EvaluatorRegistry.js';
import { NotFoundError } from './ProblemService.js';

export class AttemptService {
  constructor(
    private readonly attemptRepo: AttemptRepository,
    private readonly submissionRepo: SubmissionRepository,
    private readonly evaluationRepo: EvaluationRepository,
    private readonly problemRepo: ProblemRepository,
    private readonly evaluatorRegistry: EvaluatorRegistry
  ) {}

  /** Create a new attempt for a problem */
  async createAttempt(
    problemId: string,
    learnerIdentifier: string
  ): Promise<Attempt> {
    const problem = await this.problemRepo.findById(problemId);
    if (!problem) {
      throw new NotFoundError(`Problem not found: ${problemId}`);
    }

    const attemptNumber = await this.attemptRepo.getNextAttemptNumber(
      problemId,
      learnerIdentifier
    );

    const attempt = new Attempt({
      id: uuidv4(),
      problemId,
      learnerIdentifier,
      attemptNumber,
      status: AttemptStatus.DRAFT,
      createdAt: new Date(),
      submittedAt: null,
      evaluatedAt: null,
      failureReason: null,
      retryCount: 0,
      idempotencyKey: null,
    });

    await this.attemptRepo.create(attempt);
    return attempt;
  }

  /** Get an attempt by ID with its submission and evaluation */
  async getAttemptById(id: string): Promise<{
    attempt: Attempt;
    submission: Submission | null;
    evaluation: Evaluation | null;
    problem: ProblemRecord;
  }> {
    const attempt = await this.attemptRepo.findById(id);
    if (!attempt) {
      throw new NotFoundError(`Attempt not found: ${id}`);
    }

    const problem = await this.problemRepo.findById(attempt.problemId);
    if (!problem) {
      throw new NotFoundError(`Problem not found: ${attempt.problemId}`);
    }

    const submission = await this.submissionRepo.findByAttemptId(id);
    let evaluation: Evaluation | null = null;
    if (submission) {
      evaluation = await this.evaluationRepo.findBySubmissionId(submission.id);
    }

    return { attempt, submission, evaluation, problem };
  }

  /** Submit a solution and trigger evaluation */
  async submitAttempt(
    attemptId: string,
    content: TextSubmissionContent,
    format: SubmissionFormat = SubmissionFormat.TEXT
  ): Promise<{ attempt: Attempt; submission: Submission; evaluation: Evaluation | null }> {
    // 1. Load attempt
    const attempt = await this.attemptRepo.findById(attemptId);
    if (!attempt) {
      throw new NotFoundError(`Attempt not found: ${attemptId}`);
    }

    // 2. Validate content
    const textContent = new TextContent(content);
    const validation = textContent.validate();
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }

    // 3. Check if already submitted (idempotency)
    const existingSubmission = await this.submissionRepo.findByAttemptId(attemptId);
    if (existingSubmission) {
      throw new ConflictError('Attempt already has a submission');
    }

    // 4. Transition to SUBMITTED
    attempt.submit();

    // 5. Persist submission BEFORE evaluation
    const submission = new Submission({
      id: uuidv4(),
      attemptId,
      format,
      content,
      rawText: textContent.getRawText(),
      submittedAt: new Date(),
    });

    await this.submissionRepo.create(submission);
    await this.attemptRepo.update(attempt);

    // 6. Trigger evaluation (synchronous for MVP)
    const evaluation = await this.runEvaluation(attempt, submission);

    return { attempt, submission, evaluation };
  }

  /** Retry a failed evaluation */
  async retryEvaluation(attemptId: string): Promise<{
    attempt: Attempt;
    submission: Submission;
    evaluation: Evaluation | null;
  }> {
    const attempt = await this.attemptRepo.findById(attemptId);
    if (!attempt) {
      throw new NotFoundError(`Attempt not found: ${attemptId}`);
    }

    const submission = await this.submissionRepo.findByAttemptId(attemptId);
    if (!submission) {
      throw new NotFoundError(`No submission found for attempt: ${attemptId}`);
    }

    // retryEvaluation checks status and retry count
    const idempotencyKey = uuidv4();
    attempt.retryEvaluation(idempotencyKey);
    await this.attemptRepo.update(attempt);

    const evaluation = await this.runEvaluation(attempt, submission);
    return { attempt, submission, evaluation };
  }

  /** Get attempt history for a learner */
  async getHistory(
    learnerIdentifier: string,
    problemId?: string
  ): Promise<
    Array<{
      attempt: Attempt;
      submission: Submission | null;
      evaluation: Evaluation | null;
      problem: ProblemRecord;
    }>
  > {
    const attempts = problemId
      ? await this.attemptRepo.findByLearnerAndProblem(
          learnerIdentifier,
          problemId
        )
      : await this.attemptRepo.findByLearner(learnerIdentifier);

    const results = [];
    for (const attempt of attempts) {
      const problem = await this.problemRepo.findById(attempt.problemId);
      if (!problem) continue;

      const submission = await this.submissionRepo.findByAttemptId(attempt.id);
      let evaluation: Evaluation | null = null;
      if (submission) {
        evaluation = await this.evaluationRepo.findBySubmissionId(submission.id);
      }
      results.push({ attempt, submission, evaluation, problem });
    }

    return results;
  }

  /** Run the evaluation pipeline */
  private async runEvaluation(
    attempt: Attempt,
    submission: Submission
  ): Promise<Evaluation | null> {
    const problem = await this.problemRepo.findById(attempt.problemId);
    if (!problem) return null;

    const evaluator = this.evaluatorRegistry.findForFormat(submission.format);
    if (!evaluator) {
      attempt.failEvaluation('No evaluator available for format: ' + submission.format);
      await this.attemptRepo.update(attempt);
      return null;
    }

    // Mark as evaluating
    const idempotencyKey = attempt.idempotencyKey ?? uuidv4();
    if (attempt.status !== AttemptStatus.EVALUATING) {
      attempt.markEvaluating(idempotencyKey);
      await this.attemptRepo.update(attempt);
    }

    try {
      const result = await evaluator.evaluate(
        submission,
        problem.rubricTemplate,
        {
          title: problem.title,
          description: problem.description,
          requirements: problem.requirements,
        }
      );

      const evaluation = new Evaluation({
        id: uuidv4(),
        submissionId: submission.id,
        evaluatorType: evaluator.getType(),
        criterionResults: result.criterionResults,
        overallSummary: result.overallSummary,
        overallScore: null, // computed in constructor
        metadata: result.metadata,
        evaluatedAt: new Date(),
      });

      await this.evaluationRepo.upsert(evaluation);
      attempt.completeEvaluation();
      await this.attemptRepo.update(attempt);

      return evaluation;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown evaluation error';
      attempt.failEvaluation(reason);
      await this.attemptRepo.update(attempt);
      return null;
    }
  }
}

export class ValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}
