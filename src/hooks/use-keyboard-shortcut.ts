'use client';

import { useEffect, useRef } from 'react';

interface KeyModifiers {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
}

/**
 * Hook for registering a keyboard shortcut with optional modifier keys.
 *
 * @param key - The key to listen for (e.g., 'k', 'Escape', 'Enter')
 * @param callback - Function to call when the shortcut is triggered
 * @param modifiers - Optional modifier keys (ctrl, meta, shift)
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  modifiers?: KeyModifiers
) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const ctrl = modifiers?.ctrl ?? false;
      const meta = modifiers?.meta ?? false;
      const shift = modifiers?.shift ?? false;

      if (ctrl && !event.ctrlKey) return;
      if (meta && !event.metaKey) return;
      if (shift && !event.shiftKey) return;

      // If modifier is not required, make sure it's not pressed either
      // (unless multiple modifiers are used)
      if (!ctrl && event.ctrlKey && !meta && !shift) return;
      if (!meta && event.metaKey && !ctrl && !shift) return;

      if (event.key.toLowerCase() === key.toLowerCase()) {
        event.preventDefault();
        callbackRef.current();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, modifiers?.ctrl, modifiers?.meta, modifiers?.shift]);
}

/**
 * Hook for registering sequential key shortcuts (e.g., "G then D").
 * Keys must be pressed within 500ms of each other.
 *
 * @param keys - Array of keys to press in sequence (e.g., ['g', 'd'])
 * @param callback - Function to call when the full sequence is completed
 */
export function useSequentialKeys(keys: string[], callback: () => void) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function resetSequence() {
      indexRef.current = 0;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      // Ignore if user is typing in an input/textarea/contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const expectedKey = keys[indexRef.current];

      if (event.key.toLowerCase() === expectedKey.toLowerCase()) {
        indexRef.current += 1;

        // Clear any existing timer
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        // If the full sequence has been entered
        if (indexRef.current === keys.length) {
          event.preventDefault();
          callbackRef.current();
          resetSequence();
          return;
        }

        // Set a 500ms timeout before resetting
        timerRef.current = setTimeout(resetSequence, 500);
      } else {
        // Wrong key — reset the sequence
        resetSequence();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [keys]);
}
