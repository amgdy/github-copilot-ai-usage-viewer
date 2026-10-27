/** Arabic text for the Efficiency page and the habit changes (levers). */
import type { Dict, PluralEntry } from '../core';

const p = (one: string, two: string, few: string, many: string, other: string): PluralEntry => ({ zero: other, one, two, few, many, other });

const ar: Dict = {
  // Page
  'Are you getting the best value from each credit? Which habits waste credits, and what is it worth to change them?':
    'هل تحصل على أفضل قيمة من كل رصيد؟ ما العادات التي تهدر الأرصدة، وما قيمة تغييرها؟',

  // Habit changes (levers)
  'Right-size models': 'اختيار النموذج المناسب',
  'Move part of the usage on Powerful models (deep reasoning models) to Versatile models for everyday work.':
    'انقل جزءًا من الاستخدام على النماذج القوية (نماذج التفكير العميق) إلى النماذج متعددة الاستخدامات في العمل اليومي.',
  'Use Auto model selection': 'استخدام الاختيار التلقائي للنموذج (Auto)',
  'Let GitHub Copilot choose the model. It avoids using a bigger model than needed, and where the plan has an Auto discount the same work costs less.':
    'دع GitHub Copilot يختار النموذج. فهو يتجنب استخدام نموذج أكبر من اللازم، وحيث تتضمن الخطة خصمًا لـ Auto يكلف العمل نفسه أقل.',
  'Cache discipline': 'الاستفادة من الذاكرة المؤقتة',
  'Keep chats and models steady, so saved context is read again (cheap) instead of written again (costly).':
    'حافظ على المحادثة والنموذج نفسيهما، حتى يُقرأ السياق المحفوظ مرة أخرى (بتكلفة أقل) بدلًا من كتابته من جديد (بتكلفة أعلى).',
  'Leaner context': 'سياق أخف',
  'Start new chats more often, use /compact, keep instructions short, and turn on only the MCP tools you need.':
    'ابدأ محادثات جديدة أكثر، واستخدم ‎/compact، واجعل التعليمات قصيرة، وفعّل أدوات MCP التي تحتاجها فقط.',
  'Avoid long-context surcharges': 'تجنب رسوم السياق الطويل الإضافية',
  'Keep prompts under the long-context size of the model: split the work, summarize, and point to fewer files.':
    'اجعل الطلبات أصغر من حد السياق الطويل للنموذج: قسّم العمل، ولخّص، وأشر إلى ملفات أقل.',
  'Cap runaway users': 'وضع حد للمستخدمين المفرطين',
  'Set user budgets or GitHub Copilot CLI session limits for the heaviest users, and show them cheaper ways to work.':
    'حدد ميزانيات للمستخدمين أو حدودًا لجلسات GitHub Copilot CLI لأكثر المستخدمين استخدامًا، وأرشدهم إلى طرق عمل أقل تكلفة.',

  // Scorecard statuses and targets
  'Could be better': 'يمكن تحسينه',
  'Needs attention': 'يحتاج إلى اهتمام',
  '{healthy} or more ({fair} to {healthy} could be better)': '{healthy} أو أكثر (من {fair} إلى {healthy} يمكن تحسينه)',
  'under {healthy} ({healthy} to {fair} could be better)': 'أقل من {healthy} (من {healthy} إلى {fair} يمكن تحسينه)',
  'none (up to {share} of users could be better)': 'لا أحد (حتى {share} من المستخدمين يمكن تحسينه)',

  // Scorecard
  'Where the plan has an Auto discount, the same work costs less.': 'حيث تتضمن الخطة خصمًا لـ Auto، يكلف العمل نفسه أقل.',
  'This report shows no Auto discount, so any gain comes from a fitting model, not from a lower price.':
    'لا يظهر في هذا التقرير خصم لـ Auto، لذا تأتي أي فائدة من اختيار نموذج مناسب، لا من سعر أقل.',
  'In this report Auto usage received a {rate} discount from its original price. The rate is measured from the token counts of each plan.':
    'في هذا التقرير حصل استخدام Auto على خصم {rate} من سعره الأصلي. النسبة مقيسة من عدد الرموز في كل خطة.',
  'The Auto usage in this report could not be priced from token counts. Its discount of about {rate} comes from the setting Auto model discount.':
    'تعذّر تسعير استخدام Auto في هذا التقرير من عدد الرموز. خصمه البالغ نحو {rate} مأخوذ من الإعداد Auto model discount.',
  'In this report Auto usage received about a {rate} discount from its original price. Plans with Auto usage priced from token counts use their measured rate. The setting Auto model discount is used only for the other plans.':
    'في هذا التقرير حصل استخدام Auto على خصم يقارب {rate} من سعره الأصلي. الخطط التي سُعّر فيها استخدام Auto من عدد الرموز تستخدم النسبة المقيسة. ويُستخدم الإعداد Auto model discount للخطط الأخرى فقط.',
  'Auto picks a fitting model for each request.': 'يختار Auto نموذجًا مناسبًا لكل طلب.',
  'Needs a model column': 'يحتاج إلى عمود النموذج',
  'No usage in this scope': 'لا استخدام في هذا النطاق',
  'This report names no models, so the model mix cannot be measured.': 'لا يذكر هذا التقرير أسماء النماذج، لذا لا يمكن قياس مزيج النماذج.',
  'This report has no token columns, so the cache hit rate cannot be measured.':
    'لا يحتوي هذا التقرير على أعمدة الرموز، لذا لا يمكن قياس نسبة القراءة من الذاكرة المؤقتة.',
  'Cache read: {read} tokens. Cache write: {write} tokens. All prompt tokens: {prompt}.':
    'القراءة من الذاكرة المؤقتة: {read} رمز. الكتابة في الذاكرة المؤقتة: {write} رمز. كل رموز الطلبات: {prompt}.',
  'No prompt tokens in this scope': 'لا رموز طلبات في هذا النطاق',
  'This report has no token columns, so long-context surcharges cannot be measured.':
    'لا يحتوي هذا التقرير على أعمدة الرموز، لذا لا يمكن قياس رسوم السياق الطويل الإضافية.',
  'This report names no models, so long-context surcharges cannot be measured.':
    'لا يذكر هذا التقرير أسماء النماذج، لذا لا يمكن قياس رسوم السياق الطويل الإضافية.',
  'No usage could be priced from token counts, so long-context surcharges cannot be measured.':
    'تعذّر تسعير أي استخدام من عدد الرموز، لذا لا يمكن قياس رسوم السياق الطويل الإضافية.',
  '{premium} surcharge on {usage} usage': 'رسوم إضافية {premium} على استخدام {usage}',
  '{auto} of {usage} usage went through Auto': '{auto} من استخدام {usage} مرّ عبر Auto',
  'Make Auto the default in the model picker. Pick a model by hand only when a task needs it.':
    'اجعل Auto الخيار الافتراضي في قائمة النماذج. اختر نموذجًا يدويًا فقط عندما تحتاج المهمة إلى ذلك.',
  'Show {n} users with low Auto use': p(
    'عرض مستخدم واحد قليل الاستخدام لـ Auto',
    'عرض مستخدمَين قليلَي الاستخدام لـ Auto',
    'عرض {n} مستخدمين قليلي الاستخدام لـ Auto',
    'عرض {n} مستخدمًا قليلي الاستخدام لـ Auto',
    'عرض {n} مستخدم قليلي الاستخدام لـ Auto',
  ),
  'Open the Users page, filtered to people who rarely use Auto': 'افتح صفحة المستخدمين مع تصفية من نادرًا ما يستخدمون Auto',
  'Cache read tokens are text the model has seen before and reads again at a lower price. Cache write tokens store new text for later and cost more. A steady chat reads more from the cache than one that starts over.':
    'رموز القراءة من الذاكرة المؤقتة نص رآه النموذج من قبل ويقرؤه مرة أخرى بسعر أقل. رموز الكتابة في الذاكرة المؤقتة تحفظ نصًا جديدًا لاستخدامه لاحقًا وتكلف أكثر. المحادثة المستمرة تقرأ من الذاكرة المؤقتة أكثر من محادثة تبدأ من جديد.',
  'Stay in one chat and one model for each task. Avoid restarting chats or editing instructions in the middle of a task.':
    'ابقَ في محادثة واحدة ونموذج واحد لكل مهمة. تجنّب إعادة بدء المحادثات أو تعديل التعليمات في منتصف المهمة.',
  'Show {n} users with low cache reuse': p(
    'عرض مستخدم واحد قليل الاستفادة من الذاكرة المؤقتة',
    'عرض مستخدمَين قليلَي الاستفادة من الذاكرة المؤقتة',
    'عرض {n} مستخدمين قليلي الاستفادة من الذاكرة المؤقتة',
    'عرض {n} مستخدمًا قليلي الاستفادة من الذاكرة المؤقتة',
    'عرض {n} مستخدم قليلي الاستفادة من الذاكرة المؤقتة',
  ),
  'Open the Users page, filtered to people with a low cache hit rate': 'افتح صفحة المستخدمين مع تصفية من لديهم نسبة قراءة منخفضة من الذاكرة المؤقتة',
  'Powerful-tier share of usage': 'حصة النماذج القوية من الاستخدام',
  '{powerful} of {usage} usage ran on Powerful models': '{powerful} من استخدام {usage} كان على النماذج القوية',
  'Powerful models cost the most per request. Most everyday tasks do not need them.': 'النماذج القوية هي الأغلى لكل طلب. ومعظم المهام اليومية لا تحتاج إليها.',
  'Use Versatile or Lightweight models for routine work. Keep Powerful models for hard problems.':
    'استخدم النماذج متعددة الاستخدامات أو الخفيفة للعمل الروتيني. واترك النماذج القوية للمشكلات الصعبة.',
  'Show {n} users on mostly Powerful models': p(
    'عرض مستخدم واحد يعتمد غالبًا على النماذج القوية',
    'عرض مستخدمَين يعتمدان غالبًا على النماذج القوية',
    'عرض {n} مستخدمين يعتمدون غالبًا على النماذج القوية',
    'عرض {n} مستخدمًا يعتمدون غالبًا على النماذج القوية',
    'عرض {n} مستخدم يعتمدون غالبًا على النماذج القوية',
  ),
  'Open the Users page, filtered to people who put most of their usage on Powerful models':
    'افتح صفحة المستخدمين مع تصفية من يضعون معظم استخدامهم على النماذج القوية',
  'Prompts above the size limit of a model are charged at a higher rate. Very long prompts add a surcharge.':
    'الطلبات التي تتجاوز حد الحجم للنموذج تُحتسب بسعر أعلى. الطلبات الطويلة جدًا تضيف رسومًا إضافية.',
  'Point to fewer files, summarize long chats, split big tasks and use /compact often.':
    'أشر إلى ملفات أقل، ولخّص المحادثات الطويلة، وقسّم المهام الكبيرة، واستخدم ‎/compact كثيرًا.',
  'Show {n} users with long-context surcharges': p(
    'عرض مستخدم واحد عليه رسوم السياق الطويل',
    'عرض مستخدمَين عليهما رسوم السياق الطويل',
    'عرض {n} مستخدمين عليهم رسوم السياق الطويل',
    'عرض {n} مستخدمًا عليهم رسوم السياق الطويل',
    'عرض {n} مستخدم عليهم رسوم السياق الطويل',
  ),
  'Open the Users page, filtered to people with long-context surcharges': 'افتح صفحة المستخدمين مع تصفية من عليهم رسوم السياق الطويل',
  'Users in the runaway tier': 'المستخدمون في المستوى المفرط',
  '{share} of {n} users': p('{share} من مستخدم واحد', '{share} من مستخدمَين', '{share} من {n} مستخدمين', '{share} من {n} مستخدمًا', '{share} من {n} مستخدم'),
  'One user far beyond their own included credits can use up the shared pool for everybody.':
    'مستخدم واحد يتجاوز أرصدته المشمولة بكثير يمكن أن يستهلك الرصيد المشترك للجميع.',
  'Look at how they work. Move routine work to lighter models and think about a user budget.':
    'راجع طريقة عملهم. انقل العمل الروتيني إلى نماذج أخف، وفكّر في ميزانية للمستخدم.',
  'Show {n} users in the runaway tier': p(
    'عرض مستخدم واحد في المستوى المفرط',
    'عرض مستخدمَين في المستوى المفرط',
    'عرض {n} مستخدمين في المستوى المفرط',
    'عرض {n} مستخدمًا في المستوى المفرط',
    'عرض {n} مستخدم في المستوى المفرط',
  ),
  'Open the Users page, filtered to the runaway tier': 'افتح صفحة المستخدمين مع تصفية المستوى المفرط',
  'Active use': 'الاستخدام النشط',
  'Daily or regular users: {active} of {n}': 'المستخدمون اليوميون أو المنتظمون: {active} من {n}',
  'A seat pays off only when it is used often. Daily users get the most from their included credits.':
    'لا يستحق الترخيص تكلفته إلا عند استخدامه كثيرًا. المستخدمون اليوميون يحصلون على أكبر فائدة من أرصدتهم المشمولة.',
  'Run a short training for occasional users. Give seats that stay quiet to someone else.':
    'نظّم تدريبًا قصيرًا للمستخدمين غير المنتظمين. وأعطِ التراخيص غير المستخدمة لشخص آخر.',
  'Show {n} occasional or rare users': p(
    'عرض مستخدم واحد غير منتظم أو نادر',
    'عرض مستخدمَين غير منتظمَين أو نادرَين',
    'عرض {n} مستخدمين غير منتظمين أو نادرين',
    'عرض {n} مستخدمًا غير منتظمين أو نادرين',
    'عرض {n} مستخدم غير منتظمين أو نادرين',
  ),
  'Open the Users page, filtered to people who use GitHub Copilot only now and then': 'افتح صفحة المستخدمين مع تصفية من يستخدمون GitHub Copilot من حين لآخر فقط',
  'Not measured': 'غير مقيس',
  'Target: {target}': 'الهدف: {target}',
  'Why it matters:': 'لماذا يهم:',
  'What to do:': 'ما العمل:',
  'Best-practice scorecard': 'بطاقة أفضل الممارسات',
  'Six habits that decide how far your credits go. The targets are guidance, not rules.': 'ست عادات تحدد إلى أي مدى تكفي أرصدتك. الأهداف إرشادية وليست قواعد.',
  'Green means healthy, amber means it could be better and red needs attention. Shares are measured on the usage in the selected period.':
    'الأخضر يعني جيد، والكهرماني يعني يمكن تحسينه، والأحمر يحتاج إلى اهتمام. الحصص مقيسة على الاستخدام في الفترة المحددة.',
  '{healthy} of {total} checks are healthy': '{healthy} من {total} فحوصات جيدة',
  '{n} checks could not be measured for this data.': p(
    'تعذّر قياس فحص واحد لهذه البيانات.',
    'تعذّر قياس فحصين لهذه البيانات.',
    'تعذّر قياس {n} فحوصات لهذه البيانات.',
    'تعذّر قياس {n} فحصًا لهذه البيانات.',
    'تعذّر قياس {n} فحص لهذه البيانات.',
  ),

  // What changing habits is worth
  'Combined effect': 'الأثر المجمّع',
  '{amount} less usage per month': 'استخدام أقل بمقدار {amount} شهريًا',
  'All habit changes together, applied in the order shown.': 'كل تغييرات العادات معًا، مطبّقة بالترتيب المعروض.',
  '{amount} per month, after the steps above': '{amount} شهريًا، بعد الخطوات السابقة',
  'On its own: {amount} per month': 'وحده: {amount} شهريًا',
  'Needs the whole pool': 'يحتاج إلى الرصيد المشترك كاملًا',
  'No billing month in this data': 'لا يوجد شهر فوترة في هذه البيانات',
  'What changing habits is worth': 'قيمة تغيير العادات',
  'The default habit changes from the simulator, with their combined effect on usage and on cash.':
    'تغييرات العادات الافتراضية من المحاكي، مع أثرها المجمّع على الاستخدام وعلى المبالغ المدفوعة.',
  'Cash savings need the whole pool': 'التوفير النقدي يحتاج إلى الرصيد المشترك كاملًا',
  'Included credits are shared by everyone and cannot be split by a filter, so the cash saving and the unused credits are hidden. The usage reduction below is still valid for the selected rows.':
    'الأرصدة المشمولة مشتركة بين الجميع ولا يمكن تقسيمها بعامل تصفية، لذا أُخفي التوفير النقدي والأرصدة غير المستخدمة. أما خفض الاستخدام أدناه فما زال صحيحًا للصفوف المحددة.',
  'Cash saving per month': 'التوفير النقدي شهريًا',
  'or {amount} with the seat changes too': 'أو {amount} مع تغييرات التراخيص أيضًا',
  'From usage habits alone': 'من عادات الاستخدام وحدها',
  'The part of the usage reduction that would lower the bill. Included credits are pooled and cover usage up to the pool, so only usage above the pool turns into cash. Seat changes are not included.':
    'الجزء من خفض الاستخدام الذي يقلل الفاتورة. الأرصدة المشمولة مشتركة وتغطي الاستخدام حتى حد الرصيد المشترك، لذا لا يتحول إلى مبلغ نقدي إلا الاستخدام الذي يتجاوزه. تغييرات التراخيص غير مشمولة.',
  'Usage reduction': 'خفض الاستخدام',
  '≈ {amount} less usage per month': '≈ استخدام أقل بمقدار {amount} شهريًا',
  'How much less usage the default habit changes would produce. Overlapping habits are applied one after another, so nothing is counted twice.':
    'مقدار خفض الاستخدام الذي تحققه تغييرات العادات الافتراضية. العادات المتداخلة تُطبّق واحدة بعد الأخرى، فلا يُحتسب شيء مرتين.',
  'Unused included credits today': 'الأرصدة المشمولة غير المستخدمة اليوم',
  'per month, paid for but not used': 'شهريًا، مدفوعة لكنها غير مستخدمة',
  'Included credits that the seats pay for but nobody used, on average per month. Unused credits are lost at the end of the month.':
    'الأرصدة المشمولة التي تدفعها التراخيص ولم يستخدمها أحد، في المتوسط شهريًا. تضيع الأرصدة غير المستخدمة في نهاية الشهر.',
  'Unused after the change': 'غير المستخدم بعد التغيير',
  '{amount} more than today': '{amount} أكثر من اليوم',
  'About the same as today': 'تقريبًا مثل اليوم',
  'Unused included credits per month after the habit changes. When usage drops but the number of seats stays the same, more of the pool goes unused.':
    'الأرصدة المشمولة غير المستخدمة شهريًا بعد تغيير العادات. عندما ينخفض الاستخدام ويبقى عدد التراخيص كما هو، يبقى جزء أكبر من الرصيد المشترك دون استخدام.',
  'Where the saving comes from': 'من أين يأتي التوفير',
  'Usage saved per month. The habits overlap, so they are applied in this order. Each bar is the extra saving after the ones above it, and the last bar is the combined effect.':
    'الاستخدام الموفّر شهريًا. العادات متداخلة، لذا تُطبّق بهذا الترتيب. كل عمود هو التوفير الإضافي بعد الأعمدة التي فوقه، والعمود الأخير هو الأثر المجمّع.',
  'Usage saved per month by each habit change, in order, and the combined effect': 'الاستخدام الموفّر شهريًا لكل تغيير في العادات بالترتيب، والأثر المجمّع',
  'No habit change has a measurable effect on this data': 'لا يوجد تغيير في العادات له أثر قابل للقياس في هذه البيانات',
  'Why cash can be smaller than the credit saving': 'لماذا قد يكون التوفير النقدي أقل من توفير الأرصدة',
  '* Counts only the seats that appear in the report.': '* يحتسب فقط التراخيص الظاهرة في التقرير.',
  'Some months used more included credits than these seats provide, so the real pool is larger than the file shows. The smallest pool that fits the data is used.':
    'في بعض الأشهر استُخدمت أرصدة مشمولة أكثر مما توفره هذه التراخيص، لذا فالرصيد المشترك الفعلي أكبر مما يظهره الملف. يُستخدم أصغر رصيد مشترك يتوافق مع البيانات.',
  'Included credits are pooled across all seats. They reset every month, and credits that nobody uses are lost. Using less saves cash only in months when usage goes beyond the pool.':
    'الأرصدة المشمولة مشتركة بين كل التراخيص. تُعاد كل شهر، والأرصدة التي لا يستخدمها أحد تضيع. خفض الاستخدام يوفر مالًا فقط في الأشهر التي يتجاوز فيها الاستخدام الرصيد المشترك.',
  'In this data, {usage} less usage per month turns into about {cash} less cash per month.':
    'في هذه البيانات، يتحول خفض الاستخدام بمقدار {usage} شهريًا إلى توفير نقدي يقارب {cash} شهريًا.',
  'To turn unused credits into cash, the number of seats has to come down as well. The simulator shows both effects together.':
    'لتحويل الأرصدة غير المستخدمة إلى توفير نقدي، يجب خفض عدد التراخيص أيضًا. يعرض المحاكي الأثرين معًا.',
  'Open the simulator': 'افتح المحاكي',

  // Token economics and cache
  'Group by': 'التجميع حسب',
  'Cache hit rate: {rate}': 'نسبة القراءة من الذاكرة المؤقتة: {rate}',
  '{rate} cache hit rate': 'نسبة القراءة من الذاكرة المؤقتة {rate}',
  'Cache hit rate {rate}': 'نسبة القراءة من الذاكرة المؤقتة {rate}',
  'Cache read: {read} tokens, about {readCost}. Cache write: {write} tokens, about {writeCost}.':
    'القراءة من الذاكرة المؤقتة: {read} رمز، نحو {readCost}. الكتابة في الذاكرة المؤقتة: {write} رمز، نحو {writeCost}.',
  'Cache read: {read} tokens. Cache write: {write} tokens.': 'القراءة من الذاكرة المؤقتة: {read} رمز. الكتابة في الذاكرة المؤقتة: {write} رمز.',
  'No prompt tokens': 'لا رموز طلبات',
  '{n} prompt tokens': '{n} رمز في الطلبات',
  'Low cache line {rate}': 'حد الذاكرة المؤقتة المنخفض {rate}',
  'Cache hit rate over time': 'نسبة القراءة من الذاكرة المؤقتة عبر الزمن',
  'Share of prompt tokens read from the cache. Higher is better. The dashed line is the low cache flag from Settings.':
    'حصة رموز الطلبات المقروءة من الذاكرة المؤقتة. الأعلى أفضل. الخط المتقطع هو حد الذاكرة المؤقتة المنخفض من الإعدادات.',
  'Cache hit rate per period with the low cache line': 'نسبة القراءة من الذاكرة المؤقتة لكل فترة مع خط الحد المنخفض',
  'No prompt tokens in this period': 'لا رموز طلبات في هذه الفترة',
  'Overall in this period: {rate}. Periods without prompt tokens are left blank.': 'الإجمالي في هذه الفترة: {rate}. الفترات التي لا تحتوي على رموز طلبات تُترك فارغة.',
  'Red bars are below {limit}.': p(
    'العمود الأحمر أقل من {limit}.',
    'العمودان الأحمران أقل من {limit}.',
    'الأعمدة الحمراء أقل من {limit}.',
    'الأعمدة الحمراء أقل من {limit}.',
    'الأعمدة الحمراء أقل من {limit}.',
  ),
  'Users by cache hit rate': 'المستخدمون حسب نسبة القراءة من الذاكرة المؤقتة',
  'Green bars are {healthy} or more. The low cache flag is {low}.': 'الأعمدة الخضراء {healthy} أو أكثر. حد الذاكرة المؤقتة المنخفض هو {low}.',
  'Number of users in each cache hit rate range': 'عدد المستخدمين في كل نطاق من نسبة القراءة من الذاكرة المؤقتة',
  'No users with prompt tokens in this selection': 'لا مستخدمين لديهم رموز طلبات في هذا التحديد',
  'Show users with low cache reuse': 'عرض المستخدمين قليلي الاستفادة من الذاكرة المؤقتة',
  '{n} users without prompt tokens are not shown': p(
    'لا يظهر مستخدم واحد ليس لديه رموز طلبات',
    'لا يظهر مستخدمان ليس لديهما رموز طلبات',
    'لا يظهر {n} مستخدمين ليس لديهم رموز طلبات',
    'لا يظهر {n} مستخدمًا ليس لديهم رموز طلبات',
    'لا يظهر {n} مستخدم ليس لديهم رموز طلبات',
  ),
  'Heavy users with the lowest cache hit rate': 'كثيفو الاستخدام ذوو أدنى نسبة قراءة من الذاكرة المؤقتة',
  'Users with at least {amount} of usage. Open one to see their profile and tips.': 'المستخدمون الذين بلغ استخدامهم {amount} على الأقل. افتح أحدهم لترى ملفه ونصائحه.',
  'No heavy users with prompt tokens': 'لا مستخدمين كثيفي الاستخدام لديهم رموز طلبات',
  'Nobody reached {amount} of usage with prompt tokens in this selection.': 'لم يصل أحد إلى استخدام {amount} مع رموز طلبات في هذا التحديد.',
  'No heavy user is below the {rate} line': 'لا يوجد مستخدم كثيف الاستخدام أقل من حد {rate}',
  'These are the lowest hit rates among heavy users, so there is little to fix here.': 'هذه أدنى النسب بين كثيفي الاستخدام، لذا لا يوجد الكثير لإصلاحه هنا.',
  'Open the user profile': 'افتح ملف المستخدم',
  '{usage} usage, the cache could save about {saving} per month': 'الاستخدام: {usage}، ويمكن أن توفر الذاكرة المؤقتة نحو {saving} شهريًا',
  'Tip:': 'نصيحة:',
  'Tokens: {tokens} ({share})': 'الرموز: {tokens} ({share})',
  'Estimated cost: {cost} ({share})': 'التكلفة التقديرية: {cost} ({share})',
  'Estimated cost': 'التكلفة التقديرية',
  'Cache reads are {tokens} of the tokens but only {cost} of the estimated cost.':
    'القراءة من الذاكرة المؤقتة تمثل {tokens} من الرموز لكن {cost} فقط من التكلفة التقديرية.',
  'No tokens were read from the cache, so every prompt token was priced as input or cache write.':
    'لم يُقرأ أي رمز من الذاكرة المؤقتة، لذا سُعّر كل رمز في الطلبات كإدخال أو كتابة في الذاكرة المؤقتة.',
  'Output is {tokens} of the tokens and {cost} of the cost.': 'الإخراج يمثل {tokens} من الرموز و{cost} من التكلفة.',
  'Tokens and cost by token type': 'الرموز والتكلفة حسب نوع الرمز',
  'The share of each token type next to the share of the estimated cost': 'حصة كل نوع من الرموز بجانب حصته من التكلفة التقديرية',
  'Estimated: each token type is priced at the standard rate of its model on the price card, then scaled to match the usage amount in the report.':
    'تقدير: يُسعّر كل نوع من الرموز بالسعر القياسي لنموذجه في قائمة الأسعار، ثم يُعدّل ليطابق مبلغ الاستخدام في التقرير.',
  'Only usage that could be priced from token counts is included ({share} of all usage), so the token counts here can be lower than the totals elsewhere.':
    'يشمل فقط الاستخدام الذي أمكن تسعيره من عدد الرموز ({share} من كل الاستخدام)، لذا قد تكون أعداد الرموز هنا أقل من الإجماليات في أماكن أخرى.',
  'It will not match the invoice to the cent.': 'لن يطابق الفاتورة بدقة تامة.',
  'Share of tokens and share of estimated cost by token type': 'حصة الرموز وحصة التكلفة التقديرية حسب نوع الرمز',
  'No model in this selection has a known price, so the cost split cannot be estimated.': 'لا يوجد نموذج بسعر معروف في هذا التحديد، لذا لا يمكن تقدير توزيع التكلفة.',
  'Token type': 'نوع الرمز',
  'Share of tokens': 'حصة الرموز',
  'Share of cost': 'حصة التكلفة',
  'Cost per 1M tokens': 'التكلفة لكل مليون رمز',
  'Token economics': 'اقتصاديات الرموز',
  'How tokens turn into cost, and how well prompts are read from the cache.': 'كيف تتحول الرموز إلى تكلفة، ومدى قراءة الطلبات من الذاكرة المؤقتة.',
  'No tokens in the selected rows': 'لا رموز في الصفوف المحددة',
  'This report has no token columns': 'لا يحتوي هذا التقرير على أعمدة الرموز',
  'The rows in this selection have no token counts, so the token mix, cost split and cache hit rate cannot be shown. Widen the filters to bring them back.':
    'لا تحتوي الصفوف في هذا التحديد على أعداد الرموز، لذا لا يمكن عرض مزيج الرموز وتوزيع التكلفة ونسبة القراءة من الذاكرة المؤقتة. وسّع عوامل التصفية لإظهارها.',
  'The token mix, the estimated cost split and the cache hit rate need the token columns of the detailed usage export. Download the report with token details to see this section.':
    'يحتاج مزيج الرموز وتوزيع التكلفة التقديرية ونسبة القراءة من الذاكرة المؤقتة إلى أعمدة الرموز في تصدير الاستخدام المفصل. نزّل التقرير مع تفاصيل الرموز لترى هذا القسم.',
  '{lo} to {hi}%': 'من {lo} إلى {hi}%',

  // Cost per active day
  'Usage divided by the days a user was active. It shows how intense a working day is, not just how much a user used in total.':
    'الاستخدام مقسومًا على أيام نشاط المستخدم. يوضح مدى كثافة يوم العمل، لا إجمالي ما استخدمه المستخدم فقط.',
  'Based on {n} users with at least one active day.': p(
    'بناءً على مستخدم واحد لديه يوم نشاط واحد على الأقل.',
    'بناءً على مستخدمَين لديهما يوم نشاط واحد على الأقل.',
    'بناءً على {n} مستخدمين لديهم يوم نشاط واحد على الأقل.',
    'بناءً على {n} مستخدمًا لديهم يوم نشاط واحد على الأقل.',
    'بناءً على {n} مستخدم لديهم يوم نشاط واحد على الأقل.',
  ),
  'Cost per active day': 'التكلفة لكل يوم نشاط',
  'No user has an active day in this selection': 'لا يوجد مستخدم لديه يوم نشاط في هذا التحديد',
  'Cost per active day needs at least one day on which a named user reached the active-day threshold in Settings.':
    'تحتاج التكلفة لكل يوم نشاط إلى يوم واحد على الأقل وصل فيه مستخدم معروف إلى حد يوم النشاط في الإعدادات.',
  'Median cost per active day': 'وسيط التكلفة لكل يوم نشاط',
  'half of users are below this': 'نصف المستخدمين أقل من هذا',
  'The typical cost of a day on which a user works with GitHub Copilot.': 'التكلفة المعتادة ليوم يعمل فيه المستخدم مع GitHub Copilot.',
  '75th percentile cost per active day': 'المئين 75 للتكلفة لكل يوم نشاط',
  'one user in four is above this': 'مستخدم من كل أربعة أعلى من هذا',
  '90th percentile cost per active day': 'المئين 90 للتكلفة لكل يوم نشاط',
  'one user in ten is above this': 'مستخدم من كل عشرة أعلى من هذا',
  'Highest cost per active day': 'أعلى تكلفة لكل يوم نشاط',
  'The highest cost per active day of any one user. Amber when it is more than 5 times the median.': 'أعلى تكلفة لكل يوم نشاط لدى أي مستخدم. تظهر بالكهرماني عندما تزيد على 5 أضعاف الوسيط.',
  'Users with the highest cost per active day': 'المستخدمون ذوو أعلى تكلفة لكل يوم نشاط',
  'Up to 10 users, with what drives the cost. Click a user to open their profile.': 'حتى 10 مستخدمين، مع ما يرفع التكلفة. انقر على مستخدم لفتح ملفه.',
  'Chips in amber mark a driver below the thresholds in Settings: little Auto use or a low cache hit rate.':
    'الشارات بالكهرماني تشير إلى عامل أقل من الحدود في الإعدادات: استخدام قليل لـ Auto أو نسبة قراءة منخفضة من الذاكرة المؤقتة.',
  'Model with the most usage': 'النموذج الأكثر استخدامًا',
  'Share of usage that went through Auto': 'حصة الاستخدام التي مرّت عبر Auto',
  'Auto share {share}': 'حصة Auto {share}',
  'Share of prompt tokens read from the cache': 'حصة رموز الطلبات المقروءة من الذاكرة المؤقتة',
  'Days on which usage reached the active-day threshold in Settings': 'الأيام التي وصل فيها الاستخدام إلى حد يوم النشاط في الإعدادات',
  '{times} the median': '{times} الوسيط',
  'per day': 'لكل يوم',

  // Included credits used
  '{usage} usage ({share} of the total)': 'الاستخدام: {usage} ({share} من الإجمالي)',
  'How much of their own included credits each user uses. The credits are pooled, so both under-use and over-use have a price.':
    'مقدار ما يستخدمه كل مستخدم من أرصدته المشمولة. الأرصدة مشتركة، لذا لكل من قلة الاستخدام وزيادته ثمن.',
  'Included credits are not in this report': 'الأرصدة المشمولة غير موجودة في هذا التقرير',
  'The report has no plan quota for these users, so their use cannot be compared with included credits.':
    'لا يحتوي التقرير على حصة الخطة لهؤلاء المستخدمين، لذا لا يمكن مقارنة استخدامهم بالأرصدة المشمولة.',
  'Users by share of included credits used': 'المستخدمون حسب نسبة استخدام الأرصدة المشمولة',
  'Each bar is a tier. Click a bar to list its users.': 'كل عمود مستوى. انقر على عمود لعرض مستخدميه.',
  'Number of users in each included credit usage tier': 'عدد المستخدمين في كل مستوى من استخدام الأرصدة المشمولة',
  'Click to list these users.': 'انقر لعرض هؤلاء المستخدمين.',
  '{usage}, {share} of usage': '{usage}، {share} من الاستخدام',
  'The report has no plan quota for any user, so {amount} of included credits per month is assumed for each of them.':
    'لا يحتوي التقرير على حصة الخطة لأي مستخدم، لذا يُفترض {amount} من الأرصدة المشمولة شهريًا لكل منهم.',
  '{n} users have no plan quota in the report, so {amount} of included credits per month is assumed for each of them.': p(
    'مستخدم واحد ليس له حصة خطة في التقرير، لذا يُفترض له {amount} من الأرصدة المشمولة شهريًا.',
    'مستخدمان ليس لهما حصة خطة في التقرير، لذا يُفترض {amount} من الأرصدة المشمولة شهريًا لكل منهما.',
    '{n} مستخدمين ليس لهم حصة خطة في التقرير، لذا يُفترض {amount} من الأرصدة المشمولة شهريًا لكل منهم.',
    '{n} مستخدمًا ليس لهم حصة خطة في التقرير، لذا يُفترض {amount} من الأرصدة المشمولة شهريًا لكل منهم.',
    '{n} مستخدم ليس لهم حصة خطة في التقرير، لذا يُفترض {amount} من الأرصدة المشمولة شهريًا لكل منهم.',
  ),
  'What under-use and over-use mean': 'ماذا تعني قلة الاستخدام وزيادته',
  'Every seat includes credits. They are pooled across the organization and reset each month, so credits that nobody uses are lost.':
    'كل ترخيص يتضمن أرصدة. وهي مشتركة على مستوى المؤسسة وتُعاد كل شهر، لذا تضيع الأرصدة التي لا يستخدمها أحد.',
  'Under-use': 'قلة الاستخدام',
  '{n} users use less than {limit} of their included credits.': p(
    'مستخدم واحد يستخدم أقل من {limit} من أرصدته المشمولة.',
    'مستخدمان يستخدمان أقل من {limit} من أرصدتهما المشمولة.',
    '{n} مستخدمين يستخدمون أقل من {limit} من أرصدتهم المشمولة.',
    '{n} مستخدمًا يستخدمون أقل من {limit} من أرصدتهم المشمولة.',
    '{n} مستخدم يستخدمون أقل من {limit} من أرصدتهم المشمولة.',
  ),
  'The unused part is paid for and lost at month end, so check that these seats are needed, or help the users get more out of them.':
    'الجزء غير المستخدم مدفوع ويضيع في نهاية الشهر، لذا تحقق من الحاجة إلى هذه التراخيص، أو ساعد المستخدمين على الاستفادة منها أكثر.',
  'Over-use': 'زيادة الاستخدام',
  '{n} users use at least {limit} of their own credits.': p(
    'مستخدم واحد يستخدم {limit} على الأقل من أرصدته.',
    'مستخدمان يستخدمان {limit} على الأقل من أرصدتهما.',
    '{n} مستخدمين يستخدمون {limit} على الأقل من أرصدتهم.',
    '{n} مستخدمًا يستخدمون {limit} على الأقل من أرصدتهم.',
    '{n} مستخدم يستخدمون {limit} على الأقل من أرصدتهم.',
  ),
  'That is fine while the pool lasts, because other users leave credits behind. When the pool is used up, the extra usage is billed on top of the seat fees.':
    'هذا مقبول ما دام الرصيد المشترك كافيًا، لأن مستخدمين آخرين يتركون أرصدة دون استخدام. وعندما ينفد الرصيد المشترك، يُفوتر الاستخدام الإضافي فوق رسوم التراخيص.',
  'In this period, {lenders} left {lent} unused, while {takers} used {taken} beyond their own credits.':
    'في هذه الفترة، ترك {lenders} مبلغ {lent} دون استخدام، بينما استخدم {takers} مبلغ {taken} فوق أرصدتهم.',

  // Biggest opportunities
  'Together they could avoid {amount} per month, {share} of what all {n} users with a saving could avoid. Click a bar to open the user.': p(
    'معًا يمكنهم تجنب {amount} شهريًا، أي {share} مما يمكن أن يتجنبه المستخدم الوحيد صاحب التوفير. انقر على عمود لفتح المستخدم.',
    'معًا يمكنهم تجنب {amount} شهريًا، أي {share} مما يمكن أن يتجنبه المستخدمان أصحاب التوفير. انقر على عمود لفتح المستخدم.',
    'معًا يمكنهم تجنب {amount} شهريًا، أي {share} مما يمكن أن يتجنبه كل المستخدمين أصحاب التوفير ({n}). انقر على عمود لفتح المستخدم.',
    'معًا يمكنهم تجنب {amount} شهريًا، أي {share} مما يمكن أن يتجنبه كل المستخدمين أصحاب التوفير ({n}). انقر على عمود لفتح المستخدم.',
    'معًا يمكنهم تجنب {amount} شهريًا، أي {share} مما يمكن أن يتجنبه كل المستخدمين أصحاب التوفير ({n}). انقر على عمود لفتح المستخدم.',
  ),
  'Together they could avoid {amount} per month. Click a bar to open the user.': 'معًا يمكنهم تجنب {amount} شهريًا. انقر على عمود لفتح المستخدم.',
  'Biggest opportunities': 'أكبر الفرص',
  'The users who could avoid the most usage by changing their habits, and which habit is worth the most for each. Amounts are usage per month, not cash.':
    'المستخدمون الذين يمكنهم تجنب أكبر قدر من الاستخدام بتغيير عاداتهم، وأي عادة لها أكبر قيمة لكل منهم. المبالغ استخدام شهري وليست مبالغ نقدية.',
  'Top {n} users by avoidable usage per month': p(
    'المستخدم الأول حسب الاستخدام الممكن تجنبه شهريًا',
    'أعلى مستخدمَين حسب الاستخدام الممكن تجنبه شهريًا',
    'أعلى {n} مستخدمين حسب الاستخدام الممكن تجنبه شهريًا',
    'أعلى {n} مستخدمًا حسب الاستخدام الممكن تجنبه شهريًا',
    'أعلى {n} مستخدم حسب الاستخدام الممكن تجنبه شهريًا',
  ),
  'Avoidable usage per month': 'الاستخدام الممكن تجنبه شهريًا',
  'Download a CSV with every user and the top action for each. The amounts cover the whole period, largest first.':
    'نزّل ملف CSV يضم كل مستخدم وأهم إجراء له. المبالغ تغطي الفترة كاملة، والأكبر أولًا.',
  'Download action list': 'تنزيل قائمة الإجراءات',
  'Avoidable usage per month for the ten users with the largest potential, split by habit': 'الاستخدام الممكن تجنبه شهريًا لأعلى عشرة مستخدمين، موزعًا حسب العادة',
  'No user has avoidable usage with the default habit changes': 'لا يوجد مستخدم لديه استخدام يمكن تجنبه بتغييرات العادات الافتراضية',

  // Habits that save credits
  'Habits for users and for admins': 'عادات للمستخدمين وللمسؤولين',
  'For users': 'للمستخدمين',
  'Habits every GitHub Copilot user can apply': 'عادات يمكن لكل مستخدم في GitHub Copilot تطبيقها',
  'For admins': 'للمسؤولين',
  'Controls for the people who manage GitHub Copilot': 'إعدادات تحكم لمن يديرون GitHub Copilot',
  'Saving of the "{lever}" lever on its own, from the usage in this report': 'توفير تغيير العادة «{lever}» وحده، من الاستخدام في هذا التقرير',
  '{amount} per month': '{amount} شهريًا',
  'The data in this report shows no saving for this lever': 'لا تُظهر بيانات هذا التقرير أي توفير لهذا التغيير',
  'No saving found': 'لم يُعثر على توفير',
  'Lever "{lever}"': 'تغيير العادة «{lever}»',
  ', shared with {n} other habits, so the amounts do not add up.': p(
    '، مشترك مع عادة أخرى، لذا لا تُجمع المبالغ.',
    '، مشترك مع عادتين أخريين، لذا لا تُجمع المبالغ.',
    '، مشترك مع {n} عادات أخرى، لذا لا تُجمع المبالغ.',
    '، مشترك مع {n} عادة أخرى، لذا لا تُجمع المبالغ.',
    '، مشترك مع {n} عادة أخرى، لذا لا تُجمع المبالغ.',
  ),
  'The report cannot measure the effect of this habit.': 'لا يستطيع التقرير قياس أثر هذه العادة.',
  'What to do': 'ما العمل',
  'Habits that save credits': 'عادات توفر الأرصدة',
  "Practical habits from GitHub's guidance, with what the matching lever is worth in your data. Habits with a saving are listed first.":
    'عادات عملية من إرشادات GitHub، مع قيمة تغيير العادة المقابل في بياناتك. تظهر العادات التي لها توفير أولًا.',
  Audience: 'الفئة',

  // Role models
  'Role models': 'قدوة',
  'Users who get a lot done per credit. They use GitHub Copilot regularly, use enough for the numbers to mean something, use Auto, and read most of their prompt from the cache where the report shows it.':
    'مستخدمون ينجزون الكثير لكل رصيد. يستخدمون GitHub Copilot بانتظام، وبقدر كافٍ لتكون الأرقام ذات معنى، ويستخدمون Auto، ويقرؤون معظم طلباتهم من الذاكرة المؤقتة حيث يظهر ذلك في التقرير.',
  '{usage} usage over {n} active days': p(
    'الاستخدام: {usage} خلال يوم نشاط واحد',
    'الاستخدام: {usage} خلال يومَي نشاط',
    'الاستخدام: {usage} خلال {n} أيام نشاط',
    'الاستخدام: {usage} خلال {n} يوم نشاط',
    'الاستخدام: {usage} خلال {n} يوم نشاط',
  ),
  "Efficiency score: the share of this user's usage that the default habit changes would not remove":
    'درجة الكفاءة: حصة استخدام هذا المستخدم التي لن تزيلها تغييرات العادات الافتراضية',
  'Efficiency score {score}': 'درجة الكفاءة {score}',
  'Powerful share': 'حصة النماذج القوية',
  'Open profile': 'فتح الملف',
  'Share what works': 'شارك ما ينجح',
  'Ask these users to show how they work, for example in a short demo, a written guide or a pairing session. A habit that a colleague has seen work is easier to adopt than a rule.':
    'اطلب من هؤلاء المستخدمين أن يعرضوا طريقة عملهم، مثلًا في عرض قصير أو دليل مكتوب أو جلسة عمل مشتركة. العادة التي رأى زميل نجاحها أسهل في التبني من القاعدة.',
  'Mid-tier and lighter models make up {share} of usage.': 'النماذج المتوسطة والأخف تمثل {share} من الاستخدام.',
  'Powerful models take only {share} of usage.': 'النماذج القوية تأخذ {share} فقط من الاستخدام.',
  'Auto handles {share} of usage.': 'يتولى Auto {share} من الاستخدام.',
  '{share} of prompt tokens are read from the cache.': '{share} من رموز الطلبات تُقرأ من الذاكرة المؤقتة.',
  'Long-context surcharges are close to zero.': 'رسوم السياق الطويل الإضافية قريبة من الصفر.',
  'Gets more done per credit than most users, with an efficiency score of {score} out of 100.': 'ينجز لكل رصيد أكثر من معظم المستخدمين، بدرجة كفاءة {score} من 100.',
};

export default ar;
