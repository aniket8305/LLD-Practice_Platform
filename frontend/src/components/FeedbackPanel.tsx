import type { EvaluationResponse } from '../types/index.js';
import { CriterionCard } from './CriterionCard.js';
import { Award } from 'lucide-react';

interface Props {
  evaluation: EvaluationResponse;
}

export function FeedbackPanel({ evaluation }: Props) {
  const percentage = evaluation.scorePercentage;
  const scoreColor =
    percentage >= 70
      ? 'text-green-600'
      : percentage >= 40
      ? 'text-yellow-600'
      : 'text-red-600';
  const bgColor =
    percentage >= 70
      ? 'bg-green-50 border-green-200'
      : percentage >= 40
      ? 'bg-yellow-50 border-yellow-200'
      : 'bg-red-50 border-red-200';

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className={`rounded-xl border p-6 ${bgColor}`}>
        <div className="flex items-center gap-3 mb-3">
          <Award className={`w-6 h-6 ${scoreColor}`} />
          <h3 className="text-lg font-semibold text-gray-900">Overall Score</h3>
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className={`text-4xl font-bold ${scoreColor}`}>
            {evaluation.overallScore}
          </span>
          <span className="text-gray-500 text-lg">/ {evaluation.maxPossibleScore}</span>
          <span className={`ml-2 text-sm font-medium ${scoreColor}`}>({percentage}%)</span>
        </div>
        {/* Score bar */}
        <div className="w-full bg-white/60 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              percentage >= 70
                ? 'bg-green-500'
                : percentage >= 40
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        {evaluation.overallSummary && (
          <p className="mt-4 text-gray-700">{evaluation.overallSummary}</p>
        )}
      </div>

      {/* Criterion Results */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Feedback</h3>
        <div className="space-y-4">
          {evaluation.criterionResults.map((cr, i) => (
            <CriterionCard key={i} result={cr} />
          ))}
        </div>
      </div>
    </div>
  );
}
