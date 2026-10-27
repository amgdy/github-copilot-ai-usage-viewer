import type { Dict } from '../core';

/** Arabic text for the shared building blocks in src/components/ui. */
const ar: Dict = {
  'Read from the file': 'مأخوذ من الملف',
  'Calculated from the file': 'محسوب من الملف',
  'Summed straight from a column of the report.': 'مجموع مأخوذ مباشرة من عمود في التقرير.',
  'A fixed rule applied to numbers in the report. The same file always gives the same result.':
    'قاعدة ثابتة تُطبَّق على أرقام التقرير. الملف نفسه يعطي دائمًا النتيجة نفسها.',
  'Relies on an assumption, the price card or a setting. Treat it as a close guide, not as an invoice figure.':
    'يعتمد على افتراض أو على قائمة الأسعار أو على أحد الإعدادات. اعتبره دليلًا تقريبيًا وليس رقمًا من الفاتورة.',
  'How it is calculated': 'طريقة الحساب',
  Example: 'مثال',
  'Columns of the report used': 'أعمدة التقرير المستخدمة',
  'Settings that change it': 'الإعدادات التي تغيّره',
  'Good to know': 'معلومات مفيدة',
  'See also': 'انظر أيضًا',
  'Official guidance': 'إرشادات رسمية',

  'Search…': 'بحث…',
  'Clear search': 'مسح البحث',
  'Search {n} options…': 'ابحث في {n} خيارًا…',
  'No match': 'لا توجد نتائج مطابقة',
  'No options': 'لا توجد خيارات',
  'Showing the first {shown} of {total}. Type to narrow the list.': 'يتم عرض أول {shown} من {total}. اكتب لتضييق القائمة.',
  'Clear {n} selected': 'مسح {n} من المحدد',

  // Severity
  Critical: 'حرج',
  High: 'مرتفع',
  Medium: 'متوسط',
  Low: 'منخفض',
  Info: 'معلومة',
  'Good news': 'خبر جيد',

  // Tables
  'Search table…': 'ابحث في الجدول…',
  'No rows to show.': 'لا توجد صفوف لعرضها.',
  'Choose columns': 'اختر الأعمدة',
  Columns: 'الأعمدة',
  'Download the filtered rows as CSV': 'تنزيل الصفوف بعد التصفية كملف CSV',
  CSV: 'CSV',
  Total: 'الإجمالي',
  '0 rows': 'لا توجد صفوف',
  '{from} to {to} of {total}': '{from} إلى {to} من {total}',
  '(filtered from {n})': '(بعد التصفية من {n})',
  'Rows per page': 'عدد الصفوف في الصفحة',
  '{n} per page': '{n} في الصفحة',
  'Previous page': 'الصفحة السابقة',
  'Next page': 'الصفحة التالية',

  // Cards, charts and helpers
  '{name}: show details': '{name}: عرض التفاصيل',
  'Change versus the previous period of the same length': 'التغيّر مقارنة بالفترة السابقة لها بالطول نفسه',
  Loading: 'جارٍ التحميل',
  'More information': 'مزيد من المعلومات',
  'Download as PNG': 'تنزيل كصورة PNG',
  'Download chart as PNG': 'تنزيل الرسم البياني كصورة PNG',
  'Opens in a new tab': 'يفتح في علامة تبويب جديدة',
};

export default ar;
