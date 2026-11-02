import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AlertCircle, ArrowUpRight, Sparkles } from 'lucide-react';
import { CATEGORIES, Category, IdeaResponse } from '../types';

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
    setIsGenerating(true);
    setError(null);

    try {
      const idea = await invoke<IdeaResponse>('generate_idea', {
        category: selectedCategory,
        apiKey: apiKey || null,
      });
      onIdeaGenerated(idea, idea.category ?? selectedCategory);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="generator-panel" aria-labelledby="generator-title">
      <div className="generator-heading">
        <div className="generator-icon"><Sparkles aria-hidden="true" /></div>
        <div>
          <p className="panel-kicker">The idea desk</p>
          <h2 id="generator-title">Start with a direction</h2>
        </div>
      </div>

      <div className="generator-fields">
        <label className="field-label" htmlFor="idea-category">What are you curious about?</label>
        <select
          id="idea-category"
          className="category-select"
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value as Category)}
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <p className="generator-hint">
          Pick a field, or leave it open and see where the idea takes you.
        </p>

        {error && (
          <div className="error-message" role="alert">
            <AlertCircle aria-hidden="true" />
            <div>
              <p>{error}</p>
              {error.toLowerCase().includes('api key') && (
                <button type="button" onClick={onOpenSettings} className="error-action">
                  Open settings
                </button>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="generate-button"
        >
          {isGenerating ? (
            <>
              <span className="button-spinner" aria-hidden="true" />
              Finding a fresh idea
            </>
          ) : (
            <>
              <span>{apiKey ? 'Generate with Claude' : 'Generate a local idea'}</span>
              <ArrowUpRight aria-hidden="true" />
            </>
          )}
        </button>
        <p className="privacy-note">
          {apiKey
            ? 'Claude uses your optional key. Your idea notebook stays on this device.'
            : 'No API key needed. Ideas are generated on this device.'}
        </p>
      </div>
    </section>
  );
}
