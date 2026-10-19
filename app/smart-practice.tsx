import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { exams, type ExamQuestion } from '../src/data';
import { getAdaptiveQuestionIds, getGamification, recordQuestionAnswers } from '../src/gamification';

const pool = exams.flatMap(exam => exam.questions.filter(q => !!q.answer && q.options).map(q => ({ ...q, key: `${exam.id}:${q.id}`, subject: exam.subject })));

export default function SmartPractice(){
 const p=useLocalSearchParams<{name?:string;code?:string}>();
 const student=(p.code||p.name||'طالب').trim();
 const [questions,setQuestions]=useState<typeof pool>([]);
 const [index,setIndex]=useState(0); const [selected,setSelected]=useState(''); const [score,setScore]=useState(0); const [done,setDone]=useState(false); const [loading,setLoading]=useState(true);
 useEffect(()=>{(async()=>{const ids=await getAdaptiveQuestionIds(student,pool.map(q=>q.key),5);const ordered=ids.map(id=>pool.find(q=>q.key===id)).filter(Boolean) as typeof pool;setQuestions(ordered);setLoading(false);})();},[student]);
 const q=questions[index];
 const progress=questions.length?Math.round(((index+(done?1:0))/questions.length)*100):0;
 const choose=(answer:string)=>{if(selected||done)return;setSelected(answer);};
 const next=async()=>{
  if(!q||!selected)return;
  const correct=selected.trim()===q.answer?.trim();
  if(correct)setScore(s=>s+1);
  await recordQuestionAnswers(student,[{id:q.key,correct}]);
  if(index+1>=questions.length){setDone(true);return;}
  setIndex(i=>i+1);setSelected('');
 };
 const reset=async()=>{const ids=await getAdaptiveQuestionIds(student,pool.map(x=>x.key),5);setQuestions(ids.map(id=>pool.find(x=>x.key===id)).filter(Boolean) as typeof pool);setIndex(0);setSelected('');setScore(0);setDone(false);};
 if(loading)return <SafeAreaView style={s.safe}><View style={s.center}><Text style={s.title}>جاري إعداد تدريبك الذكي… 🧠</Text></View></SafeAreaView>;
 if(done)return <SafeAreaView style={s.safe}><View style={s.result}><Text style={s.big}>🎉</Text><Text style={s.title}>انتهى التدريب الذكي</Text><Text style={s.score}>{score} / {questions.length}</Text><Text style={s.muted}>تم التركيز على الأسئلة التي تحتاج إلى مزيد من المراجعة، وتُحفظ النتائج على جهازك فقط.</Text><Pressable style={s.primary} onPress={reset}><Text style={s.primaryText}>تدريب جديد 🔁</Text></Pressable><Pressable style={s.secondary} onPress={()=>router.back()}><Text style={s.secondaryText}>العودة</Text></Pressable></View></SafeAreaView>;
 if(!q)return <SafeAreaView style={s.safe}><View style={s.center}><Text style={s.title}>لا توجد أسئلة قابلة للتدريب حاليًا.</Text><Pressable style={s.primary} onPress={()=>router.back()}><Text style={s.primaryText}>العودة</Text></Pressable></View></SafeAreaView>;
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}><View style={s.header}><Pressable onPress={()=>router.back()}><Text style={s.back}>‹</Text></Pressable><View style={{flex:1}}><Text style={s.eyebrow}>تدريب شخصي للطالب</Text><Text style={s.title}>🧠 التدريب الذكي</Text><Text style={s.muted}>{q.subject} • سؤال {index+1} من {questions.length}</Text></View></View><View style={s.track}><View style={[s.fill,{width:`${progress}%`}]} /></View><View style={s.card}><Text style={s.question}>{q.question}</Text>{q.options?.map(o=><Pressable key={o} onPress={()=>choose(o)} style={[s.option,selected===o&&{borderColor:'#356ae6',backgroundColor:'#eef4ff'},selected&&o===q.answer&&{borderColor:'#35a36b',backgroundColor:'#ecfdf3'}]}><Text style={s.optionText}>{selected===o?'◉ ':'○ '}{o}</Text></Pressable>)}{selected&&<Text style={[s.feedback,{color:selected===q.answer?'#17834f':'#b54708'}]}>{selected===q.answer?'✓ إجابة صحيحة — أحسنت!':'✗ ليست الإجابة الصحيحة. راجع هذا المفهوم وحاول مرة أخرى.'}</Text>}</View><Pressable disabled={!selected} onPress={next} style={[s.primary,!selected&&{opacity:.45}]}><Text style={s.primaryText}>{index+1===questions.length?'إنهاء التدريب':'السؤال التالي'} →</Text></Pressable></ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#f5f7fb'},content:{padding:18,paddingBottom:40},center:{flex:1,alignItems:'center',justifyContent:'center',padding:25},result:{flex:1,alignItems:'center',justifyContent:'center',padding:28},header:{flexDirection:'row-reverse',alignItems:'center',marginBottom:15},back:{fontSize:38,color:'#17324d',paddingHorizontal:8},eyebrow:{fontSize:12,color:'#667085',textAlign:'right'},title:{fontSize:25,fontWeight:'900',color:'#14213d',textAlign:'right'},muted:{fontSize:12,color:'#667085',textAlign:'right',lineHeight:20,marginTop:5},track:{height:8,backgroundColor:'#e4e7ec',borderRadius:8,overflow:'hidden',marginBottom:15},fill:{height:'100%',backgroundColor:'#356ae6'},card:{backgroundColor:'#fff',borderRadius:20,padding:17,borderWidth:1,borderColor:'#eaecf0'},question:{fontSize:18,fontWeight:'900',color:'#14213d',textAlign:'right',lineHeight:28,marginBottom:8},option:{padding:14,borderRadius:13,borderWidth:1,borderColor:'#d0d5dd',marginTop:9,backgroundColor:'#fff'},optionText:{fontSize:14,fontWeight:'700',color:'#344054',textAlign:'right'},feedback:{fontWeight:'800',textAlign:'right',marginTop:13,lineHeight:22},primary:{backgroundColor:'#17324d',borderRadius:14,padding:16,marginTop:15,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'900',fontSize:16},secondary:{padding:15,marginTop:8,alignItems:'center'},secondaryText:{color:'#356ae6',fontWeight:'900'},big:{fontSize:60},score:{fontSize:38,fontWeight:'900',color:'#17324d',marginTop:8}});
