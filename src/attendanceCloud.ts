import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export type AttendanceStatus='حاضر'|'غائب'|'متفاعل';
export type AttendanceMap=Record<string,AttendanceStatus>;
function attendanceDocumentId(grade:string,subject:string,date:string){return `${date}-${encodeURIComponent(grade)}-${encodeURIComponent(subject)}`;}
export async function getAttendanceForDay(grade:string,subject:string,date:string):Promise<AttendanceMap>{
 const snapshot=await getDoc(doc(db,'attendance',attendanceDocumentId(grade,subject,date)));
 if(!snapshot.exists())return {};
 const values=snapshot.data().status;
 if(!values||typeof values!=='object')return {};
 const valid:AttendanceMap={};
 for(const [code,status] of Object.entries(values))if(status==='حاضر'||status==='غائب'||status==='متفاعل')valid[code]=status;
 return valid;
}
export async function saveAttendanceForDay(grade:string,subject:string,date:string,status:AttendanceMap):Promise<void>{
 await setDoc(doc(db,'attendance',attendanceDocumentId(grade,subject,date)),{grade,subject,date,status,updatedAt:serverTimestamp()},{merge:true});
}
