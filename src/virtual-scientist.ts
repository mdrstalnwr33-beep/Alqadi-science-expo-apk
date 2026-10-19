import { readJson, writeJson } from './storage';
import { getGamification, levelFromXp, type GamificationState } from './gamification';

export type ScientistStage = {
  key: string;
  title: string;
  icon: string;
  lab: string;
  message: string;
  minLevel: number;
};

export type VirtualScientistState = {
  missionDate: string;
  missionProgress: number;
  missionCompleted: boolean;
  missionRewarded: boolean;
};

const key = (student: string) => `virtual-scientist:${student}`;
const empty: VirtualScientistState = { missionDate: '', missionProgress: 0, missionCompleted: false, missionRewarded: false };

export const scientistStages: ScientistStage[] = [
  { key: 'beginner', title: 'باحث مبتدئ', icon: '🧑‍🔬', lab: 'طاولة التجارب', minLevel: 1, message: 'كل عالم كبير بدأ بسؤال صغير. ابدأ اليوم بتجربة واحدة.' },
  { key: 'explorer', title: 'مستكشف العلوم', icon: '🔎', lab: 'مختبر الاستكشاف', minLevel: 3, message: 'فضولك هو أداتك الأقوى. اقترب أكثر من أسرار العلوم.' },
  { key: 'scientist', title: 'عالم صغير', icon: '🧪', lab: 'مختبر الأبحاث', minLevel: 5, message: 'نتائجك بدأت تصنع قصة علمية حقيقية. لا تتوقف عن التجربة.' },
  { key: 'advanced', title: 'عالم متقدم', icon: '🧬', lab: 'مركز العلوم المتقدم', minLevel: 7, message: 'أنت لا تحفظ العلوم فقط؛ أنت تتعلم كيف تفكر مثل العالم.' },
  { key: 'legend', title: 'أسطورة العلوم', icon: '🌟', lab: 'مركز الابتكار العلمي', minLevel: 10, message: 'وصلت إلى القمة. الآن استخدم علمك لاكتشاف سؤال أكبر.' },
];

export const getScientistStage = (level: number) => scientistStages.filter(s => level >= s.minLevel).slice(-1)[0] || scientistStages[0];

function today() { return new Date().toISOString().slice(0, 10); }

export async function getVirtualScientist(student: string, gamification?: GamificationState) {
  const state = await getGamification(student);
  const saved = await readJson<VirtualScientistState>(key(student), empty);
  const date = today();
  const mission = saved.missionDate === date ? saved : { ...empty, missionDate: date };
  const stage = getScientistStage(levelFromXp(state.xp));
  return { state, mission, stage };
}

export async function recordScientistMission(student: string, progress: number) {
  const current = await getVirtualScientist(student);
  if (current.mission.missionCompleted) return current;
  const nextProgress = Math.min(5, current.mission.missionProgress + Math.max(0, progress));
  const missionCompleted = nextProgress >= 5;
  const next = { ...current.mission, missionDate: today(), missionProgress: nextProgress, missionCompleted, missionRewarded: current.mission.missionRewarded };
  await writeJson(key(student), next);
  return { ...current, mission: next };
}

export function getScientistMessage(state: GamificationState) {
  const accuracy = state.answered ? Math.round(state.correct / state.answered * 100) : 0;
  if (state.streak >= 7) return '🔥 سبعة أيام متتالية! عالم حقيقي يعرف أن الاستمرار أقوى من الحماس.';
  if (accuracy >= 90 && state.answered >= 10) return '🎯 دقتك مذهلة! جرّب تحديًا أصعب واختبر حدود معرفتك.';
  if (state.answered === 0) return '👋 أنا عالمك الافتراضي. هيا نبدأ بأول سؤال ونبني مختبرك معًا!';
  if (state.correct < state.answered / 2) return '💡 لا تخف من الخطأ؛ كل إجابة خاطئة تعطينا تجربة جديدة نتعلم منها.';
  return '🚀 تقدمك مستمر! سؤال واحد اليوم قد يقربك من مستوى العالم القادم.';
}
