import { AttemptStatus } from '../types/index.js';

interface Props {
  status: AttemptStatus;
}

const statusStyles: Record<AttemptStatus, { bg: string; text: string; label: string }> = {
  [AttemptStatus.DRAFT]: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
  [AttemptStatus.SUBMITTED]: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Submitted' },
  [AttemptStatus.EVALUATING]: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Evaluating' },
  [AttemptStatus.EVALUATED]: { bg: 'bg-green-100', text: 'text-green-700', label: 'Evaluated' },
  [AttemptStatus.EVALUATION_FAILED]: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
};

export function StatusBadge({ status }: Props) {
  const style = statusStyles[status] || statusStyles[AttemptStatus.DRAFT];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      {status === AttemptStatus.EVALUATING && (
        <div className="animate-spin w-3 h-3 border-2 border-indigo-300 border-t-indigo-600 rounded-full mr-1.5" />
      )}
      {style.label}
    </span>
  );
}
