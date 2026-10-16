import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { lessons } from '../src/data';
import { readJson } from '../src/storage';
import { Card, Page, Section, C } from '../src/ui';
export default function LessonScreen(){
 const p=useLocalSearchParams<{id?:string}>(); const [all,setAll]=useState<any[]>(lessons);
 useEffect(()=>{readJson<any[]>('custom-lessons-all',[]).then(x=>setAll([...lessons,...x]));},[]);
 const l=all.find(x=>x.id===p.id)||all[0]||lessons[0];
 return <Page title="الدرس" subtitle={l.subject} onBack={()=>router.back()}><Card><Text style={{fontSize:22,fontWeight:'900',color:C.navy,textAlign:'right'}}>{l.title}</Text><Text style={{color:C.muted,textAlign:'right',marginTop:7}}>{l.grade} • {l.date}</Text></Card><Section title="محتوى الدرس"><Card><Text style={{fontSize:16,lineHeight:29,color:C.text,textAlign:'right'}}>{l.body}</Text><Text style={{fontSize:15,lineHeight:27,color:C.text,textAlign:'right',marginTop:18}}>راجع المفاهيم الأساسية، ثم انتقل إلى أسئلة الواجب والاختبار لتثبيت الفهم.</Text></Card></Section></Page>;
}
