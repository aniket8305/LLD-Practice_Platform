import type {
  Problem,
  AttemptResponse,
  TextSubmissionContent,
  HistoryItem,
} from '../types/index.js';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  /** Fetch all problems */
  getProblems(): Promise<Problem[]> {
    return request('/problems');
  },

  /** Fetch a single problem by slug */
  getProblemBySlug(slug: string): Promise<Problem> {
    return request(`/problems/${slug}`);
  },

  /** Create a new attempt */
  createAttempt(problemId: string, learnerIdentifier: string): Promise<AttemptResponse> {
    return request('/attempts', {
      method: 'POST',
      body: JSON.stringify({ problemId, learnerIdentifier }),
    });
  },

  /** Get attempt details */
  getAttempt(attemptId: string): Promise<AttemptResponse> {
    return request(`/attempts/${attemptId}`);
  },

  /** Submit a solution */
  submitAttempt(
    attemptId: string,
    submission: TextSubmissionContent
  ): Promise<AttemptResponse> {
    return request(`/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ submission, format: 'TEXT' }),
    });
  },

  /** Retry a failed evaluation */
  retryEvaluation(attemptId: string): Promise<AttemptResponse> {
    return request(`/attempts/${attemptId}/retry-evaluation`, {
      method: 'POST',
    });
  },

  /** Get attempt history for a learner */
  getHistory(learnerIdentifier: string, problemId?: string): Promise<HistoryItem[]> {
    const params = new URLSearchParams({ learnerIdentifier });
    if (problemId) params.set('problemId', problemId);
    return request(`/attempts/history/list?${params}`);
  },
};
