import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { subjects, grades } from '../src/data';

type Subject = 'الكيمياء' | 'الفيزياء' | 'الأحياء';
type Grade = 'الأول الثانوي' | 'الثاني الثانوي';

type LessonCard = { title: string; summary: string; points: string[] };

const curriculum: Record<Grade, Record<Subject, LessonCard[]>> = {
  'الأول الثانوي': {
    'الكيمياء': [
      { title: 'المادة وخواصها', summary: 'التعرف على المادة وتصنيفها وخواصها الأساسية.', points: ['العنصر والمركب والمخلوط', 'الخواص الفيزيائية والكيميائية', 'التغير الفيزيائي والكيميائي'] },
      { title: 'الذرة ومكوناتها', summary: 'فهم تركيب الذرة والجسيمات الأساسية فيها.', points: ['البروتون والنيوترون والإلكترون', 'العدد الذري والعدد الكتلي', 'النظائر'] },
      { title: 'العناصر والجدول الدوري', summary: 'قراءة الجدول الدوري وفهم تنظيم العناصر.', points: ['المجموعات والدورات', 'الفلزات واللافلزات', 'الاتجاهات الدورية'] },
      { title: 'الروابط الكيميائية', summary: 'كيف تتحد الذرات لتكوين المركبات.', points: ['الرابطة الأيونية', 'الرابطة التساهمية', 'تمثيل المركبات'] },
      { title: 'التفاعلات الكيميائية', summary: 'التعرف على التفاعل الكيميائي وكتابته بصورة مبسطة.', points: ['المتفاعلات والنواتج', 'دلائل التفاعل', 'موازنة المعادلات'] },
      { title: 'المحاليل والمخاليط', summary: 'فهم المحاليل وطرق التعبير عن تركيزها.', points: ['المذاب والمذيب', 'الذوبان', 'التركيز'] },
    ],
    'الفيزياء': [
      { title: 'القياس والوحدات', summary: 'أساسيات القياس واستخدام الوحدات العلمية.', points: ['الكمية والوحدة', 'النظام الدولي', 'الدقة والقياس'] },
      { title: 'الحركة', summary: 'وصف حركة الأجسام باستخدام المسافة والزمن.', points: ['المسافة والإزاحة', 'السرعة', 'السرعة المتجهة'] },
      { title: 'القوة والحركة', summary: 'فهم تأثير القوى في حركة الأجسام.', points: ['القوة', 'الكتلة', 'قوانين نيوتن'] },
      { title: 'الشغل والطاقة', summary: 'العلاقة بين القوة والحركة والطاقة.', points: ['الشغل', 'الطاقة الحركية', 'طاقة الوضع'] },
      { title: 'الحرارة ودرجة الحرارة', summary: 'تمييز الحرارة عن درجة الحرارة وفهم انتقال الطاقة الحرارية.', points: ['درجة الحرارة', 'انتقال الحرارة', 'التغيرات الحرارية'] },
      { title: 'الكهرباء البسيطة', summary: 'مقدمة في التيار والجهد والدوائر الكهربائية.', points: ['التيار الكهربائي', 'فرق الجهد', 'الدائرة الكهربائية'] },
    ],
    'الأحياء': [
      { title: 'خصائص الحياة', summary: 'ما الذي يميز الكائنات الحية عن غيرها؟', points: ['النمو', 'التكاثر', 'الاستجابة والتنظيم'] },
      { title: 'التنظيم الحيوي', summary: 'مستويات تنظيم الكائن الحي.', points: ['الخلية', 'النسيج والعضو', 'الأجهزة الحيوية'] },
      { title: 'الخلية', summary: 'الخلية هي الوحدة الأساسية للحياة.', points: ['الغشاء الخلوي', 'السيتوبلازم', 'النواة والعضيات'] },
      { title: 'الخلايا النباتية والحيوانية', summary: 'مقارنة بين نوعي الخلايا ووظائف مكوناتهما.', points: ['الجدار الخلوي', 'البلاستيدات', 'الفجوات'] },
      { title: 'النقل عبر الغشاء', summary: 'كيف تدخل المواد إلى الخلية وتخرج منها؟', points: ['الانتشار', 'الأسموزية', 'النقل النشط'] },
      { title: 'الطاقة في الخلية', summary: 'كيف تحصل الخلايا على الطاقة وتستخدمها؟', points: ['ATP', 'التنفس الخلوي', 'البناء الضوئي'] },
    ],
  },
  'الثاني الثانوي': {
    'الكيمياء': [
      { title: 'الحسابات الكيميائية', summary: 'تطبيق العلاقات الكمية في التفاعلات الكيميائية.', points: ['المول', 'الكتلة المولية', 'النسب المولية'] },
      { title: 'المعادلات الكيميائية', summary: 'قراءة المعادلات وموازنتها وتفسيرها.', points: ['المعادلة الموزونة', 'المعاملات', 'العلاقات الكمية'] },
      { title: 'المحاليل والتركيز', summary: 'حساب تركيز المحاليل وتطبيقاته.', points: ['المولارية', 'التخفيف', 'تحضير المحاليل'] },
      { title: 'الأحماض والقواعد', summary: 'مقدمة في خواص الأحماض والقواعد وتفاعلاتها.', points: ['خواص الأحماض', 'خواص القواعد', 'التعادل'] },
      { title: 'الاتزان الكيميائي', summary: 'فهم الاتزان الديناميكي والعوامل المؤثرة فيه.', points: ['الاتزان', 'ثابت الاتزان', 'مبدأ لوشاتيليه'] },
      { title: 'الكيمياء العضوية', summary: 'التعرف على المركبات العضوية ومجموعاتها الأساسية.', points: ['الهيدروكربونات', 'المجموعات الوظيفية', 'تطبيقات المركبات العضوية'] },
    ],
    'الفيزياء': [
      { title: 'المتجهات والحركة', summary: 'تمثيل الكميات المتجهة وتحليل الحركة.', points: ['المتجهات', 'المركبات', 'الحركة في بعدين'] },
      { title: 'الدوران والعزم', summary: 'دراسة تأثير القوة في الأجسام الدوارة.', points: ['العزم', 'الاتزان الدوراني', 'مركز الكتلة'] },
      { title: 'الزخم والتصادمات', summary: 'فهم الزخم وحفظه في الأنظمة الفيزيائية.', points: ['الزخم', 'الدفع', 'حفظ الزخم'] },
      { title: 'الموجات', summary: 'خصائص الموجات وانتقال الطاقة.', points: ['الطول الموجي', 'التردد', 'سرعة الموجة'] },
      { title: 'الصوت والضوء', summary: 'دراسة الموجات الصوتية والضوئية وتطبيقاتها.', points: ['الصوت', 'الانعكاس', 'الانكسار'] },
      { title: 'الكهرباء والمغناطيسية', summary: 'مفاهيم أساسية في المجالات والدوائر.', points: ['المجال الكهربائي', 'المقاومة', 'المجال المغناطيسي'] },
    ],
    'الأحياء': [
      { title: 'الأنسجة والأعضاء', summary: 'تنظيم الخلايا في أنسجة وأعضاء متخصصة.', points: ['أنواع الأنسجة', 'الأعضاء', 'تكامل الأجهزة'] },
      { title: 'التغذية والهضم', summary: 'كيف يحصل الجسم على المواد اللازمة للنمو والطاقة.', points: ['الغذاء', 'الهضم', 'الامتصاص'] },
      { title: 'التنفس والدورة الدموية', summary: 'تبادل الغازات ونقل المواد داخل الجسم.', points: ['التنفس', 'الدم', 'الدورة الدموية'] },
      { title: 'الإخراج والاتزان الداخلي', summary: 'المحافظة على ثبات البيئة الداخلية للجسم.', points: ['الإخراج', 'الكلى', 'الاتزان الداخلي'] },
      { title: 'التكاثر والنمو', summary: 'أساسيات التكاثر والنمو في الكائنات الحية.', points: ['التكاثر الجنسي', 'التكاثر اللاجنسي', 'مراحل النمو'] },
      { title: 'الوراثة', summary: 'كيف تنتقل الصفات من جيل إلى آخر؟', points: ['الجينات', 'الكروموسومات', 'الصفات الوراثية'] },
    ],
  },
};

export default function CurriculumFlashcards() {
  const p = useLocalSearchParams<{ subject?: string; grade?: string; role?: string; name?: string; code?: string }>();
  const subject = (subjects.some(s => s.name === p.subject) ? p.subject : 'الكيمياء') as Subject;
  const grade = (p.grade === 'الثاني الثانوي' ? p.grade : 'الأول الثانوي') as Grade;
  const [index, setIndex] = useState(0);
  const [showPoints, setShowPoints] = useState(false);
  const cards = useMemo(() => curriculum[grade][subject], [grade, subject]);
  const card = cards[index] || cards[0];
  const goBack = () => router.back();
  const changeGrade = (next: Grade) => { setIndex(0); setShowPoints(false); router.setParams({ grade: next }); };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Pressable onPress={goBack}><Text style={s.back}>رجوع ›</Text></Pressable>
        <View style={s.hero}>
          <Text style={s.heroIcon}>{subject === 'الكيمياء' ? '⚗️' : subject === 'الفيزياء' ? '⚡' : '🧬'}</Text>
          <Text style={s.heroTitle}>البطاقات التفاعلية</Text>
          <Text style={s.heroSub}>{subject} • {grade}</Text>
        </View>
        <View style={s.gradeRow}>
          {grades.slice(0, 2).map(g => <Pressable key={g} onPress={() => changeGrade(g as Grade)} style={[s.gradeBtn, g === grade && s.gradeBtnActive]}><Text style={[s.gradeText, g === grade && s.gradeTextActive]}>{g}</Text></Pressable>)}
        </View>
        <Text style={s.counter}>البطاقة {index + 1} من {cards.length}</Text>
        <Pressable style={s.card} onPress={() => setShowPoints(v => !v)}>
          <Text style={s.cardIcon}>🎴</Text>
          <Text style={s.cardTitle}>{card.title}</Text>
          <Text style={s.summary}>{card.summary}</Text>
          <View style={s.divider} />
          {showPoints ? card.points.map((point, n) => <Text key={n} style={s.point}>• {point}</Text>) : <Text style={s.hint}>اضغط على البطاقة لإظهار أهم النقاط</Text>}
        </Pressable>
        <View style={s.navRow}>
          <Pressable style={s.navBtn} disabled={index === 0} onPress={() => { setIndex(v => Math.max(0, v - 1)); setShowPoints(false); }}><Text style={s.navText}>‹ السابقة</Text></Pressable>
          <Pressable style={s.navBtnPrimary} disabled={index === cards.length - 1} onPress={() => { setIndex(v => Math.min(cards.length - 1, v + 1)); setShowPoints(false); }}><Text style={s.navTextPrimary}>التالية ›</Text></Pressable>
        </View>
        <Text style={s.note}>البطاقات تعمل محليًا داخل التطبيق ولا تحتاج إلى اتصال بالإنترنت.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#f5f7fb'}, content:{padding:18,paddingBottom:45}, back:{color:'#356ae6',fontWeight:'900',fontSize:15,textAlign:'right',marginBottom:12},
  hero:{backgroundColor:'#17324d',borderRadius:24,padding:20,alignItems:'center',marginBottom:14}, heroIcon:{fontSize:44}, heroTitle:{fontSize:25,fontWeight:'900',color:'#fff',marginTop:7}, heroSub:{fontSize:13,color:'#dce8f5',marginTop:4},
  gradeRow:{flexDirection:'row-reverse',gap:8,marginBottom:10}, gradeBtn:{flex:1,backgroundColor:'#fff',borderRadius:12,padding:11,borderWidth:1,borderColor:'#d0d5dd'}, gradeBtnActive:{backgroundColor:'#356ae6',borderColor:'#356ae6'}, gradeText:{textAlign:'center',fontWeight:'800',color:'#344054',fontSize:12}, gradeTextActive:{color:'#fff'},
  counter:{textAlign:'right',color:'#667085',fontSize:12,marginBottom:8}, card:{backgroundColor:'#fff',borderRadius:22,padding:21,borderWidth:2,borderColor:'#f59e0b',minHeight:300,elevation:4}, cardIcon:{fontSize:42,textAlign:'center'}, cardTitle:{fontSize:23,fontWeight:'900',color:'#14213d',textAlign:'center',marginTop:10}, summary:{fontSize:14,color:'#475467',lineHeight:24,textAlign:'center',marginTop:10}, divider:{height:1,backgroundColor:'#eaecf0',marginVertical:16}, point:{fontSize:15,color:'#344054',textAlign:'right',lineHeight:28,fontWeight:'700'}, hint:{textAlign:'center',color:'#98a2b3',fontSize:12,marginTop:6},
  navRow:{flexDirection:'row-reverse',gap:10,marginTop:14}, navBtn:{flex:1,backgroundColor:'#fff',borderRadius:14,padding:14,borderWidth:1,borderColor:'#d0d5dd'}, navBtnPrimary:{flex:1,backgroundColor:'#17324d',borderRadius:14,padding:14}, navText:{textAlign:'center',fontWeight:'900',color:'#344054'}, navTextPrimary:{textAlign:'center',fontWeight:'900',color:'#fff'}, note:{textAlign:'center',color:'#667085',fontSize:11,marginTop:14,lineHeight:18}
});
