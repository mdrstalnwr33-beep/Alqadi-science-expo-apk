import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export type MotivationChallenge = { id:string; title:string; text:string; target:number; reward:number; active:boolean; grade?:string };
export type MotivationQuestion = { id:string; question:string; answer:string; subject:string; reward:number; active:boolean; grade?:string };
export type MotivationExperiment = { id:string; title:string; materials:string; steps:string; result:string; reward:number; active:boolean; grade?:string };
export type MotivationContent = { challenges:MotivationChallenge[]; questions:MotivationQuestion[]; experiments:MotivationExperiment[] };

const ref = doc(db,'publicContent','motivationContent');
const empty:MotivationContent = { challenges:[], questions:[], experiments:[] };

export async function getMotivationContent(grade?:string):Promise<MotivationContent>{
  try {
    const snap=await getDoc(ref);
    if(!snap.exists())return empty;
    const d=snap.data() as Partial<MotivationContent>;
    const all={challenges:Array.isArray(d.challenges)?d.challenges:[],questions:Array.isArray(d.questions)?d.questions:[],experiments:Array.isArray(d.experiments)?d.experiments:[]};
    if(!grade)return all;
    const inGrade=<T extends {grade?:string}>(items:T[])=>items.filter(item=>!item.grade||item.grade===grade);
    return {challenges:inGrade(all.challenges),questions:inGrade(all.questions),experiments:inGrade(all.experiments)};
  } catch { return empty; }
}
export async function saveMotivationContent(content:MotivationContent,grade?:string){
  if(!grade){await setDoc(ref,{...content,updatedAt:Date.now()});return;}
  const current=await getMotivationContent();
  const mergeForGrade=<T extends {id:string;grade?:string}>(oldItems:T[],newItems:T[])=>{
    const keep=oldItems.filter(item=>!item.grade||item.grade!==grade);
    const keptIds=new Set(keep.map(item=>item.id));
    const scoped=newItems.filter(item=>!keptIds.has(item.id)).map(item=>({...item,grade}));
    return [...keep,...scoped];
  };
  await setDoc(ref,{challenges:mergeForGrade(current.challenges,content.challenges),questions:mergeForGrade(current.questions,content.questions),experiments:mergeForGrade(current.experiments,content.experiments),updatedAt:Date.now()});
}
export const makeId = (prefix:string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
