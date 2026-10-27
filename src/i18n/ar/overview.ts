import type { Dict, PluralEntry } from '../core';

const plural = (one: string, two: string, few: string, many: string, other: string): PluralEntry => ({ zero: other, one, two, few, many, other });

/** Arabic for the Overview page (`pages/OverviewPage.tsx`, `pages/overview/*`). */
const arabic: Dict = {
  // Page and headline
  'How much GitHub Copilot is used, what it costs, and what to do about it.': 'كم يُستخدم GitHub Copilot، وكم يكلّف، وما الذي يجب فعله.',
  'Worth watching': 'يستحق المتابعة',
  Healthy: 'جيد',
  'Review {n} recommendations': plural('راجع توصية واحدة', 'راجع توصيتين', 'راجع {n} توصيات', 'راجع {n} توصية', 'راجع {n} توصية'),

  // Pool notes
  'The file has no discount_amount or net_amount column, so included credits cannot be tracked. Load the full usage report to see how much of the pool was used and when it ran out.':
    'لا يحتوي الملف على العمود discount_amount أو net_amount، فلا يمكن تتبّع الأرصدة المشمولة. حمّل تقرير الاستخدام الكامل لترى كم استُخدم من الرصيد المشترك ومتى نفد.',
  'The file has no discount_amount, net_amount or total_monthly_quota column, so included credits cannot be sized or tracked. Load the full usage report to see how much of the pool was used and when it ran out.':
    'لا يحتوي الملف على العمود discount_amount أو net_amount أو total_monthly_quota، فلا يمكن تحديد حجم الأرصدة المشمولة ولا تتبّعها. حمّل تقرير الاستخدام الكامل لترى كم استُخدم من الرصيد المشترك ومتى نفد.',

  // KPI rows
  'Usage that went beyond the included credits. It is charged on top of the seat fees.': 'الاستخدام الذي تجاوز الأرصدة المشمولة. يُحاسَب عليه فوق رسوم التراخيص.',
  'cash per month, combined plan': 'نقدًا في الشهر، الخطة المجمّعة',
  'What the default levers (model right-sizing, Auto, caching, leaner context, caps) and the seat actions save together. Ideas that overlap are counted once. Open Recommendations to change the assumptions.':
    'ما توفره الإجراءات الافتراضية (اختيار النموذج المناسب، وAuto، والذاكرة المؤقتة، وسياق أخف، والحدود) مع إجراءات التراخيص معًا. الأفكار المتداخلة تُحسب مرة واحدة. افتح التوصيات لتغيير الافتراضات.',
  'Ran out in {k} of {n} months': plural('نفد في {k} من شهر واحد', 'نفد في {k} من شهرين', 'نفد في {k} من {n} أشهر', 'نفد في {k} من {n} شهرًا', 'نفد في {k} من {n} شهر'),
  'The pool never ran out': 'لم ينفد الرصيد المشترك أبدًا',
  'Not available for a filtered view': 'غير متاح في العرض المصفّى',
  'Pool size is unknown': 'حجم الرصيد المشترك غير معروف',
  'Share of the included credits that was used. A low value means you pay for credits nobody uses. At 100%, extra usage is billed.':
    'حصة الأرصدة المشمولة التي استُخدمت. القيمة المنخفضة تعني أنك تدفع مقابل أرصدة لا يستخدمها أحد. عند 100% يُحاسَب على الاستخدام الإضافي.',
  'Value of all AI credits used in this period (1 credit = $0.01), including usage that included credits paid for. Auto usage is shown after the Auto discount.':
    'قيمة كل أرصدة الذكاء الاصطناعي المستخدمة في هذه الفترة (رصيد واحد = $0.01)، بما فيها الاستخدام الذي غطته الأرصدة المشمولة. يظهر استخدام Auto بعد خصم Auto.',
  'Projected {month}': 'المتوقع في {month}',
  'month-end usage': 'الاستخدام في نهاية الشهر',
  '≈ {amount} billed': '≈ {amount} مدفوع إضافيًا',
  'Month-end estimate from the recent daily rate. The Usage and pool page shows the range.':
    'تقدير نهاية الشهر من المعدل اليومي الأخير. صفحة «الاستخدام والرصيد المشترك» تعرض النطاق.',
  'Average per month': 'المتوسط في الشهر',
  'usage per month': 'الاستخدام في الشهر',
  'Usage in the selected period, scaled to a month of 30.4 days.': 'الاستخدام في الفترة المحددة، محوّلًا إلى شهر من 30.4 يومًا.',
  'Usage paid for by the AI credits that come with each GitHub Copilot seat. They are shared across the organization and reset on the 1st of each month (UTC).':
    'الاستخدام الذي غطته أرصدة الذكاء الاصطناعي المرفقة بكل ترخيص GitHub Copilot. هذه الأرصدة مشتركة في المؤسسة كلها وتُعاد في اليوم الأول من كل شهر (UTC).',
  'Usage of the last 7 days of the period compared with the 7 days before.': 'استخدام آخر 7 أيام من الفترة مقارنة بالأيام السبعة التي قبلها.',
  '{amount} Auto discount received': 'خصم Auto المستلم {amount}',
  'No Auto discount in the report': 'لا يوجد خصم Auto في التقرير',
  'No usage went through Auto': 'لم يمر أي استخدام عبر Auto',
  'No model names in the data': 'لا توجد أسماء نماذج في البيانات',
  'Share of usage where GitHub Copilot picked the model. The Auto model selection card below shows the discount received and the original price.':
    'حصة الاستخدام التي اختار فيها GitHub Copilot النموذج. بطاقة اختيار النموذج التلقائي Auto أدناه تعرض الخصم المحقق والسعر الأصلي.',
  '{k} of {n} users': plural('{k} من مستخدم واحد', '{k} من مستخدمَين', '{k} من {n} مستخدمين', '{k} من {n} مستخدمًا', '{k} من {n} مستخدم'),
  'Share of all usage that comes from the heaviest tenth of users. When it is high, a few users decide the bill.':
    'حصة كل الاستخدام التي تأتي من العُشر الأكثر استخدامًا من المستخدمين. عندما تكون عالية، تحدد قلة من المستخدمين الفاتورة.',
  'usage per active user': 'الاستخدام لكل مستخدم نشط',
  'Average monthly usage of an active user. Compare it with the credits included in a seat ($19 Business, $39 Enterprise).':
    'متوسط الاستخدام الشهري لمستخدم نشط. قارنه بالأرصدة المشمولة في الترخيص ($19 في Business و$39 في Enterprise).',
  '{n} roster seats never used': plural(
    'ترخيص واحد في القائمة لم يُستخدم أبدًا',
    'ترخيصان في القائمة لم يُستخدما أبدًا',
    '{n} تراخيص في القائمة لم تُستخدم أبدًا',
    '{n} ترخيصًا في القائمة لم يُستخدم أبدًا',
    '{n} ترخيص في القائمة لم يُستخدم أبدًا',
  ),
  '{n} active on a typical day': '{n} نشطون في يوم عادي',
  'Users with usage in this period. Rows without a username (repository-level products) are not counted.':
    'المستخدمون الذين لهم استخدام في هذه الفترة. الصفوف التي ليس فيها اسم مستخدم (منتجات مستوى المستودع) لا تُحسب.',
  '{n} roster seats have no usage in the report': plural(
    'ترخيص واحد في القائمة بلا استخدام في التقرير',
    'ترخيصان في القائمة بلا استخدام في التقرير',
    '{n} تراخيص في القائمة بلا استخدام في التقرير',
    '{n} ترخيصًا في القائمة بلا استخدام في التقرير',
    '{n} ترخيص في القائمة بلا استخدام في التقرير',
  ),
  'Tokens: {read} cache read, {write} cache write': 'الرموز: {read} قراءة من الذاكرة المؤقتة، {write} كتابة في الذاكرة المؤقتة',
  'No token columns in the data': 'لا توجد أعمدة للرموز في البيانات',
  'Cache read tokens ÷ (input + cache read + cache write tokens). Cache read tokens are text the model has seen before and reads again at a lower price. Cache write tokens are text the model stores so it can read it again later.':
    'رموز القراءة من الذاكرة المؤقتة ÷ (رموز الإدخال + القراءة من الذاكرة المؤقتة + الكتابة في الذاكرة المؤقتة). رموز القراءة من الذاكرة المؤقتة نص رآه النموذج من قبل ويقرؤه مرة أخرى بسعر أقل. ورموز الكتابة في الذاكرة المؤقتة نص يخزّنه النموذج ليقرأه لاحقًا.',

  // Usage over time
  'Split by who pays: included credits or extra billing': 'التقسيم حسب من يدفع: الأرصدة المشمولة أو الفوترة الإضافية',
  'Powerful, Versatile and Lightweight models': 'النماذج القوية والمتعددة الاستخدامات والخفيفة',
  'Model vendor': 'مزوّد النموذج',
  'GitHub Copilot product or SKU family': 'منتج GitHub Copilot أو عائلة SKU',
  'All usage': 'كل الاستخدام',
  'Billed on top': 'مدفوع إضافيًا',

  // Pool card
  'They cannot be split for a filtered view. Remove the row and segment filters (the date range can stay) to see the pool.':
    'لا يمكن تقسيمها في العرض المصفّى. أزل عوامل تصفية الصفوف والشرائح (يمكن إبقاء النطاق الزمني) لترى الرصيد المشترك.',
  'Without the monthly quota of each user, the pool size is unknown. Add your roster or extra seats in Settings to see how much of the pool was used.':
    'بدون الحصة الشهرية لكل مستخدم يكون حجم الرصيد المشترك غير معروف. أضف قائمة التراخيص أو تراخيص إضافية في الإعدادات لترى كم استُخدم من الرصيد المشترك.',
  'Included credits covered {amount}, more than the seats in the file bring. Other seats, from files you have not loaded, share the same pool. Add them in Settings (roster or extra seats), or load every file of the billing entity, to see how much of the pool was used.':
    'غطّت الأرصدة المشمولة {amount}، وهذا أكثر مما توفره التراخيص في الملف. تراخيص أخرى، من ملفات لم تحمّلها، تشترك في الرصيد نفسه. أضفها في الإعدادات (قائمة التراخيص أو تراخيص إضافية)، أو حمّل كل ملفات كيان الفوترة، لترى كم استُخدم من الرصيد المشترك.',
  '{used} of {size}': '{used} من {size}',
  'Ran out on {date}. Usage after that day is billed.': 'نفد في {date}. الاستخدام بعد ذلك اليوم مدفوع إضافيًا.',
  '{amount} of included credits left.': 'تبقّى {amount} من الأرصدة المشمولة.',
  'Billed so far: {amount}': 'المدفوع إضافيًا حتى الآن: {amount}',
  'Month-end estimate: {usage} of usage, about {billed} billed.': 'تقدير نهاية الشهر: استخدام قدره {usage}، ونحو {billed} مدفوع إضافيًا.',
  'On track to run out around {date}.': 'في طريقه إلى النفاد نحو {date}.',
  'Budget: {billed} of {budget} used ({pct}).': 'الميزانية: استُخدم {billed} من {budget} ({pct}).',
  '* Counts only the seats that appear in the report. Add your roster in Settings for the real pool size.':
    '* يحسب فقط التراخيص التي تظهر في التقرير. أضف قائمة التراخيص في الإعدادات لمعرفة الحجم الحقيقي للرصيد المشترك.',
  '{month}, month in progress': '{month}، الشهر الجاري',
  'Shared across all seats': 'مشترك بين كل التراخيص',
  'Open usage and pool details': 'افتح تفاصيل الاستخدام والرصيد المشترك',

  // Recommendations
  'What to do next': 'ما الخطوة التالية',
  'Largest monthly value first. Open one to see the evidence, the steps and who is affected.': 'القيمة الشهرية الأكبر أولًا. افتح أيًا منها لترى الأدلة والخطوات ومن يتأثر.',
  'All {n} recommendations': plural('التوصية الوحيدة', 'التوصيتان', 'كل التوصيات الـ {n}', 'كل التوصيات الـ {n}', 'كل التوصيات الـ {n}'),
  'All recommendations': 'كل التوصيات',
  'Nothing needs action': 'لا شيء يحتاج إلى إجراء',
  'No recommendation crossed its threshold for the selected scope.': 'لم تتجاوز أي توصية حدّها في النطاق المحدد.',

  // Savings card
  'Reclaim {n} idle seats': plural(
    'استرد ترخيصًا واحدًا غير مستخدم',
    'استرد ترخيصين غير مستخدمين',
    'استرد {n} تراخيص غير مستخدمة',
    'استرد {n} ترخيصًا غير مستخدم',
    'استرد {n} ترخيص غير مستخدم',
  ),
  'Seats with almost no use and little activity.': 'تراخيص استخدامها شبه معدوم ونشاطها قليل.',
  'Move {n} users to Business': plural(
    'انقل مستخدمًا واحدًا إلى Business',
    'انقل مستخدمَين إلى Business',
    'انقل {n} مستخدمين إلى Business',
    'انقل {n} مستخدمًا إلى Business',
    'انقل {n} مستخدم إلى Business',
  ),
  'Enterprise users who never needed more than the Business credits.': 'مستخدمو Enterprise الذين لم يحتاجوا أبدًا إلى أكثر من أرصدة Business.',
  'Remove {n} unused roster seats': plural(
    'أزل ترخيصًا واحدًا غير مستخدم من القائمة',
    'أزل ترخيصين غير مستخدمين من القائمة',
    'أزل {n} تراخيص غير مستخدمة من القائمة',
    'أزل {n} ترخيصًا غير مستخدم من القائمة',
    'أزل {n} ترخيص غير مستخدم من القائمة',
  ),
  'Seats on your roster that never appear in the report.': 'تراخيص في قائمتك لا تظهر في التقرير أبدًا.',
  'Usage levers, per month': 'إجراءات الاستخدام، في الشهر',
  'Seat changes, per month': 'تغييرات التراخيص، في الشهر',
  'What the default usage levers save together': 'ما توفره إجراءات الاستخدام الافتراضية معًا',
  'Combined plan with the default levers and all seat actions': 'خطة مجمّعة بالإجراءات الافتراضية وكل إجراءات التراخيص',
  'Try your own assumptions in the simulator': 'جرّب افتراضاتك في المحاكي',
  'cash per month': 'نقدًا في الشهر',
  'From {from} to {to} per month ({pct} lower).': 'من {from} إلى {to} في الشهر (أقل بنسبة {pct}).',
  'Whether this saves cash depends on the pool, which cannot be split for a filtered view.':
    'هل يوفر هذا نقدًا؟ يعتمد ذلك على الرصيد المشترك، ولا يمكن تقسيمه في العرض المصفّى.',
  'Whether this saves cash depends on how much of it the included credits cover, which this file does not say.':
    'هل يوفر هذا نقدًا؟ يعتمد ذلك على ما تغطيه الأرصدة المشمولة منه، وهذا الملف لا يذكر ذلك.',
  'This view already has about {billed} per month billed on top of seats, so at least {floor} per month of it is cash.':
    'في هذا العرض نحو {billed} في الشهر مدفوعة إضافيًا فوق رسوم التراخيص، لذا فإن {floor} في الشهر منه على الأقل نقد.',
  'No lever has a measurable effect for this scope.': 'لا يوجد إجراء له أثر قابل للقياس في هذا النطاق.',
  'The lever bars add up to the total drop in usage, because each lever counts only the usage that the levers before it leave. They are usage, not cash. Using less saves cash only once usage is above the included credits, and removing seats makes the pool smaller.':
    'مجموع أعمدة الإجراءات يساوي الانخفاض الكلي في الاستخدام، لأن كل إجراء يحسب فقط الاستخدام الذي تتركه الإجراءات التي قبله. إنها استخدام وليست نقدًا. تقليل الاستخدام يوفر نقدًا فقط بعد أن يتجاوز الاستخدام الأرصدة المشمولة، وإزالة التراخيص تصغّر الرصيد المشترك.',

  // Persona, top users and tier cards
  'Who the users are': 'من هم المستخدمون',
  'Click a group to list its users': 'انقر على مجموعة لعرض مستخدميها',
  'Compare all segments': 'قارن كل الشرائح',
  '{persona} · {share} of usage · {used} of included credits': '{persona} · {share} من الاستخدام · {used} من الأرصدة المشمولة',
  'Top {n} users': plural('أعلى مستخدم', 'أعلى مستخدمَين', 'أعلى {n} مستخدمين', 'أعلى {n} مستخدمًا', 'أعلى {n} مستخدم'),
  'By usage. Click a bar to open the user': 'حسب الاستخدام. انقر على عمود لفتح المستخدم',
  'See every user': 'اعرض كل المستخدمين',
  'Powerful models have the highest token prices on the price card. Click a tier to filter':
    'النماذج القوية لها أعلى أسعار للرموز في قائمة الأسعار. انقر على فئة للتصفية',
  'Explore models': 'استكشف النماذج',

  // Auto model selection card
  'No quota': 'بلا حصة',
  'Custom ({n} credits)': 'مخصص ({n} رصيد)',
  '{share} of the Auto usage is measured from token counts. For the rest the discount is estimated with the discount rate of the plan.':
    '{share} من استخدام Auto مقيس من عدد الرموز. وللباقي يُقدَّر الخصم بمعدل الخصم للخطة.',
  '{rate} off an original price of {original}': 'خصم {rate} من سعر أصلي قدره {original}',
  'No usage went through Auto in this period.': 'لم يمر أي استخدام عبر Auto في هذه الفترة.',
  '{rate} ({basis})': '{rate} ({basis})',
  'A plan with at least $1 of measured Auto usage uses the rate measured in this report. Only plans without that use the Auto model discount from Settings ({rate}).':
    'الخطة التي فيها $1 على الأقل من استخدام Auto المقيس تستخدم المعدل المقيس في هذا التقرير. والخطط التي ليس فيها ذلك فقط تستخدم «خصم نموذج Auto» من الإعدادات ({rate}).',
  'The report has no Auto usage that can be measured, so every plan uses the Auto model discount from Settings ({rate}).':
    'ليس في التقرير استخدام Auto يمكن قياسه، فتستخدم كل خطة «خصم نموذج Auto» من الإعدادات ({rate}).',
  'Users by Auto use class': 'المستخدمون حسب فئة استخدام Auto',
  '{description} Click to list these users.': '{description} انقر لعرض هؤلاء المستخدمين.',
  'No users in this scope.': 'لا يوجد مستخدمون في هذا النطاق.',
  "Auto-first from {autoFirst} of a user's usage on Auto. Direct models below {lowAuto}. Change both in Settings.":
    '«يعتمد على Auto» من {autoFirst} من استخدام المستخدم عبر Auto. و«نماذج مباشرة» تحت {lowAuto}. غيّر الاثنين في الإعدادات.',
  'GitHub Copilot picks the model for each request. The report has no column for the Auto discount, so it is worked out from token counts and the price card.':
    'يختار GitHub Copilot النموذج لكل طلب. ليس في التقرير عمود لخصم Auto، فيُحسب من عدد الرموز وقائمة الأسعار.',
  'See Auto by plan and by model': 'اعرض Auto حسب الخطة وحسب النموذج',
  'Auto shows up in the model column as "Auto". Load the usage report with that column to see the Auto discount and who picks models by hand.':
    'يظهر Auto في عمود النموذج باسم "Auto". حمّل تقرير الاستخدام الذي فيه هذا العمود لترى خصم Auto ومن يختار النماذج يدويًا.',
};

export default arabic;
