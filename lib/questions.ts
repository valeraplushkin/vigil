import { supabase } from '@/lib/supabase';
import { Answer, AnswerEntryPoint, AnswerState, Question } from '@/types';

// ─── questions (server/AI-generated; client reads only) ──────────────────────

type QuestionRow = {
  id: string;
  text: string;
  type: 'active' | 'passive';
  goal_id: string | null;
  status: 'ready' | 'sent' | 'answered' | 'skipped' | 'expired';
};

function mapQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    text: row.text,
    type: row.type,
    goalId: row.goal_id ?? undefined,
    status: row.status,
  };
}

// Load the exact question referenced by a push notification (`?id=`).
export async function fetchQuestionById(id: string): Promise<Question | null> {
  const { data, error } = await supabase
    .from('question')
    .select('id, text, type, goal_id, status')
    .eq('id', id)
    .maybeSingle();
  if (error) { console.log('[question] fetchById error', error); return null; }
  return data ? mapQuestion(data as QuestionRow) : null;
}

// Latest unanswered question for in-app entry (no notification id). The server
// flips a question to 'answered' after an answer is written, so ready/sent are
// the still-open ones.
export async function fetchLatestReadyQuestion(userId: string): Promise<Question | null> {
  const { data, error } = await supabase
    .from('question')
    .select('id, text, type, goal_id, status')
    .eq('user_id', userId)
    .in('status', ['ready', 'sent'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) { console.log('[question] fetchLatestReady error', error); return null; }
  return data ? mapQuestion(data as QuestionRow) : null;
}

// ─── answers (client writes + reads its own) ─────────────────────────────────

type AnswerRow = {
  id: string;
  state: AnswerState | null;
  free_text: string | null;
  entry_point: AnswerEntryPoint;
  created_at: string;
  question: { text: string; type: 'active' | 'passive'; goal_id: string | null } | null;
};

function mapAnswer(row: AnswerRow): Answer {
  return {
    id: row.id,
    questionText: row.question?.text ?? '',
    date: row.created_at.slice(0, 10),
    timestamp: new Date(row.created_at).getTime(),
    state: row.state,
    text: row.free_text ?? undefined,
    mode: row.question?.type ?? 'passive',
    goalId: row.question?.goal_id ?? undefined,
  };
}

// All of the user's answers, joined with their question for display fields.
export async function fetchAnswers(userId: string): Promise<Answer[]> {
  const { data, error } = await supabase
    .from('answer')
    .select('id, state, free_text, entry_point, created_at, question:question_id(text, type, goal_id)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) { console.log('[answer] fetch error', error); return []; }
  return ((data ?? []) as unknown as AnswerRow[]).map(mapAnswer);
}

export async function insertAnswer(params: {
  questionId: string;
  userId: string;
  state: AnswerState | null;
  freeText?: string;
  entryPoint: AnswerEntryPoint;
  goalId?: string;  
}): Promise<boolean> {
  const { error } = await supabase.from('answer').insert({
    question_id: params.questionId,
    user_id: params.userId,
    state: params.state,
    free_text: params.freeText?.trim() || null,
    entry_point: params.entryPoint,
    goal_id: params.goalId ?? null, 
  });
  if (error) { console.log('[answer] insert error', error); return false; }
  return true;
}
