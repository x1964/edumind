import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "شروط الاستخدام | EduMind",
  description: "شروط وأحكام استخدام منصة EduMind التعليمية",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="em-container py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-foreground">شروط الاستخدام</h1>
          <p className="text-muted-foreground mb-8">آخر تحديث: 2 نوفمبر 2026</p>

          <div className="prose prose-lg max-w-none space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">القبول بالشروط</h2>
              <p className="text-muted-foreground">
                باستخدامك لمنصة EduMind، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا
                توافق على هذه الشروط، يرجى عدم استخدام المنصة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">الوصف الخدمة</h2>
              <p className="text-muted-foreground mb-4">EduMind هي منصة تعليمية توفر:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>إدارة المواد الدراسية والمستندات</li>
                <li>مساعد ذكي للتعلم والإجابة على الأسئلة</li>
                <li>إنشاء ملخصات واختبارات وخرائط ذهنية</li>
                <li>تخطيط الدراسة وتتبع التقدم</li>
                <li>تحليلات الأداء والإحصائيات</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">التسجيل والحساب</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>لاستخدام بعض ميزات المنصة، يجب عليك إنشاء حساب. أنت مسؤول عن:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>الحفاظ على سرية كلمة المرور والحساب</li>
                  <li>جميع الأنشطة التي تتم من خلال حسابك</li>
                  <li>إخطارنا فوراً عن أي استخدام غير مصرح به</li>
                  <li>توفير معلومات دقيقة وحديثة</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">الالتزامات والمسؤوليات</h2>
              <p className="text-muted-foreground mb-4">عند استخدام المنصة، تلتزم بـ:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>عدم انتهاك حقوق الملكية الفكرية للآخرين</li>
                <li>عدم رفع محتوى غير قانوني أو مسيء</li>
                <li>عدم استخدام المنصة لأغراض احتيالية</li>
                <li>عدم محاولة اختراق أو إتلاف المنصة</li>
                <li>احترام حقوق المستخدمين الآخرين</li>
                <li>عدم مشاركة معلومات حسابك مع الآخرين</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">المحتوى الذي ترفعه</h2>
              <p className="text-muted-foreground mb-4">
                أنت تتحمل المسؤولية الكاملة عن المحتوى الذي ترفعه إلى المنصة، وتضمن أن:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>لديك الحق في رفع هذا المحتوى</li>
                <li>المحتوى لا ينتهك حقوق أي طرف ثالث</li>
                <li>المحتوى لا يحتوي على فيروسات أو برامج ضارة</li>
                <li>المحتوى لا يخالف القوانين المعمول بها</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">المحتوى المولد بالذكاء الاصطناعي</h2>
              <p className="text-muted-foreground mb-4">
                الميزات التي تعتمد على الذكاء الاصطناعي (مثل المساعد الذكي والملخصات والاختبارات):
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>تُستخدم لأغراض تعليمية فقط</li>
                <li>قد تحتوي على معلومات غير دقيقة</li>
                <li>يجب التحقق من المعلومات قبل الاعتماد عليها</li>
                <li>لا تُستخدم لاتخاذ قرارات هامة</li>
                <li>نحن لسنا مسؤولين عن نتائج استخدام هذا المحتوى</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">الملكية الفكرية</h2>
              <p className="text-muted-foreground mb-4">
                جميع المحتويات والميزات والتصميمات في المنصة مملوكة لـ EduMind أو مرخصة لنا، ومحمية
                بموجب قوانين حقوق الملكية الفكرية.
              </p>
              <p className="text-muted-foreground">
                تمنحك EduMind ترخيصاً محدوداً وغير حصري لاستخدام المنصة لأغراض شخصية وتعليمية فقط.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">الخصوصية</h2>
              <p className="text-muted-foreground">
                استخدامك للمنصة يخضع لسياسة الخصوصية الخاصة بنا. يرجى مراجعة{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  سياسة الخصوصية
                </Link>{" "}
                لفهم كيفية جمعنا واستخدامنا لمعلوماتك.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">إنهاء الخدمة</h2>
              <p className="text-muted-foreground mb-4">نحن نحتفظ بالحق في:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>تعليق أو إنهاء حسابك لانتهاك هذه الشروط</li>
                <li>إيقاف الوصول إلى المنصة مؤقتاً للصيانة</li>
                <li>تعديل أو إيقاف أي ميزة في أي وقت</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">الإخلاء من المسؤولية</h2>
              <p className="text-muted-foreground mb-4">
                المنصة تُقدم &quot;كما هي&quot; دون أي ضمانات صريحة أو ضمنية، بما في ذلك:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>دقة أو اكتمال المحتوى</li>
                <li>التوافر المستمر للخدمة</li>
                <li>الخلو من الأخطاء أو الفيروسات</li>
                <li>النتائج التعليمية المحددة</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                نحن لسنا مسؤولين عن أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام المنصة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">التعويض</h2>
              <p className="text-muted-foreground">
                تتعهد بتعويض EduMind وشركائها وموظفيها من أي مطالبات أو خسائر أو أضرار ناتجة عن
                انتهاكك لهذه الشروط أو استخدامك للمنصة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">تغييرات الشروط</h2>
              <p className="text-muted-foreground">
                قد نقوم بتحديث هذه الشروط من وقت لآخر. الاستخدام المستمر للمنصة بعد التغييرات يعتبر
                قبولاً لها. سنقوم بإعلامك بأي تغييرات جوهرية.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">القانون الحاكم</h2>
              <p className="text-muted-foreground">
                تخضع هذه الشروط للقوانين المعمول بها في بلدك. أي نزاع سيتم حله وفقاً لهذه القوانين.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">اتصل بنا</h2>
              <p className="text-muted-foreground mb-4">
                إذا كان لديك أي أسئلة حول هذه الشروط، يمكنك التواصل معنا عبر:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-foreground">البريد الإلكتروني: legal@edumind.com</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <Link href="/" className="inline-flex items-center text-primary hover:underline">
              العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
