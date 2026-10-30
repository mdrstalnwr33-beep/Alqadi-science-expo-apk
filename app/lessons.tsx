import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { lessons as baseLessons, subjects } from '../src/data';
import { readJson, storageKeys, writeJson } from '../src/storage';
import { deleteLesson, getCloudLessons } from '../src/contentCloud';
import { Card, Page, Section, Action, C } from '../src/ui';

export default function LessonsScreen() {
 const p=useLocalSearchParams<{subject?:string;grade?:string;role?:string;name?:string;code?:string}>();
 const [custom,setCustom]=useState<any[]>([]); const [cloud,setCloud]=useState<any[]>([]); const [downloaded,setDownloaded]=useState<Record<string,string>>({});
 const load=async()=>{const local=await readJson<any[]>('custom-lessons-all',[]);setCustom(local);await readJson<Record<string,string>>(storageKeys.downloads,{}).then(setDownloaded);if(p.grade){const selected=p.subject?[p.subject]:subjects.map(s=>s.name);const groups=await Promise.all(selected.map(s=>getCloudLessons(p.grade!,s).catch(()=>[])));setCloud(groups.flat());}else setCloud([]);};
 useEffect(()=>{let alive=true;(async()=>{try{await load();}catch{}if(!alive)return;})();return()=>{alive=false}},[p.grade,p.subject]);
 const all=[...baseLessons,...custom,...cloud];
 const list=all.filter(x=>(!p.subject||x.subject===p.subject)&&(!p.grade||x.grade===p.grade));
 const isTeacherLesson=(l:any)=>String(l.id||'').startsWith('custom-lesson-');
 const download=async(l:any)=>{try{const file=new File(Paths.document,`lesson-${l.id}.txt`);if(!file.exists)file.create();file.write(`${l.title}\n${l.grade}\n${l.date}\n\n${l.body}`);const next={...downloaded,[l.id]:file.uri};await writeJson(storageKeys.downloads,next);setDownloaded(next);Alert.alert('تم التنزيل','تم حفظ الدرس على الهاتف ويمكن قراءته دون اتصال.')}catch{Alert.alert('تعذر التنزيل','حدث خطأ أثناء حفظ الدرس محليًا.')}};
 const edit=(l:any)=>router.push({pathname:'/create-lesson',params:{id:l.id,subject:l.subject,grade:l.grade,title:l.title,body:l.body}});
 const remove=async(l:any)=>{Alert.alert('حذف الدرس',`هل تريد حذف «${l.title}» نهائيًا؟`,[{text:'إلغاء',style:'cancel'},{text:'حذف',style:'destructive',onPress:async()=>{try{await deleteLesson(l.id);const nextAll=(await readJson<any[]>('custom-lessons-all',[])).filter(x=>x.id!==l.id);await writeJson('custom-lessons-all',nextAll);const key=`custom-lessons:${l.grade}:${l.subject}`;const scoped=(await readJson<any[]>(key,[])).filter(x=>x.id!==l.id);await writeJson(key,scoped);setCustom(nextAll);setCloud(x=>x.filter(x=>x.id!==l.id));Alert.alert('تم الحذف','تم حذف الدرس من التطبيق والسحابة.');}catch(error){const code=String((error as any)?.code||'unknown');Alert.alert('تعذر الحذف',code.includes('permission-denied')?'صلاحيات Firestore لا تسمح بالحذف.':'تعذر حذف الدرس الآن.');}}}]);};
 return <Page title="الدروس اليومية" subtitle={p.subject?`${p.subject} • ${p.grade||''}`:'شرح ومراجعة العلوم'} onBack={()=>router.back()}>
  {p.role==='teacher'&&<Action label="إضافة درس جديد" icon="＋" onPress={()=>router.push({pathname:'/create-lesson',params:{subject:p.subject,grade:p.grade,role:'teacher'}})} />}
  <Section title={p.subject?`دروس ${p.subject}`:'الدروس المتاحة'}>
   {list.map(l=><Card key={`${l.id}-${l.subject}-${l.grade}`}><Text style={{fontSize:17,fontWeight:'900',color:C.navy,textAlign:'right'}}>{l.title}</Text><Text style={{color:C.muted,textAlign:'right',marginTop:5}}>{l.grade} • {l.date}</Text><Text style={{color:C.text,textAlign:'right',lineHeight:22,marginTop:10}}>{l.summary || l.body.split(/[.!؟\n]/).filter(Boolean).slice(0,2).join(' • ')}</Text><View style={{gap:7,marginTop:8}}><Action label="قراءة الدرس" icon="📖" onPress={()=>router.push({pathname:'/lesson',params:{id:l.id,subject:l.subject,grade:l.grade,offline:downloaded[l.id]?'1':'0'}})} /><Action label={downloaded[l.id]?'✓ محفوظ على الهاتف':'تنزيل للقراءة دون اتصال'} icon={downloaded[l.id]?'✓':'⬇️'} secondary={!downloaded[l.id]} onPress={()=>download(l)} />{p.role==='teacher'&&isTeacherLesson(l)&&<View style={{flexDirection:'row-reverse',gap:8}}><View style={{flex:1}}><Action label="تعديل الدرس" icon="✏️" onPress={()=>edit(l)} /></View><View style={{flex:1}}><Action label="حذف الدرس" icon="🗑️" secondary onPress={()=>remove(l)} /></View></View>}</View></Card>)}
   {!list.length&&<Card><Text style={{textAlign:'center',color:C.muted}}>لا توجد دروس لهذا الصف والمادة بعد.</Text></Card>}
  </Section>
 </Page>;
}
