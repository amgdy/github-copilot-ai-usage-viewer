/** Arabic text for the Models page and the notes on the price card. */
import type { Dict } from '../core';

const arabic: Dict = {
  // Page
  'Which models drive the cost, are they right for the job, and where is a cheaper model good enough?':
    'ما النماذج التي تقود التكلفة؟ هل تناسب العمل المطلوب؟ وأين يكفي نموذج أرخص؟',
  'Without the model column, usage cannot be split by model, model tier or Auto, so this page has nothing to chart. Load the usage report with the model column to see it. The price card below still lists the built-in models and their prices.':
    'من دون عمود النموذج لا يمكن تقسيم الاستخدام حسب النموذج أو فئة النموذج أو Auto، لذلك لا تعرض هذه الصفحة أي رسم. حمّل تقرير الاستخدام مع عمود النموذج لتراها. تظل قائمة الأسعار أدناه تعرض النماذج المضمّنة وأسعارها.',
  'The figures cover only the selected rows. Savings on this page are shown as less usage, not cash, because included credits are shared across the organization and cannot be split by filter.':
    'تشمل الأرقام الصفوف المحددة فقط. تظهر الوفورات في هذه الصفحة على شكل استخدام أقل، لا مبالغ نقدية، لأن الأرصدة المشمولة مشتركة على مستوى المؤسسة ولا يمكن تقسيمها حسب عامل التصفية.',

  // Auto discount by model
  'Auto usage': 'استخدام Auto',
  'Usage that went through Auto and landed on this model, as charged in the report. This is after the Auto discount.':
    'الاستخدام الذي مرّ عبر Auto ووقع على هذا النموذج، كما احتُسب في التقرير. هذا بعد خصم Auto.',
  'Share of the usage of this model that went through Auto.': 'حصة استخدام هذا النموذج التي مرّت عبر Auto.',
  'Measured usage': 'الاستخدام المقيس',
  'The part of the Auto usage that could be priced from token counts and the price card.':
    'جزء استخدام Auto الذي أمكن تسعيره من أعداد الرموز وقائمة الأسعار.',
  'Original price (measured)': 'السعر الأصلي (مقيس)',
  'What the measured usage would have cost at the price card, without the Auto discount.':
    'ما كانت ستكلّفه الكمية المقيسة بأسعار قائمة الأسعار، من دون خصم Auto.',
  Discount: 'الخصم',
  'Original price minus measured usage. A dash means nothing could be measured for this model.':
    'السعر الأصلي مطروحًا منه الاستخدام المقيس. تعني الشَرطة أنه لم يمكن قياس شيء لهذا النموذج.',
  'Discount rate': 'نسبة الخصم',
  'Discount divided by the original price of the measured usage. A dash means nothing could be measured for this model.':
    'الخصم مقسومًا على السعر الأصلي للاستخدام المقيس. تعني الشَرطة أنه لم يمكن قياس شيء لهذا النموذج.',
  'Auto discount by model': 'خصم Auto حسب النموذج',
  'Each model that Auto picked, with its Auto usage set against the same tokens at the original price. Click a row to filter the whole page by that model.':
    'كل نموذج اختاره Auto، مع مقارنة استخدام Auto بالرموز نفسها بالسعر الأصلي. انقر صفًا لتصفية الصفحة كلها حسب ذلك النموذج.',
  'Only usage that could be measured from token counts is compared. Nothing here is estimated, so the discounts can add up to less than Auto discount received.':
    'لا يُقارن إلا الاستخدام الذي أمكن قياسه من أعداد الرموز. لا شيء هنا تقديري، لذلك قد يكون مجموع الخصومات أقل من خصم Auto المستلم.',
  'A dash means nothing was measured, for example because the model has no price on the price card or its rows have no token counts. This table follows the selected rows, including segment filters.':
    'تعني الشَرطة أنه لم يُقس شيء، مثلًا لأن النموذج ليس له سعر في قائمة الأسعار أو لأن صفوفه لا تحتوي على أعداد الرموز. يتبع هذا الجدول الصفوف المحددة، بما فيها عوامل تصفية الشرائح.',

  // Auto discount rate by plan
  'Worked out from {amount} of Auto usage that could be priced from token counts and the price card.':
    'محسوب من {amount} من استخدام Auto أمكن تسعيره من أعداد الرموز وقائمة الأسعار.',
  'Only {amount} of the Auto usage could be measured from token counts. A plan needs at least {min}, so the Auto model discount from Settings ({pct}) is used.':
    'أمكن قياس {amount} فقط من استخدام Auto من أعداد الرموز. تحتاج الخطة إلى {min} على الأقل، لذلك يُستخدم خصم نموذج Auto من الإعدادات ({pct}).',
  'None of the Auto usage on this plan could be measured from token counts, so the Auto model discount from Settings ({pct}) is used.':
    'لم يمكن قياس أي جزء من استخدام Auto في هذه الخطة من أعداد الرموز، لذلك يُستخدم خصم نموذج Auto من الإعدادات ({pct}).',
  'The plan is told apart by the monthly quota of each user in the report.':
    'تُميَّز الخطة بالحصة الشهرية لكل مستخدم في التقرير.',
  'Users of this plan with Auto usage.': 'مستخدمو هذه الخطة الذين لديهم استخدام عبر Auto.',
  'Usage that went through Auto, as charged in the report. This is after the Auto discount.':
    'الاستخدام الذي مرّ عبر Auto، كما احتُسب في التقرير. هذا بعد خصم Auto.',
  'The rate used to estimate the Auto discount of this plan.': 'النسبة المستخدمة لتقدير خصم Auto لهذه الخطة.',
  Basis: 'الأساس',
  'Measured: the rate comes from the report. Assumed: the Auto model discount from Settings is used. Point at the badge to see why.':
    'مقيس: النسبة مأخوذة من التقرير. مفترض: يُستخدم خصم نموذج Auto من الإعدادات. أشر إلى الشارة لترى السبب.',
  'One rate for each plan, used to estimate the Auto discount. A plan with enough Auto usage uses the rate measured in the report. Any other plan uses the rate from Settings.':
    'نسبة واحدة لكل خطة تُستخدم لتقدير خصم Auto. تستخدم الخطة التي لديها استخدام كافٍ عبر Auto النسبة المقيسة في التقرير. وتستخدم أي خطة أخرى النسبة من الإعدادات.',
  'A plan needs at least {min} of measured Auto usage to use its own rate. Any other plan, including one with no Auto usage, uses the Auto model discount from Settings ({pct}).':
    'تحتاج الخطة إلى {min} على الأقل من استخدام Auto المقيس لتستخدم نسبتها الخاصة. وتستخدم أي خطة أخرى، بما فيها الخطة التي لا استخدام لها عبر Auto، خصم نموذج Auto من الإعدادات ({pct}).',
  'Plan discount rates are measured on all users in the current row filters.':
    'تُقاس نسب خصم الخطط على جميع المستخدمين ضمن عوامل تصفية الصفوف الحالية.',
  'This report has no token columns, so nothing can be measured and every plan uses the rate from Settings.':
    'لا يحتوي هذا التقرير على أعمدة الرموز، لذلك لا يمكن قياس شيء وتستخدم كل خطة النسبة من الإعدادات.',
  'No usage went through Auto in the current row filters, so there is no plan rate to measure. Every plan uses the Auto model discount from Settings ({pct}).':
    'لم يمرّ أي استخدام عبر Auto ضمن عوامل تصفية الصفوف الحالية، لذلك لا توجد نسبة خطة لقياسها. تستخدم كل خطة خصم نموذج Auto من الإعدادات ({pct}).',

  // Auto model selection
  'Hand-picked': 'مختار يدويًا',
  'through Auto': 'عبر Auto',
  'No usage in this scope.': 'لا يوجد استخدام في هذا النطاق.',
  'Share of usage that went through Auto and share that was hand-picked': 'حصة الاستخدام التي مرّت عبر Auto والحصة المختارة يدويًا',
  'Click a slice to filter by it': 'انقر شريحة للتصفية حسبها',
  '{pct} of the Auto usage is measured from token counts. For the rest, the discount is estimated with the discount rate of the plan.':
    '{pct} من استخدام Auto مقيس من أعداد الرموز. أما الباقي فيُقدَّر خصمه بنسبة خصم الخطة.',
  '{pct} off an original price of {amount}': 'خصم {pct} من سعر أصلي قدره {amount}',
  'No usage went through Auto in this scope.': 'لم يمرّ أي استخدام عبر Auto في هذا النطاق.',
  "An estimate of the discount the hand-picked usage would have received through Auto. Each person's usage uses the discount rate of their plan.":
    'تقدير للخصم الذي كان الاستخدام المختار يدويًا سيحصل عليه عبر Auto. يُحتسب استخدام كل شخص بنسبة خصم خطته.',
  'No discount is missed at the current plan rates.': 'لا يفوت أي خصم بنسب الخطط الحالية.',
  'Less usage per month if {pct} of it moved to Auto': 'استخدام أقل شهريًا إذا انتقل {pct} منه إلى Auto',
  'Usage, not cash: included credits are shared by the whole organization. Each plan uses the discount rate measured on its own Auto usage. Only a plan with no Auto usage to measure uses the Auto model discount from Settings ({pct}).':
    'استخدام لا مبالغ نقدية: الأرصدة المشمولة مشتركة على مستوى المؤسسة كلها. تستخدم كل خطة نسبة الخصم المقيسة على استخدامها عبر Auto. ولا تستخدم خصم نموذج Auto من الإعدادات ({pct}) إلا الخطة التي لا استخدام لها عبر Auto لقياسه.',
  'Heavy users with the lowest Auto share': 'المستخدمون الأكثر استخدامًا ذوو أدنى حصة Auto',
  'No user has usage that reaches Minimum usage for traits in this scope.':
    'لا يوجد مستخدم يبلغ استخدامه «الحد الأدنى للاستخدام لتحديد السمات» في هذا النطاق.',
  'The biggest user already sends all of their usage through Auto.': 'يرسل المستخدم الأكبر استخدامًا كل استخدامه عبر Auto بالفعل.',
  'The biggest user already sends at least {pct} of their usage through Auto.':
    'يرسل المستخدم الأكبر استخدامًا {pct} على الأقل من استخدامه عبر Auto بالفعل.',
  'Each of the {n} biggest users already sends all of their usage through Auto.':
    'كل واحد من أكبر المستخدمين استخدامًا ({n}) يرسل كل استخدامه عبر Auto بالفعل.',
  'Each of the {n} biggest users already sends at least {pct} of their usage through Auto.':
    'كل واحد من أكبر المستخدمين استخدامًا ({n}) يرسل {pct} على الأقل من استخدامه عبر Auto بالفعل.',
  '{amount} usage · mostly {model}': 'استخدام {amount} · غالبًا {model}',
  '{amount} usage': 'استخدام {amount}',
  'Auto share of {name}': 'حصة Auto لدى {name}',
  'The biggest user by usage sends less than {pct} of their usage through Auto.':
    'يرسل المستخدم الأكبر استخدامًا أقل من {pct} من استخدامه عبر Auto.',
  'Of the {n} biggest users by usage, these send less than {pct} of their usage through Auto, lowest share first.':
    'من بين أكبر المستخدمين استخدامًا ({n})، يرسل هؤلاء أقل من {pct} من استخدامهم عبر Auto، مرتبين من الحصة الأدنى.',
  'Ask whether Auto would fit their routine work.': 'اسألهم إن كان Auto يناسب عملهم الروتيني.',
  'With Auto, GitHub Copilot picks the model for each request instead of the person. The report has no column for the Auto discount, so it is worked out from token counts and the price card.':
    'مع Auto يختار GitHub Copilot النموذج لكل طلب بدلًا من الشخص. لا يحتوي التقرير على عمود لخصم Auto، لذلك يُحسب من أعداد الرموز وقائمة الأسعار.',
  'Estimates here use the discount rate of each plan, shown in the next card.':
    'تستخدم التقديرات هنا نسبة خصم كل خطة، المعروضة في البطاقة التالية.',
  'Open the Recommendations simulator': 'افتح محاكي التوصيات',

  // Model ranking and charts
  'Usage: the amount charged in the report, after the Auto discount': 'الاستخدام: المبلغ المحتسب في التقرير، بعد خصم Auto',
  'Usage per model. Bars are colored by tier. Click a bar to filter by that model.':
    'الاستخدام لكل نموذج. تُلوَّن الأعمدة حسب الفئة. انقر عمودًا للتصفية حسب ذلك النموذج.',
  'Amount billed on top of seats, after included credits': 'المبلغ المدفوع إضافيًا فوق المقاعد، بعد الأرصدة المشمولة',
  'Amount billed on top of seats per model. Bars are colored by tier. Click a bar to filter by that model.':
    'المبلغ المدفوع إضافيًا فوق المقاعد لكل نموذج. تُلوَّن الأعمدة حسب الفئة. انقر عمودًا للتصفية حسب ذلك النموذج.',
  Requests: 'الطلبات',
  'Number of usage lines. One line is not always one prompt.': 'عدد أسطر الاستخدام. السطر الواحد ليس دائمًا طلبًا واحدًا.',
  'Usage lines per model. Bars are colored by tier. Click a bar to filter by that model.':
    'أسطر الاستخدام لكل نموذج. تُلوَّن الأعمدة حسب الفئة. انقر عمودًا للتصفية حسب ذلك النموذج.',
  Credits: 'الأرصدة',
  'AI credits used. One credit is worth $0.01.': 'أرصدة الذكاء الاصطناعي المستخدمة. قيمة الرصيد الواحد 0.01 دولار.',
  'AI credits per model. Bars are colored by tier. Click a bar to filter by that model.':
    'أرصدة الذكاء الاصطناعي لكل نموذج. تُلوَّن الأعمدة حسب الفئة. انقر عمودًا للتصفية حسب ذلك النموذج.',
  '{tier} tier · {vendor} · {pct} of usage': 'الفئة {tier} · {vendor} · {pct} من الاستخدام',
  'Model ranking': 'ترتيب النماذج',
  'Nothing is billed on top of seats in this scope': 'لا يوجد مبلغ مدفوع إضافيًا فوق المقاعد في هذا النطاق',
  'Rank models by': 'ترتيب النماذج حسب',
  '{models} in the table below': '{models} في الجدول أدناه',
  'Powerful models have the highest token prices. Click a tier to filter.':
    'النماذج القوية لها أعلى أسعار للرموز. انقر فئة للتصفية.',
  'Usage by vendor': 'الاستخدام حسب المزوّد',
  'Each vendor sets its own prices. Click a vendor to filter.': 'يحدد كل مزوّد أسعاره. انقر مزوّدًا للتصفية.',

  // KPIs
  'Powerful-tier share': 'حصة الفئة القوية',
  'No Powerful models in use': 'لا توجد نماذج قوية قيد الاستخدام',
  '{amount} on {models}': '{amount} على {models}',
  'Share of usage on Powerful models, the most expensive tier. They suit hard tasks with many steps. Routine tasks rarely need them. Click to filter by this tier.':
    'حصة الاستخدام على النماذج القوية، وهي الفئة الأغلى. تناسب المهام الصعبة ذات الخطوات الكثيرة، ونادرًا ما تحتاجها المهام الروتينية. انقر للتصفية حسب هذه الفئة.',
  '{amount} through Auto': '{amount} عبر Auto',
  'Share of usage where GitHub Copilot picked the model instead of the person. Auto usage gets the Auto discount where the plan has one. Turns amber below {pct}, the "Rarely uses Auto below" limit in Settings. Click to filter by Auto.':
    'حصة الاستخدام التي اختار فيها GitHub Copilot النموذج بدلًا من الشخص. يحصل استخدام Auto على خصم Auto حيثما توفّره الخطة. يتحول اللون إلى الكهرماني دون {pct}، وهو حد «نادرًا ما يستخدم Auto دون» في الإعدادات. انقر للتصفية حسب Auto.',
  '{requests} · {pct} of usage': '{requests} · {pct} من الاستخدام',
  'No extra charges for long prompts found': 'لم يُعثر على رسوم إضافية للطلبات الطويلة',
  'Some models charge a higher rate when one request sends a very long prompt, for example more than 200K or 272K tokens. This is the extra amount paid for those requests, as a cautious estimate. Shorter prompts avoid it.':
    'تفرض بعض النماذج سعرًا أعلى عندما يرسل طلب واحد موجّهًا طويلًا جدًا، مثلًا أكثر من 200 ألف أو 272 ألف رمز. هذا هو المبلغ الإضافي المدفوع لتلك الطلبات، وفق تقدير متحفظ. تتجنبه الموجّهات الأقصر.',
  'Usage on models without a price': 'الاستخدام على نماذج بلا سعر',
  '{pct} of usage on {models}': '{pct} من الاستخدام على {models}',
  'Every model has a price': 'لكل نموذج سعر',
  'Usage on models that are not on the built-in price card and have no price in Settings. They cannot be compared with cheaper models. Add a tier and a price in Settings, under Model pricing and tiers.':
    'الاستخدام على نماذج غير موجودة في قائمة الأسعار المضمّنة وليس لها سعر في الإعدادات. لا يمكن مقارنتها بنماذج أرخص. أضف فئة وسعرًا في الإعدادات، ضمن «أسعار النماذج وفئاتها».',
  'Another {amount} is on usage lines without token counts, so it cannot be priced either.':
    'ويقع {amount} آخر على أسطر استخدام بلا أعداد رموز، لذلك لا يمكن تسعيره أيضًا.',
  'Top model': 'النموذج الأول',
  '{pct} of usage · {amount}': '{pct} من الاستخدام · {amount}',
  'The model with the most usage in this period. Click to filter the whole page by it.':
    'النموذج صاحب أكبر استخدام في هذه الفترة. انقر لتصفية الصفحة كلها حسبه.',
  'Models used': 'النماذج المستخدمة',
  'All usage is on one model': 'كل الاستخدام على نموذج واحد',
  'Usage is split across all of them': 'الاستخدام موزّع عليها كلها',
  'The top 3 carry {pct} of usage': 'تحمل النماذج الثلاثة الأولى {pct} من الاستخدام',
  'Models with at least one usage line in this period. A model and its Auto version count once.':
    'النماذج التي لها سطر استخدام واحد على الأقل في هذه الفترة. يُحتسب النموذج ونسخته عبر Auto مرة واحدة.',
  'No vendor is known for these models': 'لا يُعرف مزوّد لهذه النماذج',
  'All usage is on {vendor}': 'كل الاستخدام على {vendor}',
  '{vendor} leads with {pct}': '{vendor} في الصدارة بنسبة {pct}',
  'The companies that make the models, such as OpenAI, Anthropic and Google. Each vendor sets its own prices. Models with an unknown vendor are not counted.':
    'الشركات التي تصنع النماذج، مثل OpenAI وAnthropic وGoogle. يحدد كل مزوّد أسعاره. لا تُحتسب النماذج ذات المزوّد غير المعروف.',

  // Model table
  'This model has no price on the price card or in Settings, so it cannot be compared. Set a tier and a price in Settings.':
    'ليس لهذا النموذج سعر في قائمة الأسعار أو في الإعدادات، لذلك لا يمكن مقارنته. حدّد فئة وسعرًا في الإعدادات.',
  'No price': 'بلا سعر',
  'Auto picked this model for at least 99.9% of its usage.': 'اختار Auto هذا النموذج في 99.9% على الأقل من استخدامه.',
  Tier: 'الفئة',
  'Powerful, Versatile or Lightweight. Powerful models have the highest token prices.':
    'قوي أو متعدد الاستخدامات أو خفيف. النماذج القوية لها أعلى أسعار للرموز.',
  'People with usage on this model. Usage not tied to a person is not counted.':
    'الأشخاص الذين لديهم استخدام على هذا النموذج. لا يُحتسب الاستخدام غير المرتبط بشخص.',
  'Usage lines in the report. One line is not always one prompt.': 'أسطر الاستخدام في التقرير. السطر الواحد ليس دائمًا طلبًا واحدًا.',
  'The amount charged in the report. Rows that went through Auto are after the Auto discount.':
    'المبلغ المحتسب في التقرير. الصفوف التي مرّت عبر Auto محتسبة بعد خصم Auto.',
  'Share of usage on {model}': 'حصة الاستخدام على {model}',
  'Share of all usage in this scope.': 'الحصة من كل الاستخدام في هذا النطاق.',
  'Amount billed on top of seats, after included credits.': 'المبلغ المدفوع إضافيًا فوق المقاعد، بعد الأرصدة المشمولة.',
  'Credits per request': 'الأرصدة لكل طلب',
  'Average credits per usage line. Higher means heavier requests or a more expensive model.':
    'متوسط الأرصدة لكل سطر استخدام. القيمة الأعلى تعني طلبات أثقل أو نموذجًا أغلى.',
  'Prompt tokens that were not read from the cache.': 'رموز الموجّه التي لم تُقرأ من الذاكرة المؤقتة.',
  'Tokens the model wrote back.': 'الرموز التي كتبها النموذج في الرد.',
  'Text the model has seen before and reads again from the cache at a lower price.':
    'نص رآه النموذج من قبل ويقرؤه مجددًا من الذاكرة المؤقتة بسعر أقل.',
  'Text saved to the cache so later requests can read it at a lower price. Some models charge extra to save it.':
    'نص يُحفظ في الذاكرة المؤقتة لتقرأه الطلبات اللاحقة بسعر أقل. تفرض بعض النماذج رسومًا إضافية لحفظه.',
  'Share of prompt tokens read from the cache. Cache reads cost far less than new input.':
    'حصة رموز الموجّه المقروءة من الذاكرة المؤقتة. القراءة من الذاكرة المؤقتة أرخص بكثير من الإدخال الجديد.',
  'Input price / 1M': 'سعر الإدخال / مليون',
  'Price per 1 million input tokens on the price card. A dash means the model has no price.':
    'السعر لكل مليون رمز إدخال في قائمة الأسعار. تعني الشَرطة أن النموذج بلا سعر.',
  'Output price / 1M': 'سعر الإخراج / مليون',
  'Price per 1 million output tokens on the price card. A dash means the model has no price.':
    'السعر لكل مليون رمز إخراج في قائمة الأسعار. تعني الشَرطة أن النموذج بلا سعر.',
  'Share of the usage on this model where Auto picked it.': 'حصة الاستخدام على هذا النموذج التي اختاره فيها Auto.',
  'Cheaper option': 'الخيار الأرخص',
  'A mid-tier model from the same vendor. Only shown for Powerful models with token data.':
    'نموذج من الفئة المتوسطة من المزوّد نفسه. يظهر للنماذج القوية التي لها بيانات رموز فقط.',
  'Cost on cheaper option': 'التكلفة على الخيار الأرخص',
  "Cost of the same tokens on the cheaper option, as a share of today's cost. 40% means 60% less.":
    'تكلفة الرموز نفسها على الخيار الأرخص كنسبة من التكلفة الحالية. 40% تعني أقل بنسبة 60%.',
  'Top user': 'المستخدم الأول',
  'The person with the most usage on this model, and their share of it.': 'الشخص صاحب أكبر استخدام على هذا النموذج، وحصته منه.',
  'All models': 'كل النماذج',
  'Click a row to filter the whole page by that model. Use Columns to show or hide details.':
    'انقر صفًا لتصفية الصفحة كلها حسب ذلك النموذج. استخدم «الأعمدة» لإظهار التفاصيل أو إخفائها.',
  'This report has no token columns. The token counts and the cache hit rate are not shown, and the cheaper option shows dashes. They need input and output tokens for each request.':
    'لا يحتوي هذا التقرير على أعمدة الرموز. لا تظهر أعداد الرموز ولا نسبة القراءة من الذاكرة المؤقتة، ويعرض الخيار الأرخص شَرطات. تحتاج هذه القيم إلى رموز الإدخال والإخراج لكل طلب.',
  'Search models…': 'ابحث في النماذج…',
  'No models match your search.': 'لا توجد نماذج تطابق بحثك.',

  // Models over time
  'The top 8 models, everything else grouped as Other models': 'أول 8 نماذج، وكل ما عداها مجمّع تحت «نماذج أخرى»',
  'Powerful, Versatile and Lightweight': 'قوي ومتعدد الاستخدامات وخفيف',
  'OpenAI, Anthropic, Google and the others': 'OpenAI وAnthropic وGoogle وغيرها',
  'Usage per day. The top 8 models, the rest grouped. Click a bar to zoom in.':
    'الاستخدام لكل يوم. أول 8 نماذج والباقي مجمّع. انقر عمودًا للتكبير.',
  'Usage per week. The top 8 models, the rest grouped. Click a bar to zoom in.':
    'الاستخدام لكل أسبوع. أول 8 نماذج والباقي مجمّع. انقر عمودًا للتكبير.',
  'Usage per month. The top 8 models, the rest grouped. Click a bar to zoom in.':
    'الاستخدام لكل شهر. أول 8 نماذج والباقي مجمّع. انقر عمودًا للتكبير.',
  'Usage per day. Click a bar to zoom into that period.': 'الاستخدام لكل يوم. انقر عمودًا لتكبير تلك الفترة.',
  'Usage per week. Click a bar to zoom into that period.': 'الاستخدام لكل أسبوع. انقر عمودًا لتكبير تلك الفترة.',
  'Usage per month. Click a bar to zoom into that period.': 'الاستخدام لكل شهر. انقر عمودًا لتكبير تلك الفترة.',
  'Other models': 'نماذج أخرى',
  'Models over time': 'النماذج عبر الزمن',
  'No usage in this period': 'لا يوجد استخدام في هذه الفترة',
  Share: 'الحصة',
  'Share of usage that went through Auto, per period': 'حصة الاستخدام التي مرّت عبر Auto، لكل فترة',
  'Auto and hand-picked': 'Auto والمختار يدويًا',
  'Usage through Auto and on hand-picked models, stacked': 'الاستخدام عبر Auto وعلى النماذج المختارة يدويًا، مكدّسًا',
  'Average {pct}': 'المتوسط {pct}',
  'No usage in this scope went through Auto.': 'لم يمرّ أي استخدام في هذا النطاق عبر Auto.',
  'Auto picked the model for {pct} of usage.': 'اختار Auto النموذج في {pct} من الاستخدام.',
  'The Auto share rose from {first} in the first half of the period to {second} in the second half.':
    'ارتفعت حصة Auto من {first} في النصف الأول من الفترة إلى {second} في النصف الثاني.',
  'The Auto share fell from {first} in the first half of the period to {second} in the second half.':
    'انخفضت حصة Auto من {first} في النصف الأول من الفترة إلى {second} في النصف الثاني.',
  'Auto picked the model for {pct} of usage, and the share stayed steady through the period.':
    'اختار Auto النموذج في {pct} من الاستخدام، وبقيت الحصة ثابتة طوال الفترة.',
  'Auto and hand-picked usage over time': 'استخدام Auto والمختار يدويًا عبر الزمن',
  'Auto picks the model for each request. Hand-picked means a person chose the model. Click a point or a bar to zoom in.':
    'يختار Auto النموذج لكل طلب. «مختار يدويًا» يعني أن شخصًا اختار النموذج. انقر نقطة أو عمودًا للتكبير.',
  'Auto chart view': 'عرض مخطط Auto',

  // Price card
  'In my data': 'في بياناتي',
  'Promo price': 'سعر ترويجي',
  'This model has usage in the current view.': 'لهذا النموذج استخدام في العرض الحالي.',
  'In use': 'قيد الاستخدام',
  'Input / 1M': 'الإدخال / مليون',
  'Price per 1 million input tokens on the price card.': 'السعر لكل مليون رمز إدخال في قائمة الأسعار.',
  'Cache read / 1M': 'القراءة من الذاكرة المؤقتة / مليون',
  'Price per 1 million cache read tokens on the price card. Cache read tokens are text the model has seen before and reads again at a lower price.':
    'السعر لكل مليون من رموز القراءة من الذاكرة المؤقتة في قائمة الأسعار. رموز القراءة من الذاكرة المؤقتة نص رآه النموذج من قبل ويقرؤه مجددًا بسعر أقل.',
  'Cache write / 1M': 'الكتابة في الذاكرة المؤقتة / مليون',
  'Price per 1 million cache write tokens on the price card. Cache write tokens are text saved to the cache for later requests. A dash means no separate charge.':
    'السعر لكل مليون من رموز الكتابة في الذاكرة المؤقتة في قائمة الأسعار. رموز الكتابة في الذاكرة المؤقتة نص يُحفظ للطلبات اللاحقة. تعني الشَرطة عدم وجود رسوم منفصلة.',
  'Output / 1M': 'الإخراج / مليون',
  'Price per 1 million output tokens on the price card.': 'السعر لكل مليون رمز إخراج في قائمة الأسعار.',
  'Long prompts': 'الموجّهات الطويلة',
  'Above {threshold}: {input} in, {output} out': 'فوق {threshold}: {input} للإدخال، {output} للإخراج',
  'Some models charge higher prices when a single prompt is longer than a set number of tokens.':
    'تفرض بعض النماذج أسعارًا أعلى عندما يتجاوز موجّه واحد عددًا محددًا من الرموز.',
  'In your data': 'في بياناتك',
  'Usage on this model in the current view, as charged in the report.': 'الاستخدام على هذا النموذج في العرض الحالي، كما احتُسب في التقرير.',
  'Price card': 'قائمة الأسعار',
  'GitHub prices in US dollars per 1 million tokens. Models you use are highlighted.':
    'أسعار GitHub بالدولار الأمريكي لكل مليون رمز. النماذج التي تستخدمها مميّزة.',
  'GitHub prices in US dollars per 1 million tokens.': 'أسعار GitHub بالدولار الأمريكي لكل مليون رمز.',
  'Prices may change. Prices you change under Model pricing and tiers in Settings are not shown here.':
    'قد تتغير الأسعار. لا تظهر هنا الأسعار التي تغيّرها ضمن «أسعار النماذج وفئاتها» في الإعدادات.',
  'Search the price card…': 'ابحث في قائمة الأسعار…',
  'None of the models in your data are on the price card.': 'لا يوجد أي من نماذج بياناتك في قائمة الأسعار.',
  'Models to show': 'النماذج المعروضة',
  Preview: 'معاينة',
  'Promotional price until 2026-12-31': 'سعر ترويجي حتى 2026-12-31',
  'Promotional price until 2026-12-01': 'سعر ترويجي حتى 2026-12-01',

  // Right-sizing
  'These figures show less usage, not cash': 'تُظهر هذه الأرقام استخدامًا أقل، لا مبالغ نقدية',
  'Included credits are shared across the organization, so this view cannot say what the bill would do. Open the Recommendations simulator for cash figures.':
    'الأرصدة المشمولة مشتركة على مستوى المؤسسة، لذلك لا يستطيع هذا العرض أن يحدد ما سيحدث للفاتورة. افتح محاكي التوصيات للحصول على أرقام نقدية.',
  'About {amount} less on the bill each month': 'نحو {amount} أقل في الفاتورة كل شهر',
  'That is for a {pct} shift, using the same rules for included credits as the Recommendations simulator. Test the cheaper models on real work first.':
    'هذا عند تحويل {pct}، بالقواعد نفسها للأرصدة المشمولة التي يستخدمها محاكي التوصيات. اختبر النماذج الأرخص على عمل حقيقي أولًا.',
  'Less usage, but no change to the bill today': 'استخدام أقل، لكن من دون تغيير في الفاتورة حاليًا',
  'Under $1 a month would come off the bill.': 'سينخفض من الفاتورة أقل من دولار واحد شهريًا.',
  'Included credits already cover all usage.': 'تغطي الأرصدة المشمولة كل الاستخدام بالفعل.',
  'Moving work to cheaper models would use fewer credits and leave more room before overage. The Recommendations simulator shows when that turns into cash.':
    'نقل العمل إلى نماذج أرخص يستهلك أرصدة أقل ويترك مجالًا أكبر قبل التجاوز. يوضح محاكي التوصيات متى يتحول ذلك إلى مبالغ نقدية.',
  'Powerful model': 'النموذج القوي',
  'The mid-tier model from the same vendor that the simulator uses as the default target.':
    'نموذج الفئة المتوسطة من المزوّد نفسه الذي يستخدمه المحاكي هدفًا افتراضيًا.',
  'Usage per month': 'الاستخدام لكل شهر',
  'Average monthly usage of this model, as charged in the report.': 'متوسط الاستخدام الشهري لهذا النموذج، كما احتُسب في التقرير.',
  'Less usage if all moved': 'الاستخدام الأقل إذا انتقل كله',
  'Per month, if every request on this model moved to the cheaper option. An upper bound.':
    'لكل شهر، إذا انتقل كل طلب على هذا النموذج إلى الخيار الأرخص. هذا حد أعلى.',
  'Less usage at {pct} moved': 'الاستخدام الأقل عند نقل {pct}',
  'Per month, if {pct} of the requests moved. This is the default planning share in the simulator.':
    'لكل شهر، إذا انتقل {pct} من الطلبات. هذه حصة التخطيط الافتراضية في المحاكي.',
  'No Powerful models are used in this scope, so there is nothing to right-size.':
    'لا تُستخدم نماذج قوية في هذا النطاق، لذلك لا يوجد ما يُعاد اختيار نموذجه.',
  'This report has no token columns, so a fair cost comparison with cheaper models is not possible.':
    'لا يحتوي هذا التقرير على أعمدة الرموز، لذلك لا يمكن إجراء مقارنة تكلفة عادلة مع النماذج الأرخص.',
  'No Powerful model has a cheaper option with a price on the price card.':
    'لا يوجد نموذج قوي له خيار أرخص بسعر في قائمة الأسعار.',
  'Right-sizing opportunities': 'فرص اختيار النموذج المناسب',
  'Where a mid-tier model could do the job of a Powerful one. Costs compare the same tokens at prices from the price card.':
    'حيث يمكن لنموذج من الفئة المتوسطة أن يؤدي عمل نموذج قوي. تقارن التكاليف الرموز نفسها بأسعار قائمة الأسعار.',
  'Test cheaper models on real tasks before you change team defaults. Quality, not price, should decide.':
    'اختبر النماذج الأرخص على مهام حقيقية قبل تغيير الإعدادات الافتراضية للفريق. الجودة، لا السعر، هي التي يجب أن تحسم.',
  'Keep Powerful models for hard work': 'احتفظ بالنماذج القوية للعمل الصعب',
  'Multi-step tasks, large refactors and tricky bugs are where the extra cost pays off.':
    'المهام متعددة الخطوات وإعادة الهيكلة الكبيرة والأخطاء المعقدة هي حيث تؤتي التكلفة الإضافية ثمارها.',
  'Send routine work to a mid-tier model or Auto': 'وجّه العمل الروتيني إلى نموذج من الفئة المتوسطة أو إلى Auto',
  'Small edits, explanations and tests rarely need the most expensive model. Auto picks a suitable one for you.':
    'نادرًا ما تحتاج التعديلات الصغيرة والشروح والاختبارات إلى النموذج الأغلى. يختار Auto نموذجًا مناسبًا لك.',
  'Powerful usage per month': 'استخدام النماذج القوية لكل شهر',
  'On {models}': 'على {models}',
  'Less usage if all of it moved': 'الاستخدام الأقل إذا انتقل كله',
  'Per month. An upper bound, since hard work stays where it is.': 'لكل شهر. هذا حد أعلى، لأن العمل الصعب يبقى حيث هو.',
  'Per month. The default planning share.': 'لكل شهر. حصة التخطيط الافتراضية.',
  '{models} with no cheaper option: {names}. The mid-tier default is not cheaper for them, or their price or token data is missing.':
    '{models} بلا خيار أرخص: {names}. نموذج الفئة المتوسطة الافتراضي ليس أرخص لها، أو أن بيانات سعرها أو رموزها ناقصة.',
  'Usage {amount}': 'الاستخدام {amount}',

  // Tier by user
  'Who relies on which tier': 'من يعتمد على أي فئة',
  "The {n} biggest users. Each bar shows 100% of one person's usage. Click a bar to open the person.":
    'أكبر المستخدمين استخدامًا ({n}). يعرض كل عمود 100% من استخدام شخص واحد. انقر عمودًا لفتح صفحة الشخص.',
  'Users on Powerful models almost exclusively': 'مستخدمون يعتمدون على النماذج القوية بشكل شبه كامل',
  '{users} with {pct} or more of their usage on Powerful models. Together {share} of all usage.':
    '{users} لديهم {pct} أو أكثر من استخدامهم على النماذج القوية. مجموعهم {share} من كل الاستخدام.',
  'Users with {pct} or more of their usage on Powerful models.': 'المستخدمون الذين لديهم {pct} أو أكثر من استخدامهم على النماذج القوية.',
  '{n} more not shown.': '{n} غير معروضين.',
  'Only users whose usage reaches Minimum usage for traits are counted.':
    'لا يُحتسب إلا المستخدمون الذين يبلغ استخدامهم «الحد الأدنى للاستخدام لتحديد السمات».',
  'See all users': 'عرض كل المستخدمين',
  'No one relies on Powerful models alone': 'لا أحد يعتمد على النماذج القوية وحدها',
  'Every user whose usage reaches Minimum usage for traits has less than {pct} of their usage on Powerful models.':
    'كل مستخدم يبلغ استخدامه «الحد الأدنى للاستخدام لتحديد السمات» لديه أقل من {pct} من استخدامه على النماذج القوية.',
  '{pct} on Powerful · {amount} usage': '{pct} على النماذج القوية · استخدام {amount}',

  // Models without a price
  'A model without a price counts as Unknown until you give it a tier in Settings.':
    'يُحتسب النموذج الذي بلا سعر ضمن «غير معروف» حتى تحدد له فئة في الإعدادات.',
  'The amount charged in the report for this model.': 'المبلغ المحتسب في التقرير لهذا النموذج.',
  'Usage lines in the report.': 'أسطر الاستخدام في التقرير.',
  'Models without a price': 'نماذج بلا سعر',
  'These models are not on the price card, and Settings has no price for them.':
    'هذه النماذج غير موجودة في قائمة الأسعار، وليس لها سعر في الإعدادات.',
  '{amount} of usage ({pct}) is on {models} without a price': '{amount} من الاستخدام ({pct}) على {models} بلا سعر',
  'Open Settings': 'افتح الإعدادات',
  'Set a tier and a price for each one under Model pricing and tiers in Settings. Until then their usage still counts in every total. But it cannot be compared with cheaper models or checked for cache and long-prompt costs.':
    'حدّد فئة وسعرًا لكل منها ضمن «أسعار النماذج وفئاتها» في الإعدادات. حتى ذلك الحين يظل استخدامها محتسبًا في كل إجمالي، لكن لا يمكن مقارنته بنماذج أرخص أو فحصه لتكاليف الذاكرة المؤقتة والموجّهات الطويلة.',
  '{label} means the report had no model name on those lines, so there is nothing to price.':
    '{label} يعني أن التقرير لم يتضمن اسم نموذج في تلك الأسطر، لذلك لا يوجد ما يُسعَّر.',

  // Price source
  'Prices from {source}, as of {date}.': 'الأسعار من {source}، بتاريخ {date}.',
  'GitHub Docs, Models and pricing': 'GitHub Docs، صفحة Models and pricing',
  'To check them against the live page or to set your own prices, open {settings}.':
    'لمطابقتها مع الصفحة الحالية أو لتحديد أسعارك الخاصة، افتح {settings}.',

  // Shared with other pages; added back here after the other dictionaries dropped them
  'This file has no model names': 'لا يحتوي هذا الملف على أسماء النماذج',
  'Auto share': 'حصة Auto',
  'Auto discount rate by plan': 'نسبة خصم Auto حسب الخطة',
  'Plan discount rates are measured on all users in the current row filters, not only on the selected segment.':
    'تُقاس نسب خصم الخطط على جميع المستخدمين ضمن عوامل تصفية الصفوف الحالية، لا على الشريحة المحددة فقط.',
  'Through Auto': 'عبر Auto',
  'Auto share of usage': 'حصة Auto من الاستخدام',
  'Hand-picked models': 'النماذج المختارة يدويًا',
  'Measured: the original price comes from the token counts and the price card.':
    'مقيس: السعر الأصلي مأخوذ من أعداد الرموز وقائمة الأسعار.',
  'Estimated: these Auto rows have no usable token counts, so the original price uses the discount rate of the plan.':
    'تقديري: لا تحتوي صفوف Auto هذه على أعداد رموز صالحة، لذلك يعتمد السعر الأصلي على نسبة خصم الخطة.',
  'Auto discount received': 'خصم Auto المستلم',
  'The report shows no Auto discount. The Auto usage was billed at its original price.':
    'لا يُظهر التقرير أي خصم Auto. احتُسب استخدام Auto بسعره الأصلي.',
  'Auto usage in the report as a share of its original price': 'استخدام Auto في التقرير كنسبة من سعره الأصلي',
  'Original price of Auto usage': 'السعر الأصلي لاستخدام Auto',
  'Auto usage in the report (after the discount)': 'استخدام Auto في التقرير (بعد الخصم)',
  'Discount missed on hand-picked usage': 'الخصم الفائت على الاستخدام المختار يدويًا',
  'about {amount}': 'نحو {amount}',
  'No model usage in this scope': 'لا يوجد استخدام للنماذج في هذا النطاق',
  'Usage by model tier': 'الاستخدام حسب فئة النموذج',
  'Long-context premium': 'علاوة السياق الطويل',
  'Needs token columns': 'يتطلب أعمدة الرموز',
  'Cache hit rate': 'نسبة القراءة من الذاكرة المؤقتة',
  Day: 'يوم',
  Week: 'أسبوع',
  Month: 'شهر',
  'Split usage by': 'تقسيم الاستخدام حسب',
  'No users in this scope': 'لا يوجد مستخدمون في هذا النطاق',
  'less usage per month': 'استخدام أقل شهريًا',
};

export default arabic;
