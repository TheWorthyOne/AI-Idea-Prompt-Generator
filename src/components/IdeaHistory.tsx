import { useMemo, useState } from 'react';
import { Download, History, Search, Sparkles, Star, Trash2, X } from 'lucide-react';
import { Idea } from '../types';
import { exportIdeasAsMarkdown, getIdeaDisplayName } from '../utils/formatIdea';
import { IdeaCard } from './IdeaCard';

interface IdeaHistoryProps {
  ideas: Idea[];
  onToggleStar: (id: string) => void;
  onDeleteIdea: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onClearUnstarred: () => void;
  onOpenPromptModal: (idea: Idea) => void;
}

export function IdeaHistory({
  ideas,
  onToggleStar,
  onDeleteIdea,
  onUpdateNotes,
  onClearUnstarred,
  onOpenPromptModal,
}: IdeaHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [confirmClear, setConfirmClear] = useState(false);

  const starredCount = useMemo(() => ideas.filter((i) => i.starred).length, [ideas]);
  const unstarredCount = ideas.length - starredCount;

  const presentCategories = useMemo(() => {
    const unique = Array.from(new Set(ideas.map((i) => i.category))).sort();
    return ['All', ...unique];
  }, [ideas]);

  const filteredIdeas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ideas.filter((idea) => {
      if (onlyStarred && !idea.starred) return false;
      if (categoryFilter !== 'All' && idea.category !== categoryFilter) return false;
      if (!q) return true;

      const searchable = [
        getIdeaDisplayName(idea),
        idea.category,
        idea.scope ?? '',
        idea.platform,
        idea.concept,
        idea.target_audience,
        idea.monetization,
        idea.value_proposition,
        idea.suggested_stack ?? '',
        idea.notes ?? '',
        ...idea.key_features,
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [ideas, onlyStarred, categoryFilter, searchQuery]);

  const handleExportMarkdown = () => {
    const targetList = filteredIdeas.length > 0 ? filteredIdeas : ideas;
    if (targetList.length === 0) return;

    const markdown = exportIdeasAsMarkdown(targetList);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `idea-notebook-${dateStamp}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="history-section" aria-labelledby="history-title">
      <div className="history-heading">
        <div>
          <p className="panel-kicker">Saved on this device</p>
          <h2 id="history-title">
            <History aria-hidden="true" />
            Your idea notebook
            <span className="history-count">{ideas.length}</span>
          </h2>
        </div>

        {ideas.length > 0 && (
          <div className="history-header-actions">
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="export-notebook-button"
              title="Download visible ideas as Markdown"
            >
              <Download aria-hidden="true" />
              <span>Export .md</span>
            </button>

            {unstarredCount > 0 &&
              (!confirmClear ? (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="clear-history-button"
                >
                  <Trash2 aria-hidden="true" />
                  <span>{starredCount > 0 ? 'Clear unstarred' : 'Clear notebook'}</span>
                </button>
              ) : (
                <div className="confirm-clear-inline" role="group" aria-label="Confirm clear">
                  <button
                    type="button"
                    onClick={() => {
                      onClearUnstarred();
                      setConfirmClear(false);
                    }}
                    className="confirm-clear-yes"
                  >
                    Remove {unstarredCount}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="confirm-clear-no"
                  >
                    Cancel
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {ideas.length > 0 && (
        <div className="notebook-toolbar">
          <div className="notebook-search">
            <Search aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search concepts, audiences, stacks, or notes..."
              aria-label="Search saved ideas"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="clear-search-btn"
                aria-label="Clear search"
              >
                <X aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="notebook-filters">
            <button
              type="button"
              onClick={() => setOnlyStarred(!onlyStarred)}
              className={`filter-pill${onlyStarred ? ' is-active' : ''}`}
              aria-pressed={onlyStarred}
            >
              <Star aria-hidden="true" />
              <span>Starred ({starredCount})</span>
            </button>

            {presentCategories.length > 2 && (
              <select
                className="notebook-category-filter"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter notebook by category"
              >
                {presentCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All categories' : cat}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {ideas.length === 0 ? (
        <div className="empty-notebook">
          <div className="empty-mark">
            <Sparkles aria-hidden="true" />
          </div>
          <div>
            <h3>A blank page, full of possibility.</h3>
            <p>
              Generate an idea above—then star your favorites, jot down twists, or open the{' '}
              <strong>Build Prompt Studio</strong> to start coding it.
            </p>
          </div>
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="empty-notebook">
          <div className="empty-mark">
            <Search aria-hidden="true" />
          </div>
          <div>
            <h3>No matching ideas in this view.</h3>
            <p>
              Try clearing your search or toggling off the Starred / category filters.
            </p>
          </div>
        </div>
      ) : (
        <div className="idea-list">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onToggleStar={onToggleStar}
              onDelete={onDeleteIdea}
              onUpdateNotes={onUpdateNotes}
              onOpenPromptModal={onOpenPromptModal}
            />
          ))}
        </div>
      )}
    </section>
  );
}
