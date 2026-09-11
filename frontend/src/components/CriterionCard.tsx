import { useState } from 'react';
import type { CriterionResult } from '../types/index.js';
import { ChevronDown, ChevronUp, Quote, AlertTriangle, Lightbulb, Shield } from 'lucide-react';

interface Props {
  result: CriterionResult;
}

const confidenceStyles: Record<string, { bg: string; text: string }> = {
  HIGH: { bg: 'bg-green-100', text: 'text-green-700' },
  MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  LOW: { bg: 'bg-red-100', text: 'text-red-700' },
};

export function CriterionCard({ result }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const percentage = Math.round((result.score / result.maxScore) * 100);
  const scoreColor =
    percentage >= 70 ? 'text-green-600' : percentage >= 40 ? 'text-yellow-600' : 'text-red-600';
  const barColor =
    percentage >= 70 ? 'bg-green-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  const conf = confidenceStyles[result.confidence] || confidenceStyles.MEDIUM;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="min-w-0">
            <span className="font-medium text-gray-900">{result.criterion}</span>
          </div>
          <div className="flex items-center gap-2 ml-auto mr-4">
            <span className={`font-bold ${scoreColor}`}>
              {result.score}/{result.maxScore}
            </span>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${barColor}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-5 pb-4 space-y-3 border-t border-gray-100 pt-3">
          {/* Evidence */}
          <div className="flex gap-2">
            <Quote className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-medium text-blue-600 uppercase">Evidence</span>
              <p className="text-sm text-gray-700 mt-0.5">{result.evidence}</p>
            </div>
          </div>

          {/* Concern */}
          {result.concern && result.concern.toLowerCase() !== 'none' && (
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-medium text-amber-600 uppercase">Concern</span>
                <p className="text-sm text-gray-700 mt-0.5">{result.concern}</p>
              </div>
            </div>
          )}

          {/* Suggestion */}
          <div className="flex gap-2">
            <Lightbulb className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-medium text-purple-600 uppercase">Suggestion</span>
              <p className="text-sm text-gray-700 mt-0.5">{result.suggestion}</p>
            </div>
          </div>

          {/* Confidence */}
          <div className="flex items-center gap-2 pt-1">
            <Shield className="w-3.5 h-3.5 text-gray-400" />
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${conf.bg} ${conf.text}`}
            >
              {result.confidence} confidence
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
