import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { firebaseApp, db } from './firebase';

export type CloudPdf = { id:string; name:string; url:string; grade:string; subject:string; createdAt:number; size?:number };
const storage=getStorage(firebaseApp);

export async function uploadCloudPdf(uri:string,name:string,grade:string,subject:string,size?:number):Promise<CloudPdf>{
  const response=await fetch(uri); const blob=await response.blob();
  const id=`${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const fileRef=ref(storage,`books/${grade}/${subject}/${id}-${name.replace(/[^\w\-.\u0600-\u06ff ]/g,'_')}`);
  await uploadBytes(fileRef,blob,{contentType:'application/pdf'});
  const url=await getDownloadURL(fileRef);
  const item:CloudPdf={id,name,url,grade,subject,createdAt:Date.now(),size};
  await setDoc(doc(db,'content',id),{...item,type:'pdf'});
  return item;
}

export async function getCloudPdfs(grade:string,subject:string):Promise<CloudPdf[]>{
  const snap=await getDocs(query(collection(db,'content'),where('type','==','pdf'),where('grade','==',grade),where('subject','==',subject)));
  return snap.docs.map(d=>d.data() as CloudPdf).sort((a,b)=>b.createdAt-a.createdAt);
}
