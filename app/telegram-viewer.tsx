import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';

const telegramUrl = (raw:string) => {
  const url=raw.trim();
  const m=url.match(/^https?:\/\/(?:www\.)?t\.me\/(?:s\/)?([^/]+)\/(\d+)(.*)$/i);
  return m ? `https://t.me/s/${m[1]}/${m[2]}${m[3]||''}` : url;
};

const isTelegramHost=(url:string)=>{try{return /(^|\.)t\.me$/i.test(new URL(url).hostname)}catch{return false}};
const isTelegramScheme=(url:string)=>/^(tg:|telegram:|intent:)/i.test(url);

export default function TelegramViewer(){
  const {url,title}=useLocalSearchParams<{url?:string;title?:string}>();
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(false);
  const web=useRef<WebView>(null);
  const source=telegramUrl(String(url||''));
  const shouldLoad=(request:WebViewNavigation)=>{
    const next=request.url||'';
    if(isTelegramScheme(next)||/^(market:|mailto:|tel:)/i.test(next)){
      Alert.alert('فتح خارجي محظور','تم منع الانتقال إلى تطبيق Telegram أو أي تطبيق خارجي. استخدم المعاينة داخل التطبيق.');
      return false;
    }
    // Keep Telegram pages and their normal HTTPS resources inside the embedded browser.
    // Do not allow the Android OS to hand the page to the Telegram application.
    return true;
  };
  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}><Text numberOfLines={1} style={styles.title}>{title||'ملف Telegram'}</Text><Text onPress={()=>router.back()} style={styles.back}>رجوع</Text></View>
    {loading&&<View style={styles.loading}><ActivityIndicator size="large"/><Text style={styles.loadingText}>جاري فتح الملف داخل التطبيق…</Text></View>}
    {error&&<View style={styles.error}><Text style={styles.errorTitle}>تعذر فتح رسالة Telegram</Text><Text style={styles.errorText}>تأكد من اتصال الإنترنت ثم حاول مرة أخرى.</Text></View>}
    <WebView ref={web} source={{uri:source}} style={styles.web} onLoadStart={()=>{setLoading(true);setError(false)}} onLoadEnd={()=>setLoading(false)} onError={()=>{setLoading(false);setError(true)}} onShouldStartLoadWithRequest={shouldLoad} javaScriptEnabled domStorageEnabled sharedCookiesEnabled thirdPartyCookiesEnabled setSupportMultipleWindows={false} originWhitelist={['http://*','https://*']} />
  </SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#fff'},header:{height:58,flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',paddingHorizontal:15,borderBottomWidth:1,borderBottomColor:'#e5e7eb'},title:{flex:1,fontSize:16,fontWeight:'900',color:'#14213d',textAlign:'right',marginRight:10},back:{fontSize:14,fontWeight:'900',color:'#356ae6'},web:{flex:1},loading:{position:'absolute',zIndex:2,top:58,left:0,right:0,height:90,backgroundColor:'#fff',alignItems:'center',justifyContent:'center'},loadingText:{marginTop:8,color:'#667085',fontSize:12},error:{position:'absolute',zIndex:3,top:'38%',left:20,right:20,alignItems:'center'},errorTitle:{fontSize:18,fontWeight:'900',color:'#b42318',textAlign:'center'},errorText:{marginTop:8,color:'#667085',textAlign:'center'}});
