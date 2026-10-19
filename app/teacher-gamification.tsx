import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { grades } from '../src/data';
import { dailyChallenges, getDailyChallenge, levelFromXp, type GamificationState } from '../src/gamification';
import { readJson, storageKeys, writeJson, type LocalStudent } from '../src/storage';

const empty: GamificationState = { xp: 0, level: 1, streak: 0, answered: 0, correct: 0, completedExams: 0, badges: [], challengeProgress: 0, challengeCompleted: false, challengeRewarded: false, consecutiveCorrect: 0 };
const stateKey = (code: string) => `science-gamification:${code}`;

export default function TeacherGamificationScreen() {
  const p = useLocalSearchParams<{ grade?: string; stage?: string }>();
  const grade = p.stage || p.grade || grades[0];
  const [students, setStudents] = useState<LocalStudent[]>([]);
  const [states, setStates] = useState<Record<string, GamificationState>>({});
  const [selected, setSelected] = useState<LocalStudent | null>(null);
  const [xpInput, setXpInput] = useState('50');
  const [badgeInput, setBadgeInput] = useState('');

  const load = async () => {
    const all = await readJson<LocalStudent[]>(storageKeys.students, []);
    const list = all.filter(s => s.grade === grade);
    const pairs = await Promise.all(list.map(async s => [s.code, await readJson<GamificationState>(stateKey(s.code), empty)] as const));
    setStudents(list);
    setStates(Object.fromEntries(pairs));
  };
  useEffect(() => { load(); }, [grade]);

  const challenge = getDailyChallenge();
  const totalXp = useMemo(() => students.reduce((sum, s) => sum + (states[s.code]?.xp || 0), 0), [students, states]);
  const completedChallenges = students.filter(s => states[s.code]?.challengeCompleted).length;

  const saveState = async (student: LocalStudent, patch: Partial<GamificationState>) => {
    const old = { ...empty, ...(states[student.code] || {}) };
    const next = { ...old, ...patch, level: levelFromXp(Math.max(0, patch.xp ?? old.xp)) };
    await writeJson(stateKey(student.code), next);
    setStates(prev => ({ ...prev, [student.code]: next }));
    setSelected({ ...student });
  };

  const addXp = async (amount: number) => {
    if (!selected) return;
    const value = Number(xpInput);
    if (!Number.isFinite(value) || value <= 0) return Alert.alert('قيمة غير صحيحة', 'أدخل عدد XP موجبًا.');
    await saveState(selected, { xp: Math.max(0, (states[selected.code]?.xp || 0) + amount * value) });
    Alert.alert('تم التحديث', `${amount > 0 ? 'تمت إضافة' : 'تم خصم'} ${value} XP من ${selected.name}.`);
  };

  const awardBadge = async () => {
    if (!selected || !badgeInput.trim()) return;
    const old = states[selected.code] || empty;
    const badge = badgeInput.trim();
    const badges = old.badges.includes(badge) ? old.badges : [...old.badges, badge];
    await saveState(selected, { badges });
    setBadgeInput('');
    Alert.alert('تم منح الشارة', `${badge} ← ${selected.name}`);
  };

  const resetProgress = () => {
    if (!selected) return;
    Alert.alert('تأكيد إعادة الضبط', `سيتم تصفير تقدم ${selected.name} المحلي في نظام التحفيز.`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تصفير', style: 'destructive', onPress: async () => { await writeJson(stateKey(selected.code), empty); setStates(prev => ({ ...prev, [selected.code]: empty })); } },
    ]);
  };

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.container}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>رجوع ›</Text></Pressable>
    <Text style={styles.title}>🎮 إدارة التحفيز والمتابعة</Text>
    <Text style={styles.subtitle}>المستوى: {grade}</Text>
    <Pressable style={styles.analyticsButton} onPress={() => router.push({pathname:'/teacher-analytics',params:{role:'teacher',grade,stage:grade}})}><Text style={styles.analyticsTitle}>📊 تحليل أداء الطلاب</Text><Text style={styles.analyticsText}>متوسط المستوى • المواد • المتفوقون • الطلاب الذين يحتاجون متابعة</Text></Pressable>

    <View style={styles.statsRow}>
      <Stat label="الطلاب" value={String(students.length)} />
      <Stat label="XP الكلي" value={String(totalXp)} />
      <Stat label="أكملوا التحدي" value={String(completedChallenges)} />
    </View>

    <View style={styles.challenge}><Text style={styles.challengeTitle}>{challenge.icon} تحدي اليوم: {challenge.title}</Text><Text style={styles.challengeText}>{challenge.text} • المكافأة {challenge.reward} XP</Text><Text style={styles.small}>يمكنك متابعة إنجاز كل طالب من القائمة أدناه.</Text></View>

    <Text style={styles.section}>الطلاب</Text>
    {students.length === 0 && <View style={styles.card}><Text style={styles.empty}>لا يوجد طلاب مسجلون في هذا المستوى بعد.</Text></View>}
    {students.map(s => { const st = states[s.code] || empty; const selectedNow = selected?.code === s.code; return <Pressable key={s.id} onPress={() => setSelected(s)} style={[styles.student, selectedNow && styles.studentSelected]}>
      <View style={{ flex: 1 }}><Text style={styles.name}>{s.name}</Text><Text style={styles.small}>المستوى {st.level} • {st.xp} XP • 🔥 {st.streak} أيام • 🎖️ {st.badges.length}</Text><Text style={styles.small}>الدقة: {st.answered ? Math.round((st.correct / st.answered) * 100) : 0}% • اختبارات: {st.completedExams}</Text></View><Text style={styles.chevron}>‹</Text>
    </Pressable>; })}

    {selected && <View style={styles.card}>
      <Text style={styles.sectionTitle}>إدارة: {selected.name}</Text>
      <View style={styles.highlight}><Text style={styles.big}>{states[selected.code]?.xp || 0} XP</Text><Text style={styles.small}>المستوى {states[selected.code]?.level || 1}</Text></View>
      <Text style={styles.label}>إضافة / خصم XP</Text><TextInput value={xpInput} onChangeText={v => setXpInput(v.replace(/\D/g, ''))} keyboardType="number-pad" style={styles.input} textAlign="center"/><View style={styles.actions}><Pressable style={styles.primary} onPress={() => addXp(1)}><Text style={styles.primaryText}>＋ إضافة XP</Text></Pressable><Pressable style={styles.danger} onPress={() => addXp(-1)}><Text style={styles.dangerText}>− خصم XP</Text></Pressable></View>
      <Text style={styles.label}>منح شارة</Text><TextInput value={badgeInput} onChangeText={setBadgeInput} placeholder="مثال: متفوق الكيمياء" style={styles.input} textAlign="right"/><Pressable style={styles.secondary} onPress={awardBadge}><Text style={styles.secondaryText}>🏅 منح الشارة</Text></Pressable>
      <Text style={styles.label}>الشارات الحالية</Text><Text style={styles.badges}>{(states[selected.code]?.badges || []).join(' • ') || 'لا توجد شارات بعد'}</Text>
      <Pressable style={styles.reset} onPress={resetProgress}><Text style={styles.resetText}>إعادة ضبط تقدم التحفيز</Text></Pressable>
    </View>}

    <View style={styles.card}><Text style={styles.sectionTitle}>📌 نظام المكافآت الحالي</Text>{dailyChallenges.map(c => <View key={c.id} style={styles.rule}><Text style={styles.ruleTitle}>{c.icon} {c.title}</Text><Text style={styles.small}>{c.text} • +{c.reward} XP</Text></View>)}</View>
  </ScrollView></SafeAreaView>;
}
function Stat({ label, value }: { label: string; value: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.small}>{label}</Text></View>; }
const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#f4f7fb'},container:{padding:18,paddingBottom:45},back:{color:'#356ae6',fontWeight:'800',marginBottom:12,textAlign:'right'},title:{fontSize:26,fontWeight:'900',color:'#14213d',textAlign:'right'},subtitle:{fontSize:13,color:'#667085',textAlign:'right',marginTop:4,marginBottom:14},analyticsButton:{backgroundColor:'#356ae6',borderRadius:17,padding:15,marginBottom:13},analyticsTitle:{color:'#fff',fontSize:16,fontWeight:'900',textAlign:'right'},analyticsText:{color:'#eaf0ff',fontSize:11,textAlign:'right',marginTop:5,lineHeight:18},statsRow:{flexDirection:'row-reverse',gap:8,marginBottom:12},stat:{flex:1,backgroundColor:'#fff',borderRadius:16,padding:13,alignItems:'center',borderWidth:1,borderColor:'#eaecf0'},statValue:{fontSize:20,fontWeight:'900',color:'#17324d'},small:{fontSize:11,color:'#667085',marginTop:3},challenge:{backgroundColor:'#17324d',borderRadius:18,padding:16,marginBottom:14},challengeTitle:{color:'#fff',fontSize:17,fontWeight:'900',textAlign:'right'},challengeText:{color:'#e6eef8',fontSize:12,textAlign:'right',marginTop:5},section:{fontSize:19,fontWeight:'900',color:'#14213d',textAlign:'right',marginBottom:9},student:{backgroundColor:'#fff',borderRadius:16,padding:14,marginBottom:8,flexDirection:'row-reverse',alignItems:'center',borderWidth:1,borderColor:'#eaecf0'},studentSelected:{borderColor:'#356ae6',borderWidth:2},name:{fontSize:16,fontWeight:'900',color:'#14213d',textAlign:'right'},chevron:{fontSize:28,color:'#98a2b3'},card:{backgroundColor:'#fff',borderRadius:18,padding:16,marginTop:8,marginBottom:12,borderWidth:1,borderColor:'#eaecf0'},sectionTitle:{fontSize:18,fontWeight:'900',color:'#14213d',textAlign:'right',marginBottom:10},highlight:{backgroundColor:'#eef4f8',borderRadius:14,padding:13,alignItems:'center',marginBottom:10},big:{fontSize:25,fontWeight:'900',color:'#17324d'},label:{fontSize:13,fontWeight:'900',color:'#344054',textAlign:'right',marginTop:9,marginBottom:5},input:{borderWidth:1,borderColor:'#d0d5dd',borderRadius:12,padding:11,backgroundColor:'#fff',color:'#101828'},actions:{flexDirection:'row-reverse',gap:8,marginTop:8},primary:{flex:1,backgroundColor:'#17324d',borderRadius:12,padding:12,alignItems:'center'},primaryText:{color:'#fff',fontWeight:'900'},danger:{flex:1,backgroundColor:'#fff0ee',borderRadius:12,padding:12,alignItems:'center',borderWidth:1,borderColor:'#fecdca'},dangerText:{color:'#d92d20',fontWeight:'900'},secondary:{borderWidth:1,borderColor:'#d0d5dd',borderRadius:12,padding:12,alignItems:'center',marginTop:8},secondaryText:{color:'#17324d',fontWeight:'900'},badges:{color:'#475467',textAlign:'right',lineHeight:22},reset:{padding:13,alignItems:'center',marginTop:10},resetText:{color:'#d92d20',fontWeight:'900'},rule:{borderTopWidth:1,borderTopColor:'#eaecf0',paddingVertical:9},ruleTitle:{fontWeight:'900',color:'#344054',textAlign:'right'},empty:{color:'#667085',textAlign:'center',padding:8}});