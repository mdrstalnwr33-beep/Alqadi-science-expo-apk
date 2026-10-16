import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { lessons as initialLessons } from '../src/data';
import { readJson, writeJson } from '../src/storage';
import { publishLesson, publishNotice } from '../src/contentCloud';

export default function CreateLessonScreen(){
 const p=useLocalSearchParams<{subject?:string;grade?:string}>();
 const [title,setTitle]=useState(''); const [body,setBody]=useState('');
 const save=async()=>{
  if(!title.trim()||!body.trim())return Alert.alert('بيانات ناقصة','اكتب عنوان الدرس ومحتواه.');
  const key=`custom-lessons:${p.grade||''}:${p.subject||''}`;
  const current=await readJson<any[]>(key,[]);
  const item={id:`custom-lesson-${Date.now()}`,title:title.trim(),subject:p.subject||'الكيمياء',grade:p.grade||'الأول الثانوي',date:new Date().toLocaleDateString('ar-YE'),body:body.trim()};
  await writeJson(key,[...current,item]);
  await writeJson('custom-lessons-all',[...await readJson<any[]>('custom-lessons-all',[]),item]);
  try { const summary=body.trim().split(/[.!؟\n]/).filter(Boolean).slice(0,2).join(' • '); await publishLesson({...item,summary,createdAt:Date.now()}); await publishNotice({id:`notice-${item.id}`,grade:item.grade,title:'درس جديد',body:item.title,createdAt:Date.now()}); Alert.alert('تم النشر السحابي','وصل الدرس إلى طلاب الصف.'); } catch { Alert.alert('حُفظ محليًا','تعذر الاتصال بالسحابة؛ سيبقى الدرس على هذا الجهاز حتى إعادة المحاولة.'); } router.back();
 };
 return <ScrollView contentContainerStyle={styles.page}><Text style={styles.back} onPress={()=>router.back()}>رجوع</Text><Text style={styles.title}>إضافة درس جديد</Text><Text style={styles.scope}>{p.grade} • {p.subject}</Text><Text style={styles.label}>عنوان الدرس</Text><TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="مثال: قوانين الحركة" textAlign="right"/><Text style={styles.label}>محتوى الدرس</Text><TextInput value={body} onChangeText={setBody} style={[styles.input,styles.area]} placeholder="اكتب شرح الدرس والأسئلة والملاحظات..." multiline textAlign="right" textAlignVertical="top"/><Pressable style={styles.button} onPress={save}><Text style={styles.buttonText}>حفظ ونشر الدرس</Text></Pressable></ScrollView>
}
const styles=StyleSheet.create({page:{padding:20,paddingTop:55,backgroundColor:'#f4f7fb',minHeight:'100%'},back:{textAlign:'right',color:'#356ae6',fontWeight:'800',marginBottom:15},title:{fontSize:28,fontWeight:'900',textAlign:'right',color:'#14213d'},scope:{textAlign:'right',color:'#667085',marginTop:5,marginBottom:25},label:{textAlign:'right',fontWeight:'800',color:'#344054',marginTop:12,marginBottom:7},input:{backgroundColor:'#fff',borderWidth:1,borderColor:'#d0d5dd',borderRadius:13,padding:14,fontSize:16,color:'#101828'},area:{minHeight:230},button:{marginTop:25,backgroundColor:'#17324d',borderRadius:14,padding:16,alignItems:'center'},buttonText:{color:'#fff',fontSize:17,fontWeight:'900'}});
