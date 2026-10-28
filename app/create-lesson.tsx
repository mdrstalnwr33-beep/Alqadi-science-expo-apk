import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { subjects } from '../src/data';
import { readJson, writeJson } from '../src/storage';
import { publishLesson, publishNotice } from '../src/contentCloud';

export default function CreateLessonScreen(){
 const p=useLocalSearchParams<{subject?:string;grade?:string}>();
 const [subject,setSubject]=useState(p.subject||''); const [title,setTitle]=useState(''); const [body,setBody]=useState('');
 const save=async()=>{
  if(!subject.trim())return Alert.alert('اختر المادة','يجب اختيار المادة التي ينتمي إليها الدرس قبل الحفظ.');
  if(!title.trim()||!body.trim())return Alert.alert('بيانات ناقصة','اكتب عنوان الدرس ومحتواه.');
  const grade=p.grade||'الأول الثانوي';
  const key=`custom-lessons:${grade}:${subject}`;
  const current=await readJson<any[]>(key,[]);
  const item={id:`custom-lesson-${Date.now()}`,title:title.trim(),subject,grade,date:new Date().toLocaleDateString('ar-YE'),body:body.trim()};
  await writeJson(key,[...current,item]);
  const all=await readJson<any[]>('custom-lessons-all',[]);
  await writeJson('custom-lessons-all',[...all,item]);
  try { const summary=body.trim().split(/[.!؟\n]/).filter(Boolean).slice(0,2).join(' • '); await publishLesson({...item,summary,createdAt:Date.now()}); await publishNotice({id:`notice-${item.id}`,grade:item.grade,title:`درس جديد في ${subject}`,body:item.title,createdAt:Date.now()}); Alert.alert('تم النشر','تم ربط الدرس بمادة '+subject+' ونشره لطلاب '+grade+'.'); } catch (error) { const code=String((error as any)?.code||'unknown'); Alert.alert('تعذر النشر السحابي',code.includes('permission-denied')?'صلاحيات Firestore غير منشورة. افتح FIREBASE_DEPLOY.md وانشر firestore.rules.':`تعذر الاتصال بالسحابة (${code}).`); } router.back();
 };
 return <ScrollView contentContainerStyle={styles.page}><Text style={styles.back} onPress={()=>router.back()}>رجوع</Text><Text style={styles.title}>إضافة درس جديد</Text><Text style={styles.scope}>{p.grade||'الأول الثانوي'} • {subject||'اختر المادة'}</Text><Text style={styles.label}>المادة الدراسية</Text><View style={styles.subjects}>{subjects.map(s=><Pressable key={s.name} onPress={()=>setSubject(s.name)} style={[styles.subject,subject===s.name&&styles.subjectSelected]}><Text style={[styles.subjectText,subject===s.name&&styles.subjectTextSelected]}>{s.icon} {s.name}</Text></Pressable>)}</View><Text style={styles.label}>عنوان الدرس</Text><TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="مثال: قوانين الحركة" textAlign="right"/><Text style={styles.label}>محتوى الدرس</Text><TextInput value={body} onChangeText={setBody} style={[styles.input,styles.area]} placeholder="اكتب شرح الدرس والأسئلة والملاحظات..." multiline textAlign="right" textAlignVertical="top"/><Pressable style={styles.button} onPress={save}><Text style={styles.buttonText}>حفظ ونشر الدرس</Text></Pressable></ScrollView>
}
const styles=StyleSheet.create({page:{padding:20,paddingTop:55,backgroundColor:'#f4f7fb',minHeight:'100%'},back:{textAlign:'right',color:'#356ae6',fontWeight:'800',marginBottom:15},title:{fontSize:28,fontWeight:'900',textAlign:'right',color:'#14213d'},scope:{textAlign:'right',color:'#667085',marginTop:5,marginBottom:25},label:{textAlign:'right',fontWeight:'800',color:'#344054',marginTop:12,marginBottom:7},subjects:{gap:8,marginBottom:8},subject:{backgroundColor:'#fff',borderWidth:1,borderColor:'#d0d5dd',borderRadius:12,padding:12},subjectSelected:{borderColor:'#17324d',backgroundColor:'#eaf1f8'},subjectText:{fontSize:15,fontWeight:'800',color:'#344054',textAlign:'right'},subjectTextSelected:{color:'#17324d'},input:{backgroundColor:'#fff',borderWidth:1,borderColor:'#d0d5dd',borderRadius:13,padding:14,fontSize:16,color:'#101828'},area:{minHeight:230},button:{marginTop:25,backgroundColor:'#17324d',borderRadius:14,padding:16,alignItems:'center'},buttonText:{color:'#fff',fontSize:17,fontWeight:'900'}});