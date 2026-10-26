import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { File, FileMode, Paths } from 'expo-file-system';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { books, subjects } from '../src/data';
import { deleteBookLink, getBookLinks, saveBookLink, updateBookLink, type CloudBookLink } from '../src/contentCloud';
import { readJson, writeJson } from '../src/storage';
import { Action, Card, Page, Section, C, styles } from '../src/ui';

const cacheKey='book-pdf-cache';
type CacheMap=Record<string,string>;

function normalizePdfUrl(input:string){
  let url=input.trim();
  const driveMatch=url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if(driveMatch?.[1]) return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  const driveOpen=url.match(/[?&]id=([^&]+)/i);
  if(/drive\.google\.com/i.test(url)&&driveOpen?.[1]) return `https://drive.google.com/uc?export=download&id=${driveOpen[1]}`;
  if(/dropbox\.com/i.test(url)) return url.replace('www.dropbox.com','dl.dropboxusercontent.com').replace('?dl=0','?dl=1');
  const gh=url.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/i);
  if(gh) return `https://raw.githubusercontent.com/${gh[1]}/${gh[2]}/${gh[3]}/${gh[4]}`;
  return url;
}

async function openRemotePdf(url:string){ await WebBrowser.openBrowserAsync(url,{enableBarCollapsing:true}); }

async function isRealPdf(uri:string){
  try{
    const file=new File(uri);
    if(!file.exists||!file.size)return false;
    const handle=file.open(FileMode.ReadOnly);
    const bytes=handle.readBytesSync(5);
    handle.close();
    return bytes.length===5 && bytes[0]===37 && bytes[1]===80 && bytes[2]===68 && bytes[3]===70 && bytes[4]===45;
  }catch{return false;}
}

export default function BooksScreen(){
 const p=useLocalSearchParams<{subject?:string;grade?:string;role?:string;name?:string}>();
 const subject=p.subject; const grade=p.grade; const teacher=p.role==='teacher';
 const [links,setLinks]=useState<CloudBookLink[]>([]);
 const [name,setName]=useState(''); const [url,setUrl]=useState('');
 const [editingId,setEditingId]=useState<string|null>(null);
 const [cached,setCached]=useState<CacheMap>({}); const [busy,setBusy]=useState<string|null>(null);

 useEffect(()=>{
   let alive=true;
   readJson<CacheMap>(cacheKey,{}).then(x=>{if(alive)setCached(x)});
   if(grade){
     const selected=subject?[subject]:subjects.map(s=>s.name);
     Promise.all(selected.map(s=>getBookLinks(grade,s).catch(()=>[]))).then(groups=>{if(alive)setLinks(groups.flat())});
   } else setLinks([]);
   return()=>{alive=false};
 },[grade,subject]);

 const resetForm=()=>{setName('');setUrl('');setEditingId(null)};
 const addLink=async()=>{
   if(!grade||!subject||!name.trim()||!/^https?:\/\//i.test(url.trim()))return Alert.alert('بيانات ناقصة','أدخل اسم الكتاب أو الملزمة ورابطًا يبدأ بـ https://');
   const item:CloudBookLink={id:`book-${Date.now()}`,name:name.trim(),url:url.trim(),grade,subject,createdAt:Date.now()};
   try{await saveBookLink(item);setLinks(x=>[item,...x]);resetForm();Alert.alert('تم النشر','أصبح الملف متاحًا لطلاب الصف.');}
   catch(error){const code=String((error as any)?.code||'unknown');Alert.alert('تعذر النشر',code.includes('permission-denied')?'صلاحيات Firestore غير منشورة.':'تعذر الاتصال بالسحابة الآن.');}
 };
 const startEdit=(item:CloudBookLink)=>{setEditingId(item.id);setName(item.name);setUrl(item.url)};
 const saveEdit=async()=>{
   const old=links.find(x=>x.id===editingId);
   if(!old||!name.trim()||!/^https?:\/\//i.test(url.trim()))return Alert.alert('بيانات ناقصة','أدخل اسمًا ورابطًا صحيحًا يبدأ بـ https://');
   const changed:CloudBookLink={...old,name:name.trim(),url:url.trim()};
   try{
     await updateBookLink(changed);
     setLinks(x=>x.map(v=>v.id===changed.id?changed:v));
     if(changed.url!==old.url){
       const local=cached[changed.id];
       if(local){try{new File(local).delete();}catch{}}
       const next={...cached};delete next[changed.id];setCached(next);await writeJson(cacheKey,next);
     }
     resetForm();
     Alert.alert('تم التعديل','تم تحديث بيانات الملف للطلاب.');
   }catch(error){const code=String((error as any)?.code||'unknown');Alert.alert('تعذر التعديل',code.includes('permission-denied')?'صلاحيات Firestore لا تسمح بالتعديل.':'تعذر حفظ التعديل الآن.');}
 };
 const removeLink=(item:CloudBookLink)=>{
   Alert.alert('حذف الملف',`هل تريد حذف «${item.name}» من ملفات الطلاب؟`,[
     {text:'إلغاء',style:'cancel'},
     {text:'حذف',style:'destructive',onPress:async()=>{
       try{
         await deleteBookLink(item.id);
         const local=cached[item.id];if(local){try{new File(local).delete();}catch{}}
         const next={...cached};delete next[item.id];setCached(next);await writeJson(cacheKey,next);
         setLinks(x=>x.filter(v=>v.id!==item.id));
         if(editingId===item.id)resetForm();
         Alert.alert('تم الحذف','تم حذف الملف من قائمة الملفات المنشورة.');
       }catch(error){const code=String((error as any)?.code||'unknown');Alert.alert('تعذر الحذف',code.includes('permission-denied')?'صلاحيات Firestore لا تسمح بالحذف.':'تعذر حذف الملف الآن.');}
     }}
   ]);
 };
 const clearCachedFile=async(item:CloudBookLink)=>{
   const local=cached[item.id];
   if(!local)return;
   try{new File(local).delete();}catch{}
   const next={...cached};delete next[item.id];setCached(next);await writeJson(cacheKey,next);
   Alert.alert('تمت إزالة النسخة المحلية','سيتم تنزيل الملف من جديد عند فتحه.');
 };
 const cacheAndOpen=async(item:CloudBookLink)=>{setBusy(item.id);const original=item.url;const downloadUrl=normalizePdfUrl(original);let localPath:string|undefined;try{
   const target=new File(Paths.document,`book-${item.id}.pdf`);
   let local=cached[item.id];
   if(local){try{if(!await isRealPdf(local))local=undefined;}catch{local=undefined;}}
   if(!local&&target.exists){if(await isRealPdf(target.uri))local=target.uri;else{try{target.delete();}catch{}}}
   if(!local){const downloaded=await File.downloadFileAsync(downloadUrl,target,{idempotent:true});local=downloaded.uri;if(!await isRealPdf(local))throw new Error('not-a-pdf');}
   localPath=local;
   const next={...cached,[item.id]:local};setCached(next);await writeJson(cacheKey,next);
   router.push({pathname:'/pdf-viewer',params:{uri:local,title:item.name,bookId:item.id}});
  }catch(error){
   if(localPath)Alert.alert('الملف محفوظ','تم حفظ الملزمة، لكن تعذر تشغيل قارئ PDF داخل التطبيق.');
   else{try{await openRemotePdf(original);Alert.alert('الرابط ليس PDF مباشرًا','تعذر تنزيل PDF صالح من الرابط. افتح الرابط داخل التطبيق أو استخدم رابط PDF مباشر.');}catch{Alert.alert('تعذر فتح الملف','تحقق من الرابط وصلاحية الملف ثم حاول مرة أخرى.');}}
  }finally{setBusy(null);}};
 const list=books.filter(b=>(!subject||b.subject===subject)&&(!grade||b.grade===grade));
 return <Page title={subject||'الكتب والملازم'} subtitle={grade?`${grade} • ${subject||'العلوم'}`:'اختر المادة الدراسية'} onBack={()=>router.back()}>
  {!subject&&<Section title="اختر المادة"><View style={{gap:8}}>{subjects.map(s=><Pressable key={s.name} onPress={()=>router.push({pathname:'/books',params:{...p,subject:s.name}})} style={[styles.card,{borderColor:C.border}]}><Text style={{textAlign:'right',fontWeight:'900',fontSize:16,color:C.navy}}>{s.icon}  {s.name}</Text></Pressable>)}</View></Section>}
  {subject&&teacher&&<Section title={editingId?'تعديل الملف':'إضافة محتوى'}><Card>
    <Text style={{fontSize:17,fontWeight:'900',color:C.navy,textAlign:'right'}}>{editingId?'✏️ تعديل الكتاب أو الملزمة':'🔗 إضافة كتاب أو ملزمة'}</Text>
    <Text style={{fontSize:11,color:C.muted,textAlign:'right',marginTop:5}}>يمكن للمعلم تعديل الاسم والرابط أو حذف الملف. تغيير الرابط يمسح النسخة المحلية ليتم تنزيل النسخة الجديدة.</Text>
    <TextInput value={name} onChangeText={setName} placeholder="اسم الكتاب أو الملزمة" textAlign="right" style={{borderWidth:1,borderColor:C.border,borderRadius:11,padding:11,marginTop:10,backgroundColor:'#fff'}}/>
    <TextInput value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" placeholder="https://...pdf" textAlign="right" style={{borderWidth:1,borderColor:C.border,borderRadius:11,padding:11,marginTop:8,backgroundColor:'#fff'}}/>
    <Action label={editingId?'حفظ التعديل':'نشر للطلاب'} icon={editingId?'💾':'🔗'} onPress={editingId?saveEdit:addLink}/>
    {editingId&&<Action label="إلغاء التعديل" icon="↩️" onPress={resetForm}/>} 
  </Card></Section>}
  {subject&&<Section title={teacher?'إدارة الكتب والملازم':'الكتب والملازم المنشورة'}>{links.map(b=><Card key={b.id}>
    <Text style={{fontSize:16,fontWeight:'900',color:C.navy,textAlign:'right'}}>{b.name}</Text>
    <Text numberOfLines={1} style={{color:C.muted,textAlign:'right',marginTop:4}}>{b.url}</Text>
    <Text style={{color:C.muted,textAlign:'right',marginTop:4}}>{cached[b.id]?'✓ محفوظ على الجهاز':'سيتم تنزيله عند أول فتح'}</Text>
    <Action label={busy===b.id?'جاري التجهيز…':cached[b.id]?'فتح الملف المحفوظ':'تنزيل وفتح الملف'} icon={cached[b.id]?'✓':'📖'} onPress={()=>cacheAndOpen(b)}/>
    {teacher&&<View style={{flexDirection:'row',gap:8,marginTop:6}}>
      <Pressable onPress={()=>startEdit(b)} style={{flex:1,borderWidth:1,borderColor:C.border,borderRadius:10,padding:11,alignItems:'center'}}><Text style={{fontWeight:'900',color:C.navy}}>✏️ تعديل</Text></Pressable>
      <Pressable onPress={()=>removeLink(b)} style={{flex:1,borderWidth:1,borderColor:'#ef4444',borderRadius:10,padding:11,alignItems:'center'}}><Text style={{fontWeight:'900',color:'#dc2626'}}>🗑 حذف</Text></Pressable>
    </View>}
    {teacher&&cached[b.id]&&<Pressable onPress={()=>clearCachedFile(b)} style={{padding:8,alignItems:'center'}}><Text style={{fontSize:12,color:C.muted}}>إزالة النسخة المحفوظة من هذا الجهاز</Text></Pressable>}
  </Card>)}{!links.length&&<Card><Text style={{textAlign:'center',color:C.muted}}>لا توجد روابط منشورة لهذا الصف والمادة.</Text></Card>}</Section>}
  {subject&&<Section title="المحتوى المدمج">{list.length?list.map(b=><Card key={b.id}><Text style={{fontSize:17,fontWeight:'900',color:C.navy,textAlign:'right'}}>{b.title}</Text><Text style={{color:C.muted,textAlign:'right',marginTop:5}}>{b.description}</Text><Action label="قراءة المحتوى" icon="📖" onPress={()=>router.push({pathname:'/book',params:{id:b.id,grade:b.grade,subject:b.subject}})}/></Card>):<Card><Text style={{textAlign:'center',color:C.muted}}>لا يوجد محتوى مدمج لهذا الصف والمادة.</Text></Card>}</Section>}
 </Page>;
}
