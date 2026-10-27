import type { Dict } from '../core';

/** Arabic for the Overview metric docs in `lib/metrics/docs/overview.ts`. */
const arabic: Dict = {
  // Users and rankings
  'Active users': 'المستخدمون النشطون',
  'The number of different people who used GitHub Copilot in the selected period.': 'عدد الأشخاص المختلفين الذين استخدموا GitHub Copilot في الفترة المحددة.',
  'Active users = number of distinct usernames with at least one row in the selected period': 'المستخدمون النشطون = عدد أسماء المستخدمين المختلفة التي لها صف واحد على الأقل في الفترة المحددة',
  'Rows without a username, such as repository-level products, are not counted.': 'الصفوف التي ليس فيها اسم مستخدم، مثل منتجات مستوى المستودع، لا تُحسب.',
  'It is not the number of licensed seats. A seat that used no AI credits in the period has no row in the report, so it is not counted.':
    'إنه ليس عدد التراخيص. الترخيص الذي لم يستخدم أي أرصدة ذكاء اصطناعي في الفترة ليس له صف في التقرير، فلا يُحسب.',
  'The line under the number says how many seats on your roster in Settings never appear in the report. When there are none, it gives the average number of users on a typical day: over the days that have usage, the users who used at least the active-day threshold on that day.':
    'يذكر السطر تحت الرقم كم ترخيصًا في قائمة التراخيص في الإعدادات لا يظهر في التقرير أبدًا. إذا لم يوجد أي منها، يعطي متوسط عدد المستخدمين في يوم عادي: في الأيام التي فيها استخدام، المستخدمون الذين بلغ استخدامهم حد اليوم النشط في ذلك اليوم.',
  'If 140 different usernames appear in the rows of the period, there are 140 active users, even if only 90 of them are active on a typical day.':
    'إذا ظهر 140 اسم مستخدم مختلفًا في صفوف الفترة، فهناك 140 مستخدمًا نشطًا، حتى لو كان 90 منهم فقط نشطين في يوم عادي.',
  'Per user, per month': 'لكل مستخدم في الشهر',
  'The usage of an average active user in a month. Compare it with the credits included in a seat to see whether a typical user stays inside their own allowance.':
    'استخدام مستخدم نشط متوسط في الشهر. قارنه بالأرصدة المشمولة في الترخيص لتعرف هل يبقى المستخدم العادي ضمن حصته.',
  'Per user, per month = usage ÷ active users × 30.4375 ÷ days in the period': 'لكل مستخدم في الشهر = الاستخدام ÷ المستخدمين النشطين × 30.4375 ÷ أيام الفترة',
  'A Business seat includes $19 of credits a month and an Enterprise seat $39.': 'يشمل ترخيص Business أرصدة بقيمة $19 في الشهر، ويشمل ترخيص Enterprise ‏$39.',
  'Everyone with usage counts the same, so a few heavy users raise the average. The Users page shows who they are.':
    'كل من له استخدام يُحسب بالتساوي، لذلك يرفع قلة من المستخدمين الكثيفين المتوسط. صفحة المستخدمين تبيّن من هم.',
  'Seats that used nothing are not in the report, so they are not part of the average.': 'التراخيص التي لم تستخدم شيئًا ليست في التقرير، فلا تدخل في المتوسط.',
  '60 active users with $3,000 of usage over 61 days: $3,000 ÷ 60 = $50 per user. Then $50 × 30.4375 ÷ 61 is about $25 per user, per month.':
    '60 مستخدمًا نشطًا باستخدام قدره $3,000 في 61 يومًا: $3,000 ÷ 60 = $50 لكل مستخدم. ثم $50 × 30.4375 ÷ 61 تساوي نحو $25 لكل مستخدم في الشهر.',
  'Top 10% of users': 'أعلى 10% من المستخدمين',
  'How much of the usage comes from the heaviest tenth of users. A high share means that a few people decide the bill.':
    'كم من الاستخدام يأتي من العُشر الأكثر استخدامًا من المستخدمين. الحصة العالية تعني أن قلة من الأشخاص تحدد الفاتورة.',
  'Top 10% share = usage of the heaviest 10% of users ÷ usage of all users': 'حصة أعلى 10% = استخدام أعلى 10% من المستخدمين ÷ استخدام كل المستخدمين',
  'Rank the users by their usage, highest first.': 'رتّب المستخدمين حسب استخدامهم، الأعلى أولًا.',
  'Take the top tenth: the number of users × 10%, rounded up, and at least one user.': 'خذ العُشر الأعلى: عدد المستخدمين × 10%، مقرّبًا إلى الأعلى، ومستخدمًا واحدًا على الأقل.',
  'Divide their usage by the usage of all users.': 'اقسم استخدامهم على استخدام كل المستخدمين.',
  'Usage without a username is left out of both parts of the division.': 'يُستبعد الاستخدام الذي ليس له اسم مستخدم من طرفي القسمة.',
  'It follows the filters. With a segment filter, the ranking is among the users who pass it.': 'يتبع عوامل التصفية. مع عامل تصفية للشرائح، يكون الترتيب بين المستخدمين الذين يمرّون منه.',
  'With 200 users the top tenth is 20 users. If they used $6,000 of the $10,000 in total, the share is 60%.':
    'مع 200 مستخدم يكون العُشر الأعلى 20 مستخدمًا. إذا استخدموا $6,000 من إجمالي $10,000، فالحصة 60%.',
  'Top users by usage': 'أعلى المستخدمين استخدامًا',
  'The users with the most usage in the period, each with their group and how much of their own included credits they used.':
    'المستخدمون الأكثر استخدامًا في الفترة، مع مجموعة كل منهم وكم استخدم من أرصدته المشمولة.',
  'Ranked by usage = sum of gross_amount per user, highest first': 'الترتيب حسب الاستخدام = مجموع gross_amount لكل مستخدم، الأعلى أولًا',
  'Add up the gross_amount of each user in the selected period and rank the users.': 'اجمع gross_amount لكل مستخدم في الفترة المحددة ورتّب المستخدمين.',
  "Share of usage = the user's usage ÷ the usage of all users in the view.": 'الحصة من الاستخدام = استخدام المستخدم ÷ استخدام كل المستخدمين في العرض.',
  "Share of included credits = the user's usage ÷ the credits of the user's seat, added up over the months in which a row of the user shows a seat size. A user without a seat size is measured against the most common seat size in the report, once for each month with usage.":
    'الحصة من الأرصدة المشمولة = استخدام المستخدم ÷ أرصدة ترخيصه، مجموعة على الأشهر التي يظهر فيها حجم الترخيص في صف للمستخدم. المستخدم الذي ليس له حجم ترخيص يُقاس مقابل حجم الترخيص الأكثر شيوعًا في التقرير، مرة لكل شهر فيه استخدام.',
  'The list shows as many users as the Top N users setting, and at least 3.': 'تعرض القائمة عددًا من المستخدمين يساوي الإعداد «عدد أعلى المستخدمين»، و3 على الأقل.',
  'The color of a bar is the group of the user. The groups are explained under Who the users are.': 'لون العمود هو مجموعة المستخدم. المجموعات مشروحة تحت «من هم المستخدمون».',
  'A user can be above 100% of their own credits and still cost nothing extra, because included credits are pooled across all seats.':
    'قد يتجاوز المستخدم 100% من أرصدته ولا يكلّف شيئًا إضافيًا، لأن الأرصدة المشمولة مجمّعة في رصيد مشترك لكل التراخيص.',
  'A user with $57 of usage in a month, on a seat that includes $19, has a share of included credits of 300%.':
    'مستخدم استخدامه $57 في الشهر، على ترخيص يشمل $19، حصته من الأرصدة المشمولة 300%.',

  // Segments and classes
  'Who the users are (groups)': 'من هم المستخدمون (المجموعات)',
  'Every user is placed in exactly one group, from how much of their own included credits they use, how often they are active and how long they have been using GitHub Copilot.':
    'يوضع كل مستخدم في مجموعة واحدة فقط، حسب ما يستخدمه من أرصدته المشمولة، وكم مرة يكون نشطًا، ومنذ متى يستخدم GitHub Copilot.',
  'Group = the first rule below that matches the user': 'المجموعة = أول قاعدة أدناه تنطبق على المستخدم',
  'Runaway users: usage is at least 300% of the included credits of the user (the highest spend tier limit).':
    'مستخدمون مفرطون: الاستخدام لا يقل عن 300% من الأرصدة المشمولة للمستخدم (أعلى حد لفئات الاستخدام).',
  'New users: the first usage of the user in the report is within the 14 days up to the end of the period, and at least 14 days after the report begins. A user who appears in the first days of the report may have been there before, so is not counted as new.':
    'مستخدمون جدد: أول استخدام للمستخدم في التقرير يقع خلال آخر 14 يومًا من الفترة، وبعد بداية التقرير بـ 14 يومًا على الأقل. المستخدم الذي يظهر في الأيام الأولى من التقرير ربما كان موجودًا قبل ذلك، فلا يُحسب جديدًا.',
  'Lapsed users: not new, and the last usage was 7 or more days before the end of the period.': 'مستخدمون متوقفون: ليسوا جددًا، وآخر استخدام لهم كان قبل نهاية الفترة بـ 7 أيام أو أكثر.',
  'Champions: active on at least 30% of working days and usage of at least 40% of included credits.': 'الروّاد: نشطون في 30% على الأقل من أيام العمل، واستخدامهم 40% على الأقل من الأرصدة المشمولة.',
  'Burst users: usage of at least 40% of included credits, but active on fewer than 30% of working days.':
    'مستخدمون على دفعات: استخدامهم 40% على الأقل من الأرصدة المشمولة، لكنهم نشطون في أقل من 30% من أيام العمل.',
  'Steady light users: active on at least 30% of working days, with usage below 40% of included credits.':
    'مستخدمون منتظمون باستخدام خفيف: نشطون في 30% على الأقل من أيام العمل، واستخدامهم أقل من 40% من الأرصدة المشمولة.',
  'Dormant or low use: everyone else.': 'خامل أو قليل الاستخدام: كل من تبقى.',
  "Share of included credits = the user's usage ÷ the credits of the seat, added up over the months in which a row of the user shows a seat size. A user without a seat size is measured against the most common seat size in the report, once for each month with usage.":
    'الحصة من الأرصدة المشمولة = استخدام المستخدم ÷ أرصدة الترخيص، مجموعة على الأشهر التي يظهر فيها حجم الترخيص في صف للمستخدم. المستخدم الذي ليس له حجم ترخيص يُقاس مقابل حجم الترخيص الأكثر شيوعًا في التقرير، مرة لكل شهر فيه استخدام.',
  'Active rate = days with usage of at least the active-day threshold ÷ working days (Monday to Friday) from the later of the first day of the user and the start of the period to the end of the period, with a minimum of 5 working days and a ceiling of 100%. Weekend usage counts as an active day.':
    'معدل النشاط = الأيام التي بلغ فيها الاستخدام حد اليوم النشط ÷ أيام العمل (الاثنين إلى الجمعة) من أول يوم للمستخدم أو بداية الفترة، أيهما أبعد، حتى نهاية الفترة، بحد أدنى 5 أيام عمل وحد أعلى 100%. الاستخدام في عطلة نهاية الأسبوع يُحسب يومًا نشطًا.',
  'The numbers in the rules are the defaults. The live values from Settings are listed under Settings that change this number.':
    'الأرقام في القواعد هي القيم الافتراضية. القيم الحالية من الإعدادات مذكورة تحت «الإعدادات التي تغيّر هذا الرقم».',
  'The groups on the Overview count every user who passes the row filters. A segment filter does not change them.':
    'المجموعات في «نظرة عامة» تحسب كل مستخدم يمر من عوامل تصفية الصفوف. عامل تصفية الشرائح لا يغيّرها.',
  'Rows without a username belong to no user.': 'الصفوف التي ليس فيها اسم مستخدم لا تتبع أي مستخدم.',
  'A user with usage of 150% of their included credits who is active on half of the working days is a Champion. If the same user is active on 10% of the working days, the user is a Burst user.':
    'المستخدم الذي استخدامه 150% من أرصدته المشمولة ونشط في نصف أيام العمل من «الروّاد». وإذا كان المستخدم نفسه نشطًا في 10% من أيام العمل فهو من «المستخدمين على دفعات».',

  // Models
  'How much of the usage went to Powerful, Versatile and Lightweight models. Powerful models are meant for hard reasoning and have the highest token prices on the price card.':
    'كم من الاستخدام ذهب إلى النماذج القوية والمتعددة الاستخدامات والخفيفة. النماذج القوية مخصصة للاستدلال الصعب ولها أعلى أسعار للرموز في قائمة الأسعار.',
  'Usage of a tier = sum of gross_amount of the rows whose model belongs to that tier': 'استخدام الفئة = مجموع gross_amount للصفوف التي ينتمي نموذجها إلى تلك الفئة',
  'The tier of a model comes from the price card built into this app. You can change the tier or the rates of a model in Settings, under model pricing.':
    'فئة النموذج تأتي من قائمة الأسعار المضمّنة في هذا التطبيق. يمكنك تغيير فئة النموذج أو أسعاره في الإعدادات، تحت تسعير النماذج.',
  'Models that are not on the price card are Unknown until you give them a tier.': 'النماذج غير الموجودة في قائمة الأسعار تكون «غير معروف» حتى تحدد لها فئة.',
  'Rows that went through Auto count under the model that Auto picked, so "Auto: GPT-5.6 Terra" counts as GPT-5.6 Terra. A row that says only Auto, with no model, counts as Unknown.':
    'صفوف Auto تُحسب تحت النموذج الذي اختاره Auto، فيُحسب "Auto: GPT-5.6 Terra" على GPT-5.6 Terra. والصف الذي فيه Auto فقط بلا نموذج يُحسب «غير معروف».',
  'The tiers overlap a little in price. Lightweight models are always the cheapest per token.': 'تتداخل الفئات قليلًا في السعر. النماذج الخفيفة هي الأرخص دائمًا لكل رمز.',
  'If Powerful models took $4,000 of $10,000 in usage, the Powerful slice is 40% of the donut.': 'إذا أخذت النماذج القوية $4,000 من استخدام قدره $10,000، فشريحة النماذج القوية 40% من الحلقة.',

  // Efficiency and savings
  'Savings potential': 'التوفير المحتمل',
  'How much less GitHub Copilot could cost each month if the default usage levers and all seat actions were applied together. Use it to size the opportunity, not as a forecast of the next invoice.':
    'كم يمكن أن تقل تكلفة GitHub Copilot كل شهر إذا طُبّقت إجراءات الاستخدام الافتراضية وكل إجراءات التراخيص معًا. استخدمه لتقدير حجم الفرصة، لا كتوقّع للفاتورة القادمة.',
  'Savings per month = average over the months of (cost before − cost after the levers and seat actions)':
    'التوفير في الشهر = متوسط (التكلفة قبل − التكلفة بعد الإجراءات وإجراءات التراخيص) على الأشهر',
  'Each usage lever starts from the saving it would give if it were applied to everything it covers, and takes a share of that. The default shares are: right-size models 30%, use Auto model selection 50%, cache discipline 20%, leaner context 10%, avoid long-context surcharges 30% and cap runaway users 50% (of the usage above 3 times the included credits). You can change them in the simulator on the Recommendations page.':
    'يبدأ كل إجراء للاستخدام من التوفير الذي يحققه لو طُبّق على كل ما يشمله، ويأخذ حصة منه. الحصص الافتراضية: اختيار النموذج المناسب 30%، واستخدام Auto لاختيار النموذج 50%، والانضباط في الذاكرة المؤقتة 20%، وسياق أخف 10%، وتجنّب رسوم السياق الطويل 30%، ووضع حد للمستخدمين المفرطين 50% (من الاستخدام الذي يتجاوز 3 أضعاف الأرصدة المشمولة). يمكنك تغييرها في المحاكي في صفحة التوصيات.',
  'The levers are applied one after the other in the order above. Each works on the share of usage that is left after the levers before it, so overlapping ideas are never counted twice.':
    'تُطبَّق الإجراءات واحدًا بعد الآخر بالترتيب أعلاه. يعمل كل إجراء على ما تبقى من الاستخدام بعد الإجراءات التي قبله، فلا تُحسب الأفكار المتداخلة مرتين.',
  'Usage reduction = total saved by the levers ÷ usage in the period.': 'خفض الاستخدام = إجمالي ما توفره الإجراءات ÷ الاستخدام في الفترة.',
  'Seat actions lower the pool: idle seats to reclaim, Enterprise seats to move to Business and roster seats that never appear in the report. Their monthly seat values are added up.':
    'إجراءات التراخيص تخفض الرصيد المشترك: تراخيص خاملة تُسترد، وتراخيص Enterprise تُنقل إلى Business، وتراخيص في القائمة لا تظهر في التقرير أبدًا. تُجمع قيمها الشهرية.',
  'For each month: cost before = max(pool size, usage). Cost after = max(pool size − seat value, usage × (1 − usage reduction)). The month in progress uses its projected usage.':
    'لكل شهر: التكلفة قبل = max(حجم الرصيد المشترك, الاستخدام). التكلفة بعد = max(حجم الرصيد المشترك − قيمة التراخيص, الاستخدام × (1 − خفض الاستخدام)). الشهر الجاري يستخدم استخدامه المتوقع.',
  'Savings per month = the average of cost before − cost after over the months.': 'التوفير في الشهر = متوسط (التكلفة قبل − التكلفة بعد) على الأشهر.',
  'Using less saves cash only while usage is above the pool. While usage is below the pool the seats are already paid for, and only removing seats lowers the cost.':
    'تقليل الاستخدام يوفر نقدًا فقط ما دام الاستخدام أعلى من الرصيد المشترك. وما دام أقل منه فالتراخيص مدفوعة أصلًا، ولا يخفض التكلفة إلا إزالة تراخيص.',
  'Seat actions are left out when a filter is active, because the roster and the pool describe the whole organization, and when the pool size is not known.':
    'تُستبعد إجراءات التراخيص إذا كان عامل تصفية مفعّلًا، لأن قائمة التراخيص والرصيد المشترك يصفان المؤسسة كلها، وكذلك إذا كان حجم الرصيد المشترك غير معروف.',
  'In a filtered view, and for a file without a billing split, the pool cannot be split. The page then shows the usage that would go away each month and says that it is not cash.':
    'في العرض المصفّى، وفي ملف بلا تقسيم للفوترة، لا يمكن تقسيم الرصيد المشترك. تعرض الصفحة حينها الاستخدام الذي سيزول كل شهر وتوضح أنه ليس نقدًا.',
  'The cost model assumes that a seat costs the value of its included credits: $19 for 1,900 credits and $39 for 3,900 credits. Check it against your contract before acting on the dollar figures.':
    'يفترض نموذج التكلفة أن الترخيص يكلّف قيمة أرصدته المشمولة: $19 مقابل 1,900 رصيد و$39 مقابل 3,900 رصيد. تحقّق من ذلك في عقدك قبل اتخاذ قرار بناءً على أرقام الدولار.',
  'The bars under the total show each lever after the levers before it, and seat changes at their monthly seat value. They are not cash, so they do not add up to the total.':
    'تعرض الأعمدة تحت الإجمالي كل إجراء بعد الإجراءات التي قبله، وتغييرات التراخيص بقيمتها الشهرية. إنها ليست نقدًا، فلا يساوي مجموعها الإجمالي.',
  'Pool $9,600 and usage $10,000 give a cost before of $10,000. The levers remove 8% of usage, so usage after is $9,200. Idle seats worth $190 shrink the pool to $9,410. Cost after = max($9,410, $9,200) = $9,410, so the saving is $590 a month.':
    'رصيد مشترك $9,600 واستخدام $10,000 يعطيان تكلفة قبل قدرها $10,000. تزيل الإجراءات 8% من الاستخدام، فيصبح الاستخدام بعدها $9,200. تراخيص خاملة قيمتها $190 تخفض الرصيد المشترك إلى $9,410. التكلفة بعد = max($9,410, $9,200) = $9,410، فالتوفير $590 في الشهر.',

  // Patterns and trends
  'Change against the previous period': 'التغير مقارنة بالفترة السابقة',
  'The arrow under a number shows how it changed against the period of the same length right before the selected one.': 'السهم تحت الرقم يبيّن كيف تغيّر مقارنة بالفترة التي لها الطول نفسه قبل الفترة المحددة مباشرة.',
  'Change = this period ÷ previous period − 1': 'التغير = هذه الفترة ÷ الفترة السابقة − 1',
  'The previous period has as many days as the selected period and ends the day before it starts.': 'للفترة السابقة عدد أيام الفترة المحددة نفسه، وتنتهي في اليوم السابق لبدايتها.',
  'It uses the same filters as the selected period, except for the dates.': 'تستخدم عوامل التصفية نفسها التي للفترة المحددة، ما عدا التواريخ.',
  'The change is shown only when the report covers the whole previous period, and when the previous value is not zero.': 'يظهر التغير فقط إذا غطى التقرير الفترة السابقة كلها، ولم تكن القيمة السابقة صفرًا.',
  'The arrow is green when the change is good news and red when it is bad news. It is grey when the number has no good direction, or when the change is within 0.5% either way. More billed overage is bad news, more active users is good news.':
    'السهم أخضر إذا كان التغير خبرًا جيدًا، وأحمر إذا كان خبرًا سيئًا. ويكون رماديًا إذا لم يكن للرقم اتجاه جيد، أو كان التغير ضمن 0.5% في أي اتجاه. زيادة التجاوز المدفوع خبر سيئ، وزيادة المستخدمين النشطين خبر جيد.',
  'A shorter period gives a noisier change. A period that starts at the first day of the report has no previous period, so no arrow appears.':
    'الفترة الأقصر تعطي تغيرًا أقل ثباتًا. والفترة التي تبدأ في أول يوم من التقرير ليس لها فترة سابقة، فلا يظهر سهم.',
  'Usage of $12,000 in the selected 30 days and $10,000 in the 30 days before: 12,000 ÷ 10,000 − 1 = +20%.': 'استخدام $12,000 في الأيام الثلاثين المحددة و$10,000 في الثلاثين يومًا التي قبلها: 12,000 ÷ 10,000 − 1 = +20%.',
  'Last 7 days vs before': 'آخر 7 أيام مقارنة بما قبلها',
  'How the usage of the last week of the selected period compares with the week before it.': 'كيف يقارَن استخدام آخر أسبوع من الفترة المحددة بالأسبوع الذي قبله.',
  'Change = usage of the last 7 days ÷ usage of the 7 days before − 1': 'التغير = استخدام آخر 7 أيام ÷ استخدام الأيام السبعة التي قبلها − 1',
  'Take the last 7 days of the selected period and add up their gross_amount. Days without usage count as zero.': 'خذ آخر 7 أيام من الفترة المحددة واجمع gross_amount لها. الأيام التي لا استخدام فيها تُحسب صفرًا.',
  'Do the same for the 7 days before them.': 'افعل الشيء نفسه للأيام السبعة التي قبلها.',
  'Divide the first sum by the second and subtract 1.': 'اقسم المجموع الأول على الثاني واطرح 1.',
  'It needs at least 14 days in the period and some usage in the earlier week. Otherwise the page shows a dash.': 'يحتاج إلى 14 يومًا على الأقل في الفترة وبعض الاستخدام في الأسبوع الأسبق. وإلا تعرض الصفحة شرطة.',
  'Any 7 days hold every weekday once, so the two weeks are comparable even though weekends are quiet.': 'أي 7 أيام تحتوي كل يوم من أيام الأسبوع مرة واحدة، لذلك يمكن مقارنة الأسبوعين رغم هدوء عطلة نهاية الأسبوع.',
  'The last 7 days are the end of the selected period, which is not always the end of the report.': 'آخر 7 أيام هي نهاية الفترة المحددة، وهي ليست دائمًا نهاية التقرير.',
  'An increase of more than 25% is shown in a warning color.': 'الزيادة التي تتجاوز 25% تظهر بلون تحذيري.',
  'Usage of $1,500 in the last 7 days against $1,200 in the 7 days before: 1,500 ÷ 1,200 − 1 = +25%.': 'استخدام $1,500 في آخر 7 أيام مقابل $1,200 في الأيام السبعة التي قبلها: 1,500 ÷ 1,200 − 1 = +25%.',
  'Usage over time': 'الاستخدام عبر الزمن',
  'The usage of every day, week or month of the period, split by who pays, by model tier, by vendor or by product.':
    'استخدام كل يوم أو أسبوع أو شهر من الفترة، مقسّمًا حسب من يدفع، أو فئة النموذج، أو المزوّد، أو المنتج.',
  'Bar height = sum of gross_amount of the rows in that day, week or month': 'ارتفاع العمود = مجموع gross_amount للصفوف في ذلك اليوم أو الأسبوع أو الشهر',
  'A day is one calendar day, a week runs from Monday to Sunday and a month is a calendar month. The first and the last bar can be shorter when the period starts or ends inside a week or a month.':
    'اليوم يوم تقويمي واحد، والأسبوع من الاثنين إلى الأحد، والشهر شهر تقويمي. قد يكون العمود الأول والأخير أقصر إذا بدأت الفترة أو انتهت في منتصف أسبوع أو شهر.',
  'Covered vs billed: the covered part is the sum of discount_amount and the billed part is the sum of net_amount.': 'المشمول مقابل المدفوع الإضافي: الجزء المشمول هو مجموع discount_amount والجزء المدفوع الإضافي هو مجموع net_amount.',
  'Model tier, vendor and product: the usage of the rows of each group. The product split shows the six products with the most usage and puts the rest under Other.':
    'فئة النموذج والمزوّد والمنتج: استخدام صفوف كل مجموعة. يعرض التقسيم حسب المنتج المنتجات الستة الأكثر استخدامًا ويضع الباقي تحت «أخرى».',
  'Total: used when the file has no billing split, so usage cannot be divided into covered and billed.': 'الإجمالي: يُستخدم إذا لم يكن في الملف تقسيم للفوترة، فلا يمكن تقسيم الاستخدام إلى مشمول ومدفوع إضافي.',
  'The chart starts with days for periods of up to 120 days and with weeks for longer ones. You can change it.': 'يبدأ الرسم بالأيام للفترات حتى 120 يومًا، وبالأسابيع للفترات الأطول. يمكنك تغيير ذلك.',
  'Clicking a bar narrows the date range to that day, week or month.': 'النقر على عمود يضيّق النطاق الزمني إلى ذلك اليوم أو الأسبوع أو الشهر.',
  'The tier and the vendor of a model come from the price card, or from your changes to it in Settings. Models that are not on the card are Unknown in the tier split, and their vendor is read from the model name.':
    'فئة النموذج ومزوّده يأتيان من قائمة الأسعار، أو من تغييراتك عليها في الإعدادات. النماذج غير الموجودة في القائمة تكون «غير معروف» في التقسيم حسب الفئة، ويُقرأ مزوّدها من اسم النموذج.',
  'A week with $400 covered by included credits and $100 billed on top is a bar of $500, split into $400 and $100.':
    'أسبوع فيه $400 مغطاة من الأرصدة المشمولة و$100 مدفوعة إضافيًا هو عمود قدره $500، مقسّم إلى $400 و$100.',

  // Recommendations
  'Status banner': 'شريط الحالة',
  'The one-line verdict at the top of the Overview. It sums up the recommendations for the current view.': 'الحكم المختصر في سطر واحد أعلى صفحة «نظرة عامة». يلخّص التوصيات للعرض الحالي.',
  'Status = Needs attention when a recommendation is critical or high, Worth watching when one is medium, otherwise Healthy':
    'الحالة = «يحتاج إلى اهتمام» إذا كانت هناك توصية حرجة أو عالية، و«يستحق المتابعة» إذا كانت هناك توصية متوسطة، وإلا «جيد»',
  'The app builds the list of recommendations for the current view. Each has a severity: critical, high, medium, low, info or positive.':
    'يبني التطبيق قائمة التوصيات للعرض الحالي. لكل توصية درجة خطورة: حرجة، عالية، متوسطة، منخفضة، معلومات، أو إيجابية.',
  'Needs attention: at least one critical or high recommendation. The title names the billed overage, when there is some, and the number of high-priority actions.':
    'يحتاج إلى اهتمام: توصية حرجة أو عالية واحدة على الأقل. يذكر العنوان التجاوز المدفوع إذا وُجد، وعدد الإجراءات عالية الأولوية.',
  'Worth watching: no critical or high recommendation, and at least one medium one.': 'يستحق المتابعة: لا توصية حرجة أو عالية، وتوصية متوسطة واحدة على الأقل.',
  'Healthy: none of the above.': 'جيد: لا شيء مما سبق.',
  'The second line gives the pool utilization, which is the included credits used (when the pool size is known), the share of usage that went through Auto (when the file has model names) and the number of active users.':
    'يذكر السطر الثاني استخدام الرصيد المشترك، أي نسبة استخدام الأرصدة المشمولة (إذا كان حجم الرصيد المشترك معروفًا)، وحصة الاستخدام التي مرّت عبر Auto (إذا كان في الملف أسماء النماذج)، وعدد المستخدمين النشطين.',
  'The button counts the recommendations that call for action: every severity except info and positive.': 'يحسب الزر التوصيات التي تتطلب إجراءً: كل درجات الخطورة ما عدا المعلومات والإيجابية.',
  'The banner uses the severity of the recommendations. The list under it, What to do next, shows the actions with the largest monthly value first: the cash saving when there is one, otherwise the usage that would go away.':
    'يستخدم الشريط درجة خطورة التوصيات. والقائمة تحته، «ما الخطوة التالية»، تعرض الإجراءات ذات القيمة الشهرية الأكبر أولًا: التوفير النقدي إن وُجد، وإلا الاستخدام الذي سيزول.',
  'A file that does not say what was billed always shows Worth watching, because overage and pool findings need the billing columns.':
    'الملف الذي لا يذكر ما دُفع إضافيًا يعرض دائمًا «يستحق المتابعة»، لأن نتائج التجاوز والرصيد المشترك تحتاج إلى أعمدة الفوترة.',
  'One recommendation is high and the month has $1,200 of billed overage. The banner says Needs attention, with $1,200 billed overage and 1 high-priority action.':
    'توصية واحدة عالية وفي الشهر تجاوز مدفوع قدره $1,200. يعرض الشريط «يحتاج إلى اهتمام»، مع تجاوز مدفوع قدره $1,200 وإجراء واحد عالي الأولوية.',
};

export default arabic;
