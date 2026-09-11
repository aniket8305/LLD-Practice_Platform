import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { loadConfig } from './config.js';
import { ProblemRepository } from './repositories/ProblemRepository.js';
import { AttemptRepository } from './repositories/AttemptRepository.js';
import { SubmissionRepository } from './repositories/SubmissionRepository.js';
import { EvaluationRepository } from './repositories/EvaluationRepository.js';
import { ProblemService } from './services/ProblemService.js';
import { AttemptService } from './services/AttemptService.js';
import { AIEvaluator } from './evaluators/AIEvaluator.js';
import { EvaluatorRegistry } from './evaluators/EvaluatorRegistry.js';
import { createProblemRoutes } from './api/problemRoutes.js';
import { createAttemptRoutes } from './api/attemptRoutes.js';

const config = loadConfig();
const prisma = new PrismaClient();

// Repositories
const problemRepo = new ProblemRepository(prisma);
const attemptRepo = new AttemptRepository(prisma);
const submissionRepo = new SubmissionRepository(prisma);
const evaluationRepo = new EvaluationRepository(prisma);

// Evaluators
const evaluatorRegistry = new EvaluatorRegistry();

if (config.geminiApiKey) {
  const aiEvaluator = new AIEvaluator({
    apiKey: config.geminiApiKey,
    model: config.geminiModel,
  });
  evaluatorRegistry.register(aiEvaluator);
  console.log('✓ AI Evaluator registered (Gemini)');
} else {
  console.warn('⚠ GEMINI_API_KEY not set — AI evaluation will be unavailable');
}

// Services
const problemService = new ProblemService(problemRepo);
const attemptService = new AttemptService(
  attemptRepo,
  submissionRepo,
  evaluationRepo,
  problemRepo,
  evaluatorRegistry
);

// Express app
const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/problems', createProblemRoutes(problemService));
app.use('/api/attempts', createAttemptRoutes(attemptService));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(config.port, () => {
  console.log(`\n🚀 LLD Practice Platform API running on http://localhost:${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/api/health`);
  console.log(`   Problems: http://localhost:${config.port}/api/problems\n`);
});

export default app;
