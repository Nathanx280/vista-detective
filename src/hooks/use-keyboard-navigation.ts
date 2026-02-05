import { useEffect, useCallback } from 'react';

interface UseKeyboardNavigationProps {
  enabled: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  onClose?: () => void;
  onToggleFavorite?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onToggleSlideshow?: () => void;
}

export function useKeyboardNavigation({
  enabled,
  onNext,
  onPrevious,
  onClose,
  onToggleFavorite,
  onDownload,
  onShare,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onToggleSlideshow,
}: UseKeyboardNavigationProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      
      // Don't intercept if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          onClose?.();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          onNext?.();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          onPrevious?.();
          break;
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onToggleFavorite?.();
          }
          break;
        case 'd':
        case 'D':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onDownload?.();
          }
          break;
        case 's':
        case 'S':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onShare?.();
          }
          break;
        case '+':
        case '=':
          e.preventDefault();
          onZoomIn?.();
          break;
        case '-':
          e.preventDefault();
          onZoomOut?.();
          break;
        case '0':
          e.preventDefault();
          onZoomReset?.();
          break;
        case ' ':
          e.preventDefault();
          onToggleSlideshow?.();
          break;
      }
    },
    [enabled, onNext, onPrevious, onClose, onToggleFavorite, onDownload, onShare, onZoomIn, onZoomOut, onZoomReset, onToggleSlideshow]
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);
}
