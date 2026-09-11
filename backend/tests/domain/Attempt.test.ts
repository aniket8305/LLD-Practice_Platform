import { describe, it, expect } from 'vitest';
import { Attempt, AttemptData } from '../../src/domain/Attempt.js';
import { AttemptStatus } from '../../src/domain/types.js';

function createAttempt(overrides: Partial<AttemptData> = {}): Attempt {
  return new Attempt({
    id: 'attempt-1',
    problemId: 'problem-1',
    learnerIdentifier: 'learner-1',
    attemptNumber: 1,
    status: AttemptStatus.DRAFT,
    createdAt: new Date(),
    submittedAt: null,
    evaluatedAt: null,
    failureReason: null,
    retryCount: 0,
    idempotencyKey: null,
    ...overrides,
  });
}

describe('Attempt', () => {
  describe('State Transitions', () => {
    it('should allow DRAFT → SUBMITTED', () => {
      const attempt = createAttempt();
      attempt.submit();
      expect(attempt.status).toBe(AttemptStatus.SUBMITTED);
      expect(attempt.submittedAt).toBeInstanceOf(Date);
    });

    it('should allow SUBMITTED → EVALUATING', () => {
      const attempt = createAttempt({ status: AttemptStatus.SUBMITTED });
      attempt.markEvaluating('key-1');
      expect(attempt.status).toBe(AttemptStatus.EVALUATING);
      expect(attempt.idempotencyKey).toBe('key-1');
    });

    it('should allow EVALUATING → EVALUATED', () => {
      const attempt = createAttempt({ status: AttemptStatus.EVALUATING });
      attempt.completeEvaluation();
      expect(attempt.status).toBe(AttemptStatus.EVALUATED);
      expect(attempt.evaluatedAt).toBeInstanceOf(Date);
    });

    it('should allow EVALUATING → EVALUATION_FAILED', () => {
      const attempt = createAttempt({ status: AttemptStatus.EVALUATING });
      attempt.failEvaluation('AI timeout');
      expect(attempt.status).toBe(AttemptStatus.EVALUATION_FAILED);
      expect(attempt.failureReason).toBe('AI timeout');
    });

    it('should allow EVALUATION_FAILED → EVALUATING (retry)', () => {
      const attempt = createAttempt({
        status: AttemptStatus.EVALUATION_FAILED,
        retryCount: 0,
      });
      attempt.retryEvaluation('key-2');
      expect(attempt.status).toBe(AttemptStatus.EVALUATING);
      expect(attempt.retryCount).toBe(1);
    });

    it('should NOT allow DRAFT → EVALUATED (must go through SUBMITTED)', () => {
      const attempt = createAttempt();
      expect(() => attempt.completeEvaluation()).toThrow('Invalid status transition');
    });

    it('should NOT allow DRAFT → EVALUATING', () => {
      const attempt = createAttempt();
      expect(() => attempt.markEvaluating('key-1')).toThrow('Invalid status transition');
    });

    it('should NOT allow EVALUATED → any other status', () => {
      const attempt = createAttempt({ status: AttemptStatus.EVALUATED });
      expect(() => attempt.submit()).toThrow('Invalid status transition');
      expect(() => attempt.markEvaluating('key')).toThrow('Invalid status transition');
      expect(() => attempt.failEvaluation('err')).toThrow('Invalid status transition');
    });

    it('should NOT allow double submission', () => {
      const attempt = createAttempt();
      attempt.submit();
      expect(() => attempt.submit()).toThrow('Invalid status transition');
    });
  });

  describe('Retry Logic', () => {
    it('should cap retries at 3', () => {
      const attempt = createAttempt({
        status: AttemptStatus.EVALUATION_FAILED,
        retryCount: 3,
      });
      expect(attempt.canRetryEvaluation()).toBe(false);
      expect(() => attempt.retryEvaluation('key')).toThrow('Max retry count');
    });

    it('should allow retry when count is below max', () => {
      const attempt = createAttempt({
        status: AttemptStatus.EVALUATION_FAILED,
        retryCount: 2,
      });
      expect(attempt.canRetryEvaluation()).toBe(true);
      attempt.retryEvaluation('key');
      expect(attempt.retryCount).toBe(3);
    });

    it('should not allow retry from non-failed status', () => {
      const attempt = createAttempt({ status: AttemptStatus.DRAFT });
      expect(attempt.canRetryEvaluation()).toBe(false);
    });
  });

  describe('Idempotency', () => {
    it('should no-op when marking as evaluating with same key', () => {
      const attempt = createAttempt({
        status: AttemptStatus.EVALUATING,
        idempotencyKey: 'key-1',
      });
      attempt.markEvaluating('key-1'); // should not throw
      expect(attempt.status).toBe(AttemptStatus.EVALUATING);
    });
  });

  describe('canSubmit', () => {
    it('should return true for DRAFT', () => {
      expect(createAttempt().canSubmit()).toBe(true);
    });

    it('should return false for SUBMITTED', () => {
      expect(
        createAttempt({ status: AttemptStatus.SUBMITTED }).canSubmit()
      ).toBe(false);
    });
  });

  describe('toData', () => {
    it('should serialize to plain data', () => {
      const attempt = createAttempt();
      const data = attempt.toData();
      expect(data.id).toBe('attempt-1');
      expect(data.status).toBe(AttemptStatus.DRAFT);
    });
  });
});
