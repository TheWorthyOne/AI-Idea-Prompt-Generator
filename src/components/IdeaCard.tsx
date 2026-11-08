import { useState } from 'react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import {
  Check,
  Copy,
  Lightbulb,
  PenLine,
  Star,
  Target,
  Terminal,
  Trash2,
  Users,
} from 'lucide-react';
import { isTauriRuntime } from '../hooks/useStore';
import { Idea } from '../types';
import { formatIdeaForClipboard, getIdeaDisplayName } from '../utils/formatIdea';

interface IdeaCardProps {
  idea: Idea;
  onToggleStar: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onOpenPromptModal: (idea: Idea) => void;
}

export function IdeaCard({
  idea,
  onToggleStar,
  onDelete,
  onUpdateNotes,
  onOpenPromptModal,
}: IdeaCardProps) {
  const [copied, setCopied] = useState(false);
  const [notesOpen, setNotesOpen] = useState(() => Boolean(idea.notes && idea.notes.trim()));

  const handleCopy = async () => {
    const formatted = formatIdeaForClipboard(idea);
    try {
      if (isTauriRuntime()) {
        await writeText(formatted);
      } else {
        await navigator.clipboard.writeText(formatted);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const title = getIdeaDisplayName(idea);

  return (
    <article className={`idea-card${idea.starred ? ' is-starred' : ''}`}>
      <div className="idea-card-topline">
        <div className="idea-badges">
          <span className="idea-category">{idea.category}</span>
          {idea.scope && <span className="idea-scope-badge">{idea.scope}</span>}
          {idea.source === 'ai' && <span className="idea-ai-badge">Claude</span>}
        </div>

        <div className="idea-card-actions">
          <button
            type="button"
            onClick={() => onToggleStar(idea.id)}
            className={`icon-action-button star-button${idea.starred ? ' is-active' : ''}`}
            aria-label={idea.starred ? `Unstar ${title}` : `Star ${title}`}
            title={idea.starred ? 'Starred (protected from clear)' : 'Star idea'}
          >
            <Star aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => onOpenPromptModal(idea)}
            className="prompt-trigger-button"
            title="Open Build Prompt Studio"
          >
            <Terminal aria-hidden="true" />
            <span>Build Prompt</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className={`copy-button${copied ? ' is-copied' : ''}`}
            aria-label={copied ? 'Copied idea brief' : 'Copy idea brief'}
            title={copied ? 'Copied' : 'Copy Markdown brief'}
          >
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(idea.id)}
            className="icon-action-button delete-card-button"
            aria-label={`Remove ${title}`}
            title="Remove from notebook"
          >
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="idea-title-row">
        <h3 className="idea-title">{title}</h3>
        <span className="idea-date">
          {new Date(idea.timestamp).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      <div className="idea-concept">
        <div className="idea-section-label">
          <Lightbulb aria-hidden="true" />
          <span>The concept</span>
        </div>
        <p>{idea.concept}</p>
        <div className="idea-meta-tags">
          <span className="platform-tag">{idea.platform}</span>
          {idea.suggested_stack && (
            <span className="stack-tag" title="Recommended v1 stack">
              {idea.suggested_stack}
            </span>
          )}
        </div>
      </div>

      <div className="idea-details">
        <div className="idea-detail">
          <div className="idea-section-label">
            <Users aria-hidden="true" />
            <span>For</span>
          </div>
          <p>{idea.target_audience}</p>
        </div>

        <div className="idea-detail">
          <div className="idea-section-label">
            <Target aria-hidden="true" />
            <span>First features</span>
          </div>
          <ul>
            {idea.key_features.map((feature, index) => (
              <li key={`${feature}-${index}`}>{feature}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="idea-bottomline">
        <div>
          <span className="idea-bottom-label">Business model</span>
          <p>{idea.monetization}</p>
        </div>
        <blockquote>{idea.value_proposition}</blockquote>
      </div>

      <div className="idea-notes-block">
        {!notesOpen ? (
          <button
            type="button"
            onClick={() => setNotesOpen(true)}
            className="add-note-toggle"
          >
            <PenLine aria-hidden="true" />
            <span>Add personal twist or note</span>
          </button>
        ) : (
          <div className="idea-notes-editor">
            <label className="idea-notes-label" htmlFor={`note-${idea.id}`}>
              <PenLine aria-hidden="true" />
              <span>Your notes (auto-included in Build Prompt)</span>
            </label>
            <textarea
              id={`note-${idea.id}`}
              rows={2}
              value={idea.notes ?? ''}
              onChange={(event) => onUpdateNotes(idea.id, event.target.value)}
              placeholder="Jot down your angle, domain name, or MVP cut..."
            />
          </div>
        )}
      </div>
    </article>
  );
}
