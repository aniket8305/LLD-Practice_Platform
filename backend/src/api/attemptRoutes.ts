import { Router, Request, Response } from 'express';
import { AttemptService, ValidationError, ConflictError } from '../services/AttemptService.js';
import { NotFoundError } from '../services/ProblemService.js';
import { AttemptStatus } from '../domain/types.js';

export function createAttemptRoutes(attemptService: AttemptService): Router {
  const router = Router();

  /** POST /api/attempts — Create a new attempt */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { problemId, learnerIdentifier } = req.body;

      if (!problemId || !learnerIdentifier) {
        res.status(400).json({
          error: 'problemId and learnerIdentifier are required',
        });
        return;
      }

      const attempt = await attemptService.createAttempt(
        problemId,
        learnerIdentifier.trim()
      );

      res.status(201).json(attempt.toData());
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error('Error creating attempt:', error);
      res.status(500).json({ error: 'Failed to create attempt' });
    }
  });

  /** GET /api/attempts/:id — Get attempt with submission and evaluation */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const result = await attemptService.getAttemptById(req.params.id!);
      res.json({
        ...result.attempt.toData(),
        problem: result.problem,
        submission: result.submission
          ? {
              id: result.submission.id,
              format: result.submission.format,
              content: result.submission.getContentData(),
              rawText: result.submission.rawText,
              submittedAt: result.submission.submittedAt,
            }
          : null,
        evaluation: result.evaluation
          ? {
              id: result.evaluation.id,
              evaluatorType: result.evaluation.evaluatorType,
              criterionResults: result.evaluation.criterionResults,
              overallSummary: result.evaluation.overallSummary,
              overallScore: result.evaluation.overallScore,
              maxPossibleScore: result.evaluation.getMaxPossibleScore(),
              scorePercentage: result.evaluation.getScorePercentage(),
              evaluatedAt: result.evaluation.evaluatedAt,
            }
          : null,
      });
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error('Error fetching attempt:', error);
      res.status(500).json({ error: 'Failed to fetch attempt' });
    }
  });

  /** POST /api/attempts/:id/submit — Submit solution and trigger evaluation */
  router.post('/:id/submit', async (req: Request, res: Response) => {
    try {
      const { submission, format } = req.body;

      if (!submission) {
        res.status(400).json({ error: 'submission content is required' });
        return;
      }

      const result = await attemptService.submitAttempt(
        req.params.id!,
        submission,
        format || 'TEXT'
      );

      // Determine status code based on whether evaluation completed
      const statusCode = result.evaluation ? 200 : 202;

      res.status(statusCode).json({
        ...result.attempt.toData(),
        submission: {
          id: result.submission.id,
          format: result.submission.format,
          content: result.submission.getContentData(),
          rawText: result.submission.rawText,
          submittedAt: result.submission.submittedAt,
        },
        evaluation: result.evaluation
          ? {
              id: result.evaluation.id,
              evaluatorType: result.evaluation.evaluatorType,
              criterionResults: result.evaluation.criterionResults,
              overallSummary: result.evaluation.overallSummary,
              overallScore: result.evaluation.overallScore,
              maxPossibleScore: result.evaluation.getMaxPossibleScore(),
              scorePercentage: result.evaluation.getScorePercentage(),
              evaluatedAt: result.evaluation.evaluatedAt,
            }
          : null,
      });
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.name === 'ValidationError') {
        res.status(400).json({ error: error.message, errors: (error as ValidationError).errors });
        return;
      }
      if (error.name === 'ConflictError') {
        res.status(409).json({ error: error.message });
        return;
      }
      if (error.message?.includes('Invalid status transition')) {
        res.status(409).json({ error: error.message });
        return;
      }
      console.error('Error submitting attempt:', error);
      res.status(500).json({ error: 'Failed to submit attempt' });
    }
  });

  /** POST /api/attempts/:id/retry-evaluation — Retry a failed evaluation */
  router.post('/:id/retry-evaluation', async (req: Request, res: Response) => {
    try {
      const result = await attemptService.retryEvaluation(req.params.id!);

      const statusCode = result.evaluation ? 200 : 202;

      res.status(statusCode).json({
        ...result.attempt.toData(),
        submission: {
          id: result.submission.id,
          format: result.submission.format,
          content: result.submission.getContentData(),
          rawText: result.submission.rawText,
          submittedAt: result.submission.submittedAt,
        },
        evaluation: result.evaluation
          ? {
              id: result.evaluation.id,
              evaluatorType: result.evaluation.evaluatorType,
              criterionResults: result.evaluation.criterionResults,
              overallSummary: result.evaluation.overallSummary,
              overallScore: result.evaluation.overallScore,
              maxPossibleScore: result.evaluation.getMaxPossibleScore(),
              scorePercentage: result.evaluation.getScorePercentage(),
              evaluatedAt: result.evaluation.evaluatedAt,
            }
          : null,
      });
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message?.includes('Max retry count')) {
        res.status(429).json({ error: error.message });
        return;
      }
      if (error.message?.includes('Invalid status transition') || error.message?.includes('Cannot retry')) {
        res.status(409).json({ error: error.message });
        return;
      }
      console.error('Error retrying evaluation:', error);
      res.status(500).json({ error: 'Failed to retry evaluation' });
    }
  });

  /** GET /api/attempts/history — Get attempt history for a learner */
  router.get('/history/list', async (req: Request, res: Response) => {
    try {
      const learnerIdentifier = req.query.learnerIdentifier as string;
      const problemId = req.query.problemId as string | undefined;

      if (!learnerIdentifier) {
        res.status(400).json({ error: 'learnerIdentifier query param is required' });
        return;
      }

      const results = await attemptService.getHistory(
        learnerIdentifier,
        problemId
      );

      res.json(
        results.map((r) => ({
          ...r.attempt.toData(),
          problem: { id: r.problem.id, title: r.problem.title, slug: r.problem.slug },
          submission: r.submission
            ? {
                id: r.submission.id,
                format: r.submission.format,
                content: r.submission.getContentData(),
                submittedAt: r.submission.submittedAt,
              }
            : null,
          evaluation: r.evaluation
            ? {
                id: r.evaluation.id,
                overallScore: r.evaluation.overallScore,
                maxPossibleScore: r.evaluation.getMaxPossibleScore(),
                scorePercentage: r.evaluation.getScorePercentage(),
                criterionResults: r.evaluation.criterionResults,
                overallSummary: r.evaluation.overallSummary,
                evaluatedAt: r.evaluation.evaluatedAt,
              }
            : null,
        }))
      );
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  return router;
}
