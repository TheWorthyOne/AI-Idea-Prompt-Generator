import React from 'react';
import { Idea } from '../types';
import { IdeaCard } from './IdeaCard';
import { History, Trash2 } from 'lucide-react';

interface IdeaHistoryProps {
  ideas: Idea[];
  onClearHistory: () => void;
}

export function IdeaHistory({ ideas, onClearHistory }: IdeaHistoryProps) {
  if (ideas.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No ideas generated yet</p>
        <p className="text-sm text-gray-400 mt-2">
          Generate your first idea to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <History className="w-6 h-6" />
          Idea History ({ideas.length}/50)
        </h2>
        <button
          onClick={onClearHistory}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear History
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {ideas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))}
      </div>
    </div>
  );
}
