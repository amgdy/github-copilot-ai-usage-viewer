import type { Dict } from '../core';

/** Arabic for the shared metric docs in `lib/metrics/docs/core.ts`: money, tokens and the Auto discount. */
const arabic: Dict = {
  // Money and credits
  'AI credit and dollar amounts': 'رصيد الذكاء الاصطناعي والمبالغ بالدولار',
  'GitHub meters GitHub Copilot usage in AI credits, and one credit is worth $0.01. The report already states every amount in dollars, and this app shows those dollars.':
    'تقيس GitHub استخدام GitHub Copilot بأرصدة الذكاء الاصطناعي، وقيمة الرصيد الواحد $0.01. يذكر التقرير كل مبلغ بالدولار، وهذا التطبيق يعرض هذه المبالغ نفسها.',
  'dollars = credits × $0.01': 'الدولارات = الأرصدة × $0.01',
  "Seat sizes are quoted in credits a month: Business 1,900 credits ($19) and Enterprise 3,900 credits ($39). The size of each user's seat is read from total_monthly_quota.":
    'يُحدَّد حجم الترخيص بالأرصدة في الشهر: Business ‏1,900 رصيد ($19) وEnterprise ‏3,900 رصيد ($39). يُقرأ حجم ترخيص كل مستخدم من total_monthly_quota.',
  'When the file has no gross_amount column the app uses quantity × applied_cost_per_quantity instead, and 0.01 when the price column is missing as well.':
    'إذا لم يكن في الملف عمود gross_amount يستخدم التطبيق quantity × applied_cost_per_quantity بدلًا منه، ويستخدم 0.01 إذا كان عمود السعر غير موجود أيضًا.',
  'A row with a quantity of 250 credits at a price of $0.01 is $2.50.': 'صف فيه 250 رصيدًا بسعر $0.01 قيمته $2.50.',
  'Everything that was used in the period, valued at the amounts in the report, before included credits are taken off. It is the total consumption, whoever ends up paying for it.':
    'كل ما استُخدم في الفترة، بقيمة المبالغ الواردة في التقرير، قبل خصم الأرصدة المشمولة. إنه الاستهلاك الكامل، أيًا كان من يدفعه في النهاية.',
  'Usage = sum of gross_amount': 'الاستخدام = مجموع gross_amount',
  'In a consistent file, usage = covered by included credits + billed on top of seats.':
    'في الملف المتّسق: الاستخدام = المغطى من الأرصدة المشمولة + المدفوع الإضافي فوق رسوم التراخيص.',
  'Rows that went through Auto are already shown after the Auto discount, when the plan has one. Usage is therefore the amount charged for those requests, not their original price. Auto discount received shows the difference.':
    'صفوف Auto تظهر بعد خصم Auto إذا كان للخطة خصم. لذلك الاستخدام هو المبلغ المحتسب لهذه الطلبات، لا سعرها الأصلي. ويعرض «خصم Auto المحقق» الفرق.',
  'Rows without a username, such as repository-level products, count in the totals but belong to no user.':
    'الصفوف التي ليس فيها اسم مستخدم، مثل منتجات مستوى المستودع، تدخل في الإجماليات لكنها لا تتبع أي مستخدم.',
  '40 users who each use $12 of credits in a month give a usage of $480.': '40 مستخدمًا يستخدم كل منهم أرصدة بقيمة $12 في الشهر يعطون استخدامًا قدره $480.',
  'The part of usage that the credits included in the seats paid for. Nobody is charged extra for it.':
    'جزء الاستخدام الذي دفعته الأرصدة المشمولة في التراخيص. لا يُدفع عنه أي مبلغ إضافي.',
  'Covered = sum of discount_amount': 'المشمول بالخطة = مجموع discount_amount',
  'In the report this column is called a discount, but it is not a price reduction. It is the included credits applied to the usage. The Auto discount is a different thing and has its own explanation.':
    'يسمّي التقرير هذا العمود خصمًا، لكنه ليس تخفيضًا في السعر. إنه الأرصدة المشمولة التي طُبّقت على الاستخدام. خصم Auto شيء مختلف وله شرح خاص.',
  'When the file has no discount_amount column the app uses gross_amount − net_amount. When it has neither discount_amount nor net_amount the split is unknown, and the page shows a dash instead of a made-up number.':
    'إذا لم يكن في الملف عمود discount_amount يستخدم التطبيق gross_amount − net_amount. وإذا لم يكن فيه discount_amount ولا net_amount فالتقسيم غير معروف، وتعرض الصفحة شرطة بدل رقم مختلق.',
  "If the month's usage is $12,000 and the pool is $10,000, covered is $10,000 and billed is $2,000.":
    'إذا كان استخدام الشهر $12,000 والرصيد المشترك $10,000، فالمشمول بالخطة $10,000 والمدفوع الإضافي $2,000.',
  'Billed on top of seats': 'مدفوع إضافي فوق رسوم التراخيص',
  'The part of usage that the included credits did not cover. It is charged in addition to the seat prices.':
    'جزء الاستخدام الذي لم تغطه الأرصدة المشمولة. يُدفع بالإضافة إلى أسعار التراخيص.',
  'Billed = sum of net_amount': 'المدفوع الإضافي = مجموع net_amount',
  'It stays at zero while the pool still has credits left for the month.': 'يبقى صفرًا ما دام في الرصيد المشترك أرصدة متبقية للشهر.',
  'When the file has no net_amount column the app uses gross_amount − discount_amount.': 'إذا لم يكن في الملف عمود net_amount يستخدم التطبيق gross_amount − discount_amount.',
  "If the month's usage is $12,000 and the pool is $10,000, billed is $2,000.": 'إذا كان استخدام الشهر $12,000 والرصيد المشترك $10,000، فالمدفوع الإضافي $2,000.',
  'Included credits (pool size)': 'الأرصدة المشمولة (حجم الرصيد المشترك)',
  'The credits a month that the licensed seats bring with them. Usage is paid from this pool first, and only what goes beyond it is billed.':
    'الأرصدة الشهرية التي تأتي مع التراخيص. يُدفع الاستخدام من هذا الرصيد المشترك أولًا، ولا يُدفع إضافيًا إلا ما يتجاوزه.',
  'Pool size of a month = sum over users of total_monthly_quota × $0.01': 'حجم الرصيد المشترك في شهر = مجموع total_monthly_quota للمستخدمين × $0.01',
  'For each calendar month, take the largest total_monthly_quota that each user shows in that month. Users without a quota are skipped.':
    'في كل شهر تقويمي، خذ أكبر قيمة total_monthly_quota تظهر لكل مستخدم في ذلك الشهر. يُتجاوز المستخدمون الذين ليس لهم حصة.',
  'Add the quotas of all those users and multiply by $0.01.': 'اجمع حصص كل هؤلاء المستخدمين واضربها في $0.01.',
  'Add the credits of every seat on your roster in Settings that does not appear in the report that month, priced by its plan. Add the extra Business and Enterprise seats you entered in Settings as well. This is skipped when a row or segment filter narrows the view, because the roster describes the whole organization.':
    'أضف أرصدة كل ترخيص في قائمة التراخيص في الإعدادات لا يظهر في التقرير في ذلك الشهر، حسب خطته. وأضف أيضًا تراخيص Business وEnterprise الإضافية التي أدخلتها في الإعدادات. تُتجاوز هذه الخطوة إذا ضيّق عامل تصفية للصفوف أو للشرائح العرض، لأن قائمة التراخيص تصف المؤسسة كلها.',
  'For a period of several months, the sizes of the months are added up. The card on the Usage and pool page shows the size of the latest month only, and its label names that month.':
    'في فترة من عدة أشهر تُجمع أحجام الأشهر. تعرض البطاقة في صفحة «الاستخدام والرصيد المشترك» حجم آخر شهر فقط، ويذكر عنوانها ذلك الشهر.',
  'A seat that never used GitHub Copilot in a month is not in the file, so the real pool can be larger than the app can see. A star next to a pool size means it may be a lower bound.':
    'الترخيص الذي لم يستخدم GitHub Copilot في شهر لا يظهر في الملف، لذلك قد يكون الرصيد المشترك الحقيقي أكبر مما يراه التطبيق. النجمة بجانب حجم الرصيد المشترك تعني أنه قد يكون حدًا أدنى.',
  'When the report does not say what was billed, or the covered credits are above the pool the app can see, the pool size and the figures built on it are shown as unknown instead of a guess.':
    'إذا لم يذكر التقرير ما دُفع إضافيًا، أو كانت الأرصدة المغطاة أكبر من الرصيد المشترك الذي يراه التطبيق، يظهر حجم الرصيد المشترك والأرقام المبنية عليه كغير معروفة بدل التخمين.',
  '300 users on a 1,900 credit plan and 100 users on a 3,900 credit plan bring 960,000 credits, a pool of $9,600 a month.':
    '300 مستخدم على خطة 1,900 رصيد و100 مستخدم على خطة 3,900 رصيد يجلبون 960,000 رصيد، أي رصيدًا مشتركًا قدره $9,600 في الشهر.',
  'Included credits used': 'نسبة استخدام الأرصدة المشمولة',
  'How much of the pool of included credits was used. At 100% the pool ran out, and everything after that was billed on top of the seats.':
    'كم استُخدم من الرصيد المشترك للأرصدة المشمولة. عند 100% نفد الرصيد المشترك، وكل ما بعده دُفع إضافيًا فوق رسوم التراخيص.',
  'Included credits used = covered by included credits ÷ pool size': 'نسبة استخدام الأرصدة المشمولة = المغطى من الأرصدة المشمولة ÷ حجم الرصيد المشترك',
  'The same number is called pool utilization in the status banner, the recommendations and the exports.': 'يُسمّى الرقم نفسه استخدام الرصيد المشترك في شريط الحالة والتوصيات والتصديرات.',
  'For several months it is the covered credits of all months ÷ the pool sizes of all months.': 'في عدة أشهر هو الأرصدة المغطاة في كل الأشهر ÷ أحجام الرصيد المشترك في كل الأشهر.',
  'It is shown as unknown when the file does not say what was billed, or when the covered credits are above the pool size the app can see. In both cases the pool size is too uncertain for a percentage.':
    'يظهر كغير معروف إذا لم يذكر الملف ما دُفع إضافيًا، أو إذا كانت الأرصدة المغطاة أكبر من حجم الرصيد المشترك الذي يراه التطبيق. في الحالتين يكون حجم الرصيد المشترك غير مؤكد بما يكفي لحساب نسبة.',
  'Covered credits of $8,000 against a pool of $9,600 give 83%.': 'أرصدة مغطاة بقيمة $8,000 مقابل رصيد مشترك قدره $9,600 تعطي 83%.',
  'Included credits left': 'الأرصدة المشمولة المتبقية',
  'Included credits that were paid for in the seat prices and not used.': 'أرصدة مشمولة دُفع ثمنها ضمن أسعار التراخيص ولم تُستخدم.',
  'Credits left = max(0, pool size − covered by included credits)': 'الأرصدة المتبقية = max(0, حجم الرصيد المشترك − المغطى من الأرصدة المشمولة)',
  'It is shown as unknown in the same cases as the included credits used: no billing split, or covered credits above the pool the app can see.':
    'يظهر كغير معروف في الحالات نفسها التي تظهر فيها نسبة استخدام الأرصدة المشمولة كغير معروفة: لا تقسيم للفوترة، أو أرصدة مغطاة أكبر من الرصيد المشترك الذي يراه التطبيق.',
  'A pool of $9,600 with $8,000 covered leaves $1,600.': 'رصيد مشترك قدره $9,600 غُطّي منه $8,000 يترك $1,600.',
  'Pool ran out on': 'نفد الرصيد المشترك في',
  'The day in a month when the included credits ran out and billing on top of the seats began.': 'اليوم من الشهر الذي نفدت فيه الأرصدة المشمولة وبدأ فيه الدفع الإضافي فوق رسوم التراخيص.',
  'Pool ran out on = first day of the month with a billed amount above zero': 'نفد الرصيد المشترك في = أول يوم في الشهر فيه مبلغ مدفوع إضافي أكبر من صفر',
  'The report has one date per row and no time of day, so this is a day, not a moment.': 'في التقرير تاريخ واحد لكل صف بلا وقت محدد من اليوم، لذلك هذا يوم وليس لحظة.',
  'If the first row with a net_amount above zero is dated 18 May, the pool ran out on 18 May.': 'إذا كان أول صف فيه net_amount أكبر من صفر بتاريخ 18 مايو، فقد نفد الرصيد المشترك في 18 مايو.',
  'Projected month total': 'إجمالي الشهر المتوقع',
  'A forecast of how the current month will end. It appears only when the data stops before the last day of the month.': 'توقّع لما سينتهي إليه الشهر الحالي. يظهر فقط إذا توقفت البيانات قبل آخر يوم في الشهر.',
  'Projected usage = usage so far + days left × daily rate': 'الاستخدام المتوقع = الاستخدام حتى الآن + الأيام المتبقية × المعدل اليومي',
  'Days elapsed = the last day with data − the first day of the month + 1. Days left = the last day of the month − the last day with data.':
    'الأيام المنقضية = آخر يوم فيه بيانات − أول يوم في الشهر + 1. الأيام المتبقية = آخر يوم في الشهر − آخر يوم فيه بيانات.',
  'Month-to-date rate = usage so far ÷ days elapsed.': 'معدل الشهر حتى الآن = الاستخدام حتى الآن ÷ الأيام المنقضية.',
  'Recent rate = usage of the last 7 days (fewer when the month is younger) ÷ the days in that window.': 'المعدل الأخير = استخدام آخر 7 أيام (أقل إذا كان الشهر في بدايته) ÷ عدد أيام هذه الفترة.',
  'Daily rate = the average of the two rates. The low and high ends of the range use the smaller and the larger of the two.':
    'المعدل اليومي = متوسط المعدلين. يستخدم الحدان الأدنى والأعلى للنطاق أصغر المعدلين وأكبرهما.',
  'Projected billed amount: when the pool already ran out, billed so far + days left × daily rate. Otherwise max(0, projected usage − pool size). When the pool size is unknown and the pool has not run out, billed so far is kept.':
    'المبلغ المدفوع الإضافي المتوقع: إذا نفد الرصيد المشترك فهو المدفوع الإضافي حتى الآن + الأيام المتبقية × المعدل اليومي. وإلا فهو max(0, الاستخدام المتوقع − حجم الرصيد المشترك). إذا كان حجم الرصيد المشترك غير معروف ولم ينفد بعد، يبقى المدفوع الإضافي حتى الآن كما هو.',
  'Every day counts the same, so weekends are not treated differently from working days.': 'كل الأيام تُحسب بالتساوي، فلا تُعامل عطلة نهاية الأسبوع بشكل مختلف عن أيام العمل.',
  'The expected date the pool runs out = the last day with data + ceil((pool size − usage so far) ÷ daily rate). It is shown only when it falls inside the month.':
    'التاريخ المتوقع لنفاد الرصيد المشترك = آخر يوم فيه بيانات + ceil((حجم الرصيد المشترك − الاستخدام حتى الآن) ÷ المعدل اليومي). يظهر فقط إذا وقع داخل الشهر.',
  'It is a trend line, not a commitment. A new team starting to use GitHub Copilot or a runaway agent session can change it quickly.':
    'إنه خط اتجاه وليس التزامًا. فريق جديد يبدأ باستخدام GitHub Copilot أو جلسة وكيل خارجة عن السيطرة قد يغيّره بسرعة.',
  'Data ends on 10 June. Usage so far is $3,000 over 10 days ($300 a day) and the last 7 days were $2,800 ($400 a day). The daily rate is $350, so the projected usage is $3,000 + 20 × $350 = $10,000. With a pool of $9,600, the projected billed amount is $400.':
    'تنتهي البيانات في 10 يونيو. الاستخدام حتى الآن $3,000 في 10 أيام ($300 في اليوم) وآخر 7 أيام كانت $2,800 ($400 في اليوم). المعدل اليومي $350، فالاستخدام المتوقع $3,000 + 20 × $350 = $10,000. مع رصيد مشترك قدره $9,600 يكون المدفوع الإضافي المتوقع $400.',
  'Monthly cost (seats plus overage)': 'التكلفة الشهرية (التراخيص مع التجاوز)',
  'What a month costs when a seat is priced at the value of its included credits: the whole pool is paid for, and usage above the pool is billed on top.':
    'تكلفة الشهر إذا كان سعر الترخيص يساوي قيمة أرصدته المشمولة: يُدفع الرصيد المشترك كاملًا، والاستخدام الذي يتجاوزه يُدفع إضافيًا.',
  'Monthly cost = max(pool size, usage)': 'التكلفة الشهرية = max(حجم الرصيد المشترك, الاستخدام)',
  'It assumes that a seat costs what its credits are worth: $19 for 1,900 credits and $39 for 3,900 credits. Check this against your own contract.':
    'يفترض أن الترخيص يكلّف قيمة أرصدته: $19 مقابل 1,900 رصيد و$39 مقابل 3,900 رصيد. تحقّق من ذلك في عقدك.',
  'The savings plan uses this rule to turn less usage and fewer seats into dollars.': 'تستخدم خطة التوفير هذه القاعدة لتحويل الاستخدام الأقل والتراخيص الأقل إلى دولارات.',
  'A pool of $9,600 and usage of $8,000 cost $9,600, which is the seats. Usage of $10,500 costs $10,500: the seats plus $900 on top.':
    'رصيد مشترك قدره $9,600 واستخدام قدره $8,000 يكلّفان $9,600، وهي قيمة التراخيص. واستخدام قدره $10,500 يكلّف $10,500: التراخيص مع $900 إضافية.',
  'Per-month figures': 'الأرقام الشهرية',
  'A total over the selected period turned into an average month, so periods of different length can be compared.': 'إجمالي الفترة المحددة محوّلًا إلى شهر متوسط، حتى يمكن مقارنة فترات مختلفة الطول.',
  'Per month = period total × 30.4375 ÷ days in the period': 'في الشهر = إجمالي الفترة × 30.4375 ÷ أيام الفترة',
  '30.4375 is the average length of a month in days (365.25 ÷ 12).': '30.4375 هو متوسط طول الشهر بالأيام (365.25 ÷ 12).',
  'The days in the period are the days of the date range that is selected, including days without usage.': 'أيام الفترة هي أيام النطاق الزمني المحدد، بما فيها الأيام التي لا استخدام فيها.',
  'A usage of $6,000 over 61 days is $6,000 × 30.4375 ÷ 61 = about $2,994 per month.': 'استخدام قدره $6,000 في 61 يومًا يساوي $6,000 × 30.4375 ÷ 61 = نحو $2,994 في الشهر.',

  // Tokens and cost split
  'Text the model read that was not served from the cache: new prompts, files and conversation history, sent at the full input rate.':
    'نص قرأه النموذج ولم يأتِ من الذاكرة المؤقتة: طلبات جديدة وملفات وسجل المحادثة، ويُحتسب بسعر الإدخال الكامل.',
  'Input tokens = sum of the input column': 'رموز الإدخال = مجموع عمود input',
  'Input, cache read, cache write and output are four separate counts, so nothing is counted twice between them.':
    'الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها والإخراج أربعة أعداد منفصلة، فلا يُحسب شيء مرتين بينها.',
  'Prompt text the model had already seen and could read from its cache. It is charged at a much lower rate than fresh input.':
    'نص طلب رآه النموذج من قبل واستطاع قراءته من ذاكرته المؤقتة. يُحتسب بسعر أقل بكثير من الإدخال الجديد.',
  'Cache read tokens = sum of the cache_read column': 'رموز القراءة من الذاكرة المؤقتة = مجموع عمود cache_read',
  'On the current price card the cache read rate is a quarter of the input rate or less for every model, so a high share of cache reads lowers the cost of a request.':
    'في قائمة الأسعار الحالية سعر القراءة من الذاكرة المؤقتة ربع سعر الإدخال أو أقل لكل نموذج، لذلك تخفض النسبة العالية من القراءة من الذاكرة المؤقتة تكلفة الطلب.',
  'Prompt text that the model stored in its cache so that later requests can reuse it.': 'نص طلب خزّنه النموذج في ذاكرته المؤقتة لتعيد الطلبات اللاحقة استخدامه.',
  'Cache write tokens = sum of the cache_write column': 'رموز الكتابة في الذاكرة المؤقتة = مجموع عمود cache_write',
  'Some models charge a separate rate for cache writes, at or above the input rate. Others have no separate cache write charge, so these tokens add nothing to their cost split.':
    'بعض النماذج لها سعر منفصل للكتابة في الذاكرة المؤقتة، يساوي سعر الإدخال أو يزيد عليه. وبعضها ليس لها سعر منفصل لذلك، فلا تضيف هذه الرموز شيئًا إلى تقسيم تكلفتها.',
  'Text the model wrote back: answers, code and reasoning.': 'النص الذي كتبه النموذج في الرد: إجابات وكود واستدلال.',
  'Output tokens = sum of the output column': 'رموز الإخراج = مجموع عمود output',
  'On the current price card the output rate is at least three times the input rate for every model, so output tokens cost more per token than input tokens.':
    'في قائمة الأسعار الحالية سعر الإخراج ثلاثة أضعاف سعر الإدخال على الأقل لكل نموذج، لذلك يكلّف رمز الإخراج أكثر من رمز الإدخال.',
  'Prompt tokens': 'رموز الطلب',
  'Everything the model was given to read, whether it was new or came from the cache.': 'كل ما أُعطي للنموذج ليقرأه، سواء كان جديدًا أو جاء من الذاكرة المؤقتة.',
  'Prompt tokens = input + cache read + cache write': 'رموز الطلب = الإدخال + القراءة من الذاكرة المؤقتة + الكتابة في الذاكرة المؤقتة',
  '150,000 input, 800,000 cache read and 50,000 cache write tokens make 1,000,000 prompt tokens.':
    '150,000 رمز إدخال و800,000 رمز قراءة من الذاكرة المؤقتة و50,000 رمز كتابة فيها تساوي 1,000,000 رمز طلب.',
  'Total tokens': 'إجمالي الرموز',
  'All tokens of the four kinds together.': 'كل الرموز من الأنواع الأربعة معًا.',
  'Total tokens = input + cache read + cache write + output': 'إجمالي الرموز = الإدخال + القراءة من الذاكرة المؤقتة + الكتابة في الذاكرة المؤقتة + الإخراج',
  'Tokens are not all priced alike, so two users with the same total can have very different usage. Compare cost by token type for that.':
    'لا تُسعَّر الرموز كلها بالسعر نفسه، فقد يكون لمستخدمَين بالإجمالي نفسه استخدام مختلف جدًا. قارن التكلفة حسب نوع الرمز لمعرفة ذلك.',
  'How much of the text sent to the model was served from its cache. A higher rate means cheaper requests for the same work.':
    'كم من النص المرسل إلى النموذج جاء من ذاكرته المؤقتة. النسبة الأعلى تعني طلبات أرخص للعمل نفسه.',
  'Cache hit rate = cache read ÷ (input + cache read + cache write)':
    'نسبة القراءة من الذاكرة المؤقتة = القراءة من الذاكرة المؤقتة ÷ (الإدخال + القراءة من الذاكرة المؤقتة + الكتابة في الذاكرة المؤقتة)',
  'It is unknown, and shown as a dash, when there are no prompt tokens or the file has no token columns.': 'تكون غير معروفة وتظهر كشرطة إذا لم تكن هناك رموز طلب أو لم يكن في الملف أعمدة رموز.',
  'A user gets the trait Low cache reuse when the rate is below the setting "Low cache reuse below", the usage is at least the setting "Minimum usage for traits", and at least half of the usage could be priced from token counts.':
    'يحصل المستخدم على سمة «استفادة قليلة من الذاكرة المؤقتة» إذا كانت النسبة أقل من الإعداد «استفادة قليلة من الذاكرة المؤقتة تحت»، وكان الاستخدام لا يقل عن الإعداد «الحد الأدنى للاستخدام للسمات»، وأمكن تسعير نصف الاستخدام على الأقل من أعداد الرموز.',
  '800,000 cache read tokens out of 1,000,000 prompt tokens is a cache hit rate of 80%.':
    '800,000 رمز قراءة من الذاكرة المؤقتة من أصل 1,000,000 رمز طلب تعني نسبة قراءة من الذاكرة المؤقتة قدرها 80%.',
  'Cost by token type': 'التكلفة حسب نوع الرمز',
  'How the usage amount divides between input, cache read, cache write and output. The report gives token counts and one amount per row, not an amount per token type, so the split is worked out with the model price card.':
    'كيف يتوزع مبلغ الاستخدام بين الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها والإخراج. يعطي التقرير أعداد الرموز ومبلغًا واحدًا لكل صف، لا مبلغًا لكل نوع رمز، لذلك يُحسب التقسيم باستخدام قائمة أسعار النماذج.',
  'Cost of a token type = row usage × (tokens of that type × its rate) ÷ (price-card cost of the row)':
    'تكلفة نوع رمز = استخدام الصف × (رموز هذا النوع × سعره) ÷ (تكلفة الصف حسب قائمة الأسعار)',
  'For each row whose model is on the price card and that has token counts, price-card cost = input × input rate + cache read × cache read rate + cache write × cache write rate + output × output rate. Rates are per 1 million tokens, at the standard tier.':
    'لكل صف نموذجه في قائمة الأسعار وفيه أعداد رموز: التكلفة حسب قائمة الأسعار = الإدخال × سعر الإدخال + القراءة من الذاكرة المؤقتة × سعرها + الكتابة في الذاكرة المؤقتة × سعرها + الإخراج × سعر الإخراج. الأسعار لكل مليون رمز، بالمستوى القياسي.',
  'Scale the four parts by (gross_amount ÷ price-card cost), so that they add up to the amount of the row.':
    'اضرب الأجزاء الأربعة في (gross_amount ÷ التكلفة حسب قائمة الأسعار) حتى يساوي مجموعها مبلغ الصف.',
  'Add the parts up per user, per model or in total.': 'اجمع الأجزاء لكل مستخدم أو لكل نموذج أو للإجمالي.',
  'The proportions come from the price card and the total comes from the report, so the four parts always add up to the usage of the rows that could be priced. Rows that went through Auto are scaled the same way, so the Auto discount is already in the parts.':
    'النسب تأتي من قائمة الأسعار والإجمالي يأتي من التقرير، لذلك يساوي مجموع الأجزاء الأربعة دائمًا استخدام الصفوف التي أمكن تسعيرها. وتُعامل صفوف Auto بالطريقة نفسها، فخصم Auto موجود في الأجزاء.',
  'Rows without a price card entry for the model, or without token counts, cannot be split. They stay in the usage total but not in the four parts. Token coverage shows how much is left out.':
    'الصفوف التي ليس لنموذجها سعر في قائمة الأسعار، أو ليس فيها أعداد رموز، لا يمكن تقسيمها. تبقى في إجمالي الاستخدام لكن ليس في الأجزاء الأربعة. وتبيّن «تغطية الرموز» كم يُستبعد.',
  'The price card is a copy of the GitHub Docs page "Models and pricing for GitHub Copilot", taken on 27 October 2026. Prices you set in Settings replace the card for that model.':
    'قائمة الأسعار نسخة من صفحة GitHub Docs بعنوان "Models and pricing for GitHub Copilot"، أُخذت في 27 أكتوبر 2026. الأسعار التي تحددها في الإعدادات تحل محل القائمة لذلك النموذج.',
  'A row has 1,000,000 input tokens and 100,000 output tokens on a model that costs $2 per million input and $12 per million output. Price-card cost = $2.00 + $1.20 = $3.20. If the report charged $2.88, each part is scaled by 0.9, which gives $1.80 for input and $1.08 for output.':
    'صف فيه 1,000,000 رمز إدخال و100,000 رمز إخراج على نموذج سعره $2 لكل مليون رمز إدخال و$12 لكل مليون رمز إخراج. التكلفة حسب قائمة الأسعار = $2.00 + $1.20 = $3.20. إذا احتسب التقرير $2.88، يُضرب كل جزء في 0.9، فيكون $1.80 للإدخال و$1.08 للإخراج.',
  'Token coverage': 'تغطية الرموز',
  'How much of the usage could be priced from token counts. The cost by token type, the Auto discount and the long-context premium rely on it, so a low coverage means those figures describe only part of the usage.':
    'كم من الاستخدام أمكن تسعيره من أعداد الرموز. تعتمد عليها التكلفة حسب نوع الرمز وخصم Auto وزيادة السياق الطويل، لذلك تعني التغطية المنخفضة أن هذه الأرقام تصف جزءًا من الاستخدام فقط.',
  'Token coverage = usage of rows that can be priced from tokens ÷ total usage': 'تغطية الرموز = استخدام الصفوف التي يمكن تسعيرها من الرموز ÷ إجمالي الاستخدام',
  'A row can be priced when its model is on the price card (or has rates set in Settings) and the row has token counts.':
    'يمكن تسعير الصف إذا كان نموذجه في قائمة الأسعار (أو له أسعار في الإعدادات) وكان في الصف أعداد رموز.',
  'Add up the usage of those rows. Coverage is that sum ÷ the total usage, up to 100%.': 'اجمع استخدام هذه الصفوف. التغطية هي هذا المجموع ÷ إجمالي الاستخدام، بحد أقصى 100%.',
  'Rows with no model name, an unknown model or no token counts are left out of the cost split. They still count in the usage.':
    'الصفوف التي ليس فيها اسم نموذج، أو نموذجها غير معروف، أو ليس فيها أعداد رموز، تُستبعد من تقسيم التكلفة. لكنها تبقى محسوبة في الاستخدام.',
  'Some models charge higher rates when a request sends a very long prompt. The report does not mark such requests, so the app looks for them. The premium is the part of the amount above the standard price on those rows.':
    'بعض النماذج تحتسب أسعارًا أعلى إذا أرسل الطلب نصًا طويلًا جدًا. لا يميّز التقرير هذه الطلبات، فيبحث عنها التطبيق. الزيادة هي جزء المبلغ الذي يتجاوز السعر القياسي في هذه الصفوف.',
  'Premium = min(amount charged, long-context cost) − standard cost, never below 0': 'الزيادة = min(المبلغ المحتسب, تكلفة السياق الطويل) − التكلفة القياسية، ولا تقل عن 0',
  "Find rows whose model has long-context rates on the price card and whose prompt tokens (input + cache read + cache write) are above that model's long-context threshold.":
    'ابحث عن الصفوف التي لنموذجها أسعار سياق طويل في قائمة الأسعار، ورموز الطلب فيها (الإدخال + القراءة من الذاكرة المؤقتة + الكتابة فيها) أعلى من حد السياق الطويل لذلك النموذج.',
  'Keep the rows whose amount is more than 2% above their standard cost, which is worked out from the tokens at the standard rates.':
    'احتفظ بالصفوف التي يزيد مبلغها بأكثر من 2% على تكلفتها القياسية، المحسوبة من الرموز بالأسعار القياسية.',
  'Premium of a row = the smaller of the amount charged and the cost at the long-context rates, minus the standard cost.':
    'زيادة الصف = الأصغر بين المبلغ المحتسب والتكلفة بأسعار السياق الطويل، ناقص التكلفة القياسية.',
  'It is a lower bound. The app only counts what the price card can confirm.': 'إنها حد أدنى. لا يحسب التطبيق إلا ما تؤكده قائمة الأسعار.',
  'These rows are not used to measure the Auto discount, because the tier they were charged on cannot be told from the file.':
    'لا تُستخدم هذه الصفوف لقياس خصم Auto، لأن الملف لا يبيّن المستوى الذي احتُسبت عليه.',
  'A user gets the trait Long-context surcharges when the premium is at least the share of their usage set in "Long-context surcharges from" and the usage reaches "Minimum usage for traits".':
    'يحصل المستخدم على سمة «رسوم إضافية للسياق الطويل» إذا كانت الزيادة لا تقل عن حصة استخدامه المحددة في «رسوم إضافية للسياق الطويل من» ووصل الاستخدام إلى «الحد الأدنى للاستخدام للسمات».',
  'A request has 300,000 prompt tokens on a model whose long-context threshold is 200,000. Its standard cost is $1.00, its long-context cost is $1.80 and the report charged $1.60. Premium = min($1.60, $1.80) − $1.00 = $0.60.':
    'طلب فيه 300,000 رمز طلب على نموذج حد السياق الطويل فيه 200,000. تكلفته القياسية $1.00، وتكلفته بأسعار السياق الطويل $1.80، واحتسب التقرير $1.60. الزيادة = min($1.60, $1.80) − $1.00 = $0.60.',

  // Auto model selection
  'How much of the usage went through Auto, where GitHub Copilot picks the model for each request, instead of a model that the user picked by hand.':
    'كم من الاستخدام مرّ عبر Auto، حيث يختار GitHub Copilot النموذج لكل طلب، بدل نموذج اختاره المستخدم يدويًا.',
  'Auto share = usage of Auto rows ÷ total usage': 'حصة Auto = استخدام صفوف Auto ÷ إجمالي الاستخدام',
  'A row counts as Auto when its model is written as "Auto: <model name>" or as "Auto". The model name after the colon is kept, so Auto usage still shows up under the model it ran on.':
    'يُحسب الصف من Auto إذا كُتب نموذجه بالشكل "Auto: <model name>" أو "Auto". يُحفظ اسم النموذج بعد النقطتين، فيظهر استخدام Auto تحت النموذج الذي عمل عليه.',
  'Both parts come from gross_amount, so Auto rows count at the amount charged, which is after the Auto discount.':
    'الجزءان من gross_amount، لذلك تُحسب صفوف Auto بالمبلغ المحتسب، أي بعد خصم Auto.',
  'Without a model column Auto cannot be told apart, and the share is shown as unknown.': 'بدون عمود النموذج لا يمكن تمييز Auto، وتظهر الحصة كغير معروفة.',
  'A usage of $10,000 with $4,000 on Auto rows is an Auto share of 40%.': 'استخدام قدره $10,000 منه $4,000 في صفوف Auto يعني حصة Auto قدرها 40%.',
  'How much cheaper the Auto usage was than the same tokens at the original price, which is the price of the models on the price card. The report has no column for this discount, so it is worked out by comparing the amount charged with the price card.':
    'كم كان استخدام Auto أرخص من الرموز نفسها بالسعر الأصلي، وهو سعر النماذج في قائمة الأسعار. ليس في التقرير عمود لهذا الخصم، لذلك يُحسب بمقارنة المبلغ المحتسب بقائمة الأسعار.',
  'Auto discount = original price − Auto usage in the report': 'خصم Auto = السعر الأصلي − استخدام Auto في التقرير',
  'Measured rows are Auto rows whose model is on the price card, that have token counts, that are not long-context requests and whose amount is between 50% and 105% of their price card cost.':
    'الصفوف المقيسة هي صفوف Auto التي نموذجها في قائمة الأسعار، وفيها أعداد رموز، وليست طلبات سياق طويل، ومبلغها بين 50% و105% من تكلفتها حسب قائمة الأسعار.',
  'For measured rows, the original price = the tokens × the price card rates (input, cache read, cache write and output). The discount = the original price − the amount in the report, never below 0.':
    'في الصفوف المقيسة: السعر الأصلي = الرموز × أسعار قائمة الأسعار (الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها والإخراج). الخصم = السعر الأصلي − المبلغ في التقرير، ولا يقل عن 0.',
  'Auto rows that cannot be measured (no token counts, a model that is not on the price card, a long-context request or an amount far from the card) are estimated. Their original price = the amount in the report ÷ (1 − plan rate).':
    'صفوف Auto التي لا يمكن قياسها (بلا أعداد رموز، أو نموذج ليس في قائمة الأسعار، أو طلب سياق طويل، أو مبلغ بعيد عن القائمة) تُقدَّر. سعرها الأصلي = المبلغ في التقرير ÷ (1 − معدل الخطة).',
  'Auto discount = measured discount + estimated discount. Auto discount rate = Auto discount ÷ original price.':
    'خصم Auto = الخصم المقيس + الخصم المقدَّر. معدل خصم Auto = خصم Auto ÷ السعر الأصلي.',
  'The report states Auto usage after the discount and has no discount column. The discount is never read from the file. It is measured from token counts and the price card.':
    'يذكر التقرير استخدام Auto بعد الخصم وليس فيه عمود للخصم. لا يُقرأ الخصم من الملف أبدًا، بل يُقاس من أعداد الرموز وقائمة الأسعار.',
  'The plan rate is measured from the Auto rows of that plan in the report. The setting "Auto model discount" is used only for a plan with less than $1 of Auto usage that can be measured.':
    'يُقاس معدل الخطة من صفوف Auto لتلك الخطة في التقرير. لا يُستخدم الإعداد «خصم نموذج Auto» إلا لخطة فيها أقل من $1 من استخدام Auto القابل للقياس.',
  'The page shows how much of the Auto usage was measured and how much was estimated. A figure that is mostly measured is the more reliable one.':
    'تبيّن الصفحة كم من استخدام Auto قيس وكم قُدّر. الرقم المقيس في معظمه هو الأوثق.',
  'The discount lowers usage. It turns into cash only when the pool of included credits runs out. Until then it makes the pool last longer.':
    'الخصم يخفض الاستخدام. ولا يصبح توفيرًا نقديًا إلا إذا نفد الرصيد المشترك للأرصدة المشمولة. وحتى ذلك الحين يجعل الرصيد المشترك يدوم أطول.',
  'Do not confuse it with discount_amount, the column of included credits that were applied to the usage.': 'لا تخلط بينه وبين discount_amount، وهو عمود الأرصدة المشمولة التي طُبّقت على الاستخدام.',
  'Auto rows used tokens that cost $1,000 at the price card and the report charged $900. The original price is $1,000, the discount is $100 and the rate is 10%.':
    'استخدمت صفوف Auto رموزًا تكلفتها $1,000 حسب قائمة الأسعار واحتسب التقرير $900. السعر الأصلي $1,000 والخصم $100 والمعدل 10%.',
  'What the same Auto usage would have cost at the price card rates of the models, without the Auto discount.': 'ما كان سيكلّفه استخدام Auto نفسه بأسعار النماذج في قائمة الأسعار، بدون خصم Auto.',
  'Original price = Auto usage in the report + Auto discount': 'السعر الأصلي = استخدام Auto في التقرير + خصم Auto',
  'For measured rows it is the token counts at the price card rates. For the other Auto rows it is grossed up from the amount charged at the plan rate: the rate measured for the plan, or the setting "Auto model discount" when the plan has no Auto usage to measure.':
    'في الصفوف المقيسة هو أعداد الرموز بأسعار قائمة الأسعار. وفي صفوف Auto الأخرى يُحسب من المبلغ المحتسب بمعدل الخطة: المعدل المقيس للخطة، أو الإعداد «خصم نموذج Auto» إذا لم يكن للخطة استخدام Auto يمكن قياسه.',
  'It is worked out from the price card. It is not an amount that appears on an invoice.': 'يُحسب من قائمة الأسعار. وليس مبلغًا يظهر في فاتورة.',
  'Auto usage of $900 in the report with a discount of $100 had an original price of $1,000.': 'استخدام Auto قدره $900 في التقرير مع خصم قدره $100 كان سعره الأصلي $1,000.',
  'The Auto discount rate of each plan, measured from the Auto rows of that plan in the report. It prices the Auto rows that cannot be measured one by one, and the discount missed on hand-picked usage. Plans are told apart by the monthly quota in the report: 1,900 credits is Business and 3,900 credits is Enterprise.':
    'معدل خصم Auto لكل خطة، مقيسًا من صفوف Auto لتلك الخطة في التقرير. يُستخدم لتسعير صفوف Auto التي لا يمكن قياسها واحدًا واحدًا، وللخصم الضائع على الاستخدام المختار يدويًا. تُميَّز الخطط بالحصة الشهرية في التقرير: 1,900 رصيد هي Business و3,900 رصيد هي Enterprise.',
  'Plan rate = 1 − measured Auto usage ÷ original price of that measured usage': 'معدل الخطة = 1 − استخدام Auto المقيس ÷ السعر الأصلي لذلك الاستخدام المقيس',
  'Group users by their total_monthly_quota, which identifies their plan.': 'جمّع المستخدمين حسب total_monthly_quota، التي تحدد خطتهم.',
  'For each plan, add up the measured Auto rows: the amount in the report and the original price from the price card.': 'لكل خطة، اجمع صفوف Auto المقيسة: المبلغ في التقرير والسعر الأصلي من قائمة الأسعار.',
  'Plan rate = 1 − amount ÷ original price, held between 0% and 90%.': 'معدل الخطة = 1 − المبلغ ÷ السعر الأصلي، ويبقى بين 0% و90%.',
  'A plan needs at least $1 of measured Auto usage to use its own rate, which is labeled measured. Only a plan without that uses the setting "Auto model discount", which is labeled assumed.':
    'تحتاج الخطة إلى $1 على الأقل من استخدام Auto المقيس لتستخدم معدلها الخاص، ويُوسم بأنه مقيس. والخطة التي ليس فيها ذلك فقط تستخدم الإعداد «خصم نموذج Auto»، ويُوسم بأنه مفترض.',
  'The rate differs between plans in some reports and is the same in others. The app shows the rate that the file contains for each plan and does not assume a reason for any difference.':
    'يختلف المعدل بين الخطط في بعض التقارير ويتساوى في أخرى. يعرض التطبيق المعدل الموجود في الملف لكل خطة ولا يفترض سببًا لأي اختلاف.',
  'The setting "Auto model discount" is not one rate for everybody. It fills in only for plans with less than $1 of measured Auto usage. The default is 10%, and you can change it in Settings.':
    'الإعداد «خصم نموذج Auto» ليس معدلًا واحدًا للجميع. إنه يُستخدم فقط للخطط التي فيها أقل من $1 من استخدام Auto المقيس. القيمة الافتراضية 10%، ويمكنك تغييرها في الإعدادات.',
  'Plans with no Auto usage at all are not listed in the plan table. If their users move to Auto, the estimates use the setting for them.':
    'الخطط التي ليس فيها أي استخدام لـ Auto لا تظهر في جدول الخطط. إذا انتقل مستخدموها إلى Auto، تستخدم التقديرات الإعداد لهم.',
  'Plan rates are measured on all users that pass the row filters (dates, product, model and so on). Segment filters, which select users, do not change them.':
    'تُقاس معدلات الخطط على كل المستخدمين الذين يمرّون من عوامل تصفية الصفوف (التواريخ والمنتج والنموذج وغيرها). عوامل تصفية الشرائح، التي تختار المستخدمين، لا تغيّرها.',
  'On Business seats the measured Auto rows add up to $900 in the report against $1,000 at the price card, so the Business rate is 10%.':
    'في تراخيص Business يبلغ مجموع صفوف Auto المقيسة $900 في التقرير مقابل $1,000 حسب قائمة الأسعار، فمعدل Business هو 10%.',
  'What the discount would have been on the usage that users sent to models they picked by hand, had it gone through Auto. It is a potential saving, not money that was lost.':
    'الخصم الذي كان سيتحقق على الاستخدام الذي أرسله المستخدمون إلى نماذج اختاروها يدويًا، لو مرّ عبر Auto. إنه توفير محتمل، وليس مالًا ضاع.',
  'Missed discount = sum over users of (usage − Auto usage) × plan rate': 'الخصم الضائع = مجموع (الاستخدام − استخدام Auto) × معدل الخطة لكل المستخدمين',
  'The plan rate is the rate measured for the plan of the user. The setting "Auto model discount" is used only for plans without Auto usage to measure.':
    'معدل الخطة هو المعدل المقيس لخطة المستخدم. لا يُستخدم الإعداد «خصم نموذج Auto» إلا للخطط التي ليس فيها استخدام Auto يمكن قياسه.',
  'Auto chooses the model itself and may not suit every task, so the figure is an upper guide and not a promise.': 'يختار Auto النموذج بنفسه وقد لا يناسب كل مهمة، لذلك الرقم دليل أعلى وليس وعدًا.',
  'Rows without a username are left out, because they have no seat and no model to pick.': 'تُستبعد الصفوف التي ليس فيها اسم مستخدم، لأنه لا ترخيص لها ولا نموذج يُختار.',
  'Without a model column nothing is reported as missed.': 'بدون عمود النموذج لا يُذكر أي خصم ضائع.',
  'The savings plan counts only the share of this potential that the lever "Use Auto model selection" is set to.': 'لا تحسب خطة التوفير إلا الحصة من هذا التوفير المحتمل التي يحددها الإجراء «استخدام Auto لاختيار النموذج».',
  'A user used $200 on hand-picked models and $50 through Auto. With a plan rate of 10%, the missed discount is $200 × 10% = $20.':
    'استخدم مستخدم $200 على نماذج مختارة يدويًا و$50 عبر Auto. بمعدل خطة 10% يكون الخصم الضائع $200 × 10% = $20.',
  'Where a user sits between Auto and hand-picked models. It shows who could save more by choosing Auto.': 'موقع المستخدم بين Auto والنماذج المختارة يدويًا. يبيّن من يمكنه توفير المزيد باختيار Auto.',
  'Auto-first: Auto share ≥ "Auto first from". Direct models: Auto share < "Rarely uses Auto below". Mixed: in between.':
    'يعتمد على Auto: حصة Auto ≥ «يعتمد على Auto من». نماذج مباشرة: حصة Auto < «نادرًا ما يستخدم Auto تحت». مختلط: بينهما.',
  'The defaults are 50% for Auto-first and 10% for Direct models.': 'القيم الافتراضية 50% لـ «يعتمد على Auto» و10% لـ «نماذج مباشرة».',
  'Settings keeps "Rarely uses Auto below" lower than "Auto first from", so the two limits do not overlap. If an older saved setting makes them overlap, Auto-first wins.':
    'تُبقي الإعدادات «نادرًا ما يستخدم Auto تحت» أقل من «يعتمد على Auto من»، فلا يتداخل الحدان. إذا جعلهما إعداد محفوظ قديم يتداخلان، تكون الأولوية لـ «يعتمد على Auto».',
  'A user below "Rarely uses Auto below" whose usage also reaches "Minimum usage for traits" gets the trait Rarely uses Auto as well. The trait needs that minimum usage, the class does not.':
    'المستخدم الذي يقل عن «نادرًا ما يستخدم Auto تحت» ويصل استخدامه أيضًا إلى «الحد الأدنى للاستخدام للسمات» يحصل كذلك على سمة «نادرًا ما يستخدم Auto». السمة تحتاج إلى هذا الحد الأدنى، والفئة لا تحتاج إليه.',
  'Not enough data is shown when the file has no model column or the user has no usage.': 'تظهر «لا توجد بيانات كافية» إذا لم يكن في الملف عمود النموذج أو لم يكن للمستخدم استخدام.',
  'The class is based on the usage in the selected period and filters, so it can change when the filters change.': 'تعتمد الفئة على الاستخدام في الفترة وعوامل التصفية المحددة، فقد تتغير إذا تغيرت عوامل التصفية.',
  'With the defaults, a user with 60% of the usage on Auto is Auto-first, one with 30% is Mixed and one with 5% is Direct models.':
    'بالقيم الافتراضية، المستخدم الذي 60% من استخدامه على Auto «يعتمد على Auto»، ومن نسبته 30% «مختلط»، ومن نسبته 5% «نماذج مباشرة».',
};

export default arabic;
