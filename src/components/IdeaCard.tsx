import { useState } from 'react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { Check, Copy, Lightbulb, Target, Users } from 'lucide-react';
import { isTauriRuntime } from '../hooks/useStore';
import { Idea } from '../types';
import { formatIdeaForClipboard } from '../utils/formatIdea';

interface IdeaCardProps {
  idea: Idea;
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const [copied, setCopied] = useState(false);

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

  return (
    <article className="idea-card">
      <div className="idea-card-topline">
        <span className="idea-category">{idea.category}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={`copy-button${copied ? ' is-copied' : ''}`}
          aria-label={copied ? 'Copied idea to clipboard' : 'Copy idea to clipboard'}
          title={copied ? 'Copied' : 'Copy idea'}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <p className="idea-date">
        {new Date(idea.timestamp).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </p>

      <div className="idea-concept">
        <div className="idea-section-label">
          <Lightbulb aria-hidden="true" />
          <span>The concept</span>
        </div>
        <p>{idea.concept}</p>
        <span className="platform-tag">{idea.platform}</span>
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
            {idea.key_features.map((feature, index) => <li key={`${feature}-${index}`}>{feature}</li>)}
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
    </article>
  );
}
