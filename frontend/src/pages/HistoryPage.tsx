import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import type { HistoryItem } from '../types/index.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { getLearnerIdentifier } from '../utils/learner.js';
import { History, ExternalLink, TrendingUp } from 'lucide-react';

export function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const learner = getLearnerIdentifier();

  useEffect(() => {
    if (!learner) {
      setLoading(false);
      return;
    }
    api
      .getHistory(learner)
      .then(setHistory)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [learner]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  if (!learner) {
    return (
      <div className="text-center py-20">
        <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Start an attempt to see your history.</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
          Browse problems
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">Failed to load history: {error}</p>
      </div>
    );
  }

  // Group by problem
  const grouped = history.reduce(
    (acc, item) => {
      const key = item.problem?.title || item.problemId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, HistoryItem[]>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Practice History</h1>
        <p className="mt-2 text-gray-600">Track your progress across LLD problems.</p>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No attempts yet.</p>
          <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Start practicing
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([problemTitle, attempts]) => (
            <div key={problemTitle} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{problemTitle}</h2>
                <span className="text-sm text-gray-500">{attempts.length} attempt(s)</span>
              </div>
              <div className="divide-y divide-gray-100">
                {attempts.map((item) => (
                  <Link
                    key={item.id}
                    to={`/attempts/${item.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-500">
                        #{item.attemptNumber}
                      </span>
                      <StatusBadge status={item.status} />
                      <span className="text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.evaluation && (
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {item.evaluation.overallScore}/{item.evaluation.maxPossibleScore}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({item.evaluation.scorePercentage}%)
                          </span>
                        </div>
                      )}
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
