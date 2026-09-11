import { Evaluator, EvaluationResult, ProblemContext } from './Evaluator.js';
import { Submission } from '../domain/Submission.js';
import {
  RubricTemplate,
  CriterionResult,
  ConfidenceLevel,
  SubmissionFormat,
} from '../domain/types.js';

/** Schema for the expected AI response */
interface AIResponseSchema {
  criterionResults: Array<{
    criterion: string;
    score: number;
    maxScore: number;
    evidence: string;
    concern: string;
    suggestion: string;
    confidence: string;
  }>;
  overallSummary: string;
}

/**
 * AI-powered evaluator that uses an LLM with a structured prompt and rubric.
 * Demands evidence-based scoring, not arbitrary numbers.
 */
export class AIEvaluator implements Evaluator {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(config: {
    apiKey: string;
    apiUrl?: string;
    model?: string;
    timeoutMs?: number;
  }) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl ?? 'https://generativelanguage.googleapis.com/v1beta';
    this.model = config.model ?? 'gemini-2.0-flash';
    this.timeoutMs = config.timeoutMs ?? 30000;
  }

  getType(): string {
    return 'ai';
  }

  canEvaluate(format: SubmissionFormat): boolean {
    return format === SubmissionFormat.TEXT;
  }

  async evaluate(
    submission: Submission,
    rubricTemplate: RubricTemplate,
    problemContext: ProblemContext
  ): Promise<EvaluationResult> {
    const startTime = Date.now();
    const prompt = this.buildPrompt(submission, rubricTemplate, problemContext);

    try {
      const response = await this.callAI(prompt);
      const parsed = this.parseResponse(response, rubricTemplate);
      const latencyMs = Date.now() - startTime;

      return {
        criterionResults: parsed.criterionResults,
        overallSummary: parsed.overallSummary,
        metadata: {
          model: this.model,
          latencyMs,
          promptVersion: 'v1',
        },
      };
    } catch (error) {
      throw new Error(
        `AI evaluation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /** Build the structured evaluation prompt */
  private buildPrompt(
    submission: Submission,
    rubricTemplate: RubricTemplate,
    problemContext: ProblemContext
  ): string {
    const criteriaText = rubricTemplate.criteria
      .map(
        (c, i) =>
          `${i + 1}. ${c.name} (max ${c.maxScore} points): ${c.description}\n   Guidance: ${c.evaluationGuidance}`
      )
      .join('\n');

    return `You are an expert Low-Level Design (LLD) evaluator. You are evaluating a learner's design solution.

## Problem
Title: ${problemContext.title}
Description: ${problemContext.description}
Requirements:
${problemContext.requirements.map((r) => `- ${r}`).join('\n')}

## Learner's Submission
${submission.rawText}

## Evaluation Instructions
Evaluate the submission against each criterion below. For EACH criterion:
- **score**: An integer from 0 to the max score. Be fair but rigorous.
- **evidence**: Quote or specifically reference parts of the submission that support your score. If the section is weak or missing, say so explicitly.
- **concern**: Identify a specific weakness. Write "none" if the criterion is fully satisfied.
- **suggestion**: Provide one actionable, specific improvement the learner can make.
- **confidence**: How confident are you in this assessment? HIGH (clear evidence), MEDIUM (some ambiguity), or LOW (insufficient information).

## Criteria
${criteriaText}

## Response Format
Respond with ONLY valid JSON (no markdown fences, no explanation outside the JSON):
{
  "criterionResults": [
    {
      "criterion": "<criterion name>",
      "score": <number>,
      "maxScore": <number>,
      "evidence": "<quote or reference from submission>",
      "concern": "<specific weakness or 'none'>",
      "suggestion": "<actionable improvement>",
      "confidence": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "overallSummary": "<2-3 sentence summary of strengths and areas for improvement>"
}`;
  }

  /** Call the Gemini API */
  private async callAI(prompt: string): Promise<string> {
    const url = `${this.apiUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`AI API returned ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('AI API returned empty response');
      }

      return text;
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Parse and validate the AI response into CriterionResults */
  private parseResponse(
    responseText: string,
    rubricTemplate: RubricTemplate
  ): AIResponseSchema {
    let parsed: AIResponseSchema;

    try {
      // Strip markdown code fences if present
      const cleaned = responseText
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error(`Failed to parse AI response as JSON: ${responseText.substring(0, 200)}`);
    }

    if (!parsed.criterionResults || !Array.isArray(parsed.criterionResults)) {
      throw new Error('AI response missing criterionResults array');
    }

    if (!parsed.overallSummary || typeof parsed.overallSummary !== 'string') {
      parsed.overallSummary = 'Evaluation complete.';
    }

    // Validate and clamp each criterion result
    parsed.criterionResults = parsed.criterionResults.map((cr, i) => {
      const rubricCriterion = rubricTemplate.criteria[i];
      const maxScore = rubricCriterion?.maxScore ?? cr.maxScore ?? 5;

      return {
        criterion: cr.criterion || rubricCriterion?.name || `Criterion ${i + 1}`,
        score: Math.max(0, Math.min(cr.score ?? 0, maxScore)),
        maxScore,
        evidence: cr.evidence || 'No evidence provided',
        concern: cr.concern || 'none',
        suggestion: cr.suggestion || 'No suggestion provided',
        confidence: this.normalizeConfidence(cr.confidence),
      };
    });

    return parsed;
  }

  private normalizeConfidence(value: string): string {
    const upper = (value || '').toUpperCase();
    if (['HIGH', 'MEDIUM', 'LOW'].includes(upper)) return upper;
    return 'MEDIUM';
  }
}
