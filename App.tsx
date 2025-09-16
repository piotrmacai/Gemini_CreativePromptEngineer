
import React, { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { generatePromptFromImage, editImageWithPrompt } from './services/geminiService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Button } from './components/Button';
import { ImageInputArea } from './components/ImageInputArea';
import { GeneratedImageView } from './components/GeneratedImageView';
import { JsonPromptEditor } from './components/JsonPromptEditor';
import {
  StructuredPrompt,
  parsePromptToStructured,
  structuredPromptToString,
  createDefaultStructuredPrompt
} from './utils/promptUtils';

interface UserImage {
  base64: string;
  mimeType: string;
  objectURL: string;
}

const App: React.FC = () => {
  const [userImage, setUserImage] = useState<UserImage | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [structuredPrompt, setStructuredPrompt] = useState<StructuredPrompt | null>(null);
  const [generatedAiImage, setGeneratedAiImage] = useState<string | null>(null);
  
  const [isLoadingPrompt, setIsLoadingPrompt] = useState<boolean>(false);
  const [isLoadingAiImage, setIsLoadingAiImage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const apiKey = process.env.API_KEY;

  const handleImageUpload = useCallback(async (file: File) => {
    setError(null);
    setGeneratedPrompt(''); 
    setStructuredPrompt(null);
    setGeneratedAiImage(null); 
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setUserImage({
          base64: base64String,
          mimeType: file.type,
          objectURL: URL.createObjectURL(file),
        });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image. Please try again.');
      setUserImage(null);
    }
  }, []);

  const handleGeneratePrompt = useCallback(async () => {
    if (!userImage || !apiKey) {
      setError(!apiKey ? 'API key is missing. Configure process.env.API_KEY.' : 'Please upload an image first.');
      return;
    }
    setIsLoadingPrompt(true);
    setError(null);
    setGeneratedPrompt(''); 
    setStructuredPrompt(null);
    setGeneratedAiImage(null); 
    try {
      const prompt = await generatePromptFromImage(apiKey, userImage.base64, userImage.mimeType);
      setGeneratedPrompt(prompt);
      // Initial parsing will be handled by the useEffect hook listening to generatedPrompt
    } catch (err) {
      console.error('Error generating prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate prompt. Please check the console for details.');
      setGeneratedPrompt(''); // Clear prompt on error
      setStructuredPrompt(null); // Clear structured prompt on error
    } finally {
      setIsLoadingPrompt(false);
    }
  }, [userImage, apiKey]);

  const handleEditImage = useCallback(async () => {
    if (!generatedPrompt.trim() || !apiKey) {
      setError(!apiKey ? 'API key is missing. Configure process.env.API_KEY.' : 'Please generate or enter a prompt first.');
      return;
    }
    if (!userImage) {
        setError('Please upload an image to edit first.');
        return;
    }
    setIsLoadingAiImage(true);
    setError(null);
    try {
      const imageUrl = await editImageWithPrompt(apiKey, generatedPrompt, userImage.base64, userImage.mimeType);
      setGeneratedAiImage(imageUrl);
    } catch (err) {
      console.error('Error editing AI image:', err);
      setError(err instanceof Error ? err.message : 'Failed to edit AI image. Please check the console for details.');
    } finally {
      setIsLoadingAiImage(false);
    }
  }, [generatedPrompt, apiKey, userImage]);

  const copyPromptToClipboard = useCallback(() => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt)
        .then(() => {
          alert('Prompt copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy prompt: ', err);
          setError('Failed to copy prompt.');
        });
    }
  }, [generatedPrompt]);

  // Handler for main textarea change (generatedPrompt)
  const handleGeneratedPromptTextareaChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const newPromptText = e.target.value;
    setGeneratedPrompt(newPromptText);
    try {
      // Directly update structuredPrompt from textarea edit
      if (newPromptText.trim() === '') {
        setStructuredPrompt(null);
      } else {
        setStructuredPrompt(parsePromptToStructured(newPromptText));
      }
    } catch (error) {
      console.warn("Could not parse manually edited prompt into structured form:", error);
      setStructuredPrompt(createDefaultStructuredPrompt()); 
    }
  }, [setGeneratedPrompt, setStructuredPrompt]);

  // Callback for JsonPromptEditor (structuredPrompt parts)
  const handleStructuredPromptPartChange = useCallback((updatedStructuredPrompt: StructuredPrompt) => {
    setStructuredPrompt(updatedStructuredPrompt);
    setGeneratedPrompt(structuredPromptToString(updatedStructuredPrompt));
  }, [setStructuredPrompt, setGeneratedPrompt]);

  // Effect to parse prompt from AI or clear/update structured view based on generatedPrompt changes
  useEffect(() => {
    if (isLoadingPrompt) return; // Don't process while prompt is actively being loaded

    const currentStructuredToString = structuredPrompt ? structuredPromptToString(structuredPrompt) : null;

    if (generatedPrompt && generatedPrompt !== currentStructuredToString) {
      // This condition means generatedPrompt was likely set by AI or pasted directly,
      // and it's different from what structuredPrompt currently would produce. So, re-parse.
      try {
        setStructuredPrompt(parsePromptToStructured(generatedPrompt));
      } catch (error) {
        console.warn("Error parsing generated prompt for structured view:", error);
        // If parsing fails, set to a default state allowing editor to show empty or indicate issue
        setStructuredPrompt(createDefaultStructuredPrompt()); 
      }
    } else if (!generatedPrompt && structuredPrompt !== null) {
      // If generatedPrompt is cleared (and not just an empty string that parsed to default), clear structuredPrompt
      setStructuredPrompt(null);
    }
  }, [generatedPrompt, isLoadingPrompt, structuredPrompt]);


  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100 selection:bg-indigo-500 selection:text-white">
      <header className="py-6 sm:py-8 text-center border-b border-gray-700/50 shadow-lg bg-gray-900/30 backdrop-blur-md">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          AI Image Prompt Engineer
        </h1>
        <p className="text-gray-400 mt-2 text-xs sm:text-sm max-w-xl mx-auto px-4">
          Upload an image, generate a detailed prompt, then edit your image with AI.
        </p>
      </header>

      {!apiKey && (
         <div className="w-full max-w-3xl mx-auto mt-6 bg-red-800 text-white p-3 sm:p-4 rounded-lg text-center text-sm sm:text-base">
           <strong>Warning:</strong> API_KEY is not configured. Please ensure <code>process.env.API_KEY</code> is set.
         </div>
      )}

      {error && (
        <div className="w-full max-w-3xl mx-auto mt-6 bg-red-600 text-white p-3 sm:p-4 rounded-lg animate-shake">
          <p className="font-semibold">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-6 sm:py-8 w-full max-w-3xl space-y-6 md:space-y-8">
        {/* Row 1: Image Input & Generated Image */}
        <div className="flex flex-col md:grid md:grid-cols-2 md:gap-6 lg:gap-8 space-y-6 md:space-y-0">
          {/* Section 1: Image Input */}
          <section aria-labelledby="image-upload-heading" className="bg-gray-800/60 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-2xl transition-all hover:shadow-indigo-500/30 flex flex-col">
            <h2 id="image-upload-heading" className="text-xl sm:text-2xl font-semibold text-indigo-400 mb-3 sm:mb-4 border-b border-gray-700 pb-2 sm:pb-3">
              1. Upload Image
            </h2>
            <ImageInputArea onImageUploaded={handleImageUpload} currentImageUrl={userImage?.objectURL} />
          </section>

          {/* Section 3: AI Edited Image */}
          <section aria-labelledby="ai-image-heading" className="bg-gray-800/60 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-2xl transition-all hover:shadow-indigo-500/30 flex flex-col">
            <h2 id="ai-image-heading" className="text-xl sm:text-2xl font-semibold text-indigo-400 mb-3 sm:mb-4 border-b border-gray-700 pb-2 sm:pb-3">
              3. AI Edited Image
            </h2>
            <div className="flex-grow flex flex-col justify-center">
              {isLoadingAiImage && (
                <div className="flex flex-col justify-center items-center py-10 text-gray-400">
                  <LoadingSpinner size="lg" />
                  <span className="mt-3">Editing image... This can take a moment.</span>
                </div>
              )}
              {!isLoadingAiImage && <GeneratedImageView imageUrl={generatedAiImage} prompt={generatedPrompt} />}
              {!isLoadingAiImage && !generatedAiImage && generatedPrompt && (
                <p className="text-gray-500 text-center text-sm py-3">Click "Edit Image" in the bar below.</p>
              )}
              {!isLoadingAiImage && !generatedAiImage && !generatedPrompt && (
                <p className="text-gray-500 text-center text-sm py-3">Your AI-edited image will appear here.</p>
              )}
            </div>
          </section>
        </div>

        {/* Row 2: Prompt Editing & Detailed Editor */}
        <div className="flex flex-col md:grid md:grid-cols-2 md:gap-6 lg:gap-8 space-y-6 md:space-y-0">
          {/* Section 2: Generated Prompt */}
          <section aria-labelledby="generated-prompt-heading" className="bg-gray-800/60 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-2xl transition-all hover:shadow-indigo-500/30 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 border-b border-gray-700 pb-2 sm:pb-3">
              <h2 id="generated-prompt-heading" className="text-xl sm:text-2xl font-semibold text-indigo-400">
                2. Edit Prompt
              </h2>
              {generatedPrompt && (
                <Button onClick={copyPromptToClipboard} variant="secondary" size="sm" className="mt-2 sm:mt-0 px-4 py-2 text-xs sm:text-sm">
                  Copy Prompt
                </Button>
              )}
            </div>
            {isLoadingPrompt && !generatedPrompt && (
              <div className="flex justify-center items-center py-10 text-gray-400 flex-grow">
                <LoadingSpinner size="md" />
                <span className="ml-3">Generating prompt...</span>
              </div>
            )}
             {!isLoadingPrompt && (
                <textarea
                    aria-label="Generated text-to-image prompt"
                    value={generatedPrompt}
                    onChange={handleGeneratedPromptTextareaChange}
                    className="w-full h-36 sm:h-40 p-3 bg-gray-700/70 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-gray-500"
                    placeholder={
                    isLoadingPrompt ? "Generating..." : 
                    userImage ? "Ready to generate prompt. Click 'Generate Prompt' below." : 
                    "Upload an image first, then click 'Generate Prompt'."
                    }
                    disabled={isLoadingPrompt || isLoadingAiImage}
                />
            )}
            {!isLoadingPrompt && !generatedPrompt && userImage && (
              <p className="text-gray-500 text-center text-sm py-3">Click "Generate Prompt" in the bar below.</p>
            )}
            {!isLoadingPrompt && !generatedPrompt && !userImage && (
              <p className="text-gray-500 text-center text-sm py-3">Upload an image to start.</p>
            )}
          </section>

          {/* Section 2b: Detailed Prompt Editor */}
          <section aria-labelledby="detailed-prompt-editor-heading" className="bg-gray-800/60 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-2xl transition-all hover:shadow-indigo-500/30 flex flex-col">
            <h3 id="detailed-prompt-editor-heading" className="text-lg sm:text-xl font-semibold text-indigo-300 mb-3 sm:mb-4 border-b border-gray-700 pb-2 sm:pb-3">
              Detailed Prompt Editor
            </h3>
            <div className="flex-grow flex flex-col justify-center">
              {isLoadingPrompt && (
                <div className="flex justify-center items-center py-5 text-gray-400">
                  <LoadingSpinner size="md" />
                  <span className="ml-3">Loading prompt details...</span>
                </div>
              )}

              {!isLoadingPrompt && generatedPrompt.trim() !== '' && structuredPrompt && (
                <JsonPromptEditor
                  structuredPrompt={structuredPrompt}
                  onStructuredPromptChange={handleStructuredPromptPartChange}
                  disabled={isLoadingAiImage}
                />
              )}
              
              {!isLoadingPrompt && generatedPrompt.trim() !== '' && !structuredPrompt && (
                <p className="text-gray-400 text-sm py-3 text-center">
                  The current prompt format may not be fully compatible with detailed editing. Please edit the main prompt text above.
                </p>
              )}

              {!isLoadingPrompt && generatedPrompt.trim() === '' && (
                <p className="text-gray-400 text-sm py-3 text-center">
                  Generate or enter a prompt to enable detailed editing.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="sticky-footer bg-gray-900/80 backdrop-blur-md p-3 sm:p-4 border-t border-gray-700/50 shadow-top-lg">
        <div className="container mx-auto max-w-3xl flex flex-col items-center">
          <div className="w-full flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Button
              onClick={handleGeneratePrompt}
              disabled={!userImage || isLoadingPrompt || !!isLoadingAiImage || !apiKey}
              className="flex-1 py-2.5 sm:py-3"
              aria-label="Generate text-to-image prompt from uploaded image"
            >
              {isLoadingPrompt ? <LoadingSpinner size="sm" /> : 'Generate Prompt'}
            </Button>
            <Button
              onClick={handleEditImage}
              disabled={!generatedPrompt.trim() || !userImage || isLoadingAiImage || !!isLoadingPrompt || !apiKey}
              className="flex-1 py-2.5 sm:py-3"
              variant="primary"
              aria-label="Edit original image using the current prompt"
            >
              {isLoadingAiImage ? <LoadingSpinner size="sm" /> : 'Edit Image'}
            </Button>
          </div>
        </div>
         <p className="text-center text-xs text-gray-500 mt-3">&copy; {new Date().getFullYear()} AI Image Prompt Engineer. Powered by Gemini.</p>
      </footer>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .shadow-top-lg {
            box-shadow: 0 -10px 15px -3px rgba(0,0,0,0.1), 0 -4px 6px -2px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
};

export default App;
