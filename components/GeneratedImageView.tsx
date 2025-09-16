
import React, { useCallback } from 'react';
import { Button } from './Button'; // Import the Button component

interface GeneratedImageViewProps {
  imageUrl: string | null;
  prompt: string | null;
}

const DownloadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const generateFilename = (promptStr: string | null): string => {
  const defaultName = 'ai-generated-image';
  let namePart = defaultName;

  if (promptStr) {
    // Sanitize and shorten the prompt for use as a filename
    namePart = promptStr
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, hyphens
      .trim()
      .replace(/\s+/g, '-')   // Replace spaces with hyphens
      .substring(0, 50);      // Limit length to 50 chars
  }
  
  // Ensure there's always a valid name part
  if (!namePart || namePart.length === 0) {
    namePart = defaultName;
  }

  return `${namePart}.png`; // Assuming PNG format as per geminiService
};

export const GeneratedImageView: React.FC<GeneratedImageViewProps> = ({ imageUrl, prompt }) => {
  const handleDownload = useCallback(() => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl; // imageUrl is a data:image/png;base64,... string
    link.download = generateFilename(prompt); 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageUrl, prompt]);

  if (!imageUrl) {
    // Placeholder/empty states are handled in App.tsx
    return null;
  }

  return (
    <div className="mt-2 p-2 sm:p-3 bg-gray-700/50 rounded-lg shadow-inner">
      <img 
        src={imageUrl} 
        alt={prompt ? `AI Generated Image: ${prompt.substring(0,100)}...` : "AI Generated Image"}
        className="w-full h-auto max-h-[400px] sm:max-h-[500px] object-contain rounded-md shadow-lg mx-auto" 
        aria-describedby="image-prompt-caption"
      />
      {prompt && (
        <p id="image-prompt-caption" className="text-xs text-gray-400 mt-3 italic text-center">
          Generated from: "{prompt.length > 100 ? prompt.substring(0,97) + '...' : prompt}"
        </p>
      )}
      <div className="mt-4 text-center">
        <Button 
          onClick={handleDownload} 
          variant="secondary" 
          size="sm" 
          className="inline-flex items-center py-2 px-3 sm:py-2.5 sm:px-4"
          aria-label="Download generated image"
        >
          <DownloadIcon />
          <span className="ml-2 text-xs sm:text-sm">Download Image</span>
        </Button>
      </div>
    </div>
  );
};
