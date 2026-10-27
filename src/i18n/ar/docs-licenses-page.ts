import type { Dict } from '../core';

/** Arabic for the docs that only the Licenses page uses (`lib/metrics/docs/licenses-page.ts`). */
const ar: Dict = {
  // license-status-breakdown (the title 'Seats by activity' is in ./licenses.ts)
  'Every seat in the license list, grouped by what the list says about its last activity. The groups add up to all seats.':
    'كل ترخيص في قائمة التراخيص، مجمّعًا حسب ما تقوله القائمة عن آخر نشاط له. مجموع المجموعات يساوي كل التراخيص.',
  'Days since activity = as-of date − date of the last activity of the seat': 'الأيام منذ آخر نشاط = التاريخ المرجعي − تاريخ آخر نشاط للترخيص',
  'Active in the last 30 days: fewer than 30 days since the last activity.': 'نشط في آخر 30 يومًا: أقل من 30 يومًا منذ آخر نشاط.',
  'Last active 30 to 89 days ago: 30 to 89 days since the last activity.': 'آخر نشاط قبل 30 إلى 89 يومًا: من 30 إلى 89 يومًا منذ آخر نشاط.',
  'No activity for 90 days or more: 90 days or more since the last activity.': 'لا نشاط منذ 90 يومًا أو أكثر: 90 يومًا أو أكثر منذ آخر نشاط.',
  'No recent activity date: the list has activity data, but this seat has no last activity date.':
    'لا يوجد تاريخ نشاط حديث: في القائمة بيانات نشاط، لكن هذا الترخيص بلا تاريخ لآخر نشاط.',
  'No activity data: the list has no activity data at all, for example a plain list of usernames, or it has no date to count from.':
    'لا توجد بيانات نشاط: القائمة بلا بيانات نشاط إطلاقًا، مثل قائمة بسيطة بأسماء المستخدمين، أو بلا تاريخ يُحسب منه.',
  'Only the license list is used here. The usage report, the date range and the filters do not change these groups.':
    'تُستخدم قائمة التراخيص وحدها هنا. تقرير الاستخدام والنطاق الزمني وعوامل التصفية لا تغيّر هذه المجموعات.',
  'A blank activity date can mean a new seat or activity older than 90 days. It does not prove that the seat was never used. These seats are shown for review and are not counted as seats to free.':
    'قد يعني تاريخ النشاط الفارغ أن الترخيص جديد أو أن النشاط أقدم من 90 يومًا. ولا يثبت أن الترخيص لم يُستخدم قط. تُعرض هذه التراخيص للمراجعة ولا تُحسب ضمن التراخيص المطلوب تحريرها.',
  'Seats with a cancellation pending, new seats and seats with recent usage in the report are also left out of the list of seats to free.':
    'تُستثنى أيضًا من قائمة التراخيص المطلوب تحريرها التراخيص المنتظرة للإلغاء والجديدة والتي لها استخدام حديث في التقرير.',
  'Code completions count as activity in the license list, but they are not in the usage report. So a seat can be active here and have no usage in the report.':
    'تُحسب إكمالات التعليمات البرمجية نشاطًا في قائمة التراخيص، لكنها ليست في تقرير الاستخدام. لذا قد يكون الترخيص نشطًا هنا وليس له استخدام في التقرير.',
  'The list is dated June 30 and has 250 seats. 180 were active after June 1, 30 were last active in April or May, 25 were last active before April 1, and 15 have no activity date. That is 180 + 30 + 25 + 15 = 250 seats.':
    'تاريخ القائمة 30 يونيو وفيها 250 ترخيصًا. نشط 180 منها بعد 1 يونيو، وكان آخر نشاط لـ30 منها في أبريل أو مايو، ولـ25 قبل 1 أبريل، و15 بلا تاريخ نشاط. المجموع 180 + 30 + 25 + 15 = 250 ترخيصًا.',

  // license-no-activity-date
  'Seats with no recent activity date': 'تراخيص بلا تاريخ نشاط حديث',
  'Seats whose license data has no last activity date. The date alone cannot tell whether the seat is new or its activity is older than GitHub\'s 90-day history.':
    'تراخيص لا تحتوي بياناتها على تاريخ آخر نشاط. لا يوضح التاريخ وحده ما إذا كان الترخيص جديدًا أو أن نشاطه أقدم من سجل GitHub البالغ 90 يومًا.',
  'No recent activity date = seat in an activity-aware license list with no last activity date':
    'لا يوجد تاريخ نشاط حديث = ترخيص في قائمة تراخيص تتضمن بيانات النشاط، لكن بلا تاريخ لآخر نشاط',
  'Read the last activity date for each seat in the license list.':
    'اقرأ تاريخ آخر نشاط لكل ترخيص في قائمة التراخيص.',
  'List seats for which the date is blank, separately from seats with no activity data at all.':
    'اعرض التراخيص التي تاريخها فارغ في قائمة منفصلة عن التراخيص التي لا تملك بيانات نشاط إطلاقًا.',
  'Do not count a blank date as proof that the user never used GitHub Copilot. Review the seat before changing access.':
    'لا تعتبر التاريخ الفارغ دليلًا على أن المستخدم لم يستعمل GitHub Copilot قط. راجع الترخيص قبل تغيير الوصول.',
  'GitHub keeps only 90 days of activity history. A blank date can mean the seat is new or its activity is older than that history.':
    'يحتفظ GitHub بسجل النشاط لمدة 90 يومًا فقط. وقد يعني التاريخ الفارغ أن الترخيص جديد أو أن نشاطه أقدم من هذا السجل.',
  'These seats are not counted as seats to free or unused seats. The activity report also has no seat creation date.':
    'لا تُحسب هذه التراخيص ضمن التراخيص المطلوب تحريرها أو غير المستخدمة. كما أن تقرير النشاط لا يعرض تاريخ إنشاء الترخيص.',
  'A plain list of usernames has no activity fields. Those seats are shown as having no activity data, not in this list.':
    'قائمة أسماء المستخدمين البسيطة لا تحتوي على حقول نشاط. تظهر هذه التراخيص على أنها بلا بيانات نشاط، لا في هذه القائمة.',
  'An activity report lists 100 seats. It has dates for 82 seats and blank dates for 18. The 18 are shown for review and none is counted as a seat to free based on the blank date.':
    'يعرض تقرير النشاط 100 ترخيص. فيه تواريخ لـ82 ترخيصًا وتواريخ فارغة لـ18. تُعرض التراخيص الـ18 للمراجعة ولا يُحسب أي منها ضمن التراخيص المطلوب تحريرها بسبب التاريخ الفارغ.',

  // license-never-seen (the title 'Seats never in the report' is in ./licenses.ts)
  'Seats in the license list whose user has no row in any loaded file. The seat is paid for, but the report shows no usage by this user at all.':
    'تراخيص في قائمة التراخيص ليس لمستخدمها أي صف في أي ملف محمّل. الترخيص مدفوع، لكن التقرير لا يُظهر أي استخدام لهذا المستخدم.',
  'Seats never in the report = seats whose username is in no row of the loaded files': 'التراخيص التي لم تظهر في التقرير = التراخيص التي لا يوجد اسم مستخدمها في أي صف من الملفات المحمّلة',
  'Compare each username in the license list with the usernames in every loaded file. Capital letters and spaces around the name do not matter.':
    'قارن كل اسم مستخدم في قائمة التراخيص بأسماء المستخدمين في كل ملف محمّل. لا تهم الأحرف الكبيرة ولا المسافات حول الاسم.',
  'Count the usernames that are in no row.': 'احسب أسماء المستخدمين التي لا تظهر في أي صف.',
  'The date range and the filters do not change this number, because it looks at every loaded file.': 'النطاق الزمني وعوامل التصفية لا تغيّر هذا الرقم، لأنه ينظر إلى كل ملف محمّل.',
  'Together with the seats with usage in this view and the seats with usage outside this view, it adds up to all seats.':
    'مع التراخيص التي لها استخدام في هذا العرض والتراخيص التي لها استخدام خارجه، يساوي المجموع كل التراخيص.',
  'A seat that is never in the report can still be in use, for example for code completions, which are not in the report. The activity data in the license list tells you more.':
    'قد يكون الترخيص الذي لم يظهر في التقرير قيد الاستخدام، مثلًا لإكمالات التعليمات البرمجية التي ليست في التقرير. بيانات النشاط في قائمة التراخيص تخبرك بالمزيد.',
  '250 seats, of which 200 have usage in this view and 30 have usage only outside it: 250 − 200 − 30 = 20 seats never in the report.':
    '250 ترخيصًا، منها 200 لها استخدام في هذا العرض و30 لها استخدام خارجه فقط: 250 − 200 − 30 = 20 ترخيصًا لم تظهر في التقرير قط.',
};

export default ar;
