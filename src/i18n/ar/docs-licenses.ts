import type { Dict } from '../core';

/** Arabic for the explanations in `lib/metrics/docs/licenses.ts` (titles, meanings, formulas, steps, notes and examples). */
const ar: Dict = {
  // seat-idle
  'Idle seats to reclaim': 'تراخيص خاملة يمكن استردادها',
  'Seats whose users hardly use GitHub Copilot and whose available license data shows no activity in the last 30 days. Reclaiming them lowers the included credits and the seat bill.':
    'تراخيص مستخدموها بالكاد يستخدمون GitHub Copilot ولا تُظهر بيانات الترخيص المتاحة نشاطًا خلال آخر 30 يومًا. استردادها يخفض الأرصدة المشمولة ورسوم التراخيص.',
  'Idle seat = user in the Minimal usage tier with the persona Dormant or low use, or Lapsed users, with no recent activity date proving use in the last 30 days. Value = monthly price of the seat':
    'الترخيص الخامل = مستخدم في مستوى الاستخدام ضئيل، ونمطه خامل أو قليل الاستخدام أو مستخدمون متوقفون، وبلا نشاط في آخر 30 يومًا. القيمة = السعر الشهري للترخيص',
  'Usage tier "Minimal (under 10%)": the user used less than 10% of the included credits of the seat. The limit is the lowest tier limit in Settings.':
    'مستوى الاستخدام "ضئيل (أقل من 10%)": استخدم المستخدم أقل من 10% من الأرصدة المشمولة في ترخيصه. الحد هو أدنى حد للمستويات في الإعدادات.',
  'Persona Dormant or low use: active on fewer than 30% of working days. Persona Lapsed users: the last usage was 7 or more days before the end of the period, and the user is not new. New users are never idle.':
    'نمط المستخدم "خامل أو قليل الاستخدام": نشط في أقل من 30% من أيام العمل. نمط المستخدم "مستخدمون متوقفون": كان آخر استخدام قبل نهاية الفترة بـ7 أيام أو أكثر، والمستخدم ليس جديدًا. المستخدمون الجدد لا يُعدّون خاملين أبدًا.',
  'If the license list shows activity fewer than 30 days before the as-of date, the user is not idle. A blank activity date is not enough evidence to call a seat idle. Code completions are not in this report. A seat with a pending cancellation is skipped, because it is going away already.':
    'إذا أظهرت قائمة التراخيص نشاطًا قبل التاريخ المرجعي بأقل من 30 يومًا، فالمستخدم ليس خاملًا. التاريخ الفارغ لا يكفي لاعتبار الترخيص خاملًا. إكمالات التعليمات البرمجية ليست في هذا التقرير. يُتخطى الترخيص الذي ينتظر الإلغاء، لأنه سيزول على أي حال.',
  'Value of a seat = its monthly price: $19 for 1,900 credits, $39 for 3,900 credits, otherwise credits × $0.01. A user without a seat size is priced at the most common seat size in the report.':
    'قيمة الترخيص = سعره الشهري: $19 لـ1,900 رصيد، و$39 لـ3,900 رصيد، وإلا فالأرصدة × $0.01. المستخدم الذي ليس له حجم ترخيص يُسعَّر بحجم الترخيص الأكثر شيوعًا في التقرير.',
  'Code completions are not in this report. Without a license list, a user who mostly uses completions can look idle. Check before you remove a seat.':
    'إكمالات التعليمات البرمجية ليست في هذا التقرير. وبدون قائمة التراخيص قد يبدو المستخدم الذي يعتمد غالبًا على الإكمالات خاملًا. تحقق قبل أن تزيل أي ترخيص.',
  'When an imported seat has no recent activity date, it is left off this list. The blank date may mean a new seat or activity older than 90 days.':
    'عندما لا يكون للترخيص المستورد تاريخ نشاط حديث، لا يظهر في هذه القائمة. قد يعني التاريخ الفارغ أن الترخيص جديد أو أن النشاط أقدم من 90 يومًا.',
  'A user who is not idle because of recent activity can still be an Enterprise seat to move to Business.':
    'المستخدم الذي لا يُعد خاملًا بسبب نشاط حديث قد يبقى ترخيص Enterprise يمكن نقله إلى Business.',
  'Seat findings show only when no filter is on and the included credits of the organization are known. The whole organization shares them.':
    'تظهر نتائج التراخيص فقط عندما لا يكون أي عامل تصفية مفعّلًا وتكون الأرصدة المشمولة للمؤسسة معروفة. تشترك المؤسسة كلها فيها.',
  'A Business user used $1.20 over two months and was active on 2 days. That is about 3% of the $38 of included credits of those months. The user is Minimal and Dormant, so the seat is idle and $19 a month is counted. If the license list shows activity 10 days ago, the seat is not idle.':
    'استخدم مستخدم Business مبلغ $1.20 خلال شهرين وكان نشطًا في يومين. هذا نحو 3% من $38 هي الأرصدة المشمولة لهذين الشهرين. المستخدم في مستوى ضئيل ونمطه خامل، فالترخيص خامل ويُحسب $19 في الشهر. وإذا أظهرت قائمة التراخيص نشاطًا قبل 10 أيام، فالترخيص ليس خاملًا.',

  // seat-downgrade
  'Enterprise seats to move to Business': 'تراخيص Enterprise يمكن نقلها إلى Business',
  'Enterprise users who never needed more than the credits of a Business seat. Moving them saves the price difference.':
    'مستخدمو Enterprise الذين لم يحتاجوا قط إلى أكثر من أرصدة ترخيص Business. نقلهم يوفر فرق السعر.',
  'Candidate = Enterprise user whose busiest month stayed at or below 80% of the Business credits ($15.20). Value = $39 − $19 = $20 a month':
    'المرشح = مستخدم Enterprise لم يتجاوز شهره الأعلى استخدامًا 80% من أرصدة Business ($15.20). القيمة = $39 − $19 = $20 في الشهر',
  'Take the users whose seat has 3,900 credits. Skip idle seats, new users and seats with a pending cancellation (from the license list).':
    'خذ المستخدمين الذين يضم ترخيصهم 3,900 رصيد. تخطَّ التراخيص الخاملة والمستخدمين الجدد والتراخيص التي تنتظر الإلغاء (من قائمة التراخيص).',
  'Find the month with the most usage of each user.': 'حدد الشهر الأعلى استخدامًا لكل مستخدم.',
  'Keep the user when that month is at most 80% of the Business credits: 80% × $19 = $15.20.':
    'أبقِ المستخدم إذا كان ذلك الشهر لا يتجاوز 80% من أرصدة Business: 80% × $19 = $15.20.',
  'The value of each user is the Enterprise price minus the Business price: $20 a month.':
    'قيمة كل مستخدم هي سعر Enterprise ناقص سعر Business: $20 في الشهر.',
  'The app compares credits only. Check that nobody needs a feature that only the Enterprise plan has before you move a seat.':
    'يقارن التطبيق الأرصدة فقط. تأكد قبل نقل أي ترخيص أن أحدًا لا يحتاج إلى ميزة تتوفر في خطة Enterprise وحدها.',
  'An idle seat is counted as idle, not as a move. So a seat is never counted twice. New users are skipped because they have too little history.':
    'يُحسب الترخيص الخامل خاملًا لا نقلًا. لذلك لا يُحسب أي ترخيص مرتين. يُتخطى المستخدمون الجدد لأن سجلهم قصير جدًا.',
  'Seat findings show only when no filter is on and the included credits of the organization are known.':
    'تظهر نتائج التراخيص فقط عندما لا يكون أي عامل تصفية مفعّلًا وتكون الأرصدة المشمولة للمؤسسة معروفة.',
  'An Enterprise user whose busiest month was $9 used 47% of the Business credits ($9 ÷ $19). Moving the user to Business saves $20 a month.':
    'مستخدم Enterprise كان شهره الأعلى استخدامًا $9 استخدم 47% من أرصدة Business ($9 ÷ $19). نقل هذا المستخدم إلى Business يوفر $20 في الشهر.',

  // seat-unused
  'Roster seats that never appear in the report': 'تراخيص القائمة التي لم تظهر في التقرير قط',
  'Seats in the license list (the seat roster in Settings) whose user has no row in the report. They are paid for, but they used no AI credits in the period. Recent seats, new seats and seats without a recent activity date are left out.':
    'تراخيص في قائمة التراخيص (المحفوظة في الإعدادات) ليس لمستخدمها أي صف في التقرير. هي مدفوعة، لكن لم تستخدم أرصدة الذكاء الاصطناعي في الفترة. تُستثنى التراخيص النشطة مؤخرًا والجديدة والتي بلا تاريخ نشاط حديث.',
  'Unused seats = seats not in the report, with dated activity at least 30 days ago, excluding new and pending-cancellation seats. Value = monthly price of the plan of each seat':
    'التراخيص غير المستخدمة = تراخيص لا تظهر في التقرير ولها تاريخ نشاط مضى عليه 30 يومًا على الأقل، بعد استثناء التراخيص الجديدة والمنتظرة للإلغاء. القيمة = السعر الشهري لخطة كل ترخيص',
  'Compare each user in the license list with the usernames in the report. Capital letters and spaces around a name do not matter.':
    'قارن كل مستخدم في قائمة التراخيص بأسماء المستخدمين في التقرير. لا تهم الأحرف الكبيرة ولا المسافات حول الاسم.',
  'A user not in any loaded file is only a possible candidate.':
    'المستخدم الذي لا يظهر في أي ملف محمّل هو مرشح محتمل فقط.',
  'Do not count a seat when its last activity was fewer than 30 days before the as-of date, or when it was created within the new user window. A seat with no recent activity date is also left out because the date may be blank for several reasons. A candidate with a pending cancellation is left out, because it is going away already.':
    'لا تحسب الترخيص إذا كان آخر نشاط له قبل التاريخ المرجعي بأقل من 30 يومًا، أو أُنشئ ضمن فترة المستخدم الجديد. واستبعد أيضًا الترخيص الذي بلا تاريخ نشاط حديث، لأن التاريخ قد يكون فارغًا لأسباب عدة. واستبعد المرشح الذي ينتظر الإلغاء، لأنه سيزول على أي حال.',
  'Value of a seat = its monthly price: $19 for Business, $39 for Enterprise. A seat without a plan is priced at the most common seat size in the report, and its plan is shown as assumed.':
    'قيمة الترخيص = سعره الشهري: $19 لـ Business و$39 لـ Enterprise. الترخيص بلا خطة يُسعَّر بحجم الترخيص الأكثر شيوعًا في التقرير، وتظهر خطته على أنها مفترضة.',
  'It needs a license list. Without one the app cannot show seats that nobody uses.':
    'يحتاج هذا إلى قائمة تراخيص. وبدونها لا يستطيع التطبيق إظهار التراخيص التي لا يستخدمها أحد.',
  'A seat can be missing from the report and still be in use, for example for code completions. Check before you remove it. A recent activity date is evidence to keep it, but a blank date is not proof of no use.':
    'قد يغيب الترخيص عن التقرير مع أنه قيد الاستخدام، مثلًا لإكمالات التعليمات البرمجية. تحقق قبل إزالته. تاريخ النشاط الحديث دليل على إبقائه، لكن التاريخ الفارغ لا يثبت عدم استخدامه.',
  'Seats to keep are not savings. They are listed apart from the unused seats.':
    'التراخيص التي يُبقى عليها ليست توفيرًا. وتُعرض منفصلة عن التراخيص غير المستخدمة.',
  'Seats to free are stricter: they need a dated last activity at least 90 days ago. A seat that was active 45 days ago can still be an unused seat.':
    'التراخيص المطلوب تحريرها لها شرط أشد: يجب أن يكون تاريخ آخر نشاط قبل 90 يومًا على الأقل. وقد يبقى الترخيص الذي نشط قبل 45 يومًا ضمن التراخيص غير المستخدمة.',
  'An idle seat is a user who is in the report, so a seat is never both idle and unused.':
    'الترخيص الخامل لمستخدم موجود في التقرير، فلا يكون الترخيص خاملًا وغير مستخدم معًا.',
  'The license list has 250 seats, and 12 usernames never appear in the report: 12 candidates. If 2 of them were active last week, 10 are unused seats. If all 10 are Business seats, the value is 10 × $19 = $190 a month.':
    'في قائمة التراخيص 250 ترخيصًا، و12 اسم مستخدم لا يظهر في التقرير أبدًا: 12 مرشحًا. إذا كان اثنان منهم نشطين الأسبوع الماضي، فهناك 10 تراخيص غير مستخدمة. وإذا كانت كلها تراخيص Business، فالقيمة 10 × $19 = $190 في الشهر.',

  // license-import
  'How the license import works': 'كيف يعمل استيراد التراخيص',
  'The license import loads the list of people who hold a GitHub Copilot seat. With it the report knows the exact seats and plans, which seats never appear in the usage report, and who stopped using GitHub Copilot. The files are read in your browser. They are not sent anywhere.':
    'يحمّل استيراد التراخيص قائمة الأشخاص الذين لديهم ترخيص GitHub Copilot. بهذه القائمة يعرف التقرير التراخيص والخطط بدقة، والتراخيص التي لا تظهر في تقرير الاستخدام أبدًا، ومن توقف عن استخدام GitHub Copilot. تُقرأ الملفات في متصفحك ولا تُرسل إلى أي جهة.',
  'License list = one seat for each username in the files. A user in the report has a seat when the lower-case username is in the list':
    'قائمة التراخيص = ترخيص واحد لكل اسم مستخدم في الملفات. يكون للمستخدم في التقرير ترخيص عندما يكون اسمه بأحرف صغيرة موجودًا في القائمة',
  'You can load the JSON of the seats API of an organization or an enterprise. It can be one answer, a list of seats, several pages one after another (gh api --paginate), a list of pages (--slurp), or one seat per line.':
    'يمكنك تحميل ملف JSON من واجهة GitHub البرمجية الخاصة بالتراخيص لمؤسسة أو لحساب Enterprise. قد يكون إجابة واحدة، أو قائمة تراخيص، أو عدة صفحات متتالية (gh api --paginate)، أو قائمة صفحات (--slurp)، أو ترخيصًا واحدًا في كل سطر.',
  'You can also load the activity report CSV from the GitHub Copilot access settings of an organization. Or a CSV with a login or username column, and optional plan, organization, team and email columns. Or a plain list of usernames split by lines, commas, semicolons or spaces.':
    'ويمكنك تحميل ملف CSV لتقرير النشاط من إعدادات الوصول إلى GitHub Copilot في مؤسسة. أو ملف CSV فيه عمود login أو username، وأعمدة اختيارية للخطة والمؤسسة والفريق والبريد الإلكتروني. أو قائمة بسيطة بأسماء المستخدمين تفصل بينها أسطر أو فواصل أو فواصل منقوطة أو مسافات.',
  'A user who appears several times (once for each organization or team) becomes one seat. The seat keeps every organization and team, the highest plan (Enterprise before Business), the latest activity and sign-in, and the earliest creation date.':
    'المستخدم الذي يظهر عدة مرات (مرة لكل مؤسسة أو فريق) يصبح ترخيصًا واحدًا. يحتفظ الترخيص بكل المؤسسات والفرق، وبأعلى خطة (Enterprise قبل Business)، وبأحدث نشاط وأحدث تسجيل دخول، وبأقدم تاريخ إنشاء.',
  'Usernames are compared without capital letters. Ana-Dev and ana-dev are the same user. Values that cannot be a GitHub username are skipped and counted in the message after the import.':
    'تُقارن أسماء المستخدمين دون النظر إلى الأحرف الكبيرة. Ana-Dev وana-dev هما المستخدم نفسه. القيم التي لا يمكن أن تكون اسم مستخدم على GitHub تُتخطى وتُحصى في الرسالة التي تظهر بعد الاستيراد.',
  'An import can replace the license list or add to it. The license export date in Settings becomes the newest date in the file, or the import day when the file has no dates. When you add to the list, the later of the old and the new date is kept.':
    'يمكن للاستيراد أن يستبدل قائمة التراخيص أو يضيف إليها. يصبح تاريخ تصدير التراخيص في الإعدادات أحدث تاريخ في الملف، أو يوم الاستيراد إذا لم تكن في الملف تواريخ. وعند الإضافة إلى القائمة يُحتفظ بالأحدث من التاريخ القديم والجديد.',
  'The license list is saved in this browser with the other settings. If the browser has too little room, the app keeps only the usernames and plans. If that does not fit either, the settings last only until you close the page.':
    'تُحفظ قائمة التراخيص في هذا المتصفح مع بقية الإعدادات. إذا كانت مساحة المتصفح قليلة، يحتفظ التطبيق بأسماء المستخدمين والخطط فقط. وإذا لم يتسع ذلك أيضًا، تبقى الإعدادات حتى تغلق الصفحة فقط.',
  'The seats API needs a token with the manage_billing:copilot or read:org scope for an organization, or read:enterprise for an enterprise. A usage report is not a license file, and the import refuses it.':
    'تحتاج واجهة التراخيص البرمجية إلى رمز وصول بالنطاق manage_billing:copilot أو read:org لمؤسسة، أو read:enterprise لحساب Enterprise. تقرير الاستخدام ليس ملف تراخيص، والاستيراد يرفضه.',
  'The activity report keeps 90 days and can lag by a day. It has no creation date and no plan. So it cannot say which seats are new or which plan they have.':
    'يحتفظ تقرير النشاط بآخر 90 يومًا وقد يتأخر يومًا واحدًا. وليس فيه تاريخ إنشاء ولا خطة. لذلك لا يستطيع أن يحدد التراخيص الجديدة ولا خطة كل ترخيص.',
  'A seats file with fewer seats than its stated total is partial. The import says so. Save every page, for example with gh api --paginate.':
    'ملف التراخيص الذي فيه تراخيص أقل من إجماليه المعلن ملف ناقص. ويُبلغ الاستيراد بذلك. احفظ كل الصفحات، مثلًا باستخدام gh api --paginate.',
  'Activity comes from IDE telemetry. Code completions count as activity there, but they are not in the AI credits report. So a seat can be active in the license data and missing from the usage report.':
    'يأتي النشاط من بيانات القياس عن بُعد في IDE. تُحسب إكمالات التعليمات البرمجية نشاطًا هناك، لكنها ليست في تقرير أرصدة الذكاء الاصطناعي. لذلك قد يكون الترخيص نشطًا في بيانات التراخيص وغائبًا عن تقرير الاستخدام.',
  'A seat with a plan adds the included credits of that plan to each month in which its user has no usage. So the included credits are exact once the license list is complete. A seat created after a month ended adds nothing to that month.':
    'الترخيص الذي له خطة يضيف الأرصدة المشمولة لتلك الخطة إلى كل شهر لا يكون لمستخدمه فيه أي استخدام. لذلك تصبح الأرصدة المشمولة دقيقة عندما تكتمل قائمة التراخيص. والترخيص الذي أُنشئ بعد انتهاء شهر لا يضيف شيئًا إلى ذلك الشهر.',
  'A file lists the username Ana-Dev three times (two organizations and one team) and the username ben-dev once. The license list has 2 seats, and Ana-Dev keeps all three places.':
    'يذكر ملف اسم المستخدم Ana-Dev ثلاث مرات (مؤسستان وفريق واحد) واسم المستخدم ben-dev مرة واحدة. في قائمة التراخيص ترخيصان، ويحتفظ Ana-Dev بالأماكن الثلاثة كلها.',

  // license-seats
  'Seats and plans in the license import': 'التراخيص والخطط في استيراد التراخيص',
  'How many seats the license list holds, how many are Business and Enterprise seats, and what the seats cost each month.':
    'عدد التراخيص في قائمة التراخيص، وكم منها تراخيص Business وEnterprise، وكم تكلف التراخيص كل شهر.',
  'Seats = number of different usernames in the license list. Monthly seat cost = sum of the seat prices':
    'التراخيص = عدد أسماء المستخدمين المختلفة في قائمة التراخيص. تكلفة التراخيص الشهرية = مجموع أسعار التراخيص',
  'Each username counts once, whatever its capital letters.':
    'يُحسب كل اسم مستخدم مرة واحدة، مهما كانت أحرفه كبيرة أو صغيرة.',
  'Business: the plan says Business, 1,900 credits. Enterprise: the plan says Enterprise, 3,900 credits. Other: a custom size, or no plan in the file.':
    'Business: الخطة تذكر Business، 1,900 رصيد. Enterprise: الخطة تذكر Enterprise، 3,900 رصيد. أخرى: حجم مخصص، أو لا خطة في الملف.',
  'Price of a seat: $19 for Business, $39 for Enterprise, otherwise credits × $0.01. A seat without a plan takes the seat size of the same user in the report, or the most common seat size in the report.':
    'سعر الترخيص: $19 لـ Business و$39 لـ Enterprise، وإلا فالأرصدة × $0.01. الترخيص بلا خطة يأخذ حجم ترخيص المستخدم نفسه في التقرير، أو حجم الترخيص الأكثر شيوعًا في التقرير.',
  'These are the standard Business and Enterprise prices that the app uses everywhere. Your invoice can differ.':
    'هذه أسعار Business وEnterprise القياسية التي يستخدمها التطبيق في كل مكان. قد تختلف فاتورتك.',
  'A plain list of usernames has no plans, so each seat is priced at the most common seat size in the report.':
    'القائمة البسيطة بأسماء المستخدمين بلا خطط، لذلك يُسعَّر كل ترخيص بحجم الترخيص الأكثر شيوعًا في التقرير.',
  '60 Business seats and 40 Enterprise seats are 100 seats. The monthly cost is 60 × $19 + 40 × $39 = $1,140 + $1,560 = $2,700.':
    '60 ترخيصًا من Business و40 ترخيصًا من Enterprise هي 100 ترخيص. التكلفة الشهرية هي 60 × $19 + 40 × $39 = $1,140 + $1,560 = $2,700.',

  // license-matched
  'Report users with a seat': 'مستخدمو التقرير الذين لديهم ترخيص',
  'Users who have usage in the report for the period and hold a seat in the license list.':
    'مستخدمون لهم استخدام في التقرير للفترة ولديهم ترخيص في قائمة التراخيص.',
  'Matched users = users in the report whose lower-case username is in the license list':
    'المستخدمون المطابقون = مستخدمو التقرير الذين اسمهم بأحرف صغيرة موجود في قائمة التراخيص',
  'Take the users with usage in the report for the date range. Row filters such as organization or cost center narrow this list. Segment filters do not.':
    'خذ المستخدمين الذين لهم استخدام في التقرير ضمن النطاق الزمني. عوامل تصفية الصفوف، مثل المؤسسة أو مركز التكلفة، تضيّق هذه القائمة. أما عوامل تصفية الشرائح فلا.',
  'Look up the lower-case username of each user in the license list. Spaces around a username do not matter.':
    'ابحث عن اسم المستخدم بأحرف صغيرة لكل مستخدم في قائمة التراخيص. لا تهم المسافات حول الاسم.',
  'The usage of the matched users is the sum of their gross_amount.':
    'استخدام المستخدمين المطابقين هو مجموع gross_amount لديهم.',
  '100 users have usage in the report and 92 of them are in the license list: 92 matched users.':
    'لدى 100 مستخدم استخدام في التقرير، و92 منهم في قائمة التراخيص: 92 مستخدمًا مطابقًا.',

  // license-unmatched
  'Report users without a seat in the license list': 'مستخدمو التقرير الذين لا ترخيص لهم في قائمة التراخيص',
  'Users who have usage in the report but no seat in the license list. The biggest usage comes first.':
    'مستخدمون لهم استخدام في التقرير لكن لا ترخيص لهم في قائمة التراخيص. يأتي الأكبر استخدامًا أولًا.',
  'Unmatched users = users in the report whose lower-case username is not in the license list. Their usage = sum of gross_amount':
    'المستخدمون غير المطابقين = مستخدمو التقرير الذين اسمهم بأحرف صغيرة غير موجود في قائمة التراخيص. استخدامهم = مجموع gross_amount',
  'Take the users with usage in the report for the date range. Row filters narrow this list. Segment filters do not.':
    'خذ المستخدمين الذين لهم استخدام في التقرير ضمن النطاق الزمني. عوامل تصفية الصفوف تضيّق هذه القائمة. أما عوامل تصفية الشرائح فلا.',
  'Keep the users whose lower-case username is not in the license list, and add up their gross_amount.':
    'أبقِ المستخدمين الذين اسمهم بأحرف صغيرة غير موجود في قائمة التراخيص، واجمع gross_amount لديهم.',
  'The data does not say why a user has no seat. Possible reasons: the seat was removed after the usage, the seat belongs to an organization or enterprise that is not in the file, the file is a partial export, or the username is written differently in the two files.':
    'لا تذكر البيانات سبب غياب الترخيص عن المستخدم. من الأسباب الممكنة: أُزيل الترخيص بعد الاستخدام، أو يتبع الترخيص مؤسسة أو حساب Enterprise غير موجود في الملف، أو الملف تصدير ناقص، أو كُتب اسم المستخدم بشكل مختلف في الملفين.',
  'Check these users before you act on the list.': 'تحقق من هؤلاء المستخدمين قبل أن تتصرف بناءً على القائمة.',
  '8 of 100 users in the report are not in the license list. Together they used $400, so the list shows 8 users and $400.':
    '8 من 100 مستخدم في التقرير ليسوا في قائمة التراخيص. استخدموا معًا $400، فتعرض القائمة 8 مستخدمين و$400.',

  // license-coverage (the title 'License coverage' is in ./licenses.ts)
  'The share of the users in the report who hold a seat in the license list. A low share means the license files do not cover everyone in the report.':
    'نسبة مستخدمي التقرير الذين لديهم ترخيص في قائمة التراخيص. النسبة المنخفضة تعني أن ملفات التراخيص لا تغطي كل من في التقرير.',
  'License coverage = matched users ÷ users in the report':
    'تغطية التراخيص = المستخدمون المطابقون ÷ مستخدمو التقرير',
  'It has no value when the report has no users for the period.':
    'لا تكون لها قيمة عندما لا يكون في التقرير مستخدمون في الفترة.',
  'Seats that nobody used do not lower it. They are not in the report. See the unused seats for those.':
    'التراخيص التي لم يستخدمها أحد لا تخفضها، لأنها ليست في التقرير. انظر التراخيص غير المستخدمة لمعرفة تلك التراخيص.',
  'If the share is low, import the license files of every organization and enterprise that has seats.':
    'إذا كانت النسبة منخفضة، فاستورد ملفات التراخيص لكل مؤسسة ولكل حساب Enterprise فيه تراخيص.',
  '92 matched users ÷ 100 users in the report = 92%.':
    '92 مستخدمًا مطابقًا ÷ 100 مستخدم في التقرير = 92%.',

  // license-outside-scope
  'Seats not in this period': 'تراخيص ليست في هذه الفترة',
  'Seats whose user has usage in the loaded files, but not in the date range and filters you are looking at.':
    'تراخيص لمستخدمها استخدام في الملفات المحمّلة، لكن ليس ضمن النطاق الزمني وعوامل التصفية التي تعرضها الآن.',
  'Seats not in this period = seats − matched users − seats that never appear in the report':
    'تراخيص ليست في هذه الفترة = التراخيص − المستخدمون المطابقون − التراخيص التي لا تظهر في التقرير أبدًا',
  'The three parts add up to all seats: matched users, seats not in this period, and seats that never appear in the report.':
    'الأجزاء الثلاثة مجموعها كل التراخيص: المستخدمون المطابقون، والتراخيص التي ليست في هذه الفترة، والتراخيص التي لا تظهر في التقرير أبدًا.',
  'Widen the date range or clear the row filters, and some of these seats become matched users.':
    'وسّع النطاق الزمني أو امسح عوامل تصفية الصفوف، فيصبح بعض هذه التراخيص لمستخدمين مطابقين.',
  '250 seats, of which 200 are matched users and 20 never appear in the report: 250 − 200 − 20 = 30 seats not in this period.':
    '250 ترخيصًا، منها 200 لمستخدمين مطابقين و20 لا تظهر في التقرير أبدًا: 250 − 200 − 20 = 30 ترخيصًا ليست في هذه الفترة.',

  // license-active-recently
  'Recently active seats': 'تراخيص نشطة مؤخرًا',
  'Seats whose last activity was fewer than 30 days before the as-of date. The seat is in use.':
    'تراخيص كان آخر نشاط لها قبل التاريخ المرجعي بأقل من 30 يومًا. الترخيص قيد الاستخدام.',
  'Recently active seat = seat with fewer than 30 days between its last activity and the as-of date':
    'الترخيص النشط مؤخرًا = ترخيص مرّ على آخر نشاط له أقل من 30 يومًا حتى التاريخ المرجعي',
  'Activity includes code completions and chat in the IDE. They are not in the usage report. So a recently active seat can have no usage in the report. See quiet but active seats.':
    'يشمل النشاط إكمالات التعليمات البرمجية والدردشة في IDE. وهذه ليست في تقرير الاستخدام. لذلك قد لا يكون للترخيص النشط مؤخرًا أي استخدام في التقرير. انظر التراخيص الهادئة لكنها نشطة.',
  'The other bands are fading seats (30 to 89 days), seats with no recent activity date, and seats to free (90 days or more).':
    'المجموعات الأخرى هي التراخيص المتراجعة (من 30 إلى 89 يومًا)، والتراخيص التي بلا تاريخ نشاط حديث، والتراخيص المطلوب تحريرها (90 يومًا أو أكثر).',
  'The as-of date is June 30. A seat last active on June 20 has 10 days since its last activity, so it is recently active.':
    'التاريخ المرجعي هو 30 يونيو. ترخيص كان آخر نشاط له في 20 يونيو مرّت 10 أيام على آخر نشاط له، فهو نشط مؤخرًا.',

  // license-reclaim (the title 'Seats to free' is in ./licenses.ts)
  'Seats whose dated last activity was 90 days or more before the as-of date. A blank date is not proof that the user never used the seat.':
    'تراخيص كان تاريخ آخر نشاط لها قبل التاريخ المرجعي بـ90 يومًا أو أكثر. التاريخ الفارغ لا يثبت أن المستخدم لم يستعمل الترخيص.',
  'Seat to free = seat with a dated last activity at least 90 days ago, not new, not pending cancellation and with no newer usage in loaded files. Value = sum of seat prices':
    'الترخيص المطلوب تحريره = ترخيص له تاريخ آخر نشاط مضى عليه 90 يومًا على الأقل، وليس جديدًا أو منتظرًا للإلغاء، ولا استخدام أحدث له في الملفات المحمّلة. القيمة = مجموع أسعار التراخيص',
  'For each seat, count the days from the last activity in the license data to the as-of date.':
    'لكل ترخيص، احسب الأيام من آخر نشاط في بيانات التراخيص حتى التاريخ المرجعي.',
  'The seat is on the list only when it has a dated last activity at least 90 days ago. Seats with no activity date are shown separately for review.':
    'يدخل الترخيص القائمة فقط عندما يكون له تاريخ آخر نشاط مضى عليه 90 يومًا على الأقل. وتُعرض التراخيص التي بلا تاريخ نشاط في قائمة منفصلة للمراجعة.',
  'New seats and seats with a pending cancellation are left out. They have their own lists.':
    'تُستثنى التراخيص الجديدة والتراخيص التي تنتظر الإلغاء. لكل منها قائمتها.',
  'A seat is also left out when its user has usage in any loaded file fewer than 90 days before the as-of date, or after it. The report then shows more recent use than the license data.':
    'ويُستثنى الترخيص أيضًا إذا كان لمستخدمه استخدام في أي ملف محمّل قبل التاريخ المرجعي بأقل من 90 يومًا، أو بعده. فالتقرير يُظهر حينئذ استخدامًا أحدث من بيانات التراخيص.',
  'The reason is no activity for 90 days or more.':
    'السبب هو عدم وجود نشاط منذ 90 يومًا أو أكثر.',
  'Value = sum of the monthly prices of these seats: $19 for Business, $39 for Enterprise, otherwise the seat size in the report.':
    'القيمة = مجموع الأسعار الشهرية لهذه التراخيص: $19 لـ Business و$39 لـ Enterprise، وإلا فحجم الترخيص في التقرير.',
  'Activity comes from IDE telemetry and can lag by a day. A user who works where no telemetry is sent can look inactive. Check before you remove a seat.':
    'يأتي النشاط من بيانات القياس عن بُعد في IDE وقد يتأخر يومًا. وقد يبدو المستخدم الذي يعمل حيث لا تُرسل هذه البيانات غير نشط. تحقق قبل أن تزيل أي ترخيص.',
  'The value overlaps the savings of idle seats and unused seats, because one seat can be on several lists. Do not add them together.':
    'تتداخل هذه القيمة مع توفير التراخيص الخاملة والتراخيص غير المستخدمة، لأن الترخيص الواحد قد يكون في عدة قوائم. لا تجمعها معًا.',
  'A file without activity data, such as a plain list of usernames, gives no seats to free.':
    'الملف الذي بلا بيانات نشاط، مثل قائمة أسماء المستخدمين، لا يتيح تحديد تراخيص مطلوب تحريرها.',
  'The date range and the filters do not change this list. The usage check looks at every loaded row.':
    'النطاق الزمني وعوامل التصفية لا تغيّر هذه القائمة. فحص الاستخدام ينظر إلى كل صف محمّل.',
  'A Business seat has a last activity date 100 days before the as-of date. The user is not new, has no pending cancellation and has no usage in the last 90 days. The seat is on the list, and $19 a month is counted. A blank activity date goes to the review list instead.':
    'لترخيص Business تاريخ آخر نشاط يسبق التاريخ المرجعي بـ100 يوم. المستخدم ليس جديدًا، ولا ينتظر الإلغاء، وليس له استخدام في آخر 90 يومًا. يظهر الترخيص في القائمة ويُحسب $19 في الشهر. أما تاريخ النشاط الفارغ فيُعرض في قائمة المراجعة.',

  // license-fading (the title 'Fading seats' is in ./licenses.ts)
  'Seats whose last activity was 30 to 89 days before the as-of date. Use is slowing down, so a reminder to the user fits better than taking the seat back.':
    'تراخيص كان آخر نشاط لها قبل التاريخ المرجعي بين 30 و89 يومًا. الاستخدام يتباطأ، لذلك يناسب تذكير المستخدم أكثر من استرداد الترخيص.',
  'Fading seat = seat with 30 to 89 days since its last activity, no pending cancellation, and no usage in any loaded file fewer than 30 days before the as-of date':
    'الترخيص المتراجع = ترخيص مرّ على آخر نشاط له من 30 إلى 89 يومًا، ولا ينتظر الإلغاء، وبلا استخدام في أي ملف محمّل قبل التاريخ المرجعي بأقل من 30 يومًا',
  'At 90 days without activity, a fading seat becomes a seat to free.':
    'عند بلوغ 90 يومًا بلا نشاط، يصبح الترخيص المتراجع ترخيصًا يمكن تحريره.',
  'A seat last active 45 days before the as-of date is fading. It becomes a seat to free when the count reaches 90 days.':
    'ترخيص كان آخر نشاط له قبل التاريخ المرجعي بـ45 يومًا هو ترخيص متراجع. ويصبح ترخيصًا يمكن تحريره عندما يبلغ العدد 90 يومًا.',

  // license-quiet
  'Quiet but active seats': 'تراخيص هادئة لكنها نشطة',
  'Seats with activity in the last 30 days but no usage in the report. They are not idle, because code completions are not part of the AI credits report.':
    'تراخيص لها نشاط في آخر 30 يومًا لكن بلا استخدام في التقرير. وهي ليست خاملة، لأن إكمالات التعليمات البرمجية ليست جزءًا من تقرير أرصدة الذكاء الاصطناعي.',
  'Quiet but active seat = seat with fewer than 30 days since its last activity and no usage in the report for the period':
    'الترخيص الهادئ لكنه نشط = ترخيص مرّ على آخر نشاط له أقل من 30 يومًا وبلا استخدام في التقرير للفترة',
  'Do not take these seats back on this evidence. The license data says the seat is in use.':
    'لا تسترد هذه التراخيص استنادًا إلى هذا الدليل. فبيانات التراخيص تقول إن الترخيص قيد الاستخدام.',
  'A seat with a pending cancellation is not listed here.': 'الترخيص الذي ينتظر الإلغاء لا يُدرج هنا.',
  'A seat was active 5 days before the as-of date and the user has no rows in the report. The seat is quiet but active, and not idle.':
    'كان الترخيص نشطًا قبل التاريخ المرجعي بـ5 أيام وليس لمستخدمه أي صفوف في التقرير. الترخيص هادئ لكنه نشط، وليس خاملًا.',

  // license-never-signed-in
  'Seats that never signed in': 'تراخيص لم يُسجَّل الدخول بها قط',
  'Seats with no sign-in and no activity in the export. Somebody holds the seat, but nobody has used it.':
    'تراخيص بلا تسجيل دخول وبلا نشاط في التصدير. الترخيص مُسنَد إلى شخص، لكن لم يستخدمه أحد.',
  'Never signed in = seat with no last sign-in date and no last activity date, in a file that has activity data':
    'لم يسجّل الدخول قط = ترخيص بلا تاريخ لآخر تسجيل دخول وبلا تاريخ لآخر نشاط، في ملف فيه بيانات نشاط',
  'A seat that signed in but has no activity is called never active. Both are seats to free, unless the seat is new.':
    'الترخيص الذي سُجّل الدخول به لكن بلا نشاط يسمى "لم ينشط قط". وكلاهما ترخيص يمكن تحريره، ما لم يكن الترخيص جديدًا.',
  'A new seat has had little time to sign in, so it is not on the list of seats to free. See new seats.':
    'الترخيص الجديد لم يُتح له وقت كافٍ لتسجيل الدخول، فلا يدخل قائمة التراخيص التي يمكن تحريرها. انظر التراخيص الجديدة.',
  'A plain list of usernames has no dates, so it says nothing about sign-ins.':
    'القائمة البسيطة بأسماء المستخدمين بلا تواريخ، فلا تقول شيئًا عن تسجيلات الدخول.',
  'A seat was created 120 days before the as-of date. It has no sign-in date and no activity date. It is a seat that never signed in, and a seat to free.':
    'أُنشئ ترخيص قبل التاريخ المرجعي بـ120 يومًا. ليس له تاريخ تسجيل دخول ولا تاريخ نشاط. إنه ترخيص لم يُسجَّل الدخول به قط، وترخيص يمكن تحريره.',

  // license-pending-cancellation
  'Seats with a pending cancellation': 'تراخيص بانتظار الإلغاء',
  'Seats that already have a cancellation date in the export. They end on that date, so the app does not count them as savings.':
    'تراخيص لها تاريخ إلغاء في التصدير. تنتهي في ذلك التاريخ، لذلك لا يحسبها التطبيق توفيرًا.',
  'Pending cancellation = seat with a cancellation date in the license file':
    'بانتظار الإلغاء = ترخيص له تاريخ إلغاء في ملف التراخيص',
  'These seats are left out of the idle seats, unused seats, seats to free and fading seats, and out of the Enterprise seats to move to Business.':
    'تُستثنى هذه التراخيص من التراخيص الخاملة والتراخيص غير المستخدمة والتراخيص التي يمكن تحريرها والتراخيص المتراجعة، ومن تراخيص Enterprise التي يمكن نقلها إلى Business.',
  'They still count in the seat totals, because they hold a seat until that date.':
    'وما زالت تُحسب في إجمالي التراخيص، لأنها تبقى قائمة حتى ذلك التاريخ.',
  '3 seats have a cancellation date of the 15th. The list shows 3 seats, and none of them is counted as a saving.':
    'لـ3 تراخيص تاريخ إلغاء هو اليوم 15. تعرض القائمة 3 تراخيص، ولا يُحسب أي منها توفيرًا.',

  // license-new-seats (the title 'New seats' is in ./licenses.ts)
  'Seats created within the new user window before the as-of date. They have had little time to be used, so they are never seats to free or unused seats.':
    'تراخيص أُنشئت ضمن فترة المستخدم الجديد قبل التاريخ المرجعي. لم يتح لها وقت كافٍ للاستخدام، لذلك لا تكون أبدًا تراخيص يمكن تحريرها ولا تراخيص غير مستخدمة.',
  'New seat = as-of date − creation date of the seat < new user window':
    'الترخيص الجديد = التاريخ المرجعي − تاريخ إنشاء الترخيص < فترة المستخدم الجديد',
  'It needs the creation date. The seats API has it. The activity report does not.':
    'يحتاج إلى تاريخ الإنشاء. واجهة التراخيص البرمجية فيها هذا التاريخ، أما تقرير النشاط فلا.',
  'A seat can be new and quiet at the same time. It then appears on both lists.':
    'قد يكون الترخيص جديدًا وهادئًا في الوقت نفسه. فيظهر حينئذ في القائمتين.',
  'With a new user window of 14 days, a seat created 10 days before the as-of date is new. A seat created 14 days before is not.':
    'مع فترة مستخدم جديد مدتها 14 يومًا، يكون الترخيص الذي أُنشئ قبل التاريخ المرجعي بـ10 أيام جديدًا. أما الذي أُنشئ قبله بـ14 يومًا فليس جديدًا.',

  // license-as-of
  'License as-of date': 'التاريخ المرجعي للتراخيص',
  'The date from which the days without activity are counted. It is the date of the license export, not today.':
    'التاريخ الذي تُحسب منه أيام عدم النشاط. هو تاريخ تصدير التراخيص، وليس اليوم.',
  'Days since activity = as-of date − date of the last activity':
    'الأيام منذ آخر نشاط = التاريخ المرجعي − تاريخ آخر نشاط',
  'If Settings has a license export date, that is the as-of date. An import sets it to the newest date in the file: the report time of an activity report, or the latest activity, sign-in or creation date of a seats API file.':
    'إذا كان في الإعدادات تاريخ تصدير للتراخيص، فهو التاريخ المرجعي. يضبطه الاستيراد على أحدث تاريخ في الملف: وقت إصدار تقرير النشاط، أو أحدث تاريخ نشاط أو تسجيل دخول أو إنشاء في ملف واجهة التراخيص البرمجية.',
  'If no export date is set, the newest date found in the license list is used.':
    'إذا لم يُحدد تاريخ تصدير، يُستخدم أحدث تاريخ موجود في قائمة التراخيص.',
  'A license list without any date has no as-of date. The app cannot judge activity then, and it shows no activity lists.':
    'قائمة التراخيص التي بلا أي تاريخ ليس لها تاريخ مرجعي. لا يستطيع التطبيق حينئذ الحكم على النشاط، ولا يعرض قوائم النشاط.',
  'Fewer than 30 days: recently active. 30 to 89 days: fading. 90 days or more: inactive. A blank activity date has no activity status. The days are whole calendar days in UTC.':
    'أقل من 30 يومًا: نشط مؤخرًا. من 30 إلى 89 يومًا: متراجع. 90 يومًا أو أكثر: غير نشط. لا تُحدد حالة النشاط عند فراغ تاريخ النشاط. الأيام أيام تقويم كاملة بالتوقيت العالمي UTC.',
  'Counting from the export date keeps an old export from making every seat look stale.':
    'العدّ من تاريخ التصدير يمنع أي تصدير قديم من أن يجعل كل التراخيص تبدو راكدة.',
  'If the usage report runs more than 30 days past the as-of date, the export is old. Seats may have been added, used or removed since. Import a fresh export.':
    'إذا امتد تقرير الاستخدام أكثر من 30 يومًا بعد التاريخ المرجعي، فالتصدير قديم. وقد أُضيفت تراخيص أو استُخدمت أو أُزيلت منذ ذلك الحين. استورد تصديرًا جديدًا.',
  'The export date is June 30. A seat last active on June 20 has 10 days since its last activity, so it is recently active. A seat last active on March 31 has 91 days, so it is a seat to free.':
    'تاريخ التصدير هو 30 يونيو. ترخيص كان آخر نشاط له في 20 يونيو مرّت 10 أيام على آخر نشاط له، فهو نشط مؤخرًا. وترخيص كان آخر نشاط له في 31 مارس مرّ 91 يومًا، فهو ترخيص يمكن تحريره.',
};

export default ar;
