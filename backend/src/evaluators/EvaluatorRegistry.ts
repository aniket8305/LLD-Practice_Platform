import { Evaluator } from './Evaluator.js';
import { SubmissionFormat } from '../domain/types.js';

/**
 * Registry of available evaluators.
 * New evaluators are registered here — no other code needs to change.
 */
export class EvaluatorRegistry {
  private evaluators: Map<string, Evaluator> = new Map();

  /** Register an evaluator by its type */
  register(evaluator: Evaluator): void {
    this.evaluators.set(evaluator.getType(), evaluator);
  }

  /** Get an evaluator by type */
  get(type: string): Evaluator | undefined {
    return this.evaluators.get(type);
  }

  /** Find the first evaluator that can handle the given format */
  findForFormat(format: SubmissionFormat): Evaluator | undefined {
    for (const evaluator of this.evaluators.values()) {
      if (evaluator.canEvaluate(format)) {
        return evaluator;
      }
    }
    return undefined;
  }

  /** List all registered evaluator types */
  listTypes(): string[] {
    return Array.from(this.evaluators.keys());
  }
}
