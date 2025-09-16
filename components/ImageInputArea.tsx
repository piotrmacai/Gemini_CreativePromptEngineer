
import React, { useState, useCallback, ChangeEvent, DragEvent, ClipboardEvent } from 'react';

interface ImageInputAreaProps {
  onImageUploaded: (file: File) => void;
  currentImageUrl?: string | null;
}

export const ImageInputArea: React.FC<ImageInputAreaProps> = ({ onImageUploaded, currentImageUrl }) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      onImageUploaded(files[0]);
    }
  }, [onImageUploaded]);

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      onImageUploaded(files[0]);
    } else {
      alert('Please drop an image file.');
    }
  }, [onImageUploaded]);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handlePaste = useCallback(async (event: ClipboardEvent<HTMLDivElement>) => {
    const items = event.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            onImageUploaded(blob);
            return; 
          }
        }
      }
      alert('No image data found in clipboard. Please paste an image.');
    }
  }, [onImageUploaded]);
  
  return (
    <div 
      className={`w-full p-4 border-2 ${isDragging ? 'border-indigo-500 bg-gray-700/50' : 'border-dashed border-gray-600 hover:border-gray-500'} rounded-lg transition-all duration-200 ease-in-out text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onPaste={handlePaste}
      tabIndex={0} 
      role="button"
      aria-label="Image input area: Click to upload, drag & drop, or paste an image"
    >
      <input
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleFileChange}
        className="hidden"
        id="imageUpload"
        aria-hidden="true"
      />
      <label htmlFor="imageUpload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center py-4 sm:py-6">
        {currentImageUrl ? (
          <img src={currentImageUrl} alt="Uploaded preview" className="max-h-60 sm:max-h-72 w-auto object-contain rounded-md shadow-md" />
        ) : (
          <div className="text-gray-400 space-y-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="font-medium text-sm sm:text-base">Click to upload, drag & drop, or paste</p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP, HEIC</p>
          </div>
        )}
      </label>
      {currentImageUrl && (
         <p className="text-xs text-gray-500 mt-2">Pasted/Uploaded image. Select or paste another to change.</p>
      )}
    </div>
  );
};
