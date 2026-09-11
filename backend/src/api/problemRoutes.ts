import { Router, Request, Response } from 'express';
import { ProblemService } from '../services/ProblemService.js';

export function createProblemRoutes(problemService: ProblemService): Router {
  const router = Router();

  /** GET /api/problems — List all problems */
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const problems = await problemService.getAllProblems();
      res.json(problems);
    } catch (error) {
      console.error('Error fetching problems:', error);
      res.status(500).json({ error: 'Failed to fetch problems' });
    }
  });

  /** GET /api/problems/:slug — Get problem by slug */
  router.get('/:slug', async (req: Request, res: Response) => {
    try {
      const problem = await problemService.getProblemBySlug(req.params.slug!);
      res.json(problem);
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error('Error fetching problem:', error);
      res.status(500).json({ error: 'Failed to fetch problem' });
    }
  });

  return router;
}
