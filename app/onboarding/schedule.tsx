import { Redirect } from 'expo-router';
import React from 'react';

// Moved to Settings. Redirect for backwards compat.
export default function ScheduleRedirect() {
  return <Redirect href="/onboarding/permissions" />;
}
