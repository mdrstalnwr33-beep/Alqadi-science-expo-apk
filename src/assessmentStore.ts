import { readJson, writeJson } from './storage';
import type { ExamQuestion, Grade, Subject } from './data';

export type CustomExam = { id:string; title:string; subject:Subject; grade:Grade; duration:number; questions:ExamQuestion[]; createdAt:number; };
export type HomeworkQuestion = { id:string; type:'mcq'|'tf'|'text'; question:string; options?:string[]; answer?:string; };
export type CustomHomework = { id:string; title:string; subject:Subject; grade:Grade; due:string; note:string; questions:HomeworkQuestion[]; createdAt:number; lessonId?:string; lessonTitle?:string; source?:string; generated?:boolean; };
const EXAMS_KEY='teacher-custom-exams-v1'; const HOMEWORK_KEY='teacher-custom-homework-v1';
export const getCustomExams=()=>readJson<CustomExam[]>(EXAMS_KEY,[]);
export const saveCustomExams=(items:CustomExam[])=>writeJson(EXAMS_KEY,items);
export const getCustomHomework=()=>readJson<CustomHomework[]>(HOMEWORK_KEY,[]);
export const saveCustomHomework=(items:CustomHomework[])=>writeJson(HOMEWORK_KEY,items);

// Weekly curriculum-generated homework was removed with the artificial lesson plan.
// Homework is now teacher-created and independent from lessons and curriculum metadata.
export const getCurriculumHomework=(_grade?:Grade,_subject?:Subject,_lessonId?:string):CustomHomework[]=>[];
