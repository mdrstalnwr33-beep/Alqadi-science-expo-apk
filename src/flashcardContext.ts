import { getSession, readJson, writeJson, Session } from './storage';

export type FlashcardSubject = 'الفيزياء' | 'الكيمياء' | 'الأحياء';
export type FlashcardGrade = 'الأول الثانوي' | 'الثاني الثانوي';

// Flashcards are tied directly to the actual handout used for revision.
// They do not depend on the weekly/lesson curriculum system.
const handouts: Record<FlashcardGrade, Record<FlashcardSubject, string>> = {
  'الأول الثانوي': {
    الفيزياء: 'فيزياء أول ترم ثاني.pdf',
    الكيمياء: 'ملخص الكيمياء الأول الثانوي الفصل الثاني',
    الأحياء: 'ملخص أحياء أول فصل ثاني.pdf',
  },
  'الثاني الثانوي': {
    الفيزياء: 'ثاني فيزياء فصل ثاني.pdf',
    الكيمياء: 'الكيمياء ثاني ترم ثاني.pdf',
    الأحياء: 'م احياء ثاني فصل ثاني.pdf',
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

// Progress is private to the logged-in student, grade, subject and handout.
const progressKey = (studentCode: string, grade: FlashcardGrade, subject: FlashcardSubject) =>
  `flashcard-progress:${studentCode}:${grade}:${subject}:${handouts[grade][subject]}`;

export async function getFlashcardProgress(session: Session, grade: FlashcardGrade, subject: FlashcardSubject) {
  return readJson<number>(progressKey(session.code || session.name, grade, subject), 0);
}

export async function saveFlashcardProgress(session: Session, grade: FlashcardGrade, subject: FlashcardSubject, index: number) {
  await writeJson(progressKey(session.code || session.name, grade, subject), index);
}
