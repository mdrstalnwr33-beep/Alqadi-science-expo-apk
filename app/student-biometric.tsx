import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { readJson, storageKeys, type LocalStudent } from '../src/storage';
import { loginStudentByFingerprint } from '../src/studentBiometric';

export default function StudentBiometric(){
  const [status,setStatus]=useState('جارٍ التحقق من بصمة الطالب…');
  const [students,setStudents]=useState<LocalStudent[]>([]);
  useEffect(()=>{(async()=>{const local=await readJson<LocalStudent[]>(storageKeys.students,[]);setStudents(local);const linked=await readJson<string>(storageKeys.studentBiometricCode,'');if(!/^\d{6}$/.test(linked)){router.replace({pathname:'/login',params:{role:'student'}});return;}try{const result=await loginStudentByFingerprint(local);if(result.ok){router.replace('/welcome');return;}if(result.reason==='inactive')setStatus('تم إيقاف حساب الطالب من قبل المعلم.');else if(result.reason==='missing')setStatus('لم يعد كود الطالب المرتبط بالبصمة موجودًا. ادخل بالكود من جديد.');else if(result.reason==='unsupported')setStatus('هذا الجهاز لا يدعم بصمة الإصبع أو لا توجد بصمة مسجلة.');else if(result.reason==='cancelled')setStatus('تم إلغاء التحقق بالبصمة.');else setStatus('تعذر استخدام البصمة.');}catch{setStatus('تعذر التحقق بالبصمة. يمكنك الدخول بالكود.');}})()},[]);
  return <SafeAreaView style={styles.safe}><View style={styles.container}><Text style={styles.icon}>🔐</Text><Text style={styles.title}>دخول الطالب بالبصمة</Text><Text style={styles.status}>{status}</Text><Pressable style={styles.primary} onPress={()=>router.replace({pathname:'/login',params:{role:'student'}})}><Text style={styles.primaryText}>الدخول بكود الطالب</Text></Pressable></View></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#f5f7fb'},container:{flex:1,justifyContent:'center',alignItems:'center',padding:28},icon:{fontSize:70,marginBottom:20},title:{fontSize:28,fontWeight:'900',color:'#17324d',textAlign:'center'},status:{fontSize:15,color:'#667085',textAlign:'center',lineHeight:25,marginTop:14,marginBottom:28},primary:{backgroundColor:'#17324d',borderRadius:16,paddingVertical:16,paddingHorizontal:30,minWidth:'85%',alignItems:'center'},primaryText:{color:'#fff',fontSize:17,fontWeight:'900'}});
