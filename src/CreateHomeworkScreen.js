import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { db, firebaseReady } from './firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SUBJECTS=[{id:'chemistry',title:'الكيمياء'},{id:'physics',title:'الفيزياء'},{id:'biology',title:'الأحياء'}];
const LEVELS=[{id:'first',title:'الأول الثانوي'},{id:'second',title:'الثاني الثانوي'},{id:'third',title:'الثالث الثانوي'}];

export default function CreateHomeworkScreen({subject:subjectProp='chemistry',studentLevel:levelProp='first'}){
 const[title,setTitle]=useState(''),[note,setNote]=useState(''),[dueDate,setDueDate]=useState(''),[subject,setSubject]=useState(subjectProp),[studentLevel,setStudentLevel]=useState(levelProp),[questions,setQuestions]=useState([{id:`${Date.now()}`,text:''}]),[busy,setBusy]=useState(false);
 const addQuestion=()=>setQuestions(old=>[...old,{id:`${Date.now()}-${old.length}`,text:''}]);
 const updateQuestion=(id,text)=>setQuestions(old=>old.map(q=>q.id===id?{...q,text}:q));
 const removeQuestion=id=>{if(questions.length>1)setQuestions(old=>old.filter(q=>q.id!==id));};
 const publishHomework=async()=>{
  const cleanQuestions=questions.map(q=>q.text.trim()).filter(Boolean);
  if(!title.trim()||!cleanQuestions.length)return Alert.alert('خطأ','أدخل عنوان الواجب وسؤالًا واحدًا على الأقل.');
  if(!firebaseReady||!db)return Alert.alert('Firebase غير مفعّل','لا يمكن نشر الواجب للطلاب الآن. يجب ربط التطبيق بمشروع Firebase أولًا.');
  setBusy(true);
  try{
   const payload={title:title.trim(),note:note.trim(),description:note.trim(),dueDate:dueDate.trim(),subject,studentLevel,questions:cleanQuestions.map((text,index)=>({id:`q-${index+1}`,type:'text',text})),allowResubmit:false,createdAt:serverTimestamp()};
   await addDoc(collection(db,'homeworks'),payload);
   Alert.alert('تم النشر','تم نشر الواجب للطلاب، وبعد التسليم لن يُسمح بإرسال جديد.');
   setTitle('');setNote('');setDueDate('');setQuestions([{id:`${Date.now()}`,text:''}]);
  }catch(error){console.error('publishHomework',error);Alert.alert('خطأ في Firebase','تعذر نشر الواجب. تحقق من اتصال الإنترنت وقواعد Firestore.');}
  finally{setBusy(false);}
 };
 return <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
  <Text style={styles.headerTitle}>إنشاء واجب جديد</Text><Text style={styles.helper}>الواجب مستقل عن الاختبارات، ومربوط بالمادة والصف.</Text>
  <Text style={styles.label}>عنوان الواجب</Text><TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="مثال: واجب الفصل الأول" placeholderTextColor="#888" textAlign="right"/>
  <Text style={styles.label}>المادة</Text><View style={styles.row}>{SUBJECTS.map(item=><TouchableOpacity key={item.id} style={[styles.choice,subject===item.id&&styles.active]} onPress={()=>setSubject(item.id)}><Text style={[styles.choiceText,subject===item.id&&styles.activeText]}>{item.title}</Text></TouchableOpacity>)}</View>
  <Text style={styles.label}>الصف الدراسي</Text><View style={styles.row}>{LEVELS.map(item=><TouchableOpacity key={item.id} style={[styles.choice,studentLevel===item.id&&styles.active]} onPress={()=>setStudentLevel(item.id)}><Text style={[styles.choiceText,studentLevel===item.id&&styles.activeText]}>{item.title}</Text></TouchableOpacity>)}</View>
  <Text style={styles.label}>آخر موعد للتسليم</Text><TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="مثال: 2026-10-20 20:00" placeholderTextColor="#888" textAlign="right"/>
  <Text style={styles.label}>ملاحظة للطلاب</Text><TextInput style={[styles.input,styles.textArea]} value={note} onChangeText={setNote} multiline placeholder="اكتب التعليمات أو الملاحظة..." placeholderTextColor="#888" textAlign="right"/>
  <Text style={styles.sectionTitle}>أسئلة الواجب</Text>
  {questions.map((q,index)=><View key={q.id} style={styles.questionCard}><Text style={styles.questionNumber}>السؤال {index+1}</Text><TextInput style={[styles.input,styles.textAreaSmall]} value={q.text} onChangeText={v=>updateQuestion(q.id,v)} multiline placeholder="اكتب سؤال الواجب..." placeholderTextColor="#888" textAlign="right"/>{questions.length>1&&<TouchableOpacity onPress={()=>removeQuestion(q.id)}><Text style={styles.remove}>حذف السؤال</Text></TouchableOpacity>}</View>)}
  <TouchableOpacity style={styles.addQuestion} onPress={addQuestion}><Text style={styles.addQuestionText}>+ إضافة سؤال آخر</Text></TouchableOpacity>
  <View style={styles.lockBox}><Text style={styles.lockTitle}>🔒 محاولة تسليم واحدة</Text><Text style={styles.lockText}>بعد إرسال الطالب للواجب، يُغلق الواجب ولا يمكن إعادة الإرسال.</Text></View>
  <TouchableOpacity style={[styles.publishBtn,busy&&styles.disabled]} onPress={publishHomework} disabled={busy}><Text style={styles.publishBtnText}>{busy?'جارٍ النشر...':'نشر الواجب للطلاب'}</Text></TouchableOpacity>
 </ScrollView>;
}
const styles=StyleSheet.create({container:{padding:20,backgroundColor:'#0f172a',flexGrow:1},headerTitle:{fontSize:23,fontWeight:'bold',color:'#fff',textAlign:'center',marginBottom:7,marginTop:10},helper:{color:'#94a3b8',textAlign:'center',marginBottom:20},label:{color:'#38bdf8',fontSize:16,marginBottom:8,fontWeight:'bold',textAlign:'right'},input:{backgroundColor:'#1e293b',color:'#fff',padding:12,borderRadius:8,marginBottom:15,fontSize:16,borderWidth:1,borderColor:'#334155'},textArea:{height:100,textAlignVertical:'top'},textAreaSmall:{height:85,textAlignVertical:'top'},row:{flexDirection:'row-reverse',flexWrap:'wrap',marginBottom:14},choice:{padding:10,marginLeft:6,marginBottom:6,backgroundColor:'#1e293b',borderRadius:8,borderWidth:1,borderColor:'#334155'},active:{backgroundColor:'#0284c7',borderColor:'#38bdf8'},choiceText:{color:'#cbd5e1',fontSize:12},activeText:{color:'#fff',fontWeight:'bold'},sectionTitle:{color:'#fff',fontSize:19,fontWeight:'bold',marginVertical:10,textAlign:'right'},questionCard:{backgroundColor:'#111c31',borderRadius:10,padding:12,marginBottom:10},questionNumber:{color:'#fff',fontWeight:'bold',marginBottom:8,textAlign:'right'},remove:{color:'#fb7185',textAlign:'right',marginBottom:4},addQuestion:{borderWidth:1,borderColor:'#38bdf8',borderRadius:8,padding:12,alignItems:'center',marginBottom:14},addQuestionText:{color:'#38bdf8',fontWeight:'bold'},lockBox:{backgroundColor:'#172554',borderRadius:10,padding:14,marginBottom:16},lockTitle:{color:'#fff',fontWeight:'bold',textAlign:'right',marginBottom:5},lockText:{color:'#bfdbfe',textAlign:'right',lineHeight:20},publishBtn:{backgroundColor:'#10b981',padding:15,borderRadius:8,alignItems:'center',marginTop:4},disabled:{opacity:.6},publishBtnText:{color:'#fff',fontSize:18,fontWeight:'bold'}});