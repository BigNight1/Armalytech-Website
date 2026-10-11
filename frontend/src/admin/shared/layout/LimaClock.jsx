import { useEffect, useState } from 'react';
import { formatLimaDateTime } from '../lib/time.js';

/** Live Peru-time clock (America/Lima), ticking every second. */
export default function LimaClock() {
  const [now, setNow] = useState(() => formatLimaDateTime());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(formatLimaDateTime());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-end leading-tight text-ink">
      <span className="font-mono text-lg font-semibold">{now.time}</span>
      <span className="text-xs capitalize text-muted">{now.date} · Lima</span>
    </div>
  );
}
