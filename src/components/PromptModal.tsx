import { useEffect, useRef, useState } from 'react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { Check, Copy, FileCode2, FileText, Layout, Terminal, X } from 'lucide-react';
import { isTauriRuntime } from '../hooks/useStore';
import { Idea, PromptMode } from '../types';
import { buildCodingPrompt, getIdeaDisplayName } from '../utils/formatIdea';

interface PromptModalProps {
  idea: Idea;
  onClose: () => void;
}

const PROMPT_TABS: Array<{
  mode: PromptMode;
  label: string;
  subtitle: string;
  Icon: typeof Terminal;
}> = [
  {
    mode: 'mvp',
    label: 'MVP Build Prompt',
    subtitle: 'Ready to paste into Antigravity, Claude Code, or Cursor to scaffold v1',
    Icon: FileCode2,
  },
  {
    mode: 'prd',
    label: 'PRD & Data Spec',
    subtitle: 'Generates user loop, ruthless MVP scope cut, SQL/TS schema, and validation plan',
    Icon: FileText,
  },
  {
    mode: 'ui',
    label: 'UI Prototype',
    subtitle: 'Tailored for interactive frontend prototyping (v0, Bolt, or UI exploration)',
    Icon: Layout,
  },
];

export function PromptModal({ idea, onClose }: PromptModalProps) {
  const [mode, setMode] = useState<PromptMode>('mvp');
  const [promptText, setPromptText] = useState(() => buildCodingPrompt(idea, 'mvp'));
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    setPromptText(buildCodingPrompt(idea, mode));
    setCopied(false);
  }, [idea, mode]);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  const handleCopyPrompt = async () => {
    try {
      if (isTauriRuntime()) {
        await writeText(promptText);
      } else {
        await navigator.clipboard.writeText(promptText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy build prompt:', err);
    }
  };

  const title = getIdeaDisplayName(idea);
  const activeTab = PROMPT_TABS.find((t) => t.mode === mode) ?? PROMPT_TABS[0];

  return (
    <div
      className="settings-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="prompt-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-modal-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="prompt-dialog-header">
          <div className="prompt-dialog-title-row">
            <span className="settings-icon prompt-badge-icon">
              <Terminal aria-hidden="true" />
            </span>
            <div>
              <p className="panel-kicker">Build Prompt Studio · {idea.category}</p>
              <h2 id="prompt-modal-title">{title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="close-button prompt-close-button"
            aria-label="Close prompt studio"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="prompt-tabs" role="tablist" aria-label="Prompt style">
          {PROMPT_TABS.map(({ mode: tabMode, label, Icon }) => (
            <button
              key={tabMode}
              type="button"
              role="tab"
              aria-selected={mode === tabMode}
              className={`prompt-tab${mode === tabMode ? ' is-active' : ''}`}
              onClick={() => setMode(tabMode)}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <p className="prompt-subtitle">{activeTab.subtitle}</p>

        <textarea
          className="prompt-textarea"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          aria-label="Generated coding prompt"
          spellCheck={false}
        />

        <div className="prompt-dialog-footer">
          <span className="prompt-char-count">
            {promptText.length.toLocaleString()} chars · Editable before copying
          </span>
          <div className="prompt-footer-actions">
            <button type="button" onClick={onClose} className="secondary-button prompt-cancel-btn">
              Close
            </button>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="primary-button prompt-copy-btn"
            >
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              <span>{copied ? 'Copied build prompt!' : 'Copy build prompt'}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
