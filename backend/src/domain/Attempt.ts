import { AttemptStatus } from './types.js';

const MAX_RETRY_COUNT = 3;

/** Valid state transitions for an Attempt */
const VALID_TRANSITIONS: Record<AttemptStatus, AttemptStatus[]> = {
  [AttemptStatus.DRAFT]: [AttemptStatus.SUBMITTED],
  [AttemptStatus.SUBMITTED]: [AttemptStatus.EVALUATING],
  [AttemptStatus.EVALUATING]: [AttemptStatus.EVALUATED, AttemptStatus.EVALUATION_FAILED],
  [AttemptStatus.EVALUATED]: [],
  [AttemptStatus.EVALUATION_FAILED]: [AttemptStatus.EVALUATING],
};

export interface AttemptData {
  id: string;
  problemId: string;
  learnerIdentifier: string;
  attemptNumber: number;
  status: AttemptStatus;
  createdAt: Date;
  submittedAt: Date | null;
  evaluatedAt: Date | null;
  failureReason: string | null;
  retryCount: number;
  idempotencyKey: string | null;
}

/**
 * Attempt entity — the core unit of the practice loop.
 * Owns status transitions and enforces all lifecycle invariants.
 */
export class Attempt {
  readonly id: string;
  readonly problemId: string;
  readonly learnerIdentifier: string;
  readonly attemptNumber: number;
  private _status: AttemptStatus;
  readonly createdAt: Date;
  private _submittedAt: Date | null;
  private _evaluatedAt: Date | null;
  private _failureReason: string | null;
  private _retryCount: number;
  private _idempotencyKey: string | null;

  constructor(data: AttemptData) {
    this.id = data.id;
    this.problemId = data.problemId;
    this.learnerIdentifier = data.learnerIdentifier;
    this.attemptNumber = data.attemptNumber;
    this._status = data.status;
    this.createdAt = data.createdAt;
    this._submittedAt = data.submittedAt;
    this._evaluatedAt = data.evaluatedAt;
    this._failureReason = data.failureReason;
    this._retryCount = data.retryCount;
    this._idempotencyKey = data.idempotencyKey;
  }

  get status(): AttemptStatus { return this._status; }
  get submittedAt(): Date | null { return this._submittedAt; }
  get evaluatedAt(): Date | null { return this._evaluatedAt; }
  get failureReason(): string | null { return this._failureReason; }
  get retryCount(): number { return this._retryCount; }
  get idempotencyKey(): string | null { return this._idempotencyKey; }

  /** Check if a status transition is valid */
  canTransitionTo(newStatus: AttemptStatus): boolean {
    return VALID_TRANSITIONS[this._status].includes(newStatus);
  }

  /** Transition the attempt to a new status, enforcing guards */
  private transitionTo(newStatus: AttemptStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(
        `Invalid status transition: ${this._status} → ${newStatus}`
      );
    }
    this._status = newStatus;
  }

  /** Whether the attempt can accept a submission */
  canSubmit(): boolean {
    return this._status === AttemptStatus.DRAFT;
  }

  /** Mark the attempt as submitted */
  submit(): void {
    this.transitionTo(AttemptStatus.SUBMITTED);
    this._submittedAt = new Date();
  }

  /** Mark the attempt as being evaluated */
  markEvaluating(idempotencyKey: string): void {
    // Idempotency: if already evaluating with same key, no-op
    if (
      this._status === AttemptStatus.EVALUATING &&
      this._idempotencyKey === idempotencyKey
    ) {
      return;
    }
    this.transitionTo(AttemptStatus.EVALUATING);
    this._idempotencyKey = idempotencyKey;
  }

  /** Mark the evaluation as complete */
  completeEvaluation(): void {
    this.transitionTo(AttemptStatus.EVALUATED);
    this._evaluatedAt = new Date();
    this._failureReason = null;
  }

  /** Mark the evaluation as failed */
  failEvaluation(reason: string): void {
    this.transitionTo(AttemptStatus.EVALUATION_FAILED);
    this._failureReason = reason;
  }

  /** Whether the attempt can retry evaluation */
  canRetryEvaluation(): boolean {
    return (
      this._status === AttemptStatus.EVALUATION_FAILED &&
      this._retryCount < MAX_RETRY_COUNT
    );
  }

  /** Retry evaluation after a failure */
  retryEvaluation(idempotencyKey: string): void {
    if (!this.canRetryEvaluation()) {
      if (this._retryCount >= MAX_RETRY_COUNT) {
        throw new Error(`Max retry count (${MAX_RETRY_COUNT}) exceeded`);
      }
      throw new Error(
        `Cannot retry evaluation from status: ${this._status}`
      );
    }
    this._retryCount++;
    this.transitionTo(AttemptStatus.EVALUATING);
    this._idempotencyKey = idempotencyKey;
  }

  /** Serialize to plain data for persistence */
  toData(): AttemptData {
    return {
      id: this.id,
      problemId: this.problemId,
      learnerIdentifier: this.learnerIdentifier,
      attemptNumber: this.attemptNumber,
      status: this._status,
      createdAt: this.createdAt,
      submittedAt: this._submittedAt,
      evaluatedAt: this._evaluatedAt,
      failureReason: this._failureReason,
      retryCount: this._retryCount,
      idempotencyKey: this._idempotencyKey,
    };
  }
}
