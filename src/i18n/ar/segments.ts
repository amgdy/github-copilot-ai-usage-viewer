import type { Dict, PluralEntry } from '../core';

const p = (one: string, two: string, few: string, many: string, other: string): PluralEntry => ({ zero: other, one, two, few, many, other });

/** Arabic text for the Segments page: lenses, group cards, the group table, the charts, the shared pool and the label rules. */
const ar: Dict = {
  // Page
  'What kinds of users do you have, how much does each kind use, and what should you do about each? Every user has a persona, a usage tier, an engagement level, a usage profile, a Pareto class and an Auto use class, and may have traits. Choose a lens to compare the groups of one label.':
    'ما أنواع المستخدمين لديك، وكم يستخدم كل نوع، وماذا تفعل مع كل نوع؟ لكل مستخدم نمط مستخدم ومستوى استخدام ومستوى تفاعل وملف استخدام وفئة باريتو وفئة استخدام Auto، وقد تكون له سمات. اختر زاوية مقارنة لتقارن مجموعات تصنيف واحد.',
  '{title} Not available for this report. Select it to see why.': '{title} غير متاح لهذا التقرير. اختره لترى السبب.',
  'No individual users in this data': 'لا يوجد مستخدمون أفراد في هذه البيانات',
  'Every row in view is repo-level or unattributed, so there are no users to classify. Widen the filters or load a report with a user column.':
    'كل الصفوف المعروضة على مستوى المستودع أو غير منسوبة لأحد، لذا لا يوجد مستخدمون لتصنيفهم. وسّع عوامل التصفية أو حمّل تقريرًا فيه عمود المستخدم.',
  'Pool figures are hidden while filters are on': 'أرقام الرصيد المشترك مخفية ما دامت عوامل التصفية مفعّلة',
  'This page compares groups using every user in the date range and row filters. Segment filters only mark the groups they select. Pool balance and the shared pool section are hidden while a filter other than the date range is on, because included credits are shared across all seats and cannot be split by filter.':
    'تقارن هذه الصفحة المجموعات باستخدام كل المستخدمين ضمن نطاق التاريخ وعوامل تصفية الصفوف. عوامل تصفية المجموعات تميّز المجموعات المختارة فقط. يُخفى صافي الرصيد وقسم الرصيد المشترك ما دام عامل تصفية غير نطاق التاريخ مفعّلًا، لأن الأرصدة المشمولة مشتركة بين كل التراخيص ولا يمكن تقسيمها حسب عامل التصفية.',
  'Compare by': 'قارن حسب',
  Lens: 'زاوية المقارنة',
  'Compare the groups': 'قارن المجموعات',
  'Group profiles': 'بطاقات المجموعات',
  'What each group means and what to do about it. Select a row, a card or a name to dig in.':
    'ما تعنيه كل مجموعة وما ينبغي فعله معها. اختر صفًا أو بطاقة أو اسمًا لترى التفاصيل.',
  'Combine two lenses': 'اجمع زاويتي مقارنة',
  'See where two kinds of label meet, for example users in the Power usage tier who are only Occasional.':
    'اعرف أين يلتقي نوعان من التصنيفات، مثل المستخدمين في مستوى الاستخدام المكثف الذين لا يستخدمونه إلا بشكل متقطع.',
  'The shared pool': 'الرصيد المشترك',
  'Included credits are shared, so one user’s unused credits can cover another user’s heavy use.':
    'الأرصدة المشمولة مشتركة، لذا يمكن أن تغطي الأرصدة غير المستخدمة لمستخدم الاستخدام الكثيف لمستخدم آخر.',

  // Concentration chart
  'Share of users next to share of usage': 'حصة المستخدمين بجانب حصة الاستخدام',
  'Donut of users by group': 'حلقة المستخدمين حسب المجموعة',
  'Donut of usage by group': 'حلقة الاستخدام حسب المجموعة',
  'Compared with the average user': 'مقارنةً بالمستخدم المتوسط',
  'Share of users': 'حصة المستخدمين',
  users: 'المستخدمون',
  usage: 'الاستخدام',
  'No group has users in the data in view': 'لا توجد مجموعة فيها مستخدمون في البيانات المعروضة',
  'There is no usage to show': 'لا يوجد استخدام لعرضه',
  'Share of users vs share of usage': 'حصة المستخدمين مقابل حصة الاستخدام',
  'A group whose usage bar is longer than its users bar uses more than its headcount suggests.':
    'المجموعة التي يكون عمود استخدامها أطول من عمود مستخدميها تستخدم أكثر مما يوحي به عدد أفرادها.',
  'Share of users and share of usage for each group of the {lens} lens': 'حصة المستخدمين وحصة الاستخدام لكل مجموعة في زاوية المقارنة {lens}',
  'Chart view': 'طريقة عرض المخطط',

  // Cross-lens matrix
  'Darker cells hold more users': 'الخلايا الأغمق فيها مستخدمون أكثر',
  'Darker cells hold more usage': 'الخلايا الأغمق فيها استخدام أكثر',
  '{users}, {amount} of usage': '{users}، و{amount} من الاستخدام',
  '{row} and {col}': '{row} و{col}',
  'Compare two lenses': 'قارن زاويتين',
  'Each cell counts the users who are in both groups. Select a cell to list them.':
    'كل خلية تعدّ المستخدمين الموجودين في المجموعتين معًا. اختر خلية لعرض قائمتهم.',
  'Row and column totals are the full size of each group. The second line in a cell is the usage of those users.':
    'مجاميع الصفوف والأعمدة هي الحجم الكامل لكل مجموعة. السطر الثاني في الخلية هو استخدام هؤلاء المستخدمين.',
  'Traits and the New and Lapsed flags overlap other groups, so a user can appear in more than one row or column.':
    'السمات وعلامتا "جديد" و"متوقف" تتداخل مع المجموعات الأخرى، لذا قد يظهر المستخدم في أكثر من صف أو عمود.',
  Rows: 'الصفوف',
  'Lens for the rows': 'زاوية المقارنة للصفوف',
  'Lens for the columns': 'زاوية المقارنة للأعمدة',
  'Shade by': 'التظليل حسب',
  'Shade cells by': 'ظلّل الخلايا حسب',
  'Nothing to compare': 'لا يوجد ما يُقارن',
  'One of the two lenses has no users in the data in view.': 'إحدى زاويتي المقارنة ليس فيها مستخدمون في البيانات المعروضة.',
  '{rows} by {columns}': '{rows} حسب {columns}',
  'Show users in {group}': 'اعرض المستخدمين في {group}',
  '{group}: no users': '{group}: لا يوجد مستخدمون',
  '{group}: {numbers}': '{group}: {numbers}',
  '{group}: {numbers}. Show these users.': '{group}: {numbers}. اعرض هؤلاء المستخدمين.',
  '{group} in total: {numbers}. Show these users.': '{group} إجمالًا: {numbers}. اعرض هؤلاء المستخدمين.',

  // Group cards
  '{users}, {share} of usage': '{users}، و{share} من الاستخدام',
  'This group is selected in the filters': 'هذه المجموعة مختارة في عوامل التصفية',
  'In filter': 'ضمن التصفية',
  'No user has this label in the data in view.': 'لا يوجد مستخدم بهذا التصنيف في البيانات المعروضة.',
  'Potential savings': 'التوفير المحتمل',
  'What it means': 'ماذا تعني',
  'Heaviest users': 'أكثر المستخدمين استخدامًا',
  'Open {name}: {amount} of usage': 'افتح {name}: {amount} من الاستخدام',
  'Show users': 'اعرض المستخدمين',
  'No group has users': 'لا توجد مجموعة فيها مستخدمون',
  'Every group of this lens is empty in the data in view.': 'كل مجموعات زاوية المقارنة هذه فارغة في البيانات المعروضة.',
  'No users': 'لا يوجد مستخدمون',
  'A flag: these users are also in an activity level': 'علامة: هؤلاء المستخدمون موجودون أيضًا في أحد مستويات النشاط',

  // Group table
  Group: 'المجموعة',
  'Users with a trait': 'المستخدمون الذين لديهم سمة',
  'All users': 'كل المستخدمين',
  'Number of users in the group.': 'عدد المستخدمين في المجموعة.',
  '% of users': '% من المستخدمين',
  'Share of users (%)': 'حصة المستخدمين (%)',
  'Share of all users that are in this group.': 'حصة هذه المجموعة من كل المستخدمين.',
  'Usage before included credits are taken off.': 'الاستخدام قبل خصم الأرصدة المشمولة.',
  '% of usage': '% من الاستخدام',
  'Share of all usage that comes from this group.': 'حصة هذه المجموعة من كل الاستخدام.',
  'Billed on top of seats: usage that included credits did not cover.': 'مدفوع إضافي فوق التراخيص: الاستخدام الذي لم تغطه الأرصدة المشمولة.',
  'This file has no billing split, so the billed amount is not known.': 'هذا الملف لا يفصل بين المشمول والمدفوع، لذا المبلغ المدفوع الإضافي غير معروف.',
  'Per user, per month (USD)': 'لكل مستخدم شهريًا (USD)',
  'Average usage per user, scaled to a 30.4375-day month.': 'متوسط الاستخدام لكل مستخدم، محسوبًا على شهر من 30.4375 يومًا.',
  'Included credits (USD)': 'الأرصدة المشمولة (USD)',
  'Included credits that come with the seats of these users in the period, in dollars.': 'الأرصدة المشمولة التي تأتي مع تراخيص هؤلاء المستخدمين في الفترة، بالدولار.',
  'Pool balance': 'صافي الرصيد',
  'Pool balance (USD)': 'صافي الرصيد (USD)',
  'Included credits minus usage. Positive: the group left credits in the shared pool. Negative: the group used more than its own credits and drew on the pool.':
    'الأرصدة المشمولة ناقص الاستخدام. موجب: تركت المجموعة أرصدة في الرصيد المشترك. سالب: استخدمت المجموعة أكثر من أرصدتها وسحبت من الرصيد المشترك.',
  'Potential savings (USD)': 'التوفير المحتمل (USD)',
  'Estimated reduction in usage if the default recommendations were followed. This is not cash.':
    'الانخفاض المقدّر في الاستخدام إذا اتُّبعت التوصيات الافتراضية. هذا ليس مبلغًا نقديًا.',
  'Show users: {group}': 'اعرض المستخدمين: {group}',
  'Group statistics': 'إحصاءات المجموعات',
  'Select a row to list the users of that group.': 'اختر صفًا لعرض مستخدمي تلك المجموعة.',
  'No groups to show.': 'لا توجد مجموعات لعرضها.',

  // Insights and rules section
  'What stands out': 'ما يلفت الانتباه',
  'How the labels are decided': 'كيف تُحدَّد التصنيفات',
  'The rules use the thresholds set in Settings, so the numbers below change when you change them.':
    'تستخدم القواعد الحدود المضبوطة في الإعدادات، لذا تتغير الأرقام أدناه عندما تغيّرها.',
  'Change thresholds': 'غيّر الحدود',
  'Formula, columns used and an example': 'المعادلة والأعمدة المستخدمة ومثال',

  // KPIs
  'Users with a trait, each counted once': 'المستخدمون الذين لديهم سمة، كل منهم يُحسب مرة واحدة',
  'About {amount} a month': 'نحو {amount} شهريًا',
  'Traits overlap: one user can have several. This is the total for users with at least one trait, each counted once. Do not add the trait rows together.':
    'السمات تتداخل: قد يكون للمستخدم الواحد عدة سمات. هذا هو الإجمالي للمستخدمين الذين لديهم سمة واحدة على الأقل، وكل منهم يُحسب مرة واحدة. لا تجمع صفوف السمات معًا.',
  'Estimated reduction in usage if users followed the default recommendations. Included credits already cover part of it, so cash savings are lower.':
    'الانخفاض المقدّر في الاستخدام إذا اتبع المستخدمون التوصيات الافتراضية. الأرصدة المشمولة تغطي جزءًا منه أصلًا، لذا التوفير النقدي أقل.',
  'Biggest opportunity': 'أكبر فرصة',
  '{group}, {share} of the total': '{group}، {share} من الإجمالي',
  'No savings estimated': 'لا يوجد توفير مقدّر',
  'The group with the largest potential savings. It is a reduction in usage, not cash.': 'المجموعة ذات أكبر توفير محتمل. إنه انخفاض في الاستخدام، وليس مبلغًا نقديًا.',
  'Biggest share of usage': 'أكبر حصة من الاستخدام',
  '{group}, {share} of users': '{group}، {share} من المستخدمين',
  'No usage yet': 'لا يوجد استخدام بعد',
  'The group that accounts for the largest part of the usage, and what share of the users it holds.':
    'المجموعة التي تمثّل أكبر جزء من الاستخدام، وحصتها من المستخدمين.',
  'Largest group by users': 'أكبر مجموعة حسب المستخدمين',
  '{group}, {users}': '{group}، {users}',
  'The group with the most users, shown as its share of all users.': 'المجموعة التي فيها أكثر المستخدمين، معروضة كحصة من كل المستخدمين.',
  'Heaviest per user': 'الأعلى استخدامًا لكل مستخدم',
  '{group}, per user, per month': '{group}، لكل مستخدم شهريًا',
  'Average usage per user, per month, in the group with the highest average.': 'متوسط الاستخدام لكل مستخدم شهريًا في المجموعة ذات أعلى متوسط.',
  'Groups in use': 'المجموعات المستخدمة',
  '{used} of {all}': '{used} من {all}',
  'Every group has users': 'كل مجموعة فيها مستخدمون',
  '{groups} with no users': '{groups} بلا مستخدمين',
  'How many of the groups in this lens have at least one user.': 'عدد المجموعات في زاوية المقارنة هذه التي فيها مستخدم واحد على الأقل.',

  // Lens notes
  '{credits} credits ({amount}) a month': '{credits} رصيد ({amount}) شهريًا',
  'Segment filters are on': 'عوامل تصفية المجموعات مفعّلة',
  'Clear segment filters': 'امسح عوامل تصفية المجموعات',
  'Other pages list only the selected groups. Group sizes and shares here ignore these filters, so you can still compare every group. Selected groups are marked In filter.':
    'الصفحات الأخرى تعرض المجموعات المختارة فقط. أحجام المجموعات وحصصها هنا لا تتأثر بهذه العوامل، لذا يمكنك مقارنة كل المجموعات. المجموعات المختارة عليها علامة "ضمن التصفية".',
  'This report does not say which seats users have': 'هذا التقرير لا يذكر نوع ترخيص كل مستخدم',
  '{users} without seat information': '{users} بلا معلومات عن الترخيص',
  'Included credits are unknown, so the usage tier and the persona assume {assumed} for everyone. Included credits and pool figures are not shown.':
    'الأرصدة المشمولة غير معروفة، لذا يفترض مستوى الاستخدام ونمط المستخدم {assumed} للجميع. لا تُعرض الأرصدة المشمولة ولا أرقام الرصيد المشترك.',
  'Their included credits are assumed to be {assumed}, the most common seat in the data. This affects their usage tier and persona.':
    'يُفترض أن أرصدتهم المشمولة {assumed}، وهو الترخيص الأكثر شيوعًا في البيانات. هذا يؤثر في مستوى استخدامهم ونمطهم.',
  'Some traits cannot be detected in this data': 'لا يمكن رصد بعض السمات في هذه البيانات',
  '{label}: {amount}': '{label}: {amount}',

  // Shared pool
  '{takers} used {taken} more than their own included credits. {lenders} used less than their own included credits and left {left} in the shared pool.':
    '{takers} استخدموا {taken} أكثر من أرصدتهم المشمولة. {lenders} استخدموا أقل من أرصدتهم المشمولة وتركوا {left} في الرصيد المشترك.',
  '{users} used {amount} more than their own included credits. No user left credits unused.':
    '{users} استخدموا {amount} أكثر من أرصدتهم المشمولة. لم يترك أي مستخدم أرصدة دون استخدام.',
  'No user used more than their own included credits. {users} used less than their own included credits and left {amount} in the shared pool.':
    'لم يستخدم أي مستخدم أكثر من أرصدته المشمولة. {users} استخدموا أقل من أرصدتهم المشمولة وتركوا {amount} في الرصيد المشترك.',
  'Every user used about their own included credits, so nobody drew on the pool or added to it.':
    'استخدم كل مستخدم ما يقارب أرصدته المشمولة، لذا لم يسحب أحد من الرصيد المشترك ولم يضف إليه.',
  'The credits that lighter users left cover what heavier users drew, with {amount} to spare.':
    'الأرصدة التي تركها المستخدمون الأخف استخدامًا تغطي ما سحبه الأكثر استخدامًا، ويبقى فائض قدره {amount}.',
  'Heavier users drew {amount} more than lighter users left. Credits of seats without usage are not counted here.':
    'سحب المستخدمون الأكثر استخدامًا {amount} أكثر مما تركه الأخف استخدامًا. أرصدة التراخيص التي ليس لها استخدام غير محسوبة هنا.',
  'Who draws on the shared pool': 'من يسحب من الرصيد المشترك',
  'Included credits are pooled across all seats. Each user is compared with their own included credits.':
    'الأرصدة المشمولة مجمّعة عبر كل التراخيص. يُقارن كل مستخدم بأرصدته المشمولة.',
  'Drew on the pool': 'سحب من الرصيد المشترك',
  'Left in the pool': 'ترك في الرصيد المشترك',
  'Billed on top of seats in this report: {amount}.': 'المدفوع الإضافي فوق التراخيص في هذا التقرير: {amount}.',
  'This file has no billing split, so what was billed on top of seats is not known.':
    'هذا الملف لا يفصل بين المشمول والمدفوع، لذا المدفوع الإضافي فوق التراخيص غير معروف.',
  'Why pooling matters': 'لماذا يهم الرصيد المشترك',
  'Pooling makes heavy users cheap in total: the credits that lighter users leave unused pay for them. Once the pool is empty, further usage is billed on top of the seats, so the same heavy use turns into overage.':
    'الرصيد المشترك يجعل المستخدمين الكثيفين أقل تكلفة إجمالًا: الأرصدة التي لا يستخدمها الأخف استخدامًا تغطيهم. وعندما ينفد الرصيد المشترك، يُدفع أي استخدام إضافي فوق التراخيص، فيتحول الاستخدام الكثيف نفسه إلى تكلفة زائدة.',
  'The pool resets every month and unused credits do not carry over. These figures add up all {months} months, so they can hide a month in which the pool ran short.':
    'يُعاد ضبط الرصيد المشترك كل شهر ولا تُرحَّل الأرصدة غير المستخدمة. هذه الأرقام تجمع كل الأشهر (عددها {months})، لذا قد تخفي شهرًا نفد فيه الرصيد المشترك.',
  'Usage in the report is higher than the included credits of the seats it lists, so the real pool is larger than the report shows. Add the seat roster in Settings for exact figures.':
    'الاستخدام في التقرير أعلى من الأرصدة المشمولة للتراخيص المذكورة فيه، لذا الرصيد المشترك الحقيقي أكبر مما يظهره التقرير. أضف قائمة التراخيص في الإعدادات للحصول على أرقام دقيقة.',
  'Based on the seats that appear in the report.': 'بناءً على التراخيص الظاهرة في التقرير.',

  // Rule summaries
  'One label per user. The first rule that fits wins.': 'تصنيف واحد لكل مستخدم. أول قاعدة تنطبق هي التي تُعتمد.',
  'Usage compared with the user’s own included credits.': 'الاستخدام مقارنةً بالأرصدة المشمولة للمستخدم.',
  'How often the user is active, plus the New and Lapsed flags.': 'مدى تكرار نشاط المستخدم، إضافةً إلى علامتي "جديد" و"متوقف".',
  'Which model tiers the usage goes to.': 'فئات النماذج التي يذهب إليها الاستخدام.',
  'Rank by usage and the share held by the users above.': 'الترتيب حسب الاستخدام والحصة التي يملكها المستخدمون الأعلى ترتيبًا.',
  'Habits that need attention. A user can have any number of them.': 'عادات تحتاج إلى انتباه. قد يكون للمستخدم أي عدد منها.',
  'The share of the user’s usage that goes through Auto model selection.': 'حصة استخدام المستخدم التي تمر عبر اختيار النموذج التلقائي Auto.',

  // Rules: engagement flags and personas
  'The user’s first use in the whole report is within the last {days} days of the period. Users already active in the first {days} days of the report are never new, because they cannot be told apart from long-time users.':
    'أول استخدام للمستخدم في التقرير كله يقع ضمن آخر {days} يومًا من الفترة. المستخدمون النشطون أصلًا في أول {days} يومًا من التقرير لا يُعدّون جددًا أبدًا، لأنه لا يمكن تمييزهم عن المستخدمين القدامى.',
  'Not new, and the last usage was {days} days or more before the end of the period.': 'ليس جديدًا، وآخر استخدام كان قبل نهاية الفترة بـ{days} يومًا أو أكثر.',
  'Each user gets exactly one persona. Go down this list: the first rule that fits decides.':
    'لكل مستخدم نمط واحد بالضبط. انزل في هذه القائمة: أول قاعدة تنطبق هي التي تحدد.',
  'Usage is {share} or more of the user’s own included credits.': 'الاستخدام {share} أو أكثر من الأرصدة المشمولة للمستخدم.',
  'Active on {often} or more of workdays, and usage is {heavy} or more of own included credits.':
    'نشط في {often} أو أكثر من أيام العمل، والاستخدام {heavy} أو أكثر من أرصدته المشمولة.',
  'Usage is {heavy} or more of own included credits, but active on fewer than {often} of workdays.':
    'الاستخدام {heavy} أو أكثر من أرصدته المشمولة، لكنه نشط في أقل من {often} من أيام العمل.',
  'Active on {often} or more of workdays, but usage is below {heavy} of own included credits.':
    'نشط في {often} أو أكثر من أيام العمل، لكن الاستخدام أقل من {heavy} من أرصدته المشمولة.',
  'Everything else: active on fewer than {often} of workdays and usage below {heavy} of own included credits.':
    'كل ما عدا ذلك: نشط في أقل من {often} من أيام العمل والاستخدام أقل من {heavy} من أرصدته المشمولة.',
  '{runaway} comes first, so a new or lapsed user with runaway usage is in {runaway}. This is why the counts of {newUsers} and {lapsedUsers} can be lower than the New and Lapsed flags under Engagement.':
    '{runaway} تأتي أولًا، لذا المستخدم الجديد أو المتوقف ذو الاستخدام المفرط يكون في {runaway}. لهذا قد يكون عدد {newUsers} و{lapsedUsers} أقل من عدد علامتي "جديد" و"متوقف" في التفاعل.',

  // Rules: usage tiers
  'below {value}': 'أقل من {value}',
  '{low} to below {high}': 'من {low} إلى أقل من {high}',
  '{value} or more': '{value} أو أكثر',
  'The tier compares a user’s usage with their own included credits in the period. Included credits are the monthly credits of the user’s seat, added up over the months in which the user’s rows show a seat size. A Business seat has {business} credits ({businessPrice}) a month and an Enterprise seat {enterprise} ({enterprisePrice}). When a user’s seat is unknown, {fallback} credits a month are assumed.':
    'يقارن المستوى استخدام المستخدم بأرصدته المشمولة في الفترة. الأرصدة المشمولة هي الأرصدة الشهرية لترخيص المستخدم، مجموعةً على الأشهر التي تُظهر فيها صفوفه حجم الترخيص. ترخيص Business فيه {business} رصيد ({businessPrice}) شهريًا وترخيص Enterprise فيه {enterprise} ({enterprisePrice}). عندما يكون ترخيص المستخدم غير معروف، يُفترض {fallback} رصيد شهريًا.',
  'Usage as a share of own included credits': 'الاستخدام كحصة من الأرصدة المشمولة',
  '{seat} seat, per month': 'ترخيص {seat}، شهريًا',
  'The dollar columns show usage per month. Over a longer period, usage and included credits both add up, so the percentages stay comparable.':
    'أعمدة الدولار تعرض الاستخدام الشهري. على فترة أطول، يتراكم الاستخدام والأرصدة المشمولة معًا، لذا تبقى النسب قابلة للمقارنة.',

  // Rules: engagement
  'A day counts as active when the user’s usage that day is at least {amount}. The active rate is the number of active days divided by the workdays (Monday to Friday) from the user’s first day in the report, or the start of the period if that is later, to the end of the period. At least 5 workdays are used, so a new user is not rated on one or two days.':
    'يُعد اليوم نشطًا عندما يكون استخدام المستخدم فيه {amount} على الأقل. معدل النشاط هو عدد الأيام النشطة مقسومًا على أيام العمل (من الاثنين إلى الجمعة) من أول يوم للمستخدم في التقرير، أو بداية الفترة إن كانت لاحقة، حتى نهاية الفترة. تُستخدم 5 أيام عمل على الأقل، حتى لا يُقيَّم المستخدم الجديد على يوم أو يومين.',
  'Active rate of {share} or more.': 'معدل نشاط {share} أو أكثر.',
  'Active rate of {low} to below {high}.': 'معدل نشاط من {low} إلى أقل من {high}.',
  'Active rate below {share}.': 'معدل نشاط أقل من {share}.',
  'A flag, not a level. {rule}': 'علامة، وليست مستوى. {rule}',
  'New and Lapsed users also have one of the four activity levels, so only {daily}, {regular}, {occasional} and {rare} add up to all users. Days with usage on a weekend count as active days, and the active rate never goes above 100%.':
    'للمستخدمين الجدد والمتوقفين أيضًا أحد مستويات النشاط الأربعة، لذا فقط {daily} و{regular} و{occasional} و{rare} مجموعها كل المستخدمين. أيام الاستخدام في عطلة نهاية الأسبوع تُحسب أيامًا نشطة، ولا يتجاوز معدل النشاط 100% أبدًا.',

  // Rules: usage profiles
  'Usage is split by model tier: Powerful (frontier models), Versatile and Lightweight. Models without a known tier count toward none of the three shares.':
    'يُقسَّم الاستخدام حسب فئة النموذج: قوية (النماذج المتقدمة) ومتعددة الاستخدامات وخفيفة. النماذج التي ليست لها فئة معروفة لا تُحسب في أي من الحصص الثلاث.',
  'Powerful models make up {share} or more of the user’s usage.': 'النماذج القوية تشكّل {share} أو أكثر من استخدام المستخدم.',
  'Not {frontier}, and Versatile and Lightweight models together make up {share} or more.':
    'ليس {frontier}، والنماذج متعددة الاستخدامات والخفيفة معًا تشكّل {share} أو أكثر.',
  'Everything else: a mix with no clear lean.': 'كل ما عدا ذلك: مزيج بلا ميل واضح.',

  // Rules: Pareto
  'Users are ranked by usage, largest first. The class depends on the share of all usage held by the users ranked above.':
    'يُرتَّب المستخدمون حسب الاستخدام، من الأكبر. تعتمد الفئة على حصة كل الاستخدام التي يملكها المستخدمون الأعلى ترتيبًا.',
  'The users above hold less than {share} of all usage. The user who takes the total past {share} is still in A.':
    'المستخدمون الأعلى ترتيبًا يملكون أقل من {share} من كل الاستخدام. المستخدم الذي يتجاوز به المجموع {share} يبقى في A.',
  'The users above hold {low} to below {high} of all usage.': 'المستخدمون الأعلى ترتيبًا يملكون من {low} إلى أقل من {high} من كل الاستخدام.',
  'The users above already hold {share} or more of all usage. This is the long tail.':
    'المستخدمون الأعلى ترتيبًا يملكون أصلًا {share} أو أكثر من كل الاستخدام. هذه هي الفئة الأقل استخدامًا.',

  // Rules: traits
  'A user can have any number of traits, or none. {lowCache}, {longContext}, {spiky} and {lowAuto} need at least {min} of usage in the period, so small amounts do not trigger them. {growing} and {fading} compare the last 7 days with the 7 days before, use the same minimum per week and need a period of 14 days or more.':
    'قد يكون للمستخدم أي عدد من السمات أو لا شيء. {lowCache} و{longContext} و{spiky} و{lowAuto} تحتاج إلى {min} من الاستخدام على الأقل في الفترة، حتى لا تُطلقها المبالغ الصغيرة. {growing} و{fading} تقارنان آخر 7 أيام بالأيام الـ7 التي قبلها، وتستخدمان الحد الأدنى نفسه لكل أسبوع، وتحتاجان إلى فترة من 14 يومًا أو أكثر.',
  'Cache reads are under {share} of prompt tokens (input, cache reads and cache writes), and at least half of the user’s usage has token counts and a known model price.':
    'قراءات الذاكرة المؤقتة أقل من {share} من رموز الطلب (المدخلات وقراءات الذاكرة المؤقتة وكتاباتها)، ونصف استخدام المستخدم على الأقل له عدد رموز وسعر نموذج معروف.',
  'Long-context surcharges, estimated from token counts, are {share} or more of the user’s usage.':
    'رسوم السياق الطويل الإضافية، المقدّرة من عدد الرموز، تشكّل {share} أو أكثر من استخدام المستخدم.',
  'At least 3 active days, and the busiest day is {share} or more of the user’s usage.': '3 أيام نشطة على الأقل، وأكثر الأيام استخدامًا يشكّل {share} أو أكثر من استخدام المستخدم.',
  'Auto model selection is under {share} of the user’s usage.': 'اختيار النموذج التلقائي Auto أقل من {share} من استخدام المستخدم.',
  'The user used 4 or more different models. No minimum usage applies.': 'استخدم المستخدم 4 نماذج مختلفة أو أكثر. لا يوجد حد أدنى للاستخدام هنا.',
  'Usage in the last 7 days of the period is at least {min} and at least 1.5 times the 7 days before. A user with usage in the last 7 days and none in the 7 days before also counts, unless the user is new.':
    'الاستخدام في آخر 7 أيام من الفترة {min} على الأقل و1.5 ضعف الأيام الـ7 التي قبلها على الأقل. المستخدم الذي له استخدام في آخر 7 أيام ولا استخدام له في الأيام الـ7 التي قبلها يُحسب أيضًا، إلا إذا كان جديدًا.',
  'Usage in the 7 days before the last week was at least {min}, and the last 7 days are half of that or less.':
    'الاستخدام في الأيام الـ7 التي سبقت الأسبوع الأخير كان {min} على الأقل، وآخر 7 أيام نصف ذلك أو أقل.',
  'The report has cost centers, and this user has none.': 'في التقرير مراكز تكلفة، وهذا المستخدم ليس له مركز تكلفة.',

  // Rules: Auto use
  'Each user gets exactly one group. The Auto share is the usage that went through Auto model selection divided by all of the user’s usage in the period. Go down this list: the first rule that fits decides.':
    'لكل مستخدم مجموعة واحدة بالضبط. حصة Auto هي الاستخدام الذي مر عبر اختيار النموذج التلقائي Auto مقسومًا على كل استخدام المستخدم في الفترة. انزل في هذه القائمة: أول قاعدة تنطبق هي التي تحدد.',
  'The user has no usage, or the report has no model names and usage that went through Auto cannot be told apart.':
    'ليس للمستخدم استخدام، أو التقرير لا يحتوي أسماء النماذج فلا يمكن تمييز الاستخدام الذي مر عبر Auto.',
  'The Auto share is {share} or more.': 'حصة Auto تبلغ {share} أو أكثر.',
  'The Auto share is under {share}.': 'حصة Auto أقل من {share}.',
  'The Auto share is {low} to under {high}.': 'حصة Auto من {low} إلى أقل من {high}.',
  'One setting, the low Auto threshold ({share}), decides both who is in {direct} and who has the {lowAuto} trait. Change it in Settings and both move together. The Auto-first threshold ({autoFirst}) is a separate setting.':
    'إعداد واحد، وهو حد Auto المنخفض ({share})، يحدد من يكون في {direct} ومن لديه سمة {lowAuto} معًا. غيّره في الإعدادات فيتغير الاثنان معًا. حد الاعتماد على Auto ({autoFirst}) إعداد منفصل.',

  // Unsupported lens
  '{lens} is not available for this report': '{lens} غير متاح لهذا التقرير',
  'Open {page}': 'افتح {page}',

  // Lens descriptions
  'The kind of user, such as Champions, New users or Runaway users. Each user has exactly one persona.':
    'نوع المستخدم، مثل الروّاد أو المستخدمين الجدد أو المستخدمين المفرطين. لكل مستخدم نمط واحد بالضبط.',
  'How much of their own included credits a user used, from Minimal to Runaway.': 'مقدار ما استخدمه المستخدم من أرصدته المشمولة، من ضئيل إلى مفرط.',
  'How often a user is active, from Daily to Rare, plus the New and Lapsed flags.': 'مدى تكرار نشاط المستخدم، من يومي إلى نادر، إضافةً إلى علامتي "جديد" و"متوقف".',
  'New and Lapsed are flags. Those users are also counted in one of the four activity levels, so only Daily to Rare add up to all users.':
    '"جديد" و"متوقف" علامتان. هؤلاء المستخدمون يُحسبون أيضًا في أحد مستويات النشاط الأربعة، لذا فقط المستويات من يومي إلى نادر مجموعها كل المستخدمين.',
  'Which model tiers a user relies on: Efficient, Balanced or Frontier-heavy.': 'فئات النماذج التي يعتمد عليها المستخدم: موفّر أو متوازن أو يعتمد على النماذج القوية.',
  'Where a user ranks by usage. Class A holds most of the usage, and class C is the long tail.':
    'ترتيب المستخدم حسب الاستخدام. الفئة A تملك معظم الاستخدام، والفئة C هي الأقل استخدامًا.',
  'Whether a user lets Auto pick the model and gets the Auto discount, or picks models by hand.':
    'هل يترك المستخدم Auto يختار النموذج فيحصل على خصم Auto، أم يختار النماذج يدويًا.',
  Traits: 'السمات',
  'Habits that cost money or need attention. A user can have several traits or none.': 'عادات تكلّف مالًا أو تحتاج إلى انتباه. قد يكون للمستخدم عدة سمات أو لا شيء.',
  'A user can have several traits or none. Users, usage and potential savings of different traits overlap, so they are not added up.':
    'قد يكون للمستخدم عدة سمات أو لا شيء. المستخدمون والاستخدام والتوفير المحتمل للسمات المختلفة تتداخل، لذا لا تُجمع.',
  'Needs model names, and this report has none.': 'يحتاج إلى أسماء النماذج، وهذا التقرير لا يحتويها.',
  'Needs token columns, and this report has none.': 'يحتاج إلى أعمدة الرموز، وهذا التقرير لا يحتويها.',
  'Needs at least 14 days in the selected range to compare two weeks.': 'يحتاج إلى 14 يومًا على الأقل في النطاق المختار لمقارنة أسبوعين.',
  'The report has no cost centers.': 'التقرير لا يحتوي مراكز تكلفة.',
  'This report has no model names (the model column is missing or empty), so usage that went through Auto cannot be told apart from other usage. Every user would be Not enough data. Load a report with a model column to compare users by Auto use class.':
    'هذا التقرير لا يحتوي أسماء النماذج (عمود model مفقود أو فارغ)، لذا لا يمكن تمييز الاستخدام الذي مر عبر Auto عن غيره. سيكون كل مستخدم في "لا توجد بيانات كافية". حمّل تقريرًا فيه عمود model لمقارنة المستخدمين حسب فئة استخدام Auto.',
  'This report has no model names (the model column is missing or empty), so the model tier of each user’s usage is unknown. Every user would be Balanced. Load a report with a model column to compare users by usage profile.':
    'هذا التقرير لا يحتوي أسماء النماذج (عمود model مفقود أو فارغ)، لذا فئة النموذج لاستخدام كل مستخدم غير معروفة. سيكون كل مستخدم "متوازن". حمّل تقريرًا فيه عمود model لمقارنة المستخدمين حسب ملف الاستخدام.',

  // Insights
  'under 1%': 'أقل من 1%',
  'under $0.01': 'أقل من $0.01',
  'There are no individual users in the data in view.': 'لا يوجد مستخدمون أفراد في البيانات المعروضة.',
  'No user has any of these traits in the data in view.': 'لا يوجد مستخدم لديه أي من هذه السمات في البيانات المعروضة.',
  '{n} users ({share}) have at least one trait. Each user is counted once.': p(
    'مستخدم واحد ({share}) لديه سمة واحدة على الأقل. كل مستخدم يُحسب مرة واحدة.',
    'مستخدمان ({share}) لديهما سمة واحدة على الأقل. كل مستخدم يُحسب مرة واحدة.',
    '{n} مستخدمين ({share}) لديهم سمة واحدة على الأقل. كل مستخدم يُحسب مرة واحدة.',
    '{n} مستخدمًا ({share}) لديهم سمة واحدة على الأقل. كل مستخدم يُحسب مرة واحدة.',
    '{n} مستخدم ({share}) لديهم سمة واحدة على الأقل. كل مستخدم يُحسب مرة واحدة.',
  ),
  '{trait} is the most common trait, found in {users}.': '{trait} هي السمة الأكثر شيوعًا، وتظهر لدى {users}.',
  'Every user is in one group ({group}), so there is nothing to compare for this lens. Try another lens.':
    'كل المستخدمين في مجموعة واحدة ({group})، لذا لا يوجد ما يُقارن في زاوية المقارنة هذه. جرّب زاوية أخرى.',
  '{group} is {users} of users but {usage} of usage.': '{group} تمثّل {users} من المستخدمين لكن {usage} من الاستخدام.',
  '{group} is {users} of users but only {usage} of usage.': '{group} تمثّل {users} من المستخدمين لكن {usage} فقط من الاستخدام.',
  '{group} holds {share} of the potential savings: {amount} of an estimated {total}.': '{group} تملك {share} من التوفير المحتمل: {amount} من إجمالي مقدّر قدره {total}.',
  'Per user, per month, usage is {low} in {lowGroup} and {high} in {highGroup}, {ratio} apart.':
    'الاستخدام لكل مستخدم شهريًا {low} في {lowGroup} و{high} في {highGroup}، والفرق بينهما {ratio}.',
  'over 1,000×': 'أكثر من 1,000×',
  'Usage is spread fairly evenly across these groups.': 'الاستخدام موزّع بشكل متقارب بين هذه المجموعات.',
};

export default ar;
