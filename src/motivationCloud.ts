import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export type MotivationChallenge = { id:string; title:string; text:string; target:number; reward:number; active:boolean };
export type MotivationQuestion = { id:string; question:string; answer:string; subject:string; reward:number; active:boolean };
export type MotivationExperiment = { id:string; title:string; materials:string; steps:string; result:string; reward:number; active:boolean };
export type MotivationContent = { challenges:MotivationChallenge[]; questions:MotivationQuestion[]; experiments:MotivationExperiment[] };

const ref = doc(db,'publicContent','motivationContent');
const empty:MotivationContent = { challenges:[], questions:[], experiments:[] };

export async function getMotivationContent():Promise<MotivationContent>{
  try { const snap=await getDoc(ref); if(!snap.exists()) return empty; const d=snap.data() as Partial<MotivationContent>; return { challenges:Array.isArray(d.challenges)?d.challenges:[], questions:Array.isArray(d.questions)?d.questions:[], experiments:Array.isArray(d.experiments)?d.experiments:[] }; }
  catch { return empty; }
}
export async function saveMotivationContent(content:MotivationContent){ await setDoc(ref,{...content,updatedAt:Date.now()}); }
export const makeId = (prefix:string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
