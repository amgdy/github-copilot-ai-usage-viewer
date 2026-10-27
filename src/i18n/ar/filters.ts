import type { Dict } from '../core';

/** Arabic text for the filter panel, the filter chips, the date range and the names of report columns. */
const ar: Dict = {
  // Date range
  'Last {n} days': 'الأيام الـ{n} الأخيرة',
  '{from} to {to}': 'من {from} إلى {to}',
  'The data covers {from} to {to}.': 'البيانات تغطي الفترة من {from} إلى {to}.',
  'Change the date range': 'تغيير نطاق التاريخ',
  'Date range: {range}': 'نطاق التاريخ: {range}',

  // Notice about missing columns
  'The file is missing columns that some numbers depend on': 'الملف ينقصه أعمدة تعتمد عليها بعض الأرقام',

  // Filter chips
  'Active filters': 'عوامل التصفية المفعّلة',
  'Filtered by': 'التصفية حسب',
  'Remove filter {name}': 'إزالة عامل التصفية {name}',
  'Covered by included credits': 'مغطى من الأرصدة المشمولة',
  'Per-user usage': 'استخدام منسوب إلى مستخدم',
  'Repository-level (no user)': 'على مستوى المستودع (بلا مستخدم)',
  'Row cost': 'تكلفة الصف',
  'at least {amount}': '{amount} على الأقل',
  'at most {amount}': '{amount} على الأكثر',

  // Filter panel
  '{rows} rows · {usage}': 'الصفوف: {rows} · {usage}',
  '{title} ({n} selected)': '{title} (المحدد: {n})',
  'Only include usage on the selected days of the week (UTC).': 'احسب فقط الاستخدام في أيام الأسبوع المحددة (بتوقيت UTC).',
  'Workdays only': 'أيام العمل فقط',
  'Weekend only': 'عطلة نهاية الأسبوع فقط',
  'Any day': 'أي يوم',
  'Auto lets GitHub Copilot pick the model, and paid plans get a discount on it. Manual means the user picked the model.':
    'في Auto يختار GitHub Copilot النموذج، وتحصل الخطط المدفوعة على خصم عليه. يدوي يعني أن المستخدم اختار النموذج بنفسه.',
  'Auto only': 'Auto فقط',
  'Manual only': 'يدوي فقط',
  'Covered rows were paid from included credits. Billed rows are overage.': 'الصفوف المشمولة دُفعت من الأرصدة المشمولة. الصفوف المدفوعة الإضافية هي التجاوز.',
  'Billed overage': 'التجاوز المدفوع',
  Attribution: 'النسبة إلى مستخدم',
  'Repository-level products (code quality, security) have no user.': 'منتجات مستوى المستودع (جودة الكود والأمان) ليس لها مستخدم.',
  'Repository-level': 'على مستوى المستودع',
  'Cost of a single row (USD)': 'تكلفة الصف الواحد (بالدولار)',
  'Find the large single charges, or hide the small ones.': 'اعثر على الرسوم الكبيرة المفردة، أو أخفِ الصغيرة منها.',
  'Minimum row cost': 'أقل تكلفة للصف',
  'Maximum row cost': 'أعلى تكلفة للصف',
  'Text search': 'البحث بالنص',
  'All words must match the user, model, organization, cost center, repository or product.':
    'يجب أن تطابق كل الكلمات المستخدم أو النموذج أو المؤسسة أو مركز التكلفة أو المستودع أو المنتج.',
  'for example: claude sonnet': 'مثال: claude sonnet',
  'Segments are worked out for the users in the rows the other filters select. Then they narrow the report. The counts show users and usage in each segment.':
    'تُحسب الشرائح للمستخدمين في الصفوف التي تختارها عوامل التصفية الأخرى، ثم تضيّق التقرير. توضح الأعداد المستخدمين والاستخدام في كل شريحة.',
  'Engagement and lifecycle': 'التفاعل ومرحلة الاستخدام',
  'Behavior traits (any of)': 'سمات السلوك (أي منها)',
  'Pareto class (share of usage)': 'فئة باريتو (الحصة من الاستخدام)',
  'Usage per user (USD)': 'الاستخدام لكل مستخدم (بالدولار)',
  'Minimum usage per user': 'أقل استخدام لكل مستخدم',
  'Maximum usage per user': 'أعلى استخدام لكل مستخدم',
  '{shown} of {total} rows match': 'الصفوف المطابقة: {shown} من {total}',
  '{usage} usage': 'الاستخدام: {usage}',
  'Users, plans and organizations': 'المستخدمون والخطط والمؤسسات',
  'Plan (by included credits)': 'الخطة (حسب الأرصدة المشمولة)',
  'Products and sources': 'المنتجات والمصادر',
  'Billing and rows': 'الفوترة والصفوف',
  'User segments': 'شرائح المستخدمين',

  // Empty values in the report
  '(unattributed / repo-level)': '(غير منسوب / على مستوى المستودع)',
  '(none)': '(لا يوجد)',
  '(unknown model)': '(نموذج غير معروف)',
  '(no organization)': '(بلا مؤسسة)',
  '(no app)': '(بلا تطبيق)',
  '(no repository)': '(بلا مستودع)',
  '(no cost center)': '(بلا مركز تكلفة)',
  '(file)': '(الملف)',
};

export default ar;
