import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, TextInput } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { exams, type ExamQuestion } from '../src/data';
import { getCustomExams, type CustomExam } from '../src/assessmentStore';
import { getCloudExams } from '../src/contentCloud';
import { readJson, storageKeys, writeJson } from '../src/storage';
import { getStudentExamAttempts, saveExamAttempt } from '../src/assessmentCloud';
import { recordExamResult, recordQuestionAnswers } from '../src/gamification';
import { Card, Page, Section, C } from '../src/ui';

export default function ExamScreen(){
 const p=useLocalSearchParams<{id?:string;role?:string;name?:string;grade?:string;subject?:string;code?:string}>();
 const [custom,setCustom]=useState<CustomExam[]>([]);
 const [cloud,setCloud]=useState<CustomExam[]>([]);
 const [answers,setAnswers]=useState<Record<string,string>>({});
 const [submitted,setSubmitted]=useState(false);
 const [checking,setChecking]=useState(true);
 const [previousAttempt,setPreviousAttempt]=useState(false);
 useEffect(()=>{getCustomExams().then(setCustom);},[]);
 useEffect(()=>{if(p.grade&&p.subject)getCloudExams(p.grade,p.subject).then(items=>setCloud(items as CustomExam[])).catch(()=>setCloud([]));},[p.grade,p.subject]);
 const exam = [...exams,...custom,...cloud].find(e=>e.id===p.id) || exams.find(e=>e.id===p.id) || exams[0];
 const studentKey=(p.code||p.name||'طالب').trim();
 const key=storageKeys.examAttempt(studentKey,exam.id);
 const teacher=p.role==='teacher';

 useEffect(()=>{
  if(teacher){setChecking(false);return;}
  let alive=true;
  (async()=>{
   const saved=await readJson<{answers:Record<string,string>;submitted:boolean}|null>(key,null);
   let attempted=!!saved?.submitted;
   // Check the cloud record as well, so reinstalling the app does not normally reset an attempt.
   if(p.code){
    try {
     const attempts=await getStudentExamAttempts(p.code);
     if(attempts.some(a=>a.examId===exam.id)) attempted=true;
    } catch { /* Keep the locally saved attempt as a fallback when offline. */ }
   }
   if(!alive)return;
   if(saved?.answers)setAnswers(saved.answers);
   setSubmitted(attempted);
   setPreviousAttempt(attempted);
   setChecking(false);
  })();
  return ()=>{alive=false;};
 },[key,teacher,p.code,exam.id]);

 useEffect(()=>{
  if(teacher)return;
  let active=true;
  ScreenCapture.preventScreenCaptureAsync('active-exam').catch(()=>{});
  return ()=>{if(active)ScreenCapture.allowScreenCaptureAsync('active-exam').catch(()=>{});active=false;};
 },[teacher]);

 const submit=async()=>{
  if(previousAttempt||submitted)return Alert.alert('تم أداء الاختبار','لا يمكن إعادة أداء هذا الاختبار مرة أخرى.');
  if(Object.keys(answers).filter(id=>answers[id]?.trim()).length<exam.questions.length)return Alert.alert('الاختبار غير مكتمل','أجب عن جميع الأسئلة قبل التسليم النهائي.');
  const graded=exam.questions.filter(q=>!!q.answer);
  const autoScore=graded.reduce((sum,q)=>sum+(answers[q.id]?.trim()===q.answer?.trim()?1:0),0);
  const maxScore=graded.length;
  const submittedAt=Date.now();
  const result={examId:exam.id,examTitle:exam.title,subject:exam.subject,grade:exam.grade,score:autoScore,maxScore,submittedAt};
  // Save the lock first, before any network request, to prevent accidental second submissions.
  await writeJson(key,{answers,submitted:true,result});
  setSubmitted(true);setPreviousAttempt(true);
  const old=await readJson<any[]>(storageKeys.results(studentKey),[]);
  await writeJson(storageKeys.results(studentKey),[...old.filter(x=>x.examId!==exam.id),result]);
  await recordQuestionAnswers(studentKey,graded.map(q=>({id:`${exam.id}:${q.id}`,correct:answers[q.id]?.trim()===q.answer?.trim()})));
  await recordExamResult(studentKey,autoScore,maxScore);
  try{
   await saveExamAttempt({id:`${p.code||studentKey}-${exam.id}`,studentCode:p.code||studentKey,studentName:studentKey,grade:exam.grade,subject:exam.subject,examId:exam.id,examTitle:exam.title,answers,autoScore,maxAutoScore:maxScore,submittedAt});
  }catch{}
  Alert.alert('تم التسليم',`تم حفظ المحاولة. الدرجة الآلية: ${autoScore}/${maxScore||0}`);
 };

 if(checking&&!teacher)return <Page title="التحقق من الاختبار" subtitle="لحظة من فضلك"><Card><Text style={{textAlign:'center',color:C.muted}}>نتحقق من وجود محاولة سابقة...</Text></Card></Page>;
 if(submitted&&!teacher)return <Page title="تم تسليم الاختبار" subtitle={exam.title} onBack={()=>router.back()}><Card><Text style={{fontSize:19,fontWeight:'900',color:C.green,textAlign:'center'}}>✓ تم حفظ محاولة الطالب</Text><Text style={{textAlign:'right',color:C.muted,lineHeight:24,marginTop:12}}>لا يمكن إعادة أداء هذا الاختبار. تم حفظ المحاولة ومنع إعادة التسليم على هذا الجهاز، مع التحقق من المحاولات المحفوظة في السحابة عند توفر الإنترنت.</Text></Card></Page>;
 return <Page title={teacher?'معاينة الاختبار':exam.title} subtitle={`${exam.subject} • ${exam.grade}`} onBack={()=>router.back()}><Card><Text style={{fontWeight:'800',color:C.navy,textAlign:'right'}}>المدة: {exam.duration} دقيقة</Text><Text style={{color:C.muted,textAlign:'right',marginTop:5}}>عدد الأسئلة: {exam.questions.length}</Text>{!teacher&&<Text style={{color:C.green,textAlign:'right',marginTop:8}}>🔒 لقطة الشاشة وتسجيل الشاشة محظوران أثناء الاختبار.</Text>}</Card><Section title="الأسئلة">{exam.questions.map((q:ExamQuestion,i)=><Card key={q.id}><Text style={{fontSize:16,fontWeight:'900',color:C.text,textAlign:'right',lineHeight:24}}>{i+1}. {q.question}</Text>{q.options?.map(o=><Pressable key={o} onPress={()=>setAnswers(a=>({...a,[q.id]:o}))} style={{padding:12,borderRadius:11,borderWidth:1,borderColor:answers[q.id]===o?C.blue:C.border,backgroundColor:answers[q.id]===o?'#eef4f8':'#fff',marginTop:8}}><Text style={{textAlign:'right',color:C.text,fontWeight:'700'}}>{answers[q.id]===o?'◉ ':'○ '}{o}</Text></Pressable>)}{q.type==='text'&&<TextInput multiline value={answers[q.id]||''} onChangeText={v=>setAnswers(a=>({...a,[q.id]:v}))} placeholder="اكتب إجابتك هنا..." placeholderTextColor="#98a2b3" textAlign="right" style={{minHeight:100,borderWidth:1,borderColor:C.border,borderRadius:12,padding:12,marginTop:10,textAlignVertical:'top'}}/>}</Card>)}</Section>{!teacher&&<Pressable onPress={submit} style={{backgroundColor:C.navy,borderRadius:14,padding:16,marginBottom:20}}><Text style={{color:'#fff',textAlign:'center',fontWeight:'900',fontSize:16}}>تسليم الاختبار النهائي 📝</Text></Pressable>}</Page>;
}
