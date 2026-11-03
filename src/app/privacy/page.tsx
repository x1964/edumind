import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | EduMind",
  description: "سياسة الخصوصية لمنصة EduMind التعليمية",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="em-container py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-foreground">سياسة الخصوصية</h1>
          <p className="text-muted-foreground mb-8">آخر تحديث: 2 نوفمبر 2026</p>

          <div className="prose prose-lg max-w-none space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">مقدمة</h2>
              <p className="text-muted-foreground">
                نحن في EduWind نلتزم بحماية خصوصيتك وبياناتك الشخصية. توضح هذه السياسة كيفية جمعنا
                واستخدامنا وحمايتها للمعلومات التي تقدمها لنا عند استخدام منصتنا التعليمية.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">المعلومات التي نجمعها</h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-medium text-foreground mb-2">المعلومات الشخصية</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>الاسم وعنوان البريد الإلكتروني</li>
                    <li>معلومات التعليم والمستوى الدراسي</li>
                    <li>الصورة الرمزية (اختياري)</li>
                    <li>التفضيلات اللغوية</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">المعلومات التعليمية</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>المواد الدراسية المرفوعة</li>
                    <li>ملخصات المحتوى</li>
                    <li>نتائج الاختبارات</li>
                    <li>خطة الدراسة والتقدم</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">المعلومات التقنية</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>عنوان IP</li>
                    <li>نوع المتصفح والجهاز</li>
                    <li>بيانات الاستخدام والتفاعل</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">كيف نستخدم معلوماتك</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>توفير وتحسين خدماتنا التعليمية</li>
                <li>تخصيص تجربة التعلم حسب احتياجاتك</li>
                <li>تقديم المحتوى والتوصيات المناسبة</li>
                <li>إرسال إشعارات وتحديثات هامة</li>
                <li>تحليل الأداء وتطوير المنصة</li>
                <li>حماية الأمان ومنع الاحتيال</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">مشاركة المعلومات</h2>
              <p className="text-muted-foreground mb-4">
                نحن لا نبيع بياناتك لأي طرف ثالث. قد نشارك معلوماتك فقط في الحالات التالية:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>مع مزودي الخدمات الذين يساعدوننا في تشغيل المنصة</li>
                <li>عندما يطلب القانون ذلك أو للامتثال للإجراءات القانونية</li>
                <li>لحماية حقوقنا وممتلكاتنا وسلامة مستخدمينا</li>
                <li>مع موافقتك الصريحة</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">حماية البيانات</h2>
              <p className="text-muted-foreground">
                نحن نستخدم تشفير SSL/TLS لحماية البيانات أثناء النقل، ونحتفظ ببياناتك في خوادم آمنة
                مع سياسات وصول صارمة. نحن نلتزم بمعايير الأمان الدولية ونقوم بتحديث تدابيرنا بشكل
                دوري.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">حقوقك</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>الوصول إلى بياناتك الشخصية</li>
                <li>تصحيح أو تحديث معلوماتك</li>
                <li>حذف حسابك وبياناتك</li>
                <li>الاعتراض على معالجة بياناتك</li>
                <li>سحب الموافقة في أي وقت</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">ملفات تعريف الارتباط (Cookies)</h2>
              <p className="text-muted-foreground">
                نحن نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتخصيص المحتوى. يمكنك إدارة أو تعطيل
                ملفات تعريف الارتباط من خلال إعدادات متصفحك.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">التغييرات على هذه السياسة</h2>
              <p className="text-muted-foreground">
                قد نقوم بتحديث هذه السياسة من وقت لآخر. سنقوم بإعلامك بأي تغييرات جوهرية عبر البريد
                الإلكتروني أو من خلال إشعار على المنصة.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">اتصل بنا</h2>
              <p className="text-muted-foreground mb-4">
                إذا كان لديك أي أسئلة أو استفسارات حول سياسة الخصوصية، يمكنك التواصل معنا عبر:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-foreground">البريد الإلكتروني: privacy@edumind.com</p>
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
