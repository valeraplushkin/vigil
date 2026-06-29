import { useEffect, useState } from 'react';

// Animates a number from 0 up to `target` with an ease-out-cubic curve.
// Re-runs whenever `target` changes, so it also animates value-to-value
// updates (e.g. when a new answer bumps the focus count). Extracted from
// the profile stats count-up so home / report can share the same feel.
export function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }
    const start = Date.now();
    let raf: ReturnType<typeof requestAnimationFrame>;
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
