import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Web-only: calls `onEscape` when the Escape key is pressed while `enabled` — used to let the
 * currently open modal close itself on Escape. No-op on native, where there's no keyboard.
 */
export function useEscapeKey(onEscape: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onEscape, enabled]);
}
