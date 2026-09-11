/** Possible statuses for an Attempt in its lifecycle */
export enum AttemptStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  EVALUATING = 'EVALUATING',
  EVALUATED = 'EVALUATED',
  EVALUATION_FAILED = 'EVALUATION_FAILED',
}

/** Supported submission formats */
export enum SubmissionFormat {
  TEXT = 'TEXT',
}

/** Confidence level for AI evaluation criteria */
export enum ConfidenceLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

/** A single criterion in the evaluation rubric */
export interface RubricCriterion {
  name: string;
  description: string;
  maxScore: number;
  evaluationGuidance: string;
}

/** Rubric template attached to a Problem */
export interface RubricTemplate {
  criteria: RubricCriterion[];
}

/** Result of evaluating one criterion */
export interface CriterionResult {
  criterion: string;
  score: number;
  maxScore: number;
  evidence: string;
  concern: string;
  suggestion: string;
  confidence: ConfidenceLevel;
}

/** Content of a text-based submission */
export interface TextSubmissionContent {
  classesAndResponsibilities: string;
  relationships: string;
  designDecisions: string;
  tradeoffs: string;
}

/** Validation result from submission content */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/** Metadata stored with an evaluation */
export interface EvaluationMetadata {
  model?: string;
  tokensUsed?: number;
  latencyMs?: number;
  promptVersion?: string;
}
