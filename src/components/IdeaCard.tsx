import React from 'react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { Idea } from '../types';
import { formatIdeaForClipboard } from '../utils/formatIdea';
import { Copy, Check, Lightbulb, Users, DollarSign, Target } from 'lucide-react';

interface IdeaCardProps {
  idea: Idea;
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await writeText(formatIdeaForClipboard(idea));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
              {idea.category}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(idea.timestamp).toLocaleDateString()}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{idea.platform}</h3>
        </div>
        <button
          onClick={handleCopy}
          className="ml-4 p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-primary-600" />
            <h4 className="font-semibold text-gray-900">Concept</h4>
          </div>
          <p className="text-gray-700 text-sm">{idea.concept}</p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary-600" />
            <h4 className="font-semibold text-gray-900">Target Audience</h4>
          </div>
          <p className="text-gray-700 text-sm">{idea.target_audience}</p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary-600" />
            <h4 className="font-semibold text-gray-900">Key Features</h4>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {idea.key_features.map((feature, index) => (
              <li key={index} className="text-gray-700 text-sm">
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-primary-600" />
            <h4 className="font-semibold text-gray-900">Monetization</h4>
          </div>
          <p className="text-gray-700 text-sm">{idea.monetization}</p>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <p className="text-sm font-medium text-primary-700 italic">
            "{idea.value_proposition}"
          </p>
        </div>
      </div>
    </div>
  );
}
