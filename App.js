import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, firebaseReady } from './src/firebaseConfig';

const SUBJECTS = {
  chemistry: {
    title: 'الكيمياء', color: '#0f9f76', icon: '⚗', description: 'الملخصات والاختبارات التفاعلية',
    lessons: ['تركيب الذرة والجدول الدوري', 'الروابط والتفاعلات الكيميائية', 'الأحماض والقواعد'],
  },
  physics: {
    title: 'الفيزياء', color: '#2563eb', icon: '◈', description: 'شرح القوانين والنماذج الوزارية',
    lessons: ['الحركة والقوة', 'الكهرباء والدوائر', 'الضوء والموجات'],
  },
  biology: {
    title: 'الأحياء', color: '#7c3aed', icon: '✣', description: 'الرسومات والمخططات التفصيلية',
    lessons: ['الخلية ووظائفها', 'الوراثة والتكاثر', 'أجهزة جسم الإنسان'],
  },
};

const LOCAL_CODES = [
  { code: '2026-01', name: 'طالب تجريبي' },
  { code: 'ALQADI', name: 'طالب تجريبي' },
];

export default function App() {
  const [screen, setScreen] = useState('login');
  const [code, setCode] = useState('');
  const [student, setStudent] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(firebaseReady ? 'متصل بقاعدة البيانات' : 'وضع تجريبي: استخدم 2026-01 للدخول');
  const [teacherUnlocked, setTeacherUnlocked] = useState(false);
  const [teacherPassword, setTeacherPassword] = useState('');
  const [newCode, setNewCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [localCodes, setLocalCodes] = useState(LOCAL_CODES);

  const subject = selectedSubject ? SUBJECTS[selectedSubject] : null;
  const teacherKey = process.env.EXPO_PUBLIC_TEACHER_CODE || 'ALQADI-TEACHER';

  const showError = (message) => Alert.alert('تنبيه', message);

  const handleStudentLogin = async () => {
    const cleanCode = code.trim();
    if (!cleanCode) return showError('يرجى إدخال كود التفعيل');
    setLoading(true);
    try {
      let result = null;
      if (firebaseReady) {
        const snapshot = await getDocs(query(collection(db, 'access_codes'), where('code', '==', cleanCode)));
        if (!snapshot.empty) result = snapshot.docs[0].data();
      } else {
        result = localCodes.find((item) => item.code.toLowerCase() === cleanCode.toLowerCase());
      }
      if (!result) return showError('الكود غير صحيح أو غير مفعّل');
      setStudent({ name: result.name || 'الطالب', code: cleanCode });
      setScreen('studentHome');
      setNotice(`مرحبًا ${result.name || 'بالطالب'}`);
    } catch (error) {
      showError('تعذر الاتصال بقاعدة البيانات. تحقق من إعدادات Firebase أو جرّب وضع التشغيل المحلي.');
    } finally {
      setLoading(false);
    }
  };

  const unlockTeacher = () => {
    if (teacherPassword.trim() !== teacherKey) return showError('رمز المعلم غير صحيح');
    setTeacherUnlocked(true);
    setTeacherPassword('');
    setScreen('teacherDashboard');
  };

  const handleAddCode = async () => {
    if (!newCode.trim() || !studentName.trim()) return showError('أدخل اسم الطالب والكود الجديد');
    setLoading(true);
    const item = { code: newCode.trim(), name: studentName.trim(), createdAt: new Date().toISOString() };
    try {
      if (firebaseReady) await addDoc(collection(db, 'access_codes'), item);
      setLocalCodes((items) => [...items, item]);
      setNewCode('');
      setStudentName('');
      Alert.alert('تم الحفظ', firebaseReady ? 'تم تفعيل الكود في Firebase' : 'تم حفظ الكود في الوضع المحلي');
    } catch (error) {
      showError('فشل حفظ الكود. تحقق من صلاحيات Firestore.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setStudent(null);
    setSelectedSubject(null);
    setScreen('login');
    setCode('');
  };

  if (screen === 'login') return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#12233f" />
      <ScrollView contentContainerStyle={styles.loginPage}>
        <View style={styles.logo}><Text style={styles.logoText}>ق</Text></View>
        <Text style={styles.school}>مدرسة النور الأساسية الثانوية بالروحاء</Text>
        <Text style={styles.appTitle}>تطبيق القاضي للعلوم</Text>
        <Text style={styles.subtitle}>تعلم العلوم بطريقة أوضح وأقرب</Text>
        <View style={styles.loginCard}>
          <Text style={styles.sectionTitle}>دخول الطالب</Text>
          <Text style={styles.helper}>أدخل كود التفعيل المرسل لك من المعلم</Text>
          <TextInput style={styles.input} placeholder="مثال: 2026-01" placeholderTextColor="#8b9ab0" value={code} onChangeText={setCode} autoCapitalize="characters" textAlign="right" />
          <PrimaryButton label="دخول إلى المنصة" onPress={handleStudentLogin} loading={loading} />
          <Text style={styles.status}>{notice}</Text>
        </View>
        <TouchableOpacity style={styles.teacherLink} onPress={() => setScreen('teacherLogin')}><Text style={styles.teacherLinkText}>دخول المعلم</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  if (screen === 'teacherLogin') return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#075e54" />
      <ScrollView contentContainerStyle={styles.loginPage}>
        <View style={[styles.logo, { backgroundColor: '#0f9f76' }]}><Text style={styles.logoText}>م</Text></View>
        <Text style={styles.appTitle}>لوحة المعلم</Text>
        <Text style={styles.subtitle}>إدارة أكواد دخول الطلاب</Text>
        <View style={styles.loginCard}>
          <Text style={styles.sectionTitle}>رمز المعلم</Text>
          <TextInput style={styles.input} placeholder="أدخل رمز المعلم" placeholderTextColor="#8b9ab0" secureTextEntry value={teacherPassword} onChangeText={setTeacherPassword} textAlign="right" />
          <PrimaryButton label="فتح لوحة التحكم" onPress={unlockTeacher} />
        </View>
        <TouchableOpacity style={styles.teacherLink} onPress={() => setScreen('login')}><Text style={styles.teacherLinkText}>العودة لدخول الطالب</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  if (screen === 'teacherDashboard') return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#075e54" />
      <View style={[styles.header, { backgroundColor: '#075e54' }]}><Text style={styles.headerTitle}>لوحة المعلم</Text><Text style={styles.headerSub}>إدارة وتفعيل الطلاب</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.panel}><Text style={styles.panelTitle}>إضافة طالب جديد</Text><TextInput style={styles.input} placeholder="اسم الطالب" placeholderTextColor="#8b9ab0" value={studentName} onChangeText={setStudentName} textAlign="right" /><TextInput style={styles.input} placeholder="كود التفعيل" placeholderTextColor="#8b9ab0" value={newCode} onChangeText={setNewCode} autoCapitalize="characters" textAlign="right" /><PrimaryButton label="حفظ وتفعيل الكود" onPress={handleAddCode} loading={loading} color="#0f9f76" /></View>
        <Text style={styles.listTitle}>الأكواد المتاحة ({localCodes.length})</Text>
        {localCodes.map((item, index) => <View style={styles.codeRow} key={`${item.code}-${index}`}><Text style={styles.codeName}>{item.name}</Text><Text style={styles.codeValue}>{item.code}</Text></View>)}
        <SecondaryButton label="العودة للرئيسية" onPress={() => setScreen('login')} />
      </ScrollView>
    </SafeAreaView>
  );

  if (screen === 'subject') return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={subject.color} />
      <View style={[styles.header, { backgroundColor: subject.color }]}><TouchableOpacity onPress={() => setScreen('studentHome')}><Text style={styles.headerBack}>رجوع</Text></TouchableOpacity><Text style={styles.headerTitle}>{subject.icon} {subject.title}</Text><Text style={styles.headerSub}>{subject.description}</Text></View>
      <ScrollView contentContainerStyle={styles.content}><Text style={styles.listTitle}>دروس مقترحة</Text>{subject.lessons.map((lesson, index) => <TouchableOpacity key={lesson} style={styles.lessonRow} onPress={() => Alert.alert('قريبًا', `سيتم إضافة درس «${lesson}» في النسخة القادمة.`)}><View style={[styles.lessonNumber, { backgroundColor: subject.color }]}><Text style={styles.lessonNumberText}>{index + 1}</Text></View><View style={styles.lessonText}><Text style={styles.lessonTitle}>{lesson}</Text><Text style={styles.lessonMeta}>شرح • ملخص • أسئلة تدريبية</Text></View><Text style={styles.chevron}>‹</Text></TouchableOpacity>)}<SecondaryButton label="تسجيل الخروج" onPress={logout} /></ScrollView>
    </SafeAreaView>
  );

  if (screen === 'studentHome') return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#12233f" />
      <View style={styles.header}><Text style={styles.headerTitle}>مرحبًا، {student?.name}</Text><Text style={styles.headerSub}>اختر المادة التي تريد مذاكرتها</Text></View>
      <ScrollView contentContainerStyle={styles.content}><View style={styles.welcome}><Text style={styles.welcomeTitle}>رحلتك العلمية تبدأ هنا</Text><Text style={styles.welcomeText}>دروس مرتبة، ملخصات واضحة، وتدريب مستمر.</Text></View>{Object.entries(SUBJECTS).map(([key, item]) => <TouchableOpacity key={key} style={[styles.subjectCard, { backgroundColor: item.color }]} onPress={() => { setSelectedSubject(key); setScreen('subject'); }}><Text style={styles.subjectIcon}>{item.icon}</Text><View style={styles.subjectCopy}><Text style={styles.subjectTitle}>{item.title}</Text><Text style={styles.subjectDesc}>{item.description}</Text></View><Text style={styles.cardArrow}>‹</Text></TouchableOpacity>)}<SecondaryButton label="تسجيل الخروج" onPress={logout} /></ScrollView>
    </SafeAreaView>
  );

  return null;
}

function PrimaryButton({ label, onPress, loading, color = '#1f5eff' }) { return <TouchableOpacity style={[styles.primaryButton, { backgroundColor: color }]} onPress={onPress} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{label}</Text>}</TouchableOpacity>; }
function SecondaryButton({ label, onPress }) { return <TouchableOpacity style={styles.secondaryButton} onPress={onPress}><Text style={styles.secondaryText}>{label}</Text></TouchableOpacity>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fb' }, loginPage: { flexGrow: 1, justifyContent: 'center', padding: 24 }, logo: { alignSelf: 'center', width: 74, height: 74, borderRadius: 24, backgroundColor: '#1f5eff', justifyContent: 'center', alignItems: 'center', marginBottom: 18 }, logoText: { color: '#fff', fontSize: 42, fontWeight: '900' }, school: { textAlign: 'center', color: '#66758c', fontSize: 13, fontWeight: '700', marginBottom: 10 }, appTitle: { textAlign: 'center', color: '#12233f', fontSize: 28, fontWeight: '900' }, subtitle: { textAlign: 'center', color: '#66758c', fontSize: 15, marginTop: 8, marginBottom: 26 }, loginCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#12233f', shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 }, sectionTitle: { color: '#12233f', fontSize: 20, fontWeight: '800', textAlign: 'right' }, helper: { color: '#77869c', fontSize: 13, textAlign: 'right', marginTop: 6, marginBottom: 18 }, input: { height: 52, borderWidth: 1, borderColor: '#dbe3ed', borderRadius: 14, backgroundColor: '#fbfcfe', paddingHorizontal: 15, fontSize: 16, marginBottom: 13, color: '#12233f' }, primaryButton: { height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }, primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 }, status: { textAlign: 'center', color: '#6f7f94', fontSize: 12, marginTop: 14 }, teacherLink: { alignSelf: 'center', padding: 18 }, teacherLinkText: { color: '#1f5eff', fontWeight: '700' }, header: { backgroundColor: '#12233f', paddingTop: 20, paddingBottom: 22, paddingHorizontal: 20, alignItems: 'flex-end' }, headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' }, headerSub: { color: '#bfd0ea', fontSize: 13, marginTop: 5 }, headerBack: { color: '#fff', fontWeight: '700', alignSelf: 'flex-start', marginBottom: 12 }, content: { padding: 18 }, welcome: { backgroundColor: '#eaf0ff', borderRadius: 20, padding: 18, marginBottom: 18 }, welcomeTitle: { color: '#163b92', fontSize: 18, fontWeight: '900', textAlign: 'right' }, welcomeText: { color: '#536d9e', marginTop: 5, textAlign: 'right' }, subjectCard: { minHeight: 100, borderRadius: 20, padding: 18, marginBottom: 13, flexDirection: 'row-reverse', alignItems: 'center' }, subjectIcon: { color: '#fff', fontSize: 34, width: 48, textAlign: 'center' }, subjectCopy: { flex: 1, alignItems: 'flex-end' }, subjectTitle: { color: '#fff', fontSize: 20, fontWeight: '900' }, subjectDesc: { color: '#eaf7ff', fontSize: 12, marginTop: 4 }, cardArrow: { color: '#fff', fontSize: 30 }, panel: { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 20 }, panelTitle: { color: '#075e54', fontSize: 19, fontWeight: '900', textAlign: 'right', marginBottom: 15 }, listTitle: { color: '#12233f', fontSize: 18, fontWeight: '900', textAlign: 'right', marginBottom: 12 }, codeRow: { backgroundColor: '#fff', borderRadius: 14, padding: 15, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }, codeName: { color: '#66758c' }, codeValue: { color: '#075e54', fontWeight: '900' }, lessonRow: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row-reverse', alignItems: 'center' }, lessonNumber: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, lessonNumberText: { color: '#fff', fontWeight: '900' }, lessonText: { flex: 1, alignItems: 'flex-end', paddingHorizontal: 12 }, lessonTitle: { color: '#12233f', fontWeight: '800', fontSize: 15 }, lessonMeta: { color: '#8391a4', fontSize: 11, marginTop: 4 }, chevron: { color: '#8b9ab0', fontSize: 28 }, secondaryButton: { padding: 18, alignItems: 'center', marginTop: 14 }, secondaryText: { color: '#66758c', fontWeight: '800' },
});
