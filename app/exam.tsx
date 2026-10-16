import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, TextInput } from 'react-native';
import { exams, type ExamQuestion } from '../src/data';
import { getCustomExams, type CustomExam } from '../src/assessmentStore';
import { readJson, storageKeys, writeJson } from '../src/storage';
import { saveExamAttempt } from '../src/assessmentCloud';
import { Card, Page, Section, C } from '../src/ui';

export default function ExamScreen(){
 const p=useLocalSearchParams<{id?:string;role?:string;name?:string;grade?:string;code?:string}>();
 const [custom,setCustom]=useState<CustomExam[]>([]);
 const [answers,setAnswers]=useState<Record<string,string>>({}); const [submitted,setSubmitted]=useState(false);
 useEffect(()=>{getCustomExams().then(setCustom);},[]);
 const exam = [...exams,...custom].find(e=>e.id===p.id) || exams[0];
 const studentKey=(p.name||'طالب').trim(); const key=storageKeys.examAttempt(studentKey,exam.id); const teacher=p.role==='teacher';
 useEffect(()=>{ if(teacher)return; readJson<{answers:Record<string,string>;submitted:boolean}|null>(key,null).then(saved=>{if(saved){setAnswers(saved.answers||{});setSubmitted(!!saved.submitted);}}); },[key,teacher]);
 const submit=async()=>{
  if(Object.keys(answers).length<exam.questions.length)return Alert.alert('الاختبار غير مكتمل','أجب عن جميع الأسئلة قبل التسليم النهائي.');
  const autoScore=exam.questions.reduce((sum,q)=>sum+(q.answer && answers[q.id]?.trim()===q.answer.trim()?1:0),0);
  const result={examId:exam.id,examTitle:exam.title,subject:exam.subject,grade:exam.grade,score:autoScore,maxScore:exam.questions.filter(q=>!!q.answer).length,submittedAt:Date.now()};
  await writeJson(key,{answers,submitted:true,result});
  const old=await readJson<any[]>(storageKeys.results(studentKey),[]);
  await writeJson(storageKeys.results(studentKey),[...old.filter(x=>x.examId!==exam.id),result]);
  try{await saveExamAttempt({id:`${p.code||studentKey}-${exam.id}`,studentCode:p.code||studentKey,studentName:studentKey,grade:exam.grade,subject:exam.subject,examId:exam.id,examTitle:exam.title,answers,autoScore,maxAutoScore:exam.questions.filter(q=>!!q.answer).length,submittedAt:Date.now()});}catch{}
  setSubmitted(true);Alert.alert('تم التسليم',`تم حفظ المحاولة. الدرجة الآلية: ${autoScore}/${result.maxScore||0}`);
};
 if(submitted&&!teacher)return <Page title="تم تسليم الاختبار" subtitle={exam.title} onBack={()=>router.back()}><Card><Text style={{fontSize:19,fontWeight:'900',color:C.green,textAlign:'center'}}>✓ تم حفظ محاولة الطالب</Text><Text style={{textAlign:'right',color:C.muted,lineHeight:24,marginTop:12}}>تم حفظ جميع الإجابات، بما فيها الإجابات النصية.</Text></Card></Page>;
 return <Page title={teacher?'معاينة الاختبار':exam.title} subtitle={`${exam.subject} • ${exam.grade}`} onBack={()=>router.back()}><Card><Text style={{fontWeight:'800',color:C.navy,textAlign:'right'}}>المدة: {exam.duration} دقيقة</Text><Text style={{color:C.muted,textAlign:'right',marginTop:5}}>عدد الأسئلة: {exam.questions.length}</Text></Card><Section title="الأسئلة">{exam.questions.map((q:ExamQuestion,i)=><Card key={q.id}><Text style={{fontSize:16,fontWeight:'900',color:C.text,textAlign:'right',lineHeight:24}}>{i+1}. {q.question}</Text>{q.options?.map(o=><Pressable key={o} onPress={()=>setAnswers(a=>({...a,[q.id]:o}))} style={{padding:12,borderRadius:11,borderWidth:1,borderColor:answers[q.id]===o?C.blue:C.border,backgroundColor:answers[q.id]===o?'#eef4f8':'#fff',marginTop:8}}><Text style={{textAlign:'right',color:C.text,fontWeight:'700'}}>{answers[q.id]===o?'◉ ':'○ '}{o}</Text></Pressable>)}{q.type==='text'&&<TextInput multiline value={answers[q.id]||''} onChangeText={v=>setAnswers(a=>({...a,[q.id]:v}))} placeholder="اكتب إجابتك هنا..." placeholderTextColor="#98a2b3" textAlign="right" style={{minHeight:100,borderWidth:1,borderColor:C.border,borderRadius:12,padding:12,marginTop:10,textAlignVertical:'top'}}/>}</Card>)}</Section>{!teacher&&<Pressable onPress={submit} style={{backgroundColor:C.navy,borderRadius:14,padding:16,marginBottom:20}}><Text style={{color:'#fff',textAlign:'center',fontWeight:'900',fontSize:16}}>تسليم الاختبار النهائي 📝</Text></Pressable>}</Page>;
}
