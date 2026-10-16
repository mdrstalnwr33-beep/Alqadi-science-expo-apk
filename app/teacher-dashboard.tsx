import { router } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function TeacherDashboardScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>رجوع ›</Text></Pressable>
        <Text style={styles.title}>لوحة التحكم</Text>
        <View style={styles.summary}><Text style={styles.number}>0</Text><Text style={styles.label}>محتوى منشور في النسخة التجريبية</Text></View>
        <Text style={styles.note}>هذه المرحلة تبني الهيكل فقط. الربط السحابي وإدارة البيانات الحقيقية سيضافان بعد تثبيت أساس التطبيق.</Text>
      </View>
    </SafeAreaView>
  );
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#f4f7fb'},container:{padding:20},back:{color:'#356ae6',fontWeight:'800',marginBottom:18,textAlign:'right'},title:{fontSize:27,fontWeight:'900',color:'#14213d',textAlign:'right',marginBottom:20},summary:{backgroundColor:'#fff',borderRadius:22,padding:26,alignItems:'center',elevation:2},number:{fontSize:44,fontWeight:'900',color:'#356ae6'},label:{color:'#344054',fontWeight:'800',marginTop:5},note:{color:'#667085',textAlign:'center',lineHeight:24,marginTop:18}});
