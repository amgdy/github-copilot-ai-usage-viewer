import type { Dict, PluralEntry } from '../core';

const plural = (one: string, two: string, few: string, many: string, other: string): PluralEntry => ({ zero: other, one, two, few, many, other });

/** Arabic for the Organization page (`pages/OrganizationPage.tsx`, `pages/organization/*`). */
const arabic: Dict = {
  // Page
  'Which parts of the business generate the usage and the bill, and how to allocate it between teams.':
    'أي أجزاء العمل تولّد الاستخدام والفاتورة، وكيف توزّعها بين الفرق.',
  'Usage and billed amounts of the selected rows, by organization, cost center, team, repository, application or product.':
    'الاستخدام والمبالغ المدفوعة الإضافية للصفوف المحددة، حسب المؤسسة أو مركز التكلفة أو الفريق أو المستودع أو التطبيق أو المنتج.',
  'The figures cover only the selected rows, and billed amounts are the ones on these rows. The seat-based allocation is hidden because seat costs need the full user list.':
    'تغطي الأرقام الصفوف المحددة فقط، والمبالغ المدفوعة الإضافية هي المسجّلة على هذه الصفوف. التوزيع القائم على التراخيص مخفي لأن تكلفة التراخيص تحتاج إلى قائمة المستخدمين كاملة.',
  'View by': 'العرض حسب',
  Dimension: 'البُعد',
  'Only one group has usage here, so there is nothing to compare. Try another view to see how usage splits.':
    'مجموعة واحدة فقط لها استخدام هنا، فلا يوجد ما يُقارن. جرّب عرضًا آخر لترى كيف يتوزع الاستخدام.',

  // Dimensions
  'All organizations': 'كل المؤسسات',
  'Top organizations': 'أكبر المؤسسات',
  'Usage by organization': 'الاستخدام حسب المؤسسة',
  'No organizations in this view': 'لا توجد مؤسسات في هذا العرض',
  'No row names an organization, so there is nothing to group by. Pick another view above.':
    'لا يذكر أي صف مؤسسة، فلا يوجد ما يُجمَّع حسبه. اختر عرضًا آخر في الأعلى.',
  'Usage on rows that name no organization, so it cannot be assigned to one.': 'استخدام على صفوف لا تذكر مؤسسة، فلا يمكن نسبته إلى أي منها.',
  'All cost centers': 'كل مراكز التكلفة',
  'Top cost centers': 'أكبر مراكز التكلفة',
  'Usage by cost center': 'الاستخدام حسب مركز التكلفة',
  'No cost centers in this view': 'لا توجد مراكز تكلفة في هذا العرض',
  'No row names a cost center, so there is nothing to group by. Pick another view above.':
    'لا يذكر أي صف مركز تكلفة، فلا يوجد ما يُجمَّع حسبه. اختر عرضًا آخر في الأعلى.',
  'Usage with no cost center. Repository-level products (such as code quality) have no user and often no cost center, and some users are not assigned to one. This usage cannot be charged back.':
    'استخدام بلا مركز تكلفة. منتجات مستوى المستودع (مثل جودة الكود) ليس لها مستخدم وغالبًا ليس لها مركز تكلفة، وبعض المستخدمين غير مخصصين لأي مركز. لا يمكن تحميل هذا الاستخدام على فريق.',
  'Team (from license list)': 'الفريق (من قائمة التراخيص)',
  Teams: 'الفرق',
  'All teams': 'كل الفرق',
  'Top teams': 'أكبر الفرق',
  'Usage by team': 'الاستخدام حسب الفريق',
  'No teams in this view': 'لا توجد فرق في هذا العرض',
  'No user in this view has a team in the license list, so there is nothing to group by. Pick another view above.':
    'لا يملك أي مستخدم في هذا العرض فريقًا في قائمة التراخيص، فلا يوجد ما يُجمَّع حسبه. اختر عرضًا آخر في الأعلى.',
  'Usage of people who are not in the license list or have no team in it, and of rows without a username. It cannot be assigned to a team.':
    'استخدام أشخاص ليسوا في قائمة التراخيص أو ليس لهم فريق فيها، واستخدام الصفوف التي ليس فيها اسم مستخدم. لا يمكن نسبته إلى فريق.',
  'Not in the license list': 'ليس في قائمة التراخيص',
  'No team in the license list': 'لا فريق في قائمة التراخيص',
  'All repositories': 'كل المستودعات',
  'Top repositories': 'أكبر المستودعات',
  'Usage by repository': 'الاستخدام حسب المستودع',
  'No repositories in this view': 'لا توجد مستودعات في هذا العرض',
  'No row names a repository, so there is nothing to group by. Pick another view above.':
    'لا يذكر أي صف مستودعًا، فلا يوجد ما يُجمَّع حسبه. اختر عرضًا آخر في الأعلى.',
  'Usage that is not tied to a repository. Usage by people is often not linked to one, while repository-level products usually are.':
    'استخدام غير مرتبط بمستودع. استخدام الأشخاص غالبًا لا يرتبط بمستودع، بينما ترتبط منتجات مستوى المستودع به عادةً.',
  Application: 'التطبيق',
  Applications: 'التطبيقات',
  'All applications': 'كل التطبيقات',
  'Top applications': 'أكبر التطبيقات',
  'Usage by application': 'الاستخدام حسب التطبيق',
  'No applications in this view': 'لا توجد تطبيقات في هذا العرض',
  'No row names an application, so there is nothing to group by. Pick another view above.':
    'لا يذكر أي صف تطبيقًا، فلا يوجد ما يُجمَّع حسبه. اختر عرضًا آخر في الأعلى.',
  'Usage where the report names no application client.': 'استخدام لا يذكر التقرير له تطبيقًا عميلًا.',
  'All products': 'كل المنتجات',
  'Top products': 'أكبر المنتجات',
  'Usage by product': 'الاستخدام حسب المنتج',
  'No products in this view': 'لا توجد منتجات في هذا العرض',
  'No row names a product, so there is nothing to group by. Pick another view above.': 'لا يذكر أي صف منتجًا، فلا يوجد ما يُجمَّع حسبه. اختر عرضًا آخر في الأعلى.',
  'Usage where the report names no product.': 'استخدام لا يذكر التقرير له منتجًا.',

  // Shared notes
  'This report has no token columns, so token counts and the cache hit rate are not shown. They need the input, output, cache read and cache write columns of the detailed usage export.':
    'لا يحتوي هذا التقرير على أعمدة الرموز، فلا تظهر أعداد الرموز ولا نسبة القراءة من الذاكرة المؤقتة. فهي تحتاج إلى أعمدة الإدخال والإخراج والقراءة من الذاكرة المؤقتة والكتابة فيها في تصدير الاستخدام المفصّل.',
  'This file does not say what was billed, so the billed and covered amounts are not shown.':
    'لا يذكر هذا الملف ما دُفع إضافيًا، فلا تظهر المبالغ المدفوعة الإضافية ولا المبالغ المشمولة بالخطة.',

  // KPI row
  'Value of all AI credits used in this view (1 credit = $0.01), including usage already paid for by included credits. The shares on this page are shares of this amount.':
    'قيمة كل أرصدة الذكاء الاصطناعي المستخدمة في هذا العرض (الرصيد الواحد = $0.01)، بما فيها الاستخدام الذي غطته الأرصدة المشمولة. الحصص في هذه الصفحة حصص من هذا المبلغ.',
  '{n} groups with usage': plural('مجموعة واحدة لها استخدام', 'مجموعتان لهما استخدام', '{n} مجموعات لها استخدام', '{n} مجموعة لها استخدام', '{n} مجموعة لها استخدام'),
  'Distinct groups in this view. Usage without a value is not counted here, see Unattributed usage.':
    'المجموعات المختلفة في هذا العرض. الاستخدام بلا قيمة لا يُحسب هنا، انظر الاستخدام غير المنسوب.',
  'Largest group': 'أكبر مجموعة',
  '{pct} of usage · {usd}': '{pct} من الاستخدام · {usd}',
  'No group has a value': 'لا توجد مجموعة لها قيمة',
  'The group with the most usage. Usage without a value is not considered.': 'المجموعة صاحبة أكبر استخدام. الاستخدام بلا قيمة لا يدخل في المقارنة.',
  'Top 3 share': 'حصة أكبر 3',
  'The 3 largest of {n}': 'أكبر 3 من {n}',
  'Only {n} groups': plural('مجموعة واحدة فقط', 'مجموعتان فقط', '{n} مجموعات فقط', '{n} مجموعة فقط', '{n} مجموعة فقط'),
  'Share of all usage that comes from the three largest groups. A high share means a few groups decide the bill.':
    'حصة كل الاستخدام التي تأتي من أكبر ثلاث مجموعات. الحصة المرتفعة تعني أن مجموعات قليلة تحدد الفاتورة.',
  'Unattributed usage': 'الاستخدام غير المنسوب',
  'Every row has a group': 'لكل صف مجموعة',
  '{name} carries {pct} of it': 'تتحمل {name} نسبة {pct} منه',
  'Nothing billed beyond the included credits': 'لم يُدفع شيء إضافي بعد الأرصدة المشمولة',
  'Usage in this view that went beyond the pooled included credits. The group named below it carries the largest part, as the report assigns it.':
    'الاستخدام في هذا العرض الذي تجاوز الأرصدة المشمولة في الرصيد المشترك. المجموعة المذكورة تحته تتحمل الجزء الأكبر منه كما ينسبه التقرير.',

  // Ranking chart
  'Usage, including what included credits cover': 'الاستخدام، بما فيه ما تغطيه الأرصدة المشمولة',
  'People with usage in the group': 'الأشخاص الذين لهم استخدام في المجموعة',
  'Usage per user in a 30.4-day month': 'الاستخدام لكل مستخدم في شهر من 30.4 يومًا',
  'Bar chart that ranks the groups by usage': 'مخطط أعمدة يرتب المجموعات حسب الاستخدام',
  'Bar chart that ranks the groups by amount billed': 'مخطط أعمدة يرتب المجموعات حسب المبلغ المدفوع الإضافي',
  'Bar chart that ranks the groups by number of users': 'مخطط أعمدة يرتب المجموعات حسب عدد المستخدمين',
  'Bar chart that ranks the groups by usage per user': 'مخطط أعمدة يرتب المجموعات حسب الاستخدام لكل مستخدم',
  'Only groups with billed usage are ranked.': 'تُرتَّب فقط المجموعات التي لها استخدام مدفوع إضافي.',
  'Only groups with users are ranked.': 'تُرتَّب فقط المجموعات التي لها مستخدمون.',
  'No usage in this view.': 'لا يوجد استخدام في هذا العرض.',
  'Nothing was billed on top of seats in this view.': 'لم يُدفع شيء إضافي فوق رسوم التراخيص في هذا العرض.',
  'No usage in this view is linked to a user.': 'لا يرتبط أي استخدام في هذا العرض بمستخدم.',
  '{usd} billed': '{usd} مدفوع إضافي',
  '{pct} of billed': '{pct} من المدفوع الإضافي',
  'Top {top} of {n} groups.': 'أكبر {top} من أصل {n} مجموعة.',
  'The only group.': 'المجموعة الوحيدة.',
  'All {n} groups.': 'كل المجموعات ({n}).',
  'Usage per user in a 30.4-day month.': 'الاستخدام لكل مستخدم في شهر من 30.4 يومًا.',
  'Click a bar to filter the report.': 'انقر عمودًا لتصفية التقرير.',
  'Ranking metric': 'مقياس الترتيب',
  'Other ({n} more)': 'أخرى ({n} إضافية)',

  // Treemap
  '{usd} usage · {pct}': '{usd} استخدام · {pct}',
  'The table lists every group.': 'يسرد الجدول كل المجموعات.',
  '{usd} billed ({pct} of its usage)': '{usd} مدفوع إضافي ({pct} من استخدامها)',
  'Click to filter the report.': 'انقر لتصفية التقرير.',
  'Each tile is sized by usage. Click a tile to filter the report.': 'حجم كل مربع حسب الاستخدام. انقر مربعًا لتصفية التقرير.',
  'Treemap of usage by group, tinted by the share that is billed on top of seats':
    'خريطة شجرية للاستخدام حسب المجموعة، ملوّنة حسب الحصة المدفوعة إضافيًا فوق رسوم التراخيص',
  'Treemap of usage by group': 'خريطة شجرية للاستخدام حسب المجموعة',
  "Color: share of the group's usage that is billed on top of seats.": 'اللون: حصة استخدام المجموعة المدفوعة إضافيًا فوق رسوم التراخيص.',
  'Nothing is billed on top of seats in this view, so every tile has the same color.': 'لم يُدفع شيء إضافي فوق رسوم التراخيص في هذا العرض، فلكل المربعات اللون نفسه.',
  'This file does not say what was billed, so every tile has the same color.': 'لا يذكر هذا الملف ما دُفع إضافيًا، فلكل المربعات اللون نفسه.',

  // Group table
  'Usage, billed amounts, users and trend': 'الاستخدام والمبالغ المدفوعة الإضافية والمستخدمون والاتجاه',
  'Input, cache read, cache write and output tokens': 'رموز الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها والإخراج',
  new: 'جديد',
  'Total of {n} matching': 'إجمالي المطابق ({n})',
  'Value of all AI credits used (1 credit = $0.01), including usage covered by included credits':
    'قيمة كل أرصدة الذكاء الاصطناعي المستخدمة (الرصيد الواحد = $0.01)، بما فيها الاستخدام الذي تغطيه الأرصدة المشمولة',
  Filter: 'تصفية',
  'Filter the whole report to {name}': 'صفِّ التقرير كله على {name}',
  'Tokens of fresh text sent to the model, not read from the cache': 'رموز نص جديد أُرسل إلى النموذج، لم تُقرأ من الذاكرة المؤقتة',
  'Tokens served from the model cache, which are priced lower than fresh input': 'رموز قُدّمت من الذاكرة المؤقتة للنموذج، وسعرها أقل من الإدخال الجديد',
  'Tokens written to the model cache so that later requests can reuse them': 'رموز كُتبت في الذاكرة المؤقتة للنموذج لتعيد الطلبات اللاحقة استخدامها',
  'Tokens the model wrote back': 'الرموز التي كتبها النموذج في الرد',
  'Input, cache read, cache write and output tokens together': 'رموز الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها والإخراج معًا',
  'Cache read tokens as a share of all prompt tokens (input, cache read and cache write)':
    'رموز القراءة من الذاكرة المؤقتة كحصة من كل رموز الطلب (الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها)',
  'Share of all usage in this view': 'الحصة من كل الاستخدام في هذا العرض',
  'Billed on top of seats, as the report assigns it to this group': 'المدفوع الإضافي فوق رسوم التراخيص، كما ينسبه التقرير إلى هذه المجموعة',
  'Usage covered by included credits': 'الاستخدام المشمول بالأرصدة المشمولة',
  'People with usage in the group. A person who appears in several groups is counted in each of them.':
    'الأشخاص الذين لهم استخدام في المجموعة. الشخص الذي يظهر في عدة مجموعات يُحسب في كل منها.',
  'Usage per user / month': 'الاستخدام لكل مستخدم / شهر',
  'Usage divided by users, in a 30.4-day month': 'الاستخدام مقسومًا على المستخدمين، في شهر من 30.4 يومًا',
  Trend: 'الاتجاه',
  'Usage of the last 7 days of the period against the 7 days before. It needs a period of at least 14 days.':
    'استخدام آخر 7 أيام من الفترة مقارنةً بالأيام السبعة التي قبلها. يحتاج إلى فترة من 14 يومًا على الأقل.',
  'Billed share': 'الحصة المدفوعة إضافيًا',
  'Part of the group’s own usage that is billed on top of seats': 'جزء استخدام المجموعة نفسها المدفوع إضافيًا فوق رسوم التراخيص',
  'The rows in this view have no token counts, so every token column is 0.': 'لا تحتوي الصفوف في هذا العرض على أعداد رموز، فكل أعمدة الرموز 0.',
  'Click a row to see what the group is made of. The Filter button narrows the whole report to it.':
    'انقر صفًا لترى مكونات المجموعة. زر التصفية يقصر التقرير كله عليها.',
  'Columns shown': 'الأعمدة المعروضة',
  'Search groups…': 'ابحث في المجموعات…',
  'No groups match.': 'لا توجد مجموعات مطابقة.',

  // Group detail
  'By product': 'حسب المنتج',
  'By cost center': 'حسب مركز التكلفة',
  'By organization': 'حسب المؤسسة',
  'By model tier': 'حسب فئة النموذج',
  'Donut chart of the usage of {name} by product': 'مخطط دائري لاستخدام {name} حسب المنتج',
  'Donut chart of the usage of {name} by cost center': 'مخطط دائري لاستخدام {name} حسب مركز التكلفة',
  'Donut chart of the usage of {name} by organization': 'مخطط دائري لاستخدام {name} حسب المؤسسة',
  'Donut chart of the usage of {name} by model tier': 'مخطط دائري لاستخدام {name} حسب فئة النموذج',
  'Detail of {name}': 'تفاصيل {name}',
  'Group detail · {dim}': 'تفاصيل المجموعة · {dim}',
  'Narrow the whole report to this group': 'اقصر التقرير كله على هذه المجموعة',
  'Filter the report to this group': 'صفِّ التقرير على هذه المجموعة',
  'Clear selection': 'إلغاء التحديد',
  '{pct} of its usage': '{pct} من استخدامها',
  'Of all prompt tokens': 'من كل رموز الطلب',
  'Usage of this group': 'استخدام هذه المجموعة',
  'No usage in this group.': 'لا يوجد استخدام في هذه المجموعة.',
  'Weekly usage': 'الاستخدام الأسبوعي',
  'Usage of this group over the period': 'استخدام هذه المجموعة خلال الفترة',
  'Line chart of the weekly usage of {name}': 'مخطط خطي للاستخدام الأسبوعي لـ {name}',
  'Line chart of the daily usage of {name}': 'مخطط خطي للاستخدام اليومي لـ {name}',

  // Who is in each group
  'Who is in each group': 'من في كل مجموعة',
  'The {n} users with the most usage in each group. Click a user to open the details.': plural(
    'المستخدم صاحب أكبر استخدام في كل مجموعة. انقر مستخدمًا لفتح التفاصيل.',
    'المستخدمان صاحبا أكبر استخدام في كل مجموعة. انقر مستخدمًا لفتح التفاصيل.',
    'المستخدمون الـ {n} أصحاب أكبر استخدام في كل مجموعة. انقر مستخدمًا لفتح التفاصيل.',
    'المستخدمون الـ {n} أصحاب أكبر استخدام في كل مجموعة. انقر مستخدمًا لفتح التفاصيل.',
    'المستخدمون الـ {n} أصحاب أكبر استخدام في كل مجموعة. انقر مستخدمًا لفتح التفاصيل.',
  ),
  'No usage in this group is linked to a user.': 'لا يرتبط أي استخدام في هذه المجموعة بمستخدم.',
  'Open {name}': 'افتح {name}',
  'See group detail': 'اعرض تفاصيل المجموعة',
  'Showing {shown} of {n} groups, largest first.': 'يُعرض {shown} من أصل {n} مجموعة، الأكبر أولًا.',
  'Show the top {n}': 'اعرض أكبر {n}',
  'Show all {n}': 'اعرض الكل ({n})',

  // Seats by organization
  'Seats by organization': 'التراخيص حسب المؤسسة',
  'Seats of the license list next to the usage of each organization. Seats with no usage are the first place to look for savings.':
    'تراخيص قائمة التراخيص بجانب استخدام كل مؤسسة. التراخيص التي لا استخدام لها أول مكان تبحث فيه عن التوفير.',
  'Organization not known': 'المؤسسة غير معروفة',
  'Seats in the license list. A seat counts in the first organization the list names for it.':
    'التراخيص في قائمة التراخيص. يُحسب الترخيص في أول مؤسسة تذكرها القائمة له.',
  Used: 'مستخدَم',
  'Seats whose holder has usage in this view': 'التراخيص التي لصاحبها استخدام في هذا العرض',
  'Seats whose holder has no usage in this view. Code completions are not in the report, so check activity on the Licenses page first.':
    'التراخيص التي ليس لصاحبها استخدام في هذا العرض. إكمالات الكود ليست في التقرير، فتحقق من النشاط في صفحة التراخيص أولًا.',
  'Users without a seat': 'مستخدمون بلا ترخيص',
  'People with usage in this view who hold no seat in the license list': 'أشخاص لهم استخدام في هذا العرض وليس لهم ترخيص في قائمة التراخيص',
  'Seat cost / month': 'تكلفة التراخيص / شهر',
  'What the seats cost per month at the seat prices': 'ما تكلّفه التراخيص في الشهر بأسعار التراخيص',
  'Usage per seat / month': 'الاستخدام لكل ترخيص / شهر',
  'Usage of the seat holders in a 30.4-day month, divided by the seats': 'استخدام أصحاب التراخيص في شهر من 30.4 يومًا، مقسومًا على التراخيص',
  'Filters are active. Seats and seat cost cover the whole license list. Used seats, users without a seat and usage follow the dates and row filters, as on the Licenses page, so a seat whose holder is outside them counts as a seat with no usage.':
    'عوامل التصفية نشطة. التراخيص وتكلفتها تغطي قائمة التراخيص كلها. التراخيص المستخدمة والمستخدمون بلا ترخيص والاستخدام تتبع التواريخ وعوامل تصفية الصفوف، كما في صفحة التراخيص، لذلك يُحسب الترخيص الذي يقع صاحبه خارجها ترخيصًا بلا استخدام.',
  'The license list names more than one organization for {n} seats. Each counts in the first one.': plural(
    'تذكر قائمة التراخيص أكثر من مؤسسة لترخيص واحد. يُحسب في أولها.',
    'تذكر قائمة التراخيص أكثر من مؤسسة لترخيصين. يُحسب كل منهما في أولها.',
    'تذكر قائمة التراخيص أكثر من مؤسسة لـ {n} تراخيص. يُحسب كل منها في أولها.',
    'تذكر قائمة التراخيص أكثر من مؤسسة لـ {n} ترخيصًا. يُحسب كل منها في أولها.',
    'تذكر قائمة التراخيص أكثر من مؤسسة لـ {n} ترخيص. يُحسب كل منها في أولها.',
  ),
  'Organization not known: the license list names no organization for the seat, and the report names none for its holder.':
    'المؤسسة غير معروفة: لا تذكر قائمة التراخيص مؤسسة للترخيص، ولا يذكر التقرير مؤسسة لصاحبه.',
  'Open Licenses': 'افتح التراخيص',
  'Search organizations…': 'ابحث في المؤسسات…',
  'No seats in the license list.': 'لا توجد تراخيص في قائمة التراخيص.',

  // Showback
  'Showback and chargeback': 'عرض التكلفة وتحميلها',
  'Split the bill between teams': 'قسّم الفاتورة بين الفرق',
  'As billed in the report': 'كما في فاتورة التقرير',
  'Each group carries the overage that the report assigns to its own rows. The included credits are pooled across all users, so a group that uses them late in the month can carry more than its share.':
    'تتحمل كل مجموعة التجاوز الذي ينسبه التقرير إلى صفوفها. الأرصدة المشمولة مجمّعة في رصيد مشترك لكل المستخدمين، لذلك قد تتحمل المجموعة التي تستخدمها في آخر الشهر أكثر من حصتها.',
  'By share of usage': 'حسب الحصة من الاستخدام',
  'The total overage is split by each group’s share of all usage. Because the credits are pooled, this does not depend on when in the month a group used them.':
    'يُقسَّم التجاوز الكلي حسب حصة كل مجموعة من كل الاستخدام. ولأن الأرصدة مجمّعة في رصيد مشترك، لا يعتمد ذلك على وقت استخدام المجموعة لها في الشهر.',
  'Seats plus overage by usage': 'التراخيص مع التجاوز حسب الاستخدام',
  'Each group pays for the seats of its users, plus its share of the overage by usage. A seat costs as much as its included credits. The result is the whole bill for the people in this report.':
    'تدفع كل مجموعة ثمن تراخيص مستخدميها، مع حصتها من التجاوز حسب الاستخدام. يكلّف الترخيص بقدر أرصدته المشمولة. والنتيجة هي الفاتورة كاملة للأشخاص في هذا التقرير.',
  'Allocation by cost center for {from} to {to}': 'التوزيع حسب مركز التكلفة من {from} إلى {to}',
  'Unassigned collects usage and people without a cost center. It cannot be charged back until they are assigned.':
    'يجمع صف غير مخصص الاستخدام والأشخاص الذين ليس لهم مركز تكلفة. لا يمكن تحميله على فريق حتى يُخصَّصوا.',
  'Search cost centers…': 'ابحث في مراكز التكلفة…',
  '1 user appears in more than one cost center. Their seat is counted in the first one.': 'يظهر مستخدم واحد في أكثر من مركز تكلفة. يُحسب ترخيصه في أولها.',
  '{n} users appear in more than one cost center. Their seat is counted in the first one.': plural(
    'يظهر مستخدم واحد في أكثر من مركز تكلفة. يُحسب ترخيصه في أولها.',
    'يظهر مستخدمان في أكثر من مركز تكلفة. يُحسب ترخيص كل منهما في أولها.',
    'يظهر {n} مستخدمين في أكثر من مركز تكلفة. يُحسب ترخيص كل منهم في أولها.',
    'يظهر {n} مستخدمًا في أكثر من مركز تكلفة. يُحسب ترخيص كل منهم في أولها.',
    'يظهر {n} مستخدم في أكثر من مركز تكلفة. يُحسب ترخيص كل منهم في أولها.',
  ),
  'Allocation by organization for {from} to {to}': 'التوزيع حسب المؤسسة من {from} إلى {to}',
  'Unassigned collects usage and people without an organization. It cannot be charged back until they are assigned.':
    'يجمع صف غير مخصص الاستخدام والأشخاص الذين ليس لهم مؤسسة. لا يمكن تحميله على فريق حتى يُخصَّصوا.',
  '1 user appears in more than one organization. Their seat is counted in the first one.': 'يظهر مستخدم واحد في أكثر من مؤسسة. يُحسب ترخيصه في أولها.',
  '{n} users appear in more than one organization. Their seat is counted in the first one.': plural(
    'يظهر مستخدم واحد في أكثر من مؤسسة. يُحسب ترخيصه في أولها.',
    'يظهر مستخدمان في أكثر من مؤسسة. يُحسب ترخيص كل منهما في أولها.',
    'يظهر {n} مستخدمين في أكثر من مؤسسة. يُحسب ترخيص كل منهم في أولها.',
    'يظهر {n} مستخدمًا في أكثر من مؤسسة. يُحسب ترخيص كل منهم في أولها.',
    'يظهر {n} مستخدم في أكثر من مؤسسة. يُحسب ترخيص كل منهم في أولها.',
  ),
  'People whose first cost center (or organization) in the report is this group. Each person is counted once.':
    'الأشخاص الذين يكون أول مركز تكلفة (أو مؤسسة) لهم في التقرير هو هذه المجموعة. يُحسب كل شخص مرة واحدة.',
  'Value of all AI credits used on the rows of this group (1 credit = $0.01)': 'قيمة كل أرصدة الذكاء الاصطناعي المستخدمة على صفوف هذه المجموعة (الرصيد الواحد = $0.01)',
  'Share of all usage': 'الحصة من كل الاستخدام',
  'Seat cost': 'تكلفة التراخيص',
  'Included credits of the group’s users, in USD. A seat costs as much as its included credits.':
    'الأرصدة المشمولة لمستخدمي المجموعة بالدولار الأمريكي. يكلّف الترخيص بقدر أرصدته المشمولة.',
  'Overage allocation': 'توزيع التجاوز',
  'Overage on the rows of this group, as the report has it': 'التجاوز على صفوف هذه المجموعة كما في التقرير',
  'Total overage times the group’s share of usage': 'التجاوز الكلي مضروبًا في حصة المجموعة من الاستخدام',
  'Total allocation': 'إجمالي التوزيع',
  'Seat cost plus overage allocation': 'تكلفة التراخيص مع توزيع التجاوز',
  'Share of total': 'الحصة من الإجمالي',
  'Part of the total allocation that this group carries': 'جزء إجمالي التوزيع الذي تتحمله هذه المجموعة',
  'No cost centers or organizations in this report': 'لا توجد مراكز تكلفة ولا مؤسسات في هذا التقرير',
  'Showback needs a cost center or an organization on the usage rows. Without one, usage cannot be split between teams.':
    'يحتاج عرض التكلفة إلى مركز تكلفة أو مؤسسة على صفوف الاستخدام. بدونهما لا يمكن تقسيم الاستخدام بين الفرق.',
  'This report has no cost centers, so the allocation uses organizations.': 'لا يحتوي هذا التقرير على مراكز تكلفة، فيستخدم التوزيع المؤسسات.',
  'Seat cost counts whole months in which a person has usage in the selected period. People without usage in it are not included.':
    'تحسب تكلفة التراخيص الأشهر الكاملة التي للشخص فيها استخدام ضمن الفترة المحددة. الأشخاص الذين ليس لهم استخدام فيها لا يدخلون.',
  'This file does not say what was billed, so the overage cannot be allocated. Only the seat cost is allocated.':
    'لا يذكر هذا الملف ما دُفع إضافيًا، فلا يمكن توزيع التجاوز. تُوزَّع تكلفة التراخيص فقط.',
  'This file does not say what was billed, so the overage cannot be allocated. There is nothing to allocate.':
    'لا يذكر هذا الملف ما دُفع إضافيًا، فلا يمكن توزيع التجاوز. لا يوجد ما يُوزَّع.',
  'Nothing was billed on top of seats in this period, so this method has nothing to allocate.':
    'لم يُدفع شيء إضافي فوق رسوم التراخيص في هذه الفترة، فلا يوجد ما توزّعه هذه الطريقة.',
  'Filters are active. The seat-based method is hidden because seat costs need the full user list.':
    'عوامل التصفية نشطة. الطريقة القائمة على التراخيص مخفية لأن تكلفة التراخيص تحتاج إلى قائمة المستخدمين كاملة.',
  'Allocation method': 'طريقة التوزيع',
  'Nothing to allocate.': 'لا يوجد ما يُوزَّع.',
  'How the methods work': 'كيف تعمل الطرق',
  'These amounts are an estimate for internal showback and chargeback. Invoices come from GitHub billing.':
    'هذه المبالغ تقدير لعرض التكلفة وتحميلها داخليًا. الفواتير تأتي من نظام الفوترة في GitHub.',
  Unassigned: 'غير مخصص',

  // Users without a cost center
  'No cost centers in these rows': 'لا توجد مراكز تكلفة في هذه الصفوف',
  'No cost centers in this report': 'لا توجد مراكز تكلفة في هذا التقرير',
  'A cost center groups organizations, repositories or users for billing. With cost centers, the bill can be split by team and charged back instead of staying in one pool. Without them, usage can only be split by organization, repository or product.':
    'يجمع مركز التكلفة مؤسسات أو مستودعات أو مستخدمين لأغراض الفوترة. مع مراكز التكلفة يمكن تقسيم الفاتورة حسب الفريق وتحميلها عليه بدل بقائها في رصيد واحد. وبدونها لا يمكن تقسيم الاستخدام إلا حسب المؤسسة أو المستودع أو المنتج.',
  'Users without a cost center': 'مستخدمون بلا مركز تكلفة',
  '{users} · {usd} of usage ({pct})': '{users} · {usd} من الاستخدام ({pct})',
  '{users} · {usd} of usage': '{users} · {usd} من الاستخدام',
  'Usage that no cost center covers cannot be charged back. In the allocation above it stays in the Unassigned row. Assign these users to a cost center and load a new report to move it to the right team.':
    'الاستخدام الذي لا يغطيه مركز تكلفة لا يمكن تحميله على فريق. في التوزيع أعلاه يبقى في صف غير مخصص. خصّص هؤلاء المستخدمين لمركز تكلفة وحمّل تقريرًا جديدًا لنقله إلى الفريق الصحيح.',
  'Search users…': 'ابحث في المستخدمين…',
};

export default arabic;
