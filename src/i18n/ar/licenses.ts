import type { Dict, PluralEntry } from '../core';

/** Arabic counted noun: one, two, 3 to 10, 11 to 99, and 0 or 100 and up. */
const p = (one: string, two: string, few: string, many: string, other: string): PluralEntry => ({ zero: other, one, two, few, many, other });

/** The Licenses page (src/pages/LicensesPage.tsx and src/pages/licenses). */
const ar: Dict = {
  // Page, empty state and notices
  'Import your license list to see your seats': 'استورد قائمة التراخيص لترى تراخيصك',
  'The usage report shows who used GitHub Copilot, but not who has a seat. The license list adds what the report cannot show:':
    'يبيّن تقرير الاستخدام من استخدم GitHub Copilot، لكنه لا يبيّن من لديه ترخيص. تضيف قائمة التراخيص ما لا يستطيع التقرير عرضه:',
  'Seats with no usage in this report, checked against last activity, and what they cost each month.':
    'التراخيص التي ليس لها استخدام في هذا التقرير، بعد التحقق من آخر نشاط، وتكلفتها كل شهر.',
  'Users with usage in the report but no seat in the list.': 'المستخدمون الذين لهم استخدام في التقرير وليس لهم ترخيص في القائمة.',
  'A better estimate of the included-credit pool, because each seat on the list adds its credits. It is not the exact pool for past months.':
    'تقدير أفضل لرصيد الأرصدة المشمولة المشترك، لأن كل ترخيص في القائمة يضيف أرصدته. وهو ليس الرصيد الدقيق للأشهر الماضية.',
  'Seat cost per month by plan.': 'تكلفة التراخيص في الشهر حسب الخطة.',
  'Days without activity are counted from {date}, the newest date in the license list.': 'تُحسب أيام عدم النشاط من {date}، وهو أحدث تاريخ في قائمة التراخيص.',
  'Days without activity are counted from {date}, the date of the license export.': 'تُحسب أيام عدم النشاط من {date}، وهو تاريخ تصدير قائمة التراخيص.',
  'The license list has no dates, so days without activity cannot be counted.': 'لا تحتوي قائمة التراخيص على تواريخ، لذلك لا يمكن حساب أيام عدم النشاط.',
  'The license list is old': 'قائمة التراخيص قديمة',
  'Some seats have no recent activity date': 'بعض التراخيص ليس لها تاريخ نشاط حديث',
  '{n} seats have no recent activity date. They may be new or their activity may be older than 90 days. They are not counted as seats to free.': p(
    'لا يوجد تاريخ نشاط حديث لترخيص واحد. قد يكون جديدًا أو قد يكون نشاطه أقدم من 90 يومًا. لا يُحسب ضمن التراخيص المطلوب تحريرها.',
    'لا يوجد تاريخ نشاط حديث لترخيصين. قد يكونان جديدين أو قد يكون نشاطهما أقدم من 90 يومًا. لا يُحسبان ضمن التراخيص المطلوب تحريرها.',
    'لا يوجد تاريخ نشاط حديث لـ{n} تراخيص. قد تكون جديدة أو قد يكون نشاطها أقدم من 90 يومًا. لا تُحسب ضمن التراخيص المطلوب تحريرها.',
    'لا يوجد تاريخ نشاط حديث لـ{n} ترخيصًا. قد تكون جديدة أو قد يكون نشاطها أقدم من 90 يومًا. لا تُحسب ضمن التراخيص المطلوب تحريرها.',
    'لا يوجد تاريخ نشاط حديث لـ{n} ترخيص. قد تكون جديدة أو قد يكون نشاطها أقدم من 90 يومًا. لا تُحسب ضمن التراخيص المطلوب تحريرها.',
  ),
  'The usage report runs {n} days past the date of the license list. Seats may have changed since then, so import a new list.': p(
    'يمتد تقرير الاستخدام يومًا واحدًا بعد تاريخ قائمة التراخيص. ربما تغيّرت التراخيص منذ ذلك الحين، لذا استورد قائمة جديدة.',
    'يمتد تقرير الاستخدام يومين بعد تاريخ قائمة التراخيص. ربما تغيّرت التراخيص منذ ذلك الحين، لذا استورد قائمة جديدة.',
    'يمتد تقرير الاستخدام {n} أيام بعد تاريخ قائمة التراخيص. ربما تغيّرت التراخيص منذ ذلك الحين، لذا استورد قائمة جديدة.',
    'يمتد تقرير الاستخدام {n} يومًا بعد تاريخ قائمة التراخيص. ربما تغيّرت التراخيص منذ ذلك الحين، لذا استورد قائمة جديدة.',
    'يمتد تقرير الاستخدام {n} يوم بعد تاريخ قائمة التراخيص. ربما تغيّرت التراخيص منذ ذلك الحين، لذا استورد قائمة جديدة.',
  ),
  'The license list has no activity data': 'لا تحتوي قائمة التراخيص على بيانات نشاط',
  'The app cannot tell which seats are unused, so activity-based seat savings and status lists are empty. For most admins, import the activity report CSV. Use the seats API when you need plan, start-date or pending-cancellation details.':
    'لا يستطيع التطبيق تحديد التراخيص غير المستخدمة، لذلك تبقى وفورات التراخيص وقوائم الحالة المعتمدة على النشاط فارغة. لدى معظم المسؤولين، استورد تقرير النشاط CSV. استخدم واجهة API للتراخيص عندما تحتاج إلى تفاصيل الخطة أو تاريخ البدء أو الإلغاء المعلّق.',
  'The file has no last activity date for these seats. A blank date may mean a new seat or activity older than 90 days. Review them before changing access.':
    'لا يعرض الملف تاريخ آخر نشاط لهذه التراخيص. قد يعني التاريخ الفارغ أن الترخيص جديد أو أن النشاط أقدم من 90 يومًا. راجعها قبل تغيير الوصول.',
  'Last activity was 90 days or more ago. Blank activity dates are not counted. The most valuable seats come first.':
    'كان آخر نشاط قبل 90 يومًا أو أكثر. لا تُحسب تواريخ النشاط الفارغة. تظهر التراخيص الأعلى قيمة أولًا.',
  'Usage, coverage, users with usage but no seat, and quiet seats cover only the selected rows. Seats, plans, seat cost, activity, and the lists of seats to free, fading, pending and new seats still cover the whole license list.':
    'الاستخدام والتغطية والمستخدمون الذين لهم استخدام بلا ترخيص والتراخيص الهادئة تشمل الصفوف المحددة فقط. أما التراخيص والخطط وتكلفة التراخيص والنشاط وقوائم التراخيص المطلوب تحريرها والمتراجعة والتي تنتظر الإلغاء والجديدة فما زالت تشمل قائمة التراخيص كلها.',
  'No license can be marked unused from the available data. Check the Licenses page for seats without a recent activity date.':
    'لا يمكن تصنيف أي ترخيص على أنه غير مستخدم من البيانات المتاحة. راجع صفحة Licenses للتراخيص التي ليس لها تاريخ نشاط حديث.',
  'No roster seat can be marked unused from the available data':
    'لا يمكن تصنيف أي ترخيص في القائمة على أنه غير مستخدم من البيانات المتاحة',
  'Segment filters do not change this page': 'عوامل تصفية الفئات لا تغيّر هذه الصفحة',
  'The license numbers cover every user in the date range and the row filters. Segment filters, such as spend tier or group, are not used here.':
    'تشمل أرقام التراخيص كل مستخدم في النطاق الزمني وعوامل تصفية الصفوف. أما عوامل تصفية الفئات، مثل شريحة الإنفاق أو المجموعة، فلا تُستخدم هنا.',
  'Update the license list': 'تحديث قائمة التراخيص',
  'Import the license list': 'استيراد قائمة التراخيص',

  // Import
  'Copy the command': 'نسخ الأمر',
  'How to get the license list': 'كيف تحصل على قائمة التراخيص',
  'Download the activity report in GitHub. No command is needed.': 'نزّل تقرير النشاط من GitHub. لا حاجة إلى تشغيل أمر.',
  'Organization: open Settings, GitHub Copilot, Access, Get usage report, then Get activity report (CSV).':
    'للمؤسسة: افتح Settings ثم GitHub Copilot ثم Access ثم Get usage report ثم Get activity report (CSV).',
  'Enterprise: open Billing and licensing, Licensing, then choose Get activity report.':
    'لحساب Enterprise: افتح Billing and licensing ثم Licensing ثم اختر Get activity report.',
  'The activity report has last activity and sign-in dates, but not plan or seat start dates. A new seat stays blank until first activity, and activity older than 90 days also appears blank.':
    'يحتوي تقرير النشاط على تاريخ آخر نشاط وتسجيل دخول، لكنه لا يعرض الخطة أو تاريخ بدء الترخيص. يبقى تاريخ الترخيص الجديد فارغًا حتى أول نشاط، كما يظهر النشاط الأقدم من 90 يومًا فارغًا.',
  'Check that the file covers the same organization or enterprise as your usage report. Compare its seat count with GitHub before acting; this app cannot know if a CSV left out seats.':
    'تحقق من أن الملف يغطي المؤسسة أو حساب Enterprise نفسه الموجود في تقرير الاستخدام. قارن عدد التراخيص مع GitHub قبل اتخاذ إجراء؛ لا يستطيع التطبيق معرفة ما إذا كان ملف CSV قد أغفل تراخيص.',
  'Activity report instructions': 'تعليمات تقرير النشاط',
  'Advanced: seat assignments API (JSON)': 'متقدم: API تعيين التراخيص (JSON)',
  'Use this when you need plan, seat start or pending-cancellation details, or want a repeatable export. It does not avoid the 90-day activity limit.':
    'استخدم هذا الخيار عندما تحتاج إلى تفاصيل الخطة أو بدء الترخيص أو الإلغاء المعلّق، أو تريد تصديرًا متكررًا. ولا يتجاوز حد النشاط البالغ 90 يومًا.',
  'A plain list of usernames, one per line, also works. It has no dates or plan details.':
    'تعمل أيضًا قائمة بسيطة بأسماء المستخدمين، اسم في كل سطر. لا تحتوي على تواريخ أو تفاصيل الخطة.',
  'Organization owners: run this command with the GitHub CLI. Put your organization name in place of ORG.':
    'مالكو المؤسسات: شغّلوا هذا الأمر باستخدام GitHub CLI. ضع اسم مؤسستك مكان ORG.',
  'Enterprise owners: run this command to get every seat in the enterprise. Put your enterprise name in place of ENTERPRISE.':
    'مالكو حسابات Enterprise: شغّلوا هذا الأمر للحصول على كل التراخيص في الحساب. ضع اسم حساب Enterprise مكان ENTERPRISE.',
  'Or download the activity report: in the organization settings, open GitHub Copilot, then Access, and get the activity report (CSV). It has the last activity of each user, but no plans.':
    'أو نزّل تقرير النشاط: في إعدادات المؤسسة افتح GitHub Copilot ثم Access، واحصل على تقرير النشاط (CSV). يحتوي على آخر نشاط لكل مستخدم، لكن بلا خطط.',
  'A plain list of usernames, one per line, works too. It has no dates, so the app cannot tell which seats are unused.':
    'تصلح أيضًا قائمة بسيطة بأسماء المستخدمين، اسم في كل سطر. لا تحتوي على تواريخ، لذلك لا يستطيع التطبيق معرفة التراخيص غير المستخدمة.',
  'The command needs a token with the {org} or {read} scope for an organization, or {enterprise} for an enterprise.':
    'يحتاج الأمر إلى رمز وصول بنطاق {org} أو {read} للمؤسسة، أو {enterprise} لحساب Enterprise.',
  'Kind of file': 'نوع الملف',
  'Seats found': 'التراخيص التي وُجدت',
  'Seats the file says it has': 'عدد التراخيص الذي يذكره الملف',
  'Records read': 'السجلات المقروءة',
  'Rows skipped': 'الصفوف المتجاوزة',
  'Export date': 'تاريخ التصدير',
  'No date in the file': 'لا يوجد تاريخ في الملف',
  'A user who appears more than once, for example in several organizations or teams, becomes one seat.':
    'المستخدم الذي يظهر أكثر من مرة، مثلًا في عدة مؤسسات أو فرق، يُحسب ترخيصًا واحدًا.',
  'Nothing can be imported from this file': 'لا يمكن استيراد أي شيء من هذا الملف',
  'Check these notes': 'راجع هذه الملاحظات',
  'Imported {name}': 'تم استيراد {name}',
  'The license list now has {n} seats.': p(
    'تحتوي قائمة التراخيص الآن على ترخيص واحد.',
    'تحتوي قائمة التراخيص الآن على ترخيصين.',
    'تحتوي قائمة التراخيص الآن على {n} تراخيص.',
    'تحتوي قائمة التراخيص الآن على {n} ترخيصًا.',
    'تحتوي قائمة التراخيص الآن على {n} ترخيص.',
  ),
  Added: 'المُضاف',
  Updated: 'المُحدَّث',
  Unchanged: 'دون تغيير',
  Removed: 'المحذوف',
  'Days without activity are counted from {date}.': 'تُحسب أيام عدم النشاط من {date}.',
  'Only part of the list is kept in this browser': 'يُحفظ جزء من القائمة فقط في هذا المتصفح',
  'The list is too big for the space this browser gives the app. The usernames and plans are kept, but the dates and activity are gone after you reload the page. Import the file again then to see activity.':
    'القائمة أكبر من المساحة التي يمنحها هذا المتصفح للتطبيق. تُحفظ أسماء المستخدمين والخطط، لكن التواريخ والنشاط تُفقد بعد إعادة تحميل الصفحة. استورد الملف مرة أخرى حينها لترى النشاط.',
  'The list is kept only until you close the page': 'تبقى القائمة حتى تغلق الصفحة فقط',
  'This browser could not save the list. It is used until you reload or close the page. Import the file again on your next visit.':
    'لم يتمكن هذا المتصفح من حفظ القائمة. تُستخدم حتى تعيد تحميل الصفحة أو تغلقها. استورد الملف مرة أخرى في زيارتك القادمة.',
  'Only the first file was read. Import the other files one at a time with Add to the list.':
    'تمت قراءة الملف الأول فقط. استورد الملفات الأخرى واحدًا تلو الآخر باستخدام الإضافة إلى القائمة.',
  '{name} is larger than 25 MB, which is too big for a license list. Check that you picked the seat list or the activity report.':
    'حجم {name} أكبر من 25 ميغابايت، وهذا كبير جدًا على قائمة تراخيص. تأكد من أنك اخترت قائمة التراخيص أو تقرير النشاط.',
  '{name} could not be read.': 'تعذّرت قراءة {name}.',
  'Reading {name}…': 'جارٍ قراءة {name}…',
  'Drop a license file here': 'أفلت ملف التراخيص هنا',
  'The seat list from the GitHub API (JSON), the activity report (CSV), or a list of usernames (TXT).':
    'قائمة التراخيص من GitHub API (JSON)، أو تقرير النشاط (CSV)، أو قائمة بأسماء المستخدمين (TXT).',
  'Choose a license file': 'اختر ملف التراخيص',
  'The file is read in your browser and is not sent anywhere.': 'يُقرأ الملف في متصفحك ولا يُرسل إلى أي مكان.',
  'How to use this file': 'كيف يُستخدم هذا الملف',
  'Replace the list': 'استبدال القائمة',
  'Use only the seats in this file': 'استخدام التراخيص الموجودة في هذا الملف فقط',
  'Add to the list': 'الإضافة إلى القائمة',
  'Keep the seats on the list and add or update the seats in this file': 'الإبقاء على التراخيص الموجودة في القائمة وإضافة تراخيص هذا الملف أو تحديثها',
  'Import {n} seats': p('استيراد ترخيص واحد', 'استيراد ترخيصين', 'استيراد {n} تراخيص', 'استيراد {n} ترخيصًا', 'استيراد {n} ترخيص'),
  'The {n} seats on the list now are replaced by the seats in this file.': p(
    'يُستبدل الترخيص الموجود في القائمة الآن بتراخيص هذا الملف.',
    'يُستبدل الترخيصان الموجودان في القائمة الآن بتراخيص هذا الملف.',
    'تُستبدل التراخيص الـ{n} الموجودة في القائمة الآن بتراخيص هذا الملف.',
    'تُستبدل التراخيص الـ{n} الموجودة في القائمة الآن بتراخيص هذا الملف.',
    'تُستبدل التراخيص الـ{n} الموجودة في القائمة الآن بتراخيص هذا الملف.',
  ),
  'Seats in this file are added to the list. A seat that is already on the list gets the newer data from the file. Use this for a second organization or a second file.':
    'تُضاف تراخيص هذا الملف إلى القائمة. والترخيص الموجود في القائمة من قبل يأخذ البيانات الأحدث من الملف. استخدم هذا لمؤسسة ثانية أو لملف ثانٍ.',
  'Choose another file': 'اختر ملفًا آخر',
  'Seat list from the GitHub API (JSON)': 'قائمة التراخيص من GitHub API (JSON)',
  'Activity report from GitHub (CSV)': 'تقرير النشاط من GitHub (CSV)',
  'It has plans, creation dates, last activity and sign-in dates.': 'يحتوي على الخطط وتواريخ الإنشاء وآخر نشاط وتواريخ تسجيل الدخول.',
  'It has last activity and sign-in dates, but no plans and no creation dates.': 'يحتوي على آخر نشاط وتواريخ تسجيل الدخول، لكن بلا خطط وبلا تواريخ إنشاء.',
  'It has the columns that the file holds, such as plan, organization and team.': 'يحتوي على الأعمدة الموجودة في الملف، مثل الخطة والمؤسسة والفريق.',
  'It has no plans and no dates, so the app cannot tell which seats are unused.': 'لا يحتوي على خطط ولا تواريخ، لذلك لا يستطيع التطبيق معرفة التراخيص غير المستخدمة.',
  'Nothing can be imported from it.': 'لا يمكن استيراد أي شيء منه.',

  // Breakdowns
  'Seats by activity': 'التراخيص حسب النشاط',
  'What the license list says about the last activity of each seat.': 'ما تقوله قائمة التراخيص عن آخر نشاط لكل ترخيص.',
  'The license list has no activity data, so every seat is shown as unknown.': 'لا تحتوي قائمة التراخيص على بيانات نشاط، لذلك يظهر كل ترخيص على أنه غير معروف.',
  'Seats by plan': 'التراخيص حسب الخطة',
  'Business and Enterprise seats, and seats with another plan or no plan in the list.': 'تراخيص Business وEnterprise، والتراخيص بخطة أخرى أو بلا خطة في القائمة.',
  'Seats in the usage report': 'التراخيص في تقرير الاستخدام',
  'Whether each seat has usage in the date range and filters you see.': 'هل لكل ترخيص استخدام في النطاق الزمني وعوامل التصفية التي تراها.',
  'No included credits': 'بلا أرصدة مشمولة',
  'Custom plan, {n} credits': 'خطة مخصصة، {n} رصيد',
  'No activity for 90 days or more': 'لا نشاط منذ 90 يومًا أو أكثر',
  'Signed in but never active': 'سجّل الدخول لكن لم ينشط قط',
  'Active in the last 30 days': 'نشط في آخر 30 يومًا',
  'Last active 30 to 89 days ago': 'آخر نشاط قبل 30 إلى 89 يومًا',
  'Other plan or no plan': 'خطة أخرى أو بلا خطة',
  'Seats with usage in this view': 'تراخيص لها استخدام في هذا العرض',
  'Seats with usage outside this view': 'تراخيص لها استخدام خارج هذا العرض',
  'Seats never in the report': 'تراخيص لم تظهر في التقرير قط',

  // KPI tiles
  'Monthly savings from freeing seats': 'التوفير الشهري من تحرير التراخيص',
  '{amount} a year': '{amount} في السنة',
  'Needs activity data in the list': 'يحتاج إلى بيانات نشاط في القائمة',
  'Seats to free': 'تراخيص يمكن تحريرها',
  '{share} of all seats': '{share} من كل التراخيص',
  'Usage but no seat': 'استخدام بلا ترخيص',
  '{amount} of usage in this period': '{amount} من الاستخدام في هذه الفترة',
  'License coverage': 'تغطية التراخيص',
  '{matched} of {users} users in the report have a seat': 'لدى {matched} من أصل {users} مستخدم في التقرير ترخيص',
  '{n} active in the last 30 days': '{n} نشط في آخر 30 يومًا',
  'No activity data in the list': 'لا توجد بيانات نشاط في القائمة',
  'Seat cost per month': 'تكلفة التراخيص في الشهر',

  // Lists
  'Seat lists': 'قوائم التراخيص',
  'No seats on this list.': 'لا توجد تراخيص في هذه القائمة.',
  'No activity for 90 days or more, or never active. The value is the monthly price of each seat. The most valuable seats come first.':
    'لا نشاط منذ 90 يومًا أو أكثر، أو لم ينشط قط. القيمة هي السعر الشهري لكل ترخيص. تأتي التراخيص الأعلى قيمة أولًا.',
  'Users with usage in the report but no seat in the license list, biggest usage first. Check that the list is complete before you act.':
    'مستخدمون لهم استخدام في التقرير وليس لهم ترخيص في قائمة التراخيص، الأكبر استخدامًا أولًا. تأكد من اكتمال القائمة قبل أن تتصرف.',
  'Fading seats': 'تراخيص متراجعة',
  'Last activity 30 to 89 days ago. A reminder fits better than taking the seat back.': 'آخر نشاط قبل 30 إلى 89 يومًا. التذكير أنسب من سحب الترخيص.',
  'Seats with no sign-in and no activity. They are also on the list of seats to free.': 'تراخيص بلا تسجيل دخول وبلا نشاط. وهي أيضًا في قائمة التراخيص المطلوب تحريرها.',
  'Quiet but active': 'هادئة لكنها نشطة',
  'Active in the last 30 days but no usage in the report. Code completions are not in the report, so do not free these seats.':
    'نشطة في آخر 30 يومًا لكن بلا استخدام في التقرير. إكمالات التعليمات البرمجية ليست في التقرير، فلا تحرر هذه التراخيص.',
  'Pending cancellation': 'بانتظار الإلغاء',
  'Seats that already end on a set date. They are not counted as savings.': 'تراخيص تنتهي بالفعل في تاريخ محدد. لا تُحسب ضمن التوفير.',
  'New seats': 'تراخيص جديدة',
  'Seats created within the new user window. They are never on the list of seats to free.': 'تراخيص أُنشئت ضمن فترة المستخدم الجديد. لا تظهر أبدًا في قائمة التراخيص المطلوب تحريرها.',

  // Columns
  'Click a user who is in the report to see their details.': 'انقر على مستخدم موجود في التقرير لترى تفاصيله.',
  'Click a user to see their details.': 'انقر على مستخدم لترى تفاصيله.',
  Name: 'الاسم',
  Reason: 'السبب',
  Team: 'الفريق',
  'Days since activity': 'أيام منذ آخر نشاط',
  'Days from the last activity to the date of the license list. Empty when the list shows no activity.': 'عدد الأيام من آخر نشاط حتى تاريخ قائمة التراخيص. يكون فارغًا إذا لم تُظهر القائمة أي نشاط.',
  'Last activity': 'آخر نشاط',
  'Last used in': 'آخر استخدام في',
  'The editor or place of the last activity, as the license list writes it.': 'المحرر أو المكان الذي حدث فيه آخر نشاط، كما تكتبه قائمة التراخيص.',
  'Seat since': 'الترخيص منذ',
  'Ends on': 'ينتهي في',
  'Usage in this period': 'الاستخدام في هذه الفترة',
  'Usage in this period (USD)': 'الاستخدام في هذه الفترة (USD)',
  'Value per month': 'القيمة في الشهر',
  'Seat price per month': 'سعر الترخيص في الشهر',
  'Value per month (USD)': 'القيمة في الشهر (USD)',
  'Seat price per month (USD)': 'سعر الترخيص في الشهر (USD)',
  'Plan in the report': 'الخطة في التقرير',
  'The plan read from the monthly included credits of the user in the report.': 'الخطة المستنتجة من الأرصدة المشمولة الشهرية للمستخدم في التقرير.',
};

export default ar;
