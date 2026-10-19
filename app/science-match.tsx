import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { exams } from '../src/data';
import { recordMatchResult, recordQuestionAnswers } from '../src/gamification';

const pool = exams.flatMap(e => e.questions.filter(q => q.answer && q.options).map(q => ({ ...q, subject: e.subject, key: `${e.id}:${q.id}` })));
const names = ['العالِم الذكي', 'نيوتن الصغير', 'مندليف الصغير', 'المستكشف العلمي'];

export default function ScienceMatch() {
  const p = useLocalSearchParams<{ name?: string; code?: string }>();
  const student = (p.code || p.name || 'طالب').trim();
  const [items] = useState(() => [...pool].sort(() => Math.random() - .5).slice(0, Math.min(10, pool.length)));
  const [i, setI] = useState(0); const [correct, setCorrect] = useState(0); const [opponent, setOpponent] = useState(0); const [done, setDone] = useState(false); const [reward, setReward] = useState(0);
  const opponentName = useMemo(() => names[Math.floor(Math.random() * names.length)], []);
  const q = items[i];

  const answer = async (value: string) => {
    if (!q || done) return;
    const ok = value === q.answer;
    const nextCorrect = correct + (ok ? 1 : 0);
    // منافس محلي بسيط: أداؤه يتراوح حول 60–90%، دون إنترنت أو خدمة مدفوعة.
    const botOk = Math.random() < 0.72;
    const nextOpponent = opponent + (botOk ? 1 : 0);
    await recordQuestionAnswers(student, [{ id: q.key, correct: ok }]);
    setCorrect(nextCorrect); setOpponent(nextOpponent);
    if (i + 1 >= items.length) {
      const result = await recordMatchResult(student, nextCorrect > nextOpponent, nextCorrect, items.length);
      setReward(result.reward); setDone(true);
    } else setI(v => v + 1);
  };

  if (done) {
    const won = correct > opponent;
    const draw = correct === opponent;
    return <SafeAreaView style={s.safe}><View style={s.center}><Text style={s.trophy}>{won ? '🏆' : draw ? '🤝' : '💪'}</Text><Text style={s.title}>{won ? 'فوز رائع!' : draw ? 'تعادل ممتاز!' : 'مباراة قوية!'}</Text><Text style={s.result}>{correct} - {opponent}</Text><Text style={s.muted}>أنت • {opponentName}</Text><Text style={s.reward}>+{reward} XP</Text><Text style={s.note}>{won ? 'أصبحت بطل المباراة العلمية 🎉' : 'أعد المباراة وحاول تجاوز منافسك.'}</Text><Pressable style={s.primary} onPress={() => router.back()}><Text style={s.primaryText}>العودة</Text></Pressable></View></SafeAreaView>;
  }

  return <SafeAreaView style={s.safe}><View style={s.content}><View style={s.header}><Pressable onPress={() => router.back()}><Text style={s.back}>‹</Text></Pressable><View style={{flex:1}}><Text style={s.eyebrow}>منافسة بلا إنترنت</Text><Text style={s.title}>⚔️ المباراة العلمية</Text></View></View><View style={s.score}><View><Text style={s.scoreName}>أنت</Text><Text style={s.scoreNum}>{correct}</Text></View><Text style={s.vs}>VS</Text><View><Text style={s.scoreName}>{opponentName}</Text><Text style={s.scoreNum}>{opponent}</Text></View></View><Text style={s.progress}>السؤال {i + 1} من {items.length} • {q?.subject}</Text><View style={s.card}><Text style={s.question}>{q?.question}</Text>{q?.options?.map(o => <Pressable key={o} onPress={() => answer(o)} style={s.option}><Text style={s.optionText}>{o}</Text></Pressable>)}</View><Text style={s.tip}>أجب أولًا؛ منافسك يجيب بعدك مباشرة.</Text></View></SafeAreaView>;
}

const s = StyleSheet.create({safe:{flex:1,backgroundColor:'#f5f7fb'},content:{padding:18,flex:1},header:{flexDirection:'row',alignItems:'center',marginBottom:16},back:{fontSize:38,color:'#17324d',paddingHorizontal:8},eyebrow:{fontSize:12,color:'#667085',textAlign:'right'},title:{fontSize:25,fontWeight:'900',color:'#14213d',textAlign:'right'},score:{backgroundColor:'#17324d',borderRadius:20,padding:16,flexDirection:'row',justifyContent:'space-around',alignItems:'center'},scoreName:{color:'#dce8f5',fontSize:11,textAlign:'center'},scoreNum:{color:'#fff',fontSize:31,fontWeight:'900',textAlign:'center',marginTop:2},vs:{color:'#fff',fontWeight:'900',fontSize:18},progress:{textAlign:'right',color:'#667085',fontSize:12,marginVertical:12},card:{backgroundColor:'#fff',borderRadius:20,padding:17,borderWidth:1,borderColor:'#eaecf0'},question:{fontSize:19,fontWeight:'900',color:'#14213d',textAlign:'right',lineHeight:29},option:{backgroundColor:'#f8fafc',borderRadius:13,padding:15,marginTop:10,borderWidth:1,borderColor:'#d0d5dd'},optionText:{fontWeight:'800',color:'#344054',textAlign:'right'},tip:{textAlign:'center',color:'#667085',fontSize:11,marginTop:15},center:{flex:1,alignItems:'center',justifyContent:'center',padding:25},trophy:{fontSize:64},result:{fontSize:46,fontWeight:'900',color:'#17324d',marginTop:8},muted:{color:'#667085',marginTop:2},reward:{fontSize:22,fontWeight:'900',color:'#17834f',marginTop:15},note:{color:'#667085',textAlign:'center',marginTop:8},primary:{backgroundColor:'#17324d',borderRadius:14,padding:16,marginTop:20,minWidth:190},primaryText:{color:'#fff',fontWeight:'900',textAlign:'center'}});
