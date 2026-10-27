import type { Dict, PluralEntry } from '../core';

/** Arabic counted noun: one, two, 3 to 10, 11 to 99, and 0 or 100 and up. */
const plural = (one: string, two: string, few: string, many: string, other: string): PluralEntry => ({ zero: other, one, two, few, many, other });

/** The Users page (src/pages/UsersPage.tsx, src/pages/users) and the user drawer (src/components/UserDrawer.tsx, src/components/user). */
const arabic: Dict = {
  // Drawer
  'No usage for this user in the current view': 'لا استخدام لهذا المستخدم في العرض الحالي',
  'The date range or the filters leave out every row for this user. Reset the filters to see them again.':
    'يستبعد النطاق الزمني أو عوامل التصفية كل صفوف هذا المستخدم. أعد ضبط عوامل التصفية لتراها مجددًا.',
  'Reset all filters': 'إعادة ضبط كل عوامل التصفية',

  // Auto vs direct
  'Auto vs direct': 'Auto مقابل الاختيار المباشر',
  'This file has no model names, so Auto usage cannot be told apart from models picked by hand.':
    'لا يحتوي هذا الملف على أسماء النماذج، لذلك لا يمكن تمييز استخدام Auto عن النماذج المختارة يدويًا.',
  'No usage for this user in this date range.': 'لا استخدام لهذا المستخدم في هذا النطاق الزمني.',
  '{share} of usage on Auto': '{share} من الاستخدام عبر Auto',
  '{part} of {total}': '{part} من {total}',
  "The share of the user's usage that went through Auto model selection.": 'حصة استخدام المستخدم التي مرّت عبر اختيار النموذج عبر Auto.',
  '{rate} off the original price': 'خصم {rate} من السعر الأصلي',
  "What the Auto discount took off this user's Auto usage: the original price minus the amount in the report.":
    'ما خصمه Auto من استخدام هذا المستخدم عبر Auto: السعر الأصلي ناقص المبلغ الوارد في التقرير.',
  '{amount} in the report, after the discount': '{amount} في التقرير، بعد الخصم',
  'What the Auto usage would have cost with the models Auto picked, before the Auto discount.':
    'ما كانت ستكلفه استخدامات Auto بالنماذج التي اختارها Auto، قبل خصم Auto.',
  'Hand-picked usage': 'الاستخدام المختار يدويًا',
  'Usage on models the user chose by hand. It earns no Auto discount.': 'الاستخدام على نماذج اختارها المستخدم يدويًا. لا يحصل على خصم Auto.',
  'An estimate: {amount} × {rate}': 'تقدير: {amount} × {rate}',
  'What the hand-picked usage would have earned if the same requests had gone through Auto.':
    'ما كان الاستخدام المختار يدويًا سيحصل عليه لو مرّت الطلبات نفسها عبر Auto.',
  '{plan}, measured': '{plan}، مقيس',
  '{plan}, assumed': '{plan}، مفترض',
  'Measured on the Auto usage of all users on this plan in the report.': 'مقيس على استخدام Auto لكل مستخدمي هذه الخطة في التقرير.',
  'The report has too little measured Auto usage on this plan, so the {rate} from Settings is assumed.':
    'استخدام Auto المقيس على هذه الخطة في التقرير قليل جدًا، لذلك يُفترض المعدل {rate} من الإعدادات.',

  // Bars and comparison
  '{title}: {parts}': '{title}: {parts}',
  '{label} {share}': '{label} {share}',
  'No usage to split.': 'لا استخدام لتقسيمه.',
  'This file has no token columns': 'لا يحتوي هذا الملف على أعمدة الرموز',
  'No active days': 'لا أيام نشاط',
  'Active rate': 'نسبة أيام النشاط',
  'Not available': 'غير متاح',
  Higher: 'أعلى',
  Similar: 'مشابه',
  Lower: 'أقل',
  '{label}: {value}, typical user {typical}': '{label}: {value}، المستخدم المعتاد {typical}',
  '{value} · typical {typical} · {verdict}': '{value} · المعتاد {typical} · {verdict}',
  'Compared with everyone else': 'مقارنةً بالجميع',
  'Typical is the median of {n} users': 'المعتاد هو الوسيط لعدد {n} من المستخدمين',
  'Only one user is in this view, so there is nothing to compare with.': 'يوجد مستخدم واحد فقط في هذا العرض، لذلك لا يوجد ما يُقارن به.',
  'The bar is this user. The dark tick marks the typical user.': 'الشريط هو هذا المستخدم. والعلامة الداكنة تشير إلى المستخدم المعتاد.',

  // Daily chart
  'Daily usage of this user': 'الاستخدام اليومي لهذا المستخدم',
  'Peak day {day}: {value} ({share} of usage)': 'يوم الذروة {day}: {value} ({share} من الاستخدام)',
  'Peak day {day}: {value}': 'يوم الذروة {day}: {value}',
  'Daily usage of {name}': 'الاستخدام اليومي لـ {name}',
  'No usage on any day of this date range.': 'لا استخدام في أي يوم من هذا النطاق الزمني.',

  // License block
  'Not in the export': 'غير موجود في التصدير',
  'License since': 'الترخيص منذ',
  '{date} ({n} days before the export)': plural(
    '{date} (قبل التصدير بيوم واحد)',
    '{date} (قبل التصدير بيومين)',
    '{date} (قبل التصدير بـ {n} أيام)',
    '{date} (قبل التصدير بـ {n} يومًا)',
    '{date} (قبل التصدير بـ {n} يوم)',
  ),
  'Cancellation date': 'تاريخ الإلغاء',
  'No seat in the license list. This user has usage in the report, so check how they get access.':
    'لا يوجد ترخيص في قائمة التراخيص. لهذا المستخدم استخدام في التقرير، لذلك تحقّق من كيفية حصوله على الوصول.',
  '{n} more seats have no usage in the report': plural(
    'ترخيص إضافي واحد بلا استخدام في التقرير',
    'ترخيصان إضافيان بلا استخدام في التقرير',
    '{n} تراخيص إضافية بلا استخدام في التقرير',
    '{n} ترخيصًا إضافيًا بلا استخدام في التقرير',
    '{n} ترخيص إضافي بلا استخدام في التقرير',
  ),

  // Model mix
  'Models and Auto': 'النماذج وAuto',
  'This file has no model names, so the usage cannot be split by model, model tier or Auto.':
    'لا يحتوي هذا الملف على أسماء النماذج، لذلك لا يمكن تقسيم الاستخدام حسب النموذج أو فئة النموذج أو Auto.',
  'No model usage in this date range.': 'لا استخدام للنماذج في هذا النطاق الزمني.',
  'Usage by model': 'الاستخدام حسب النموذج',
  "{model} ({tier}): {amount}, {share} of this user's usage": '{model} ({tier}): {amount}، {share} من استخدام هذا المستخدم',
  'Auto or hand-picked': 'Auto أو مختار يدويًا',

  // Savings and tips
  'Where the savings would come from': 'من أين سيأتي التوفير',
  'What this user could avoid by changing habits. Each step is counted after the one above it, so the amounts never overlap.':
    'ما يمكن لهذا المستخدم تجنبه بتغيير عاداته. تُحسب كل خطوة بعد الخطوة التي فوقها، لذلك لا تتداخل المبالغ أبدًا.',
  'No savings stand out for this user with the current settings.': 'لا يبرز أي توفير لهذا المستخدم مع الإعدادات الحالية.',
  'Could save about {total} over this date range, {monthly} a month, {share} of their usage.':
    'يمكن توفير نحو {total} خلال هذا النطاق الزمني، أي {monthly} في الشهر، و{share} من استخدامه.',
  'Could save about {total} over this date range, {monthly} a month.': 'يمكن توفير نحو {total} خلال هذا النطاق الزمني، أي {monthly} في الشهر.',
  'Savings by step': 'التوفير حسب الخطوة',
  '{label}: {description}': '{label}: {description}',
  'Cap runaway users assumes a license size, because the file does not list included credits.':
    'يفترض «وضع حد للمستخدمين المفرطين» حجم ترخيص، لأن الملف لا يذكر الأرصدة المشمولة.',
  'The tips are written to the user, so you can pass them on as they are.': 'النصائح موجّهة إلى المستخدم، لذلك يمكنك إرسالها إليه كما هي.',
  'Nothing stands out for this user.': 'لا شيء يبرز لهذا المستخدم.',
  '{amount} over the selected date range': '{amount} خلال النطاق الزمني المحدد',
  'Could save about {amount} a month': 'يمكن توفير نحو {amount} في الشهر',
  '(opens in a new tab)': '(يُفتح في علامة تبويب جديدة)',

  // Tokens
  'This file has no token columns, so token counts and the cost by token type are not available.':
    'لا يحتوي هذا الملف على أعمدة الرموز، لذلك لا تتوفر أعداد الرموز ولا التكلفة حسب نوع الرمز.',
  'No token counts for this user in this date range.': 'لا أعداد رموز لهذا المستخدم في هذا النطاق الزمني.',
  'Typical user {rate}': 'المستخدم المعتاد {rate}',
  "{share} of this user's tokens": '{share} من رموز هذا المستخدم',
  '{n} tokens in the selected date range.': '{n} رمز في النطاق الزمني المحدد.',
  '{share} of all tokens': '{share} من كل الرموز',
  '{n} tokens in the selected date range. The share compares the user with everyone in the current date range and row filters.':
    '{n} رمز في النطاق الزمني المحدد. تقارن الحصة المستخدم بالجميع في النطاق الزمني وعوامل تصفية الصفوف الحالية.',
  'The share of prompt tokens that were read from the cache. A higher rate means less repeated input.':
    'حصة رموز الطلب التي قُرئت من الذاكرة المؤقتة. كلما ارتفعت النسبة قلّ الإدخال المكرر.',
  'Estimated usage by token type': 'الاستخدام المقدّر حسب نوع الرمز',
  "{label}: {amount} of {total} of this user's priced usage": '{label}: {amount} من {total} من الاستخدام المسعّر لهذا المستخدم',
  "None of this user's usage could be priced from token counts, so it is not split by token type.":
    'تعذّر تسعير أي جزء من استخدام هذا المستخدم من أعداد الرموز، لذلك لا يُقسَّم حسب نوع الرمز.',
  "An estimate from the price card. It covers all of this user's usage.": 'تقدير من بطاقة الأسعار. يغطي كل استخدام هذا المستخدم.',
  "An estimate from the price card. It covers {share} of this user's usage. The rest has no token counts or a model that is not on the price card.":
    'تقدير من بطاقة الأسعار. يغطي {share} من استخدام هذا المستخدم. أما الباقي فليس له أعداد رموز أو يستخدم نموذجًا غير موجود في بطاقة الأسعار.',
  '{n} tokens': '{n} رمز',

  // Badges, footer and navigation
  '{label} {action}': '{label} {action}',
  'Suggested next step:': 'الخطوة التالية المقترحة:',
  'The file has no license size for this user, so the persona and usage tier assume one.':
    'لا يذكر الملف حجم ترخيص هذا المستخدم، لذلك يفترض نمط المستخدم ومستوى الاستخدام حجمًا له.',
  'Copy failed': 'تعذّر النسخ',
  'Copy summary': 'نسخ الملخص',
  'Filter everything to this user': 'تصفية كل شيء على هذا المستخدم',
  'Summary copied to the clipboard': 'نُسخ الملخص إلى الحافظة',
  'The summary could not be copied': 'تعذّر نسخ الملخص',
  'Previous user: {name}': 'المستخدم السابق: {name}',
  'Previous user': 'المستخدم السابق',
  'This is the first user': 'هذا هو المستخدم الأول',
  '{i} of {n}': '{i} من {n}',
  'Next user: {name}': 'المستخدم التالي: {name}',
  'Next user': 'المستخدم التالي',
  'This is the last user': 'هذا هو المستخدم الأخير',

  // Drawer numbers
  '{amount} left of {total}': 'متبقٍ {amount} من {total}',
  '{amount} over {total}': '{amount} فوق {total}',
  '{amount} left of {total} (assumed)': 'متبقٍ {amount} من {total} (مفترض)',
  '{amount} over {total} (assumed)': '{amount} فوق {total} (مفترض)',
  'No usage in the last 2 weeks': 'لا استخدام في آخر أسبوعين',
  'vs {amount} the week before': 'مقابل {amount} في الأسبوع السابق',
  'Nothing the week before': 'لا شيء في الأسبوع السابق',
  '{rate} of workdays · active on the last day': '{rate} من أيام العمل · نشط في اليوم الأخير',
  '{rate} of workdays · last on {date}': '{rate} من أيام العمل · آخر نشاط في {date}',
  '#{rank} of {total} · {share} of all usage': '#{rank} من {total} · {share} من كل الاستخدام',
  'Usage of the user in the selected date range, before included credits. Rows that went through Auto are already after the Auto discount. Rank and share compare the user with everyone in the current date range and row filters.':
    'استخدام المستخدم في النطاق الزمني المحدد، قبل الأرصدة المشمولة. الصفوف التي مرّت عبر Auto محسوب فيها خصم Auto مسبقًا. يقارن الترتيب والحصة المستخدم بالجميع في النطاق الزمني وعوامل تصفية الصفوف الحالية.',
  '{amount} covered by included credits': '{amount} مشمول بالأرصدة المشمولة',
  'Billed on top of licenses, as the report states it. Included credits are shared across the organization, so read a figure for one user with care.':
    'المدفوع الإضافي فوق التراخيص كما يذكره التقرير. الأرصدة المشمولة مشتركة على مستوى المؤسسة، لذلك اقرأ رقم مستخدم واحد بحذر.',
  'Usage as a share of the included credits that come with the license, for the selected date range. Above 100% means the user drew from the shared pool.':
    'الاستخدام كحصة من الأرصدة المشمولة التي تأتي مع الترخيص، للنطاق الزمني المحدد. ما فوق 100% يعني أن المستخدم سحب من الرصيد المشترك.',
  'The file has no license size for this user, so the included credits of a {credits}-credit license are assumed. Above 100% means the user drew from the shared pool.':
    'لا يذكر الملف حجم ترخيص هذا المستخدم، لذلك تُفترض الأرصدة المشمولة لترخيص بحجم {credits} رصيد. ما فوق 100% يعني أن المستخدم سحب من الرصيد المشترك.',
  'Active days': 'أيام النشاط',
  'Days with at least {amount} of usage. The share counts workdays since the user first appeared.':
    'الأيام التي فيها {amount} على الأقل من الاستخدام. تحسب الحصة أيام العمل منذ أول ظهور للمستخدم.',
  'Typical user {amount}': 'المستخدم المعتاد {amount}',
  'Usage divided by active days. The typical user is the median of everyone in the current view.':
    'الاستخدام مقسومًا على أيام النشاط. المستخدم المعتاد هو الوسيط لكل من في العرض الحالي.',
  'Last 7 days': 'آخر 7 أيام',
  'Usage in the last 7 days of the date range, compared with the 7 days before.': 'الاستخدام في آخر 7 أيام من النطاق الزمني، مقارنةً بالأيام السبعة التي قبلها.',

  // License status
  'No seat': 'لا ترخيص',
  'The license list shows activity in the last 30 days.': 'تُظهر قائمة التراخيص نشاطًا في آخر 30 يومًا.',
  'The license list shows the last activity 30 to 89 days ago.': 'تُظهر قائمة التراخيص آخر نشاط قبل 30 إلى 89 يومًا.',
  'The license list shows no activity for 90 days or more.': 'لا تُظهر قائمة التراخيص أي نشاط منذ 90 يومًا أو أكثر.',
  'The license list shows no activity for this seat at all.': 'لا تُظهر قائمة التراخيص أي نشاط لهذا الترخيص على الإطلاق.',
  'The license list has no activity dates, so it cannot say how active this seat is.':
    'لا تحتوي قائمة التراخيص على تواريخ نشاط، لذلك لا يمكنها بيان مدى نشاط هذا الترخيص.',
  'This user has usage in the report but no seat in the license list.': 'لهذا المستخدم استخدام في التقرير لكن ليس له ترخيص في قائمة التراخيص.',
  '{value} and others': '{value} وغيرها',

  // Auto notes
  'An estimate: the Auto usage of this user has no token counts, so the original price uses the discount rate of the plan.':
    'تقدير: استخدام Auto لهذا المستخدم بلا أعداد رموز، لذلك يعتمد السعر الأصلي على معدل خصم الخطة.',
  '{share} of the Auto usage of this user is measured from token counts. For the rest, the discount is an estimate based on the discount rate of the plan.':
    '{share} من استخدام Auto لهذا المستخدم مقيس من أعداد الرموز. أما الباقي فالخصم فيه تقدير مبني على معدل خصم الخطة.',
  'An estimate: the Auto usage has no token counts, so the original price uses the discount rate of the plan.':
    'تقدير: استخدام Auto بلا أعداد رموز، لذلك يعتمد السعر الأصلي على معدل خصم الخطة.',
  '{share} of the Auto usage is measured from token counts. For the rest, the discount is an estimate based on the discount rate of the plan.':
    '{share} من استخدام Auto مقيس من أعداد الرموز. أما الباقي فالخصم فيه تقدير مبني على معدل خصم الخطة.',

  // Copied summary
  'Included credits used: not in the file': 'نسبة استخدام الأرصدة المشمولة: غير موجودة في الملف',
  'Included credits used: {share} ({left} left of {total})': 'نسبة استخدام الأرصدة المشمولة: {share} (متبقٍ {left} من {total})',
  'Included credits used: {share} ({over} over {total})': 'نسبة استخدام الأرصدة المشمولة: {share} ({over} فوق {total})',
  'Last 7 days: {amount}, nothing the week before': 'آخر 7 أيام: {amount}، ولا شيء في الأسبوع السابق',
  'Last 7 days: {amount}, up {change} from {prior} the week before': 'آخر 7 أيام: {amount}، بزيادة {change} عن {prior} في الأسبوع السابق',
  'Last 7 days: {amount}, down {change} from {prior} the week before': 'آخر 7 أيام: {amount}، بانخفاض {change} عن {prior} في الأسبوع السابق',
  'Total tokens: {total} (input {input}, cache read {read}, cache write {write}, output {output})':
    'إجمالي الرموز: {total} (إدخال {input}، قراءة من الذاكرة المؤقتة {read}، كتابة في الذاكرة المؤقتة {write}، إخراج {output})',
  'Auto share of usage: {share}': 'حصة Auto من الاستخدام: {share}',
  'Auto use class: {label}': 'فئة استخدام Auto: {label}',
  'Auto discount received: {amount} ({rate} off an original price of {original})': 'خصم Auto المستلم: {amount} (خصم {rate} من سعر أصلي قدره {original})',
  'Discount missed on hand-picked usage: about {amount} ({base} at the {rate} discount rate of the plan, measured)':
    'الخصم الفائت على الاستخدام المختار يدويًا: نحو {amount} ({base} بمعدل خصم الخطة {rate}، مقيس)',
  'Discount missed on hand-picked usage: about {amount} ({base} at the {rate} discount rate of the plan, assumed)':
    'الخصم الفائت على الاستخدام المختار يدويًا: نحو {amount} ({base} بمعدل خصم الخطة {rate}، مفترض)',
  'License: no seat in the license list': 'الترخيص: لا ترخيص في قائمة التراخيص',
  'License: {plan}, {status}': 'الترخيص: {plan}، {status}',
  'Last activity in the license list: {date} in {surface}': 'آخر نشاط في قائمة التراخيص: {date} في {surface}',
  'Last activity in the license list: {date}': 'آخر نشاط في قائمة التراخيص: {date}',
  'Cancellation date: {date}': 'تاريخ الإلغاء: {date}',
  'GitHub Copilot AI-credit usage for {name}': 'استخدام أرصدة الذكاء الاصطناعي في GitHub Copilot لـ {name}',
  'Period: {start} to {end} ({days})': 'الفترة: من {start} إلى {end} ({days})',
  'Usage: {amount} (rank {rank} of {total}, {share} of all usage)': 'الاستخدام: {amount} (الترتيب {rank} من {total}، {share} من كل الاستخدام)',
  'Billed on top of seats: {amount} ({covered} covered by included credits)': 'المدفوع الإضافي فوق التراخيص: {amount} ({covered} مشمول بالأرصدة المشمولة)',
  'Billed on top of seats: not in the file': 'المدفوع الإضافي فوق التراخيص: غير موجود في الملف',
  'Active days: {days} ({rate} of workdays), last active {date}': 'أيام النشاط: {days} ({rate} من أيام العمل)، آخر نشاط {date}',
  'Active days: {days}': 'أيام النشاط: {days}',
  'Cost per active day: {amount}': 'التكلفة لكل يوم نشاط: {amount}',
  'Persona: {label}': 'نمط المستخدم: {label}',
  'Usage tier: {label}': 'مستوى الاستخدام: {label}',
  'Engagement: {label}': 'التفاعل: {label}',
  'Usage profile: {label}': 'ملف الاستخدام: {label}',
  'Pareto class: {label}': 'فئة باريتو: {label}',
  'Traits: {list}': 'السمات: {list}',
  'Suggested next step: {action}': 'الخطوة التالية المقترحة: {action}',
  'Top model: {model} ({share} of usage)': 'النموذج الأكثر استخدامًا: {model} ({share} من الاستخدام)',
  'Potential savings: about {amount} over this period, {monthly} a month': 'التوفير المحتمل: نحو {amount} خلال هذه الفترة، أي {monthly} في الشهر',
  '{label}: {value}': '{label}: {value}',

  // Page
  'Who uses GitHub Copilot, how much, and who needs attention.': 'من يستخدم GitHub Copilot، وبأي قدر، ومن يحتاج إلى متابعة.',
  '{users} from {start} to {end}.': '{users} من {start} إلى {end}.',
  'Every column of the General, Tokens, Auto and License views for every user in this view':
    'كل أعمدة عروض «عام» و«الرموز» و«Auto» و«الترخيص» لكل مستخدم في هذا العرض',
  'Every column of the General, Tokens and Auto views for every user in this view': 'كل أعمدة عروض «عام» و«الرموز» و«Auto» لكل مستخدم في هذا العرض',
  'Download user table': 'تنزيل جدول المستخدمين',
  'One row per user with the suggested next step': 'صف لكل مستخدم مع الخطوة التالية المقترحة',
  'No users match these filters': 'لا يوجد مستخدمون يطابقون عوامل التصفية هذه',
  'The user group filters, such as persona, usage tier or Auto use class, leave nobody in this view. Clear them to see everyone again.':
    'لا تُبقي عوامل تصفية مجموعات المستخدمين، مثل نمط المستخدم أو مستوى الاستخدام أو فئة استخدام Auto، أحدًا في هذا العرض. امسحها لترى الجميع مجددًا.',

  // Attention lists
  '{amount} over': '{amount} زيادة',
  '{share} of their included credits': '{share} من أرصدتهم المشمولة',
  '{share} of their usage': '{share} من استخدامهم',
  '{recent} last 7 days, {prior} before': '{recent} في آخر 7 أيام، و{prior} قبلها',
  'First seen {day} · {days}': 'أول ظهور {day} · {days}',
  'Short lists of users worth a conversation. Click a name to see the details.': 'قوائم قصيرة بمستخدمين يستحقون محادثة. انقر اسمًا لترى التفاصيل.',
  'Over their included credits': 'فوق أرصدتهم المشمولة',
  'They used more than their own included credits. The extra comes out of the shared pool.':
    'استخدموا أكثر من أرصدتهم المشمولة. تُخصم الزيادة من الرصيد المشترك.',
  'Nobody used more than their own included credits.': 'لم يستخدم أحد أكثر من أرصدته المشمولة.',
  'Included credits per user are not in the file.': 'الأرصدة المشمولة لكل مستخدم غير موجودة في الملف.',
  'Most to gain': 'الأكثر فائدة',
  'Estimated usage that better model choices and habits could avoid. Start here.':
    'الاستخدام المقدّر الذي يمكن تجنبه باختيار نماذج أفضل وعادات أفضل. ابدأ من هنا.',
  'No savings were found for these users.': 'لم يُعثر على توفير لهؤلاء المستخدمين.',
  'Usage in the last 7 days is half or less of the 7 days before. Ask if something is in their way.':
    'الاستخدام في آخر 7 أيام نصف استخدام الأيام السبعة السابقة أو أقل. اسألهم إن كان شيء يعيقهم.',
  'Nobody is fading.': 'لا يوجد أحد يتراجع استخدامه.',
  'The date range needs at least 14 days to spot fading.': 'يحتاج النطاق الزمني إلى 14 يومًا على الأقل لرصد تراجع الاستخدام.',
  'New and ramping': 'جدد وفي تصاعد',
  'Started in the last {n} days. Early habits stick, so a short intro on model choice pays off.':
    'بدأوا في آخر {n} يوم. العادات المبكرة تدوم، لذلك يفيد تعريف قصير باختيار النموذج.',
  'No new users in this period.': 'لا مستخدمين جددًا في هذه الفترة.',
  'Usage but no seat in the license list': 'استخدام بلا ترخيص في قائمة التراخيص',
  'These users have usage in the report but no seat in the license list. Check if the list is complete or the user name is different.':
    'لهؤلاء المستخدمين استخدام في التقرير لكن ليس لهم ترخيص في قائمة التراخيص. تحقّق من اكتمال القائمة أو من اختلاف اسم المستخدم.',
  'Every user in the report has a seat in the license list.': 'لكل مستخدم في التقرير ترخيص في قائمة التراخيص.',
  'See all {n} on the Licenses page': 'عرض الكل ({n}) في صفحة التراخيص',

  // Auto strip
  "Click a class to show only those users below. Auto-first from {high} of a user's usage on Auto. Direct models below {low}. Change both in {settings}.":
    'انقر فئة لعرض مستخدميها فقط في الأسفل. «يعتمد على Auto» من {high} من استخدام المستخدم عبر Auto. «نماذج مباشرة» أقل من {low}. غيّر القيمتين في {settings}.',
  'Show all classes': 'عرض كل الفئات',
  'Auto vs direct in this view': 'Auto مقابل الاختيار المباشر في هذا العرض',
  'Who lets GitHub Copilot pick the model, what that saved, and what hand-picked usage could still save. {n} users in view.': plural(
    'من يترك GitHub Copilot يختار النموذج، وما وفّره ذلك، وما يمكن أن يوفّره الاستخدام المختار يدويًا. مستخدم واحد في العرض.',
    'من يترك GitHub Copilot يختار النموذج، وما وفّره ذلك، وما يمكن أن يوفّره الاستخدام المختار يدويًا. مستخدمان في العرض.',
    'من يترك GitHub Copilot يختار النموذج، وما وفّره ذلك، وما يمكن أن يوفّره الاستخدام المختار يدويًا. {n} مستخدمين في العرض.',
    'من يترك GitHub Copilot يختار النموذج، وما وفّره ذلك، وما يمكن أن يوفّره الاستخدام المختار يدويًا. {n} مستخدمًا في العرض.',
    'من يترك GitHub Copilot يختار النموذج، وما وفّره ذلك، وما يمكن أن يوفّره الاستخدام المختار يدويًا. {n} مستخدم في العرض.',
  ),
  'Auto usage cannot be told apart from models picked by hand, so the Auto share of usage, the Auto discount received and the discount missed on hand-picked usage are not available.':
    'لا يمكن تمييز استخدام Auto عن النماذج المختارة يدويًا، لذلك لا تتوفر حصة Auto من الاستخدام ولا خصم Auto المستلم ولا الخصم الفائت على الاستخدام المختار يدويًا.',
  '{rate} off an original price of {amount}': 'خصم {rate} من سعر أصلي قدره {amount}',
  'No usage went through Auto for the users in view.': 'لم يمرّ أي استخدام عبر Auto للمستخدمين في العرض.',
  'About {amount}': 'نحو {amount}',
  'Hand-picked usage of {amount} × the Auto discount rate of the plan of each user.': 'الاستخدام المختار يدويًا البالغ {amount} × معدل خصم Auto لخطة كل مستخدم.',
  'The users in view have no hand-picked usage.': 'ليس للمستخدمين في العرض استخدام مختار يدويًا.',
  'Plan discount rates are measured on all users in the current row filters, not only on the users in view.':
    'تُقاس معدلات خصم الخطط على كل المستخدمين في عوامل تصفية الصفوف الحالية، لا على المستخدمين في العرض فقط.',

  // Concentration
  'No users yet: 0% of usage': 'لا مستخدمين بعد: 0% من الاستخدام',
  'made by the {n} biggest users ({share} of users)': plural(
    'يقوم به المستخدم الأكبر ({share} من المستخدمين)',
    'يقوم به أكبر مستخدمَين ({share} من المستخدمين)',
    'يقوم به أكبر {n} مستخدمين ({share} من المستخدمين)',
    'يقوم به أكبر {n} مستخدمًا ({share} من المستخدمين)',
    'يقوم به أكبر {n} مستخدم ({share} من المستخدمين)',
  ),
  'Equal use': 'استخدام متساوٍ',
  '{users} of users make {share} of usage': '{users} من المستخدمين يقومون بـ {share} من الاستخدام',
  'Who drives usage': 'من يقود الاستخدام',
  'How much of all usage the biggest users make': 'كم من الاستخدام الكلي يقوم به أكبر المستخدمين',
  'Classes A, B and C are recalculated for the users shown, so they can differ from the class in the table.':
    'تُعاد حساب الفئات A وB وC للمستخدمين المعروضين، لذلك قد تختلف عن الفئة في الجدول.',
  'Not enough users': 'لا يوجد عدد كافٍ من المستخدمين',
  'At least two users with usage are needed to show how usage is spread.': 'يلزم مستخدمان على الأقل لهما استخدام لعرض توزّع الاستخدام.',
  'That is the {n} biggest users of {total}.': plural(
    'أي المستخدم الأكبر من أصل {total}.',
    'أي أكبر مستخدمَين من أصل {total}.',
    'أي أكبر {n} مستخدمين من أصل {total}.',
    'أي أكبر {n} مستخدمًا من أصل {total}.',
    'أي أكبر {n} مستخدم من أصل {total}.',
  ),
  'Left to right: users from the biggest to the smallest. Up: their combined share of usage. The dashed diagonal is what equal use would look like.':
    'من البداية إلى النهاية: المستخدمون من الأكبر إلى الأصغر. إلى الأعلى: حصتهم المجمّعة من الاستخدام. يمثل القطر المتقطع شكل الاستخدام المتساوي.',
  '{users} ({share})': '{users} ({share})',
  '{gini} ({level}). 0 means everyone uses the same amount. 1 means one person uses everything.':
    '{gini} ({level}). 0 يعني أن الجميع يستخدمون القدر نفسه. 1 يعني أن شخصًا واحدًا يستخدم كل شيء.',
  'Gini coefficient {value}': 'معامل جيني {value}',

  // KPIs
  'Included credits per user are not in the file': 'الأرصدة المشمولة لكل مستخدم غير موجودة في الملف',
  'Of {n} in this period': 'من أصل {n} في هذه الفترة',
  '{n} more seats never used': plural(
    'ترخيص إضافي واحد لم يُستخدم قط',
    'ترخيصان إضافيان لم يُستخدما قط',
    '{n} تراخيص إضافية لم تُستخدم قط',
    '{n} ترخيصًا إضافيًا لم يُستخدم قط',
    '{n} ترخيص إضافي لم يُستخدم قط',
  ),
  'With usage in this period': 'لهم استخدام في هذه الفترة',
  'People with usage in the selected period and filters. Seats in the license list that never show up in the report are listed at the bottom of this page.':
    'الأشخاص الذين لهم استخدام في الفترة وعوامل التصفية المحددة. التراخيص الموجودة في قائمة التراخيص ولا تظهر أبدًا في التقرير مدرجة أسفل هذه الصفحة.',
  'Median usage per user per month': 'وسيط الاستخدام لكل مستخدم في الشهر',
  'Half of the users use less': 'نصف المستخدمين يستخدمون أقل',
  'The usage of the middle user, scaled to an average month. Half of the users use less than this and half use more.':
    'استخدام المستخدم الأوسط، محوّلًا إلى شهر متوسط. نصف المستخدمين يستخدمون أقل من هذا والنصف الآخر أكثر.',
  'The usage of the middle user, scaled to an average month. Half of the users use less than this and half use more, so a few heavy users do not pull it up.':
    'استخدام المستخدم الأوسط، محوّلًا إلى شهر متوسط. نصف المستخدمين يستخدمون أقل من هذا والنصف الآخر أكثر، لذلك لا يرفعه قلة من كثيفي الاستخدام.',
  'Average usage per user per month': 'متوسط الاستخدام لكل مستخدم في الشهر',
  '{multiple} the median': '{multiple} الوسيط',
  'Total usage divided by the number of users, scaled to an average month. When the average is far above the median, a few heavy users pull it up.':
    'إجمالي الاستخدام مقسومًا على عدد المستخدمين، محوّلًا إلى شهر متوسط. عندما يفوق المتوسط الوسيط بكثير، فهذا يعني أن قلة من كثيفي الاستخدام يرفعونه.',
  'Top 10% share of usage': 'حصة أعلى 10% من الاستخدام',
  '{n} users of {total} use the most': plural(
    'مستخدم واحد من {total} هو الأكثر استخدامًا',
    'مستخدمان من {total} هما الأكثر استخدامًا',
    '{n} مستخدمين من {total} هم الأكثر استخدامًا',
    '{n} مستخدمًا من {total} هم الأكثر استخدامًا',
    '{n} مستخدم من {total} هم الأكثر استخدامًا',
  ),
  'Share of all usage made by the 10% of users who use the most. A high share means a few people drive the usage.':
    'حصة الاستخدام الكلي التي يقوم بها أعلى 10% من المستخدمين استخدامًا. الحصة المرتفعة تعني أن قلة من الأشخاص يقودون الاستخدام.',
  'Users above 100% of included credits': 'المستخدمون فوق 100% من الأرصدة المشمولة',
  '{amount} above their own credits': '{amount} فوق أرصدتهم',
  'Nobody used more than their own credits': 'لم يستخدم أحد أكثر من أرصدته',
  'Users whose usage is higher than the included credits of their own seat. The extra comes out of the shared pool, so it only costs money when the whole pool runs out.':
    'المستخدمون الذين يزيد استخدامهم على الأرصدة المشمولة في ترخيصهم. تُخصم الزيادة من الرصيد المشترك، لذلك لا تكلّف مالًا إلا عند نفاد الرصيد المشترك كله.',
  'Users below 20% of included credits': 'المستخدمون دون 20% من الأرصدة المشمولة',
  '{share} of users, not counting new users': '{share} من المستخدمين، دون احتساب المستخدمين الجدد',
  'No users to compare': 'لا مستخدمين للمقارنة',
  'Users who used less than 20% of the included credits of their seat. New users are not counted because they have had little time. These seats are worth a check-in.':
    'المستخدمون الذين استخدموا أقل من 20% من الأرصدة المشمولة في ترخيصهم. لا يُحتسب المستخدمون الجدد لأن وقتهم كان قصيرًا. تستحق هذه التراخيص متابعة.',

  // Missed discount list
  'Users with the most missed discount': 'المستخدمون الأكثر خصمًا فائتًا',
  'Nobody in this view has hand-picked usage with a missed discount.': 'لا أحد في هذا العرض لديه استخدام مختار يدويًا مع خصم فائت.',
  '{amount} hand-picked · {share} on Auto': '{amount} مختار يدويًا · {share} عبر Auto',
  'The {n} users with the most of {total} who have a missed discount. Click a user to see the details.':
    'أكثر {n} مستخدمين خصمًا فائتًا من أصل {total} لديهم خصم فائت. انقر مستخدمًا لترى التفاصيل.',
  'All {n} users with a missed discount. Click a user to see the details.': plural(
    'المستخدم الوحيد الذي لديه خصم فائت. انقر المستخدم لترى التفاصيل.',
    'المستخدمان اللذان لديهما خصم فائت. انقر مستخدمًا لترى التفاصيل.',
    'كل المستخدمين الـ {n} الذين لديهم خصم فائت. انقر مستخدمًا لترى التفاصيل.',
    'كل المستخدمين الـ {n} الذين لديهم خصم فائت. انقر مستخدمًا لترى التفاصيل.',
    'كل المستخدمين الـ {n} الذين لديهم خصم فائت. انقر مستخدمًا لترى التفاصيل.',
  ),

  // Licenses never used
  'License cost per month': 'تكلفة التراخيص في الشهر',
  'Import the license list on the Licenses page to see licenses that never show up in this report.':
    'استورد قائمة التراخيص في صفحة التراخيص لترى التراخيص التي لا تظهر أبدًا في هذا التقرير.',
  'Add a license list': 'إضافة قائمة تراخيص',
  'Every person in your license list appears in this report, so no licenses are sitting unused.':
    'كل شخص في قائمة التراخيص يظهر في هذا التقرير، لذلك لا توجد تراخيص غير مستخدمة.',
  'Licenses never used': 'تراخيص لم تُستخدم قط',
  '{n} licenses in the license list never appear in this file, about {amount} a month in license fees.': plural(
    'ترخيص واحد في قائمة التراخيص لا يظهر أبدًا في هذا الملف، بنحو {amount} في الشهر من رسوم التراخيص.',
    'ترخيصان في قائمة التراخيص لا يظهران أبدًا في هذا الملف، بنحو {amount} في الشهر من رسوم التراخيص.',
    '{n} تراخيص في قائمة التراخيص لا تظهر أبدًا في هذا الملف، بنحو {amount} في الشهر من رسوم التراخيص.',
    '{n} ترخيصًا في قائمة التراخيص لا تظهر أبدًا في هذا الملف، بنحو {amount} في الشهر من رسوم التراخيص.',
    '{n} ترخيص في قائمة التراخيص لا تظهر أبدًا في هذا الملف، بنحو {amount} في الشهر من رسوم التراخيص.',
  ),
  'Business licenses are counted at $19 a month and Enterprise licenses at $39. A license without a plan is priced like the most common plan in the file.':
    'تُحتسب تراخيص Business بسعر 19 دولارًا في الشهر وتراخيص Enterprise بسعر 39 دولارًا. يُسعَّر الترخيص الذي بلا خطة مثل الخطة الأكثر شيوعًا في الملف.',
  'These licenses cost money but show no AI-credit usage. Code completions are not in this export, so check with the person before you remove a license.':
    'تكلّف هذه التراخيص مالًا لكنها لا تُظهر أي استخدام لأرصدة الذكاء الاصطناعي. إكمالات التعليمات البرمجية ليست في هذا التصدير، لذلك تحقّق مع الشخص قبل إزالة الترخيص.',
  'Search licenses…': 'البحث في التراخيص…',

  // Ranking
  'Top {n}': 'أعلى {n}',
  'Showing the top {shown} of {total} ranked users.': 'عرض أعلى {shown} من أصل {total} مستخدمًا مرتّبًا.',
  'Showing all {n} ranked users.': plural(
    'عرض المستخدم المرتّب الوحيد.',
    'عرض المستخدمَين المرتّبَين.',
    'عرض كل المستخدمين المرتّبين الـ {n}.',
    'عرض كل المستخدمين المرتّبين الـ {n}.',
    'عرض كل المستخدمين المرتّبين الـ {n}.',
  ),
  '{n} users are not ranked.': plural(
    'مستخدم واحد غير مرتّب.',
    'مستخدمان غير مرتّبَين.',
    '{n} مستخدمين غير مرتّبين.',
    '{n} مستخدمًا غير مرتّبين.',
    '{n} مستخدم غير مرتّبين.',
  ),
  'User ranking': 'ترتيب المستخدمين',
  'Click a bar to open the user.': 'انقر شريطًا لفتح المستخدم.',
  'Rank users by': 'ترتيب المستخدمين حسب',
  Order: 'الفرز',
  'Order of the ranking': 'اتجاه الترتيب',
  Show: 'العرض',
  'Number of users to show': 'عدد المستخدمين المعروضين',
  'Color by': 'التلوين حسب',
  'Color the bars by': 'تلوين الأشرطة حسب',
  'Not available in this file': 'غير متاح في هذا الملف',
  'Nobody to rank': 'لا أحد للترتيب',
  'Top {n} users by {measure}': 'أعلى {n} مستخدمين حسب {measure}',
  'Bar colors': 'ألوان الأشرطة',

  // Scatter
  '{n} users without active days are not shown.': plural(
    'مستخدم واحد بلا أيام نشاط غير معروض.',
    'مستخدمان بلا أيام نشاط غير معروضَين.',
    '{n} مستخدمين بلا أيام نشاط غير معروضين.',
    '{n} مستخدمًا بلا أيام نشاط غير معروضين.',
    '{n} مستخدم بلا أيام نشاط غير معروضين.',
  ),
  '{n} users without known included credits are not shown.': plural(
    'مستخدم واحد بلا أرصدة مشمولة معروفة غير معروض.',
    'مستخدمان بلا أرصدة مشمولة معروفة غير معروضَين.',
    '{n} مستخدمين بلا أرصدة مشمولة معروفة غير معروضين.',
    '{n} مستخدمًا بلا أرصدة مشمولة معروفة غير معروضين.',
    '{n} مستخدم بلا أرصدة مشمولة معروفة غير معروضين.',
  ),
  '{n} users without prompt tokens are not shown.': plural(
    'مستخدم واحد بلا رموز طلب غير معروض.',
    'مستخدمان بلا رموز طلب غير معروضَين.',
    '{n} مستخدمين بلا رموز طلب غير معروضين.',
    '{n} مستخدمًا بلا رموز طلب غير معروضين.',
    '{n} مستخدم بلا رموز طلب غير معروضين.',
  ),
  '{n} users without usage are not shown.': plural(
    'مستخدم واحد بلا استخدام غير معروض.',
    'مستخدمان بلا استخدام غير معروضَين.',
    '{n} مستخدمين بلا استخدام غير معروضين.',
    '{n} مستخدمًا بلا استخدام غير معروضين.',
    '{n} مستخدم بلا استخدام غير معروضين.',
  ),
  '{n} users without usage are not shown on the log scale.': plural(
    'مستخدم واحد بلا استخدام غير معروض على المقياس اللوغاريتمي.',
    'مستخدمان بلا استخدام غير معروضَين على المقياس اللوغاريتمي.',
    '{n} مستخدمين بلا استخدام غير معروضين على المقياس اللوغاريتمي.',
    '{n} مستخدمًا بلا استخدام غير معروضين على المقياس اللوغاريتمي.',
    '{n} مستخدم بلا استخدام غير معروضين على المقياس اللوغاريتمي.',
  ),
  '{n} users without tokens are not shown on the log scale.': plural(
    'مستخدم واحد بلا رموز غير معروض على المقياس اللوغاريتمي.',
    'مستخدمان بلا رموز غير معروضَين على المقياس اللوغاريتمي.',
    '{n} مستخدمين بلا رموز غير معروضين على المقياس اللوغاريتمي.',
    '{n} مستخدمًا بلا رموز غير معروضين على المقياس اللوغاريتمي.',
    '{n} مستخدم بلا رموز غير معروضين على المقياس اللوغاريتمي.',
  ),
  'This file does not say how many included credits each user has.': 'لا يذكر هذا الملف عدد الأرصدة المشمولة لكل مستخدم.',
  'This file has no token columns.': 'لا يحتوي هذا الملف على أعمدة الرموز.',
  'This file has no model names.': 'لا يحتوي هذا الملف على أسماء النماذج.',
  'Included credits used cannot be chosen, because this file does not say how many included credits each user has.':
    'لا يمكن اختيار نسبة استخدام الأرصدة المشمولة، لأن هذا الملف لا يذكر عدد الأرصدة المشمولة لكل مستخدم.',
  'Cache hit rate and total tokens cannot be chosen, because this file has no token columns.':
    'لا يمكن اختيار نسبة القراءة من الذاكرة المؤقتة وإجمالي الرموز، لأن هذا الملف لا يحتوي على أعمدة الرموز.',
  'Auto share of usage and the discount missed on hand-picked usage cannot be chosen, because this file has no model names.':
    'لا يمكن اختيار حصة Auto من الاستخدام والخصم الفائت على الاستخدام المختار يدويًا، لأن هذا الملف لا يحتوي على أسماء النماذج.',
  'All included credits used': 'استُخدمت كل الأرصدة المشمولة',
  'Showing the {n} users with the most usage of {total}.': 'عرض أكثر {n} مستخدمين استخدامًا من أصل {total}.',
  'Compare users': 'مقارنة المستخدمين',
  'One dot per user. Choose what the two axes and the dot size show. Click a dot to open the user.':
    'نقطة لكل مستخدم. اختر ما يعرضه المحوران وحجم النقطة. انقر نقطة لفتح المستخدم.',
  'Horizontal axis': 'المحور الأفقي',
  'Vertical axis': 'المحور الرأسي',
  'Dot size': 'حجم النقطة',
  'Vertical scale': 'المقياس الرأسي',
  Linear: 'خطي',
  Log: 'لوغاريتمي',
  'The log scale spreads out the smaller users.': 'يباعد المقياس اللوغاريتمي بين المستخدمين الأصغر.',
  'Scatter chart of {y} against {x}, one dot per user': 'مخطط انتشار لـ {y} مقابل {x}، نقطة لكل مستخدم',
  'No users to plot': 'لا مستخدمين للرسم',
  'Switch an axis or the scale to see more users.': 'غيّر محورًا أو المقياس لترى مزيدًا من المستخدمين.',

  // Segment chips
  'Click a group to focus the whole app on it. Click it again to remove it.': 'انقر مجموعة لتركيز التطبيق كله عليها. انقرها مجددًا لإزالتها.',
  'This file does not list included credits per license. Personas and usage tiers use an assumed license size, so read them with care.':
    'لا يذكر هذا الملف الأرصدة المشمولة لكل ترخيص. تعتمد أنماط المستخدمين ومستويات الاستخدام على حجم ترخيص مفترض، لذلك اقرأها بحذر.',

  // Table
  '{users}. Click a row to open the user. Use Columns to show more.': '{users}. انقر صفًا لفتح المستخدم. استخدم «الأعمدة» لعرض المزيد.',
  'Token counts, the cache hit rate and the cost by token type need the input, cache_read, cache_write and output columns, so these cells show a dash.':
    'تحتاج أعداد الرموز ونسبة القراءة من الذاكرة المؤقتة والتكلفة حسب نوع الرمز إلى الأعمدة input وcache_read وcache_write وoutput، لذلك تعرض هذه الخلايا شرطة.',
  'The cost by token type covers {share} of the usage in view. Only rows with token counts and a model on the price card are split by token type. Token coverage shows the share for each user.':
    'تغطي التكلفة حسب نوع الرمز {share} من الاستخدام في العرض. لا تُقسَّم حسب نوع الرمز إلا الصفوف التي لها أعداد رموز ونموذج موجود في بطاقة الأسعار. تُظهر تغطية الرموز الحصة لكل مستخدم.',
  'Auto usage cannot be told apart from models picked by hand, so the Auto columns show a dash.':
    'لا يمكن تمييز استخدام Auto عن النماذج المختارة يدويًا، لذلك تعرض أعمدة Auto شرطة.',
  'Discount missed on hand-picked usage is an estimate: hand-picked usage × the Auto discount rate of the plan of the user. Auto discount received is measured from token counts where the file allows it.':
    'الخصم الفائت على الاستخدام المختار يدويًا تقدير: الاستخدام المختار يدويًا × معدل خصم Auto لخطة المستخدم. ويُقاس خصم Auto المستلم من أعداد الرموز حيث يسمح الملف بذلك.',
  'The seat details come from the license list. {users} in this view have usage but no seat in the list.':
    'تأتي تفاصيل التراخيص من قائمة التراخيص. لدى {users} في هذا العرض استخدام لكن بلا ترخيص في القائمة.',
  'The seat details come from the license list. Every user in this view has a seat in the list.':
    'تأتي تفاصيل التراخيص من قائمة التراخيص. لكل مستخدم في هذا العرض ترخيص في القائمة.',
  'Search users, teams, models': 'البحث في المستخدمين والفرق والنماذج',
  'No users match.': 'لا مستخدمين مطابقين.',
  'Table view': 'عرض الجدول',

  // Auto columns
  'What the Auto discount took off the Auto usage of the user': 'ما خصمه Auto من استخدام Auto للمستخدم',
  'The Auto usage of the user at the price card, without the Auto discount': 'استخدام Auto للمستخدم بسعر بطاقة الأسعار، بلا خصم Auto',
  'Usage on models the user picked by hand, not through Auto': 'الاستخدام على نماذج اختارها المستخدم يدويًا، لا عبر Auto',
  'An estimate: hand-picked usage × the Auto discount rate of the plan of the user': 'تقدير: الاستخدام المختار يدويًا × معدل خصم Auto لخطة المستخدم',
  'Auto discount rate': 'معدل خصم Auto',
  'Auto discount received ÷ original price of Auto usage. A dash when the user has no Auto usage.':
    'خصم Auto المستلم ÷ السعر الأصلي لاستخدام Auto. شرطة عندما لا يكون للمستخدم استخدام عبر Auto.',
  'Auto-first, Mixed or Direct models, from the share of usage on Auto': '«يعتمد على Auto» أو «مختلط» أو «نماذج مباشرة»، بحسب حصة الاستخدام عبر Auto',
  'An estimate. The plan rates come from the Auto usage in the file.': 'تقدير. معدلات الخطط مأخوذة من استخدام Auto في الملف.',
  'An estimate. The file has too little Auto usage to measure these plan rates, so the rate from Settings is assumed.':
    'تقدير. استخدام Auto في الملف قليل جدًا لقياس معدلات هذه الخطط، لذلك يُفترض المعدل من الإعدادات.',
  'An estimate. {share} of it uses plan rates measured from the file. The rest uses the rate from Settings.':
    'تقدير. يستخدم {share} منه معدلات خطط مقيسة من الملف. ويستخدم الباقي المعدل من الإعدادات.',
  'The report has no Auto usage to measure a discount rate, so the {rate} from Settings is assumed.':
    'لا يحتوي التقرير على استخدام Auto لقياس معدل الخصم، لذلك يُفترض المعدل {rate} من الإعدادات.',
  '{plan} {rate} (measured)': '{plan} {rate} (مقيس)',
  '{plan} {rate} (assumed)': '{plan} {rate} (مفترض)',
  'Discount rate by plan: {list}. A plan without Auto usage uses the {rate} from Settings.':
    'معدل الخصم حسب الخطة: {list}. الخطة التي بلا استخدام عبر Auto تستخدم المعدل {rate} من الإعدادات.',

  // General columns
  General: 'عام',
  'Usage, billing, activity and classes': 'الاستخدام والفوترة والنشاط والفئات',
  'Input, cache read, cache write and output tokens per user': 'رموز الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها والإخراج لكل مستخدم',
  'Auto against hand-picked models per user': 'Auto مقابل النماذج المختارة يدويًا لكل مستخدم',
  'The seat of each user in the license list': 'ترخيص كل مستخدم في قائمة التراخيص',
  Rank: 'الترتيب',
  'Position by usage among all users in the date range': 'الموضع حسب الاستخدام بين كل المستخدمين في النطاق الزمني',
  'The kind of user, from how often and how much they use GitHub Copilot': 'نوع المستخدم، بحسب عدد مرات استخدامه لـ GitHub Copilot وقدره',
  'Usage compared with the included credits of the seat': 'الاستخدام مقارنةً بالأرصدة المشمولة في الترخيص',
  'How often the user is active: the share of workdays with use': 'مدى نشاط المستخدم: حصة أيام العمل التي فيها استخدام',
  'Which kind of model the user mostly uses: Efficient, Balanced or Frontier-heavy': 'نوع النموذج الذي يستخدمه المستخدم غالبًا: «موفّر» أو «متوازن» أو «يعتمد على النماذج القوية»',
  'A: the users who make the first part of all usage. B: the next part. C: the long tail. Based on all users in the date range, not on the persona, tier or Auto use filters.':
    'A: المستخدمون الذين يقومون بالجزء الأول من الاستخدام الكلي. B: الجزء التالي. C: الذيل الطويل. مبني على كل المستخدمين في النطاق الزمني، لا على عوامل تصفية نمط المستخدم أو المستوى أو استخدام Auto.',
  'The seat of the user, from the included credits in the file': 'ترخيص المستخدم، بحسب الأرصدة المشمولة في الملف',
  'Usage in the date range, before included credits': 'الاستخدام في النطاق الزمني، قبل الأرصدة المشمولة',
  'Share of the usage of all users in the date range': 'الحصة من استخدام كل المستخدمين في النطاق الزمني',
  'Billed on top of seats, as the file states it. The included credits are pooled, so a user can be billed while below their own credits.':
    'المدفوع الإضافي فوق التراخيص كما يذكره الملف. الأرصدة المشمولة مجمّعة، لذلك قد يُحتسب على المستخدم مدفوع إضافي وهو دون أرصدته.',
  'Usage as a share of the included credits of the seat. Above 100% means the user drew from the shared pool.':
    'الاستخدام كحصة من الأرصدة المشمولة في الترخيص. ما فوق 100% يعني أن المستخدم سحب من الرصيد المشترك.',
  Balance: 'الرصيد المتبقي',
  'Included credits minus usage. Negative means the user drew from the shared pool.':
    'الأرصدة المشمولة ناقص الاستخدام. القيمة السالبة تعني أن المستخدم سحب من الرصيد المشترك.',
  'Days with real use in the date range': 'الأيام التي فيها استخدام فعلي في النطاق الزمني',
  'Share of workdays with use since the user started': 'حصة أيام العمل التي فيها استخدام منذ بدء المستخدم',
  'Days since last use': 'الأيام منذ آخر استخدام',
  'Days between the last day with use and the end of the date range': 'الأيام بين آخر يوم فيه استخدام ونهاية النطاق الزمني',
  'Usage divided by active days': 'الاستخدام مقسومًا على أيام النشاط',
  'Share of usage on Auto model selection': 'حصة الاستخدام عبر اختيار النموذج عبر Auto',
  'Share of prompt tokens read from the cache, where text the model has seen before costs less':
    'حصة رموز الطلب المقروءة من الذاكرة المؤقتة، حيث يكلّف النص الذي رآه النموذج من قبل أقل',
  'The model with the most usage for this user': 'النموذج الأكثر استخدامًا لهذا المستخدم',
  '{model}: {share} of usage': '{model}: {share} من الاستخدام',
  'Usage in the last 7 days minus the 7 days before. Needs a range of at least 14 days.':
    'الاستخدام في آخر 7 أيام ناقص الأيام السبعة التي قبلها. يحتاج إلى نطاق من 14 يومًا على الأقل.',
  '{recent} in the last 7 days, {prior} in the 7 days before ({change})': '{recent} في آخر 7 أيام، و{prior} في الأيام السبعة التي قبلها ({change})',
  'Usage that could be avoided with the levers in this report. An estimate.': 'الاستخدام الذي يمكن تجنبه بأدوات التوفير في هذا التقرير. تقدير.',
  'Habits worth a look. Hover a badge to see what it means.': 'عادات تستحق النظر. مرّر المؤشر فوق شارة لترى معناها.',

  // License columns
  'Seat status': 'حالة الترخيص',
  'Recently active, fading (30 to 89 days), inactive (90 days or more), no recent activity date, or no seat in the license list':
    'نشط مؤخرًا، أو متراجع (30 إلى 89 يومًا)، أو غير نشط (90 يومًا أو أكثر)، أو بلا تاريخ نشاط حديث، أو بلا ترخيص في قائمة التراخيص',
  'Seat plan': 'خطة الترخيص',
  'The plan of the seat in the license list': 'خطة الترخيص في قائمة التراخيص',
  'The last day the license list shows activity for this seat': 'آخر يوم تُظهر فيه قائمة التراخيص نشاطًا لهذا الترخيص',
  'Days since last activity': 'الأيام منذ آخر نشاط',
  'Days from the last activity to the date of the license list': 'الأيام من آخر نشاط حتى تاريخ قائمة التراخيص',
  'The editor or place of the last activity, as the license list names it': 'المحرر أو المكان الذي جرى فيه آخر نشاط، كما تسمّيه قائمة التراخيص',
  'The day the seat was created': 'يوم إنشاء الترخيص',
  'The day a scheduled cancellation of the seat takes effect': 'اليوم الذي يسري فيه إلغاء مجدول للترخيص',

  // Ranking measures
  'Usage and credits': 'الاستخدام والأرصدة',
  'Users with less than {amount} of usage are left out.': 'يُستبعد المستخدمون الذين استخدامهم أقل من {amount}.',
  'Nobody has at least {amount} of usage in this range.': 'لا أحد لديه {amount} على الأقل من الاستخدام في هذا النطاق.',
  'The file has no token columns.': 'لا يحتوي الملف على أعمدة الرموز.',
  'The file has no model names.': 'لا يحتوي الملف على أسماء النماذج.',
  'This file has no token columns, so users cannot be ranked by tokens.': 'لا يحتوي هذا الملف على أعمدة الرموز، لذلك لا يمكن ترتيب المستخدمين حسب الرموز.',
  'Everything the user used, before included credits.': 'كل ما استخدمه المستخدم، قبل الأرصدة المشمولة.',
  '{share} of all usage': '{share} من كل الاستخدام',
  'Users with no usage are left out.': 'يُستبعد المستخدمون الذين بلا استخدام.',
  'Nobody has usage in this range.': 'لا أحد لديه استخدام في هذا النطاق.',
  'Amount billed on top of licenses, after included credits.': 'المبلغ المدفوع الإضافي فوق التراخيص، بعد الأرصدة المشمولة.',
  'Users with nothing billed on top of their license are left out.': 'يُستبعد المستخدمون الذين ليس عليهم مدفوع إضافي فوق ترخيصهم.',
  'Nothing was billed on top of licenses in this range. Included credits covered all usage.':
    'لم يُدفع أي مبلغ إضافي فوق التراخيص في هذا النطاق. غطّت الأرصدة المشمولة كل الاستخدام.',
  'Usage as a share of the included credits of the license.': 'الاستخدام كحصة من الأرصدة المشمولة في الترخيص.',
  'Most used': 'الأكثر استخدامًا',
  'Least used': 'الأقل استخدامًا',
  'New users and users whose included credits are unknown are left out.': 'يُستبعد المستخدمون الجدد والمستخدمون الذين أرصدتهم المشمولة غير معروفة.',
  'Users whose included credits are unknown are left out.': 'يُستبعد المستخدمون الذين أرصدتهم المشمولة غير معروفة.',
  'This file does not say how many included credits each user has, so this cannot be calculated.':
    'لا يذكر هذا الملف عدد الأرصدة المشمولة لكل مستخدم، لذلك لا يمكن حساب هذا.',
  'Days with real use in the date range.': 'الأيام التي فيها استخدام فعلي في النطاق الزمني.',
  'Most days': 'أكثر الأيام',
  'Fewest days': 'أقل الأيام',
  'New users are left out.': 'يُستبعد المستخدمون الجدد.',
  'Nobody has active days in this range.': 'لا أحد لديه أيام نشاط في هذا النطاق.',
  'Usage divided by active days. High values mean heavy days.': 'الاستخدام مقسومًا على أيام النشاط. القيم المرتفعة تعني أيامًا كثيفة.',
  'Users with no active days are left out.': 'يُستبعد المستخدمون الذين بلا أيام نشاط.',
  'Usage that could be avoided with the levers in this report.': 'الاستخدام الذي يمكن تجنبه بأدوات التوفير في هذا التقرير.',
  'Users with no savings found are left out.': 'يُستبعد المستخدمون الذين لم يُعثر لهم على توفير.',
  'Usage in the last 7 days compared with the 7 days before.': 'الاستخدام في آخر 7 أيام مقارنةً بالأيام السبعة التي قبلها.',
  'Biggest rise': 'أكبر ارتفاع',
  'Biggest drop': 'أكبر انخفاض',
  'Users whose usage did not rise are left out.': 'يُستبعد المستخدمون الذين لم يرتفع استخدامهم.',
  'Users whose usage did not drop are left out.': 'يُستبعد المستخدمون الذين لم ينخفض استخدامهم.',
  'Nobody used more in the last 7 days than in the 7 days before.': 'لم يستخدم أحد في آخر 7 أيام أكثر من الأيام السبعة التي قبلها.',
  'Nobody used less in the last 7 days than in the 7 days before.': 'لم يستخدم أحد في آخر 7 أيام أقل من الأيام السبعة التي قبلها.',
  'The date range needs at least 14 days to compare the last 7 days with the 7 days before.':
    'يحتاج النطاق الزمني إلى 14 يومًا على الأقل لمقارنة آخر 7 أيام بالأيام السبعة التي قبلها.',
  'Input, cache read, cache write and output tokens together.': 'رموز الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها والإخراج معًا.',
  'Users with no tokens are left out.': 'يُستبعد المستخدمون الذين بلا رموز.',
  'Nobody has tokens in this range.': 'لا أحد لديه رموز في هذا النطاق.',
  'Tokens the models wrote back.': 'الرموز التي أعادتها النماذج.',
  'Users with no output tokens are left out.': 'يُستبعد المستخدمون الذين بلا رموز إخراج.',
  'Nobody has output tokens in this range.': 'لا أحد لديه رموز إخراج في هذا النطاق.',
  'Tokens sent to the models that were not served from the cache and not written to it.':
    'الرموز المرسلة إلى النماذج التي لم تُقدَّم من الذاكرة المؤقتة ولم تُكتب فيها.',
  'Users with no input tokens are left out.': 'يُستبعد المستخدمون الذين بلا رموز إدخال.',
  'Nobody has input tokens in this range.': 'لا أحد لديه رموز إدخال في هذا النطاق.',
  'Tokens served from the cache of the model, which costs less than sending them again.':
    'الرموز المقدَّمة من الذاكرة المؤقتة للنموذج، وهي أقل تكلفة من إرسالها مجددًا.',
  'Users with no cache read tokens are left out.': 'يُستبعد المستخدمون الذين بلا رموز قراءة من الذاكرة المؤقتة.',
  'Nobody has cache read tokens in this range.': 'لا أحد لديه رموز قراءة من الذاكرة المؤقتة في هذا النطاق.',
  'Tokens written to the cache of the model so that later requests can read them.': 'الرموز المكتوبة في الذاكرة المؤقتة للنموذج كي تقرأها الطلبات اللاحقة.',
  'Users with no cache write tokens are left out.': 'يُستبعد المستخدمون الذين بلا رموز كتابة في الذاكرة المؤقتة.',
  'Nobody has cache write tokens in this range.': 'لا أحد لديه رموز كتابة في الذاكرة المؤقتة في هذا النطاق.',
  'Share of the text sent to the model that was served from the cache. A higher rate is cheaper.':
    'حصة النص المرسل إلى النموذج التي قُدّمت من الذاكرة المؤقتة. كلما ارتفعت النسبة قلّت التكلفة.',
  'Users with less than {amount} of usage or no input tokens are left out.': 'يُستبعد المستخدمون الذين استخدامهم أقل من {amount} أو بلا رموز إدخال.',
  'This file has no token columns, so the cache hit rate cannot be calculated.':
    'لا يحتوي هذا الملف على أعمدة الرموز، لذلك لا يمكن حساب نسبة القراءة من الذاكرة المؤقتة.',
  'Share of usage that went through Auto. A low share means more models picked by hand.':
    'حصة الاستخدام التي مرّت عبر Auto. الحصة المنخفضة تعني نماذج مختارة يدويًا أكثر.',
  'This file has no model names, so the Auto share of usage cannot be calculated.': 'لا يحتوي هذا الملف على أسماء النماذج، لذلك لا يمكن حساب حصة Auto من الاستخدام.',
  'What the Auto discount took off the original price of the Auto usage of the user.': 'ما خصمه Auto من السعر الأصلي لاستخدام Auto للمستخدم.',
  '{rate} off an original price of {price}': 'خصم {rate} من سعر أصلي قدره {price}',
  'Users who received no Auto discount are left out.': 'يُستبعد المستخدمون الذين لم يحصلوا على خصم Auto.',
  'Nobody received an Auto discount in this range.': 'لم يحصل أحد على خصم Auto في هذا النطاق.',
  'This file has no model names, so the Auto discount cannot be calculated.': 'لا يحتوي هذا الملف على أسماء النماذج، لذلك لا يمكن حساب خصم Auto.',
  'What the Auto usage of the user would have cost at price-card rates, without the Auto discount.':
    'ما كان سيكلّفه استخدام Auto للمستخدم بأسعار بطاقة الأسعار، بلا خصم Auto.',
  '{billed} charged after a discount of {discount}': '{billed} محتسب بعد خصم قدره {discount}',
  'Users with no Auto usage are left out.': 'يُستبعد المستخدمون الذين بلا استخدام عبر Auto.',
  'Nobody has Auto usage in this range.': 'لا أحد لديه استخدام عبر Auto في هذا النطاق.',
  'This file has no model names, so the original price of Auto usage cannot be calculated.':
    'لا يحتوي هذا الملف على أسماء النماذج، لذلك لا يمكن حساب السعر الأصلي لاستخدام Auto.',
  'An estimate of the discount the user would have received on usage sent to models picked by hand, had it gone through Auto.':
    'تقدير للخصم الذي كان المستخدم سيحصل عليه على الاستخدام المرسل إلى نماذج مختارة يدويًا، لو مرّ عبر Auto.',
  '{amount} of hand-picked usage': '{amount} من الاستخدام المختار يدويًا',
  'Users with no hand-picked usage are left out.': 'يُستبعد المستخدمون الذين بلا استخدام مختار يدويًا.',
  'Nobody has hand-picked usage in this range.': 'لا أحد لديه استخدام مختار يدويًا في هذا النطاق.',
  'This file has no model names, so the discount missed on hand-picked usage cannot be calculated.':
    'لا يحتوي هذا الملف على أسماء النماذج، لذلك لا يمكن حساب الخصم الفائت على الاستخدام المختار يدويًا.',
  'Highest first': 'الأعلى أولًا',
  'Lowest first': 'الأدنى أولًا',

  // Concentration levels
  'Low concentration': 'تركّز منخفض',
  'Moderate concentration': 'تركّز متوسط',
  'High concentration': 'تركّز مرتفع',
  'Very high concentration': 'تركّز مرتفع جدًا',

  // Token columns
  'Prompt tokens that were not read from the cache': 'رموز الطلب التي لم تُقرأ من الذاكرة المؤقتة',
  'Text the model has seen before and reads again from the cache at a lower price': 'نص رآه النموذج من قبل ويقرؤه مجددًا من الذاكرة المؤقتة بسعر أقل',
  'Text stored in the cache so later requests can read it at a lower price': 'نص مخزّن في الذاكرة المؤقتة كي تقرأه الطلبات اللاحقة بسعر أقل',
  'Input cost': 'تكلفة الإدخال',
  'Usage on input tokens. An estimate: the usage of rows with token counts, split by token type with the price card.':
    'الاستخدام على رموز الإدخال. تقدير: استخدام الصفوف التي لها أعداد رموز، مقسّمًا حسب نوع الرمز ببطاقة الأسعار.',
  'Cache read cost': 'تكلفة القراءة من الذاكرة المؤقتة',
  'Usage on cache read tokens. An estimate: the usage of rows with token counts, split by token type with the price card.':
    'الاستخدام على رموز القراءة من الذاكرة المؤقتة. تقدير: استخدام الصفوف التي لها أعداد رموز، مقسّمًا حسب نوع الرمز ببطاقة الأسعار.',
  'Cache write cost': 'تكلفة الكتابة في الذاكرة المؤقتة',
  'Usage on cache write tokens. An estimate: the usage of rows with token counts, split by token type with the price card.':
    'الاستخدام على رموز الكتابة في الذاكرة المؤقتة. تقدير: استخدام الصفوف التي لها أعداد رموز، مقسّمًا حسب نوع الرمز ببطاقة الأسعار.',
  'Output cost': 'تكلفة الإخراج',
  'Share of the usage of the user that the cost by token type covers': 'حصة استخدام المستخدم التي تغطيها التكلفة حسب نوع الرمز',
  'Usage on output tokens. An estimate: the usage of rows with token counts, split by token type with the price card.':
    'الاستخدام على رموز الإخراج. تقدير: استخدام الصفوف التي لها أعداد رموز، مقسّمًا حسب نوع الرمز ببطاقة الأسعار.',
};

export default arabic;
