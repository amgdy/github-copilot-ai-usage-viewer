import type { Dict } from '../core';

/** Arabic text for the user groups: usage tiers, engagement, personas, usage profiles, Pareto classes, Auto use and traits. */
const arabic: Dict = {
  // Usage tiers
  'Minimal (under {minimal})': 'ضئيل (أقل من {minimal})',
  'Used less than {minimal} of their own included monthly credits.': 'استخدم أقل من {minimal} من أرصدته الشهرية المشمولة.',
  'Check that the person still needs the license. Show them agent mode and Auto. If they still do not use it, give the license to someone else.':
    'تأكد أن الشخص ما زال يحتاج الترخيص. عرّفه على وضع الوكيل (agent mode) وعلى Auto. إذا ظل لا يستخدمه، فأعطِ الترخيص لشخص آخر.',
  'Light ({minimal} to {light})': 'خفيف (من {minimal} إلى {light})',
  'Used {minimal} to {light} of their own included credits.': 'استخدم من {minimal} إلى {light} من أرصدته المشمولة.',
  'Offer short training on tasks that save the most time, such as agent mode, tools and instruction files.':
    'قدّم له تدريبًا قصيرًا على المهام التي توفر أكثر وقت، مثل وضع الوكيل والأدوات وملفات التعليمات.',
  'Core ({light} to {core})': 'أساسي (من {light} إلى {core})',
  'Used {light} to {core} of their own included credits. This is the healthy range.': 'استخدم من {light} إلى {core} من أرصدته المشمولة. هذا هو النطاق الصحي.',
  'Healthy. Keep it as is. Their included credits are well used.': 'وضع صحي. أبقِه كما هو، فأرصدته المشمولة مستخدمة جيدًا.',
  'Power ({core} to {power})': 'مكثف (من {core} إلى {power})',
  'Used more than their own included credits ({core} to {power}). The shared pool pays for the extra.':
    'استخدم أكثر من أرصدته المشمولة (من {core} إلى {power}). الرصيد المشترك يغطي الزيادة.',
  'Useful work, but watch the shared pool. Check which models they use and how long their chats get. Think about a budget for them.':
    'عمل مفيد، لكن راقب الرصيد المشترك. تحقق من النماذج التي يستخدمها ومن طول محادثاته. فكّر في تحديد ميزانية له.',
  'Runaway ({power} or more)': 'مفرط ({power} أو أكثر)',
  'Used {power} or more of their own included credits.': 'استخدم {power} أو أكثر من أرصدته المشمولة.',
  'Look at their biggest days with them. Move everyday work to cheaper models or Auto, and set a budget for them.':
    'راجع معه أكثر أيامه استخدامًا. انقل العمل اليومي إلى نماذج أرخص أو إلى Auto، وحدد له ميزانية.',

  // Engagement and lifecycle
  Daily: 'يومي',
  'Active on at least {daily} of workdays since they started.': 'نشط في {daily} على الأقل من أيام العمل منذ أن بدأ.',
  'They use it every day. Keep their setup working well and learn from how they work.': 'يستخدمه كل يوم. حافظ على إعداداته تعمل جيدًا وتعلّم من طريقة عمله.',
  Regular: 'منتظم',
  'Active on {regular} to {daily} of workdays.': 'نشط في {regular} إلى {daily} من أيام العمل.',
  'Good users. Share tips so they get more out of it.': 'مستخدمون جيدون. شارك معهم نصائح ليستفيدوا منه أكثر.',
  Occasional: 'متقطع',
  'Active on {occasional} to {regular} of workdays.': 'نشط في {occasional} إلى {regular} من أيام العمل.',
  'Ask what holds them back (trust, use cases or training) and run a short training session.':
    'اسأل عمّا يعيقه (الثقة أو حالات الاستخدام أو التدريب) وقدّم جلسة تدريب قصيرة.',
  New: 'جديد',
  'First seen in the last {newDays} days, and the report starts at least {newDays} days before that.':
    'ظهر لأول مرة في الفترة الأخيرة (عدد الأيام: {newDays})، ويبدأ التقرير قبل ذلك بفترة لا تقل عنها (عدد الأيام: {newDays}).',
  'Help them start well: show how to pick a model and how to use Auto. Check in after two weeks.':
    'ساعده على بداية جيدة: اشرح له كيف يختار النموذج وكيف يستخدم Auto. تواصل معه بعد أسبوعين.',
  Rare: 'نادر',
  'Active on fewer than {occasional} of workdays.': 'نشط في أقل من {occasional} من أيام العمل.',
  'Reach out to them again, or give the license to someone else.': 'تواصل معه من جديد، أو أعطِ الترخيص لشخص آخر.',
  Lapsed: 'متوقف',
  'No activity for {lapsedDays} days or more after earlier use.': 'لا نشاط منذ آخر استخدام (عدد الأيام: {lapsedDays} أو أكثر).',
  'Ask what changed. Bring them back, or take back the license.': 'اسأل عمّا تغيّر. شجّعه على العودة، أو استرجع الترخيص.',

  // Personas
  Champions: 'الروّاد',
  'Active often (on at least {regular} of workdays) and use at least {light} of their own included credits.':
    'نشطون كثيرًا (في {regular} على الأقل من أيام العمل) ويستخدمون {light} على الأقل من أرصدتهم المشمولة.',
  'Learn from them. Write down how they work, which models they pick and how they ask, and share it. Ask them to help others.':
    'تعلّم منهم. دوّن طريقة عملهم والنماذج التي يختارونها وطريقة صياغتهم للطلبات، وشاركها. اطلب منهم مساعدة الآخرين.',
  'Steady light users': 'مستخدمون منتظمون باستخدام خفيف',
  'Use GitHub Copilot often, but lightly (under {light} of their own included credits).':
    'يستخدمون GitHub Copilot كثيرًا لكن بخفة (أقل من {light} من أرصدتهم المشمولة).',
  'Low cost and a good habit. Offer training on agent mode, tools and instruction files so they get more from it.':
    'تكلفة قليلة وعادة جيدة. قدّم لهم تدريبًا على وضع الوكيل والأدوات وملفات التعليمات ليستفيدوا أكثر.',
  'New users': 'مستخدمون جدد',
  'Help them start well: share model tips, Auto and tips on keeping chats short.': 'ساعدهم على بداية جيدة: شارك نصائح اختيار النموذج واستخدام Auto وإبقاء المحادثات قصيرة.',
  'Burst users': 'مستخدمون على دفعات',
  'Heavy use packed into a few days.': 'استخدام كثيف مركّز في أيام قليلة.',
  'Check for very long agent sessions or too many files added to a chat. Suggest starting a new chat for each task, and using Auto. Think about a budget.':
    'ابحث عن جلسات وكيل طويلة جدًا أو ملفات كثيرة أُضيفت إلى المحادثة. اقترح بدء محادثة جديدة لكل مهمة واستخدام Auto. فكّر في تحديد ميزانية.',
  'Runaway users': 'مستخدمون مفرطون',
  'Look at their biggest sessions. Move everyday work to cheaper models or Auto, and set a budget for them.':
    'راجع أكبر جلساتهم. انقل العمل اليومي إلى نماذج أرخص أو إلى Auto، وحدد لهم ميزانية.',
  'Dormant or low use': 'خامل أو قليل الاستخدام',
  'Light use, and not often.': 'استخدام خفيف وغير متكرر.',
  'Send a friendly reminder and check that they need the license. Code completions are not in this report, so ask before you take a license back.':
    'أرسل تذكيرًا لطيفًا وتأكد أنهم يحتاجون الترخيص. إكمال الكود التلقائي غير موجود في هذا التقرير، لذا اسألهم قبل استرجاع الترخيص.',
  'Lapsed users': 'مستخدمون متوقفون',
  'Used it before, but nothing for {lapsedDays} days or more.': 'استخدموه من قبل، ولا نشاط لهم منذ فترة (عدد الأيام: {lapsedDays} أو أكثر).',
  'Bring them back, or take back the license if they no longer need it.': 'شجّعهم على العودة، أو استرجع الترخيص إذا لم يعودوا بحاجة إليه.',

  // Usage profiles
  Efficient: 'موفّر',
  'At least {efficient} of their usage is on Versatile or Lightweight models.': '{efficient} على الأقل من استخدامهم على نماذج متعددة الاستخدامات أو خفيفة.',
  'Good model choices. Ask them to share how they pick models.': 'اختيارات جيدة للنماذج. اطلب منهم مشاركة طريقة اختيارهم.',
  Balanced: 'متوازن',
  'A healthy mix of Powerful models and cheaper models.': 'مزيج صحي من النماذج القوية والنماذج الأرخص.',
  'Keep using Powerful models only for hard problems.': 'استمر في استخدام النماذج القوية للمشكلات الصعبة فقط.',
  'Frontier-heavy': 'يعتمد على النماذج القوية',
  'At least {frontier} of their usage is on Powerful models, the most expensive kind.': '{frontier} على الأقل من استخدامهم على النماذج القوية، وهي الأغلى.',
  'The biggest chance to save. Use cheaper models or Auto for everyday edits, explanations and tests.':
    'أكبر فرصة للتوفير. استخدم نماذج أرخص أو Auto للتعديلات اليومية والشرح والاختبارات.',

  // Pareto classes
  'A: top users': 'A: الأعلى استخدامًا',
  'The few users who together make up the first {a} of usage.': 'العدد القليل من المستخدمين الذين يشكّلون معًا أول {a} من الاستخدام.',
  'Start here with coaching and budgets. This is where most of the money goes.': 'ابدأ هنا بالتوجيه والميزانيات. هنا يذهب معظم المال.',
  'B: middle': 'B: الوسط',
  'The users who make up the next {b} of usage.': 'المستخدمون الذين يشكّلون الـ{b} التالية من الاستخدام.',
  'Give light guidance and keep an eye on them.': 'قدّم توجيهًا خفيفًا وتابعهم.',
  'C: long tail': 'C: الأقل استخدامًا',
  'The users who make up the last {c} of usage. Usually the largest group of people.': 'المستخدمون الذين يشكّلون آخر {c} من الاستخدام. عادة هم أكبر مجموعة من الأشخاص.',
  'Focus on helping them use it more and get value from it, not on cost.': 'ركّز على مساعدتهم ليستخدموه أكثر ويستفيدوا منه، وليس على التكلفة.',

  // Auto use classes
  'Auto-first': 'يعتمد على Auto',
  "At least {autoFirst} of the user's usage goes through Auto model selection, so most of it gets the Auto discount where the plan has one.":
    '{autoFirst} على الأقل من استخدام المستخدم يمر عبر Auto، لذا يحصل معظمه على خصم Auto عندما توفره الخطة.',
  'Keep it. Ask how they work with Auto and share it with people who pick models by hand.': 'استمر على ذلك. اسأله كيف يعمل مع Auto وشارك ذلك مع من يختارون النماذج يدويًا.',
  Mixed: 'مختلط',
  "{lowAuto} to {autoFirst} of the user's usage goes through Auto. The rest uses a model picked by hand.":
    'من {lowAuto} إلى {autoFirst} من استخدام المستخدم يمر عبر Auto. والباقي على نموذج اختاره يدويًا.',
  'Suggest Auto for everyday work, and a named model only when a task needs it.': 'اقترح Auto للعمل اليومي، ونموذجًا محددًا فقط عندما تحتاجه المهمة.',
  'Direct models': 'نماذج مباشرة',
  "Less than {lowAuto} of the user's usage goes through Auto. They pick models by hand, so they miss the Auto discount where the plan has one.":
    'أقل من {lowAuto} من استخدام المستخدم يمر عبر Auto. يختار النماذج يدويًا، فيفوته خصم Auto عندما توفره الخطة.',
  'Show them Auto. Where the plan has an Auto discount the same work costs less, and Auto picks a suitable model for each request.':
    'عرّفه على Auto. عندما توفر الخطة خصم Auto يكلف العمل نفسه أقل، ويختار Auto نموذجًا مناسبًا لكل طلب.',
  'Not enough data': 'لا توجد بيانات كافية',
  'The report has no model names, or the user has no usage, so Auto use cannot be judged.':
    'التقرير لا يحتوي أسماء النماذج، أو ليس للمستخدم استخدام، لذا لا يمكن تقييم استخدام Auto.',
  'Export the usage report with the model column to see Auto use.': 'صدّر تقرير الاستخدام مع عمود النموذج لترى استخدام Auto.',

  // Traits
  'Long-context surcharges': 'رسوم إضافية للسياق الطويل',
  'At least {longContext} of their usage looks like long-context pricing: very large requests that cost more per token.':
    '{longContext} على الأقل من استخدامهم يبدو بتسعير السياق الطويل: طلبات كبيرة جدًا تكلف أكثر لكل رمز.',
  'Keep requests smaller: add fewer files to the chat, split big tasks, and start a new chat when the old one gets long.':
    'اجعل الطلبات أصغر: أضف ملفات أقل إلى المحادثة، وقسّم المهام الكبيرة، وابدأ محادثة جديدة عندما تطول القديمة.',
  'Spiky usage': 'قفزات في الاستخدام',
  "A single day makes up at least {spike} of the user's usage.": 'يوم واحد يشكّل {spike} على الأقل من استخدام المستخدم.',
  'Look at the biggest day for an agent session that ran too long. Think about limits for long sessions.':
    'افحص اليوم الأكبر بحثًا عن جلسة وكيل استمرت أكثر من اللازم. فكّر في حدود للجلسات الطويلة.',
  'Low cache reuse': 'استفادة قليلة من الذاكرة المؤقتة',
  'Cache hit rate under {lowCache}. Text that was already sent is sent again at full price instead of being read back from the cheaper cache.':
    'نسبة القراءة من الذاكرة المؤقتة أقل من {lowCache}. النص المرسل سابقًا يُرسل مرة أخرى بالسعر الكامل بدل قراءته من الذاكرة المؤقتة الأرخص.',
  'Stay in the same chat and with the same model while working on one task. Do not keep changing instructions or restarting chats.':
    'ابقَ في المحادثة نفسها ومع النموذج نفسه أثناء العمل على مهمة واحدة. لا تغيّر التعليمات باستمرار ولا تعِد بدء المحادثات.',
  'Rarely uses Auto': 'نادرًا ما يستخدم Auto',
  'Less than {lowAuto} of their usage goes through Auto model selection.': 'أقل من {lowAuto} من استخدامهم يمر عبر Auto.',
  'Try Auto. It picks a suitable model for each request, and on plans that have an Auto discount the same work costs less.':
    'جرّب Auto. يختار نموذجًا مناسبًا لكل طلب، وفي الخطط التي فيها خصم Auto يكلف العمل نفسه أقل.',
  'Many models': 'نماذج كثيرة',
  'Uses four or more different models.': 'يستخدم أربعة نماذج مختلفة أو أكثر.',
  'Changing the model in the middle of a chat means the cache cannot be reused. Pick one model for each task.':
    'تغيير النموذج في منتصف المحادثة يمنع إعادة استخدام الذاكرة المؤقتة. اختر نموذجًا واحدًا لكل مهمة.',
  'Growing fast': 'نمو سريع',
  'Usage in the last 7 days is at least 1.5 times the 7 days before.': 'الاستخدام في آخر 7 أيام يساوي 1.5 ضعف الأيام السبعة التي قبلها على الأقل.',
  'Watch the trend. Check that the work is useful and not an agent stuck in a loop.': 'راقب الاتجاه. تأكد أن العمل مفيد وليس وكيلًا عالقًا في حلقة متكررة.',
  'No cost center': 'بلا مركز تكلفة',
  'Usage cannot be charged to a team because no cost center is set.': 'لا يمكن تحميل الاستخدام على فريق لأنه لم يُحدد مركز تكلفة.',
  'Add the user to a cost center in the billing settings.': 'أضف المستخدم إلى مركز تكلفة في إعدادات الفوترة.',
  Fading: 'متراجع',
  'Usage in the last 7 days is half or less of the 7 days before.': 'الاستخدام في آخر 7 أيام يساوي نصف الأيام السبعة التي قبلها أو أقل.',
  'Check in. Did they hit a problem or move to another tool?': 'تواصل معه. هل واجه مشكلة أو انتقل إلى أداة أخرى؟',
};

export default arabic;
