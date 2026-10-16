import { doc, getDoc, setDoc, deleteDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { LocalStudent } from './storage';

const cleanCode = (code:string) => /^\d{6}$/.test(code) ? code : null;

export async function getCloudTeacherCode(): Promise<string|null> {
  const snap = await getDoc(doc(db, 'settings', 'teacher'));
  const code = snap.data()?.code;
  return typeof code === 'string' && cleanCode(code) ? code : null;
}
export async function setCloudTeacherCode(code:string) {
  if (!cleanCode(code)) throw new Error('Teacher code must contain exactly six digits');
  await setDoc(doc(db, 'settings', 'teacher'), { code, updatedAt: Date.now() }, { merge:true });
}
export async function getCloudStudent(code:string): Promise<LocalStudent|null> {
  if (!cleanCode(code)) return null;
  const snap = await getDoc(doc(db, 'students', code));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { id:String(data.id || code), name:String(data.name || 'الطالب'), code, grade:String(data.grade || ''), active:data.active !== false };
}
export async function saveCloudStudent(student:LocalStudent) {
  if (!cleanCode(student.code)) throw new Error('Student code must contain exactly six digits');
  await setDoc(doc(db, 'students', student.code), { ...student, updatedAt: Date.now() }, { merge:true });
}
export async function deleteCloudStudent(code:string) {
  if (!cleanCode(code)) return;
  await deleteDoc(doc(db, 'students', code));
}
export async function claimStudentDevice(code:string,deviceId:string):Promise<'claimed'|'same-device'|'occupied'|'inactive'|'missing'> {
  if(!cleanCode(code))return 'missing';
  const ref=doc(db,'students',code);
  return runTransaction(db,async tx=>{
    const snap=await tx.get(ref);
    if(!snap.exists())return 'missing';
    const data=snap.data();
    if(data.active===false)return 'inactive';
    const current=typeof data.activeDeviceId==='string'?data.activeDeviceId:'';
    if(current&&current!==deviceId)return 'occupied';
    tx.update(ref,{activeDeviceId:deviceId,lastLoginAt:serverTimestamp(),updatedAt:Date.now()});
    return current===deviceId?'same-device':'claimed';
  });
}
export async function releaseStudentDevice(code:string,deviceId:string){
 if(!cleanCode(code))return;
 const ref=doc(db,'students',code);
 await runTransaction(db,async tx=>{const snap=await tx.get(ref);if(snap.exists()&&snap.data().activeDeviceId===deviceId)tx.update(ref,{activeDeviceId:'',updatedAt:Date.now()})});
}
export async function saveCloudTeacherProfile(profile:{name:string;school:string;bio:string;photo?:string}){await setDoc(doc(db,'publicContent','teacherProfile'),{...profile,updatedAt:Date.now()},{merge:true})}
export async function getCloudTeacherProfile(){const snap=await getDoc(doc(db,'publicContent','teacherProfile'));return snap.exists()?snap.data():null}
