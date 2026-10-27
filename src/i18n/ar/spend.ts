import type { Dict, PluralEntry } from '../core';

const p = (one: string, two: string, few: string, many: string, other: string): PluralEntry => ({ zero: other, one, two, few, many, other });

/** Arabic text for the Usage and pool page. */
const ar: Dict = {
  // Page
  'How much was used, what was billed on top of seats, what drives it, and whether the included credits will last.':
    'كم استُخدم، وما دُفع إضافيًا فوق التراخيص، وما الذي يدفعه، وهل تكفي الأرصدة المشمولة.',
  'What drives the bill': 'ما الذي يحرّك الفاتورة',
  'Where the usage comes from, and who causes the amount billed on top of seats.': 'من أين يأتي الاستخدام، ومن يتسبب في المبلغ المدفوع إضافيًا فوق التراخيص.',

  // Biggest cost drivers
  'Click a bar to keep only that product.': 'انقر على عمود لإبقاء هذا المنتج فقط.',
  'Click a bar to keep only that SKU.': 'انقر على عمود لإبقاء وحدة SKU هذه فقط.',
  'Click a bar to keep only that model tier.': 'انقر على عمود لإبقاء فئة النموذج هذه فقط.',
  'Click a bar to keep only that vendor.': 'انقر على عمود لإبقاء هذا المزوّد فقط.',
  'Usage {usage} · {share} of usage': 'الاستخدام {usage} · {share} من الاستخدام',
  'Usage {usage} · Covered {covered} · Billed {billed} · {share} of usage': 'الاستخدام {usage} · مشمول بالخطة {covered} · مدفوع إضافي {billed} · {share} من الاستخدام',
  'Usage {usage} · Covered {covered} · Billed {billed} · {share} of the billed amount':
    'الاستخدام {usage} · مشمول بالخطة {covered} · مدفوع إضافي {billed} · {share} من المبلغ المدفوع إضافيًا',
  'Biggest cost drivers': 'أكبر مصادر التكلفة',
  'Rank by': 'الترتيب حسب',
  Measure: 'المقياس',
  'Nothing was billed on top of seats in this period': 'لم يُدفع أي مبلغ إضافي فوق التراخيص في هذه الفترة',
  '{group} ranked by usage': '{group} مرتبة حسب الاستخدام',
  '{group} ranked by billed amount': '{group} مرتبة حسب المبلغ المدفوع إضافيًا',
  '{name} accounts for {share} of usage.': 'يمثل {name} نسبة {share} من الاستخدام.',
  '{name} accounts for {share} of the amount billed on top of seats.': 'يمثل {name} نسبة {share} من المبلغ المدفوع إضافيًا فوق التراخيص.',
  'Other ({n})': 'أخرى ({n})',
  'Model tier': 'فئة النموذج',

  // How billing works here
  'In {month}, the seats in this report held {capacity} of included credits. Usage was {usage}: {covered} was covered and {billed} was billed on top of seats.':
    'في {month}، ضمّت التراخيص الواردة في هذا التقرير {capacity} من الأرصدة المشمولة. بلغ الاستخدام {usage}: منه {covered} مشمول بالخطة و{billed} مدفوع إضافيًا فوق التراخيص.',
  'In {month}, the pool held {capacity} of included credits. Usage was {usage}: {covered} was covered and {billed} was billed on top of seats.':
    'في {month}، ضمّ الرصيد المشترك {capacity} من الأرصدة المشمولة. بلغ الاستخدام {usage}: منه {covered} مشمول بالخطة و{billed} مدفوع إضافيًا فوق التراخيص.',
  'In {month} so far, the seats in this report held {capacity} of included credits. Usage was {usage}: {covered} was covered and {billed} was billed on top of seats.':
    'في {month} حتى الآن، ضمّت التراخيص الواردة في هذا التقرير {capacity} من الأرصدة المشمولة. بلغ الاستخدام {usage}: منه {covered} مشمول بالخطة و{billed} مدفوع إضافيًا فوق التراخيص.',
  'In {month} so far, the pool held {capacity} of included credits. Usage was {usage}: {covered} was covered and {billed} was billed on top of seats.':
    'في {month} حتى الآن، ضمّ الرصيد المشترك {capacity} من الأرصدة المشمولة. بلغ الاستخدام {usage}: منه {covered} مشمول بالخطة و{billed} مدفوع إضافيًا فوق التراخيص.',
  '{amount} of the pool is still unused.': 'ما زال {amount} من الرصيد المشترك غير مستخدم.',
  'Cutting usage by {dollar} would have saved {dollar} of cash, until usage was back down to the pool size. Removing a seat would not have saved money, because its credits leave the pool and the same amount is billed instead.':
    'كان خفض الاستخدام بمقدار {dollar} سيوفّر {dollar} نقدًا، حتى يعود الاستخدام إلى حجم الرصيد المشترك. أما إزالة ترخيص فما كانت لتوفّر شيئًا، لأن أرصدته تخرج من الرصيد المشترك ويُدفع المبلغ نفسه إضافيًا بدلًا منها.',
  '{amount} of included credits went unused. Cutting usage would not have saved cash. Removing seats could have saved at most {amount}, the unused part of the pool, if usage had stayed the same.':
    'بقي {amount} من الأرصدة المشمولة دون استخدام. لم يكن خفض الاستخدام ليوفّر نقدًا. وكانت إزالة تراخيص ستوفّر {amount} على الأكثر، وهو الجزء غير المستخدم من الرصيد المشترك، لو بقي الاستخدام كما هو.',
  'Example from your data': 'مثال من بياناتك',
  'How billing works here': 'كيف تعمل الفوترة هنا',
  'Seats, the shared pool of included credits, and what is billed on top.': 'التراخيص، والرصيد المشترك من الأرصدة المشمولة، وما يُدفع إضافيًا فوقها.',
  'Every seat includes credits': 'كل ترخيص يتضمن أرصدة',
  'A GitHub Copilot Business seat ({businessPrice} a month) includes {businessCredits} AI credits. An Enterprise seat ({enterprisePrice}) includes {enterpriseCredits}. One credit is worth {credit}, so the included credits are worth what the seat costs.':
    'يتضمن ترخيص GitHub Copilot Business ({businessPrice} شهريًا) {businessCredits} من أرصدة الذكاء الاصطناعي. ويتضمن ترخيص Enterprise ({enterprisePrice}) {enterpriseCredits}. قيمة الرصيد الواحد {credit}، لذا تساوي قيمة الأرصدة المشمولة ثمن الترخيص.',
  'Credits are pooled': 'الأرصدة مجمّعة في رصيد مشترك',
  'The credits of all seats in a billing entity, an organization or an enterprise, go into one shared pool. Anyone can draw from it, so a heavy user is covered by credits that light users do not use. The pool is not split per person.':
    'تذهب أرصدة كل التراخيص في جهة الفوترة، سواء كانت مؤسسة أو منشأة، إلى رصيد مشترك واحد. يمكن لأي شخص السحب منه، لذا يُغطّى المستخدم الكثيف بأرصدة لا يستخدمها المستخدمون الخفيفون. ولا يُقسَّم الرصيد المشترك على الأشخاص.',
  'The pool resets on the 1st': 'يُعاد ضبط الرصيد المشترك في اليوم الأول',
  'It resets at the start of each month, UTC. Unused credits do not roll over, so credits left at the end of the month are lost.':
    'يُعاد ضبطه في بداية كل شهر بتوقيت UTC. لا تُرحَّل الأرصدة غير المستخدمة، لذا تضيع الأرصدة المتبقية في نهاية الشهر.',
  'Usage beyond the pool is billed': 'الاستخدام الذي يتجاوز الرصيد المشترك يُدفع إضافيًا',
  'When the pool is used up, further usage is billed at {credit} per credit, on top of the seat fees. That is the amount shown as billed on top of seats.':
    'عند نفاد الرصيد المشترك، يُدفع أي استخدام إضافي بسعر {credit} للرصيد الواحد، فوق رسوم التراخيص. وهذا هو المبلغ الظاهر على أنه مدفوع إضافيًا فوق التراخيص.',
  'Usage without a user draws from the pool too': 'الاستخدام بلا مستخدم يسحب من الرصيد المشترك أيضًا',
  'Repo-level products are not tied to a person. Their usage has an empty username in the report, and it takes credits from the same pool.':
    'المنتجات على مستوى المستودع غير مرتبطة بشخص. يظهر استخدامها في التقرير باسم مستخدم فارغ، ويأخذ أرصدة من الرصيد المشترك نفسه.',
  'What this means for savings': 'ماذا يعني هذا للتوفير',
  'Using less only saves cash while usage is above the pool. Below it, the credits are already paid for through the seats. Removing seats only saves up to the unused part of the pool, because each removed seat takes its credits with it. A removed seat is still billed until the end of the billing cycle.':
    'تقليل الاستخدام يوفّر نقدًا فقط ما دام الاستخدام أعلى من الرصيد المشترك. وما دونه فالأرصدة مدفوعة سلفًا مع التراخيص. وإزالة التراخيص توفّر فقط حتى الجزء غير المستخدم من الرصيد المشترك، لأن كل ترخيص يُزال يأخذ أرصدته معه. ويظل الترخيص المُزال مدفوعًا حتى نهاية دورة الفوترة.',
  'See recommendations': 'عرض التوصيات',

  // Budget
  'Budget for billed overage': 'الميزانية للتجاوز المدفوع',
  'This budget is only used for the comparison in this app. In GitHub, budgets for an organization, cost center or enterprise limit charges after the pool is used up, and a budget on one user also limits how much of the pool that person can draw.':
    'تُستخدم هذه الميزانية للمقارنة في هذا التطبيق فقط. في GitHub، تحدّ ميزانيات المؤسسة أو مركز التكلفة أو المنشأة من الرسوم بعد نفاد الرصيد المشترك، وميزانية المستخدم الواحد تحدّ أيضًا مما يمكنه سحبه من الرصيد المشترك.',
  'The {budget} budget for {month} was used up. {billed} was billed on top of seats.': 'نفدت ميزانية {budget} لشهر {month}. دُفع {billed} إضافيًا فوق التراخيص.',
  'The {budget} budget for {month} is used up. {billed} has been billed on top of seats.': 'نفدت ميزانية {budget} لشهر {month}. دُفع حتى الآن {billed} إضافيًا فوق التراخيص.',
  '{month} is complete. {billed} was billed on top of seats, {share} of the {budget} budget.': 'اكتمل {month}. دُفع {billed} إضافيًا فوق التراخيص، أي {share} من ميزانية {budget}.',
  'At the current pace, the budget is used up on {date}.': 'بالوتيرة الحالية، تنفد الميزانية في {date}.',
  'Billed usage is projected to reach about {amount} by the end of {month}, above the budget.': 'يُتوقع أن يبلغ الاستخدام المدفوع إضافيًا نحو {amount} بنهاية {month}، أي فوق الميزانية.',
  'Billed usage is projected to end {month} at about {amount}, {share} of the budget, so it should hold.':
    'يُتوقع أن ينتهي {month} باستخدام مدفوع إضافيًا يبلغ نحو {amount}، أي {share} من الميزانية، لذا يُرجّح أن تكفي.',
  '{billed} has been billed so far, {share} of the budget. A projection needs the pool size.': 'دُفع حتى الآن {billed} إضافيًا، أي {share} من الميزانية. يحتاج التوقع إلى حجم الرصيد المشترك.',
  'Billed on top of seats in {month} compared with the monthly budget': 'المدفوع إضافيًا فوق التراخيص في {month} مقارنةً بالميزانية الشهرية',
  'Billed in {month}': 'المدفوع إضافيًا في {month}',
  'Billed so far': 'المدفوع إضافيًا حتى الآن',
  'On top of seats': 'فوق التراخيص',
  '{month}, through {date}': '{month}، حتى {date}',
  'Budget used': 'نسبة استخدام الميزانية',
  'Of {amount} a month': 'من {amount} شهريًا',
  'Over budget by': 'تجاوز الميزانية بمقدار',
  'Budget left': 'المتبقي من الميزانية',
  'Projected at month end': 'المتوقع في نهاية الشهر',
  '{share} of the budget': '{share} من الميزانية',
  'Needs the pool size': 'يحتاج إلى حجم الرصيد المشترك',
  'Budget used up on': 'تاريخ نفاد الميزانية',
  Reached: 'تم بلوغها',
  'At the current pace': 'بالوتيرة الحالية',
  'Not expected this month': 'غير متوقع هذا الشهر',
  'Not known': 'غير معروف',
  'The lighter part of the bar is the amount projected for the rest of the month.': 'الجزء الأفتح من الشريط هو المبلغ المتوقع لبقية الشهر.',
  'The selected date range covers only part of {month}, so the billed amount is lower than the whole month.':
    'نطاق التاريخ المحدد يغطي جزءًا من {month} فقط، لذا فالمبلغ المدفوع إضافيًا أقل مما للشهر كاملًا.',
  'No monthly budget is set. Enter the most you want to pay on top of seats in a month, in Settings, to see how much of it is used, the projected amount at month end and the day it would run out.':
    'لم تُحدَّد ميزانية شهرية. أدخل في الإعدادات أقصى ما تريد دفعه فوق التراخيص في الشهر، لترى كم استُخدم منها، والمبلغ المتوقع في نهاية الشهر، واليوم الذي ستنفد فيه.',
  'Set a monthly budget': 'تحديد ميزانية شهرية',
  'The file does not say what was billed': 'الملف لا يذكر ما دُفع إضافيًا',
  'A budget of {amount} a month is set, but it is compared with the billed amount, and the file has no discount_amount or net_amount column. Load the complete usage report to see how much of the budget is used.':
    'حُدّدت ميزانية {amount} شهريًا، لكنها تُقارن بالمبلغ المدفوع إضافيًا، والملف لا يحتوي عمود discount_amount أو net_amount. حمّل تقرير الاستخدام الكامل لترى كم استُخدم من الميزانية.',
  'A budget applies to the whole bill': 'الميزانية تنطبق على الفاتورة كاملة',
  'The billed amounts on this page cover only the filtered rows, so they cannot be compared with the {amount} monthly budget. Remove the row and segment filters (the date range can stay) to see it.':
    'المبالغ المدفوعة إضافيًا في هذه الصفحة تغطي الصفوف المصفّاة فقط، لذا لا يمكن مقارنتها بالميزانية الشهرية {amount}. أزل عوامل تصفية الصفوف والشرائح (يمكن إبقاء نطاق التاريخ) لرؤيتها.',
  'A budget of {amount} a month is set, but the selected period has no usage to compare with it.': 'حُدّدت ميزانية {amount} شهريًا، لكن الفترة المحددة لا تحتوي استخدامًا لمقارنته بها.',
  '{amount} a month on top of seats': '{amount} شهريًا فوق التراخيص',
  'Keep charges on top of seats under control': 'أبقِ الرسوم الإضافية فوق التراخيص تحت السيطرة',
  'Change budget': 'تغيير الميزانية',

  // Usage and pool by month
  'Tokens of new text sent to the model, not read from the cache.': 'رموز النص الجديد المرسل إلى النموذج، دون المقروء من الذاكرة المؤقتة.',
  'Text the model has seen before and reads again from its cache, at a lower price than new input.': 'نص رآه النموذج من قبل ويقرؤه مجددًا من ذاكرته المؤقتة، بسعر أقل من الإدخال الجديد.',
  'Text the model saves in its cache so that later requests can read it again.': 'نص يحفظه النموذج في ذاكرته المؤقتة لتتمكن الطلبات اللاحقة من قراءته مجددًا.',
  'Cache read tokens as a share of all prompt tokens (input, cache read and cache write).':
    'رموز القراءة من الذاكرة المؤقتة كنسبة من كل رموز الطلب (الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها).',
  'Cache hit rate (%)': 'نسبة القراءة من الذاكرة المؤقتة (%)',
  'Input, output, cache read and cache write tokens together.': 'رموز الإدخال والإخراج والقراءة من الذاكرة المؤقتة والكتابة فيها معًا.',
  Lasted: 'كفى حتى النهاية',
  'Expected {date}': 'متوقع في {date}',
  'Not yet': 'ليس بعد',
  'so far': 'حتى الآن',
  partial: 'جزئي',
  'Value of the AI credits used.': 'قيمة أرصدة الذكاء الاصطناعي المستخدمة.',
  'Usage (USD)': 'الاستخدام (دولار أمريكي)',
  'Usage paid for by the included credits.': 'الاستخدام المدفوع من الأرصدة المشمولة.',
  'Covered by included credits (USD)': 'مغطى من الأرصدة المشمولة (دولار أمريكي)',
  'Usage beyond the included credits, billed on top of seats.': 'الاستخدام الذي يتجاوز الأرصدة المشمولة، ويُدفع إضافيًا فوق التراخيص.',
  'Billed on top of seats (USD)': 'مدفوع إضافيًا فوق التراخيص (دولار أمريكي)',
  'Pool size': 'حجم الرصيد المشترك',
  'Credits included with all seats, at $0.01 each. A month whose pool size is not known shows a dash.': 'الأرصدة المشمولة مع كل التراخيص، بقيمة 0.01$ للرصيد. الشهر الذي لا يُعرف حجم رصيده المشترك يظهر بشرطة.',
  'Pool size (USD)': 'حجم الرصيد المشترك (دولار أمريكي)',
  'Covered usage divided by the pool size.': 'الاستخدام المشمول مقسومًا على حجم الرصيد المشترك.',
  'Included credits used (%)': 'نسبة استخدام الأرصدة المشمولة (%)',
  'Ran out on': 'تاريخ النفاد',
  'The first day with usage billed on top of seats. An expected date is a projection.': 'أول يوم فيه استخدام مدفوع إضافيًا فوق التراخيص. والتاريخ المتوقع تقدير.',
  '{count} of {total}': '{count} من {total}',
  'Included credits not used yet. Unused credits do not roll over to the next month.': 'الأرصدة المشمولة التي لم تُستخدم بعد. لا تُرحَّل الأرصدة غير المستخدمة إلى الشهر التالي.',
  'Included credits left (USD)': 'المتبقي من الأرصدة المشمولة (دولار أمريكي)',
  'Named users with usage above $0 in the month.': 'المستخدمون المعروفون بالاسم الذين يزيد استخدامهم على 0$ في الشهر.',
  'Usage of the named users divided by the active users.': 'استخدام المستخدمين المعروفين بالاسم مقسومًا على عدد المستخدمين النشطين.',
  'Usage per active user (USD)': 'الاستخدام لكل مستخدم نشط (دولار أمريكي)',
  'Monthly cost': 'التكلفة الشهرية',
  'Seats plus overage: the larger of the pool size and the usage. A seat costs as much as the credits it includes.':
    'التراخيص مع التجاوز: الأكبر بين حجم الرصيد المشترك والاستخدام. ثمن الترخيص يساوي قيمة الأرصدة التي يتضمنها.',
  'Monthly cost (USD)': 'التكلفة الشهرية (دولار أمريكي)',
  'Projected usage': 'الاستخدام المتوقع',
  'For a month in progress: usage at the end of the month if the current pace holds.': 'للشهر الجاري: الاستخدام في نهاية الشهر إذا استمرت الوتيرة الحالية.',
  'Projected usage (USD)': 'الاستخدام المتوقع (دولار أمريكي)',
  'Likely {low} to {high}': 'على الأرجح من {low} إلى {high}',
  'Usage and pool by month': 'الاستخدام والرصيد المشترك حسب الشهر',
  'Click a month to see its daily curve above.': 'انقر على شهر لترى منحناه اليومي في الأعلى.',
  'No billing month in the selected period': 'لا يوجد شهر فوترة في الفترة المحددة',
  '* Counts only the seats that appear in the report. {link} for the real pool size.': '* يحسب التراخيص الواردة في التقرير فقط. {link} لمعرفة الحجم الحقيقي للرصيد المشترك.',
  'Add your roster in Settings': 'أضف قائمة التراخيص في الإعدادات',
  'No usage rows for {months}, so those months are not listed.': p(
    'لا توجد صفوف استخدام لشهر {months}، لذا لم يُدرج هذا الشهر.',
    'لا توجد صفوف استخدام للشهرين {months}، لذا لم يُدرجا.',
    'لا توجد صفوف استخدام للأشهر {months}، لذا لم تُدرج هذه الأشهر.',
    'لا توجد صفوف استخدام للأشهر {months}، لذا لم تُدرج هذه الأشهر.',
    'لا توجد صفوف استخدام للأشهر {months}، لذا لم تُدرج هذه الأشهر.',
  ),

  // Who generates the overage
  'Who generates the overage': 'من يتسبب في التجاوز',
  'Users with the most usage billed on top of seats. Click a bar to open the user.': 'المستخدمون أصحاب أكبر استخدام مدفوع إضافيًا فوق التراخيص. انقر على عمود لفتح المستخدم.',
  'Covered {amount}': 'مشمول بالخطة {amount}',
  'Repo-level products with no user. Click to show only these rows': 'منتجات على مستوى المستودع بلا مستخدم. انقر لعرض هذه الصفوف فقط',
  'Used {amount} more than the credits in their seat': 'استخدم {amount} أكثر من الأرصدة التي في ترخيصه',
  'Stayed within the credits in their seat': 'بقي ضمن الأرصدة التي في ترخيصه',
  'It has no discount_amount or net_amount column, so the report cannot tell which usage was billed on top of seats. Load the complete usage report to see who generates the overage.':
    'لا يحتوي الملف عمود discount_amount أو net_amount، لذا لا يستطيع التقرير معرفة أي استخدام دُفع إضافيًا فوق التراخيص. حمّل تقرير الاستخدام الكامل لترى من يتسبب في التجاوز.',
  'Nothing was billed on top of seats': 'لم يُدفع أي مبلغ إضافي فوق التراخيص',
  'Included credits covered all usage in this period, so there is no overage to trace back to people.': 'غطّت الأرصدة المشمولة كل الاستخدام في هذه الفترة، لذا لا يوجد تجاوز يُنسب إلى أشخاص.',
  '{n} users had usage billed on top of seats. The top 3 account for {share} of the billed amount.': p(
    'لدى مستخدم واحد استخدام مدفوع إضافيًا فوق التراخيص. يمثل أكبر 3 نسبة {share} من المبلغ المدفوع إضافيًا.',
    'لدى مستخدمَين استخدام مدفوع إضافيًا فوق التراخيص. يمثل أكبر 3 نسبة {share} من المبلغ المدفوع إضافيًا.',
    'لدى {n} مستخدمين استخدام مدفوع إضافيًا فوق التراخيص. يمثل أكبر 3 نسبة {share} من المبلغ المدفوع إضافيًا.',
    'لدى {n} مستخدمًا استخدام مدفوع إضافيًا فوق التراخيص. يمثل أكبر 3 نسبة {share} من المبلغ المدفوع إضافيًا.',
    'لدى {n} مستخدم استخدام مدفوع إضافيًا فوق التراخيص. يمثل أكبر 3 نسبة {share} من المبلغ المدفوع إضافيًا.',
  ),
  '{n} users had usage billed on top of seats.': p(
    'لدى مستخدم واحد استخدام مدفوع إضافيًا فوق التراخيص.',
    'لدى مستخدمَين استخدام مدفوع إضافيًا فوق التراخيص.',
    'لدى {n} مستخدمين استخدام مدفوع إضافيًا فوق التراخيص.',
    'لدى {n} مستخدمًا استخدام مدفوع إضافيًا فوق التراخيص.',
    'لدى {n} مستخدم استخدام مدفوع إضافيًا فوق التراخيص.',
  ),
  'Users ranked by usage billed on top of seats': 'المستخدمون مرتبون حسب الاستخدام المدفوع إضافيًا فوق التراخيص',
  '{amount} was billed for repo-level products that have no user.': 'دُفع {amount} إضافيًا لمنتجات على مستوى المستودع بلا مستخدم.',
  'Show only billed rows': 'عرض الصفوف المدفوعة إضافيًا فقط',

  // Included credits, month by month
  'Included credits, month by month': 'الأرصدة المشمولة، شهرًا بشهر',
  'Ran out {date}': 'نفد في {date}',
  'Billing began {date}': 'بدأ الدفع الإضافي في {date}',
  'Included credits are shared by everyone': 'الأرصدة المشمولة مشتركة بين الجميع',
  'They cannot be split for a filtered view, so the pool size and the day it ran out are not shown. To see the pool, remove the row and segment filters. The date range can stay.':
    'لا يمكن تقسيمها لعرض مصفّى، لذا لا يظهر حجم الرصيد المشترك ولا يوم نفاده. لرؤية الرصيد المشترك، أزل عوامل تصفية الصفوف والشرائح. يمكن إبقاء نطاق التاريخ.',
  'Pool figures are not available': 'أرقام الرصيد المشترك غير متاحة',
  'The pool size is not known': 'حجم الرصيد المشترك غير معروف',
  'The file does not say how many credits the seats include, so no pool line is drawn. Add your roster or extra seats in Settings to see it.':
    'الملف لا يذكر عدد الأرصدة التي تتضمنها التراخيص، لذا لا يُرسم خط الرصيد المشترك. أضف قائمة التراخيص أو تراخيص إضافية في الإعدادات لرؤيته.',
  'The pool is bigger than this file shows': 'الرصيد المشترك أكبر مما يظهره هذا الملف',
  'In {month}, included credits covered {covered}. That is more than the {capacity} that the seats in this file pay for. Other seats share the same pool, so the real size is unknown and no pool line is drawn.':
    'في {month}، غطّت الأرصدة المشمولة {covered}. وهذا أكثر من {capacity} التي تدفع ثمنها التراخيص في هذا الملف. تشارك تراخيص أخرى الرصيد المشترك نفسه، لذا فحجمه الحقيقي غير معروف ولا يُرسم خطه.',
  '{month}: usage added up day by day, against the pool of included credits.': '{month}: الاستخدام مجمّعًا يومًا بيوم، مقابل الرصيد المشترك من الأرصدة المشمولة.',
  '{month}: usage added up day by day.': '{month}: الاستخدام مجمّعًا يومًا بيوم.',
  'Usage added up day by day in {month}': 'الاستخدام مجمّعًا يومًا بيوم في {month}',

  // Usage by SKU
  'The product or products that bill under this SKU.': 'المنتج أو المنتجات التي تُفوتر تحت وحدة SKU هذه.',
  'AI credits used.': 'أرصدة الذكاء الاصطناعي المستخدمة.',
  'Share of usage': 'الحصة من الاستخدام',
  'Usage of the SKU divided by the usage of all SKUs.': 'استخدام وحدة SKU مقسومًا على استخدام كل وحدات SKU.',
  'Share of usage (%)': 'الحصة من الاستخدام (%)',
  'People with at least one row under this SKU. Rows without a username are not counted.': 'الأشخاص الذين لديهم صف واحد على الأقل تحت وحدة SKU هذه. لا تُحسب الصفوف بلا اسم مستخدم.',
  'Usage by SKU': 'الاستخدام حسب وحدة SKU',
  'Click a row to keep only that SKU.': 'انقر على صف لإبقاء وحدة SKU هذه فقط.',
  'Search SKUs…': 'البحث في وحدات SKU…',

  // Headline numbers
  'Not in this file': 'غير موجود في هذا الملف',
  '{weekday}, {date}': '{weekday}، {date}',
  '{when} · {multiple} the daily average': '{when} · {multiple} المتوسط اليومي',
  'charged in addition to seat fees': 'يُحتسب إضافةً إلى رسوم التراخيص',
  'nothing billed in this period': 'لم يُدفع شيء إضافي في هذه الفترة',
  'Usage that went beyond the pooled included credits. This is the amount charged in addition to the seat fees.':
    'الاستخدام الذي تجاوز الرصيد المشترك من الأرصدة المشمولة. وهو المبلغ الذي يُحتسب إضافةً إلى رسوم التراخيص.',
  '{n} AI credits': p('رصيد ذكاء اصطناعي واحد', 'رصيدا ذكاء اصطناعي', '{n} أرصدة ذكاء اصطناعي', '{n} رصيدًا من أرصدة الذكاء الاصطناعي', '{n} رصيد ذكاء اصطناعي'),
  'Value of all AI credits used in this period (1 credit = $0.01), including usage already paid for by included credits. Rows that went through Auto are shown after the Auto discount.':
    'قيمة كل أرصدة الذكاء الاصطناعي المستخدمة في هذه الفترة (الرصيد الواحد = 0.01$)، بما فيها الاستخدام المدفوع سلفًا من الأرصدة المشمولة. تظهر الصفوف التي مرّت عبر Auto بعد خصم Auto.',
  '{pct} of usage': '{pct} من الاستخدام',
  'Usage paid for by the AI credits that come with each GitHub Copilot seat. They are pooled across the organization and reset on the 1st of the month (UTC).':
    'الاستخدام المدفوع من أرصدة الذكاء الاصطناعي التي تأتي مع كل ترخيص GitHub Copilot. تُجمع في رصيد مشترك على مستوى المؤسسة ويُعاد ضبطها في اليوم الأول من الشهر (UTC).',
  'Billed share of usage': 'حصة المدفوع إضافيًا من الاستخدام',
  '{pct} covered by included credits': '{pct} مغطى من الأرصدة المشمولة',
  'Billed on top of seats divided by usage. The rest was covered by included credits.': 'المدفوع إضافيًا فوق التراخيص مقسومًا على الاستخدام. والباقي غطّته الأرصدة المشمولة.',
  'Average per day': 'المتوسط اليومي',
  'about {amount} a month at this pace': 'نحو {amount} شهريًا بهذه الوتيرة',
  'over {days}': 'على مدى {days}',
  'Usage divided by all calendar days of the period, including days with no usage.': 'الاستخدام مقسومًا على كل الأيام التقويمية في الفترة، بما فيها الأيام بلا استخدام.',
  'Peak day': 'يوم الذروة',
  'The day with the highest usage in this period. Click to zoom into it.': 'اليوم صاحب أعلى استخدام في هذه الفترة. انقر للتكبير عليه.',
  'The day with the highest usage in this period.': 'اليوم صاحب أعلى استخدام في هذه الفترة.',
  'The file does not say how many credits the seats include': 'الملف لا يذكر عدد الأرصدة التي تتضمنها التراخيص',
  'Without the monthly quota per user, the pool size is unknown. So the included credits used and the estimated cost per month are not shown. Add your roster or extra seats in Settings.':
    'بدون الحصة الشهرية لكل مستخدم، يكون حجم الرصيد المشترك غير معروف. لذا لا تظهر نسبة استخدام الأرصدة المشمولة ولا التكلفة الشهرية التقديرية. أضف قائمة التراخيص أو تراخيص إضافية في الإعدادات.',
  'Included credits covered {amount} in {month}, more than the seats in the file pay for.': 'غطّت الأرصدة المشمولة {amount} في {month}، أي أكثر مما تدفع ثمنه التراخيص في الملف.',
  'Other seats, from files you have not loaded, share the same pool. To see the pool size, the included credits used and the estimated cost per month, add them as roster or extra seats in Settings, or load every file of the billing entity.':
    'تشارك تراخيص أخرى، من ملفات لم تحمّلها، الرصيد المشترك نفسه. لرؤية حجم الرصيد المشترك ونسبة استخدام الأرصدة المشمولة والتكلفة الشهرية التقديرية، أضفها كقائمة تراخيص أو تراخيص إضافية في الإعدادات، أو حمّل كل ملفات جهة الفوترة.',
  '{billed} of {budget} in {month}': '{billed} من {budget} في {month}',
  'Billed on top of seats this month divided by the monthly budget for billed overage you set in Settings.':
    'المدفوع إضافيًا فوق التراخيص هذا الشهر مقسومًا على الميزانية الشهرية للتجاوز المدفوع التي حددتها في الإعدادات.',
  'Projected {month} billed': 'المدفوع إضافيًا المتوقع في {month}',
  '{low} to {high}': 'من {low} إلى {high}',
  'needs the pool size': 'يحتاج إلى حجم الرصيد المشترك',
  'Usage beyond the pool at the projected month end, on top of seat fees.': 'الاستخدام الذي يتجاوز الرصيد المشترك في نهاية الشهر المتوقعة، فوق رسوم التراخيص.',
  'Estimated cost per month': 'التكلفة الشهرية التقديرية',
  '{seats} seats + {overage} overage': 'التراخيص {seats} + التجاوز {overage}',
  'a pool size is missing for some month': 'حجم الرصيد المشترك غير معروف لبعض الأشهر',
  'Seats plus overage per month: the larger of the pool size and the usage, averaged over the months in this period. A seat costs as much as the credits it includes ($19 for 1,900 credits, $39 for 3,900). A month in progress counts what was used so far.':
    'التراخيص مع التجاوز في الشهر: الأكبر بين حجم الرصيد المشترك والاستخدام، في المتوسط على أشهر هذه الفترة. ثمن الترخيص يساوي قيمة الأرصدة التي يتضمنها (19$ مقابل 1,900 رصيد، و39$ مقابل 3,900). الشهر الجاري يُحسب بما استُخدم حتى الآن.',
  '{month}: {pct}': '{month}: {pct}',
  '{covered} of {capacity}': '{covered} من {capacity}',
  'Share of the pooled included credits that usage used up in this period, all months together. A low value means paid-for credits go unused. At 100%, billing on top of seats starts.':
    'حصة الرصيد المشترك من الأرصدة المشمولة التي استهلكها الاستخدام في هذه الفترة، لكل الأشهر معًا. القيمة المنخفضة تعني أن أرصدة مدفوعة تبقى دون استخدام. وعند 100% يبدأ الدفع الإضافي فوق التراخيص.',
  'Months the pool ran out': 'الأشهر التي نفد فيها الرصيد المشترك',
  'usage beyond the pool was billed': 'دُفع الاستخدام الذي تجاوز الرصيد المشترك إضافيًا',
  'the pool always lasted': 'كفى الرصيد المشترك دائمًا',
  'Months in which usage went beyond the pool, so billing on top of seats started.': 'الأشهر التي تجاوز فيها الاستخدام الرصيد المشترك، فبدأ الدفع الإضافي فوق التراخيص.',
  'Projected {month} usage': 'الاستخدام المتوقع في {month}',
  'Usage so far plus the remaining days at the average daily rate of the month and at the rate of the last 7 days. The range runs between the two rates.':
    'الاستخدام حتى الآن مضافًا إليه الأيام المتبقية بمتوسط المعدل اليومي للشهر وبمعدل آخر 7 أيام. ويمتد النطاق بين المعدلين.',
  'Pool size in {month}': 'حجم الرصيد المشترك في {month}',
  'The monthly credits of all seats, valued at $0.01 each (1,900 credits for a Business seat, 3,900 for an Enterprise seat). Credits are pooled and cannot be assigned to one user.':
    'الأرصدة الشهرية لكل التراخيص، بقيمة 0.01$ للرصيد (1,900 رصيد لترخيص Business، و3,900 لترخيص Enterprise). الأرصدة مجمّعة في رصيد مشترك ولا يمكن تخصيصها لمستخدم واحد.',

  // Usage over time
  Bars: 'أعمدة',
  'Running total': 'المجموع التراكمي',
  'Usage per day': 'الاستخدام في اليوم',
  'Usage per week': 'الاستخدام في الأسبوع',
  'Unusual days': 'الأيام غير المعتادة',
  '{date}: {amount}, {multiple} a typical day. Click to zoom into this day.': '{date}: {amount}، أي {multiple} اليوم المعتاد. انقر للتكبير على هذا اليوم.',
  'Value of AI credits used.': 'قيمة أرصدة الذكاء الاصطناعي المستخدمة.',
  'Running total of usage over the selected period.': 'المجموع التراكمي للاستخدام خلال الفترة المحددة.',
  'Value of AI credits used. Click a bar to zoom into that period.': 'قيمة أرصدة الذكاء الاصطناعي المستخدمة. انقر على عمود للتكبير على تلك الفترة.',
  'Stack by': 'التكديس حسب',
  'Chart type': 'نوع المخطط',
  'Mark unusual days': 'تمييز الأيام غير المعتادة',
  '{chart}, stacked by {split}': '{chart}، مكدّسًا حسب {split}',
  'Covered vs billed': 'المشمول مقابل المدفوع إضافيًا',
  'Total usage': 'إجمالي الاستخدام',

  // Month facts
  'The selected rows used {usage} in {month}. The file does not say what was billed, so the covered and billed parts are not known.':
    'استخدمت الصفوف المحددة {usage} في {month}. الملف لا يذكر ما دُفع إضافيًا، لذا فالجزء المشمول بالخطة والجزء المدفوع إضافيًا غير معروفين.',
  '{month} used {usage}. The file does not say what was billed, so the covered and billed parts are not known.':
    'بلغ الاستخدام في {month} {usage}. الملف لا يذكر ما دُفع إضافيًا، لذا فالجزء المشمول بالخطة والجزء المدفوع إضافيًا غير معروفين.',
  '{month} used {usage} so far. The file does not say what was billed, so the covered and billed parts are not known.':
    'بلغ الاستخدام في {month} حتى الآن {usage}. الملف لا يذكر ما دُفع إضافيًا، لذا فالجزء المشمول بالخطة والجزء المدفوع إضافيًا غير معروفين.',
  'The selected rows used {usage} in {month}: {covered} covered by included credits and {billed} billed on top of seats.':
    'استخدمت الصفوف المحددة {usage} في {month}: منها {covered} مغطى من الأرصدة المشمولة و{billed} مدفوع إضافيًا فوق التراخيص.',
  'The included credits ran out on {date}. Usage after that is billed on top of seats.': 'نفدت الأرصدة المشمولة في {date}. والاستخدام بعد ذلك يُدفع إضافيًا فوق التراخيص.',
  'The included credits lasted all month. {amount} ({share} of the pool) went unused. Unused credits do not roll over.':
    'كفت الأرصدة المشمولة طوال الشهر. بقي {amount} ({share} من الرصيد المشترك) دون استخدام. لا تُرحَّل الأرصدة غير المستخدمة.',
  '{amount} of included credits are left ({credits}, {share} of the pool).': 'تبقّى {amount} من الأرصدة المشمولة ({credits}، أي {share} من الرصيد المشترك).',
  'Billing on top of seats began on {date}.': 'بدأ الدفع الإضافي فوق التراخيص في {date}.',
  'Billed on top of seats in the month: {billed}, {share} of usage.': 'المدفوع إضافيًا فوق التراخيص في الشهر: {billed}، أي {share} من الاستخدام.',
  'Billed on top of seats so far: {billed}, {share} of usage.': 'المدفوع إضافيًا فوق التراخيص حتى الآن: {billed}، أي {share} من الاستخدام.',
  'Nothing was billed on top of seats in the month.': 'لم يُدفع أي مبلغ إضافي فوق التراخيص في الشهر.',
  'Nothing was billed on top of seats so far.': 'لم يُدفع أي مبلغ إضافي فوق التراخيص حتى الآن.',
  'If the current pace holds, usage for {month} ends at about {usage} (likely {low} to {high}).':
    'إذا استمرت الوتيرة الحالية، ينتهي الاستخدام في {month} عند نحو {usage} (على الأرجح من {low} إلى {high}).',
  'If the current pace holds, usage for {month} ends at about {usage}.': 'إذا استمرت الوتيرة الحالية، ينتهي الاستخدام في {month} عند نحو {usage}.',
  'That would bill about {billed} on top of seats (likely {low} to {high}).': 'وهذا يعني دفع نحو {billed} إضافيًا فوق التراخيص (على الأرجح من {low} إلى {high}).',
  'That would bill about {billed} on top of seats.': 'وهذا يعني دفع نحو {billed} إضافيًا فوق التراخيص.',
  'That should stay within the included credits. At the higher pace, about {billed} would be billed.': 'يُرجّح أن يبقى ذلك ضمن الأرصدة المشمولة. وبالوتيرة الأعلى، يُدفع نحو {billed} إضافيًا.',
  'That stays within the included credits, so nothing would be billed on top of seats.': 'يبقى ذلك ضمن الأرصدة المشمولة، لذا لن يُدفع شيء إضافي فوق التراخيص.',
  'The credits are expected to run out around {date}.': 'يُتوقع أن تنفد الأرصدة نحو {date}.',
  'At the average pace, the credits last until the end of the month.': 'بالوتيرة المتوسطة، تكفي الأرصدة حتى نهاية الشهر.',
  '{takers} of {active} active users used more than the credits in their own seat, by {amount} together.': p(
    '{takers} من {active} مستخدم نشط استخدموا أكثر من الأرصدة التي في تراخيصهم، بمقدار {amount} مجتمعين.',
    '{takers} من {active} مستخدمَين نشطَين استخدموا أكثر من الأرصدة التي في تراخيصهم، بمقدار {amount} مجتمعين.',
    '{takers} من {active} مستخدمين نشطين استخدموا أكثر من الأرصدة التي في تراخيصهم، بمقدار {amount} مجتمعين.',
    '{takers} من {active} مستخدمًا نشطًا استخدموا أكثر من الأرصدة التي في تراخيصهم، بمقدار {amount} مجتمعين.',
    '{takers} من {active} مستخدم نشط استخدموا أكثر من الأرصدة التي في تراخيصهم، بمقدار {amount} مجتمعين.',
  ),
  'They draw on the credits of seats that used less.': 'وهم يسحبون من أرصدة تراخيص استخدمت أقل.',
  'Nobody used more than the credits in their own seat.': 'لم يستخدم أحد أكثر من الأرصدة التي في ترخيصه.',
  'The selected dates cover only part of {month}, so its pool figures are understated.': 'التواريخ المحددة تغطي جزءًا من {month} فقط، لذا فأرقام رصيده المشترك أقل من الحقيقة.',
  'The selected dates cover only part of {month}, so its usage is understated.': 'التواريخ المحددة تغطي جزءًا من {month} فقط، لذا فاستخدامه أقل من الحقيقة.',

  // Missing columns
  'The file has no discount_amount or net_amount column and no total_monthly_quota column, so the included credits cannot be sized or tracked. Load the complete usage report to see how much of the pool was used and when it ran out.':
    'لا يحتوي الملف عمود discount_amount أو net_amount ولا عمود total_monthly_quota، لذا لا يمكن معرفة حجم الأرصدة المشمولة ولا تتبعها. حمّل تقرير الاستخدام الكامل لترى كم استُخدم من الرصيد المشترك ومتى نفد.',
  'The file has no discount_amount or net_amount column, so the included credits cannot be tracked. Load the complete usage report to see how much of the pool was used and when it ran out.':
    'لا يحتوي الملف عمود discount_amount أو net_amount، لذا لا يمكن تتبع الأرصدة المشمولة. حمّل تقرير الاستخدام الكامل لترى كم استُخدم من الرصيد المشترك ومتى نفد.',
  'The file has no total_monthly_quota column, so the size of the included credits is unknown. Load the complete usage report to see how much of the pool was used and when it ran out.':
    'لا يحتوي الملف عمود total_monthly_quota، لذا فحجم الأرصدة المشمولة غير معروف. حمّل تقرير الاستخدام الكامل لترى كم استُخدم من الرصيد المشترك ومتى نفد.',

  // Chart tooltips and markers
  'Mostly {user} {amount} on {model}': 'غالبًا {user} {amount} على {model}',
  'Mostly {user} {amount}': 'غالبًا {user} {amount}',
  'Mostly {model}': 'غالبًا {model}',
  '{amount}, {multiple} a typical day ({baseline})': '{amount}، أي {multiple} اليوم المعتاد ({baseline})',
  'Unusual day': 'يوم غير معتاد',
  '{n} unusual days': p('يوم غير معتاد واحد', 'يومان غير معتادين', '{n} أيام غير معتادة', '{n} يومًا غير معتاد', '{n} يوم غير معتاد'),
  'Unusual day {date}': 'يوم غير معتاد {date}',
  'Usage so far': 'الاستخدام حتى الآن',
  'Likely range': 'النطاق المرجّح',
  'Expected to run out {date}': 'يُتوقع النفاد في {date}',
  'Included credits {amount}': 'الأرصدة المشمولة {amount}',
};

export default ar;
