import { readJson, writeJson } from './storage';

export type GamificationState = {
  xp: number;
  level: number;
  streak: number;
  lastStudyDate?: string;
  answered: number;
  correct: number;
  completedExams: number;
  badges: string[];
};

const key = (student: string) => `science-gamification:${student}`;
const empty: GamificationState = { xp: 0, level: 1, streak: 0, answered: 0, correct: 0, completedExams: 0, badges: [] };
export const levelFromXp = (xp: number) => Math.floor(xp / 250) + 1;
export const xpForNextLevel = (level: number) => level * 250;

export async function getGamification(student: string) {
  const state = await readJson<GamificationState>(key(student), empty);
  return { ...empty, ...state, level: levelFromXp(state.xp) };
}

export async function recordExamResult(student: string, score: number, maxScore: number) {
  const old = await getGamification(student);
  const correct = Math.max(0, Math.round(score));
  const answered = Math.max(0, Math.round(maxScore));
  const bonus = score === maxScore && maxScore > 0 ? 50 : 0;
  const xp = old.xp + correct * 10 + bonus;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = old.lastStudyDate === today ? old.streak : old.lastStudyDate === yesterday ? old.streak + 1 : 1;
  const badges = [...old.badges];
  const add = (b: string) => { if (!badges.includes(b)) badges.push(b); };
  if (correct >= 1) add('أول إجابة صحيحة');
  if (xp >= 250) add('عالم ناشئ');
  if (streak >= 3) add('سلسلة 3 أيام');
  if (score === maxScore && maxScore > 0) add('درجة كاملة');
  const next: GamificationState = { xp, level: levelFromXp(xp), streak, lastStudyDate: today, answered: old.answered + answered, correct: old.correct + correct, completedExams: old.completedExams + 1, badges };
  await writeJson(key(student), next);
  return next;
}

export async function touchStudyDay(student: string) {
  const old = await getGamification(student);
  const today = new Date().toISOString().slice(0, 10);
  if (old.lastStudyDate === today) return old;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const next = { ...old, streak: old.lastStudyDate === yesterday ? old.streak + 1 : 1, lastStudyDate: today };
  await writeJson(key(student), next);
  return next;
}

export const dailyChallenges = [
  { icon: '🧪', title: 'تحدي المختبر', text: 'أجب عن 5 أسئلة علوم اليوم', reward: 50 },
  { icon: '⚡', title: 'تحدي السرعة', text: 'أجب بسرعة وحافظ على 3 إجابات متتالية', reward: 40 },
  { icon: '🔬', title: 'مكتشف العلوم', text: 'راجع درسًا واحدًا ثم اختبر نفسك', reward: 60 },
];
