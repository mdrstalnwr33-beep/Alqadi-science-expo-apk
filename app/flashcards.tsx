import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

type Card = { icon:string; accent:string; question:string; answer:string; tag:string };

const chemistry: Card[] = [
 {icon:'⚛️',accent:'#7C3AED',question:'ما الذي يميز عناصر المجموعة الرئيسية الأولى؟',answer:'تحتوي ذراتها في المستوى الخارجي على إلكترون واحد، لذلك تفقده بسهولة أثناء التفاعلات الكيميائية.',tag:'فكرة أساسية'},
 {icon:'🧪',accent:'#0EA5E9',question:'ما عناصر المجموعة الأولى المذكورة في الملزمة؟',answer:'الليثيوم Li، الصوديوم Na، البوتاسيوم K، الروبيديوم Rb، والسيزيوم Cs.',tag:'احفظ الرموز'},
 {icon:'💡',accent:'#F59E0B',question:'لماذا يزداد نشاط عناصر المجموعة الأولى عند النزول في المجموعة؟',answer:'يزداد الحجم الذري، ويزداد بعد إلكترون التكافؤ عن النواة، فيسهل فقده؛ لذلك يزداد نشاط العناصر نزولًا في المجموعة.',tag:'فهم وليس حفظًا'},
 {icon:'🔢',accent:'#10B981',question:'ما التوزيع الإلكتروني للصوديوم Na وعدده الذري 11؟',answer:'1s² 2s² 2p⁶ 3s¹، وتوزيع الإلكترونات على مستويات K-L-M هو 2-8-1.',tag:'الصوديوم Na'},
 {icon:'💧',accent:'#06B6D4',question:'ماذا يحدث عند تفاعل الصوديوم مع الماء؟',answer:'يتفاعل الصوديوم مع الماء مكونًا هيدروكسيد الصوديوم وغاز الهيدروجين: 2Na + 2H₂O → 2NaOH + H₂.',tag:'معادلة مهمة'},
 {icon:'🧂',accent:'#EC4899',question:'اذكر مركبين من مركبات الصوديوم الواردة في الملزمة.',answer:'منها كلوريد الصوديوم NaCl، وكربونات الصوديوم Na₂CO₃، ونترات الصوديوم NaNO₃، وبيكربونات الصوديوم NaHCO₃.',tag:'مركبات الصوديوم'},
 {icon:'🔬',accent:'#8B5CF6',question:'ما استخدام الصوديوم المذكور في الملزمة؟',answer:'يستخدم الصوديوم في صنع مصابيح الصوديوم المستخدمة في إنارة الشوارع ومصابيح السيارات؛ لأنها قادرة على اختراق الضباب.',tag:'تطبيقات'},
 {icon:'☀️',accent:'#EF4444',question:'ما استخدام السيزيوم المذكور في الملزمة؟',answer:'يستخدم السيزيوم في صناعة الخلايا الكهروضوئية لحساسية هذا العنصر للضوء ونشاطه الكيميائي العالي.',tag:'تطبيقات'},
];

const physics: Card[] = [
 {icon:'⚡',accent:'#0284C7',question:'ما المقصود بالطاقة الحركية؟',answer:'هي الطاقة التي يمتلكها الجسم بسبب حركته، وتزداد بزيادة كتلة الجسم أو سرعته.',tag:'مفهوم أساسي'},
 {icon:'🧮',accent:'#2563EB',question:'ما قانون الطاقة الحركية؟',answer:'الطاقة الحركية = ½ × الكتلة × مربع السرعة: KE = ½mv².',tag:'قانون مهم'},
 {icon:'🚀',accent:'#0EA5E9',question:'جسم كتلته 5 كجم وسرعته 10 م/ث، ما طاقته الحركية؟',answer:'KE = ½ × 5 × 10² = 250 جول.',tag:'مسألة من الملزمة'},
 {icon:'🏔️',accent:'#7C3AED',question:'ما طاقة الوضع؟',answer:'هي الطاقة المرتبطة بموضع الجسم أو وضعه، وتزداد عند رفع الجسم في مجال الجاذبية.',tag:'مفهوم أساسي'},
 {icon:'📐',accent:'#8B5CF6',question:'ما قانون طاقة الوضع الجاذبية؟',answer:'طاقة الوضع الجاذبية = الكتلة × تسارع الجاذبية × الارتفاع: PE = mgh.',tag:'قانون مهم'},
 {icon:'🔄',accent:'#10B981',question:'ما الطاقة الميكانيكية؟',answer:'هي مجموع طاقة الحركة وطاقة الوضع للنظام: الطاقة الميكانيكية = KE + PE.',tag:'اربط القوانين'},
 {icon:'♻️',accent:'#059669',question:'ما مضمون قانون حفظ الطاقة؟',answer:'الطاقة لا تفنى ولا تستحدث من العدم، وإنما تتحول من صورة إلى أخرى، وتبقى الطاقة الكلية محفوظة في النظام.',tag:'قانون الحفظ'},
 {icon:'🎯',accent:'#F59E0B',question:'ماذا يحدث للطاقة عند تحول طاقة الوضع إلى طاقة حركية؟',answer:'تتحول طاقة الوضع إلى طاقة حركية مع بقاء مجموع الطاقة محفوظًا عند إهمال الفقد.',tag:'تحدي فهم'},
];

const biology: Card[] = [
 {icon:'🌱',accent:'#16A34A',question:'لماذا تعد التغذية مهمة للكائن الحي؟',answer:'توفر المواد والطاقة اللازمة للنمو وبناء الأنسجة والقيام بالوظائف الحيوية.',tag:'فكرة أساسية'},
 {icon:'☀️',accent:'#F59E0B',question:'ما البناء الضوئي؟',answer:'عملية تصنع فيها النباتات غذاءها باستخدام الضوء، وثاني أكسيد الكربون والماء، وينتج عنها الغذاء والأكسجين.',tag:'البناء الضوئي'},
 {icon:'🍎',accent:'#EF4444',question:'ما مكونات الغذاء الستة؟',answer:'الكربوهيدرات، البروتينات، الدهون، الفيتامينات، الأملاح المعدنية، والماء.',tag:'احفظها'},
 {icon:'🥖',accent:'#EA580C',question:'ما الوظيفة الأساسية للكربوهيدرات؟',answer:'تعد مصدرًا مهمًا للطاقة التي يحتاجها الجسم للقيام بالأنشطة والوظائف الحيوية.',tag:'مغذيات'},
 {icon:'🥚',accent:'#7C3AED',question:'ما أهمية البروتينات؟',answer:'تدخل في بناء ونمو وإصلاح أنسجة الجسم، وتؤدي وظائف حيوية متعددة.',tag:'مغذيات'},
 {icon:'🫒',accent:'#0F766E',question:'ما دور الدهون في الجسم؟',answer:'تعد مصدرًا مركزًا للطاقة، وتدخل في بناء بعض مكونات الجسم وتساعد على أداء وظائف حيوية.',tag:'مغذيات'},
 {icon:'🌿',accent:'#059669',question:'ما وظيفة الخشب واللحاء في النبات؟',answer:'الخشب ينقل الماء والأملاح المعدنية من الجذر إلى أجزاء النبات، واللحاء ينقل المواد الغذائية المصنعة إلى أجزاء النبات.',tag:'النقل في النبات'},
 {icon:'💧',accent:'#0284C7',question:'كيف تمتص الشعيرات الجذرية الماء والأملاح؟',answer:'تزيد الشعيرات الجذرية مساحة سطح الجذر الملامس للتربة، فتساعد النبات على امتصاص الماء والأملاح المعدنية.',tag:'الجذر والامتصاص'},
];

const data: Record<string,{title:string;icon:string;cards:Card[]}> = {
 'الكيمياء': {title:'بطاقات الكيمياء 3D',icon:'⚗️',cards:chemistry},
 'الفيزياء': {title:'بطاقات الفيزياء 3D',icon:'⚡',cards:physics},
 'الأحياء': {title:'بطاقات الأحياء 3D',icon:'🧬',cards:biology},
};

export default function FlashcardsScreen() {
 const p=useLocalSearchParams<{grade?:string;subject?:string;name?:string;code?:string}>();
 const grade=p.grade||'الأول الثانوي';
 const requested=Array.isArray(p.subject)?p.subject[0]:p.subject;
 const [subject,setSubject]=useState(requested&&data[requested]?requested:'');
 const [index,setIndex]=useState(0);
 const [flipped,setFlipped]=useState(false);
 const rotation=useRef(new Animated.Value(0)).current;

 const openSubject=(value:string)=>{setSubject(value);setIndex(0);setFlipped(false);rotation.setValue(0);};
 const flip=()=>{Animated.spring(rotation,{toValue:flipped?0:1,useNativeDriver:true,friction:8,tension:55}).start();setFlipped(!flipped);};
 const next=()=>{setFlipped(false);rotation.setValue(0);setIndex(v=>(v+1)%data[subject].cards.length);};
 const previous=()=>{setFlipped(false);rotation.setValue(0);setIndex(v=>(v-1+data[subject].cards.length)%data[subject].cards.length);};

 if(grade!=='الأول الثانوي') return <SafeAreaView style={s.safe}><View style={s.center}><Text style={s.blockIcon}>🔒</Text><Text style={s.blockTitle}>البطاقات التفاعلية للأول الثانوي</Text><Text style={s.blockText}>سيظهر محتوى كل صف بحسب حساب الطالب.</Text><Pressable style={s.backButton} onPress={()=>router.back()}><Text style={s.backText}>العودة</Text></Pressable></View></SafeAreaView>;
 if(!subject) return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}><Pressable onPress={()=>router.back()} style={s.backCircle}><Text style={s.backCircleText}>‹</Text></Pressable><Text style={s.chooseTitle}>🎴 المراجعة التفاعلية 3D</Text><Text style={s.chooseText}>اختر المادة التي تريد مراجعتها من ملازم الصف الأول الثانوي.</Text><View style={s.chooseGrid}>{Object.entries(data).map(([key,value])=><Pressable key={key} style={[s.chooseCard,{borderColor:value.cards[0].accent}]} onPress={()=>openSubject(key)}><Text style={s.chooseIcon}>{value.icon}</Text><Text style={s.chooseCardTitle}>{value.title}</Text><Text style={s.chooseCardText}>{value.cards.length} بطاقات تفاعلية</Text></Pressable>)}</View></ScrollView></SafeAreaView>;

 const pack=data[subject]; const card=pack.cards[index];
 const front=rotation.interpolate({inputRange:[0,1],outputRange:['0deg','180deg']});
 const back=rotation.interpolate({inputRange:[0,1],outputRange:['180deg','360deg']});
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
  <View style={s.header}><Pressable onPress={()=>setSubject('')} style={s.backCircle}><Text style={s.backCircleText}>‹</Text></Pressable><View style={s.headerText}><Text style={s.kicker}>الأول الثانوي • {subject}</Text><Text style={s.title}>{pack.icon} {pack.title}</Text><Text style={s.subtitle}>اضغط على البطاقة لقلبها واكتشاف الإجابة.</Text></View></View>
  <View style={s.progressRow}><Text style={s.progressText}>البطاقة {index+1} من {pack.cards.length}</Text><View style={s.progressTrack}><View style={[s.progressFill,{width:`${((index+1)/pack.cards.length)*100}%`,backgroundColor:card.accent}]}/></View></View>
  <Pressable onPress={flip} style={s.stage} accessibilityRole="button"><Animated.View style={[s.flashCard,{backgroundColor:card.accent,transform:[{perspective:1000},{rotateY:front}]}]}><Text style={s.tag}>{card.tag}</Text><Text style={s.cardIcon}>{card.icon}</Text><Text style={s.label}>سؤال</Text><Text style={s.question}>{card.question}</Text><Text style={s.hint}>👆 اضغط لقلب البطاقة</Text></Animated.View><Animated.View style={[s.flashCard,s.backCard,{transform:[{perspective:1000},{rotateY:back}]}]}><Text style={[s.answerLabel,{color:card.accent}]}>💡 الإجابة</Text><Text style={s.answer}>{card.answer}</Text><View style={[s.remember,{borderColor:card.accent}]}><Text style={[s.rememberTitle,{color:card.accent}]}>⭐ من الملزمة</Text><Text style={s.rememberText}>حاول الإجابة قبل قلب البطاقة.</Text></View></Animated.View></Pressable>
  <View style={s.controls}><Pressable style={s.control} onPress={previous}><Text style={s.controlText}>→ السابقة</Text></Pressable><Pressable style={[s.flip,{backgroundColor:card.accent}]} onPress={flip}><Text style={s.flipText}>🔄 قلب البطاقة</Text></Pressable><Pressable style={s.control} onPress={next}><Text style={s.controlText}>التالية ←</Text></Pressable></View>
  <View style={s.challenge}><Text style={s.challengeIcon}>🏆</Text><View style={{flex:1}}><Text style={s.challengeTitle}>تحدي سريع</Text><Text style={s.challengeText}>فكر في الإجابة أولًا، ثم اقلب البطاقة وتحقق من نفسك.</Text></View></View>
 </ScrollView></SafeAreaView>;
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#F4F7FF'},content:{padding:18,paddingBottom:44},center:{flex:1,alignItems:'center',justifyContent:'center',padding:24},blockIcon:{fontSize:56},blockTitle:{fontSize:20,fontWeight:'900',color:'#172554',textAlign:'center',marginTop:12},blockText:{fontSize:12,color:'#64748B',textAlign:'center',marginTop:8},backButton:{marginTop:20,backgroundColor:'#4338CA',paddingHorizontal:24,paddingVertical:12,borderRadius:14},backText:{color:'#fff',fontWeight:'900'},backCircle:{width:44,height:44,borderRadius:22,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'#C7D2FE',marginBottom:12},backCircleText:{fontSize:30,color:'#4338CA',lineHeight:34},chooseTitle:{fontSize:26,fontWeight:'900',color:'#172554',textAlign:'right',writingDirection:'rtl',marginTop:4},chooseText:{fontSize:12,color:'#64748B',lineHeight:20,textAlign:'right',writingDirection:'rtl',marginTop:6,marginBottom:18},chooseGrid:{flexDirection:'row-reverse',flexWrap:'wrap',justifyContent:'space-between'},chooseCard:{width:'48.5%',backgroundColor:'#fff',borderRadius:20,borderWidth:2,padding:18,minHeight:145,marginBottom:12,elevation:3},chooseIcon:{fontSize:42,textAlign:'right'},chooseCardTitle:{fontSize:15,fontWeight:'900',color:'#172554',textAlign:'right',writingDirection:'rtl',marginTop:8},chooseCardText:{fontSize:10,color:'#64748B',textAlign:'right',writingDirection:'rtl',marginTop:5},header:{flexDirection:'row-reverse',alignItems:'flex-start',marginBottom:14},headerText:{flex:1,marginRight:10},kicker:{color:'#6366F1',fontSize:11,fontWeight:'900',textAlign:'right',writingDirection:'rtl'},title:{color:'#172554',fontSize:24,fontWeight:'900',textAlign:'right',writingDirection:'rtl',marginTop:2},subtitle:{color:'#64748B',fontSize:11,lineHeight:18,textAlign:'right',writingDirection:'rtl',marginTop:4},progressRow:{backgroundColor:'#fff',borderRadius:16,padding:12,borderWidth:2,borderColor:'#E0E7FF',marginBottom:14},progressText:{color:'#172554',fontWeight:'900',fontSize:12,textAlign:'right',writingDirection:'rtl',marginBottom:8},progressTrack:{height:8,backgroundColor:'#E2E8F0',borderRadius:8,overflow:'hidden'},progressFill:{height:8,borderRadius:8},stage:{minHeight:420,marginBottom:14},flashCard:{position:'absolute',left:0,right:0,minHeight:420,borderRadius:30,padding:24,overflow:'hidden',backfaceVisibility:'hidden',elevation:8,shadowColor:'#172554',shadowOpacity:0.2,shadowRadius:14,shadowOffset:{width:0,height:8}},backCard:{backgroundColor:'#fff',justifyContent:'center'},tag:{color:'#FFFFFFDD',fontSize:11,fontWeight:'900',textAlign:'right',writingDirection:'rtl'},cardIcon:{fontSize:68,textAlign:'center',marginTop:24},label:{color:'#FFFFFFAA',fontSize:12,fontWeight:'900',textAlign:'right',writingDirection:'rtl',marginTop:20},question:{color:'#fff',fontSize:23,fontWeight:'900',lineHeight:37,textAlign:'right',writingDirection:'rtl',marginTop:8},hint:{color:'#FFFFFFCC',fontSize:11,fontWeight:'800',textAlign:'center',marginTop:30},answerLabel:{fontSize:19,fontWeight:'900',textAlign:'right',writingDirection:'rtl',marginBottom:18},answer:{color:'#172554',fontSize:20,fontWeight:'800',lineHeight:35,textAlign:'right',writingDirection:'rtl'},remember:{marginTop:24,borderWidth:2,borderRadius:18,padding:14,backgroundColor:'#F8FAFC'},rememberTitle:{fontSize:13,fontWeight:'900',textAlign:'right',writingDirection:'rtl'},rememberText:{color:'#64748B',fontSize:10,textAlign:'right',writingDirection:'rtl',marginTop:5},controls:{flexDirection:'row-reverse',gap:7,marginBottom:14},control:{flex:1,minHeight:50,borderRadius:15,backgroundColor:'#fff',borderWidth:2,borderColor:'#E0E7FF',alignItems:'center',justifyContent:'center'},controlText:{color:'#172554',fontSize:11,fontWeight:'900'},flip:{flex:1.35,minHeight:50,borderRadius:15,alignItems:'center',justifyContent:'center',elevation:3},flipText:{color:'#fff',fontSize:11,fontWeight:'900'},challenge:{flexDirection:'row-reverse',alignItems:'center',backgroundColor:'#FFF7ED',borderRadius:20,padding:15,borderWidth:2,borderColor:'#FED7AA'},challengeIcon:{fontSize:34,marginLeft:10},challengeTitle:{fontSize:13,fontWeight:'900',color:'#9A3412',textAlign:'right',writingDirection:'rtl'},challengeText:{fontSize:10,color:'#C2410C',textAlign:'right',writingDirection:'rtl',marginTop:4}
});