import { getCloudStudent } from './cloud';
import { readJson, setSession, storageKeys, type LocalStudent, writeJson } from './storage';

async function getFingerprintModule(){
  return import('expo-local-authentication');
}

export async function fingerprintSupported(){
  const LocalAuthentication=await getFingerprintModule();
  const hardware=await LocalAuthentication.hasHardwareAsync();
  const enrolled=await LocalAuthentication.isEnrolledAsync();
  const types=await LocalAuthentication.supportedAuthenticationTypesAsync();
  return {LocalAuthentication,hardware,enrolled,fingerprint:types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)};
}

export async function linkStudentFingerprint(code:string){
  const support=await fingerprintSupported();
  if(!support.hardware||!support.enrolled||!support.fingerprint)return {ok:false,reason:'unsupported' as const};
  const result=await support.LocalAuthentication.authenticateAsync({promptMessage:'تأكيد بصمة الطالب',cancelLabel:'إلغاء',disableDeviceFallback:true});
  if(!result.success)return {ok:false,reason:'cancelled' as const};
  await writeJson(storageKeys.studentBiometricCode,code);
  return {ok:true as const};
}

export async function loginStudentByFingerprint(localStudents:LocalStudent[]=[]){
  const code=await readJson<string>(storageKeys.studentBiometricCode,'');
  if(!/^\d{6}$/.test(code))return {ok:false,reason:'not-linked' as const};
  const support=await fingerprintSupported();
  if(!support.hardware||!support.enrolled||!support.fingerprint)return {ok:false,reason:'unsupported' as const};
  let student:LocalStudent|null=null;
  try{student=await getCloudStudent(code)}catch{student=localStudents.find(s=>s.code===code)||null}
  if(!student)return {ok:false,reason:'missing' as const};
  if(!student.active)return {ok:false,reason:'inactive' as const};
  const result=await support.LocalAuthentication.authenticateAsync({promptMessage:'بصمة الطالب للدخول',cancelLabel:'إلغاء',disableDeviceFallback:true});
  if(!result.success)return {ok:false,reason:'cancelled' as const};
  await setSession({role:'student',name:student.name,grade:student.grade,code:student.code,active:true});
  return {ok:true as const,student};
}
