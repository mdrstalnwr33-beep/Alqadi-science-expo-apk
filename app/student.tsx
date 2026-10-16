import { router } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function StudentScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>رجوع ›</Text></Pressable>
        <Text style={styles.title}>مساحة الطالب</Text>
        <Text style={styles.subtitle}>اختر ما تريد متابعته</Text>
        {[['📚','الكتب والمذكرات','/books'],['📖','الدروس اليومية','/lessons'],['📝','الاختبارات الشهرية','/exams'],['📋','الواجبات','/homework'],['🏆','الدرجات','/results']].map(([icon,label,href]) => <Pressable key={label} style={styles.card} onPress={() => router.push(href as never)}><Text style={styles.icon}>{icon}</Text><Text style={styles.text}>{label}</Text><Text style={styles.arrow}>‹</Text></Pressable>)}
      </View>
    </SafeAreaView>
  );
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#f4f7fb'},container:{padding:20},back:{color:'#356ae6',fontWeight:'800',marginBottom:18,textAlign:'right'},title:{fontSize:27,fontWeight:'900',color:'#14213d',textAlign:'right'},subtitle:{color:'#667085',textAlign:'right',marginBottom:18,marginTop:5},card:{backgroundColor:'#fff',borderRadius:18,padding:17,marginBottom:10,flexDirection:'row-reverse',alignItems:'center',elevation:2},icon:{fontSize:25,width:42},text:{flex:1,fontSize:17,fontWeight:'800',color:'#101828',textAlign:'right',marginHorizontal:8},arrow:{fontSize:26,color:'#98a2b3'}});
