import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { subjects } from '../src/data';
import { readJson, writeJson } from '../src/storage';
import { publishLesson, publishNotice, updateLesson } from '../src/contentCloud';

export default function CreateLessonScreen(){
 const p=useLocalSearchParams<{subject?:string;grade?:string;id?:string;title?:string;body?:string}>();
 const [subject,setSubject]=useState(p.subject||''); const [title,setTitle]=useState(p.title||''); const [body,setBody]=useState(p.body||'');
 const editing=!!p.id;
 useEffect(()=>{if(!p.id)return; (async()=>{const all=await readJson<any[]>('custom-lessons-all',[]);const item=all.find(x=>x.id===p.id);if(item){setSubject(item.subject||p.subject||'');setTitle(item.title||'');setBody(item.body||'');}})();},[p.id,p.subject]);
 const save=async()=>{
  if(!subject.trim())return Alert.alert('اختر المادة','يجب اختيار المادة التي ينتمي إليها الدرس قبل الحفظ.');
  if(!title.trim()||!body.trim())return Alert.alert('بيانات ناقصة','اكتب عنوان الدرس ومحتواه.');
  const grade=p.grade||'الأول الثانوي';
  const now=Date.now();
  const currentAll=await readJson<any[]>('custom-lessons-all',[]);
  const old=currentAll.find(x=>x.id===p.id);
  const item={id:p.id||`custom-lesson-${now}`,title:title.trim(),subject,grade,date:old?.date||new Date().toLocaleDateString('ar-YE'),body:body.trim(),createdAt:old?.createdAt||now};
  const nextAll=editing?currentAll.map(x=>x.id===item.id?item:x):[...currentAll,item];
  await writeJson('custom-lessons-all',nextAll);
  const oldKey=old?`custom-lessons:${old.grade}:${old.subject}`:`custom-lessons:${grade}:${subject}`;
  const oldItems=await readJson<any[]>(oldKey,[]);
  if(editing&&old&&(old.grade!==item.grade||old.subject!==item.subject))await writeJson(oldKey,oldItems.filter(x=>x.id!==item.id));
  const newKey=`custom-lessons:${item.grade}:${item.subject}`;
  const newItems=await readJson<any[]>(newKey,[]);
  await writeJson(newKey,editing?newItems.map(x=>x.id===item.id?item:x).concat(newItems.some(x=>x.id===item.id)?[]:[item]):[...newItems,item]);
  try {
   const summary=item.body.split(/[.!؟\n]/).filter(Boolean).slice(0,2).join(' • ');
   if(editing) await updateLesson({...item,summary}); else await publishLesson({...item,summary});
   if(!editing) await publishNotice({id:`notice-${item.id}`,grade:item.grade,title:`درس جديد في ${subject}`,body:item.title,createdAt:now});
   Alert.alert(editing?'تم التعديل':'تم النشر',editing?'تم تحديث الدرس بنجاح.':'تم ربط الدرس بالمادة ونشره للطلاب.');
  } catch (error) {
   const code=String((error as any)?.code||'unknown');
   Alert.alert(editing?'تعذر التعديل':'تعذر النشر السحابي',code.includes('permission-denied')?'صلاحيات Firestore غير منشورة. افتح FIREBASE_DEPLOY.md وانشر firestore.rules.':`تعذر الاتصال بالسحابة (${code}).`);
  }
  router.back();
 };
 return <ScrollView contentContainerStyle={styles.page}><Text style={styles.back} onPress={()=>router.back()}>رجوع</Text><Text style={styles.title}>{editing?'تعديل الدرس':'إضافة درس جديد'}</Text><Text style={styles.scope}>{p.grade||'الأول الثانوي'} • {subject||'اختر المادة'}</Text><Text style={styles.label}>المادة الدراسية</Text><View style={styles.subjects}>{subjects.map(s=><Pressable key={s.name} onPress={()=>setSubject(s.name)} style={[styles.subject,subject===s.name&&styles.subjectSelected]}><Text style={[styles.subjectText,subject===s.name&&styles.subjectTextSelected]}>{s.icon} {s.name}</Text></Pressable>)}</View><Text style={styles.label}>عنوان الدرس</Text><TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="مثال: قوانين الحركة" textAlign="right"/><Text style={styles.label}>محتوى الدرس</Text><TextInput value={body} onChangeText={setBody} style={[styles.input,styles.area]} placeholder="اكتب شرح الدرس والأسئلة والملاحظات..." multiline textAlign="right" textAlignVertical="top"/><Pressable style={styles.button} onPress={save}><Text style={styles.buttonText}>{editing?'💾 حفظ التعديل':'حفظ ونشر الدرس'}</Text></Pressable></ScrollView>
}
const styles=StyleSheet.create({page:{padding:20,paddingTop:55,backgroundColor:'#f4f7fb',minHeight:'100%'},back:{textAlign:'right',color:'#356ae6',fontWeight:'800',marginBottom:15},title:{fontSize:28,fontWeight:'900',textAlign:'right',color:'#14213d'},scope:{textAlign:'right',color:'#667085',marginTop:5,marginBottom:25},label:{textAlign:'right',fontWeight:'800',color:'#344054',marginTop:12,marginBottom:7},subjects:{gap:8,marginBottom:8},subject:{backgroundColor:'#fff',borderWidth:1,borderColor:'#d0d5dd',borderRadius:12,padding:12},subjectSelected:{borderColor:'#17324d',backgroundColor:'#eaf1f8'},subjectText:{fontSize:15,fontWeight:'800',color:'#344054',textAlign:'right'},subjectTextSelected:{color:'#17324d'},input:{backgroundColor:'#fff',borderWidth:1,borderColor:'#d0d5dd',borderRadius:13,padding:14,fontSize:16,color:'#101828'},area:{minHeight:230},button:{marginTop:25,backgroundColor:'#17324d',borderRadius:14,padding:16,alignItems:'center'},buttonText:{color:'#fff',fontSize:17,fontWeight:'900'}});