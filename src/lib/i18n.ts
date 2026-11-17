export type Lang = "ar" | "en";

export const LANGUAGES: Lang[] = ["ar", "en"];
export const DEFAULT_LANG: Lang = "ar";
export const LANG_COOKIE = "edumind_lang";

export function isLang(value: string | undefined | null): value is Lang {
  return value === "ar" || value === "en";
}

export type FeatureId =
  "tutor" | "summary" | "quiz" | "mindmap" | "rooms" | "audio" | "path" | "analytics";

export type SubjectId = "math" | "physics" | "biology" | "chemistry" | "history" | "programming";

export interface NavDict {
  features: string;
  howItWorks: string;
  tools: string;
  faq: string;
  getStarted: string;
  language: string;
  openMenu: string;
  closeMenu: string;
  home: string;
  signIn: string;
}

export interface HeroDict {
  badge: string;
  headlineTop: string;
  headlineMiddle: string;
  headlineAccent: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  formatsLabel: string;
  formats: string[];
  previewLabel: string;
  trust: { ai: string; fast: string; personal: string };
}

export interface ProofDict {
  eyebrow: string;
  title: string;
  description: string;
  items: { value: string; suffix?: string; label: string; note: string }[];
  trust: string[];
}

export interface UseCaseItem {
  tag: string;
  title: string;
  scenario: string;
  steps: string[];
  highlight: string;
}

export interface UseCasesDict {
  eyebrow: string;
  title: string;
  description: string;
  items: UseCaseItem[];
  note: string;
}

export interface ProductPreviewDict {
  fileName: string;
  fileMeta: string;
  fileSize: string;
  status: string;
  statusNote: string;
  progress: string;
  steps: string[];
  tutorLabel: string;
  tutorMessage: string;
  tutorPrompt: string;
  summaryLabel: string;
  summaryTitle: string;
  summaryPoints: string[];
  quizLabel: string;
  quizQuestion: string;
  quizOptions: string[];
  quizCorrectIndex: number;
  quizFooter: string;
  understandingLabel: string;
  understandingValue: string;
  demoNote: string;
  floatPlan: string;
  floatPlanMeta: string;
  floatContext: string;
  floatContextMeta: string;
}

export interface LearningDict {
  eyebrow: string;
  title: string;
  description: string;
  demoNote: string;
  lessonTitle: string;
  lessonMeta: string;
  tabs: {
    explanation: string;
    summary: string;
    quiz: string;
    mindmap: string;
  };
  explanation: {
    label: string;
    intro: string;
    conceptLabel: string;
    concept: string;
    exampleLabel: string;
    example: string;
    noteLabel: string;
    note: string;
    askLabel: string;
    chips: string[];
  };
  summary: {
    label: string;
    meta: string;
    points: { title: string; text: string }[];
    termsLabel: string;
    terms: string[];
  };
  quiz: {
    label: string;
    questionLabel: string;
    questions: {
      question: string;
      options: string[];
      correct: number;
      explanation: string;
    }[];
    correct: string;
    incorrect: string;
    next: string;
    seeResult: string;
    resultsTitle: string;
    scoreLabel: string;
    retry: string;
  };
  mindmap: {
    label: string;
    center: string;
    hint: string;
    branches: { label: string; detail: string }[];
  };
}

export interface HowDict {
  eyebrow: string;
  title: string;
  description: string;
  steps: { number: string; title: string; english: string; description: string }[];
  footnote: string;
}

export interface FeaturesDict {
  eyebrow: string;
  title: string;
  description: string;
  items: { id: FeatureId; title: string; description: string; tag: string }[];
}

export interface SubjectsDict {
  eyebrow: string;
  title: string;
  description: string;
  visualLabel: string;
  items: {
    id: SubjectId;
    name: string;
    tagline: string;
    description: string;
    bullets: string[];
    visualCaption: string;
  }[];
}

export interface WhyDict {
  eyebrow: string;
  title: string;
  description: string;
  points: { title: string; description: string }[];
  closingTop: string;
  closingAccent: string;
  closingNote: string;
}

export interface FaqDict {
  eyebrow: string;
  title: string;
  description: string;
  items: { question: string; answer: string }[];
  moreLabel: string;
}

export interface FinalCtaDict {
  eyebrow: string;
  englishHeadline: string;
  title: string;
  description: string;
  cta: string;
  note: string;
}

export interface FooterDict {
  description: string;
  productTitle: string;
  productLinks: { label: string; href: string }[];
  toolsTitle: string;
  toolsLinks: { label: string; href: string }[];
  companyTitle: string;
  companyLinks: { label: string; href: string }[];
  legalTitle: string;
  privacy: string;
  privacyHref?: string;
  terms: string;
  termsHref?: string;
  soon: string;
  socialTitle: string;
  socials: { label: string; href?: string }[];
  rights: string;
  madeFor: string;
  status: string;
}

export interface Dictionary {
  nav: NavDict;
  hero: HeroDict;
  proof: ProofDict;
  useCases: UseCasesDict;
  productPreview: ProductPreviewDict;
  learning: LearningDict;
  how: HowDict;
  features: FeaturesDict;
  subjects: SubjectsDict;
  why: WhyDict;
  faq: FaqDict;
  final: FinalCtaDict;
  footer: FooterDict;
}

export const dictionaries: Record<Lang, Dictionary> = {
  ar: {
    nav: {
      features: "المميزات",
      howItWorks: "كيف يعمل",
      tools: "أدوات التعلّم",
      faq: "الأسئلة الشائعة",
      getStarted: "ابدأ الآن",
      language: "اللغة",
      openMenu: "فتح القائمة",
      closeMenu: "إغلاق القائمة",
      home: "الصفحة الرئيسية",
      signIn: "تسجيل الدخول",
    },
    hero: {
      badge: "من ملفاتك الدراسية... لأدوات فهم حقيقية",
      headlineTop: "مش مجرد مذاكرة...",
      headlineMiddle: "حوّل ملفك إلى شرح",
      headlineAccent: "واختبار وخريطة.",
      description:
        "ارفع كتابك أو محاضرتك أو ملاحظاتك، وEduMind يبني منها شرحاً مبسّطاً وملخصاً منظماً واختباراً تفاعلياً وخريطة ذهنية — كلها من نفس المحتوى اللي بتراجعه.",
      primaryCta: "ابدأ الآن",
      secondaryCta: "جرّب المعاينة",
      formatsLabel: "بيشتغل مع ملفاتك",
      formats: ["PDF", "DOCX", "TXT"],
      previewLabel: "معاينة الواجهة",
      trust: {
        ai: "مخرجات من محتواك",
        fast: "بدون إعداد معقد",
        personal: "عربي وإنجليزي",
      },
    },
    proof: {
      eyebrow: "باختصار",
      title: "إيه اللي هتلاقيه جوه EduMind؟",
      description: "أربع طرق للفهم، من مصدر واحد، بثلاث صيغ ملفات وبلغتين.",
      items: [
        {
          value: "04",
          label: "طرق للفهم",
          note: "شرح · ملخص · اختبار · خريطة",
        },
        {
          value: "03",
          label: "صيغ ملفات مدعومة",
          note: "PDF · DOCX · TXT",
        },
        {
          value: "02",
          label: "لغات للواجهة",
          note: "عربي كامل · إنجليزي",
        },
        {
          value: "01",
          label: "مصدر للمخرجات",
          note: "ملفك هو المرجع",
        },
      ],
      trust: ["بياناتك مرتبطة بحسابك", "واجهة عربية كاملة", "يعمل على الموبايل", "تحديث مستمر"],
    },
    useCases: {
      eyebrow: "طرق الاستخدام",
      title: "مش كل مذاكرة ليها نفس الشكل.",
      description: "اختار السيناريو اللي يشبه يومك، وشوف EduMind بيختصر إيه.",
      items: [
        {
          tag: "قبل الامتحان",
          title: "فصل كامل في ليلة واحدة",
          scenario: "محتاج تلمّ الفصل بسرعة، وتتأكد إنك فهمت أهم النقاط.",
          steps: ["ارفع الفصل", "خد ملخص بالمصطلحات", "اختبر نفسك وارجع للناقص"],
          highlight: "ملخص واختبار من نفس الفصل",
        },
        {
          tag: "مسألة واقفة معاك",
          title: "مش عايز الإجابة... عايز الخطوات",
          scenario: "واقف عند خطوة في مسألة أو مفهوم مش داخل دماغك.",
          steps: ["اسأل المدرّس الذكي", "اطلب مثال تاني", "جرّب سؤال مشابه"],
          highlight: "شرح خطوة بخطوة من درسك",
        },
        {
          tag: "مراجعة وأنت مشغول",
          title: "اسمع درسك بدل ما تقراه",
          scenario: "مش قادر تقعد تقرا، أو عندك طريق طويل كل يوم.",
          steps: ["اختار الدرس", "شغّل النسخة الصوتية", "ارجع للخريطة الذهنية"],
          highlight: "نسخة صوتية من محتواك",
        },
        {
          tag: "مذاكرة جماعية",
          title: "نفس الغرفة... مع أصحابك",
          scenario: "المذاكرة الجماعية بتتحول لكلام كتير ووقت ضايع.",
          steps: ["افتح غرفة دراسة", "شارك الرابط", "ذاكروا بالمؤقّت نفسه"],
          highlight: "غرفة دراسة برابط واحد",
        },
      ],
      note: "كل الأدوات دي موجودة في النسخة الحالية، ومكمّلة لبعضها.",
    },
    productPreview: {
      fileName: "Introduction to Biology.pdf",
      fileMeta: "الفصل الرابع · تركيب الخلية",
      fileSize: "2.4 MB",
      status: "جارٍ تحليل الملف",
      statusNote: "يقرأ EduMind المحتوى ويبني أدوات التعلّم",
      progress: "68%",
      steps: ["استخراج النص", "تنظيم المفاهيم", "توليد الاختبارات"],
      tutorLabel: "المدرّس الذكي",
      tutorMessage:
        "تخيّل الخلية كأنها مدينة صغيرة: النواة مركز القيادة، والميتوكوندريا محطة الطاقة اللي بتشغّل كل حاجة.",
      tutorPrompt: "اسأل عن أي جزء في الدرس...",
      summaryLabel: "ملخص ذكي",
      summaryTitle: "النقاط الأساسية",
      summaryPoints: [
        "الغشاء البلازمي ينظّم دخول وخروج المواد.",
        "النواة تحتوي على المادة الوراثية وتدير الخلية.",
        "الميتوكوندريا تنتج الطاقة اللازمة للأنشطة الحيوية.",
      ],
      quizLabel: "اختبار سريع",
      quizQuestion: "إيه الوظيفة الأساسية للميتوكوندريا؟",
      quizOptions: ["تخزين المعلومات الوراثية", "إنتاج الطاقة للخلية", "بناء جدار الخلية"],
      quizCorrectIndex: 1,
      quizFooter: "3 أسئلة · مستوى مبتدئ",
      understandingLabel: "تقدّم الفهم",
      understandingValue: "72%",
      demoNote: "معاينة توضيحية · بيانات تجريبية",
      floatPlan: "خطة تعلّم مخصّصة",
      floatPlanMeta: "اتبنى من محتوى ملفك",
      floatContext: "شرح مرتبط بدرسك",
      floatContextMeta: "من نفس الصفحة اللي رفعتها",
    },
    learning: {
      eyebrow: "تجربة EduMind",
      title: "من ملف واحد... لأربع طرق تفهم بيها.",
      description:
        "كل درس بيتحوّل لصفحة تفاعلية فيها الشرح والملخص والاختبار والخريطة الذهنية. اختار الطريقة اللي تناسبك وابدأ.",
      demoNote: "المحتوى المعروض مثال توضيحي على شكل المخرجات.",
      lessonTitle: "تركيب الخلية ووظائفها",
      lessonMeta: "الأحياء · الفصل الرابع",
      tabs: {
        explanation: "شرح ذكي",
        summary: "ملخص ذكي",
        quiz: "اختبار تفاعلي",
        mindmap: "خريطة ذهنية",
      },
      explanation: {
        label: "شرح مبسّط",
        intro:
          "تخيّل الخلية كمدينة صغيرة منظمة. كل جزء فيها له دور محدد، وكل الأدوار بتشتغل مع بعض عشان المدينة تفضل شغّالة.",
        conceptLabel: "الفكرة الأساسية",
        concept:
          "الخلية هي أصغر وحدة قادرة على الحياة. كل عضية جواها متخصصة في وظيفة، وغياب أي وظيفة بيأثر على باقي الخلية.",
        exampleLabel: "مثال من الدرس",
        example:
          "الميتوكوندريا زي محطة الطاقة: بتاخد الغذاء وبتنتج ATP، وهو الوقود اللي بتستخدمه الخلية في كل أنشطتها.",
        noteLabel: "خد بالك",
        note: "النواة مش مصدر الطاقة، لكنها مركز التحكم اللي بينظّم عمل باقي العضيات.",
        askLabel: "كمّل مع المدرّس الذكي",
        chips: ["اشرح أكتر", "مثال تاني", "اختبرني"],
      },
      summary: {
        label: "ملخص الدرس",
        meta: "قراءة في 3 دقائق",
        points: [
          {
            title: "الغشاء البلازمي",
            text: "حاجز انتقائي بيتحكم في دخول وخروج المواد من وإلى الخلية.",
          },
          {
            title: "النواة",
            text: "بتحتوي على DNA وبتدير أنشطة الخلية من خلال تنظيم التعبير الجيني.",
          },
          {
            title: "الميتوكوندريا",
            text: "مسؤولة عن التنفس الخلوي وإنتاج الطاقة على شكل ATP.",
          },
          {
            title: "الرايبوسومات",
            text: "بتصنّع البروتينات باستخدام التعليمات الجاية من النواة.",
          },
        ],
        termsLabel: "مصطلحات مهمة",
        terms: ["النواة", "الميتوكوندريا", "الرايبوسومات", "السيتوبلازم"],
      },
      quiz: {
        label: "اختبر فهمك",
        questionLabel: "سؤال",
        questions: [
          {
            question: "إيه الوظيفة الأساسية للميتوكوندريا؟",
            options: ["تخزين المعلومات الوراثية", "إنتاج الطاقة على شكل ATP", "تصنيع البروتين"],
            correct: 1,
            explanation:
              "الميتوكوندريا هي مكان التنفس الخلوي، وبتنتج ATP اللي بيستخدم كوقود للخلية.",
          },
          {
            question: "أنهي عضية مسؤولة عن تصنيع البروتين؟",
            options: ["الرايبوسومات", "الليسوسومات", "النواة"],
            correct: 0,
            explanation:
              "الرايبوسومات بتقرأ تعليمات mRNA وبتجمّع الأحماض الأمينية لتكوين البروتين.",
          },
          {
            question: "إيه اللي بيميّز الخلية النباتية عن الخلية الحيوانية؟",
            options: ["وجود نواة", "وجود جدار خلوي", "وجود سيتوبلازم"],
            correct: 1,
            explanation:
              "الخلايا النباتية بتحتوي على جدار خلوي من السليلوز، وده اللي بيديها شكلها الثابت.",
          },
        ],
        correct: "إجابة صحيحة",
        incorrect: "مش الإجابة الصح",
        next: "السؤال التالي",
        seeResult: "شوف النتيجة",
        resultsTitle: "خلصت الاختبار",
        scoreLabel: "إجابات صحيحة",
        retry: "جرّب تاني",
      },
      mindmap: {
        label: "خريطة ذهنية",
        center: "الخلية",
        hint: "اختار فرع من الخريطة لعرض تفاصيله.",
        branches: [
          { label: "النواة", detail: "مركز التحكم · تحتوي على DNA" },
          { label: "الميتوكوندريا", detail: "إنتاج الطاقة · تنفس خلوي" },
          { label: "الغشاء البلازمي", detail: "حاجز انتقائي · تنظيم الدخول والخروج" },
          { label: "الرايبوسومات", detail: "تصنيع البروتين · ترجمة mRNA" },
          { label: "السيتوبلازم", detail: "وسط التفاعلات · يحتضن العضيات" },
        ],
      },
    },
    how: {
      eyebrow: "كيف يعمل EduMind",
      title: "ثلاث خطوات من الملف للفهم.",
      description:
        "من غير إعدادات معقدة أو أدوات كتير. ارفع المحتوى، وسيب EduMind يرتّب لك الطريق.",
      steps: [
        {
          number: "01",
          title: "ارفع ملفاتك",
          english: "Upload your materials",
          description:
            "اختار الكتب أو المحاضرات أو ملاحظاتك بصيغة PDF أو Word أو نص، وابدأ بملف واحد.",
        },
        {
          number: "02",
          title: "الذكاء الاصطناعي يفهم المحتوى",
          english: "AI understands your content",
          description: "EduMind بيحلّل المحتوى، بيستخرج المفاهيم الأساسية، وبيبني هيكل واضح للدرس.",
        },
        {
          number: "03",
          title: "اتعلّم بطريقتك",
          english: "Learn your way",
          description:
            "اختار الشرح أو الملخص أو الاختبار أو الخريطة الذهنية، وتنقّل بينهم على حسب احتياجك.",
        },
      ],
      footnote: "ملفك يفضل هو المصدر الأساسي لكل مخرجات التعلّم.",
    },
    features: {
      eyebrow: "أدوات التعلّم",
      title: "كل اللي محتاجه لفهم أعمق، في مكان واحد.",
      description:
        "أدوات مترابطة بتشتغل على نفس المحتوى، عشان تنتقل من القراءة السلبية لفهم حقيقي وتطبيق.",
      items: [
        {
          id: "tutor",
          title: "مدرّس شخصي بالذكاء الاصطناعي",
          description:
            "مدرّس ذكي يساعدك تفهم الموضوعات خطوة بخطوة، ويجاوب على أسئلتك من داخل محتواك.",
          tag: "محادثة",
        },
        {
          id: "summary",
          title: "ملخصات ذكية",
          description: "حوّل الدروس الطويلة إلى ملخصات منظمة بأهم النقاط والمصطلحات.",
          tag: "تنظيم",
        },
        {
          id: "quiz",
          title: "مولّد اختبارات",
          description: "اختبارات بتتبني من المحتوى الدراسي نفسه، مع إجابات وتفسيرات.",
          tag: "تطبيق",
        },
        {
          id: "mindmap",
          title: "خرائط ذهنية تفاعلية",
          description: "شوف العلاقات بين المفاهيم في خريطة واحدة بدل صفحات متفرقة.",
          tag: "ربط",
        },
        {
          id: "rooms",
          title: "غرف دراسة",
          description:
            "افتح غرفة لمادة معيّنة، شارك الرابط، وذاكروا مع بعض بمؤقّت واحد وتحديث مباشر للأعضاء.",
          tag: "مع أصحابك",
        },
        {
          id: "audio",
          title: "تعلّم صوتي",
          description: "حوّل المحتوى لتجربة صوتية تقدر تسمعها في أي وقت ومكان.",
          tag: "صوت",
        },
        {
          id: "path",
          title: "مسارات مخصّصة",
          description: "مسار تعليمي بيتكيّف مع مستواك ووقتك والمواضيع اللي محتاجة تركيز.",
          tag: "تكيّف",
        },
        {
          id: "analytics",
          title: "تحليلات التعلّم",
          description: "تابع تقدمك، اعرف نقاط قوتك، وركّز على اللي محتاج مراجعة.",
          tag: "قياس",
        },
      ],
    },
    subjects: {
      eyebrow: "لكل مادة طريقتها",
      title: "مذاكرة تناسب طبيعة كل مادة.",
      description:
        "الرياضيات مش زي التاريخ، والكيمياء مش زي البرمجة. EduMind بيقدّم كل مادة بشكل يوضّح اللي بيميزها.",
      visualLabel: "معاينة بصرية",
      items: [
        {
          id: "math",
          name: "الرياضيات",
          tagline: "المعادلات بقت أسهل",
          description:
            "خطوات حل واضحة، وربط بين المعادلة والرسم البياني، وأمثلة متدرجة من السهل للصعب.",
          bullets: ["شرح خطوة بخطوة", "ربط الدوال بالرسوم", "تمارين متدرجة"],
          visualCaption: "الدالة التربيعية والرسم البياني",
        },
        {
          id: "physics",
          name: "الفيزياء",
          tagline: "شوف الحركة قبل ما تحسبها",
          description:
            "توضيحات بصرية للحركة والقوى والظواهر، عشان تفهم الفكرة قبل ما تدخل في الأرقام.",
          bullets: ["متجهات وقوى", "محاكاة للحركة", "ربط القوانين بالواقع"],
          visualCaption: "حركة المقذوفات ومتجهات السرعة",
        },
        {
          id: "biology",
          name: "الأحياء",
          tagline: "من الخلية للنظام الحيوي",
          description: "مخططات توضيحية للأجهزة والخلايا والعمليات الحيوية، مع ربط كل جزء بوظيفته.",
          bullets: ["خرائط للخلايا", "شرح وظائف الأعضاء", "ربط التركيب بالوظيفة"],
          visualCaption: "تركيب الخلية وعضياتها",
        },
        {
          id: "chemistry",
          name: "الكيمياء",
          tagline: "التفاعلات بقت واضحة",
          description:
            "تصورات بصرية للتفاعلات والجزيئات والروابط، مع تتبع خطوات التفاعل خطوة بخطوة.",
          bullets: ["نماذج للجزيئات", "خطوات التفاعل", "ربط الرموز بالمعنى"],
          visualCaption: "تفاعل تكوّن الماء H₂ + O₂",
        },
        {
          id: "history",
          name: "التاريخ",
          tagline: "الأحداث كخط زمني مترابط",
          description:
            "خطوط زمنية وعلاقات بين الأحداث والأسباب والنتائج، بدل تواريخ متفرقة صعب تفتكرها.",
          bullets: ["خطوط زمنية", "أسباب ونتائج", "ربط الأحداث ببعضها"],
          visualCaption: "خط زمني لأحداث مترابطة",
        },
        {
          id: "programming",
          name: "البرمجة",
          tagline: "الكود بيتشرح سطر بسطر",
          description: "شرح الأكواد والأمثلة العملية، مع توضيح الناتج والسبب في كل خطوة بدل الحفظ.",
          bullets: ["شرح سطر بسطر", "مثال قابل للتجربة", "تفكيك المشكلات"],
          visualCaption: "دالة بسيطة وتحليل تنفيذها",
        },
      ],
    },
    why: {
      eyebrow: "ليه EduMind",
      title: "التعلّم مش حفظ... التعلّم فهم.",
      description:
        "EduMind مش بيزوّد عليك محتوى جديد. بيستخدم المحتوى اللي عندك بالفعل، ويحوّله لطريقة تعلّم أنشط وأوضح.",
      points: [
        {
          title: "اتعلّم بالسرعة اللي تريحك",
          description: "ركّز على أضعف نقطة، وارجع لأي جزء وقت ما تحتاجه.",
        },
        {
          title: "افهم المفاهيم الصعبة",
          description: "شرح تدريجي وأمثلة من درسك بدل تعريفات مجردة.",
        },
        {
          title: "اقرأ بنشاط",
          description: "اختبارات وأسئلة بتحوّل القراءة من مجهود سلبي لتطبيق فعلي.",
        },
        {
          title: "اتدرّب باختبارات مخصّصة",
          description: "الأسئلة بتتبني من محتواك، وتفسيراتها بتوضّح ليه الإجابة صح.",
        },
        {
          title: "نظّم موادك",
          description: "ملخصات وخرائط ذهنية بتحوّل الفوضى لهيكل واضح ومراجع سريعة.",
        },
        {
          title: "تابع تقدمك",
          description: "شوف اللي فهمته واللي محتاج ترجع له، وابنِ خطوتك التالية.",
        },
      ],
      closingTop: "خطوة واحدة تفصل ملفاتك",
      closingAccent: "عن تجربة تعلّم مختلفة.",
      closingNote: "ابدأ من محتواك، وخلّي طريقة المذاكرة موجودة في مكان واحد.",
    },
    faq: {
      eyebrow: "الأسئلة الشائعة",
      title: "كل اللي محتاج تعرفه قبل ما تبدأ.",
      description: "أكتر الأسئلة اللي بتوصلنا عن EduMind وطريقة استخدامه.",
      items: [
        {
          question: "إيه هو EduMind؟",
          answer:
            "EduMind منصة تعلّم مدعومة بالذكاء الاصطناعي، بتحوّل الملفات الدراسية إلى تجربة تعليمية شخصية فيها شرح وملخصات واختبارات وخرائط ذهنية.",
        },
        {
          question: "المدرّس الذكي بيشتغل إزاي؟",
          answer:
            "بتختار الملف أو جزء معين من الدرس، وبعدين تسأل بطبيعتك. المدرّس بيستخدم محتوى الدرس كمرجع عشان يشرح، ويقدر يبسّط الفكرة أو يديك مثال تاني.",
        },
        {
          question: "أنهي صيغ الملفات مدعومة؟",
          answer:
            "النسخة الحالية مصممة لاستقبال ملفات PDF وWord بصيغة DOCX والملفات النصية. الصيغ الإضافية بتتضاف تدريجياً حسب احتياجات المستخدمين.",
        },
        {
          question: "EduMind يقدر يشرح المواد المعقدة؟",
          answer:
            "المحتوى بيتقسّم لمفاهيم أصغر وبيتشرح بخطوات وأمثلة. المواد التقنية زي الرياضيات والفيزياء والبرمجة ليها معالجة بصرية وخطوات تفصيلية أوضح.",
        },
        {
          question: "أقدر أعمل اختبارات من ملفاتي؟",
          answer:
            "أيوه. الاختبارات بتتبني من محتوى الدرس اللي رفعته، وبتشمل إجابات وتفسيرات عشان تعرف سبب الإجابة وتراجع النقطة الصح.",
        },
        {
          question: "إيه حكاية غرف الدراسة؟",
          answer:
            "تقدر تفتح غرفة دراسة لمادة معيّنة وتشارك رابطها مع أصحابك، فتدخلوا نفس الغرفة وتشوفوا نفس المؤقّت. الغرفة بتقفل تلقائياً بعد انتهاء الوقت، وصاحب الغرفة يقدر ينهيها في أي وقت.",
        },
        {
          question: "EduMind بيدعم العربية؟",
          answer:
            "أيوه. الواجهة والمحتوى بيشتغلوا بالعربي والإنجليزي، مع دعم كامل لاتجاه الكتابة من اليمين لليسار وخط عربي واضح للقراءة.",
        },
        {
          question: "المحتوى اللي برفعه خاص؟",
          answer:
            "إحنا بنتعامل مع المحتوى المرفوع على إنه بيانات خاصة بالحساب. تفاصيل التخزين والاستخدام هتتوضح بالكامل في سياسة الخصوصية قبل الإطلاق، ومش بنعرض محتواك بشكل عام.",
        },
      ],
      moreLabel: "جاهز تجرّب بنفسك؟",
    },
    final: {
      eyebrow: "جاهز تبدأ؟",
      englishHeadline: "Your Next Learning Experience Starts Here.",
      title: "ابدأ من الملف اللي عندك.",
      description:
        "ارفع أول ملف، واختار الطريقة اللي تفهم بيها: شرح، ملخص، اختبار، أو خريطة ذهنية.",
      cta: "أنشئ حسابك وابدأ",
      note: "من غير إعداد معقد — ملف واحد يكفي.",
    },
    footer: {
      description:
        "منصة تعلّم بالذكاء الاصطناعي بتحوّل ملفاتك الدراسية إلى شرح وملخصات واختبارات وتجارب تفاعلية تفهمك.",
      productTitle: "المنتج",
      productLinks: [
        { label: "المميزات", href: "#features" },
        { label: "كيف يعمل", href: "#how-it-works" },
        { label: "أدوات التعلّم", href: "#learning-preview" },
        { label: "طرق الاستخدام", href: "#use-cases" },
        { label: "الأسئلة الشائعة", href: "#faq" },
      ],
      toolsTitle: "أدوات التعلّم",
      toolsLinks: [
        { label: "المدرّس الذكي", href: "#learning-preview" },
        { label: "الملخصات الذكية", href: "#learning-preview" },
        { label: "الاختبارات التفاعلية", href: "#learning-preview" },
        { label: "الخرائط الذهنية", href: "#learning-preview" },
        { label: "غرف الدراسة", href: "#features" },
      ],
      companyTitle: "الشركة",
      companyLinks: [
        { label: "الرؤية", href: "#why-edumind" },
        { label: "المواد الدراسية", href: "#subjects" },
        { label: "ابدأ الآن", href: "/signup" },
      ],
      legalTitle: "قانوني",
      privacy: "سياسة الخصوصية",
      privacyHref: "/privacy",
      terms: "شروط الاستخدام",
      termsHref: "/terms",
      soon: "قريباً",
      socialTitle: "تابعنا",
      socials: [
        { label: "X" },
        { label: "LinkedIn", href: "https://www.linkedin.com/company/edumindapp/" },
        { label: "YouTube" },
      ],
      rights: "© 2026 EduMind. كل الحقوق محفوظة.",
      madeFor: "صُنع للطلاب في كل مكان.",
      status: "الإصدار التجريبي قيد التطوير",
    },
  },
  en: {
    nav: {
      features: "Features",
      howItWorks: "How it works",
      tools: "Learning tools",
      faq: "FAQ",
      getStarted: "Get started",
      language: "Language",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      home: "Home",
      signIn: "Sign in",
    },
    hero: {
      badge: "From your study files to real understanding",
      headlineTop: "Not just studying.",
      headlineMiddle: "Turn your document into",
      headlineAccent: "an explanation, a quiz, a map.",
      description:
        "Upload your textbook, lecture, or notes, and EduMind builds a plain-language explanation, a structured summary, an interactive quiz, and a mind map — all from the same material you are actually studying.",
      primaryCta: "Get started",
      secondaryCta: "Try the preview",
      formatsLabel: "Works with your files",
      formats: ["PDF", "DOCX", "TXT"],
      previewLabel: "Product preview",
      trust: {
        ai: "Built from your material",
        fast: "No setup required",
        personal: "Arabic and English",
      },
    },
    proof: {
      eyebrow: "At a glance",
      title: "What you actually get inside EduMind",
      description:
        "Four ways to understand one document, across three file formats and two languages.",
      items: [
        {
          value: "04",
          label: "Ways to understand",
          note: "Explanation · Summary · Quiz · Map",
        },
        {
          value: "03",
          label: "Supported file formats",
          note: "PDF · DOCX · TXT",
        },
        {
          value: "02",
          label: "Interface languages",
          note: "Full Arabic · English",
        },
        {
          value: "01",
          label: "Source for every output",
          note: "Your document is the reference",
        },
      ],
      trust: [
        "Private to your account",
        "Full Arabic interface",
        "Works on mobile",
        "Actively developed",
      ],
    },
    useCases: {
      eyebrow: "How people use it",
      title: "Not every study session looks the same.",
      description: "Pick the scenario that looks like your day, and see what EduMind shortens.",
      items: [
        {
          tag: "Before an exam",
          title: "A whole chapter, one night",
          scenario: "You need to cover the chapter fast and make sure the key points landed.",
          steps: [
            "Upload the chapter",
            "Read the summary and key terms",
            "Quiz yourself, revisit gaps",
          ],
          highlight: "A summary and quiz from the same chapter",
        },
        {
          tag: "Stuck on a problem",
          title: "You want the steps, not just the answer",
          scenario: "One step in a problem, or one concept, is not clicking.",
          steps: ["Ask the AI tutor", "Request another example", "Try a similar question"],
          highlight: "Step-by-step help from your lesson",
        },
        {
          tag: "Review on the move",
          title: "Listen to the lesson instead of reading it",
          scenario: "You cannot sit and read, or you have a long commute.",
          steps: ["Pick the lesson", "Play the audio version", "Go back to the mind map"],
          highlight: "An audio version of your material",
        },
        {
          tag: "Group study",
          title: "The same room, with your friends",
          scenario: "Group study turns into lost time and scattered notes.",
          steps: ["Open a study room", "Share the link", "Study on the same timer"],
          highlight: "A study room in one link",
        },
      ],
      note: "Every tool listed here exists in the current version and connects to the others.",
    },
    productPreview: {
      fileName: "Introduction to Biology.pdf",
      fileMeta: "Chapter 4 · Cell structure",
      fileSize: "2.4 MB",
      status: "Analyzing your document",
      statusNote: "EduMind is reading the content and building your learning tools",
      progress: "68%",
      steps: ["Extracting text", "Structuring concepts", "Generating quizzes"],
      tutorLabel: "AI Tutor",
      tutorMessage:
        "Think of the cell as a small, organized city: the nucleus is the control center, and the mitochondria are the power plant keeping everything running.",
      tutorPrompt: "Ask about any part of the lesson...",
      summaryLabel: "Smart summary",
      summaryTitle: "Key points",
      summaryPoints: [
        "The plasma membrane regulates what enters and leaves the cell.",
        "The nucleus holds genetic material and coordinates the cell.",
        "Mitochondria produce the energy needed for cellular activities.",
      ],
      quizLabel: "Quick quiz",
      quizQuestion: "What is the main function of the mitochondria?",
      quizOptions: [
        "Store genetic information",
        "Produce energy for the cell",
        "Build the cell wall",
      ],
      quizCorrectIndex: 1,
      quizFooter: "3 questions · Beginner",
      understandingLabel: "Understanding",
      understandingValue: "72%",
      demoNote: "Product preview · Sample data",
      floatPlan: "Personalized path",
      floatPlanMeta: "Built from your document",
      floatContext: "Grounded in your lesson",
      floatContextMeta: "From the page you uploaded",
    },
    learning: {
      eyebrow: "The EduMind experience",
      title: "One document. Four ways to understand it.",
      description:
        "Every lesson becomes an interactive workspace with explanations, summaries, quizzes, and a mind map. Pick the format that fits the moment.",
      demoNote: "The content shown here is an illustrative example of the output.",
      lessonTitle: "Cell structure and function",
      lessonMeta: "Biology · Chapter 4",
      tabs: {
        explanation: "AI explanation",
        summary: "Smart summary",
        quiz: "Interactive quiz",
        mindmap: "Mind map",
      },
      explanation: {
        label: "Plain-language explanation",
        intro:
          "Think of a cell as a small, organized city. Every part has a specific job, and all the jobs work together to keep the city running.",
        conceptLabel: "Core idea",
        concept:
          "The cell is the smallest unit capable of life. Each organelle is specialized for a function, and losing one function affects the whole cell.",
        exampleLabel: "Example from your lesson",
        example:
          "Mitochondria are like a power station: they take in nutrients and produce ATP, the fuel the cell uses for its activities.",
        noteLabel: "Watch out",
        note: "The nucleus is not the energy source. It is the control center that coordinates the other organelles.",
        askLabel: "Continue with the AI Tutor",
        chips: ["Explain more", "Another example", "Quiz me"],
      },
      summary: {
        label: "Lesson summary",
        meta: "3 minute read",
        points: [
          {
            title: "Plasma membrane",
            text: "A selective barrier that controls what moves into and out of the cell.",
          },
          {
            title: "Nucleus",
            text: "Holds DNA and coordinates cell activity by regulating gene expression.",
          },
          {
            title: "Mitochondria",
            text: "Carry out cellular respiration and release energy as ATP.",
          },
          {
            title: "Ribosomes",
            text: "Build proteins using instructions delivered from the nucleus.",
          },
        ],
        termsLabel: "Key terms",
        terms: ["Nucleus", "Mitochondria", "Ribosomes", "Cytoplasm"],
      },
      quiz: {
        label: "Check your understanding",
        questionLabel: "Question",
        questions: [
          {
            question: "What is the main function of the mitochondria?",
            options: ["Store genetic information", "Produce energy as ATP", "Build proteins"],
            correct: 1,
            explanation:
              "Mitochondria host cellular respiration and produce ATP, the fuel cells use for work.",
          },
          {
            question: "Which organelle is responsible for protein synthesis?",
            options: ["Ribosomes", "Lysosomes", "Nucleus"],
            correct: 0,
            explanation: "Ribosomes read mRNA instructions and assemble amino acids into proteins.",
          },
          {
            question: "What distinguishes a plant cell from an animal cell?",
            options: ["A nucleus", "A cell wall", "Cytoplasm"],
            correct: 1,
            explanation:
              "Plant cells have a cellulose cell wall that gives them a fixed, structured shape.",
          },
        ],
        correct: "Correct",
        incorrect: "Not quite",
        next: "Next question",
        seeResult: "See result",
        resultsTitle: "Quiz complete",
        scoreLabel: "correct answers",
        retry: "Try again",
      },
      mindmap: {
        label: "Mind map",
        center: "The cell",
        hint: "Select a branch to explore its details.",
        branches: [
          { label: "Nucleus", detail: "Control center · Contains DNA" },
          { label: "Mitochondria", detail: "Energy production · Cellular respiration" },
          { label: "Plasma membrane", detail: "Selective barrier · Regulates transport" },
          { label: "Ribosomes", detail: "Protein synthesis · mRNA translation" },
          { label: "Cytoplasm", detail: "Reaction medium · Holds organelles" },
        ],
      },
    },
    how: {
      eyebrow: "How EduMind works",
      title: "Three steps from document to understanding.",
      description:
        "No complicated setup and no tool overload. Upload your material and let EduMind organize the path.",
      steps: [
        {
          number: "01",
          title: "Upload your materials",
          english: "Upload",
          description:
            "Choose a textbook, lecture, or your notes as a PDF, Word file, or text, and start with a single document.",
        },
        {
          number: "02",
          title: "AI understands your content",
          english: "Analyze",
          description:
            "EduMind analyzes the material, extracts the core concepts, and builds a clear structure for the lesson.",
        },
        {
          number: "03",
          title: "Learn your way",
          english: "Learn",
          description:
            "Move between explanations, summaries, quizzes, and mind maps based on what you need right now.",
        },
      ],
      footnote: "Your document stays the source of truth behind every learning output.",
    },
    features: {
      eyebrow: "Learning tools",
      title: "Everything you need to understand deeply, in one place.",
      description:
        "Connected tools working on the same material, so you can move from passive reading to real understanding and practice.",
      items: [
        {
          id: "tutor",
          title: "AI personal tutor",
          description:
            "A focused tutor that explains topics step by step and answers questions from inside your own material.",
          tag: "Conversation",
        },
        {
          id: "summary",
          title: "Smart summaries",
          description: "Turn long lessons into organized summaries with the key points and terms.",
          tag: "Structure",
        },
        {
          id: "quiz",
          title: "AI quiz generator",
          description:
            "Quizzes built from the study material itself, complete with answers and explanations.",
          tag: "Practice",
        },
        {
          id: "mindmap",
          title: "Interactive mind maps",
          description:
            "See how concepts connect in one map instead of scattered pages and definitions.",
          tag: "Connections",
        },
        {
          id: "rooms",
          title: "Study rooms",
          description:
            "Open a room for a subject, share the link, and study together with one shared timer and live member updates.",
          tag: "With friends",
        },
        {
          id: "audio",
          title: "Audio learning",
          description: "Turn your material into an audio experience you can revisit anywhere.",
          tag: "Audio",
        },
        {
          id: "path",
          title: "Personalized learning",
          description:
            "A learning path that adapts to your level, your time, and the topics that need work.",
          tag: "Adaptive",
        },
        {
          id: "analytics",
          title: "Learning analytics",
          description: "Track progress, spot your strengths, and focus on what needs another pass.",
          tag: "Insight",
        },
      ],
    },
    subjects: {
      eyebrow: "Every subject speaks differently",
      title: "Study that fits the nature of the subject.",
      description:
        "Mathematics is not history, and chemistry is not programming. EduMind presents each subject in the form that makes it click.",
      visualLabel: "Visual preview",
      items: [
        {
          id: "math",
          name: "Mathematics",
          tagline: "Equations, made visual",
          description:
            "Clear solution steps, a link between formulas and graphs, and examples that build from simple to complex.",
          bullets: ["Step-by-step solutions", "Functions and graphs", "Progressive practice"],
          visualCaption: "A quadratic function and its graph",
        },
        {
          id: "physics",
          name: "Physics",
          tagline: "See the motion before the math",
          description:
            "Visual explanations of motion, forces, and phenomena, so the idea lands before the numbers start.",
          bullets: ["Vectors and forces", "Motion intuition", "Laws in context"],
          visualCaption: "Projectile motion and velocity vectors",
        },
        {
          id: "biology",
          name: "Biology",
          tagline: "From the cell to the system",
          description:
            "Diagrams for cells, organs, and living processes, connecting every structure to its function.",
          bullets: ["Cell maps", "Organ function", "Structure to function"],
          visualCaption: "Cell structure and organelles",
        },
        {
          id: "chemistry",
          name: "Chemistry",
          tagline: "Reactions, made clear",
          description:
            "Visual models of molecules, bonds, and reactions, with each step of the process traced.",
          bullets: ["Molecule models", "Reaction steps", "Symbols with meaning"],
          visualCaption: "Water formation: H₂ + O₂",
        },
        {
          id: "history",
          name: "History",
          tagline: "Events on a connected timeline",
          description:
            "Timelines and links between causes, events, and outcomes, instead of isolated dates to memorize.",
          bullets: ["Visual timelines", "Cause and effect", "Connected events"],
          visualCaption: "A timeline of connected events",
        },
        {
          id: "programming",
          name: "Programming",
          tagline: "Code explained line by line",
          description:
            "Worked examples that show what each line does and why, instead of asking you to memorize syntax.",
          bullets: ["Line-by-line walkthroughs", "Runnable examples", "Problem breakdowns"],
          visualCaption: "A small function and its execution",
        },
      ],
    },
    why: {
      eyebrow: "Why EduMind",
      title: "Learning is not memorizing. It is understanding.",
      description:
        "EduMind does not add more content to your plate. It works with the material you already have and turns it into a more active, clearer way to learn.",
      points: [
        {
          title: "Learn at your own pace",
          description: "Focus on the weakest spot and return to any part whenever you need it.",
        },
        {
          title: "Understand difficult concepts",
          description:
            "Gradual explanations and examples from your own lesson, not abstract definitions.",
        },
        {
          title: "Turn reading into active learning",
          description: "Questions and quizzes move you from passive effort to actual practice.",
        },
        {
          title: "Practice with tailored quizzes",
          description:
            "Questions come from your material, and explanations show why an answer is right.",
        },
        {
          title: "Organize your materials",
          description:
            "Summaries and mind maps turn scattered notes into clear structure and quick reference.",
        },
        {
          title: "Track your progress",
          description:
            "See what you understand and what needs another pass, then build your next step.",
        },
      ],
      closingTop: "One step between your documents",
      closingAccent: "and a different learning experience.",
      closingNote: "Start from your own material and keep the way you study in one place.",
    },
    faq: {
      eyebrow: "FAQ",
      title: "What to know before you start.",
      description: "The questions we hear most about EduMind and how it works.",
      items: [
        {
          question: "What is EduMind?",
          answer:
            "EduMind is an AI-powered learning platform that turns study documents into a personal learning experience with explanations, summaries, quizzes, and mind maps.",
        },
        {
          question: "How does AI tutoring work?",
          answer:
            "You choose a document or a specific part of a lesson, then ask in your own words. The tutor uses your lesson content as its reference, explains the idea, and can simplify it or offer another example.",
        },
        {
          question: "Which file formats are supported?",
          answer:
            "The current version is designed for PDF, Word DOCX, and plain text files. Additional formats are planned based on what learners need most.",
        },
        {
          question: "Can EduMind explain complex subjects?",
          answer:
            "Content is broken into smaller concepts and explained with steps and examples. Technical subjects like mathematics, physics, and programming get dedicated visual and step-by-step treatment.",
        },
        {
          question: "Can I generate quizzes from my documents?",
          answer:
            "Yes. Quizzes are generated from the lesson you uploaded and include answers and explanations so you can review why an answer is correct.",
        },
        {
          question: "How do study rooms work?",
          answer:
            "You can open a study room for a subject and share its link with friends, so you join the same room and see the same timer. The room closes automatically when time is up, and the owner can end it at any point.",
        },
        {
          question: "Does EduMind support Arabic?",
          answer:
            "Yes. The interface and content work in both Arabic and English, with full right-to-left support and a reading-friendly Arabic typeface.",
        },
        {
          question: "Is my uploaded content private?",
          answer:
            "Uploaded content is treated as private to your account. The full details of how files are stored and used will be documented in the privacy policy before launch, and your content is not published publicly.",
        },
      ],
      moreLabel: "Ready to try it yourself?",
    },
    final: {
      eyebrow: "Ready when you are",
      englishHeadline: "Your Next Learning Experience Starts Here.",
      title: "Start with the file you already have.",
      description:
        "Upload your first document and pick how you want to understand it: explanation, summary, quiz, or mind map.",
      cta: "Create your account",
      note: "No complicated setup — one document is enough.",
    },
    footer: {
      description:
        "An AI learning platform that turns your study documents into explanations, summaries, quizzes, and interactive experiences built around you.",
      productTitle: "Product",
      productLinks: [
        { label: "Features", href: "#features" },
        { label: "How it works", href: "#how-it-works" },
        { label: "Learning tools", href: "#learning-preview" },
        { label: "How people use it", href: "#use-cases" },
        { label: "FAQ", href: "#faq" },
      ],
      toolsTitle: "Learning tools",
      toolsLinks: [
        { label: "AI Tutor", href: "#learning-preview" },
        { label: "Smart summaries", href: "#learning-preview" },
        { label: "Interactive quizzes", href: "#learning-preview" },
        { label: "Mind maps", href: "#learning-preview" },
        { label: "Study rooms", href: "#features" },
      ],
      companyTitle: "Company",
      companyLinks: [
        { label: "Our approach", href: "#why-edumind" },
        { label: "Subjects", href: "#subjects" },
        { label: "Get started", href: "/signup" },
      ],
      legalTitle: "Legal",
      privacy: "Privacy policy",
      privacyHref: "/privacy",
      terms: "Terms of use",
      termsHref: "/terms",
      soon: "Soon",
      socialTitle: "Follow",
      socials: [
        { label: "X" },
        { label: "LinkedIn", href: "https://www.linkedin.com/company/edumindapp/" },
        { label: "YouTube" },
      ],
      rights: "© 2026 EduMind. All rights reserved.",
      madeFor: "Made for learners everywhere.",
      status: "Private beta in progress",
    },
  },
};

export const navLinks = (dict: Dictionary) => [
  { label: dict.nav.features, href: "#features" },
  { label: dict.nav.howItWorks, href: "#how-it-works" },
  { label: dict.nav.tools, href: "#learning-preview" },
  { label: dict.nav.faq, href: "#faq" },
];
