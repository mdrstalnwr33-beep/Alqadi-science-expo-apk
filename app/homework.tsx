import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { homework } from '../src/data';
import { getCustomHomework, type CustomHomework, type HomeworkQuestion } from '../src/assessmentStore';
import { readJson, storageKeys, writeJson } from '../src/storage';
import { saveHomeworkSubmission } from '../src/assessmentCloud';
import { getCloudHomework } from '../src/contentCloud';
import { Action, Card, Page, Section, C } from '../src/ui';

const normalizeQuestions = (questions: any[]): HomeworkQuestion[] => questions.map((q, i) => {
 if (typeof q === 'string') return { id:`legacy-${i}`, type:'text', question:q };
 return {
  id:String(q.id||`hq-${i}`),
  type:q.type==='tf'||q.type==='mcq' ? q.type : 'text',
  question:String(q.question||''),
  options:Array.isArray(q.options)?q.options.map(String):undefined,
  answer:q.answer?String(q.answer):undefined,
 };
});

export default function HomeworkScreen(){
 const p=useLocalSearchParams<{role?:string;grade?:string;subject?:string;name?:string;code?:string}>();
 const teacher=p.role==='teacher'; const [cloud,setCloud]=useState<CustomHomework[]>([]); const [custom,setCustom]=useState<CustomHomework[]>([]);
 useEffect(()=>{let alive=true;getCustomHomework().then(x=>{if(alive)setCustom(x)});if(p.grade){const selected=p.subject?[p.subject]:['الكيمياء','الفيزياء','الأحياء'];Promise.all(selected.map(s=>getCloudHomework(p.grade!,s).catch(()=>[]))).then(groups=>{if(alive)setCloud(groups.flat())});}else setCloud([]);return()=>{alive=false}},[p.grade,p.subject]);
 const merged=new Map<string,CustomHomework>();
 [...homework,...custom,...cloud].forEach(h=>merged.set(String(h.id),h));
 const list=[...merged.values()].filter(h=>(!p.subject||h.subject===p.subject)&&(!p.grade||h.grade===p.grade));
 const [selectedId,setSelectedId]=useState<string|undefined>(); const current=list.find(h=>h.id===(selectedId||list[0]?.id));
 const currentQuestions=useMemo(()=>current?normalizeQuestions(current.questions as any[]):[],[current]);
 const key=current?storageKeys.homeworkSubmission((p.name||'طالب').trim(),current.id):'';
 const [answers,setAnswers]=useState<Record<string,string>>({}); const [photo,setPhoto]=useState<string>(); const [sent,setSent]=useState(false);
 useEffect(()=>{if(!current||teacher)return;readJson<{answers:Record<string,string>;photo?:string;sent:boolean}|null>(key,null).then(saved=>{if(saved){setAnswers(saved.answers||{});setPhoto(saved.photo);setSent(!!saved.sent);}})},[key,teacher,current?.id]);
 const choose=(id:string)=>{setSelectedId(id);setAnswers({});setPhoto(undefined);setSent(false);};
 const attach=async()=>{const perm=await ImagePicker.requestMediaLibraryPermissionsAsync();if(!perm.granted)return Alert.alert('صلاحية مطلوبة','اسمح بالوصول إلى الصور لاختيار صورة الدفتر.');const r=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:.8});if(!r.canceled)setPhoto(r.assets[0].uri);};
 const send=async()=>{if(!current)return;if(currentQuestions.some(q=>!answers[q.id]?.trim()))return Alert.alert('الواجب غير مكتمل','أجب عن جميع الأسئلة قبل الإرسال.');await writeJson(key,{answers,photo,sent:true});
  try{await saveHomeworkSubmission({id:`${p.code||p.name||'student'}-${current.id}`,studentCode:p.code||p.name||'student',studentName:p.name||'الطالب',grade:current.grade,subject:current.subject,homeworkId:current.id,title:current.title,answers,submittedAt:Date.now()});}catch{}
  setSent(true);Alert.alert('تم الإرسال','تم حفظ الواجب وإرساله للمزامنة. لا يمكن إعادة الإرسال من هذا الجهاز.');};
 return <Page title={teacher?'الواجبات وإدارة الأسئلة':'الواجبات المدرسية'} subtitle={teacher?'أنشئ واجبًا وأضف أسئلته':'حل الواجب وإرساله'} onBack={()=>router.back()}>
  {teacher&&<Action label="إنشاء واجب جديد وإضافة أسئلة" icon="＋" onPress={()=>router.push({pathname:'/create-homework',params:{grade:p.grade,subject:p.subject}})} />}
  <Section title={teacher?'الواجبات المنشورة':'الواجبات المطلوبة'}>{list.map(h=><Card key={h.id}><Text style={{fontSize:18,fontWeight:'900',color:C.navy,textAlign:'right'}}>{h.title}</Text><Text style={{color:C.muted,textAlign:'right',marginTop:5}}>{h.subject} • {h.grade} • التسليم: {h.due}</Text><Text style={{color:C.text,textAlign:'right',marginTop:9,lineHeight:23}}>{h.note}</Text>{!teacher&&<Action label={current?.id===h.id?'الواجب المحدد':'حل هذا الواجب'} icon="✍️" secondary={current?.id!==h.id} onPress={()=>choose(h.id)} />}</Card>)}</Section>
  {!teacher&&current&&<Section title={sent?'تم التسليم':`أسئلة الواجب (${currentQuestions.length})`}>
   {sent?<Card><Text style={{fontSize:19,fontWeight:'900',color:C.green,textAlign:'center'}}>✓ تم إرسال الواجب للمعلم</Text></Card>:
   <>
    {currentQuestions.map((q,i)=><Card key={q.id}>
      <Text style={{fontWeight:'900',color:C.navy,textAlign:'right',fontSize:16}}>{i+1}. {q.question}</Text>
      {q.type==='mcq'&&<View style={{marginTop:10,gap:7}}>{(q.options||[]).map(option=><Pressable key={option} onPress={()=>setAnswers(a=>({...a,[q.id]:option}))} style={{borderWidth:1,borderColor:answers[q.id]===option?C.blue:C.border,borderRadius:11,padding:12,backgroundColor:answers[q.id]===option?'#eef4f8':'#fff'}}><Text style={{textAlign:'right',fontWeight:'700',color:C.text}}>{answers[q.id]===option?'◉ ':'○ '}{option}</Text></Pressable>)}</View>}
      {q.type==='tf'&&<View style={{flexDirection:'row-reverse',gap:8,marginTop:10}}>{['صح','خطأ'].map(option=><Pressable key={option} onPress={()=>setAnswers(a=>({...a,[q.id]:option}))} style={{flex:1,borderWidth:1,borderColor:answers[q.id]===option?C.blue:C.border,borderRadius:11,padding:12,backgroundColor:answers[q.id]===option?'#eef4f8':'#fff'}}><Text style={{textAlign:'center',fontWeight:'800',color:C.text}}>{answers[q.id]===option?'✓ ':''}{option}</Text></Pressable>)}</View>}
      {q.type==='text'&&<TextInput multiline value={answers[q.id]||''} onChangeText={v=>setAnswers(a=>({...a,[q.id]:v}))} placeholder="اكتب إجابتك..." placeholderTextColor="#98a2b3" textAlign="right" style={{borderWidth:1,borderColor:C.border,borderRadius:11,padding:10,minHeight:75,marginTop:8,textAlignVertical:'top'}}/>}
    </Card>)}
    <Pressable onPress={attach} style={{padding:13,borderWidth:1,borderColor:C.border,borderRadius:12,marginTop:2,backgroundColor:'#f8fafc'}}><Text style={{textAlign:'center',fontWeight:'800',color:C.navy}}>📷 إرفاق صورة الدفتر</Text></Pressable>
    {photo&&<Image source={{uri:photo}} style={{width:'100%',height:180,borderRadius:12,marginTop:10}}/>}
    <Pressable onPress={send} style={{backgroundColor:C.navy,borderRadius:13,padding:15,marginTop:12}}><Text style={{color:'#fff',textAlign:'center',fontWeight:'900'}}>إرسال الواجب للمعلم</Text></Pressable>
   </>}
  </Section>}
 </Page>;
}
