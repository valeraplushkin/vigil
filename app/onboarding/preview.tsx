import { Redirect } from 'expo-router';
import React from 'react';

// Merged into modes.tsx (S2). Redirect for backwards compat.
export default function PreviewRedirect() {
  return <Redirect href="/onboarding/modes" />;
}
