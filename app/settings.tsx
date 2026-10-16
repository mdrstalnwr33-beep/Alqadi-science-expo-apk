import { router } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>رجوع ›</Text></Pressable>
        <Text style={styles.title}>الإعدادات</Text>
        <View style={styles.card}><Text style={styles.text}>العربية</Text><Text style={styles.note}>واجهة التطبيق مصممة من البداية لدعم RTL.</Text></View>
      </View>
    </SafeAreaView>
  );
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#f4f7fb'},container:{padding:20},back:{color:'#356ae6',fontWeight:'800',marginBottom:18,textAlign:'right'},title:{fontSize:27,fontWeight:'900',color:'#14213d',textAlign:'right',marginBottom:20},card:{backgroundColor:'#fff',borderRadius:20,padding:22,elevation:2},text:{fontSize:18,fontWeight:'800',color:'#101828',textAlign:'right'},note:{color:'#667085',textAlign:'right',marginTop:8,lineHeight:22}});
