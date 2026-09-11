import { CriterionResult, EvaluationMetadata } from './types.js';

export interface EvaluationData {
  id: string;
  submissionId: string;
  evaluatorType: string;
  criterionResults: CriterionResult[];
  overallSummary: string | null;
  overallScore: number | null;
  metadata: EvaluationMetadata | null;
  evaluatedAt: Date;
}

/**
 * Evaluation entity — the structured feedback result from an evaluator.
 * Contains per-criterion scores with evidence, concerns, and suggestions.
 */
export class Evaluation {
  readonly id: string;
  readonly submissionId: string;
  readonly evaluatorType: string;
  readonly criterionResults: CriterionResult[];
  readonly overallSummary: string | null;
  readonly overallScore: number | null;
  readonly metadata: EvaluationMetadata | null;
  readonly evaluatedAt: Date;

  constructor(data: EvaluationData) {
    this.id = data.id;
    this.submissionId = data.submissionId;
    this.evaluatorType = data.evaluatorType;
    this.criterionResults = data.criterionResults;
    this.overallSummary = data.overallSummary;
    this.overallScore = data.overallScore ?? this.computeOverallScore();
    this.metadata = data.metadata;
    this.evaluatedAt = data.evaluatedAt;
  }

  /** Compute overall score as sum of criterion scores */
  private computeOverallScore(): number {
    return this.criterionResults.reduce((sum, cr) => sum + cr.score, 0);
  }

  /** Get the maximum possible score */
  getMaxPossibleScore(): number {
    return this.criterionResults.reduce((sum, cr) => sum + cr.maxScore, 0);
  }

  /** Get score as a percentage */
  getScorePercentage(): number {
    const max = this.getMaxPossibleScore();
    if (max === 0) return 0;
    return Math.round(((this.overallScore ?? 0) / max) * 100);
  }
}
