import type { Dict } from '../core';

/** Arabic text for the calculation docs of the Segments page (src/lib/metrics/docs/segments.ts). */
const arabic: Dict = {
  // Usage tier
  'How much of the credits included in their own seat a user used in the period. The tier is a band of that share: Minimal, Light, Core, Power or Runaway. It tells you how large the usage is, not which models or what kind of work it was.':
    'مقدار ما استخدمه المستخدم في الفترة من الأرصدة المشمولة في ترخيصه. المستوى شريحة من هذه الحصة: ضئيل أو خفيف أو أساسي أو مكثف أو مفرط. يخبرك بحجم الاستخدام، لا بالنماذج المستخدمة ولا بنوع العمل.',
  'Share of included credits = usage of the user ÷ included credits of the user': 'حصة الأرصدة المشمولة = استخدام المستخدم ÷ الأرصدة المشمولة للمستخدم',
  'Usage of the user = the sum of gross_amount over the rows of the user that pass the row filters.':
    'استخدام المستخدم = مجموع gross_amount في صفوف المستخدم التي تجتاز عوامل تصفية الصفوف.',
  'Included credits of the user = for each calendar month, the largest total_monthly_quota that the user shows in that month, in dollars at $0.01 per credit, added up over the months. A month counts in full even when the period covers only part of it.':
    'الأرصدة المشمولة للمستخدم = لكل شهر تقويمي، أكبر قيمة total_monthly_quota تظهر للمستخدم في ذلك الشهر، بالدولار بسعر $0.01 للرصيد، مجموعةً على الأشهر. يُحسب الشهر كاملًا حتى لو غطت الفترة جزءًا منه فقط.',
  'A user whose rows show no seat size gets the most common seat size in the report (1,900 credits when nobody shows one) for each month with usage.':
    'المستخدم الذي لا تُظهر صفوفه حجم الترخيص يأخذ حجم الترخيص الأكثر شيوعًا في التقرير (1,900 رصيد إذا لم يظهر لأحد) لكل شهر فيه استخدام.',
  'Tier, with the default limits: Minimal below 10%, Light from 10% to below 40%, Core from 40% to below 100%, Power from 100% to below 300%, Runaway at 300% or more. The limits in use are in Settings.':
    'المستوى، بالحدود الافتراضية: ضئيل أقل من 10%، وخفيف من 10% إلى أقل من 40%، وأساسي من 40% إلى أقل من 100%، ومكثف من 100% إلى أقل من 300%، ومفرط عند 300% أو أكثر. الحدود المستخدمة في الإعدادات.',
  'A share exactly on a limit goes to the higher tier.': 'الحصة التي تقع على الحد تمامًا تذهب إلى المستوى الأعلى.',
  'A share above 100% means the user used more than the credits of their own seat. Seats share one pool, so this costs extra only when the whole pool is used up.':
    'الحصة فوق 100% تعني أن المستخدم استخدم أكثر من أرصدة ترخيصه. التراخيص تتشارك رصيدًا واحدًا، لذا لا يكلف هذا شيئًا إضافيًا إلا عندما ينفد الرصيد المشترك كله.',
  'The tier is about size, not about waste. A Runaway user can be doing valuable work, and a Minimal user may not need a seat.':
    'المستوى يتعلق بالحجم لا بالهدر. قد يقوم المستخدم المفرط بعمل قيّم، وقد لا يحتاج المستخدم الضئيل إلى ترخيص.',
  'Row filters change which rows are counted, so they can change a tier. Segment filters only choose which users to show and never change a tier.':
    'عوامل تصفية الصفوف تغيّر الصفوف المحسوبة، لذا قد تغيّر المستوى. عوامل تصفية المجموعات تختار فقط المستخدمين المعروضين ولا تغيّر المستوى أبدًا.',
  'A period shorter than a month still counts the credits of the whole month, so the tiers of a short period look lower than they would over the full month.':
    'الفترة الأقصر من شهر تحسب أرصدة الشهر كاملًا، لذا تبدو مستويات الفترة القصيرة أقل مما ستكون عليه على الشهر الكامل.',
  'Rows without a username belong to no user, so they are in no tier.': 'الصفوف التي ليس لها اسم مستخدم لا تنتمي لأي مستخدم، لذا ليست في أي مستوى.',
  'A Business seat includes 1,900 credits, which is $19 a month. A user with $10 of usage in that month used 53% of the included credits, which is Core. $30 is 158%, which is Power. $60 is 316%, which is Runaway.':
    'ترخيص Business يشمل 1,900 رصيد، أي $19 شهريًا. المستخدم الذي استخدم $10 في ذلك الشهر استخدم 53% من الأرصدة المشمولة، وهذا أساسي. و$30 تعني 158%، وهذا مكثف. و$60 تعني 316%، وهذا مفرط.',

  // Engagement
  'How often a user works with GitHub Copilot, whatever the amount. The level is the share of working days on which the user had real usage: Daily, Regular, Occasional or Rare. Two flags, New and Lapsed, are listed next to the levels.':
    'مدى تكرار عمل المستخدم مع GitHub Copilot، بغض النظر عن المقدار. المستوى هو حصة أيام العمل التي كان للمستخدم فيها استخدام فعلي: يومي أو منتظم أو متقطع أو نادر. وتُعرض علامتان، جديد ومتوقف، بجانب المستويات.',
  'Active rate = active days ÷ working days, at most 100%': 'معدل النشاط = الأيام النشطة ÷ أيام العمل، بحد أقصى 100%',
  'An active day is a day on which the usage of the user is at least "Active-day threshold". Weekend days count when they pass the threshold.':
    'اليوم النشط هو يوم يكون فيه استخدام المستخدم على الأقل "حد اليوم النشط". أيام عطلة نهاية الأسبوع تُحسب عندما تتجاوز الحد.',
  'Working days = the Monday to Friday days from the later of the first day of the user in the report and the start of the period, up to the end of the period. There are at least 5.':
    'أيام العمل = الأيام من الاثنين إلى الجمعة من الأحدث بين أول يوم للمستخدم في التقرير وبداية الفترة، حتى نهاية الفترة. وهي 5 أيام على الأقل.',
  'Active rate = active days ÷ working days, never above 100%.': 'معدل النشاط = الأيام النشطة ÷ أيام العمل، ولا يتجاوز 100% أبدًا.',
  'Level, with the default limits: Daily at 60% or more, Regular from 30% to below 60%, Occasional from 10% to below 30%, Rare below 10%. The limits in use are in Settings.':
    'المستوى، بالحدود الافتراضية: يومي عند 60% أو أكثر، ومنتظم من 30% إلى أقل من 60%، ومتقطع من 10% إلى أقل من 30%، ونادر أقل من 10%. الحدود المستخدمة في الإعدادات.',
  'New flag: the first day of the user in the report is within the "New user window" before the end of the period (14 days by default), and at least that many days after the first day of the report.':
    'علامة جديد: أول يوم للمستخدم في التقرير يقع ضمن "نافذة المستخدم الجديد" قبل نهاية الفترة (14 يومًا افتراضيًا)، وبعد أول يوم في التقرير بالعدد نفسه من الأيام على الأقل.',
  'Lapsed flag: the user is not new, and the last day with a row of the user is at least "Lapsed after" days before the end of the period (7 days by default).':
    'علامة متوقف: المستخدم ليس جديدًا، وآخر يوم فيه صف للمستخدم يسبق نهاية الفترة بعدد أيام "متوقف بعد" على الأقل (7 أيام افتراضيًا).',
  'The four levels add up to all users. New and Lapsed are flags on top of them: a flagged user is also in one level, so the six groups of this lens add up to more than the number of users.':
    'المستويات الأربعة مجموعها كل المستخدمين. جديد ومتوقف علامتان فوقها: المستخدم الذي يحمل علامة موجود أيضًا في أحد المستويات، لذا مجموع المجموعات الست في زاوية المقارنة هذه أكبر من عدد المستخدمين.',
  'In the Persona lens, New users and Lapsed users are separate personas, and each user has one persona only.':
    'في زاوية مقارنة نمط المستخدم، المستخدمون الجدد والمستخدمون المتوقفون نمطان منفصلان، ولكل مستخدم نمط واحد فقط.',
  'The flags are judged at the end of the period you chose, not at today. The first day of a user is taken from the whole report, so a filter cannot make a user look new.':
    'تُقيَّم العلامتان عند نهاية الفترة التي اخترتها، لا عند اليوم. أول يوم للمستخدم يؤخذ من التقرير كله، لذا لا يمكن لعامل تصفية أن يجعل المستخدم يبدو جديدًا.',
  'A day with a row below the threshold is not an active day, but a row of any amount counts as activity for the Lapsed flag.':
    'اليوم الذي فيه صف أقل من الحد ليس يومًا نشطًا، لكن الصف بأي مبلغ يُحسب نشاطًا لعلامة متوقف.',
  'The level counts days, not dollars. A user can be Daily with small usage, and Rare with a large amount used on a single day.':
    'المستوى يعدّ الأيام لا الدولارات. قد يكون المستخدم يوميًا باستخدام صغير، ونادرًا بمبلغ كبير استُخدم في يوم واحد.',
  'A user without any row in the period is not on this page.': 'المستخدم الذي ليس له أي صف في الفترة لا يظهر في هذه الصفحة.',
  'A period has 20 working days. A user who was active on 14 of them has an active rate of 70%, which is Daily. A user who was active on 7 of them has 35%, which is Regular.':
    'في فترة 20 يوم عمل. المستخدم النشط في 14 منها معدل نشاطه 70%، وهذا يومي. والمستخدم النشط في 7 منها معدله 35%، وهذا منتظم.',

  // Usage profile
  'Which kind of model a user mostly uses: Frontier-heavy (mostly the Powerful models), Efficient (mostly Versatile and Lightweight models) or Balanced (a mix). It says where the usage went, not how large it is.':
    'نوع النماذج الذي يستخدمه المستخدم غالبًا: يعتمد على النماذج القوية (غالبًا النماذج القوية)، أو موفّر (غالبًا النماذج متعددة الاستخدامات والخفيفة)، أو متوازن (مزيج). يخبرك أين ذهب الاستخدام، لا بحجمه.',
  'Share of a model tier = usage of the user on models of that tier ÷ usage of the user': 'حصة فئة النموذج = استخدام المستخدم على نماذج تلك الفئة ÷ استخدام المستخدم',
  'Add up the gross_amount of the user by model tier: Powerful, Versatile, Lightweight and Unknown. The tier of a model comes from the price card, or from the tier you set for the model in Settings.':
    'اجمع gross_amount للمستخدم حسب فئة النموذج: قوية ومتعددة الاستخدامات وخفيفة وغير معروفة. فئة النموذج تأتي من قائمة الأسعار، أو من الفئة التي حددتها للنموذج في الإعدادات.',
  'Frontier-heavy: the Powerful share is at least 70%. This is checked first.': 'يعتمد على النماذج القوية: حصة النماذج القوية 70% على الأقل. يُفحص هذا أولًا.',
  'Efficient: otherwise, the Versatile share plus the Lightweight share is at least 70%.': 'موفّر: وإلا، فحصة النماذج متعددة الاستخدامات مع حصة الخفيفة 70% على الأقل.',
  'Balanced: everyone else. The limits above are the defaults. The limits in use are in Settings.': 'متوازن: كل من عدا ذلك. الحدود أعلاه هي الافتراضية. الحدود المستخدمة في الإعدادات.',
  'Usage on models with no known tier (Unknown) is in the total but in no share, so a user with a lot of Unknown usage is likely to be Balanced.':
    'الاستخدام على نماذج بلا فئة معروفة (غير معروفة) يدخل في الإجمالي لكن ليس في أي حصة، لذا المستخدم الذي له استخدام كبير غير معروف يُرجّح أن يكون متوازنًا.',
  'Rows that went through Auto count under the model that Auto picked, so "Auto: <model name>" counts under that model. A row that says only Auto has no model, so it is Unknown.':
    'الصفوف التي مرت عبر Auto تُحسب تحت النموذج الذي اختاره Auto، لذا "Auto: <model name>" يُحسب تحت ذلك النموذج. الصف الذي يذكر Auto فقط ليس له نموذج، لذا هو غير معروف.',
  'The profile needs model names. When the model column is missing or empty, every user would be Balanced, so the page explains that instead of showing the groups.':
    'الملف يحتاج إلى أسماء النماذج. عندما يكون عمود model مفقودًا أو فارغًا، سيكون كل مستخدم متوازنًا، لذا تشرح الصفحة ذلك بدل عرض المجموعات.',
  'A user with no usage is Balanced.': 'المستخدم الذي ليس له استخدام متوازن.',
  'Row filters change which rows are counted, so they can change a profile. Segment filters never do.':
    'عوامل تصفية الصفوف تغيّر الصفوف المحسوبة، لذا قد تغيّر الملف. عوامل تصفية المجموعات لا تفعل ذلك أبدًا.',
  'A user with $100 of usage, $80 of it on Powerful models, is Frontier-heavy (80%). A user with $20 on Powerful, $40 on Versatile and $40 on Lightweight models has 80% on lighter models, which is Efficient. A user with $50 on Powerful and $50 on Versatile models is Balanced.':
    'المستخدم الذي استخدم $100، منها $80 على النماذج القوية، يعتمد على النماذج القوية (80%). والمستخدم الذي استخدم $20 على القوية و$40 على متعددة الاستخدامات و$40 على الخفيفة لديه 80% على النماذج الأخف، وهذا موفّر. والمستخدم الذي استخدم $50 على القوية و$50 على متعددة الاستخدامات متوازن.',

  // Pareto class
  'Splits the users by how much of the total usage they account for. Class A is the fewest top users who together make up the first part of the usage, class B the next part and class C the long tail that is left.':
    'يقسم المستخدمين حسب حصتهم من إجمالي الاستخدام. الفئة A هي أقل عدد من المستخدمين الأعلى الذين يشكّلون معًا الجزء الأول من الاستخدام، والفئة B الجزء التالي، والفئة C ما تبقى من المستخدمين الأقل استخدامًا.',
  'Usage ahead = usage of the users ranked above ÷ usage of all users': 'الاستخدام السابق = استخدام المستخدمين الأعلى ترتيبًا ÷ استخدام كل المستخدمين',
  'Rank all users by usage (gross_amount), largest first. Users with the same usage are ordered by name.':
    'رتّب كل المستخدمين حسب الاستخدام (gross_amount)، من الأكبر. المستخدمون ذوو الاستخدام نفسه يُرتَّبون حسب الاسم.',
  'For each user, Usage ahead = the usage of all users ranked above, added up, ÷ the usage of all users.':
    'لكل مستخدم، الاستخدام السابق = مجموع استخدام كل المستخدمين الأعلى ترتيبًا ÷ استخدام كل المستخدمين.',
  'Class A: Usage ahead is below 80%. Class B: from 80% to below 95%. Class C: 95% or more. These are the default limits. The limits in use are in Settings.':
    'الفئة A: الاستخدام السابق أقل من 80%. الفئة B: من 80% إلى أقل من 95%. الفئة C: 95% أو أكثر. هذه هي الحدود الافتراضية. الحدود المستخدمة في الإعدادات.',
  'The user who carries the running total across a limit stays in the higher class, so class A is the fewest users that reach the first limit.':
    'المستخدم الذي يتجاوز به المجموع التراكمي حدًا يبقى في الفئة الأعلى، لذا الفئة A هي أقل عدد من المستخدمين يبلغ الحد الأول.',
  'Class C is usually the largest group of people and the smallest part of the usage.': 'الفئة C عادةً هي أكبر مجموعة من الأشخاص وأصغر جزء من الاستخدام.',
  'A user whose rows add up to no usage is in class C. When nobody has any usage, everyone is in class A.':
    'المستخدم الذي مجموع صفوفه لا استخدام فيه يكون في الفئة C. وعندما لا يكون لأحد أي استخدام، يكون الجميع في الفئة A.',
  'Rows without a username belong to nobody, so they are in neither part of the ratio.': 'الصفوف التي ليس لها اسم مستخدم لا تنتمي لأحد، لذا لا تدخل في أي طرف من النسبة.',
  'It shows concentration, not waste. A user in class A may use GitHub Copilot very well.': 'يُظهر التركّز، لا الهدر. قد يستخدم مستخدم الفئة A أداة GitHub Copilot استخدامًا ممتازًا.',
  'Five users used $50, $30, $10, $6 and $4, which is $100 in all. Usage ahead is 0%, 50%, 80%, 90% and 96%. The classes are A, A, B, B and C.':
    'خمسة مستخدمين استخدموا $50 و$30 و$10 و$6 و$4، أي $100 إجمالًا. الاستخدام السابق 0% و50% و80% و90% و96%. والفئات A وA وB وB وC.',

  // Traits
  'Habits and patterns that are worth a look, found with fixed rules. A user can have several traits or none. A trait is a hint for a conversation or a setting to review, not a sign that the user did something wrong.':
    'عادات وأنماط تستحق النظر، تُرصد بقواعد ثابتة. قد يكون للمستخدم عدة سمات أو لا شيء. السمة إشارة لحديث أو لإعداد يستحق المراجعة، وليست دليلًا على أن المستخدم أخطأ.',
  'A user has a trait when the rule of that trait is true for the user, as listed in the steps': 'تكون للمستخدم سمة عندما تنطبق عليه قاعدة تلك السمة، كما في الخطوات',
  'Low cache reuse: usage of the user is at least "Minimum usage for traits", at least half of it is on rows that could be priced from token counts, and the cache hit rate is below "Low cache reuse below".':
    'استفادة قليلة من الذاكرة المؤقتة: استخدام المستخدم على الأقل "الحد الأدنى للاستخدام للسمات"، ونصفه على الأقل في صفوف أمكن تسعيرها من عدد الرموز، ومعدل إصابة الذاكرة المؤقتة أقل من "استفادة قليلة من الذاكرة المؤقتة تحت".',
  'Long-context surcharges: usage of the user is at least "Minimum usage for traits", and the long-context premium is at least "Long-context surcharges from" of the usage.':
    'رسوم إضافية للسياق الطويل: استخدام المستخدم على الأقل "الحد الأدنى للاستخدام للسمات"، وعلاوة السياق الطويل على الأقل "رسوم السياق الطويل من" من الاستخدام.',
  'Spiky usage: usage of the user is at least "Minimum usage for traits", the user was active on 3 days or more, and the busiest day is at least "Spiky usage from" of the usage.':
    'قفزات في الاستخدام: استخدام المستخدم على الأقل "الحد الأدنى للاستخدام للسمات"، وكان نشطًا في 3 أيام أو أكثر، وأكثر الأيام استخدامًا على الأقل "قفزات في الاستخدام من" من الاستخدام.',
  'Rarely uses Auto: usage of the user is at least "Minimum usage for traits", the report names models, and the Auto share is below "Rarely uses Auto below".':
    'نادرًا ما يستخدم Auto: استخدام المستخدم على الأقل "الحد الأدنى للاستخدام للسمات"، والتقرير يذكر أسماء النماذج، وحصة Auto أقل من "نادرًا ما يستخدم Auto تحت".',
  'Many models: the user had usage on 4 or more different models. There is no minimum usage.': 'نماذج كثيرة: للمستخدم استخدام على 4 نماذج مختلفة أو أكثر. لا يوجد حد أدنى للاستخدام.',
  'Growing fast: the period has at least 14 days, usage of the last 7 days is at least "Minimum usage for traits", and it is at least 1.5 times the usage of the 7 days before. When the 7 days before had no usage, it counts unless the user is new.':
    'نمو سريع: الفترة 14 يومًا على الأقل، واستخدام آخر 7 أيام على الأقل "الحد الأدنى للاستخدام للسمات"، وهو 1.5 ضعف استخدام الأيام الـ7 التي قبلها على الأقل. وإذا لم يكن في الأيام الـ7 السابقة استخدام، يُحسب إلا إذا كان المستخدم جديدًا.',
  'Fading: the period has at least 14 days, usage of the 7 days before the last 7 days is at least "Minimum usage for traits", and usage of the last 7 days is half of that or less.':
    'تراجع: الفترة 14 يومًا على الأقل، واستخدام الأيام الـ7 التي تسبق آخر 7 أيام على الأقل "الحد الأدنى للاستخدام للسمات"، واستخدام آخر 7 أيام نصف ذلك أو أقل.',
  'No cost center: some users in the report have a cost center and this user has none. There is no minimum usage.':
    'بلا مركز تكلفة: لبعض المستخدمين في التقرير مركز تكلفة وهذا المستخدم ليس له مركز. لا يوجد حد أدنى للاستخدام.',
  'The minimum usage keeps tiny amounts from raising a trait. One request without cache reuse would otherwise make a user look careless.':
    'الحد الأدنى للاستخدام يمنع المبالغ الصغيرة جدًا من إطلاق سمة. وإلا لجعل طلب واحد بلا استفادة من الذاكرة المؤقتة المستخدمَ يبدو مهملًا.',
  'A trait that the data cannot show never applies. Low cache reuse and Long-context surcharges need token columns and model names. Rarely uses Auto and Many models need model names. Growing fast and Fading need a period of 14 days or more. No cost center needs cost centers in the report. The page lists the traits it cannot detect.':
    'السمة التي لا تستطيع البيانات إظهارها لا تنطبق أبدًا. الاستفادة القليلة من الذاكرة المؤقتة ورسوم السياق الطويل تحتاجان إلى أعمدة الرموز وأسماء النماذج. ونادرًا ما يستخدم Auto ونماذج كثيرة تحتاجان إلى أسماء النماذج. والنمو السريع والتراجع يحتاجان إلى فترة من 14 يومًا أو أكثر. وبلا مركز تكلفة تحتاج إلى مراكز تكلفة في التقرير. تعرض الصفحة السمات التي لا يمكنها رصدها.',
  'Traits overlap, so the rows of the Traits lens add up to more than the number of users. The total row counts each user with at least one trait once.':
    'السمات تتداخل، لذا مجموع صفوف زاوية مقارنة السمات أكبر من عدد المستخدمين. صف الإجمالي يحسب كل مستخدم لديه سمة واحدة على الأقل مرة واحدة.',
  'Long-context surcharges relies on the long-context premium, which is a lower bound, so a user may be hit by surcharges without getting the trait.':
    'سمة رسوم السياق الطويل تعتمد على علاوة السياق الطويل، وهي حد أدنى، لذا قد يتحمل المستخدم رسومًا إضافية دون أن تظهر له السمة.',
  'Row filters change which rows are counted, so they can change traits. Segment filters never do.':
    'عوامل تصفية الصفوف تغيّر الصفوف المحسوبة، لذا قد تغيّر السمات. عوامل تصفية المجموعات لا تفعل ذلك أبدًا.',
  'A user has $50 of usage, $25 of it on one day, and was active on 5 days. The busiest day is 50% of the usage, which is at least 40%, so the user gets Spiky usage. With $3 of usage the same user gets none of the usage-based traits, because $3 is below the minimum of $5.':
    'مستخدم استخدم $50، منها $25 في يوم واحد، وكان نشطًا في 5 أيام. أكثر الأيام استخدامًا يشكّل 50% من الاستخدام، وهذا 40% على الأقل، لذا يحصل على سمة قفزات في الاستخدام. وباستخدام $3 لا يحصل المستخدم نفسه على أي من السمات المعتمدة على الاستخدام، لأن $3 أقل من الحد الأدنى البالغ $5.',

  // Groups in use
  'How many of the groups of the chosen lens have at least one user. A group with no users stays in the table, but there is nothing to compare in it.':
    'عدد مجموعات زاوية المقارنة المختارة التي فيها مستخدم واحد على الأقل. المجموعة التي ليس فيها مستخدمون تبقى في الجدول، لكن لا يوجد فيها ما يُقارن.',
  'Groups in use = number of groups with at least one user, out of all groups of the lens': 'المجموعات المستخدمة = عدد المجموعات التي فيها مستخدم واحد على الأقل، من بين كل مجموعات زاوية المقارنة',
  'Take every group of the lens. The New and Lapsed flags of the Engagement lens count as groups, because they are listed like the others.':
    'خذ كل مجموعات زاوية المقارنة. علامتا جديد ومتوقف في زاوية مقارنة التفاعل تُحسبان مجموعتين، لأنهما تُعرضان مثل غيرهما.',
  'Count the groups that have at least one user. The users are the users with rows that pass the row filters.':
    'عُدّ المجموعات التي فيها مستخدم واحد على الأقل. المستخدمون هم من لهم صفوف تجتاز عوامل تصفية الصفوف.',
  'The line under the number says that every group has users, or how many groups have none.': 'السطر تحت الرقم يذكر أن كل مجموعة فيها مستخدمون، أو عدد المجموعات التي ليس فيها أحد.',
  'A trait that the data cannot show has no users, so it counts as a group that is not in use.': 'السمة التي لا تستطيع البيانات إظهارها ليس فيها مستخدمون، لذا تُحسب مجموعة غير مستخدمة.',
  'Segment filters do not change the number. Only the row filters do.': 'عوامل تصفية المجموعات لا تغيّر الرقم. عوامل تصفية الصفوف فقط تغيّره.',
  'When only one group is in use, there is nothing to compare, and What stands out says so.': 'عندما تكون مجموعة واحدة فقط مستخدمة، لا يوجد ما يُقارن، ويذكر قسم "ما يلفت الانتباه" ذلك.',
  'The Usage tier lens has 5 groups. When nobody is in the Runaway tier, the card shows 4 of 5.': 'زاوية مقارنة مستوى الاستخدام فيها 5 مجموعات. عندما لا يكون أحد في المستوى المفرط، تعرض البطاقة 4 من 5.',

  // Largest group by users
  'The group with the most users in the chosen lens, shown as its share of all users.': 'المجموعة التي فيها أكثر المستخدمين في زاوية المقارنة المختارة، معروضة كحصة من كل المستخدمين.',
  'Share of users = users in the largest group ÷ all users': 'حصة المستخدمين = المستخدمون في أكبر مجموعة ÷ كل المستخدمين',
  'Count the users of each group of the lens.': 'عُدّ مستخدمي كل مجموعة في زاوية المقارنة.',
  'Take the group with the most users. When two groups tie, the one listed first wins. A group without users is never the largest.':
    'خذ المجموعة التي فيها أكثر المستخدمين. عند التعادل، تُعتمد المجموعة المذكورة أولًا. المجموعة التي ليس فيها مستخدمون لا تكون الأكبر أبدًا.',
  'The number is its users ÷ all users. The line under it names the group and its user count. Select the card to open the Users page with that group.':
    'الرقم هو مستخدموها ÷ كل المستخدمين. السطر تحته يذكر اسم المجموعة وعدد مستخدميها. اختر البطاقة لفتح صفحة المستخدمين بتلك المجموعة.',
  'Where groups overlap (Traits, and the New and Lapsed flags of Engagement), a user can be in several groups, so the shares of the groups can add up to more than 100%.':
    'حيث تتداخل المجموعات (السمات، وعلامتا جديد ومتوقف في التفاعل)، قد يكون المستخدم في عدة مجموعات، لذا قد يتجاوز مجموع حصص المجموعات 100%.',
  'The card shows a dash when no group has users.': 'تعرض البطاقة شرطة عندما لا توجد مجموعة فيها مستخدمون.',
  '30 of 120 users are Champions and no other group is larger, so the card shows 25%.': '30 من 120 مستخدمًا من الروّاد ولا توجد مجموعة أكبر، لذا تعرض البطاقة 25%.',

  // Biggest share of usage
  'The group that accounts for the largest part of the total usage, and how large that part is.': 'المجموعة التي تمثّل أكبر جزء من إجمالي الاستخدام، وحجم هذا الجزء.',
  'Share of usage = usage of the group ÷ usage of all users': 'حصة الاستخدام = استخدام المجموعة ÷ استخدام كل المستخدمين',
  'Add up gross_amount for the users of each group. Usage is the amount charged, so rows that went through Auto are already after the Auto discount.':
    'اجمع gross_amount لمستخدمي كل مجموعة. الاستخدام هو المبلغ المحتسب، لذا الصفوف التي مرت عبر Auto محسوبة أصلًا بعد خصم Auto.',
  'Take the group with the largest share. Groups without users are skipped, and a tie goes to the group listed first.':
    'خذ المجموعة ذات أكبر حصة. تُتجاوز المجموعات التي ليس فيها مستخدمون، وعند التعادل تُعتمد المجموعة المذكورة أولًا.',
  'The line under the number names the group and the share of users it holds, so you can see whether the group is heavy for its size.':
    'السطر تحت الرقم يذكر اسم المجموعة وحصتها من المستخدمين، لترى هل استخدام المجموعة كبير قياسًا بحجمها.',
  'The group with the most usage is not always the largest group. A few heavy users can use more than many light ones.':
    'المجموعة ذات أكبر استخدام ليست دائمًا أكبر مجموعة. قد يستخدم قلة من المستخدمين الكثيفين أكثر من كثيرين خفيفي الاستخدام.',
  'Where groups overlap (Traits, and the New and Lapsed flags of Engagement), the shares can add up to more than 100%.':
    'حيث تتداخل المجموعات (السمات، وعلامتا جديد ومتوقف في التفاعل)، قد يتجاوز مجموع الحصص 100%.',
  'The card shows a dash when there is no usage.': 'تعرض البطاقة شرطة عندما لا يوجد استخدام.',
  'On the Usage tier lens, the Power tier has 8 of 100 users and $4,000 of $10,000 in usage. The card shows 40%, and the line under it says 8% of users.':
    'في زاوية مقارنة مستوى الاستخدام، المستوى المكثف فيه 8 من 100 مستخدم و$4,000 من $10,000 من الاستخدام. تعرض البطاقة 40%، ويذكر السطر تحتها 8% من المستخدمين.',

  // Heaviest per user
  'The group whose users used the most on average, per user and per month. It names a group, not a person.':
    'المجموعة التي استخدم مستخدموها أكثر في المتوسط، لكل مستخدم شهريًا. تذكر مجموعة، لا شخصًا.',
  'Heaviest per user = highest Per user, per month among the groups that have users': 'الأعلى استخدامًا لكل مستخدم = أعلى قيمة "لكل مستخدم شهريًا" بين المجموعات التي فيها مستخدمون',
  'For each group, Per user, per month = usage of the group ÷ users in the group × 30.4375 ÷ days in the period.':
    'لكل مجموعة، لكل مستخدم شهريًا = استخدام المجموعة ÷ المستخدمون في المجموعة × 30.4375 ÷ أيام الفترة.',
  'Take the highest figure. Groups without users are skipped, and a tie goes to the group listed first.':
    'خذ أعلى قيمة. تُتجاوز المجموعات التي ليس فيها مستخدمون، وعند التعادل تُعتمد المجموعة المذكورة أولًا.',
  'The line under the number names the group. Select the card to open the Users page with that group.': 'السطر تحت الرقم يذكر اسم المجموعة. اختر البطاقة لفتح صفحة المستخدمين بتلك المجموعة.',
  'It is an average, so a few heavy users lift it. The Heaviest users list of a group card names them.':
    'إنه متوسط، لذا يرفعه قلة من المستخدمين الكثيفين. قائمة "أكثر المستخدمين استخدامًا" في بطاقة المجموعة تذكر أسماءهم.',
  'The monthly figure is scaled from the days in the period. It is not measured over a full month.': 'القيمة الشهرية محسوبة من أيام الفترة. ليست مقيسة على شهر كامل.',
  'The card shows a dash when no group has usage.': 'تعرض البطاقة شرطة عندما لا توجد مجموعة لها استخدام.',
  'Three groups have $75, $40 and $12 per user, per month. The card shows $75 and names the first group.':
    'ثلاث مجموعات فيها $75 و$40 و$12 لكل مستخدم شهريًا. تعرض البطاقة $75 وتذكر اسم المجموعة الأولى.',

  // Biggest opportunity
  'The group with the most potential savings, which is where the default usage levers could cut the most usage.':
    'المجموعة ذات أكبر توفير محتمل، أي حيث يمكن لروافع الاستخدام الافتراضية أن تخفض الاستخدام أكثر.',
  'Biggest opportunity = largest Potential savings among the groups; its share = that amount ÷ potential savings of all users':
    'أكبر فرصة = أكبر توفير محتمل بين المجموعات؛ وحصتها = ذلك المبلغ ÷ التوفير المحتمل لكل المستخدمين',
  'Potential savings of each group is worked out as described under Potential savings (group).': 'يُحسب التوفير المحتمل لكل مجموعة كما هو موضح في "التوفير المحتمل (المجموعة)".',
  'Take the group with the largest amount. Groups without users are skipped.': 'خذ المجموعة ذات أكبر مبلغ. تُتجاوز المجموعات التي ليس فيها مستخدمون.',
  'The line under the number names the group and gives its share of the total potential savings.': 'السطر تحت الرقم يذكر اسم المجموعة وحصتها من إجمالي التوفير المحتمل.',
  'Potential savings are a reduction in usage at the default strength of the levers, not cash. The pool and the seats decide how much of it shows up on the invoice.':
    'التوفير المحتمل انخفاض في الاستخدام بالقوة الافتراضية للروافع، وليس مبلغًا نقديًا. الرصيد المشترك والتراخيص تحدد مقدار ما يظهر منه في الفاتورة.',
  'The group with the most savings is not always the group that needs the most help. It can simply be the group with the most users or the most usage.':
    'المجموعة ذات أكبر توفير ليست دائمًا المجموعة الأحوج إلى المساعدة. قد تكون ببساطة المجموعة التي فيها أكثر المستخدمين أو أكبر استخدام.',
  'On the Traits lens the total counts each user with a trait once, and the groups overlap, so their shares can add up to more than 100%.':
    'في زاوية مقارنة السمات، يحسب الإجمالي كل مستخدم لديه سمة مرة واحدة، والمجموعات تتداخل، لذا قد يتجاوز مجموع حصصها 100%.',
  'The card shows a dash when nothing can be saved.': 'تعرض البطاقة شرطة عندما لا يوجد ما يمكن توفيره.',
  'A group with $1,200 of potential savings out of $4,000 in all is the biggest opportunity. The card shows $1,200 and 30% of the total.':
    'مجموعة توفيرها المحتمل $1,200 من أصل $4,000 إجمالًا هي أكبر فرصة. تعرض البطاقة $1,200 و30% من الإجمالي.',

  // Potential savings (group)
  'Potential savings (group)': 'التوفير المحتمل (المجموعة)',
  'How much of the usage of a group could be avoided by changing habits, estimated with the six levers of the savings plan at their default strength. It is the sum of the potential savings of the users in the group.':
    'مقدار ما يمكن تجنبه من استخدام المجموعة بتغيير العادات، مقدّرًا بالروافع الست لخطة التوفير بقوتها الافتراضية. وهو مجموع التوفير المحتمل لمستخدمي المجموعة.',
  'Potential savings of a group = sum of the potential savings of its users': 'التوفير المحتمل للمجموعة = مجموع التوفير المحتمل لمستخدميها',
  'Each user gets a figure from the six levers at their default strength, applied one after the other and never more than the usage of the user. The steps are under Potential savings of a user.':
    'يحصل كل مستخدم على قيمة من الروافع الست بقوتها الافتراضية، تُطبق واحدة بعد الأخرى ولا تتجاوز أبدًا استخدام المستخدم. الخطوات موضحة في "التوفير المحتمل للمستخدم".',
  'The figure of a group adds up the figures of its users.': 'قيمة المجموعة هي مجموع قيم مستخدميها.',
  'Where a monthly figure is shown, it is potential savings × 30.4375 ÷ days in the period. The Traits lens shows no monthly figure, because its groups overlap.':
    'حيث تُعرض قيمة شهرية، فهي التوفير المحتمل × 30.4375 ÷ أيام الفترة. زاوية مقارنة السمات لا تعرض قيمة شهرية، لأن مجموعاتها تتداخل.',
  'It is a reduction of usage, not of the bill. The bill goes down only when usage is above the included credits of the whole pool.':
    'إنه انخفاض في الاستخدام، لا في الفاتورة. لا تنخفض الفاتورة إلا عندما يتجاوز الاستخدام الأرصدة المشمولة للرصيد المشترك كله.',
  'It leaves out seat actions, such as moving an idle seat to a cheaper plan, so it is lower than Savings potential on the Overview.':
    'لا يشمل إجراءات التراخيص، مثل نقل ترخيص خامل إلى خطة أرخص، لذا هو أقل من "إمكانية التوفير" في النظرة العامة.',
  'The levers use their default strength. Levers that need token counts or model names give 0 when the file has none.':
    'تستخدم الروافع قوتها الافتراضية. الروافع التي تحتاج إلى عدد الرموز أو أسماء النماذج تعطي 0 عندما لا يحتويها الملف.',
  'The groups of the Traits lens overlap, so their potential savings add up to more than the total. The total counts each user with a trait once.':
    'مجموعات زاوية مقارنة السمات تتداخل، لذا مجموع توفيرها المحتمل أكبر من الإجمالي. الإجمالي يحسب كل مستخدم لديه سمة مرة واحدة.',
  'Row filters change usage and so the savings. Segment filters do not.': 'عوامل تصفية الصفوف تغيّر الاستخدام ومن ثم التوفير. عوامل تصفية المجموعات لا تغيّره.',
  'A group of 10 users has $50 of potential savings each, so $500 in all. In a period of 61 days the monthly figure is $500 × 30.4375 ÷ 61, which is about $250.':
    'مجموعة من 10 مستخدمين لكل منهم توفير محتمل $50، أي $500 إجمالًا. في فترة 61 يومًا تكون القيمة الشهرية $500 × 30.4375 ÷ 61، أي نحو $250.',

  // Share of users vs share of usage
  'Compares how many of the users each group holds with how much of the usage it holds. When the usage bar is longer than the users bar, the group uses more than its headcount suggests.':
    'يقارن حصة كل مجموعة من المستخدمين بحصتها من الاستخدام. عندما يكون عمود الاستخدام أطول من عمود المستخدمين، تستخدم المجموعة أكثر مما يوحي به عدد أفرادها.',
  'Compared with the average user = share of usage of the group ÷ share of users of the group': 'مقارنةً بالمستخدم المتوسط = حصة المجموعة من الاستخدام ÷ حصة المجموعة من المستخدمين',
  'Share of users = users in the group ÷ all users. Share of usage = usage (gross_amount) of the users in the group ÷ usage of all users.':
    'حصة المستخدمين = المستخدمون في المجموعة ÷ كل المستخدمين. حصة الاستخدام = استخدام (gross_amount) مستخدمي المجموعة ÷ استخدام كل المستخدمين.',
  'Bars show both shares for every group that has users. The Users and Usage views show one donut each, with the total in the middle.':
    'الأعمدة تعرض الحصتين لكل مجموعة فيها مستخدمون. عرضا المستخدمين والاستخدام يعرض كل منهما حلقة واحدة، والإجمالي في وسطها.',
  'The donuts leave out the New and Lapsed flags of Engagement, because those users are already in a level. The Traits lens shows bars only, because its groups overlap.':
    'الحلقات لا تشمل علامتي جديد ومتوقف في التفاعل، لأن هؤلاء المستخدمين موجودون أصلًا في أحد المستويات. زاوية مقارنة السمات تعرض الأعمدة فقط، لأن مجموعاتها تتداخل.',
  'The tooltip gives the users, the usage, Per user, per month and the multiple against the average user. 2.0× means that the average user of the group uses twice as much as the average user of everyone.':
    'التلميح يعرض المستخدمين والاستخدام والقيمة لكل مستخدم شهريًا والمضاعف مقارنةً بالمستخدم المتوسط. 2.0× تعني أن المستخدم المتوسط في المجموعة يستخدم ضعف ما يستخدمه المستخدم المتوسط بين الجميع.',
  'Select a bar or a slice to open the Users page with that group.': 'اختر عمودًا أو شريحة لفتح صفحة المستخدمين بتلك المجموعة.',
  'In the Bars view, when a segment filter selects groups, the other groups fade so that the selected ones stand out.':
    'في عرض الأعمدة، عندما يختار عامل تصفية المجموعات مجموعات معينة، تبهت المجموعات الأخرى لتبرز المجموعات المختارة.',
  'It shows where usage is concentrated. It does not say whether the usage is good or wasteful.': 'يُظهر أين يتركز الاستخدام. لا يخبرك هل الاستخدام جيد أم مهدر.',
  'The Power tier holds 8% of the users and 40% of the usage. Compared with the average user = 40% ÷ 8% = 5.0×, so a Power user uses five times as much as the average user.':
    'المستوى المكثف يضم 8% من المستخدمين و40% من الاستخدام. مقارنةً بالمستخدم المتوسط = 40% ÷ 8% = 5.0×، لذا يستخدم المستخدم المكثف خمسة أضعاف ما يستخدمه المستخدم المتوسط.',

  // What stands out
  'A few plain sentences on what is different between the groups of the chosen lens. A sentence appears only when its test is met, so a short list means the groups are similar.':
    'جمل قليلة وبسيطة عمّا يختلف بين مجموعات زاوية المقارنة المختارة. تظهر الجملة فقط عندما يتحقق اختبارها، لذا القائمة القصيرة تعني أن المجموعات متشابهة.',
  'Each sentence has a fixed test on the shares of users and usage of the groups, listed in the steps': 'لكل جملة اختبار ثابت على حصص المجموعات من المستخدمين والاستخدام، كما في الخطوات',
  'Heavy for its size: among the groups that hold at least 10% of the usage, the one with the highest share of usage ÷ share of users, when that ratio is at least 1.5. The sentence gives both shares.':
    'استخدام كبير قياسًا بالحجم: من بين المجموعات التي تملك 10% على الأقل من الاستخدام، المجموعة ذات أعلى نسبة حصة الاستخدام ÷ حصة المستخدمين، عندما تكون النسبة 1.5 على الأقل. تذكر الجملة الحصتين.',
  'Light for its size: among the groups that hold at least 15% of the users, the one with the lowest share of usage ÷ share of users, when that ratio is 0.5 or lower.':
    'استخدام قليل قياسًا بالحجم: من بين المجموعات التي تملك 15% على الأقل من المستخدمين، المجموعة ذات أدنى نسبة حصة الاستخدام ÷ حصة المستخدمين، عندما تكون النسبة 0.5 أو أقل.',
  'Savings in one place: the group with the largest potential savings, when it holds at least 25% of the total. This is not shown on the Traits lens.':
    'توفير متركز في مكان واحد: المجموعة ذات أكبر توفير محتمل، عندما تملك 25% على الأقل من الإجمالي. لا يظهر هذا في زاوية مقارنة السمات.',
  'Gap per user: the groups with the highest and the lowest Per user, per month (the lowest must be above $0), when the highest is at least 2 times the lowest.':
    'الفجوة لكل مستخدم: المجموعتان ذواتا أعلى وأدنى قيمة "لكل مستخدم شهريًا" (يجب أن تكون الأدنى فوق $0)، عندما تكون الأعلى ضعف الأدنى على الأقل.',
  'On the Traits lens, the first sentence says how many users have at least one trait, each counted once, and the second names the most common trait.':
    'في زاوية مقارنة السمات، تذكر الجملة الأولى عدد المستخدمين الذين لديهم سمة واحدة على الأقل، وكل منهم يُحسب مرة واحدة، وتذكر الثانية السمة الأكثر شيوعًا.',
  'When no test is met, the card says that usage is spread fairly evenly. When all users are in one group, it says there is nothing to compare.':
    'عندما لا يتحقق أي اختبار، تذكر البطاقة أن الاستخدام موزّع بشكل متقارب. وعندما يكون كل المستخدمين في مجموعة واحدة، تذكر أنه لا يوجد ما يُقارن.',
  'The sentences are sorted by impact: the one about the groups that hold the largest share of users or usage comes first.':
    'الجمل مرتبة حسب الأثر: الجملة المتعلقة بالمجموعات التي تملك أكبر حصة من المستخدمين أو الاستخدام تأتي أولًا.',
  'The tests are fixed. They do not use the limits in Settings.': 'الاختبارات ثابتة. لا تستخدم الحدود الموجودة في الإعدادات.',
  'The sentences describe the data. They do not give a cause. A heavy group may simply be the people who get the most out of GitHub Copilot.':
    'الجمل تصف البيانات. لا تذكر سببًا. قد تكون المجموعة كثيفة الاستخدام ببساطة هم الأشخاص الأكثر استفادة من GitHub Copilot.',
  'The sentences follow the chosen lens and the row filters. Segment filters do not change them.': 'تتبع الجمل زاوية المقارنة المختارة وعوامل تصفية الصفوف. عوامل تصفية المجموعات لا تغيّرها.',
  'The Power tier is 8% of the users and 40% of the usage. It holds at least 10% of the usage, and 40% ÷ 8% = 5 is at least 1.5, so the card says that Power (100% to 300%) is 8% of users but 40% of usage.':
    'المستوى المكثف يمثّل 8% من المستخدمين و40% من الاستخدام. يملك 10% على الأقل من الاستخدام، و40% ÷ 8% = 5 وهذا 1.5 على الأقل، لذا تذكر البطاقة أن المستوى المكثف (من 100% إلى 300%) يمثّل 8% من المستخدمين لكن 40% من الاستخدام.',

  // Group statistics
  'One row for each group of the chosen lens, with its users, usage, billed amount, average per user, included credits, pool balance and potential savings, and a total row.':
    'صف لكل مجموعة في زاوية المقارنة المختارة، فيه مستخدموها واستخدامها والمبلغ المدفوع الإضافي والمتوسط لكل مستخدم والأرصدة المشمولة وصافي الرصيد والتوفير المحتمل، مع صف للإجمالي.',
  'Row of a group = the sums over the users of the group; total row = all users': 'صف المجموعة = المجاميع على مستخدمي المجموعة؛ صف الإجمالي = كل المستخدمين',
  'Every user with rows that pass the row filters is placed in a group by the rules of the lens.': 'كل مستخدم له صفوف تجتاز عوامل تصفية الصفوف يوضع في مجموعة وفق قواعد زاوية المقارنة.',
  'Users, Usage, Billed, Included credits and Potential savings of a group are the sums over its users. The shares, Per user, per month and Pool balance are worked out from those sums.':
    'المستخدمون والاستخدام والمدفوع الإضافي والأرصدة المشمولة والتوفير المحتمل للمجموعة هي المجاميع على مستخدميها. والحصص والقيمة لكل مستخدم شهريًا وصافي الرصيد تُحسب من هذه المجاميع.',
  'The total row is all users. On the Traits lens it counts each user with at least one trait once.': 'صف الإجمالي هو كل المستخدمين. في زاوية مقارنة السمات يحسب كل مستخدم لديه سمة واحدة على الأقل مرة واحدة.',
  'Groups without users stay in the table, faded, so the list of groups is always complete.': 'المجموعات التي ليس فيها مستخدمون تبقى في الجدول باهتة، لتبقى قائمة المجموعات كاملة دائمًا.',
  'Select a row to open the Users page with that group. A group marked In filter is selected in the segment filters.':
    'اختر صفًا لفتح صفحة المستخدمين بتلك المجموعة. المجموعة التي عليها علامة "ضمن التصفية" مختارة في عوامل تصفية المجموعات.',
  'Segment filters only mark groups as In filter. They never change what a group contains.': 'عوامل تصفية المجموعات تضع علامة "ضمن التصفية" على المجموعات فقط. لا تغيّر أبدًا محتوى المجموعة.',
  'The total row adds up the usage of users only. Rows without a username are in no group, so the total can be lower than Usage on the Overview.':
    'صف الإجمالي يجمع استخدام المستخدمين فقط. الصفوف التي ليس لها اسم مستخدم ليست في أي مجموعة، لذا قد يكون الإجمالي أقل من الاستخدام في النظرة العامة.',
  'The Included credits column appears only when the report gives the seat size of at least one user. Pool balance also needs that no filter other than the dates is on, because the pool belongs to all seats.':
    'عمود الأرصدة المشمولة يظهر فقط عندما يذكر التقرير حجم الترخيص لمستخدم واحد على الأقل. وصافي الرصيد يحتاج أيضًا ألا يكون أي عامل تصفية مفعّلًا غير التواريخ، لأن الرصيد المشترك يخص كل التراخيص.',
  'Billed shows a dash when the file has no billing split.': 'يعرض المدفوع الإضافي شرطة عندما لا يفصل الملف بين المشمول والمدفوع.',
  'Where groups overlap (Traits, and the New and Lapsed flags of Engagement), the rows add up to more than the total row.':
    'حيث تتداخل المجموعات (السمات، وعلامتا جديد ومتوقف في التفاعل)، يكون مجموع الصفوف أكبر من صف الإجمالي.',
  'On the Usage tier lens, the Core row says 12 users, 30% of users, $2,400 of usage and 24% of usage. The total row says 40 users and $10,000.':
    'في زاوية مقارنة مستوى الاستخدام، يذكر صف المستوى الأساسي 12 مستخدمًا و30% من المستخدمين و$2,400 من الاستخدام و24% من الاستخدام. ويذكر صف الإجمالي 40 مستخدمًا و$10,000.',

  // Users (in a group)
  'Users (in a group)': 'المستخدمون (في المجموعة)',
  'How many users are in the group. A user is counted when the user has at least one row that passes the row filters.': 'عدد المستخدمين في المجموعة. يُحسب المستخدم عندما يكون له صف واحد على الأقل يجتاز عوامل تصفية الصفوف.',
  'Users = number of users who belong to the group': 'المستخدمون = عدد المستخدمين الذين ينتمون إلى المجموعة',
  'A user belongs to a group by the rules of the lens, which the Group column explains.': 'ينتمي المستخدم إلى مجموعة وفق قواعد زاوية المقارنة، التي يشرحها عمود المجموعة.',
  'Where groups overlap (Traits, and the New and Lapsed flags of Engagement), a user is counted in every group the user belongs to. The total row counts each user once.':
    'حيث تتداخل المجموعات (السمات، وعلامتا جديد ومتوقف في التفاعل)، يُحسب المستخدم في كل مجموعة ينتمي إليها. صف الإجمالي يحسب كل مستخدم مرة واحدة.',
  'Rows without a username belong to nobody.': 'الصفوف التي ليس لها اسم مستخدم لا تنتمي لأحد.',
  'When 12 of 40 users are in the Core tier, the Users column shows 12 for Core.': 'عندما يكون 12 من 40 مستخدمًا في المستوى الأساسي، يعرض عمود المستخدمين 12 للمستوى الأساسي.',

  // % of users
  'The share of all users that are in the group.': 'حصة المجموعة من كل المستخدمين.',
  '% of users = users in the group ÷ all users': '% من المستخدمين = المستخدمون في المجموعة ÷ كل المستخدمين',
  'The total row shows 100% on most lenses. On the Traits lens it shows the share of users who have at least one trait.':
    'يعرض صف الإجمالي 100% في معظم زوايا المقارنة. وفي زاوية مقارنة السمات يعرض حصة المستخدمين الذين لديهم سمة واحدة على الأقل.',
  'Where groups overlap, the shares add up to more than 100%.': 'حيث تتداخل المجموعات، يتجاوز مجموع الحصص 100%.',
  'It is a share of people, not of usage. The % of usage column shows the usage.': 'إنها حصة من الأشخاص، لا من الاستخدام. عمود "% من الاستخدام" يعرض الاستخدام.',
  '12 of 40 users in a group give 30%.': '12 من 40 مستخدمًا في مجموعة تعني 30%.',

  // % of usage
  'The share of all usage that comes from the users of the group.': 'حصة الاستخدام الكلي التي تأتي من مستخدمي المجموعة.',
  '% of usage = usage of the group ÷ usage of all users': '% من الاستخدام = استخدام المجموعة ÷ استخدام كل المستخدمين',
  'Usage is the amount charged, so rows that went through Auto are already after the Auto discount.': 'الاستخدام هو المبلغ المحتسب، لذا الصفوف التي مرت عبر Auto محسوبة أصلًا بعد خصم Auto.',
  'The total row shows 100% on most lenses. On the Traits lens it shows the share of usage that comes from users who have at least one trait.':
    'يعرض صف الإجمالي 100% في معظم زوايا المقارنة. وفي زاوية مقارنة السمات يعرض حصة الاستخدام التي تأتي من المستخدمين الذين لديهم سمة واحدة على الأقل.',
  'Rows without a username are in no group, so the shares are shares of the usage of users only.': 'الصفوف التي ليس لها اسم مستخدم ليست في أي مجموعة، لذا الحصص هي حصص من استخدام المستخدمين فقط.',
  'A group with $2,400 of $10,000 in usage has 24%.': 'المجموعة التي استخدامها $2,400 من $10,000 حصتها 24%.',

  // Per user, per month (group)
  'Per user, per month (group)': 'لكل مستخدم شهريًا (المجموعة)',
  'The average usage of a user in the group, scaled to a month, so that groups and periods of different lengths can be compared.':
    'متوسط استخدام المستخدم في المجموعة، محسوبًا على شهر، لتمكن مقارنة المجموعات والفترات ذات الأطوال المختلفة.',
  'Per user, per month = usage of the group ÷ users in the group × 30.4375 ÷ days in the period': 'لكل مستخدم شهريًا = استخدام المجموعة ÷ المستخدمون في المجموعة × 30.4375 ÷ أيام الفترة',
  'It is an average over the users of the group, so a few heavy users lift it. The Heaviest users list of a group card names them.':
    'إنه متوسط على مستخدمي المجموعة، لذا يرفعه قلة من المستخدمين الكثيفين. قائمة "أكثر المستخدمين استخدامًا" في بطاقة المجموعة تذكر أسماءهم.',
  'The total row uses all users. On the Traits lens it uses the users who have at least one trait.': 'صف الإجمالي يستخدم كل المستخدمين. وفي زاوية مقارنة السمات يستخدم المستخدمين الذين لديهم سمة واحدة على الأقل.',
  'A group without users shows a dash.': 'المجموعة التي ليس فيها مستخدمون تعرض شرطة.',
  '10 users used $1,500 in a period of 61 days. That is $150 per user, and $150 × 30.4375 ÷ 61 is about $75 per user, per month.':
    '10 مستخدمين استخدموا $1,500 في فترة 61 يومًا. أي $150 لكل مستخدم، و$150 × 30.4375 ÷ 61 تساوي نحو $75 لكل مستخدم شهريًا.',

  // Included credits (group)
  'Included credits (group)': 'الأرصدة المشمولة (المجموعة)',
  'The credits that come with the seats of the users in the group, in dollars. Together they are the part of the shared pool that belongs to the group.':
    'الأرصدة التي تأتي مع تراخيص مستخدمي المجموعة، بالدولار. وهي معًا الجزء من الرصيد المشترك الذي يخص المجموعة.',
  'Included credits of a group = sum of the included credits of its users': 'الأرصدة المشمولة للمجموعة = مجموع الأرصدة المشمولة لمستخدميها',
  'Included credits of a user = for each calendar month, the largest total_monthly_quota the user shows in that month, in dollars at $0.01 per credit, added up over the months.':
    'الأرصدة المشمولة للمستخدم = لكل شهر تقويمي، أكبر قيمة total_monthly_quota تظهر للمستخدم في ذلك الشهر، بالدولار بسعر $0.01 للرصيد، مجموعةً على الأشهر.',
  'A user whose rows show no seat size gets the most common seat size in the report for each month with usage.':
    'المستخدم الذي لا تُظهر صفوفه حجم الترخيص يأخذ حجم الترخيص الأكثر شيوعًا في التقرير لكل شهر فيه استخدام.',
  'Add up the figures of the users in the group.': 'اجمع قيم مستخدمي المجموعة.',
  'The column appears only when the report gives the seat size of at least one user. Without any, every figure would be an assumption, so the page leaves the column out.':
    'يظهر العمود فقط عندما يذكر التقرير حجم الترخيص لمستخدم واحد على الأقل. وبدون ذلك تكون كل قيمة افتراضًا، لذا لا تعرض الصفحة العمود.',
  'A note above the table says how many users have an assumed seat size.': 'ملاحظة فوق الجدول تذكر عدد المستخدمين الذين حجم ترخيصهم مفترض.',
  'Only users with rows are counted. Seats with no row in the report are not in the figure.': 'يُحسب فقط المستخدمون الذين لهم صفوف. التراخيص التي ليس لها صف في التقرير لا تدخل في القيمة.',
  'A month counts in full even when the period covers only part of it, so a short period shows more included credits than the days in it would suggest.':
    'يُحسب الشهر كاملًا حتى لو غطت الفترة جزءًا منه فقط، لذا تُظهر الفترة القصيرة أرصدة مشمولة أكثر مما توحي به أيامها.',
  'Four users on Business seats (1,900 credits, $19 each) have 4 × $19 = $76 of included credits in a month.':
    'أربعة مستخدمين بتراخيص Business (1,900 رصيد، أي $19 لكل منهم) لديهم 4 × $19 = $76 من الأرصدة المشمولة في الشهر.',

  // Pool balance
  'Whether the users of a group, taken together, used less or more than the credits that come with their own seats. A positive balance means the group left credits in the shared pool. A negative balance means the group drew on the pool.':
    'هل استخدم مستخدمو المجموعة معًا أقل أم أكثر من الأرصدة التي تأتي مع تراخيصهم. الرصيد الموجب يعني أن المجموعة تركت أرصدة في الرصيد المشترك. والرصيد السالب يعني أن المجموعة سحبت من الرصيد المشترك.',
  'Pool balance = included credits − usage': 'صافي الرصيد = الأرصدة المشمولة − الاستخدام',
  'Included credits of the group = the sum for its users, as described under Included credits.': 'الأرصدة المشمولة للمجموعة = المجموع لمستخدميها، كما هو موضح في "الأرصدة المشمولة".',
  'Usage of the group = the sum of gross_amount of its users.': 'استخدام المجموعة = مجموع gross_amount لمستخدميها.',
  'Pool balance = included credits − usage. The total row is the balance of everyone.': 'صافي الرصيد = الأرصدة المشمولة − الاستخدام. صف الإجمالي هو رصيد الجميع.',
  'The pool is shared by all seats, so a negative balance is not a bill. It costs extra only when the whole pool is used up.':
    'الرصيد المشترك تتشاركه كل التراخيص، لذا الرصيد السالب ليس فاتورة. لا يكلف شيئًا إضافيًا إلا عندما ينفد الرصيد المشترك كله.',
  'Months are added up before the comparison. The pool resets every month and unused credits do not carry over, so a quiet month can hide a month in which the users went over.':
    'تُجمع الأشهر قبل المقارنة. يُعاد ضبط الرصيد المشترك كل شهر ولا تُرحَّل الأرصدة غير المستخدمة، لذا قد يخفي شهر هادئ شهرًا تجاوز فيه المستخدمون أرصدتهم.',
  'The column is shown only when no filter other than the dates is on, because the pool belongs to all seats and a filter shows only some of them.':
    'يُعرض العمود فقط عندما لا يكون أي عامل تصفية مفعّلًا غير التواريخ، لأن الرصيد المشترك يخص كل التراخيص وعامل التصفية يعرض بعضها فقط.',
  'A group of 4 users on Business seats has $76 of included credits and $100 of usage. Pool balance = $76 − $100 = −$24, so the group drew $24 on the pool.':
    'مجموعة من 4 مستخدمين بتراخيص Business لديها $76 من الأرصدة المشمولة و$100 من الاستخدام. صافي الرصيد = $76 − $100 = −$24، لذا سحبت المجموعة $24 من الرصيد المشترك.',

  // Heaviest users
  'The five users with the most usage in the group, to show who is behind the numbers of the group.': 'المستخدمون الخمسة الأعلى استخدامًا في المجموعة، لتعرف من وراء أرقام المجموعة.',
  'Heaviest users = the 5 users of the group with the largest usage': 'أكثر المستخدمين استخدامًا = المستخدمون الخمسة في المجموعة ذوو أكبر استخدام',
  'Take the users of the group, ranked by usage (gross_amount), largest first. Users with the same usage are ordered by name.':
    'خذ مستخدمي المجموعة مرتبين حسب الاستخدام (gross_amount)، من الأكبر. المستخدمون ذوو الاستخدام نفسه يُرتَّبون حسب الاسم.',
  'Show the first five. Select a name to open that user.': 'اعرض الخمسة الأوائل. اختر اسمًا لفتح ذلك المستخدم.',
  'A group with fewer than five users lists all of them.': 'المجموعة التي فيها أقل من خمسة مستخدمين تعرضهم كلهم.',
  'On the Traits lens, a user is listed under every trait the user has.': 'في زاوية مقارنة السمات، يُعرض المستخدم تحت كل سمة لديه.',
  'A group has 12 users. The card lists the five with the highest usage. Show users opens all 12.':
    'مجموعة فيها 12 مستخدمًا. تعرض البطاقة الخمسة الأعلى استخدامًا. وزر "اعرض المستخدمين" يفتح الـ12 كلهم.',

  // Compare two lenses
  'Puts one lens in the rows and another in the columns, and counts the users who are in both groups. It shows, for example, how many Power users are only Occasional users.':
    'يضع زاوية مقارنة في الصفوف وأخرى في الأعمدة، ويعدّ المستخدمين الموجودين في المجموعتين معًا. يُظهر مثلًا كم من المستخدمين المكثفين لا يستخدمونه إلا بشكل متقطع.',
  'Cell = users in the row group and in the column group, and the usage of those users': 'الخلية = المستخدمون في مجموعة الصف ومجموعة العمود معًا، واستخدام هؤلاء المستخدمين',
  'Each user is placed in a group of the row lens and a group of the column lens, with the rules of each lens.':
    'يوضع كل مستخدم في مجموعة من زاوية مقارنة الصفوف ومجموعة من زاوية مقارنة الأعمدة، وفق قواعد كل منهما.',
  'The top number in a cell is the number of users in both groups. The second number is the usage (gross_amount) of those users.':
    'الرقم العلوي في الخلية هو عدد المستخدمين في المجموعتين معًا. والرقم الثاني هو استخدام (gross_amount) هؤلاء المستخدمين.',
  'The row and column totals are the full size of each group, and the corner is all users.': 'مجاميع الصفوف والأعمدة هي الحجم الكامل لكل مجموعة، والزاوية هي كل المستخدمين.',
  'Shade by Users or Usage chooses which of the two numbers darkens a cell. A dark cell is large in that number.':
    'خيار "التظليل حسب" المستخدمين أو الاستخدام يحدد أي الرقمين يجعل الخلية أغمق. الخلية الغامقة كبيرة في ذلك الرقم.',
  'Select a cell, a row name or a column name to open the Users page with those groups.': 'اختر خلية أو اسم صف أو اسم عمود لفتح صفحة المستخدمين بتلك المجموعات.',
  'Groups without users are left out of the rows and columns.': 'المجموعات التي ليس فيها مستخدمون لا تظهر في الصفوف ولا الأعمدة.',
  'On the Traits lens, and with the New and Lapsed flags of Engagement, a user can be in several groups. Such a user appears in several cells, so the cells can add up to more than the totals.':
    'في زاوية مقارنة السمات، ومع علامتي جديد ومتوقف في التفاعل، قد يكون المستخدم في عدة مجموعات. يظهر هذا المستخدم في عدة خلايا، لذا قد يتجاوز مجموع الخلايا المجاميع.',
  'A lens that the report cannot support, such as Auto use class without a model column, is not offered.': 'زاوية المقارنة التي لا يدعمها التقرير، مثل فئة استخدام Auto بدون عمود model، لا تُعرض كخيار.',
  'Segment filters do not change the counts.': 'عوامل تصفية المجموعات لا تغيّر الأعداد.',
  'With Usage tier in the rows and Engagement in the columns, the cell for Power and Occasional shows 3 and $1,200. Three users are in the Power tier and are also Occasional, and together they used $1,200.':
    'مع مستوى الاستخدام في الصفوف والتفاعل في الأعمدة، تعرض خلية المكثف والمتقطع 3 و$1,200. ثلاثة مستخدمين في المستوى المكثف ومتقطعون أيضًا، واستخدموا معًا $1,200.',

  // Who draws on the shared pool
  'Shows how many users used more than the credits of their own seat (they drew on the shared pool) and how many used less (they left credits in it), and how much each side adds up to.':
    'يُظهر عدد المستخدمين الذين استخدموا أكثر من أرصدة ترخيصهم (سحبوا من الرصيد المشترك) وعدد من استخدموا أقل (تركوا فيه أرصدة)، ومجموع كل طرف.',
  'Balance of a user = included credits of the user − usage of the user': 'رصيد المستخدم = الأرصدة المشمولة للمستخدم − استخدام المستخدم',
  'Included credits of a user = the seat size of each month in dollars, added up, as described under Usage tier. A user whose seat size is not in the report gets the most common seat size.':
    'الأرصدة المشمولة للمستخدم = حجم الترخيص لكل شهر بالدولار، مجموعًا، كما هو موضح في "مستوى الاستخدام". المستخدم الذي ليس حجم ترخيصه في التقرير يأخذ حجم الترخيص الأكثر شيوعًا.',
  'Balance of a user = included credits − usage, over the whole period.': 'رصيد المستخدم = الأرصدة المشمولة − الاستخدام، على الفترة كلها.',
  'Drew on the pool: the users with a negative balance. The amount is those balances added up, shown as a positive number.':
    'سحب من الرصيد المشترك: المستخدمون ذوو الرصيد السالب. المبلغ هو مجموع تلك الأرصدة، معروضًا كرقم موجب.',
  'Left in the pool: the users with a positive balance. The amount is those balances added up.': 'ترك في الرصيد المشترك: المستخدمون ذوو الرصيد الموجب. المبلغ هو مجموع تلك الأرصدة.',
  'Billed on top of seats = the sum of net_amount, as on the Overview. It is what the pool could not cover.':
    'المدفوع الإضافي فوق التراخيص = مجموع net_amount، كما في النظرة العامة. وهو ما لم يستطع الرصيد المشترك تغطيته.',
  'The pool is shared, so a user who draws on it costs nothing extra while the credits of the other users cover the use. Extra cost starts only when the whole pool is used up.':
    'الرصيد المشترك مشترك، لذا المستخدم الذي يسحب منه لا يكلف شيئًا إضافيًا ما دامت أرصدة المستخدمين الآخرين تغطي استخدامه. تبدأ التكلفة الإضافية فقط عندما ينفد الرصيد المشترك كله.',
  'The pool resets every month and unused credits do not carry over, but these figures add up the whole period. They can hide a month in which the pool ran short.':
    'يُعاد ضبط الرصيد المشترك كل شهر ولا تُرحَّل الأرصدة غير المستخدمة، لكن هذه الأرقام تجمع الفترة كلها. قد تخفي شهرًا نفد فيه الرصيد المشترك.',
  'Seats with no row in the report are not counted, so the credits left in the pool can be higher in reality.':
    'التراخيص التي ليس لها صف في التقرير لا تُحسب، لذا قد تكون الأرصدة المتبقية في الرصيد المشترك أعلى في الواقع.',
  'The card appears only when no filter other than the dates is on, because the pool belongs to all seats, and only when the report gives at least one seat size.':
    'تظهر البطاقة فقط عندما لا يكون أي عامل تصفية مفعّلًا غير التواريخ، لأن الرصيد المشترك يخص كل التراخيص، وفقط عندما يذكر التقرير حجم ترخيص واحد على الأقل.',
  'Users whose seat size is not in the report get the most common seat size, so their balance is an assumption. A note on the page says how many there are.':
    'المستخدمون الذين ليس حجم ترخيصهم في التقرير يأخذون حجم الترخيص الأكثر شيوعًا، لذا رصيدهم افتراض. ملاحظة في الصفحة تذكر عددهم.',
  'Billed on top of seats is left out when the file has no billing split.': 'لا يُعرض المدفوع الإضافي فوق التراخيص عندما لا يفصل الملف بين المشمول والمدفوع.',
  'On a Business seat ($19 of included credits a month), a user with $49 of usage has a balance of −$30 and drew on the pool. A user with $4 of usage has a balance of +$15 and left credits in it.':
    'في ترخيص Business ($19 من الأرصدة المشمولة شهريًا)، المستخدم الذي استخدم $49 رصيده −$30 وقد سحب من الرصيد المشترك. والمستخدم الذي استخدم $4 رصيده +$15 وقد ترك فيه أرصدة.',
};

export default arabic;
