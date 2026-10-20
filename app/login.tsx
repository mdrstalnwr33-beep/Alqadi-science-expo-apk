import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { grades } from '../src/data';
import { claimStudentDevice, getCloudStudent, getCloudTeacherCode } from '../src/cloud';
import { getDeviceId } from '../src/device';
import { readJson, setSession, storageKeys, type LocalStudent, writeJson } from '../src/storage';

const INITIAL_TEACHER_CODE = '900001';
const normalizeCode=(value:string)=>value.replace(/\D/g,'').slice(0,6);
const TEACHER_NAME='الأستاذ محمد القاضي الوصابي';

export default function LoginScreen(){
 const p=useLocalSearchParams<{role?:string}>();
 const role=p.role==='teacher'?'teacher':'student';
 const [code,setCode]=useState(''); const [busy,setBusy]=useState(false); const [biometricReady,setBiometricReady]=useState(false);
 const [students,setStudents]=useState<LocalStudent[]>([]); const [teacherCode,setTeacherCode]=useState(INITIAL_TEACHER_CODE);
 useEffect(()=>{(async()=>{const [ss,localCode,enabled]=await Promise.all([readJson<LocalStudent[]>(storageKeys.students,[]),readJson<string>('teacher-code',INITIAL_TEACHER_CODE),readJson<boolean>(storageKeys.teacherBiometric,false)]);setStudents(ss);setTeacherCode(/^\d{6}$/.test(localCode)?localCode:INITIAL_TEACHER_CODE);if(role==='teacher')setBiometricReady(enabled)})()},[role]);
 const goTeacherHome=async(authCode:string)=>{await setSession({role:'teacher',name:TEACHER_NAME,grade:grades[0],code:authCode,active:true});router.dismissAll();return router.replace({pathname:'/home',params:{role:'teacher',name:TEACHER_NAME,grade:grades[0],code:authCode}})};
 const enableBiometric=async(validatedCode:string)=>{try{const LocalAuthentication=await import('expo-local-authentication');const hardware=await LocalAuthentication.hasHardwareAsync();const enrolled=await LocalAuthentication.isEnrolledAsync();if(!hardware||!enrolled)return Alert.alert('البصمة غير متاحة','يجب أن يدعم الجهاز التحقق الحيوي وأن تكون البصمة مسجلة في إعدادات الجهاز.');const result=await LocalAuthentication.authenticateAsync({promptMessage:'تأكيد بصمة المعلم',cancelLabel:'إلغاء',disableDeviceFallback:true});if(result.success){await writeJson(storageKeys.teacherBiometric,true);await writeJson('teacher-biometric-code',validatedCode);setBiometricReady(true);Alert.alert('تم التفعيل','يمكنك الآن دخول حساب المعلم بالبصمة دون إدخال الكود.')}}catch{Alert.alert('تعذر تفعيل البصمة','تحقق من إعدادات البصمة في الجهاز وحاول مرة أخرى.')}};
 const biometricLogin=async()=>{setBusy(true);try{const enabled=await readJson<boolean>(storageKeys.teacherBiometric,false);const savedCode=await readJson<string>('teacher-biometric-code','');if(!enabled||!/^\d{6}$/.test(savedCode))return Alert.alert('البصمة غير مفعلة','أدخل كود المعلم مرة واحدة ثم فعّل الدخول بالبصمة.');const LocalAuthentication=await import('expo-local-authentication');const hardware=await LocalAuthentication.hasHardwareAsync();const enrolled=await LocalAuthentication.isEnrolledAsync();if(!hardware||!enrolled)return Alert.alert('البصمة غير متاحة','لا توجد بصمة مسجلة على هذا الجهاز.');let valid=savedCode===teacherCode;try{const cloudCode=await getCloudTeacherCode();if(cloudCode)valid=savedCode===cloudCode}catch{}if(!valid)return Alert.alert('الكود تغير','تم تغيير كود المعلم. سجّل الدخول بالكود الجديد لتفعيل البصمة من جديد.');const result=await LocalAuthentication.authenticateAsync({promptMessage:'بصمة المعلم للدخول',cancelLabel:'إلغاء',disableDeviceFallback:true});if(!result.success)return;await goTeacherHome(savedCode)}catch{Alert.alert('تعذر الدخول بالبصمة','حدث خطأ أثناء التحقق الحيوي. يمكنك الدخول بكود المعلم.')}finally{setBusy(false)}};
 const enter=async()=>{
  if(!/^\d{6}$/.test(code))return Alert.alert('كود غير صحيح','يجب أن يتكون كود الدخول من ستة أرقام فقط.');
  setBusy(true);
  try{
   if(role==='teacher'){
    let valid=code===teacherCode;try{const cloudCode=await getCloudTeacherCode();if(cloudCode)valid=code===cloudCode}catch{}
    if(!valid)return Alert.alert('كود المعلم غير صحيح','الكود غير موجود أو تم تغييره من قبل المعلم.');
    await goTeacherHome(code);
    const enabled=await readJson<boolean>(storageKeys.teacherBiometric,false);if(!enabled)Alert.alert('🔐 تفعيل الدخول بالبصمة؟','يمكنك في المرات القادمة دخول حساب المعلم ببصمتك بدل إدخال الكود.',[{text:'ليس الآن',style:'cancel'},{text:'تفعيل البصمة',onPress:()=>enableBiometric(code)}]);
    return;
   }
   let student:LocalStudent|null=null;try{student=await getCloudStudent(code)}catch{student=students.find(s=>s.code===code)||null;if(!student)return Alert.alert('تعذر الاتصال','تعذر الاتصال بالسحابة ولا يوجد هذا الطالب محفوظًا على هذا الجهاز.')}
   if(!student)student=students.find(s=>s.code===code)||null;if(!student)return Alert.alert('الكود غير موجود','هذا الكود لم ينشئه المعلم.');if(!student.active)return Alert.alert('الحساب موقوف','تم إيقاف هذا الطالب من قبل المعلم.');
   const deviceId=await getDeviceId();let claim:'claimed'|'same-device'|'occupied'|'inactive'|'missing';try{claim=await claimStudentDevice(code,deviceId)}catch{claim='same-device'}
   if(claim==='occupied')return Alert.alert('الحساب مستخدم على جهاز آخر','هذا الكود مسجل الدخول من جهاز آخر. سجّل الخروج من الجهاز الآخر أولًا.');if(claim==='inactive')return Alert.alert('الحساب موقوف','تم إيقاف هذا الطالب من قبل المعلم.');if(claim==='missing'&&!students.some(s=>s.code===code))return Alert.alert('الكود غير موجود','لم يتم العثور على سجل الطالب.');
   await setSession({role:'student',name:student.name,grade:student.grade,code:student.code,active:true});router.dismissAll();router.replace({pathname:'/home',params:{role:'student',name:student.name,grade:student.grade,code:student.code}});
  }finally{setBusy(false)}
 };
 return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={Platform.OS==='ios'?10:25}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
  <View style={styles.header}><Pressable onPress={()=>router.back()}><Text style={styles.arrow}>→</Text></Pressable><Text style={styles.title}>{role==='student'?'دخول الطالب':'دخول المعلم'}</Text></View>
  <View style={styles.avatar}><Text style={styles.avatarText}>{role==='teacher'?'👨‍🏫':'●'}</Text></View>
  <View style={styles.card}><Text style={styles.label}>{role==='student'?'كود الطالب':'كود المعلم'}</Text>
   {role==='teacher'&&biometricReady&&<Pressable disabled={busy} style={styles.biometric} onPress={biometricLogin}><Text style={styles.biometricText}>🔐 دخول المعلم بالبصمة</Text></Pressable>}
   <TextInput value={code} onChangeText={v=>setCode(normalizeCode(v))} placeholder="أدخل 6 أرقام" placeholderTextColor="#6b7280" style={styles.input} textAlign="center" keyboardType="number-pad" inputMode="numeric" maxLength={6} secureTextEntry={false}/>
   <Text style={styles.hint}>{role==='teacher'&&biometricReady?'يمكنك استخدام البصمة أو كود المعلم.':'الكود مكوّن من 6 أرقام فقط ولا يحتوي على حروف.'}</Text>
   <Pressable disabled={busy} style={[styles.button,busy&&{opacity:.6}]} onPress={enter}><Text style={styles.buttonText}>{busy?'جارٍ التحقق...':'دخول'}</Text></Pressable>
  </View>
 </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
const styles=StyleSheet.create({flex:{flex:1},safe:{flex:1,backgroundColor:'#fbf8ff'},scroll:{flexGrow:1,paddingHorizontal:37,paddingTop:40,paddingBottom:35,justifyContent:'center'},header:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between'},arrow:{fontSize:39,color:'#202020',fontWeight:'300'},title:{fontSize:38,fontWeight:'800',color:'#171717'},avatar:{alignItems:'center',marginTop:55,marginBottom:42},avatarText:{fontSize:72,color:'#202020'},card:{width:'100%'},label:{fontSize:26,fontWeight:'700',color:'#303038',textAlign:'right',marginBottom:12},input:{height:105,borderWidth:2,borderColor:'#85828a',borderRadius:7,paddingHorizontal:24,fontSize:23,color:'#222',backgroundColor:'#fbf8ff'},hint:{fontSize:12,color:'#6b7280',textAlign:'right',marginTop:9},button:{height:88,borderRadius:48,backgroundColor:'#5966a0',alignItems:'center',justifyContent:'center',marginTop:28},buttonText:{fontSize:28,color:'#fff',fontWeight:'600'},biometric:{height:72,borderRadius:36,backgroundColor:'#17324d',alignItems:'center',justifyContent:'center',marginBottom:18},biometricText:{color:'#fff',fontSize:19,fontWeight:'900'}});
