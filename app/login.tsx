import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { grades } from '../src/data';
import { claimStudentDevice, getCloudStudent, getCloudTeacherCode } from '../src/cloud';
import { getDeviceId } from '../src/device';
import { readJson, setSession, storageKeys, type LocalStudent } from '../src/storage';

const INITIAL_TEACHER_CODE = '900001';
const normalizeCode=(value:string)=>value.replace(/\D/g,'').slice(0,6);

export default function LoginScreen(){
 const p=useLocalSearchParams<{role?:string}>();
 const role=p.role==='teacher'?'teacher':'student';
 const [code,setCode]=useState(''); const [busy,setBusy]=useState(false);
 const [students,setStudents]=useState<LocalStudent[]>([]); const [teacherCode,setTeacherCode]=useState(INITIAL_TEACHER_CODE);
 useEffect(()=>{readJson<LocalStudent[]>(storageKeys.students,[]).then(setStudents);readJson<string>('teacher-code',INITIAL_TEACHER_CODE).then(v=>setTeacherCode(/^\d{6}$/.test(v)?v:INITIAL_TEACHER_CODE));},[]);
 const enter=async()=>{
  if(!/^\d{6}$/.test(code))return Alert.alert('كود غير صحيح','يجب أن يتكون كود الدخول من ستة أرقام فقط.');
  setBusy(true);
  try{
   if(role==='teacher'){
    let valid=code===teacherCode;
    try{const cloudCode=await getCloudTeacherCode(); if(cloudCode) valid=code===cloudCode;}catch{}
    if(!valid)return Alert.alert('كود المعلم غير صحيح','الكود غير موجود أو تم تغييره من قبل المعلم.');
    const name='الأستاذ محمد القاضي الوصابي'; await setSession({role:'teacher',name,grade:grades[0],code,active:true});
    router.dismissAll(); return router.replace({pathname:'/home',params:{role:'teacher',name,grade:grades[0],code}});
   }
   let student:LocalStudent|null=null;
   try{student=await getCloudStudent(code)}catch{
     student=students.find(s=>s.code===code)||null;
     if(!student)return Alert.alert('تعذر الاتصال','تعذر الاتصال بالسحابة ولا يوجد هذا الطالب محفوظًا على هذا الجهاز.');
   }
   if(!student)student=students.find(s=>s.code===code)||null;
   if(!student)return Alert.alert('الكود غير موجود','هذا الكود لم ينشئه المعلم.');
   if(!student.active)return Alert.alert('الحساب موقوف','تم إيقاف هذا الطالب من قبل المعلم.');
   const deviceId=await getDeviceId();
   let claim:'claimed'|'same-device'|'occupied'|'inactive'|'missing';
   try{claim=await claimStudentDevice(code,deviceId)}catch{
     claim='same-device';
   }
   if(claim==='occupied')return Alert.alert('الحساب مستخدم على جهاز آخر','هذا الكود مسجل الدخول من جهاز آخر. سجّل الخروج من الجهاز الآخر أولًا.');
   if(claim==='inactive')return Alert.alert('الحساب موقوف','تم إيقاف هذا الطالب من قبل المعلم.');
   if(claim==='missing' && !students.some(s=>s.code===code))return Alert.alert('الكود غير موجود','لم يتم العثور على سجل الطالب.');
   await setSession({role:'student',name:student.name,grade:student.grade,code:student.code,active:true});
   router.dismissAll(); router.replace({pathname:'/home',params:{role:'student',name:student.name,grade:student.grade,code:student.code}});
  }finally{setBusy(false)}
 };
 return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={Platform.OS==='ios'?10:25}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
  <View style={styles.header}><Pressable onPress={()=>router.back()}><Text style={styles.arrow}>→</Text></Pressable><Text style={styles.title}>{role==='student'?'دخول الطالب':'دخول المعلم'}</Text></View>
  <View style={styles.avatar}><Text style={styles.avatarText}>●</Text></View>
  <View style={styles.card}><Text style={styles.label}>{role==='student'?'كود الطالب':'كود المعلم'}</Text>
   <TextInput value={code} onChangeText={v=>setCode(normalizeCode(v))} placeholder="أدخل 6 أرقام" placeholderTextColor="#6b7280" style={styles.input} textAlign="center" keyboardType="number-pad" inputMode="numeric" maxLength={6} secureTextEntry={false}/>
   <Text style={styles.hint}>الكود مكوّن من 6 أرقام فقط ولا يحتوي على حروف.</Text>
   <Pressable disabled={busy} style={[styles.button,busy&&{opacity:.6}]} onPress={enter}><Text style={styles.buttonText}>{busy?'جارٍ التحقق...':'دخول'}</Text></Pressable>
  </View>
 </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const styles=StyleSheet.create({flex:{flex:1},safe:{flex:1,backgroundColor:'#fbf8ff'},scroll:{flexGrow:1,paddingHorizontal:37,paddingTop:40,paddingBottom:35,justifyContent:'center'},header:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between'},arrow:{fontSize:39,color:'#202020',fontWeight:'300'},title:{fontSize:38,fontWeight:'800',color:'#171717'},avatar:{alignItems:'center',marginTop:55,marginBottom:42},avatarText:{fontSize:72,color:'#202020'},card:{width:'100%'},label:{fontSize:26,fontWeight:'700',color:'#303038',textAlign:'right',marginBottom:12},input:{height:105,borderWidth:2,borderColor:'#85828a',borderRadius:7,paddingHorizontal:24,fontSize:23,color:'#222',backgroundColor:'#fbf8ff'},hint:{fontSize:12,color:'#6b7280',textAlign:'right',marginTop:9},button:{height:88,borderRadius:48,backgroundColor:'#5966a0',alignItems:'center',justifyContent:'center',marginTop:28},buttonText:{fontSize:28,color:'#fff',fontWeight:'600'}});