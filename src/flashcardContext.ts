import { getSession, readJson, writeJson, Session } from './storage';

export type FlashcardSubject = 'الفيزياء' | 'الكيمياء' | 'الأحياء';
export type FlashcardGrade = 'الأول الثانوي' | 'الثاني الثانوي';

const handouts: Record<FlashcardGrade, Record<FlashcardSubject, string>> = {
  'الأول الثانوي': {
    الفيزياء: 'ملزمة الفيزياء — الأول الثانوي — الفصل الثاني',
    الكيمياء: 'ملزمة الكيمياء — الأول الثانوي — الفصل الثاني',
    الأحياء: 'ملزمة الأحياء — الأول الثانوي — الفصل الثاني',
  },
  'الثاني الثانوي': {
    الفيزياء: 'ملزمة الفيزياء — الثاني الثانوي — الفصل الثاني',
    الكيمياء: 'ملزمة الكيمياء — الثاني الثانوي — الفصل الثاني',
    الأحياء: 'ملزمة الأحياء — الثاني الثانوي — الفصل الثاني',
  },
};

export function getHandoutName(grade: FlashcardGrade, subject: FlashcardSubject) {
  return handouts[grade][subject];
}

export async function getStudentFlashcardContext(grade: FlashcardGrade) {
  const session = await getSession();
  if (!session?.active || session.role !== 'student') return null;
  if (session.grade !== grade) return null;
  return session;
}

const progressKey = (studentCode: string, grade: FlashcardGrade, subject: FlashcardSubject) =>
  `flashcard-progress:${studentCode}:${grade}:${subject}`;

export async function getFlashcardProgress(session: Session, grade: FlashcardGrade, subject: FlashcardSubject) {
  return readJson<number>(progressKey(session.code || session.name, grade, subject), 0);
}

export async function saveFlashcardProgress(session: Session, grade: FlashcardGrade, subject: FlashcardSubject, index: number) {
  await writeJson(progressKey(session.code || session.name, grade, subject), index);
}
