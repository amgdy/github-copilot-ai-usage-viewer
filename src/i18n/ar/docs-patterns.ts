import type { Dict } from '../core';

/** Arabic for the Patterns page metric docs in `lib/metrics/docs/patterns.ts`. */
const arabic: Dict = {
  // Days with usage
  'How many days of the selected period had any usage. It tells you how regularly GitHub Copilot is used, not how much.':
    'عدد أيام الفترة المحددة التي فيها أي استخدام. يبيّن مدى انتظام استخدام GitHub Copilot، لا حجم الاستخدام.',
  'Days with usage = number of days whose total gross_amount is above $0': 'أيام فيها استخدام = عدد الأيام التي يزيد مجموع gross_amount فيها على $0',
  'Add up the gross_amount of all the rows of a day, including rows without a username.': 'اجمع gross_amount لكل صفوف اليوم، بما فيها الصفوف التي ليس لها username.',
  'Count the days of the period whose total is above $0. The line under the number gives the days in the period. With a weekday filter on, it gives only the days of the selected weekdays.':
    'احسب أيام الفترة التي يزيد مجموعها على $0. يذكر السطر تحت الرقم عدد أيام الفترة. وعند تفعيل تصفية أيام الأسبوع يذكر أيام الأسبوع المحددة فقط.',
  'A day with no rows, or with a total of $0 or less, is not counted. Weekends and holidays get no special treatment: they count when they have usage and do not when they have none.':
    'لا يُحسب اليوم الذي ليس فيه صفوف أو الذي مجموعه $0 أو أقل. لا تُعامل عطلات نهاية الأسبوع والإجازات معاملة خاصة: تُحسب إذا كان فيها استخدام، ولا تُحسب إذا لم يكن.',
  'A day is the date written in the file. The date is not converted to another time zone. If the file cuts its days in a zone other than yours, evening work can land on the next day, and the app cannot correct that.':
    'اليوم هو التاريخ المكتوب في الملف، ولا يُحوَّل إلى منطقة زمنية أخرى. إذا كان الملف يقسم الأيام حسب منطقة زمنية غير منطقتك، فقد يقع عمل المساء في اليوم التالي، ولا يستطيع التطبيق تصحيح ذلك.',
  'The period ends at the last date in the file, or at the end date you chose. The app cannot tell whether the newest day is complete, so a day that is only partly reported still counts.':
    'تنتهي الفترة عند آخر تاريخ في الملف، أو عند تاريخ النهاية الذي اخترته. لا يستطيع التطبيق معرفة هل اكتمل أحدث يوم، لذا يُحسب اليوم حتى لو كان جزء منه فقط في التقرير.',
  'The Month by month table calls these days active days. The Active-day threshold does not apply to them. It applies to users, in Active users per day.':
    'يسمّي جدول شهرًا بشهر هذه الأيام أيامًا نشطة. لا ينطبق عليها حد اليوم النشط، فهو ينطبق على المستخدمين في المستخدمون النشطون في اليوم.',
  'A period of 31 days in which GitHub Copilot was used on 22 of them has 22 days with usage. The line under the number reads "of 31 days in the range".':
    'فترة من 31 يومًا استُخدم فيها GitHub Copilot في 22 يومًا فيها 22 يومًا فيها استخدام. ويقول السطر تحت الرقم "من 31 يومًا في الفترة".',

  // Average active users per day
  'How many people are active on a typical day that has usage. It counts people, not dollars.': 'عدد الأشخاص النشطين في يوم معتاد فيه استخدام. يحسب الأشخاص، لا الدولارات.',
  'Average active users per day = sum of the active users of each day with usage ÷ number of days with usage':
    'متوسط المستخدمين النشطين في اليوم = مجموع المستخدمين النشطين في كل يوم فيه استخدام ÷ عدد الأيام التي فيها استخدام',
  'For every day, add up the gross_amount of each user. A user is active on that day when the total is at least the Active-day threshold.':
    'في كل يوم، اجمع gross_amount لكل مستخدم. يكون المستخدم نشطًا في ذلك اليوم إذا بلغ مجموعه حد اليوم النشط على الأقل.',
  'Count the active users of each day, and leave out the days with no usage.': 'احسب المستخدمين النشطين في كل يوم، واستبعد الأيام الخالية من الاستخدام.',
  'Divide the sum of those counts by the number of days with usage. The line under the number gives the highest count of a single day.':
    'اقسم مجموع هذه الأعداد على عدد الأيام التي فيها استخدام. يذكر السطر تحت الرقم أعلى عدد في يوم واحد.',
  'Rows without a username, such as repository-level products, are never counted as users.': 'لا تُحسب أبدًا الصفوف التي ليس لها username، مثل المنتجات على مستوى المستودع، كمستخدمين.',
  'A user below the threshold on a day is not active that day, although the usage still counts in every total.':
    'المستخدم الذي يقل عن الحد في يوم لا يكون نشطًا في ذلك اليوم، مع أن استخدامه يدخل في كل المجاميع.',
  'The small chart under the number shows the active users of every day of the period, including days with no usage. It appears when the period has at least 2 days.':
    'يعرض المخطط الصغير تحت الرقم المستخدمين النشطين في كل يوم من الفترة، بما فيها الأيام الخالية من الاستخدام. يظهر عندما تضم الفترة يومين على الأقل.',
  'The weekday chart, in its Active users view, averages over every day of a weekday, so days with no usage count as zero there. This number leaves them out, so the two can differ.':
    'يحسب مخطط أيام الأسبوع، في عرض المستخدمين النشطين، المتوسط على كل أيام يوم الأسبوع، فتُحسب الأيام الخالية من الاستخدام صفرًا هناك. أما هذا الرقم فيستبعدها، لذا قد يختلف الاثنان.',
  'The Month by month table works it out for each month, and its Whole range row for the whole period. It shows a dash when no day has usage.':
    'يحسبه جدول شهرًا بشهر لكل شهر، ويحسبه صف الفترة كاملة للفترة كلها. تظهر شرطة عندما لا يكون في أي يوم استخدام.',
  'Three days with usage had 8, 10 and 12 active users, and a fourth day had no usage. The average is (8 + 10 + 12) ÷ 3 = 10 active users per day.':
    'في ثلاثة أيام فيها استخدام كان هناك 8 و10 و12 مستخدمًا نشطًا، ولم يكن في يوم رابع أي استخدام. المتوسط = (8 + 10 + 12) ÷ 3 = 10 مستخدمين نشطين في اليوم.',

  // Active users per day
  'How many different people were active on one day. It is the count behind the Active users per day line of the daily chart, the Active users view of the weekday chart and the tooltip of the calendar.':
    'عدد الأشخاص المختلفين الذين كانوا نشطين في يوم واحد. هذا هو العدد وراء خط المستخدمين النشطين في اليوم في المخطط اليومي، وعرض المستخدمين النشطين في مخطط أيام الأسبوع، والتلميح في التقويم.',
  'Active users on a day = number of users whose usage on that day is at least the Active-day threshold':
    'المستخدمون النشطون في يوم = عدد المستخدمين الذين بلغ استخدامهم في ذلك اليوم حد اليوم النشط على الأقل',
  'Add up the gross_amount of each username for the day, over the rows that pass the filters.': 'اجمع gross_amount لكل username في ذلك اليوم، من الصفوف التي تجتاز عوامل التصفية.',
  'Count the users whose total is at least the Active-day threshold. Rows without a username are not counted.':
    'احسب المستخدمين الذين بلغ مجموعهم حد اليوم النشط على الأقل. لا تُحسب الصفوف التي ليس لها username.',
  'The week view of the daily chart shows the average of the days of a week that have usage. The weekday chart shows the average over all the days of a weekday, with days of no usage counted as zero.':
    'يعرض العرض الأسبوعي في المخطط اليومي متوسط أيام الأسبوع التي فيها استخدام. ويعرض مخطط أيام الأسبوع المتوسط على كل أيام يوم الأسبوع، مع حساب الأيام الخالية من الاستخدام صفرًا.',
  'This page counts active users in three ways. By day a user needs usage of at least the threshold. By week a user needs one row above $0. By month a user needs a month total above $0. The same person can be active under one rule and not under another.':
    'تحسب هذه الصفحة المستخدمين النشطين بثلاث طرق. في اليوم يحتاج المستخدم إلى استخدام يبلغ الحد على الأقل. وفي الأسبوع يحتاج إلى صف واحد يزيد على $0. وفي الشهر يحتاج إلى مجموع شهري يزيد على $0. قد يكون الشخص نفسه نشطًا حسب قاعدة وغير نشط حسب أخرى.',
  'A user below the threshold on a day still has usage that day. The usage counts in every total, but the user is not active.':
    'المستخدم الذي يقل عن الحد في يوم يبقى له استخدام في ذلك اليوم. يدخل الاستخدام في كل المجاميع، لكن المستخدم لا يكون نشطًا.',
  'With the threshold set to $0, a user whose rows add up to exactly $0 on a day counts as active.': 'إذا كان الحد $0، يُحسب نشطًا المستخدم الذي مجموع صفوفه في اليوم $0 تمامًا.',
  'These are people who used GitHub Copilot, not seats. A seat that was not used on the day is not counted.':
    'هؤلاء أشخاص استخدموا GitHub Copilot، وليسوا تراخيص. لا يُحسب الترخيص الذي لم يُستخدم في ذلك اليوم.',
  'On a day when one user used $4.20, another $0.03 and a third $1.10, and the threshold is $0.05, there are 2 active users.':
    'في يوم استخدم فيه مستخدم $4.20، وآخر $0.03، وثالث $1.10، والحد $0.05، يوجد مستخدمان نشطان.',

  // Peak day
  'The day of the selected period with the most usage, with its amount and its weekday.': 'يوم الفترة المحددة الأعلى استخدامًا، مع مبلغه ويوم الأسبوع الذي وقع فيه.',
  'Peak day = the day with the largest total gross_amount in the selected period': 'يوم الذروة = اليوم الذي فيه أكبر مجموع gross_amount في الفترة المحددة',
  'Add up the gross_amount of all the rows of each day.': 'اجمع gross_amount لكل صفوف كل يوم.',
  'Take the day with the largest total. When two days tie, the earlier one is shown.': 'خذ اليوم الذي فيه أكبر مجموع. إذا تساوى يومان، يُعرض الأسبق منهما.',
  'The number turns to the warning color when that day is also in the Unusual days table.': 'يتحول الرقم إلى لون التحذير عندما يكون ذلك اليوم أيضًا في جدول الأيام غير المعتادة.',
  'The year is shown only when the period covers more than one calendar year. Hover the date to see it in full.':
    'لا تظهر السنة إلا عندما تغطي الفترة أكثر من سنة تقويمية. مرّر المؤشر فوق التاريخ لرؤيته كاملًا.',
  'A high peak is not a problem by itself. The Unusual days table checks it against the typical day.': 'الذروة العالية ليست مشكلة في حد ذاتها. يقارنها جدول الأيام غير المعتادة باليوم المعتاد.',
  'The day is the date written in the file, with no time-zone conversion. It shows a dash when no day has usage above $0.':
    'اليوم هو التاريخ المكتوب في الملف، بلا تحويل للمنطقة الزمنية. تظهر شرطة عندما لا يكون في أي يوم استخدام يزيد على $0.',
  'Daily usage of $310, $540 and $480 makes the day with $540 the peak day. When that day is far above the typical day, it is also listed under Unusual days.':
    'إذا كان الاستخدام اليومي $310 و$540 و$480، فاليوم الذي فيه $540 هو يوم الذروة. وإذا كان ذلك اليوم أعلى بكثير من اليوم المعتاد، فهو مذكور أيضًا في الأيام غير المعتادة.',

  // Weekend share
  'How much of the usage happened on Saturdays and Sundays. A low share means GitHub Copilot is used mostly on workdays.':
    'مقدار الاستخدام الذي حدث في أيام السبت والأحد. تعني الحصة المنخفضة أن GitHub Copilot يُستخدم غالبًا في أيام العمل.',
  'Weekend share = usage on Saturdays and Sundays ÷ usage on all days': 'حصة عطلة نهاية الأسبوع = الاستخدام في أيام السبت والأحد ÷ الاستخدام في كل الأيام',
  'Add up the gross_amount of the rows of each weekday, from the date written in the file.': 'اجمع gross_amount لصفوف كل يوم من أيام الأسبوع، حسب التاريخ المكتوب في الملف.',
  'Add the Saturday and the Sunday totals and divide them by the total of all seven weekdays. The line under the number gives the weekend usage and the number of weekend days in the range.':
    'اجمع مجموعي السبت والأحد واقسمهما على مجموع أيام الأسبوع السبعة. يذكر السطر تحت الرقم استخدام عطلة نهاية الأسبوع وعدد أيامها في الفترة.',
  'An even spread over the week would give 2 ÷ 7, about 29%. Compare the share with that, not with zero.':
    'التوزيع المتساوي على الأسبوع يعطي 2 ÷ 7، أي نحو 29%. قارن الحصة بهذه النسبة، لا بالصفر.',
  'It is a share of usage, not of days. A short range that holds a full weekend and only a few workdays gives a high share, so judge it over several whole weeks.':
    'هي حصة من الاستخدام، لا من الأيام. الفترة القصيرة التي تضم عطلة نهاية أسبوع كاملة وأيام عمل قليلة تعطي حصة عالية، لذا احكم عليها على مدى عدة أسابيع كاملة.',
  'It shows a dash when a weekday filter is on, when the range has no Saturday or Sunday, and when the range has no usage. The line under the dash says which.':
    'تظهر شرطة عند تفعيل تصفية أيام الأسبوع، أو عندما لا تضم الفترة يوم سبت أو أحد، أو عندما لا يكون في الفترة استخدام. يذكر السطر تحت الشرطة السبب.',
  'The weekday of a day comes from the date written in the file, with no time-zone conversion. If the file cuts its days in a zone other than yours, work near midnight can land on the neighboring day, for example Friday evening on Saturday, and the app cannot correct that.':
    'يُؤخذ يوم الأسبوع من التاريخ المكتوب في الملف، بلا تحويل للمنطقة الزمنية. إذا كان الملف يقسم الأيام حسب منطقة زمنية غير منطقتك، فقد يقع العمل القريب من منتصف الليل في اليوم المجاور، مثل مساء الجمعة في السبت، ولا يستطيع التطبيق تصحيح ذلك.',
  'Public holidays get no special treatment.': 'لا تُعامل العطلات الرسمية معاملة خاصة.',
  'Usage of $60 on weekends out of $1,000 in total is a weekend share of 6%.': 'استخدام $60 في عطلات نهاية الأسبوع من أصل $1,000 إجمالًا يعني حصة 6%.',

  // Busiest weekday
  'The weekday with the most usage on an average day of that name, such as an average Monday.': 'يوم الأسبوع الأعلى استخدامًا في يوم متوسط من نوعه، مثل يوم اثنين متوسط.',
  'Busiest weekday = the weekday with the largest usage ÷ number of that weekday in the range':
    'أكثر أيام الأسبوع استخدامًا = يوم الأسبوع الذي له أكبر ناتج من الاستخدام ÷ عدد مرات ذلك اليوم في الفترة',
  'Add up the gross_amount of the rows of each weekday over the range.': 'اجمع gross_amount لصفوف كل يوم من أيام الأسبوع على مدى الفترة.',
  'Divide each total by how many of that weekday the range holds, with days of no usage counted as zero. This is the Average per day of the weekday chart.':
    'اقسم كل مجموع على عدد مرات ذلك اليوم في الفترة، مع حساب الأيام الخالية من الاستخدام صفرًا. هذا هو المتوسط لكل يوم في مخطط أيام الأسبوع.',
  'Take the weekday with the highest average. When two tie, the earlier weekday of the week wins. A weekday that does not occur in the range, or has no usage, is skipped.':
    'خذ يوم الأسبوع الذي له أعلى متوسط. إذا تساوى يومان، يُختار الأسبق في الأسبوع. يُتجاوز يوم الأسبوع الذي لا يقع في الفترة أو ليس فيه استخدام.',
  'Dividing by how many of each weekday the range holds keeps a range with five Mondays and four Fridays fair.':
    'القسمة على عدد مرات كل يوم في الفترة تجعل المقارنة عادلة في فترة فيها خمسة أيام اثنين وأربعة أيام جمعة.',
  'With a weekday filter on, only the selected weekdays are compared, and the line under the name says so.':
    'عند تفعيل تصفية أيام الأسبوع، لا تُقارن إلا الأيام المحددة، ويذكر السطر تحت الاسم ذلك.',
  'It shows a dash when no weekday has usage.': 'تظهر شرطة عندما لا يكون في أي يوم من أيام الأسبوع استخدام.',
  'It tells you when the usage is, not why. One very large day can make a weekday the busiest when it is not busy in general. Check the Unusual days table.':
    'يبيّن متى يحدث الاستخدام، لا سببه. يوم واحد كبير جدًا قد يجعل يومًا من أيام الأسبوع الأكثر استخدامًا وهو ليس كذلك عمومًا. راجع جدول الأيام غير المعتادة.',
  'Three Mondays with $900 in total average $900 ÷ 3 = $300 a Monday. Three Fridays with $750 average $250 a Friday. Monday is the busiest weekday.':
    'ثلاثة أيام اثنين مجموعها $900 متوسطها $900 ÷ 3 = $300 لكل اثنين. وثلاثة أيام جمعة مجموعها $750 متوسطها $250 لكل جمعة. الاثنين هو أكثر أيام الأسبوع استخدامًا.',

  // Daily usage
  'The usage of every day, or of every week from Monday to Sunday, in the selected period. It shows the rhythm of usage and the days that stand out.':
    'الاستخدام في كل يوم، أو في كل أسبوع من الاثنين إلى الأحد، في الفترة المحددة. يبيّن إيقاع الاستخدام والأيام اللافتة.',
  'Bar height = sum of gross_amount of the rows of that day or week': 'ارتفاع العمود = مجموع gross_amount لصفوف ذلك اليوم أو الأسبوع',
  'A day is one calendar day as written in the file. A week runs from Monday to Sunday. A day with no rows has a bar of zero.':
    'اليوم هو يوم تقويمي واحد كما هو مكتوب في الملف. يمتد الأسبوع من الاثنين إلى الأحد. اليوم الذي ليس فيه صفوف عموده صفر.',
  'In the day view the Saturday and Sunday bars are lighter. In the week view a week that is only partly inside the period is lighter, because it has fewer days.':
    'في العرض اليومي تكون أعمدة السبت والأحد أفتح. وفي العرض الأسبوعي يكون الأسبوع الذي يقع جزء منه فقط داخل الفترة أفتح، لأن أيامه أقل.',
  'The chart opens on days for periods of up to 400 days, and on weeks for longer ones. The Days and Weeks buttons appear when the period has at least 14 days.':
    'يُفتح المخطط على الأيام للفترات التي تصل إلى 400 يوم، وعلى الأسابيع للفترات الأطول. يظهر زرا الأيام والأسابيع عندما تضم الفترة 14 يومًا على الأقل.',
  'Red markers show the days of the Unusual days table. The day view shows how many times the typical day each one was. In the week view a week with several unusual days has one marker.':
    'تبيّن العلامات الحمراء أيام جدول الأيام غير المعتادة. يبيّن العرض اليومي كم ضعفًا من اليوم المعتاد كان كل منها. وفي العرض الأسبوعي للأسبوع الذي فيه عدة أيام غير معتادة علامة واحدة.',
  'The Active users per day switch adds a second line with its own axis on the right.': 'يضيف مفتاح المستخدمين النشطين في اليوم خطًا ثانيًا له محوره الخاص على اليمين.',
  'A bar adds up every row, including refunds (negative amounts), so a day with many refunds can be below zero. Only days above $0 count as days with usage.':
    'يجمع العمود كل الصفوف، بما فيها المبالغ المستردة (المبالغ السالبة)، لذا قد يكون اليوم الذي فيه مبالغ مستردة كثيرة تحت الصفر. لا تُحسب أيامًا فيها استخدام إلا الأيام التي تزيد على $0.',
  'The newest day in the file can be incomplete, and the app cannot tell. Check the last bar before you read it as a drop.':
    'قد يكون أحدث يوم في الملف غير مكتمل، ولا يستطيع التطبيق معرفة ذلك. راجع العمود الأخير قبل أن تعدّه هبوطًا.',
  'Click a bar or a marker to show only that day or week. Bars with no usage do not respond.': 'انقر على عمود أو علامة لعرض ذلك اليوم أو الأسبوع فقط. الأعمدة الخالية من الاستخدام لا تستجيب.',
  'A day view of more than 400 days opens on the latest 120 days, and a slider appears when there are more than 28 bars.':
    'العرض اليومي لأكثر من 400 يوم يُفتح على آخر 120 يومًا، ويظهر شريط تمرير عندما يزيد عدد الأعمدة على 28.',
  'Days are read as written in the file, with no time-zone conversion.': 'تُقرأ الأيام كما هي مكتوبة في الملف، بلا تحويل للمنطقة الزمنية.',
  'A week with usage of $100, $120, $110, $130, $90, $10 and $0 from Monday to Sunday is one bar of $560 in the week view.':
    'أسبوع فيه استخدام $100 و$120 و$110 و$130 و$90 و$10 و$0 من الاثنين إلى الأحد يظهر عمودًا واحدًا بقيمة $560 في العرض الأسبوعي.',

  // Moving average
  '7-day and 4-week average': 'متوسط 7 أيام ومتوسط 4 أسابيع',
  'The line on the daily usage chart. It smooths the bars so that a quiet weekend does not look like a drop. The day view draws a 7-day average and the week view a 4-week average.':
    'الخط في مخطط الاستخدام اليومي. ينعّم الأعمدة حتى لا تبدو عطلة نهاية الأسبوع الهادئة كأنها هبوط. يرسم العرض اليومي متوسط 7 أيام، والعرض الأسبوعي متوسط 4 أسابيع.',
  'Day view: 7-day average = usage of the last 7 days ÷ 7. Week view: 4-week average = usage of the last 4 weeks ÷ days in those weeks × 7':
    'العرض اليومي: متوسط 7 أيام = استخدام آخر 7 أيام ÷ 7. العرض الأسبوعي: متوسط 4 أسابيع = استخدام آخر 4 أسابيع ÷ أيام تلك الأسابيع × 7',
  'Day view: each point is the usage of that day and the 6 days before it, divided by 7. The line starts on the 7th day of the period.':
    'العرض اليومي: كل نقطة هي استخدام ذلك اليوم والأيام الستة التي قبله، مقسومًا على 7. يبدأ الخط في اليوم السابع من الفترة.',
  'Week view: each point is the usage of that week and the 3 weeks before it, divided by the number of days those weeks cover, times 7. It is the usage of an average week. The line starts on the 4th week.':
    'العرض الأسبوعي: كل نقطة هي استخدام ذلك الأسبوع والأسابيع الثلاثة التي قبله، مقسومًا على عدد الأيام التي تغطيها تلك الأسابيع، ثم مضروبًا في 7. هو استخدام أسبوع متوسط. يبدأ الخط في الأسبوع الرابع.',
  'A partial first or last week counts only the days that are inside the period, so it does not pull the average down.':
    'الأسبوع الأول أو الأخير الجزئي لا تُحسب منه إلا الأيام التي داخل الفترة، فلا يخفض المتوسط.',
  'Days with no usage count as zero, so a long quiet stretch lowers the line.': 'تُحسب الأيام الخالية من الاستخدام صفرًا، لذا تخفض فترة الهدوء الطويلة الخط.',
  'With a weekday filter on, the weekdays that are filtered out count as zero, so the line is lower.': 'عند تفعيل تصفية أيام الأسبوع، تُحسب الأيام المستبعدة صفرًا، لذا يكون الخط أدنى.',
  'The line is left out when the period is too short for it. It needs 7 days in the day view and 4 weeks in the week view.':
    'لا يظهر الخط عندما تكون الفترة أقصر مما يحتاج إليه. يحتاج إلى 7 أيام في العرض اليومي و4 أسابيع في العرض الأسبوعي.',
  'A week with usage of $100, $120, $110, $130, $90, $10 and $0 has $560, so the 7-day average on its Sunday is $560 ÷ 7 = $80. Four weeks of $500, $540, $520 and $560 give a 4-week average of $530.':
    'أسبوع فيه استخدام $100 و$120 و$110 و$130 و$90 و$10 و$0 مجموعه $560، لذا يكون متوسط 7 أيام في يوم الأحد منه $560 ÷ 7 = $80. وأربعة أسابيع قيمها $500 و$540 و$520 و$560 تعطي متوسط 4 أسابيع قدره $530.',

  // Weekday pattern
  'How usage differs between the days of the week. There is one bar per weekday, and you can switch between three measures.':
    'كيف يختلف الاستخدام بين أيام الأسبوع. هناك عمود لكل يوم، ويمكنك التبديل بين ثلاثة مقاييس.',
  'Average per day = usage on a weekday ÷ number of that weekday in the range': 'المتوسط لكل يوم = الاستخدام في يوم من أيام الأسبوع ÷ عدد مرات ذلك اليوم في الفترة',
  'Every row goes to the weekday of its date, as written in the file. Weeks run from Monday to Sunday.': 'يذهب كل صف إلى يوم الأسبوع الذي يوافق تاريخه كما هو مكتوب في الملف. يمتد الأسبوع من الاثنين إلى الأحد.',
  'Average per day: the usage of a weekday divided by how many of that weekday the range holds, with days of no usage counted as zero. A range with five Mondays and four Fridays does not skew the bars.':
    'المتوسط لكل يوم: استخدام يوم الأسبوع مقسومًا على عدد مرات ذلك اليوم في الفترة، مع حساب الأيام الخالية من الاستخدام صفرًا. لا تتأثر الأعمدة بفترة فيها خمسة أيام اثنين وأربعة أيام جمعة.',
  'Total usage: all the usage of a weekday added up over the range.': 'إجمالي الاستخدام: كل استخدام يوم الأسبوع مجموعًا على مدى الفترة.',
  'Active users: the active users of every day of a weekday added up and divided by how many of that weekday the range holds. Days with no usage count as zero.':
    'المستخدمون النشطون: مجموع المستخدمين النشطين في كل أيام يوم الأسبوع مقسومًا على عدد مرات ذلك اليوم في الفترة. تُحسب الأيام الخالية من الاستخدام صفرًا.',
  'Saturday and Sunday are drawn lighter. A weekday that does not occur in the range has no bar, except in the Total usage view, where it shows $0.':
    'يُرسم السبت والأحد بلون أفتح. يوم الأسبوع الذي لا يقع في الفترة ليس له عمود، إلا في عرض إجمالي الاستخدام حيث يظهر $0.',
  'The sentence under the chart compares Monday to Friday. It divides the usage of those weekdays by their number of days, and names the lowest and the highest weekday when they are 5% or more away from that average. When none is, it says the usage is spread evenly. It needs at least 14 days in the range.':
    'تقارن الجملة تحت المخطط الأيام من الاثنين إلى الجمعة. تقسم استخدام تلك الأيام على عدد أيامها، وتذكر أدنى يوم وأعلى يوم إذا ابتعدا عن هذا المتوسط بنسبة 5% أو أكثر. وإذا لم يبتعد أي يوم، تقول إن الاستخدام موزع بالتساوي. تحتاج إلى 14 يومًا على الأقل في الفترة.',
  'The weekday comes from the date written in the file, with no time-zone conversion. If the file cuts its days in a zone other than yours, work near midnight can land on the neighboring weekday, and the app cannot correct that.':
    'يُؤخذ يوم الأسبوع من التاريخ المكتوب في الملف، بلا تحويل للمنطقة الزمنية. إذا كان الملف يقسم الأيام حسب منطقة زمنية غير منطقتك، فقد يقع العمل القريب من منتصف الليل في اليوم المجاور، ولا يستطيع التطبيق تصحيح ذلك.',
  'Public holidays get no special treatment, so a holiday Monday lowers the average of the Mondays.': 'لا تُعامل العطلات الرسمية معاملة خاصة، لذا يخفض يوم اثنين يوافق عطلة متوسط أيام الاثنين.',
  'Click a bar or a Show only button to filter the whole report to a weekday, and click again to take it out. With a weekday filter on, the other weekdays have no usage, and the sentence says so.':
    'انقر على عمود أو على زر عرض فقط لتصفية التقرير كله على يوم من أيام الأسبوع، وانقر مرة أخرى لإزالته. عند تفعيل تصفية أيام الأسبوع، لا يكون في الأيام الأخرى استخدام، وتذكر الجملة ذلك.',
  'The tooltip also shows the share of usage of the weekday, how many of that weekday the range holds and how many of them had usage.':
    'يعرض التلميح أيضًا حصة يوم الأسبوع من الاستخدام، وعدد مرات ذلك اليوم في الفترة، وكم منها كان فيه استخدام.',
  'Usage adds up every row, including refunds (negative amounts). The bars show when the usage happened, not why. On a short range one large day can lift a weekday. A range of one day has one bar.':
    'يجمع الاستخدام كل الصفوف، بما فيها المبالغ المستردة (المبالغ السالبة). تبيّن الأعمدة متى حدث الاستخدام، لا سببه. في الفترة القصيرة قد يرفع يوم واحد كبير يومًا من أيام الأسبوع. الفترة التي تضم يومًا واحدًا لها عمود واحد.',
  'Four Mondays with $800 in total average $800 ÷ 4 = $200 a Monday. If the average over Monday to Friday is $190, Mondays run about 5% above it.':
    'أربعة أيام اثنين مجموعها $800 متوسطها $800 ÷ 4 = $200 لكل اثنين. إذا كان المتوسط من الاثنين إلى الجمعة $190، فأيام الاثنين أعلى منه بنحو 5%.',

  // Usage calendar
  'The usage of every day of the period as a calendar. Darker days have more usage.': 'الاستخدام في كل يوم من الفترة على شكل تقويم. الأيام الأغمق فيها استخدام أكثر.',
  'Day color = band of the usage of the day, with the bands cut at quantiles of the days that have usage':
    'لون اليوم = فئة استخدام اليوم، والفئات مقسومة عند الكمّيات (quantiles) للأيام التي فيها استخدام',
  'Each cell is one day, as written in the file. Weeks run from Monday to Sunday.': 'كل خانة يوم واحد كما هو مكتوب في الملف. يمتد الأسبوع من الاثنين إلى الأحد.',
  'A period that touches up to 6 calendar months gets one tile per month, and a month that is only partly inside the period has a Partial badge. A longer period gets one calendar of up to the latest 12 months, which scrolls sideways on a narrow screen, with a note that says which months are shown.':
    'الفترة التي تمس 6 أشهر تقويمية أو أقل تأخذ بطاقة لكل شهر، والشهر الذي يقع جزء منه فقط داخل الفترة عليه شارة جزئي. والفترة الأطول تأخذ تقويمًا واحدًا لآخر 12 شهرًا بحد أقصى، يمكن تمريره أفقيًا على الشاشة الضيقة، مع ملاحظة تذكر الأشهر المعروضة.',
  'The days with usage above $0 are sorted and split into up to 5 bands that hold about the same number of days. The limits are rounded to 2 significant digits. Days with no usage have their own No usage band.':
    'تُرتَّب الأيام التي فيها استخدام يزيد على $0 وتُقسم إلى 5 فئات بحد أقصى، في كل منها عدد متقارب من الأيام. تُقرَّب الحدود إلى رقمين معنويين. للأيام الخالية من الاستخدام فئة خاصة هي لا يوجد استخدام.',
  'Only the days that are shown decide the bands. In the 12-month calendar that means the latest 12 months.': 'الأيام المعروضة وحدها تحدد الفئات. في تقويم 12 شهرًا يعني ذلك آخر 12 شهرًا.',
  'A red outline marks a day of the Unusual days table. The heading of a tile gives the usage of that month inside the period and its number of days with usage. The tooltip of a day gives its usage and its active users.':
    'يميّز الإطار الأحمر يومًا من جدول الأيام غير المعتادة. يذكر عنوان البطاقة استخدام ذلك الشهر داخل الفترة وعدد أيامه التي فيها استخدام. ويذكر تلميح اليوم استخدامه والمستخدمين النشطين فيه.',
  'The bands are relative. A dark day is dark compared with the other days of this period, so compare colors only within one calendar. The key under the calendar gives the dollar limits.':
    'الفئات نسبية. اليوم الغامق غامق مقارنة بأيام هذه الفترة الأخرى، لذا قارن الألوان داخل تقويم واحد فقط. يذكر الدليل تحت التقويم الحدود بالدولار.',
  'With only a few days with usage there are fewer bands. A single band is labeled Has usage.': 'إذا كانت الأيام التي فيها استخدام قليلة، تقل الفئات. والفئة الوحيدة تُسمى فيه استخدام.',
  'Click a day with usage to show only that day. With a weekday filter on, the other weekdays have no usage.':
    'انقر على يوم فيه استخدام لعرض ذلك اليوم فقط. عند تفعيل تصفية أيام الأسبوع، لا يكون في الأيام الأخرى استخدام.',
  'Days are read as written in the file, with no time-zone conversion. The app cannot tell whether the newest day is complete, so the last cell can look light.':
    'تُقرأ الأيام كما هي مكتوبة في الملف، بلا تحويل للمنطقة الزمنية. لا يستطيع التطبيق معرفة هل اكتمل أحدث يوم، لذا قد تبدو الخانة الأخيرة فاتحة.',
  'With 10 days of usage and 5 bands, each band holds about 2 days. If the limits are $40, $55, $70 and $90, a day with $60 falls in the $55 to $70 band.':
    'مع 10 أيام فيها استخدام و5 فئات، تضم كل فئة نحو يومين. إذا كانت الحدود $40 و$55 و$70 و$90، فاليوم الذي فيه $60 يقع في فئة $55 إلى $70.',

  // Adoption over time
  'Whether more or fewer people use GitHub Copilot as the weeks go by. Adoption here means how many different people use it, not how much they use. The sentence above the chart says whether adoption is growing, flat or declining.':
    'هل يزداد عدد من يستخدمون GitHub Copilot أم يقل مع مرور الأسابيع. التبنّي هنا يعني عدد الأشخاص المختلفين الذين يستخدمونه، لا مقدار استخدامهم. تذكر الجملة فوق المخطط هل التبنّي في ازدياد أم ثابت أم في تراجع.',
  'Adoption trend = average active users a week over the last 4 weeks ÷ average over the 4 weeks before − 1':
    'اتجاه التبنّي = متوسط المستخدمين النشطين في الأسبوع خلال آخر 4 أسابيع ÷ المتوسط في الأسابيع الأربعة التي قبلها − 1',
  'A week runs from Monday to Sunday, as written in the file. A week that is only partly inside the period is drawn with a lighter bar and hollow markers.':
    'يمتد الأسبوع من الاثنين إلى الأحد حسب التواريخ المكتوبة في الملف. الأسبوع الذي يقع جزء منه فقط داخل الفترة يُرسم بعمود أفتح وعلامات مفرغة.',
  'New users (bars) are the users whose first usage in the report falls in that week. Active users per week (line) are the users with usage in that week.':
    'المستخدمون الجدد (الأعمدة) هم من يقع أول استخدام لهم في التقرير في ذلك الأسبوع. والمستخدمون النشطون في الأسبوع (الخط) هم من لديهم استخدام في ذلك الأسبوع.',
  'Users so far (line) starts from the users of the period who were first seen before the first day that can count as new, and adds the new users of every week. Its last point is the number of users with a row in the period.':
    'يبدأ خط المستخدمين حتى الآن من مستخدمي الفترة الذين ظهروا أول مرة قبل أول يوم يمكن أن يُحسب فيه المستخدم جديدًا، ويضيف المستخدمين الجدد في كل أسبوع. آخر نقطة فيه هي عدد المستخدمين الذين لهم صف في الفترة.',
  'The sentence compares the last 4 weeks with the 4 weeks before them. Only weeks with at least 5 days in the period are used, and it needs 8 of them. A change of +10% or more is growing, −10% or less is declining and anything in between is flat.':
    'تقارن الجملة آخر 4 أسابيع بالأسابيع الأربعة التي قبلها. لا تُستخدم إلا الأسابيع التي لها 5 أيام على الأقل في الفترة، ويلزم 8 منها. التغيّر بنسبة +10% أو أكثر ازدياد، و−10% أو أقل تراجع، وما بينهما ثبات.',
  'When no user was active in the 4 weeks before, adoption is growing if someone was active in the last 4 weeks, and flat if not.':
    'إذا لم يكن أي مستخدم نشطًا في الأسابيع الأربعة السابقة، فالتبنّي في ازدياد إن كان أحد نشطًا في آخر 4 أسابيع، وثابت إن لم يكن.',
  'It counts users who appear in the report. A person with a seat who never used it has no row, so it does not measure how many seats are in use.':
    'يحسب المستخدمين الذين يظهرون في التقرير. الشخص الذي لديه ترخيص ولم يستخدمه قط ليس له صف، لذا لا يقيس هذا عدد التراخيص المستخدمة.',
  'Users first seen in the first days of the report cannot be told apart from users who started earlier, so they are never counted as new. See New users.':
    'لا يمكن تمييز المستخدمين الذين ظهروا أول مرة في الأيام الأولى من التقرير عن الذين بدؤوا قبل ذلك، لذا لا يُحسبون جددًا أبدًا. راجع المستخدمون الجدد.',
  'The sentence does not know about holidays or leave. A quiet season lowers the trend.': 'لا تعرف الجملة شيئًا عن العطلات أو الإجازات. الموسم الهادئ يخفض الاتجاه.',
  'It follows the filters, so a segment filter changes who is counted. Click a week to show only that week.':
    'يتبع عوامل التصفية، لذا تغيّر تصفية الشريحة من يُحسب. انقر على أسبوع لعرض ذلك الأسبوع فقط.',
  'The 4 weeks before had 40, 42, 41 and 45 active users, an average of 42. The last 4 weeks had 46, 48, 47 and 51, an average of 48. 48 ÷ 42 − 1 is about +14%, so adoption is growing.':
    'كان في الأسابيع الأربعة السابقة 40 و42 و41 و45 مستخدمًا نشطًا، بمتوسط 42. وكان في آخر 4 أسابيع 46 و48 و47 و51، بمتوسط 48. ‏48 ÷ 42 − 1 يساوي نحو +14%، لذا التبنّي في ازدياد.',

  // Weekly active users
  'How many different people used GitHub Copilot in a week.': 'عدد الأشخاص المختلفين الذين استخدموا GitHub Copilot في أسبوع.',
  'Active users per week = number of distinct usernames with a row above $0 in that week':
    'المستخدمون النشطون في الأسبوع = عدد قيم username المختلفة التي لها صف يزيد على $0 في ذلك الأسبوع',
  'A week runs from Monday to Sunday, by the date written in the file.': 'يمتد الأسبوع من الاثنين إلى الأحد، حسب التاريخ المكتوب في الملف.',
  'Only rows with a gross_amount above $0 count, and rows without a username do not.': 'لا تُحسب إلا الصفوف التي يزيد فيها gross_amount على $0، ولا تُحسب الصفوف التي ليس لها username.',
  'A user counts once in a week, however many rows or days the user has.': 'يُحسب المستخدم مرة واحدة في الأسبوع، مهما كان عدد صفوفه أو أيامه.',
  'This is not the same as Active users per day. A weekly active user needs one row above $0 in the week. A daily active user needs usage of at least the Active-day threshold on one day. The threshold does not apply here.':
    'هذا يختلف عن المستخدمين النشطين في اليوم. يحتاج المستخدم النشط أسبوعيًا إلى صف واحد يزيد على $0 في الأسبوع. ويحتاج المستخدم النشط يوميًا إلى استخدام يبلغ حد اليوم النشط على الأقل في يوم واحد. لا ينطبق الحد هنا.',
  'A week that is only partly inside the period has fewer days, so fewer users can show up in it. It is drawn with a hollow marker.':
    'الأسبوع الذي يقع جزء منه فقط داخل الفترة أيامه أقل، لذا قد يظهر فيه مستخدمون أقل. يُرسم بعلامة مفرغة.',
  'The Month by month table counts users per month in a similar way, from the total of the month instead of single rows.':
    'يحسب جدول شهرًا بشهر المستخدمين في كل شهر بطريقة مشابهة، من مجموع الشهر بدلًا من الصفوف المفردة.',
  'A user with $2 on Monday and $3 on Thursday of the same week counts once in that week. A user whose only row in the week is $0 does not count.':
    'المستخدم الذي له $2 يوم الاثنين و$3 يوم الخميس من الأسبوع نفسه يُحسب مرة واحدة في ذلك الأسبوع. والمستخدم الذي صفه الوحيد في الأسبوع $0 لا يُحسب.',

  // New users
  'How many people used GitHub Copilot for the first time in a week or a month. The first time is the first row of the user anywhere in the report.':
    'عدد الأشخاص الذين استخدموا GitHub Copilot أول مرة في أسبوع أو شهر. أول مرة هي أول صف للمستخدم في أي مكان من التقرير.',
  'New users = number of users whose first day in the report falls in the week or month, counted from the first day that can count as new':
    'المستخدمون الجدد = عدد المستخدمين الذين يقع أول يوم لهم في التقرير في الأسبوع أو الشهر، بدءًا من أول يوم يمكن أن يُحسب فيه المستخدم جديدًا',
  'Take the first date of each user in the whole report. Filters and the date range do not move it.': 'خذ أول تاريخ لكل مستخدم في التقرير كله. لا تغيّره عوامل التصفية ولا نطاق التاريخ.',
  'The first day that can count as new is the later of the start of the period and the first date of the report plus the New user window.':
    'أول يوم يمكن أن يُحسب فيه المستخدم جديدًا هو الأحدث بين بداية الفترة وأول تاريخ في التقرير مضافًا إليه مدة المستخدم الجديد.',
  'Users first seen before that day were already using GitHub Copilot, so they are the starting point of Users so far and not new users.':
    'المستخدمون الذين ظهروا أول مرة قبل ذلك اليوم كانوا يستخدمون GitHub Copilot من قبل، لذا هم نقطة بداية المستخدمين حتى الآن، وليسوا مستخدمين جددًا.',
  'Every other user who has a row in the period, after the filters, is counted in the week or month of the first date.':
    'كل مستخدم آخر له صف في الفترة، بعد عوامل التصفية، يُحسب في الأسبوع أو الشهر الذي يقع فيه أول تاريخ له.',
  'The report does not go back further than its first date. Users who first appear in the first days of it may have started earlier, so they are never counted as new.':
    'لا يعود التقرير إلى ما قبل أول تاريخ فيه. المستخدمون الذين يظهرون أول مرة في أيامه الأولى ربما بدؤوا قبل ذلك، لذا لا يُحسبون جددًا أبدًا.',
  'The New users group in Who the users are is a different count. It holds the users first seen in the last days of the period, as set by the New user window.':
    'مجموعة المستخدمين الجدد في من هم المستخدمون عدد مختلف. تضم المستخدمين الذين ظهروا أول مرة في الأيام الأخيرة من الفترة، حسب مدة المستخدم الجديد.',
  'A user with a row of any amount has a first date, and rows without a username belong to nobody.': 'لكل مستخدم له صف بأي مبلغ تاريخ أول، والصفوف التي ليس لها username لا تخص أحدًا.',
  'The report starts on June 1 and the New user window is 14 days, so only users first seen on June 15 or later can be new. A user first seen on June 10 was already using GitHub Copilot. A user first seen on June 20 is a new user of June.':
    'يبدأ التقرير في 1 يونيو ومدة المستخدم الجديد 14 يومًا، لذا لا يمكن أن يكون جديدًا إلا من ظهر أول مرة في 15 يونيو أو بعده. المستخدم الذي ظهر أول مرة في 10 يونيو كان يستخدم GitHub Copilot من قبل. والمستخدم الذي ظهر أول مرة في 20 يونيو مستخدم جديد في يونيو.',

  // Unusual days
  'Days with far more usage than a typical day, with the users and models that drove them. They are also marked in red on the daily chart and the calendar.':
    'أيام فيها استخدام أكبر بكثير من يوم معتاد، مع المستخدمين والنماذج الذين تسببوا فيها. وهي مميزة أيضًا باللون الأحمر في المخطط اليومي وفي التقويم.',
  'Unusual day = usage at least 1.5 × the typical day, and z-score = (usage of the day − typical day) ÷ spread of at least 3.5':
    'اليوم غير المعتاد = استخدام يبلغ 1.5 × اليوم المعتاد على الأقل، ودرجة معيارية z = (استخدام اليوم − اليوم المعتاد) ÷ التشتت تبلغ 3.5 على الأقل',
  'Take the days with usage above $0. With fewer than 10 of them the app does not judge, so one busy day cannot define what is normal.':
    'خذ الأيام التي فيها استخدام يزيد على $0. إذا كان عددها أقل من 10 لا يحكم التطبيق، حتى لا يحدد يوم مزدحم واحد ما هو المعتاد.',
  'The typical day is the median of those days. The spread is the median absolute deviation divided by 0.6745. When that deviation is zero, the spread is the mean absolute deviation from the median × 1.2533.':
    'اليوم المعتاد هو وسيط تلك الأيام. والتشتت هو وسيط الانحراف المطلق مقسومًا على 0.6745. وإذا كان ذلك الانحراف صفرًا، فالتشتت هو متوسط الانحراف المطلق عن الوسيط × 1.2533.',
  'A day is unusual when its z-score is at least 3.5 and its usage is at least 1.5 times the typical day. When the spread or the typical day is zero, no day is unusual.':
    'يكون اليوم غير معتاد عندما تبلغ درجته المعيارية z ‏3.5 على الأقل ويبلغ استخدامه 1.5 ضعف اليوم المعتاد على الأقل. إذا كان التشتت أو اليوم المعتاد صفرًا، فلا يوجد يوم غير معتاد.',
  'The table lists the 6 largest unusual days, with the 3 users and the 3 models that had the most usage on each day.':
    'يعرض الجدول أكبر 6 أيام غير معتادة، مع أعلى 3 مستخدمين وأعلى 3 نماذج استخدامًا في كل يوم.',
  'The median and the median absolute deviation are used so that a few big days do not hide each other. An average would be pulled up by the very days it is looking for.':
    'يُستخدم الوسيط ووسيط الانحراف المطلق حتى لا تخفي بضعة أيام كبيرة بعضها بعضًا. أما المتوسط فسيرتفع بسبب الأيام نفسها التي يبحث عنها.',
  'Both tests must pass. The 1.5 times rule stops a steady period with a tiny spread from marking days that are only a little higher than usual.':
    'يجب أن ينجح الاختباران معًا. قاعدة 1.5 ضعف تمنع الفترة المستقرة ذات التشتت الصغير جدًا من تمييز أيام أعلى قليلًا فقط من المعتاد.',
  'It follows the filters and the date range. A day that is normal in a long period can be unusual in a short one.':
    'يتبع عوامل التصفية ونطاق التاريخ. اليوم العادي في فترة طويلة قد يكون غير معتاد في فترة قصيرة.',
  'An unusual day is not a problem by itself. It can be a rollout, a training session or a script. The users and models of the day help you tell.':
    'اليوم غير المعتاد ليس مشكلة في حد ذاته. قد يكون بسبب نشر جديد أو جلسة تدريب أو برنامج نصي. يساعدك مستخدمو اليوم ونماذجه على معرفة السبب.',
  'Only this day at the end of a row filters the whole report to that day.': 'يصفّي زر هذا اليوم فقط في نهاية الصف التقرير كله على ذلك اليوم.',
  'A typical day is $100 and the spread is about $30. A day with $400 has a z-score of (400 − 100) ÷ 30 = 10 and is 4 times the typical day, so it is unusual. A day with $140 has a z-score of about 1.3 and is not.':
    'اليوم المعتاد $100 والتشتت نحو $30. اليوم الذي فيه $400 درجته المعيارية z = ‏(400 − 100) ÷ 30 = 10، وهو 4 أضعاف اليوم المعتاد، لذا هو غير معتاد. واليوم الذي فيه $140 درجته نحو 1.3، فهو معتاد.',

  // Typical day
  'The usage of a normal day in the period. The Unusual days table measures every day against it.': 'استخدام يوم عادي في الفترة. يقيس جدول الأيام غير المعتادة كل يوم بالنسبة إليه.',
  'Typical day = median of the usage of the days with usage': 'اليوم المعتاد = وسيط استخدام الأيام التي فيها استخدام',
  'Take the total gross_amount of each day above $0 in the period. Days with no usage are left out.': 'خذ مجموع gross_amount لكل يوم يزيد على $0 في الفترة. تُستبعد الأيام الخالية من الاستخدام.',
  'Sort the days and take the middle one. With an even number of days it is the average of the two middle ones.': 'رتّب الأيام وخذ اليوم الأوسط. إذا كان عدد الأيام زوجيًا فهو متوسط اليومين الأوسطين.',
  'It is the same on every row, because it belongs to the period and not to a day.': 'قيمته واحدة في كل الصفوف، لأنه يخص الفترة لا يومًا بعينه.',
  'It is a median, not an average. A few very large days raise an average but hardly move a median.': 'هو وسيط وليس متوسطًا. بضعة أيام كبيرة جدًا ترفع المتوسط لكنها بالكاد تحرك الوسيط.',
  'It needs at least 10 days with usage. With fewer, the card says there are not enough days to judge.': 'يحتاج إلى 10 أيام فيها استخدام على الأقل. وإذا كانت أقل، تذكر البطاقة أن الأيام غير كافية للحكم.',
  'Daily usage of $80, $90, $100, $110 and $400 has a median of $100. The average would be $156.': 'استخدام يومي قيمه $80 و$90 و$100 و$110 و$400 وسيطه $100، أما متوسطه فيبلغ $156.',

  // Times the typical day
  'How many times larger the usage of an unusual day is than the typical day.': 'كم ضعفًا يبلغ استخدام اليوم غير المعتاد مقارنة باليوم المعتاد.',
  'Times the typical day = usage of the day ÷ typical day': 'أضعاف اليوم المعتاد = استخدام اليوم ÷ اليوم المعتاد',
  'An unusual day is always at least 1.5 times the typical day. The multiple is shown with a × sign, with one decimal below 10 and as a whole number from 10.':
    'اليوم غير المعتاد يبلغ دائمًا 1.5 ضعف اليوم المعتاد على الأقل. يُعرض عدد الأضعاف مع علامة ×، برقم عشري واحد إذا كان أقل من 10، وبعدد صحيح من 10 فما فوق.',
  'The tooltips of the daily chart and the calendar write it as times the typical day, with the typical day in dollars.':
    'تكتبه تلميحات المخطط اليومي والتقويم بصيغة عدد أضعاف اليوم المعتاد، مع قيمة اليوم المعتاد بالدولار.',
  'A day with $450 on a typical day of $100 has a multiple of 450 ÷ 100 = 4.5.': 'يوم فيه $450 واليوم المعتاد $100 يبلغ 450 ÷ 100 = 4.5 ضعف.',

  // Top users that day
  'The users with the most usage on an unusual day, each with the usage of that day.': 'المستخدمون الأعلى استخدامًا في يوم غير معتاد، مع استخدام كل منهم في ذلك اليوم.',
  'Top users that day = the 3 users with the largest total gross_amount on that day': 'أعلى المستخدمين في ذلك اليوم = أعلى 3 مستخدمين في مجموع gross_amount في ذلك اليوم',
  'Rank the users and show the first 3. Click a name to open the user.': 'رتّب المستخدمين واعرض أول 3. انقر على اسم لفتح صفحة المستخدم.',
  'The amounts are the usage of that day only, not of the whole period.': 'المبالغ هي استخدام ذلك اليوم فقط، لا الفترة كلها.',
  'Usage without a username is listed as (unattributed / repo-level) and cannot be opened.': 'يظهر الاستخدام الذي ليس له username باسم (unattributed / repo-level)، ولا يمكن فتحه.',
  'When many people used GitHub Copilot that day, three users can be a small part of the day. Compare their amounts with the usage of the day.':
    'إذا استخدم كثيرون GitHub Copilot في ذلك اليوم، فقد يكون ثلاثة مستخدمين جزءًا صغيرًا من اليوم. قارن مبالغهم باستخدام اليوم.',
  'On a day of $500, three users with $200, $90 and $60 are listed. They are $350 of the day, so $150 came from others.':
    'في يوم قيمته $500، يظهر ثلاثة مستخدمين لهم $200 و$90 و$60. مجموعهم $350 من اليوم، لذا جاءت $150 من آخرين.',

  // Top models that day
  'The models with the most usage on an unusual day, each with its share of the usage of that day.': 'النماذج الأعلى استخدامًا في يوم غير معتاد، مع حصة كل منها من استخدام ذلك اليوم.',
  'Top models that day = the 3 models with the largest gross_amount on that day, each as a share of the usage of the day':
    'أعلى النماذج في ذلك اليوم = أعلى 3 نماذج في gross_amount في ذلك اليوم، مع حصة كل منها من استخدام اليوم',
  'Add up the gross_amount of each model for the day, over the rows that pass the filters.': 'اجمع gross_amount لكل نموذج في ذلك اليوم، من الصفوف التي تجتاز عوامل التصفية.',
  'Show the 3 largest. The share of a model is its usage that day ÷ the usage of the day, without decimals.': 'اعرض أكبر 3. حصة النموذج هي استخدامه في ذلك اليوم ÷ استخدام اليوم، بلا أرقام عشرية.',
  'The shares do not add up to 100% when other models also had usage that day.': 'لا يبلغ مجموع الحصص 100% إذا كان لنماذج أخرى استخدام في ذلك اليوم.',
  'Rows without a model name appear as (unknown model).': 'تظهر الصفوف التي ليس لها اسم نموذج باسم (unknown model).',
  'Rows written as "Auto: Model A" count as Model A. A row that says only Auto, with no model name, appears as Auto.':
    'تُحسب الصفوف المكتوبة بصيغة "Auto: Model A" على Model A. والصف الذي فيه Auto فقط بلا اسم نموذج يظهر باسم Auto.',
  'On a day of $500, models with $250, $150 and $50 show 50%, 30% and 10%. The other 10% went to other models.':
    'في يوم قيمته $500، تظهر نماذج لها $250 و$150 و$50 بنسب 50% و30% و10%. وذهبت الـ10% الباقية إلى نماذج أخرى.',

  // Lapsed users
  'Users who used GitHub Copilot earlier in the period and then went quiet for several days before its end. The list shows the 8 with the most usage.':
    'مستخدمون استخدموا GitHub Copilot في وقت سابق من الفترة ثم توقفوا عدة أيام قبل نهايتها. تعرض القائمة أعلى 8 منهم استخدامًا.',
  'Days since = end of the period − date of the last row of the user; lapsed when Days since ≥ Lapsed after and the user is not new':
    'أيام منذ آخر نشاط = نهاية الفترة − تاريخ آخر صف للمستخدم؛ ويكون منقطعًا عندما تكون أيام منذ آخر نشاط ≥ مدة الانقطاع ولا يكون المستخدم جديدًا',
  'Find the last date with a row for each user, over the rows that pass the filters, up to the end of the period. A row of any amount counts as activity.':
    'جد آخر تاريخ له صف لكل مستخدم، من الصفوف التي تجتاز عوامل التصفية، حتى نهاية الفترة. يُحسب الصف بأي مبلغ نشاطًا.',
  'Days since = the end of the period − that date. It is shown with the Last active date.': 'أيام منذ آخر نشاط = نهاية الفترة − ذلك التاريخ. يظهر مع تاريخ آخر نشاط.',
  'A user is lapsed when Days since is at least the Lapsed after setting and the user is not new. A new user was first seen in the last New user window days of the period, and not in the first days of the report. New users have had little time to use GitHub Copilot.':
    'يكون المستخدم منقطعًا عندما تبلغ أيام منذ آخر نشاط إعداد مدة الانقطاع على الأقل ولا يكون جديدًا. المستخدم الجديد ظهر أول مرة في أيام مدة المستخدم الجديد الأخيرة من الفترة، لا في الأيام الأولى من التقرير. والمستخدمون الجدد لم يتح لهم وقت كافٍ لاستخدام GitHub Copilot.',
  'Usage before is the usage of the user over the whole period, which all came before the quiet days.': 'الاستخدام قبلها هو استخدام المستخدم على مدى الفترة كلها، وقد جاء كله قبل أيام التوقف.',
  'The end of the period is the end date you chose, not today. A period that ended weeks ago is judged at its own end.':
    'نهاية الفترة هي تاريخ النهاية الذي اخترته، لا اليوم الحالي. الفترة التي انتهت قبل أسابيع يُحكم عليها عند نهايتها هي.',
  'A user is judged on the rows that pass the filters only. A model or product filter can make a user look lapsed who still uses something else.':
    'يُحكم على المستخدم بالصفوف التي تجتاز عوامل التصفية فقط. قد تجعل تصفية النموذج أو المنتج مستخدمًا يبدو منقطعًا وهو ما زال يستخدم شيئًا آخر.',
  'A user without any row in the period is not on this page at all.': 'المستخدم الذي ليس له أي صف في الفترة لا يظهر في هذه الصفحة أبدًا.',
  'It does not say why the user stopped. Leave, a change of tools or a missing seat all look the same.': 'لا يذكر سبب توقف المستخدم. الإجازة وتغيير الأدوات وعدم وجود ترخيص تبدو كلها متشابهة.',
  'The period ends on June 30 and Lapsed after is 7 days. A user whose last row is June 20 has 10 days since and is lapsed. A user whose last row is June 26 has 4 days since and is not.':
    'تنتهي الفترة في 30 يونيو ومدة الانقطاع 7 أيام. المستخدم الذي آخر صف له في 20 يونيو مرّت عليه 10 أيام فهو منقطع. والمستخدم الذي آخر صف له في 26 يونيو مرّت عليه 4 أيام فهو ليس منقطعًا.',

  // Fading users
  'Users whose usage in the last 7 days of the period fell to half or less of the 7 days before. It includes users who stopped completely.':
    'مستخدمون انخفض استخدامهم في آخر 7 أيام من الفترة إلى نصف استخدامهم في الأيام السبعة التي قبلها أو أقل. ويشمل ذلك من توقفوا تمامًا.',
  'Fading = usage of the last 7 days ≤ 0.5 × usage of the 7 days before, for users whose earlier 7 days are at least the Minimum usage for traits':
    'متراجع = استخدام آخر 7 أيام ≤ 0.5 × استخدام الأيام السبعة التي قبلها، للمستخدمين الذين بلغ استخدامهم في الأيام السبعة الأسبق الحد الأدنى للاستخدام في السمات على الأقل',
  'Add up the gross_amount of each user over the last 7 days of the period and over the 7 days before them. Both windows end at the end of the period.':
    'اجمع gross_amount لكل مستخدم في آخر 7 أيام من الفترة وفي الأيام السبعة التي قبلها. تنتهي النافذتان عند نهاية الفترة.',
  'Leave out users whose earlier 7 days are below the Minimum usage for traits, so that tiny amounts do not look like big drops.':
    'استبعد المستخدمين الذين يقل استخدامهم في الأيام السبعة الأسبق عن الحد الأدنى للاستخدام في السمات، حتى لا تبدو المبالغ الصغيرة جدًا كأنها هبوط كبير.',
  '7-day change = usage of the last 7 days ÷ usage of the 7 days before − 1. A fading user has a change of −50% or lower.':
    'التغيّر في 7 أيام = استخدام آخر 7 أيام ÷ استخدام الأيام السبعة التي قبلها − 1. المستخدم المتراجع تغيّره −50% أو أقل.',
  'The list shows the 8 users with the most usage in the period, and its Usage column is that usage. Hover a change to see both amounts.':
    'تعرض القائمة أعلى 8 مستخدمين استخدامًا في الفترة، وعمود الاستخدام فيها هو ذلك الاستخدام. مرّر المؤشر فوق التغيّر لرؤية المبلغين.',
  'It needs at least 14 days in the period. With fewer, the card says so.': 'يحتاج إلى 14 يومًا على الأقل في الفترة. وإذا كانت أقل، تذكر البطاقة ذلك.',
  'A user who stopped completely has a change of −100%, and is lapsed after Lapsed after days. The two lists can overlap.':
    'المستخدم الذي توقف تمامًا تغيّره −100%، ويصبح منقطعًا بعد مرور أيام مدة الانقطاع. قد تتداخل القائمتان.',
  'Any 7 days hold every weekday once, so a user who works only on weekdays is not penalized by a weekend.':
    'أي 7 أيام متتالية تضم كل يوم من أيام الأسبوع مرة واحدة، لذا لا تُحسب عطلة نهاية الأسبوع على المستخدم الذي يعمل في أيام العمل فقط.',
  'A user who joined in the last 7 days has no earlier week, so is not listed.': 'المستخدم الذي انضم في آخر 7 أيام ليس له أسبوع أسبق، لذا لا يظهر في القائمة.',
  'With the Minimum usage for traits set to $0, a user with no usage in both 7-day windows is listed as well, and the change shows a dash.':
    'إذا كان الحد الأدنى للاستخدام في السمات $0، يظهر في القائمة أيضًا المستخدم الذي ليس له استخدام في نافذتي الأيام السبعة، ويظهر التغيّر شرطة.',
  'It does not say why usage fell. A project that ended or a holiday look the same.': 'لا يذكر سبب انخفاض الاستخدام. انتهاء مشروع أو عطلة يبدوان متشابهين.',
  'A user with $40 in the earlier 7 days and $10 in the last 7 days has a 7-day change of 10 ÷ 40 − 1 = −75%, so the user is fading. A user with $3 in the earlier 7 days is not checked when the minimum is $5.':
    'المستخدم الذي له $40 في الأيام السبعة الأسبق و$10 في آخر 7 أيام تغيّره في 7 أيام 10 ÷ 40 − 1 = −75%، لذا هو متراجع. والمستخدم الذي له $3 في الأيام السبعة الأسبق لا يُفحص إذا كان الحد الأدنى $5.',

  // Month by month
  'How usage, activity and new users change from one calendar month to the next, with a total row for the whole period.':
    'كيف يتغير الاستخدام والنشاط والمستخدمون الجدد من شهر تقويمي إلى الذي يليه، مع صف إجمالي للفترة كلها.',
  'Usage of a month = sum of gross_amount of the days of that month that have usage, inside the selected period':
    'استخدام الشهر = مجموع gross_amount لأيام ذلك الشهر التي فيها استخدام، داخل الفترة المحددة',
  'A month is a calendar month, by the date written in the file. The first and the last month can be partial when the period starts or ends inside a month. A Partial badge says how many days of the month the period covers.':
    'الشهر هو شهر تقويمي حسب التاريخ المكتوب في الملف. قد يكون الشهر الأول والأخير جزئيين إذا بدأت الفترة أو انتهت داخل شهر. تذكر شارة جزئي عدد أيام الشهر التي تغطيها الفترة.',
  'Usage adds up the days with usage above $0. The other columns have their own explanations.': 'يجمع الاستخدام الأيام التي فيها استخدام يزيد على $0. للأعمدة الأخرى شروحها الخاصة.',
  'The Whole range row adds up the usage and the new users of the months. Usage per active day and Average active users per day are worked out again over all the days with usage of the period. Active users counts each user with a row in the period once.':
    'يجمع صف الفترة كاملة استخدام الأشهر ومستخدميها الجدد. ويُحسب الاستخدام لكل يوم نشط ومتوسط المستخدمين النشطين في اليوم من جديد على كل أيام الفترة التي فيها استخدام. ويحسب المستخدمون النشطون كل مستخدم له صف في الفترة مرة واحدة.',
  'A partial month has fewer days, so its usage is lower. Compare months with the per-day columns.': 'الشهر الجزئي أيامه أقل، لذا يكون استخدامه أقل. قارن الأشهر بالأعمدة المحسوبة لكل يوم.',
  'A month with no usage shows $0 and dashes in the per-day columns.': 'الشهر الخالي من الاستخدام يظهر فيه $0 وشرطات في الأعمدة المحسوبة لكل يوم.',
  'It follows the filters.': 'يتبع عوامل التصفية.',
  'Months are calendar months of the dates in the file, with no time-zone conversion.': 'الأشهر هي الأشهر التقويمية لتواريخ الملف، بلا تحويل للمنطقة الزمنية.',
  'A month of 31 days with usage on 22 of them and $4,400 in total has a usage of $4,400 and a usage per active day of $4,400 ÷ 22 = $200.':
    'شهر من 31 يومًا فيه استخدام في 22 يومًا ومجموعه $4,400 يكون استخدامه $4,400، والاستخدام لكل يوم نشط $4,400 ÷ 22 = $200.',

  // Usage per active day
  'The usage of an average day with usage in the month. Dividing by the days with usage, and not by the days of the month, makes months of different length easier to compare.':
    'استخدام يوم متوسط فيه استخدام في الشهر. القسمة على الأيام التي فيها استخدام، لا على أيام الشهر، تسهّل مقارنة الأشهر مختلفة الطول.',
  'Usage per active day = usage of the month ÷ number of days of the month with usage': 'الاستخدام لكل يوم نشط = استخدام الشهر ÷ عدد أيام الشهر التي فيها استخدام',
  'Usage of the month: the gross_amount of its days with usage, inside the selected period.': 'استخدام الشهر: gross_amount لأيامه التي فيها استخدام، داخل الفترة المحددة.',
  'Days with usage: the days of that month whose total is above $0.': 'أيام فيها استخدام: أيام ذلك الشهر التي يزيد مجموعها على $0.',
  'The Whole range row divides the total usage by all the days with usage of the period.': 'يقسم صف الفترة كاملة إجمالي الاستخدام على كل أيام الفترة التي فيها استخدام.',
  'An active day here is a day with usage above $0. The Active-day threshold is not used. It applies to users, not to days.':
    'اليوم النشط هنا يوم فيه استخدام يزيد على $0. لا يُستخدم حد اليوم النشط، فهو ينطبق على المستخدمين لا على الأيام.',
  'Weekends with no usage do not pull it down, so a month with usage on every day and a month with usage on workdays only can show the same figure.':
    'لا تخفضه عطلات نهاية الأسبوع الخالية من الاستخدام، لذا قد يظهر الرقم نفسه لشهر فيه استخدام كل يوم ولشهر فيه استخدام في أيام العمل فقط.',
  'It shows a dash for a month with no usage.': 'تظهر شرطة للشهر الخالي من الاستخدام.',
  '$4,400 over 22 days with usage is $200 per active day. The same $4,400 over 31 days with usage would be about $142.':
    '$4,400 على 22 يومًا فيها استخدام تساوي $200 لكل يوم نشط. والمبلغ نفسه $4,400 على 31 يومًا فيها استخدام يساوي نحو $142.',

  // Active users per month
  'How many different people used GitHub Copilot in a month. The Whole range row counts each person with any row in the period once, the same count as the page header.':
    'عدد الأشخاص المختلفين الذين استخدموا GitHub Copilot في شهر. يحسب صف الفترة كاملة كل شخص له أي صف في الفترة مرة واحدة، وهو العدد نفسه في رأس الصفحة.',
  'Active users per month = number of distinct users whose usage in the month adds up to more than $0':
    'المستخدمون النشطون في الشهر = عدد المستخدمين المختلفين الذين يزيد مجموع استخدامهم في الشهر على $0',
  'Add up the gross_amount of each username in the month, inside the selected period.': 'اجمع gross_amount لكل username في الشهر، داخل الفترة المحددة.',
  'Count the users with a total above $0.': 'احسب المستخدمين الذين يزيد مجموعهم على $0.',
  'The Whole range row counts every user with at least one row in the period once, even when the rows add up to $0. It is the same number as the page header. It can be lower than the sum of the months, because a user who is active in several months counts once.':
    'يحسب صف الفترة كاملة كل مستخدم له صف واحد على الأقل في الفترة مرة واحدة، حتى لو كان مجموع صفوفه $0. وهو العدد نفسه في رأس الصفحة. وقد يكون أقل من مجموع الأشهر، لأن المستخدم النشط في عدة أشهر يُحسب مرة واحدة.',
  'It counts people, not seats. A seat that was not used in the month is not counted, and rows without a username are not counted.':
    'يحسب الأشخاص، لا التراخيص. لا يُحسب الترخيص الذي لم يُستخدم في الشهر، ولا تُحسب الصفوف التي ليس لها username.',
  'The Active-day threshold is not used here. A user with $0.01 in the month counts. A user whose rows add up to $0 or less in a month does not count in that month.':
    'لا يُستخدم حد اليوم النشط هنا. المستخدم الذي له $0.01 في الشهر يُحسب. والمستخدم الذي مجموع صفوفه في شهر $0 أو أقل لا يُحسب في ذلك الشهر.',
  'Because the Whole range row also counts users whose rows add up to $0, it can include users who are not counted in any month.':
    'لأن صف الفترة كاملة يحسب أيضًا المستخدمين الذين مجموع صفوفهم $0، فقد يضم مستخدمين لا يُحسبون في أي شهر.',
  'A partial month covers fewer days, so it can show fewer users.': 'الشهر الجزئي يغطي أيامًا أقل، لذا قد يظهر فيه مستخدمون أقل.',
  'Month 1 had 50 users with usage and month 2 had 55, of whom 45 were also there in month 1. The Whole range row shows 50 + 55 − 45 = 60 users.':
    'كان في الشهر الأول 50 مستخدمًا لهم استخدام، وفي الشهر الثاني 55، منهم 45 كانوا أيضًا في الشهر الأول. يعرض صف الفترة كاملة 50 + 55 − 45 = 60 مستخدمًا.',
};

export default arabic;
