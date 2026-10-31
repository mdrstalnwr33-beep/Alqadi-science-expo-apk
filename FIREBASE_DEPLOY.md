# تفعيل النشر السحابي

رسالة `PERMISSION_DENIED` تعني أن قواعد Firestore لم تُنشر إلى مشروع Firebase `alnoor-ed4e7`.

## من Firebase Console

1. افتح مشروع `alnoor-ed4e7` في Firebase Console.
2. افتح **Firestore Database → Rules**.
3. استبدل القواعد الموجودة بمحتوى ملف `firestore.rules`.
4. اضغط **Publish**.
5. اختبر من التطبيق نشر درس أو واجب أو اختبار وتعديل صورة المعلم.

## الحضور ومزامنة حسابات الطلاب

يتطلب عرض قائمة الطلاب والحضور من أجهزة مختلفة نشر قواعد `students` و`settings` و`attendance` الموجودة في `firestore.rules`. قواعد هذه المجموعات مفتوحة حاليًا لأن التطبيق يتحقق بأكواد مدرسية فقط ولا يستخدم Firebase Authentication؛ وهذا يسمح نظريًا لأي مستخدم للتطبيق بقراءة البيانات أو تعديلها. لا تعتمد هذا الإعداد لنشر عام أو بيانات حساسة قبل إضافة مصادقة وأدوار وقواعد مقيّدة للمعلم والطالب.

## باستخدام Firebase CLI

بعد تسجيل الدخول بحساب مالك المشروع:

```bash
npm install -g firebase-tools
firebase login
firebase use alnoor-ed4e7
firebase deploy --only firestore:rules,firestore:indexes
```

لا يحتاج التطبيق إلى Firebase Storage للكتب والملازم؛ يتم حفظ روابطها الخارجية في Firestore.
