import { router } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function TeacherScreen() {
  const items = ['إدارة المحتوى', 'الاختبارات', 'الواجبات والتصحيح', 'درجات الطلاب'];
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>رجوع ›</Text></Pressable>
        <Text style={styles.title}>لوحة المعلم</Text>
        {items.map((item) => <Pressable key={item} style={styles.card}><Text style={styles.text}>{item}</Text><Text style={styles.arrow}>‹</Text></Pressable>)}
      </View>
    </SafeAreaView>
  );
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#f4f7fb'},container:{padding:20},back:{color:'#356ae6',fontWeight:'800',marginBottom:18,textAlign:'right'},title:{fontSize:27,fontWeight:'900',color:'#14213d',textAlign:'right',marginBottom:20},card:{backgroundColor:'#fff',borderRadius:18,padding:20,marginBottom:12,flexDirection:'row-reverse',justifyContent:'space-between',elevation:2},text:{fontSize:17,fontWeight:'800',color:'#101828'},arrow:{fontSize:26,color:'#98a2b3'}});
