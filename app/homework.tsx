import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { homework } from '../src/data';
import { getCustomHomework, type CustomHomework } from '../src/assessmentStore';
import { readJson, storageKeys, writeJson } from '../src/storage';
import { saveHomeworkSubmission } from '../src/assessmentCloud';
import { getCloudHomework } from '../src/contentCloud';
import { Action, Card, Page, Section, C } from '../src/ui';

export default function HomeworkScreen(){
 const p=useLocalSearchParams<{role?:string;grade?:string;subject?:string;name?:string;code?:string}>();
 const teacher=p.role==='teacher'; const [cloud,setCloud]=useState<CustomHomework[]>([]); const [custom,setCustom]=useState<CustomHomework[]>([]);
 useEffect(()=>{getCustomHomework().then(setCustom); if(p.grade&&p.subject)getCloudHomework(p.grade,p.subject).then(setCloud).catch(()=>setCloud([]));},[p.grade,p.subject]);
 const merged=new Map<string,CustomHomework>();
 [...homework,...custom,...cloud].forEach(h=>merged.set(String(h.id),h));
 const list=[...merged.values()].filter(h=>(!p.subject||h.subject===p.subject)&&(!p.grade||h.grade===p.grade));
 const [selectedId,setSelectedId]=useState<string|undefined>(); const current=list.find(h=>h.id===(selectedId||list[0]?.id));
 const key=current?storageKeys.homeworkSubmission((p.name||'طالب').trim(),current.id):'';
 const [answers,setAnswers]=useState<Record<string,string>>({}); const [photo,setPhoto]=useState<string>(); const [sent,setSent]=useState(false);
 useEffect(()=>{if(!current||teacher)return;readJson<{answers:Record<string,string>;photo?:string;sent:boolean}|null>(key,null).then(saved=>{if(saved){setAnswers(saved.answers||{});setPhoto(saved.photo);setSent(!!saved.sent);}})},[key,teacher,current?.id]);
 const choose=(id:string)=>{setSelectedId(id);setAnswers({});setPhoto(undefined);setSent(false);};
 const attach=async()=>{const perm=await ImagePicker.requestMediaLibraryPermissionsAsync();if(!perm.granted)return Alert.alert('صلاحية مطلوبة','اسمح بالوصول إلى الصور لاختيار صورة الدفتر.');const r=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:.8});if(!r.canceled)setPhoto(r.assets[0].uri);};
 const send=async()=>{if(!current)return;if(current.questions.some(q=>!answers[q]?.trim()))return Alert.alert('الواجب غير مكتمل','أجب عن جميع الأسئلة قبل الإرسال.');await writeJson(key,{answers,photo,sent:true});
  try{await saveHomeworkSubmission({id:`${p.code||p.name||'student'}-${current.id}`,studentCode:p.code||p.name||'student',studentName:p.name||'الطالب',grade:current.grade,subject:current.subject,homeworkId:current.id,title:current.title,answers,submittedAt:Date.now()});}catch{}
  setSent(true);Alert.alert('تم الإرسال','تم حفظ الواجب وإرساله للمزامنة. لا يمكن إعادة الإرسال من هذا الجهاز.');};
 return <Page title={teacher?'الواجبات وإدارة الأسئلة':'الواجبات المدرسية'} subtitle={teacher?'أنشئ واجبًا وأضف أسئلته':'حل الواجب وإرساله'} onBack={()=>router.back()}>
  {teacher&&<Action label="إنشاء واجب جديد وإضافة أسئلة" icon="＋" onPress={()=>router.push({pathname:'/create-homework',params:{grade:p.grade,subject:p.subject}})} />}
  <Section title={teacher?'الواجبات المنشورة':'الواجبات المطلوبة'}>{list.map(h=><Card key={h.id}><Text style={{fontSize:18,fontWeight:'900',color:C.navy,textAlign:'right'}}>{h.title}</Text><Text style={{color:C.muted,textAlign:'right',marginTop:5}}>{h.subject} • {h.grade} • التسليم: {h.due}</Text><Text style={{color:C.text,textAlign:'right',marginTop:9,lineHeight:23}}>{h.note}</Text>{!teacher&&<Action label={current?.id===h.id?'الواجب المحدد':'حل هذا الواجب'} icon="✍️" secondary={current?.id!==h.id} onPress={()=>choose(h.id)} />}</Card>)}</Section>
  {!teacher&&current&&<Section title={sent?'تم التسليم':'أسئلة الواجب'}>{sent?<Card><Text style={{fontSize:19,fontWeight:'900',color:C.green,textAlign:'center'}}>✓ تم إرسال الواجب للمعلم</Text></Card>:<><Card>{current.questions.map((q,i)=><View key={q} style={{marginTop:i?14:0}}><Text style={{fontWeight:'800',color:C.text,textAlign:'right'}}>{i+1}. {q}</Text><TextInput multiline value={answers[q]||''} onChangeText={v=>setAnswers(a=>({...a,[q]:v}))} placeholder="اكتب إجابتك..." placeholderTextColor="#98a2b3" textAlign="right" style={{borderWidth:1,borderColor:C.border,borderRadius:11,padding:10,minHeight:70,marginTop:6,textAlignVertical:'top'}}/></View>)}</Card><Pressable onPress={attach} style={{padding:13,borderWidth:1,borderColor:C.border,borderRadius:12,marginTop:2,backgroundColor:'#f8fafc'}}><Text style={{textAlign:'center',fontWeight:'800',color:C.navy}}>📷 إرفاق صورة الدفتر</Text></Pressable>{photo&&<Image source={{uri:photo}} style={{width:'100%',height:180,borderRadius:12,marginTop:10}}/>}<Pressable onPress={send} style={{backgroundColor:C.navy,borderRadius:13,padding:15,marginTop:12}}><Text style={{color:'#fff',textAlign:'center',fontWeight:'900'}}>إرسال الواجب للمعلم</Text></Pressable></>}</Section>}
 </Page>;
}
