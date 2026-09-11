import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import type { Problem } from '../types/index.js';
import { getLearnerIdentifier } from '../utils/learner.js';
import { LearnerIdentityModal } from '../components/LearnerIdentityModal.js';
import { ArrowLeft, Play, CheckCircle2, Lightbulb, Target } from 'lucide-react';

export function ProblemDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIdentity, setShowIdentity] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api
      .getProblemBySlug(slug)
      .then(setProblem)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleStartAttempt = async (learner?: string) => {
    const identifier = learner || getLearnerIdentifier();
    if (!identifier) {
      setShowIdentity(true);
      return;
    }
    if (!problem) return;

    setCreating(true);
    try {
      const attempt = await api.createAttempt(problem.id, identifier);
      navigate(`/attempts/${attempt.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error || 'Problem not found'}</p>
      </div>
    );
  }

  return (
    <div>
      {showIdentity && (
        <LearnerIdentityModal
          onIdentified={(name) => {
            setShowIdentity(false);
            handleStartAttempt(name);
          }}
        />
      )}

      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to problems
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{problem.title}</h1>
            <p className="mt-3 text-gray-600 text-lg">{problem.description}</p>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Requirements</h2>
            </div>
            <ul className="space-y-2">
              {problem.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Hints */}
          {problem.hints.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-gray-900">Hints</h2>
              </div>
              <ul className="space-y-2">
                {problem.hints.map((hint, i) => (
                  <li key={i} className="text-gray-700 text-sm">• {hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Ready to practice?</h3>
            <p className="text-sm text-gray-600 mb-4">
              You'll submit a structured text solution covering classes, relationships, and design decisions.
            </p>
            <div className="mb-4 text-sm text-gray-500">
              <strong>Evaluation criteria:</strong>
              <ul className="mt-2 space-y-1">
                {problem.rubricTemplate.criteria.map((c, i) => (
                  <li key={i} className="text-xs">• {c.name} (max {c.maxScore}pts)</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleStartAttempt()}
              disabled={creating}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              <Play className="w-4 h-4" />
              {creating ? 'Creating...' : 'Start Attempt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
