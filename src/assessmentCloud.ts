import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';

export type CloudAttempt={id:string;studentCode:string;studentName:string;grade:string;subject:string;examId:string;examTitle:string;answers:Record<string,string>;autoScore:number;maxAutoScore:number;submittedAt:number};
export type CloudHomework={id:string;studentCode:string;studentName:string;grade:string;subject:string;homeworkId:string;title:string;answers:Record<string,string>;photo?:string;score?:number;teacherComment?:string;submittedAt:number};

export async function saveExamAttempt(item:CloudAttempt){await setDoc(doc(db,'examAttempts',item.id),item,{merge:true});}
export async function getStudentExamAttempts(studentCode:string){const s=await getDocs(query(collection(db,'examAttempts'),where('studentCode','==',studentCode)));return s.docs.map(d=>d.data() as CloudAttempt);}
export async function getGradeExamAttempts(grade:string,subject?:string){const s=await getDocs(query(collection(db,'examAttempts'),where('grade','==',grade)));const all=s.docs.map(d=>d.data() as CloudAttempt);return subject?all.filter(x=>x.subject===subject):all;}
export async function saveHomeworkSubmission(item:CloudHomework){await setDoc(doc(db,'homeworkSubmissions',item.id),item,{merge:true});}
export async function getStudentHomework(studentCode:string){const s=await getDocs(query(collection(db,'homeworkSubmissions'),where('studentCode','==',studentCode)));return s.docs.map(d=>d.data() as CloudHomework);}
export async function getGradeHomework(grade:string,subject?:string){const s=await getDocs(query(collection(db,'homeworkSubmissions'),where('grade','==',grade)));const all=s.docs.map(d=>d.data() as CloudHomework);return subject?all.filter(x=>x.subject===subject):all;}
