import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchAnswers, insertAnswer } from '@/lib/questions';
import {
  ACTIVE_QUESTIONS,
  Answer,
  AnswerEntryPoint,
  AnswerState,
  DEFAULT_PROFILE,
  DEFAULT_SETTINGS,
  Goal,
  Mode,
  PASSIVE_QUESTIONS,
  Profile,
  Settings,
} from '@/types';

const KEYS = {
  onboarding: 'vigil:onboarding_done',
  mode: 'vigil:mode',
  settings: 'vigil:settings',
  goals: 'vigil:goals',
  answers: 'vigil:answers',
  profile: 'vigil:profile',
  seenMilestones: 'vigil:seen_milestones',
  notes: 'vigil:notes',
};

export const MILESTONES = [3, 7, 14, 30, 60, 100] as const;

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

async function getUserId(): Promise<string | undefined> {
  return (await supabase.auth.getSession()).data.session?.user.id;
}

// Map a Supabase `goal` row (schema v2) into the app's Goal shape.
// `text` is derived from `essence` for back-compat rendering.
function mapRow(row: any): Goal {
  return {
    id: row.id,
    essence: row.essence ?? '',
    description: row.description ?? '',
    result: undefined,
    text: row.essence ?? '',
    date: row.day,
    status: row.status,
  };
}

function computeStreak(answers: Answer[]): { current: number; longest: number } {
  const days = new Set(answers.map(a => a.date));
  if (days.size === 0) return { current: 0, longest: 0 };

  const today = todayStr();
  const yesterday = yesterdayStr();

  let current = 0;
  if (days.has(today) || days.has(yesterday)) {
    const d = new Date(days.has(today) ? today + 'T12:00:00' : yesterday + 'T12:00:00');
    while (days.has(d.toISOString().split('T')[0])) {
      current++;
      d.setDate(d.getDate() - 1);
    }
  }

  const sorted = [...days].sort();
  let longest = 0;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T12:00:00').getTime();
    const curr = new Date(sorted[i] + 'T12:00:00').getTime();
    const diff = Math.round((curr - prev) / 86_400_000);
    if (diff === 1) { run++; } else { longest = Math.max(longest, run); run = 1; }
  }
  longest = Math.max(longest, run, current);
  return { current, longest };
}

interface AppContextType {
  isReady: boolean;
  onboardingDone: boolean;
  settings: Settings;
  currentGoal: Goal | null;
  goals: Goal[];
  answers: Answer[];
  profile: Profile;
  mode: Mode;
  streak: { current: number; longest: number };
  pendingMilestone: number | null;
  completeOnboarding: (chosenMode: Mode) => Promise<void>;
  updateSettings: (s: Partial<Settings>) => Promise<void>;
  saveGoal: (essence: string, description: string) => Promise<void>;
  clearGoal: () => Promise<void>;
  markGoalDone: (id: string) => Promise<void>;
  saveAnswer: (params: {
    questionId: string;
    state: AnswerState | null;
    freeText?: string;
    entryPoint: AnswerEntryPoint;
    goalId?: string; 
  }) => Promise<void>;
  updateProfile: (p: Partial<Profile>) => Promise<void>;
  notes: Record<string, string>;
  getTodayAnswers: () => Answer[];
  getAnswersByDate: (date: string) => Answer[];
  getRandomQuestion: () => string;
  saveNote: (date: string, text: string) => Promise<void>;
  deleteAllData: () => Promise<void>;
  markMilestoneSeen: (days: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [seenMilestones, setSeenMilestones] = useState<number[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const [od, _m, s, p, sm, n] = await Promise.all([
          AsyncStorage.getItem(KEYS.onboarding),
          AsyncStorage.getItem(KEYS.mode),
          AsyncStorage.getItem(KEYS.settings),
          AsyncStorage.getItem(KEYS.profile),
          AsyncStorage.getItem(KEYS.seenMilestones),
          AsyncStorage.getItem(KEYS.notes),
        ]);
        if (od) setOnboardingDone(JSON.parse(od));
        if (s) setSettingsState({ ...DEFAULT_SETTINGS, ...JSON.parse(s) });
        if (p) setProfileState({ ...DEFAULT_PROFILE, ...JSON.parse(p) });
        if (sm) setSeenMilestones(JSON.parse(sm));
        if (n) setNotes(JSON.parse(n));
      } catch (_) {}

      // Goals + answers: source of truth is Supabase (not AsyncStorage).
      try {
        const uid = await getUserId();
        if (uid) {
          const [goalRes, answerList] = await Promise.all([
            supabase.from('goal').select('*')
              .eq('user_id', uid)
              .order('started_at', { ascending: false }),
            fetchAnswers(uid),
          ]);
          if (goalRes.error) { console.log('goal load error', goalRes.error); setGoals([]); }
          else setGoals((goalRes.data ?? []).map(mapRow));
          setAnswers(answerList);
        } else {
          setGoals([]); setAnswers([]);
        }
      } catch (e) { console.log('supabase load exception', e); setGoals([]); setAnswers([]); }

      setIsReady(true);
    })();
  }, []);

  const updateSettings = useCallback(async (s: Partial<Settings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...s };
      AsyncStorage.setItem(KEYS.settings, JSON.stringify(next));
      return next;
    });
  }, []);

  const completeOnboarding = useCallback(async (chosenMode: Mode) => {
    const newSettings = {
      ...DEFAULT_SETTINGS,
      modePassive: true,
      modeActive: chosenMode === 'active',
    };
    setOnboardingDone(true);
    setSettingsState(newSettings);
    await AsyncStorage.multiSet([
      [KEYS.onboarding, JSON.stringify(true)],
      [KEYS.settings, JSON.stringify(newSettings)],
    ]);
  }, []);

  const saveGoal = useCallback(async (essence: string, description: string) => {
    try {
      const uid = await getUserId();
      if (!uid) return;
      const now = new Date().toISOString();
      // Закрыть текущую активную цель, чтобы не нарушить guard (одна active).
      await supabase.from('goal')
        .update({ status: 'dropped', closed_at: now })
        .eq('user_id', uid).eq('status', 'active');
      // Вставить новую активную цель.
      const { data, error } = await supabase.from('goal')
        .insert({
          user_id: uid,
          essence: essence.trim(),
          description: description.trim(),
          status: 'active',
          day: todayStr(),
        })
        .select().single();
      if (error) { console.log('goal insert error', error); return; }
      const newGoal = mapRow(data);
      setGoals(prev => [
        newGoal,
        ...prev.map(g => (g.status === 'active' ? { ...g, status: 'dropped' as const } : g)),
      ]);
    } catch (e) { console.log('saveGoal exception', e); }
    await updateSettings({ modeActive: true });
  }, [updateSettings]);

  const clearGoal = useCallback(async () => {
    try {
      const uid = await getUserId();
      if (!uid) return;
      await supabase.from('goal')
        .update({ status: 'dropped', closed_at: new Date().toISOString() })
        .eq('user_id', uid).eq('status', 'active');
      setGoals(prev => prev.map(g =>
        g.status === 'active' ? { ...g, status: 'dropped' as const } : g,
      ));
    } catch (e) { console.log('clearGoal exception', e); }
    await updateSettings({ modeActive: false });
  }, [updateSettings]);

  const markGoalDone = useCallback(async (id: string) => {
    try {
      const uid = await getUserId();
      if (!uid) return;
      await supabase.from('goal')
        .update({ status: 'done', closed_at: new Date().toISOString() })
        .eq('id', id).eq('user_id', uid);
      setGoals(prev => prev.map(g => (g.id === id ? { ...g, status: 'done' as const } : g)));
    } catch (e) { console.log('markGoalDone exception', e); }
  }, []);

  const saveAnswer = useCallback(async (params: {
    questionId: string;
    state: AnswerState | null;
    freeText?: string;
    entryPoint: AnswerEntryPoint;
    goalId?: string;  
  }) => {
    try {
      const uid = await getUserId();
      if (!uid) return;
      const ok = await insertAnswer({ ...params, userId: uid });
      if (!ok) return;
      // Close the loop: trigger the generator so the next question is produced
      // from this answer. Fire-and-forget — the answer is already saved, and a
      // generation failure must not block the UI.
      supabase.functions
        .invoke('smooth-endpoint', { body: { question_id: params.questionId, user_id: uid } })
        .catch(e => console.log('[generator] invoke failed', e));
      // Re-read from Supabase so the view-model (joined with question) is correct.
      const list = await fetchAnswers(uid);
      setAnswers(list);
    } catch (e) { console.log('saveAnswer exception', e); }
  }, []);

  const updateProfile = useCallback(async (p: Partial<Profile>) => {
    setProfileState(prev => {
      const next = { ...prev, ...p };
      AsyncStorage.setItem(KEYS.profile, JSON.stringify(next));
      return next;
    });
  }, []);

  const getTodayAnswers = useCallback(() => {
    return answers.filter(a => a.date === todayStr());
  }, [answers]);

  const getAnswersByDate = useCallback((date: string) => {
    return answers.filter(a => a.date === date);
  }, [answers]);

  const getRandomQuestion = useCallback(() => {
    const today = todayStr();
    const hasGoal = goals.some(g => g.status === 'active');
    const useActive = settings.modeActive && hasGoal;
    const pool = useActive ? ACTIVE_QUESTIONS : PASSIVE_QUESTIONS;
    const todayAnswers = answers.filter(a => a.date === today);
    const usedTexts = new Set(todayAnswers.map(a => a.questionText));
    const unused = pool.filter(q => !usedTexts.has(q));
    const source = unused.length > 0 ? unused : pool;
    return source[Math.floor(Math.random() * source.length)];
  }, [settings.modeActive, goals, answers]);

  const saveNote = useCallback(async (date: string, text: string) => {
    setNotes(prev => {
      const next = { ...prev, [date]: text };
      AsyncStorage.setItem(KEYS.notes, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteAllData = useCallback(async () => {
    await AsyncStorage.multiRemove(Object.values(KEYS));
    setOnboardingDone(false);
    setSettingsState(DEFAULT_SETTINGS);
    setGoals([]);
    setAnswers([]);
    setProfileState(DEFAULT_PROFILE);
    setSeenMilestones([]);
    setNotes({});
  }, []);

  const markMilestoneSeen = useCallback(async (days: number) => {
    setSeenMilestones(prev => {
      if (prev.includes(days)) return prev;
      const next = [...prev, days];
      AsyncStorage.setItem(KEYS.seenMilestones, JSON.stringify(next));
      return next;
    });
  }, []);

  const currentGoal = goals.find(g => g.status === 'active') ?? null;
  const mode: Mode = settings.modeActive && currentGoal !== null ? 'active' : 'passive';

  const streak = useMemo(() => computeStreak(answers), [answers]);

  const pendingMilestone = useMemo(() => {
    const reached = (MILESTONES as readonly number[]).filter(
      m => streak.current >= m && !seenMilestones.includes(m),
    );
    return reached.length > 0 ? reached[reached.length - 1] : null;
  }, [streak.current, seenMilestones]);

  return (
    <AppContext.Provider value={{
      isReady, onboardingDone, settings, currentGoal, goals, answers, profile, mode,
      streak, pendingMilestone, notes,
      completeOnboarding, updateSettings, saveGoal, clearGoal, markGoalDone,
      saveAnswer, updateProfile, getTodayAnswers, getAnswersByDate, getRandomQuestion,
      saveNote, deleteAllData, markMilestoneSeen,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
