import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';

export type CloudLesson={id:string;title:string;body:string;summary?:string;subject:string;grade:string;date:string;createdAt:number};
export type CloudBookLink={id:string;name:string;url:string;grade:string;subject:string;createdAt:number};
export type CloudNotice={id:string;studentCode?:string;grade?:string;title:string;body:string;createdAt:number;read?:boolean};

const byScope=(name:string,grade:string,subject:string)=>query(collection(db,name),where('grade','==',grade),where('subject','==',subject));
const newest=<T extends {createdAt:number}>(items:T[])=>items.sort((a,b)=>b.createdAt-a.createdAt);
export async function publishLesson(item:CloudLesson){await setDoc(doc(db,'lessons',item.id),item);return item;}
export async function updateLesson(item:CloudLesson){await setDoc(doc(db,'lessons',item.id),item,{merge:true});return item;}
export async function deleteLesson(id:string){await deleteDoc(doc(db,'lessons',id));return id;}
export async function getCloudLessons(grade:string,subject:string){const s=await getDocs(byScope('lessons',grade,subject));return newest(s.docs.map(x=>x.data() as CloudLesson));}
export async function publishHomework(item:any){await setDoc(doc(db,'homework',item.id),item);return item;}
export async function getCloudHomework(grade:string,subject:string){const s=await getDocs(byScope('homework',grade,subject));return newest(s.docs.map(x=>x.data() as any));}
export async function publishExam(item:any){await setDoc(doc(db,'exams',item.id),item);return item;}
export async function getCloudExams(grade:string,subject:string){const s=await getDocs(byScope('exams',grade,subject));return newest(s.docs.map(x=>x.data() as any));}
export async function saveBookLink(item:CloudBookLink){await setDoc(doc(db,'bookLinks',item.id),item);return item;}
export async function updateBookLink(item:CloudBookLink){await setDoc(doc(db,'bookLinks',item.id),item,{merge:true});return item;}
export async function deleteBookLink(id:string){await deleteDoc(doc(db,'bookLinks',id));return id;}
export async function getBookLinks(grade:string,subject:string){
 try{
  const s=await getDocs(byScope('bookLinks',grade,subject));
  return newest(s.docs.map(x=>x.data() as CloudBookLink).filter(x=>x.grade===grade&&x.subject===subject));
 }catch{
  return [];
 }
}
export async function publishNotice(item:CloudNotice){await setDoc(doc(db,'notifications',item.id),item);}
export async function getStudentNotices(code:string,grade:string){
 const [student,gradeSnap]=await Promise.all([
  getDocs(query(collection(db,'notifications'),where('studentCode','==',code),orderBy('createdAt','desc'))),
  getDocs(query(collection(db,'notifications'),where('grade','==',grade),orderBy('createdAt','desc'))),
 ]);
 const all=[...student.docs,...gradeSnap.docs].map(x=>x.data() as CloudNotice);
 return Array.from(new Map(all.map(x=>[x.id,x])).values()).sort((a,b)=>b.createdAt-a.createdAt);
}
