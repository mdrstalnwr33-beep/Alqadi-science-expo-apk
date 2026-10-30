import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { curriculumLessons, curriculumWeeks } from '../src/curriculumLessons';
import { readJson, storageKeys, writeJson } from '../src/storage';
import { deleteLesson, getCloudLessons } from '../src/contentCloud';
import { Card, Page, Section, Action, C } from '../src/ui';

export default function LessonsScreen() {
 const p=useLocalSearchParams<{subject?:string;grade?:string;role?:string;name?:string;code?:string;week?:string}>();
 const grade=String(p.grade||'').trim();
 const subject=String(p.subject||'').trim();
 const [week,setWeek]=useState(Math.max(1,Math.min(curriculumWeeks,Number(p.week||1))));
 const [custom,setCustom]=useState<any[]>([]); const [cloud,setCloud]=useState<any[]>([]); const [downloaded,setDownloaded]=useState<Record<string,string>>({});
 const load=async()=>{
  const local=await readJson<any[]>('custom-lessons-all',[]);
  const downloads=await readJson<Record<string,string>>(storageKeys.downloads,{});
  setCustom(local);setDownloaded(downloads);
  if(grade&&subject){
   const scoped=await getCloudLessons(grade,subject).catch(()=>[]);
   setCloud(scoped.filter((x:any)=>String(x.grade||'').trim()===grade&&String(x.subject||'').trim()===subject));
  }else setCloud([]);
 };
 useEffect(()=>{load().catch(()=>{});},[grade,subject]);
 useEffect(()=>{const n=Number(p.week||1);if(n>=1&&n<=curriculumWeeks)setWeek(n);},[p.week]);
 const curriculum=curriculumLessons.filter(x=>x.grade===grade&&x.subject===subject&&x.week===week);
 const customScoped=[...custom,...cloud].filter((x:any)=>String(x.grade||'').trim()===grade&&String(x.subject||'').trim()===subject);
 const isTeacherLesson=(l:any)=>String(l.id||'').startsWith('custom-lesson-');
 const download=async(l:any)=>{try{const file=new File(Paths.document,`lesson-${l.id}.txt`);if(!file.exists)file.create();file.write(`${l.title}\n${l.grade}\n${l.subject}\n${l.date||`الأسبوع ${l.week||week}`}\n\n${l.body||l.summary||''}`);const next={...downloaded,[l.id]:file.uri};await writeJson(storageKeys.downloads,next);setDownloaded(next);Alert.alert('تم التنزيل','تم حفظ الدرس على الهاتف ويمكن قراءته دون اتصال.')}catch{Alert.alert('تعذر التنزيل','حدث خطأ أثناء حفظ الدرس محليًا.')}};
 const edit=(l:any)=>router.push({pathname:'/create-lesson',params:{id:l.id,subject:l.subject,grade:l.grade,title:l.title,body:l.body}});
 const remove=async(l:any)=>{Alert.alert('حذف الدرس',`هل تريد حذف «${l.title}» نهائيًا؟`,[{text:'إلغاء',style:'cancel'},{text:'حذف',style:'destructive',onPress:async()=>{try{await deleteLesson(l.id);const nextAll=(await readJson<any[]>('custom-lessons-all',[])).filter(x=>x.id!==l.id);await writeJson('custom-lessons-all',nextAll);setCustom(nextAll);setCloud(x=>x.filter(x=>x.id!==l.id));Alert.alert('تم الحذف','تم حذف الدرس من التطبيق والسحابة.');}catch{Alert.alert('تعذر الحذف','تعذر حذف الدرس الآن.');}}}]);};
 const open=(l:any)=>router.push({pathname:'/lesson',params:{id:l.id,subject:l.subject,grade:l.grade,offline:downloaded[l.id]?'1':'0',week:String(week)}});
 return <Page title="الدروس اليومية" subtitle={subject?`${subject} • ${grade}`:'اختر الصف والمادة أولًا'} onBack={()=>router.back()}>
  {p.role==='teacher'&&grade&&subject&&<Action label="إضافة درس جديد" icon="＋" onPress={()=>router.push({pathname:'/create-lesson',params:{subject,grade,role:'teacher'}})} />}
  {grade&&subject?<>
   <Card><Text style={s.planTitle}>📚 الخطة الأسبوعية</Text><Text style={s.planText}>هذه الخطة مرتبطة بالطالب من خلال صفه، ثم المادة، ثم ملزمة المادة. لكل مادة درسان فقط في الأسبوع، ولا تُحمّل دروس مادة أو صف آخر.</Text><View style={s.weeks}>{Array.from({length:curriculumWeeks},(_,i)=>{const w=i+1;return <Pressable key={w} onPress={()=>setWeek(w)} style={[s.weekBtn,w===week&&s.weekActive]}><Text style={[s.weekText,w===week&&s.weekActiveText]}>{w}</Text></Pressable>})}</View></Card>
   <Section title={`الأسبوع ${week} • ${subject}`}>
    {curriculum.map(l=><Card key={l.id}><Text style={s.title}>{l.title}</Text><Text style={s.meta}>{l.grade} • {l.subject} • 📘 من الملزمة</Text><Text style={s.body}>{l.body}</Text><Text style={s.source}>{l.source}</Text><View style={{gap:7,marginTop:8}}><Action label="قراءة الدرس" icon="📖" onPress={()=>open(l)} /><Action label={downloaded[l.id]?'✓ محفوظ على الهاتف':'تنزيل للقراءة دون اتصال'} icon={downloaded[l.id]?'✓':'⬇️'} secondary={!downloaded[l.id]} onPress={()=>download(l)} /></View></Card>)}
    {!curriculum.length&&<Card><Text style={{textAlign:'center',color:C.muted}}>لا توجد دروس لهذه المادة في هذا الأسبوع.</Text></Card>}
   </Section>
   {!!customScoped.length&&<Section title="📌 دروس إضافية أضافها المعلم"><Text style={s.note}>لا تظهر هنا إلا الدروس التي تحمل نفس الصف ونفس المادة.</Text>{customScoped.map(l=><Card key={`${l.id}-${l.grade}-${l.subject}`}><Text style={s.title}>{l.title}</Text><Text style={s.meta}>{l.grade} • {l.subject} • {l.date||'إضافة المعلم'}</Text><Text style={s.body}>{l.summary||l.body||''}</Text><View style={{gap:7,marginTop:8}}><Action label="قراءة الدرس" icon="📖" onPress={()=>open(l)} /><Action label={downloaded[l.id]?'✓ محفوظ على الهاتف':'تنزيل للقراءة دون اتصال'} icon={downloaded[l.id]?'✓':'⬇️'} secondary={!downloaded[l.id]} onPress={()=>download(l)} />{p.role==='teacher'&&isTeacherLesson(l)&&<View style={{flexDirection:'row-reverse',gap:8}}><View style={{flex:1}}><Action label="تعديل الدرس" icon="✏️" onPress={()=>edit(l)} /></View><View style={{flex:1}}><Action label="حذف الدرس" icon="🗑️" secondary onPress={()=>remove(l)} /></View></View>}</View></Card>)}</Section>}
  </>:<Section title="الدروس اليومية"><Card><Text style={{textAlign:'center',color:C.muted}}>يجب فتح الدروس من داخل الصف ثم المادة حتى يتم تطبيق الربط الصحيح.</Text></Card></Section>}
 </Page>;
}
const s=StyleSheet.create({planTitle:{fontSize:19,fontWeight:'900',color:C.navy,textAlign:'right'},planText:{fontSize:14,lineHeight:22,color:C.text,textAlign:'right',marginTop:7},weeks:{flexDirection:'row-reverse',flexWrap:'wrap',gap:7,marginTop:12},weekBtn:{width:40,height:40,borderRadius:12,backgroundColor:'#EEF2F7',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#D7DEE8'},weekActive:{backgroundColor:C.navy,borderColor:C.navy},weekText:{fontWeight:'900',color:C.navy},weekActiveText:{color:'#fff'},title:{fontSize:18,fontWeight:'900',color:C.navy,textAlign:'right'},meta:{color:C.muted,textAlign:'right',marginTop:5},body:{color:C.text,textAlign:'right',lineHeight:25,marginTop:10},source:{color:'#475569',textAlign:'right',marginTop:10,fontSize:12,fontWeight:'700'},note:{color:C.muted,textAlign:'right',marginBottom:8,lineHeight:22}});