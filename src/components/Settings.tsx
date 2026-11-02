import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Check, Eye, EyeOff, KeyRound, X } from 'lucide-react';

interface SettingsProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onClose: () => void;
}

export function Settings({ apiKey, onApiKeyChange, onClose }: SettingsProps) {
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | null>(null);
  const [showKey, setShowKey] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    apiKeyInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusableElements.item(0);
      const last = focusableElements.item(focusableElements.length - 1);

      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, []);

  const handleValidate = async () => {
    if (!localApiKey.trim()) {
      setValidationResult('invalid');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const isValid = await invoke<boolean>('test_api_key', { apiKey: localApiKey });
      setValidationResult(isValid ? 'valid' : 'invalid');
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult('invalid');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = () => {
    onApiKeyChange(localApiKey);
    onClose();
  };

  return (
    <div className="settings-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="settings-heading">
          <div className="settings-icon"><KeyRound aria-hidden="true" /></div>
          <button type="button" onClick={onClose} className="close-button" aria-label="Close settings">
            <X aria-hidden="true" />
          </button>
          <p className="panel-kicker">Optional Claude connection</p>
          <h2 id="settings-title">Use your own API key</h2>
          <p className="settings-description">
            Add an Anthropic key to generate with Claude. Leave it blank to use the built-in generator without an account or API key.
          </p>
        </div>

        <div className="settings-fields">
          <label htmlFor="api-key">Anthropic API key <span className="optional-label">Optional</span></label>
          <div className="api-key-field">
            <input
              id="api-key"
              ref={apiKeyInputRef}
              type={showKey ? 'text' : 'password'}
              value={localApiKey}
              onChange={(event) => {
                setLocalApiKey(event.target.value);
                setValidationResult(null);
              }}
              placeholder="sk-ant-..."
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="visibility-button"
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
            >
              {showKey ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </div>
          <p className="settings-help">
            Leave this blank for local generation, or find a key in the{' '}
            <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">
              Anthropic Console
            </a>.
          </p>

          {validationResult && (
            <p className={`validation-message ${validationResult}`} role="status">
              {validationResult === 'valid' ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
              {validationResult === 'valid'
                ? 'This key is ready to use.'
                : 'The key could not be verified. Check it and try again.'}
            </p>
          )}

          <div className="settings-actions">
            <button
              type="button"
              onClick={handleValidate}
              disabled={isValidating || !localApiKey.trim()}
              className="secondary-button"
            >
              {isValidating ? 'Checking key...' : 'Test key'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="primary-button"
            >
              Save settings
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
