import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { exams } from '../src/data';
import { getCustomExams, type CustomExam } from '../src/assessmentStore';
import { getCloudExams } from '../src/contentCloud';
import { Action, Card, Page, Section, C } from '../src/ui';

export default function ExamsScreen(){
 const p=useLocalSearchParams<{role?:string;name?:string;grade?:string;subject?:string;code?:string}>();
 const [custom,setCustom]=useState<CustomExam[]>([]); const [cloud,setCloud]=useState<CustomExam[]>([]);
 useEffect(()=>{getCustomExams().then(setCustom); if(p.grade&&p.subject)getCloudExams(p.grade,p.subject).then(setCloud).catch(()=>setCloud([]));},[p.grade,p.subject]);
 const merged=new Map<string,CustomExam>();
 [...exams,...custom,...cloud].forEach(e=>merged.set(String(e.id),e));
 const list=[...merged.values()].filter(e=>(!p.subject||e.subject===p.subject)&&(!p.grade||e.grade===p.grade));
 const teacher=p.role==='teacher';
 return <Page title="الاختبارات الشهرية" subtitle={teacher?'إدارة الاختبارات ونتائج الطلاب':'اختبر فهمك للمادة'} onBack={()=>router.back()}>
   {teacher&&<Action label="إنشاء اختبار جديد وإضافة أسئلة" icon="＋" onPress={()=>router.push({pathname:'/create-exam',params:{grade:p.grade,subject:p.subject}})} />}
   <Section title={teacher?'الاختبارات المنشورة':'الاختبارات المتاحة'}>{list.map(e=><Card key={e.id}><Text style={{fontSize:17,fontWeight:'900',color:C.navy,textAlign:'right'}}>{e.title}</Text><Text style={{color:C.muted,textAlign:'right',marginTop:5}}>{e.subject} • {e.grade} • {e.duration} دقيقة • {e.questions.length} أسئلة</Text><Action label={teacher?'عرض الاختبار':'بدء الاختبار'} icon="📝" onPress={()=>router.push({pathname:'/exam',params:{id:e.id,role:p.role,name:p.name,grade:p.grade,subject:e.subject,code:p.code}})} /></Card>)}{!list.length&&<Card><Text style={{textAlign:'center',color:C.muted}}>لا توجد اختبارات لهذا الاختيار.</Text></Card>}</Section>
 </Page>;
}
