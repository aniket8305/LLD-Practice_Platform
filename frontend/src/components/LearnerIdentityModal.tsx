import { useState } from 'react';
import { setLearnerIdentifier } from '../utils/learner';

interface Props {
  onIdentified: (name: string) => void;
}

export function LearnerIdentityModal({ onIdentified }: Props) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setLearnerIdentifier(name.trim());
      onIdentified(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
        <p className="text-gray-600 mb-6">
          Enter your name to track your practice history across sessions.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name or identifier"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Start Practicing
          </button>
        </form>
      </div>
    </div>
  );
}
