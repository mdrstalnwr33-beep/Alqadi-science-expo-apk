import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { readJson, storageKeys } from '../src/storage';
import { recordExamResult } from '../src/gamification';
import { Card, Page, Section, C } from '../src/ui';

export default function ResultsScreen(){
 const p=useLocalSearchParams<{role?:string;name?:string;grade?:string;subject?:string;code?:string}>();
 const teacher=p.role==='teacher'; const student=p.name||'الطالب'; const [results,setResults]=useState<any[]>([]);
 useEffect(()=>{
   if(!teacher) readJson<any[]>(storageKeys.results(p.code||student),[]).then(async r=>{
     setResults(r);
     const latest=r[0];
     if(latest?.score!=null && latest?.maxScore!=null) await recordExamResult(p.code||student, Number(latest.score), Number(latest.maxScore));
   });
 },[teacher,p.code,student]);
 return <Page title={teacher?`نتائج ${p.grade||'المستوى'}`:'درجات الطالب'} subtitle={teacher?'متابعة درجات الطلاب':'نتائجك الدراسية'} onBack={()=>router.back()}>
  <Card><Text style={{fontSize:20,fontWeight:'900',color:C.navy,textAlign:'right'}}>{teacher?'طلاب المستوى':student}</Text><Text style={{color:C.muted,textAlign:'right',marginTop:5}}>{p.grade||'المستوى الدراسي'}</Text></Card>
  <Section title="النتائج">{results.length?results.filter(x=>(!p.subject||x.subject===p.subject)&&(teacher||!p.grade||x.grade===p.grade)).map(x=><Card key={x.examId}><Text style={{fontWeight:'900',fontSize:16,color:C.navy,textAlign:'right'}}>{x.examTitle}</Text><Text style={{color:C.green,textAlign:'right',marginTop:5,fontWeight:'800'}}>الدرجة: {x.score}/{x.maxScore}</Text><Text style={{color:C.muted,textAlign:'right',marginTop:4}}>تم التسليم: {new Date(x.submittedAt).toLocaleDateString('ar-YE')}</Text></Card>):<Card><Text style={{textAlign:'center',color:C.muted}}>{teacher?'لا توجد نتائج سحابية معروضة بعد.':'لم تسلّم أي اختبار بعد.'}</Text></Card>}</Section>
  {teacher&&<Card><Text style={{fontWeight:'800',color:C.navy,textAlign:'right'}}>تنبيه</Text><Text style={{color:C.muted,textAlign:'right',lineHeight:23,marginTop:6}}>تظهر هنا النتائج المحلية للطالب. عرض نتائج جميع الطلاب يتطلب تفعيل قواعد Firebase وربط حساب المعلم.</Text></Card>}
 </Page>;
}
