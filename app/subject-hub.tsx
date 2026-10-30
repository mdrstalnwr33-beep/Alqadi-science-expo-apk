import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { subjects } from '../src/data';

const baseItems = [
  ['📚','الكتب والملازم','كتب ومراجع المادة','/books'],
  ['📖','الدروس اليومية','دروس وشروحات المادة','/lessons'],
  ['📝','الواجبات المدرسية','واجبات المادة المطلوبة','/homework'],
  ['🧪','الاختبارات الشهرية','اختبارات المادة','/exams'],
  ['📥','الكتب والملازم المحملة','ملفات المادة المحفوظة على الجهاز','/downloaded-books'],
  ['📊','نتيجتي','درجاتي وتقدمي في المادة','/results'],
  ['🏆','الطلاب الأوائل','الطلاب الأوائل في المادة','/honor-board'],
] as const;

export default function SubjectHub(){
 const p=useLocalSearchParams<{subject?:string;grade?:string;role?:string;name?:string;code?:string}>();
 const subject=p.subject||subjects[0].name;
 const grade=p.grade||'الأول الثانوي';
 const go=(path:string)=>router.push({pathname:path as never,params:{subject,grade,role:p.role||'student',name:p.name||'',code:p.code||''}});
 const icon=subjects.find(x=>x.name===subject)?.icon||'🔬';
 const items = (grade==='الأول الثانوي' && subject==='الكيمياء')
   ? [...baseItems.slice(0,4), ['🎴','بطاقات الكيمياء 3D','اقلب البطاقات واختبر نفسك','/flashcards'] as const, ...baseItems.slice(4)]
   : baseItems;
 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
   <Pressable onPress={()=>router.back()}><Text style={styles.back}>رجوع ›</Text></Pressable>
   <View style={styles.hero}><Text style={styles.icon}>{icon}</Text><Text style={styles.title}>{subject}</Text><Text style={styles.subtitle}>{grade}</Text></View>
   <Text style={styles.heading}>محتوى المادة</Text>
   <View style={styles.grid}>{items.map(([i,t,d,path])=><Pressable key={t} style={[styles.card,t==='بطاقات الكيمياء 3D'&&styles.flashCard]} onPress={()=>go(path)}><Text style={styles.cardIcon}>{i}</Text><Text style={styles.cardTitle}>{t}</Text><Text style={styles.cardText}>{d}</Text></Pressable>)}</View>
 </ScrollView></SafeAreaView>
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#f5f7fb'},content:{padding:18,paddingBottom:40},back:{color:'#356ae6',fontWeight:'900',fontSize:15,textAlign:'right',marginBottom:12},hero:{backgroundColor:'#17324d',borderRadius:24,padding:22,alignItems:'center',marginBottom:18},icon:{fontSize:46},title:{fontSize:28,fontWeight:'900',color:'#fff',marginTop:8},subtitle:{fontSize:13,color:'#dce8f5',marginTop:5},heading:{fontSize:20,fontWeight:'900',color:'#14213d',textAlign:'right',marginBottom:10},grid:{flexDirection:'row-reverse',flexWrap:'wrap',justifyContent:'space-between'},card:{width:'48.5%',backgroundColor:'#fff',borderRadius:17,padding:15,minHeight:125,marginBottom:10,borderWidth:1,borderColor:'#eaecf0',elevation:1},flashCard:{backgroundColor:'#FFF7ED',borderColor:'#F59E0B',borderWidth:2,elevation:4},cardIcon:{fontSize:29,textAlign:'right'},cardTitle:{fontSize:14,fontWeight:'900',color:'#1d2939',textAlign:'right',marginTop:8},cardText:{fontSize:10,color:'#667085',textAlign:'right',lineHeight:16,marginTop:4}});