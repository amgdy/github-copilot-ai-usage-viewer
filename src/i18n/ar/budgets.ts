import type { Dict, PluralEntry } from '../core';

/** Arabic counted sentence: one, two, 3 to 10, 11 to 99, and 0 or 100 and up. */
const plural = (one: string, two: string, few: string, many: string, other: string): PluralEntry => ({ zero: other, one, two, few, many, other });

/** Arabic for the Budgets page and the pointer to it on the Usage and pool page. */
const arabic: Dict = {
  // Navigation and page
  'AI budgets at GitHub: how much is used, which run out and who is stopped': 'ميزانيات الذكاء الاصطناعي في GitHub: كم استُخدم منها، وأيها ينفد، ومن توقف',
  'The budgets for GitHub Copilot that are set at GitHub: how full each one is, which run out this month, and which users are stopped.':
    'ميزانيات GitHub Copilot المضبوطة في GitHub: كم امتلأت كل ميزانية، وأيها ينفد هذا الشهر، وأي المستخدمين توقفوا.',
  'Month: {month}.': 'الشهر: {month}.',
  'Load a GitHub data file to see your budgets': 'حمّل ملف بيانات GitHub لترى ميزانياتك',
  'The usage report does not hold budgets. The collector script reads them from GitHub.': 'لا يحتوي تقرير الاستخدام على الميزانيات. يقرؤها سكربت جمع البيانات من GitHub.',
  'Go to the Data page': 'اذهب إلى صفحة البيانات',
  'No budget for GitHub Copilot': 'لا توجد ميزانية لـ GitHub Copilot',
  'Nothing limits the amount billed on top of seats. Set a budget at GitHub to get alerts or to stop usage at a set amount.':
    'لا شيء يحدّ المبلغ المدفوع إضافيًا فوق رسوم التراخيص. اضبط ميزانية في GitHub لتصلك تنبيهات أو لإيقاف الاستخدام عند مبلغ محدد.',
  'Budget levels': 'مستويات الميزانيات',
  'How much of each budget is used, and how fast it fills up this month.': 'كم استُخدم من كل ميزانية، وما سرعة امتلائها هذا الشهر.',
  'Gaps and changes': 'الثغرات والتغييرات',
  'All budgets': 'كل الميزانيات',
  '{budget}, all of GitHub Copilot': '{budget}، GitHub Copilot كله',

  // Levels
  'Under {high}': 'أقل من {high}',
  'Used up': 'نفدت',

  // Headline numbers
  'Budgets for GitHub Copilot': 'ميزانيات GitHub Copilot',
  '{stopping} stop usage, {alerting} only alert': '{stopping} توقف الاستخدام، و{alerting} تنبّه فقط',
  'Budgets used up': 'ميزانيات نفدت',
  'of {n} budgets with an amount used': plural(
    'من ميزانية واحدة لها مبلغ مستخدَم',
    'من ميزانيتين لهما مبلغ مستخدَم',
    'من {n} ميزانيات لها مبلغ مستخدَم',
    'من {n} ميزانية لها مبلغ مستخدَم',
    'من {n} ميزانية لها مبلغ مستخدَم',
  ),
  'Budgets near the limit': 'ميزانيات قريبة من الحد',
  '{share} or more used': 'استُخدم {share} أو أكثر',
  'Expected to run out': 'يُتوقع أن تنفد',
  'Budgets that reach their amount before the month ends at the current pace': 'ميزانيات تبلغ مبلغها قبل نهاية الشهر بالوتيرة الحالية',
  'Users stopped by a budget': 'مستخدمون أوقفتهم ميزانية',
  'Cannot use AI credits until the next month': 'لا يمكنهم استخدام أرصدة الذكاء الاصطناعي حتى الشهر القادم',
  'Users near their limit': 'مستخدمون قريبون من حدهم',
  '{share} or more of their budget used': 'استخدموا {share} أو أكثر من ميزانيتهم',

  // How full each budget is
  '{used} of {amount}': '{used} من {amount}',
  'How full each budget is': 'كم امتلأت كل ميزانية',
  'Share of each budget used on the day the data was collected. Budgets for single users are in the users section below.':
    'الحصة المستخدمة من كل ميزانية يوم جمع البيانات. ميزانيات المستخدمين الأفراد في قسم المستخدمين أدناه.',
  'No budget with an amount used': 'لا توجد ميزانية لها مبلغ مستخدَم',
  '{n} more budgets are in the table below.': plural(
    'توجد ميزانية أخرى في الجدول أدناه.',
    'توجد ميزانيتان أخريان في الجدول أدناه.',
    'توجد {n} ميزانيات أخرى في الجدول أدناه.',
    'توجد {n} ميزانية أخرى في الجدول أدناه.',
    'توجد {n} ميزانية أخرى في الجدول أدناه.',
  ),

  // Month pace
  'Used so far': 'المستخدَم حتى الآن',
  Projected: 'المتوقع',
  'Runs out {date}': 'تنفد في {date}',
  'Budget {amount}': 'الميزانية {amount}',
  'Billed amounts from the usage report for what this budget covers. The projection uses the average billed per day over the last {n} days.':
    'المبالغ المدفوعة إضافيًا من تقرير الاستخدام لما تغطيه هذه الميزانية. يعتمد التوقع على متوسط المدفوع إضافيًا في اليوم خلال آخر {n} أيام.',
  'The usage report cannot show this budget day by day, so the amount GitHub showed is spread evenly over the days so far.':
    'لا يستطيع تقرير الاستخدام عرض هذه الميزانية يومًا بيوم، لذلك يُوزَّع المبلغ الذي أظهره GitHub بالتساوي على الأيام حتى الآن.',
  'Month pace': 'وتيرة الشهر',
  'How {budget} fills up this month, and when it runs out at the current pace.': 'كيف تمتلئ {budget} هذا الشهر، ومتى تنفد بالوتيرة الحالية.',
  'Projected for the month': 'المتوقع للشهر',
  'Runs out': 'تنفد',
  'Already used up': 'نفدت بالفعل',
  'Not this month': 'ليس هذا الشهر',

  // Users and their budgets
  Limit: 'الحد',
  Level: 'المستوى',
  'Users and their budgets': 'المستخدمون وميزانياتهم',
  'Users with a budget of their own or a limit for each user. When a user reaches the limit, GitHub stops their AI credits until the next month.':
    'المستخدمون الذين لهم ميزانية خاصة أو حد لكل مستخدم. عندما يبلغ المستخدم الحد، يوقف GitHub أرصدة الذكاء الاصطناعي له حتى الشهر القادم.',
  'Show users at {share} or more': 'اعرض المستخدمين عند {share} أو أكثر',

  // Billed usage with no budget
  Type: 'النوع',
  'Billed usage with no budget': 'استخدام مدفوع إضافيًا بلا ميزانية',
  'Organizations and cost centers billed in {month} that have no budget of their own.': 'مؤسسات ومراكز تكلفة دفعت مبالغ إضافية في {month} وليست لها ميزانية خاصة.',
  'The budgets were not read in full, so this list cannot be made.': 'لم تُقرأ الميزانيات كاملة، لذلك لا يمكن إعداد هذه القائمة.',
  'Every organization and cost center with billed usage has a budget.': 'لكل مؤسسة ومركز تكلفة له استخدام مدفوع إضافيًا ميزانية.',
  'The budget for the whole enterprise still covers this usage.': 'ما زالت ميزانية المؤسسة كلها تغطي هذا الاستخدام.',

  // Budget changes
  'Budget added': 'أُضيفت ميزانية',
  'Budget changed': 'تغيّرت ميزانية',
  'Budget removed': 'أُزيلت ميزانية',
  'Changed by': 'غيّرها',
  'Budgets that were added, changed or removed, from the audit log.': 'الميزانيات التي أُضيفت أو تغيّرت أو أُزيلت، من سجل التدقيق.',
  'The audit log has no budget changes.': 'لا يحتوي سجل التدقيق على تغييرات في الميزانيات.',

  // Pointer on the Usage and pool page
  '{n} budgets for GitHub Copilot.': plural(
    'ميزانية واحدة لـ GitHub Copilot.',
    'ميزانيتان لـ GitHub Copilot.',
    '{n} ميزانيات لـ GitHub Copilot.',
    '{n} ميزانية لـ GitHub Copilot.',
    '{n} ميزانية لـ GitHub Copilot.',
  ),
  '{n} users have used up their budget.': plural(
    'استنفد مستخدم واحد ميزانيته.',
    'استنفد مستخدمان ميزانيتهما.',
    'استنفد {n} مستخدمين ميزانياتهم.',
    'استنفد {n} مستخدمًا ميزانياتهم.',
    'استنفد {n} مستخدم ميزانياتهم.',
  ),
  'Open the Budgets page': 'افتح صفحة الميزانيات',
};

export default arabic;
