import type { Dict, PluralEntry } from '../core';

/** Arabic text for the Patterns page (src/pages/PatternsPage.tsx and src/pages/patterns). */
const plural = (one: string, two: string, few: string, many: string, other: string): PluralEntry => ({ zero: other, one, two, few, many, other });

const arabic: Dict = {
  // Page header
  'When GitHub Copilot is used, whether adoption is growing or fading, and which days stood out.':
    'متى يُستخدم GitHub Copilot، وهل التبنّي في ازدياد أم تراجع، وأي الأيام كانت لافتة.',
  '{from} to {to} · {days} · {users}': 'من {from} إلى {to} · {days} · {users}',

  // Headline numbers
  '{amount} across {days}': '{amount} على مدى {days}',
  'Needs at least 14 days of data': 'يحتاج إلى بيانات 14 يومًا على الأقل',
  'No usage in the 7 days before': 'لا يوجد استخدام في الأيام السبعة السابقة',
  '{amount} on {weekday}, an unusual day': '{amount} يوم {weekday}، وهو يوم غير معتاد',
  '{amount} on {weekday}': '{amount} يوم {weekday}',
  'About {amount} on an average {weekday}, among the selected weekdays': 'نحو {amount} في يوم {weekday} المتوسط، من بين أيام الأسبوع المحددة',
  'About {amount} on an average {weekday}': 'نحو {amount} في يوم {weekday} المتوسط',
  'Average active users per day': 'متوسط المستخدمين النشطين في اليوم',
  'Highest was {n} in one day': 'الأعلى كان {n} في يوم واحد',
  'Users with at least {amount} of usage on a day, averaged over the days that have usage. Change the threshold in Settings.':
    'المستخدمون الذين بلغ استخدامهم {amount} على الأقل في يوم، بالمتوسط على الأيام التي فيها استخدام. غيّر الحد من الإعدادات.',
  'Usage of the last 7 days of the range against the 7 days before them. It needs at least 14 days of data and some usage in the earlier week. A rise of more than 25% is shown in the warning color.':
    'الاستخدام في آخر 7 أيام من الفترة مقابل الأيام السبعة التي قبلها. يحتاج إلى بيانات 14 يومًا على الأقل وإلى بعض الاستخدام في الأسبوع الأسبق. تظهر الزيادة التي تتجاوز 25% بلون التحذير.',
  'The day with the most usage. Unusual days are explained further down this page.': 'اليوم الأعلى استخدامًا. الأيام غير المعتادة مشروحة في أسفل هذه الصفحة.',
  'Days with usage': 'أيام فيها استخدام',
  'of {days} on the selected weekdays': 'من {days} في أيام الأسبوع المحددة',
  'of {days} in the range': 'من {days} في الفترة',
  'Days with any usage. Days with no usage at all, such as weekends or holidays, are not counted.':
    'الأيام التي فيها أي استخدام. لا تُحسب الأيام الخالية من الاستخدام، مثل عطلات نهاية الأسبوع والإجازات.',
  'Busiest weekday': 'أكثر أيام الأسبوع استخدامًا',
  'The weekday with the highest usage per day. Each weekday is divided by how many times it occurs in the range, including days with no usage, so a range with more Mondays does not win by count.':
    'يوم الأسبوع الأعلى في الاستخدام لكل يوم. يُقسم استخدام كل يوم على عدد مرات تكراره في الفترة، بما فيها الأيام الخالية من الاستخدام، فلا يتقدم يوم لمجرد تكراره أكثر.',
  'Weekend share of usage': 'حصة عطلة نهاية الأسبوع من الاستخدام',
  'Usage on Saturdays and Sundays as a share of all usage. An even spread over the week would be about 29%, so a low share means GitHub Copilot is used mostly on workdays.':
    'الاستخدام في أيام السبت والأحد كنسبة من كل الاستخدام. التوزيع المتساوي على الأسبوع يعطي نحو 29%، لذا تعني النسبة المنخفضة أن GitHub Copilot يُستخدم غالبًا في أيام العمل.',

  // Adoption over time
  'A user counts as new in the week they first appear in the data. Active users per week are users with any usage that week.':
    'يُعد المستخدم جديدًا في الأسبوع الذي يظهر فيه أول مرة في البيانات. المستخدمون النشطون في الأسبوع هم من لديهم أي استخدام في ذلك الأسبوع.',
  'Users first seen in the first {days} of the data count as already using GitHub Copilot, so this range has no new users.':
    'المستخدمون الذين ظهروا أول مرة في أول {days} من البيانات يُعدّون من مستخدمي GitHub Copilot من قبل، لذا لا يوجد مستخدمون جدد في هذه الفترة.',
  '{n} users count as already using GitHub Copilot.': plural(
    'مستخدم واحد يُعدّ من مستخدمي GitHub Copilot من قبل.',
    'مستخدمان يُعدّان من مستخدمي GitHub Copilot من قبل.',
    '{n} مستخدمين يُعدّون من مستخدمي GitHub Copilot من قبل.',
    '{n} مستخدمًا يُعدّون من مستخدمي GitHub Copilot من قبل.',
    '{n} مستخدم يُعدّون من مستخدمي GitHub Copilot من قبل.',
  ),
  'Users first seen in the first {days} of the data cannot be told apart from existing users, so new users are counted from {date}.':
    'لا يمكن تمييز المستخدمين الذين ظهروا أول مرة في أول {days} من البيانات عن المستخدمين الحاليين، لذا يُحسب المستخدمون الجدد بدءًا من {date}.',
  '{n} users were already using GitHub Copilot before this range began.': plural(
    'مستخدم واحد كان يستخدم GitHub Copilot قبل بداية هذه الفترة.',
    'مستخدمان كانا يستخدمان GitHub Copilot قبل بداية هذه الفترة.',
    '{n} مستخدمين كانوا يستخدمون GitHub Copilot قبل بداية هذه الفترة.',
    '{n} مستخدمًا كانوا يستخدمون GitHub Copilot قبل بداية هذه الفترة.',
    '{n} مستخدم كانوا يستخدمون GitHub Copilot قبل بداية هذه الفترة.',
  ),
  'Lighter bars and hollow markers are weeks only partly inside the range.': 'الأعمدة الفاتحة والعلامات المفرغة هي أسابيع يقع جزء منها فقط داخل الفترة.',
  'Click a week to show only that week.': 'انقر على أسبوع لعرض ذلك الأسبوع فقط.',
  'Adoption over time': 'التبنّي عبر الزمن',
  'New users, users so far, and active users per week, Monday to Sunday.': 'المستخدمون الجدد، والمستخدمون حتى الآن، والمستخدمون النشطون في كل أسبوع، من الاثنين إلى الأحد.',
  'Chart of new users, users so far, and active users per week': 'مخطط المستخدمين الجدد والمستخدمين حتى الآن والمستخدمين النشطين في كل أسبوع',
  'Too little history to say whether adoption is growing or fading. It needs at least {need} weeks with {days} or more days of data, and this range has {weeks}.':
    'البيانات قليلة جدًا للحكم على ازدياد التبنّي أو تراجعه. يلزم {need} أسابيع على الأقل في كل منها {days} أيام بيانات أو أكثر، وهذه الفترة فيها {weeks}.',
  'Adoption is growing. The last {weeks} weeks averaged {recent} active users a week, and no one was active in the {weeks} weeks before.':
    'التبنّي في ازدياد. بلغ متوسط آخر {weeks} أسابيع {recent} مستخدمًا نشطًا في الأسبوع، ولم يكن أحد نشطًا في الأسابيع الـ{weeks} السابقة.',
  'No users were active in the last {weeks} weeks.': 'لم يكن أي مستخدم نشطًا في آخر {weeks} أسابيع.',
  'Adoption is growing. The last {weeks} weeks averaged {recent} active users a week, {pct} more than the {weeks} weeks before ({prior}).':
    'التبنّي في ازدياد. بلغ متوسط آخر {weeks} أسابيع {recent} مستخدمًا نشطًا في الأسبوع، بزيادة {pct} عن الأسابيع الـ{weeks} السابقة ({prior}).',
  'Adoption is declining. No users were active in the last {weeks} weeks, down from an average of {prior} in the {weeks} weeks before.':
    'التبنّي في تراجع. لم يكن أي مستخدم نشطًا في آخر {weeks} أسابيع، بعد متوسط {prior} في الأسابيع الـ{weeks} السابقة.',
  'Adoption is declining. The last {weeks} weeks averaged {recent} active users a week, {pct} fewer than the {weeks} weeks before ({prior}).':
    'التبنّي في تراجع. بلغ متوسط آخر {weeks} أسابيع {recent} مستخدمًا نشطًا في الأسبوع، بنقص {pct} عن الأسابيع الـ{weeks} السابقة ({prior}).',
  'Adoption is flat. The last {weeks} weeks averaged {recent} active users a week, within {pct} of the {weeks} weeks before ({prior}).':
    'التبنّي ثابت. بلغ متوسط آخر {weeks} أسابيع {recent} مستخدمًا نشطًا في الأسبوع، بفارق لا يتجاوز {pct} عن الأسابيع الـ{weeks} السابقة ({prior}).',
  'Users so far': 'المستخدمون حتى الآن',
  'Active users per week': 'المستخدمون النشطون في الأسبوع',
  'Partial week: {days} of 7 fall in this range.': 'أسبوع جزئي: {days} من 7 تقع في هذه الفترة.',
  'Click to show only this week.': 'انقر لعرض هذا الأسبوع فقط.',

  // Usage calendar
  'Color key': 'دليل الألوان',
  'Usage calendar': 'تقويم الاستخدام',
  'Usage on each day of the range. Darker days have more usage. Click a day to show only that day.':
    'الاستخدام في كل يوم من الفترة. الأيام الأغمق فيها استخدام أكثر. انقر على يوم لعرض ذلك اليوم فقط.',
  'No usage in this range': 'لا يوجد استخدام في هذه الفترة',
  'Calendar of daily usage for the months shown': 'تقويم الاستخدام اليومي للأشهر المعروضة',
  'Only part of this month is inside the date range': 'جزء فقط من هذا الشهر يقع داخل نطاق التاريخ',
  'Usage in {month}, within the date range': 'الاستخدام في {month}، ضمن نطاق التاريخ',
  'Calendar of daily usage for {month}': 'تقويم الاستخدام اليومي لشهر {month}',
  'Showing the latest {months}, {from} to {to}. Narrow the date range to see earlier months.':
    'تُعرض آخر {months}، من {from} إلى {to}. ضيّق نطاق التاريخ لرؤية الأشهر الأقدم.',
  'Showing all {months} of the range.': 'تُعرض كل {months} في الفترة.',
  'Calendar': 'التقويم',
  'Has usage': 'فيه استخدام',
  'Up to {amount}': 'حتى {amount}',
  'Over {amount}': 'أكثر من {amount}',
  'No usage on this day.': 'لا يوجد استخدام في هذا اليوم.',
  'Unusual day: {detail}': 'يوم غير معتاد: {detail}',
  'Click to show only this day.': 'انقر لعرض هذا اليوم فقط.',

  // Daily usage
  'One bar per day': 'عمود لكل يوم',
  'One bar per week, Monday to Sunday': 'عمود لكل أسبوع، من الاثنين إلى الأحد',
  'The line is the average of the last 7 days, so a quiet weekend does not look like a drop.':
    'الخط هو متوسط آخر 7 أيام، فلا تبدو عطلة نهاية الأسبوع الهادئة كأنها هبوط.',
  'The line is the average week over the last 4 weeks.': 'الخط هو متوسط الأسبوع على مدى آخر 4 أسابيع.',
  'Weekend bars are lighter.': 'أعمدة عطلة نهاية الأسبوع أفتح لونًا.',
  'Lighter bars are weeks only partly inside the range.': 'الأعمدة الفاتحة هي أسابيع يقع جزء منها فقط داخل الفترة.',
  'Red markers are unusual days, listed in the table further down.': 'العلامات الحمراء أيام غير معتادة، مذكورة في الجدول في الأسفل.',
  'Click a bar to show only that day.': 'انقر على عمود لعرض ذلك اليوم فقط.',
  'Click a bar to show only that week.': 'انقر على عمود لعرض ذلك الأسبوع فقط.',
  'Zoomed to the latest {days}. Drag the slider to see earlier days.': 'العرض مكبّر على آخر {days}. اسحب شريط التمرير لرؤية الأيام الأقدم.',
  'Drag the slider to zoom in.': 'اسحب شريط التمرير للتكبير.',
  'Daily usage': 'الاستخدام اليومي',
  'Usage per day.': 'الاستخدام في كل يوم.',
  'Usage per week, Monday to Sunday.': 'الاستخدام في كل أسبوع، من الاثنين إلى الأحد.',
  'Group usage by': 'تجميع الاستخدام حسب',
  'Active users per day': 'المستخدمون النشطون في اليوم',
  'Bar chart of usage per day with a moving average': 'مخطط أعمدة للاستخدام في كل يوم مع متوسط متحرك',
  'Bar chart of usage per week with a moving average': 'مخطط أعمدة للاستخدام في كل أسبوع مع متوسط متحرك',
  '{times} times the typical day (about {amount})': '{times} ضعف اليوم المعتاد (نحو {amount})',
  '{date} was unusual: {detail}': 'كان {date} غير معتاد: {detail}',
  'Usage in the week': 'الاستخدام في الأسبوع',
  '7-day average': 'متوسط 7 أيام',
  '4-week average': 'متوسط 4 أسابيع',
  'Partial week: {days} fall in this range.': 'أسبوع جزئي: {days} تقع في هذه الفترة.',

  // Lapsed and fading users
  'Showing the {shown} with the most usage, of {total}.': 'يُعرض {shown} الأعلى استخدامًا من أصل {total}.',
  'Open all {total} in Users': 'فتح الـ{total} كلهم في صفحة المستخدمين',
  'Open in Users': 'فتح في صفحة المستخدمين',
  'Used GitHub Copilot earlier, then nothing for {days} or more by the end of the range.':
    'استخدموا GitHub Copilot من قبل، ثم لا شيء لمدة {days} أو أكثر حتى نهاية الفترة.',
  '{n} lapsed users': plural('مستخدم منقطع واحد', 'مستخدمان منقطعان', '{n} مستخدمين منقطعين', '{n} مستخدمًا منقطعًا', '{n} مستخدم منقطع'),
  'Ask them whether they still need GitHub Copilot. A seat nobody uses can go to someone who will.':
    'اسألهم هل ما زالوا يحتاجون إلى GitHub Copilot. الترخيص الذي لا يستخدمه أحد يمكن منحه لمن سيستخدمه.',
  'Users first seen in the last {days} are not counted, because they have had little time to use it.':
    'لا يُحسب المستخدمون الذين ظهروا أول مرة في آخر {days}، لأن الوقت المتاح لهم للاستخدام كان قصيرًا.',
  'No lapsed users': 'لا يوجد مستخدمون منقطعون',
  'Every user was active in the last {days} of the range, or started recently.': 'كل المستخدمين كانوا نشطين في آخر {days} من الفترة، أو بدؤوا مؤخرًا.',
  'Last active': 'آخر نشاط',
  'Days since': 'أيام منذ آخر نشاط',
  'Usage before': 'الاستخدام قبلها',
  'Needs 14 days of data': 'يحتاج إلى بيانات 14 يومًا',
  'Fading users compare the last 7 days with the 7 days before, so the range needs at least 14 days. This range has {days}.':
    'تقارن قائمة المستخدمين المتراجعين آخر 7 أيام بالأيام السبعة التي قبلها، لذا تحتاج الفترة إلى 14 يومًا على الأقل. هذه الفترة فيها {days}.',
  'No fading users': 'لا يوجد مستخدمون متراجعون',
  'No user with at least {amount} in the earlier 7 days dropped to half or less in the last 7 days.':
    'لم ينخفض أي مستخدم لديه {amount} على الأقل في الأيام السبعة الأسبق إلى النصف أو أقل في آخر 7 أيام.',
  '7-day change': 'التغيّر في 7 أيام',
  '{recent} in the last 7 days, {prior} in the 7 days before': '{recent} في آخر 7 أيام، و{prior} في الأيام السبعة التي قبلها',
  'Fading users': 'المستخدمون المتراجعون',
  'Usage in the last 7 days of the range is half or less of the 7 days before.': 'الاستخدام في آخر 7 أيام من الفترة يساوي نصف الأيام السبعة التي قبلها أو أقل.',
  '{n} fading users': plural('مستخدم متراجع واحد', 'مستخدمان متراجعان', '{n} مستخدمين متراجعين', '{n} مستخدمًا متراجعًا', '{n} مستخدم متراجع'),
  'Check in with them before they stop. A short tip or a training session can help them get value from GitHub Copilot again.':
    'تواصل معهم قبل أن يتوقفوا. نصيحة قصيرة أو جلسة تدريب قد تساعدهم على الاستفادة من GitHub Copilot من جديد.',
  'Only users with at least {amount} in the earlier 7 days are checked. Hover a change to see the amounts.':
    'لا يُفحص إلا المستخدمون الذين لديهم {amount} على الأقل في الأيام السبعة الأسبق. مرّر المؤشر فوق التغيّر لرؤية المبالغ.',

  // Month by month
  'Whole range': 'الفترة كاملة',
  'The date range covers {covered} of the {total} days of this month': 'يغطي نطاق التاريخ {covered} من أصل {total} يومًا في هذا الشهر',
  'Usage in the month, within the date range': 'الاستخدام في الشهر، ضمن نطاق التاريخ',
  'Usage per active day': 'الاستخدام لكل يوم نشط',
  'Usage divided by the days of the month that have any usage, so months of different length can be compared':
    'الاستخدام مقسومًا على أيام الشهر التي فيها أي استخدام، لتمكن مقارنة الأشهر مختلفة الطول',
  'Users with at least {amount} of usage on a day, averaged over the days with usage':
    'المستخدمون الذين بلغ استخدامهم {amount} على الأقل في يوم، بالمتوسط على الأيام التي فيها استخدام',
  'Users whose first usage in the data falls in this month. Users first seen in the first {days} of the data are not counted as new.':
    'المستخدمون الذين يقع أول استخدام لهم في البيانات في هذا الشهر. لا يُعد جديدًا من ظهر أول مرة في أول {days} من البيانات.',
  'Active users per month': 'المستخدمون النشطون في الشهر',
  'Users whose usage in the month adds up to more than $0. The Whole range row counts every user with any usage row in the range once, even if their rows add up to $0.':
    'المستخدمون الذين يزيد مجموع استخدامهم في الشهر على 0 دولار. يحسب صف الفترة كاملة كل مستخدم له أي صف استخدام في الفترة مرة واحدة، حتى لو كان مجموع صفوفه 0 دولار.',
  'Month by month': 'شهرًا بشهر',
  'How usage, activity, and new users change from one calendar month to the next.': 'كيف يتغير الاستخدام والنشاط والمستخدمون الجدد من شهر تقويمي إلى الذي يليه.',
  'A partial month has only some of its days inside the date range, so its usage is lower. Compare months with the per-day columns. Active users per month are users whose usage that month adds up to more than $0. The Whole range row counts every user with any usage row once, the same count as the page header.':
    'الشهر الجزئي يقع بعض أيامه فقط داخل نطاق التاريخ، لذا يكون استخدامه أقل. قارن الأشهر باستخدام الأعمدة المحسوبة لكل يوم. المستخدمون النشطون في الشهر هم من يزيد مجموع استخدامهم في ذلك الشهر على 0 دولار. يحسب صف الفترة كاملة كل مستخدم له أي صف استخدام مرة واحدة، وهو العدد نفسه في رأس الصفحة.',

  // Unusual days
  'Typical day': 'اليوم المعتاد',
  'The middle day (median) of the days with usage in this range': 'اليوم الأوسط (الوسيط) من الأيام التي فيها استخدام في هذه الفترة',
  'Times the typical day': 'أضعاف اليوم المعتاد',
  'Usage on the day divided by the typical day': 'الاستخدام في اليوم مقسومًا على اليوم المعتاد',
  'Top users that day': 'أعلى المستخدمين في ذلك اليوم',
  'The users with the most usage on that day. Click one to open the user.': 'المستخدمون الأعلى استخدامًا في ذلك اليوم. انقر على أحدهم لفتح صفحته.',
  'Usage not tied to a user': 'استخدام غير مرتبط بمستخدم',
  'Top models that day': 'أعلى النماذج في ذلك اليوم',
  'The models with the most usage on that day, with their share of the day': 'النماذج الأعلى استخدامًا في ذلك اليوم، مع حصتها من اليوم',
  'Filter the whole report to this day': 'تصفية التقرير كله على هذا اليوم',
  'Only this day': 'هذا اليوم فقط',
  'A day is unusual when its usage is at least {multiple} times the typical day and far above the normal ups and downs between days (a z-score of {z} or more). The typical day is the middle day (median) of the days with usage. The check needs at least {min} days with usage and lists up to {limit} days.':
    'يكون اليوم غير معتاد عندما يبلغ استخدامه {multiple} ضعف اليوم المعتاد على الأقل، ويكون أعلى بكثير من التقلبات العادية بين الأيام (درجة معيارية z تبلغ {z} أو أكثر). اليوم المعتاد هو اليوم الأوسط (الوسيط) من الأيام التي فيها استخدام. يحتاج الفحص إلى {min} يومًا فيها استخدام على الأقل، ويعرض حتى {limit} أيام.',
  'Days with far more usage than the typical day, and who and what drove them.': 'أيام فيها استخدام أكبر بكثير من اليوم المعتاد، ومن وما الذي تسبب فيها.',
  'Not enough days to judge': 'الأيام غير كافية للحكم',
  'Finding unusual days needs at least {min} days with usage, so one busy day cannot define what is normal. This range has {days}.':
    'يحتاج اكتشاف الأيام غير المعتادة إلى {min} يومًا فيها استخدام على الأقل، حتى لا يحدد يوم مزدحم واحد ما هو المعتاد. هذه الفترة فيها {days}.',
  'No unusual days': 'لا توجد أيام غير معتادة',
  'No day was far above the typical day of about {amount}.': 'لم يكن أي يوم أعلى بكثير من اليوم المعتاد البالغ نحو {amount}.',

  // Weekday pattern
  'Usage on a weekday divided by how many times that weekday occurs in the range': 'الاستخدام في يوم من أيام الأسبوع مقسومًا على عدد مرات تكراره في الفترة',
  'Average usage on each weekday. A range with more Mondays than Fridays does not skew the bars.':
    'متوسط الاستخدام في كل يوم من أيام الأسبوع. لا تتأثر الأعمدة إذا كان في الفترة أيام اثنين أكثر من أيام الجمعة.',
  'All usage on that weekday, added up over the range': 'كل الاستخدام في ذلك اليوم من الأسبوع، مجموعًا على الفترة',
  'Total usage on each weekday over the range.': 'إجمالي الاستخدام في كل يوم من أيام الأسبوع على مدى الفترة.',
  'Average number of active users on that weekday. Days with no usage count as zero.': 'متوسط عدد المستخدمين النشطين في ذلك اليوم من الأسبوع. الأيام الخالية من الاستخدام تُحسب صفرًا.',
  'Average active users on each weekday. Days with no usage count as zero.': 'متوسط المستخدمين النشطين في كل يوم من أيام الأسبوع. الأيام الخالية من الاستخدام تُحسب صفرًا.',
  'Weekday pattern': 'نمط أيام الأسبوع',
  'Click a bar to show only that weekday.': 'انقر على عمود لعرض ذلك اليوم من الأسبوع فقط.',
  'Weekday measure': 'مقياس أيام الأسبوع',
  'Bar chart of usage by weekday': 'مخطط أعمدة للاستخدام حسب يوم الأسبوع',
  'Show only': 'عرض فقط',
  'Show only {weekday}': 'عرض {weekday} فقط',
  'Remove {weekday} from the weekday filter': 'إزالة {weekday} من تصفية أيام الأسبوع',
  'Add {weekday} to the weekday filter': 'إضافة {weekday} إلى تصفية أيام الأسبوع',
  'A weekday filter is on': 'تصفية أيام الأسبوع مفعّلة',
  'No weekend days in this range': 'لا توجد أيام عطلة نهاية الأسبوع في هذه الفترة',
  'A weekday filter is on, so only the selected weekdays have usage to compare.': 'تصفية أيام الأسبوع مفعّلة، لذا لا يوجد استخدام للمقارنة إلا في الأيام المحددة.',
  'Too little history to compare weekdays. It needs at least {need} days, and this range has {days}.':
    'البيانات قليلة جدًا لمقارنة أيام الأسبوع. يلزم {need} يومًا على الأقل، وهذه الفترة فيها {days}.',
  'There is no usage from Monday to Friday in this range.': 'لا يوجد استخدام من الاثنين إلى الجمعة في هذه الفترة.',
  '{low} usage runs {lowPct} below the Monday to Friday average, and {high} usage runs {highPct} above it.':
    'استخدام يوم {low} أقل من متوسط الاثنين إلى الجمعة بنسبة {lowPct}، واستخدام يوم {high} أعلى منه بنسبة {highPct}.',
  '{weekday} usage runs {pct} below the Monday to Friday average.': 'استخدام يوم {weekday} أقل من متوسط الاثنين إلى الجمعة بنسبة {pct}.',
  '{weekday} usage runs {pct} above the Monday to Friday average.': 'استخدام يوم {weekday} أعلى من متوسط الاثنين إلى الجمعة بنسبة {pct}.',
  'Usage is spread evenly from Monday to Friday. No weekday is more than {pct} away from the average.':
    'الاستخدام موزع بالتساوي من الاثنين إلى الجمعة. لا يبتعد أي يوم عن المتوسط بأكثر من {pct}.',
  'Click to show only this weekday.': 'انقر لعرض هذا اليوم من الأسبوع فقط.',
  'Click to take this weekday out of the weekday filter.': 'انقر لإخراج هذا اليوم من تصفية أيام الأسبوع.',
  'Click to add this weekday to the weekday filter.': 'انقر لإضافة هذا اليوم إلى تصفية أيام الأسبوع.',
  'This weekday occurs {n} times in the range, {usage} with usage.': plural(
    'يتكرر هذا اليوم مرة واحدة في الفترة، منها {usage} فيها استخدام.',
    'يتكرر هذا اليوم مرتين في الفترة، منها {usage} فيها استخدام.',
    'يتكرر هذا اليوم {n} مرات في الفترة، منها {usage} فيها استخدام.',
    'يتكرر هذا اليوم {n} مرة في الفترة، منها {usage} فيها استخدام.',
    'يتكرر هذا اليوم {n} مرة في الفترة، منها {usage} فيها استخدام.',
  ),

  // Generic words that were not in common.ts or ui.ts yet (listed in the Patterns report)
  Days: 'الأيام',
  Weeks: 'الأسابيع',
  Partial: 'جزئي',
  Date: 'التاريخ',
  Action: 'الإجراء',
  Clear: 'مسح',
  'No usage': 'لا يوجد استخدام',
  'Open this user': 'فتح صفحة هذا المستخدم',
  '{recent} vs {prior}': '{recent} مقابل {prior}',
};

export default arabic;
