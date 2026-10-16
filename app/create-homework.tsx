import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { grades, subjects, type Grade, type Subject } from '../src/data';
import { getCustomHomework, saveCustomHomework } from '../src/assessmentStore';
import { Action, Card, Page, Section, C } from '../src/ui';

export default function CreateHomeworkScreen() {
  const p = useLocalSearchParams<{ grade?: string; subject?: string }>();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('نهاية هذا الأسبوع');
  const [note, setNote] = useState('');
  const [subject, setSubject] = useState<Subject>((p.subject as Subject) || subjects[0].name);
  const [grade, setGrade] = useState<Grade>((p.grade as Grade) || grades[0]);
  const [questions, setQuestions] = useState<string[]>(['']);
  const updateQuestion = (i:number, value:string) => setQuestions(items => items.map((q,index)=>index===i?value:q));
  const addQuestion = () => setQuestions(items => [...items, '']);
  const removeQuestion = (i:number) => setQuestions(items => items.length===1?items:items.filter((_,index)=>index!==i));
  const save = async () => {
    if (!title.trim()) return Alert.alert('بيانات ناقصة','اكتب عنوان الواجب.');
    const clean = questions.map(q=>q.trim()).filter(Boolean);
    if (!clean.length) return Alert.alert('أسئلة ناقصة','أضف سؤالًا واحدًا على الأقل.');
    const current = await getCustomHomework();
    await saveCustomHomework([...current,{id:`custom-hw-${Date.now()}`,title:title.trim(),subject,grade,due:due.trim()||'غير محدد',note:note.trim()||'أجب عن جميع الأسئلة بوضوح.',questions:clean,createdAt:Date.now()}]);
    Alert.alert('تم النشر','تم إنشاء الواجب وإضافة جميع الأسئلة.');
    router.back();
  };
  return <Page title="إنشاء واجب" subtitle="أضف أسئلة متعددة للطلاب" onBack={()=>router.back()}>
    <Card>
      <Text style={label}>عنوان الواجب</Text><TextInput value={title} onChangeText={setTitle} placeholder="مثال: واجب الوحدة الأولى" textAlign="right" style={input}/>
      <Text style={label}>المادة</Text><View style={wrap}>{subjects.map(s=><Pressable key={s.name} onPress={()=>setSubject(s.name)} style={[chip,subject===s.name&&active]}><Text style={chipText}>{s.name}</Text></Pressable>)}</View>
      <Text style={label}>الصف</Text><View style={wrap}>{grades.map(g=><Pressable key={g} onPress={()=>setGrade(g)} style={[chip,grade===g&&active]}><Text style={chipText}>{g}</Text></Pressable>)}</View>
      <Text style={label}>موعد التسليم</Text><TextInput value={due} onChangeText={setDue} placeholder="مثال: 25 أكتوبر" textAlign="right" style={input}/>
      <Text style={label}>ملاحظة للطلاب</Text><TextInput value={note} onChangeText={setNote} multiline placeholder="تعليمات أو ملاحظات إضافية" textAlign="right" style={[input,{minHeight:75,textAlignVertical:'top'}]}/>
    </Card>
    <Section title={`الأسئلة (${questions.length})`}>
      {questions.map((q,i)=><Card key={i}><View style={{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center'}}><Text style={questionTitle}>السؤال {i+1}</Text>{questions.length>1&&<Pressable onPress={()=>removeQuestion(i)}><Text style={{color:'#d92d20',fontWeight:'800'}}>حذف</Text></Pressable>}</View><TextInput value={q} onChangeText={v=>updateQuestion(i,v)} multiline placeholder="اكتب سؤال الواجب هنا" textAlign="right" style={[input,{minHeight:85,textAlignVertical:'top',marginTop:10}]}/></Card>)}
      <Action label="إضافة سؤال جديد" icon="＋" secondary onPress={addQuestion}/>
    </Section>
    <Action label="نشر الواجب للطلاب" icon="✓" onPress={save}/>
  </Page>;
}
const label={fontSize:13,fontWeight:'800',color:C.text,textAlign:'right',marginBottom:6,marginTop:7} as const;
const input={borderWidth:1,borderColor:C.border,borderRadius:12,padding:11,color:C.text,marginBottom:6,backgroundColor:'#fff'} as const;
const wrap={flexDirection:'row-reverse',flexWrap:'wrap',gap:7,marginBottom:6} as const;
const chip={borderWidth:1,borderColor:C.border,borderRadius:10,paddingVertical:9,paddingHorizontal:11,backgroundColor:'#fff'} as const;
const active={borderColor:C.blue,backgroundColor:'#eef4f8'} as const;
const chipText={color:C.text,fontWeight:'700',fontSize:12} as const;
const questionTitle={fontSize:17,fontWeight:'900',color:C.navy} as const;
