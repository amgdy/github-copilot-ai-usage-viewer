import type { Dict, PluralEntry } from '../core';

const plural = (one: string, two: string, few: string, many: string, other: string): PluralEntry => ({ zero: other, one, two, few, many, other });

/** Arabic text for the app shell: start page, side bar, top bar, page list, file loading and the filtered-view notice. */
const arabic: Dict = {
  'Could not change language. Please try again.': 'تعذّر تغيير اللغة. حاول مرة أخرى.',
  'Something went wrong': 'حدث خطأ',
  'Something went wrong in {page}': 'حدث خطأ في {page}',
  'Try again, or start over with another file.': 'حاول مرة أخرى، أو ابدأ من جديد بملف آخر.',
  'The data is still loaded. Try another page, change the filters, or reload.': 'البيانات ما زالت محمّلة. جرّب صفحة أخرى، أو غيّر عوامل التصفية، أو أعد تحميل الصفحة.',
  'Try again': 'حاول مرة أخرى',
  'Clear all filters': 'مسح كل عوامل التصفية',
  // Start page
  'That does not look like a CSV file. Choose the AI usage report you downloaded from GitHub (.csv).':
    'هذا لا يبدو ملف CSV. اختر تقرير استخدام الذكاء الاصطناعي الذي نزّلته من GitHub (ملف ‎.csv).',
  'Go back to {name}': 'العودة إلى {name}',
  'Back to {name}': 'رجوع إلى {name}',
  'Switch between light and dark': 'التبديل بين الوضع الفاتح والداكن',
  'See where your GitHub Copilot AI credits go': 'اعرف أين تذهب أرصدة الذكاء الاصطناعي في GitHub Copilot',
  'Drop the AI usage report you downloaded from GitHub. You get usage and pool health, rankings, user groups, tokens and the Auto discount for each user, and clear steps to get more from GitHub Copilot at a fair cost.':
    'أضف تقرير استخدام الذكاء الاصطناعي الذي نزّلته من GitHub. ستحصل على الاستخدام وحالة الرصيد المشترك، وترتيب المستخدمين، ومجموعاتهم، والرموز وخصم Auto لكل مستخدم، وخطوات واضحة للاستفادة أكثر من GitHub Copilot بتكلفة معقولة.',
  '{n} rows read': 'الصفوف المقروءة: {n}',
  'Starting…': 'جارٍ البدء…',
  'Drop one or more CSV files here': 'أفلت ملف CSV أو أكثر هنا',
  'Several files are joined into one, and repeated rows are removed.': 'تُدمج الملفات في ملف واحد، وتُحذف الصفوف المكررة.',
  'Choose files': 'اختيار الملفات',
  'After loading, you can add your GitHub Copilot license list and other GitHub files on the Data page for a fuller picture.':
    'بعد التحميل، يمكنك إضافة قائمة تراخيص GitHub Copilot وملفات أخرى من GitHub في صفحة البيانات، لتحصل على صورة أوضح.',
  'That file could not be loaded': 'تعذّر تحميل هذا الملف',
  'Clear next steps': 'خطوات تالية واضحة',
  'Users are grouped by how much and how they use GitHub Copilot. Actions are sorted by the money they can save.':
    'يُقسَّم المستخدمون إلى مجموعات حسب مقدار استخدامهم لـ GitHub Copilot وطريقته. وتُرتَّب الإجراءات حسب المال الذي توفّره.',
  'Every angle': 'كل الزوايا',
  'Filter by user, model, organization, cost center, product, date, weekday, billing and more. Click any chart to see the details.':
    'صفِّ النتائج حسب المستخدم والنموذج والمؤسسة ومركز التكلفة والمنتج والتاريخ ويوم الأسبوع والفوترة وغيرها. انقر على أي رسم بياني لترى التفاصيل.',
  'Every number explained': 'شرح لكل رقم',
  'Each number has a button that shows how it is calculated, with an example. The Methodology page lists them all.':
    'لكل رقم زر يوضح طريقة حسابه مع مثال. وصفحة المنهجية تعرضها كلها.',
  Private: 'خاص',
  'The file is read in this browser tab only. Nothing is uploaded or saved on a server, and it works offline.':
    'يُقرأ الملف في علامة التبويب هذه فقط. لا يُرفع أي شيء ولا يُحفظ على خادم، ويعمل التطبيق دون اتصال بالإنترنت.',
  'Columns the report needs: {columns} and the token columns. Other columns are ignored.':
    'الأعمدة التي يحتاجها التقرير: {columns} وأعمدة الرموز. ويتم تجاهل الأعمدة الأخرى.',

  // Shell and side bar
  'Load other data': 'تحميل بيانات أخرى',
  'GitHub Copilot AI usage': 'استخدام الذكاء الاصطناعي في GitHub Copilot',
  'Worked out in {ms} ms in your browser. Usage is AI credits × $0.01. Estimates are marked as estimates. Every number has a calculation button, and the Methodology page lists them all.':
    'تم الحساب في {ms} ملّي ثانية داخل متصفحك. الاستخدام = أرصدة الذكاء الاصطناعي × $0.01. التقديرات مكتوب عليها أنها تقديرات. لكل رقم زر يشرح طريقة حسابه، وصفحة المنهجية تعرضها كلها.',
  'GitHub Copilot usage': 'استخدام GitHub Copilot',
  'AI credits report viewer': 'عارض تقرير أرصدة الذكاء الاصطناعي',
  'Report sections': 'أقسام التقرير',
  'Your file is read in this browser tab only. Nothing is uploaded.': 'يُقرأ ملفك في علامة التبويب هذه فقط. لا يُرفع أي شيء.',

  // Top bar
  'same as your device': 'مثل جهازك',
  light: 'فاتح',
  dark: 'داكن',
  'Theme: {now}. Click to switch to {next}.': 'المظهر: {now}. انقر للتبديل إلى {next}.',
  'Hide the formulas printed under the numbers': 'إخفاء المعادلات المكتوبة تحت الأرقام',
  'Print the formula under every number, chart and table column': 'كتابة المعادلة تحت كل رقم ورسم بياني وعمود في الجداول',
  'Show calculations': 'إظهار طرق الحساب',
  'Open navigation': 'فتح قائمة الصفحات',
  'Open all filters': 'فتح كل عوامل التصفية',
  'Filters, {n} on': 'عوامل التصفية، المفعّل منها: {n}',

  // Page list
  Overview: 'نظرة عامة',
  'Summary for managers: usage, pool health and the top actions': 'ملخص للمديرين: الاستخدام وحالة الرصيد المشترك وأهم الإجراءات',
  'Usage and pool': 'الاستخدام والرصيد المشترك',
  'Included credits, usage, overage, forecast and budgets': 'الأرصدة المشمولة والاستخدام والتجاوز والتوقعات والميزانيات',
  Recommendations: 'التوصيات',
  'Actions sorted by value, a savings simulator and a playbook': 'إجراءات مرتبة حسب قيمتها، ومحاكي للتوفير، ودليل عملي',
  'Seats from your license list: who uses them, who does not, and seats you can free up':
    'التراخيص في قائمة التراخيص لديك: من يستخدمها، ومن لا يستخدمها، والتراخيص التي يمكنك تحريرها',
  'Rankings, tokens, Auto use and details for each user': 'الترتيب والرموز واستخدام Auto وتفاصيل كل مستخدم',
  Segments: 'الشرائح',
  'User groups: usage tiers, personas and habits': 'مجموعات المستخدمين: مستويات الاستخدام وأنواع المستخدمين والعادات',
  'Models, vendors, Auto use and the Auto discount': 'النماذج والشركات المزوّدة واستخدام Auto وخصم Auto',
  Efficiency: 'الكفاءة',
  'Cache, context size and model choice checks': 'فحص الذاكرة المؤقتة وحجم السياق واختيار النموذج',
  'Organizations, cost centers, repositories and chargeback': 'المؤسسات ومراكز التكلفة والمستودعات وتوزيع التكلفة',
  Patterns: 'أنماط الاستخدام',
  'Weekday pattern, calendar and unusual days': 'نمط أيام الأسبوع والتقويم والأيام غير المعتادة',
  Data: 'البيانات',
  'Files, quality checks and raw rows': 'الملفات وفحوص الجودة والصفوف الأصلية',
  Settings: 'الإعدادات',
  'Limits, license list, budget, model prices and theme': 'الحدود وقائمة التراخيص والميزانية وأسعار النماذج والمظهر',
  Methodology: 'المنهجية',
  'How every number in the report is calculated': 'كيف يُحسب كل رقم في التقرير',
  Insights: 'الرؤى',
  Act: 'التنفيذ',
  'Drill down': 'التفاصيل',

  // Export menu and printed header
  'Download or print what you see now': 'تنزيل ما تراه الآن أو طباعته',
  'Summary for managers (Markdown)': 'ملخص للمديرين (Markdown)',
  'Main message, key numbers, user groups and recommendations for what you see now.': 'الرسالة الرئيسية وأهم الأرقام ومجموعات المستخدمين والتوصيات لما تراه الآن.',
  Copied: 'تم النسخ',
  'Could not copy. Use the download instead.': 'تعذّر النسخ. استخدم التنزيل بدلًا من ذلك.',
  'Copy the summary': 'نسخ الملخص',
  'Paste the summary into an email, a wiki page or a chat.': 'الصق الملخص في رسالة بريد أو صفحة wiki أو محادثة.',
  'Recommendations (CSV)': 'التوصيات (CSV)',
  'Actions with their value, most valuable first.': 'الإجراءات مع قيمتها، والأعلى قيمة أولًا.',
  'Next step for each user (CSV)': 'الخطوة التالية لكل مستخدم (CSV)',
  'Every user with their group, usage and suggested next step.': 'كل مستخدم مع مجموعته واستخدامه والخطوة التالية المقترحة.',
  'Print or save as PDF': 'طباعة أو حفظ كملف PDF',
  'Prints this page in light colors, without the menus.': 'يطبع هذه الصفحة بألوان فاتحة ودون القوائم.',
  'GitHub Copilot AI usage report': 'تقرير استخدام الذكاء الاصطناعي في GitHub Copilot',
  '{name} · {start} to {end} ({days}) · printed {today}': '{name} · من {start} إلى {end} ({days}) · طُبع في {today}',
  'Filters: {list}': 'عوامل التصفية: {list}',
  'Filters: none (all rows)': 'عوامل التصفية: لا شيء (كل الصفوف)',

  // Filtered view notice
  'You are looking at a filtered view': 'أنت تشاهد عرضًا مُصفّى',
  'Clear filters': 'مسح عوامل التصفية',
  'The numbers cover only the selected rows. Numbers about the whole organization, like pool use and seat changes, are hidden. Included credits are shared by everyone, so they cannot be split by a filter.':
    'الأرقام تخص الصفوف المحددة فقط. الأرقام التي تخص المؤسسة كلها، مثل استخدام الرصيد المشترك وتغييرات التراخيص، مخفية. الأرصدة المشمولة مشتركة بين الجميع، لذلك لا يمكن تقسيمها بعامل تصفية.',

  // Loading files
  'Reading…': 'جارٍ القراءة…',
  'Reading {file} ({i} of {n})': 'جارٍ قراءة {file} ({i} من {n})',
  'Reading {file}': 'جارٍ قراءة {file}',
  'No usage rows were found. Is this an AI usage report export (CSV)?': 'لم يتم العثور على صفوف استخدام. هل هذا ملف تقرير استخدام الذكاء الاصطناعي (CSV)؟',
  'Preparing the analysis…': 'جارٍ تجهيز التحليل…',
  'No rows match the current filters': 'لا توجد صفوف تطابق عوامل التصفية الحالية',
  'Widen the date range or clear some filters.': 'وسّع نطاق التاريخ أو امسح بعض عوامل التصفية.',

  // Brand, contents list and sample report
  'GitHub Copilot': 'GitHub Copilot',
  'Usage report': 'تقرير الاستخدام',
  '{n} urgent actions': plural('إجراء عاجل واحد', 'إجراءان عاجلان', '{n} إجراءات عاجلة', '{n} إجراءً عاجلًا', '{n} إجراء عاجل'),
  'Making a sample report…': 'جارٍ إنشاء تقرير تجريبي…',
  'Sample report (made-up data)': 'تقرير تجريبي (بيانات وهمية)',
  'Sample data': 'بيانات تجريبية',
  'This is a sample report': 'هذا تقرير تجريبي',
  'Open your report': 'افتح تقريرك',
  'The people, organizations and numbers are made up in this browser tab. Open your own usage report to see your real numbers.':
    'الأشخاص والمؤسسات والأرقام وهمية، وقد أُنشئت في علامة التبويب هذه. افتح تقرير الاستخدام الخاص بك لترى أرقامك الحقيقية.',
  'Your saved license list is not used here, so no real names appear in the sample.': 'لا تُستخدم قائمة التراخيص المحفوظة هنا، لذلك لا تظهر أسماء حقيقية في التقرير التجريبي.',
  'License lists are not used with the sample': 'لا تُستخدم قوائم التراخيص مع التقرير التجريبي',
  'The sample has made-up users. Open your own report first.': 'المستخدمون في التقرير التجريبي وهميون. افتح تقريرك أولًا.',
  'A license list holds real people, so the app never joins it to the made-up sample. A list you import here is saved and used when you open your own usage report.':
    'تضم قائمة التراخيص أشخاصًا حقيقيين، لذلك لا يربطها التطبيق أبدًا بالتقرير التجريبي الوهمي. تُحفظ القائمة التي تستوردها هنا وتُستخدم عندما تفتح تقرير الاستخدام الخاص بك.',
  'For GitHub Copilot admins and managers': 'لمسؤولي GitHub Copilot والمديرين',
  'What you get': 'ما الذي تحصل عليه',
  'Open a report': 'افتح تقريرًا',
  or: 'أو',
  'View a sample report': 'اعرض تقريرًا تجريبيًا',
  'The sample uses made-up people and numbers. It is made in this browser tab.': 'يستخدم التقرير التجريبي أشخاصًا وأرقامًا وهمية، ويُنشأ في علامة التبويب هذه.',
};

export default arabic;
