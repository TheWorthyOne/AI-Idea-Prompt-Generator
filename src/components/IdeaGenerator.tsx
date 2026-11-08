import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AlertCircle, ArrowUpRight, Sparkles } from 'lucide-react';
import { isTauriRuntime } from '../hooks/useStore';
import {
  CATEGORIES,
  Category,
  Idea,
  IdeaResponse,
  PLATFORM_FILTERS,
  PlatformFilter,
  SCOPES,
  ScopeFilter,
} from '../types';
import { getIdeaDisplayName } from '../utils/formatIdea';
import {
  generateAiIdeaInBrowser,
  generateLocalIdeaInBrowser,
} from '../utils/localIdeas';

interface IdeaGeneratorProps {
  apiKey: string;
  aiModel: string;
  existingIdeas: Idea[];
  onIdeaGenerated: (idea: IdeaResponse, category: string) => void;
  onOpenSettings: () => void;
}

export function IdeaGenerator({
  apiKey,
  aiModel,
  existingIdeas,
  onIdeaGenerated,
  onOpenSettings,
}: IdeaGeneratorProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>('All Categories');
  const [selectedScope, setSelectedScope] = useState<ScopeFilter>('Any Scope');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformFilter>('Any Platform');
  const [focusTwist, setFocusTwist] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasApiKey = Boolean(apiKey.trim());

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    const excludeNames = Array.from(
      new Set(
        existingIdeas
          .flatMap((idea) => [idea.slug, idea.name, getIdeaDisplayName(idea)])
          .filter((v): v is string => Boolean(v && v.trim())),
      ),
    );

    try {
      let idea: IdeaResponse;
      if (isTauriRuntime()) {
        idea = await invoke<IdeaResponse>('generate_idea', {
          category: selectedCategory,
          apiKey: hasApiKey ? apiKey.trim() : null,
          scope: selectedScope,
          platformFilter: selectedPlatform,
          focus: focusTwist.trim() || null,
          excludeNames,
          model: aiModel,
        });
      } else if (hasApiKey) {
        idea = await generateAiIdeaInBrowser(apiKey, {
          category: selectedCategory,
          scope: selectedScope,
          platformFilter: selectedPlatform,
          focus: focusTwist,
          excludeNames,
          model: aiModel,
        });
      } else {
        idea = generateLocalIdeaInBrowser({
          category: selectedCategory,
          scope: selectedScope,
          platformFilter: selectedPlatform,
          focus: focusTwist,
          excludeNames,
        });
      }

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
        <div className="generator-icon">
          <Sparkles aria-hidden="true" />
        </div>
        <div>
          <p className="panel-kicker">The idea desk</p>
          <h2 id="generator-title">Shape your next direction</h2>
        </div>
      </div>

      <div className="generator-fields">
        <label className="field-label" htmlFor="idea-category">
          Domain or industry
        </label>
        <select
          id="idea-category"
          className="category-select"
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value as Category)}
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <div className="generator-filter-row">
          <div>
            <label className="field-label" htmlFor="idea-scope">
              Build scope
            </label>
            <select
              id="idea-scope"
              className="category-select compact-select"
              value={selectedScope}
              onChange={(event) => setSelectedScope(event.target.value as ScopeFilter)}
            >
              {SCOPES.map((scope) => (
                <option key={scope} value={scope}>
                  {scope}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="idea-platform">
              Platform
            </label>
            <select
              id="idea-platform"
              className="category-select compact-select"
              value={selectedPlatform}
              onChange={(event) => setSelectedPlatform(event.target.value as PlatformFilter)}
            >
              {PLATFORM_FILTERS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="focus-field-group">
          <label className="field-label" htmlFor="idea-focus">
            Focus or audience twist <span className="optional-label">Optional</span>
          </label>
          <input
            id="idea-focus"
            type="text"
            className="focus-input"
            value={focusTwist}
            onChange={(event) => setFocusTwist(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !isGenerating) {
                event.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="e.g. offline-first, medical students, small teams..."
          />
        </div>

        <p className="generator-hint">
          Automatically avoids repeating concepts already saved in your notebook.
        </p>

        {error && (
          <div className="error-message" role="alert">
            <AlertCircle aria-hidden="true" />
            <div>
              <p>{error}</p>
              {(error.toLowerCase().includes('api') || error.toLowerCase().includes('401')) && (
                <button type="button" onClick={onOpenSettings} className="error-action">
                  Check API settings
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
              Drafting a fresh concept...
            </>
          ) : (
            <>
              <span>{hasApiKey ? 'Generate custom idea with Claude' : 'Generate fresh idea'}</span>
              <ArrowUpRight aria-hidden="true" />
            </>
          )}
        </button>
        <p className="privacy-note">
          {hasApiKey
            ? 'Using your Anthropic key · Clear key in Settings anytime for offline catalog mode.'
            : 'Offline mode · Pulling from 90 curated, non-repeating product concepts.'}
        </p>
      </div>
    </section>
  );
}
