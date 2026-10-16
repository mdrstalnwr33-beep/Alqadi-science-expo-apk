import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { grades, subjects, type ExamQuestion, type Grade, type Subject } from '../src/data';
import { getCustomExams, saveCustomExams } from '../src/assessmentStore';
import { Action, Card, Page, Section, C } from '../src/ui';

type Draft = ExamQuestion & { optionsText: string };
const blank = (): Draft => ({ id: `q-${Date.now()}-${Math.random()}`, type: 'mcq', question: '', options: ['الخيار الأول','الخيار الثاني','الخيار الثالث','الخيار الرابع'], optionsText: 'الخيار الأول|الخيار الثاني|الخيار الثالث|الخيار الرابع', answer: '' });

export default function CreateExamScreen() {
  const p = useLocalSearchParams<{ grade?: string; subject?: string }>();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('30');
  const [subject, setSubject] = useState<Subject>((p.subject as Subject) || subjects[0].name);
  const [grade, setGrade] = useState<Grade>((p.grade as Grade) || grades[0]);
  const [questions, setQuestions] = useState<Draft[]>([blank()]);

  const update = (id: string, patch: Partial<Draft>) => setQuestions(items => items.map(q => q.id === id ? { ...q, ...patch } : q));
  const addQuestion = () => setQuestions(items => [...items, blank()]);
  const removeQuestion = (id: string) => setQuestions(items => items.length === 1 ? items : items.filter(q => q.id !== id));
  const save = async () => {
    if (!title.trim()) return Alert.alert('بيانات ناقصة', 'اكتب عنوان الاختبار.');
    if (questions.some(q => !q.question.trim())) return Alert.alert('أسئلة ناقصة', 'اكتب نص كل سؤال قبل النشر.');
    const normalized: ExamQuestion[] = questions.map(q => ({
      id: q.id,
      type: q.type,
      question: q.question.trim(),
      options: q.type === 'text' ? undefined : (q.type === 'tf' ? ['صح','خطأ'] : q.optionsText.split('|').map(x => x.trim()).filter(Boolean)),
      answer: q.type === 'text' ? undefined : q.answer?.trim(),
    }));
    if (normalized.some(q => (q.type !== 'text' && (!q.options || q.options.length < 2 || !q.answer)))) return Alert.alert('إجابة ناقصة', 'أكمل الخيارات والإجابة الصحيحة لكل سؤال موضوعي.');
    const current = await getCustomExams();
    await saveCustomExams([...current, { id: `custom-exam-${Date.now()}`, title: title.trim(), subject, grade, duration: Math.max(1, Number(duration) || 30), questions: normalized, createdAt: Date.now() }]);
    Alert.alert('تم النشر', 'تم إنشاء الاختبار وإضافة جميع الأسئلة.');
    router.back();
  };

  return <Page title="إنشاء اختبار" subtitle="أضف عددًا غير محدود من الأسئلة" onBack={() => router.back()}>
    <Card>
      <Text style={label}>عنوان الاختبار</Text><TextInput value={title} onChangeText={setTitle} placeholder="مثال: اختبار الوحدة الأولى" textAlign="right" style={input} />
      <Text style={label}>المادة</Text><View style={wrap}>{subjects.map(s => <Pressable key={s.name} onPress={() => setSubject(s.name)} style={[chip, subject === s.name && activeChip]}><Text style={chipText}>{s.name}</Text></Pressable>)}</View>
      <Text style={label}>الصف</Text><View style={wrap}>{grades.map(g => <Pressable key={g} onPress={() => setGrade(g)} style={[chip, grade === g && activeChip]}><Text style={chipText}>{g}</Text></Pressable>)}</View>
      <Text style={label}>المدة بالدقائق</Text><TextInput value={duration} onChangeText={setDuration} keyboardType="number-pad" textAlign="right" style={input} />
    </Card>
    <Section title={`الأسئلة (${questions.length})`}>
      {questions.map((q, index) => <Card key={q.id}>
        <View style={{ flexDirection:'row-reverse', justifyContent:'space-between', alignItems:'center' }}><Text style={questionTitle}>السؤال {index + 1}</Text>{questions.length > 1 && <Pressable onPress={() => removeQuestion(q.id)}><Text style={{ color:'#d92d20', fontWeight:'800' }}>حذف</Text></Pressable>}</View>
        <Text style={label}>نوع السؤال</Text><View style={wrap}>{[['mcq','اختيار من أربعة'],['tf','صح أو خطأ'],['text','إجابة نصية']].map(([type, name]) => <Pressable key={type} onPress={() => update(q.id, { type: type as Draft['type'], optionsText: type === 'tf' ? 'صح|خطأ' : q.optionsText, answer: type === 'tf' ? '' : q.answer })} style={[chip, q.type === type && activeChip]}><Text style={chipText}>{name}</Text></Pressable>)}</View>
        <Text style={label}>نص السؤال</Text><TextInput value={q.question} onChangeText={v => update(q.id,{question:v})} multiline placeholder="اكتب السؤال هنا" textAlign="right" style={[input,{minHeight:75,textAlignVertical:'top'}]} />
        {q.type !== 'text' && <><Text style={label}>{q.type === 'mcq' ? 'الخيارات (افصل بينها بعلامة |)' : 'الإجابة الصحيحة'}</Text>{q.type === 'mcq' && <TextInput value={q.optionsText} onChangeText={v => update(q.id,{optionsText:v})} placeholder="أ|ب|ج|د" textAlign="right" style={input} />}<TextInput value={q.answer} onChangeText={v => update(q.id,{answer:v})} placeholder={q.type === 'tf' ? 'صح أو خطأ' : 'اكتب الخيار الصحيح كما هو'} textAlign="right" style={input} /></>}
      </Card>)}
      <Action label="إضافة سؤال جديد" icon="＋" secondary onPress={addQuestion} />
    </Section>
    <Action label="نشر الاختبار للطلاب" icon="📝" onPress={save} />
  </Page>;
}
const label={fontSize:13,fontWeight:'800',color:C.text,textAlign:'right',marginBottom:6,marginTop:7} as const;
const input={borderWidth:1,borderColor:C.border,borderRadius:12,padding:11,color:C.text,marginBottom:6,backgroundColor:'#fff'} as const;
const wrap={flexDirection:'row-reverse',flexWrap:'wrap',gap:7,marginBottom:6} as const;
const chip={borderWidth:1,borderColor:C.border,borderRadius:10,paddingVertical:9,paddingHorizontal:11,backgroundColor:'#fff'} as const;
const activeChip={borderColor:C.blue,backgroundColor:'#eef4f8'} as const;
const chipText={color:C.text,fontWeight:'700',fontSize:12} as const;
const questionTitle={fontSize:17,fontWeight:'900',color:C.navy} as const;
