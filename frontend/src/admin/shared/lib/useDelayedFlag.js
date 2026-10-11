import { useEffect, useState } from 'react';

/**
 * Delays a boolean flag turning `true` by `delayMs` (default 250ms), and
 * turns it back off immediately when `flag` goes false. Used so loading
 * indicators only appear once a fetch has been pending a noticeable while,
 * instead of flashing on every fast cache-hit navigation (T14).
 */
export function useDelayedFlag(flag, delayMs = 250) {
  const [delayed, setDelayed] = useState(false);

  useEffect(() => {
    if (!flag) {
      setDelayed(false);
      return undefined;
    }
    const timer = setTimeout(() => setDelayed(true), delayMs);
    return () => clearTimeout(timer);
  }, [flag, delayMs]);

  return delayed;
}
