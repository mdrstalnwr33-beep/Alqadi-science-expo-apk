import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { exams } from '../src/data';
import { getWeeklyTournament, recordWeeklyRound } from '../src/gamification';

const pool = exams.flatMap(e => e.questions.filter(q => q.answer && q.options).map(q => ({ ...q, subject: e.subject, key: `${e.id}:${q.id}` })));
const rivals = ['نيوتن الصغير', 'مندليف الصغير', 'العالِم الذكي', 'المستكشف العلمي', 'عبقري الفيزياء'];

export default function WeeklyTournament() {
  const p = useLocalSearchParams<{ name?: string; code?: string }>();
  const student = (p.code || p.name || 'طالب').trim();
  const [state, setState] = useState<any>(null);
  const [round, setRound] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [roundPoints, setRoundPoints] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const s = await getWeeklyTournament(student);
    setState(s);
    setRound(s.roundsCompleted);
    setLoading(false);
  };
  useMemo(() => { load(); }, []);

  const startRound = () => {
    const questions = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(5, pool.length));
    setItems(questions); setI(0); setCorrect(0); setFinished(false); setRoundPoints(0);
  };

  const answer = async (value: string) => {
    const q = items[i];
    if (!q || loading) return;
    const nextCorrect = correct + (value === q.answer ? 1 : 0);
    setCorrect(nextCorrect);
    if (i + 1 < items.length) return setI(v => v + 1);
    setLoading(true);
    const result = await recordWeeklyRound(student, nextCorrect, items.length);
    setRoundPoints(result.points);
    setState(result.state);
    setRound(result.state.roundsCompleted);
    setFinished(true);
    setLoading(false);
  };

  if (!state) return <SafeAreaView style={s.safe}><View style={s.center}><Text style={s.trophy}>🏆</Text><Text style={s.title}>جاري تجهيز البطولة...</Text></View></SafeAreaView>;

  const current = items[i];
  const canPlay = state.roundsCompleted < state.maxRounds;
  const rank = state.rank;
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
    <View style={s.header}><Pressable onPress={() => router.back()}><Text style={s.back}>‹</Text></Pressable><View style={{flex:1}}><Text style={s.eyebrow}>🏆 بطولة الأسبوع</Text><Text style={s.title}>كأس الطالب المتصدر</Text></View></View>
    <View style={s.hero}><Text style={s.heroCup}>🏆</Text><Text style={s.heroTitle}>سباق العلماء</Text><Text style={s.heroText}>5 جولات قصيرة كل أسبوع. اجمع النقاط وتصدر البطولة — بالكامل دون إنترنت.</Text></View>
    <View style={s.stats}><Stat label="نقاطك" value={state.points}/><Stat label="المركز" value={`#${rank}`}/><Stat label="الجولات" value={`${state.roundsCompleted}/${state.maxRounds}`}/></View>
    {!items.length && <><Text style={s.section}>المتصدرون</Text>{state.leaderboard.map((x:any, idx:number)=><View key={x.name} style={[s.row, x.isMe && s.me]}><Text style={s.medal}>{idx===0?'🥇':idx===1?'🥈':idx===2?'🥉':`${idx+1}`}</Text><View style={{flex:1}}><Text style={s.rowName}>{x.name}{x.isMe?' (أنت)':''}</Text><Text style={s.rowSub}>{x.points} نقطة</Text></View></View>)}<Pressable disabled={!canPlay || loading} style={[s.primary, !canPlay && s.disabled]} onPress={startRound}><Text style={s.primaryText}>{canPlay ? `⚡ ابدأ الجولة ${state.roundsCompleted + 1}` : 'اكتملت البطولة لهذا الأسبوع'}</Text></Pressable><Text style={s.note}>{canPlay ? `يمكنك لعب ${state.maxRounds - state.roundsCompleted} جولة متبقية.` : 'تعود البطولة تلقائيًا مع بداية أسبوع جديد.'}</Text></>}
    {items.length > 0 && !finished && <><View style={s.progress}><Text style={s.progressText}>الجولة {round + 1} • السؤال {i + 1} من {items.length}</Text><Text style={s.subject}>{current?.subject}</Text></View><View style={s.card}><Text style={s.question}>{current?.question}</Text>{current?.options?.map((o:string)=><Pressable key={o} disabled={loading} onPress={()=>answer(o)} style={s.option}><Text style={s.optionText}>{o}</Text></Pressable>)}</View></>}
    {finished && <View style={s.result}><Text style={s.trophy}>{correct === items.length ? '🌟' : correct >= 3 ? '🔥' : '💪'}</Text><Text style={s.title}>الجولة انتهت!</Text><Text style={s.resultScore}>{correct}/{items.length}</Text><Text style={s.reward}>+{roundPoints} نقطة بطولة</Text><Text style={s.note}>إجمالي البطولة: {state.points} نقطة • المركز #{state.rank}</Text><Pressable style={s.primary} onPress={()=>{setItems([]);setFinished(false)}}><Text style={s.primaryText}>العودة إلى البطولة</Text></Pressable></View>}
  </ScrollView></SafeAreaView>;
}
function Stat({label,value}:{label:string;value:string|number}){return <View style={s.stat}><Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#f5f7fb'},content:{padding:18,paddingBottom:45},header:{flexDirection:'row',alignItems:'center',marginBottom:14},back:{fontSize:38,color:'#17324d',paddingHorizontal:8},eyebrow:{fontSize:12,color:'#667085',textAlign:'right'},title:{fontSize:24,fontWeight:'900',color:'#14213d',textAlign:'right'},hero:{backgroundColor:'#17324d',borderRadius:22,padding:20,alignItems:'center'},heroCup:{fontSize:50},heroTitle:{fontSize:22,fontWeight:'900',color:'#fff',marginTop:4},heroText:{fontSize:12,lineHeight:20,color:'#dce8f5',textAlign:'center',marginTop:6},stats:{flexDirection:'row',justifyContent:'space-between',marginVertical:12},stat:{backgroundColor:'#fff',borderRadius:16,padding:13,width:'31%',alignItems:'center',borderWidth:1,borderColor:'#eaecf0'},statValue:{fontSize:22,fontWeight:'900',color:'#17324d'},statLabel:{fontSize:11,color:'#667085',marginTop:3},section:{fontSize:18,fontWeight:'900',color:'#14213d',textAlign:'right',marginBottom:9},row:{backgroundColor:'#fff',borderRadius:15,padding:13,flexDirection:'row-reverse',alignItems:'center',marginBottom:8,borderWidth:1,borderColor:'#eaecf0'},me:{borderWidth:2,borderColor:'#17324d'},medal:{fontSize:22,width:40,textAlign:'center'},rowName:{fontSize:14,fontWeight:'900',color:'#1d2939',textAlign:'right'},rowSub:{fontSize:11,color:'#667085',textAlign:'right',marginTop:2},primary:{backgroundColor:'#17324d',borderRadius:15,padding:16,marginTop:14},primaryText:{color:'#fff',fontWeight:'900',textAlign:'center',fontSize:15},disabled:{opacity:.55},note:{fontSize:11,color:'#667085',textAlign:'center',marginTop:8},progress:{backgroundColor:'#fff',borderRadius:15,padding:13,marginBottom:10,borderWidth:1,borderColor:'#eaecf0',flexDirection:'row',justifyContent:'space-between'},progressText:{fontWeight:'900',color:'#17324d'},subject:{fontSize:11,color:'#667085'},card:{backgroundColor:'#fff',borderRadius:20,padding:17,borderWidth:1,borderColor:'#eaecf0'},question:{fontSize:19,fontWeight:'900',color:'#14213d',textAlign:'right',lineHeight:29},option:{backgroundColor:'#f8fafc',borderRadius:13,padding:15,marginTop:10,borderWidth:1,borderColor:'#d0d5dd'},optionText:{fontWeight:'800',color:'#344054',textAlign:'right'},result:{alignItems:'center',backgroundColor:'#fff',borderRadius:20,padding:24,marginTop:10},center:{flex:1,alignItems:'center',justifyContent:'center'},trophy:{fontSize:62},resultScore:{fontSize:46,fontWeight:'900',color:'#17324d',marginTop:6},reward:{fontSize:21,fontWeight:'900',color:'#17834f',marginTop:10}});
