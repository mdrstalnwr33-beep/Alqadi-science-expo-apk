import { readJson, writeJson } from './storage';
import type { ExamQuestion, Grade, Subject } from './data';

export type CustomExam = {
  id: string;
  title: string;
  subject: Subject;
  grade: Grade;
  duration: number;
  questions: ExamQuestion[];
  createdAt: number;
};

export type CustomHomework = {
  id: string;
  title: string;
  subject: Subject;
  grade: Grade;
  due: string;
  note: string;
  questions: string[];
  createdAt: number;
};

const EXAMS_KEY = 'teacher-custom-exams-v1';
const HOMEWORK_KEY = 'teacher-custom-homework-v1';

export const getCustomExams = () => readJson<CustomExam[]>(EXAMS_KEY, []);
export const saveCustomExams = (items: CustomExam[]) => writeJson(EXAMS_KEY, items);
export const getCustomHomework = () => readJson<CustomHomework[]>(HOMEWORK_KEY, []);
export const saveCustomHomework = (items: CustomHomework[]) => writeJson(HOMEWORK_KEY, items);
