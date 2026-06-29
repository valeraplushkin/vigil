import { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type SessionResult =
  | { session: Session; user: User }
  | { session: null; user: null };

export async function ensureSession(): Promise<SessionResult> {
  const { data: existing, error: getError } = await supabase.auth.getSession();

  if (getError) {
    console.error('[auth] getSession error:', getError.message);
    return { session: null, user: null };
  }

  if (existing.session) {
    return { session: existing.session, user: existing.session.user };
  }

  const { data: anon, error: signInError } = await supabase.auth.signInAnonymously();

  if (signInError) {
    console.error('[auth] signInAnonymously error:', signInError.message);
    return { session: null, user: null };
  }

  if (!anon.session) {
    console.error('[auth] signInAnonymously returned no session');
    return { session: null, user: null };
  }

  return { session: anon.session, user: anon.session.user };
}
