import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CATEGORIES, Category, IdeaResponse } from '../types';
import { Sparkles, AlertCircle } from 'lucide-react';

interface IdeaGeneratorProps {
  apiKey: string;
  onIdeaGenerated: (idea: IdeaResponse, category: string) => void;
  onOpenSettings: () => void;
}

export function IdeaGenerator({ apiKey, onIdeaGenerated, onOpenSettings }: IdeaGeneratorProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All Categories');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('Please set your API key in settings first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const idea = await invoke<IdeaResponse>('generate_idea', {
        category: selectedCategory,
        apiKey: apiKey,
      });
      onIdeaGenerated(idea, selectedCategory);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg shadow-md p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-primary-600" />
            AI Idea Generator
          </h1>
          <p className="text-gray-600">
            Generate innovative startup and application ideas powered by AI
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-primary-600 text-white shadow-md scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 text-sm">{error}</p>
                {error.includes('API key') && (
                  <button
                    onClick={onOpenSettings}
                    className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                  >
                    Open Settings
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !apiKey}
            className="w-full px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg text-lg font-semibold flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Generating Amazing Ideas...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Idea
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
