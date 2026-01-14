import React, { useState } from 'react';
import { IdeaGenerator } from './components/IdeaGenerator';
import { IdeaHistory } from './components/IdeaHistory';
import { Settings } from './components/Settings';
import { useApiKey } from './hooks/useApiKey';
import { useStore } from './hooks/useStore';
import { Idea, IdeaResponse } from './types';
import { Settings as SettingsIcon } from 'lucide-react';

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

    // Keep only the last 50 ideas
    const updatedIdeas = [newIdea, ...ideas].slice(0, 50);
    setIdeas(updatedIdeas);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all idea history?')) {
      setIdeas([]);
    }
  };

  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey);
  };

  if (isLoadingApiKey || isLoadingIdeas) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-600 rounded-lg" />
            <h1 className="text-xl font-bold text-gray-900">AI Idea Generator</h1>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <IdeaGenerator
            apiKey={apiKey}
            onIdeaGenerated={handleIdeaGenerated}
            onOpenSettings={() => setShowSettings(true)}
          />

          <IdeaHistory ideas={ideas} onClearHistory={handleClearHistory} />
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          apiKey={apiKey}
          onApiKeyChange={handleApiKeyChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Powered by Anthropic Claude AI • Built with Tauri & React
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
