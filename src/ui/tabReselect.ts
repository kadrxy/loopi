// Tapping the tab you are already on scrolls that screen back to the top (iOS convention).
import { useEffect, useRef } from 'react';

type Listener = (tab: string) => void;
const listeners = new Set<Listener>();

/** Called by the tab bar when the focused tab is pressed again. */
export function emitTabReselect(tab: string) {
  listeners.forEach((l) => l(tab));
}

/** Run `onReselect` when the user taps this screen's tab while already on it. */
export function useTabReselect(tab: string, onReselect: () => void) {
  const cb = useRef(onReselect);
  useEffect(() => {
    cb.current = onReselect;
  });
  useEffect(() => {
    const l: Listener = (t) => {
      if (t === tab) cb.current();
    };
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [tab]);
}
