import type { Dict, PluralEntry } from '../core';

/** Arabic counted noun: one, two, 3 to 10, 11 to 99, and 0 or 100 and up. */
const plural = (one: string, two: string, few: string, many: string, other: string): PluralEntry => ({ zero: other, one, two, few, many, other });

/** Messages and plain-word labels of the license library (src/lib/licenses): the notes after an import and the codes of a seat. */
const arabic: Dict = {
  // Notes after reading a license file (parse.ts)
  'The file has no seats.': 'لا يحتوي الملف على أي تراخيص.',
  'The file has {n} of {total} seats. Some pages may be missing. Save every page, for example with gh api --paginate.':
    'عدد التراخيص في الملف {n} من أصل {total}. قد تكون بعض الصفحات ناقصة. احفظ كل الصفحات، مثلًا باستخدام gh api --paginate.',
  '{n} entries without a username were left out.': plural(
    'تم استبعاد إدخال واحد بلا اسم مستخدم.',
    'تم استبعاد إدخالين بلا اسم مستخدم.',
    'تم استبعاد {n} إدخالات بلا اسم مستخدم.',
    'تم استبعاد {n} إدخالًا بلا اسم مستخدم.',
    'تم استبعاد {n} إدخال بلا اسم مستخدم.',
  ),
  '{n} dates could not be read. They were treated as missing.': plural(
    'تعذّرت قراءة تاريخ واحد. تمت معاملته كقيمة مفقودة.',
    'تعذّرت قراءة تاريخين. تمت معاملتهما كقيمتين مفقودتين.',
    'تعذّرت قراءة {n} تواريخ. تمت معاملتها كقيم مفقودة.',
    'تعذّرت قراءة {n} تاريخًا. تمت معاملتها كقيم مفقودة.',
    'تعذّرت قراءة {n} تاريخ. تمت معاملتها كقيم مفقودة.',
  ),
  '{n} plans could not be read. They were left empty.': plural(
    'تعذّرت قراءة خطة واحدة. تُركت فارغة.',
    'تعذّرت قراءة خطتين. تُركتا فارغتين.',
    'تعذّرت قراءة {n} خطط. تُركت فارغة.',
    'تعذّرت قراءة {n} خطة. تُركت فارغة.',
    'تعذّرت قراءة {n} خطة. تُركت فارغة.',
  ),
  'The file has more than {max} seats. Only the first {max} were read.': 'يحتوي الملف على أكثر من {max} ترخيص. تمت قراءة أول {max} ترخيص فقط.',
  'GitHub returned an error ("{error}") instead of a seat list. Check the organization or enterprise name. Check that the token has the manage_billing:copilot, read:org or read:enterprise scope.':
    'أعاد GitHub خطأ ("{error}") بدلًا من قائمة التراخيص. تحقق من اسم المؤسسة أو اسم حساب Enterprise. وتحقق من أن رمز الوصول يملك النطاق manage_billing:copilot أو read:org أو read:enterprise.',
  'No GitHub Copilot seats were found in this JSON file. Use the output of the GitHub seats API. It has a "seats" list, and each seat has an assignee with a login.':
    'لم يتم العثور على تراخيص GitHub Copilot في ملف JSON هذا. استخدم ناتج واجهة GitHub البرمجية الخاصة بالتراخيص. فيه قائمة باسم "seats"، ولكل ترخيص حقل assignee يحتوي على login.',
  'The file ends in the middle of an entry. It may have been cut short.': 'ينتهي الملف في منتصف إدخال. ربما قُطع قبل اكتماله.',
  '{n} pieces of the file could not be read as JSON. They were left out.': plural(
    'تعذّرت قراءة جزء واحد من الملف بصيغة JSON. تم استبعاده.',
    'تعذّرت قراءة جزأين من الملف بصيغة JSON. تم استبعادهما.',
    'تعذّرت قراءة {n} أجزاء من الملف بصيغة JSON. تم استبعادها.',
    'تعذّرت قراءة {n} جزءًا من الملف بصيغة JSON. تم استبعادها.',
    'تعذّرت قراءة {n} جزء من الملف بصيغة JSON. تم استبعادها.',
  ),
  'This file is a usage report, not a license list. Load it with the other usage reports.':
    'هذا الملف تقرير استخدام وليس قائمة تراخيص. حمّله مع تقارير الاستخدام الأخرى.',
  'The table has no username column. Name the column with the GitHub usernames "login" or "username".':
    'لا يحتوي الجدول على عمود لأسماء المستخدمين. سمِّ العمود الذي يضم أسماء مستخدمي GitHub "login" أو "username".',
  'No GitHub usernames were found. A list of usernames has one username per line, or usernames separated by commas.':
    'لم يتم العثور على أسماء مستخدمي GitHub. في قائمة الأسماء اسم واحد في كل سطر، أو أسماء تفصل بينها فواصل.',
  'Most entries in the file are not GitHub usernames, so it was not read as a list of usernames.':
    'معظم الإدخالات في الملف ليست أسماء مستخدمي GitHub، لذلك لم يُقرأ كقائمة أسماء مستخدمين.',
  '{n} entries that are not GitHub usernames were left out.': plural(
    'تم استبعاد إدخال واحد ليس اسم مستخدم على GitHub.',
    'تم استبعاد إدخالين ليسا اسمي مستخدم على GitHub.',
    'تم استبعاد {n} إدخالات ليست أسماء مستخدمين على GitHub.',
    'تم استبعاد {n} إدخالًا ليست أسماء مستخدمين على GitHub.',
    'تم استبعاد {n} إدخال ليست أسماء مستخدمين على GitHub.',
  ),
  'The list has more than {max} usernames. Only the first {max} were read.': 'تحتوي القائمة على أكثر من {max} اسم مستخدم. تمت قراءة أول {max} اسم فقط.',
  'The file is empty.': 'الملف فارغ.',
  'The file could not be read as a license list.': 'تعذّرت قراءة الملف كقائمة تراخيص.',

  // What a license file turned out to be (labels.ts)
  'Seat list from GitHub (JSON)': 'قائمة التراخيص من GitHub (JSON)',
  'GitHub Copilot activity report (CSV)': 'تقرير نشاط GitHub Copilot (CSV)',
  'Seat list (CSV)': 'قائمة التراخيص (CSV)',
  'List of usernames': 'قائمة أسماء المستخدمين',
  'Not a license list': 'ليس قائمة تراخيص',

  // How recently a seat was used, and why it is on the list of seats to free (labels.ts)
  'Recently active': 'نشط مؤخرًا',
  Inactive: 'غير نشط',
  'No recent activity date': 'لا يوجد تاريخ نشاط حديث',
  'A blank activity date can mean a new seat or activity older than 90 days. It does not prove that the seat was never used.':
    'قد يعني تاريخ النشاط الفارغ أن الترخيص جديد أو أن النشاط أقدم من 90 يومًا. ولا يثبت أن الترخيص لم يُستخدم قط.',
  'No activity data': 'لا توجد بيانات نشاط',
  'No activity for {n} days or more': plural(
    'لا نشاط منذ يوم واحد أو أكثر',
    'لا نشاط منذ يومين أو أكثر',
    'لا نشاط منذ {n} أيام أو أكثر',
    'لا نشاط منذ {n} يومًا أو أكثر',
    'لا نشاط منذ {n} يوم أو أكثر',
  ),
};

export default arabic;
