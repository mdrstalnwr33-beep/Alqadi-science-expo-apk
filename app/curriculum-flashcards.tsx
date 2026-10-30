import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

type Card={icon:string;accent:string;lesson:string;question:string;answer:string};
type Pack={title:string;icon:string;cards:Card[]};

const packs:Record<string,Pack>={
'الأول الثانوي|الفيزياء':{title:'فيزياء الأول الثانوي',icon:'⚡',cards:[
{icon:'🧭',accent:'#2563EB',lesson:'الشغل',question:'ما المقصود بالشغل؟',answer:'هو تأثير قوة على جسم وإزاحته في اتجاه القوة.'},
{icon:'📐',accent:'#0EA5E9',lesson:'الشغل',question:'ما قانون الشغل عندما تكون القوة في اتجاه الإزاحة؟',answer:'الشغل = القوة × الإزاحة، ووحدته في النظام الدولي الجول.'},
{icon:'📐',accent:'#0284C7',lesson:'الشغل',question:'كيف يحسب الشغل عندما تصنع القوة زاوية مع الإزاحة؟',answer:'الشغل = القوة × الإزاحة × جتا الزاوية.'},
{icon:'🪵',accent:'#7C3AED',lesson:'الشغل',question:'ما إشارة شغل قوة الاحتكاك؟',answer:'يكون سالبًا عندما تكون قوة الاحتكاك في عكس اتجاه الإزاحة.'},
{icon:'⚡',accent:'#F59E0B',lesson:'الطاقة',question:'ما الطاقة الحركية؟',answer:'هي الطاقة التي يمتلكها الجسم بسبب حركته، وقانونها KE = ½mv².'},
{icon:'🏔️',accent:'#8B5CF6',lesson:'الطاقة',question:'ما طاقة الوضع الجاذبية؟',answer:'هي الطاقة المرتبطة بموضع الجسم في مجال الجاذبية، وقانونها PE = mgh.'},
{icon:'🔄',accent:'#10B981',lesson:'الطاقة',question:'ما الطاقة الميكانيكية؟',answer:'مجموع الطاقة الحركية وطاقة الوضع: ME = KE + PE.'},
{icon:'♻️',accent:'#059669',lesson:'حفظ الطاقة',question:'ماذا ينص قانون حفظ الطاقة؟',answer:'الطاقة لا تفنى ولا تستحدث من العدم، وإنما تتحول من صورة إلى أخرى وتبقى الطاقة الكلية محفوظة في النظام.'},
{icon:'🥎',accent:'#EF4444',lesson:'الدفع وكمية التحرك',question:'ما كمية التحرك؟',answer:'كمية فيزيائية تساوي كتلة الجسم مضروبة في سرعته: p = mv.'},
{icon:'💥',accent:'#DC2626',lesson:'الدفع وكمية التحرك',question:'ما الدفع؟',answer:'هو مقدار القوة المؤثرة في جسم خلال زمن تأثيرها: J = FΔt.'},
{icon:'⚖️',accent:'#EA580C',lesson:'الدفع وكمية التحرك',question:'ما العلاقة بين الدفع وكمية التحرك؟',answer:'الدفع يساوي التغير في كمية التحرك.'},
{icon:'💥',accent:'#BE123C',lesson:'التصادمات',question:'ما التصادم المرن؟',answer:'تصادم يرتد فيه الجسمان عن بعضهما بعد التصادم مع حفظ كمية التحرك وفق الملزمة.'},
{icon:'🧱',accent:'#9F1239',lesson:'التصادمات',question:'ما التصادم غير المرن التام؟',answer:'تصادم يلتصق فيه الجسمان بعد التصادم ويتحركان معًا كجسم واحد.'},
{icon:'🔋',accent:'#0891B2',lesson:'المكثف',question:'ما وظيفة المكثف؟',answer:'أداة لخزن الطاقة والشحنات الكهربائية والاستفادة منها عند الحاجة.'},
{icon:'📦',accent:'#06B6D4',lesson:'السعة الكهربائية',question:'ما وحدة السعة الكهربائية؟',answer:'الفاراد، وهي نسبة الشحنة إلى جهد المكثف.'},
{icon:'🔗',accent:'#14B8A6',lesson:'المكثفات',question:'كيف تتصل المكثفات على التوازي؟',answer:'تتصل الأقطاب الموجبة معًا والسالبة معًا، وتساوي السعة الكلية مجموع السعات.'},
{icon:'🔗',accent:'#0F766E',lesson:'المكثفات',question:'كيف تتصل المكثفات على التوالي؟',answer:'يربط القطب الموجب لمكثف بالقطب السالب للذي يليه، وتستخدم علاقة مقلوب السعة الكلية.'},
{icon:'⚡',accent:'#4F46E5',lesson:'المجال الكهربائي والمقاومة',question:'ما شدة المجال الكهربائي بين لوحين متوازيين؟',answer:'تعتمد على فرق الجهد والمسافة بين اللوحين، وفي الحالة المنتظمة E = V/d.'},
{icon:'〰️',accent:'#4338CA',lesson:'المقاومة الكهربائية',question:'ما العوامل التي تؤثر في المقاومة؟',answer:'نوع مادة الموصل وطوله ومساحة مقطعه ودرجة حرارته بحسب ما ورد في الملزمة.'},
{icon:'🎚️',accent:'#7C3AED',lesson:'المقاومة الكهربائية',question:'ما استخدام الريوستات؟',answer:'مقاومة متغيرة تستخدم للتحكم في شدة التيار، ومن تطبيقاتها التحكم في الإضاءة أو الصوت.'},
]},
'الأول الثانوي|الأحياء':{title:'أحياء الأول الثانوي',icon:'🧬',cards:[
{icon:'🌿',accent:'#16A34A',lesson:'النقل في النبات',question:'ما وظيفة الخشب؟',answer:'ينقل الماء والأملاح المعدنية من الجذر إلى أجزاء النبات.'},
{icon:'🍃',accent:'#059669',lesson:'النقل في النبات',question:'ما وظيفة اللحاء؟',answer:'ينقل الغذاء الجاهز من الأوراق إلى أجزاء النبات المختلفة.'},
{icon:'💧',accent:'#0284C7',lesson:'النقل في النبات',question:'ما الذي يساعد على صعود الماء في الأوعية الخشبية؟',answer:'قوى التماسك بين جزيئات الماء والتلاصق مع جدران الأوعية، إضافة إلى النتح وفق الملزمة.'},
{icon:'🌱',accent:'#22C55E',lesson:'النقل في النبات',question:'ما دور النتح؟',answer:'يساعد على سحب أعمدة الماء إلى أعلى في الأوعية الخشبية.'},
{icon:'❤️',accent:'#DC2626',lesson:'الجهاز الدوري',question:'ما وظيفة الجهاز الدوري؟',answer:'نقل المواد بين أجزاء الجسم، ومنها الغذاء والغازات والفضلات بحسب نوع الكائن الحي.'},
{icon:'🩸',accent:'#EF4444',lesson:'الدورة الدموية',question:'ما الفرق بين الدم المؤكسج وغير المؤكسج؟',answer:'الدم المؤكسج يحمل كمية أكبر من الأكسجين، بينما غير المؤكسج يكون أقل في الأكسجين ويحمل ثاني أكسيد الكربون بصورة أكبر.'},
{icon:'🐜',accent:'#F59E0B',lesson:'الدوران في الحشرات',question:'هل ينقل دم الحشرات الأكسجين؟',answer:'لا، جهازها الدوري لا ينقل الأكسجين؛ لأن جهازها التنفسي يوصل الأكسجين مباشرة إلى الأنسجة.'},
{icon:'🫀',accent:'#BE123C',lesson:'الدوران في الحشرات',question:'ما تركيب قلب الحشرة المذكور؟',answer:'قلب أنبوبي ممتد على طول ظهر الحشرة ومقسم إلى حجرات تتصل بصمامات تسمح باتجاه محدد للدم.'},
{icon:'☀️',accent:'#EAB308',lesson:'البناء الضوئي',question:'ما أهمية البناء الضوئي؟',answer:'يصنع النبات غذاءه باستخدام الضوء وثاني أكسيد الكربون والماء، وينتج الأكسجين.'},
{icon:'🍎',accent:'#EA580C',lesson:'التغذية',question:'ما المغذيات الأساسية؟',answer:'تشمل الكربوهيدرات والبروتينات والدهون والفيتامينات والأملاح المعدنية والماء.'},
{icon:'🫁',accent:'#0EA5E9',lesson:'التنفس',question:'ما الهدف الأساسي من التنفس؟',answer:'الحصول على الطاقة من المواد الغذائية من خلال عمليات التنفس الخلوي.'},
{icon:'🧬',accent:'#7C3AED',lesson:'الخلايا',question:'لماذا تحتاج الخلايا إلى الأكسجين في التنفس الهوائي؟',answer:'يساعد في عمليات تحرير الطاقة من المواد العضوية وفق ما تتناوله الملزمة.'},
]},
'الأول الثانوي|الكيمياء':{title:'كيمياء الأول الثانوي',icon:'⚗️',cards:[
{icon:'⚛️',accent:'#7C3AED',lesson:'المجموعة الأولى',question:'ما الذي يميز عناصر المجموعة الأولى؟',answer:'لها إلكترون تكافؤ واحد، ولذلك تميل إلى فقده أثناء التفاعل.'},
{icon:'🧪',accent:'#0EA5E9',lesson:'المجموعة الأولى',question:'ما عناصر المجموعة الأولى المذكورة؟',answer:'الليثيوم Li والصوديوم Na والبوتاسيوم K والروبيديوم Rb والسيزيوم Cs.'},
{icon:'📈',accent:'#F59E0B',lesson:'المجموعة الأولى',question:'كيف يتغير النشاط الكيميائي نزولًا في المجموعة؟',answer:'يزداد النشاط نزولًا في المجموعة بسبب سهولة فقد إلكترون التكافؤ.'},
{icon:'🔢',accent:'#10B981',lesson:'الصوديوم',question:'ما التوزيع الإلكتروني للصوديوم؟',answer:'عدده الذري 11 وتوزيعه 2-8-1، أو 1s² 2s² 2p⁶ 3s¹.'},
{icon:'💧',accent:'#06B6D4',lesson:'الصوديوم',question:'ماذا ينتج من تفاعل الصوديوم مع الماء؟',answer:'ينتج هيدروكسيد الصوديوم وغاز الهيدروجين وفق المعادلة 2Na + 2H₂O → 2NaOH + H₂.'},
{icon:'🧂',accent:'#EC4899',lesson:'مركبات الصوديوم',question:'اذكر أمثلة لمركبات الصوديوم.',answer:'منها NaCl وNa₂CO₃ وNaNO₃ وNaHCO₃ كما ورد في الملزمة.'},
{icon:'🔬',accent:'#8B5CF6',lesson:'تطبيقات الصوديوم',question:'أين يستخدم الصوديوم؟',answer:'من تطبيقاته مصابيح الصوديوم المستخدمة في الإنارة.'},
{icon:'☀️',accent:'#EF4444',lesson:'السيزيوم',question:'ما أحد استخدامات السيزيوم؟',answer:'يستخدم في الخلايا الكهروضوئية لحساسيته للضوء.'},
]},
'الثاني الثانوي|الفيزياء':{title:'فيزياء الثاني الثانوي',icon:'⚡',cards:[
{icon:'🔋',accent:'#2563EB',lesson:'القوة الدافعة الكهربائية',question:'ما القوة الدافعة الكهربائية؟',answer:'مقدار الشغل المبذول لتحريك وحدة الشحنة داخل المصدر، وتقاس بالفولت.'},
{icon:'⚡',accent:'#0EA5E9',lesson:'فرق الجهد',question:'ما العلاقة بين فرق الجهد والشغل والشحنة؟',answer:'فرق الجهد = الشغل ÷ الشحنة.'},
{icon:'🔌',accent:'#7C3AED',lesson:'التيار المستمر والمتردد',question:'ما الفرق بين DC وAC؟',answer:'التيار المستمر ثابت المقدار والاتجاه، بينما المتردد يتغير مقداره واتجاهه مع الزمن.'},
{icon:'🔀',accent:'#10B981',lesson:'قانون كيرشوف الأول',question:'ماذا ينص قانون حفظ الشحنة عند نقطة تفرع؟',answer:'المجموع الجبري للتيارات عند نقطة التفرع يساوي صفرًا؛ فالتيار الداخل موجب والخارج سالب وفق الملزمة.'},
{icon:'🔁',accent:'#059669',lesson:'قانون كيرشوف الثاني',question:'ما قانون كيرشوف الثاني؟',answer:'في الحلقة المغلقة يكون المجموع الجبري لفروق الجهد والقوى الدافعة الكهربائية مساويًا للصفر.'},
{icon:'🧮',accent:'#F59E0B',lesson:'كيرشوف',question:'بطارية 20 فولت وثلاث مقاومات هبوط جهدها 5 و10 و5 فولت. ما المجموع؟',answer:'20 فولت، ولذلك يكون مجموع فروق الجهد مساويًا للقوة الدافعة في الحلقة.'},
{icon:'💡',accent:'#EAB308',lesson:'الطاقة الكهربائية',question:'كيف تحسب الطاقة الكهربائية المستهلكة؟',answer:'الطاقة = فرق الجهد × شدة التيار × الزمن.'},
{icon:'📊',accent:'#D97706',lesson:'القدرة الكهربائية',question:'ما القدرة الكهربائية؟',answer:'هي المعدل الزمني لاستهلاك الطاقة الكهربائية، وتقاس بالواط.'},
{icon:'🧲',accent:'#EF4444',lesson:'الفيض المغناطيسي',question:'ما الفيض المغناطيسي؟',answer:'هو مجموع خطوط المجال المغناطيسي التي تخترق سطحًا معينًا، ويرمز له Φ ووحدته الويبر.'},
{icon:'🧲',accent:'#DC2626',lesson:'كثافة الفيض',question:'ما وحدة كثافة الفيض المغناطيسي؟',answer:'التسلا، ويرمز لكثافة الفيض بالرمز B.'},
{icon:'📐',accent:'#8B5CF6',lesson:'الفيض المغناطيسي',question:'متى يكون الفيض عبر السطح صفرًا؟',answer:'عندما تكون خطوط المجال موازية لمستوى السطح، وفق الحالة الخاصة الموضحة في الملزمة.'},
{icon:'🧲',accent:'#BE123C',lesson:'القوة المغناطيسية',question:'ماذا يحدث بين سلكين متوازيين بتيارين في الاتجاه نفسه؟',answer:'تكون القوة المغناطيسية بينهما تجاذبية.'},
{icon:'↔️',accent:'#9F1239',lesson:'القوة المغناطيسية',question:'ماذا يحدث إذا كان التياران في اتجاهين متعاكسين؟',answer:'تكون القوة بين السلكين تنافرية.'},
{icon:'📏',accent:'#0891B2',lesson:'القوة المغناطيسية',question:'على ماذا تعتمد القوة بين سلكين متوازيين؟',answer:'تزداد بزيادة التيارين وطول السلكين، وتتناقص بزيادة المسافة بينهما.'},
{icon:'🔧',accent:'#06B6D4',lesson:'المجال المغناطيسي',question:'ما العامل الذي يؤثر في القوة المغناطيسية على سلك يحمل تيارًا؟',answer:'طول السلك وشدة التيار وكثافة الفيض المغناطيسي، إضافة إلى زاوية السلك مع المجال.'},
{icon:'🧮',accent:'#4F46E5',lesson:'الطاقة الكهربائية',question:'جهاز 220 فولت و8 أمبير لمدة ساعة؛ ما الطاقة بالجول؟',answer:'220 × 8 × 3600 = 6,336,000 جول.'},
]},
'الثاني الثانوي|الكيمياء':{title:'كيمياء الثاني الثانوي',icon:'⚗️',cards:[
{icon:'⏱️',accent:'#2563EB',lesson:'سرعة التفاعلات',question:'ما المقصود بسرعة التفاعل الكيميائي؟',answer:'مقدار التغير في تركيز أحد المتفاعلات أو النواتج خلال وحدة الزمن.'},
{icon:'🌡️',accent:'#EF4444',lesson:'سرعة التفاعل',question:'كيف تؤثر درجة الحرارة في سرعة التفاعل؟',answer:'رفع درجة الحرارة يزيد سرعة التفاعل وفق ما توضحه الملزمة.'},
{icon:'🧪',accent:'#0EA5E9',lesson:'سرعة التفاعل',question:'كيف تؤثر مساحة السطح المعرض للتفاعل؟',answer:'زيادة مساحة السطح المعرض للتفاعل تزيد سرعة التفاعل.'},
{icon:'⚡',accent:'#F59E0B',lesson:'العامل الحفاز',question:'ما أثر العامل الحفاز؟',answer:'يزيد سرعة التفاعل بتوفير مسار ذي طاقة تنشيط أقل دون أن يُستهلك في التفاعل.'},
{icon:'⚖️',accent:'#10B981',lesson:'الاتزان الكيميائي',question:'متى يتحقق الاتزان الكيميائي؟',answer:'عندما تتساوى سرعة التفاعل الأمامي مع سرعة التفاعل العكسي وتثبت تراكيز المواد.'},
{icon:'🔒',accent:'#059669',lesson:'الاتزان الكيميائي',question:'ما شروط الوصول إلى الاتزان حسب الملزمة؟',answer:'أن يحدث التفاعل في نظام مغلق، وألا تضاف أو تزال مادة من النظام، مع ثبات درجة الحرارة.'},
{icon:'🔄',accent:'#06B6D4',lesson:'الاتزان الكيميائي',question:'هل يتوقف التفاعل عند الاتزان؟',answer:'لا؛ الاتزان ديناميكي وتستمر التفاعلات الأمامية والعكسية بسرعتين متساويتين.'},
{icon:'🧪',accent:'#7C3AED',lesson:'المركبات العضوية الأكسجينية',question:'ما العائلات الوظيفية التي تظهر في الوحدة؟',answer:'منها الكحولات والألدهيدات والكيتونات والأحماض الكربوكسيلية والإسترات والإيثرات.'},
{icon:'🍶',accent:'#8B5CF6',lesson:'الكحولات',question:'ما المجموعة الوظيفية للكحولات؟',answer:'مجموعة الهيدروكسيل OH.'},
{icon:'🧪',accent:'#EC4899',lesson:'الكحولات',question:'ما أنواع الكحولات بحسب عدد مجموعات الهيدروكسيل؟',answer:'أحادية الهيدروكسيل وثنائية الهيدروكسيل وثلاثية الهيدروكسيل ومتعددة الهيدروكسيل.'},
]},
'الثاني الثانوي|الأحياء':{title:'أحياء الثاني الثانوي',icon:'🧬',cards:[
{icon:'⛏️',accent:'#0F766E',lesson:'المعادن والصخور',question:'ما الصخور؟',answer:'الصخور مزيج من معادن مختلفة، وتعد مصدرًا لكثير من المواد الطبيعية والاقتصادية.'},
{icon:'🌋',accent:'#EF4444',lesson:'الصخور النارية',question:'كيف تتكون الصخور النارية؟',answer:'تتكون من تصلب وتبرد المواد المنصهرة، وتختلف بحسب سرعة ومكان التبريد.'},
{icon:'🪨',accent:'#92400E',lesson:'الصخور الرسوبية',question:'كيف تتكون الصخور الرسوبية؟',answer:'من التجوية والتعرية والنقل والترسيب ثم تماسك الرواسب وتحولها إلى صخور.'},
{icon:'🏞️',accent:'#0EA5E9',lesson:'الصخور الرسوبية',question:'ما دور الأنهار والرياح والتيارات؟',answer:'تنقل الفتات والرواسب من أماكن التجوية والتعرية إلى أماكن الترسيب.'},
{icon:'🧱',accent:'#F59E0B',lesson:'تصنيف الصخور الرسوبية',question:'إلى ماذا تصنف الصخور الرسوبية؟',answer:'إلى فتاتية ولافتاتية كيميائية وعضوية بحسب طريقة تكونها.'},
{icon:'🧂',accent:'#0284C7',lesson:'الصخور الرسوبية',question:'ما مثال على الصخور الرسوبية الكيميائية؟',answer:'الملح الصخري من الأمثلة الواردة في الملزمة.'},
{icon:'🌿',accent:'#16A34A',lesson:'الصخور الرسوبية العضوية',question:'ما مصدر بعض الصخور العضوية؟',answer:'قد تتكون من بقايا هياكل الكائنات البحرية أو النباتات التي تراكمت ثم تحولت.'},
{icon:'🔄',accent:'#7C3AED',lesson:'الصخور المتحولة',question:'ما الصخور المتحولة؟',answer:'صخور تنتج من تحول صخور سابقة بفعل الحرارة والضغط والنشاط الكيميائي وهي في الحالة الصلبة.'},
{icon:'🔥',accent:'#DC2626',lesson:'عوامل التحول',question:'ما أحد عوامل التحول الصخري؟',answer:'الحرارة عامل مهم في إحداث التحول، ويزداد تأثيرها مع العمق.'},
{icon:'🪨',accent:'#9333EA',lesson:'الصخور المتحولة',question:'ما الفرق بين الصخور المتورقة وغير المتورقة؟',answer:'المتورقة لها ترتيب أو صفائح مميزة في النسيج، وغير المتورقة لا تظهر فيها تلك البنية الصفائحية الواضحة.'},
{icon:'⛏️',accent:'#B45309',lesson:'المعادن والخامات',question:'لماذا تعد المعادن والصخور مهمة اقتصاديًا؟',answer:'لأنها مصادر لخامات ومواد تستخدم في البناء والصناعة والطاقة وغيرها.'},
{icon:'♻️',accent:'#059669',lesson:'دورة النيتروجين',question:'ما أهمية النيتروجين للكائنات الحية؟',answer:'يدخل في بناء الأحماض الأمينية والبروتينات والأحماض النووية.'},
{icon:'🔄',accent:'#10B981',lesson:'دورة النيتروجين',question:'ما دور البكتيريا في دورة النيتروجين؟',answer:'تشارك في تحويل مركبات النيتروجين بين صور مختلفة مثل الأمونيا والنتريت والنترات والدنترة.'},
{icon:'☀️',accent:'#EAB308',lesson:'تدفق الطاقة',question:'ما المصدر الرئيسي للطاقة على الأرض؟',answer:'الشمس.'},
]}
};

export default function CurriculumFlashcards(){
 const p=useLocalSearchParams<{grade?:string;subject?:string}>();
 const grade=Array.isArray(p.grade)?p.grade[0]:(p.grade||'الأول الثانوي');
 const requested=Array.isArray(p.subject)?p.subject[0]:p.subject;
 const available=Object.keys(packs).filter(k=>k.startsWith(`${grade}|`));
 const [subject,setSubject]=useState(requested&&packs[`${grade}|${requested}`]?requested:'');
 const [index,setIndex]=useState(0); const [flipped,setFlipped]=useState(false); const rotation=useRef(new Animated.Value(0)).current;
 const choose=(v:string)=>{setSubject(v);setIndex(0);setFlipped(false);rotation.setValue(0)};
 const flip=()=>{Animated.spring(rotation,{toValue:flipped?0:1,useNativeDriver:true,friction:8,tension:55}).start();setFlipped(!flipped)};
 const reset=()=>{setFlipped(false);rotation.setValue(0)};
 if(!subject) return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}><Pressable onPress={()=>router.back()}><Text style={s.back}>‹ رجوع</Text></Pressable><Text style={s.mainTitle}>🎴 المراجعة التفاعلية الشاملة</Text><Text style={s.sub}>اختر المادة • {grade}</Text><View style={s.grid}>{available.map(k=>{const v=packs[k];return <Pressable key={k} style={[s.choose,{borderColor:v.cards[0].accent}]} onPress={()=>choose(k.split('|')[1])}><Text style={s.chooseIcon}>{v.icon}</Text><Text style={s.chooseTitle}>{v.title}</Text><Text style={s.count}>{v.cards.length} بطاقة حالياً</Text></Pressable>})}</View><View style={s.note}><Text style={s.noteTitle}>📚 بنك البطاقات</Text><Text style={s.noteText}>سيتم توسيع كل مادة درسًا درسًا من الملزمة، مع أسئلة فهم واختيار من متعدد وصح وخطأ ومسائل.</Text></View></ScrollView></SafeAreaView>;
 const pack=packs[`${grade}|${subject}`]; if(!pack)return null; const card=pack.cards[index];
 const front=rotation.interpolate({inputRange:[0,1],outputRange:['0deg','180deg']}); const back=rotation.interpolate({inputRange:[0,1],outputRange:['180deg','360deg']});
 const next=()=>{reset();setIndex(v=>(v+1)%pack.cards.length)}; const prev=()=>{reset();setIndex(v=>(v-1+pack.cards.length)%pack.cards.length)};
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}><Pressable onPress={()=>setSubject('')}><Text style={s.back}>‹ المواد</Text></Pressable><Text style={s.kicker}>{grade} • {subject}</Text><Text style={s.mainTitle}>{pack.icon} {pack.title}</Text><Text style={s.progress}>البطاقة {index+1} من {pack.cards.length} • {card.lesson}</Text><View style={s.track}><View style={[s.fill,{width:`${((index+1)/pack.cards.length)*100}%`,backgroundColor:card.accent}]}/></View><Pressable onPress={flip} style={s.stage}><Animated.View style={[s.card,{backgroundColor:card.accent,transform:[{perspective:1000},{rotateY:front}]}]}><Text style={s.lesson}>{card.lesson}</Text><Text style={s.cardIcon}>{card.icon}</Text><Text style={s.question}>{card.question}</Text><Text style={s.hint}>اضغط لقلب البطاقة 👆</Text></Animated.View><Animated.View style={[s.card,s.answerCard,{transform:[{perspective:1000},{rotateY:back}]}]}><Text style={[s.answerLabel,{color:card.accent}]}>💡 الإجابة</Text><Text style={s.answer}>{card.answer}</Text></Animated.View></Pressable><View style={s.controls}><Pressable style={s.control} onPress={prev}><Text style={s.controlText}>→ السابقة</Text></Pressable><Pressable style={[s.flip,{backgroundColor:card.accent}]} onPress={flip}><Text style={s.flipText}>🔄 قلب البطاقة</Text></Pressable><Pressable style={s.control} onPress={next}><Text style={s.controlText}>التالية ←</Text></Pressable></View><View style={s.challenge}><Text style={s.challengeTitle}>🏆 تحدي سريع</Text><Text style={s.challengeText}>حاول الإجابة من ذاكرتك قبل قلب البطاقة.</Text></View></ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#F4F7FF'},content:{padding:18,paddingBottom:44},back:{color:'#4338CA',fontWeight:'900',fontSize:16,textAlign:'right',marginBottom:10},kicker:{color:'#6366F1',fontSize:12,fontWeight:'900',textAlign:'right'},mainTitle:{fontSize:24,fontWeight:'900',color:'#172554',textAlign:'right',marginTop:7},sub:{fontSize:13,color:'#64748B',textAlign:'right',marginTop:5,marginBottom:18},grid:{flexDirection:'row-reverse',flexWrap:'wrap',justifyContent:'space-between'},choose:{width:'48.5%',backgroundColor:'#fff',borderRadius:20,borderWidth:2,padding:17,minHeight:150,marginBottom:12,elevation:3},chooseIcon:{fontSize:42,textAlign:'right'},chooseTitle:{fontSize:14,fontWeight:'900',color:'#172554',textAlign:'right',marginTop:8},count:{fontSize:10,color:'#64748B',textAlign:'right',marginTop:6},note:{backgroundColor:'#EEF2FF',borderRadius:18,padding:16,marginTop:8},noteTitle:{fontSize:14,fontWeight:'900',color:'#3730A3',textAlign:'right'},noteText:{fontSize:11,color:'#4338CA',lineHeight:19,textAlign:'right',marginTop:5},progress:{fontSize:12,fontWeight:'900',color:'#172554',textAlign:'right',marginTop:10},track:{height:8,backgroundColor:'#E2E8F0',borderRadius:8,overflow:'hidden',marginTop:7,marginBottom:14},fill:{height:8,borderRadius:8},stage:{height:410,marginBottom:14},card:{position:'absolute',left:0,right:0,minHeight:410,borderRadius:30,padding:24,overflow:'hidden',backfaceVisibility:'hidden',elevation:8},answerCard:{backgroundColor:'#fff',justifyContent:'center'},lesson:{color:'#FFFFFFDD',fontSize:11,fontWeight:'900',textAlign:'right'},cardIcon:{fontSize:64,textAlign:'center',marginTop:25},question:{color:'#fff',fontSize:21,fontWeight:'900',lineHeight:34,textAlign:'right',marginTop:18},hint:{color:'#FFFFFFCC',fontSize:11,fontWeight:'800',textAlign:'center',marginTop:28},answerLabel:{fontSize:19,fontWeight:'900',textAlign:'right',marginBottom:18},answer:{color:'#172554',fontSize:19,fontWeight:'800',lineHeight:34,textAlign:'right'},controls:{flexDirection:'row-reverse',gap:7},control:{flex:1,minHeight:50,borderRadius:15,backgroundColor:'#fff',borderWidth:2,borderColor:'#E0E7FF',alignItems:'center',justifyContent:'center'},controlText:{color:'#172554',fontSize:11,fontWeight:'900'},flip:{flex:1.35,minHeight:50,borderRadius:15,alignItems:'center',justifyContent:'center'},flipText:{color:'#fff',fontSize:11,fontWeight:'900'},challenge:{marginTop:14,backgroundColor:'#FFF7ED',borderRadius:20,padding:15,borderWidth:2,borderColor:'#FED7AA'},challengeTitle:{fontSize:13,fontWeight:'900',color:'#9A3412',textAlign:'right'},challengeText:{fontSize:10,color:'#C2410C',textAlign:'right',marginTop:4}});