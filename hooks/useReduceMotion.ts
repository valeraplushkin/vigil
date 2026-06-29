import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Single source for the system "reduce motion" preference. Gate any infinite /
// ambient animation behind this so the app respects motion sensitivity
// consistently (background drift, breathing marks, pulses).
export function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(r => {
      if (mounted) setReduced(r);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
