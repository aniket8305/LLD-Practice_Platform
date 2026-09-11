import { Submission } from '../domain/Submission.js';
import { RubricTemplate, CriterionResult, EvaluationMetadata, SubmissionFormat } from '../domain/types.js';

/** Context about the problem being evaluated */
export interface ProblemContext {
  title: string;
  description: string;
  requirements: string[];
}

/** Result returned by an evaluator */
export interface EvaluationResult {
  criterionResults: CriterionResult[];
  overallSummary: string;
  metadata: EvaluationMetadata;
}

/**
 * Evaluator interface — the Strategy abstraction.
 * Implement this to add new evaluation approaches (AI, rule-based, human).
 */
export interface Evaluator {
  /** Run evaluation against a submission using the given rubric */
  evaluate(
    submission: Submission,
    rubricTemplate: RubricTemplate,
    problemContext: ProblemContext
  ): Promise<EvaluationResult>;

  /** Identifier for this evaluator type */
  getType(): string;

  /** Whether this evaluator can handle the given submission format */
  canEvaluate(format: SubmissionFormat): boolean;
}
