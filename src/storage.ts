import AsyncStorage from '@react-native-async-storage/async-storage';

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeKey(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export type Session = { role: 'student' | 'teacher'; name: string; grade: string; code: string; active: boolean };
export type LocalStudent = { id: string; name: string; code: string; grade: string; active: boolean };
export type HonorEntry = { name: string; score: number; position: 1 | 2 | 3; subject?: string; grade: string };

export const storageKeys = {
  session: 'auth-session',
  students: 'teacher-students',
  honors: 'honor-board',
  downloads: 'offline-lessons',
  teacherProfile: 'teacher-profile',
  teacherBiometric: 'teacher-biometric',
  studentBiometricCodes: 'student-biometric-codes',
  examAttempt: (student: string, exam: string) => `exam-attempt:${student}:${exam}`,
  homeworkSubmission: (student: string, homework: string) => `homework-submission:${student}:${homework}`,
  results: (student: string) => `student-results:${student}`,
  lessons: 'custom-lessons-all',
};

export async function getSession() { return readJson<Session | null>(storageKeys.session, null); }
export async function setSession(session: Session) { return writeJson(storageKeys.session, session); }
export async function clearSession() { return removeKey(storageKeys.session); }
