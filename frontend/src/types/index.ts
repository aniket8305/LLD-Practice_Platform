export enum AttemptStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  EVALUATING = 'EVALUATING',
  EVALUATED = 'EVALUATED',
  EVALUATION_FAILED = 'EVALUATION_FAILED',
}

export enum ConfidenceLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export interface RubricCriterion {
  name: string;
  description: string;
  maxScore: number;
  evaluationGuidance: string;
}

export interface RubricTemplate {
  criteria: RubricCriterion[];
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  requirements: string[];
  hints: string[];
  rubricTemplate: RubricTemplate;
  difficulty: string;
  createdAt: string;
}

export interface TextSubmissionContent {
  classesAndResponsibilities: string;
  relationships: string;
  designDecisions: string;
  tradeoffs: string;
}

export interface CriterionResult {
  criterion: string;
  score: number;
  maxScore: number;
  evidence: string;
  concern: string;
  suggestion: string;
  confidence: ConfidenceLevel;
}

export interface EvaluationResponse {
  id: string;
  evaluatorType: string;
  criterionResults: CriterionResult[];
  overallSummary: string;
  overallScore: number;
  maxPossibleScore: number;
  scorePercentage: number;
  evaluatedAt: string;
}

export interface SubmissionResponse {
  id: string;
  format: string;
  content: TextSubmissionContent;
  rawText?: string;
  submittedAt: string;
}

export interface AttemptResponse {
  id: string;
  problemId: string;
  learnerIdentifier: string;
  attemptNumber: number;
  status: AttemptStatus;
  createdAt: string;
  submittedAt: string | null;
  evaluatedAt: string | null;
  failureReason: string | null;
  retryCount: number;
  problem?: Problem;
  submission: SubmissionResponse | null;
  evaluation: EvaluationResponse | null;
}

export interface HistoryItem extends Omit<AttemptResponse, 'problem'> {
  problem: { id: string; title: string; slug: string };
}
