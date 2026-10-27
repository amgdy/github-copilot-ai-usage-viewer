/** Arabic text for the Efficiency explanations (src/lib/metrics/docs/efficiency.ts). */
import type { Dict } from '../core';

const arabic: Dict = {
  // lever-model-shift
  "Powerful models have the highest token prices, and many requests do not need one. This lever estimates how much usage would go away if a share of the work on Powerful models ran on a mid-tier model of the same vendor. It is the first lever applied.":
    'للنماذج القوية أعلى أسعار للرموز، وكثير من الطلبات لا يحتاج إليها. يقدّر هذا التغيير مقدار الاستخدام الذي يختفي لو نُقلت حصة من العمل على النماذج القوية إلى نموذج من الفئة المتوسطة من المورّد نفسه. وهو أول تغيير يُطبَّق.',
  "Right-size models = share × sum over Powerful models of (usage of the model × (1 − cost of its tokens on the mid-tier model ÷ cost on the model))":
    'اختيار النموذج المناسب = الحصة × مجموع النماذج القوية لـ (استخدام النموذج × (1 − تكلفة رموزه على نموذج الفئة المتوسطة ÷ تكلفتها على النموذج))',
  "Take every model of the Powerful tier that has a price on the price card (or rates you set in Settings) and some usage.":
    'خذ كل نموذج من فئة النماذج القوية له سعر في قائمة الأسعار (أو أسعار حددتها في الإعدادات) وله بعض الاستخدام.',
  "Each one has a mid-tier target from the same vendor. Models from Moonshot, or from a vendor the app does not know, use Claude Sonnet 5.5. A model is skipped when it is its own target or when the target has no rates.":
    'لكل نموذج هدف من الفئة المتوسطة من المورّد نفسه. النماذج من Moonshot، أو من مورّد لا يعرفه التطبيق، تستخدم Claude Sonnet 5.5. يُتخطّى النموذج إذا كان هو هدف نفسه أو إذا لم تكن للهدف أسعار.',
  "Price the token counts of the model twice at the standard rates: on the model and on its target. Cost = (input × input rate + cache read × cache read rate + cache write × cache write rate + output × output rate) ÷ 1,000,000. Ratio = cost on the target ÷ cost on the model.":
    'سعّر أعداد رموز النموذج مرتين بالأسعار القياسية: على النموذج وعلى هدفه. التكلفة = (الإدخال × سعر الإدخال + القراءة من الذاكرة المؤقتة × سعرها + الكتابة في الذاكرة المؤقتة × سعرها + المخرجات × سعر المخرجات) ÷ 1,000,000. النسبة = التكلفة على الهدف ÷ التكلفة على النموذج.',
  "When the ratio is below 1, a full move saves the usage of the model × (1 − ratio). A target that is not cheaper adds nothing.":
    'إذا كانت النسبة أقل من 1، فإن النقل الكامل يوفر استخدام النموذج × (1 − النسبة). والهدف الذي ليس أرخص لا يضيف شيئًا.',
  "Add up the models and take the share. The default share is 30%. This is lever 1 of 6, so its saving counts in full.":
    'اجمع النماذج وخذ الحصة. الحصة الافتراضية 30%. هذا هو التغيير 1 من 6، لذا يُحسب توفيره كاملًا.',
  "It needs model names and token counts. Without a model column the lever is 0, and a Powerful model with no token counts gives no saving.":
    'يحتاج إلى أسماء النماذج وأعداد الرموز. بدون عمود النموذج تكون قيمة التغيير 0، والنموذج القوي الذي لا أعداد رموز له لا يعطي أي توفير.',
  "The usage of a model includes the Auto rows that ran on it and the rows without token counts. The ratio is measured on the tokens that are there and applied to all of the usage of the model.":
    'يشمل استخدام النموذج صفوف Auto التي عملت عليه والصفوف التي لا أعداد رموز فيها. تُقاس النسبة على الرموز الموجودة وتُطبَّق على كل استخدام النموذج.',
  "It compares standard rates only. It cannot tell whether a mid-tier model can do the work, so the 30% share is a guess at how much Powerful usage is routine.":
    'يقارن الأسعار القياسية فقط. لا يستطيع أن يعرف هل يقدر نموذج من الفئة المتوسطة على أداء العمل، لذا فحصة 30% تقدير لمقدار الاستخدام الروتيني على النماذج القوية.',
  "The amount is usage that would not occur, not cash. It lowers the bill only for usage above the included credits (see Savings potential).":
    'المبلغ استخدام لن يحدث، وليس نقدًا. لا يخفض الفاتورة إلا للاستخدام الذي يتجاوز الأرصدة المشمولة (انظر التوفير المحتمل).',
  "A Powerful model has $1,000 of usage. Its tokens would cost 40% as much on the mid-tier target, so a full move saves $1,000 × (1 − 0.4) = $600. At the default share of 30% the lever saves $180.":
    'لنموذج قوي استخدام قدره 1,000 دولار. تكلف رموزه 40% فقط على هدف الفئة المتوسطة، لذا يوفر النقل الكامل 1,000 دولار × (1 − 0.4) = 600 دولار. وبالحصة الافتراضية 30% يوفر التغيير 180 دولارًا.',

  // lever-auto
  "Auto lets GitHub Copilot choose the model for each request. Where the plan has an Auto discount, the same work costs less through Auto than on a model picked by hand. This lever estimates the discount that hand-picked usage would earn if a share of it went through Auto. It counts the discount only.":
    'يتيح Auto لـ GitHub Copilot أن يختار النموذج لكل طلب. وحيث تتضمن الخطة خصمًا لـ Auto، يكلف العمل نفسه عبر Auto أقل منه على نموذج مختار يدويًا. يقدّر هذا التغيير الخصم الذي يكسبه الاستخدام المختار يدويًا لو مرت حصة منه عبر Auto. ويحسب الخصم فقط.',
  "Use Auto model selection = share × sum over users of (hand-picked usage × Auto discount rate of the plan of the user)":
    'استخدام الاختيار التلقائي للنموذج (Auto) = الحصة × مجموع المستخدمين لـ (الاستخدام المختار يدويًا × نسبة خصم Auto في خطة المستخدم)',
  "For each user, hand-picked usage = usage − usage on Auto rows. Rows without a user name are left out, because they have no seat and no model to pick.":
    'لكل مستخدم، الاستخدام المختار يدويًا = الاستخدام − الاستخدام في صفوف Auto. تُستبعد الصفوف التي لا اسم مستخدم فيها، لأنه لا ترخيص لها ولا نموذج تختاره.',
  "Multiply it by the Auto discount rate of the plan of the user. The plan comes from the included credits of the seat. The rate is measured when the plan has at least $1 of Auto usage that could be priced from token counts (held between 0% and 90%). Otherwise it is the setting \"Auto model discount\", and the rate is shown as assumed.":
    'اضربه في نسبة خصم Auto في خطة المستخدم. تُعرف الخطة من الأرصدة المشمولة في الترخيص. تُقاس النسبة إذا كان في الخطة دولار واحد على الأقل من استخدام Auto يمكن تسعيره من أعداد الرموز (محصورة بين 0% و90%). وإلا فهي قيمة الإعداد «خصم نموذج Auto»، وتظهر النسبة على أنها مفترضة.',
  "Add up the users. This is the Discount missed on hand-picked usage.":
    'اجمع المستخدمين. هذا هو الخصم الفائت على الاستخدام المختار يدويًا.',
  "Take the share. The default share is 50%.": 'خذ الحصة. الحصة الافتراضية 50%.',
  "This is lever 2 of 6: its saving is scaled by (usage left after right-size models ÷ usage in the period).":
    'هذا هو التغيير 2 من 6: يُضرب توفيره في (الاستخدام الباقي بعد اختيار النموذج المناسب ÷ الاستخدام في الفترة).',
  "It is 0 when the file has no model names, because nothing can be told apart as hand-picked.":
    'تكون قيمته 0 إذا لم يكن في الملف أسماء نماذج، لأنه لا يمكن تمييز أي استخدام على أنه مختار يدويًا.',
  "A plan whose measured rate is 0% gives no saving. The report does not say why plans earn different rates, so none is assumed.":
    'الخطة التي نسبتها المقيسة 0% لا تعطي أي توفير. لا يذكر التقرير سبب اختلاف النسب بين الخطط، لذا لا تُفترض أي نسبة.',
  "It counts the discount only. It does not estimate a change in which model handles a request, so it can under- or overstate the full effect of switching.":
    'يحسب الخصم فقط. لا يقدّر تغيّر النموذج الذي يعالج الطلب، لذا قد يقلل الأثر الكامل للتحويل أو يبالغ فيه.',
  "Plan rates are measured on all users in the row filters, so a segment filter does not change them. The hand-picked usage does follow the segment.":
    'تُقاس نسب الخطط على كل المستخدمين ضمن عوامل تصفية الصفوف، لذا لا يغيّرها عامل تصفية الفئات. أما الاستخدام المختار يدويًا فيتبع الفئة.',
  "The amount is usage, not cash.": 'المبلغ استخدام، وليس نقدًا.',
  "Users hand-picked models for $2,000 of usage on a plan with a 10% Auto discount rate. The discount missed is $2,000 × 10% = $200, and at the default share of 50% the lever saves $100 on its own. Right-size models already removed $500 of $10,000 of usage, so the saving is $100 × $9,500 ÷ $10,000 = $95.":
    'اختار المستخدمون النماذج يدويًا لاستخدام قدره 2,000 دولار في خطة نسبة خصم Auto فيها 10%. الخصم الفائت 2,000 دولار × 10% = 200 دولار، وبالحصة الافتراضية 50% يوفر التغيير وحده 100 دولار. أزال اختيار النموذج المناسب من قبل 500 دولار من 10,000 دولار من الاستخدام، لذا يكون التوفير 100 دولار × 9,500 دولار ÷ 10,000 دولار = 95 دولارًا.',

  // lever-cache
  "Reading a prompt from the cache costs less than writing it. Staying on one model in one session keeps the cache warm, while switching models, resuming old threads or changing tools mid-session forces new cache writes. This lever estimates the saving if a share of the cache write tokens were cache reads instead.":
    'قراءة الطلب من الذاكرة المؤقتة أرخص من كتابته فيها. البقاء على نموذج واحد في جلسة واحدة يبقي الذاكرة المؤقتة جاهزة، أما تبديل النماذج أو استئناف محادثات قديمة أو تغيير الأدوات في منتصف الجلسة فيفرض كتابات جديدة في الذاكرة المؤقتة. يقدّر هذا التغيير التوفير لو كانت حصة من رموز الكتابة في الذاكرة المؤقتة قراءات منها بدلًا من ذلك.',
  "Cache discipline = share × sum over models of (cache write tokens × (cache write rate − cache read rate) × usage ÷ price-card cost of the model)":
    'الاستفادة من الذاكرة المؤقتة = الحصة × مجموع النماذج لـ (رموز الكتابة في الذاكرة المؤقتة × (سعر الكتابة − سعر القراءة) × الاستخدام ÷ تكلفة النموذج حسب قائمة الأسعار)',
  "For each model with a price and token counts, the saving of one token is the cache write rate − the cache read rate, at the standard rates. Models where a write is not more expensive than a read are skipped.":
    'لكل نموذج له سعر وأعداد رموز، توفير الرمز الواحد هو سعر الكتابة في الذاكرة المؤقتة − سعر القراءة منها، بالأسعار القياسية. تُتخطّى النماذج التي لا تكون فيها الكتابة أغلى من القراءة.',
  "Multiply it by the cache write tokens of the model.": 'اضربه في رموز الكتابة في الذاكرة المؤقتة للنموذج.',
  "Scale the result by (usage ÷ price-card cost) of the rows of the model that could be priced, so the amount matches what the report charged, for example after the Auto discount.":
    'اضرب النتيجة في (الاستخدام ÷ التكلفة حسب قائمة الأسعار) لصفوف النموذج التي أمكن تسعيرها، حتى يطابق المبلغ ما احتسبه التقرير، مثلًا بعد خصم Auto.',
  "Add up the models and take the share. The default share is 20%.": 'اجمع النماذج وخذ الحصة. الحصة الافتراضية 20%.',
  "This is lever 3 of 6: its saving is scaled by (usage left after the first two levers ÷ usage in the period).":
    'هذا هو التغيير 3 من 6: يُضرب توفيره في (الاستخدام الباقي بعد التغييرين الأولين ÷ الاستخدام في الفترة).',
  "It is 0 when the file has no cache write tokens, no model names or no token columns.":
    'تكون قيمته 0 إذا لم يكن في الملف رموز كتابة في الذاكرة المؤقتة أو أسماء نماذج أو أعمدة رموز.',
  "Some cache writes cannot be avoided, because a prompt is written the first time it is sent. The share is a guess at how many can be.":
    'لا يمكن تجنب بعض الكتابات في الذاكرة المؤقتة، لأن الطلب يُكتب أول مرة يُرسل فيها. والحصة تقدير لعدد ما يمكن تجنبه.',
  "It does not use the cache hit rate or the setting \"Low cache reuse below\". Those flag users. The lever sizes the saving for all usage.":
    'لا يستخدم نسبة القراءة من الذاكرة المؤقتة ولا الإعداد «استفادة قليلة من الذاكرة المؤقتة تحت». فهذان يميّزان المستخدمين، أما التغيير فيقدّر التوفير لكل الاستخدام.',
  "Rates are at the standard tier, so extra charges for very long prompts are not part of it. See Avoid long-context surcharges.":
    'الأسعار بالمستوى القياسي، لذا لا تدخل فيه الرسوم الإضافية للطلبات الطويلة جدًا. انظر تجنب رسوم السياق الطويل الإضافية.',
  "A model has 50 million cache write tokens. It charges $4.00 per million for cache writes and $0.40 per million for cache reads. If every write were a read, the saving would be 50 × ($4.00 − $0.40) = $180. At the default share of 20% the lever saves $36.":
    'لنموذج 50 مليون رمز كتابة في الذاكرة المؤقتة. يتقاضى 4.00 دولارات لكل مليون للكتابة و0.40 دولار لكل مليون للقراءة. لو كانت كل كتابة قراءة لكان التوفير 50 × (4.00 − 0.40 دولار) = 180 دولارًا. وبالحصة الافتراضية 20% يوفر التغيير 36 دولارًا.',

  // lever-context
  "Every request sends the conversation, the instructions and the tool descriptions again. Starting a fresh thread when the problem changes, compacting long sessions, trimming instruction files and enabling only the tools you need make the prompt smaller. This lever estimates the saving if the prompt side of the usage fell by a share.":
    'كل طلب يرسل المحادثة والتعليمات ووصف الأدوات من جديد. بدء محادثة جديدة عند تغيّر المشكلة، وضغط الجلسات الطويلة، وتقليص ملفات التعليمات، وتفعيل الأدوات التي تحتاج إليها فقط، كلها تجعل الطلب أصغر. يقدّر هذا التغيير التوفير لو انخفض جانب الطلب من الاستخدام بحصة ما.',
  "Leaner context = share × (cost of input tokens + cost of cache read tokens + cost of cache write tokens)":
    'سياق أخف = الحصة × (تكلفة رموز الإدخال + تكلفة رموز القراءة من الذاكرة المؤقتة + تكلفة رموز الكتابة في الذاكرة المؤقتة)',
  "Take the estimated cost of input, cache read and cache write tokens from the cost by token type.":
    'خذ التكلفة التقديرية لرموز الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها من التكلفة حسب نوع الرمز.',
  "Add the three. Output tokens are left out, because a smaller prompt does not make the answer shorter.":
    'اجمع الثلاثة. تُستبعد رموز المخرجات، لأن الطلب الأصغر لا يجعل الإجابة أقصر.',
  "Take the share. The default share is 10%.": 'خذ الحصة. الحصة الافتراضية 10%.',
  "This is lever 4 of 6: its saving is scaled by (usage left after the first three levers ÷ usage in the period).":
    'هذا هو التغيير 4 من 6: يُضرب توفيره في (الاستخدام الباقي بعد التغييرات الثلاثة الأولى ÷ الاستخدام في الفترة).',
  "It covers only the usage that could be priced from token counts, like the cost by token type. With a low token coverage the lever is understated.":
    'لا يغطي إلا الاستخدام الذي أمكن تسعيره من أعداد الرموز، مثل التكلفة حسب نوع الرمز. ومع تغطية رموز منخفضة يكون التغيير أقل من حقيقته.',
  "The same share applies to every prompt token, cached or not. It does not say which conversations, instruction files or tools carry the extra context.":
    'تُطبَّق الحصة نفسها على كل رمز في الطلب، سواء كان في الذاكرة المؤقتة أم لا. ولا يذكر أي المحادثات أو ملفات التعليمات أو الأدوات تحمل السياق الزائد.',
  "It overlaps with Cache discipline, which works on cache writes. The order takes care of the overlap: this lever works on what the first three leave.":
    'يتداخل مع الاستفادة من الذاكرة المؤقتة، الذي يعمل على الكتابات في الذاكرة المؤقتة. والترتيب يعالج هذا التداخل: يعمل هذا التغيير على ما تتركه التغييرات الثلاثة الأولى.',
  "The cost by token type shows $4,000 for input tokens, $3,000 for cache read tokens and $1,000 for cache write tokens, which is $8,000 for the prompt side. At the default share of 10% the lever saves $800 on its own.":
    'تُظهر التكلفة حسب نوع الرمز 4,000 دولار لرموز الإدخال و3,000 دولار لرموز القراءة من الذاكرة المؤقتة و1,000 دولار لرموز الكتابة فيها، أي 8,000 دولار لجانب الطلب. وبالحصة الافتراضية 10% يوفر التغيير وحده 800 دولار.',

  // lever-long-context
  "Some models charge more when a request sends a very long prompt. This lever estimates the saving if a share of those requests were shortened, by splitting the work, summarizing earlier steps and narrowing the files attached, so that they stay under the threshold of the model.":
    'بعض النماذج تتقاضى أكثر حين يرسل الطلب نصًا طويلًا جدًا. يقدّر هذا التغيير التوفير لو قُصّرت حصة من هذه الطلبات، بتقسيم العمل وتلخيص الخطوات السابقة وتقليل الملفات المرفقة، حتى تبقى تحت حد النموذج.',
  "Avoid long-context surcharges = share × long-context premium": 'تجنب رسوم السياق الطويل الإضافية = الحصة × علاوة السياق الطويل',
  "Take the long-context premium of the period: for rows above the long-context threshold of the model, the amount charged above the standard cost.":
    'خذ علاوة السياق الطويل في الفترة: للصفوف التي تتجاوز حد السياق الطويل للنموذج، المبلغ المحتسب فوق التكلفة القياسية.',
  "Take the share. The default share is 30%.": 'خذ الحصة. الحصة الافتراضية 30%.',
  "This is lever 5 of 6: its saving is scaled by (usage left after the first four levers ÷ usage in the period).":
    'هذا هو التغيير 5 من 6: يُضرب توفيره في (الاستخدام الباقي بعد التغييرات الأربعة الأولى ÷ الاستخدام في الفترة).',
  "The premium is a lower bound, because the app counts only what the price card can confirm. The lever can understate the saving.":
    'العلاوة حد أدنى، لأن التطبيق لا يحسب إلا ما تؤكده قائمة الأسعار. وقد يقدّر التغيير التوفير بأقل من حقيقته.',
  "It is 0 when the file has no model names or token counts.": 'تكون قيمته 0 إذا لم يكن في الملف أسماء نماذج أو أعداد رموز.',
  "The setting \"Long-context surcharges from\" flags users with a trait. It does not change this lever.":
    'الإعداد «رسوم إضافية للسياق الطويل من» يميّز المستخدمين بسمة. ولا يغيّر هذا التغيير.',
  "It does not say which requests can be shortened without losing the work.": 'لا يذكر أي الطلبات يمكن تقصيرها دون خسارة العمل.',
  "The long-context premium is $500 for the period. At the default share of 30% the lever saves $150 on its own. The first four levers already removed $1,000 of $10,000 of usage, so the saving is $150 × $9,000 ÷ $10,000 = $135.":
    'علاوة السياق الطويل 500 دولار في الفترة. وبالحصة الافتراضية 30% يوفر التغيير وحده 150 دولارًا. أزالت التغييرات الأربعة الأولى من قبل 1,000 دولار من 10,000 دولار من الاستخدام، لذا يكون التوفير 150 دولارًا × 9,000 دولار ÷ 10,000 دولار = 135 دولارًا.',

  // lever-cap
  "A few users can use many times their included credits. A user budget, a session limit for CLI work or coaching on cheaper workflows would hold their usage down. This lever estimates the saving from reducing the usage above 3 times the included credits of the user.":
    'قد يستخدم بعض المستخدمين أضعاف أرصدتهم المشمولة. ميزانية للمستخدم، أو حد للجلسة في عمل CLI، أو توجيه نحو طرق عمل أرخص، كلها تحدّ من استخدامهم. يقدّر هذا التغيير التوفير من خفض الاستخدام الذي يتجاوز 3 أضعاف الأرصدة المشمولة للمستخدم.',
  "Cap runaway users = share × sum over users above the line of (usage of the user − 3 × included credits of the user), valued at $0.01 per credit":
    'وضع حد للمستخدمين المفرطين = الحصة × مجموع المستخدمين فوق الخط لـ (استخدام المستخدم − 3 × الأرصدة المشمولة للمستخدم)، بقيمة 0.01 دولار لكل رصيد',
  "The included credits of a user are the credits of the seat in each month with usage, added up. When the file gives none for the user, the most common seat size is used for each of those months (1,900 credits when the file lists no seat size).":
    'الأرصدة المشمولة للمستخدم هي مجموع أرصدة الترخيص في كل شهر فيه استخدام. إذا لم يذكر الملف أي أرصدة للمستخدم، يُستخدم حجم الترخيص الأكثر شيوعًا لكل شهر من هذه الأشهر (1,900 رصيد إذا لم يذكر الملف أي حجم للترخيص).',
  "Multiply by $0.01 per credit to get the included credits in dollars. The line is 3 times that.":
    'اضرب في 0.01 دولار لكل رصيد لتحصل على الأرصدة المشمولة بالدولار. والخط 3 أضعاف ذلك.',
  "For each user above the line, the excess is usage of the user − the line.": 'لكل مستخدم فوق الخط، الزيادة = استخدام المستخدم − الخط.',
  "Add up the excess and take the share. The default share is 50%.": 'اجمع الزيادات وخذ الحصة. الحصة الافتراضية 50%.',
  "This is the last lever, 6 of 6: its saving is scaled by (usage left after the first five levers ÷ usage in the period).":
    'هذا هو التغيير الأخير، 6 من 6: يُضرب توفيره في (الاستخدام الباقي بعد التغييرات الخمسة الأولى ÷ الاستخدام في الفترة).',
  "The line of 3 times belongs to the savings plan. It does not follow the Settings tiers, although the runaway tier also starts at 3 times by default.":
    'خط الأضعاف الثلاثة جزء من خطة التوفير. ولا يتبع مستويات الإعدادات، مع أن المستوى المفرط يبدأ أيضًا عند 3 أضعاف افتراضيًا.',
  "It is a policy lever: the saving appears only when a budget, a limit or coaching is applied.":
    'هو تغيير يعتمد على السياسة: لا يظهر التوفير إلا عند تطبيق ميزانية أو حد أو توجيه.',
  "Rows without a username are left out, because they have no seat to compare with.":
    'تُستبعد الصفوف التي لا اسم مستخدم فيها، لأنه لا ترخيص لها للمقارنة به.',
  "It does not say whether the heavy usage was useful work.": 'لا يذكر هل كان الاستخدام الكثيف عملًا مفيدًا.',
  "The amount is usage, not cash. The pool is shared, so a heavy user costs cash only while the whole pool is exceeded.":
    'المبلغ استخدام، وليس نقدًا. الرصيد المشترك مشترك بين الجميع، لذا لا يكلف المستخدم الكثيف نقدًا إلا حين يُتجاوز الرصيد المشترك كله.',
  "A user has 1,900 included credits, which is $19, so the line is 3 × $19 = $57. Their usage is $100, which is $43 above the line. At the default share of 50% the lever saves $21.50 on its own.":
    'لمستخدم 1,900 رصيد مشمول، أي 19 دولارًا، لذا يكون الخط 3 × 19 دولارًا = 57 دولارًا. استخدامه 100 دولار، أي 43 دولارًا فوق الخط. وبالحصة الافتراضية 50% يوفر التغيير وحده 21.50 دولارًا.',

  // efficiency-score
  "Efficiency score": 'درجة الكفاءة',
  "How much of the usage of a user is left after the default habit changes. A score of 100 means the six levers find nothing to save. A lower score means more of the usage looks avoidable.":
    'مقدار ما يبقى من استخدام المستخدم بعد تغييرات العادات الافتراضية. الدرجة 100 تعني أن التغييرات الستة لا تجد ما توفره. والدرجة الأقل تعني أن جزءًا أكبر من الاستخدام يبدو قابلًا للتجنب.',
  "Efficiency score = 100 × (1 − potential savings ÷ usage of the user), held between 0 and 100":
    'درجة الكفاءة = 100 × (1 − التوفير المحتمل ÷ استخدام المستخدم)، محصورة بين 0 و100',
  "Potential savings are the six levers at their default strength, applied one after the other to the usage of the user.":
    'التوفير المحتمل هو التغييرات الستة بقوتها الافتراضية، تُطبَّق واحدًا بعد الآخر على استخدام المستخدم.',
  "The score is 100 × (1 − potential savings ÷ usage), held between 0 and 100. A user with no usage scores 100.":
    'الدرجة = 100 × (1 − التوفير المحتمل ÷ الاستخدام)، محصورة بين 0 و100. والمستخدم الذي لا استخدام له درجته 100.',
  "It is relative to the default levers. It does not measure how useful the work was, and two users with the same score can have done very different amounts of work.":
    'هي نسبية إلى التغييرات الافتراضية. لا تقيس مدى فائدة العمل، وقد ينجز مستخدمان لهما الدرجة نفسها مقدارين مختلفين جدًا من العمل.',
  "Levers that need model names or token counts find nothing when the file has none, so every user scores high. Check the token coverage before you read the score.":
    'التغييرات التي تحتاج إلى أسماء النماذج أو أعداد الرموز لا تجد شيئًا إذا خلا الملف منها، فيحصل كل مستخدم على درجة عالية. راجع تغطية الرموز قبل أن تقرأ الدرجة.',
  "It follows the selected period and the row filters. Segment filters change who is listed, not the score of a user.":
    'تتبع الفترة المحددة وعوامل تصفية الصفوف. عوامل تصفية الفئات تغيّر من يظهر في القائمة، لا درجة المستخدم.',
  "A user has $200 of usage and $50 of potential savings. Score = 100 × (1 − 50 ÷ 200) = 75.":
    'لمستخدم استخدام قدره 200 دولار وتوفير محتمل قدره 50 دولارًا. الدرجة = 100 × (1 − 50 ÷ 200) = 75.',

  // efficiency-scorecard
  "Six checks of the habits that decide how far included credits go: using Auto, reusing the prompt cache, keeping routine work off Powerful models, avoiding long-context surcharges, keeping users out of the runaway tier and using GitHub Copilot regularly. Each check shows a value, a target and a status.":
    'ستة فحوص للعادات التي تحدد إلى أي مدى تكفي الأرصدة المشمولة: استخدام Auto، وإعادة استخدام الذاكرة المؤقتة للطلبات، وإبعاد العمل الروتيني عن النماذج القوية، وتجنب رسوم السياق الطويل الإضافية، وإبقاء المستخدمين خارج المستوى المفرط، واستخدام GitHub Copilot بانتظام. يعرض كل فحص قيمة وهدفًا وحالة.',
  "Healthy checks = number of checks whose value meets its healthy limit, out of 6":
    'الفحوص الجيدة = عدد الفحوص التي تبلغ قيمتها حدها الجيد، من 6',
  "Each check measures one number for the usage and the users in view: the Auto share of usage, the cache hit rate, the share of usage on Powerful models, the long-context premium as a share of usage, the users in the runaway tier and the share of users with daily or regular use.":
    'يقيس كل فحص رقمًا واحدًا للاستخدام والمستخدمين المعروضين: حصة Auto من الاستخدام، ونسبة القراءة من الذاكرة المؤقتة، وحصة الاستخدام على النماذج القوية، وعلاوة السياق الطويل كحصة من الاستخدام، والمستخدمين في المستوى المفرط، وحصة المستخدمين ذوي الاستخدام اليومي أو المنتظم.',
  "The value is compared with two limits. Meeting the first limit gives Healthy, meeting only the second gives Could be better, and anything else gives Needs attention. Each check lists its own limits.":
    'تُقارن القيمة بحدّين. بلوغ الحد الأول يعطي «جيد»، وبلوغ الثاني فقط يعطي «يمكن تحسينه»، وأي شيء غير ذلك يعطي «يحتاج إلى اهتمام». ويذكر كل فحص حدوده.',
  "A check is Not measured when the file lacks the columns it needs. It does not count as healthy, and a line beside the count says how many checks could not be measured.":
    'يكون الفحص «غير مقيس» إذا خلا الملف من الأعمدة التي يحتاج إليها. ولا يُحسب جيدًا، ويذكر سطر بجانب العدد كم فحصًا تعذّر قياسه.',
  "The top line counts the Healthy checks out of six.": 'يعدّ السطر العلوي الفحوص الجيدة من ستة.',
  "The limits are guidance fixed in the app. They are not Settings. The Settings thresholds sort single users, while the checks judge the whole view.":
    'الحدود إرشادات ثابتة في التطبيق، وليست من الإعدادات. حدود الإعدادات تصنّف المستخدمين أفرادًا، أما الفحوص فتقيّم العرض كله.',
  "Under a check, a button opens the Users page filtered to the users behind it, for example the users who rarely use Auto. The number on the button counts users by the Settings thresholds, not by the limits of the check, so it can show users even when the check is Healthy.":
    'تحت كل فحص زر يفتح صفحة المستخدمين مصفّاة على المستخدمين المعنيين، مثل المستخدمين الذين نادرًا ما يستخدمون Auto. يعدّ الرقم على الزر المستخدمين حسب حدود الإعدادات، لا حسب حدود الفحص، لذا قد يُظهر مستخدمين حتى حين يكون الفحص جيدًا.',
  "A status is a prompt to look closer, not a finding that something is wrong. A high Powerful share can be right for hard work, and a low Auto share can be a choice.":
    'الحالة دعوة إلى النظر عن قرب، وليست حكمًا بأن شيئًا خاطئ. قد تكون حصة النماذج القوية العالية مناسبة للعمل الصعب، وقد تكون حصة Auto المنخفضة اختيارًا.',
  "Four checks are Healthy and two Could be better. The top line reads 4 of 6 checks are healthy.":
    'أربعة فحوص جيدة واثنان يمكن تحسينهما. يقول السطر العلوي إن 4 من 6 فحوص جيدة.',

  // scorecard-auto
  "Auto share check": 'فحص حصة Auto',
  "Whether enough usage goes through Auto. Auto picks the model for each request, and where the plan has an Auto discount the same work costs less.":
    'هل يمر عبر Auto ما يكفي من الاستخدام. يختار Auto النموذج لكل طلب، وحيث تتضمن الخطة خصمًا لـ Auto يكلف العمل نفسه أقل.',
  "Status = Healthy at an Auto share of usage of 25% or more, Could be better from 10% up to 25%, otherwise Needs attention":
    'الحالة = جيد عند حصة Auto من الاستخدام 25% أو أكثر، ويمكن تحسينه من 10% حتى 25%، وإلا يحتاج إلى اهتمام',
  "The value is the Auto share of usage: usage on Auto rows ÷ usage in view.":
    'القيمة هي حصة Auto من الاستخدام: الاستخدام في صفوف Auto ÷ الاستخدام المعروض.',
  "Healthy at 25% or more. Could be better from 10% up to 25%. Needs attention below 10%.":
    'جيد عند 25% أو أكثر. يمكن تحسينه من 10% حتى 25%. يحتاج إلى اهتمام تحت 10%.',
  "Not measured when the file has no model names or the view has no usage.":
    'غير مقيس إذا لم يكن في الملف أسماء نماذج أو لم يكن في العرض استخدام.',
  "The limits are fixed in the app. They are not the settings \"Rarely uses Auto below\" and \"Auto first from\", which sort single users.":
    'الحدود ثابتة في التطبيق. وليست الإعدادين «نادرًا ما يستخدم Auto تحت» و«يعتمد على Auto من»، اللذين يصنّفان المستخدمين أفرادًا.',
  "Auto does not suit every task, so a low share can be a choice. The button under the check lists the users who rarely use Auto.":
    'لا يناسب Auto كل مهمة، لذا قد تكون الحصة المنخفضة اختيارًا. يعرض الزر تحت الفحص المستخدمين الذين نادرًا ما يستخدمون Auto.',
  "Usage of $10,000 with $3,000 on Auto rows is an Auto share of 30%, which is Healthy.":
    'استخدام قدره 10,000 دولار منه 3,000 دولار في صفوف Auto يعني حصة Auto قدرها 30%، وهي جيدة.',

  // scorecard-cache
  "Cache hit rate check": 'فحص نسبة القراءة من الذاكرة المؤقتة',
  "Whether prompts are mostly read from the cache. Cached prompt tokens cost less than new input tokens, so a steady session is cheaper than a restarted one.":
    'هل تُقرأ الطلبات في الغالب من الذاكرة المؤقتة. رموز الطلب المحفوظة في الذاكرة المؤقتة أرخص من رموز الإدخال الجديدة، لذا فالجلسة المستقرة أرخص من جلسة أُعيد بدؤها.',
  "Status = Healthy at a cache hit rate of 60% or more, Could be better from 30% up to 60%, otherwise Needs attention":
    'الحالة = جيد عند نسبة قراءة من الذاكرة المؤقتة 60% أو أكثر، ويمكن تحسينه من 30% حتى 60%، وإلا يحتاج إلى اهتمام',
  "The value is the cache hit rate of all usage in view: cache read ÷ (input + cache read + cache write).":
    'القيمة هي نسبة القراءة من الذاكرة المؤقتة لكل الاستخدام المعروض: القراءة من الذاكرة المؤقتة ÷ (الإدخال + القراءة من الذاكرة المؤقتة + الكتابة فيها).',
  "Healthy at 60% or more. Could be better from 30% up to 60%. Needs attention below 30%.":
    'جيد عند 60% أو أكثر. يمكن تحسينه من 30% حتى 60%. يحتاج إلى اهتمام تحت 30%.',
  "Not measured when the file has no token columns or the view has no prompt tokens.":
    'غير مقيس إذا لم يكن في الملف أعمدة رموز أو لم يكن في العرض رموز طلبات.',
  "The limits are fixed in the app. They are not the setting \"Low cache reuse below\", which flags single users.":
    'الحدود ثابتة في التطبيق. وليست الإعداد «استفادة قليلة من الذاكرة المؤقتة تحت»، الذي يميّز المستخدمين أفرادًا.',
  "It is one rate for all tokens, so heavy users weigh more than light users. The chart of users by cache hit rate counts users instead.":
    'هي نسبة واحدة لكل الرموز، لذا يزن المستخدمون الكثيفون أكثر من الخفيفين. أما مخطط المستخدمين حسب نسبة القراءة من الذاكرة المؤقتة فيعدّ المستخدمين.',
  "The button under the check lists the users with the trait Low cache reuse. It appears only when the file has token columns and at least one user has the trait.":
    'يعرض الزر تحت الفحص المستخدمين الذين لهم سمة «استفادة قليلة من الذاكرة المؤقتة». ولا يظهر إلا إذا كان في الملف أعمدة رموز وكان لمستخدم واحد على الأقل هذه السمة.',
  "700 million cache read tokens out of 1,000 million prompt tokens is a cache hit rate of 70%, which is Healthy.":
    '700 مليون رمز قراءة من الذاكرة المؤقتة من أصل 1,000 مليون رمز طلب تعني نسبة قراءة من الذاكرة المؤقتة قدرها 70%، وهي جيدة.',

  // scorecard-powerful
  "Powerful model share check": 'فحص حصة النماذج القوية',
  "Whether routine work stays off Powerful models. Powerful models cost the most per token, and most everyday tasks do not need them. Lower is better.":
    'هل يبقى العمل الروتيني بعيدًا عن النماذج القوية. النماذج القوية هي الأغلى لكل رمز، ومعظم المهام اليومية لا تحتاج إليها. الأقل أفضل.',
  "Status = Healthy at a Powerful share of usage under 40%, Could be better up to 70%, otherwise Needs attention":
    'الحالة = جيد عند حصة استخدام للنماذج القوية أقل من 40%، ويمكن تحسينه حتى 70%، وإلا يحتاج إلى اهتمام',
  "The value is the Powerful share of usage: usage on rows whose model is in the Powerful tier ÷ usage in view.":
    'القيمة هي حصة النماذج القوية من الاستخدام: الاستخدام في الصفوف التي نموذجها من فئة النماذج القوية ÷ الاستخدام المعروض.',
  "Healthy below 40%. Could be better from 40% up to 70%. Needs attention above 70%.":
    'جيد تحت 40%. يمكن تحسينه من 40% حتى 70%. يحتاج إلى اهتمام فوق 70%.',
  "A high share is not wrong when the work needs hard reasoning. It shows where to look.":
    'الحصة العالية ليست خطأ حين يحتاج العمل إلى تفكير صعب. إنها تبيّن أين تنظر.',
  "Rows that went through Auto count under the model that Auto picked. Models that are not on the price card are Unknown, not Powerful, until you give them a tier.":
    'تُحسب الصفوف التي مرت عبر Auto تحت النموذج الذي اختاره Auto. والنماذج غير الموجودة في قائمة الأسعار تُعدّ غير معروفة، لا قوية، حتى تعطيها فئة.',
  "The limits are fixed in the app. They are not the setting \"Frontier-heavy from\", which sorts single users.":
    'الحدود ثابتة في التطبيق. وليست الإعداد «يعتمد على النماذج القوية من»، الذي يصنّف المستخدمين أفرادًا.',
  "The button under the check lists the users with the model profile Frontier-heavy.":
    'يعرض الزر تحت الفحص المستخدمين الذين ملف نماذجهم «يعتمد على النماذج القوية».',
  "$4,500 of $10,000 of usage on Powerful models is a share of 45%, which is Could be better.":
    '4,500 دولار من 10,000 دولار من الاستخدام على النماذج القوية تعني حصة قدرها 45%، وهي يمكن تحسينها.',

  // scorecard-long-context
  "Long-context premium check": 'فحص علاوة السياق الطويل',
  "Whether prompts stay below the long-context thresholds of the models. Prompts above a threshold are charged at a higher rate. Lower is better.":
    'هل تبقى الطلبات تحت حدود السياق الطويل للنماذج. الطلبات التي تتجاوز الحد تُحتسب بسعر أعلى. الأقل أفضل.',
  "Status = Healthy at a long-context premium under 2% of usage, Could be better up to 8%, otherwise Needs attention":
    'الحالة = جيد عند علاوة سياق طويل أقل من 2% من الاستخدام، ويمكن تحسينه حتى 8%، وإلا يحتاج إلى اهتمام',
  "The value is the long-context premium ÷ usage in view.": 'القيمة هي علاوة السياق الطويل ÷ الاستخدام المعروض.',
  "Healthy below 2%. Could be better from 2% up to 8%. Needs attention above 8%.":
    'جيد تحت 2%. يمكن تحسينه من 2% حتى 8%. يحتاج إلى اهتمام فوق 8%.',
  "Not measured when the file has no token columns or model names, or when no usage in view could be priced from token counts.":
    'غير مقيس إذا لم يكن في الملف أعمدة رموز أو أسماء نماذج، أو إذا لم يمكن تسعير أي استخدام معروض من أعداد الرموز.',
  "The premium is a lower bound, so the real share can be higher than the check shows.":
    'العلاوة حد أدنى، لذا قد تكون الحصة الحقيقية أعلى مما يُظهره الفحص.',
  "The limits are fixed in the app. They are not the setting \"Long-context surcharges from\", which flags single users.":
    'الحدود ثابتة في التطبيق. وليست الإعداد «رسوم إضافية للسياق الطويل من»، الذي يميّز المستخدمين أفرادًا.',
  "The button under the check lists the users with the trait Long-context surcharges.":
    'يعرض الزر تحت الفحص المستخدمين الذين لهم سمة «رسوم إضافية للسياق الطويل».',
  "$300 of long-context premium on $10,000 of usage is 3%, which is Could be better.":
    '300 دولار علاوة سياق طويل على استخدام قدره 10,000 دولار تعني 3%، وهي يمكن تحسينها.',

  // scorecard-runaway
  "Runaway users check": 'فحص المستخدمين المفرطين',
  "Whether anyone uses far more than their own included credits. One user far beyond their credits can drain the shared pool for everybody.":
    'هل يستخدم أحد أكثر بكثير من أرصدته المشمولة. مستخدم واحد يتجاوز أرصدته بكثير قد يستنزف الرصيد المشترك على الجميع.',
  "Status = Healthy when no user is in the runaway tier, Could be better when 5% of users or fewer are, otherwise Needs attention":
    'الحالة = جيد إذا لم يكن أي مستخدم في المستوى المفرط، ويمكن تحسينه إذا كان فيه 5% من المستخدمين أو أقل، وإلا يحتاج إلى اهتمام',
  "The value is the number of users in the runaway tier: users whose usage is above the top Spend tier limit of their own included credits (300% by default).":
    'القيمة هي عدد المستخدمين في المستوى المفرط: المستخدمون الذين يتجاوز استخدامهم أعلى حد في مستويات الإنفاق من أرصدتهم المشمولة (300% افتراضيًا).',
  "The line under the value shows that number as a share of all users in view.":
    'يعرض السطر تحت القيمة هذا العدد كحصة من كل المستخدمين المعروضين.',
  "Healthy with none. Could be better when the share is 5% or less. Needs attention above 5%.":
    'جيد إذا لم يكن أحد. يمكن تحسينه إذا كانت الحصة 5% أو أقل. يحتاج إلى اهتمام فوق 5%.',
  "Not measured when the view has no users.": 'غير مقيس إذا لم يكن في العرض مستخدمون.',
  "It counts users, not usage. A user at 5 times the included credits counts as one.":
    'يعدّ المستخدمين، لا الاستخدام. المستخدم الذي يبلغ 5 أضعاف أرصدته المشمولة يُحسب واحدًا.',
  "A user without a seat size in the file is measured against the most common seat size.":
    'المستخدم الذي لا حجم ترخيص له في الملف يُقاس على حجم الترخيص الأكثر شيوعًا.',
  "The limit of 5% of users is fixed in the app.": 'حد 5% من المستخدمين ثابت في التطبيق.',
  "The button under the check lists the users in the runaway tier.": 'يعرض الزر تحت الفحص المستخدمين في المستوى المفرط.',
  "3 of 100 users are in the runaway tier. That is 3%, which is Could be better.":
    '3 من 100 مستخدم في المستوى المفرط. أي 3%، وهي يمكن تحسينها.',

  // scorecard-active-use
  "Active use check": 'فحص الاستخدام النشط',
  "Whether most users work with GitHub Copilot on a regular basis. A seat only pays off when it is used often, and daily users get the most from their included credits.":
    'هل يعمل معظم المستخدمين مع GitHub Copilot بانتظام. لا يؤتي الترخيص ثمره إلا حين يُستخدم كثيرًا، والمستخدمون اليوميون يستفيدون أكثر من أرصدتهم المشمولة.',
  "Status = Healthy when 50% or more of users have daily or regular use, Could be better from 25% up to 50%, otherwise Needs attention":
    'الحالة = جيد إذا كان 50% أو أكثر من المستخدمين ذوي استخدام يومي أو منتظم، ويمكن تحسينه من 25% حتى 50%، وإلا يحتاج إلى اهتمام',
  "Each user has an engagement level that comes from the share of workdays on which the user was active. The value is users with Daily or Regular engagement ÷ all users in view.":
    'لكل مستخدم مستوى تفاعل يأتي من حصة أيام العمل التي كان فيها نشطًا. القيمة هي المستخدمون ذوو التفاعل اليومي أو المنتظم ÷ كل المستخدمين المعروضين.',
  "Healthy at 50% or more. Could be better from 25% up to 50%. Needs attention below 25%.":
    'جيد عند 50% أو أكثر. يمكن تحسينه من 25% حتى 50%. يحتاج إلى اهتمام تحت 25%.',
  "The levels Daily and Regular come from the setting Engagement. A day counts as active when usage reaches the active-day threshold.":
    'المستويان «يومي» و«منتظم» يأتيان من إعداد «التفاعل». ويُعدّ اليوم نشطًا حين يبلغ الاستخدام حد اليوم النشط.',
  "The limits of 50% and 25% are fixed in the app.": 'حدّا 50% و25% ثابتان في التطبيق.',
  "The button under the check lists the users with Occasional or Rare engagement.":
    'يعرض الزر تحت الفحص المستخدمين ذوي التفاعل المتقطع أو النادر.',
  "45 of 100 users have daily or regular use. That is 45%, which is Could be better.":
    '45 من 100 مستخدم لهم استخدام يومي أو منتظم. أي 45%، وهي يمكن تحسينها.',

  // habits-usage-reduction
  "How much less usage the default habit changes would produce, as a share of all usage and as an amount per month. It is a reduction of usage, not of the bill.":
    'مقدار الاستخدام الذي ينخفض بتغييرات العادات الافتراضية، كحصة من كل الاستخدام وكمبلغ شهري. هو خفض للاستخدام، لا للفاتورة.',
  "Usage reduction = usage saved by the six levers ÷ usage in the period; per month = usage saved × 30.4375 ÷ days in the period":
    'خفض الاستخدام = الاستخدام الذي توفره التغييرات الستة ÷ الاستخدام في الفترة؛ وشهريًا = الاستخدام الموفَّر × 30.4375 ÷ أيام الفترة',
  "The six levers are applied one after the other to the usage in view, in the order of the chart. Each works on what the earlier ones leave, so nothing is counted twice. The sum of their savings is the usage saved.":
    'تُطبَّق التغييرات الستة واحدًا بعد الآخر على الاستخدام المعروض، بترتيب المخطط. يعمل كل منها على ما تتركه التغييرات السابقة، لذا لا يُحسب شيء مرتين. ومجموع توفيرها هو الاستخدام الموفَّر.',
  "The percentage is the usage saved ÷ the usage in the period, at most 100%.":
    'النسبة المئوية هي الاستخدام الموفَّر ÷ الاستخدام في الفترة، بحد أقصى 100%.',
  "The amount per month is the usage saved × 30.4375 ÷ the days in the period. 30.4375 is the average number of days in a month.":
    'المبلغ الشهري هو الاستخدام الموفَّر × 30.4375 ÷ أيام الفترة. و30.4375 هو متوسط عدد الأيام في الشهر.',
  "The levers use their default shares: 30%, 50%, 20%, 10%, 30% and 50%. The simulator on the Recommendations page lets you try others. This page always uses the defaults.":
    'تستخدم التغييرات حصصها الافتراضية: 30% و50% و20% و10% و30% و50%. يتيح لك المحاكي في صفحة التوصيات تجربة غيرها. أما هذه الصفحة فتستخدم القيم الافتراضية دائمًا.',
  "It follows the filters in view, so with a segment filter it covers only the usage of that segment.":
    'يتبع عوامل التصفية المعروضة، لذا مع عامل تصفية فئة لا يغطي إلا استخدام تلك الفئة.',
  "It does not say whether the habits are realistic for your team or how soon they would show.":
    'لا يذكر هل العادات واقعية لفريقك أو متى يظهر أثرها.',
  "Usage of $10,000 and $1,500 saved by the levers is a usage reduction of 15%. Over 61 days that is $1,500 × 30.4375 ÷ 61 = about $748 per month.":
    'استخدام قدره 10,000 دولار وتوفير قدره 1,500 دولار من التغييرات يعني خفضًا للاستخدام بنسبة 15%. وعلى مدى 61 يومًا يكون ذلك 1,500 دولار × 30.4375 ÷ 61 = نحو 748 دولارًا شهريًا.',

  // habits-cash-saving
  "The part of the usage reduction that would lower the bill. Included credits cover usage up to the size of the pool, so only usage above the pool turns into cash. Seat changes are not part of this number.":
    'الجزء من خفض الاستخدام الذي يخفض الفاتورة. تغطي الأرصدة المشمولة الاستخدام حتى حجم الرصيد المشترك، لذا لا يتحول إلى نقد إلا الاستخدام الذي يتجاوز الرصيد المشترك. ولا تدخل تغييرات التراخيص في هذا الرقم.',
  "Cash saving per month = average over the months of (max(pool size, usage) − max(pool size, usage × (1 − usage reduction)))":
    'التوفير النقدي الشهري = متوسط الأشهر لـ (الأكبر(حجم الرصيد المشترك، الاستخدام) − الأكبر(حجم الرصيد المشترك، الاستخدام × (1 − خفض الاستخدام)))',
  "Take each billing month. Cost before = the larger of the pool size and the usage of the month. The month in progress uses its projected usage.":
    'خذ كل شهر فوترة. التكلفة قبل = الأكبر بين حجم الرصيد المشترك واستخدام الشهر. ويستخدم الشهر الجاري استخدامه المتوقع.',
  "Usage after = usage × (1 − usage reduction). Cost after = the larger of the pool size and usage after.":
    'الاستخدام بعد = الاستخدام × (1 − خفض الاستخدام). التكلفة بعد = الأكبر بين حجم الرصيد المشترك والاستخدام بعد.',
  "The saving of the month = cost before − cost after. The number is the average over the months.":
    'توفير الشهر = التكلفة قبل − التكلفة بعد. والرقم هو المتوسط على الأشهر.',
  "When seat actions exist, the line under the number adds them. That figure is the Savings potential.":
    'إذا وُجدت إجراءات على التراخيص، يضيفها السطر تحت الرقم. وهذا الرقم هو التوفير المحتمل.',
  "Using less saves cash only while usage is above the pool. In a month with usage below the pool the seats are already paid for, and the saving is 0.":
    'لا يوفر الاستخدام الأقل نقدًا إلا ما دام الاستخدام فوق الرصيد المشترك. وفي شهر يقل فيه الاستخدام عن الرصيد المشترك تكون التراخيص مدفوعة أصلًا، والتوفير 0.',
  "A star means the pool counts only the seats that appear in the report. A seat that never used GitHub Copilot is not in the file, so the real pool can be larger. Then the real cash saving is smaller than shown.":
    'تعني النجمة أن الرصيد المشترك لا يحسب إلا التراخيص الظاهرة في التقرير. الترخيص الذي لم يستخدم GitHub Copilot قط ليس في الملف، لذا قد يكون الرصيد المشترك الحقيقي أكبر. وعندها يكون التوفير النقدي الحقيقي أصغر مما يظهر.',
  "When a month used more included credits than the visible seats provide, the smallest pool that fits the data is used for that month.":
    'إذا استخدم شهر أرصدة مشمولة أكثر مما توفره التراخيص الظاهرة، يُستخدم لذلك الشهر أصغر رصيد مشترك يتوافق مع البيانات.',
  "It is hidden when a row or segment filter narrows the data, because included credits are shared by everyone, and when the file has no billing month.":
    'يُخفى إذا ضيّق عامل تصفية صفوف أو فئات البيانات، لأن الأرصدة المشمولة مشتركة بين الجميع، وكذلك إذا لم يكن في الملف شهر فوترة.',
  "The pool is $9,600 and usage is $10,500, with a usage reduction of 15%. Cost before = $10,500. Usage after = $10,500 × 0.85 = $8,925, so cost after = max($9,600, $8,925) = $9,600. The cash saving is $900, although usage fell by $1,575.":
    'الرصيد المشترك 9,600 دولار والاستخدام 10,500 دولار، مع خفض للاستخدام بنسبة 15%. التكلفة قبل = 10,500 دولار. الاستخدام بعد = 10,500 دولار × 0.85 = 8,925 دولارًا، لذا التكلفة بعد = الأكبر(9,600 دولار، 8,925 دولارًا) = 9,600 دولار. التوفير النقدي 900 دولار، مع أن الاستخدام انخفض بمقدار 1,575 دولارًا.',

  // habits-unused-today
  "The included credits that nobody used, on average per month. The seats bring the credits with them, and credits left at the end of the month are lost.":
    'الأرصدة المشمولة التي لم يستخدمها أحد، في المتوسط شهريًا. تأتي الأرصدة مع التراخيص، والأرصدة الباقية في نهاية الشهر تضيع.',
  "Unused included credits = average over the months of max(0, pool size − usage)":
    'الأرصدة المشمولة غير المستخدمة = متوسط الأشهر لـ الأكبر(0، حجم الرصيد المشترك − الاستخدام)',
  "For each billing month, unused = pool size − usage of the month, or 0 when usage reached the pool. The month in progress uses its projected usage.":
    'لكل شهر فوترة، غير المستخدم = حجم الرصيد المشترك − استخدام الشهر، أو 0 إذا بلغ الاستخدام الرصيد المشترك. ويستخدم الشهر الجاري استخدامه المتوقع.',
  "The number is the average over the months. It is the same idea as Included credits left, worked out for each month.":
    'الرقم هو المتوسط على الأشهر. وهو الفكرة نفسها التي تقوم عليها الأرصدة المشمولة المتبقية، محسوبة لكل شهر.',
  "A star means the pool counts only the seats that appear in the report. The real pool can be larger, and then more credits are unused.":
    'تعني النجمة أن الرصيد المشترك لا يحسب إلا التراخيص الظاهرة في التقرير. قد يكون الرصيد المشترك الحقيقي أكبر، وعندها تكون الأرصدة غير المستخدمة أكثر.',
  "It is hidden when a row or segment filter narrows the data, and when the file has no billing month.":
    'يُخفى إذا ضيّق عامل تصفية صفوف أو فئات البيانات، وإذا لم يكن في الملف شهر فوترة.',
  "Unused credits are not a refund. They show how much room the seats leave.":
    'الأرصدة غير المستخدمة ليست مبلغًا مستردًا. إنها تبيّن مقدار المساحة التي تتركها التراخيص.',
  "A pool of $9,600 and usage of $8,000 leave $1,600 unused in a month. In another month usage is $11,000 and nothing is unused. The average over the two months is $800.":
    'رصيد مشترك قدره 9,600 دولار واستخدام قدره 8,000 دولار يتركان 1,600 دولار غير مستخدمة في شهر. وفي شهر آخر يبلغ الاستخدام 11,000 دولار ولا يبقى شيء. والمتوسط على الشهرين 800 دولار.',

  // habits-unused-after
  "The included credits that would stay unused each month after the habit changes, if the number of seats stays the same. Using less leaves more of the pool unused, so the cash saving is smaller than the usage reduction.":
    'الأرصدة المشمولة التي ستبقى غير مستخدمة كل شهر بعد تغييرات العادات، إذا بقي عدد التراخيص كما هو. الاستخدام الأقل يترك جزءًا أكبر من الرصيد المشترك دون استخدام، لذا يكون التوفير النقدي أصغر من خفض الاستخدام.',
  "Unused after the change = average over the months of max(0, pool size − usage × (1 − usage reduction))":
    'غير المستخدم بعد التغيير = متوسط الأشهر لـ الأكبر(0، حجم الرصيد المشترك − الاستخدام × (1 − خفض الاستخدام))',
  "For each billing month, usage after = usage × (1 − usage reduction). Unused after = pool size − usage after, or 0 when usage after reaches the pool.":
    'لكل شهر فوترة، الاستخدام بعد = الاستخدام × (1 − خفض الاستخدام). غير المستخدم بعد = حجم الرصيد المشترك − الاستخدام بعد، أو 0 إذا بلغ الاستخدام بعد الرصيد المشترك.',
  "The number is the average over the months. The line under it shows how much more is unused than today. The number turns amber when the increase is $0.50 or more.":
    'الرقم هو المتوسط على الأشهر. يبيّن السطر تحته كم يزيد غير المستخدم عن اليوم. ويتحول الرقم إلى اللون الكهرماني إذا كانت الزيادة 0.50 دولار أو أكثر.',
  "It shows why using less does not lower the bill by itself: the seats are already paid for. Fewer seats lower the cost, and the Recommendations page shows both effects together.":
    'يبيّن لماذا لا يخفض الاستخدام الأقل الفاتورة وحده: التراخيص مدفوعة أصلًا. التراخيص الأقل هي التي تخفض التكلفة، وتعرض صفحة التوصيات الأثرين معًا.',
  "A star, the hidden cases and the pool limits are the same as for Unused included credits today.":
    'النجمة وحالات الإخفاء وحدود الرصيد المشترك هي نفسها كما في الأرصدة المشمولة غير المستخدمة اليوم.',
  "A pool of $9,600 and usage of $8,000 leave $1,600 unused. After a usage reduction of 15% usage is $6,800 and $2,800 is unused, which is $1,200 more than today.":
    'رصيد مشترك قدره 9,600 دولار واستخدام قدره 8,000 دولار يتركان 1,600 دولار غير مستخدمة. بعد خفض الاستخدام بنسبة 15% يصبح الاستخدام 6,800 دولار ويبقى 2,800 دولار غير مستخدمة، أي أكثر من اليوم بمقدار 1,200 دولار.',

  // habits-waterfall
  "The usage reduction split by habit. Each bar is one lever of the savings plan, and the last bar is the combined effect. The amounts are usage per month, not cash.":
    'خفض الاستخدام مقسّمًا حسب العادة. كل شريط تغيير واحد من خطة التوفير، والشريط الأخير هو الأثر المجمّع. المبالغ استخدام شهري، وليست نقدًا.',
  "Bar of a habit = saving of the lever after the levers above it × 30.4375 ÷ days in the period; combined effect = sum of the bars":
    'شريط العادة = توفير التغيير بعد التغييرات التي فوقه × 30.4375 ÷ أيام الفترة؛ الأثر المجمّع = مجموع الأشرطة',
  "The six levers run in the order shown, from top to bottom. Each lever works on what the ones above it leave: its saving = its saving on its own × (usage left ÷ usage in the period).":
    'تعمل التغييرات الستة بالترتيب المعروض، من الأعلى إلى الأسفل. يعمل كل تغيير على ما تتركه التغييرات التي فوقه: توفيره = توفيره وحده × (الاستخدام الباقي ÷ الاستخدام في الفترة).',
  "Each bar starts where the bar above it ends, so the bars add up to the combined effect, which is the usage reduction per month.":
    'يبدأ كل شريط حيث ينتهي الشريط الذي فوقه، لذا تصل الأشرطة مجتمعة إلى الأثر المجمّع، وهو خفض الاستخدام الشهري.',
  "The tooltip of a bar shows the saving after the levers above it and the saving on its own, which is what the lever would give if it were the only one.":
    'يعرض تلميح الشريط التوفير بعد التغييرات التي فوقه والتوفير وحده، أي ما يعطيه التغيير لو كان التغيير الوحيد.',
  "A lever lower in the list shows less than its saving on its own, because the levers above it already took part of the usage. The order changes how the overlap is shared between the bars, not the combined effect.":
    'التغيير الأدنى في القائمة يُظهر أقل من توفيره وحده، لأن التغييرات التي فوقه أخذت جزءًا من الاستخدام. الترتيب يغيّر كيفية توزيع التداخل بين الأشرطة، لا الأثر المجمّع.',
  "A lever that needs model names or token counts shows 0 when the file has none.":
    'التغيير الذي يحتاج إلى أسماء النماذج أو أعداد الرموز يُظهر 0 إذا خلا الملف منها.',
  "The default shares are used. The simulator on the Recommendations page lets you change them.":
    'تُستخدم الحصص الافتراضية. ويتيح لك المحاكي في صفحة التوصيات تغييرها.',
  "Usage is $10,000. Right-size models saves $500 and Use Auto model selection saves $100 on its own. In the order shown the bars are $500 and $100 × $9,500 ÷ $10,000 = $95, so the combined effect is $595. The two overlap, so it is less than $600.":
    'الاستخدام 10,000 دولار. يوفر اختيار النموذج المناسب 500 دولار، ويوفر استخدام الاختيار التلقائي للنموذج (Auto) وحده 100 دولار. بالترتيب المعروض يكون الشريطان 500 دولار و100 دولار × 9,500 دولار ÷ 10,000 دولار = 95 دولارًا، لذا يكون الأثر المجمّع 595 دولارًا. يتداخل التغييران، لذا يكون أقل من 600 دولار.',

  // habits-cash-vs-credit
  "An explanation of the gap between the usage reduction and the cash saving. Included credits are pooled across all seats and reset every month, so using less saves cash only in months when usage goes beyond the pool.":
    'شرح للفرق بين خفض الاستخدام والتوفير النقدي. تُجمع الأرصدة المشمولة من كل التراخيص في رصيد مشترك يُعاد ضبطه كل شهر، لذا لا يوفر الاستخدام الأقل نقدًا إلا في الأشهر التي يتجاوز فيها الاستخدام الرصيد المشترك.',
  "Cash saving = usage reduction limited to the part above the pool: max(pool size, usage) − max(pool size, usage × (1 − usage reduction))":
    'التوفير النقدي = خفض الاستخدام مقصورًا على الجزء الذي يتجاوز الرصيد المشترك: الأكبر(حجم الرصيد المشترك، الاستخدام) − الأكبر(حجم الرصيد المشترك، الاستخدام × (1 − خفض الاستخدام))',
  "The card compares the usage reduction per month with the cash saving per month. Both are described under their own names.":
    'تقارن البطاقة خفض الاستخدام الشهري بالتوفير النقدي الشهري. وكلاهما مشروح تحت اسمه.',
  "The sentence with the two amounts is shown when the file has a billing month and no filter narrows the data.":
    'تظهر الجملة التي فيها المبلغان إذا كان في الملف شهر فوترة ولم يضيّق أي عامل تصفية البيانات.',
  "The footer repeats the pool limits: a star for a pool that counts only the seats in the report, and a note when some months used more included credits than the visible seats provide.":
    'يكرر التذييل حدود الرصيد المشترك: نجمة لرصيد مشترك لا يحسب إلا التراخيص الظاهرة في التقرير، وملاحظة إذا استخدمت بعض الأشهر أرصدة مشمولة أكثر مما توفره التراخيص الظاهرة.',
  "To turn unused credits into cash, the number of seats has to come down as well. The simulator on the Recommendations page shows both effects together.":
    'لتحويل الأرصدة غير المستخدمة إلى نقد، يجب أن ينخفض عدد التراخيص أيضًا. ويعرض المحاكي في صفحة التوصيات الأثرين معًا.',
  "Credits that nobody used are lost at the end of the month. They do not carry over.":
    'الأرصدة التي لم يستخدمها أحد تضيع في نهاية الشهر، ولا تُرحَّل.',
  "The pool is $9,600, usage is $10,500 and the usage reduction is 15%. Usage falls by $1,575, but the cash saving is $900: the other $675 of the reduction was usage that the pool already covered.":
    'الرصيد المشترك 9,600 دولار والاستخدام 10,500 دولار وخفض الاستخدام 15%. ينخفض الاستخدام بمقدار 1,575 دولارًا، لكن التوفير النقدي 900 دولار: فالـ 675 دولارًا الباقية من الخفض كانت استخدامًا يغطيه الرصيد المشترك أصلًا.',

  // token-mix
  "Two bars side by side: how the tokens divide between input, cache read, cache write and output, and how the estimated cost divides between the same four types. Cache reads are many tokens at a low rate and output is few tokens at a high rate, so the two bars look different. The table under the bars gives the numbers.":
    'شريطان جنبًا إلى جنب: كيف تتوزع الرموز بين الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها والمخرجات، وكيف تتوزع التكلفة التقديرية بين الأنواع الأربعة نفسها. القراءات من الذاكرة المؤقتة رموز كثيرة بسعر منخفض، والمخرجات رموز قليلة بسعر مرتفع، لذا يبدو الشريطان مختلفين. ويعرض الجدول تحت الشريطين الأرقام.',
  "Share of tokens = tokens of a type ÷ all tokens; share of cost = estimated cost of a type ÷ all estimated cost":
    'حصة الرموز = رموز النوع ÷ كل الرموز؛ حصة التكلفة = التكلفة التقديرية للنوع ÷ كل التكلفة التقديرية',
  "Take the rows that could be priced from token counts: the model is on the price card (or has rates set in Settings) and the row has token counts. Rows that cannot be priced are left out of the bars and the table, so tokens and cost describe the same rows.":
    'خذ الصفوف التي أمكن تسعيرها من أعداد الرموز: النموذج موجود في قائمة الأسعار (أو له أسعار محددة في الإعدادات) والصف فيه أعداد رموز. تُستبعد الصفوف التي لا يمكن تسعيرها من الشريطين والجدول، لذا تصف الرموز والتكلفة الصفوف نفسها.',
  "Tokens are the input, cache read, cache write and output tokens of those rows.":
    'الرموز هي رموز الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها والمخرجات في تلك الصفوف.',
  "Cost is the estimated cost by token type of the same rows: each type priced at the standard rate of the model, scaled so that the four parts add up to the usage of the row.":
    'التكلفة هي التكلفة التقديرية حسب نوع الرمز للصفوف نفسها: يُسعَّر كل نوع بالسعر القياسي للنموذج، ثم يُعدَّل حتى تساوي الأجزاء الأربعة مجتمعة استخدام الصف.',
  "Each share is the type ÷ the sum of the four types, for tokens and for cost. The table adds the cost per 1M tokens of each type.":
    'كل حصة هي النوع ÷ مجموع الأنواع الأربعة، للرموز وللتكلفة. ويضيف الجدول تكلفة كل مليون رمز لكل نوع.',
  "The cost is an estimate. The report gives one amount per row, not an amount per token type, so the split uses price card proportions scaled to the amount of the report. It will not match an invoice to the cent.":
    'التكلفة تقديرية. يعطي التقرير مبلغًا واحدًا لكل صف، لا مبلغًا لكل نوع رمز، لذا يستخدم التقسيم نسب قائمة الأسعار معدّلة على مبلغ التقرير. ولن يطابق الفاتورة حتى آخر سنت.',
  "The footer shows the share of usage that is included when it is below 99.5%. The token counts here can be lower than the Total tokens shown elsewhere for the same reason. See Token coverage.":
    'يعرض التذييل حصة الاستخدام المشمولة إذا كانت أقل من 99.5%. وللسبب نفسه قد تكون أعداد الرموز هنا أقل من إجمالي الرموز المعروض في أماكن أخرى. انظر تغطية الرموز.',
  "Rows that went through Auto are scaled in the same way, so the Auto discount is already in the costs.":
    'تُعدَّل الصفوف التي مرت عبر Auto بالطريقة نفسها، لذا يكون خصم Auto داخلًا في التكاليف أصلًا.',
  "When no usage in view could be priced, only the token bar and the token columns are shown.":
    'إذا لم يمكن تسعير أي استخدام معروض، لا يظهر إلا شريط الرموز وأعمدة الرموز.',
  "The card appears only when the file has token columns and the rows in view contain tokens.":
    'لا تظهر البطاقة إلا إذا كان في الملف أعمدة رموز وكانت الصفوف المعروضة تحتوي على رموز.',
  "A period has 100 million input, 800 million cache read, 50 million cache write and 50 million output tokens, so cache reads are 800 ÷ 1,000 = 80% of the tokens. At standard rates of $2.00, $0.20, $2.50 and $12.00 per million tokens, the costs are $200, $160, $125 and $600, which is $1,085 in all. That equals the usage of those rows, so no scaling is needed. Cache reads are 160 ÷ 1,085 = 15% of the cost and output is 600 ÷ 1,085 = 55%.":
    'في فترة ما 100 مليون رمز إدخال و800 مليون رمز قراءة من الذاكرة المؤقتة و50 مليون رمز كتابة فيها و50 مليون رمز مخرجات، لذا تمثل القراءات من الذاكرة المؤقتة 800 ÷ 1,000 = 80% من الرموز. وبأسعار قياسية قدرها 2.00 و0.20 و2.50 و12.00 دولار لكل مليون رمز، تكون التكاليف 200 و160 و125 و600 دولار، أي 1,085 دولارًا إجمالًا. وهذا يساوي استخدام تلك الصفوف، لذا لا حاجة إلى التعديل. تمثل القراءات من الذاكرة المؤقتة 160 ÷ 1,085 = 15% من التكلفة، والمخرجات 600 ÷ 1,085 = 55%.',

  // token-per-million
  "The effective price of one million tokens of a type in this report, worked out from the estimated cost by token type. The last row blends all four types.":
    'السعر الفعلي لمليون رمز من نوع ما في هذا التقرير، محسوبًا من التكلفة التقديرية حسب نوع الرمز. والصف الأخير يجمع الأنواع الأربعة.',
  "Cost per 1M tokens = estimated cost of the token type ÷ tokens of that type × 1,000,000":
    'التكلفة لكل مليون رمز = التكلفة التقديرية لنوع الرمز ÷ رموز ذلك النوع × 1,000,000',
  "Take the estimated cost and the tokens of the type, both from the rows that could be priced.":
    'خذ التكلفة التقديرية ورموز النوع، كلتيهما من الصفوف التي أمكن تسعيرها.',
  "Divide the cost by the tokens and multiply by 1,000,000.": 'اقسم التكلفة على الرموز واضرب في 1,000,000.',
  "The Total row divides the cost of all four types by all four token counts.":
    'يقسم صف الإجمالي تكلفة الأنواع الأربعة على أعداد رموزها الأربعة.',
  "A dash is shown when the type has no tokens or when no usage could be priced.":
    'تظهر شرطة إذا لم يكن للنوع رموز أو لم يمكن تسعير أي استخدام.',
  "It follows what the report charged, not the price card: the rates of the card are scaled to the amounts of the report, so an Auto discount is inside it.":
    'يتبع ما احتسبه التقرير، لا قائمة الأسعار: تُعدَّل أسعار القائمة على مبالغ التقرير، لذا يكون خصم Auto داخلًا فيه.',
  "The blended Total moves with the mix of tokens as well as with prices. More cache reads pull it down and more output tokens push it up.":
    'يتغير الإجمالي المجمّع مع مزيج الرموز ومع الأسعار. المزيد من القراءات من الذاكرة المؤقتة يخفضه، والمزيد من رموز المخرجات يرفعه.',
  "Input tokens cost $1,800 for 600,000,000 tokens. $1,800 ÷ 600,000,000 × 1,000,000 = $3.00 per 1M tokens.":
    'تكلف رموز الإدخال 1,800 دولار مقابل 600,000,000 رمز. 1,800 دولار ÷ 600,000,000 × 1,000,000 = 3.00 دولارات لكل مليون رمز.',

  // cache-trend
  "The cache hit rate of each day or week in the selected period, with a dashed line at the setting \"Low cache reuse below\". A falling line means prompts were read from the cache less often.":
    'نسبة القراءة من الذاكرة المؤقتة لكل يوم أو أسبوع في الفترة المحددة، مع خط متقطع عند الإعداد «استفادة قليلة من الذاكرة المؤقتة تحت». الخط الهابط يعني أن الطلبات قُرئت من الذاكرة المؤقتة أقل.',
  "Cache hit rate of a day or week = cache read ÷ (input + cache read + cache write) of that day or week":
    'نسبة القراءة من الذاكرة المؤقتة ليوم أو أسبوع = القراءة من الذاكرة المؤقتة ÷ (الإدخال + القراءة من الذاكرة المؤقتة + الكتابة فيها) لذلك اليوم أو الأسبوع',
  "Choose Day or Week. Week is the default when the period is longer than 90 days.":
    'اختر يومًا أو أسبوعًا. الأسبوع هو الافتراضي إذا كانت الفترة أطول من 90 يومًا.',
  "Weeks start on Monday. The first and last week are cut to the selected period.":
    'تبدأ الأسابيع يوم الاثنين. ويُقص الأسبوعان الأول والأخير على حدود الفترة المحددة.',
  "For each day or week, add the input, cache read and cache write tokens of the rows in view and divide the cache read tokens by that sum.":
    'لكل يوم أو أسبوع، اجمع رموز الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها في الصفوف المعروضة، واقسم رموز القراءة من الذاكرة المؤقتة على هذا المجموع.',
  "A day or week without prompt tokens has no point on the line.": 'اليوم أو الأسبوع الذي لا رموز طلبات فيه لا نقطة له على الخط.',
  "The footer shows the cache hit rate of the whole period with the same formula.":
    'يعرض التذييل نسبة القراءة من الذاكرة المؤقتة للفترة كلها بالمعادلة نفسها.',
  "It is one rate for all tokens of a day or week, so heavy users weigh more than light users.":
    'هي نسبة واحدة لكل رموز اليوم أو الأسبوع، لذا يزن المستخدمون الكثيفون أكثر من الخفيفين.',
  "Days with few tokens swing widely. Read the weekly view for a trend.":
    'الأيام ذات الرموز القليلة تتقلب كثيرًا. اقرأ العرض الأسبوعي لترى الاتجاه.',
  "The dashed line is the setting for single users. A point under it does not mean that one user is at fault.":
    'الخط المتقطع هو إعداد المستخدمين أفرادًا. والنقطة تحته لا تعني أن مستخدمًا بعينه مخطئ.',
  "On a day with 400 million input, 600 million cache read and no cache write tokens, the cache hit rate is 600 ÷ 1,000 = 60%.":
    'في يوم فيه 400 مليون رمز إدخال و600 مليون رمز قراءة من الذاكرة المؤقتة ولا رموز كتابة فيها، تكون نسبة القراءة من الذاكرة المؤقتة 600 ÷ 1,000 = 60%.',

  // cache-histogram
  "How many users reuse the cache a little or a lot. It shows whether low cache reuse is a few users or many.":
    'كم مستخدمًا يعيد استخدام الذاكرة المؤقتة قليلًا أو كثيرًا. يبيّن هل قلة الاستفادة من الذاكرة المؤقتة تخص قلة من المستخدمين أم كثيرين.',
  "Bar of a user = the 20-point band that holds the cache hit rate of the user: 0 to 20%, 20 to 40%, 40 to 60%, 60 to 80% or 80 to 100%":
    'شريط المستخدم = نطاق العشرين نقطة الذي تقع فيه نسبة القراءة من الذاكرة المؤقتة للمستخدم: من 0 إلى 20% أو من 20 إلى 40% أو من 40 إلى 60% أو من 60 إلى 80% أو من 80 إلى 100%',
  "Each user has a cache hit rate: cache read ÷ (input + cache read + cache write) over the rows of the user in the period.":
    'لكل مستخدم نسبة قراءة من الذاكرة المؤقتة: القراءة من الذاكرة المؤقتة ÷ (الإدخال + القراءة من الذاكرة المؤقتة + الكتابة فيها) على صفوف المستخدم في الفترة.',
  "A rate of exactly 20% counts in the 20 to 40% bar, and a rate of 100% counts in the last bar.":
    'النسبة 20% تمامًا تُحسب في شريط 20 إلى 40%، والنسبة 100% تُحسب في الشريط الأخير.',
  "The height of a bar is the number of users in it. The tooltip adds their usage.":
    'ارتفاع الشريط هو عدد المستخدمين فيه. ويضيف التلميح استخدامهم.',
  "The lowest bar (0 to 20%) is red and the two highest bars (60% and above) are green. The bars in between are amber.":
    'الشريط الأدنى (0 إلى 20%) أحمر، والشريطان الأعليان (60% فأكثر) أخضران. والأشرطة بينهما كهرمانية.',
  "Users without prompt tokens have no rate. They are left out, and the footer says how many.":
    'المستخدمون الذين لا رموز طلبات لهم لا نسبة لهم. يُستبعدون، ويذكر التذييل عددهم.',
  "It counts users, not tokens, so a user with little usage weighs as much as a heavy user.":
    'يعدّ المستخدمين، لا الرموز، لذا يزن المستخدم قليل الاستخدام بقدر المستخدم الكثيف.',
  "The button under the chart shows the users with the trait Low cache reuse. That list is not the same as the red bar: the trait uses the setting \"Low cache reuse below\", which is not tied to the bars, and it needs a minimum of usage.":
    'يعرض الزر تحت المخطط المستخدمين الذين لهم سمة «استفادة قليلة من الذاكرة المؤقتة». وهذه القائمة ليست هي الشريط الأحمر: فالسمة تستخدم الإعداد «استفادة قليلة من الذاكرة المؤقتة تحت»، غير المرتبط بالأشرطة، وتحتاج إلى حد أدنى من الاستخدام.',
  "A user with 200 million input, 700 million cache read and 100 million cache write tokens has a rate of 700 ÷ 1,000 = 70% and counts in the 60 to 80% bar.":
    'المستخدم الذي له 200 مليون رمز إدخال و700 مليون رمز قراءة من الذاكرة المؤقتة و100 مليون رمز كتابة فيها نسبته 700 ÷ 1,000 = 70%، ويُحسب في شريط 60 إلى 80%.',

  // cache-low-users
  "The users who use a lot and reuse the cache least. A better cache hit rate for them matters more than for a user with little usage.":
    'المستخدمون الذين يستخدمون كثيرًا ويعيدون استخدام الذاكرة المؤقتة أقل من غيرهم. تحسين نسبة القراءة من الذاكرة المؤقتة لديهم أهم منه لدى مستخدم قليل الاستخدام.',
  "List = the 5 users with the lowest cache hit rate among users whose usage is at least the minimum for traits":
    'القائمة = أدنى 5 مستخدمين في نسبة القراءة من الذاكرة المؤقتة بين المستخدمين الذين لا يقل استخدامهم عن الحد الأدنى للسمات',
  "Take the users with usage of at least the setting \"Minimum usage for traits\" and with prompt tokens, so that they have a cache hit rate.":
    'خذ المستخدمين الذين لا يقل استخدامهم عن الإعداد «الحد الأدنى للاستخدام للسمات» ولهم رموز طلبات، حتى تكون لهم نسبة قراءة من الذاكرة المؤقتة.',
  "Sort by cache hit rate, lowest first. Users with the same rate go in order of usage, highest first. Show the first 5.":
    'رتّب حسب نسبة القراءة من الذاكرة المؤقتة، الأدنى أولًا. المستخدمون الذين لهم النسبة نفسها يُرتَّبون حسب الاستخدام، الأعلى أولًا. اعرض أول 5.',
  "Each row shows the usage of the user and their cache hit rate. When the Cache discipline lever finds a saving of at least $0.50 a month for the user, the row adds \"caching could save about\" that amount per month.":
    'يعرض كل صف استخدام المستخدم ونسبة القراءة من الذاكرة المؤقتة لديه. إذا وجد تغيير «الاستفادة من الذاكرة المؤقتة» توفيرًا لا يقل عن 0.50 دولار شهريًا للمستخدم، يضيف الصف أن الذاكرة المؤقتة قد توفر نحو هذا المبلغ شهريًا.',
  "That amount is the saving of the Cache discipline lever for the user, after the levers that run before it, at the default share, converted to a month.":
    'هذا المبلغ هو توفير تغيير «الاستفادة من الذاكرة المؤقتة» للمستخدم، بعد التغييرات التي تعمل قبله، بالحصة الافتراضية، محوّلًا إلى شهر.',
  "When none of the five users is below the setting \"Low cache reuse below\", the card says so, and the list shows the lowest rates among heavy users.":
    'إذا لم يكن أي من المستخدمين الخمسة تحت الإعداد «استفادة قليلة من الذاكرة المؤقتة تحت»، تذكر البطاقة ذلك، وتعرض القائمة أدنى النسب بين المستخدمين الكثيفين.',
  "The saving is usage, not cash, and it is an estimate: the lever takes a share of the cache writes of the user, not the exact tokens that could have been reads.":
    'التوفير استخدام، وليس نقدًا، وهو تقديري: يأخذ التغيير حصة من كتابات المستخدم في الذاكرة المؤقتة، لا الرموز التي كان يمكن أن تكون قراءات بالضبط.',
  "User A has $900 of usage and a cache hit rate of 12%, user B has $400 and 12%, and user C has $2,000 and 35%. The list is A, B, C: A comes before B because the rates tie and A used more.":
    'للمستخدم A استخدام قدره 900 دولار ونسبة قراءة من الذاكرة المؤقتة 12%، وللمستخدم B ‏400 دولار و12%، وللمستخدم C ‏2,000 دولار و35%. القائمة هي A ثم B ثم C: يأتي A قبل B لأن النسبتين متساويتان وA استخدم أكثر.',

  // credits-by-tier
  "How many users fall in each tier of use of their own included credits, from Minimal to Runaway. The credits are pooled, so a user far below their own credits leaves room for others, and a user far above them draws on the pool.":
    'كم مستخدمًا يقع في كل مستوى من مستويات استخدام أرصدته المشمولة، من ضئيل إلى مفرط. الأرصدة مجمّعة في رصيد مشترك، لذا فالمستخدم البعيد تحت أرصدته يترك مساحة لغيره، والمستخدم البعيد فوقها يسحب من الرصيد المشترك.',
  "Tier of a user = the band that holds (usage of the user ÷ included credits of the seat of the user), with the bands set in Settings under Spend tiers":
    'مستوى المستخدم = النطاق الذي يقع فيه (استخدام المستخدم ÷ الأرصدة المشمولة في ترخيص المستخدم)، والنطاقات محددة في الإعدادات تحت مستويات الإنفاق',
  "Included credits of a user = total_monthly_quota in dollars, at 1 credit = $0.01, added up over the months in which the user has usage (the highest quota of the month counts). Share used = usage of the user in the period ÷ included credits.":
    'الأرصدة المشمولة للمستخدم = total_monthly_quota بالدولار، على أساس رصيد واحد = 0.01 دولار، مجموعة على الأشهر التي للمستخدم فيها استخدام (تُحسب أعلى حصة في الشهر). الحصة المستخدمة = استخدام المستخدم في الفترة ÷ الأرصدة المشمولة.',
  "The share decides the tier. By default: Minimal below 10%, Light from 10%, Core from 40%, Power from 100% and Runaway from 300%.":
    'الحصة تحدد المستوى. افتراضيًا: ضئيل أقل من 10%، وخفيف من 10%، وأساسي من 40%، ومكثف من 100%، ومفرط من 300%.',
  "Each bar is the number of users in a tier. The tooltip and the boxes under the chart add the usage of the tier and its share of the usage of all users in view.":
    'كل شريط هو عدد المستخدمين في مستوى. ويضيف التلميح والمربعات تحت المخطط استخدام المستوى وحصته من استخدام كل المستخدمين المعروضين.',
  "A click on a bar or a box lists the users of that tier on the Users page.":
    'النقر على شريط أو مربع يعرض مستخدمي ذلك المستوى في صفحة المستخدمين.',
  "A user whose seat size is not in the report is measured against the most common seat size of the report (1,900 credits when no user has one). The footer says how many users this affects.":
    'المستخدم الذي لا يذكر التقرير حجم ترخيصه يُقاس على حجم الترخيص الأكثر شيوعًا في التقرير (1,900 رصيد إذا لم يكن لأي مستخدم حجم). ويذكر التذييل عدد المستخدمين المتأثرين.',
  "The tiers are about the seat of one user. They do not say how much a user should use.":
    'المستويات تخص ترخيص مستخدم واحد. ولا تقول كم ينبغي أن يستخدم المستخدم.',
  "Included credits are pooled across all seats. A user above 100% costs extra only when the whole pool runs out.":
    'تُجمع الأرصدة المشمولة من كل التراخيص في رصيد مشترك. والمستخدم فوق 100% لا يكلف أكثر إلا حين ينفد الرصيد المشترك كله.',
  "The chart follows the period and every filter in view, including the segment filters.":
    'يتبع المخطط الفترة وكل عوامل التصفية المعروضة، بما فيها عوامل تصفية الفئات.',
  "A Business seat includes 1,900 credits, which is $19 in a month. A user with $10 of usage used 53% of the seat and is in the Core tier. A user with $60 used 316% and is in the Runaway tier.":
    'يتضمن ترخيص Business ‏1,900 رصيد، أي 19 دولارًا في الشهر. المستخدم الذي استخدامه 10 دولارات استخدم 53% من الترخيص وهو في المستوى الأساسي. والمستخدم الذي استخدامه 60 دولارًا استخدم 316% وهو في المستوى المفرط.',

  // credits-under-over
  "A reading guide for the chart next to it, with counts for both ends. Every seat includes credits. They are pooled across all seats and reset each month, so credits that nobody uses are lost, and a user who goes beyond their own credits draws on the pool.":
    'دليل لقراءة المخطط المجاور، مع أعداد الطرفين. كل ترخيص يتضمن أرصدة. وتُجمع من كل التراخيص في رصيد مشترك يُعاد ضبطه كل شهر، لذا تضيع الأرصدة التي لا يستخدمها أحد، والمستخدم الذي يتجاوز أرصدته يسحب من الرصيد المشترك.',
  "Under-use = users in the Minimal and Light tiers; over-use = users in the Power and Runaway tiers":
    'قلة الاستخدام = المستخدمون في المستويين الضئيل والخفيف؛ زيادة الاستخدام = المستخدمون في المستويين المكثف والمفرط',
  "Under-use counts users who used less than the Light limit of their own included credits: 40% by default.":
    'تعدّ قلة الاستخدام المستخدمين الذين استخدموا أقل من حد المستوى الخفيف من أرصدتهم المشمولة: 40% افتراضيًا.',
  "Over-use counts users who used at least the Core limit: 100% by default.":
    'تعدّ زيادة الاستخدام المستخدمين الذين بلغوا حد المستوى الأساسي على الأقل: 100% افتراضيًا.',
  "The last line adds up the pool flow of the users in the report. Users below their own credits leave the unused part. Users above their own credits use the part above. The line shows both sums and how many users are on each side.":
    'يجمع السطر الأخير حركة الرصيد المشترك للمستخدمين في التقرير. المستخدمون تحت أرصدتهم يتركون الجزء غير المستخدم، والمستخدمون فوق أرصدتهم يستخدمون الجزء الزائد. ويعرض السطر المجموعين وعدد المستخدمين في كل جانب.',
  "The pool flow line is hidden when a row or segment filter narrows the data, because the pool belongs to all seats.":
    'يُخفى سطر حركة الرصيد المشترك إذا ضيّق عامل تصفية صفوف أو فئات البيانات، لأن الرصيد المشترك ملك لكل التراخيص.',
  "Unused credits are not refunded. They show seats that may not be needed, or users who need help to get started.":
    'لا تُسترد الأرصدة غير المستخدمة. إنها تبيّن تراخيص قد لا تكون لازمة، أو مستخدمين يحتاجون إلى مساعدة للبدء.',
  "Over-use costs cash only when the whole pool runs out. Until then other users leave credits behind.":
    'لا تكلف زيادة الاستخدام نقدًا إلا حين ينفد الرصيد المشترك كله. وحتى ذلك الحين يترك مستخدمون آخرون أرصدة وراءهم.',
  "The pool flow line counts only users who are in the report. A seat that never used GitHub Copilot is not in the file.":
    'لا يعدّ سطر حركة الرصيد المشترك إلا المستخدمين الموجودين في التقرير. الترخيص الذي لم يستخدم GitHub Copilot قط ليس في الملف.',
  "The limits are the Spend tiers in Settings, so the counts change when you change them.":
    'الحدود هي مستويات الإنفاق في الإعدادات، لذا تتغير الأعداد حين تغيّرها.',
  "Two seats include $19 each. User A has $4 of usage, so $15 is unused (21% used, Light tier, under-use). User B has $40 of usage, which is $21 above the credits of the seat (211% used, Power tier, over-use). The pool flow line shows one user who left $15 unused and one user who used $21 beyond their own credits.":
    'يتضمن كل من ترخيصين 19 دولارًا. للمستخدم A استخدام قدره 4 دولارات، فيبقى 15 دولارًا غير مستخدمة (21% مستخدمة، المستوى الخفيف، قلة استخدام). وللمستخدم B استخدام قدره 40 دولارًا، أي 21 دولارًا فوق أرصدة الترخيص (211% مستخدمة، المستوى المكثف، زيادة استخدام). ويعرض سطر حركة الرصيد المشترك مستخدمًا ترك 15 دولارًا غير مستخدمة ومستخدمًا استخدم 21 دولارًا فوق أرصدته.',

  // cost-per-day-median
  "The typical cost of a working day with GitHub Copilot: half of the users cost less per active day and half cost more. Every user counts once, whatever their usage.":
    'التكلفة المعتادة ليوم عمل مع GitHub Copilot: نصف المستخدمين يكلفون أقل لكل يوم نشط والنصف الآخر أكثر. ويُحسب كل مستخدم مرة واحدة، مهما كان استخدامه.',
  "Median = the middle value of (usage of the user ÷ active days of the user) over the users with at least one active day":
    'الوسيط = القيمة الوسطى لـ (استخدام المستخدم ÷ أيام نشاط المستخدم) على المستخدمين الذين لهم يوم نشط واحد على الأقل',
  "For each user with at least one active day, cost per active day = usage of the user ÷ active days of the user.":
    'لكل مستخدم له يوم نشط واحد على الأقل، التكلفة لكل يوم نشط = استخدام المستخدم ÷ أيام نشاط المستخدم.',
  "Sort the values and take the middle one. With an even number of users the median is the average of the two middle values.":
    'رتّب القيم وخذ القيمة الوسطى. ومع عدد زوجي من المستخدمين يكون الوسيط متوسط القيمتين الوسطيين.',
  "Users without an active day are left out. The description of the section says how many users the figures are based on.":
    'يُستبعد المستخدمون الذين لا يوم نشط لهم. ويذكر وصف القسم عدد المستخدمين الذين تقوم عليهم الأرقام.',
  "It follows the period and the filters in view, including the segment filters.":
    'يتبع الفترة وعوامل التصفية المعروضة، بما فيها عوامل تصفية الفئات.',
  "The median is not the cost per active day of all usage together. Heavy users do not pull it up.":
    'الوسيط ليس التكلفة لكل يوم نشط لكل الاستخدام مجتمعًا. والمستخدمون الكثيفون لا يرفعونه.',
  "Five users have $4, $6, $8, $12 and $40 per active day. The middle value is $8.":
    'لخمسة مستخدمين 4 و6 و8 و12 و40 دولارًا لكل يوم نشط. القيمة الوسطى 8 دولارات.',

  // cost-per-day-p75
  "The cost per active day that three users in four stay below. It shows where the most intense quarter of users begins.":
    'التكلفة لكل يوم نشط التي يبقى تحتها ثلاثة من كل أربعة مستخدمين. تبيّن أين يبدأ الربع الأكثر كثافة من المستخدمين.',
  "75th percentile = the value at position (users − 1) × 0.75 of the sorted list of cost per active day, counting from 0":
    'المئين 75 = القيمة في الموضع (المستخدمون − 1) × 0.75 من القائمة المرتبة للتكلفة لكل يوم نشط، بدءًا من 0',
  "Take the cost per active day of each user with at least one active day (usage ÷ active days) and sort the values from lowest to highest.":
    'خذ التكلفة لكل يوم نشط لكل مستخدم له يوم نشط واحد على الأقل (الاستخدام ÷ أيام النشاط) ورتّب القيم من الأدنى إلى الأعلى.',
  "Find the position (number of users − 1) × 0.75. When it falls between two users, the value is placed in proportion between theirs.":
    'جد الموضع (عدد المستخدمين − 1) × 0.75. إذا وقع بين مستخدمين، توضع القيمة بالتناسب بين قيمتيهما.',
  "One user in four is above this value.": 'مستخدم واحد من كل أربعة فوق هذه القيمة.',
  "With few users it moves a lot when one user changes. The description of the section says how many users it is based on.":
    'مع قلة المستخدمين تتحرك كثيرًا حين يتغير مستخدم واحد. ويذكر وصف القسم عدد المستخدمين الذين تقوم عليهم.',
  "Five users have $4, $6, $8, $12 and $40 per active day. The position is (5 − 1) × 0.75 = 3, which is the fourth user in the list, so the 75th percentile is $12.":
    'لخمسة مستخدمين 4 و6 و8 و12 و40 دولارًا لكل يوم نشط. الموضع (5 − 1) × 0.75 = 3، وهو المستخدم الرابع في القائمة، لذا فالمئين 75 هو 12 دولارًا.',

  // cost-per-day-p90
  "The cost per active day that nine users in ten stay below. It shows where the most intense tenth of users begins.":
    'التكلفة لكل يوم نشط التي يبقى تحتها تسعة من كل عشرة مستخدمين. تبيّن أين يبدأ العُشر الأكثر كثافة من المستخدمين.',
  "90th percentile = the value at position (users − 1) × 0.9 of the sorted list of cost per active day, counting from 0":
    'المئين 90 = القيمة في الموضع (المستخدمون − 1) × 0.9 من القائمة المرتبة للتكلفة لكل يوم نشط، بدءًا من 0',
  "Find the position (number of users − 1) × 0.9. When it falls between two users, the value is placed in proportion between theirs.":
    'جد الموضع (عدد المستخدمين − 1) × 0.9. إذا وقع بين مستخدمين، توضع القيمة بالتناسب بين قيمتيهما.',
  "One user in ten is above this value.": 'مستخدم واحد من كل عشرة فوق هذه القيمة.',
  "With fewer than ten users it is close to the highest value. It says little about the group.":
    'مع أقل من عشرة مستخدمين تقترب من أعلى قيمة، ولا تقول الكثير عن المجموعة.',
  "Five users have $4, $6, $8, $12 and $40 per active day. The position is (5 − 1) × 0.9 = 3.6, which is 60% of the way from the fourth user to the fifth. The value is $12 + 0.6 × ($40 − $12) = $28.80.":
    'لخمسة مستخدمين 4 و6 و8 و12 و40 دولارًا لكل يوم نشط. الموضع (5 − 1) × 0.9 = 3.6، أي 60% من المسافة بين المستخدم الرابع والخامس. القيمة 12 دولارًا + 0.6 × (40 − 12 دولارًا) = 28.80 دولارًا.',

  // efficiency-scorecard (filters)
  "The numbers follow the period, the row filters and the segment filters in view.":
    'تتبع الأرقام الفترة وعوامل تصفية الصفوف وعوامل تصفية الفئات المعروضة.',

  // cost-per-day-highest
  "The cost per active day of the user with the highest value, with the name of that user under the number. The number turns amber when it is more than 5 times the median.":
    'التكلفة لكل يوم نشط للمستخدم صاحب أعلى قيمة، مع اسم ذلك المستخدم تحت الرقم. ويتحول الرقم إلى اللون الكهرماني إذا تجاوز 5 أضعاف الوسيط.',
  "Highest = the largest (usage of the user ÷ active days of the user) of any user; amber when it is more than 5 × the median":
    'الأعلى = أكبر قيمة لـ (استخدام المستخدم ÷ أيام نشاط المستخدم) بين كل المستخدمين؛ كهرماني إذا تجاوز 5 × الوسيط',
  "Take the cost per active day of each user with at least one active day.":
    'خذ التكلفة لكل يوم نشط لكل مستخدم له يوم نشط واحد على الأقل.',
  "The largest value is the number. The user with that value is named under it.":
    'أكبر قيمة هي الرقم. ويُذكر اسم المستخدم صاحب هذه القيمة تحته.',
  "The number is amber when it is more than 5 times the median cost per active day and the median is above 0. The limit of 5 times is fixed in the app.":
    'يكون الرقم كهرمانيًا إذا تجاوز 5 أضعاف وسيط التكلفة لكل يوم نشط وكان الوسيط أكبر من 0. وحد الأضعاف الخمسة ثابت في التطبيق.',
  "One user sets this number, so it says little about everybody else. Read it next to the median and the percentiles.":
    'مستخدم واحد يحدد هذا الرقم، لذا لا يقول الكثير عن الآخرين. اقرأه بجانب الوسيط والمئينات.',
  "A short period of use can make it high: a user with $200 of usage on two active days is at $100 per active day.":
    'فترة استخدام قصيرة قد ترفعه: المستخدم الذي استخدامه 200 دولار في يومين نشطين يبلغ 100 دولار لكل يوم نشط.',
  "It does not say whether the usage was useful work.": 'لا يذكر هل كان الاستخدام عملًا مفيدًا.',
  "A user with $300 of usage on 3 active days is at $100 per active day. The median is $15, and $100 is more than 5 × $15 = $75, so the number is amber.":
    'المستخدم الذي استخدامه 300 دولار في 3 أيام نشطة يبلغ 100 دولار لكل يوم نشط. الوسيط 15 دولارًا، و100 دولار أكثر من 5 × 15 دولارًا = 75 دولارًا، لذا يكون الرقم كهرمانيًا.',

  // cost-per-day-top-users
  "The ten users with the highest cost per active day, each with chips for what drives the cost: the model with the most usage, the Auto share, the cache hit rate and the number of active days. It shows what the most intense users have in common.":
    'المستخدمون العشرة أصحاب أعلى تكلفة لكل يوم نشط، ولكل منهم شارات لما يرفع التكلفة: النموذج الأكثر استخدامًا، وحصة Auto، ونسبة القراءة من الذاكرة المؤقتة، وعدد أيام النشاط. يبيّن ما يجمع بين المستخدمين الأكثر كثافة.',
  "List = the 10 users with the highest (usage ÷ active days); multiple of the median = cost per active day of the user ÷ median cost per active day":
    'القائمة = أعلى 10 مستخدمين في (الاستخدام ÷ أيام النشاط)؛ مضاعف الوسيط = التكلفة لكل يوم نشط للمستخدم ÷ وسيط التكلفة لكل يوم نشط',
  "Rank the users with at least one active day by cost per active day, highest first, and keep 10.":
    'رتّب المستخدمين الذين لهم يوم نشط واحد على الأقل حسب التكلفة لكل يوم نشط، الأعلى أولًا، واحتفظ بـ 10.',
  "The bar is the cost per active day of the user relative to the first user in the list.":
    'الشريط هو التكلفة لكل يوم نشط للمستخدم نسبةً إلى أول مستخدم في القائمة.',
  "The number on the right is the cost per active day. The line under it says how many times the median it is, or \"per day\" when the median is 0.":
    'الرقم في الطرف هو التكلفة لكل يوم نشط. ويذكر السطر تحته كم ضعفًا للوسيط تبلغ، أو «لكل يوم» إذا كان الوسيط 0.',
  "The chips show the model with the most usage and its share of the usage of the user, the Auto share of usage, the cache hit rate (a dash without prompt tokens) and the number of active days.":
    'تعرض الشارات النموذج الأكثر استخدامًا وحصته من استخدام المستخدم، وحصة Auto من الاستخدام، ونسبة القراءة من الذاكرة المؤقتة (شرطة إذا لم تكن هناك رموز طلبات)، وعدد أيام النشاط.',
  "The Auto chip is amber when the Auto share is below the setting \"Rarely uses Auto below\". The cache chip is amber when the cache hit rate is below the setting \"Low cache reuse below\".":
    'تكون شارة Auto كهرمانية إذا كانت حصة Auto تحت الإعداد «نادرًا ما يستخدم Auto تحت». وتكون شارة الذاكرة المؤقتة كهرمانية إذا كانت نسبة القراءة منها تحت الإعداد «استفادة قليلة من الذاكرة المؤقتة تحت».',
  "The list is about users, not single days. Each user appears once, with the average cost of their active days.":
    'القائمة عن المستخدمين، لا عن أيام منفردة. يظهر كل مستخدم مرة واحدة، بمتوسط تكلفة أيام نشاطه.',
  "Amber is a prompt to look closer, not a finding. A heavy day on a Powerful model can be the right choice for the task.":
    'اللون الكهرماني دعوة إلى النظر عن قرب، وليس حكمًا. قد يكون يوم كثيف على نموذج قوي هو الاختيار الصحيح للمهمة.',
  "A click on a user opens their profile.": 'النقر على مستخدم يفتح ملفه.',
  "A user has $450 of usage on 9 active days, which is $50 per active day. The median is $12.50, so the line under the number reads 4.0× median.":
    'لمستخدم استخدام قدره 450 دولارًا في 9 أيام نشطة، أي 50 دولارًا لكل يوم نشط. الوسيط 12.50 دولارًا، لذا يقول السطر تحت الرقم 4.0× الوسيط.',

  // opportunities-chart
  "The users who could avoid the most usage by changing their habits, and which habit is worth the most for each. Every bar is one user, split by the six levers of the savings plan. The number at the end of the bar is the total for that user.":
    'المستخدمون الذين يمكنهم تجنب أكبر قدر من الاستخدام بتغيير عاداتهم، وأي عادة أكثر قيمة لكل منهم. كل شريط مستخدم واحد، مقسّم حسب تغييرات خطة التوفير الستة. والرقم في نهاية الشريط هو إجمالي ذلك المستخدم.',
  "Avoidable usage per month of a user = potential savings of the user × 30.4375 ÷ days in the period":
    'الاستخدام القابل للتجنب شهريًا للمستخدم = التوفير المحتمل للمستخدم × 30.4375 ÷ أيام الفترة',
  "Each user has potential savings: the six levers at their default strength, applied one after the other to the usage of the user, in the order of the legend. The total is held at the usage of the user.":
    'لكل مستخدم توفير محتمل: التغييرات الستة بقوتها الافتراضية، تُطبَّق واحدًا بعد الآخر على استخدام المستخدم، بترتيب وسيلة الإيضاح. ولا يتجاوز الإجمالي استخدام المستخدم.',
  "The users with potential savings above 0 are ranked, largest first, and the top 10 are shown.":
    'يُرتَّب المستخدمون الذين توفيرهم المحتمل أكبر من 0، الأكبر أولًا، ويُعرض أول 10.',
  "A part of a bar is the saving of one lever for the user, after the levers before it, × 30.4375 ÷ days in the period. When the parts add up to more than the total, they are scaled down in proportion so that the bar equals the total.":
    'جزء الشريط هو توفير تغيير واحد للمستخدم، بعد التغييرات التي قبله، × 30.4375 ÷ أيام الفترة. إذا تجاوز مجموع الأجزاء الإجمالي، تُخفَّض بالتناسب حتى يساوي الشريط الإجمالي.',
  "The subtitle adds up the users shown and compares them with all users who have a saving.":
    'يجمع العنوان الفرعي المستخدمين المعروضين ويقارنهم بكل المستخدمين الذين لهم توفير.',
  "The footer lists each lever with the sum of its parts for the users shown. A dash means 0.":
    'يذكر التذييل كل تغيير مع مجموع أجزائه للمستخدمين المعروضين. والشرطة تعني 0.',
  "The button \"Download action list\" saves a CSV of all users, the largest first, sorted by the column \"Avoidable USD (default levers)\". That column holds the potential savings of the user over the whole selected period, not a monthly amount.":
    'يحفظ الزر «تنزيل قائمة الإجراءات» ملف CSV لكل المستخدمين، الأكبر أولًا، مرتبًا حسب العمود «Avoidable USD (default levers)». ويحتوي هذا العمود على التوفير المحتمل للمستخدم على الفترة المحددة كلها، لا على مبلغ شهري.',
  "The levers use their default shares. The simulator on the Recommendations page lets you try others.":
    'تستخدم التغييرات حصصها الافتراضية. ويتيح لك المحاكي في صفحة التوصيات تجربة غيرها.',
  "The amounts are usage that would not occur, not cash. Included credits are pooled, so cash falls only for usage above the pool. See Cash saving per month.":
    'المبالغ استخدام لن يحدث، وليست نقدًا. الأرصدة المشمولة مجمّعة في رصيد مشترك، لذا لا ينخفض النقد إلا للاستخدام الذي يتجاوز الرصيد المشترك. انظر التوفير النقدي شهريًا.',
  "Levers that need model names or token counts add nothing when the file has none, so the amounts are then lower than the real potential.":
    'التغييرات التي تحتاج إلى أسماء النماذج أو أعداد الرموز لا تضيف شيئًا إذا خلا الملف منها، فتكون المبالغ حينها أقل من الإمكانية الحقيقية.',
  "Each user is calculated on their own usage, one lever after the other. The users add up to a different number than the chart Where the saving comes from, which applies the levers to all usage at once.":
    'يُحسب كل مستخدم على استخدامه، تغييرًا بعد آخر. لذا يختلف مجموع المستخدمين عن مخطط «من أين يأتي التوفير»، الذي يطبّق التغييرات على كل الاستخدام دفعة واحدة.',
  "The saving of a user does not depend on the segment filters. They change who is listed.":
    'لا يعتمد توفير المستخدم على عوامل تصفية الفئات. فهي تغيّر من يظهر في القائمة.',
  "A user has $200 of usage in a period of 61 days and potential savings of $50. The bar shows $50 × 30.4375 ÷ 61 = about $25 per month.":
    'لمستخدم استخدام قدره 200 دولار في فترة 61 يومًا وتوفير محتمل قدره 50 دولارًا. يعرض الشريط 50 دولارًا × 30.4375 ÷ 61 = نحو 25 دولارًا شهريًا.',

  // role-models
  "Users who get a lot done per credit and can show others how. They use GitHub Copilot regularly, use enough for the numbers to mean something, use Auto, stay out of the runaway tier and read most of their prompts from the cache where the report shows it.":
    'مستخدمون ينجزون الكثير لكل رصيد ويمكنهم أن يُروا غيرهم كيف. يستخدمون GitHub Copilot بانتظام، وبقدر كافٍ لتكون الأرقام ذات معنى، ويستخدمون Auto، ويبقون خارج المستوى المفرط، ويقرؤون معظم طلباتهم من الذاكرة المؤقتة حيث يُظهر التقرير ذلك.',
  "Role model = a user who meets all seven conditions below; the 6 with the highest efficiency score are shown":
    'القدوة = مستخدم يستوفي الشروط السبعة أدناه كلها؛ ويُعرض أعلى 6 في درجة الكفاءة',
  "Usage of at least the setting \"Minimum usage for traits\".": 'استخدام لا يقل عن الإعداد «الحد الأدنى للاستخدام للسمات».',
  "At least 3 active days.": '3 أيام نشطة على الأقل.',
  "Engagement Daily or Regular, as set in the setting Engagement.": 'تفاعل يومي أو منتظم، كما يحدده إعداد «التفاعل».',
  "Not in the Runaway tier of the Spend tiers.": 'ليس في المستوى المفرط من مستويات الإنفاق.',
  "At least 10% of usage through Auto.": '10% على الأقل من الاستخدام عبر Auto.',
  "A cache hit rate of at least 60%, or no cache hit rate because the user has no prompt tokens.":
    'نسبة قراءة من الذاكرة المؤقتة لا تقل عن 60%، أو لا نسبة لأن المستخدم لا رموز طلبات له.',
  "The model profile Efficient (mid-tier and lighter models are at least the share set in \"Efficient from\" of the usage) or an efficiency score of 60 or more.":
    'ملف النماذج «موفّر» (نماذج الفئة المتوسطة والأخف تبلغ على الأقل الحصة المحددة في «موفّر من» من الاستخدام) أو درجة كفاءة 60 أو أكثر.',
  "The users who qualify are sorted by efficiency score, highest first, then by usage. The first 6 are shown, and the section appears only when at least 2 users qualify.":
    'يُرتَّب المستخدمون المؤهلون حسب درجة الكفاءة، الأعلى أولًا، ثم حسب الاستخدام. يُعرض أول 6، ولا يظهر القسم إلا إذا تأهل مستخدمان على الأقل.',
  "The limits of 3 active days, 10% Auto, a 60% cache hit rate and an efficiency score of 60 are fixed in the app. They are not Settings.":
    'حدود 3 أيام نشطة و10% Auto ونسبة قراءة من الذاكرة المؤقتة 60% ودرجة كفاءة 60 ثابتة في التطبيق، وليست من الإعدادات.',
  "Each card shows the usage and active days of the user, a sentence about what they do well, built from their own numbers (at most three points), and their Auto share, cache hit rate and share of Powerful models.":
    'تعرض كل بطاقة استخدام المستخدم وأيام نشاطه، وجملة عما يجيده مبنية من أرقامه (ثلاث نقاط على الأكثر)، وحصة Auto لديه ونسبة القراءة من الذاكرة المؤقتة وحصة النماذج القوية.',
  "The efficiency score is relative to the default levers. When the file has no model names or token counts, the levers find little, so scores are high. Check Token coverage first.":
    'درجة الكفاءة نسبية إلى التغييرات الافتراضية. إذا لم يكن في الملف أسماء نماذج أو أعداد رموز، لا تجد التغييرات إلا القليل، فتكون الدرجات عالية. راجع تغطية الرموز أولًا.',
  "It is a reading of the data. It says nothing about the quality of the work.": 'إنها قراءة للبيانات، ولا تقول شيئًا عن جودة العمل.',
  "A user with $120 of usage on 9 active days, Regular engagement, 35% of usage through Auto, a cache hit rate of 72% and an efficiency score of 81 meets all conditions. A user with the same numbers but a cache hit rate of 40% does not.":
    'المستخدم الذي له استخدام قدره 120 دولارًا في 9 أيام نشطة، وتفاعل منتظم، و35% من الاستخدام عبر Auto، ونسبة قراءة من الذاكرة المؤقتة 72%، ودرجة كفاءة 81 يستوفي كل الشروط. أما المستخدم الذي له الأرقام نفسها لكن بنسبة قراءة من الذاكرة المؤقتة 40% فلا يستوفيها.',

  // playbook-saving
  "Saving of a habit": 'توفير العادة',
  "The amount next to a habit in \"Habits that save credits\": what the matching lever of the savings plan would save per month on its own, from the usage in this report. It shows which habits are worth the most in your data.":
    'المبلغ بجانب العادة في «عادات توفر الأرصدة»: ما يوفره التغيير المقابل في خطة التوفير شهريًا وحده، من الاستخدام في هذا التقرير. يبيّن أي العادات أكثر قيمة في بياناتك.',
  "Saving of a habit = saving of its lever on its own × 30.4375 ÷ days in the period":
    'توفير العادة = توفير تغييرها وحده × 30.4375 ÷ أيام الفترة',
  "Each habit is linked to one of the six levers. The lever is named under the amount.":
    'كل عادة مرتبطة بأحد التغييرات الستة. ويُذكر اسم التغيير تحت المبلغ.',
  "Saving of the lever on its own = what it would save if it were the only lever, at its default share, on the usage in view. It is calculated for all usage together, not per user.":
    'توفير التغيير وحده = ما يوفره لو كان التغيير الوحيد، بحصته الافتراضية، على الاستخدام المعروض. ويُحسب لكل الاستخدام مجتمعًا، لا لكل مستخدم.',
  "The amount is converted to a month with × 30.4375 ÷ days in the period.": 'يُحوَّل المبلغ إلى شهر بـ × 30.4375 ÷ أيام الفترة.',
  "Habits are listed with the largest saving first. Habits without a lever come last.":
    'تُعرض العادات بحسب التوفير، الأكبر أولًا. والعادات التي لا تغيير لها تأتي أخيرًا.',
  "A habit whose lever finds nothing shows \"No saving found\". A habit without a lever says that the report cannot measure its effect.":
    'العادة التي لا يجد تغييرها شيئًا تعرض «لم يُعثر على توفير». والعادة التي لا تغيير لها تذكر أن التقرير لا يستطيع قياس أثرها.',
  "Several habits can use the same lever. They all show the same amount, and the text says how many other habits share it. The amounts do not add up.":
    'قد تستخدم عدة عادات التغيير نفسه. فتعرض كلها المبلغ نفسه، ويذكر النص كم عادة أخرى تشاركه. ولا تُجمع المبالغ.',
  "The amount is the saving of the whole lever, so one habit can deliver only part of it.":
    'المبلغ هو توفير التغيير كله، لذا قد لا تحقق العادة الواحدة إلا جزءًا منه.',
  "Amounts on their own overlap. The chart Where the saving comes from shows how the levers combine.":
    'المبالغ المنفردة متداخلة. ويبيّن مخطط «من أين يأتي التوفير» كيف تجتمع التغييرات.',
  "The amounts are usage, not cash.": 'المبالغ استخدام، وليست نقدًا.',
  "The lever Right-size models saves $600 on its own over a period of 61 days. A habit linked to it shows $600 × 30.4375 ÷ 61 = about $299 per month. When two habits use this lever, each shows $299 and says it is shared with 1 other habit.":
    'يوفر تغيير «اختيار النموذج المناسب» وحده 600 دولار على مدى فترة 61 يومًا. العادة المرتبطة به تعرض 600 دولار × 30.4375 ÷ 61 = نحو 299 دولارًا شهريًا. وإذا استخدمت عادتان هذا التغيير، تعرض كل منهما 299 دولارًا وتذكر أنها مشتركة مع عادة واحدة أخرى.',
};

export default arabic;
