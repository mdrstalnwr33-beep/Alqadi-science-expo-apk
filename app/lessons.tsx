import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { readJson, storageKeys, writeJson } from '../src/storage';
import { deleteLesson, getCloudLessons } from '../src/contentCloud';
import { Card, Page, Section, Action, C } from '../src/ui';

export default function LessonsScreen() {
 const p=useLocalSearchParams<{subject?:string;grade?:string;role?:string;name?:string;code?:string}>();
 const grade=String(p.grade||'').trim();
 const subject=String(p.subject||'').trim();
 const [custom,setCustom]=useState<any[]>([]); const [cloud,setCloud]=useState<any[]>([]); const [downloaded,setDownloaded]=useState<Record<string,string>>({});
 const load=async()=>{const local=await readJson<any[]>('custom-lessons-all',[]);const downloads=await readJson<Record<string,string>>(storageKeys.downloads,{});setCustom(local);setDownloaded(downloads);if(grade&&subject){const scoped=await getCloudLessons(grade,subject).catch(()=>[]);setCloud(scoped.filter((x:any)=>String(x.grade||'').trim()===grade&&String(x.subject||'').trim()===subject));}else setCloud([]);};
 useEffect(()=>{load().catch(()=>{});},[grade,subject]);
 const customScoped=[...custom,...cloud].filter((x:any)=>String(x.grade||'').trim()===grade&&String(x.subject||'').trim()===subject);
 const isTeacherLesson=(l:any)=>String(l.id||'').startsWith('custom-lesson-');
 const download=async(l:any)=>{try{const file=new File(Paths.document,`lesson-${l.id}.txt`);if(!file.exists)file.create();file.write(`${l.title}\n${l.grade}\n${l.subject}\n${l.date||'درس إضافي'}\n\n${l.body||l.summary||''}`);const next={...downloaded,[l.id]:file.uri};await writeJson(storageKeys.downloads,next);setDownloaded(next);Alert.alert('تم التنزيل','تم حفظ الدرس على الهاتف ويمكن قراءته دون اتصال.')}catch{Alert.alert('تعذر التنزيل','حدث خطأ أثناء حفظ الدرس محليًا.')}};
 const edit=(l:any)=>router.push({pathname:'/create-lesson',params:{id:l.id,subject:l.subject,grade:l.grade,title:l.title,body:l.body}});
 const remove=async(l:any)=>{Alert.alert('حذف الدرس',`هل تريد حذف «${l.title}» نهائيًا؟`,[{text:'إلغاء',style:'cancel'},{text:'حذف',style:'destructive',onPress:async()=>{try{await deleteLesson(l.id);const nextAll=(await readJson<any[]>('custom-lessons-all',[])).filter(x=>x.id!==l.id);await writeJson('custom-lessons-all',nextAll);setCustom(nextAll);setCloud(x=>x.filter(x=>x.id!==l.id));Alert.alert('تم الحذف','تم حذف الدرس من التطبيق والسحابة.');}catch{Alert.alert('تعذر الحذف','تعذر حذف الدرس الآن.');}}}]);};
 const open=(l:any)=>router.push({pathname:'/lesson',params:{id:l.id,subject:l.subject,grade:l.grade,offline:downloaded[l.id]?'1':'0'});
 return <Page title="الدروس الإضافية" subtitle={subject?`${subject} • ${grade}`:'اختر الصف والمادة أولًا'} onBack={()=>router.back()}>
  {p.role==='teacher'&&grade&&subject&&<Action label="إضافة درس جديد" icon="＋" onPress={()=>router.push({pathname:'/create-lesson',params:{subject,grade,role:'teacher'}})} />}
  {grade&&subject?<>
   <Card><Text style={s.planTitle}>📚 الدروس المضافة من المعلم</Text><Text style={s.planText}>هذه الصفحة مخصصة للدروس الإضافية التي يضيفها المعلم فقط. بطاقات المراجعة مستقلة عن الدروس وتعتمد على الملازم.</Text></Card>
   {!!customScoped.length?<Section title="📌 الدروس الإضافية">{customScoped.map(l=><Card key={`${l.id}-${l.grade}-${l.subject}`}><Text style={s.title}>{l.title}</Text><Text style={s.meta}>{l.grade} • {l.subject} • {l.date||'إضافة المعلم'}</Text><Text style={s.body}>{l.summary||l.body||''}</Text><View style={{gap:7,marginTop:8}}><Action label="قراءة الدرس" icon="📖" onPress={()=>open(l)} /><Action label={downloaded[l.id]?'✓ محفوظ على الهاتف':'تنزيل للقراءة دون اتصال'} icon={downloaded[l.id]?'✓':'⬇️'} secondary={!downloaded[l.id]} onPress={()=>download(l)} />{p.role==='teacher'&&isTeacherLesson(l)&&<View style={{flexDirection:'row-reverse',gap:8}}><View style={{flex:1}}><Action label="تعديل الدرس" icon="✏️" onPress={()=>edit(l)} /></View><View style={{flex:1}}><Action label="حذف الدرس" icon="🗑️" secondary onPress={()=>remove(l)} /></View></View>}</View></Card>)}</Section>:<Card><Text style={{textAlign:'center',color:C.muted}}>لا توجد دروس إضافية لهذه المادة حاليًا.</Text></Card>}
  </>:<Section title="الدروس الإضافية"><Card><Text style={{textAlign:'center',color:C.muted}}>يجب فتح الدروس من داخل الصف ثم المادة.</Text></Card></Section>}
 </Page>;
}
const s=StyleSheet.create({planTitle:{fontSize:19,fontWeight:'900',color:C.navy,textAlign:'right'},planText:{fontSize:14,lineHeight:22,color:C.text,textAlign:'right',marginTop:7},title:{fontSize:18,fontWeight:'900',color:C.navy,textAlign:'right'},meta:{color:C.muted,textAlign:'right',marginTop:5},body:{color:C.text,textAlign:'right',lineHeight:25,marginTop:10}});