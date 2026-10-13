import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, firebaseReady, storage } from './src/firebaseConfig';

const SESSION_KEY = '@alqadi_session_v2';
const STORE_KEY = '@alqadi_store_v2';
const TEACHER_CODE = process.env.EXPO_PUBLIC_TEACHER_CODE || 'ALQADI-TEACHER';

const LEVELS = [
  { id: 'first', title: 'الأول الثانوي', short: 'الأول', color: '#1664d8', icon: '١' },
  { id: 'second', title: 'الثاني الثانوي', short: 'الثاني', color: '#0f9f76', icon: '٢' },
  { id: 'third', title: 'الثالث الثانوي', short: 'الثالث', color: '#7c3aed', icon: '٣' },
];
const SUBJECTS = [
  { id: 'chemistry', title: 'الكيمياء', color: '#0f9f76', icon: '⚗' },
  { id: 'physics', title: 'الفيزياء', color: '#2563eb', icon: '◈' },
  { id: 'biology', title: 'الأحياء', color: '#7c3aed', icon: '✣' },
];
const CATEGORIES = [
  { id: 'books', title: 'الكتب والملازم', icon: '▣', color: '#d97706' },
  { id: 'lessons', title: 'الدروس اليومية', icon: '▤', color: '#2563eb' },
  { id: 'homework', title: 'الواجبات المدرسية', icon: '✓', color: '#0f9f76' },
  { id: 'exams', title: 'الاختبارات الشهرية', icon: '⌘', color: '#dc4163' },
  { id: 'grades', title: 'درجات الطالب', icon: '★', color: '#7c3aed' },
  { id: 'top', title: 'الطلاب الأوائل', icon: '♛', color: '#b7791f' },
];

const initialStore = {
  students: [
    { id: 's1', name: 'طالب تجريبي', code: '2026-01', level: 'first', active: true },
    { id: 's2', name: 'طالب الثاني', code: '2026-02', level: 'second', active: true },
    { id: 's3', name: 'طالب الثالث', code: '2026-03', level: 'third', active: true },
  ],
  content: {
    first: { chemistry: sampleContent('الكيمياء'), physics: sampleContent('الفيزياء'), biology: sampleContent('الأحياء') },
    second: { chemistry: sampleContent('الكيمياء'), physics: sampleContent('الفيزياء'), biology: sampleContent('الأحياء') },
    third: { chemistry: sampleContent('الكيمياء'), physics: sampleContent('الفيزياء'), biology: sampleContent('الأحياء') },
  },
  topStudents: { first: ['الطالب الأول', 'الطالب الثاني', 'الطالب الثالث'], second: [], third: [] },
};
function sampleContent(subject) {
  return {
    books: [{ id: `${subject}-book`, title: `ملزمة ${subject} - الفصل الأول`, detail: 'ملف دراسي متاح للقراءة والتنزيل', type: 'pdf' }],
    lessons: [{ id: `${subject}-lesson`, title: `مدخل إلى ${subject}`, detail: 'شرح الدرس مع ملخص وأسئلة تدريبية', type: 'text', body: `هذا درس تمهيدي في مادة ${subject}.` }],
    homework: [], exams: [], grades: [],
  };
}

export default function App() {
  const [screen, setScreen] = useState('landing');
  const [session, setSession] = useState(null);
  const [store, setStore] = useState(initialStore);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', title: '', body: '' });
  const [notice, setNotice] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const savedStore = await AsyncStorage.getItem(STORE_KEY);
        const savedSession = await AsyncStorage.getItem(SESSION_KEY);
        if (savedStore) setStore(JSON.parse(savedStore));
        if (savedSession) {
          const active = JSON.parse(savedSession);
          setSession(active);
          setScreen(active.role === 'teacher' ? 'teacherLevels' : 'studentHome');
          if (active.level) setSelectedLevel(active.level);
        }
      } catch (e) { /* تشغيل محلي آمن حتى لو لم تتوفر الذاكرة */ }
      setHydrated(true);
    })();
  }, []);
  useEffect(() => { if (hydrated) AsyncStorage.setItem(STORE_KEY, JSON.stringify(store)); }, [store, hydrated]);
  useEffect(() => { if (hydrated && session) AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session)); }, [session, hydrated]);

  const level = LEVELS.find((item) => item.id === selectedLevel);
  const subject = SUBJECTS.find((item) => item.id === selectedSubject);
  const category = CATEGORIES.find((item) => item.id === selectedCategory);
  const levelStudents = useMemo(() => store.students.filter((s) => s.level === selectedLevel), [store.students, selectedLevel]);

  const go = (next, values = {}) => { Object.entries(values).forEach(([key, value]) => { if (key === 'level') setSelectedLevel(value); if (key === 'subject') setSelectedSubject(value); if (key === 'category') setSelectedCategory(value); }); setScreen(next); };
  const showError = (message) => Alert.alert('تنبيه', message);
  const saveSession = (next) => { setSession(next); setNotice(`مرحبًا ${next.name || 'بك'}`); };
  const logout = async () => { await AsyncStorage.removeItem(SESSION_KEY); setSession(null); setSelectedLevel(null); setSelectedSubject(null); setScreen('landing'); };

  const studentLogin = async () => {
    const clean = code.trim().toUpperCase();
    if (!clean) return showError('أدخل كود الطالب');
    setBusy(true);
    try {
      let student = store.students.find((item) => item.code.toUpperCase() === clean && item.active);
      if (firebaseReady) {
        const snap = await getDocs(query(collection(db, 'students'), where('code', '==', clean)));
        if (!snap.empty) student = { id: snap.docs[0].id, ...snap.docs[0].data() };
      }
      if (!student) return showError('الكود غير صحيح أو الحساب موقوف');
      saveSession({ role: 'student', id: student.id, name: student.name, code: student.code, level: student.level || 'first' });
      setSelectedLevel(student.level || 'first'); setScreen('studentHome');
    } catch (e) { showError('تعذر الاتصال بالسحابة، تحقق من إعدادات Firebase.'); }
    finally { setBusy(false); }
  };
  const teacherLogin = () => {
    if (teacherCode.trim() !== TEACHER_CODE) return showError('رمز المعلم غير صحيح');
    saveSession({ role: 'teacher', name: 'الأستاذ محمد القاضي' }); setScreen('teacherLevels');
  };
  const addStudent = async () => {
    if (!form.name.trim() || !form.code.trim() || !selectedLevel) return showError('أدخل الاسم والكود واختر المستوى');
    const item = { id: `local-${Date.now()}`, name: form.name.trim(), code: form.code.trim().toUpperCase(), level: selectedLevel, active: true };
    if (store.students.some((s) => s.code === item.code)) return showError('هذا الكود مستخدم مسبقًا');
    setStore((prev) => ({ ...prev, students: [...prev.students, item] }));
    if (firebaseReady) { try { await addDoc(collection(db, 'students'), item); } catch (e) { showError('حُفظ محليًا، لكن تعذر رفعه للسحابة.'); } }
    setForm({ name: '', code: '', title: '', body: '' }); Alert.alert('تمت الإضافة', 'تم إنشاء حساب الطالب وتفعيله.');
  };
  const toggleStudent = (id) => setStore((prev) => ({ ...prev, students: prev.students.map((s) => s.id === id ? { ...s, active: !s.active } : s) }));
  const deleteStudent = (id) => Alert.alert('تأكيد الحذف', 'سيتم حذف الطالب من القائمة المحلية.', [{ text: 'إلغاء' }, { text: 'حذف', style: 'destructive', onPress: () => setStore((prev) => ({ ...prev, students: prev.students.filter((s) => s.id !== id) })) }]);
  const addContent = (type) => {
    if (!form.title.trim()) return showError('اكتب عنوان المحتوى أولًا');
    const item = { id: `content-${Date.now()}`, title: form.title.trim(), body: form.body.trim(), detail: 'أضيف حديثًا من لوحة المعلم', type: type === 'books' ? 'pdf' : 'text', downloaded: false };
    setStore((prev) => ({ ...prev, content: { ...prev.content, [selectedLevel]: { ...prev.content[selectedLevel], [selectedSubject]: { ...prev.content[selectedLevel][selectedSubject], [type]: [...(prev.content[selectedLevel][selectedSubject][type] || []), item] } } } }));
    setForm({ name: '', code: '', title: '', body: '' }); Alert.alert('تم الحفظ', 'ظهر المحتوى الآن لطلاب المستوى المحدد.');
  };
  const uploadPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!firebaseReady || !storage) { setForm((f) => ({ ...f, title: asset.name })); return showError('تم اختيار الملف. فعّل Firebase Storage لرفعه سحابيًا.'); }
      setBusy(true);
      const blob = await (await fetch(asset.uri)).blob();
      const fileRef = ref(storage, `materials/${selectedLevel}/${selectedSubject}/${Date.now()}-${asset.name}`);
      await uploadBytes(fileRef, blob, { contentType: 'application/pdf' });
      const url = await getDownloadURL(fileRef);
      const item = { id: `pdf-${Date.now()}`, title: asset.name, body: url, detail: 'ملف PDF مرفوع إلى Firebase Storage', type: 'pdf', url };
      setStore((prev) => ({ ...prev, content: { ...prev.content, [selectedLevel]: { ...prev.content[selectedLevel], [selectedSubject]: { ...prev.content[selectedLevel][selectedSubject], books: [...(prev.content[selectedLevel][selectedSubject].books || []), item] } } } }));
      Alert.alert('تم الرفع', 'تم رفع ملف PDF إلى التخزين السحابي.');
    } catch (e) { showError('تعذر رفع الملف. تحقق من قواعد Firebase Storage.'); }
    finally { setBusy(false); }
  };
  const downloadItem = async (item) => {
    if (!item.url) { setNotice('هذا محتوى نصي، وتم حفظه للقراءة دون اتصال.'); return; }
    try { const target = `${FileSystem.documentDirectory}${item.id}.pdf`; await FileSystem.downloadAsync(item.url, target); setNotice('تم تنزيل الملف وحفظه على الهاتف.'); } catch (e) { showError('تعذر تنزيل الملف حاليًا.'); }
  };

  if (!hydrated) return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color="#1f5eff" /></SafeAreaView>;
  if (screen === 'landing') return <Landing onStudent={() => setScreen('studentLogin')} onTeacher={() => setScreen('teacherLogin')} onAbout={() => setScreen('about')} />;
  if (screen === 'studentLogin') return <Auth title="دخول الطالب" helper="سيظهر لك مستواك فقط بعد تسجيل الدخول" value={code} setValue={setCode} onSubmit={studentLogin} onBack={() => setScreen('landing')} button="دخول الطالب" loading={busy} />;
  if (screen === 'teacherLogin') return <Auth title="دخول المعلم" helper="إدارة المستويات والطلاب والمحتوى" value={teacherCode} setValue={setTeacherCode} onSubmit={teacherLogin} onBack={() => setScreen('landing')} button="فتح لوحة المعلم" />;
  if (screen === 'about') return <About onBack={() => setScreen('landing')} />;
  if (session?.role === 'student' && screen === 'studentHome') return <StudentHome session={session} level={level} notice={notice} subjects={SUBJECTS} onSubject={(id) => go('studentSubject', { subject: id })} onLogout={logout} />;
  if (session?.role === 'student' && screen === 'studentSubject') return <StudentSubject level={level} subject={subject} category={category} selectedCategory={selectedCategory} content={store.content[selectedLevel]?.[selectedSubject]} onCategory={(id) => go('studentContent', { category: id })} onBack={() => { setSelectedCategory(null); setScreen('studentHome'); }} onLogout={logout} />;
  if (session?.role === 'student' && screen === 'studentContent') return <StudentContent level={level} subject={subject} category={category} items={store.content[selectedLevel]?.[selectedSubject]?.[selectedCategory] || []} top={store.topStudents[selectedLevel] || []} student={session} onDownload={downloadItem} onBack={() => { setSelectedCategory(null); setScreen('studentSubject'); }} />;
  if (session?.role === 'teacher' && screen === 'teacherLevels') return <TeacherLevels onLevel={(id) => go('teacherLevel', { level: id })} onLogout={logout} />;
  if (session?.role === 'teacher' && screen === 'teacherLevel') return <TeacherLevel level={level} students={levelStudents} onStudents={() => setScreen('teacherStudents')} onSubject={(id) => go('teacherSubject', { subject: id })} top={store.topStudents[selectedLevel] || []} onBack={() => setScreen('teacherLevels')} onLogout={logout} />;
  if (session?.role === 'teacher' && screen === 'teacherStudents') return <TeacherStudents level={level} students={levelStudents} form={form} setForm={setForm} onAdd={addStudent} onToggle={toggleStudent} onDelete={deleteStudent} onBack={() => setScreen('teacherLevel')} />;
  if (session?.role === 'teacher' && screen === 'teacherSubject') return <TeacherSubject level={level} subject={subject} category={category} items={store.content[selectedLevel]?.[selectedSubject]} form={form} setForm={setForm} onCategory={(id) => setSelectedCategory(id)} onAdd={addContent} onUpload={uploadPdf} onBack={() => { setSelectedCategory(null); setScreen('teacherLevel'); }} loading={busy} />;
  return <Landing onStudent={() => setScreen('studentLogin')} onTeacher={() => setScreen('teacherLogin')} onAbout={() => setScreen('about')} />;
}

function Landing({ onStudent, onTeacher, onAbout }) { return <SafeAreaView style={styles.container}><StatusBar barStyle="light-content" backgroundColor="#12233f" /><ScrollView contentContainerStyle={styles.landing}><View style={styles.logo}><Text style={styles.logoText}>ق</Text></View><Text style={styles.school}>منصة تعليمية متخصصة في العلوم</Text><Text style={styles.appTitle}>تطبيق القاضي للعلوم</Text><Text style={styles.subtitle}>تعلم منظم لكل مستوى دراسي</Text><View style={styles.actionStack}><BigAction title="دخول الطالب" icon="◉" color="#1f5eff" onPress={onStudent} /><BigAction title="دخول المعلم" icon="⌘" color="#0f9f76" onPress={onTeacher} /><BigAction title="عن الأستاذ محمد القاضي" icon="ⓘ" color="#7c3aed" onPress={onAbout} /></View></ScrollView></SafeAreaView>; }
function Auth({ title, helper, value, setValue, onSubmit, onBack, button, loading }) { return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.loginPage}><View style={styles.logo}><Text style={styles.logoText}>ق</Text></View><Text style={styles.appTitle}>{title}</Text><Text style={styles.subtitle}>{helper}</Text><View style={styles.loginCard}><TextInput style={styles.input} placeholder={title === 'دخول الطالب' ? 'كود التسجيل' : 'رمز المعلم'} placeholderTextColor="#8b9ab0" value={value} onChangeText={setValue} secureTextEntry={title !== 'دخول الطالب'} autoCapitalize="characters" textAlign="right" /><PrimaryButton label={button} onPress={onSubmit} loading={loading} /><SecondaryButton label="العودة للرئيسية" onPress={onBack} /></View></ScrollView></SafeAreaView>; }
function About({ onBack }) { return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.content}><Image source={require('./app-profile.jpg')} style={styles.profileImage} /><Text style={styles.aboutTitle}>الأستاذ محمد القاضي</Text><Text style={styles.aboutRole}>معلم ومؤسس منصة القاضي للعلوم</Text><View style={styles.panel}><Text style={styles.aboutText}>منصة تعليمية عربية تهدف إلى تبسيط العلوم وتوفير محتوى منظم وعملي لطلاب المرحلة الثانوية، مع متابعة مستمرة للواجبات والاختبارات والنتائج.</Text><Text style={styles.aboutText}>الرؤية: تعليم واضح، محتوى موثوق، ومتابعة تساعد كل طالب على التقدم.</Text></View><SecondaryButton label="العودة للرئيسية" onPress={onBack} /></ScrollView></SafeAreaView>; }
function StudentHome({ session, level, subjects, notice, onSubject, onLogout }) { return <SafeAreaView style={styles.container}><Header title={`مرحبًا، ${session.name}`} sub={`${level?.title} • تظهر لك مواد مستواك فقط`} /><ScrollView contentContainerStyle={styles.content}>{notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View> : null}<View style={styles.welcome}><Text style={styles.welcomeTitle}>رحلتك العلمية</Text><Text style={styles.welcomeText}>اختر المادة للوصول إلى الدروس والكتب والاختبارات والدرجات.</Text></View>{subjects.map((item) => <TouchableOpacity key={item.id} style={[styles.subjectCard, { backgroundColor: item.color }]} onPress={() => onSubject(item.id)}><Text style={styles.subjectIcon}>{item.icon}</Text><View style={styles.subjectCopy}><Text style={styles.subjectTitle}>{item.title}</Text><Text style={styles.subjectDesc}>كتب • دروس • واجبات • اختبارات • نتائج</Text></View><Text style={styles.cardArrow}>‹</Text></TouchableOpacity>)}<SecondaryButton label="تسجيل الخروج" onPress={onLogout} /></ScrollView></SafeAreaView>; }
function StudentSubject({ level, subject, category, selectedCategory, content, onCategory, onBack, onLogout }) { return <SafeAreaView style={styles.container}><Header title={`${subject.icon} ${subject.title}`} sub={level.title} back onBack={onBack} /><ScrollView contentContainerStyle={styles.content}>{!selectedCategory ? <><Text style={styles.listTitle}>محتويات المادة</Text>{CATEGORIES.map((item) => <TouchableOpacity key={item.id} style={styles.categoryRow} onPress={() => onCategory(item.id)}><View style={[styles.categoryIcon, { backgroundColor: item.color }]}><Text style={styles.categoryIconText}>{item.icon}</Text></View><View style={styles.categoryCopy}><Text style={styles.categoryTitle}>{item.title}</Text><Text style={styles.categoryMeta}>{item.id === 'top' ? 'ترتيب الطلاب الأوائل' : `${content?.[item.id]?.length || 0} عناصر متاحة`}</Text></View><Text style={styles.chevron}>‹</Text></TouchableOpacity>)}<SecondaryButton label="تسجيل الخروج" onPress={onLogout} /></> : null}</ScrollView></SafeAreaView>; }
function StudentContent({ level, subject, category, items, top, student, onDownload, onBack }) { return <SafeAreaView style={styles.container}><Header title={category.title} sub={`${subject.title} • ${level.title}`} back onBack={onBack} /><ScrollView contentContainerStyle={styles.content}>{category.id === 'top' ? <TopList names={top} /> : category.id === 'grades' ? <View style={styles.empty}><Text style={styles.emptyTitle}>درجاتي</Text><Text style={styles.emptyText}>ستظهر درجات الواجبات والاختبارات هنا عند اعتمادها من المعلم.</Text></View> : items.length ? items.map((item) => <View style={styles.materialRow} key={item.id}><View style={styles.materialCopy}><Text style={styles.materialTitle}>{item.title}</Text><Text style={styles.materialMeta}>{item.detail}</Text>{item.body && category.id === 'lessons' ? <Text style={styles.materialBody}>{item.body}</Text> : null}</View><TouchableOpacity style={styles.downloadButton} onPress={() => onDownload(item)}><Text style={styles.downloadText}>{item.url ? 'تنزيل' : 'حفظ'}</Text></TouchableOpacity></View>) : <View style={styles.empty}><Text style={styles.emptyTitle}>لا يوجد محتوى بعد</Text><Text style={styles.emptyText}>سيظهر المحتوى هنا فور إضافته من لوحة المعلم.</Text></View>}</ScrollView></SafeAreaView>; }
function TopList({ names }) { return <View>{names.length ? names.map((name, index) => <View style={styles.topRow} key={`${name}-${index}`}><Text style={styles.rank}>{index + 1}</Text><Text style={styles.topName}>{name}</Text><Text style={styles.medal}>{['🥇', '🥈', '🥉'][index]}</Text></View>) : <View style={styles.empty}><Text style={styles.emptyText}>لم يتم اعتماد لوحة الشرف بعد.</Text></View>}</View>; }
function TeacherLevels({ onLevel, onLogout }) { return <SafeAreaView style={styles.container}><Header title="لوحة المعلم" sub="اختر المستوى الدراسي لإدارته" /><ScrollView contentContainerStyle={styles.content}>{LEVELS.map((item) => <TouchableOpacity key={item.id} style={[styles.levelCard, { backgroundColor: item.color }]} onPress={() => onLevel(item.id)}><Text style={styles.levelIcon}>{item.icon}</Text><View><Text style={styles.levelTitle}>{item.title}</Text><Text style={styles.levelSub}>الطلاب • المواد • الدروس • النتائج</Text></View><Text style={styles.cardArrow}>‹</Text></TouchableOpacity>)}<SecondaryButton label="تسجيل الخروج" onPress={onLogout} /></ScrollView></SafeAreaView>; }
function TeacherLevel({ level, students, onStudents, onSubject, top, onBack, onLogout }) { return <SafeAreaView style={styles.container}><Header title={level.title} sub="إدارة المستوى الدراسي" back onBack={onBack} /><ScrollView contentContainerStyle={styles.content}><TouchableOpacity style={styles.manageCard} onPress={onStudents}><Text style={styles.manageIcon}>♙</Text><View><Text style={styles.manageTitle}>الطلاب والأكواد</Text><Text style={styles.manageMeta}>{students.length} طالب • إضافة • إيقاف • حذف</Text></View></TouchableOpacity><Text style={styles.listTitle}>المواد الدراسية</Text>{SUBJECTS.map((item) => <TouchableOpacity key={item.id} style={[styles.subjectCard, { backgroundColor: item.color }]} onPress={() => onSubject(item.id)}><Text style={styles.subjectIcon}>{item.icon}</Text><View style={styles.subjectCopy}><Text style={styles.subjectTitle}>{item.title}</Text><Text style={styles.subjectDesc}>الكتب • الدروس • الواجبات • الاختبارات • الدرجات</Text></View><Text style={styles.cardArrow}>‹</Text></TouchableOpacity>)}<View style={styles.panel}><Text style={styles.panelTitle}>لوحة شرف المستوى</Text><TopList names={top} /></View><SecondaryButton label="تسجيل الخروج" onPress={onLogout} /></ScrollView></SafeAreaView>; }
function TeacherStudents({ level, students, form, setForm, onAdd, onToggle, onDelete, onBack }) { return <SafeAreaView style={styles.container}><Header title={`طلاب ${level.title}`} sub="إدارة الأكواد والحسابات" back onBack={onBack} /><ScrollView contentContainerStyle={styles.content}><View style={styles.panel}><Text style={styles.panelTitle}>إضافة طالب</Text><TextInput style={styles.input} placeholder="اسم الطالب" placeholderTextColor="#8b9ab0" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} textAlign="right" /><TextInput style={styles.input} placeholder="كود التسجيل" placeholderTextColor="#8b9ab0" value={form.code} onChangeText={(v) => setForm({ ...form, code: v })} textAlign="right" autoCapitalize="characters" /><PrimaryButton label="إضافة وتفعيل" onPress={onAdd} color="#0f9f76" /></View>{students.map((item) => <View style={styles.studentRow} key={item.id}><View style={styles.studentCopy}><Text style={styles.studentName}>{item.name}</Text><Text style={styles.studentCode}>{item.code} • {item.active ? 'نشط' : 'موقوف'}</Text></View><TouchableOpacity style={styles.smallButton} onPress={() => onToggle(item.id)}><Text style={styles.smallButtonText}>{item.active ? 'إيقاف' : 'تفعيل'}</Text></TouchableOpacity><TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item.id)}><Text style={styles.deleteText}>حذف</Text></TouchableOpacity></View>)}</ScrollView></SafeAreaView>; }
function TeacherSubject({ level, subject, category, items, form, setForm, onCategory, onAdd, onUpload, onBack, loading }) { return <SafeAreaView style={styles.container}><Header title={`${subject.icon} ${subject.title}`} sub={`إدارة ${level.title}`} back onBack={onBack} /><ScrollView contentContainerStyle={styles.content}>{!category ? <>{CATEGORIES.map((item) => <TouchableOpacity key={item.id} style={styles.categoryRow} onPress={() => onCategory(item.id)}><View style={[styles.categoryIcon, { backgroundColor: item.color }]}><Text style={styles.categoryIconText}>{item.icon}</Text></View><View style={styles.categoryCopy}><Text style={styles.categoryTitle}>{item.title}</Text><Text style={styles.categoryMeta}>{item.id === 'top' ? 'عرض وترتيب الأوائل تلقائيًا' : `${items?.[item.id]?.length || 0} عناصر`}</Text></View><Text style={styles.chevron}>‹</Text></TouchableOpacity>)}</> : category.id === 'top' || category.id === 'grades' ? <View style={styles.panel}><Text style={styles.panelTitle}>{category.title}</Text><Text style={styles.emptyText}>سيتم احتساب وترتيب النتائج عند ربط درجات الاختبارات والواجبات بالسحابة.</Text></View> : <><View style={styles.panel}><Text style={styles.panelTitle}>إضافة {category.title}</Text><TextInput style={styles.input} placeholder="العنوان" placeholderTextColor="#8b9ab0" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} textAlign="right" /><TextInput style={[styles.input, { height: 90 }]} placeholder="النص أو وصف المحتوى" placeholderTextColor="#8b9ab0" value={form.body} onChangeText={(v) => setForm({ ...form, body: v })} multiline textAlign="right" /><PrimaryButton label="حفظ المحتوى" onPress={() => onAdd(category.id)} color={subject.color} />{category.id === 'books' ? <><Text style={styles.orText}>أو</Text><PrimaryButton label="اختيار ورفع ملف PDF" onPress={onUpload} loading={loading} color="#d97706" /></> : null}</View>{(items?.[category.id] || []).map((item) => <View style={styles.codeRow} key={item.id}><Text style={styles.codeName}>{item.title}</Text><Text style={styles.codeValue}>مضاف</Text></View>)}</>}</ScrollView></SafeAreaView>; }
function Header({ title, sub, back, onBack }) { return <View style={styles.header}>{back ? <TouchableOpacity style={styles.backHeader} onPress={onBack}><Text style={styles.backHeaderText}>رجوع</Text></TouchableOpacity> : null}<Text style={styles.headerTitle}>{title}</Text><Text style={styles.headerSub}>{sub}</Text></View>; }
function BigAction({ title, icon, color, onPress }) { return <TouchableOpacity style={[styles.bigAction, { borderColor: color }]} onPress={onPress}><View style={[styles.bigIcon, { backgroundColor: color }]}><Text style={styles.bigIconText}>{icon}</Text></View><Text style={styles.bigActionText}>{title}</Text><Text style={[styles.cardArrow, { color }]}>‹</Text></TouchableOpacity>; }
function PrimaryButton({ label, onPress, loading, color = '#1f5eff' }) { return <TouchableOpacity style={[styles.primaryButton, { backgroundColor: color }]} onPress={onPress} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{label}</Text>}</TouchableOpacity>; }
function SecondaryButton({ label, onPress }) { return <TouchableOpacity style={styles.secondaryButton} onPress={onPress}><Text style={styles.secondaryText}>{label}</Text></TouchableOpacity>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fb' }, landing: { flexGrow: 1, justifyContent: 'center', padding: 24 }, loginPage: { flexGrow: 1, justifyContent: 'center', padding: 24 }, content: { padding: 18 }, logo: { alignSelf: 'center', width: 78, height: 78, borderRadius: 25, backgroundColor: '#1f5eff', justifyContent: 'center', alignItems: 'center', marginBottom: 18 }, logoText: { color: '#fff', fontSize: 44, fontWeight: '900' }, school: { textAlign: 'center', color: '#66758c', fontSize: 13, fontWeight: '700', marginBottom: 10 }, appTitle: { textAlign: 'center', color: '#12233f', fontSize: 28, fontWeight: '900' }, subtitle: { textAlign: 'center', color: '#66758c', fontSize: 15, marginTop: 8, marginBottom: 26 }, actionStack: { gap: 12 }, bigAction: { minHeight: 74, borderWidth: 1.5, borderRadius: 20, backgroundColor: '#fff', padding: 12, flexDirection: 'row-reverse', alignItems: 'center' }, bigIcon: { width: 48, height: 48, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginLeft: 12 }, bigIconText: { color: '#fff', fontSize: 24, fontWeight: '900' }, bigActionText: { flex: 1, color: '#12233f', textAlign: 'right', fontSize: 16, fontWeight: '800' }, loginCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#12233f', shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 }, input: { height: 52, borderWidth: 1, borderColor: '#dbe3ed', borderRadius: 14, backgroundColor: '#fbfcfe', paddingHorizontal: 15, fontSize: 16, marginBottom: 13, color: '#12233f' }, primaryButton: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }, primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 }, secondaryButton: { padding: 18, alignItems: 'center', marginTop: 10 }, secondaryText: { color: '#66758c', fontWeight: '800' }, header: { backgroundColor: '#12233f', paddingTop: 20, paddingBottom: 22, paddingHorizontal: 20, alignItems: 'flex-end' }, headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' }, headerSub: { color: '#bfd0ea', fontSize: 13, marginTop: 5 }, backHeader: { alignSelf: 'flex-start', marginBottom: 8 }, backHeaderText: { color: '#fff', fontWeight: '800' }, welcome: { backgroundColor: '#eaf0ff', borderRadius: 20, padding: 18, marginBottom: 18 }, welcomeTitle: { color: '#163b92', fontSize: 18, fontWeight: '900', textAlign: 'right' }, welcomeText: { color: '#536d9e', marginTop: 5, textAlign: 'right', lineHeight: 22 }, notice: { backgroundColor: '#fff5d8', borderRadius: 14, padding: 12, marginBottom: 12 }, noticeText: { color: '#8a5a00', textAlign: 'right', fontSize: 13 }, subjectCard: { minHeight: 100, borderRadius: 20, padding: 18, marginBottom: 13, flexDirection: 'row-reverse', alignItems: 'center' }, subjectIcon: { color: '#fff', fontSize: 34, width: 48, textAlign: 'center' }, subjectCopy: { flex: 1, alignItems: 'flex-end' }, subjectTitle: { color: '#fff', fontSize: 20, fontWeight: '900' }, subjectDesc: { color: '#eaf7ff', fontSize: 12, marginTop: 4, textAlign: 'right' }, cardArrow: { color: '#fff', fontSize: 30 }, levelCard: { minHeight: 102, borderRadius: 20, padding: 18, marginBottom: 13, flexDirection: 'row-reverse', alignItems: 'center', gap: 14 }, levelIcon: { color: '#fff', fontSize: 30, fontWeight: '900', width: 42, textAlign: 'center' }, levelTitle: { color: '#fff', fontSize: 19, fontWeight: '900', textAlign: 'right' }, levelSub: { color: '#eaf7ff', marginTop: 5, fontSize: 12, textAlign: 'right' }, manageCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 20 }, manageIcon: { backgroundColor: '#12233f', color: '#fff', width: 45, height: 45, borderRadius: 14, textAlign: 'center', paddingTop: 8, fontSize: 25, marginLeft: 12 }, manageTitle: { color: '#12233f', fontSize: 17, fontWeight: '900', textAlign: 'right' }, manageMeta: { color: '#7b899c', marginTop: 4, textAlign: 'right' }, listTitle: { color: '#12233f', fontSize: 18, fontWeight: '900', textAlign: 'right', marginBottom: 12 }, categoryRow: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row-reverse', alignItems: 'center' }, categoryIcon: { width: 43, height: 43, borderRadius: 13, justifyContent: 'center', alignItems: 'center' }, categoryIconText: { color: '#fff', fontSize: 23, fontWeight: '900' }, categoryCopy: { flex: 1, paddingHorizontal: 12, alignItems: 'flex-end' }, categoryTitle: { color: '#12233f', fontSize: 15, fontWeight: '900' }, categoryMeta: { color: '#8391a4', fontSize: 11, marginTop: 4, textAlign: 'right' }, chevron: { color: '#8b9ab0', fontSize: 28 }, panel: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 18 }, panelTitle: { color: '#12233f', fontSize: 18, fontWeight: '900', textAlign: 'right', marginBottom: 15 }, materialRow: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 10, flexDirection: 'row-reverse', alignItems: 'center' }, materialCopy: { flex: 1, alignItems: 'flex-end', paddingHorizontal: 10 }, materialTitle: { color: '#12233f', fontSize: 15, fontWeight: '900', textAlign: 'right' }, materialMeta: { color: '#8391a4', fontSize: 11, marginTop: 5, textAlign: 'right' }, materialBody: { color: '#475569', fontSize: 13, marginTop: 8, lineHeight: 20, textAlign: 'right' }, downloadButton: { backgroundColor: '#eaf0ff', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 }, downloadText: { color: '#1f5eff', fontSize: 12, fontWeight: '900' }, empty: { backgroundColor: '#fff', padding: 24, borderRadius: 18, alignItems: 'center' }, emptyTitle: { color: '#12233f', fontSize: 18, fontWeight: '900' }, emptyText: { color: '#77869c', textAlign: 'center', marginTop: 8, lineHeight: 22 }, topRow: { backgroundColor: '#fffaf0', borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row-reverse', alignItems: 'center' }, rank: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#b7791f', color: '#fff', textAlign: 'center', paddingTop: 7, fontWeight: '900' }, topName: { flex: 1, color: '#493313', fontWeight: '800', textAlign: 'right', paddingHorizontal: 12 }, medal: { fontSize: 22 }, studentRow: { backgroundColor: '#fff', borderRadius: 15, padding: 13, marginBottom: 9, flexDirection: 'row-reverse', alignItems: 'center' }, studentCopy: { flex: 1, alignItems: 'flex-end', paddingHorizontal: 8 }, studentName: { color: '#12233f', fontWeight: '900' }, studentCode: { color: '#77869c', fontSize: 12, marginTop: 4 }, smallButton: { backgroundColor: '#eaf0ff', paddingHorizontal: 9, paddingVertical: 8, borderRadius: 9, marginLeft: 5 }, smallButtonText: { color: '#1f5eff', fontSize: 11, fontWeight: '800' }, deleteButton: { backgroundColor: '#fff0f1', paddingHorizontal: 9, paddingVertical: 8, borderRadius: 9 }, deleteText: { color: '#c53045', fontSize: 11, fontWeight: '800' }, profileImage: { width: 130, height: 130, borderRadius: 65, alignSelf: 'center', marginBottom: 18 }, aboutTitle: { color: '#12233f', fontSize: 24, fontWeight: '900', textAlign: 'center' }, aboutRole: { color: '#66758c', textAlign: 'center', marginTop: 6, marginBottom: 20 }, aboutText: { color: '#475569', textAlign: 'right', lineHeight: 25, marginBottom: 12 }, orText: { color: '#8793a4', textAlign: 'center', marginVertical: 8 }, codeRow: { backgroundColor: '#fff', borderRadius: 14, padding: 15, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }, codeName: { color: '#66758c' }, codeValue: { color: '#075e54', fontWeight: '900' },
});
