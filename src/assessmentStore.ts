import { readJson, writeJson } from './storage';
import type { ExamQuestion, Grade, Subject } from './data';
import { curriculumLessons } from './curriculumLessons';

export type CustomExam = { id:string; title:string; subject:Subject; grade:Grade; duration:number; questions:ExamQuestion[]; createdAt:number; };
export type HomeworkQuestion = { id:string; type:'mcq'|'tf'|'text'; question:string; options?:string[]; answer?:string; };
export type CustomHomework = { id:string; title:string; subject:Subject; grade:Grade; due:string; note:string; questions:HomeworkQuestion[]; createdAt:number; lessonId?:string; lessonTitle?:string; source?:string; generated?:boolean; };
const EXAMS_KEY='teacher-custom-exams-v1'; const HOMEWORK_KEY='teacher-custom-homework-v1';
export const getCustomExams=()=>readJson<CustomExam[]>(EXAMS_KEY,[]);
export const saveCustomExams=(items:CustomExam[])=>writeJson(EXAMS_KEY,items);
export const getCustomHomework=()=>readJson<CustomHomework[]>(HOMEWORK_KEY,[]);
export const saveCustomHomework=(items:CustomHomework[])=>writeJson(HOMEWORK_KEY,items);
export const getCurriculumHomework=(grade?:Grade,subject?:Subject,lessonId?:string):CustomHomework[]=>{
 const lessons=curriculumLessons.filter(l=>(!grade||l.grade===grade)&&(!subject||l.subject===subject)&&(!lessonId||l.id===lessonId));
 return lessons.map(lesson=>{
  const pool=curriculumLessons.filter(x=>x.grade===lesson.grade&&x.subject===lesson.subject); const i=pool.findIndex(x=>x.id===lesson.id);
  const topic=lesson.title.replace(/^الأسبوع \d+ • الدرس \d+: /,'');
  const d=[1,2,3].map(n=>pool[(i+n)%pool.length].title.replace(/^الأسبوع \d+ • الدرس \d+: /,''));
  const options=[topic,...d]; const base=`curriculum-hw-${lesson.id}`;
  return {id:base,title:`واجب درس: ${topic}`,subject:lesson.subject,grade:lesson.grade,due:'بعد إكمال الدرس',note:`واجب مرتبط مباشرة بالدرس والملزمة: ${lesson.source}.`,lessonId:lesson.id,lessonTitle:lesson.title,source:lesson.source,generated:true,createdAt:0,questions:[
   {id:`${base}-1`,type:'tf',question:`صح أم خطأ: يركز درس «${topic}» على المفاهيم الخاصة بهذا الموضوع.`,options:['صح','خطأ'],answer:'صح'},
   {id:`${base}-2`,type:'tf',question:`صح أم خطأ: لا علاقة لدرس «${topic}» بالملزمة المرتبطة بالمادة والصف.`,options:['صح','خطأ'],answer:'خطأ'},
   {id:`${base}-3`,type:'mcq',question:`أي عنوان يمثل موضوع الدرس الذي أنهيته؟`,options,answer:topic},
   {id:`${base}-4`,type:'mcq',question:`أي موضوع يجب مراجعته للإجابة عن واجب هذا الدرس؟`,options:[d[1],d[2],topic,d[0]],answer:topic},
   {id:`${base}-5`,type:'text',question:`اذكر بأسلوبك الفكرة أو المفهوم الرئيس الذي تعلمته في درس «${topic}».`,answer:topic}
  ]};
 });
};
