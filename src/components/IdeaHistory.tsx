import { History, Sparkles, Trash2 } from 'lucide-react';
import { Idea } from '../types';
import { IdeaCard } from './IdeaCard';

interface IdeaHistoryProps {
  ideas: Idea[];
  onClearHistory: () => void;
}

export function IdeaHistory({ ideas, onClearHistory }: IdeaHistoryProps) {
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
          <button type="button" onClick={onClearHistory} className="clear-history-button">
            <Trash2 aria-hidden="true" />
            Clear notebook
          </button>
        )}
      </div>

      {ideas.length === 0 ? (
        <div className="empty-notebook">
          <div className="empty-mark"><Sparkles aria-hidden="true" /></div>
          <div>
            <h3>A blank page, full of possibility.</h3>
            <p>Your generated ideas will collect here, ready whenever you are.</p>
          </div>
        </div>
      ) : (
        <div className="idea-list">
          {ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)}
        </div>
      )}
    </section>
  );
}
