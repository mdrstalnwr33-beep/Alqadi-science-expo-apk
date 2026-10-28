import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { grades, subjects, type Grade, type Subject } from '../src/data';
import { getCustomHomework, saveCustomHomework, type HomeworkQuestion } from '../src/assessmentStore';
import { publishHomework, publishNotice } from '../src/contentCloud';
import { Action, Card, Page, Section, C } from '../src/ui';

type Draft = HomeworkQuestion & { optionsText: string };
const blank = (): Draft => ({
  id: `hq-${Date.now()}-${Math.random()}`,
  type: 'mcq',
  question: '',
  options: ['الخيار الأول','الخيار الثاني','الخيار الثالث','الخيار الرابع'],
  optionsText: 'الخيار الأول|الخيار الثاني|الخيار الثالث|الخيار الرابع',
  answer: '',
});

export default function CreateHomeworkScreen() {
  const p = useLocalSearchParams<{ grade?: string; subject?: string }>();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('نهاية هذا الأسبوع');
  const [note, setNote] = useState('');
  const [subject, setSubject] = useState<Subject>((p.subject as Subject) || subjects[0].name);
  const [grade, setGrade] = useState<Grade>((p.grade as Grade) || grades[0]);
  const [questions, setQuestions] = useState<Draft[]>([blank()]);

  const update = (id: string, patch: Partial<Draft>) => setQuestions(items => items.map(q => q.id === id ? { ...q, ...patch } : q));
  const addQuestion = () => setQuestions(items => [...items, blank()]);
  const removeQuestion = (id: string) => setQuestions(items => items.length === 1 ? items : items.filter(q => q.id !== id));

  const save = async () => {
    if (!title.trim()) return Alert.alert('بيانات ناقصة','اكتب عنوان الواجب.');
    if (questions.some(q => !q.question.trim())) return Alert.alert('أسئلة ناقصة','اكتب نص كل سؤال قبل النشر.');
    const normalized: HomeworkQuestion[] = questions.map(q => ({
      id: q.id,
      type: q.type,
      question: q.question.trim(),
      options: q.type === 'text' ? undefined : (q.type === 'tf' ? ['صح','خطأ'] : q.optionsText.split('|').map(x => x.trim()).filter(Boolean)),
      answer: q.type === 'text' ? undefined : q.answer?.trim(),
    }));
    if (normalized.some(q => q.type !== 'text' && (!q.options || q.options.length < 2 || !q.answer))) {
      return Alert.alert('إجابة ناقصة','أكمل الخيارات والإجابة الصحيحة لكل سؤال موضوعي.');
    }
    const current = await getCustomHomework();
    const targetGrade = (p.grade as Grade) || grade;
    const item = {
      id: `custom-hw-${Date.now()}`,
      title: title.trim(),
      subject,
      grade: targetGrade,
      due: due.trim() || 'غير محدد',
      note: note.trim() || 'أجب عن جميع الأسئلة بوضوح.',
      questions: normalized,
      createdAt: Date.now(),
    };
    await saveCustomHomework([...current, item]);
    try {
      await publishHomework(item);
      await publishNotice({ id:`notice-${item.id}`, grade:targetGrade, title:`واجب جديد في ${subject}`, body:item.title, createdAt:Date.now() });
      Alert.alert('تم النشر السحابي','وصل الواجب إلى طلاب الصف.');
    } catch (error) {
      const code=String((error as any)?.code||'unknown');
      Alert.alert('تعذر النشر السحابي',code.includes('permission-denied')?'صلاحيات Firestore غير منشورة. افتح FIREBASE_DEPLOY.md وانشر firestore.rules.':`تعذر الاتصال بالسحابة (${code}).`);
    }
    router.back();
  };

  return <Page title="إنشاء واجب" subtitle="أضف أسئلة متنوعة للطلاب" onBack={()=>router.back()}>
    <Card>
      <Text style={label}>عنوان الواجب</Text><TextInput value={title} onChangeText={setTitle} placeholder="مثال: واجب الوحدة الأولى" textAlign="right" style={input}/>
      <Text style={label}>المادة</Text><View style={wrap}>{subjects.map(s=><Pressable key={s.name} onPress={()=>setSubject(s.name)} style={[chip,subject===s.name&&active]}><Text style={chipText}>{s.name}</Text></Pressable>)}</View>
      <Text style={label}>الصف المرتبط بهذا المحتوى</Text>{p.grade?<Text style={{color:C.navy,fontWeight:'900',textAlign:'right',paddingVertical:10}}>{p.grade}</Text>:<View style={wrap}>{grades.map(g=><Pressable key={g} onPress={()=>setGrade(g)} style={[chip,grade===g&&active]}><Text style={chipText}>{g}</Text></Pressable>)}</View>}
      <Text style={label}>موعد التسليم</Text><TextInput value={due} onChangeText={setDue} placeholder="مثال: 25 أكتوبر" textAlign="right" style={input}/>
      <Text style={label}>ملاحظة للطلاب</Text><TextInput value={note} onChangeText={setNote} multiline placeholder="تعليمات أو ملاحظات إضافية" textAlign="right" style={[input,{minHeight:75,textAlignVertical:'top'}]}/>
    </Card>
    <Section title={`الأسئلة (${questions.length})`}>
      {questions.map((q,index)=><Card key={q.id}>
        <View style={{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center'}}><Text style={questionTitle}>السؤال {index+1}</Text>{questions.length>1&&<Pressable onPress={()=>removeQuestion(q.id)}><Text style={{color:'#d92d20',fontWeight:'800'}}>حذف</Text></Pressable>}</View>
        <Text style={label}>نوع السؤال</Text>
        <View style={wrap}>{[['mcq','اختيار من متعدد'],['tf','صح أو خطأ'],['text','إجابة نصية']].map(([type,name])=><Pressable key={type} onPress={()=>update(q.id,{type:type as Draft['type'],optionsText:type==='tf'?'صح|خطأ':q.optionsText,answer:type==='tf'?'':q.answer})} style={[chip,q.type===type&&active]}><Text style={chipText}>{name}</Text></Pressable>)}</View>
        <Text style={label}>نص السؤال</Text><TextInput value={q.question} onChangeText={v=>update(q.id,{question:v})} multiline placeholder="اكتب السؤال هنا" textAlign="right" style={[input,{minHeight:75,textAlignVertical:'top'}]}/>
        {q.type==='mcq'&&<><Text style={label}>الخيارات (افصل بينها بعلامة |)</Text><TextInput value={q.optionsText} onChangeText={v=>update(q.id,{optionsText:v})} placeholder="أ|ب|ج|د" textAlign="right" style={input}/><Text style={label}>الإجابة الصحيحة</Text><TextInput value={q.answer} onChangeText={v=>update(q.id,{answer:v})} placeholder="اكتب الخيار الصحيح كما هو" textAlign="right" style={input}/></>}
        {q.type==='tf'&&<><Text style={label}>الإجابة الصحيحة</Text><View style={wrap}>{['صح','خطأ'].map(v=><Pressable key={v} onPress={()=>update(q.id,{answer:v})} style={[chip,q.answer===v&&active]}><Text style={chipText}>{v}</Text></Pressable>)}</View></>}
      </Card>)}
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
