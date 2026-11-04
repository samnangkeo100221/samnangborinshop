import { useEffect, useRef } from 'react';
import { soundEffects } from '@/lib/audio';

export function useHardwareScanner(onScan: (barcode: string) => void, enabled: boolean = true) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside text inputs, textareas or selects
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (bufferRef.current.trim().length >= 3) {
          const scannedCode = bufferRef.current.trim();
          bufferRef.current = '';
          soundEffects.playBeep();
          onScan(scannedCode);
        } else {
          bufferRef.current = '';
        }
        return;
      }

      // If keys take too long (user typing manually), reset buffer
      if (diff > 120 && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      // Append printable characters
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onScan]);
}
