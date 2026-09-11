import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIEvaluator } from '../../src/evaluators/AIEvaluator.js';
import { Submission } from '../../src/domain/Submission.js';
import { SubmissionFormat, ConfidenceLevel } from '../../src/domain/types.js';

const mockRubric = {
  criteria: [
    {
      name: 'Requirement Understanding',
      description: 'Does the solution address requirements?',
      maxScore: 5,
      evaluationGuidance: 'Look for requirement coverage.',
    },
    {
      name: 'Class Responsibilities',
      description: 'Are classes well-defined?',
      maxScore: 5,
      evaluationGuidance: 'Check for SRP.',
    },
  ],
};

const mockProblemContext = {
  title: 'Parking Lot',
  description: 'Design a parking lot system',
  requirements: ['Support multiple floors', 'Track availability'],
};

function createTestSubmission(): Submission {
  return new Submission({
    id: 'sub-1',
    attemptId: 'attempt-1',
    format: SubmissionFormat.TEXT,
    content: {
      classesAndResponsibilities: 'Class ParkingLot manages spots and tracks availability across multiple floors.',
      relationships: 'ParkingLot HAS-MANY ParkingSpot. Vehicle parks in ParkingSpot.',
      designDecisions: 'Used Strategy pattern for spot allocation to allow different algorithms.',
      tradeoffs: 'Chose simplicity over distributed locking for the MVP.',
    },
    rawText: 'Test raw text content for evaluation',
    submittedAt: new Date(),
  });
}

describe('AIEvaluator', () => {
  let evaluator: AIEvaluator;

  beforeEach(() => {
    evaluator = new AIEvaluator({
      apiKey: 'test-key',
      apiUrl: 'https://test-api.example.com',
      model: 'test-model',
      timeoutMs: 5000,
    });
  });

  it('should return correct type', () => {
    expect(evaluator.getType()).toBe('ai');
  });

  it('should support TEXT format', () => {
    expect(evaluator.canEvaluate(SubmissionFormat.TEXT)).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    // Mock fetch to return an error
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const submission = createTestSubmission();

    await expect(
      evaluator.evaluate(submission, mockRubric, mockProblemContext)
    ).rejects.toThrow('AI evaluation failed');

    globalThis.fetch = originalFetch;
  });

  it('should handle malformed JSON response', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'not valid json' }] } }],
      }),
    });

    const submission = createTestSubmission();

    await expect(
      evaluator.evaluate(submission, mockRubric, mockProblemContext)
    ).rejects.toThrow('AI evaluation failed');

    globalThis.fetch = originalFetch;
  });

  it('should handle empty API response', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [] }),
    });

    const submission = createTestSubmission();

    await expect(
      evaluator.evaluate(submission, mockRubric, mockProblemContext)
    ).rejects.toThrow('AI evaluation failed');

    globalThis.fetch = originalFetch;
  });

  it('should parse valid AI response correctly', async () => {
    const mockResponse = {
      criterionResults: [
        {
          criterion: 'Requirement Understanding',
          score: 4,
          maxScore: 5,
          evidence: 'Mentions multiple floors and availability tracking',
          concern: 'Missing payment requirements',
          suggestion: 'Add payment processing class',
          confidence: 'HIGH',
        },
        {
          criterion: 'Class Responsibilities',
          score: 3,
          maxScore: 5,
          evidence: 'ParkingLot class is defined with clear responsibilities',
          concern: 'ParkingLot may have too many responsibilities',
          suggestion: 'Extract SpotAllocator as a separate class',
          confidence: 'MEDIUM',
        },
      ],
      overallSummary: 'Good foundation with room for improvement in SRP.',
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: JSON.stringify(mockResponse) }] } },
        ],
      }),
    });

    const submission = createTestSubmission();
    const result = await evaluator.evaluate(
      submission,
      mockRubric,
      mockProblemContext
    );

    expect(result.criterionResults).toHaveLength(2);
    expect(result.criterionResults[0]!.criterion).toBe('Requirement Understanding');
    expect(result.criterionResults[0]!.score).toBe(4);
    expect(result.criterionResults[0]!.evidence).toContain('multiple floors');
    expect(result.overallSummary).toContain('Good foundation');
    expect(result.metadata.model).toBe('test-model');
    expect(result.metadata.promptVersion).toBe('v1');

    globalThis.fetch = originalFetch;
  });

  it('should clamp scores to max', async () => {
    const mockResponse = {
      criterionResults: [
        {
          criterion: 'Requirement Understanding',
          score: 10,
          maxScore: 5,
          evidence: 'test',
          concern: 'none',
          suggestion: 'none',
          confidence: 'HIGH',
        },
        {
          criterion: 'Class Responsibilities',
          score: -1,
          maxScore: 5,
          evidence: 'test',
          concern: 'none',
          suggestion: 'none',
          confidence: 'LOW',
        },
      ],
      overallSummary: 'Test.',
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: JSON.stringify(mockResponse) }] } },
        ],
      }),
    });

    const submission = createTestSubmission();
    const result = await evaluator.evaluate(
      submission,
      mockRubric,
      mockProblemContext
    );

    expect(result.criterionResults[0]!.score).toBe(5); // clamped to max
    expect(result.criterionResults[1]!.score).toBe(0); // clamped to 0

    globalThis.fetch = originalFetch;
  });
});
