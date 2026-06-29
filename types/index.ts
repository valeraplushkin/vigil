export type Mode = 'active' | 'passive';
export type AnswerState = 'focus' | 'drift' | 'pause';
export type Frequency = 'low' | 'medium' | 'high';

export interface Goal {
  id: string;
  // `essence` and `description` are the source of truth (Supabase schema v2).
  // `text` is a derived display string (= essence), kept for back-compat
  // rendering across index/question/history/report/summary screens.
  essence: string;        // суть — основное поле
  description: string;    // подробное описание — основное поле
  result?: string;        // legacy, в Supabase не хранится
  text: string;
  date: string;           // = day из Supabase
  status: 'active' | 'done' | 'dropped';
}

// How the answer was entered (Supabase answer.entry_point).
export type AnswerEntryPoint = 'chip' | 'text' | 'in_app' | 'notification';

// A server/AI-generated question (Supabase `question` table). The client only
// reads these — it cannot insert (RLS is SELECT-only for the client).
export interface Question {
  id: string;
  text: string;
  type: Mode;                 // 'active' | 'passive'
  goalId?: string;
  status: 'ready' | 'sent' | 'answered' | 'skipped' | 'expired';
}

export interface Answer {
  id: string;
  questionText: string;
  date: string;
  timestamp: number;
  // null when the user answered with free text only (no chip selected).
  state: AnswerState | null;
  text?: string;              // free_text
  mode: Mode;
  goalId?: string;
}

export interface Settings {
  frequency: Frequency;
  windowStart: number;
  windowEnd: number;
  notificationsEnabled: boolean;
  modePassive: boolean;
  modeActive: boolean;
}

export interface Profile {
  tone: 'gentle' | 'direct' | 'curious';
  aiContext: string;
  templates: string[];
}

export const PASSIVE_QUESTIONS = [
  'Чем ты занят прямо сейчас — это то, что ты выбрал, или просто оказался здесь?',
  'Как твоё дыхание прямо сейчас — ровное или поверхностное?',
  'Где сейчас твои мысли — в прошлом, настоящем или будущем?',
  'Если остановиться на секунду — что ты сейчас на самом деле чувствуешь?',
  'Что ты замечаешь вокруг себя прямо сейчас?',
  'Есть ли что-то, о чём ты думаешь снова и снова?',
  'Ты торопишься или есть ощущение пространства в этом моменте?',
];

export const ACTIVE_QUESTIONS = [
  'Твои действия сейчас ведут к цели дня или уводят от неё?',
  'Что сделал за последний час в направлении своей цели?',
  'Если бы ты мог сделать одно действие для цели прямо сейчас — что это было бы?',
  'Ты сейчас в фокусе или дрейфуешь?',
  'Насколько твоя цель дня сейчас ясна для тебя?',
  'Что мешает тебе двигаться к цели прямо сейчас?',
  'Ты приближаешься к своей цели сегодня?',
];

export const DEFAULT_SETTINGS: Settings = {
  frequency: 'medium',
  windowStart: 9,
  windowEnd: 19,
  notificationsEnabled: false,
  modePassive: true,
  modeActive: false,
};

export const DEFAULT_PROFILE: Profile = {
  tone: 'gentle',
  aiContext: '',
  templates: [
    'Завершить важный рабочий проект',
    'Провести время осознанно, без телефона',
    'Сделать паузу и побыть с собой',
    'Двигаться навстречу тому, что важно',
  ],
};
