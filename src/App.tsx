import { useState } from 'react';
import { Settings as SettingsIcon, Sparkles } from 'lucide-react';
import { IdeaGenerator } from './components/IdeaGenerator';
import { IdeaHistory } from './components/IdeaHistory';
import { Settings } from './components/Settings';
import { useApiKey } from './hooks/useApiKey';
import { useStore } from './hooks/useStore';
import { Idea, IdeaResponse } from './types';

function App() {
  const [apiKey, setApiKey, isLoadingApiKey] = useApiKey();
  const [ideas, setIdeas, isLoadingIdeas] = useStore<Idea[]>('ideas', []);
  const [showSettings, setShowSettings] = useState(false);

  const handleIdeaGenerated = (ideaResponse: IdeaResponse, category: string) => {
    const newIdea: Idea = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      category,
      ...ideaResponse,
    };

    setIdeas([newIdea, ...ideas].slice(0, 50));
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all idea history?')) {
      setIdeas([]);
    }
  };

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
        <a className="brand" href="#" aria-label="Idea Generator home">
          <span className="brand-mark"><Sparkles aria-hidden="true" /></span>
          <span className="brand-name">Idea Generator</span>
        </a>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="settings-button"
        >
          <SettingsIcon aria-hidden="true" />
          <span>Settings</span>
        </button>
      </header>

      <main className="workspace">
        <section className="intro" aria-labelledby="page-title">
          <div className="intro-copy">
            <p className="workspace-label">
              <span className="workspace-indicator" />
              Your next project starts here
            </p>
            <h1 id="page-title">Find the next thing worth building.</h1>
            <p className="intro-description">
              Turn a spark of curiosity into a clear, buildable product concept.
            </p>
            <div className="workspace-facts" aria-label="Workspace details">
              <span><strong>15</strong> creative directions</span>
              <span><strong>{ideas.length}</strong> ideas in your notebook</span>
            </div>
          </div>

          <IdeaGenerator
            apiKey={apiKey}
            onIdeaGenerated={handleIdeaGenerated}
            onOpenSettings={() => setShowSettings(true)}
          />
        </section>

        <IdeaHistory ideas={ideas} onClearHistory={handleClearHistory} />
      </main>

      <footer className="app-footer">
        <span>Made for curious minds.</span>
        <span>Ideas stay on this device.</span>
      </footer>

      {showSettings && (
        <Settings
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
