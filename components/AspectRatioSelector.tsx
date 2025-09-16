
import React from 'react';

interface AspectRatioSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const ASPECT_RATIOS = ["1:1", "4:3", "3:4", "16:9", "9:16"];

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="flex flex-col items-center">
      <label className="text-sm font-medium text-gray-400 mb-2">Aspect Ratio</label>
      <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Aspect ratio">
        {ASPECT_RATIOS.map((ratio) => {
          const isSelected = value === ratio;
          return (
            <button
              key={ratio}
              type="button"
              onClick={() => onChange(ratio)}
              disabled={disabled}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
                ${isSelected 
                  ? 'bg-indigo-600 text-white focus:ring-indigo-500' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300 focus:ring-gray-500'
                }
                ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
              `}
              role="radio"
              aria-checked={isSelected}
            >
              {ratio}
            </button>
          );
        })}
      </div>
    </div>
  );
};
