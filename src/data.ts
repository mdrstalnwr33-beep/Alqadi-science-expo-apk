export type Role = 'student' | 'teacher';
export type Subject = 'الكيمياء' | 'الفيزياء' | 'الأحياء';
export type Grade = 'الأول الثانوي' | 'الثاني الثانوي' | 'الثالث الثانوي';

export const subjects: { name: Subject; icon: string; description: string }[] = [
  { name: 'الكيمياء', icon: '⚗️', description: 'المادة والذرات والتفاعلات' },
  { name: 'الفيزياء', icon: '⚡', description: 'الحركة والطاقة والقوانين' },
  { name: 'الأحياء', icon: '🧬', description: 'الحياة والخلايا والأنظمة الحيوية' },
];

export const grades: Grade[] = ['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'];

const bookContent: Record<Subject, string> = {
  'الكيمياء': 'الوحدة الأولى: المادة وخواصها\n\nتتناول هذه الوحدة مفهوم المادة وتصنيفها إلى عناصر ومركبات ومخاليط، مع التعرف على الذرة والجزيء والتغيرات الفيزيائية والكيميائية.\n\nأهم النقاط:\n• الفرق بين العنصر والمركب والمخلوط.\n• مكونات الذرة الأساسية.\n• دلائل حدوث التفاعل الكيميائي.\n• أهمية القياس والوحدات في التجارب العلمية.',
  'الفيزياء': 'الوحدة الأولى: الحركة والقوى\n\nتبدأ دراسة الفيزياء بوصف الحركة وقياس المسافة والزمن والسرعة، ثم الانتقال إلى مفهوم القوة وتأثيرها في حركة الأجسام.\n\nأهم النقاط:\n• المسافة والإزاحة.\n• السرعة المتوسطة.\n• مفهوم القوة.\n• العلاقة بين القوة والحركة.',
  'الأحياء': 'الوحدة الأولى: أساسيات الحياة\n\nتدرس هذه الوحدة خصائص الكائنات الحية وتنظيمها، ثم تتناول الخلية بوصفها الوحدة الأساسية للحياة ومكوناتها ووظائفها.\n\nأهم النقاط:\n• خصائص الكائنات الحية.\n• مستويات التنظيم الحيوي.\n• مكونات الخلية.\n• الفرق بين الخلايا النباتية والحيوانية.',
};

export const books = subjects.flatMap((subject) =>
  grades.map((grade, index) => ({
    id: `book-${subject.name}-${index}`,
    title: `كتاب ${subject.name} — ${grade}`,
    subject: subject.name,
    grade,
    description: `مذكرة مراجعة تفاعلية لمادة ${subject.name} لل${grade}.`,
    content: bookContent[subject.name],
  })),
);

export const lessons = subjects.flatMap((subject) =>
  grades.slice(0, 2).map((grade, index) => ({
    id: `lesson-${subject.name}-${index}`,
    title: `الدرس اليومي: مدخل إلى ${subject.name}`,
    subject: subject.name,
    grade,
    date: `اليوم ${index + 1}`,
    body: `مراجعة مركزة في ${subject.name} مع أهم المفاهيم والمصطلحات والأسئلة التدريبية.`,
  })),
);

export type ExamQuestion = { id: string; type: 'mcq' | 'tf' | 'text'; question: string; options?: string[]; answer?: string };
export const exams = subjects.map((subject, index) => ({
  id: `exam-${index}`,
  title: `الاختبار الشهري — ${subject.name}`,
  subject: subject.name,
  grade: grades[index % grades.length],
  duration: 30,
  questions: [
    { id: 'q1', type: 'mcq' as const, question: `أي عبارة تصف مفهومًا أساسيًا في ${subject.name}؟`, options: ['الإجابة الأولى', 'الإجابة الثانية', 'الإجابة الثالثة', 'الإجابة الرابعة'], answer: 'الإجابة الثانية' },
    { id: 'q2', type: 'tf' as const, question: `تحتاج دراسة ${subject.name} إلى فهم المفاهيم ثم تطبيقها.`, options: ['صح', 'خطأ'], answer: 'صح' },
    { id: 'q3', type: 'text' as const, question: `اكتب باختصار أهم فكرة تعلمتها في ${subject.name}.` },
  ] as ExamQuestion[],
}));

export const homework = subjects.map((subject, index) => ({
  id: `hw-${index}`,
  title: `واجب ${subject.name} الأسبوعي`,
  subject: subject.name,
  grade: grades[index % grades.length],
  due: 'نهاية هذا الأسبوع',
  note: 'أجب عن الأسئلة بوضوح وأرسل صورة الدفتر للمعلم عند الحاجة.',
  questions: ['عرّف المفهوم الرئيسي في الدرس.', 'اذكر مثالًا تطبيقيًا.', 'اكتب خلاصة قصيرة للدرس.'],
}));
