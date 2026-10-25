import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { lessons, subjects } from '../src/data';
import { readJson } from '../src/storage';
import { getCloudLessons } from '../src/contentCloud';
import { Card, Page, Section, C } from '../src/ui';
export default function LessonScreen(){
 const p=useLocalSearchParams<{id?:string;grade?:string;subject?:string}>(); const [all,setAll]=useState<any[]>(lessons);
 useEffect(()=>{let alive=true;(async()=>{const local=await readJson<any[]>('custom-lessons-all',[]);let cloud:any[]=[];if(p.grade){const selected=p.subject?[p.subject]:subjects.map(s=>s.name);const groups=await Promise.all(selected.map(s=>getCloudLessons(p.grade!,s).catch(()=>[])));cloud=groups.flat()}if(alive)setAll([...lessons,...local,...cloud])})();return()=>{alive=false}},[p.grade,p.subject]);
 const l=all.find(x=>x.id===p.id&&(!p.grade||x.grade===p.grade)&&(!p.subject||x.subject===p.subject));
 if(!l)return <Page title="الدرس غير متاح" subtitle="هذا الدرس لا ينتمي إلى صفك الدراسي" onBack={()=>router.back()}><Card><Text style={{textAlign:'center',color:C.muted,lineHeight:24}}>لا يمكنك فتح درس من صف آخر أو درس غير موجود.</Text></Card></Page>;
 return <Page title="الدرس" subtitle={`${l.subject} • ${l.grade}`} onBack={()=>router.back()}><Card><Text style={{fontSize:22,fontWeight:'900',color:C.navy,textAlign:'right'}}>{l.title}</Text><Text style={{color:C.muted,textAlign:'right',marginTop:7}}>{l.grade} • {l.date}</Text></Card><Section title="محتوى الدرس"><Card><Text style={{fontSize:16,lineHeight:29,color:C.text,textAlign:'right'}}>{l.body}</Text><Text style={{fontSize:15,lineHeight:27,color:C.text,textAlign:'right',marginTop:18}}>راجع المفاهيم الأساسية، ثم انتقل إلى أسئلة الواجب والاختبار لتثبيت الفهم.</Text></Card></Section></Page>;
}
