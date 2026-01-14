import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Key, Check, X, Eye, EyeOff } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="w-6 h-6" />
            API Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anthropic API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={localApiKey}
                onChange={(e) => {
                  setLocalApiKey(e.target.value);
                  setValidationResult(null);
                }}
                placeholder="sk-ant-..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Get your API key from{' '}
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                console.anthropic.com
              </a>
            </p>
          </div>

          {validationResult && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 ${
                validationResult === 'valid'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {validationResult === 'valid' ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>API key is valid!</span>
                </>
              ) : (
                <>
                  <X className="w-5 h-5" />
                  <span>Invalid API key. Please check and try again.</span>
                </>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleValidate}
              disabled={isValidating || !localApiKey.trim()}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isValidating ? 'Validating...' : 'Test Key'}
            </button>
            <button
              onClick={handleSave}
              disabled={!localApiKey.trim()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
