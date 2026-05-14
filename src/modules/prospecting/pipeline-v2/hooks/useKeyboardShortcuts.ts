import { useEffect } from 'react';

/**
 * Hook para atalhos de teclado no pipeline.
 * Ignora quando foco está em inputs.
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, () => void>,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      const action = shortcuts[e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcuts, enabled]);
}
