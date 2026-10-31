import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { File } from 'expo-file-system';
import { lessons } from '../src/data';
import { curriculumLessons } from '../src/curriculumLessons';
import { readJson, storageKeys } from '../src/storage';
import { getCloudLessons } from '../src/contentCloud';
import { Card, Page, Section, C, Action } from '../src/ui';
export default function LessonScreen(){
 const p=useLocalSearchParams<{id?:string;grade?:string;subject?:string;offline?:string;week?:string}>();
 const [all,setAll]=useState<any[]>([...curriculumLessons,...lessons]); const [offlineBody,setOfflineBody]=useState<string|null>(null);
 useEffect(()=>{let alive=true;(async()=>{const downloads=await readJson<Record<string,string>>(storageKeys.downloads,{});const savedUri=downloads[p.id||''];if(savedUri){try{const file=new File(savedUri);if(file.exists){const text=await file.text();if(alive)setOfflineBody(text);return;}}catch{}}const local=await readJson<any[]>('custom-lessons-all',[]);let cloud:any[]=[];if(p.grade){const selected=p.subject?[p.subject]:['الكيمياء','الفيزياء','الأحياء'];const groups=await Promise.all(selected.map(s=>getCloudLessons(p.grade!,s).catch(()=>[])));cloud=groups.flat()}if(alive)setAll([...curriculumLessons,...lessons,...local,...cloud]);})();return()=>{alive=false}},[p.id,p.grade,p.subject]);
 const l=all.find(x=>x.id===p.id&&(!p.grade||x.grade===p.grade)&&(!p.subject||x.subject===p.subject));
 if(offlineBody!==null){const lines=offlineBody.split('\n');const title=lines[0]||'الدرس المحفوظ';const grade=lines[1]||p.grade||'';const date=lines[2]||'';const body=lines.slice(4).join('\n');return <Page title="الدرس المحفوظ" subtitle={`${grade}${date?` • ${date}`:''}`} onBack={()=>router.back()}><Card><Text style={{fontSize:22,fontWeight:'900',color:C.navy,textAlign:'right'}}>{title}</Text><Text style={{color:C.muted,textAlign:'right',marginTop:7}}>📥 محفوظ على الجهاز • يعمل دون اتصال</Text></Card><Section title="محتوى الدرس"><Card><Text style={{fontSize:16,lineHeight:29,color:C.text,textAlign:'right'}}>{body}</Text></Card></Section></Page>}
 if(!l)return <Page title="الدرس غير متاح" subtitle="هذا الدرس لا ينتمي إلى صفك الدراسي" onBack={()=>router.back()}><Card><Text style={{textAlign:'center',color:C.muted,lineHeight:24}}>لا يمكنك فتح درس من صف آخر أو درس غير موجود.</Text></Card></Page>;
 return <Page title="الدرس" subtitle={`${l.subject} • ${l.grade}`} onBack={()=>router.back()}><Card><Text style={{fontSize:22,fontWeight:'900',color:C.navy,textAlign:'right'}}>{l.title}</Text><Text style={{color:C.muted,textAlign:'right',marginTop:7}}>{l.grade} • {l.subject}</Text>{l.source&&<Text style={{color:'#475569',textAlign:'right',marginTop:7,fontSize:12,fontWeight:'700'}}>📘 {l.source}</Text>}</Card><Section title="محتوى الدرس"><Card><Text style={{fontSize:16,lineHeight:29,color:C.text,textAlign:'right'}}>{l.body}</Text><Text style={{fontSize:15,lineHeight:27,color:C.text,textAlign:'right',marginTop:18}}>راجع المفاهيم في الملزمة ثم انتقل إلى الواجب والاختبار لتثبيت الفهم.</Text></Card><Action label="حل واجب هذا الدرس (5 أسئلة)" icon="✍️" onPress={()=>router.push({pathname:'/homework',params:{grade:l.grade,subject:l.subject,lessonId:l.id}})} /></Section></Page>;
}
