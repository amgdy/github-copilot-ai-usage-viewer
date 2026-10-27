import type { Dict } from '../core';

/** Arabic for the Organization metric docs in `lib/metrics/docs/organization.ts`. */
const ar: Dict = {
  // Groups
  'How usage is assigned to groups': 'كيف يُنسب الاستخدام إلى المجموعات',
  'Every row of the report names an organization, a cost center, a repository, an application and a product, or leaves one of them empty. A group is one value of the field you pick under View by. Its usage is the usage of the rows that carry that value.':
    'يذكر كل صف في التقرير مؤسسة ومركز تكلفة ومستودعًا وتطبيقًا ومنتجًا، أو يترك أحدها فارغًا. المجموعة هي قيمة واحدة من الحقل الذي تختاره في العرض حسب. واستخدامها هو استخدام الصفوف التي تحمل تلك القيمة.',
  'Group usage = sum of gross_amount of the rows that carry the value of the group': 'استخدام المجموعة = مجموع gross_amount للصفوف التي تحمل قيمة المجموعة',
  'Pick the field under View by: Organization, Cost center, Repository, Application or Product. With a license list that names teams, Team (from license list) is offered too, see Teams from the license list.':
    'اختر الحقل في العرض حسب: المؤسسة أو مركز التكلفة أو المستودع أو التطبيق أو المنتج. ومع قائمة تراخيص تذكر الفرق يُتاح أيضًا الفريق (من قائمة التراخيص)، انظر الفرق من قائمة التراخيص.',
  'Each row has one value in that field, so it belongs to exactly one group. The groups do not overlap and together make up all usage in the view.':
    'لكل صف قيمة واحدة في ذلك الحقل، فينتمي إلى مجموعة واحدة بالضبط. لا تتداخل المجموعات، ومعًا تشكّل كل الاستخدام في العرض.',
  'Rows where the field is empty form one group of their own, named (no organization), (no cost center), (no repository), (no app) or (none) for products. It is the unattributed usage.':
    'الصفوف التي يكون فيها الحقل فارغًا تشكّل مجموعة خاصة بها، اسمها (بلا مؤسسة) أو (بلا مركز تكلفة) أو (بلا مستودع) أو (بلا تطبيق) أو (لا يوجد) للمنتجات. وهي الاستخدام غير المنسوب.',
  'Usage, covered, billed and the token counts of a group are plain sums over its rows. The users of a group are counted differently, see Users in a group.':
    'الاستخدام والمشمول بالخطة والمدفوع الإضافي وأعداد الرموز لمجموعة هي مجاميع بسيطة على صفوفها. أما مستخدمو المجموعة فيُحسبون بطريقة أخرى، انظر المستخدمون في مجموعة.',
  'Groups are made of rows, not of people. A person who works for two cost centers has rows in both, and their usage is split between the two by row.':
    'تتكوّن المجموعات من صفوف لا من أشخاص. الشخص الذي يعمل لمركزي تكلفة له صفوف في كليهما، ويُقسَّم استخدامه بينهما حسب الصف.',
  'Rows without a username, such as repository-level products, are in the groups too. They count in the usage of a group but in none of its users.':
    'الصفوف التي ليس فيها اسم مستخدم، مثل منتجات مستوى المستودع، موجودة في المجموعات أيضًا. تُحسب في استخدام المجموعة لكن لا تُحسب لأي من مستخدميها.',
  'Groups follow the filters and the selected dates. The Filter button on a row narrows the whole report to that group.':
    'تتبع المجموعات عوامل التصفية والتواريخ المحددة. زر التصفية في الصف يقصر التقرير كله على تلك المجموعة.',
  'The Showback table assigns each person to one cost center instead, because a bill needs one owner for each seat. See Showback and chargeback.':
    'أما جدول عرض التكلفة فينسب كل شخص إلى مركز تكلفة واحد، لأن الفاتورة تحتاج إلى مالك واحد لكل ترخيص. انظر عرض التكلفة وتحميلها.',
  'A cost center with 30 rows of $2 and 10 rows of $5 has a usage of $110.': 'مركز تكلفة فيه 30 صفًا بقيمة $2 و10 صفوف بقيمة $5 استخدامه $110.',
  'Number of groups': 'عدد المجموعات',
  'How many different values of the chosen field have usage in the view. The label of the card follows the field, for example Cost centers.':
    'كم قيمة مختلفة من الحقل المختار لها استخدام في العرض. يتبع عنوان البطاقة الحقل، مثل مراكز التكلفة.',
  'Number of groups = distinct values of the field with at least one row, not counting the empty value':
    'عدد المجموعات = القيم المختلفة للحقل التي لها صف واحد على الأقل، دون احتساب القيمة الفارغة',
  'Usage with no value is not counted here. It shows as Unattributed usage.': 'الاستخدام بلا قيمة لا يُحسب هنا. يظهر بوصفه الاستخدام غير المنسوب.',
  'With one group only, the page says that there is nothing to compare.': 'مع مجموعة واحدة فقط، تذكر الصفحة أنه لا يوجد ما يُقارن.',
  'Rows that name the cost centers Alpha, Beta and Gamma, plus some rows with no cost center, make 3 groups.':
    'صفوف تذكر مراكز التكلفة Alpha وBeta وGamma، مع بعض الصفوف بلا مركز تكلفة، تشكّل 3 مجموعات.',
  'The group with the most usage, with its share of all usage and its usage in dollars.': 'المجموعة صاحبة أكبر استخدام، مع حصتها من كل الاستخدام واستخدامها بالدولار.',
  'Largest group = the group with the highest group usage, not counting the empty value': 'أكبر مجموعة = المجموعة صاحبة أعلى استخدام، دون احتساب القيمة الفارغة',
  'Add up the usage of each group.': 'اجمع استخدام كل مجموعة.',
  'Take the group with the highest usage. Unattributed usage does not take part.': 'خذ المجموعة صاحبة أعلى استخدام. الاستخدام غير المنسوب لا يدخل.',
  'The share under the name is its usage ÷ all usage in the view.': 'الحصة تحت الاسم هي استخدامها ÷ كل الاستخدام في العرض.',
  'Unattributed usage can be larger than the largest group. It is not a group, so it is never named here.':
    'قد يكون الاستخدام غير المنسوب أكبر من أكبر مجموعة. لكنه ليس مجموعة، فلا يُذكر هنا أبدًا.',
  'The share divides by all usage in the view, including unattributed usage.': 'تُقسَم الحصة على كل الاستخدام في العرض، بما فيه الاستخدام غير المنسوب.',
  'Three cost centers use $4,000, $3,000 and $1,000, and $2,000 has no cost center, so all usage is $10,000. The largest group is the one with $4,000, a share of 40%.':
    'ثلاثة مراكز تكلفة تستخدم $4,000 و$3,000 و$1,000، و$2,000 بلا مركز تكلفة، فكل الاستخدام $10,000. أكبر مجموعة هي صاحبة $4,000، بحصة 40%.',
  'How much of all usage comes from the three largest groups. A high share means that a few groups decide the bill.':
    'كم من كل الاستخدام يأتي من أكبر ثلاث مجموعات. الحصة المرتفعة تعني أن مجموعات قليلة تحدد الفاتورة.',
  'Top 3 share = usage of the 3 largest groups ÷ usage of all rows in the view': 'حصة أكبر 3 = استخدام أكبر 3 مجموعات ÷ استخدام كل الصفوف في العرض',
  'The divisor is all usage, including unattributed usage and the groups outside the top 3. Unattributed usage is never one of the 3.':
    'المقسوم عليه هو كل الاستخدام، بما فيه الاستخدام غير المنسوب والمجموعات خارج أكبر 3. والاستخدام غير المنسوب لا يكون أبدًا من الثلاث.',
  'With 3 groups or fewer, the line under the number says how many there are, and the share is 100% minus the unattributed share.':
    'مع 3 مجموعات أو أقل، يذكر السطر تحت الرقم عددها، وتكون الحصة 100% ناقص حصة الاستخدام غير المنسوب.',
  'Four groups use $5,000, $3,000, $1,000 and $500, and $500 has no group, so all usage is $10,000. The top 3 carry $9,000 ÷ $10,000 = 90%.':
    'أربع مجموعات تستخدم $5,000 و$3,000 و$1,000 و$500، و$500 بلا مجموعة، فكل الاستخدام $10,000. تتحمل أكبر 3 مجموعات $9,000 ÷ $10,000 = 90%.',
  'Usage on rows that have no value in the chosen field, so it cannot be assigned to any group. It cannot be charged back to a team.':
    'استخدام على صفوف ليس لها قيمة في الحقل المختار، فلا يمكن نسبته إلى أي مجموعة. ولا يمكن تحميله على فريق.',
  'Unattributed usage = sum of gross_amount of the rows where the field is empty': 'الاستخدام غير المنسوب = مجموع gross_amount للصفوف التي يكون فيها الحقل فارغًا',
  'The line under the number is its share of all usage. The card is highlighted when that share is 20% or more.':
    'السطر تحت الرقم هو حصته من كل الاستخدام. تُبرَز البطاقة عندما تبلغ هذه الحصة 20% أو أكثر.',
  'Repository-level products (such as code quality) have no user and often no cost center. Usage by people is often not linked to a repository.':
    'منتجات مستوى المستودع (مثل جودة الكود) ليس لها مستخدم وغالبًا ليس لها مركز تكلفة. واستخدام الأشخاص غالبًا لا يرتبط بمستودع.',
  'Each field has its own empty label: (no organization), (no cost center), (no repository), (no app) and (none) for products.':
    'لكل حقل اسم خاص للقيمة الفارغة: (بلا مؤسسة) و(بلا مركز تكلفة) و(بلا مستودع) و(بلا تطبيق) و(لا يوجد) للمنتجات.',
  'It is $0.00 when every row names its group.': 'يكون $0.00 عندما يذكر كل صف مجموعته.',
  'If $2,000 of $10,000 in usage is on rows with no cost center, the unattributed usage is $2,000, or 20% of all usage.':
    'إذا كان $2,000 من استخدام قدره $10,000 على صفوف بلا مركز تكلفة، فالاستخدام غير المنسوب $2,000، أي 20% من كل الاستخدام.',
  'Group with the most billed usage': 'المجموعة صاحبة أكبر استخدام مدفوع إضافي',
  'The line under Billed on top of seats names the group that carries the largest part of the billed amount, and how large that part is.':
    'يذكر السطر تحت المدفوع الإضافي فوق رسوم التراخيص المجموعة التي تتحمل الجزء الأكبر من المبلغ المدفوع الإضافي، وحجم هذا الجزء.',
  'Share of billed = billed on the rows of the group ÷ billed on all rows in the view': 'الحصة من المدفوع الإضافي = المدفوع الإضافي على صفوف المجموعة ÷ المدفوع الإضافي على كل الصفوف في العرض',
  'Add up billed (net_amount) for each group. The unattributed group takes part, because billed amounts belong to rows and not to people.':
    'اجمع المدفوع الإضافي (net_amount) لكل مجموعة. تدخل مجموعة الاستخدام غير المنسوب، لأن المبالغ المدفوعة الإضافية تتبع الصفوف لا الأشخاص.',
  'Take the group with the largest amount. Groups below half a cent are ignored.': 'خذ المجموعة صاحبة أكبر مبلغ. تُتجاهل المجموعات التي تقل عن نصف سنت.',
  'Divide its billed amount by the billed amount of the whole view.': 'اقسم مبلغها المدفوع الإضافي على المبلغ المدفوع الإضافي للعرض كله.',
  'Included credits are pooled across all users. The overage falls on the rows that come after the pool is used up, so a group that uses its credits late in the month tends to carry the bill. That is not always the group that uses the most.':
    'الأرصدة المشمولة مجمّعة في رصيد مشترك لكل المستخدمين. يقع التجاوز على الصفوف التي تأتي بعد نفاد الرصيد المشترك، لذلك تميل المجموعة التي تستخدم أرصدتها في آخر الشهر إلى تحمّل الفاتورة. وليست هي دائمًا المجموعة الأكثر استخدامًا.',
  'When nothing is billed, the line says so. When the file has no billing split, the card shows a dash and "Not in this file".':
    'إذا لم يُدفع شيء إضافي، يذكر السطر ذلك. وإذا لم يكن في الملف تقسيم للفوترة، تعرض البطاقة شرطة و"غير موجود في هذا الملف".',
  'If $2,000 is billed in total and one group has $1,200 of it on its rows, the line says that this group carries 60% of it.':
    'إذا كان المدفوع الإضافي $2,000 في المجموع ولمجموعة واحدة $1,200 منه على صفوفها، يذكر السطر أن هذه المجموعة تتحمل 60% منه.',

  // Group table
  'Group share of usage': 'حصة المجموعة من الاستخدام',
  'The part of all usage in the view that a group is responsible for.': 'الجزء من كل الاستخدام في العرض الذي تُسأل عنه المجموعة.',
  'Share = usage of the group ÷ usage of all rows in the view': 'الحصة = استخدام المجموعة ÷ استخدام كل الصفوف في العرض',
  'The divisor includes unattributed usage, so the shares of the groups with a value add up to 100% minus the unattributed share.':
    'يشمل المقسوم عليه الاستخدام غير المنسوب، فمجموع حصص المجموعات التي لها قيمة يساوي 100% ناقص حصة الاستخدام غير المنسوب.',
  'The bar in the table is scaled to the largest share in the table, not to 100%.': 'يُقاس الشريط في الجدول على أكبر حصة في الجدول، لا على 100%.',
  'The Total row adds up the shares of the rows that match the search.': 'يجمع صف الإجمالي حصص الصفوف المطابقة للبحث.',
  'It is 0% when the view has no usage at all.': 'يكون 0% عندما لا يكون في العرض أي استخدام.',
  'A group with $2,500 of $10,000 in usage has a share of 25%.': 'مجموعة لها $2,500 من استخدام قدره $10,000 حصتها 25%.',
  'Users in a group': 'المستخدمون في مجموعة',
  'The number of different people who have usage in the group.': 'عدد الأشخاص المختلفين الذين لهم استخدام في المجموعة.',
  'Users = number of distinct usernames with at least one row in the group': 'المستخدمون = عدد أسماء المستخدمين المختلفة التي لها صف واحد على الأقل في المجموعة',
  'A person with rows in several groups is counted in each of them, so the users of all groups add up to more than the number of active users. The Total row shows the number of distinct users in the view. It shows a dash while a search leaves out some groups.':
    'الشخص الذي له صفوف في عدة مجموعات يُحسب في كل منها، فيزيد مجموع مستخدمي كل المجموعات على عدد المستخدمين النشطين. يعرض صف الإجمالي عدد المستخدمين المختلفين في العرض، ويعرض شرطة ما دام البحث يستبعد بعض المجموعات.',
  'Rows without a username, such as repository-level products, belong to no user. A group made only of such rows has 0 users.':
    'الصفوف التي ليس فيها اسم مستخدم، مثل منتجات مستوى المستودع، لا تخص أي مستخدم. المجموعة المكوّنة من هذه الصفوف فقط لها 0 مستخدمين.',
  'The column is hidden when no group has a user.': 'يُخفى العمود عندما لا يكون لأي مجموعة مستخدم.',
  'The Showback table counts each person once, in one group. See People in a showback group.': 'يحسب جدول عرض التكلفة كل شخص مرة واحدة، في مجموعة واحدة. انظر الأشخاص في مجموعة عرض التكلفة.',
  'A person who used GitHub Copilot in two cost centers counts as 1 user in each of them and as 1 active user in the whole report.':
    'الشخص الذي استخدم GitHub Copilot في مركزي تكلفة يُحسب مستخدمًا واحدًا في كل منهما ومستخدمًا نشطًا واحدًا في التقرير كله.',
  'The usage of an average user of the group in a month. Compare it with the credits of a seat to see whether the people of the group stay inside their own allowance.':
    'استخدام مستخدم متوسط في المجموعة في الشهر. قارنه بأرصدة الترخيص لتعرف هل يبقى أشخاص المجموعة ضمن حصتهم.',
  'Usage per user / month = usage of the group ÷ users of the group × 30.4375 ÷ days in the period':
    'الاستخدام لكل مستخدم / شهر = استخدام المجموعة ÷ مستخدمي المجموعة × 30.4375 ÷ أيام الفترة',
  'The days in the period are all days of the selected dates, also the days without usage.': 'أيام الفترة هي كل أيام التواريخ المحددة، ومنها الأيام التي لا استخدام فيها.',
  'The usage of the group includes rows without a username, but the users do not. A group with many such rows looks more costly per user than its people are.':
    'يشمل استخدام المجموعة الصفوف التي ليس فيها اسم مستخدم، أما المستخدمون فلا. المجموعة التي فيها كثير من هذه الصفوف تبدو أكثر تكلفة لكل مستخدم مما هم عليه فعلًا.',
  'It is a dash when the group has no users. The Total row is all usage per user, and a dash while a search leaves out some groups.':
    'يكون شرطة عندما لا يكون للمجموعة مستخدمون. صف الإجمالي هو كل الاستخدام لكل مستخدم، وشرطة ما دام البحث يستبعد بعض المجموعات.',
  '$3,000 of usage and 60 users over 61 days: $3,000 ÷ 60 = $50, and $50 × 30.4375 ÷ 61 is about $25 per user, per month.':
    'استخدام قدره $3,000 و60 مستخدمًا في 61 يومًا: $3,000 ÷ 60 = $50، و$50 × 30.4375 ÷ 61 تساوي نحو $25 لكل مستخدم في الشهر.',
  'Group trend': 'اتجاه المجموعة',
  'Whether the usage of a group is growing: the last 7 days of the period against the 7 days right before them.':
    'هل ينمو استخدام المجموعة: آخر 7 أيام من الفترة مقارنةً بالأيام السبعة التي قبلها مباشرة.',
  'Trend = usage of the last 7 days ÷ usage of the 7 days before − 1': 'الاتجاه = استخدام آخر 7 أيام ÷ استخدام الأيام السبعة التي قبلها − 1',
  'The last 7 days end on the last day of the selected dates.': 'تنتهي آخر 7 أيام في آخر يوم من التواريخ المحددة.',
  'The 7 days before are the week that comes right before them.': 'الأيام السبعة التي قبلها هي الأسبوع الذي يسبقها مباشرة.',
  'The trend is the last week divided by the week before, minus 1.': 'الاتجاه هو الأسبوع الأخير مقسومًا على الأسبوع الذي قبله، ناقص 1.',
  'It needs a period of at least 14 days. For a shorter period every group shows a dash.': 'يحتاج إلى فترة من 14 يومًا على الأقل. في فترة أقصر تعرض كل مجموعة شرطة.',
  'A group with usage in the last 7 days and none in the 7 days before shows new. A group with no usage in the last 7 days and none before shows a dash.':
    'المجموعة التي لها استخدام في آخر 7 أيام ولا استخدام لها في الأيام السبعة التي قبلها تعرض جديد. والمجموعة التي لا استخدام لها في آخر 7 أيام ولا قبلها تعرض شرطة.',
  'A rise of more than 25% is shown in the warning color.': 'الارتفاع الذي يزيد على 25% يظهر بلون التحذير.',
  'It is a short window, not a forecast. One busy week can make a small group look fast growing.':
    'إنها نافذة قصيرة لا توقّع. أسبوع واحد مزدحم قد يجعل مجموعة صغيرة تبدو سريعة النمو.',
  'A group used $480 in the last 7 days and $320 in the 7 days before: $480 ÷ $320 − 1 = +50%, shown in the warning color.':
    'استخدمت مجموعة $480 في آخر 7 أيام و$320 في الأيام السبعة التي قبلها: $480 ÷ $320 − 1 = +50%، ويظهر بلون التحذير.',
  'Billed share of a group': 'الحصة المدفوعة إضافيًا لمجموعة',
  'The part of the usage of a group that went beyond the included credits and is billed on top of seats. It is the Billed share column of the table and the color of the tiles in the treemap.':
    'جزء استخدام المجموعة الذي تجاوز الأرصدة المشمولة ويُدفع إضافيًا فوق رسوم التراخيص. وهو عمود الحصة المدفوعة إضافيًا في الجدول ولون المربعات في الخريطة الشجرية.',
  'Billed share = billed on the rows of the group ÷ usage of the group': 'الحصة المدفوعة إضافيًا = المدفوع الإضافي على صفوف المجموعة ÷ استخدام المجموعة',
  'The Billed share column is hidden at first. Turn it on in the Columns menu above the table.': 'عمود الحصة المدفوعة إضافيًا مخفي في البداية. فعّله من قائمة الأعمدة فوق الجدول.',
  'Included credits are pooled across all users, so the billed share depends on when in the month the usage happened, not only on how much the group used.':
    'الأرصدة المشمولة مجمّعة في رصيد مشترك لكل المستخدمين، فتعتمد الحصة المدفوعة إضافيًا على وقت الاستخدام في الشهر، لا على كمية استخدام المجموعة فقط.',
  'It is a dash when the group has no usage. The column is left out when the file has no billing split.':
    'يكون شرطة عندما لا يكون للمجموعة استخدام. ويُحذف العمود عندما لا يكون في الملف تقسيم للفوترة.',
  'A group with $2,000 of usage and $500 billed has a billed share of 25%.': 'مجموعة استخدامها $2,000 والمدفوع الإضافي $500 حصتها المدفوعة إضافيًا 25%.',
  'Tokens of a group': 'رموز مجموعة',
  'The tokens that the model read and wrote on the rows of the group, as four counts: input, cache read, cache write and output. They show what drives the usage of a group.':
    'الرموز التي قرأها النموذج وكتبها على صفوف المجموعة، في أربعة أعداد: الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها والإخراج. وهي تبيّن ما يحرّك استخدام المجموعة.',
  'Tokens of a group = sum of the input, cache_read, cache_write and output columns over the rows of the group':
    'رموز مجموعة = مجموع أعمدة input وcache_read وcache_write وoutput على صفوف المجموعة',
  'Add up each of the four columns over the rows of the group.': 'اجمع كلًا من الأعمدة الأربعة على صفوف المجموعة.',
  'Total tokens = input + cache read + cache write + output.': 'إجمالي الرموز = الإدخال + القراءة من الذاكرة المؤقتة + الكتابة فيها + الإخراج.',
  'Cache hit rate = cache read ÷ (input + cache read + cache write), worked out from the sums of the group.':
    'نسبة القراءة من الذاكرة المؤقتة = القراءة من الذاكرة المؤقتة ÷ (الإدخال + القراءة من الذاكرة المؤقتة + الكتابة فيها)، محسوبة من مجاميع المجموعة.',
  'The token columns appear when you switch the table from Usage to Tokens, in the header of the table. The group detail shows the same counts.':
    'تظهر أعمدة الرموز عندما تبدّل الجدول من الاستخدام إلى الرموز في رأس الجدول. وتعرض تفاصيل المجموعة الأعداد نفسها.',
  'Every row of the group counts, including rows without a username. A person with rows in two groups has each row counted in its own group.':
    'يُحسب كل صف في المجموعة، ومنها الصفوف التي ليس فيها اسم مستخدم. والشخص الذي له صفوف في مجموعتين يُحسب كل صف له في مجموعته.',
  'The Total row adds up the rows that match the search, and works out its cache hit rate from those sums.':
    'يجمع صف الإجمالي الصفوف المطابقة للبحث، ويحسب نسبة القراءة من الذاكرة المؤقتة من تلك المجاميع.',
  'Rows without token counts add 0, so a group can show fewer tokens than the work behind it. A group with no prompt tokens shows a dash for the cache hit rate.':
    'الصفوف التي ليس فيها أعداد رموز تضيف 0، فقد تعرض المجموعة رموزًا أقل من العمل الفعلي وراءها. والمجموعة التي لا رموز طلب لها تعرض شرطة لنسبة القراءة من الذاكرة المؤقتة.',
  'When the file has no token columns, the Tokens view, the token counts of the group detail and the cache hit rate are left out, and the page says so.':
    'عندما لا يكون في الملف أعمدة رموز، يُحذف عرض الرموز وأعداد الرموز في تفاصيل المجموعة ونسبة القراءة من الذاكرة المؤقتة، وتذكر الصفحة ذلك.',
  'A group with 150,000 input, 800,000 cache read, 50,000 cache write and 200,000 output tokens has 1,200,000 total tokens and a cache hit rate of 800,000 ÷ 1,000,000 = 80%.':
    'مجموعة فيها 150,000 رمز إدخال و800,000 رمز قراءة من الذاكرة المؤقتة و50,000 رمز كتابة فيها و200,000 رمز إخراج إجمالي رموزها 1,200,000 ونسبة القراءة من الذاكرة المؤقتة 800,000 ÷ 1,000,000 = 80%.',

  // Charts
  'Top groups': 'أكبر المجموعات',
  'The groups ranked as bars by one measure that you pick: Usage, Billed, Users or Per user. Click a bar to filter the whole report to that group.':
    'المجموعات مرتبة في أعمدة حسب مقياس واحد تختاره: الاستخدام أو المدفوع الإضافي أو المستخدمون أو لكل مستخدم. انقر عمودًا لتصفية التقرير كله على تلك المجموعة.',
  'Bar = the measure of the group (usage, billed, users or usage per user / month), highest first':
    'العمود = مقياس المجموعة (الاستخدام أو المدفوع الإضافي أو المستخدمون أو الاستخدام لكل مستخدم / شهر)، الأعلى أولًا',
  'Pick Usage, Billed, Users or Per user above the chart.': 'اختر الاستخدام أو المدفوع الإضافي أو المستخدمين أو لكل مستخدم فوق المخطط.',
  'Groups with no value for the measure are left out. The unattributed group is not ranked either.': 'تُستبعد المجموعات التي ليس لها قيمة في المقياس. ولا تُرتَّب مجموعة الاستخدام غير المنسوب أيضًا.',
  'The 15 highest groups get a bar each.': 'تحصل أعلى 15 مجموعة على عمود لكل منها.',
  'For Usage and Billed the other groups are added up in one bar, Other. Users and Per user do not add up, so they have no Other bar.':
    'في الاستخدام والمدفوع الإضافي تُجمع المجموعات الأخرى في عمود واحد هو أخرى. أما المستخدمون ولكل مستخدم فلا يُجمعان، فليس لهما عمود أخرى.',
  'Unattributed usage, when it has a value for the measure, gets its own gray bar at the end.': 'يحصل الاستخدام غير المنسوب، إذا كان له قيمة في المقياس، على عمود رمادي خاص به في النهاية.',
  'The note on a bar gives the share of usage, the billed amount (when the file has the billing split) and the users of the group.':
    'تعطي ملاحظة العمود الحصة من الاستخدام، والمبلغ المدفوع الإضافي (عندما يكون في الملف تقسيم للفوترة)، ومستخدمي المجموعة.',
  'The Billed choice is only there when the file has the billing split.': 'خيار المدفوع الإضافي موجود فقط عندما يكون في الملف تقسيم للفوترة.',
  'Users and Per user leave out groups that have no users.': 'يستبعد المستخدمون ولكل مستخدم المجموعات التي ليس لها مستخدمون.',
  'The line under the title says how many groups are shown, for example Top 15 of 40 cost centers.': 'يذكر السطر تحت العنوان عدد المجموعات المعروضة، مثل أكبر 15 من أصل 40 مركز تكلفة.',
  'With the choice Usage, a group with $4,000 of $10,000 in usage has a bar of $4,000, and its note says 40% of usage.':
    'مع خيار الاستخدام، المجموعة التي لها $4,000 من استخدام قدره $10,000 لها عمود بقيمة $4,000، وتذكر ملاحظتها 40% من الاستخدام.',
  'Usage by group (treemap)': 'الاستخدام حسب المجموعة (خريطة شجرية)',
  'Every group is a tile. The area of a tile is the usage of the group, and its color is the part of that usage that is billed on top of seats.':
    'كل مجموعة مربع. مساحة المربع هي استخدام المجموعة، ولونه هو الجزء من هذا الاستخدام المدفوع إضافيًا فوق رسوم التراخيص.',
  'Tile area = usage of the group, tile color = billed ÷ usage of the group': 'مساحة المربع = استخدام المجموعة، لون المربع = المدفوع الإضافي ÷ استخدام المجموعة',
  'Groups with usage above $0 get a tile, the unattributed group included.': 'تحصل المجموعات التي استخدامها فوق $0 على مربع، ومنها مجموعة الاستخدام غير المنسوب.',
  'The 40 largest groups get their own tile. The others are added up in one gray tile, Other.': 'تحصل أكبر 40 مجموعة على مربع خاص بها. وتُجمع البقية في مربع رمادي واحد هو أخرى.',
  'The color scale runs from 0% to the highest billed share among the tiles shown, in equal steps. The legend under the chart shows both ends.':
    'يمتد مقياس الألوان من 0% إلى أعلى حصة مدفوعة إضافيًا بين المربعات المعروضة، بخطوات متساوية. ويعرض المفتاح تحت المخطط الطرفين.',
  'A tile shows its name when its group carries at least 1.5% of all usage. Hover any tile for its usage, share, billed amount (when the file has the billing split) and users.':
    'يعرض المربع اسمه عندما تتحمل مجموعته 1.5% على الأقل من كل الاستخدام. مرّر المؤشر فوق أي مربع لترى استخدامه وحصته ومبلغه المدفوع الإضافي (عندما يكون في الملف تقسيم للفوترة) ومستخدميه.',
  'Click a tile to filter the report to that group. The Other tile cannot be clicked.': 'انقر مربعًا لتصفية التقرير على تلك المجموعة. لا يمكن نقر مربع أخرى.',
  'When nothing is billed, or the file has no billing split, every tile has the same color and a note under the chart says so.':
    'إذا لم يُدفع شيء إضافي، أو لم يكن في الملف تقسيم للفوترة، يكون لكل المربعات اللون نفسه وتذكر ملاحظة تحت المخطط ذلك.',
  'A group with $4,000 of usage gets twice the area of a group with $2,000. If $1,000 of the $4,000 is billed, its tile is tinted for a billed share of 25%.':
    'المجموعة التي استخدامها $4,000 تحصل على ضعف مساحة مجموعة استخدامها $2,000. وإذا دُفع $1,000 من الـ $4,000 إضافيًا، يُلوَّن مربعها لحصة مدفوعة إضافيًا قدرها 25%.',
  'Group detail: what the usage is made of': 'تفاصيل المجموعة: مما يتكوّن الاستخدام',
  'A donut that splits the usage of the selected group by product. For a product group it splits by cost center instead, or by organization when the file has no cost centers, because a product split by product says nothing.':
    'مخطط دائري يقسم استخدام المجموعة المحددة حسب المنتج. ولمجموعة منتج يقسم حسب مركز التكلفة بدلًا من ذلك، أو حسب المؤسسة عندما لا يكون في الملف مراكز تكلفة، لأن تقسيم منتج حسب المنتج لا يقول شيئًا.',
  'Slice = sum of gross_amount of the rows of the group with that product (or cost center, or organization)':
    'الشريحة = مجموع gross_amount لصفوف المجموعة التي لها ذلك المنتج (أو مركز التكلفة، أو المؤسسة)',
  'Take the rows of the selected group that pass the filters and the selected dates.': 'خذ صفوف المجموعة المحددة التي تجتاز عوامل التصفية والتواريخ المحددة.',
  'Add up their usage by product (or by cost center, or by organization).': 'اجمع استخدامها حسب المنتج (أو حسب مركز التكلفة، أو حسب المؤسسة).',
  'The 8 largest slices are shown. The others are added up in one gray slice, Other.': 'تُعرض أكبر 8 شرائح. وتُجمع البقية في شريحة رمادية واحدة هي أخرى.',
  'Rows with an empty value form a gray slice named (none) or (no cost center), for example.': 'الصفوف ذات القيمة الفارغة تشكّل شريحة رمادية اسمها مثلًا (لا يوجد) أو (بلا مركز تكلفة).',
  'The number in the middle is the usage of the group. The slices add up to it.': 'الرقم في الوسط هو استخدام المجموعة، ومجموع الشرائح يساويه.',
  'A product group with $1,000 of usage, $700 of it on rows of the cost center Alpha and $300 on Beta, gives a donut of 70% and 30%.':
    'مجموعة منتج استخدامها $1,000، منها $700 على صفوف مركز التكلفة Alpha و$300 على Beta، تعطي مخططًا دائريًا من 70% و30%.',
  'Group detail: usage over time': 'تفاصيل المجموعة: الاستخدام عبر الزمن',
  'The usage of the selected group for each day, or for each week when the period is longer than 120 days. A second line shows what was billed on top of seats, when the group has billed usage.':
    'استخدام المجموعة المحددة لكل يوم، أو لكل أسبوع عندما تزيد الفترة على 120 يومًا. ويعرض خط ثانٍ ما دُفع إضافيًا فوق رسوم التراخيص، عندما يكون للمجموعة استخدام مدفوع إضافي.',
  'Point = sum of gross_amount (usage) or net_amount (billed) of the rows of the group on that day or in that week':
    'النقطة = مجموع gross_amount (الاستخدام) أو net_amount (المدفوع الإضافي) لصفوف المجموعة في ذلك اليوم أو ذلك الأسبوع',
  'Take the rows of the selected group in the selected dates.': 'خذ صفوف المجموعة المحددة في التواريخ المحددة.',
  'Add up the usage for each day. For a period longer than 120 days, add it up for each week instead. A week runs from Monday to Sunday, so the first and the last week can be shorter.':
    'اجمع الاستخدام لكل يوم. ولفترة أطول من 120 يومًا، اجمعه لكل أسبوع بدلًا من ذلك. يمتد الأسبوع من الاثنين إلى الأحد، فقد يكون الأسبوع الأول والأخير أقصر.',
  'The Billed line is drawn only when the group has billed usage in the period. The two lines are not stacked.':
    'يُرسم خط المدفوع الإضافي فقط عندما يكون للمجموعة استخدام مدفوع إضافي في الفترة. والخطان غير مكدّسين.',
  'The Billed line often stays at zero early in a month and rises once the included credits of the whole pool are used up.':
    'غالبًا يبقى خط المدفوع الإضافي عند الصفر في أول الشهر ويرتفع بعد نفاد الأرصدة المشمولة في الرصيد المشترك كله.',
  'A group that uses $100 a day for 10 days has a line at $100 on each of those days. In a period of 200 days, each point is one week of usage.':
    'المجموعة التي تستخدم $100 يوميًا لمدة 10 أيام لها خط عند $100 في كل يوم منها. وفي فترة من 200 يوم، كل نقطة هي أسبوع من الاستخدام.',

  // Showback
  'A way to split the GitHub Copilot bill between teams. Showback shows each team what its use costs, for information. Chargeback goes one step further and books that cost to the budget of the team. Both start from the same table of estimated amounts.':
    'طريقة لتقسيم فاتورة GitHub Copilot بين الفرق. عرض التكلفة يُري كل فريق كلفة استخدامه للعلم. والتحميل يذهب خطوة أبعد فيقيّد هذه الكلفة على ميزانية الفريق. وكلاهما يبدأ من جدول المبالغ التقديرية نفسه.',
  'Total allocation of a group = seat cost + overage allocation': 'إجمالي توزيع مجموعة = تكلفة التراخيص + توزيع التجاوز',
  'Choose the groups: cost centers when any row names one, otherwise organizations. With neither, showback cannot run.':
    'اختر المجموعات: مراكز التكلفة إذا ذكر أي صف أحدها، وإلا فالمؤسسات. وبدونهما لا يمكن عرض التكلفة.',
  'Give every person one group: the first cost center (or organization) found on their rows. People without one, and rows without one, go to Unassigned.':
    'أعطِ كل شخص مجموعة واحدة: أول مركز تكلفة (أو مؤسسة) يُعثر عليه في صفوفه. الأشخاص والصفوف بدونه يذهبون إلى غير مخصص.',
  'As billed in the report: overage allocation = billed on the rows of the group. There is no seat cost.':
    'كما في فاتورة التقرير: توزيع التجاوز = المدفوع الإضافي على صفوف المجموعة. ولا توجد تكلفة تراخيص.',
  'By share of usage: overage allocation = total billed × usage of the group ÷ all usage. There is no seat cost.':
    'حسب الحصة من الاستخدام: توزيع التجاوز = كل المدفوع الإضافي × استخدام المجموعة ÷ كل الاستخدام. ولا توجد تكلفة تراخيص.',
  'Seats plus overage by usage: the overage is split by share of usage as above, and each group also carries the seat cost of its people.':
    'التراخيص مع التجاوز حسب الاستخدام: يُقسَّم التجاوز حسب الحصة من الاستخدام كما سبق، وتتحمل كل مجموعة أيضًا تكلفة تراخيص أشخاصها.',
  'Share of total = total allocation of the group ÷ total allocation of all groups.': 'الحصة من الإجمالي = إجمالي توزيع المجموعة ÷ إجمالي توزيع كل المجموعات.',
  'A person with rows in several cost centers (or organizations) is counted in the first one, and their seat is counted there. Their usage stays with the group of each row. With the seat method, a note under the table says how many people this affects.':
    'الشخص الذي له صفوف في عدة مراكز تكلفة (أو مؤسسات) يُحسب في أولها، ويُحسب ترخيصه هناك. ويبقى استخدامه مع مجموعة كل صف. ومع طريقة التراخيص تذكر ملاحظة تحت الجدول عدد الأشخاص المتأثرين.',
  'Unassigned cannot be charged back until its people and rows get a cost center. It can be larger than the list Users without a cost center, because it also holds rows without a username.':
    'لا يمكن تحميل غير مخصص على فريق حتى يحصل أشخاصه وصفوفه على مركز تكلفة. وقد يكون أكبر من قائمة مستخدمون بلا مركز تكلفة، لأنه يضم أيضًا الصفوف التي ليس فيها اسم مستخدم.',
  'The seat method needs the full user list, so it is offered only when no filter is active. With filters the page uses As billed in the report and says so.':
    'تحتاج طريقة التراخيص إلى قائمة المستخدمين كاملة، فلا تُتاح إلا عندما لا يكون أي عامل تصفية نشطًا. ومع عوامل التصفية تستخدم الصفحة كما في فاتورة التقرير وتذكر ذلك.',
  'Only people with usage in the selected dates are included. A seat that used nothing has no row in the report, so it carries no cost here.':
    'يدخل فقط الأشخاص الذين لهم استخدام في التواريخ المحددة. الترخيص الذي لم يستخدم شيئًا ليس له صف في التقرير، فلا يتحمل أي تكلفة هنا.',
  'The overage allocation of all groups adds up to Billed on top of seats of the view, whichever method you pick.':
    'مجموع توزيع التجاوز لكل المجموعات يساوي المدفوع الإضافي فوق رسوم التراخيص في العرض، أيًا كانت الطريقة التي تختارها.',
  'When the file has no billing split there is no overage to allocate. The seat method still allocates seat costs, and the other methods have nothing to allocate.':
    'عندما لا يكون في الملف تقسيم للفوترة لا يوجد تجاوز لتوزيعه. تظل طريقة التراخيص توزّع تكلفة التراخيص، ولا يكون لدى الطريقتين الأخريين ما توزّعانه.',
  'Total billed is $1,000 on $10,000 of usage. A cost center with 10 people and $6,000 of usage, with the seat method, carries 10 × $19 = $190 of seats and $1,000 × 60% = $600 of overage, a total allocation of $790.':
    'كل المدفوع الإضافي $1,000 على استخدام قدره $10,000. مركز تكلفة فيه 10 أشخاص واستخدامه $6,000 يتحمل مع طريقة التراخيص 10 × $19 = $190 للتراخيص و$1,000 × 60% = $600 للتجاوز، أي إجمالي توزيع قدره $790.',
  'People in a showback group': 'الأشخاص في مجموعة عرض التكلفة',
  'How many people are assigned to the group for showback. Each person is assigned to one group only, so the groups add up to the number of people in the report.':
    'كم شخصًا يُنسب إلى المجموعة لعرض التكلفة. يُنسب كل شخص إلى مجموعة واحدة فقط، فمجموع المجموعات يساوي عدد الأشخاص في التقرير.',
  'Users = number of people whose first cost center (or organization) is the group': 'المستخدمون = عدد الأشخاص الذين يكون أول مركز تكلفة (أو مؤسسة) لهم هو المجموعة',
  'A person is assigned from the first cost center (or organization) found on their rows. A person with rows in several is counted once, here. The Users column of the group table counts them in every group instead.':
    'يُنسب الشخص حسب أول مركز تكلفة (أو مؤسسة) يُعثر عليه في صفوفه. والشخص الذي له صفوف في عدة منها يُحسب هنا مرة واحدة. أما عمود المستخدمين في جدول المجموعات فيحسبه في كل مجموعة.',
  'People without a value are assigned to Unassigned.': 'يُنسب الأشخاص الذين ليس لهم قيمة إلى غير مخصص.',
  'A group can be listed with 0 people when only rows without a username carry its name.': 'قد تظهر مجموعة بـ 0 أشخاص عندما لا يحمل اسمها إلا صفوف ليس فيها اسم مستخدم.',
  'A person with rows in the cost centers Alpha and Beta, Alpha first, counts as 1 person in Alpha and 0 in Beta.':
    'الشخص الذي له صفوف في مركزي التكلفة Alpha وBeta، وAlpha أولًا، يُحسب شخصًا واحدًا في Alpha و0 في Beta.',
  'The price of the seats of the people in the group, worked out as the value of the credits that their seats include. It is only part of the allocation with the method Seats plus overage by usage.':
    'ثمن تراخيص الأشخاص في المجموعة، محسوبًا بقيمة الأرصدة التي تشملها تراخيصهم. ولا يدخل في التوزيع إلا مع طريقة التراخيص مع التجاوز حسب الاستخدام.',
  'Seat cost = sum over the people of the group of their seat credits in the months with usage × $0.01':
    'تكلفة التراخيص = مجموع أرصدة تراخيص أشخاص المجموعة في الأشهر التي فيها استخدام × $0.01',
  'For every person, take the largest total_monthly_quota on their rows in each month of the selected dates. This is the size of the seat in credits.':
    'لكل شخص، خذ أكبر total_monthly_quota في صفوفه في كل شهر من التواريخ المحددة. هذا هو حجم الترخيص بالأرصدة.',
  'Add the seat sizes of the months in which the person has usage, and multiply by $0.01.': 'اجمع أحجام الترخيص للأشهر التي للشخص فيها استخدام، واضرب في $0.01.',
  'A person whose rows carry no quota is priced at the most common seat size in the report (1,900 credits when no row has a quota) for each month with usage, and at least one month.':
    'الشخص الذي لا تحمل صفوفه حصة يُسعَّر بحجم الترخيص الأكثر شيوعًا في التقرير (1,900 رصيد إذا لم يكن لأي صف حصة) لكل شهر فيه استخدام، وشهر واحد على الأقل.',
  'Add up the amounts of the people of the group.': 'اجمع مبالغ أشخاص المجموعة.',
  'It assumes that a seat costs as much as its included credits: $19 for a Business seat (1,900 credits) and $39 for an Enterprise seat (3,900 credits). A discounted seat price changes the real cost.':
    'يفترض أن الترخيص يكلّف بقدر أرصدته المشمولة: $19 لترخيص Business (1,900 رصيد) و$39 لترخيص Enterprise (3,900 رصيد). وسعر الترخيص المخفَّض يغيّر التكلفة الحقيقية.',
  'Whole months count. A person with usage on one day of a month carries the seat of the full month.': 'تُحسب الأشهر كاملة. الشخص الذي له استخدام في يوم واحد من الشهر يتحمل ترخيص الشهر كله.',
  'People without usage in the selected dates are not in the report, so they carry no seat cost here.': 'الأشخاص الذين ليس لهم استخدام في التواريخ المحددة ليسوا في التقرير، فلا يتحملون تكلفة تراخيص هنا.',
  'A person with rows in several groups has the seat counted in the first group only.': 'الشخص الذي له صفوف في عدة مجموعات يُحسب ترخيصه في أول مجموعة فقط.',
  'The column is shown only with the method Seats plus overage by usage. That method is not offered while a filter is active, because seat costs need the full user list.':
    'يظهر العمود فقط مع طريقة التراخيص مع التجاوز حسب الاستخدام. ولا تُتاح هذه الطريقة ما دام عامل تصفية نشطًا، لأن تكلفة التراخيص تحتاج إلى قائمة المستخدمين كاملة.',
  '10 people with a seat of 1,900 credits, each with usage in 2 months: 10 × 2 × 1,900 × $0.01 = $380.':
    '10 أشخاص لكل منهم ترخيص من 1,900 رصيد واستخدام في شهرين: 10 × 2 × 1,900 × $0.01 = $380.',
  'The part of the bill on top of seats that the group carries.': 'الجزء من الفاتورة فوق رسوم التراخيص الذي تتحمله المجموعة.',
  'Overage allocation = billed on the rows of the group (As billed), or total billed × usage of the group ÷ all usage (the two other methods)':
    'توزيع التجاوز = المدفوع الإضافي على صفوف المجموعة (كما في الفاتورة)، أو كل المدفوع الإضافي × استخدام المجموعة ÷ كل الاستخدام (الطريقتان الأخريان)',
  'As billed in the report follows the rows. Because included credits are pooled, a group that uses them late in the month carries more than its share. The two other methods ignore when the usage happened.':
    'كما في فاتورة التقرير تتبع الصفوف. ولأن الأرصدة المشمولة مجمّعة في رصيد مشترك، تتحمل المجموعة التي تستخدمها في آخر الشهر أكثر من حصتها. والطريقتان الأخريان تتجاهلان وقت الاستخدام.',
  'It is a dash when the file has no billing split. It is 0 for every group when nothing was billed in the period.':
    'يكون شرطة عندما لا يكون في الملف تقسيم للفوترة. ويكون 0 لكل مجموعة إذا لم يُدفع شيء إضافي في الفترة.',
  'Total billed is $1,000. A group with 60% of all usage carries $600 with the usage-based methods. If $850 of the billed amount sits on its own rows, As billed in the report gives $850.':
    'كل المدفوع الإضافي $1,000. المجموعة التي لها 60% من كل الاستخدام تتحمل $600 مع الطريقتين القائمتين على الاستخدام. وإذا كان $850 من المبلغ المدفوع الإضافي على صفوفها، تعطي كما في فاتورة التقرير $850.',
  'The estimated part of the bill that the group should carry. With As billed in the report and By share of usage there is no seat cost, so it equals the overage allocation.':
    'الجزء التقديري من الفاتورة الذي ينبغي أن تتحمله المجموعة. مع كما في فاتورة التقرير وحسب الحصة من الاستخدام لا توجد تكلفة تراخيص، فيساوي توزيع التجاوز.',
  'Total allocation = seat cost + overage allocation': 'إجمالي التوزيع = تكلفة التراخيص + توزيع التجاوز',
  'With Seats plus overage by usage, the Total row is the whole bill for the people in the report: all seats plus all overage.':
    'مع التراخيص مع التجاوز حسب الاستخدام، يكون صف الإجمالي هو الفاتورة كاملة للأشخاص في التقرير: كل التراخيص وكل التجاوز.',
  'It is an estimate for internal showback and chargeback. Invoices come from GitHub billing.': 'إنه تقدير لعرض التكلفة وتحميلها داخليًا. الفواتير تأتي من نظام الفوترة في GitHub.',
  'A seat cost of $190 plus an overage allocation of $600 is a total allocation of $790.': 'تكلفة تراخيص قدرها $190 مع توزيع تجاوز قدره $600 تساوي إجمالي توزيع قدره $790.',
  'Share of total allocation': 'الحصة من إجمالي التوزيع',
  'The part of the whole allocation that the group carries.': 'الجزء من التوزيع كله الذي تتحمله المجموعة.',
  'Share of total = total allocation of the group ÷ total allocation of all groups': 'الحصة من الإجمالي = إجمالي توزيع المجموعة ÷ إجمالي توزيع كل المجموعات',
  'It is a dash when there is nothing to allocate, that is when the total of all groups is 0.': 'يكون شرطة عندما لا يوجد ما يُوزَّع، أي عندما يكون إجمالي كل المجموعات 0.',
  'The bar is scaled to the largest share in the table.': 'يُقاس الشريط على أكبر حصة في الجدول.',
  'It is not the Share column. That column is the share of usage. With the seat method, a group with many seats and little usage carries a larger share of the total than of the usage.':
    'إنه ليس عمود الحصة. ذاك العمود هو الحصة من الاستخدام. ومع طريقة التراخيص، تتحمل المجموعة التي لها تراخيص كثيرة واستخدام قليل حصة من الإجمالي أكبر من حصتها من الاستخدام.',
  'A group with a total allocation of $790 out of $2,000 in all carries 39.5%.': 'مجموعة إجمالي توزيعها $790 من أصل $2,000 تتحمل 39.5%.',

  // People behind the groups
  'The people with the most usage in each organization, cost center or team, so that you can see who is behind a group. It is shown for organizations, cost centers and teams only.':
    'الأشخاص أصحاب أكبر استخدام في كل مؤسسة أو مركز تكلفة أو فريق، لتعرف من وراء المجموعة. ويظهر للمؤسسات ومراكز التكلفة والفرق فقط.',
  'Usage of a user in a group = sum of gross_amount of the rows of the user in that group': 'استخدام مستخدم في مجموعة = مجموع gross_amount لصفوف المستخدم في تلك المجموعة',
  'For each group, take the rows that have a username and pass the filters and the selected dates.': 'لكل مجموعة، خذ الصفوف التي فيها اسم مستخدم وتجتاز عوامل التصفية والتواريخ المحددة.',
  'Add up the usage for each user and show the 5 highest.': 'اجمع الاستخدام لكل مستخدم واعرض أعلى 5.',
  'The percentage is the usage of the user ÷ the usage of the group.': 'النسبة المئوية هي استخدام المستخدم ÷ استخدام المجموعة.',
  'The line "and N more" tells how many other users the group has.': 'يذكر السطر "و N غيرهم" عدد المستخدمين الآخرين في المجموعة.',
  'The usage of the group in the division includes rows without a username, which belong to no user. The percentages of all users can therefore add up to less than 100%.':
    'استخدام المجموعة في القسمة يشمل الصفوف التي ليس فيها اسم مستخدم، وهي لا تخص أي مستخدم. لذلك قد يقل مجموع نسب كل المستخدمين عن 100%.',
  'A person with rows in several groups is listed in each of them, with the usage of their rows in that group.': 'الشخص الذي له صفوف في عدة مجموعات يظهر في كل منها، باستخدام صفوفه في تلك المجموعة.',
  'The list starts with the 30 largest groups. Use Show all for the rest.': 'تبدأ القائمة بأكبر 30 مجموعة. استخدم اعرض الكل لبقيتها.',
  'The badge is the persona of the user, explained under Who the users are.': 'الشارة هي نمط المستخدم، المشروح تحت من هم المستخدمون.',
  'A cost center with $2,000 of usage in which a user has $500 shows that user at 25%.': 'مركز تكلفة استخدامه $2,000 لمستخدم فيه $500 يعرض ذلك المستخدم بنسبة 25%.',
  'People whose rows carry no cost center, so that their usage cannot be charged back to a team. The list appears when the report has cost centers but some users are missing from them.':
    'أشخاص لا تحمل صفوفهم مركز تكلفة، فلا يمكن تحميل استخدامهم على فريق. تظهر القائمة عندما يكون في التقرير مراكز تكلفة لكن بعض المستخدمين غير موجودين فيها.',
  'Share of usage = usage of the user ÷ usage of all rows in the view, listed for users with no cost center on any of their rows':
    'الحصة من الاستخدام = استخدام المستخدم ÷ استخدام كل الصفوف في العرض، وتُسرد للمستخدمين الذين ليس لهم مركز تكلفة في أي من صفوفهم',
  'Take the users with usage in the view.': 'خذ المستخدمين الذين لهم استخدام في العرض.',
  'Keep those that have no cost center on any of their rows. A person with one row that names a cost center is not listed.':
    'أبقِ من ليس لهم مركز تكلفة في أي من صفوفهم. الشخص الذي له صف واحد يذكر مركز تكلفة لا يظهر في القائمة.',
  'Usage and Billed are the sums of the rows of the user.': 'الاستخدام والمدفوع الإضافي هما مجموعا صفوف المستخدم.',
  'The card appears only when the report has cost centers and at least one user has none. Without any cost center, the page shows a note on how cost centers help.':
    'تظهر البطاقة فقط عندما يكون في التقرير مراكز تكلفة ولمستخدم واحد على الأقل لا مركز تكلفة له. وبدون أي مركز تكلفة تعرض الصفحة ملاحظة عن فائدة مراكز التكلفة.',
  'In the Showback table, Unassigned also holds rows without a username, and the rows without a cost center of people who have one on other rows. It can be larger than the total of this list.':
    'في جدول عرض التكلفة، يضم غير مخصص أيضًا الصفوف التي ليس فيها اسم مستخدم، والصفوف التي بلا مركز تكلفة لأشخاص لهم مركز تكلفة في صفوف أخرى. وقد يكون أكبر من إجمالي هذه القائمة.',
  'The Show users button opens the Users page with the filter for users without a cost center.': 'يفتح زر اعرض المستخدمين صفحة المستخدمين مع عامل التصفية للمستخدمين بلا مركز تكلفة.',
  'The Billed column is left out when the file has no billing split.': 'يُحذف عمود المدفوع الإضافي عندما لا يكون في الملف تقسيم للفوترة.',
  'If one user used $300 of $10,000 in total and has no cost center on any row, the list shows $300 and a share of 3%.':
    'إذا استخدم مستخدم واحد $300 من أصل $10,000 ولم يكن له مركز تكلفة في أي صف، تعرض القائمة $300 وحصة قدرها 3%.',

  // Teams and seats from the license list
  'Teams from the license list': 'الفرق من قائمة التراخيص',
  'The usage report has no team field. When the imported license list names a team for each seat, the page can group usage by team: each person goes to the team of their seat, and all their rows follow.':
    'ليس في تقرير الاستخدام حقل للفريق. عندما تذكر قائمة التراخيص المستوردة فريقًا لكل ترخيص، يمكن للصفحة تجميع الاستخدام حسب الفريق: يذهب كل شخص إلى فريق ترخيصه، وتتبعه كل صفوفه.',
  'Team usage = sum of gross_amount of the rows of the people whose seat names the team first': 'استخدام الفريق = مجموع gross_amount لصفوف الأشخاص الذين يذكر ترخيصهم الفريق أولًا',
  'Look up the lower-case username of each row in the license list.': 'ابحث عن اسم المستخدم بالأحرف الصغيرة لكل صف في قائمة التراخيص.',
  'When the seat names one or more teams, the person goes to the first team named. Team names are matched without regard to capital letters.':
    'عندما يذكر الترخيص فريقًا أو أكثر، يذهب الشخص إلى أول فريق مذكور. وتُطابق أسماء الفرق دون اعتبار لحالة الأحرف.',
  'A person who is not in the license list goes to Not in the license list. A person whose seat names no team goes to No team in the license list.':
    'الشخص الذي ليس في قائمة التراخيص يذهب إلى ليس في قائمة التراخيص. والشخص الذي لا يذكر ترخيصه فريقًا يذهب إلى لا فريق في قائمة التراخيص.',
  'Rows without a username, such as repository-level products, form a group of their own.': 'الصفوف التي ليس فيها اسم مستخدم، مثل منتجات مستوى المستودع، تشكّل مجموعة خاصة بها.',
  'Usage, billed amounts, tokens and users of a team are then counted as for any other group.': 'ثم يُحسب استخدام الفريق والمبالغ المدفوعة الإضافية والرموز والمستخدمون كما في أي مجموعة أخرى.',
  'Unlike the other views, a team is a property of the person, not of the row. A person in two teams is counted in the first one only, so the teams never overlap.':
    'على خلاف العروض الأخرى، الفريق صفة للشخص لا للصف. الشخص الذي في فريقين يُحسب في أولهما فقط، فلا تتداخل الفرق أبدًا.',
  'The view is offered only when a loaded license list names at least one team. The GitHub API lists the teams of a seat when the seat is assigned through a team.':
    'يُتاح العرض فقط عندما تذكر قائمة تراخيص محمّلة فريقًا واحدًا على الأقل. تذكر GitHub API فرق الترخيص عندما يُخصَّص الترخيص عبر فريق.',
  'The three special groups count as unattributed usage, because none of them can be charged to a team.': 'تُحسب المجموعات الخاصة الثلاث استخدامًا غير منسوب، لأنه لا يمكن تحميل أي منها على فريق.',
  'The Filter button and Show users narrow the report to the users of the team who have usage in the view.': 'زر التصفية واعرض المستخدمين يقصران التقرير على مستخدمي الفريق الذين لهم استخدام في العرض.',
  'The license list gives alice the teams Web and Mobile, and bob no team. All rows of alice count in Web, and all rows of bob in No team in the license list.':
    'تعطي قائمة التراخيص alice الفريقين Web وMobile، ولا تعطي bob أي فريق. تُحسب كل صفوف alice في Web، وكل صفوف bob في لا فريق في قائمة التراخيص.',
  'For each organization, how many seats the license list holds, how many of them were used in the period, who used GitHub Copilot without a seat, and what the seats cost. It shows where seats sit idle.':
    'لكل مؤسسة، كم ترخيصًا في قائمة التراخيص، وكم منها استُخدم في الفترة، ومن استخدم GitHub Copilot بلا ترخيص، وكم تكلّف التراخيص. ويبيّن أين تبقى التراخيص خاملة.',
  'Seats of an organization = seats in the license list whose first listed organization is that organization':
    'تراخيص مؤسسة = التراخيص في قائمة التراخيص التي تكون أول مؤسسة مذكورة لها هي تلك المؤسسة',
  'Take the seats of the license list. A seat goes to the first organization the list names for it.': 'خذ تراخيص قائمة التراخيص. يذهب الترخيص إلى أول مؤسسة تذكرها القائمة له.',
  'A seat with no organization in the list goes to the organization of its holder in the report. With neither, it goes to Organization not known.':
    'الترخيص الذي لا مؤسسة له في القائمة يذهب إلى مؤسسة صاحبه في التقرير. وبدونهما يذهب إلى المؤسسة غير معروفة.',
  'Match each seat to the report by lower-case username, as on the Licenses page.': 'طابق كل ترخيص مع التقرير باسم المستخدم بالأحرف الصغيرة، كما في صفحة التراخيص.',
  'People with usage in the period who hold no seat go to the organization of their rows in the report.': 'الأشخاص الذين لهم استخدام في الفترة وليس لهم ترخيص يذهبون إلى مؤسسة صفوفهم في التقرير.',
  'Seat cost and usage per seat are worked out per organization. The Total row adds up all organizations.': 'تُحسب تكلفة التراخيص والاستخدام لكل ترخيص لكل مؤسسة. ويجمع صف الإجمالي كل المؤسسات.',
  'The organization names of the report and of the license list are matched without regard to capital letters. The Filter button appears only for organizations the report names.':
    'تُطابق أسماء المؤسسات في التقرير وقائمة التراخيص دون اعتبار لحالة الأحرف. ويظهر زر التصفية فقط للمؤسسات التي يذكرها التقرير.',
  'The totals match the Licenses page: all seats, the report users with a seat, and the report users without one.':
    'تطابق المجاميع صفحة التراخيص: كل التراخيص، ومستخدمو التقرير الذين لهم ترخيص، ومستخدمو التقرير الذين ليس لهم ترخيص.',
  'The date range and the row filters change the used seats and the usage, as on the Licenses page. Seats and seat cost always cover the whole license list.':
    'يغيّر نطاق التواريخ وعوامل تصفية الصفوف التراخيص المستخدمة والاستخدام، كما في صفحة التراخيص. أما التراخيص وتكلفتها فتغطي دائمًا قائمة التراخيص كلها.',
  'Code completions are not in the usage report, so a seat with no usage here can still be in use. Check the last activity on the Licenses page before you remove a seat.':
    'إكمالات الكود ليست في تقرير الاستخدام، فقد يكون الترخيص الذي لا استخدام له هنا مستخدمًا فعلًا. تحقق من آخر نشاط في صفحة التراخيص قبل أن تزيل ترخيصًا.',
  'An organization with 40 seats, 30 of them with usage, and 2 people with usage but no seat shows 40 seats, 30 used, 10 with no usage and 2 users without a seat.':
    'مؤسسة لها 40 ترخيصًا، منها 30 لها استخدام، وشخصان لهما استخدام بلا ترخيص، تعرض 40 ترخيصًا و30 مستخدمًا و10 بلا استخدام ومستخدمَين بلا ترخيص.',
  'Seats of an organization': 'تراخيص مؤسسة',
  'How many seats of the license list belong to the organization.': 'كم ترخيصًا من قائمة التراخيص يخص المؤسسة.',
  'Seats = number of different usernames in the license list whose first listed organization is the organization':
    'التراخيص = عدد أسماء المستخدمين المختلفة في قائمة التراخيص التي تكون أول مؤسسة مذكورة لها هي المؤسسة',
  'A seat that the list gives to several organizations counts in the first one only. A note under the table says how many seats this affects.':
    'الترخيص الذي تنسبه القائمة إلى عدة مؤسسات يُحسب في أولها فقط. وتذكر ملاحظة تحت الجدول عدد التراخيص المتأثرة.',
  'A seat without an organization in the list counts in the organization of its holder in the report, or in Organization not known.':
    'الترخيص الذي لا مؤسسة له في القائمة يُحسب في مؤسسة صاحبه في التقرير، أو في المؤسسة غير معروفة.',
  'The list names the organizations web and mobile for alice, so her seat counts in web.': 'تذكر القائمة المؤسستين web وmobile لـ alice، فيُحسب ترخيصها في web.',
  'Used seats of an organization': 'التراخيص المستخدمة لمؤسسة',
  'Seats of the organization whose holder has usage in the report for the period.': 'تراخيص المؤسسة التي لصاحبها استخدام في التقرير خلال الفترة.',
  'Used seats = seats of the organization whose lower-case username has usage in the period':
    'التراخيص المستخدمة = تراخيص المؤسسة التي لاسم مستخدمها بالأحرف الصغيرة استخدام في الفترة',
  'The holder counts whatever organization their usage is in. A seat in web whose holder only has rows in mobile is a used seat of web.':
    'يُحسب صاحب الترخيص أيًا كانت المؤسسة التي فيها استخدامه. الترخيص في web الذي ليس لصاحبه صفوف إلا في mobile ترخيص مستخدم في web.',
  'The used seats of all organizations add up to the report users with a seat on the Licenses page.':
    'مجموع التراخيص المستخدمة لكل المؤسسات يساوي مستخدمي التقرير الذين لهم ترخيص في صفحة التراخيص.',
  'web has 40 seats and 30 of their holders have usage in the period: 30 used seats.': 'لـ web أربعون ترخيصًا، و30 من أصحابها لهم استخدام في الفترة: 30 ترخيصًا مستخدمًا.',
  'Seats with no usage': 'تراخيص بلا استخدام',
  'Seats of the organization whose holder has no usage in the report for the period. They are the first place to look for savings.':
    'تراخيص المؤسسة التي ليس لصاحبها استخدام في التقرير خلال الفترة. وهي أول مكان تبحث فيه عن التوفير.',
  'Seats with no usage = seats of the organization − used seats of the organization': 'التراخيص بلا استخدام = تراخيص المؤسسة − التراخيص المستخدمة للمؤسسة',
  'Code completions and some other features are not in the usage report. A seat with no usage here may still be in use, so check the last activity on the Licenses page first.':
    'إكمالات الكود وبعض الميزات الأخرى ليست في تقرير الاستخدام. قد يكون الترخيص الذي لا استخدام له هنا مستخدمًا فعلًا، فتحقق من آخر نشاط في صفحة التراخيص أولًا.',
  'A short date range or a row filter leaves out usage and makes this number larger.': 'نطاق التواريخ القصير أو عامل تصفية الصفوف يستبعد استخدامًا ويكبّر هذا الرقم.',
  '40 seats and 30 used seats leave 10 seats with no usage.': '40 ترخيصًا و30 ترخيصًا مستخدمًا تترك 10 تراخيص بلا استخدام.',
  'People with usage in the period whose username is not in the license list, counted in the organization of their rows.':
    'أشخاص لهم استخدام في الفترة واسم مستخدمهم ليس في قائمة التراخيص، ويُحسبون في مؤسسة صفوفهم.',
  'Users without a seat = report users of the organization whose lower-case username is not in the license list':
    'المستخدمون بلا ترخيص = مستخدمو التقرير في المؤسسة الذين ليس اسم مستخدمهم بالأحرف الصغيرة في قائمة التراخيص',
  'A person with rows in several organizations counts in the first organization of their rows.': 'الشخص الذي له صفوف في عدة مؤسسات يُحسب في أول مؤسسة في صفوفه.',
  'The numbers of all organizations add up to the report users without a seat on the Licenses page.': 'مجموع أعداد كل المؤسسات يساوي مستخدمي التقرير الذين ليس لهم ترخيص في صفحة التراخيص.',
  'The data does not say why a person has no seat. The list may be partial, or the seat may have been removed after the usage.':
    'لا تذكر البيانات سبب عدم وجود ترخيص للشخص. قد تكون القائمة جزئية، أو ربما أُزيل الترخيص بعد الاستخدام.',
  '2 people have usage in web but are not in the license list: 2 users without a seat in web.': 'شخصان لهما استخدام في web لكنهما ليسا في قائمة التراخيص: مستخدمان بلا ترخيص في web.',
  'Seat cost of an organization': 'تكلفة تراخيص مؤسسة',
  'What the seats of the organization cost each month at the standard seat prices.': 'ما تكلّفه تراخيص المؤسسة كل شهر بأسعار التراخيص القياسية.',
  'Seat cost / month = sum of the seat prices of the seats of the organization': 'تكلفة التراخيص / شهر = مجموع أسعار تراخيص المؤسسة',
  'Business seats cost $19 and Enterprise seats $39 a month.': 'يكلّف ترخيص Business ‏$19 وترخيص Enterprise ‏$39 في الشهر.',
  'A seat without a plan in the list is priced at the seat size of its holder in the report, or the most common seat size in the report, at $0.01 a credit.':
    'الترخيص الذي لا خطة له في القائمة يُسعَّر بحجم ترخيص صاحبه في التقرير، أو بحجم الترخيص الأكثر شيوعًا في التقرير، بسعر $0.01 للرصيد.',
  'These are the standard prices the app uses everywhere. Your invoice can differ.': 'هذه هي الأسعار القياسية التي يستخدمها التطبيق في كل مكان. قد تختلف فاتورتك.',
  'The seat costs of all organizations add up to the monthly seat cost on the Licenses page.': 'مجموع تكلفة تراخيص كل المؤسسات يساوي تكلفة التراخيص الشهرية في صفحة التراخيص.',
  '30 Business seats and 10 Enterprise seats cost 30 × $19 + 10 × $39 = $960 a month.': '30 ترخيص Business و10 تراخيص Enterprise تكلّف 30 × $19 + 10 × $39 = $960 في الشهر.',
  'The usage of the seat holders of the organization in an average month, spread over all its seats. Compare it with the credits of a seat to see whether the seats are used.':
    'استخدام أصحاب تراخيص المؤسسة في شهر متوسط، موزعًا على كل تراخيصها. قارنه بأرصدة الترخيص لتعرف هل التراخيص مستخدمة.',
  'Usage per seat / month = usage of the seat holders ÷ seats × 30.4375 ÷ days in the period': 'الاستخدام لكل ترخيص / شهر = استخدام أصحاب التراخيص ÷ التراخيص × 30.4375 ÷ أيام الفترة',
  'Only the usage of seat holders counts. Usage of people without a seat is left out.': 'يُحسب استخدام أصحاب التراخيص فقط. ويُستبعد استخدام الأشخاص الذين ليس لهم ترخيص.',
  'All the usage of a holder counts, in whatever organization the rows are.': 'يُحسب كل استخدام صاحب الترخيص، في أي مؤسسة كانت صفوفه.',
  'It is a dash for an organization with no seats, for example one with only people without a seat.': 'يكون شرطة لمؤسسة ليس لها تراخيص، مثل مؤسسة ليس فيها إلا أشخاص بلا ترخيص.',
  'The 30 seat holders of an organization with 40 seats used $1,520 in a 30-day period: $1,520 ÷ 40 × 30.4375 ÷ 30 = $38.55 per seat and month.':
    'استخدم 30 من أصحاب التراخيص في مؤسسة لها 40 ترخيصًا $1,520 في فترة من 30 يومًا: $1,520 ÷ 40 × 30.4375 ÷ 30 = $38.55 لكل ترخيص في الشهر.',
};

export default ar;
