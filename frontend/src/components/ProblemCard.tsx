import { Link } from 'react-router-dom';
import type { Problem } from '../types/index.js';
import { BookOpen, ChevronRight } from 'lucide-react';

interface Props {
  problem: Problem;
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
};

export function ProblemCard({ problem }: Props) {
  return (
    <Link
      to={`/problems/${problem.slug}`}
      className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
              difficultyColors[problem.difficulty] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {problem.difficulty}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{problem.title}</h3>
      <p className="text-gray-600 text-sm line-clamp-2">{problem.description}</p>
      <div className="mt-4 text-xs text-gray-500">
        {problem.requirements.length} requirements · {problem.rubricTemplate.criteria.length} evaluation criteria
      </div>
    </Link>
  );
}
