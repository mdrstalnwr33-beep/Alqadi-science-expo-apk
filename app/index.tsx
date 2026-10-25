import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { getSession, readJson, storageKeys } from '../src/storage';
import { subjects } from '../src/data';

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [hasStudentBiometric, setHasStudentBiometric] = useState(false);
  useEffect(() => {
    (async()=>{
      const s=await getSession();
      if(s?.active){
        if(s.role==='student') router.replace('/welcome');
        else if(s.role==='teacher') router.replace({ pathname:'/teacher', params:{name:s.name,code:s.code} });
        else router.replace({ pathname:'/home', params:{role:s.role,name:s.name,grade:s.grade,code:s.code} });
        return;
      }
      const studentBio=await readJson<string>(storageKeys.studentBiometricCode,'');
      setHasStudentBiometric(/^\d{6}$/.test(studentBio));
      setChecking(false);
    })();
  }, []);
  if (checking) return <SafeAreaView style={styles.safe}><View style={styles.center}><Image source={require('../assets/icon.png')} style={styles.loadingLogo}/><Text style={styles.title}>تطبيق القاضي للعلوم</Text><Text style={styles.note}>جارٍ التحقق من الجلسة…</Text></View></SafeAreaView>;
  return <SafeAreaView style={styles.safe}><View style={styles.container}>
    <View style={styles.brand}><Pressable onLongPress={() => router.push({ pathname: '/login', params: { role: 'teacher' } })} delayLongPress={900}><Image source={require('../assets/icon.png')} style={styles.logo}/></Pressable><Text style={styles.title}>تطبيق القاضي للعلوم</Text><Text style={styles.subtitle}>منصة تعليمية للمرحلة الثانوية</Text></View>
    <View style={styles.subjects}>{subjects.map(s => <View key={s.name} style={styles.subject}><Text style={styles.subjectIcon}>{s.icon}</Text><Text style={styles.subjectName}>{s.name}</Text></View>)}</View>
    <Pressable style={styles.primary} onPress={() => router.push({ pathname: '/login', params: { role: 'student' } })}><Text style={styles.primaryText}>👨‍🎓 دخول الطالب</Text></Pressable>
    {hasStudentBiometric&&<Pressable style={styles.biometric} onPress={()=>router.push('/student-biometric')}><Text style={styles.biometricText}>🔐 دخول الطالب بالبصمة</Text></Pressable>}
    <Pressable style={styles.about} onPress={() => router.push('/about-teacher')}><Text style={styles.aboutText}>عن الأستاذ محمد القاضي</Text></Pressable>
  </View></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#f5f7fb' }, container: { flex: 1, justifyContent: 'center', padding: 24 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, brand: { alignItems: 'center', marginBottom: 28 }, logo: { width: 112, height: 112, borderRadius: 28 }, loadingLogo: { width: 80, height: 80, borderRadius: 20 }, title: { fontSize: 28, fontWeight: '900', color: '#17324d', marginTop: 15, textAlign: 'center' }, subtitle: { fontSize: 14, color: '#667085', marginTop: 6 }, subjects: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 28 }, subject: { width: '31%', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#eaecf0' }, subjectIcon: { fontSize: 27 }, subjectName: { fontSize: 13, fontWeight: '900', color: '#17324d', marginTop: 7 }, primary: { backgroundColor: '#17324d', borderRadius: 17, paddingVertical: 17, alignItems: 'center', marginBottom: 12 }, primaryText: { color: '#fff', fontSize: 18, fontWeight: '900' }, biometric:{backgroundColor:'#356ae6',borderRadius:17,paddingVertical:15,alignItems:'center',marginBottom:12}, biometricText:{color:'#fff',fontSize:16,fontWeight:'900'}, about: { padding: 15, alignItems: 'center' }, aboutText: { color: '#356ae6', fontSize: 16, fontWeight: '800' }, note: { color: '#667085', marginTop: 8 } });
