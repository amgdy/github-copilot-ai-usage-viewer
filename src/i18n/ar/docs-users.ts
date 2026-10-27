import type { Dict } from '../core';

/** Arabic for the explanations in `lib/metrics/docs/users.ts` (titles, meanings, formulas, steps, notes and examples). */
const arabic: Dict = {
  // user-tokens
  'The four kinds of tokens of one user: input, cache read, cache write and output. It also shows how the user compares with everyone else on tokens, how much of the prompt came from the cache and how the usage divides over the four kinds.':
    'الأنواع الأربعة لرموز مستخدم واحد: الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها والإخراج. ويبيّن أيضًا كيف يقارَن المستخدم بالجميع في الرموز، وكم من الطلب جاء من الذاكرة المؤقتة، وكيف يتوزع الاستخدام على الأنواع الأربعة.',
  'Total tokens = input + cache read + cache write + output tokens of the user':
    'إجمالي الرموز = رموز الإدخال + القراءة من الذاكرة المؤقتة + الكتابة في الذاكرة المؤقتة + الإخراج للمستخدم',
  'Add up the four token columns of the user for the selected period and filters. Each count shows its share of the tokens of the user.':
    'اجمع أعمدة الرموز الأربعة للمستخدم للفترة وعوامل التصفية المحددة. يُظهر كل عدد حصته من رموز المستخدم.',
  'Total tokens also shows the share of all tokens: the tokens of the user ÷ the tokens of all users in the date range and the row filters.':
    'يُظهر إجمالي الرموز أيضًا الحصة من كل الرموز: رموز المستخدم ÷ رموز كل المستخدمين في النطاق الزمني وعوامل تصفية الصفوف.',
  'Cache hit rate = cache read ÷ (input + cache read + cache write). The line under it gives the typical user, the median of all users who have a rate, when at least two users are in view.':
    'نسبة القراءة من الذاكرة المؤقتة = القراءة من الذاكرة المؤقتة ÷ (الإدخال + القراءة من الذاكرة المؤقتة + الكتابة فيها). يعطي السطر تحتها المستخدم المعتاد، وهو الوسيط لكل المستخدمين الذين لهم نسبة، عندما يكون في العرض مستخدمان على الأقل.',
  'Cost by token type divides the usage of the rows that have token counts over the four token types with the price card. Each bar shows its amount and its share of that usage.':
    'تقسّم التكلفة حسب نوع الرمز استخدام الصفوف التي لها أعداد رموز على أنواع الرموز الأربعة ببطاقة الأسعار. يُظهر كل شريط مبلغه وحصته من ذلك الاستخدام.',
  'The note under the bars says how much of the usage of the user could be priced this way. Usage on rows without token counts, or on a model that is not on the price card, is left out.':
    'تذكر الملاحظة تحت الأشرطة كم من استخدام المستخدم أمكن تسعيره بهذه الطريقة. يُستبعد الاستخدام في الصفوف التي بلا أعداد رموز، أو على نموذج غير موجود في بطاقة الأسعار.',
  'Without token columns the card shows a dash and says so. For a user with no token counts in the date range it says that instead.':
    'من دون أعمدة الرموز تعرض البطاقة شرطة وتذكر ذلك. ولمستخدم بلا أعداد رموز في النطاق الزمني تذكر ذلك بدلًا منه.',
  'A user without prompt tokens has no Cache hit rate, so the card shows a dash and No prompt tokens.':
    'المستخدم الذي بلا رموز طلب ليست له نسبة قراءة من الذاكرة المؤقتة، لذلك تعرض البطاقة شرطة وعبارة «لا رموز طلب».',
  'The cost split is an estimate from the price card. It does not change the usage, it only shows where the usage came from.':
    'تقسيم التكلفة تقدير من بطاقة الأسعار. لا يغيّر الاستخدام، بل يبيّن فقط من أين جاء.',
  'Persona, usage tier and Auto use filters do not change the card.': 'لا تغيّر عوامل تصفية نمط المستخدم ومستوى الاستخدام واستخدام Auto البطاقة.',
  'A user has 600,000 input, 3,000,000 cache read, 400,000 cache write and 500,000 output tokens. Total tokens are 4,500,000, and the cache read share is 3,000,000 ÷ 4,500,000 = 67%. The cache hit rate is 3,000,000 ÷ (600,000 + 3,000,000 + 400,000) = 75%.':
    'لدى مستخدم 600,000 رمز إدخال و3,000,000 رمز قراءة من الذاكرة المؤقتة و400,000 رمز كتابة فيها و500,000 رمز إخراج. إجمالي الرموز 4,500,000، وحصة القراءة من الذاكرة المؤقتة 3,000,000 ÷ 4,500,000 = 67%. ونسبة القراءة من الذاكرة المؤقتة 3,000,000 ÷ (600,000 + 3,000,000 + 400,000) = 75%.',

  // user-auto-vs-direct
  'How one user splits between Auto model selection and models picked by hand, what the Auto discount took off against the original price, and what the hand-picked usage could have earned. The card is highlighted because Auto is the lever that lowers the price of the same work.':
    'كيف يتوزع مستخدم واحد بين اختيار النموذج عبر Auto والنماذج المختارة يدويًا، وما خصمه Auto من السعر الأصلي، وما كان الاستخدام المختار يدويًا سيحصل عليه. البطاقة مميّزة لأن Auto هو الأداة التي تخفض سعر العمل نفسه.',
  'Hand-picked usage = usage − Auto usage. Discount missed = hand-picked usage × Auto discount rate of the plan':
    'الاستخدام المختار يدويًا = الاستخدام − استخدام Auto. الخصم الفائت = الاستخدام المختار يدويًا × معدل خصم Auto للخطة',
  'Auto share of usage = usage of the Auto rows ÷ usage of the user. The Auto usage is the amount in the report, which is already after the Auto discount.':
    'حصة Auto من الاستخدام = استخدام صفوف Auto ÷ استخدام المستخدم. استخدام Auto هو المبلغ الوارد في التقرير، وهو بعد خصم Auto مسبقًا.',
  'Auto discount received = original price of the Auto usage − Auto usage in the report. The original price is measured from the token counts and the price card where possible, and otherwise estimated with the Auto discount rate of the plan. The line under it gives the discount as a share of the original price.':
    'خصم Auto المستلم = السعر الأصلي لاستخدام Auto − استخدام Auto في التقرير. يُقاس السعر الأصلي من أعداد الرموز وبطاقة الأسعار حيث أمكن، وإلا فيُقدَّر بمعدل خصم Auto للخطة. يعطي السطر تحته الخصم كحصة من السعر الأصلي.',
  'Auto discount received = original price of the Auto usage − Auto usage in the report, for the users in view. The line under it gives the discount as a share of the original price. The bar and the first line show the Auto share of usage = Auto usage ÷ all usage in view, and the second line shows the Original price of Auto usage.':
    'خصم Auto المستلم = السعر الأصلي لاستخدام Auto − استخدام Auto في التقرير، للمستخدمين في العرض. يعطي السطر تحته الخصم كحصة من السعر الأصلي. يُظهر الشريط والسطر الأول حصة Auto من الاستخدام = استخدام Auto ÷ كل الاستخدام في العرض، ويُظهر السطر الثاني السعر الأصلي لاستخدام Auto.',
  'Original price of Auto usage is what the same Auto usage would have cost without the discount. The line under it shows the amount in the report.':
    'السعر الأصلي لاستخدام Auto هو ما كان استخدام Auto نفسه سيكلّفه بلا خصم. يُظهر السطر تحته المبلغ الوارد في التقرير.',
  'Hand-picked usage = usage − Auto usage, never below $0. It earns no Auto discount.':
    'الاستخدام المختار يدويًا = الاستخدام − استخدام Auto، ولا يقل أبدًا عن 0 دولار. لا يحصل على خصم Auto.',
  'Discount missed on hand-picked usage = hand-picked usage × the Auto discount rate of the plan of the user. The line under it shows both numbers.':
    'الخصم الفائت على الاستخدام المختار يدويًا = الاستخدام المختار يدويًا × معدل خصم Auto لخطة المستخدم. يُظهر السطر تحته الرقمين كليهما.',
  'Auto discount rate by plan is the rate used for the plan of the user: the rate measured on all users of that plan, or the Auto model discount from Settings when the file has too little measured Auto usage on the plan. The line under it says which.':
    'معدل خصم Auto حسب الخطة هو المعدل المستخدم لخطة المستخدم: المعدل المقيس على كل مستخدمي تلك الخطة، أو خصم نموذج Auto من الإعدادات عندما يكون استخدام Auto المقيس على الخطة في الملف قليلًا جدًا. يذكر السطر تحته أيهما.',
  'Auto use class puts the user in Auto-first, Mixed or Direct models by the Auto share of usage. The note at the bottom says how much of the Auto usage is measured and how much is estimated.':
    'تضع فئة استخدام Auto المستخدم في «يعتمد على Auto» أو «مختلط» أو «نماذج مباشرة» بحسب حصة Auto من الاستخدام. تذكر الملاحظة في الأسفل كم من استخدام Auto مقيس وكم منه مقدّر.',
  'Without a model column the card shows a dash and says so, because Auto usage cannot be told apart from models picked by hand.':
    'من دون عمود النموذج تعرض البطاقة شرطة وتذكر ذلك، لأنه لا يمكن تمييز استخدام Auto عن النماذج المختارة يدويًا.',
  'The discount is never read from the file. The report states Auto usage after the discount and has no discount column.':
    'لا يُقرأ الخصم من الملف أبدًا. يذكر التقرير استخدام Auto بعد الخصم وليس فيه عمود للخصم.',
  'The own discount of the user can differ from the rate of the plan, because the plan rate is measured on all users of the plan. The missed discount uses the plan rate.':
    'قد يختلف خصم المستخدم نفسه عن معدل الخطة، لأن معدل الخطة يُقاس على كل مستخدمي الخطة. ويستخدم الخصم الفائت معدل الخطة.',
  'Discount missed is an upper guide, not money that was lost. Auto picks the model itself and may not suit every task.':
    'الخصم الفائت حد أعلى إرشادي، وليس مالًا ضاع. يختار Auto النموذج بنفسه وقد لا يناسب كل مهمة.',
  'Discount missed is an upper guide, not money that was lost. Auto picks the model itself and may not suit every task. Rows without a username are left out, because they have no seat and no model to pick.':
    'الخصم الفائت حد أعلى إرشادي، وليس مالًا ضاع. يختار Auto النموذج بنفسه وقد لا يناسب كل مهمة. تُستبعد الصفوف التي بلا اسم مستخدم، لأنه ليس لها ترخيص ولا نموذج تختاره.',
  'A user with no usage in the date range gets a message instead of the numbers. Persona, usage tier and Auto use filters do not change the card.':
    'يحصل المستخدم الذي بلا استخدام في النطاق الزمني على رسالة بدل الأرقام. لا تغيّر عوامل تصفية نمط المستخدم ومستوى الاستخدام واستخدام Auto البطاقة.',
  'A user has $200 of usage, $90 of it through Auto, and the plan rate is 10%. The Auto share of usage is 45%. The Auto rows are measured at a discount of 10%, so the original price is 90 ÷ 0.9 = $100 and the discount received is $10. The hand-picked usage is $110 and the missed discount is 110 × 10% = $11.':
    'لدى مستخدم استخدام بقيمة 200 دولار، منها 90 دولارًا عبر Auto، ومعدل الخطة 10%. حصة Auto من الاستخدام 45%. تُقاس صفوف Auto بخصم 10%، لذلك السعر الأصلي 90 ÷ 0.9 = 100 دولار والخصم المستلم 10 دولارات. الاستخدام المختار يدويًا 110 دولارات والخصم الفائت 110 × 10% = 11 دولارًا.',

  // user-hand-picked-usage
  'The part of the usage of a user that went to models the user chose by hand instead of Auto. It earns no Auto discount, so it is the usage where a missed discount is possible.':
    'جزء استخدام المستخدم الذي ذهب إلى نماذج اختارها يدويًا بدل Auto. لا يحصل على خصم Auto، لذلك هو الاستخدام الذي يمكن أن يكون فيه خصم فائت.',
  'Hand-picked usage = usage − Auto usage': 'الاستخدام المختار يدويًا = الاستخدام − استخدام Auto',
  'Usage is the gross_amount of the user in the selected period and filters.': 'الاستخدام هو gross_amount للمستخدم في الفترة وعوامل التصفية المحددة.',
  'Auto usage is the gross_amount of the rows that the report marks as Auto. It is already after the Auto discount.':
    'استخدام Auto هو gross_amount للصفوف التي يميّزها التقرير بأنها Auto. وهو بعد خصم Auto مسبقًا.',
  'Hand-picked usage is the difference, and never below $0. Auto usage + hand-picked usage = usage.':
    'الاستخدام المختار يدويًا هو الفرق، ولا يقل أبدًا عن 0 دولار. استخدام Auto + الاستخدام المختار يدويًا = الاستخدام.',
  'It is a column of the Auto view of the Users table and a figure in the Auto vs direct card of the user. In the card, the line under it gives the share of usage: 1 − Auto share of usage.':
    'هو عمود في عرض Auto في جدول المستخدمين ورقم في بطاقة «Auto مقابل الاختيار المباشر» للمستخدم. في البطاقة، يعطي السطر تحته حصة الاستخدام: 1 − حصة Auto من الاستخدام.',
  'Without a model column Auto usage cannot be told apart, so the column shows a dash.':
    'من دون عمود النموذج لا يمكن تمييز استخدام Auto، لذلك يعرض العمود شرطة.',
  'Discount missed on hand-picked usage is this figure × the Auto discount rate of the plan.':
    'الخصم الفائت على الاستخدام المختار يدويًا هو هذا الرقم × معدل خصم Auto للخطة.',
  'A user has $200 of usage, of which $50 went through Auto. The hand-picked usage is $150, which is 75% of the usage.':
    'لدى مستخدم استخدام بقيمة 200 دولار، منها 50 دولارًا عبر Auto. الاستخدام المختار يدويًا 150 دولارًا، أي 75% من الاستخدام.',

  // user-auto-strip
  'The highlighted card at the top of the Users page. It shows who lets GitHub Copilot pick the model, what Auto saved against the original price, and what the usage on hand-picked models could still save. It also takes you to the users of one Auto use class.':
    'البطاقة المميّزة أعلى صفحة المستخدمين. تبيّن من يترك GitHub Copilot يختار النموذج، وما وفّره Auto مقارنةً بالسعر الأصلي، وما يمكن أن يوفّره بعدُ الاستخدام على النماذج المختارة يدويًا. وتنقلك أيضًا إلى مستخدمي فئة واحدة من فئات استخدام Auto.',
  'Discount missed = sum over the users in view of (usage − Auto usage) × Auto discount rate of the plan of the user':
    'الخصم الفائت = مجموع (الاستخدام − استخدام Auto) × معدل خصم Auto لخطة المستخدم، للمستخدمين في العرض',
  'Users by Auto use class counts the users of each class: Auto-first, Mixed, Direct models and Not enough data. Click a class to show only those users, and click Show all classes to remove the filter. The counts cover all users in the row filters, so they stay the same when you click.':
    'يعدّ «المستخدمون حسب فئة استخدام Auto» مستخدمي كل فئة: «يعتمد على Auto» و«مختلط» و«نماذج مباشرة» و«لا توجد بيانات كافية». انقر فئة لعرض مستخدميها فقط، وانقر «عرض كل الفئات» لإزالة عامل التصفية. تغطي الأعداد كل المستخدمين في عوامل تصفية الصفوف، لذلك تبقى كما هي عند النقر.',
  'Discount missed on hand-picked usage adds up, for each user in view, the hand-picked usage × the Auto discount rate of the plan of that user. It reads About because it is an estimate.':
    'يجمع الخصم الفائت على الاستخدام المختار يدويًا، لكل مستخدم في العرض، الاستخدام المختار يدويًا × معدل خصم Auto لخطة ذلك المستخدم. ويُكتب قبله «نحو» لأنه تقدير.',
  'Users with the most missed discount lists the five users with the largest missed discount.':
    'تسرد «المستخدمون الأكثر خصمًا فائتًا» المستخدمين الخمسة أصحاب أكبر خصم فائت.',
  'The last line gives the Auto discount rate by plan. A plan rate is measured when the plan has enough Auto usage in the file, and otherwise the Auto model discount from Settings is assumed.':
    'يعطي السطر الأخير معدل خصم Auto حسب الخطة. يُقاس معدل الخطة عندما يكون للخطة استخدام Auto كافٍ في الملف، وإلا فيُفترض خصم نموذج Auto من الإعدادات.',
  'The numbers follow the filters of the page, including persona, usage tier and Auto use class. The plan rates are measured on all users in the row filters, not only on the users in view, so a rate does not jump when you filter.':
    'تتبع الأرقام عوامل تصفية الصفحة، بما فيها نمط المستخدم ومستوى الاستخدام وفئة استخدام Auto. تُقاس معدلات الخطط على كل المستخدمين في عوامل تصفية الصفوف، لا على المستخدمين في العرض فقط، لذلك لا يقفز المعدل عند التصفية.',
  'The notes under the figures say how much of the Auto usage is measured from token counts and how much is estimated with the plan rate.':
    'تذكر الملاحظات تحت الأرقام كم من استخدام Auto مقيس من أعداد الرموز وكم منه مقدّر بمعدل الخطة.',
  'The Auto discount lowers usage. It turns into cash only when the pool of included credits runs out.':
    'يخفض خصم Auto الاستخدام. ولا يتحول إلى مال إلا عند نفاد الرصيد المشترك للأرصدة المشمولة.',
  'Without a model column the card says so and shows no numbers.': 'من دون عمود النموذج تذكر البطاقة ذلك ولا تعرض أرقامًا.',
  'Two users are in view and the plan rate is a measured 10%. User A used $90 through Auto and $110 by hand, user B used $50 by hand. The original price of the Auto usage is 90 ÷ 0.9 = $100, so the Auto discount received is $10. The missed discount is 110 × 10% + 50 × 10% = $16.':
    'في العرض مستخدمان ومعدل الخطة المقيس 10%. استخدم المستخدم A مبلغ 90 دولارًا عبر Auto و110 دولارات يدويًا، واستخدم المستخدم B مبلغ 50 دولارًا يدويًا. السعر الأصلي لاستخدام Auto هو 90 ÷ 0.9 = 100 دولار، لذلك خصم Auto المستلم 10 دولارات. والخصم الفائت 110 × 10% + 50 × 10% = 16 دولارًا.',

  // user-missed-list
  'The five users in view whose hand-picked usage would have earned the most Auto discount. It is the shortest list of people to talk to about Auto, and a click on a name opens the user.':
    'المستخدمون الخمسة في العرض الذين كان استخدامهم المختار يدويًا سيحصل على أكبر خصم Auto. إنها أقصر قائمة بأشخاص يُتحدث معهم عن Auto، والنقر على اسم يفتح المستخدم.',
  'Missed discount of a user = (usage − Auto usage) × Auto discount rate of the plan of the user':
    'الخصم الفائت للمستخدم = (الاستخدام − استخدام Auto) × معدل خصم Auto لخطة المستخدم',
  'For every user in view, take the hand-picked usage: the usage minus the Auto usage.':
    'لكل مستخدم في العرض، خذ الاستخدام المختار يدويًا: الاستخدام ناقص استخدام Auto.',
  'Multiply it by the Auto discount rate of the plan of the user. The rate is measured on all users of that plan when the file has enough Auto usage on the plan, and otherwise it is the Auto model discount from Settings.':
    'اضربه في معدل خصم Auto لخطة المستخدم. يُقاس المعدل على كل مستخدمي تلك الخطة عندما يكون في الملف استخدام Auto كافٍ على الخطة، وإلا فهو خصم نموذج Auto من الإعدادات.',
  'Keep the users with a missed discount above $0.005 and order them by that amount, then by hand-picked usage, biggest first. The first five are shown.':
    'أبقِ المستخدمين الذين خصمهم الفائت أكبر من 0.005 دولار ورتّبهم حسب هذا المبلغ، ثم حسب الاستخدام المختار يدويًا، الأكبر أولًا. يُعرض الخمسة الأوائل.',
  'Each card shows the name, the missed discount, the hand-picked usage with the share of usage on Auto, and the Auto use class.':
    'تعرض كل بطاقة الاسم والخصم الفائت والاستخدام المختار يدويًا مع حصة الاستخدام عبر Auto وفئة استخدام Auto.',
  'The note under the cards says whether the list is complete: The 5 users with the most of N who have a missed discount, or All N users with a missed discount.':
    'تذكر الملاحظة تحت البطاقات ما إذا كانت القائمة كاملة: «أكثر 5 مستخدمين خصمًا فائتًا من أصل N لديهم خصم فائت»، أو «كل المستخدمين الـ N الذين لديهم خصم فائت».',
  'The list follows the filters of the page, so a persona, usage tier or Auto use filter changes who is listed.':
    'تتبع القائمة عوامل تصفية الصفحة، لذلك يغيّر عامل تصفية نمط المستخدم أو مستوى الاستخدام أو استخدام Auto من يُدرج فيها.',
  'The amounts are estimates and upper guides. Auto picks the model itself and may not suit every task.':
    'المبالغ تقديرات وحدود عليا إرشادية. يختار Auto النموذج بنفسه وقد لا يناسب كل مهمة.',
  'A user with no hand-picked usage, or on a plan with a measured rate of 0%, has no missed discount and is not listed.':
    'المستخدم الذي بلا استخدام مختار يدويًا، أو على خطة معدلها المقيس 0%، ليس له خصم فائت ولا يُدرج.',
  'An empty list means that nobody in this view has hand-picked usage with a missed discount. Without a model column the list is not shown.':
    'القائمة الفارغة تعني أن لا أحد في هذا العرض لديه استخدام مختار يدويًا مع خصم فائت. من دون عمود النموذج لا تُعرض القائمة.',
  'A user has $120 of hand-picked usage and $30 through Auto on a plan with a rate of 10%. The missed discount is 120 × 10% = $12, and the card reads $120 hand-picked · 20% on Auto, because 30 ÷ 150 = 20%.':
    'لدى مستخدم استخدام مختار يدويًا بقيمة 120 دولارًا و30 دولارًا عبر Auto على خطة معدلها 10%. الخصم الفائت 120 × 10% = 12 دولارًا، وتعرض البطاقة «120 دولارًا مختار يدويًا · 20% عبر Auto»، لأن 30 ÷ 150 = 20%.',

  // user-median-usage
  'Median usage per user per month = middle value of the usage of each user × 30.4375 ÷ days in the period':
    'وسيط الاستخدام لكل مستخدم في الشهر = القيمة الوسطى لاستخدام كل مستخدم × 30.4375 ÷ أيام الفترة',
  'Add up the gross_amount of each user in the selected period and filters.': 'اجمع gross_amount لكل مستخدم في الفترة وعوامل التصفية المحددة.',
  'Order the users by usage and take the one in the middle. With an even number of users, take the average of the two in the middle.':
    'رتّب المستخدمين حسب الاستخدام وخذ الأوسط. وإذا كان عدد المستخدمين زوجيًا، فخذ متوسط الاثنين في الوسط.',
  'Multiply by 30.4375 ÷ the number of days in the period. 30.4375 is the average number of days in a month.':
    'اضرب في 30.4375 ÷ عدد أيام الفترة. 30.4375 هو متوسط عدد أيام الشهر.',
  'Rows without a username are left out.': 'تُستبعد الصفوف التي بلا اسم مستخدم.',
  'It follows every filter of the page, including the persona, usage tier and Auto use filters. The middle is taken among the users who pass them.':
    'يتبع كل عوامل تصفية الصفحة، بما فيها عوامل تصفية نمط المستخدم ومستوى الاستخدام واستخدام Auto. ويؤخذ الأوسط من بين المستخدمين الذين يجتازونها.',
  'It follows every filter of the page, including the persona, usage tier and Auto use filters.':
    'يتبع كل عوامل تصفية الصفحة، بما فيها عوامل تصفية نمط المستخدم ومستوى الاستخدام واستخدام Auto.',
  'It is usage before included credits, so it is not what the middle user pays. Compare it with the credits included in a seat: $19 for Business and $39 for Enterprise.':
    'هو استخدام قبل الأرصدة المشمولة، لذلك ليس ما يدفعه المستخدم الأوسط. قارنه بالأرصدة المشمولة في الترخيص: 19 دولارًا لـ Business و39 دولارًا لـ Enterprise.',
  'Five users used $10, $20, $60, $90 and $400 over 61 days. The middle user used $60. $60 × 30.4375 ÷ 61 is about $30 per month.':
    'استخدم خمسة مستخدمين 10 و20 و60 و90 و400 دولار خلال 61 يومًا. استخدم المستخدم الأوسط 60 دولارًا. و60 × 30.4375 ÷ 61 تساوي نحو 30 دولارًا في الشهر.',

  // user-average-usage
  'The usage of a typical user in an average month, counting every user equally. When it is far above the median, a few heavy users pull it up.':
    'استخدام مستخدم نموذجي في شهر متوسط، مع احتساب كل مستخدم بالتساوي. عندما يفوق الوسيط بكثير، فهذا يعني أن قلة من كثيفي الاستخدام يرفعونه.',
  'Average usage per user per month = usage of the users in view ÷ number of users × 30.4375 ÷ days in the period':
    'متوسط الاستخدام لكل مستخدم في الشهر = استخدام المستخدمين في العرض ÷ عدد المستخدمين × 30.4375 ÷ أيام الفترة',
  'Add up the gross_amount of every user in the selected period and filters, and count the users.':
    'اجمع gross_amount لكل مستخدم في الفترة وعوامل التصفية المحددة، وعُدّ المستخدمين.',
  'Divide the total by the number of users.': 'اقسم المجموع على عدد المستخدمين.',
  'Multiply by 30.4375 ÷ the number of days in the period.': 'اضرب في 30.4375 ÷ عدد أيام الفترة.',
  'The line under the number compares it with the median: average ÷ median.': 'يقارنه السطر تحت الرقم بالوسيط: المتوسط ÷ الوسيط.',
  'Only rows with a username count, so a repository-level product without a username does not raise the average. Per user, per month on the Overview divides all usage of the period by the number of active users, so the two can differ a little when the file has rows without a username.':
    'لا تُحتسب إلا الصفوف التي لها اسم مستخدم، لذلك لا يرفع منتج على مستوى المستودع بلا اسم مستخدم المتوسط. يقسم «لكل مستخدم في الشهر» في صفحة النظرة العامة كل استخدام الفترة على عدد المستخدمين النشطين، لذلك قد يختلف الرقمان قليلًا عندما يحتوي الملف على صفوف بلا اسم مستخدم.',
  'The five users of the median example used $580 in total over 61 days. $580 ÷ 5 = $116, and $116 × 30.4375 ÷ 61 is about $58 per month. That is about 1.9 times the median of $30.':
    'استخدم المستخدمون الخمسة في مثال الوسيط 580 دولارًا إجمالًا خلال 61 يومًا. 580 ÷ 5 = 116 دولارًا، و116 × 30.4375 ÷ 61 تساوي نحو 58 دولارًا في الشهر. أي نحو 1.9 ضعف الوسيط البالغ 30 دولارًا.',

  // user-above-credits
  'How many users used more than the credits included in their own seat. The extra comes out of the shared pool, so it costs money only when the whole pool runs out.':
    'كم مستخدمًا استخدم أكثر من الأرصدة المشمولة في ترخيصه. تُخصم الزيادة من الرصيد المشترك، لذلك لا تكلّف مالًا إلا عند نفاد الرصيد المشترك كله.',
  'Users above 100% = number of users whose usage ÷ included credits of their seat is above 100%':
    'المستخدمون فوق 100% = عدد المستخدمين الذين يزيد استخدامهم ÷ الأرصدة المشمولة في ترخيصهم على 100%',
  'Included credits of a user = total_monthly_quota in dollars, at 1 credit = $0.01. For each month in which the user has usage, the highest quota of the user in that month counts. The months are added up.':
    'الأرصدة المشمولة للمستخدم = total_monthly_quota بالدولار، على أساس رصيد واحد = 0.01 دولار. لكل شهر للمستخدم فيه استخدام، تُحتسب أعلى حصة للمستخدم في ذلك الشهر. ثم تُجمع الأشهر.',
  'A user counts when usage ÷ included credits is above 100%.': 'يُحتسب المستخدم عندما يزيد الاستخدام ÷ الأرصدة المشمولة على 100%.',
  'The line under the number adds up the amount above their own credits: the sum of (usage − included credits) of those users.':
    'يجمع السطر تحت الرقم المبلغ الزائد على أرصدتهم: مجموع (الاستخدام − الأرصدة المشمولة) لهؤلاء المستخدمين.',
  'Only users whose license size is in the file are counted. Without the total_monthly_quota column the number is a dash.':
    'لا يُحتسب إلا المستخدمون الذين حجم ترخيصهم موجود في الملف. من دون عمود total_monthly_quota يكون الرقم شرطة.',
  'A user above 100% is not a cost by itself. Other users usually leave part of their credits unused, and the pool covers the difference.':
    'المستخدم فوق 100% ليس تكلفة بحد ذاته. عادةً يترك مستخدمون آخرون جزءًا من أرصدتهم دون استخدام، ويغطي الرصيد المشترك الفرق.',
  'A user on a seat with $19 of credits who used $57 is at 300% and is $38 above their own credits. A user who used $15 is at 79% and does not count.':
    'مستخدم على ترخيص بأرصدة قيمتها 19 دولارًا استخدم 57 دولارًا يكون عند 300% وفوق أرصدته بـ 38 دولارًا. ومستخدم استخدم 15 دولارًا يكون عند 79% ولا يُحتسب.',

  // user-below-credits
  'How many users left most of the credits of their own seat unused. These seats are worth a check-in: the person may need help to get started, or may not need a seat.':
    'كم مستخدمًا ترك معظم أرصدة ترخيصه دون استخدام. تستحق هذه التراخيص متابعة: قد يحتاج الشخص إلى مساعدة ليبدأ، أو قد لا يحتاج إلى ترخيص.',
  'Users below 20% = number of users whose usage ÷ included credits of their seat is below 20%, not counting new users':
    'المستخدمون دون 20% = عدد المستخدمين الذين يقل استخدامهم ÷ الأرصدة المشمولة في ترخيصهم عن 20%، دون احتساب المستخدمين الجدد',
  'Included credits of a user = total_monthly_quota in dollars, added up over the months in which the user has usage.':
    'الأرصدة المشمولة للمستخدم = total_monthly_quota بالدولار، مجموعةً على الأشهر التي للمستخدم فيها استخدام.',
  'New users are left out, because they have had little time. A user is new when the first usage of the user in the file is within the new user window before the end of the period, and not at the start of the file.':
    'يُستبعد المستخدمون الجدد لأن وقتهم كان قصيرًا. يكون المستخدم جديدًا عندما يقع أول استخدام له في الملف ضمن نافذة المستخدم الجديد قبل نهاية الفترة، لا في بداية الملف.',
  'A user counts when usage ÷ included credits is below 20%.': 'يُحتسب المستخدم عندما يقل الاستخدام ÷ الأرصدة المشمولة عن 20%.',
  'The line under the number divides the count by the number of users who were compared.': 'يقسم السطر تحت الرقم العدد على عدد المستخدمين الذين قورنوا.',
  'The 20% limit is fixed on this page. It is not one of the limits of the usage tiers in Settings.':
    'حد 20% ثابت في هذه الصفحة. وهو ليس من حدود مستويات الاستخدام في الإعدادات.',
  'Only users whose license size is in the file are compared. Without the total_monthly_quota column the number is a dash.':
    'لا يُقارن إلا المستخدمون الذين حجم ترخيصهم موجود في الملف. من دون عمود total_monthly_quota يكون الرقم شرطة.',
  'On a seat with $19 of credits, a user who used $3 is at 16% and counts. A user who used $4 is at 21% and does not.':
    'على ترخيص بأرصدة قيمتها 19 دولارًا، المستخدم الذي استخدم 3 دولارات يكون عند 16% ويُحتسب. والمستخدم الذي استخدم 4 دولارات يكون عند 21% ولا يُحتسب.',

  // user-credits-used
  'Included credits used by a user': 'نسبة استخدام الأرصدة المشمولة لمستخدم',
  'How much of the credits included in the seat of the user were used. Above 100% the user used more than their own seat includes. Below 100% the user leaves credits that others can draw on.':
    'كم استُخدم من الأرصدة المشمولة في ترخيص المستخدم. فوق 100% استخدم المستخدم أكثر مما يشمله ترخيصه. ودون 100% يترك المستخدم أرصدة يمكن للآخرين السحب منها.',
  'Included credits used = usage of the user ÷ included credits of the seat of the user':
    'نسبة استخدام الأرصدة المشمولة = استخدام المستخدم ÷ الأرصدة المشمولة في ترخيص المستخدم',
  'Included credits of a seat = total_monthly_quota in dollars, at 1 credit = $0.01. For each month in which the user has usage, the highest quota of the user in that month counts. The months are added up.':
    'الأرصدة المشمولة في الترخيص = total_monthly_quota بالدولار، على أساس رصيد واحد = 0.01 دولار. لكل شهر للمستخدم فيه استخدام، تُحتسب أعلى حصة للمستخدم في ذلك الشهر. ثم تُجمع الأشهر.',
  'Usage = the gross_amount of the user in the selected period and filters.': 'الاستخدام = gross_amount للمستخدم في الفترة وعوامل التصفية المحددة.',
  'The balance column = included credits − usage. It is negative when the user is above their own credits.':
    'عمود الرصيد المتبقي = الأرصدة المشمولة − الاستخدام. ويكون سالبًا عندما يتجاوز المستخدم أرصدته.',
  'The Plan column names the seat from the included credits: 1,900 credits is Business, 3,900 credits is Enterprise and any other size is shown as Custom with its credits. It shows a dash when the file does not give the license size.':
    'يسمّي عمود الخطة الترخيص بحسب الأرصدة المشمولة: 1,900 رصيد هي Business، و3,900 رصيد هي Enterprise، وأي حجم آخر يُعرض بوصفه «مخصص» مع أرصدته. ويعرض شرطة عندما لا يذكر الملف حجم الترخيص.',
  'Included credits are pooled across all seats. A user above 100% costs extra only when the whole pool runs out, and a user below 100% leaves credits for the pool.':
    'الأرصدة المشمولة مجمّعة على كل التراخيص. لا يكلّف المستخدم فوق 100% مبلغًا إضافيًا إلا عند نفاد الرصيد المشترك كله، ويترك المستخدم دون 100% أرصدة للرصيد المشترك.',
  'The usage tiers are bands of this number: Minimal, Light, Core, Power and Runaway.':
    'مستويات الاستخدام نطاقات لهذا الرقم: ضئيل وخفيف وأساسي ومكثف ومفرط.',
  'A user whose license size is not in the file shows a dash in the table. In the drawer the number is measured against the most common license size in the report (1,900 credits when no user has one) and is marked as assumed.':
    'المستخدم الذي حجم ترخيصه غير موجود في الملف يظهر بشرطة في الجدول. وفي اللوحة الجانبية يُقاس الرقم مقابل حجم الترخيص الأكثر شيوعًا في التقرير (1,900 رصيد إذا لم يكن لأي مستخدم حجم) ويُعلَّم بأنه مفترض.',
  'A Business seat includes 1,900 credits, which is $19. A user with $57 of usage in one month is at 300% and has a balance of −$38.':
    'يشمل ترخيص Business عدد 1,900 رصيد، أي 19 دولارًا. والمستخدم الذي استخدم 57 دولارًا في شهر واحد يكون عند 300% ورصيده المتبقي −38 دولارًا.',

  // user-share
  'Rank and share of usage': 'الترتيب والحصة من الاستخدام',
  'Where the user stands among all users, and how much of all usage the user makes.': 'موقع المستخدم بين كل المستخدمين، وكم من الاستخدام الكلي يقوم به.',
  'Share of usage = usage of the user ÷ usage of all users': 'الحصة من الاستخدام = استخدام المستخدم ÷ استخدام كل المستخدمين',
  'Add up the gross_amount of each user in the selected period and the row filters.': 'اجمع gross_amount لكل مستخدم في الفترة وعوامل تصفية الصفوف المحددة.',
  'Rank = position of the user when the users are ordered by usage, highest first. Users with the same usage are ordered by name.':
    'الترتيب = موضع المستخدم عند ترتيب المستخدمين حسب الاستخدام، الأعلى أولًا. يُرتّب المستخدمون المتساوون في الاستخدام حسب الاسم.',
  'Share of usage = the usage of the user ÷ the usage of all users. The footer of the table adds up the shares of the users in the table.':
    'الحصة من الاستخدام = استخدام المستخدم ÷ استخدام كل المستخدمين. يجمع تذييل الجدول حصص المستخدمين في الجدول.',
  'Rows without a username are left out of both parts of the division.': 'تُستبعد الصفوف التي بلا اسم مستخدم من طرفي القسمة.',
  'Rank and share are worked out among all users who pass the row filters (dates, product, model and so on). A persona, usage tier or Auto use filter hides users from the table but does not change the rank or the share of the others.':
    'يُحسب الترتيب والحصة بين كل المستخدمين الذين يجتازون عوامل تصفية الصفوف (التواريخ والمنتج والنموذج وغيرها). يخفي عامل تصفية نمط المستخدم أو مستوى الاستخدام أو استخدام Auto مستخدمين من الجدول لكنه لا يغيّر ترتيب الآخرين ولا حصتهم.',
  'The Pareto class of a user comes from the running total of these shares.': 'تأتي فئة باريتو للمستخدم من المجموع التراكمي لهذه الحصص.',
  'A user with $300 of usage when all users together used $10,000 has a share of 3%. If 24 users used more, the rank is 25.':
    'المستخدم الذي استخدم 300 دولار بينما استخدم كل المستخدمين معًا 10,000 دولار حصته 3%. وإذا استخدم 24 مستخدمًا أكثر منه، فترتيبه 25.',

  // user-active-days
  'The number of days on which the user really used GitHub Copilot. A day with only a few cents of usage does not count.':
    'عدد الأيام التي استخدم فيها المستخدم GitHub Copilot فعلًا. اليوم الذي فيه بضعة سنتات فقط من الاستخدام لا يُحتسب.',
  'Active days = number of days on which the usage of the user reached the active-day threshold':
    'أيام النشاط = عدد الأيام التي بلغ فيها استخدام المستخدم حد يوم النشاط',
  'Add up the gross_amount of the user for each day of the selected period.': 'اجمع gross_amount للمستخدم لكل يوم من الفترة المحددة.',
  'A day counts when that sum reaches the active-day threshold in Settings.': 'يُحتسب اليوم عندما يبلغ ذلك المجموع حد يوم النشاط في الإعدادات.',
  'Weekend days count as active days when they reach the threshold.': 'تُحتسب أيام عطلة نهاية الأسبوع أيام نشاط عندما تبلغ الحد.',
  'The usage of days below the threshold still counts in the usage of the user.': 'يبقى استخدام الأيام التي دون الحد محسوبًا في استخدام المستخدم.',
  'A user with usage on 12 days, two of them below $0.05, has 10 active days at the default threshold of $0.05.':
    'المستخدم الذي له استخدام في 12 يومًا، اثنان منها دون 0.05 دولار، لديه 10 أيام نشاط عند الحد الافتراضي البالغ 0.05 دولار.',

  // user-active-rate
  'How often the user is active, as a share of the working days since they started. It is the basis of the engagement level.':
    'مدى نشاط المستخدم، كحصة من أيام العمل منذ بدايته. وهو أساس مستوى التفاعل.',
  'Active rate = active days ÷ working days from the start of the window to the end of the period, at most 100%':
    'نسبة أيام النشاط = أيام النشاط ÷ أيام العمل من بداية النافذة حتى نهاية الفترة، بحد أقصى 100%',
  'The window starts at the later of two dates: the first day the user appears anywhere in the file, and the start of the selected period. It ends at the end of the period.':
    'تبدأ النافذة عند التاريخ الأحدث من تاريخين: أول يوم يظهر فيه المستخدم في أي مكان من الملف، وبداية الفترة المحددة. وتنتهي بنهاية الفترة.',
  'Working days = Monday to Friday days in the window, with a minimum of 5.': 'أيام العمل = أيام الاثنين إلى الجمعة في النافذة، بحد أدنى 5.',
  'Active rate = active days ÷ working days, held at 100% at most.': 'نسبة أيام النشاط = أيام النشاط ÷ أيام العمل، بحد أقصى 100%.',
  'Weekend days count as active days but not as working days, so a user who works weekends can reach the 100% limit.':
    'تُحتسب أيام عطلة نهاية الأسبوع أيام نشاط لا أيام عمل، لذلك يمكن للمستخدم الذي يعمل في عطلة نهاية الأسبوع أن يبلغ حد 100%.',
  'The engagement levels Daily, Regular, Occasional and Rare are bands of the active rate. The limits are in Settings.':
    'مستويات التفاعل «يومي» و«منتظم» و«متقطع» و«نادر» نطاقات لنسبة أيام النشاط. والحدود موجودة في الإعدادات.',
  'A user who started 3 weeks ago has 15 working days in the window. With 9 active days the active rate is 9 ÷ 15 = 60%.':
    'المستخدم الذي بدأ قبل 3 أسابيع لديه 15 يوم عمل في النافذة. ومع 9 أيام نشاط تكون نسبة أيام النشاط 9 ÷ 15 = 60%.',

  // user-days-since-last
  'How long ago the user last used GitHub Copilot, counted back from the end of the selected period.':
    'منذ متى استخدم المستخدم GitHub Copilot آخر مرة، محسوبًا رجوعًا من نهاية الفترة المحددة.',
  'Days since last use = last day of the period − last day with a usage row of the user':
    'الأيام منذ آخر استخدام = آخر يوم في الفترة − آخر يوم فيه صف استخدام للمستخدم',
  'It counts the last day with any row of the user in the selected period and filters, even a day with very little usage.':
    'يحتسب آخر يوم فيه أي صف للمستخدم في الفترة وعوامل التصفية المحددة، حتى لو كان الاستخدام في ذلك اليوم قليلًا جدًا.',
  'The group Lapsed users uses this number: the user is not new and the last use was at least the "Lapsed after" number of days back. The groups explain which rule wins when several match.':
    'تستخدم مجموعة «مستخدمون متوقفون» هذا الرقم: المستخدم ليس جديدًا وكان آخر استخدام له قبل عدد أيام «متوقف بعد» على الأقل. وتشرح المجموعات أي قاعدة تُطبَّق عندما تتطابق عدة قواعد.',
  'The period ends on the 30th and the user last had a row on the 25th: 5 days since last use.':
    'تنتهي الفترة في يوم 30 وكان آخر صف للمستخدم في يوم 25: أي 5 أيام منذ آخر استخدام.',

  // user-cost-per-active-day
  'What a day of real use costs for the user, in usage. It tells a heavy daily user apart from someone who rarely uses GitHub Copilot but uses it a lot on those days.':
    'ما يكلّفه يوم استخدام فعلي للمستخدم، بالاستخدام. يميّز المستخدم اليومي الكثيف عمّن نادرًا ما يستخدم GitHub Copilot لكنه يستخدمه كثيرًا في تلك الأيام.',
  'Cost per active day = usage of the user ÷ active days of the user': 'التكلفة لكل يوم نشاط = استخدام المستخدم ÷ أيام نشاط المستخدم',
  'All usage of the user counts in the top of the division, including the usage on days below the active-day threshold.':
    'يُحتسب كل استخدام المستخدم في بسط القسمة، بما فيه الاستخدام في الأيام التي دون حد يوم النشاط.',
  'A user with no active day has no cost per active day, and the number is a dash.': 'المستخدم الذي بلا يوم نشاط ليست له تكلفة لكل يوم نشاط، ويكون الرقم شرطة.',
  'In the drawer the typical user is the median of all users who pass the row filters.':
    'في اللوحة الجانبية، المستخدم المعتاد هو الوسيط لكل المستخدمين الذين يجتازون عوامل تصفية الصفوف.',
  'A user with $90 of usage on 12 active days has a cost per active day of $90 ÷ 12 = $7.50.':
    'المستخدم الذي استخدم 90 دولارًا في 12 يوم نشاط تكون تكلفته لكل يوم نشاط 90 ÷ 12 = 7.50 دولار.',

  // user-change
  'Whether the user is using more or less than a week ago: the usage of the last 7 days of the period compared with the 7 days before.':
    'هل يستخدم المستخدم أكثر أو أقل مما كان قبل أسبوع: استخدام آخر 7 أيام من الفترة مقارنةً بالأيام السبعة التي قبلها.',
  '7-day change = usage of the last 7 days of the period − usage of the 7 days before':
    'التغيّر في 7 أيام = استخدام آخر 7 أيام من الفترة − استخدام الأيام السبعة التي قبلها',
  'Add up the gross_amount of the user over the last 7 days of the selected period, and over the 7 days before them. Days without usage count as zero.':
    'اجمع gross_amount للمستخدم خلال آخر 7 أيام من الفترة المحددة، وخلال الأيام السبعة التي قبلها. تُحتسب الأيام التي بلا استخدام صفرًا.',
  'The column shows the difference in dollars. The tip on the number shows both weeks and the change in percent: last week ÷ week before − 1.':
    'يعرض العمود الفرق بالدولار. ويعرض التلميح على الرقم الأسبوعين والتغيّر بالنسبة المئوية: الأسبوع الأخير ÷ الأسبوع السابق − 1.',
  'It needs a period of at least 14 days. A shorter period shows a dash.': 'يحتاج إلى فترة من 14 يومًا على الأقل. والفترة الأقصر تعرض شرطة.',
  'The percent change is left out of the tip when the week before has no usage.': 'يُحذف التغيّر بالنسبة المئوية من التلميح عندما لا يكون في الأسبوع السابق استخدام.',
  'It is the same comparison as Last 7 days vs before on the Overview, made for one user.':
    'إنها المقارنة نفسها في «آخر 7 أيام مقارنة بما قبلها» في صفحة النظرة العامة، لكن لمستخدم واحد.',
  'A user with $30 in the last 7 days and $20 in the 7 days before has a 7-day change of +$10, which is +50%.':
    'المستخدم الذي استخدم 30 دولارًا في آخر 7 أيام و20 دولارًا في الأيام السبعة التي قبلها يكون تغيّره في 7 أيام +10 دولارات، أي +50%.',

  // user-concentration
  'How unevenly usage is spread over the users. The curve shows how much of all usage the biggest users make together, so you can see at a glance whether a few people drive it.':
    'مدى عدم تساوي توزّع الاستخدام على المستخدمين. يبيّن المنحنى كم من الاستخدام الكلي يقوم به أكبر المستخدمين معًا، لترى بنظرة واحدة هل تقوده قلة من الأشخاص.',
  'Share of usage = usage of the biggest users added up ÷ usage of all users, for every share of users from the biggest down':
    'الحصة من الاستخدام = مجموع استخدام أكبر المستخدمين ÷ استخدام كل المستخدمين، لكل حصة من المستخدمين بدءًا من الأكبر',
  'Add up the gross_amount of each user in the selected period and filters. Order the users from the biggest to the smallest.':
    'اجمع gross_amount لكل مستخدم في الفترة وعوامل التصفية المحددة. رتّب المستخدمين من الأكبر إلى الأصغر.',
  'The curve runs from left to right over the share of users, biggest first, and rises with their combined share of usage. The dashed diagonal is what equal use would look like. The more the curve bows toward the top left, the more a few users drive usage.':
    'يمتد المنحنى من اليسار إلى اليمين على حصة المستخدمين، الأكبر أولًا، ويرتفع مع حصتهم المجمّعة من الاستخدام. يمثل القطر المتقطع شكل الاستخدام المتساوي. كلما انحنى المنحنى أكثر نحو الأعلى يسارًا، دلّ ذلك على أن قلة من المستخدمين تقود الاستخدام.',
  'The headline is for the top 10% of users: the number of users × 10%, rounded up, and at least one user. It follows the same rule as Top 10% of users on the Overview.':
    'الرقم الرئيسي لأعلى 10% من المستخدمين: عدد المستخدمين × 10%، مقرّبًا إلى الأعلى، ومستخدم واحد على الأقل. ويتبع القاعدة نفسها في «أعلى 10% من المستخدمين» في صفحة النظرة العامة.',
  'The classes A, B and C are the Pareto classes, worked out again on the users in view. Class A is the fewest users who reach the first limit (80% of usage by default), class B the next users up to the second limit (95%) and class C the rest. Each class shows its share of usage, its number of users and its share of users.':
    'الفئات A وB وC هي فئات باريتو، محسوبة مجددًا على المستخدمين في العرض. الفئة A هي أقل عدد من المستخدمين يبلغ الحد الأول (80% من الاستخدام افتراضيًا)، والفئة B المستخدمون التالون حتى الحد الثاني (95%)، والفئة C الباقون. تعرض كل فئة حصتها من الاستخدام وعدد مستخدميها وحصتها من المستخدمين.',
  'The Gini coefficient is the gap between the curve and the diagonal, on a scale from 0 to 1. Gini = the sum of (2 × rank − users − 1) × usage of each user ÷ (users × usage of all users), with rank 1 for the smallest user, then × users ÷ (users − 1). Below 0.3 is called low, below 0.5 moderate, below 0.7 high and 0.7 or more very high.':
    'معامل جيني هو الفجوة بين المنحنى والقطر، على مقياس من 0 إلى 1. جيني = مجموع (2 × الترتيب − عدد المستخدمين − 1) × استخدام كل مستخدم ÷ (عدد المستخدمين × استخدام كل المستخدمين)، مع الترتيب 1 لأصغر مستخدم، ثم × عدد المستخدمين ÷ (عدد المستخدمين − 1). ما دون 0.3 يُسمّى منخفضًا، ودون 0.5 متوسطًا، ودون 0.7 مرتفعًا، و0.7 أو أكثر مرتفعًا جدًا.',
  'It follows every filter of the page. With a persona, usage tier or Auto use filter, the curve, the classes and the Gini coefficient are worked out again on the users who pass it. The class can then differ from the Pareto class in the table, which is worked out among all users.':
    'يتبع كل عوامل تصفية الصفحة. مع عامل تصفية نمط المستخدم أو مستوى الاستخدام أو استخدام Auto، يُحسب المنحنى والفئات ومعامل جيني مجددًا على المستخدمين الذين يجتازونه. وقد تختلف الفئة حينها عن فئة باريتو في الجدول، التي تُحسب بين كل المستخدمين.',
  'Users with no usage count as users and sit at the right end of the curve. Users whose usage adds up to less than zero are left out.':
    'يُحتسب المستخدمون الذين بلا استخدام مستخدمين ويقعون في الطرف الأيمن من المنحنى. ويُستبعد المستخدمون الذين مجموع استخدامهم أقل من صفر.',
  'It needs at least two users and some usage. Otherwise the card says there are not enough users.':
    'يحتاج إلى مستخدمَين على الأقل وبعض الاستخدام. وإلا فتذكر البطاقة أنه لا يوجد عدد كافٍ من المستخدمين.',
  'The headline matches Top 10% of users on the Overview, except that users with usage below zero are left out here.':
    'يطابق الرقم الرئيسي «أعلى 10% من المستخدمين» في صفحة النظرة العامة، إلا أن المستخدمين الذين استخدامهم دون الصفر يُستبعدون هنا.',
  'A steep curve shows concentration, not waste. A user who makes a large share of usage may use GitHub Copilot well.':
    'المنحنى الحاد يدل على التركّز لا على الهدر. فالمستخدم الذي يقوم بحصة كبيرة من الاستخدام قد يستخدم GitHub Copilot جيدًا.',
  'Ten users used $500, $200, $120, $60, $40, $25, $20, $15, $10 and $10, which is $1,000 in all. The top 10% is one user, who made 50% of usage. With the default limits, class A is the 3 biggest users (82% of usage), class B the next 4 (14.5%) and class C the last 3 (3.5%).':
    'استخدم عشرة مستخدمين 500 و200 و120 و60 و40 و25 و20 و15 و10 و10 دولارات، أي 1,000 دولار إجمالًا. أعلى 10% هو مستخدم واحد قام بـ 50% من الاستخدام. ومع الحدود الافتراضية، الفئة A هي أكبر 3 مستخدمين (82% من الاستخدام)، والفئة B الأربعة التالون (14.5%)، والفئة C الثلاثة الأخيرون (3.5%).',

  // user-compare
  'Four measures of the user next to the typical user, so you can see what stands out: how much of the usage went through Auto, how well the prompts are cached, what a day of use costs and how often the user is active.':
    'أربعة مقاييس للمستخدم بجانب المستخدم المعتاد، لترى ما يبرز: كم من الاستخدام مرّ عبر Auto، ومدى جودة تخزين الطلبات في الذاكرة المؤقتة، وكم يكلّف يوم الاستخدام، ومدى نشاط المستخدم.',
  'Typical user = middle value (median) of the same measure over all users in the current row filters':
    'المستخدم المعتاد = القيمة الوسطى (الوسيط) للمقياس نفسه على كل المستخدمين في عوامل تصفية الصفوف الحالية',
  'Auto share of usage, Cache hit rate, Cost per active day and Active rate of the user are the numbers of the table. Each has its own explanation.':
    '«حصة Auto من الاستخدام» و«نسبة القراءة من الذاكرة المؤقتة» و«التكلفة لكل يوم نشاط» و«نسبة أيام النشاط» للمستخدم هي أرقام الجدول. ولكل منها شرحه الخاص.',
  'The typical user is the median of each measure over all users who pass the row filters (dates, product, model and so on). A persona, usage tier or Auto use filter does not change it. Users without a value for a measure are skipped for that measure, and Auto share of usage also skips users with no usage.':
    'المستخدم المعتاد هو وسيط كل مقياس على كل المستخدمين الذين يجتازون عوامل تصفية الصفوف (التواريخ والمنتج والنموذج وغيرها). لا يغيّره عامل تصفية نمط المستخدم أو مستوى الاستخدام أو استخدام Auto. يُتخطّى المستخدمون الذين ليست لهم قيمة لمقياس ما في ذلك المقياس، وتتخطّى «حصة Auto من الاستخدام» أيضًا المستخدمين الذين بلا استخدام.',
  'The bar is the user and the dark tick is the typical user. Both are drawn on the same scale.':
    'الشريط هو المستخدم والعلامة الداكنة هي المستخدم المعتاد. ويُرسمان على المقياس نفسه.',
  'The word at the end of each line compares the two. Higher: the user is at least 15% above the typical user. Lower: at least 15% below. Similar: in between. When the typical user is at 0, any value above 0 is higher.':
    'الكلمة في نهاية كل سطر تقارن بينهما. «أعلى»: المستخدم أعلى من المستخدم المعتاد بـ 15% على الأقل. «أقل»: أدنى منه بـ 15% على الأقل. «مشابه»: بين ذلك. وعندما يكون المستخدم المعتاد عند 0، فإن أي قيمة فوق 0 تُعدّ أعلى.',
  'A measure that the file cannot give shows the reason instead of a bar: Auto share of usage needs a model column, Cache hit rate needs the token columns and some prompt tokens for the user, and Cost per active day needs an active day.':
    'المقياس الذي لا يستطيع الملف توفيره يعرض السبب بدل الشريط: «حصة Auto من الاستخدام» تحتاج إلى عمود النموذج، و«نسبة القراءة من الذاكرة المؤقتة» تحتاج إلى أعمدة الرموز وبعض رموز الطلبات للمستخدم، و«التكلفة لكل يوم نشاط» تحتاج إلى يوم نشاط.',
  'With only one user in view there is nothing to compare with, and the section says so.':
    'عندما يكون في العرض مستخدم واحد فقط فلا يوجد ما يُقارن به، ويذكر القسم ذلك.',
  'It is a median, so a few heavy users do not move the typical user.': 'إنه وسيط، لذلك لا يحرّك قلة من المستخدمين الكثيفين المستخدمَ المعتاد.',
  'The line at the top right says how many users the median is taken over.': 'يذكر السطر في الأعلى كم عدد المستخدمين الذين يُحسب عليهم الوسيط.',
  'A user has a cache hit rate of 60% and the typical user has 40%. 60 ÷ 40 = 1.5, which is at least 1.15, so the line says higher. A cost per active day of $4.50 against a typical $5 is 0.9, so the line says similar.':
    'نسبة القراءة من الذاكرة المؤقتة لمستخدم 60% وللمستخدم المعتاد 40%. 60 ÷ 40 = 1.5، وهي 1.15 على الأقل، لذلك يقول السطر «أعلى». وتكلفة لكل يوم نشاط قدرها 4.50 دولار مقابل 5 دولارات للمعتاد تساوي 0.9، لذلك يقول السطر «مشابه».',

  // user-ranking
  'The users in view in order of one measure, as a bar chart. Choose the measure in Rank by, and click a bar to open the user. It is the quickest way to see who is at the top or the bottom of a measure.':
    'المستخدمون في العرض مرتّبين حسب مقياس واحد، في مخطط أشرطة. اختر المقياس في «الترتيب حسب»، وانقر شريطًا لفتح المستخدم. إنها أسرع طريقة لمعرفة من في أعلى المقياس أو أسفله.',
  'User ranking = the users that have a value for the chosen measure, ordered by that value, limited to the top 10, 20 or 50':
    'ترتيب المستخدمين = المستخدمون الذين لهم قيمة للمقياس المختار، مرتّبين حسب تلك القيمة، ومحدودين بأعلى 10 أو 20 أو 50',
  'Rank by offers 17 measures in three groups. Usage and credits: Usage, Billed, Included credits used, Active days, Cost per active day, Potential savings and 7-day change. Tokens: Total tokens, Output tokens, Input tokens, Cache read tokens, Cache write tokens and Cache hit rate. Auto model selection: Auto share of usage, Auto discount received, Original price of Auto usage and Discount missed on hand-picked usage. Each is the number of the table, and the explanation of the chosen one opens from the card.':
    'تقدّم «الترتيب حسب» 17 مقياسًا في ثلاث مجموعات. «الاستخدام والأرصدة»: الاستخدام، ومدفوع إضافي، ونسبة استخدام الأرصدة المشمولة، وأيام النشاط، والتكلفة لكل يوم نشاط، والتوفير المحتمل، والتغيّر في 7 أيام. «الرموز»: إجمالي الرموز، ورموز الإخراج، ورموز الإدخال، ورموز القراءة من الذاكرة المؤقتة، ورموز الكتابة في الذاكرة المؤقتة، ونسبة القراءة من الذاكرة المؤقتة. «اختيار النموذج عبر Auto»: حصة Auto من الاستخدام، وخصم Auto المستلم، والسعر الأصلي لاستخدام Auto، والخصم الفائت على الاستخدام المختار يدويًا. كل منها هو رقم الجدول، ويُفتح شرح المقياس المختار من البطاقة.',
  'Order turns the list around for the measures where both ends matter: Included credits used (Most used, Least used), Active days (Most days, Fewest days), Cost per active day, Cache hit rate and Auto share of usage (Highest first, Lowest first) and 7-day change (Biggest rise, Biggest drop). Cache hit rate and Auto share of usage start with the lowest first, because a low value is what you act on. Every other list starts with the biggest value.':
    'تعكس «الفرز» القائمة للمقاييس التي يهمّ فيها الطرفان: نسبة استخدام الأرصدة المشمولة (الأكثر استخدامًا، الأقل استخدامًا)، وأيام النشاط (أكثر الأيام، أقل الأيام)، والتكلفة لكل يوم نشاط ونسبة القراءة من الذاكرة المؤقتة وحصة Auto من الاستخدام (الأعلى أولًا، الأدنى أولًا)، والتغيّر في 7 أيام (أكبر ارتفاع، أكبر انخفاض). تبدأ نسبة القراءة من الذاكرة المؤقتة وحصة Auto من الاستخدام بالأدنى أولًا، لأن القيمة المنخفضة هي ما تتصرف بناءً عليه. وكل قائمة أخرى تبدأ بالقيمة الأكبر.',
  'Users without a value are left out, and the footnote says how many and why. Measures of money and tokens (Usage, Billed, Cost per active day, Potential savings, all token counts, Auto discount received, Original price of Auto usage and Discount missed on hand-picked usage) leave out users at 0 or below.':
    'يُستبعد المستخدمون الذين بلا قيمة، وتذكر الحاشية عددهم والسبب. وتستبعد مقاييس المال والرموز (الاستخدام، ومدفوع إضافي، والتكلفة لكل يوم نشاط، والتوفير المحتمل، وكل أعداد الرموز، وخصم Auto المستلم، والسعر الأصلي لاستخدام Auto، والخصم الفائت على الاستخدام المختار يدويًا) المستخدمين عند 0 أو أقل.',
  'Included credits used leaves out users whose license size is not in the file, and for Least used also new users. Fewest days leaves out new users.':
    'تستبعد «نسبة استخدام الأرصدة المشمولة» المستخدمين الذين لا يوجد حجم ترخيصهم في الملف، وتستبعد مع «الأقل استخدامًا» المستخدمين الجدد أيضًا. وتستبعد «أقل الأيام» المستخدمين الجدد.',
  'Cache hit rate and Auto share of usage leave out users with less usage than the minimum usage for traits (default $5), because tiny amounts give noisy rates. Cache hit rate also leaves out users without prompt tokens.':
    'تستبعد «نسبة القراءة من الذاكرة المؤقتة» و«حصة Auto من الاستخدام» المستخدمين الذين استخدامهم أقل من أدنى استخدام للسمات (5 دولارات افتراضيًا)، لأن المبالغ الصغيرة جدًا تعطي نسبًا مضطربة. وتستبعد «نسبة القراءة من الذاكرة المؤقتة» أيضًا المستخدمين الذين بلا رموز طلبات.',
  '7-day change needs a period of at least 14 days. It ranks the rise (last 7 days − the 7 days before) or the drop (the 7 days before − last 7 days) in dollars, so users whose usage did not move that way are left out.':
    'يحتاج «التغيّر في 7 أيام» إلى فترة من 14 يومًا على الأقل. ويرتّب الارتفاع (آخر 7 أيام − الأيام السبعة التي قبلها) أو الانخفاض (الأيام السبعة السابقة − آخر 7 أيام) بالدولار، لذلك يُستبعد المستخدمون الذين لم يتحرك استخدامهم في ذلك الاتجاه.',
  'Users with the same value are ordered by usage, biggest first. Color by colors the bars by Persona, Usage tier, Engagement or Usage profile. Usage profile is offered only when the file has a model column. The tip of a bar adds the persona, a second figure of the user and the active days.':
    'يُرتَّب المستخدمون الذين لهم القيمة نفسها حسب الاستخدام، الأكبر أولًا. تلوّن «التلوين حسب» الأشرطة حسب نمط المستخدم أو مستوى الاستخدام أو التفاعل أو ملف الاستخدام. ولا يُعرض «ملف الاستخدام» إلا عندما يكون في الملف عمود للنموذج. ويضيف تلميح الشريط نمط المستخدم ورقمًا ثانيًا للمستخدم وأيام النشاط.',
  'It ranks the users in view, so a persona, usage tier or Auto use filter changes who is in the list.':
    'يرتّب المستخدمين في العرض، لذلك يغيّر عامل تصفية نمط المستخدم أو مستوى الاستخدام أو استخدام Auto من يظهر في القائمة.',
  'A measure that the file cannot give says so instead of drawing a chart: the token measures need the token columns, the Auto measures need a model column and Included credits used needs license sizes.':
    'المقياس الذي لا يستطيع الملف توفيره يذكر ذلك بدل رسم مخطط: مقاييس الرموز تحتاج إلى أعمدة الرموز، ومقاييس Auto تحتاج إلى عمود النموذج، و«نسبة استخدام الأرصدة المشمولة» تحتاج إلى أحجام التراخيص.',
  'Potential savings and Discount missed on hand-picked usage are estimates.': '«التوفير المحتمل» و«الخصم الفائت على الاستخدام المختار يدويًا» تقديرات.',
  'Rows without a username are not users, so they are not ranked.': 'الصفوف التي بلا اسم مستخدم ليست مستخدمين، لذلك لا تُرتَّب.',
  'Rank by Cache hit rate, Lowest first, with a minimum of $5. A user with $120 of usage and a cache hit rate of 12% comes before a user with $90 and 30%. A user with $3 of usage is left out, and the footnote says so.':
    'رتّب حسب «نسبة القراءة من الذاكرة المؤقتة»، «الأدنى أولًا»، بحد أدنى 5 دولارات. المستخدم الذي استخدم 120 دولارًا ونسبة قراءته من الذاكرة المؤقتة 12% يأتي قبل المستخدم الذي استخدم 90 دولارًا ونسبته 30%. ويُستبعد المستخدم الذي استخدم 3 دولارات، وتذكر الحاشية ذلك.',

  // user-usage-scatter
  'One dot per user, so you can see how two measures go together and which users stand out. Choose what the two axes and the dot size show. The dot color is the persona. Click a dot to open the user.':
    'نقطة لكل مستخدم، لترى كيف يرتبط مقياسان وأي المستخدمين يبرزون. اختر ما يعرضه المحوران وحجم النقطة. لون النقطة هو نمط المستخدم. انقر نقطة لفتح المستخدم.',
  'Dot of a user = (value on the horizontal axis, value on the vertical axis), with a size from a third measure':
    'نقطة المستخدم = (القيمة على المحور الأفقي، القيمة على المحور الرأسي)، بحجم من مقياس ثالث',
  'Horizontal axis: Active days, Included credits used, Cache hit rate or Auto share of usage. Each is the number of the table.':
    'المحور الأفقي: أيام النشاط، أو نسبة استخدام الأرصدة المشمولة، أو نسبة القراءة من الذاكرة المؤقتة، أو حصة Auto من الاستخدام. كل منها هو رقم الجدول.',
  'Vertical axis: Usage or Total tokens. The vertical scale is Linear or Log. The log scale spreads out the smaller users and leaves out users with a value of 0.':
    'المحور الرأسي: الاستخدام أو إجمالي الرموز. المقياس الرأسي «خطي» أو «لوغاريتمي». يباعد المقياس اللوغاريتمي بين المستخدمين الأصغر ويستبعد المستخدمين الذين قيمتهم 0.',
  'Dot size: Potential savings, Discount missed on hand-picked usage or Total tokens. The dot grows with the value, and the biggest dot is the user with the most.':
    'حجم النقطة: التوفير المحتمل، أو الخصم الفائت على الاستخدام المختار يدويًا، أو إجمالي الرموز. تكبر النقطة مع القيمة، وأكبر نقطة هي المستخدم صاحب القيمة الأكبر.',
  'A choice that the file cannot support cannot be selected, and the line under the chart gives the reason: Included credits used needs license sizes, tokens need the token columns, and Auto share of usage and the missed discount need a model column.':
    'الخيار الذي لا يدعمه الملف لا يمكن تحديده، ويذكر السطر تحت المخطط السبب: «نسبة استخدام الأرصدة المشمولة» تحتاج إلى أحجام التراخيص، والرموز تحتاج إلى أعمدة الرموز، و«حصة Auto من الاستخدام» والخصم الفائت يحتاجان إلى عمود النموذج.',
  'The chart shows at most 2,000 users, the ones with the most usage. The line under the chart counts the users who are not shown and why.':
    'يعرض المخطط 2,000 مستخدم على الأكثر، وهم أصحاب أكبر استخدام. ويعدّ السطر تحت المخطط المستخدمين غير المعروضين ويذكر السبب.',
  'A user without a value for an axis is not plotted: users without known included credits, without prompt tokens (Cache hit rate) or without usage (Auto share of usage).':
    'المستخدم الذي ليست له قيمة لمحور ما لا يُرسم: المستخدمون الذين أرصدتهم المشمولة غير معروفة، أو الذين بلا رموز طلبات (نسبة القراءة من الذاكرة المؤقتة)، أو الذين بلا استخدام (حصة Auto من الاستخدام).',
  'A dashed line marks 100% on the Included credits used axis. Users to the right of it used more than their own seat includes.':
    'يحدد خط متقطع 100% على محور «نسبة استخدام الأرصدة المشمولة». المستخدمون على يمينه استخدموا أكثر مما يشمله ترخيصهم.',
  'It shows the users in view, so a persona, usage tier or Auto use filter changes the dots.':
    'يعرض المستخدمين في العرض، لذلك يغيّر عامل تصفية نمط المستخدم أو مستوى الاستخدام أو استخدام Auto النقاط.',
  'Horizontal axis Cache hit rate, vertical axis Usage. A user with $400 of usage and a cache hit rate of 20% sits at the left and high up. That is where a better cache habit would save the most.':
    'المحور الأفقي «نسبة القراءة من الذاكرة المؤقتة» والمحور الرأسي «الاستخدام». المستخدم الذي استخدم 400 دولار ونسبة قراءته من الذاكرة المؤقتة 20% يقع في اليسار وفي الأعلى. وهناك تحديدًا توفّر عادة أفضل في الذاكرة المؤقتة أكثر.',

  // user-attention-lists
  'Four short lists of users who are worth a conversation: users over their included credits, users with the most to gain, users whose usage is fading and users who are new. Each list shows five users, and a click on a name opens the user.':
    'أربع قوائم قصيرة لمستخدمين يستحقون محادثة: مستخدمون فوق أرصدتهم المشمولة، ومستخدمون لديهم أكبر فائدة ممكنة، ومستخدمون يتراجع استخدامهم، ومستخدمون جدد. تعرض كل قائمة خمسة مستخدمين، والنقر على اسم يفتح المستخدم.',
  'Each list = the users in view that meet one rule, ordered by that rule, first 5':
    'كل قائمة = المستخدمون في العرض الذين يستوفون قاعدة واحدة، مرتّبين حسب تلك القاعدة، أول 5',
  'Over their included credits: users with a known license size whose usage is above their included credits, so their balance is below zero. The most over come first. A line gives the amount over and the usage as a share of the included credits.':
    '«فوق أرصدتهم المشمولة»: مستخدمون حجم ترخيصهم معروف واستخدامهم أعلى من أرصدتهم المشمولة، فيكون رصيدهم المتبقي دون الصفر. الأكثر تجاوزًا أولًا. ويذكر سطر مقدار التجاوز والاستخدام كحصة من الأرصدة المشمولة.',
  'Most to gain: users with a potential saving above $0, the largest first. A line gives the saving, the lever that holds most of it and the saving as a share of the usage of the user. The saving is an estimate, see Potential savings.':
    '«الأكثر فائدة»: مستخدمون توفيرهم المحتمل أعلى من 0 دولار، الأكبر أولًا. ويذكر سطر التوفير والوسيلة التي تحمل معظمه والتوفير كحصة من استخدام المستخدم. التوفير تقدير، انظر «التوفير المحتمل».',
  'Fading: users whose usage in the last 7 days is half or less of the 7 days before, the biggest drop in dollars first. A line gives the 7-day change and both amounts.':
    '«متراجع»: مستخدمون استخدامهم في آخر 7 أيام نصف استخدام الأيام السبعة التي قبلها أو أقل، أكبر انخفاض بالدولار أولًا. ويذكر سطر التغيّر في 7 أيام والمبلغين.',
  'New and ramping: users who first appear within the New user window at the end of the period, and who did not already use GitHub Copilot at the start of the data, with the most usage first. A line gives the usage, the first day and the number of active days.':
    '«جدد وفي تصاعد»: مستخدمون يظهرون أول مرة ضمن «فترة المستخدم الجديد» في نهاية الفترة، ولم يكونوا يستخدمون GitHub Copilot في بداية البيانات، الأكثر استخدامًا أولًا. ويذكر سطر الاستخدام وأول يوم وعدد أيام النشاط.',
  'The lists follow the filters of the page, so a persona, usage tier or Auto use filter changes who can appear.':
    'تتبع القوائم عوامل تصفية الصفحة، لذلك يغيّر عامل تصفية نمط المستخدم أو مستوى الاستخدام أو استخدام Auto من يمكن أن يظهر.',
  'A user can be in more than one list.': 'يمكن أن يكون المستخدم في أكثر من قائمة.',
  'Over their included credits says nothing about the bill. The included credits are pooled, so the extra usage of one user comes out of the shared pool.':
    '«فوق أرصدتهم المشمولة» لا تقول شيئًا عن الفاتورة. فالأرصدة المشمولة مجمّعة، لذلك يُخصم الاستخدام الزائد لمستخدم من الرصيد المشترك.',
  'Fading needs a period of at least 14 days and an earlier week with at least the Minimum usage for traits. Otherwise the card says so.':
    'تحتاج «متراجع» إلى فترة من 14 يومًا على الأقل وأسبوع سابق فيه «أدنى استخدام للسمات» على الأقل. وإلا فتذكر البطاقة ذلك.',
  'An empty list shows why: no user meets the rule, or the file lacks what the rule needs.':
    'القائمة الفارغة تبيّن السبب: لا يستوفي أي مستخدم القاعدة، أو ينقص الملف ما تحتاجه القاعدة.',
  'A user has $19 of included credits and used $57, so the line reads $38 over and 300% of their included credits. A user with $12 in the last 7 days and $30 in the 7 days before has a 7-day change of 12 ÷ 30 − 1 = −60%, so the user is fading.':
    'لدى مستخدم 19 دولارًا من الأرصدة المشمولة واستخدم 57 دولارًا، فيقول السطر: تجاوز بـ 38 دولارًا و300% من أرصدته المشمولة. والمستخدم الذي استخدم 12 دولارًا في آخر 7 أيام و30 دولارًا في الأيام السبعة التي قبلها يكون تغيّره في 7 أيام 12 ÷ 30 − 1 = −60%، فهو متراجع.',

  // user-table
  'One row for every user in view. The Table view switch picks the columns: General for usage and habits, Tokens for token counts and their cost, and Auto for Auto model selection and the discount. Every column has its own explanation under the table.':
    'صف لكل مستخدم في العرض. يختار مفتاح «عرض الجدول» الأعمدة: «عام» للاستخدام والعادات، و«الرموز» لأعداد الرموز وتكلفتها، و«Auto» لاختيار النموذج عبر Auto والخصم. ولكل عمود شرحه الخاص تحت الجدول.',
  'One row per user = the numbers of that user for the selected period and filters':
    'صف لكل مستخدم = أرقام ذلك المستخدم في الفترة وعوامل التصفية المحددة',
  'General starts with Rank, User, Persona, Usage tier, Usage, Share of usage, Billed, Included credits used, Active days, 7-day change, Potential savings and Traits. Engagement, Usage profile, Pareto class, Plan, Organization, Cost center, Covered, Balance, Active rate, Days since last use, Cost per active day, Auto share of usage, Cache hit rate and Top model wait in the Columns menu.':
    'يبدأ «عام» بالأعمدة: الترتيب، والمستخدم، ونمط المستخدم، ومستوى الاستخدام، والاستخدام، والحصة من الاستخدام، ومدفوع إضافي، ونسبة استخدام الأرصدة المشمولة، وأيام النشاط، والتغيّر في 7 أيام، والتوفير المحتمل، والسمات. أما التفاعل، وملف الاستخدام، وفئة باريتو، والخطة، والمؤسسة، ومركز التكلفة، ومشمول بالخطة، والرصيد المتبقي، ونسبة أيام النشاط، والأيام منذ آخر استخدام، والتكلفة لكل يوم نشاط، وحصة Auto من الاستخدام، ونسبة القراءة من الذاكرة المؤقتة، والنموذج الأول فتنتظر في قائمة «الأعمدة».',
  'Tokens starts with User, Usage, Input tokens, Cache read tokens, Cache write tokens, Output tokens, Total tokens, Cache hit rate, Input cost, Cache read cost, Cache write cost, Output cost and Token coverage. The cost columns are estimates: the usage of the rows that have token counts, divided over the token types with the price card, as in Cost by token type.':
    'يبدأ «الرموز» بالأعمدة: المستخدم، والاستخدام، ورموز الإدخال، ورموز القراءة من الذاكرة المؤقتة، ورموز الكتابة في الذاكرة المؤقتة، ورموز الإخراج، وإجمالي الرموز، ونسبة القراءة من الذاكرة المؤقتة، وتكلفة الإدخال، وتكلفة القراءة من الذاكرة المؤقتة، وتكلفة الكتابة في الذاكرة المؤقتة، وتكلفة الإخراج، وتغطية الرموز. أعمدة التكلفة تقديرات: استخدام الصفوف التي فيها أعداد رموز، موزّعًا على أنواع الرموز ببطاقة الأسعار، كما في «التكلفة حسب نوع الرمز».',
  'Auto starts with User, Plan, Usage, Auto share of usage, Auto discount received, Original price of Auto usage, Hand-picked usage, Discount missed on hand-picked usage and Auto use class. Auto discount rate is in the Columns menu. It is the discount of the user as a share of the original price, and a dash for a user with no Auto usage.':
    'يبدأ «Auto» بالأعمدة: المستخدم، والخطة، والاستخدام، وحصة Auto من الاستخدام، وخصم Auto المستلم، والسعر الأصلي لاستخدام Auto، والاستخدام المختار يدويًا، والخصم الفائت على الاستخدام المختار يدويًا، وفئة استخدام Auto. ويوجد «معدل خصم Auto» في قائمة «الأعمدة». وهو خصم المستخدم كحصة من السعر الأصلي، وشرطة للمستخدم الذي بلا استخدام عبر Auto.',
  'Each view keeps the General columns in the Columns menu, so you can add them. Click a column header to sort. The General, Tokens and Auto views start sorted by Usage, Total tokens and Discount missed on hand-picked usage, biggest first.':
    'يحتفظ كل عرض بأعمدة «عام» في قائمة «الأعمدة»، لتتمكن من إضافتها. انقر عنوان عمود للفرز. تبدأ عروض «عام» و«الرموز» و«Auto» مفروزة حسب الاستخدام وإجمالي الرموز والخصم الفائت على الاستخدام المختار يدويًا، الأكبر أولًا.',
  'The search box finds users by name, organization, cost center, plan, persona, usage tier and top model, and by Auto use class when the file has a model column.':
    'يجد مربع البحث المستخدمين حسب الاسم والمؤسسة ومركز التكلفة والخطة ونمط المستخدم ومستوى الاستخدام والنموذج الأول، وحسب فئة استخدام Auto عندما يكون في الملف عمود للنموذج.',
  'The CSV button saves the visible columns in the current order. Download user table at the top of the page saves every column of all three views for every user in view, and leaves a cell empty where the file has no value.':
    'يحفظ زر CSV الأعمدة الظاهرة بالترتيب الحالي. ويحفظ «تنزيل جدول المستخدمين» أعلى الصفحة كل أعمدة العروض الثلاثة لكل مستخدم في العرض، ويترك الخلية فارغة حيث لا توجد قيمة في الملف.',
  'A dash means the file cannot fill the cell. Hover it for the reason: no token columns, no model names or no billing columns.':
    'الشرطة تعني أن الملف لا يستطيع ملء الخلية. مرّر المؤشر فوقها لمعرفة السبب: لا توجد أعمدة رموز، أو لا توجد أسماء نماذج، أو لا توجد أعمدة فوترة.',
  'The rows are the users in view, so a persona, usage tier or Auto use filter changes who is listed. Rank and Pareto class are worked out among all users in the date range, so they do not change.':
    'الصفوف هي المستخدمون في العرض، لذلك يغيّر عامل تصفية نمط المستخدم أو مستوى الاستخدام أو استخدام Auto من يظهر في القائمة. ويُحسب الترتيب وفئة باريتو بين كل المستخدمين في نطاق التواريخ، لذلك لا يتغيّران.',
  'The Total row at the bottom adds up all filtered users, not only the page you see.':
    'يجمع صف «الإجمالي» في الأسفل كل المستخدمين بعد التصفية، لا الصفحة التي تراها فقط.',
  'The cost columns, the Auto discount columns and Potential savings are estimates. The other columns are reported or calculated from the file.':
    'أعمدة التكلفة وأعمدة خصم Auto و«التوفير المحتمل» تقديرات. أما الأعمدة الأخرى فمُبلَّغ عنها أو محسوبة من الملف.',
  'A user has $120 of usage, $45 of it through Auto, and a plan rate of 10% that is measured. In the Auto view the Auto share of usage is 45 ÷ 120 = 37.5%, the Original price of Auto usage is 45 ÷ 0.9 = $50, the Auto discount received is $5, the Hand-picked usage is $75 and the Discount missed on hand-picked usage is 75 × 10% = $7.50.':
    'لدى مستخدم استخدام بقيمة 120 دولارًا، منها 45 دولارًا عبر Auto، ومعدل خطة مقيس قدره 10%. في عرض «Auto» تكون حصة Auto من الاستخدام 45 ÷ 120 = 37.5%، والسعر الأصلي لاستخدام Auto 45 ÷ 0.9 = 50 دولارًا، وخصم Auto المستلم 5 دولارات، والاستخدام المختار يدويًا 75 دولارًا، والخصم الفائت على الاستخدام المختار يدويًا 75 × 10% = 7.50 دولار.',

  // user-daily-usage
  'The usage of one user on each day of the selected period, as a bar chart. It shows whether the user works steadily, in bursts or on a few days only.':
    'استخدام مستخدم واحد في كل يوم من الفترة المحددة، في مخطط أشرطة. يبيّن هل يعمل المستخدم بانتظام، أو على دفعات، أو في أيام قليلة فقط.',
  'Usage of a day = sum of gross_amount of the user on that day': 'استخدام اليوم = مجموع gross_amount للمستخدم في ذلك اليوم',
  'Take the rows of the user inside the date range and the row filters, and add up gross_amount for each day. A day without rows counts as $0, so the chart has no gaps.':
    'خذ صفوف المستخدم داخل نطاق التواريخ وعوامل تصفية الصفوف، واجمع gross_amount لكل يوم. يُحتسب اليوم الذي بلا صفوف 0 دولار، لذلك لا فجوات في المخطط.',
  'The highest bar is the peak day, drawn in the warning color. When two days tie, the first one is the peak.':
    'أعلى شريط هو يوم الذروة، ويُرسم بلون التحذير. وعندما يتساوى يومان، يكون الأول هو الذروة.',
  'The line next to the title gives the peak day, its usage and its share of the usage of the user in the period: usage of the peak day ÷ usage of the user in the period.':
    'يذكر السطر بجانب العنوان يوم الذروة واستخدامه وحصته من استخدام المستخدم في الفترة: استخدام يوم الذروة ÷ استخدام المستخدم في الفترة.',
  'Hover a bar for the weekday, the date and the usage.': 'مرّر المؤشر فوق شريط لرؤية يوم الأسبوع والتاريخ والاستخدام.',
  'Filters that choose users (persona, usage tier, Auto use class) do not change the chart, so a user opened from a list always shows all their days.':
    'عوامل التصفية التي تختار المستخدمين (نمط المستخدم، مستوى الاستخدام، فئة استخدام Auto) لا تغيّر المخطط، لذلك يعرض المستخدم المفتوح من قائمة كل أيامه دائمًا.',
  'Days below the Active-day threshold are drawn too. They count in the usage but not in Active days.':
    'تُرسم الأيام التي دون «حد يوم النشاط» أيضًا. وتُحتسب في الاستخدام لا في أيام النشاط.',
  'A user with no usage in the period gets a message instead of a chart.': 'المستخدم الذي بلا استخدام في الفترة تظهر له رسالة بدل المخطط.',
  'A user used $10 on Monday and $30 on Tuesday, and nothing on the other days of the period. The peak day is Tuesday with $30, which is 30 ÷ 40 = 75% of the usage.':
    'استخدم مستخدم 10 دولارات يوم الاثنين و30 دولارًا يوم الثلاثاء، ولا شيء في بقية أيام الفترة. يوم الذروة هو الثلاثاء بـ 30 دولارًا، أي 30 ÷ 40 = 75% من الاستخدام.',

  // user-seat-status
  'License status of a user': 'حالة ترخيص المستخدم',
  'Whether the user holds a seat in the license list, and how recently that seat was active. It shows only after you load a license list in Settings.':
    'هل للمستخدم ترخيص في قائمة التراخيص، ومتى كان ذلك الترخيص نشطًا آخر مرة. لا يظهر إلا بعد تحميل قائمة تراخيص في الإعدادات.',
  'License status = No seat when the username is not in the license list, otherwise the activity band of the last activity date of the seat':
    'حالة الترخيص = «لا ترخيص» عندما لا يكون اسم المستخدم في قائمة التراخيص، وإلا فنطاق النشاط لتاريخ آخر نشاط للترخيص',
  'Look up the lower-case username of the user in the license list. When it is not there, the status is No seat.':
    'ابحث عن اسم المستخدم بأحرف صغيرة في قائمة التراخيص. وإن لم يكن موجودًا فالحالة «لا ترخيص».',
  'Otherwise count the days from the last activity date of the seat to the as-of date of the license list. The as-of date is the export date in Settings, or else the newest date in the list.':
    'وإلا فاحسب الأيام من تاريخ آخر نشاط للترخيص إلى تاريخ قائمة التراخيص. وتاريخ القائمة هو تاريخ التصدير في الإعدادات، وإلا فأحدث تاريخ في القائمة.',
  'Under 30 days is Recently active, 30 to 89 days is Fading, and 90 days or more is Inactive.':
    'أقل من 30 يومًا «نشط مؤخرًا»، ومن 30 إلى 89 يومًا «متراجع»، و90 يومًا أو أكثر «غير نشط».',
  'A seat without a last activity date is No recent activity date when the list carries activity data for it, such as a seats API export or an activity report. A blank date may mean the seat is new or activity is older than 90 days. Otherwise, the status is No activity data.':
    'الترخيص الذي بلا تاريخ آخر نشاط تكون حالته «لا يوجد تاريخ نشاط حديث» عندما تحمل القائمة بيانات نشاط له، مثل تصدير من واجهة التراخيص أو تقرير نشاط. وقد يعني التاريخ الفارغ أن الترخيص جديد أو أن النشاط أقدم من 90 يومًا. وإلا فتكون الحالة «لا توجد بيانات نشاط».',
  'The activity dates come from the license list, not from the usage report. A user can have usage in the report and still have a seat that the list shows as inactive, because the two files cover different dates.':
    'تأتي تواريخ النشاط من قائمة التراخيص لا من تقرير الاستخدام. فقد يكون للمستخدم استخدام في التقرير بينما تُظهر القائمة ترخيصه غير نشط، لأن الملفين يغطيان تواريخ مختلفة.',
  'The data does not say why a user has no seat. The seat may have been removed after the usage, may belong to an organization that is not in the license list, or the username may be written differently in the two files.':
    'لا تذكر البيانات لماذا ليس للمستخدم ترخيص. فربما أُزيل الترخيص بعد الاستخدام، أو ربما يتبع مؤسسة ليست في قائمة التراخيص، أو ربما كُتب اسم المستخدم بشكل مختلف في الملفين.',
  'The drawer also shows the plan of the seat, the last activity, the editor or surface of that activity, and a pending cancellation date when the list has them.':
    'تعرض اللوحة الجانبية أيضًا خطة الترخيص، وآخر نشاط، والمحرر أو الواجهة التي جرى فيها ذلك النشاط، وتاريخ الإلغاء المنتظر عندما تتضمنها القائمة.',
  'The license list is dated May 31. A seat last active on May 10 is 21 days old, so it is Recently active. A seat last active on March 15 is 77 days old, so it is Fading.':
    'تاريخ قائمة التراخيص 31 مايو. الترخيص الذي كان آخر نشاط له في 10 مايو مضى عليه 21 يومًا، فهو «نشط مؤخرًا». والترخيص الذي كان آخر نشاط له في 15 مارس مضى عليه 77 يومًا، فهو «متراجع».',

  // user-model-mix
  'Which models one user used, how the usage splits over the model tiers and how much of it went through Auto. The Top model column of the Users table comes from the same numbers.':
    'أي النماذج استخدمها مستخدم واحد، وكيف يتوزع الاستخدام على فئات النماذج، وكم منه مرّ عبر Auto. ويأتي عمود «النموذج الأول» في جدول المستخدمين من الأرقام نفسها.',
  'Share of a model = usage of the user on that model ÷ usage of the user on all models':
    'حصة النموذج = استخدام المستخدم على ذلك النموذج ÷ استخدام المستخدم على كل النماذج',
  'Add up the gross_amount of the user for each model, within the date range and the row filters. A row for Auto counts under the model that Auto picked. A row that says only Auto keeps the name Auto.':
    'اجمع gross_amount للمستخدم لكل نموذج، ضمن نطاق التواريخ وعوامل تصفية الصفوف. يُحتسب صف Auto تحت النموذج الذي اختاره Auto. والصف الذي يذكر Auto فقط يحتفظ باسم Auto.',
  'The bars show the 7 models with the most usage, each with its usage and its share. The other models are added up in one bar, N other models, and hovering it names them.':
    'تعرض الأشرطة أكثر 7 نماذج استخدامًا، كلًا باستخدامه وحصته. وتُجمع النماذج الأخرى في شريط واحد، «N نماذج أخرى»، ويذكر تمرير المؤشر فوقه أسماءها.',
  'Model tier splits the usage of the user into Powerful, Versatile and Lightweight by the tier of each model. Unknown is the rest: models whose tier is not known and rows that say only Auto.':
    'تقسم «فئة النموذج» استخدام المستخدم إلى «قوي» و«متعدد الاستخدامات» و«خفيف» حسب فئة كل نموذج. و«غير معروف» هو الباقي: نماذج فئتها غير معروفة وصفوف تذكر Auto فقط.',
  'Auto or hand-picked splits the usage in two. Auto is the usage of the Auto rows ÷ the usage of the user, and Hand-picked is the rest.':
    'تقسم «Auto أو مختار يدويًا» الاستخدام إلى قسمين. «Auto» هو استخدام صفوف Auto ÷ استخدام المستخدم، و«مختار يدويًا» هو الباقي.',
  'Top model in the Users table is the model with the most usage of the user. Hovering it shows that usage as a share of the usage of the user.':
    '«النموذج الأول» في جدول المستخدمين هو النموذج صاحب أكبر استخدام للمستخدم. ويعرض تمرير المؤشر فوقه ذلك الاستخدام كحصة من استخدام المستخدم.',
  'Without a model column the card shows a dash and says so. The Top model and Auto columns do the same.':
    'من دون عمود للنموذج تعرض البطاقة شرطة وتذكر ذلك. وتفعل أعمدة «النموذج الأول» وAuto الشيء نفسه.',
  'Persona, usage tier and Auto use filters do not change the card, so a user opened from a list always shows all their usage.':
    'عوامل تصفية نمط المستخدم ومستوى الاستخدام واستخدام Auto لا تغيّر البطاقة، لذلك يعرض المستخدم المفتوح من قائمة كل استخدامه دائمًا.',
  'The bars are scaled to the biggest model. The percentage is the share of all usage of the user.':
    'تُقاس الأشرطة نسبةً إلى أكبر نموذج. والنسبة المئوية هي الحصة من كل استخدام المستخدم.',
  'A model can be moved to another tier in Settings, under Model pricing and tiers.':
    'يمكن نقل نموذج إلى فئة أخرى في الإعدادات، تحت «أسعار النماذج وفئاتها».',
  'A user used $60 on Claude Sonnet 4.6, $30 on GPT-5.6 Sol and $10 on Auto rows that picked Claude Sonnet 4.6. Claude Sonnet 4.6 has $70, which is 70% of the usage, and GPT-5.6 Sol has 30%. The model tiers are Versatile 70% and Powerful 30%. Auto is 10% and Hand-picked is 90%.':
    'استخدم مستخدم 60 دولارًا على Claude Sonnet 4.6، و30 دولارًا على GPT-5.6 Sol، و10 دولارات على صفوف Auto اختارت Claude Sonnet 4.6. لـ Claude Sonnet 4.6 مبلغ 70 دولارًا، أي 70% من الاستخدام، ولـ GPT-5.6 Sol نسبة 30%. وفئات النماذج: «متعدد الاستخدامات» 70% و«قوي» 30%. و«Auto» 10% و«مختار يدويًا» 90%.',

  // user-potential
  'How much of the usage of the user could be avoided by changing habits, estimated with the six levers of the savings plan at their default strength.':
    'كم من استخدام المستخدم يمكن تجنّبه بتغيير العادات، مقدّرًا بوسائل خطة التوفير الست بقوتها الافتراضية.',
  'Potential savings = sum of the lever savings of the user, each applied to what the levers before it leave, and at most the usage of the user':
    'التوفير المحتمل = مجموع توفير الوسائل للمستخدم، كل منها مطبّق على ما تتركه الوسائل التي قبلها، وبحد أقصى استخدام المستخدم',
  'Right-size models: 30% of what the usage on Powerful models would save if it ran on a mid-tier model of the same vendor.':
    '«اختيار النموذج المناسب»: 30% مما يوفّره الاستخدام على النماذج القوية لو جرى على نموذج من الفئة المتوسطة من المورّد نفسه.',
  'Use Auto model selection: hand-picked usage × 50% × the Auto discount rate of the plan of the user. It is 0 without a model column.':
    '«استخدام الاختيار التلقائي للنموذج (Auto)»: الاستخدام المختار يدويًا × 50% × معدل خصم Auto لخطة المستخدم. ويساوي 0 من دون عمود للنموذج.',
  'Cache discipline: 20% of the estimated cost of cache write tokens, reduced to the part that would be saved if those tokens were cache reads.':
    '«الاستفادة من الذاكرة المؤقتة»: 20% من التكلفة المقدّرة لرموز الكتابة في الذاكرة المؤقتة، مقتصرةً على الجزء الذي يُوفَّر لو كانت تلك الرموز قراءات من الذاكرة المؤقتة.',
  'Leaner context: 10% of the estimated cost of input, cache read and cache write tokens.':
    '«سياق أخف»: 10% من التكلفة المقدّرة لرموز الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها.',
  'Avoid long-context surcharges: 30% of the long-context premium of the user.':
    '«تجنب رسوم السياق الطويل الإضافية»: 30% من رسوم السياق الطويل الإضافية للمستخدم.',
  'Cap runaway users: 50% of the usage above 3 times the included credits of the user.':
    '«وضع حد للمستخدمين المفرطين»: 50% من الاستخدام الذي يتجاوز 3 أضعاف الأرصدة المشمولة للمستخدم.',
  'The levers are applied in this order. Each one works on what the earlier ones leave: its saving is scaled by (usage left ÷ usage of the user). The savings are added up and cannot be more than the usage.':
    'تُطبَّق الوسائل بهذا الترتيب. كل منها يعمل على ما تتركه السابقة: يُضرب توفيرها في (الاستخدام المتبقي ÷ استخدام المستخدم). ثم تُجمع مبالغ التوفير ولا يمكن أن تتجاوز الاستخدام.',
  'The levers use their default strength. The strengths are estimates of what a team can change, not forecasts.':
    'تستخدم الوسائل قوتها الافتراضية. والقوى تقديرات لما يستطيع الفريق تغييره، لا توقعات.',
  'Levers that need token counts or model names give 0 when the file has none.':
    'الوسائل التي تحتاج إلى أعداد الرموز أو أسماء النماذج تعطي 0 عندما لا يحتوي الملف عليها.',
  'Cap runaway users assumes the most common license size when the file does not list included credits.':
    'تفترض «وضع حد للمستخدمين المفرطين» حجم الترخيص الأكثر شيوعًا عندما لا يذكر الملف الأرصدة المشمولة.',
  'The drawer shows the same total per month, which is the total × 30.4375 ÷ days in the period, and as a share of the usage of the user.':
    'تعرض اللوحة الجانبية الإجمالي نفسه شهريًا، أي الإجمالي × 30.4375 ÷ أيام الفترة، وكحصة من استخدام المستخدم.',
  'A user has $200 of usage. Right-size models would save $20. Use Auto model selection would save $7.50 on its own ($150 of hand-picked usage × 50% × a 10% rate). It works on the $180 that is left, so it counts $7.50 × 180 ÷ 200 = $6.75.':
    'لدى مستخدم استخدام بقيمة 200 دولار. يوفّر «اختيار النموذج المناسب» 20 دولارًا. ويوفّر «استخدام الاختيار التلقائي للنموذج (Auto)» 7.50 دولار بمفرده (150 دولارًا من الاستخدام المختار يدويًا × 50% × معدل 10%). وهو يعمل على 180 دولارًا المتبقية، لذلك يُحتسب 7.50 × 180 ÷ 200 = 6.75 دولار.',
};

export default arabic;
