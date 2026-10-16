import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { getSession } from '../src/storage';

export default function Index() {
  const [checking, setChecking] = useState(true);
  useEffect(() => { getSession().then(s => { if (s?.active) router.replace({ pathname: '/home', params: { role: s.role, name: s.name, grade: s.grade, code: s.code } }); else setChecking(false); }); }, []);
  if (checking) return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.title}>تطبيق القاضي للعلوم</Text><Text style={styles.note}>جارٍ استعادة الجلسة…</Text></View></SafeAreaView>;
  return <SafeAreaView style={styles.safe}><View style={styles.container}>
    <View style={styles.brand}><Pressable onLongPress={()=>router.push({pathname:'/login',params:{role:'teacher'}})} delayLongPress={900} style={styles.logo}><Text style={styles.logoText}>ع</Text></Pressable><Text style={styles.title}>تطبيق القاضي للعلوم</Text><Text style={styles.subtitle}>الكيمياء • الفيزياء • الأحياء</Text></View>
    <Pressable style={styles.primary} onPress={() => router.push({ pathname: '/login', params: { role: 'student' } })}><Text style={styles.primaryText}>👨‍🎓  دخول الطالب</Text></Pressable>
    <Pressable style={styles.about} onPress={() => router.push('/about-teacher')}><Text style={styles.aboutText}>عن الأستاذ محمد القاضي</Text></Pressable>
  </View></SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#f5f7fb'},container:{flex:1,justifyContent:'center',padding:24},center:{flex:1,alignItems:'center',justifyContent:'center'},brand:{alignItems:'center',marginBottom:38},logo:{width:82,height:82,borderRadius:25,backgroundColor:'#17324d',alignItems:'center',justifyContent:'center'},logoText:{color:'#fff',fontSize:46,fontWeight:'900'},title:{fontSize:28,fontWeight:'900',color:'#17324d',marginTop:15,textAlign:'center'},subtitle:{fontSize:14,color:'#667085',marginTop:6},primary:{backgroundColor:'#17324d',borderRadius:17,paddingVertical:17,alignItems:'center',marginBottom:12},primaryText:{color:'#fff',fontSize:18,fontWeight:'900'},about:{padding:15,alignItems:'center'},aboutText:{color:'#356ae6',fontSize:16,fontWeight:'800'},note:{color:'#667085',marginTop:8}});