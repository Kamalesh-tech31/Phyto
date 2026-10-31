import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { ingest } from '../ml/ingest';
import { validateGalleryFile } from '../ml/gallery';
import { AlertCircle, X } from 'lucide-react';

export interface GalleryPickerHandle {
  openPicker: () => void;
}

interface GalleryPickerProps {
  onImageIngested: (bitmap: ImageBitmap, file: File) => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export const GalleryPicker = forwardRef<GalleryPickerHandle, GalleryPickerProps>(
  ({ onImageIngested, onError, className = '', children }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useImperativeHandle(ref, () => ({
      openPicker: () => {
        setErrorMessage(null);
        inputRef.current?.click();
      },
    }));

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset input value so re-selecting the exact same file fires onChange again
      e.target.value = '';

      // If user cancelled system file picker, do nothing silently
      if (!file) {
        return;
      }

      // Validate size and format
      const validation = validateGalleryFile(file);
      if (!validation.valid) {
        const err = validation.error || 'Please choose a valid photo.';
        setErrorMessage(err);
        onError?.(err);
        return;
      }

      setIsProcessing(true);
      setErrorMessage(null);

      try {
        // Single ingest pipeline: File -> oriented, downscaled ImageBitmap
        const bitmap = await ingest(file);
        onImageIngested(bitmap, file);
      } catch (err) {
        const message =
          (err as Error)?.message ||
          'Failed to decode image. Please choose a JPG or PNG photo.';
        setErrorMessage(message);
        onError?.(message);
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <>
        {/* Real hidden file input */}
        <input
          type="file"
          ref={inputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload leaf photo from gallery"
        />

        {/* Optional Custom Trigger Container */}
        {children && (
          <div onClick={() => inputRef.current?.click()} className={className}>
            {children}
          </div>
        )}

        {/* User-friendly Validation Error Banner / Modal */}
        {errorMessage && (
          <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto p-4 rounded-[14px] bg-[var(--color-surface)] border-2 border-[var(--color-outline)] text-[var(--color-ink)] shadow-[3px_3px_0_var(--color-shadow-color)] flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <AlertCircle className="w-5 h-5 text-[var(--color-warning-text)] shrink-0 mt-0.5" />
            <div className="flex-1 text-xs leading-relaxed font-semibold">
              {errorMessage}
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 rounded-lg hover:bg-[var(--color-inset)] text-[var(--color-muted)] retro-focus"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}
      </>
    );
  }
);

GalleryPicker.displayName = 'GalleryPicker';
