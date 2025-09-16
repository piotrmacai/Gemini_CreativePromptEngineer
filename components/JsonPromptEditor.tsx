
import React, { ChangeEvent } from 'react';
import { StructuredPrompt, PROMPT_FIELD_KEYS } from '../utils/promptUtils';

interface JsonPromptEditorProps {
  structuredPrompt: StructuredPrompt | null; // Can be null if not yet parsed or parsing failed
  onStructuredPromptChange: (updatedPrompt: StructuredPrompt) => void;
  disabled?: boolean;
}

// Helper to create a more human-readable label from camelCase keys
const formatLabel = (key: string): string => {
  const result = key.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
};

export const JsonPromptEditor: React.FC<JsonPromptEditorProps> = ({ structuredPrompt, onStructuredPromptChange, disabled }) => {
  if (!structuredPrompt) {
    return null; 
  }

  const handleChange = (key: keyof StructuredPrompt, value: string) => {
    if (structuredPrompt) {
        onStructuredPromptChange({
        ...structuredPrompt,
        [key]: value,
        });
    }
  };

  const baseInputClasses = "w-full p-2.5 bg-gray-700/80 border border-gray-600 rounded-lg text-gray-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-gray-500 disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="space-y-3">
      {PROMPT_FIELD_KEYS.map((key) => (
        <div key={key}>
          <label htmlFor={`prompt-${key}`} className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">
            {formatLabel(key)}
          </label>
          {key === 'subject' || key === 'background' ? (
            <textarea
              id={`prompt-${key}`}
              name={key}
              value={structuredPrompt[key] || ''}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleChange(key, e.target.value)}
              disabled={disabled}
              className={`${baseInputClasses} ${key === 'subject' ? 'h-24' : 'h-20'} resize-y`}
              aria-label={formatLabel(key)}
              placeholder={`${formatLabel(key)}...`}
            />
          ) : (
            <input
              type="text"
              id={`prompt-${key}`}
              name={key}
              value={structuredPrompt[key] || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(key, e.target.value)}
              disabled={disabled}
              className={baseInputClasses}
              aria-label={formatLabel(key)}
              placeholder={`${formatLabel(key)}...`}
            />
          )}
        </div>
      ))}
    </div>
  );
};