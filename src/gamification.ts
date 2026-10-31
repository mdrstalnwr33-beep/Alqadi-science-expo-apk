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
  challengeDate?: string;
  challengeProgress: number;
  challengeCompleted: boolean;
  challengeRewarded: boolean;
  consecutiveCorrect: number;
};

type MistakeStats = { attempts: number; wrong: number; correct: number; lastWrongAt?: number };
type ReviewStats = MistakeStats & { dueAt: number; intervalDays: number };
const key = (student: string) => `science-gamification:${student}`;
const mistakesKey = (student: string) => `science-mistakes:${student}`;
const reviewKey = (student: string) => `science-review:${student}`;
const tournamentKey = (student: string) => `science-weekly-tournament:${student}`;
const empty: GamificationState = { xp: 0, level: 1, streak: 0, answered: 0, correct: 0, completedExams: 0, badges: [], challengeProgress: 0, challengeCompleted: false, challengeRewarded: false, consecutiveCorrect: 0 };
export const levelFromXp = (xp: number) => Math.floor(xp / 250) + 1;
export const xpForNextLevel = (level: number) => level * 250;

export const dailyChallenges = [
  { id: 'lab', icon: '🧪', title: 'تحدي المختبر', text: 'أجب عن 5 أسئلة علوم اليوم', target: 5, reward: 50 },
  { id: 'speed', icon: '⚡', title: 'تحدي السرعة', text: 'حقق 3 إجابات صحيحة متتالية', target: 3, reward: 40 },
  { id: 'discoverer', icon: '🔬', title: 'مكتشف العلوم', text: 'أكمل اختبارًا واحدًا اليوم', target: 1, reward: 60 },
];

export function getDailyChallenge(date = new Date()) {
  const day = Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86400000);
  return dailyChallenges[((day % dailyChallenges.length) + dailyChallenges.length) % dailyChallenges.length];
}

export async function getGamification(student: string) {
  const state = await readJson<GamificationState>(key(student), empty);
  return { ...empty, ...state, level: levelFromXp(state.xp) };
}

async function updateChallenge(student: string, answeredToday: number, correctToday: number, completedExam: boolean) {
  const old = await getGamification(student);
  const today = new Date().toISOString().slice(0, 10);
  const challenge = getDailyChallenge();
  const sameDay = old.challengeDate === today;
  let progress = sameDay ? old.challengeProgress : 0;
  let completed = sameDay ? old.challengeCompleted : false;
  let rewarded = sameDay ? old.challengeRewarded : false;
  if (!completed) {
    if (challenge.id === 'lab') progress = Math.min(challenge.target, progress + answeredToday);
    if (challenge.id === 'speed') progress = Math.max(progress, Math.min(challenge.target, correctToday));
    if (challenge.id === 'discoverer') progress = Math.min(challenge.target, progress + (completedExam ? 1 : 0));
    completed = progress >= challenge.target;
  }
  let xp = old.xp;
  const badges = [...old.badges];
  if (completed && !rewarded) { xp += challenge.reward; rewarded = true; if (!badges.includes('بطل تحدي اليوم')) badges.push('بطل تحدي اليوم'); }
  const next = { ...old, xp, level: levelFromXp(xp), challengeDate: today, challengeProgress: progress, challengeCompleted: completed, challengeRewarded: rewarded, badges };
  await writeJson(key(student), next);
  return next;
}

export async function recordExamResult(student: string, score: number, maxScore: number) {
  const old = await getGamification(student);
  const correct = Math.max(0, Math.round(score)); const answered = Math.max(0, Math.round(maxScore));
  const bonus = score === maxScore && maxScore > 0 ? 50 : 0; const xp = old.xp + correct * 10 + bonus;
  const today = new Date().toISOString().slice(0, 10); const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = old.lastStudyDate === today ? old.streak : old.lastStudyDate === yesterday ? old.streak + 1 : 1;
  const badges = [...old.badges]; const add = (b: string) => { if (!badges.includes(b)) badges.push(b); };
  if (correct >= 1) add('أول إجابة صحيحة'); if (xp >= 250) add('عالم ناشئ'); if (streak >= 3) add('سلسلة 3 أيام'); if (score === maxScore && maxScore > 0) add('درجة كاملة');
  const next: GamificationState = { ...old, xp, level: levelFromXp(xp), streak, lastStudyDate: today, answered: old.answered + answered, correct: old.correct + correct, completedExams: old.completedExams + 1, badges };
  await writeJson(key(student), next); return updateChallenge(student, answered, correct, true);
}

export async function recordQuestionAnswers(student: string, answers: { id: string; correct: boolean }[]) {
  const stats = await readJson<Record<string, MistakeStats>>(mistakesKey(student), {}); const reviews = await readJson<Record<string, ReviewStats>>(reviewKey(student), {}); const now = Date.now();
  for (const item of answers) {
    const old = stats[item.id] || { attempts: 0, wrong: 0, correct: 0 }; stats[item.id] = { attempts: old.attempts + 1, wrong: old.wrong + (item.correct ? 0 : 1), correct: old.correct + (item.correct ? 1 : 0), lastWrongAt: item.correct ? old.lastWrongAt : now };
    const previous = reviews[item.id] || { attempts: 0, wrong: 0, correct: 0, dueAt: now, intervalDays: 0 }; const intervalDays = item.correct ? (previous.intervalDays <= 0 ? 3 : Math.min(30, previous.intervalDays * 2)) : 1;
    reviews[item.id] = { attempts: previous.attempts + 1, wrong: previous.wrong + (item.correct ? 0 : 1), correct: previous.correct + (item.correct ? 1 : 0), lastWrongAt: item.correct ? previous.lastWrongAt : now, intervalDays, dueAt: now + intervalDays * 86400000 };
  }
  await writeJson(mistakesKey(student), stats); await writeJson(reviewKey(student), reviews); return stats;
}

export async function getAdaptiveQuestionIds(student: string, ids: string[], count: number) {
  const stats = await readJson<Record<string, MistakeStats>>(mistakesKey(student), {});
  return [...ids].sort((a, b) => { const sa = stats[a] || { attempts: 0, wrong: 0 }; const sb = stats[b] || { attempts: 0, wrong: 0 }; const priorityA = sa.attempts ? sa.wrong / sa.attempts : 1.2; const priorityB = sb.attempts ? sb.wrong / sb.attempts : 1.2; return priorityB - priorityA || (sa.attempts - sb.attempts); }).slice(0, count);
}

export async function getReviewQuestionIds(student: string, ids: string[], count: number) {
  const reviews = await readJson<Record<string, ReviewStats>>(reviewKey(student), {}); const now = Date.now();
  return [...ids].sort((a, b) => { const sa = reviews[a]; const sb = reviews[b]; const dueA = sa?.dueAt ?? 0; const dueB = sb?.dueAt ?? 0; const overdueA = dueA <= now ? 1 : 0; const overdueB = dueB <= now ? 1 : 0; if (overdueA !== overdueB) return overdueB - overdueA; if (overdueA) return dueA - dueB; return dueA - dueB; }).slice(0, count);
}

export async function getReviewSummary(student: string, ids: string[]) { const reviews = await readJson<Record<string, ReviewStats>>(reviewKey(student), {}); const now = Date.now(); return { due: ids.filter(id => (reviews[id]?.dueAt ?? 0) <= now).length, scheduled: ids.filter(id => reviews[id]).length, total: ids.length }; }

export async function touchStudyDay(student: string) {
  const old = await getGamification(student); const today = new Date().toISOString().slice(0, 10); if (old.lastStudyDate === today) return old;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10); const next = { ...old, streak: old.lastStudyDate === yesterday ? old.streak + 1 : 1, lastStudyDate: today, challengeDate: today, challengeProgress: 0, challengeCompleted: false, challengeRewarded: false, consecutiveCorrect: 0 }; await writeJson(key(student), next); return next;
}

export async function recordMatchResult(student: string, won: boolean, correct: number, total: number) {
  const old = await getGamification(student); const today = new Date().toISOString().slice(0, 10); const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = old.lastStudyDate === today ? old.streak : old.lastStudyDate === yesterday ? old.streak + 1 : 1; const reward = won ? 80 : correct >= Math.ceil(total * 0.7) ? 35 : 15; const badges = [...old.badges]; const add = (b: string) => { if (!badges.includes(b)) badges.push(b); };
  if (won) add('بطل المباراة العلمية'); if (correct === total && total > 0) add('إجابات مثالية'); const xp = old.xp + reward; const next: GamificationState = { ...old, xp, level: levelFromXp(xp), streak, lastStudyDate: today, answered: old.answered + total, correct: old.correct + correct, badges }; await writeJson(key(student), next); return { state: next, reward };
}

function isoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${String(Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)).padStart(2, '0')}`;
}

function makeRivals(week: string) {
  let seed = 0; for (const c of week) seed = (seed * 31 + c.charCodeAt(0)) % 997;
  const names = ['نيوتن الصغير', 'مندليف الصغير', 'العالِم الذكي', 'المستكشف العلمي', 'عبقري الفيزياء'];
  return names.map((name, i) => ({ name, points: 55 + ((seed + i * 47) % 96) }));
}

export async function getWeeklyTournament(student: string) {
  const week = isoWeekKey(); const old = await readJson<any>(tournamentKey(student), {});
  const base = old.week === week ? old : { week, points: 0, roundsCompleted: 0, maxRounds: 5, wins: 0, claimed: false };
  const rivals = makeRivals(week); const leaderboard: {name:string;points:number;isMe?:boolean}[] = [...rivals, { name: student || 'أنت', points: base.points, isMe: true }].sort((a, b) => b.points - a.points).slice(0, 10);
  const rank = leaderboard.findIndex(x => x.isMe) + 1;
  return { ...base, rank, leaderboard };
}

export async function recordWeeklyRound(student: string, correct: number, total: number) {
  const current = await getWeeklyTournament(student); if (current.roundsCompleted >= current.maxRounds) return { state: current, points: 0 };
  const points = Math.max(5, Math.round((correct / Math.max(1, total)) * 100)); const nextData = { week: current.week, points: current.points + points, roundsCompleted: current.roundsCompleted + 1, maxRounds: current.maxRounds, wins: current.wins + (correct >= Math.ceil(total * 0.8) ? 1 : 0), claimed: false };
  await writeJson(tournamentKey(student), nextData); const state = await getWeeklyTournament(student); return { state, points };
}
