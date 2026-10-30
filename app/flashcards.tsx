import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const cards = [
  {
    icon: '⚛️',
    accent: '#7C3AED',
    question: 'ما الذي يميز عناصر المجموعة الرئيسية الأولى؟',
    answer: 'تحتوي ذراتها في المستوى الخارجي على إلكترون واحد، لذلك تفقده بسهولة أثناء التفاعلات الكيميائية.',
    tag: 'فكرة أساسية',
  },
  {
    icon: '🧪',
    accent: '#0EA5E9',
    question: 'ما عناصر المجموعة الأولى المذكورة في الملزمة؟',
    answer: 'الليثيوم Li، الصوديوم Na، البوتاسيوم K، الروبيديوم Rb، والسيزيوم Cs.',
    tag: 'احفظ الرموز',
  },
  {
    icon: '💡',
    accent: '#F59E0B',
    question: 'لماذا يزداد نشاط عناصر المجموعة الأولى عند النزول في المجموعة؟',
    answer: 'يزداد الحجم الذري، ويزداد بعد إلكترون التكافؤ عن النواة، فيسهل فقده؛ لذلك يزداد نشاط العناصر نزولًا في المجموعة.',
    tag: 'فهم وليس حفظًا',
  },
  {
    icon: '🔢',
    accent: '#10B981',
    question: 'ما التوزيع الإلكتروني للصوديوم Na وعدده الذري 11؟',
    answer: '1s² 2s² 2p⁶ 3s¹، وتوزيع الإلكترونات على مستويات K-L-M هو 2-8-1.',
    tag: 'الصوديوم Na',
  },
  {
    icon: '💧',
    accent: '#06B6D4',
    question: 'ماذا يحدث عند تفاعل الصوديوم مع الماء؟',
    answer: 'يتفاعل الصوديوم مع الماء مكونًا هيدروكسيد الصوديوم وغاز الهيدروجين: 2Na + 2H₂O → 2NaOH + H₂.',
    tag: 'معادلة مهمة',
  },
  {
    icon: '🧂',
    accent: '#EC4899',
    question: 'اذكر مركبين من مركبات الصوديوم الواردة في الملزمة.',
    answer: 'منها كلوريد الصوديوم NaCl، وكربونات الصوديوم Na₂CO₃، ونترات الصوديوم NaNO₃، وبيكربونات الصوديوم NaHCO₃.',
    tag: 'مركبات الصوديوم',
  },
  {
    icon: '🔬',
    accent: '#8B5CF6',
    question: 'ما استخدام الصوديوم المذكور في الملزمة؟',
    answer: 'يستخدم الصوديوم في صنع مصابيح الصوديوم المستخدمة في إنارة الشوارع ومصابيح السيارات؛ لأنها قادرة على اختراق الضباب.',
    tag: 'تطبيقات',
  },
  {
    icon: '☀️',
    accent: '#EF4444',
    question: 'ما استخدام السيزيوم المذكور في الملزمة؟',
    answer: 'يستخدم السيزيوم في صناعة الخلايا الكهروضوئية لحساسية هذا العنصر للضوء ونشاطه الكيميائي العالي.',
    tag: 'تطبيقات',
  },
];

export default function FlashcardsScreen() {
  const p = useLocalSearchParams<{ grade?: string; subject?: string; name?: string; code?: string }>();
  const grade = p.grade || 'الأول الثانوي';
  const subject = p.subject || 'الكيمياء';
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;
  const card = cards[index];

  const flip = () => {
    Animated.spring(rotation, {
      toValue: flipped ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 55,
    }).start();
    setFlipped(!flipped);
  };

  const next = () => {
    setFlipped(false);
    rotation.setValue(0);
    setIndex((value) => (value + 1) % cards.length);
  };

  const previous = () => {
    setFlipped(false);
    rotation.setValue(0);
    setIndex((value) => (value - 1 + cards.length) % cards.length);
  };

  const frontRotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  if (grade !== 'الأول الثانوي' || subject !== 'الكيمياء') {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.blockIcon}>🔒</Text><Text style={styles.blockTitle}>هذه البطاقات للأول الثانوي • الكيمياء</Text><Text style={styles.blockText}>سيظهر محتوى كل صف ومادة بحسب حساب الطالب.</Text><Pressable style={styles.backButton} onPress={() => router.back()}><Text style={styles.backText}>العودة</Text></Pressable></View></SafeAreaView>;
  }

  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backCircle}><Text style={styles.backCircleText}>‹</Text></Pressable>
        <View style={styles.headerText}><Text style={styles.kicker}>الأول الثانوي • الكيمياء</Text><Text style={styles.title}>🧪 بطاقات الكيمياء 3D</Text><Text style={styles.subtitle}>اقرأ السؤال، اضغط على البطاقة، ثم اقلبها لاكتشاف الإجابة.</Text></View>
      </View>

      <View style={styles.progressRow}><Text style={styles.progressText}>البطاقة {index + 1} من {cards.length}</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((index + 1) / cards.length) * 100}%`, backgroundColor: card.accent }]} /></View></View>

      <Pressable onPress={flip} style={styles.cardStage} accessibilityRole="button" accessibilityLabel="اقلب بطاقة الكيمياء">
        <Animated.View style={[styles.flashCard, { backgroundColor: card.accent, transform: [{ perspective: 1000 }, { rotateY: frontRotate }] }]}>
          <View style={styles.glowOne} /><View style={styles.glowTwo} />
          <Text style={styles.cardTag}>{card.tag}</Text><Text style={styles.cardIcon}>{card.icon}</Text>
          <Text style={styles.questionLabel}>سؤال</Text><Text style={styles.question}>{card.question}</Text>
          <Text style={styles.tapHint}>👆 اضغط لقلب البطاقة</Text>
        </Animated.View>
        <Animated.View style={[styles.flashCard, styles.backCard, { transform: [{ perspective: 1000 }, { rotateY: backRotate }] }]}>
          <Text style={[styles.answerLabel, { color: card.accent }]}>💡 الإجابة</Text>
          <Text style={styles.answer}>{card.answer}</Text>
          <View style={[styles.rememberBox, { borderColor: card.accent }]}><Text style={[styles.rememberText, { color: card.accent }]}>⭐ معلومة من الملزمة</Text><Text style={styles.rememberSub}>اضغط مرة أخرى للعودة إلى السؤال</Text></View>
        </Animated.View>
      </Pressable>

      <View style={styles.controls}><Pressable style={styles.controlButton} onPress={previous}><Text style={styles.controlText}>→ السابقة</Text></Pressable><Pressable style={[styles.flipButton, { backgroundColor: card.accent }]} onPress={flip}><Text style={styles.flipText}>🔄 قلب البطاقة</Text></Pressable><Pressable style={styles.controlButton} onPress={next}><Text style={styles.controlText}>التالية ←</Text></Pressable></View>

      <View style={styles.challenge}><Text style={styles.challengeIcon}>🏆</Text><View style={{ flex: 1 }}><Text style={styles.challengeTitle}>تحدي سريع</Text><Text style={styles.challengeText}>حاول الإجابة قبل أن تقلب البطاقة، ثم انتقل للبطاقة التالية.</Text></View></View>
      <Text style={styles.sourceNote}>المحتوى التعليمي في هذه المجموعة مستخلص من ملخص الكيمياء للأول الثانوي • الفصل الدراسي الثاني • الوحدة الخامسة.</Text>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7FF' },
  content: { padding: 18, paddingBottom: 44 },
  header: { flexDirection: 'row-reverse', alignItems: 'flex-start', marginBottom: 14 },
  headerText: { flex: 1, marginRight: 10 },
  backCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#C7D2FE' },
  backCircleText: { fontSize: 30, color: '#4338CA', lineHeight: 34 },
  kicker: { color: '#6366F1', fontSize: 11, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  title: { color: '#172554', fontSize: 25, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  subtitle: { color: '#64748B', fontSize: 11, lineHeight: 18, textAlign: 'right', writingDirection: 'rtl', marginTop: 4 },
  progressRow: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, borderWidth: 2, borderColor: '#E0E7FF', marginBottom: 14 },
  progressText: { color: '#172554', fontWeight: '900', fontSize: 12, textAlign: 'right', writingDirection: 'rtl', marginBottom: 8 },
  progressTrack: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 8 },
  cardStage: { minHeight: 420, marginBottom: 14 },
  flashCard: { position: 'absolute', left: 0, right: 0, minHeight: 420, borderRadius: 30, padding: 24, overflow: 'hidden', backfaceVisibility: 'hidden', elevation: 8, shadowColor: '#172554', shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  backCard: { backgroundColor: '#FFFFFF', justifyContent: 'center' },
  glowOne: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: '#FFFFFF22', top: -65, left: -50 },
  glowTwo: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: '#FFFFFF18', bottom: -45, right: -30 },
  cardTag: { color: '#FFFFFFDD', fontSize: 11, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  cardIcon: { fontSize: 70, textAlign: 'center', marginTop: 24 },
  questionLabel: { color: '#FFFFFFAA', fontSize: 12, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl', marginTop: 20 },
  question: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', lineHeight: 38, textAlign: 'right', writingDirection: 'rtl', marginTop: 8 },
  tapHint: { color: '#FFFFFFCC', fontSize: 11, fontWeight: '800', textAlign: 'center', marginTop: 30 },
  answerLabel: { fontSize: 19, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl', marginBottom: 18 },
  answer: { color: '#172554', fontSize: 21, fontWeight: '800', lineHeight: 37, textAlign: 'right', writingDirection: 'rtl' },
  rememberBox: { marginTop: 24, borderWidth: 2, borderRadius: 18, padding: 14, backgroundColor: '#F8FAFC' },
  rememberText: { fontSize: 13, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  rememberSub: { color: '#64748B', fontSize: 10, textAlign: 'right', writingDirection: 'rtl', marginTop: 5 },
  controls: { flexDirection: 'row-reverse', gap: 7, marginBottom: 14 },
  controlButton: { flex: 1, minHeight: 50, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' },
  controlText: { color: '#172554', fontSize: 11, fontWeight: '900' },
  flipButton: { flex: 1.35, minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  flipText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  challenge: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#FFF7ED', borderRadius: 20, padding: 15, borderWidth: 2, borderColor: '#FED7AA', marginBottom: 14 },
  challengeIcon: { fontSize: 34, marginLeft: 10 },
  challengeTitle: { color: '#9A3412', fontSize: 14, fontWeight: '900', textAlign: 'right', writingDirection: 'rtl' },
  challengeText: { color: '#9A3412', fontSize: 10, lineHeight: 16, textAlign: 'right', writingDirection: 'rtl', marginTop: 3 },
  sourceNote: { color: '#64748B', fontSize: 9, lineHeight: 15, textAlign: 'center', writingDirection: 'rtl' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  blockIcon: { fontSize: 60 },
  blockTitle: { color: '#172554', fontSize: 18, fontWeight: '900', textAlign: 'center', writingDirection: 'rtl', marginTop: 15 },
  blockText: { color: '#64748B', fontSize: 12, textAlign: 'center', writingDirection: 'rtl', marginTop: 8, lineHeight: 20 },
  backButton: { marginTop: 18, paddingHorizontal: 30, paddingVertical: 13, borderRadius: 14, backgroundColor: '#4338CA' },
  backText: { color: '#FFFFFF', fontWeight: '900' },
});
