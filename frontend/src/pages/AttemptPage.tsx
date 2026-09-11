import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import type { AttemptResponse, TextSubmissionContent } from '../types/index.js';
import { AttemptStatus } from '../types/index.js';
import { SubmissionEditor } from '../components/SubmissionEditor.js';
import { FeedbackPanel } from '../components/FeedbackPanel.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { ArrowLeft, RotateCcw, RefreshCw } from 'lucide-react';

export function AttemptPage() {
  const { id } = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState<AttemptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'feedback'>('editor');

  const fetchAttempt = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getAttempt(id);
      setAttempt(data);
      // Auto-switch to feedback tab if evaluated
      if (data.status === AttemptStatus.EVALUATED) {
        setActiveTab('feedback');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAttempt();
  }, [fetchAttempt]);

  // Poll while evaluating
  useEffect(() => {
    if (attempt?.status !== AttemptStatus.EVALUATING) return;
    const interval = setInterval(fetchAttempt, 2000);
    return () => clearInterval(interval);
  }, [attempt?.status, fetchAttempt]);

  const handleSubmit = async (content: TextSubmissionContent) => {
    if (!id) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.submitAttempt(id, content);
      setAttempt(result);
      if (result.status === AttemptStatus.EVALUATED) {
        setActiveTab('feedback');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async () => {
    if (!id) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.retryEvaluation(id);
      setAttempt(result);
      if (result.status === AttemptStatus.EVALUATED) {
        setActiveTab('feedback');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  if (error && !attempt) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!attempt) return null;

  const isSubmitted = attempt.status !== AttemptStatus.DRAFT;
  const problemSlug = attempt.problem?.slug;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {problemSlug && (
            <Link
              to={`/problems/${problemSlug}`}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to problem
            </Link>
          )}
          <h1 className="text-2xl font-bold text-gray-900">
            {attempt.problem?.title || 'Attempt'}
            <span className="text-gray-400 font-normal ml-2">#{attempt.attemptNumber}</span>
          </h1>
        </div>
        <StatusBadge status={attempt.status} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Evaluation Failed Banner */}
      {attempt.status === AttemptStatus.EVALUATION_FAILED && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-amber-800 font-medium">Evaluation failed</p>
            <p className="text-amber-700 text-sm mt-1">{attempt.failureReason}</p>
          </div>
          <button
            onClick={handleRetry}
            disabled={submitting}
            className="flex items-center gap-1.5 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:bg-gray-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Retry ({3 - attempt.retryCount} left)
          </button>
        </div>
      )}

      {/* Evaluating spinner */}
      {attempt.status === AttemptStatus.EVALUATING && (
        <div className="mb-6 p-8 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
          <div className="animate-spin w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4" />
          <p className="text-indigo-800 font-medium">Evaluating your design...</p>
          <p className="text-indigo-600 text-sm mt-1">This may take 10-20 seconds</p>
        </div>
      )}

      {/* Tabs (only show if submitted) */}
      {isSubmitted && (
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Your Solution
          </button>
          {attempt.evaluation && (
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'feedback'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Feedback
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {activeTab === 'editor' && (
        <SubmissionEditor
          initialContent={attempt.submission?.content}
          onSubmit={handleSubmit}
          isSubmitting={submitting || attempt.status === AttemptStatus.EVALUATING}
          disabled={isSubmitted}
        />
      )}

      {activeTab === 'feedback' && attempt.evaluation && (
        <FeedbackPanel evaluation={attempt.evaluation} />
      )}

      {/* Try Again button (after evaluation) */}
      {attempt.status === AttemptStatus.EVALUATED && attempt.problem && (
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center">
          <Link
            to={`/problems/${problemSlug}`}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Link>
        </div>
      )}
    </div>
  );
}
