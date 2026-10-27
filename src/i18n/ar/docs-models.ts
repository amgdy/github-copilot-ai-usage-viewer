/** Arabic text for the explanations of the Models metrics (src/lib/metrics/docs/models.ts). */
import type { Dict } from '../core';

const ar: Dict = {
  // Models used
  'How many different models the usage in the current rows ran on. The line under the number shows how concentrated the usage is.':
    'عدد النماذج المختلفة التي جرى عليها الاستخدام في الصفوف الحالية. يوضح السطر أسفل الرقم مدى تركّز الاستخدام.',
  'Models used = number of models with at least one usage line': 'النماذج المستخدمة = عدد النماذج التي لها سطر استخدام واحد على الأقل',
  'A model and its Auto version count once. Rows written as "Auto: Model A" count as Model A.':
    'يُحتسب النموذج ونسخته عبر Auto مرة واحدة. الصفوف المكتوبة على شكل "Auto: Model A" تُحتسب ضمن Model A.',
  'A row that says only Auto, with no model name, counts as one model named Auto. Rows with an empty model count as one model, shown as (unknown model).':
    'الصف الذي يذكر Auto فقط دون اسم نموذج يُحتسب نموذجًا واحدًا اسمه Auto. والصفوف ذات النموذج الفارغ تُحتسب نموذجًا واحدًا يظهر باسم (نموذج غير معروف).',
  'With one model, the line under the number says that all usage is on one model. With two or three, it says that usage is split across all of them. With more, it shows the share held by the three models with the most usage: their usage ÷ total usage.':
    'مع نموذج واحد يذكر السطر أسفل الرقم أن كل الاستخدام على نموذج واحد. ومع نموذجين أو ثلاثة يذكر أن الاستخدام موزّع عليها كلها. ومع عدد أكبر يعرض الحصة التي تحملها النماذج الثلاثة الأعلى استخدامًا: استخدامها ÷ إجمالي الاستخدام.',
  'The count follows the filters. A model that has no rows in the current rows is not counted.':
    'يتبع العدد عوامل التصفية. لا يُحتسب النموذج الذي ليس له صفوف ضمن الصفوف الحالية.',
  'Rows on "Model A", "Model B" and "Auto: Model A" give 2 models, because the Auto rows count under Model A.':
    'الصفوف على "Model A" و"Model B" و"Auto: Model A" تعطي نموذجين، لأن صفوف Auto تُحتسب ضمن Model A.',

  // Vendors
  'How many companies stand behind the models in use, such as OpenAI, Anthropic and Google. Each vendor sets its own prices.':
    'عدد الشركات التي تقف وراء النماذج المستخدمة، مثل OpenAI وAnthropic وGoogle. يحدد كل مزوّد أسعاره.',
  'Vendors = number of vendors, not counting Other, with at least one usage line':
    'المزوّدون = عدد المزوّدين، دون احتساب «أخرى»، الذين لهم سطر استخدام واحد على الأقل',
  'The vendor of a model comes from the price card built into this app. For a model that is not on the card, the vendor is read from the model name, for example a name with gpt in it is OpenAI. A name the app does not recognize is counted as Other.':
    'يُؤخذ مزوّد النموذج من قائمة الأسعار المضمّنة في هذا التطبيق. أما النموذج غير الموجود في القائمة فيُستنتج مزوّده من اسمه، فمثلًا الاسم الذي يحتوي على gpt يعني OpenAI. والاسم الذي لا يتعرف عليه التطبيق يُحتسب ضمن «أخرى».',
  'Other is not counted as a vendor. Its usage still shows in Usage by vendor.':
    'لا تُحتسب «أخرى» مزوّدًا. ويظل استخدامها ظاهرًا في «الاستخدام حسب المزوّد».',
  'The line under the number names the vendor with the most usage and its share: usage of that vendor ÷ total usage. It says that all usage is on that vendor when no other vendor is in use, and it says that no vendor is known when every model is Other.':
    'يذكر السطر أسفل الرقم المزوّد صاحب أكبر استخدام وحصته: استخدام ذلك المزوّد ÷ إجمالي الاستخدام. ويذكر أن كل الاستخدام على ذلك المزوّد إذا لم يُستخدم مزوّد آخر، ويذكر أنه لا يُعرف أي مزوّد إذا كانت كل النماذج ضمن «أخرى».',
  'Usage of $1,000 with $600 on "Model A" (OpenAI), $300 on "Model B" (OpenAI) and $100 on "Model C" (Anthropic) shows 2 vendors. The line says that OpenAI leads with 90%.':
    'استخدام قدره 1,000 دولار منه 600 دولار على "Model A" (OpenAI) و300 دولار على "Model B" (OpenAI) و100 دولار على "Model C" (Anthropic) يعرض مزوّدَين. ويذكر السطر أن OpenAI في الصدارة بنسبة 90%.',

  // Top model
  'The model with the most usage in the current rows, and how much of all usage it carries.':
    'النموذج صاحب أكبر استخدام في الصفوف الحالية، ومقدار ما يحمله من كل الاستخدام.',
  'Top model = the model with the largest usage ; Share = its usage ÷ total usage':
    'النموذج الأول = النموذج صاحب أكبر استخدام ؛ الحصة = استخدامه ÷ إجمالي الاستخدام',
  'Usage is the amount charged in the report. Rows that went through Auto count under the model Auto picked, at the amount after the Auto discount.':
    'الاستخدام هو المبلغ المحتسب في التقرير. الصفوف التي مرّت عبر Auto تُحتسب ضمن النموذج الذي اختاره Auto، بالمبلغ بعد خصم Auto.',
  'Click the card to filter the whole page by this model.': 'انقر البطاقة لتصفية الصفحة كلها حسب هذا النموذج.',
  'Model A has $600 of $1,000 in usage. The card shows Model A, 60% of usage and $600.':
    'لدى Model A استخدام قدره 600 دولار من 1,000 دولار. تعرض البطاقة Model A و60% من الاستخدام و600 دولار.',

  // Powerful-tier share
  'The share of usage that ran on Powerful models, the tier with the highest token prices. These models suit hard, multi-step work, and routine tasks rarely need them.':
    'حصة الاستخدام التي جرت على النماذج القوية، وهي الفئة ذات أعلى أسعار للرموز. تناسب هذه النماذج العمل الصعب متعدد الخطوات، ونادرًا ما تحتاجها المهام الروتينية.',
  'Powerful-tier share = usage on Powerful models ÷ total usage': 'حصة الفئة القوية = الاستخدام على النماذج القوية ÷ إجمالي الاستخدام',
  'The tier of a model comes from the price card, or from your change in Settings under "Model pricing and tiers". Models without a tier are Unknown and belong to none of the three tiers, so the three tier shares can add up to less than 100%.':
    'تُؤخذ فئة النموذج من قائمة الأسعار، أو من تغييرك في الإعدادات ضمن «أسعار النماذج وفئاتها». النماذج التي بلا فئة تُعدّ «غير معروف» ولا تنتمي إلى أي من الفئات الثلاث، لذلك قد يكون مجموع حصص الفئات الثلاث أقل من 100%.',
  'The number turns amber when the share reaches "Frontier-heavy from". The same limit makes a person Frontier-heavy in the usage profiles.':
    'يتحول الرقم إلى اللون الكهرماني عندما تبلغ الحصة حد «كثيف الاعتماد على النماذج المتقدمة من». والحد نفسه يجعل الشخص كثيف الاعتماد على النماذج المتقدمة في أنماط الاستخدام.',
  'The line under the number gives the usage on Powerful models and how many Powerful models were used.':
    'يعرض السطر أسفل الرقم الاستخدام على النماذج القوية وعدد النماذج القوية المستخدمة.',
  'Click the card to filter the whole page by the Powerful tier.': 'انقر البطاقة لتصفية الصفحة كلها حسب الفئة القوية.',
  'A high share is not a fault by itself. Right-sizing opportunities, further down, shows what moving part of it to a cheaper model would save in usage.':
    'الحصة المرتفعة ليست خطأ في حد ذاتها. تعرض «فرص اختيار النموذج المناسب» في الأسفل ما يوفره نقل جزء منها إلى نموذج أرخص من الاستخدام.',
  'Powerful models took $7,000 of $10,000 in usage. The share is 70%, which reaches the default limit of 70%, so the number turns amber.':
    'استهلكت النماذج القوية 7,000 دولار من استخدام قدره 10,000 دولار. الحصة 70%، وهي تبلغ الحد الافتراضي البالغ 70%، لذلك يتحول الرقم إلى اللون الكهرماني.',

  // Usage on models without a price
  'The usage on models that have no price on the price card and none in Settings. For these models the app cannot compare costs with a cheaper option, and it cannot check the charges against token prices.':
    'الاستخدام على نماذج ليس لها سعر في قائمة الأسعار ولا في الإعدادات. لا يستطيع التطبيق مع هذه النماذج مقارنة التكاليف بخيار أرخص، ولا مطابقة المبالغ مع أسعار الرموز.',
  'Usage on models without a price = sum of gross_amount of the rows whose model has no price':
    'الاستخدام على نماذج بلا سعر = مجموع gross_amount للصفوف التي ليس لنموذجها سعر',
  'The number is green when no usage sits on a model without a price.': 'يظهر الرقم باللون الأخضر عندما لا يقع أي استخدام على نموذج بلا سعر.',
  'A row that says only Auto, with no model name, and a row with an empty model have no price, so they count here.':
    'الصف الذي يذكر Auto فقط دون اسم نموذج، والصف ذو النموذج الفارغ، ليس لهما سعر، لذلك يُحتسبان هنا.',
  'When the file has token counts, usage lines of priced models that have no token counts are named in the info tooltip as a separate amount. They are not part of this number.':
    'عندما يحتوي الملف على أعداد الرموز، تُذكر أسطر الاستخدام للنماذج المسعّرة التي ليس لها أعداد رموز في تلميح المعلومات كمبلغ منفصل. وهي ليست جزءًا من هذا الرقم.',
  'Give a model a tier and a price in Settings, under "Model pricing and tiers", to move it out of this number. Click the card to open Settings.':
    'حدّد للنموذج فئة وسعرًا في الإعدادات، ضمن «أسعار النماذج وفئاتها»، لإخراجه من هذا الرقم. انقر البطاقة لفتح الإعدادات.',
  'Usage is $10,000 and one model that is not on the price card has $300 of it. The card shows $300 and says 3.0% of usage on 1 model.':
    'الاستخدام 10,000 دولار، ومنه 300 دولار على نموذج واحد غير موجود في قائمة الأسعار. تعرض البطاقة 300 دولار وتذكر 3.0% من الاستخدام على نموذج واحد.',

  // Model ranking
  'The twelve models with the most usage, billed amount, requests or credits, as bars colored by model tier. You pick the measure above the chart.':
    'النماذج الاثنا عشر الأعلى في الاستخدام أو المبلغ المدفوع إضافيًا أو الطلبات أو الأرصدة، في أعمدة ملوّنة حسب فئة النموذج. تختار المقياس أعلى المخطط.',
  'Bar length = sum of gross_amount (Usage), net_amount (Billed), usage lines (Requests) or quantity (Credits) of the rows of the model':
    'طول العمود = مجموع gross_amount (الاستخدام) أو net_amount (المدفوع إضافيًا) أو أسطر الاستخدام (الطلبات) أو quantity (الأرصدة) لصفوف النموذج',
  'Usage is the sum of gross_amount of the rows of the model. Rows that went through Auto count under the model Auto picked.':
    'الاستخدام هو مجموع gross_amount لصفوف النموذج. الصفوف التي مرّت عبر Auto تُحتسب ضمن النموذج الذي اختاره Auto.',
  'Billed is the sum of net_amount, the part charged on top of seats. It is 0 for every model while included credits cover all usage.':
    'المدفوع إضافيًا هو مجموع net_amount، أي الجزء المحتسب فوق المقاعد. وهو 0 لكل نموذج ما دامت الأرصدة المشمولة تغطي كل الاستخدام.',
  'Requests is the number of usage lines of the model. A line is one row of the report, which is not always one prompt.':
    'الطلبات هي عدد أسطر الاستخدام للنموذج. السطر صف واحد من التقرير، وليس دائمًا طلبًا واحدًا.',
  'Credits is the sum of quantity. One AI credit is $0.01.': 'الأرصدة هي مجموع quantity. قيمة رصيد الذكاء الاصطناعي الواحد 0.01 دولار.',
  'Models with 0 of the chosen measure are left out. The chart draws the top 12, and the footer says how many more models are in the table below.':
    'تُستبعد النماذج التي قيمتها 0 في المقياس المختار. يرسم المخطط أول 12 نموذجًا، ويذكر التذييل عدد النماذج الإضافية في الجدول أدناه.',
  'The color of a bar is the tier of the model, from the price card or from your changes in Settings. Models without a tier are Unknown.':
    'لون العمود هو فئة النموذج، من قائمة الأسعار أو من تغييراتك في الإعدادات. النماذج التي بلا فئة تُعدّ «غير معروف».',
  'The tooltip shows the tier, the vendor and the share of total usage of the model, whichever measure you picked.':
    'يعرض التلميح الفئة والمزوّد وحصة النموذج من إجمالي الاستخدام، أيًا كان المقياس الذي اخترته.',
  'Click a bar to filter the whole page by that model.': 'انقر عمودًا لتصفية الصفحة كلها حسب ذلك النموذج.',
  'Model A has $600 and Model B has $400 of $1,000 in usage. Ranked by Usage, Model A is the longer bar and its tooltip says 60% of usage.':
    'لدى Model A استخدام قدره 600 دولار ولدى Model B قدره 400 دولار من 1,000 دولار. عند الترتيب حسب الاستخدام يكون عمود Model A الأطول ويذكر تلميحه 60% من الاستخدام.',

  // Usage by vendor
  'How much of the usage went to the models of each vendor. Each vendor sets its own prices.':
    'مقدار الاستخدام الذي ذهب إلى نماذج كل مزوّد. يحدد كل مزوّد أسعاره.',
  'Usage of a vendor = sum of gross_amount of the rows whose model belongs to that vendor':
    'استخدام المزوّد = مجموع gross_amount للصفوف التي ينتمي نموذجها إلى ذلك المزوّد',
  'The vendor of a model comes from the price card built into this app. For a model that is not on the card, the vendor is read from the model name. A name the app does not recognize is counted under Other.':
    'يُؤخذ مزوّد النموذج من قائمة الأسعار المضمّنة في هذا التطبيق. أما النموذج غير الموجود في القائمة فيُستنتج مزوّده من اسمه. والاسم الذي لا يتعرف عليه التطبيق يُحتسب ضمن «أخرى».',
  'Rows that went through Auto count under the model Auto picked, so they land with the vendor of that model. A row that says only Auto, with no model name, is under Other.':
    'الصفوف التي مرّت عبر Auto تُحتسب ضمن النموذج الذي اختاره Auto، فتقع لدى مزوّد ذلك النموذج. والصف الذي يذكر Auto فقط دون اسم نموذج يقع ضمن «أخرى».',
  'The number in the middle of the donut is the total usage in the current rows.': 'الرقم في وسط المخطط الحلقي هو إجمالي الاستخدام في الصفوف الحالية.',
  'Click a vendor to filter the whole page by it.': 'انقر مزوّدًا لتصفية الصفحة كلها حسبه.',
  'Usage of $10,000 with $6,000 on OpenAI models, $3,000 on Anthropic models and $1,000 on models that the app cannot place gives slices of 60%, 30% and 10% (Other).':
    'استخدام قدره 10,000 دولار منه 6,000 دولار على نماذج OpenAI و3,000 دولار على نماذج Anthropic و1,000 دولار على نماذج لا يستطيع التطبيق تصنيفها يعطي شرائح 60% و30% و10% («أخرى»).',

  // Models over time
  'The usage of every day, week or month of the period, split by model, by model tier or by vendor. It shows when the mix of models changed.':
    'استخدام كل يوم أو أسبوع أو شهر من الفترة، مقسّمًا حسب النموذج أو فئة النموذج أو المزوّد. يوضح متى تغيّر مزيج النماذج.',
  'Bar height = sum of gross_amount of the rows in that day, week or month ; Segment = the rows of one model, tier or vendor':
    'ارتفاع العمود = مجموع gross_amount للصفوف في ذلك اليوم أو الأسبوع أو الشهر ؛ الجزء = صفوف نموذج أو فئة أو مزوّد واحد',
  'Model: the eight models with the most usage in the whole period get a color each. All other models are added up as Other models.':
    'النموذج: تحصل النماذج الثمانية الأعلى استخدامًا في الفترة كلها على لون لكل منها. وتُجمع كل النماذج الأخرى تحت «نماذج أخرى».',
  'Tier: Powerful, Versatile and Lightweight, and Unknown for models without a tier. Only tiers with usage are drawn.':
    'الفئة: قوي ومتعدد الاستخدامات وخفيف، و«غير معروف» للنماذج التي بلا فئة. لا تُرسم إلا الفئات التي لها استخدام.',
  'Vendor: one color for each vendor. Models whose vendor is not recognized are under Other.':
    'المزوّد: لون واحد لكل مزوّد. النماذج التي لا يُتعرّف على مزوّدها تقع ضمن «أخرى».',
  'Day, week and month work as in Usage over time. The chart starts with days for periods of up to 120 days and with weeks for longer ones, and the choice is shared with the Auto chart next to it.':
    'تعمل خيارات اليوم والأسبوع والشهر كما في «الاستخدام عبر الزمن». يبدأ المخطط بالأيام للفترات حتى 120 يومًا وبالأسابيع للفترات الأطول، ويُشارك الاختيار مع مخطط Auto المجاور.',
  'Rows that went through Auto count under the model Auto picked, at the amount charged after the Auto discount.':
    'الصفوف التي مرّت عبر Auto تُحتسب ضمن النموذج الذي اختاره Auto، بالمبلغ المحتسب بعد خصم Auto.',
  'Click a bar to narrow the date range to that day, week or month.': 'انقر عمودًا لتضييق النطاق الزمني إلى ذلك اليوم أو الأسبوع أو الشهر.',
  'A week with $300 on Model A and $200 on Model B is a bar of $500 with two segments. In the tier split the same bar has one segment for each tier.':
    'أسبوع فيه 300 دولار على Model A و200 دولار على Model B يظهر عمودًا قدره 500 دولار من جزأين. وفي التقسيم حسب الفئة يكون للعمود نفسه جزء لكل فئة.',

  // Auto over time
  'How the usage through Auto and the usage on hand-picked models changed over the period. It shows whether more of the usage lets GitHub Copilot pick the model.':
    'كيف تغيّر الاستخدام عبر Auto والاستخدام على النماذج المختارة يدويًا خلال الفترة. يوضح ما إذا كان جزء أكبر من الاستخدام يترك لـ GitHub Copilot اختيار النموذج.',
  'Auto share of a period = usage of Auto rows ÷ total usage of that day, week or month':
    'حصة Auto في فترة = استخدام صفوف Auto ÷ إجمالي استخدام ذلك اليوم أو الأسبوع أو الشهر',
  'Share view: one point for each day, week or month. A period without usage has no point. The dashed line is the Auto share of the whole period.':
    'عرض الحصة: نقطة لكل يوم أو أسبوع أو شهر. الفترة التي بلا استخدام ليس لها نقطة. الخط المتقطع هو حصة Auto في الفترة كلها.',
  'Auto and hand-picked view: stacked bars of Through Auto and Hand-picked, each the sum of gross_amount of its rows.':
    'عرض Auto والمختار يدويًا: أعمدة مكدّسة لـ «عبر Auto» و«مختار يدويًا»، كل منها مجموع gross_amount لصفوفه.',
  'The sentence under the chart compares the first half of the periods with the second half. It needs at least four periods, with usage in both halves, and a change of at least 5 percentage points. With a smaller change it says that the share stayed steady. Without enough periods it gives only the Auto share of the whole period.':
    'تقارن الجملة أسفل المخطط النصف الأول من الفترات بالنصف الثاني. وتحتاج إلى أربع فترات على الأقل، مع استخدام في النصفين، وتغيّر لا يقل عن 5 نقاط مئوية. ومع تغيّر أصغر تذكر أن الحصة بقيت ثابتة. ومن دون فترات كافية تعرض حصة Auto في الفترة كلها فقط.',
  'A row counts as Auto when its model is written as "Auto: <model name>" or as "Auto". Every other row is hand-picked.':
    'يُحتسب الصف ضمن Auto عندما يُكتب نموذجه على شكل "Auto: <model name>" أو "Auto". وكل صف آخر مختار يدويًا.',
  'Both parts are the amount charged in the report, so Auto rows are already after the Auto discount.':
    'كلا الجزأين هو المبلغ المحتسب في التقرير، لذلك تكون صفوف Auto بعد خصم Auto بالفعل.',
  'Day, week and month work as in Usage over time, and the choice is shared with the Models over time chart.':
    'تعمل خيارات اليوم والأسبوع والشهر كما في «الاستخدام عبر الزمن»، ويُشارك الاختيار مع مخطط «النماذج عبر الزمن».',
  'Click a point or a bar to narrow the date range to that period.': 'انقر نقطة أو عمودًا لتضييق النطاق الزمني إلى تلك الفترة.',
  'In a week with $300 through Auto and $700 on hand-picked models, the Auto share is $300 ÷ $1,000 = 30%.':
    'في أسبوع فيه 300 دولار عبر Auto و700 دولار على نماذج مختارة يدويًا، تكون حصة Auto هي 300 ÷ 1,000 دولار = 30%.',

  // Model table
  'One row for each model with at least one usage line in the current rows, the model with the most usage first. It brings together the usage, tokens, prices from the price card, Auto share and cheaper option of each model.':
    'صف لكل نموذج له سطر استخدام واحد على الأقل في الصفوف الحالية، بدءًا بالنموذج الأعلى استخدامًا. يجمع الاستخدام والرموز وأسعار قائمة الأسعار وحصة Auto والخيار الأرخص لكل نموذج.',
  'One row per model = the rows of the report that name that model': 'صف لكل نموذج = صفوف التقرير التي تذكر ذلك النموذج',
  'Rows that went through Auto count under the model Auto picked.': 'الصفوف التي مرّت عبر Auto تُحتسب ضمن النموذج الذي اختاره Auto.',
  'The badge No price marks a model that is not on the price card and has no price in Settings. The badge Auto only marks a model that Auto picked for at least 99.9% of its usage.':
    'تشير شارة «بلا سعر» إلى نموذج غير موجود في قائمة الأسعار وليس له سعر في الإعدادات. وتشير شارة «Auto فقط» إلى نموذج اختاره Auto في 99.9% على الأقل من استخدامه.',
  'Without token columns in the file, the token columns (input, output, cache read and cache write tokens and the cache hit rate) are not shown, and the cheaper option shows dashes.':
    'إذا لم يحتوِ الملف على أعمدة الرموز، لا تظهر أعمدة الرموز (رموز الإدخال والإخراج والقراءة من الذاكرة المؤقتة والكتابة فيها ونسبة القراءة من الذاكرة المؤقتة)، ويعرض الخيار الأرخص شَرطات.',
  'Click a row to filter the whole page by that model. Use Columns to show the top user of each model. The table can be searched, sorted and exported.':
    'انقر صفًا لتصفية الصفحة كلها حسب ذلك النموذج. استخدم «الأعمدة» لإظهار المستخدم الأول لكل نموذج. يمكن البحث في الجدول وفرزه وتصديره.',
  'Rows on "Model A" and on "Auto: Model A" are one row, Model A. Its Auto share is the part of its usage that sits on the Auto rows.':
    'الصفوف على "Model A" وعلى "Auto: Model A" صف واحد هو Model A. وحصة Auto فيه هي جزء استخدامه الواقع على صفوف Auto.',

  // Vendor of a model
  'Vendor of a model': 'مزوّد النموذج',
  'The company that makes the model, such as OpenAI, Anthropic or Google. Each vendor sets its own prices.':
    'الشركة التي تصنع النموذج، مثل OpenAI أو Anthropic أو Google. يحدد كل مزوّد أسعاره.',
  'Vendor = vendor on the price card, otherwise read from the model name, otherwise Other':
    'المزوّد = المزوّد في قائمة الأسعار، وإلا فيُستنتج من اسم النموذج، وإلا فهو «أخرى»',
  'The built-in price card names the vendor of every model on it. For a model that is not on the card, the vendor is read from the model name, for example a name with gpt in it is OpenAI. A name the app does not recognize is Other.':
    'تذكر قائمة الأسعار المضمّنة مزوّد كل نموذج فيها. أما النموذج غير الموجود في القائمة فيُستنتج مزوّده من اسمه، فمثلًا الاسم الذي يحتوي على gpt يعني OpenAI. والاسم الذي لا يتعرف عليه التطبيق يكون «أخرى».',
  'A row that says only Auto, with no model name, and a row with an empty model are Other.':
    'الصف الذي يذكر Auto فقط دون اسم نموذج، والصف ذو النموذج الفارغ، يقعان ضمن «أخرى».',
  'The vendor also decides which cheaper option the app compares a Powerful model with.':
    'يحدد المزوّد أيضًا الخيار الأرخص الذي يقارن التطبيق النموذج القوي به.',
  'A model on the price card under OpenAI shows OpenAI. A model that is not on the card and has a name the app does not recognize shows Other.':
    'النموذج المدرج في قائمة الأسعار تحت OpenAI يظهر بمزوّد OpenAI. والنموذج غير الموجود في القائمة وله اسم لا يتعرف عليه التطبيق يظهر ضمن «أخرى».',

  // Tier of a model
  'Tier of a model': 'فئة النموذج',
  'How the price card groups a model. Powerful models are meant for hard, multi-step work and have the highest token prices. Versatile models are the middle tier, for everyday work. Lightweight models are the cheapest per token.':
    'كيف تصنّف قائمة الأسعار النموذج. النماذج القوية مخصصة للعمل الصعب متعدد الخطوات ولها أعلى أسعار للرموز. النماذج متعددة الاستخدامات هي الفئة الوسطى للعمل اليومي. والنماذج الخفيفة هي الأرخص لكل رمز.',
  'Tier = tier you set in Settings, otherwise the tier on the price card, otherwise Unknown':
    'الفئة = الفئة التي تحددها في الإعدادات، وإلا فالفئة في قائمة الأسعار، وإلا فهي «غير معروف»',
  'A model that is not on the price card is Unknown until you give it a tier in Settings, under "Model pricing and tiers". A row that says only Auto, with no model name, is Unknown.':
    'النموذج غير الموجود في قائمة الأسعار يُعدّ «غير معروف» حتى تحدد له فئة في الإعدادات، ضمن «أسعار النماذج وفئاتها». والصف الذي يذكر Auto فقط دون اسم نموذج يُعدّ «غير معروف».',
  'Unknown models are not part of the Powerful-tier share or of the right-sizing figures.':
    'النماذج غير المعروفة ليست جزءًا من حصة الفئة القوية ولا من أرقام اختيار النموذج المناسب.',
  'A model on the price card as Powerful shows Powerful. If you set it to Versatile in Settings, the app treats it as Versatile from then on.':
    'النموذج المدرج في قائمة الأسعار كنموذج قوي يظهر «قوي». وإذا جعلته «متعدد الاستخدامات» في الإعدادات، يعامله التطبيق على هذا الأساس من حينها.',

  // Users per model
  'Users per model': 'المستخدمون لكل نموذج',
  'How many different people had at least one usage line on the model.': 'عدد الأشخاص المختلفين الذين لهم سطر استخدام واحد على الأقل على النموذج.',
  'Users = number of different usernames with at least one row on the model':
    'المستخدمون = عدد أسماء المستخدمين المختلفة التي لها صف واحد على الأقل على النموذج',
  'A person counts once for each model they used, so the users of all models add up to more than the number of active users.':
    'يُحتسب الشخص مرة لكل نموذج استخدمه، لذلك يزيد مجموع مستخدمي كل النماذج على عدد المستخدمين النشطين.',
  'Rows without a username, such as repository-level products, are not counted as a person.':
    'الصفوف التي بلا اسم مستخدم، مثل المنتجات على مستوى المستودع، لا تُحتسب شخصًا.',
  'Two people used Model A and one of them also used Model B. Model A shows 2 users and Model B shows 1 user, while 2 people were active.':
    'استخدم شخصان Model A واستخدم أحدهما Model B أيضًا. يعرض Model A مستخدمَين ويعرض Model B مستخدمًا واحدًا، بينما كان شخصان نشطين.',

  // Requests per model
  'How many usage lines the model has in the report.': 'عدد أسطر الاستخدام للنموذج في التقرير.',
  'Requests = number of rows of the model': 'الطلبات = عدد صفوف النموذج',
  'A row is one line of the usage report. It is not always one prompt, so read the number as usage lines.':
    'الصف سطر واحد من تقرير الاستخدام. وهو ليس دائمًا طلبًا واحدًا، لذلك اقرأ الرقم على أنه أسطر استخدام.',
  'A model with 400 rows in the current rows shows 400 requests.': 'النموذج الذي له 400 صف في الصفوف الحالية يعرض 400 طلب.',

  // Share of usage
  'How much of all usage in the current rows one model carries.': 'مقدار ما يحمله نموذج واحد من كل الاستخدام في الصفوف الحالية.',
  'Share of usage = usage of the model ÷ total usage': 'حصة الاستخدام = استخدام النموذج ÷ إجمالي الاستخدام',
  'The total is the usage of all models in the current rows, so the shares of all models add up to 100%.':
    'الإجمالي هو استخدام كل النماذج في الصفوف الحالية، لذلك يبلغ مجموع حصص كل النماذج 100%.',
  'Model A has $600 of $1,000 in usage, so its share is 60%.': 'لدى Model A استخدام قدره 600 دولار من 1,000 دولار، لذلك حصته 60%.',

  // Credits per request
  'The average AI credits that one usage line of the model used. A higher number means heavier requests or a more expensive model.':
    'متوسط أرصدة الذكاء الاصطناعي التي استهلكها سطر استخدام واحد للنموذج. الرقم الأعلى يعني طلبات أثقل أو نموذجًا أغلى.',
  'Credits per request = credits of the model ÷ requests of the model': 'الأرصدة لكل طلب = أرصدة النموذج ÷ طلبات النموذج',
  'Credits are the sum of the quantity column, where one AI credit is $0.01. Requests are the usage lines of the model.':
    'الأرصدة هي مجموع عمود quantity، وقيمة رصيد الذكاء الاصطناعي الواحد 0.01 دولار. والطلبات هي أسطر استخدام النموذج.',
  'A model used 1,200 credits over 400 usage lines. Credits per request = 1,200 ÷ 400 = 3 credits, which is $0.03.':
    'استهلك نموذج 1,200 رصيد على 400 سطر استخدام. الأرصدة لكل طلب = 1,200 ÷ 400 = 3 أرصدة، أي 0.03 دولار.',

  // Price per 1M tokens
  'Price per 1M tokens on the price card': 'السعر لكل مليون رمز في قائمة الأسعار',
  'What one million tokens of a model cost on the price card: input, cache read, cache write and output. The usage report has no token prices, so the app reads them from a price card that is built into it.':
    'تكلفة مليون رمز من النموذج في قائمة الأسعار: الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها والإخراج. لا يحتوي تقرير الاستخدام على أسعار الرموز، لذلك يقرؤها التطبيق من قائمة أسعار مضمّنة فيه.',
  'Price = price per 1M tokens on the price card, or your own price from Settings':
    'السعر = السعر لكل مليون رمز في قائمة الأسعار، أو سعرك الخاص من الإعدادات',
  'The price card is a copy of the GitHub Docs page Models and pricing. Its date and a link to the page are shown under the tables. Vendors change prices, so the card can be out of date.':
    'قائمة الأسعار نسخة من صفحة Models and pricing في GitHub Docs. يظهر تاريخها ورابط الصفحة أسفل الجداول. يغيّر المزوّدون أسعارهم، لذلك قد تكون القائمة قديمة.',
  'The model table uses your changes in Settings under "Model pricing and tiers". The Price card table shows only the built-in card.':
    'يستخدم جدول النماذج تغييراتك في الإعدادات ضمن «أسعار النماذج وفئاتها». أما جدول قائمة الأسعار فيعرض القائمة المضمّنة فقط.',
  'A dash means the model has no price. Give it a tier and a price in Settings.':
    'تعني الشَرطة أن النموذج بلا سعر. حدّد له فئة وسعرًا في الإعدادات.',
  'Some models charge a higher price for very long prompts. Long-context premium shows what that added.':
    'تفرض بعض النماذج سعرًا أعلى للموجّهات الطويلة جدًا. تعرض «علاوة السياق الطويل» ما أضافه ذلك.',
  'These prices are used to measure the Auto discount, to compare a model with a cheaper option and to split usage by token type. The usage in your report is never replaced by a price from the card.':
    'تُستخدم هذه الأسعار لقياس خصم Auto ولمقارنة النموذج بخيار أرخص ولتقسيم الاستخدام حسب نوع الرمز. ولا يُستبدل الاستخدام في تقريرك أبدًا بسعر من القائمة.',
  'A model priced at $2.00 per 1M input tokens costs $0.20 for 100,000 input tokens.':
    'النموذج المسعّر بـ 2.00 دولار لكل مليون رمز إدخال يكلّف 0.20 دولار مقابل 100,000 رمز إدخال.',

  // Auto share of a model
  'Auto share of a model': 'حصة Auto في النموذج',
  'How much of the usage of one model went through Auto.': 'مقدار استخدام نموذج واحد الذي مرّ عبر Auto.',
  'Auto share of a model = usage of its Auto rows ÷ usage of the model': 'حصة Auto في النموذج = استخدام صفوف Auto الخاصة به ÷ استخدام النموذج',
  'A model with no usage shows a dash.': 'النموذج الذي بلا استخدام يعرض شَرطة.',
  'The badge Auto only appears next to a model when Auto picked it for at least 99.9% of its usage.':
    'تظهر شارة «Auto فقط» بجانب النموذج عندما يختاره Auto في 99.9% على الأقل من استخدامه.',
  'Model A has $500 of usage and $200 of it is on Auto rows. Its Auto share is 40%.':
    'لدى Model A استخدام قدره 500 دولار، منه 200 دولار على صفوف Auto. حصة Auto فيه 40%.',

  // Cheaper option
  'A mid-tier model of the same vendor that could take over some of the work of a Powerful model. It is a starting point for a test and not a recommendation to switch.':
    'نموذج من الفئة المتوسطة من المزوّد نفسه يمكنه تولّي بعض عمل نموذج قوي. وهو نقطة بداية لاختبار، لا توصية بالتبديل.',
  'Cheaper option = the default mid-tier model of the vendor, when the same tokens cost less on it':
    'الخيار الأرخص = نموذج الفئة المتوسطة الافتراضي للمزوّد، عندما تكون تكلفة الرموز نفسها عليه أقل',
  'The app has one default model for each vendor. A model from Moonshot or from an unknown vendor is compared with the default of Anthropic.':
    'للتطبيق نموذج افتراضي واحد لكل مزوّد. النموذج من Moonshot أو من مزوّد غير معروف يُقارن بالنموذج الافتراضي لـ Anthropic.',
  'It is shown only for Powerful models that have a price and token counts, and only when the cheaper option costs less for the token mix of the model. Otherwise the cell shows a dash.':
    'لا يظهر إلا للنماذج القوية التي لها سعر وأعداد رموز، وفقط عندما يكون الخيار الأرخص أقل تكلفة لمزيج رموز النموذج. وإلا تعرض الخلية شَرطة.',
  'The comparison is about price. Only a test on real tasks shows whether a cheaper model does the work as well.':
    'المقارنة تخص السعر. ولا يوضح إلا اختبار على مهام حقيقية ما إذا كان النموذج الأرخص يؤدي العمل بالجودة نفسها.',
  'A Powerful model costs $10.00 for its tokens. The default mid-tier model of the same vendor would cost $4.00 for the same tokens, so it is listed as the cheaper option.':
    'يكلّف نموذج قوي 10.00 دولار لرموزه. وسيكلّف نموذج الفئة المتوسطة الافتراضي من المزوّد نفسه 4.00 دولار للرموز نفسها، لذلك يُدرج كخيار أرخص.',

  // Cost on cheaper option
  'What the same tokens would cost on the cheaper option, as a share of what they cost on the model today. 40% means the cheaper option costs 60% less.':
    'تكلفة الرموز نفسها على الخيار الأرخص، كنسبة من تكلفتها على النموذج حاليًا. 40% تعني أن الخيار الأرخص أقل تكلفة بنسبة 60%.',
  'Cost on cheaper option = tokens at the rates of the cheaper option ÷ the same tokens at the rates of the model':
    'التكلفة على الخيار الأرخص = الرموز بأسعار الخيار الأرخص ÷ الرموز نفسها بأسعار النموذج',
  'Take the input, cache read, cache write and output tokens of the model in the current rows.':
    'خذ رموز الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها والإخراج للنموذج في الصفوف الحالية.',
  'Price them at the price card rates of the model, and again at the rates of the cheaper option.':
    'سعّرها بأسعار النموذج في قائمة الأسعار، ثم مرة أخرى بأسعار الخيار الأرخص.',
  'Divide the second cost by the first.': 'اقسم التكلفة الثانية على الأولى.',
  'Both costs use the base prices of the price card. Long-context prices and the Auto discount are not applied, so the figure compares price-card costs.':
    'تستخدم التكلفتان الأسعار الأساسية في قائمة الأسعار. لا تُطبّق أسعار السياق الطويل ولا خصم Auto، لذلك يقارن الرقم تكاليف قائمة الأسعار.',
  'The ratio is applied to the usage in the report to work out how much less usage there would be. It is shown only when it is below 100%.':
    'تُطبّق النسبة على الاستخدام في التقرير لحساب مقدار انخفاض الاستخدام. ولا تظهر إلا عندما تكون أقل من 100%.',
  'It needs token counts. Without them the cell shows a dash.': 'تحتاج إلى أعداد الرموز. ومن دونها تعرض الخلية شَرطة.',
  'The figure says nothing about quality. A cheaper model can need more attempts on hard tasks.':
    'لا يقول الرقم شيئًا عن الجودة. قد يحتاج النموذج الأرخص إلى محاولات أكثر في المهام الصعبة.',
  'The tokens of a model cost $10.00 at its own rates and $4.00 at the rates of the cheaper option. The ratio is $4.00 ÷ $10.00 = 40%, which is 60% less.':
    'تكلّف رموز نموذج 10.00 دولار بأسعاره و4.00 دولار بأسعار الخيار الأرخص. النسبة 4.00 ÷ 10.00 دولار = 40%، أي أقل بنسبة 60%.',

  // Top user of a model
  'Top user of a model': 'المستخدم الأول للنموذج',
  'The person with the most usage on the model, and the share of the usage of the model that this person carries.':
    'الشخص صاحب أكبر استخدام على النموذج، وحصة استخدام النموذج التي يحملها هذا الشخص.',
  'Share = usage of the top user on the model ÷ usage of the model': 'الحصة = استخدام المستخدم الأول على النموذج ÷ استخدام النموذج',
  'The column is hidden at first. Show it under Columns. Click a name to open the person.':
    'العمود مخفي في البداية. أظهره من «الأعمدة». انقر اسمًا لفتح صفحة الشخص.',
  'The usage of the model includes rows without a username, so the share can look small when much of the usage has no username.':
    'يشمل استخدام النموذج صفوفًا بلا اسم مستخدم، لذلك قد تبدو الحصة صغيرة عندما يكون جزء كبير من الاستخدام بلا اسم مستخدم.',
  'A model has $1,000 of usage and one person used $400 of it. The column shows that person with 40%.':
    'لنموذج استخدام قدره 1,000 دولار، استخدم شخص واحد 400 دولار منه. يعرض العمود ذلك الشخص بنسبة 40%.',

  // Less usage if all moved
  'How much lower the usage of Powerful models would be each month if all of their requests ran on the cheaper option of the same vendor. It is an upper bound, because hard work should stay on a Powerful model.':
    'مقدار انخفاض استخدام النماذج القوية كل شهر لو جرت كل طلباتها على الخيار الأرخص من المزوّد نفسه. وهو حد أعلى، لأن العمل الصعب ينبغي أن يبقى على نموذج قوي.',
  'Less usage if all moved = sum over Powerful models of usage × (1 − cost on cheaper option), as a monthly average':
    'الاستخدام الأقل إذا انتقل كله = مجموع (الاستخدام × (1 − التكلفة على الخيار الأرخص)) على النماذج القوية، كمتوسط شهري',
  'Take every Powerful model that has a price, token counts and a cheaper option that costs less for its token mix.':
    'خذ كل نموذج قوي له سعر وأعداد رموز وخيار أرخص أقل تكلفة لمزيج رموزه.',
  'For each one, less usage = usage of the model × (1 − cost on cheaper option).':
    'لكل منها، الاستخدام الأقل = استخدام النموذج × (1 − التكلفة على الخيار الأرخص).',
  'Add up the models and turn the total into a monthly average with the per-month factor.':
    'اجمع النماذج وحوّل الإجمالي إلى متوسط شهري باستخدام المعامل الشهري.',
  'It is usage that would not be consumed, not cash. Included credits are shared by the whole organization, so less usage lowers the bill only once the pool no longer covers the usage. Bill effect of right-sizing shows that.':
    'هذا استخدام لن يُستهلك، لا مبالغ نقدية. الأرصدة المشمولة مشتركة على مستوى المؤسسة كلها، لذلك لا يخفض الاستخدام الأقل الفاتورة إلا عندما لا يعود الرصيد المشترك يغطي الاستخدام. ويعرض ذلك «أثر اختيار النموذج المناسب على الفاتورة».',
  'The cost ratio uses the base prices of the price card, so it compares price-card costs. It is applied to the usage in the report.':
    'تستخدم نسبة التكلفة الأسعار الأساسية في قائمة الأسعار، لذلك تقارن تكاليف قائمة الأسعار. وتُطبّق على الاستخدام في التقرير.',
  'It assumes that the cheaper model gets the same tokens. A weaker model can need more attempts, which is one more reason to read it as an upper bound.':
    'يفترض أن النموذج الأرخص يتلقى الرموز نفسها. قد يحتاج النموذج الأضعف إلى محاولات أكثر، وهذا سبب إضافي لقراءته كحد أعلى.',
  'Without token columns in the file there is nothing to compare, and the card shows no figure.':
    'من دون أعمدة الرموز في الملف لا يوجد ما يُقارن، ولا تعرض البطاقة أي رقم.',
  'A Powerful model had $6,000 of usage over 61 days, and the same tokens cost 40% as much on its cheaper option. Less usage = $6,000 × (1 − 40%) = $3,600 for the period, which is $3,600 × 30.4375 ÷ 61 = about $1,796 per month.':
    'كان لنموذج قوي استخدام قدره 6,000 دولار خلال 61 يومًا، وتكلّف الرموز نفسها 40% فقط على خياره الأرخص. الاستخدام الأقل = 6,000 × (1 − 40%) = 3,600 دولار للفترة، أي 3,600 × 30.4375 ÷ 61 = نحو 1,796 دولارًا شهريًا.',

  // Less usage at 30% moved
  'Less usage at 30% moved': 'الاستخدام الأقل عند نقل 30%',
  'How much lower the usage would be each month if 30% of the Powerful usage moved to the cheaper option. 30% is the default share that the Recommendations simulator plans with for the lever "Right-size models".':
    'مقدار انخفاض الاستخدام كل شهر لو انتقل 30% من استخدام النماذج القوية إلى الخيار الأرخص. 30% هي الحصة الافتراضية التي يخطط بها محاكي التوصيات لعادة «اختيار النموذج المناسب».',
  'Less usage at 30% moved = Less usage if all moved × 30%': 'الاستخدام الأقل عند نقل 30% = الاستخدام الأقل إذا انتقل كله × 30%',
  'The simulator lets you change the share. This page always uses the default.':
    'يتيح لك المحاكي تغيير الحصة. أما هذه الصفحة فتستخدم القيمة الافتراضية دائمًا.',
  'It is usage, not cash. The effect on the bill depends on the included credits and is shown under Bill effect of right-sizing.':
    'هذا استخدام لا مبالغ نقدية. يعتمد الأثر على الفاتورة على الأرصدة المشمولة ويظهر ضمن «أثر اختيار النموذج المناسب على الفاتورة».',
  'Each row of the table is one model, and the card above the table adds the rows up.':
    'كل صف في الجدول نموذج واحد، والبطاقة أعلى الجدول تجمع الصفوف.',
  'Less usage if all moved is $1,800 per month. At 30% moved the figure is $1,800 × 30% = $540 per month.':
    'الاستخدام الأقل إذا انتقل كله 1,800 دولار شهريًا. وعند نقل 30% يكون الرقم 1,800 × 30% = 540 دولارًا شهريًا.',

  // Bill effect of right-sizing
  'Bill effect of right-sizing': 'أثر اختيار النموذج المناسب على الفاتورة',
  'What the less usage at 30% moved would do to the bill, using the same pool rules as the Recommendations simulator. Included credits are shared, so less usage lowers the bill only once the pool no longer covers it.':
    'ما سيُحدثه الاستخدام الأقل عند نقل 30% في الفاتورة، بقواعد الرصيد المشترك نفسها التي يستخدمها محاكي التوصيات. الأرصدة المشمولة مشتركة، لذلك لا يخفض الاستخدام الأقل الفاتورة إلا عندما لا يعود الرصيد المشترك يغطيه.',
  'Bill effect per month = average over the months of (monthly cost before − monthly cost after the shift), at most the less usage per month':
    'الأثر على الفاتورة شهريًا = متوسط (التكلفة الشهرية قبل النقل − التكلفة الشهرية بعده) على الأشهر، بحد أقصى الاستخدام الأقل شهريًا',
  'For each month, the monthly cost is the larger of the pool size and the usage. A month that is still running uses its projected usage.':
    'لكل شهر، التكلفة الشهرية هي الأكبر بين حجم الرصيد المشترك والاستخدام. والشهر الذي لم ينتهِ بعد يستخدم استخدامه المتوقع.',
  'The shift lowers the usage of every month by the same fraction: less usage at 30% moved ÷ total usage of the period.':
    'يخفض النقل استخدام كل شهر بالنسبة نفسها: الاستخدام الأقل عند نقل 30% ÷ إجمالي استخدام الفترة.',
  'Bill effect = average over the months of the monthly cost before − the monthly cost after.':
    'الأثر على الفاتورة = متوسط التكلفة الشهرية قبل النقل − التكلفة الشهرية بعده على الأشهر.',
  'The result is capped at the less usage per month, because a month cannot save more than the usage it no longer has.':
    'يُحدّ الناتج بالاستخدام الأقل شهريًا، لأن الشهر لا يمكن أن يوفّر أكثر من الاستخدام الذي لم يعد لديه.',
  'The card says that the bill does not change today when the effect is under $1 a month, for example when included credits cover the usage even after the shift. The pool then lasts longer, and a later month can still go over.':
    'تذكر البطاقة أن الفاتورة لا تتغير حاليًا عندما يكون الأثر أقل من دولار واحد شهريًا، مثلًا عندما تغطي الأرصدة المشمولة الاستخدام حتى بعد النقل. حينها يدوم الرصيد المشترك مدة أطول، ويظل ممكنًا أن يتجاوزه شهر لاحق.',
  'When a filter other than the date range is active, included credits cannot be split by filter. The card then shows less usage only, and no cash.':
    'عندما يكون عامل تصفية غير النطاق الزمني نشطًا، لا يمكن تقسيم الأرصدة المشمولة حسب عامل التصفية. حينها تعرض البطاقة الاستخدام الأقل فقط، دون مبالغ نقدية.',
  'It is an estimate. It assumes that the shift is spread evenly over all months and all users.':
    'هذا تقدير. يفترض أن النقل موزّع بالتساوي على كل الأشهر وكل المستخدمين.',
  'A pool of $5,000 a month and usage of $5,400 a month. Less usage at 30% moved is $300 a month, so usage falls to $5,100, which is still above the pool, and the bill falls by $300 a month. With usage of $4,800 the pool already covers it, and the bill does not change.':
    'رصيد مشترك قدره 5,000 دولار شهريًا واستخدام قدره 5,400 دولار شهريًا. الاستخدام الأقل عند نقل 30% هو 300 دولار شهريًا، فينخفض الاستخدام إلى 5,100 دولار، وهو لا يزال أعلى من الرصيد المشترك، فتنخفض الفاتورة 300 دولار شهريًا. ومع استخدام قدره 4,800 دولار يغطيه الرصيد المشترك بالفعل، فلا تتغير الفاتورة.',

  // Who relies on which tier
  'For the 15 users with the most usage, how their own usage splits between Powerful, Versatile and Lightweight models. Every bar is 100% of one person.':
    'لأكبر 15 مستخدمًا استخدامًا، كيف يتوزع استخدام كل منهم بين النماذج القوية ومتعددة الاستخدامات والخفيفة. كل عمود يمثل 100% من استخدام شخص واحد.',
  'Tier share of a user = usage of the user on models of that tier ÷ usage of the user':
    'حصة الفئة لدى المستخدم = استخدام المستخدم على نماذج تلك الفئة ÷ استخدام المستخدم',
  'Users are ranked by their usage in the current rows. Users without usage are left out.':
    'يُرتّب المستخدمون حسب استخدامهم في الصفوف الحالية. ويُستبعد المستخدمون الذين بلا استخدام.',
  'Models without a tier are Unknown. Unknown is drawn only when it reaches 0.5% for at least one of the 15 users, and the tooltip lists only tiers of at least 0.5%.':
    'النماذج التي بلا فئة تُعدّ «غير معروف». ولا تُرسم فئة «غير معروف» إلا عندما تبلغ 0.5% لدى واحد على الأقل من المستخدمين الخمسة عشر، ولا يذكر التلميح إلا الفئات التي تبلغ 0.5% على الأقل.',
  'Click a bar to open the person.': 'انقر عمودًا لفتح صفحة الشخص.',
  'A user with $500 on Powerful models, $300 on Versatile and $200 on Lightweight has $1,000 of usage. The bar is 50% Powerful, 30% Versatile and 20% Lightweight.':
    'مستخدم لديه 500 دولار على النماذج القوية و300 دولار على متعددة الاستخدامات و200 دولار على الخفيفة، فاستخدامه 1,000 دولار. العمود 50% قوي و30% متعدد الاستخدامات و20% خفيف.',

  // Users on Powerful models almost exclusively
  'The people who put at least 80% of their usage on Powerful models. They are the first to ask whether a cheaper model could do some of the work.':
    'الأشخاص الذين يضعون 80% على الأقل من استخدامهم على النماذج القوية. وهم أول من يُسأل عما إذا كان نموذج أرخص يمكنه أداء بعض العمل.',
  'Powerful share of a user = usage on Powerful models ÷ usage of the user ; Less usage per month = sum over the models of the user of usage × (1 − cost on cheaper option) × 30%, as a monthly average':
    'حصة النماذج القوية لدى المستخدم = الاستخدام على النماذج القوية ÷ استخدام المستخدم ؛ الاستخدام الأقل شهريًا = مجموع (الاستخدام × (1 − التكلفة على الخيار الأرخص) × 30%) على نماذج المستخدم، كمتوسط شهري',
  'A user is listed when the Powerful share is at least 80% and the usage reaches "Minimum usage for traits".':
    'يُدرج المستخدم عندما تبلغ حصة النماذج القوية 80% على الأقل ويبلغ الاستخدام «الحد الأدنى للاستخدام لتحديد السمات».',
  'The text under the title counts all users that meet both conditions and gives the share of all usage that they carry together: their usage ÷ total usage. The card lists the six with the most usage.':
    'يعدّ النص أسفل العنوان كل المستخدمين الذين يستوفون الشرطين، ويعرض حصة كل الاستخدام التي يحملونها معًا: استخدامهم ÷ إجمالي الاستخدام. وتسرد البطاقة الستة الأعلى استخدامًا.',
  'The figure at the end of each row is the less usage per month if 30% of the usage of that person moved to the cheaper option. It uses the same cheaper options and the same 30% as Right-sizing opportunities, and it is shown when it reaches $0.50 a month.':
    'الرقم في نهاية كل صف هو الاستخدام الأقل شهريًا لو انتقل 30% من استخدام ذلك الشخص إلى الخيار الأرخص. ويستخدم الخيارات الأرخص نفسها ونسبة 30% نفسها كما في «فرص اختيار النموذج المناسب»، ويظهر عندما يبلغ 0.50 دولار شهريًا.',
  'The 80% is fixed. It is not a setting.': 'نسبة 80% ثابتة، وليست إعدادًا.',
  'It is usage, not cash. Included credits are shared by the whole organization.':
    'هذا استخدام لا مبالغ نقدية. الأرصدة المشمولة مشتركة على مستوى المؤسسة كلها.',
  'Rows without a username are not a person, so they are never listed.': 'الصفوف التي بلا اسم مستخدم ليست شخصًا، لذلك لا تُدرج أبدًا.',
  'A user has $900 of $1,000 on Powerful models, which is 90%. If the cheaper option costs 40% as much, moving 30% of that usage saves $900 × (1 − 40%) × 30% = $162 for the period.':
    'لدى مستخدم 900 دولار من 1,000 دولار على النماذج القوية، أي 90%. إذا كان الخيار الأرخص يكلّف 40% فقط، فإن نقل 30% من ذلك الاستخدام يوفر 900 × (1 − 40%) × 30% = 162 دولارًا للفترة.',

  // Less usage at 50% moved to Auto
  'Less usage at 50% moved to Auto': 'الاستخدام الأقل عند نقل 50% إلى Auto',
  'How much lower the usage would be each month if half of the hand-picked usage went through Auto instead. 50% is the default share that the Recommendations simulator plans with for the lever "Use Auto model selection".':
    'مقدار انخفاض الاستخدام كل شهر لو مرّ نصف الاستخدام المختار يدويًا عبر Auto بدلًا من ذلك. 50% هي الحصة الافتراضية التي يخطط بها محاكي التوصيات لعادة «استخدام اختيار النموذج التلقائي».',
  'Less usage per month = Discount missed on hand-picked usage × 50% × 30.4375 ÷ days in the period':
    'الاستخدام الأقل شهريًا = الخصم الفائت على الاستخدام المختار يدويًا × 50% × 30.4375 ÷ أيام الفترة',
  'Discount missed on hand-picked usage = sum over users of (usage − Auto usage) × plan rate. Rows without a username are left out.':
    'الخصم الفائت على الاستخدام المختار يدويًا = مجموع ((الاستخدام − استخدام Auto) × نسبة الخطة) على المستخدمين. وتُستبعد الصفوف التي بلا اسم مستخدم.',
  'The plan rate is measured where the plan has at least $1 of measured Auto usage. A plan without enough of it uses "Auto model discount" from Settings, which is an assumed rate.':
    'تُقاس نسبة الخطة حيث يكون للخطة دولار واحد على الأقل من استخدام Auto المقيس. والخطة التي لا يكفيها ذلك تستخدم «خصم نموذج Auto» من الإعدادات، وهي نسبة مفترضة.',
  'Take 50% of that amount, then turn the period total into a monthly average with the per-month factor.':
    'خذ 50% من ذلك المبلغ، ثم حوّل إجمالي الفترة إلى متوسط شهري باستخدام المعامل الشهري.',
  'It is usage, not cash. Included credits are shared by the whole organization, so less usage lowers the bill only once the pool no longer covers it.':
    'هذا استخدام لا مبالغ نقدية. الأرصدة المشمولة مشتركة على مستوى المؤسسة كلها، لذلك لا يخفض الاستخدام الأقل الفاتورة إلا عندما لا يعود الرصيد المشترك يغطيه.',
  'The figure counts the Auto discount only. Auto picks the model itself and may not suit every task, so read it as a starting point for a conversation and not as a promise.':
    'يحتسب الرقم خصم Auto فقط. يختار Auto النموذج بنفسه وقد لا يناسب كل مهمة، لذلك اقرأه نقطة بداية للنقاش لا وعدًا.',
  'The Recommendations simulator lets you change the 50%, and it applies its levers one after another, so its figure for this lever can be lower.':
    'يتيح لك محاكي التوصيات تغيير نسبة 50%، ويطبّق عاداته واحدة تلو الأخرى، لذلك قد يكون رقمه لهذه العادة أقل.',
  'Over 61 days the missed discount is $400. At 50% moved, usage is $400 × 50% = $200 lower for the period, which is $200 × 30.4375 ÷ 61 = about $100 per month.':
    'خلال 61 يومًا يبلغ الخصم الفائت 400 دولار. وعند نقل 50% ينخفض الاستخدام 400 × 50% = 200 دولار للفترة، أي 200 × 30.4375 ÷ 61 = نحو 100 دولار شهريًا.',

  // Heavy users with the lowest Auto share
  'The heavy users who send the smallest part of their usage through Auto. They are the first people to ask whether Auto would fit their routine work.':
    'المستخدمون الأكثر استخدامًا الذين يرسلون أصغر جزء من استخدامهم عبر Auto. وهم أول من يُسأل عما إذا كان Auto يناسب عملهم الروتيني.',
  'Auto share of a user = usage of the user on Auto rows ÷ usage of the user': 'حصة Auto لدى المستخدم = استخدام المستخدم على صفوف Auto ÷ استخدام المستخدم',
  'Heavy users are the users whose usage reaches "Minimum usage for traits". Of these, take the 15 with the most usage.':
    'المستخدمون الأكثر استخدامًا هم من يبلغ استخدامهم «الحد الأدنى للاستخدام لتحديد السمات». ومن بينهم خذ الخمسة عشر الأعلى استخدامًا.',
  'Keep the ones whose Auto share is below "Auto first from", and sort them by Auto share, the lowest first. When two users have the same share, the one with more usage comes first.':
    'أبقِ من تقل حصة Auto لديهم عن «يعتمد على Auto أولًا من»، ورتّبهم حسب حصة Auto بدءًا بالأدنى. وعندما تتساوى حصة مستخدمَين يأتي صاحب الاستخدام الأكبر أولًا.',
  'The card lists the first five, with the usage, the model with the most usage and the Auto share of each.':
    'تسرد البطاقة الخمسة الأوائل، مع الاستخدام والنموذج الأعلى استخدامًا وحصة Auto لكل منهم.',
  'A user who already reaches "Auto first from" is not listed. When all of the 15 reach it, the card says so, with the lowest Auto share among them, and lists nobody.':
    'لا يُدرج المستخدم الذي يبلغ «يعتمد على Auto أولًا من» بالفعل. وعندما يبلغه الخمسة عشر كلهم تذكر البطاقة ذلك، مع أدنى حصة Auto بينهم، ولا تسرد أحدًا.',
  'The list follows the current rows and the selected segment.': 'تتبع القائمة الصفوف الحالية والشريحة المحددة.',
  'Rows without a username are not a person, so they are never listed. Click a name to open the person.':
    'الصفوف التي بلا اسم مستخدم ليست شخصًا، لذلك لا تُدرج أبدًا. انقر اسمًا لفتح صفحة الشخص.',
  'A user with $2,000 of usage and $200 of it on Auto rows has an Auto share of 10%. With the default "Auto first from" of 50%, the user is listed.':
    'المستخدم الذي لديه استخدام قدره 2,000 دولار منه 200 دولار على صفوف Auto تبلغ حصة Auto لديه 10%. ومع القيمة الافتراضية لـ «يعتمد على Auto أولًا من» البالغة 50% يُدرج المستخدم.',

  // Auto discount by model
  'For each model that Auto picked, how much cheaper its Auto usage was than the same tokens at the original price from the price card. Only the usage that could be measured from token counts is compared.':
    'لكل نموذج اختاره Auto، مقدار ما كان استخدامه عبر Auto أرخص من الرموز نفسها بالسعر الأصلي من قائمة الأسعار. ولا يُقارن إلا الاستخدام الذي أمكن قياسه من أعداد الرموز.',
  'Discount of a model = original price of its measured Auto usage − its measured Auto usage ; Rate = discount ÷ original price of the measured usage':
    'خصم النموذج = السعر الأصلي لاستخدام Auto المقيس − استخدام Auto المقيس ؛ النسبة = الخصم ÷ السعر الأصلي للاستخدام المقيس',
  'Take the Auto rows of the model. Auto usage is the sum of their gross_amount.': 'خذ صفوف Auto للنموذج. استخدام Auto هو مجموع gross_amount لها.',
  'Measured usage is the part of the Auto usage that could be priced from token counts and the price card. The conditions are listed under Auto discount received.':
    'الاستخدام المقيس هو جزء استخدام Auto الذي أمكن تسعيره من أعداد الرموز وقائمة الأسعار. والشروط مذكورة ضمن «خصم Auto المستلم».',
  'The original price of the measured usage = its tokens × the price card rates.': 'السعر الأصلي للاستخدام المقيس = رموزه × أسعار قائمة الأسعار.',
  'Discount = original price − measured usage, never below 0. Rate = discount ÷ original price.':
    'الخصم = السعر الأصلي − الاستخدام المقيس، ولا يقل عن 0. النسبة = الخصم ÷ السعر الأصلي.',
  'Nothing is estimated in this table. Auto usage that could not be measured shows in the Auto usage column only, so the discounts of all models can add up to less than Auto discount received.':
    'لا شيء تقديري في هذا الجدول. استخدام Auto الذي لم يمكن قياسه يظهر في عمود «استخدام Auto» فقط، لذلك قد يكون مجموع خصومات كل النماذج أقل من «خصم Auto المستلم».',
  'A dash in Discount and Rate means that nothing was measured for the model, for example because it has no price or no token counts. A row that says only Auto, with no model name, is listed as Auto and shows dashes.':
    'تعني الشَرطة في «الخصم» و«النسبة» أنه لم يُقس شيء للنموذج، مثلًا لأنه بلا سعر أو بلا أعداد رموز. والصف الذي يذكر Auto فقط دون اسم نموذج يُدرج باسم Auto ويعرض شَرطات.',
  'The table follows the selected rows, including segment filters. The plan rates above it do not.':
    'يتبع الجدول الصفوف المحددة، بما فيها عوامل تصفية الشرائح. أما نسب الخطط أعلاه فلا تتبعها.',
  'The last row adds up the table. Its rate is the total discount ÷ the total original price of the measured usage.':
    'الصف الأخير يجمع الجدول. ونسبته هي إجمالي الخصم ÷ إجمالي السعر الأصلي للاستخدام المقيس.',
  'Auto usage on Model A is $900, all of it measured, and its tokens cost $1,000 at the price card. The discount is $1,000 − $900 = $100 and the rate is $100 ÷ $1,000 = 10%.':
    'استخدام Auto على Model A قدره 900 دولار، كله مقيس، وتكلّف رموزه 1,000 دولار بأسعار قائمة الأسعار. الخصم 1,000 − 900 = 100 دولار والنسبة 100 ÷ 1,000 دولار = 10%.',

  // Plan of a user
  'Plan of a user': 'خطة المستخدم',
  'The plan that a row of the plan table stands for. The report has no plan column, so the plan is told apart by the monthly quota that each user has in the report.':
    'الخطة التي يمثلها صف في جدول الخطط. لا يحتوي التقرير على عمود للخطة، لذلك تُميَّز الخطة بالحصة الشهرية لكل مستخدم في التقرير.',
  'Plan = name given to the highest total_monthly_quota of the user': 'الخطة = الاسم المعطى لأعلى total_monthly_quota لدى المستخدم',
  'For each user with Auto usage, take the highest total_monthly_quota on the rows in view.':
    'لكل مستخدم لديه استخدام عبر Auto، خذ أعلى total_monthly_quota في الصفوف المعروضة.',
  '1,900 credits is named Business and 3,900 credits is named Enterprise.': '1,900 رصيد تُسمّى Business و3,900 رصيد تُسمّى Enterprise.',
  'Any other quota above 0 is named Custom, followed by the number of credits. A quota of 0, or a missing one, is named No quota.':
    'أي حصة أخرى أكبر من 0 تُسمّى Custom متبوعة بعدد الأرصدة. والحصة 0 أو الحصة المفقودة تُسمّى No quota.',
  'Users with the same quota share one row of the table.': 'يشترك المستخدمون ذوو الحصة نفسها في صف واحد من الجدول.',
  'The name comes from the seat size only. The report does not say which plan a seat belongs to.':
    'يأتي الاسم من حجم المقعد فقط. لا يذكر التقرير الخطة التي ينتمي إليها المقعد.',
  'A user with more than one quota on the rows in view is listed under the highest one.':
    'المستخدم الذي له أكثر من حصة في الصفوف المعروضة يُدرج تحت الأعلى منها.',
  'Rows without a username count together as one user.': 'تُحتسب الصفوف التي بلا اسم مستخدم معًا مستخدمًا واحدًا.',
  'A user whose rows carry a total_monthly_quota of 3,900 is listed under Enterprise. A user with a quota of 1,000 is listed under Custom (1,000 credits).':
    'المستخدم الذي تحمل صفوفه total_monthly_quota قدرها 3,900 يُدرج تحت Enterprise. والمستخدم الذي حصته 1,000 يُدرج تحت Custom (1,000 credits).',

  // Users with Auto usage by plan
  'Users with Auto usage by plan': 'المستخدمون الذين لديهم استخدام عبر Auto حسب الخطة',
  'How many users of each plan had Auto usage. A plan is told apart by the monthly quota in the report.':
    'عدد مستخدمي كل خطة الذين لديهم استخدام عبر Auto. تُميَّز الخطة بالحصة الشهرية في التقرير.',
  'Users of a plan = number of users with Auto usage and the same total_monthly_quota':
    'مستخدمو الخطة = عدد المستخدمين الذين لديهم استخدام عبر Auto وtotal_monthly_quota نفسها',
  'The plan comes from the total_monthly_quota of the user: 1,900 credits is Business and 3,900 credits is Enterprise. Another number is Custom with that number of credits, and 0 is No quota.':
    'تأتي الخطة من total_monthly_quota لدى المستخدم: 1,900 رصيد هي Business و3,900 رصيد هي Enterprise. وأي رقم آخر هو Custom بذلك العدد من الأرصدة، و0 هو No quota.',
  'A user without Auto usage is not counted, even when the plan has other users with Auto usage. All rows without a username count together as one user.':
    'لا يُحتسب المستخدم الذي بلا استخدام عبر Auto، حتى لو كان للخطة مستخدمون آخرون لديهم استخدام عبر Auto. وتُحتسب كل الصفوف التي بلا اسم مستخدم معًا مستخدمًا واحدًا.',
  'The count covers all users that pass the row filters. Segment filters do not change it.':
    'يشمل العدد كل المستخدمين الذين يجتازون عوامل تصفية الصفوف. ولا تغيّره عوامل تصفية الشرائح.',
  'Three Business users and one Enterprise user had Auto usage. The table has two rows: Business with 3 users and Enterprise with 1 user.':
    'كان لثلاثة مستخدمين من Business ومستخدم واحد من Enterprise استخدام عبر Auto. للجدول صفان: Business بثلاثة مستخدمين وEnterprise بمستخدم واحد.',

  // Auto usage
  'The usage that went through Auto, at the amount charged in the report, which is after the Auto discount.':
    'الاستخدام الذي مرّ عبر Auto، بالمبلغ المحتسب في التقرير، وهو بعد خصم Auto.',
  'Auto usage = sum of gross_amount of the rows whose model is Auto': 'استخدام Auto = مجموع gross_amount للصفوف التي نموذجها Auto',
  'A row counts as Auto when its model is written as "Auto: <model name>" or as "Auto".':
    'يُحتسب الصف ضمن Auto عندما يُكتب نموذجه على شكل "Auto: <model name>" أو "Auto".',
  'In the plan table it is added up over the users of the plan. In the model table it is added up over the Auto rows of the model, which count under the model that Auto picked.':
    'في جدول الخطط يُجمع على مستخدمي الخطة. وفي جدول النماذج يُجمع على صفوف Auto للنموذج، التي تُحتسب ضمن النموذج الذي اختاره Auto.',
  'A model has $900 on rows written as "Auto: Model A" and $300 on rows that name Model A directly. Its Auto usage is $900.':
    'لنموذج 900 دولار على صفوف مكتوبة على شكل "Auto: Model A" و300 دولار على صفوف تذكر Model A مباشرة. استخدام Auto فيه 900 دولار.',

  // Measured Auto usage
  'Measured Auto usage': 'استخدام Auto المقيس',
  'The part of the Auto usage whose original price could be worked out from token counts and the price card. Only this part gives a measured discount.':
    'جزء استخدام Auto الذي أمكن حساب سعره الأصلي من أعداد الرموز وقائمة الأسعار. ولا يعطي خصمًا مقيسًا إلا هذا الجزء.',
  'Measured Auto usage = sum of gross_amount of the measured Auto rows': 'استخدام Auto المقيس = مجموع gross_amount لصفوف Auto المقيسة',
  "A row is measured when its model has a price, it has token counts, it is not a long-context request and its amount is between 50% and 105% of its price-card cost.":
    'يكون الصف مقيسًا عندما يكون لنموذجه سعر، وله أعداد رموز، وليس طلب سياق طويل، ومبلغه بين 50% و105% من تكلفته بأسعار قائمة الأسعار.',
  'Under Auto discount received, the rest of the Auto usage is estimated with the rate of the plan. The tables here leave that part out.':
    'في «خصم Auto المستلم» يُقدَّر باقي استخدام Auto بنسبة الخطة. أما الجداول هنا فتستبعد ذلك الجزء.',
  'A file without token counts has no measured usage. Every plan then uses the rate from Settings, labeled assumed.':
    'الملف الذي بلا أعداد رموز ليس فيه استخدام مقيس. حينها تستخدم كل خطة النسبة من الإعدادات، موسومة بأنها مفترضة.',
  'A model has $1,000 of Auto usage, and $900 of it sits on rows that could be priced from token counts. The measured Auto usage is $900.':
    'لنموذج استخدام Auto قدره 1,000 دولار، منه 900 دولار على صفوف أمكن تسعيرها من أعداد الرموز. استخدام Auto المقيس 900 دولار.',
  'Original price of measured usage': 'السعر الأصلي للاستخدام المقيس',
  'What the measured Auto usage would have cost at the price-card prices of the models, without the Auto discount.':
    'ما كان سيكلّفه استخدام Auto المقيس بأسعار النماذج في قائمة الأسعار، دون خصم Auto.',
  'Original price of measured usage = tokens × price card rates for input, cache read, cache write and output, over the measured Auto rows':
    'السعر الأصلي للاستخدام المقيس = الرموز × أسعار قائمة الأسعار للإدخال وقراءة ذاكرة التخزين المؤقت والكتابة فيها والإخراج، على صفوف Auto المقيسة',
  'It covers only the measured part. Original price of Auto usage, shown in the Auto card, also adds the part that could not be measured, grossed up at the rate of the plan, so the two can differ.':
    'يشمل الجزء المقيس فقط. أما «السعر الأصلي لاستخدام Auto» في بطاقة Auto فيضيف أيضًا الجزء الذي لم يمكن قياسه، مرفوعًا بنسبة الخطة، لذلك قد يختلف الرقمان.',
  'The rates are the base rates of the price card, or your own rates from Settings. Long-context requests are never measured.':
    'الأسعار هي الأسعار الأساسية في قائمة الأسعار، أو أسعارك الخاصة من الإعدادات. ولا تُقاس طلبات السياق الطويل أبدًا.',
  'The discount is this price minus the measured Auto usage, never below 0.': 'الخصم هو هذا السعر مطروحًا منه استخدام Auto المقيس، ولا يقل أبدًا عن 0.',
  'Measured Auto rows used tokens worth $1,000 at the price card rates, and the report charged $900 for them. The original price of the measured usage is $1,000.':
    'استخدمت صفوف Auto المقيسة رموزًا قيمتها 1,000 دولار بأسعار قائمة الأسعار، واحتسب التقرير عليها 900 دولار. السعر الأصلي للاستخدام المقيس 1,000 دولار.',

  // Basis of a plan rate
  'Basis of a plan rate': 'أساس نسبة الخطة',
  'Whether the discount rate of a plan was measured in the report or is the rate from Settings.':
    'هل نسبة خصم الخطة مقيسة في التقرير أم هي النسبة من الإعدادات.',
  'Basis = measured when the plan has at least $1 of measured Auto usage, otherwise assumed':
    'الأساس = مقيسة عندما يكون للخطة استخدام Auto مقيس لا يقل عن 1 دولار، وإلا فمفترضة',
  'Measured means that the rate is worked out from token counts and the price card. It is held between 0% and 90%.':
    'مقيسة تعني أن النسبة محسوبة من أعداد الرموز وقائمة الأسعار. وتُحصر بين 0% و90%.',
  'Assumed means that the plan has too little measured Auto usage, so it uses "Auto model discount" from Settings. The default is 10%. Hover over the badge to see how much Auto usage could be measured.':
    'مفترضة تعني أن استخدام Auto المقيس في الخطة قليل جدًا، لذلك تستخدم «خصم نموذج Auto» من الإعدادات. القيمة الافتراضية 10%. مرّر المؤشر فوق الشارة لترى مقدار استخدام Auto الذي أمكن قياسه.',
  'The app shows the rate that the file contains for each plan and does not assume a reason for a difference between plans.':
    'يعرض التطبيق النسبة التي يتضمنها الملف لكل خطة، ولا يفترض سببًا لأي اختلاف بين الخطط.',
  'A file without token counts has no measured usage, so every plan is assumed.': 'الملف الذي بلا أعداد رموز ليس فيه استخدام مقيس، لذلك تكون كل الخطط مفترضة.',
  'A plan has $0.40 of measured Auto usage. That is under $1, so the plan is assumed and uses the rate from Settings. With $50 of measured usage the plan is measured and uses its own rate.':
    'لخطة استخدام Auto مقيس قدره 0.40 دولار. وهذا أقل من 1 دولار، لذلك تكون الخطة مفترضة وتستخدم النسبة من الإعدادات. ومع 50 دولارًا من الاستخدام المقيس تكون الخطة مقيسة وتستخدم نسبتها الخاصة.',

  // Discount on measured usage
  'Discount on measured usage': 'الخصم على الاستخدام المقيس',
  'How far the measured Auto usage of a model was below its original price.': 'مقدار انخفاض استخدام Auto المقيس لنموذج عن سعره الأصلي.',
  'Discount = original price of the measured usage − measured Auto usage, never below 0':
    'الخصم = السعر الأصلي للاستخدام المقيس − استخدام Auto المقيس، ولا يقل أبدًا عن 0',
  'A dash means that nothing could be measured for the model.': 'تعني الشَرطة أنه لم يمكن قياس شيء للنموذج.',
  'It leaves out the Auto usage that could not be measured. Auto discount received adds an estimate for that part, so the discounts of all models can add up to less than that card shows.':
    'يستبعد استخدام Auto الذي لم يمكن قياسه. ويضيف «خصم Auto المستلم» تقديرًا لذلك الجزء، لذلك قد يكون مجموع خصومات كل النماذج أقل مما تعرضه تلك البطاقة.',
  'Measured Auto usage of $900 against an original price of $1,000 is a discount of $100.':
    'استخدام Auto مقيس قدره 900 دولار مقابل سعر أصلي قدره 1,000 دولار يعني خصمًا قدره 100 دولار.',

  // Measured Auto discount rate of a model
  'Measured Auto discount rate of a model': 'نسبة خصم Auto المقيسة لنموذج',
  'The discount of a model as a share of the original price of its measured Auto usage.':
    'خصم النموذج كنسبة من السعر الأصلي لاستخدام Auto المقيس فيه.',
  'Rate = discount on the measured usage ÷ original price of the measured usage':
    'النسبة = الخصم على الاستخدام المقيس ÷ السعر الأصلي للاستخدام المقيس',
  'The rate of a plan needs at least $1 of measured usage and is held between 0% and 90%. The rate of a model has no minimum and no cap, so a model with little measured usage can show an unusual rate. Check the measured usage next to it.':
    'تحتاج نسبة الخطة إلى استخدام مقيس لا يقل عن 1 دولار وتُحصر بين 0% و90%. أما نسبة النموذج فليس لها حد أدنى ولا سقف، لذلك قد يعرض نموذج قليل الاستخدام المقيس نسبة غير معتادة. راجع الاستخدام المقيس بجانبها.',
  'The last row divides the total discount by the total original price of the measured usage. It shows a dash when nothing was measured.':
    'يقسم الصف الأخير إجمالي الخصم على إجمالي السعر الأصلي للاستخدام المقيس. ويعرض شَرطة عندما لا يُقاس شيء.',
  'A model with an original price of $1,000 for its measured usage and a discount of $100 has a rate of $100 ÷ $1,000 = 10%.':
    'النموذج الذي سعره الأصلي لاستخدامه المقيس 1,000 دولار وخصمه 100 دولار نسبته 100 ÷ 1,000 دولار = 10%.',
};

export default ar;
