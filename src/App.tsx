import { useState } from 'react';
import { Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { IdeaGenerator } from './components/IdeaGenerator';
import { IdeaHistory } from './components/IdeaHistory';
import { PromptModal } from './components/PromptModal';
import { Settings } from './components/Settings';
import { useApiKey } from './hooks/useApiKey';
import { useStore } from './hooks/useStore';
import { AiModelId, Idea, IdeaResponse } from './types';
import { CATALOG_COUNT } from './utils/localIdeas';

const MAX_UNSTARRED_IDEAS = 60;

function App() {
  const [apiKey, setApiKey, isLoadingApiKey] = useApiKey();
  const [aiModel, setAiModel] = useStore<AiModelId>('aiModel', 'claude-sonnet-4-20250514');
  const [ideas, setIdeas, isLoadingIdeas] = useStore<Idea[]>('ideas', []);
  const [showSettings, setShowSettings] = useState(false);
  const [activePromptIdeaId, setActivePromptIdeaId] = useState<string | null>(null);

  const handleIdeaGenerated = (ideaResponse: IdeaResponse, category: string) => {
    const newIdea: Idea = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      category,
      ...ideaResponse,
    };

    const nextList = [newIdea, ...ideas];
    // Protect all starred ideas from eviction; cap only unstarred history
    let unstarredSeen = 0;
    const pruned = nextList.filter((item) => {
      if (item.starred) return true;
      unstarredSeen += 1;
      return unstarredSeen <= MAX_UNSTARRED_IDEAS;
    });

    setIdeas(pruned);
  };

  const handleToggleStar = (id: string) => {
    setIdeas(
      ideas.map((item) =>
        item.id === id ? { ...item, starred: !item.starred } : item,
      ),
    );
  };

  const handleDeleteIdea = (id: string) => {
    setIdeas(ideas.filter((item) => item.id !== id));
    if (activePromptIdeaId === id) {
      setActivePromptIdeaId(null);
    }
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setIdeas(
      ideas.map((item) => (item.id === id ? { ...item, notes } : item)),
    );
  };

  const handleClearUnstarred = () => {
    setIdeas(ideas.filter((item) => item.starred));
  };

  const activePromptIdea = activePromptIdeaId
    ? ideas.find((item) => item.id === activePromptIdeaId) ?? null
    : null;

  if (isLoadingApiKey || isLoadingIdeas) {
    return (
      <div className="loading-screen" role="status" aria-label="Loading your workspace">
        <div className="loading-mark">
          <Sparkles aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Idea Prompt Generator home">
          <span className="brand-mark">
            <Sparkles aria-hidden="true" />
          </span>
          <span className="brand-name">Idea Prompt Generator</span>
        </a>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="settings-button"
        >
          <SettingsIcon aria-hidden="true" />
          <span>{apiKey.trim() ? 'AI Connected' : 'Settings'}</span>
        </button>
      </header>

      <main className="workspace">
        <section className="intro" aria-labelledby="page-title">
          <div className="intro-copy">
            <p className="workspace-label">
              <span className="workspace-indicator" />
              From blank page to buildable spec
            </p>
            <h1 id="page-title">Find the next thing worth building.</h1>
            <p className="intro-description">
              Explore grounded software concepts across 15 domains—then turn any spark directly into
              a ready-to-run coding agent build prompt.
            </p>
            <div className="workspace-facts" aria-label="Workspace details">
              <span>
                <strong>{CATALOG_COUNT}</strong> built-in concepts
              </span>
              <span>
                <strong>15</strong> domains
              </span>
              <span>
                <strong>{ideas.length}</strong> in your notebook
              </span>
            </div>
          </div>

          <IdeaGenerator
            apiKey={apiKey}
            aiModel={aiModel}
            existingIdeas={ideas}
            onIdeaGenerated={handleIdeaGenerated}
            onOpenSettings={() => setShowSettings(true)}
          />
        </section>

        <IdeaHistory
          ideas={ideas}
          onToggleStar={handleToggleStar}
          onDeleteIdea={handleDeleteIdea}
          onUpdateNotes={handleUpdateNotes}
          onClearUnstarred={handleClearUnstarred}
          onOpenPromptModal={(idea) => setActivePromptIdeaId(idea.id)}
        />
      </main>

      <footer className="app-footer">
        <span>Made for builders & curious minds.</span>
        <span>Ideas and notes stay on this device.</span>
      </footer>

      {showSettings && (
        <Settings
          apiKey={apiKey}
          aiModel={aiModel}
          onApiKeyChange={setApiKey}
          onAiModelChange={setAiModel}
          onClose={() => setShowSettings(false)}
        />
      )}

      {activePromptIdea && (
        <PromptModal
          idea={activePromptIdea}
          onClose={() => setActivePromptIdeaId(null)}
        />
      )}
    </div>
  );
}

export default App;
