import type { Dict, PluralEntry } from '../core';

/** Arabic counted noun: one, two, 3 to 10, 11 to 99, and 0 or 100 and up. */
const plural = (one: string, two: string, few: string, many: string, other: string): PluralEntry => ({ zero: other, one, two, few, many, other });

/** Arabic text for the Settings page and the setting references shown in the formula panels. */
const arabic: Dict = {
  // Setting references
  'Active-day threshold': 'حد يوم النشاط',
  '{amount} of usage in a day': '{amount} من الاستخدام في اليوم',
  'Spend tiers': 'شرائح الإنفاق',
  'Minimal up to {minimal}, Light up to {light}, Core up to {core}, Power up to {power} of own included credits':
    'ضئيل حتى {minimal}، وخفيف حتى {light}، وأساسي حتى {core}، ومكثف حتى {power} من الأرصدة المشمولة للمستخدم نفسه',
  'Daily from {daily}, Regular from {regular}, Occasional from {occasional} of workdays':
    'يومي من {daily}، ومنتظم من {regular}، ومتقطع من {occasional} من أيام العمل',
  'Pareto classes': 'فئات باريتو',
  'Class A to {a}, Class B to {b} of usage': 'الفئة A حتى {a}، والفئة B حتى {b} من الاستخدام',
  'Frontier-heavy from': 'يعتمد على النماذج القوية ابتداءً من',
  '{share} of usage on Powerful models': '{share} من الاستخدام على النماذج القوية',
  'Efficient from': 'موفّر ابتداءً من',
  '{share} of usage on Versatile and Lightweight models': '{share} من الاستخدام على النماذج المتعددة الاستخدامات والخفيفة',
  'Lapsed after': 'متوقف بعد',
  'New user window': 'فترة المستخدم الجديد',
  'Spiky usage from': 'قفزات في الاستخدام ابتداءً من',
  '{share} of usage on the biggest day': '{share} من الاستخدام في أكبر يوم',
  'Rarely uses Auto below': 'نادرًا ما يستخدم Auto تحت',
  '{share} of usage through Auto': '{share} من الاستخدام عبر Auto',
  'Auto first from': 'يعتمد على Auto ابتداءً من',
  'Low cache reuse below': 'استفادة قليلة من الذاكرة المؤقتة تحت',
  '{share} cache hit rate': 'معدل إصابة الذاكرة المؤقتة {share}',
  'Long-context surcharges from': 'رسوم إضافية للسياق الطويل ابتداءً من',
  'Minimum usage for traits': 'أدنى استخدام للسمات',
  'Auto model discount': 'خصم نموذج Auto',
  '{share}, used for plans with no Auto usage to measure from. Plans with enough Auto usage use their measured discount.':
    '{share}، ويُستخدم للخطط التي ليس لها استخدام Auto يمكن القياس منه. الخطط التي لديها استخدام Auto كافٍ تستخدم الخصم المقيس لها.',
  'Monthly budget': 'الميزانية الشهرية',
  'Not set': 'غير محدد',
  'License list date': 'تاريخ قائمة التراخيص',
  '{date}. Days since last activity are counted from this day.': '{date}. تُحسب الأيام منذ آخر نشاط ابتداءً من هذا اليوم.',
  'Not set. The latest date in the license list is used.': 'غير محدد. يُستخدم أحدث تاريخ في قائمة التراخيص.',
  'Extra seats': 'تراخيص إضافية',
  '{business} Business, {enterprise} Enterprise': '{business} Business، و{enterprise} Enterprise',
  'Model pricing and tiers': 'أسعار النماذج وفئاتها',
  'Price card as shipped': 'قائمة الأسعار كما وردت مع التطبيق',
  '{n} models edited': plural('نموذج واحد معدّل', 'نموذجان معدّلان', '{n} نماذج معدّلة', '{n} نموذجًا معدّلًا', '{n} نموذج معدّل'),
  'Top N users': 'عدد أعلى المستخدمين',

  // Page and sections
  'Set your budget, your license list and how users are grouped. Changes apply right away and stay in this browser.':
    'حدّد ميزانيتك وقائمة التراخيص وطريقة تجميع المستخدمين. تُطبَّق التغييرات فورًا وتبقى في هذا المتصفح.',
  Budget: 'الميزانية',
  'License list and extra seats': 'قائمة التراخيص والتراخيص الإضافية',
  'Classification thresholds': 'حدود التصنيف',
  'Model prices': 'أسعار النماذج',
  'Data on this device': 'البيانات على هذا الجهاز',
  Appearance: 'العرض',
  Glossary: 'المسرد',
  'How the numbers are defined': 'كيف تُعرَّف الأرقام',
  'Settings sections': 'أقسام الإعدادات',
  Confirm: 'تأكيد',
  'Yes, reset': 'نعم، أعد الضبط',
  'Reset section to defaults': 'إعادة القسم إلى القيم الافتراضية',

  // Appearance
  Light: 'خفيف',
  'Light theme': 'الوضع الفاتح',
  'Dark theme': 'الوضع الداكن',
  'Always use the light theme': 'استخدم المظهر الفاتح دائمًا',
  'Always use the dark theme': 'استخدم المظهر الداكن دائمًا',
  System: 'إعداد الجهاز',
  'Follow the device setting': 'اتبع إعداد الجهاز',
  'Your device is using the dark theme now.': 'يستخدم جهازك المظهر الداكن الآن.',
  'Your device is using the light theme now.': 'يستخدم جهازك المظهر الفاتح الآن.',
  'The dark theme is on.': 'المظهر الداكن مفعّل.',
  'The light theme is on.': 'المظهر الفاتح مفعّل.',
  'Choose the theme, the colors and the digits for this device.': 'اختر المظهر والألوان وشكل الأرقام لهذا الجهاز.',
  Theme: 'المظهر',
  'System follows the light or dark setting of your device.': 'خيار إعداد الجهاز يتبع الوضع الفاتح أو الداكن في جهازك.',
  'This choice is saved in this browser and is not part of the exported settings.':
    'يُحفظ هذا الاختيار في هذا المتصفح، ولا يدخل ضمن الإعدادات المصدّرة.',
  Colors: 'الألوان',
  'GitHub colors': 'ألوان GitHub',
  'The default GitHub colors': 'ألوان GitHub الافتراضية',
  'High contrast': 'تباين عالٍ',
  'Darker text and stronger lines, easier to read': 'نص أغمق وخطوط أوضح لقراءة أسهل',
  'Colorblind friendly': 'مناسب لعمى الألوان',
  'Blue for good and orange for bad, with chart colors that stay apart for most color vision types':
    'الأزرق للجيد والبرتقالي للسيئ، مع ألوان رسوم يسهل تمييزها لمعظم أنواع رؤية الألوان',
  'High contrast makes text darker and lines stronger. Colorblind friendly uses blue for good and orange for bad, and chart colors that are easy to tell apart.':
    'التباين العالي يجعل النص أغمق والخطوط أوضح. والخيار المناسب لعمى الألوان يستخدم الأزرق للجيد والبرتقالي للسيئ، وألوان رسوم يسهل تمييزها.',
  'Each choice works with the light and the dark theme.': 'كل خيار يعمل مع المظهر الفاتح والداكن.',
  'Numbers in Arabic': 'الأرقام في العربية',
  'Arabic-Indic digits ({sample})': 'أرقام عربية مشرقية ({sample})',
  'Latin digits ({sample})': 'أرقام لاتينية ({sample})',
  'Show numbers as ١٢٣ in Arabic': 'اعرض الأرقام بالشكل ١٢٣ في العربية',
  'Show numbers as 123 in Arabic': 'اعرض الأرقام بالشكل 123 في العربية',
  'Choose the digits used when the app is in Arabic. English always uses 123. Downloaded CSV files always use 123 so other tools can read them.':
    'اختر شكل الأرقام عندما يكون التطبيق بالعربية. تستخدم الإنجليزية دائمًا 123. وتستخدم ملفات CSV المنزّلة دائمًا 123 لتقرأها الأدوات الأخرى.',

  // Budget
  'The budget card compares the amount billed so far this month, and the projected month end, with this amount.':
    'تقارن بطاقة الميزانية المبلغ المدفوع إضافيًا حتى الآن هذا الشهر، والمتوقع في نهاية الشهر، بهذا المبلغ.',
  'The included credits card shows how much of the budget is used.': 'تعرض بطاقة الأرصدة المشمولة مقدار المستخدم من الميزانية.',
  'The app warns when the projected billed amount passes the budget. When no budget is set and the report shows billed usage, runaway users or a pool that runs out, it suggests setting one.':
    'ينبّه التطبيق عندما يتجاوز المبلغ المدفوع إضافيًا المتوقع الميزانية. وإذا لم تُحدَّد ميزانية وأظهر التقرير استخدامًا مدفوعًا إضافيًا أو مستخدمين مفرطين أو رصيدًا مشتركًا ينفد، يقترح تحديد ميزانية.',
  'The comparison with the latest month appears here once a budget is saved.': 'تظهر هنا المقارنة مع أحدث شهر بعد حفظ ميزانية.',
  '{month}: {billed} billed so far of {budget} ({share}), projected to reach {projected} ({projectedShare}) by month end.':
    '{month}: {billed} مدفوع إضافيًا حتى الآن من {budget} ({share})، ومن المتوقع أن يصل إلى {projected} ({projectedShare}) بنهاية الشهر.',
  '{month}: {billed} billed so far of {budget} ({share}).': '{month}: {billed} مدفوع إضافيًا حتى الآن من {budget} ({share}).',
  'Enter an amount above 0, or leave the field empty for no budget.': 'أدخل مبلغًا أكبر من 0، أو اترك الحقل فارغًا لعدم تحديد ميزانية.',
  'A monthly limit for the amount billed on top of seats, used as a reference line in the reports.':
    'حد شهري للمبلغ المدفوع إضافيًا فوق التراخيص، يظهر خطًا مرجعيًا في التقارير.',
  'Monthly budget for billed usage': 'الميزانية الشهرية للاستخدام المدفوع إضافيًا',
  'Billed usage is the usage that goes beyond the included credits and is billed on top of seats. Enter the most you want to be billed in a month. Leave the field empty for no budget. The app only reports against this amount. It does not set a limit in GitHub.':
    'الاستخدام المدفوع إضافيًا هو الاستخدام الذي يتجاوز الأرصدة المشمولة ويُدفع فوق التراخيص. أدخل أقصى مبلغ تريد دفعه في الشهر. اترك الحقل فارغًا لعدم تحديد ميزانية. يقارن التطبيق التقارير بهذا المبلغ فقط، ولا يضع حدًا في GitHub.',
  'Monthly budget in US dollars': 'الميزانية الشهرية بالدولار الأمريكي',
  'No budget': 'بلا ميزانية',
  'Where the budget is used': 'أين تُستخدم الميزانية',
  'Load a report to compare the budget with the latest month.': 'حمّل تقريرًا لمقارنة الميزانية بأحدث شهر.',
  'Budgets in GitHub': 'الميزانيات في GitHub',

  // Data on this device
  'The file is larger than 25 MB, which is far more than a settings file needs.':
    'حجم الملف أكبر من 25 ميغابايت، وهذا أكثر بكثير مما يحتاجه ملف إعدادات.',
  'The file could not be read.': 'تعذّرت قراءة الملف.',
  'What this app keeps in your browser, and how to back up or move your settings.':
    'ما يحفظه هذا التطبيق في متصفحك، وكيف تحفظ نسخة من إعداداتك أو تنقلها.',
  'What stays on this device': 'ما يبقى على هذا الجهاز',
  'Settings are saved in this browser, in local storage under the key {key}. The theme, the colors, the language, the digits for Arabic and the Show calculations switch are saved there too. Every key starts with {prefix}.':
    'تُحفظ الإعدادات في هذا المتصفح، في التخزين المحلي تحت المفتاح {key}. ويُحفظ هناك أيضًا المظهر والألوان واللغة وشكل الأرقام في العربية ومفتاح إظهار طرق الحساب. يبدأ كل مفتاح بـ {prefix}.',
  'Delete everything saved on this device': 'احذف كل ما حُفظ على هذا الجهاز',
  'Remove all settings this app keeps in this browser.': 'أزل كل الإعدادات التي يحفظها هذا التطبيق في هذا المتصفح.',
  'Nothing is saved in this browser yet. Every setting is at its default.': 'لم يُحفظ شيء في هذا المتصفح بعد. كل إعداد على قيمته الافتراضية.',
  'Saved now:': 'المحفوظ الآن:',
  'This deletes the settings, the license list, the theme, the colors, the language and the digit choice, then opens the app again from the start. A loaded report is closed, because it is only kept in memory. Other websites are not touched. Export a settings file first if you may want them back.':
    'يحذف هذا الإعدادات وقائمة التراخيص والمظهر والألوان واللغة واختيار الأرقام، ثم يفتح التطبيق من البداية. ويُغلق التقرير المحمّل لأنه محفوظ في الذاكرة فقط. لا تتأثر المواقع الأخرى. صدّر ملف إعدادات أولًا إذا كنت قد تحتاجها لاحقًا.',
  'The report is never saved. It is read from the file you choose and kept in memory while the tab is open. Closing or reloading the tab removes it.':
    'لا يُحفظ التقرير أبدًا. يُقرأ من الملف الذي تختاره ويبقى في الذاكرة ما دامت علامة التبويب مفتوحة. إغلاق علامة التبويب أو إعادة تحميلها يزيله.',
  'Nothing is uploaded. Clearing the site data of this browser removes the saved settings, and another browser starts with the defaults.':
    'لا يُرفع أي شيء. مسح بيانات الموقع في هذا المتصفح يزيل الإعدادات المحفوظة، ويبدأ أي متصفح آخر بالقيم الافتراضية.',
  'This browser is not keeping the settings': 'هذا المتصفح لا يحفظ الإعدادات',
  'Storage may be blocked or full. Your settings still apply while this tab is open, but they are lost when you reload it. Export a settings file to keep a copy.':
    'قد يكون التخزين محظورًا أو ممتلئًا. تبقى إعداداتك مطبّقة ما دامت علامة التبويب مفتوحة، لكنها تضيع عند إعادة تحميلها. صدّر ملف إعدادات للاحتفاظ بنسخة.',
  'Settings file': 'ملف الإعدادات',
  'Back up your settings or move them to another browser.': 'احفظ نسخة من إعداداتك أو انقلها إلى متصفح آخر.',
  'Export settings': 'تصدير الإعدادات',
  'Import settings': 'استيراد الإعدادات',
  'The export is a JSON file with the thresholds, the budget, the license list and its date, the extra seats and the model price overrides. It holds no report data, no theme and no language. An import replaces the settings you have now. Settings missing from the file go back to their defaults, so a file from an older version works, and values that are out of range are left out. Files up to 25 MB are accepted.':
    'ملف التصدير ملف JSON يضم الحدود والميزانية وقائمة التراخيص وتاريخها والتراخيص الإضافية وتعديلات أسعار النماذج. لا يضم أي بيانات من التقرير ولا المظهر ولا اللغة. الاستيراد يستبدل إعداداتك الحالية. الإعدادات غير الموجودة في الملف تعود إلى قيمها الافتراضية، لذا يعمل الملف من إصدار أقدم، وتُستبعد القيم الخارجة عن النطاق. تُقبل الملفات حتى 25 ميغابايت.',
  'Reset all settings': 'إعادة ضبط كل الإعدادات',
  'Put every setting back to its default.': 'أعد كل إعداد إلى قيمته الافتراضية.',
  'This clears the thresholds, the budget, the license list, the extra seats and the model price overrides. The theme, the language and the loaded report stay as they are. Export a settings file first if you may want them back.':
    'يمسح هذا الحدود والميزانية وقائمة التراخيص والتراخيص الإضافية وتعديلات أسعار النماذج. يبقى المظهر واللغة والتقرير المحمّل كما هي. صدّر ملف إعدادات أولًا إن كنت قد تحتاج إليها لاحقًا.',
  'Reset every setting, including the license list and the model price overrides?':
    'هل تريد إعادة ضبط كل الإعدادات، بما فيها قائمة التراخيص وتعديلات أسعار النماذج؟',

  // Import outcome
  'All settings reset': 'أُعيد ضبط كل الإعدادات',
  'Every setting is back to its default. The theme, the language and the loaded report did not change.':
    'عاد كل إعداد إلى قيمته الافتراضية. لم يتغير المظهر ولا اللغة ولا التقرير المحمّل.',
  'Import undone': 'أُلغي الاستيراد',
  'Your settings are back to what they were before you imported {file}.': 'عادت إعداداتك إلى ما كانت عليه قبل استيراد {file}.',
  'Import failed': 'فشل الاستيراد',
  '{file}: {error} Your settings were not changed.': '{file}: {error} لم تتغير إعداداتك.',
  'Settings imported': 'استُوردت الإعدادات',
  'Nothing to change': 'لا شيء لتغييره',
  'Undo import': 'التراجع عن الاستيراد',
  '{file} changed {n} settings.': plural(
    'غيّر {file} إعدادًا واحدًا.',
    'غيّر {file} إعدادين.',
    'غيّر {file} {n} إعدادات.',
    'غيّر {file} {n} إعدادًا.',
    'غيّر {file} {n} إعداد.',
  ),
  '{file} has the same settings as the ones in use.': 'يحتوي {file} على الإعدادات المستخدمة نفسها.',
  'You can undo this until you change another setting.': 'يمكنك التراجع عن هذا ما لم تغيّر إعدادًا آخر.',
  '{n} items in the file were left out': plural(
    'استُبعد عنصر واحد من الملف',
    'استُبعد عنصران من الملف',
    'استُبعدت {n} عناصر من الملف',
    'استُبعد {n} عنصرًا من الملف',
    'استُبعد {n} عنصر من الملف',
  ),

  // Extra seats
  'Business seats': 'تراخيص Business',
  'Number of extra Business seats': 'عدد تراخيص Business الإضافية',
  'Enterprise seats': 'تراخيص Enterprise',
  'Number of extra Enterprise seats': 'عدد تراخيص Enterprise الإضافية',
  'Extra seats not in the report': 'تراخيص إضافية غير موجودة في التقرير',
  'Seats you pay for but cannot name, for example when you only know the count.':
    'تراخيص تدفع ثمنها ولا تعرف أصحابها، مثلًا عندما تعرف عددها فقط.',
  'Each extra seat adds its included credits to the pool in every month, which makes the pool size and the utilization more accurate. Do not count a seat twice: seats in the license list are already in the pool.':
    'يضيف كل ترخيص إضافي أرصدته المشمولة إلى الرصيد المشترك في كل شهر، فيصبح حجم الرصيد المشترك ونسبة الاستفادة منه أدق. لا تحسب الترخيص مرتين: التراخيص الموجودة في قائمة التراخيص محسوبة في الرصيد المشترك أصلًا.',
  '{plan} seats include {credits} AI credits ({usd}) each month.': 'تراخيص {plan} تشمل {credits} من أرصدة الذكاء الاصطناعي ({usd}) كل شهر.',
  'Adds {credits} AI credits ({usd}) a month.': 'يضيف {credits} من أرصدة الذكاء الاصطناعي ({usd}) في الشهر.',
  'Default {value}': 'القيمة الافتراضية {value}',
  'Together the extra seats add {credits} AI credits ({usd}) to the pool each month.':
    'تضيف التراخيص الإضافية معًا {credits} من أرصدة الذكاء الاصطناعي ({usd}) إلى الرصيد المشترك كل شهر.',
  'No extra seats are counted.': 'لا تُحسب أي تراخيص إضافية.',

  // Glossary
  'Plain-language definitions of the terms used across the reports. Numbers in the text follow your current settings.':
    'تعريفات بلغة بسيطة للمصطلحات المستخدمة في التقارير. الأرقام في النص تتبع إعداداتك الحالية.',
  'Search terms, for example persona or cache': 'ابحث في المصطلحات، مثل persona أو cache',
  'Search the glossary': 'البحث في المسرد',
  '{count} of {terms}': '{count} من {terms}',
  'The formula, the columns used and the settings behind every number': 'المعادلة والأعمدة المستخدمة والإعدادات وراء كل رقم',
  'Formulas for every number': 'معادلات كل رقم',
  'No term matches the search': 'لا يوجد مصطلح يطابق البحث',
  'Try a shorter word, or clear the search to see every term.': 'جرّب كلمة أقصر، أو امسح البحث لرؤية كل المصطلحات.',
  'Also called {aliases}': 'يُسمّى أيضًا {aliases}',
  ', ': '، ',
  Money: 'المال',
  'Seats and the pool': 'التراخيص والرصيد المشترك',
  Activity: 'النشاط',
  Classification: 'التصنيف',
  'Savings and efficiency': 'التوفير والكفاءة',
  'Trends and projections': 'الاتجاهات والتوقعات',

  // Live bands
  'Share of users in each band': 'حصة المستخدمين في كل شريحة',
  '{name}: {users}': '{name}: {users}',
  '{users} of users, {usage} of usage': '{users} من المستخدمين، و{usage} من الاستخدام',
  '{users} of users': '{users} من المستخدمين',
  'Filters are on, so the counts cover only the users that match them.': 'عوامل التصفية مفعّلة، لذا تشمل الأعداد المستخدمين المطابقين لها فقط.',
  'Counts cover the users in the selected period and update when you change a limit.':
    'تشمل الأعداد المستخدمين في الفترة المحددة، وتتحدّث عند تغيير أي حد.',
  'Load a report to see how many users fall in each band.': 'حمّل تقريرًا لترى عدد المستخدمين في كل شريحة.',
  'Users in the selected period that match this label': 'المستخدمون في الفترة المحددة المطابقون لهذا التصنيف',
  '{n} users now': plural('مستخدم واحد الآن', 'مستخدمان الآن', '{n} مستخدمين الآن', '{n} مستخدمًا الآن', '{n} مستخدم الآن'),
  'First {value} of usage': 'أول {value} من الاستخدام',
  'Next {value}': 'الـ{value} التالية',
  'Last {value}': 'آخر {value}',

  // Live price check
  'Check the live prices': 'التحقق من الأسعار الحالية',
  'The price card in the app is from {date}. Compare it with the GitHub Docs page to find new or changed prices.':
    'قائمة الأسعار في التطبيق بتاريخ {date}. قارنها بصفحة GitHub Docs لمعرفة الأسعار الجديدة أو المتغيرة.',
  'Check GitHub Docs': 'التحقق من GitHub Docs',
  'The app downloads the public page and sends nothing. Your data stays in this browser.':
    'ينزّل التطبيق الصفحة العامة ولا يرسل شيئًا. تبقى بياناتك في هذا المتصفح.',
  'Open the GitHub Docs page': 'فتح صفحة GitHub Docs',
  'The live prices could not be read': 'تعذّرت قراءة الأسعار الحالية',
  'Check the connection, or compare the prices by hand on the GitHub Docs page.': 'تحقق من الاتصال، أو قارن الأسعار يدويًا في صفحة GitHub Docs.',
  'The price card matches the GitHub Docs page.': 'قائمة الأسعار مطابقة لصفحة GitHub Docs.',
  '{list}.': '{list}.',
  '{n} models have a changed price or tier': plural(
    'نموذج واحد تغيّر سعره أو فئته',
    'نموذجان تغيّر سعرهما أو فئتهما',
    '{n} نماذج تغيّر سعرها أو فئتها',
    '{n} نموذجًا تغيّر سعره أو فئته',
    '{n} نموذج تغيّر سعره أو فئته',
  ),
  '{n} models are new on the page': plural(
    'نموذج واحد جديد في الصفحة',
    'نموذجان جديدان في الصفحة',
    '{n} نماذج جديدة في الصفحة',
    '{n} نموذجًا جديدًا في الصفحة',
    '{n} نموذج جديد في الصفحة',
  ),
  '{n} models are no longer on the page': plural(
    'نموذج واحد لم يعد في الصفحة',
    'نموذجان لم يعودا في الصفحة',
    '{n} نماذج لم تعد في الصفحة',
    '{n} نموذجًا لم يعد في الصفحة',
    '{n} نموذج لم يعد في الصفحة',
  ),
  'New on the page': 'جديد في الصفحة',
  'No longer on the page': 'لم يعد في الصفحة',
  'Changed: {fields}': 'ما تغيّر: {fields}',
  'And {n} more.': 'و{n} غيرها.',
  '{n} rows of the page could not be read.': plural(
    'تعذّرت قراءة صف واحد من الصفحة.',
    'تعذّرت قراءة صفين من الصفحة.',
    'تعذّرت قراءة {n} صفوف من الصفحة.',
    'تعذّرت قراءة {n} صفًا من الصفحة.',
    'تعذّرت قراءة {n} صف من الصفحة.',
  ),
  'Use the live prices for the models in this report': 'استخدام الأسعار الحالية لنماذج هذا التقرير',
  'Load a report to apply the live prices.': 'حمّل تقريرًا لتطبيق الأسعار الحالية.',
  'Saved as price changes below. You can remove them at any time.': 'حُفظت تعديلات أسعار في الأسفل. يمكنك إزالتها في أي وقت.',
  'The models in this report already use these prices.': 'نماذج هذا التقرير تستخدم هذه الأسعار أصلًا.',
  'Saved new prices for {n} models.': plural(
    'حُفظت أسعار جديدة لنموذج واحد.',
    'حُفظت أسعار جديدة لنموذجين.',
    'حُفظت أسعار جديدة لـ{n} نماذج.',
    'حُفظت أسعار جديدة لـ{n} نموذجًا.',
    'حُفظت أسعار جديدة لـ{n} نموذج.',
  ),
  'Long-context input': 'إدخال السياق الطويل',
  'Long-context cache read': 'قراءة السياق الطويل من الذاكرة المؤقتة',
  'Long-context cache write': 'كتابة السياق الطويل في الذاكرة المؤقتة',
  'Long-context output': 'إخراج السياق الطويل',
  'Long-context threshold': 'حد السياق الطويل',

  // Models
  'Models in the report': 'النماذج في التقرير',
  'Change a tier right away, or open the prices to set your own. Models that need attention are listed first.':
    'غيّر الفئة مباشرة، أو افتح الأسعار لتحدد أسعارك. تظهر النماذج التي تحتاج إلى انتباه أولًا.',
  'Prices from the GitHub Docs price card as of {date}. {source}': 'الأسعار من قائمة أسعار GitHub Docs بتاريخ {date}. {source}',
  'See the source': 'عرض المصدر',
  'Search models': 'البحث في النماذج',
  'Show models': 'عرض النماذج',
  'Models with no price on the price card or no tier': 'نماذج بلا سعر في قائمة الأسعار أو بلا فئة',
  Changed: 'معدّل',
  'Models with a tier or prices set here': 'نماذج حُددت فئتها أو أسعارها هنا',
  'The report has no usage rows.': 'لا يحتوي التقرير على صفوف استخدام.',
  'No models match.': 'لا توجد نماذج مطابقة.',
  'Rows with no model name cannot be priced or given a tier. Their usage is left out of the estimates that use tokens.':
    'لا يمكن تسعير الصفوف التي ليس لها اسم نموذج ولا تحديد فئة لها. يُستبعد استخدامها من التقديرات المعتمدة على الرموز.',
  'This name cannot be used for a price change.': 'لا يمكن استخدام هذا الاسم لتعديل سعر.',
  'No tier set': 'لم تُحدد فئة',
  'Tier of {model}': 'فئة {model}',
  'Tier on the price card: {tier}': 'الفئة في قائمة الأسعار: {tier}',
  'No price on the price card': 'لا سعر في قائمة الأسعار',
  'Your prices': 'أسعارك',
  'Price card prices': 'أسعار قائمة الأسعار',
  '{rates} per 1M tokens': '{rates} لكل مليون رمز',
  'The token-based estimates skip this model until it has prices.': 'تتجاهل التقديرات المعتمدة على الرموز هذا النموذج حتى تُحدد أسعاره.',
  'Edit prices': 'تعديل الأسعار',
  'Set prices': 'تحديد الأسعار',
  'Remove your change': 'إزالة تعديلك',
  'Every model in the report has a tier and a price on the price card.': 'لكل نموذج في التقرير فئة وسعر في قائمة الأسعار.',
  'Some models are missing a price or a tier': 'بعض النماذج بلا سعر أو بلا فئة',
  'Show them': 'عرضها',
  '{n} models have no price on the price card and carry {usage} ({share}) of usage. The estimates that use tokens skip that usage: model shift, cache discipline, leaner context and long-context surcharges.':
    'عدد النماذج التي ليس لها سعر في قائمة الأسعار: {n}، وتحمل {usage} ({share}) من الاستخدام. تتجاهل التقديرات المعتمدة على الرموز هذا الاستخدام: تغيير النموذج، والاستفادة من الذاكرة المؤقتة، والسياق الأخف، والرسوم الإضافية للسياق الطويل.',
  '{n} models have no tier. Right-sizing only moves usage off Powerful models, and the usage profiles count only usage that has a tier.':
    'عدد النماذج التي ليس لها فئة: {n}. اختيار النموذج المناسب ينقل الاستخدام من النماذج القوية فقط، وملفات الاستخدام لا تحسب إلا الاستخدام الذي له فئة.',
  'Fix a missing price or tier so the estimates cover every model.': 'أكمل السعر أو الفئة الناقصة لتشمل التقديرات كل النماذج.',
  'Remove all your model price and tier changes?': 'هل تريد إزالة كل تعديلاتك على أسعار النماذج وفئاتها؟',
  'What the tier and the price do': 'ما دور الفئة والسعر',
  "The tier (Powerful, Versatile or Lightweight) drives the right-sizing recommendations and each user's usage profile. The prices drive the estimates that work from tokens: model shift, cache discipline, leaner context and long-context surcharges.":
    'تحدد الفئة (قوية أو متعددة الاستخدامات أو خفيفة) توصيات اختيار النموذج المناسب وملف استخدام كل مستخدم. وتحدد الأسعار التقديرات المعتمدة على الرموز: تغيير النموذج، والاستفادة من الذاكرة المؤقتة، والسياق الأخف، والرسوم الإضافية للسياق الطويل.',
  'Nothing here changes the billed amounts. They come straight from the report.': 'لا شيء هنا يغيّر المبالغ المدفوعة إضافيًا، فهي تأتي من التقرير مباشرة.',
  'Load a report to see the models it contains and to fix any that have no price or tier.':
    'حمّل تقريرًا لترى النماذج التي يحتويها وتكمل ما ينقصه سعر أو فئة.',
  'Prices for {model}': 'أسعار {model}',
  'Prices are in US dollars per 1 million tokens. They are used to price the tokens of this model in the estimates that work from token counts.':
    'الأسعار بالدولار الأمريكي لكل مليون رمز. تُستخدم لتسعير رموز هذا النموذج في التقديرات المعتمدة على عدد الرموز.',
  '{name} (optional)': '{name} (اختياري)',
  'Save prices': 'حفظ الأسعار',
  'Use the price card prices': 'استخدام أسعار قائمة الأسعار',
  'Price card: {rates}.': 'قائمة الأسعار: {rates}.',
  'Tier {tier}': 'الفئة {tier}',
  '. ': '. ',
  'No tier or price set': 'لم تُحدد فئة ولا سعر',
  'Saved changes for models that are not in this report': 'تعديلات محفوظة لنماذج غير موجودة في هذا التقرير',
  'Saved model changes': 'تعديلات النماذج المحفوظة',
  'They stay in this browser. A saved price also applies when its model is used as a right-sizing target.':
    'تبقى في هذا المتصفح. ويُطبَّق السعر المحفوظ أيضًا عندما يكون نموذجه هدفًا لاختيار النموذج المناسب.',
  'Remove the change for {model}': 'إزالة تعديل {model}',
  Remove: 'إزالة',
  'Use the input price if there is no cache discount.': 'استخدم سعر الإدخال إذا لم يكن هناك خصم للذاكرة المؤقتة.',
  'Leave empty if there is no separate charge.': 'اتركه فارغًا إذا لم تكن هناك رسوم منفصلة.',
  'Input {price}': 'الإدخال {price}',
  'cache read {price}': 'القراءة من الذاكرة المؤقتة {price}',
  'cache write {price}': 'الكتابة في الذاكرة المؤقتة {price}',
  'output {price}': 'الإخراج {price}',
  'Required.': 'مطلوب.',
  'Must be 0 or more.': 'يجب أن يكون 0 أو أكثر.',
  'Must be at most {value}.': 'يجب ألا يتجاوز {value}.',
  'Enter a price above 0 for input or output.': 'أدخل سعرًا أكبر من 0 للإدخال أو الإخراج.',

  // Inputs
  'Enter a number.': 'أدخل رقمًا.',
  'Enter a number, for example 12.5.': 'أدخل رقمًا، مثل 12.5.',
  'Limited to {value}, the highest allowed value.': 'اقتُصر على {value}، وهي أعلى قيمة مسموح بها.',
  'Limited to {value}, the lowest allowed value.': 'اقتُصر على {value}، وهي أدنى قيمة مسموح بها.',
  '{name}, in percent': '{name}، بالنسبة المئوية',
  '{name}, in days': '{name}، بالأيام',
  '{name}, in US dollars': '{name}، بالدولار الأمريكي',
  days: 'أيام',

  // License list
  'Added {added}, updated the plan of {updated}, left {unchanged} unchanged. The license list now has {total}.':
    'أُضيف {added}، وحُدّثت خطة {updated}، وبقي {unchanged} دون تغيير. تضم قائمة التراخيص الآن {total}.',
  'Replaced the license list with {seats}.': 'استُبدلت قائمة التراخيص بـ{seats}.',
  'Replaced the license list with the {users} in the report.': 'استُبدلت قائمة التراخيص بـ{users} في التقرير.',
  '{users} in the report. {result}': '{users} في التقرير. {result}',
  'Add seats by hand': 'إضافة التراخيص يدويًا',
  'Paste a list of users. Nothing changes until you add them.': 'الصق قائمة بالمستخدمين. لا يتغير شيء حتى تضيفهم.',
  'Users to add': 'المستخدمون المراد إضافتهم',
  'One user per line, as {user} or {userPlan}. The plan can be Business, Enterprise, a custom plan label such as Custom (2,500 credits) or a number. A number of 1,000 or more is AI credits, for example 3900. A smaller number is dollars of included credits, for example 19. A header row is skipped, and users are matched without regard to case.':
    'مستخدم واحد في كل سطر، بصيغة {user} أو {userPlan}. يمكن أن تكون الخطة Business أو Enterprise أو تسمية خطة مخصصة مثل Custom (2,500 credits) أو رقمًا. الرقم 1,000 أو أكثر يعني أرصدة ذكاء اصطناعي، مثل 3900. والرقم الأصغر يعني دولارات من الأرصدة المشمولة، مثل 19. يُتجاهل صف العناوين، وتُطابق أسماء المستخدمين دون تمييز بين الأحرف الكبيرة والصغيرة.',
  '{n} users found': plural('عُثر على مستخدم واحد', 'عُثر على مستخدمَين', 'عُثر على {n} مستخدمين', 'عُثر على {n} مستخدمًا', 'عُثر على {n} مستخدم'),
  '{n} duplicates skipped': plural('تُجوهل تكرار واحد', 'تُجوهل تكراران', 'تُجوهلت {n} تكرارات', 'تُجوهل {n} تكرارًا', 'تُجوهل {n} تكرار'),
  '{n} lines ignored': plural('تُجوهل سطر واحد', 'تُجوهل سطران', 'تُجوهلت {n} أسطر', 'تُجوهل {n} سطرًا', 'تُجوهل {n} سطر'),
  'The header row was skipped.': 'تُجوهل صف العناوين.',
  '{n} plans could not be read, for example {samples}. Those users are added without a plan.':
    'عدد الخطط التي تعذّرت قراءتها: {n}، مثل {samples}. يُضاف هؤلاء المستخدمون دون خطة.',
  'Show ignored lines': 'عرض الأسطر المتجاهلة',
  'Line {n}:': 'السطر {n}:',
  'No line contains a usable username.': 'لا يحتوي أي سطر على اسم مستخدم صالح.',
  'How to add the users': 'طريقة إضافة المستخدمين',
  'Add new users and update the plan of users already in the license list': 'إضافة المستخدمين الجدد وتحديث خطة المستخدمين الموجودين في قائمة التراخيص',
  'Swap the whole license list for this list': 'استبدال قائمة التراخيص كلها بهذه القائمة',
  'Add {users}': 'إضافة {users}',
  'Replace the license list with {users}': 'استبدال قائمة التراخيص بـ{users}',
  'Adding keeps the users already in the list and updates their plan when you give one.':
    'الإضافة تُبقي المستخدمين الموجودين في القائمة وتحدّث خطتهم إذا ذكرت خطة.',
  'Replacing swaps the current license list for this list.': 'الاستبدال يضع هذه القائمة مكان قائمة التراخيص الحالية.',
  'Load a report first': 'حمّل تقريرًا أولًا',
  'Use the users in the loaded report': 'استخدام المستخدمين في التقرير المحمّل',
  'Fills the license list with everyone who appears in the report, with the plan read from their quota.':
    'يملأ قائمة التراخيص بكل من يظهر في التقرير، مع الخطة المقروءة من حصته.',
  'Adding only fills in users and plans that are missing.': 'الإضافة تملأ المستخدمين والخطط الناقصة فقط.',
  'Replacing discards the current license list first.': 'الاستبدال يحذف قائمة التراخيص الحالية أولًا.',
  'Then add the seats that never appear in the report.': 'ثم أضف التراخيص التي لا تظهر في التقرير أبدًا.',
  'Organization: {org}': 'المؤسسة: {org}',
  'Team: {team}': 'الفريق: {team}',
  'Last activity {date}': 'آخر نشاط {date}',
  'The license list is empty. Import a license file, paste users above, or use the users in the loaded report.':
    'قائمة التراخيص فارغة. استورد ملف تراخيص، أو الصق المستخدمين في الأعلى، أو استخدم المستخدمين في التقرير المحمّل.',
  'Search users': 'البحث في المستخدمين',
  'Search the license list': 'البحث في قائمة التراخيص',
  'Show seats': 'عرض التراخيص',
  'All seats': 'كل التراخيص',
  'Not in the report': 'غير موجود في التقرير',
  'Seats whose user never appears in the loaded report': 'تراخيص لا يظهر مستخدموها في التقرير المحمّل أبدًا',
  'No seats match.': 'لا توجد تراخيص مطابقة.',
  'In the report': 'في التقرير',
  'Plan for {user}': 'خطة {user}',
  'Remove {user} from the license list': 'إزالة {user} من قائمة التراخيص',
  'Remove from the license list': 'إزالة من قائمة التراخيص',
  'No seats': 'لا تراخيص',
  'Showing {from} to {to} of {total}': 'عرض {from} إلى {to} من {total}',
  'No seats yet.': 'لا توجد تراخيص بعد.',
  '{n} Business': '{n} Business',
  '{n} Enterprise': '{n} Enterprise',
  '{n} with a custom plan': '{n} بخطة مخصصة',
  '{n} with no plan': '{n} بلا خطة',
  '{seats}: {plans}.': '{seats}: {plans}.',
  '{inReport} appear in the report and {notInReport} do not.': 'يظهر {inReport} في التقرير، ولا يظهر {notInReport}.',
  'Tell the app about seats that never show up in the report.': 'عرّف التطبيق بالتراخيص التي لا تظهر في التقرير أبدًا.',
  'Remove the license list and the extra seats?': 'هل تريد إزالة قائمة التراخيص والتراخيص الإضافية؟',
  'Why add a license list': 'لماذا تضيف قائمة تراخيص',
  'The report lists only users who used AI credits, so a seat with no usage never appears in it. A license list lets the app:':
    'لا يذكر التقرير إلا المستخدمين الذين استخدموا أرصدة الذكاء الاصطناعي، لذا لا يظهر فيه أبدًا ترخيص بلا استخدام. تتيح قائمة التراخيص للتطبيق:',
  'Find seats you pay for that have no AI-credit usage. The Users page lists them, and the savings on the Overview and Recommendations include them.':
    'العثور على التراخيص التي تدفع ثمنها وليس لها استخدام لأرصدة الذكاء الاصطناعي. تعرضها صفحة المستخدمين، وتدخل في التوفير المعروض في النظرة العامة والتوصيات.',
  'Count a seat in the pool in months when its user had no usage. This gives a better estimate of the pool size and the utilization. The list holds the seats you have now, so past months with a different set of seats are still estimates.':
    'حساب الترخيص في الرصيد المشترك في الأشهر التي لم يكن لمستخدمه فيها استخدام. يعطي هذا تقديرًا أفضل لحجم الرصيد المشترك ونسبة الاستفادة منه. تضم القائمة التراخيص الموجودة لديك الآن، لذا تبقى الأشهر السابقة التي اختلفت فيها التراخيص تقديرات.',
  'The license list and the extra seats apply only when no filter is set, because a filtered view cannot tell which seats belong to it.':
    'لا تُطبَّق قائمة التراخيص والتراخيص الإضافية إلا عند عدم تعيين أي عامل تصفية، لأن العرض المصفّى لا يستطيع معرفة التراخيص التابعة له.',
  'Import a license file': 'استيراد ملف تراخيص',
  'Use the seat list you export from GitHub. The Licenses page shows the full results.':
    'استخدم قائمة التراخيص التي تصدّرها من GitHub. تعرض صفحة التراخيص النتائج كاملة.',
  'Seats in the license list': 'التراخيص في قائمة التراخيص',
  'Clear the license list': 'مسح قائمة التراخيص',
  'Yes, clear': 'نعم، امسح',
  'Remove all {seats}?': 'هل تريد إزالة كل التراخيص ({seats})؟',
  '{n} seats never appear in the report. They count as unused seats, and their included credits are added to the pool. A seat with no plan uses the most common plan in the report.':
    'عدد التراخيص التي لا تظهر في التقرير أبدًا: {n}. تُحسب تراخيص غير مستخدمة، وتُضاف أرصدتها المشمولة إلى الرصيد المشترك. الترخيص الذي ليس له خطة يأخذ الخطة الأكثر شيوعًا في التقرير.',
  'No username': 'لا يوجد اسم مستخدم',
  'Username is too long': 'اسم المستخدم طويل جدًا',
  'Username has spaces or other characters that GitHub does not allow': 'اسم المستخدم فيه مسافات أو أحرف أخرى لا يسمح بها GitHub',
  'Custom ({credits} credits)': 'مخصصة ({credits} من الأرصدة)',

  // Thresholds
  'The rules that sort users into tiers, engagement levels, usage profiles, personas and classes. The counts update as you change a value.':
    'القواعد التي توزّع المستخدمين على شرائح الاستخدام ومستويات التفاعل وملفات الاستخدام وأنماط المستخدمين والفئات. تتحدّث الأعداد عند تغيير أي قيمة.',
  'At $0, any day with a usage row counts as active.': 'عند $0، يُحسب كل يوم فيه صف استخدام يومَ نشاط.',
  'About {n} AI credits.': plural(
    'نحو رصيد واحد من أرصدة الذكاء الاصطناعي.',
    'نحو رصيدين من أرصدة الذكاء الاصطناعي.',
    'نحو {n} أرصدة ذكاء اصطناعي.',
    'نحو {n} رصيدًا من أرصدة الذكاء الاصطناعي.',
    'نحو {n} من أرصدة الذكاء الاصطناعي.',
  ),
  'Default {value}.': 'القيمة الافتراضية {value}.',
  'Active day': 'يوم النشاط',
  'What counts as a day of use.': 'ما يُحسب يومَ استخدام.',
  'A day counts as active for a user when their usage that day reaches this amount. It feeds the active rate, the engagement level, the personas and the cost per active day.':
    'يُحسب اليوم يوم نشاط للمستخدم عندما يبلغ استخدامه في ذلك اليوم هذا المبلغ. ويدخل في معدل النشاط ومستوى التفاعل وأنماط المستخدمين وتكلفة يوم النشاط.',
  'Minimal limit': 'حد ضئيل',
  Minimal: 'ضئيل',
  'Users up to this share of their included credits barely use the license.': 'المستخدمون حتى هذه الحصة من أرصدتهم المشمولة بالكاد يستخدمون الترخيص.',
  'Light limit': 'حد خفيف',
  'Some use, well inside the included credits.': 'بعض الاستخدام، ضمن الأرصدة المشمولة بفارق واضح.',
  'Core limit': 'حد أساسي',
  Core: 'أساسي',
  'Healthy use. 100% means the user has used all of their own included credits.': 'استخدام صحي. تعني 100% أن المستخدم استهلك كل أرصدته المشمولة.',
  'Power limit': 'حد مكثف',
  Power: 'مكثف',
  'The user has gone past their own included credits and draws on the shared pool.': 'تجاوز المستخدم أرصدته المشمولة ويسحب من الرصيد المشترك.',
  'How much of their own included credits each user uses, as a percent.': 'مقدار ما يستخدمه كل مستخدم من أرصدته المشمولة، بالنسبة المئوية.',
  "Usage is divided by the user's own included credits: the credits of their license for the months in the period. A Business license includes 1,900 AI credits ($19) a month, so in a one-month period a user is at 100% when usage reaches $19. Each limit is the top of its tier. The limits must stay in ascending order.":
    'يُقسم الاستخدام على الأرصدة المشمولة للمستخدم نفسه: أرصدة ترخيصه عن أشهر الفترة. يشمل ترخيص Business ‏1,900 من أرصدة الذكاء الاصطناعي ($19) في الشهر، لذا في فترة من شهر واحد يصل المستخدم إلى 100% عندما يبلغ استخدامه $19. كل حد هو أعلى شريحته. يجب أن تبقى الحدود بترتيب تصاعدي.',
  Runaway: 'مفرط',
  'The user has used at least the Power limit. These users are the first to review.': 'بلغ استخدام المستخدم حد مكثف على الأقل. هؤلاء أول من يجب مراجعته.',
  'Occasional cutoff': 'حد متقطع',
  'Lowest share of workdays for an Occasional user. Below it the user is Rare.': 'أدنى حصة من أيام العمل للمستخدم المتقطع. وما دونها يكون المستخدم نادرًا.',
  'Regular cutoff': 'حد منتظم',
  'Lowest share of workdays for a Regular user. Personas also use this cutoff to tell frequent users from infrequent ones.':
    'أدنى حصة من أيام العمل للمستخدم المنتظم. وتستخدم أنماط المستخدمين هذا الحد أيضًا للتمييز بين المستخدمين المتكررين وغير المتكررين.',
  'Daily cutoff': 'حد يومي',
  'Lowest share of workdays for a Daily user.': 'أدنى حصة من أيام العمل للمستخدم اليومي.',
  'How often a user is active, as a percent of workdays.': 'عدد مرات نشاط المستخدم، بالنسبة المئوية من أيام العمل.',
  'The active rate is the number of active days divided by the workdays (Monday to Friday) since the user started, limited to the selected period. Each cutoff is the lowest rate for its level. The cutoffs must stay in ascending order.':
    'معدل النشاط هو عدد أيام النشاط مقسومًا على أيام العمل (من الاثنين إلى الجمعة) منذ بدء المستخدم، ضمن الفترة المحددة. كل حد هو أدنى معدل لمستواه. يجب أن تبقى الحدود بترتيب تصاعدي.',
  'Everyone below the Occasional cutoff.': 'كل من هو تحت حد متقطع.',
  'Under {value}': 'أقل من {value}',
  'A cutoff': 'حد الفئة A',
  'Class A ends at': 'تنتهي الفئة A عند',
  'Class A is the group of top users who together make up this share of total usage.':
    'الفئة A هي مجموعة المستخدمين الأعلى الذين يشكّلون معًا هذه الحصة من إجمالي الاستخدام.',
  'B cutoff': 'حد الفئة B',
  'Class B ends at': 'تنتهي الفئة B عند',
  'Class B covers the usage up to this share. Class C is everyone after it.': 'تغطي الفئة B الاستخدام حتى هذه الحصة. والفئة C هي كل من بعدها.',
  'Which users account for most of the usage, as a cumulative percent of usage.': 'أي المستخدمين يشكّلون معظم الاستخدام، بالنسبة المئوية التراكمية من الاستخدام.',
  'Users are ranked by usage, largest first. The classes follow the running share of total usage. The A cutoff must be below the B cutoff.':
    'يُرتَّب المستخدمون حسب الاستخدام، الأكبر أولًا. تتبع الفئات الحصة التراكمية من إجمالي الاستخدام. يجب أن يكون حد الفئة A أقل من حد الفئة B.',

  // User groups, traits, estimates
  'Users in the selected period in the Direct models class': 'المستخدمون في الفترة المحددة ضمن فئة نماذج مباشرة',
  'Users in the selected period in the Auto-first class': 'المستخدمون في الفترة المحددة ضمن فئة يعتمد على Auto',
  'Frontier-heavy is checked first, so a user who meets both rules is Frontier-heavy. A user who meets neither rule is Balanced.':
    'يُفحص «يعتمد على النماذج القوية» أولًا، فالمستخدم الذي يستوفي القاعدتين يُصنَّف «يعتمد على النماذج القوية». والمستخدم الذي لا يستوفي أيًّا منهما يُصنَّف «متوازن».',
  'New and Lapsed users are set aside before the other personas are decided.': 'يُستبعد المستخدمون الجدد والمتوقفون قبل تحديد أنماط المستخدمين الأخرى.',
  'Users at or above Auto first from are Auto-first. Users below Rarely uses Auto below are Direct models. Users in between are Mixed. Rarely uses Auto below must stay lower than Auto first from. The Rarely uses Auto trait uses the same lower limit and also needs the minimum usage for traits.':
    'المستخدمون عند «يعتمد على Auto ابتداءً من» أو فوقه يُصنَّفون «يعتمد على Auto». والمستخدمون تحت «نادرًا ما يستخدم Auto تحت» يُصنَّفون «نماذج مباشرة». ومن بينهما يُصنَّفون «مختلط». يجب أن يبقى «نادرًا ما يستخدم Auto تحت» أقل من «يعتمد على Auto ابتداءً من». تستخدم سمة «نادرًا ما يستخدم Auto» الحد الأدنى نفسه، وتحتاج أيضًا إلى أدنى استخدام للسمات.',
  'Traits are flags on a user. A user can have several. Most need a minimum amount of usage so that small accounts are not flagged by chance. The Rarely uses Auto trait is set under Auto use class.':
    'السمات علامات توضع على المستخدم، وقد تكون للمستخدم عدة سمات. يحتاج معظمها إلى حد أدنى من الاستخدام حتى لا تُعلَّم الحسابات الصغيرة بالصدفة. تُضبط سمة «نادرًا ما يستخدم Auto» ضمن فئة استخدام Auto.',
  'The report holds the amount after the Auto discount and has no discount column. The app measures the rate from token counts where it can. This setting is the assumed rate, and it is shown as assumed wherever it is used.':
    'يحتوي التقرير على المبلغ بعد خصم Auto، وليس فيه عمود للخصم. يقيس التطبيق المعدل من عدد الرموز حيث أمكن. هذا الإعداد هو المعدل المفترض، ويظهر على أنه مفترض في كل مكان يُستخدم فيه.',
  'User groups and traits': 'مجموعات المستخدمين والسمات',
  "The limits behind each user's usage profile, persona, Auto use class and usage traits.":
    'الحدود التي تحدد ملف استخدام كل مستخدم ونمط المستخدم وفئة استخدام Auto وسمات الاستخدام.',
  'Estimates and rankings': 'التقديرات والترتيب',
  'The Auto discount rate to assume where the report cannot measure one, and the length of the top lists.':
    'معدل خصم Auto المفترض حين لا يستطيع التقرير قياسه، وطول قوائم الأعلى.',
  Rankings: 'الترتيب',
  'Model mix': 'مزيج النماذج',
  Lifecycle: 'دورة الحياة',
  'A user is Frontier-heavy when at least this share of their usage is on Powerful models.':
    'يُصنَّف المستخدم «يعتمد على النماذج القوية» عندما تكون هذه الحصة على الأقل من استخدامه على النماذج القوية.',
  'A user is Efficient when at least this share of their usage is on Versatile and Lightweight models, and they are not Frontier-heavy.':
    'يُصنَّف المستخدم «موفّر» عندما تكون هذه الحصة على الأقل من استخدامه على النماذج المتعددة الاستخدامات والخفيفة، ولا يكون «يعتمد على النماذج القوية».',
  'A user is Lapsed when their last usage was at least this many days before the end of the period, unless they are New.':
    'يُصنَّف المستخدم «متوقف» عندما يكون آخر استخدام له قبل نهاية الفترة بهذا العدد من الأيام على الأقل، ما لم يكن «جديد».',
  'A user is New when their first day is within this many days of the end of the period and at least this many days after the report starts.':
    'يُصنَّف المستخدم «جديد» عندما يقع أول يوم له ضمن هذا العدد من الأيام قبل نهاية الفترة، وبعد بداية التقرير بهذا العدد من الأيام على الأقل.',
  'Users with less usage than this in the period are not flagged for usage traits. The trend traits apply it to a single week.':
    'لا تُعلَّم سمات الاستخدام للمستخدمين الذين يقل استخدامهم في الفترة عن هذا المبلغ. وتطبّقه سمات الاتجاه على أسبوع واحد.',
  "Flags Spiky usage when the biggest single day is at least this share of the user's usage. Needs at least 3 active days.":
    'تُعلَّم سمة «قفزات في الاستخدام» عندما يشكّل أكبر يوم هذه الحصة على الأقل من استخدام المستخدم. تحتاج إلى 3 أيام نشاط على الأقل.',
  'A user is in the Direct models class when less than this share of their usage goes through Auto model selection. They also get the Rarely uses Auto trait if their usage reaches the minimum for traits. Keep it below Auto first from.':
    'يكون المستخدم في فئة «نماذج مباشرة» عندما يمر أقل من هذه الحصة من استخدامه عبر اختيار النموذج عبر Auto. ويحصل أيضًا على سمة «نادرًا ما يستخدم Auto» إذا بلغ استخدامه الحد الأدنى للسمات. أبقِه أقل من «يعتمد على Auto ابتداءً من».',
  'A user is in the Auto-first class when at least this share of their usage goes through Auto model selection. Keep it above Rarely uses Auto below.':
    'يكون المستخدم في فئة «يعتمد على Auto» عندما تمر هذه الحصة على الأقل من استخدامه عبر اختيار النموذج عبر Auto. أبقِه أعلى من «نادرًا ما يستخدم Auto تحت».',
  'Flags Low cache reuse when the cache hit rate is below this value. The cache hit rate is cache read tokens (text the model reads again from its cache at a lower price) as a share of input, cache read and cache write tokens.':
    'تُعلَّم سمة «استفادة قليلة من الذاكرة المؤقتة» عندما يقل معدل إصابة الذاكرة المؤقتة عن هذه القيمة. معدل الإصابة هو رموز القراءة من الذاكرة المؤقتة (نص يقرؤه النموذج مرة أخرى من ذاكرته المؤقتة بسعر أقل) كحصة من رموز الإدخال والقراءة من الذاكرة المؤقتة والكتابة فيها.',
  "Flags Long-context surcharges when the estimated extra cost of long prompts is at least this share of the user's usage.":
    'تُعلَّم سمة «رسوم إضافية للسياق الطويل» عندما تبلغ التكلفة الإضافية المقدّرة للطلبات الطويلة هذه الحصة على الأقل من استخدام المستخدم.',
  'The Auto discount rate to assume for a plan when the report has no Auto usage to measure it from. A plan whose Auto usage can be priced from tokens uses its measured rate instead. The assumed rate sets the discount missed on hand-picked usage and the Auto savings estimate. It never changes usage, covered or billed amounts.':
    'معدل خصم Auto المفترض لخطة ما عندما لا يحتوي التقرير على استخدام Auto يمكن القياس منه. الخطة التي يمكن تسعير استخدام Auto فيها من الرموز تستخدم المعدل المقيس بدلًا منه. يحدد المعدل المفترض الخصم الفائت على الاستخدام المختار يدويًا وتقدير التوفير من Auto. ولا يغيّر أبدًا مبالغ الاستخدام أو المشمول أو المدفوع إضافيًا.',
  'How many users the top-user charts and the executive summary list.': 'عدد المستخدمين في مخططات أعلى المستخدمين والملخص التنفيذي.',

  // Settings file messages
  '{name}: expected an object': '{name}: يجب أن يكون كائنًا',
  '{name}: "{key}" must be a fraction from {min} to {max}': '{name}: يجب أن يكون "{key}" كسرًا من {min} إلى {max}',
  '{name}: the values must increase from "{first}" to "{last}"': '{name}: يجب أن تتزايد القيم من "{first}" إلى "{last}"',
  'use a fraction from {min} to {max}': 'استخدم كسرًا من {min} إلى {max}',
  'use an amount from {min} to {max}': 'استخدم مبلغًا من {min} إلى {max}',
  'use a whole number from {min} to {max}': 'استخدم عددًا صحيحًا من {min} إلى {max}',
  'Model price overrides: expected an object': 'تعديلات أسعار النماذج: يجب أن تكون كائنًا',
  'Model price overrides: {n} entries could not be read and were left out': plural(
    'تعديلات أسعار النماذج: تعذّرت قراءة إدخال واحد فاستُبعد',
    'تعديلات أسعار النماذج: تعذّرت قراءة إدخالين فاستُبعدا',
    'تعديلات أسعار النماذج: تعذّرت قراءة {n} إدخالات فاستُبعدت',
    'تعديلات أسعار النماذج: تعذّرت قراءة {n} إدخالًا فاستُبعدت',
    'تعديلات أسعار النماذج: تعذّرت قراءة {n} إدخال فاستُبعدت',
  ),
  'License list: expected a list': 'قائمة التراخيص: يجب أن تكون قائمة',
  'License list: {n} entries without a usable username left out': plural(
    'قائمة التراخيص: استُبعد إدخال واحد بلا اسم مستخدم صالح',
    'قائمة التراخيص: استُبعد إدخالان بلا اسم مستخدم صالح',
    'قائمة التراخيص: استُبعدت {n} إدخالات بلا اسم مستخدم صالح',
    'قائمة التراخيص: استُبعد {n} إدخالًا بلا اسم مستخدم صالح',
    'قائمة التراخيص: استُبعد {n} إدخال بلا اسم مستخدم صالح',
  ),
  'License list: {n} duplicates left out': plural(
    'قائمة التراخيص: استُبعد تكرار واحد',
    'قائمة التراخيص: استُبعد تكراران',
    'قائمة التراخيص: استُبعدت {n} تكرارات',
    'قائمة التراخيص: استُبعد {n} تكرارًا',
    'قائمة التراخيص: استُبعد {n} تكرار',
  ),
  'License list: {n} plan values could not be read and were left empty': 'قائمة التراخيص: عدد قيم الخطط التي تعذّرت قراءتها وتُركت فارغة: {n}',
  'Unknown settings left out: {names} and {n} more': 'استُبعدت إعدادات غير معروفة: {names} و{n} غيرها',
  'Unknown settings left out: {names}': 'استُبعدت إعدادات غير معروفة: {names}',
  'Active-day threshold: use an amount from {min} to {max}': 'حد يوم النشاط: استخدم مبلغًا من {min} إلى {max}',
  '{name}: {expected}': '{name}: {expected}',
  'Monthly budget: use an amount above 0, or null for no budget': 'الميزانية الشهرية: استخدم مبلغًا أكبر من 0، أو null لعدم تحديد ميزانية',
  'Extra seats: expected an object': 'التراخيص الإضافية: يجب أن تكون كائنًا',
  'Extra Business seats: use a whole number from 0 to {max}': 'تراخيص Business الإضافية: استخدم عددًا صحيحًا من 0 إلى {max}',
  'Extra Enterprise seats: use a whole number from 0 to {max}': 'تراخيص Enterprise الإضافية: استخدم عددًا صحيحًا من 0 إلى {max}',
  'License list date: use a day written as YYYY-MM-DD': 'تاريخ قائمة التراخيص: استخدم يومًا مكتوبًا بالصيغة YYYY-MM-DD',
  'This file is not valid JSON.': 'هذا الملف ليس JSON صالحًا.',
  'The file must hold a settings object, not a list or a single value.': 'يجب أن يحتوي الملف على كائن إعدادات، لا على قائمة أو قيمة مفردة.',
  'No known settings were found in this file.': 'لم يُعثر على إعدادات معروفة في هذا الملف.',
  'Minimal tier limit': 'حد شريحة ضئيل',
  'Light tier limit': 'حد شريحة خفيف',
  'Core tier limit': 'حد شريحة أساسي',
  'Power tier limit': 'حد شريحة مكثف',
  'Occasional engagement cutoff': 'حد التفاعل المتقطع',
  'Regular engagement cutoff': 'حد التفاعل المنتظم',
  'Daily engagement cutoff': 'حد التفاعل اليومي',
  'Pareto class A cutoff': 'حد فئة باريتو A',
  'Pareto class B cutoff': 'حد فئة باريتو B',
  none: 'لا شيء',
  empty: 'فارغة',
  'Extra Business seats': 'تراخيص Business الإضافية',
  'Extra Enterprise seats': 'تراخيص Enterprise الإضافية',
  'Model price overrides': 'تعديلات أسعار النماذج',
  '{label}: contents changed': '{label}: تغيّر المحتوى',
  '{label}: {from} to {to}': '{label}: من {from} إلى {to}',

  // Validation
  '"{name}" must be above "{other}" ({value}).': 'يجب أن يكون "{name}" أعلى من "{other}" ({value}).',
  '"{name}" must be below "{other}" ({value}).': 'يجب أن يكون "{name}" أقل من "{other}" ({value}).',
  '"{name}" must be below "{other}" ({value}). Raise that setting first, or enter a lower value.':
    'يجب أن يكون "{name}" أقل من "{other}" ({value}). ارفع ذلك الإعداد أولًا، أو أدخل قيمة أقل.',
  '"{name}" must be above "{other}" ({value}). Lower that setting first, or enter a higher value.':
    'يجب أن يكون "{name}" أعلى من "{other}" ({value}). اخفض ذلك الإعداد أولًا، أو أدخل قيمة أعلى.',
  '{value}, the default': '{value}، القيمة الافتراضية',
  'Auto use limits: "{low}" ({lowValue}) must be below "{first}" ({firstValue}). "{low}" and "{first}" were left out.':
    'حدود استخدام Auto: يجب أن يكون "{low}" ({lowValue}) أقل من "{first}" ({firstValue}). استُبعد "{low}" و"{first}".',
  'Auto use limits: "{low}" ({lowValue}) must be below "{first}" ({firstValue}). "{name}" was left out.':
    'حدود استخدام Auto: يجب أن يكون "{low}" ({lowValue}) أقل من "{first}" ({firstValue}). استُبعد "{name}".',

  // Glossary: money, tokens, seats and the pool
  '{credits} credits ({usd})': '{credits} رصيد ({usd})',
  'Usage (gross)': 'الاستخدام (الإجمالي)',
  'The value of the AI credits that were used, before any included credits are applied. It is the gross_amount column of the report, and it drives the tiers, the rankings and the savings estimates. Auto rows are already reduced by the Auto discount, so usage is the amount charged, not the original price.':
    'قيمة أرصدة الذكاء الاصطناعي المستخدمة قبل خصم أي أرصدة مشمولة. وهي العمود gross_amount في التقرير، وعليها تُبنى الشرائح والترتيب وتقديرات التوفير. صفوف Auto مخفّضة أصلًا بخصم Auto، لذا فالاستخدام هو المبلغ المحتسب وليس السعر الأصلي.',
  'Billed (net)': 'المدفوع إضافيًا (الصافي)',
  'The part of usage that the included credits did not cover. It is billed on top of the seat prices and is the net_amount column of the report.':
    'الجزء من الاستخدام الذي لم تغطه الأرصدة المشمولة. يُدفع فوق أسعار التراخيص، وهو العمود net_amount في التقرير.',
  'Covered by included credits (discount)': 'المشمول بالأرصدة المشمولة (الخصم)',
  'The part of usage paid for by the included credits of the seats. It is the discount_amount column, and usage equals covered plus billed. It is not a price reduction and it is not the Auto discount.':
    'الجزء من الاستخدام الذي غطته الأرصدة المشمولة في التراخيص. وهو العمود discount_amount، والاستخدام يساوي المشمول مضافًا إليه المدفوع إضافيًا. وهو ليس تخفيضًا في السعر وليس خصم Auto.',
  'The unit that GitHub Copilot usage is counted in. One AI credit is worth $0.01, so 100 credits are $1, and the quantity column of the report counts credits.':
    'الوحدة التي يُحسب بها استخدام GitHub Copilot. قيمة رصيد الذكاء الاصطناعي الواحد $0.01، فتساوي 100 رصيد $1، والعمود quantity في التقرير يعدّ الأرصدة.',
  'Estimated monthly cost': 'التكلفة الشهرية المقدّرة',
  'The larger of the pool size and the usage in a month. Seat prices equal the value of their included credits, so the pool size is the seat cost and only usage above the pool is billed on top. Cash savings are the difference in this cost before and after a change, so cutting usage saves money only above the pool, and removing seats shrinks the pool.':
    'الأكبر بين حجم الرصيد المشترك والاستخدام في الشهر. أسعار التراخيص تساوي قيمة أرصدتها المشمولة، فحجم الرصيد المشترك هو تكلفة التراخيص، ولا يُدفع إضافيًا إلا الاستخدام الذي يتجاوز الرصيد المشترك. التوفير النقدي هو الفرق في هذه التكلفة قبل التغيير وبعده، لذا فخفض الاستخدام لا يوفر مالًا إلا فوق الرصيد المشترك، وإزالة التراخيص تصغّر الرصيد المشترك.',
  'Text the model read that was not served from the cache: new prompts, files and conversation history. It is the input column of the report and is charged at the full input rate.':
    'النص الذي قرأه النموذج ولم يأتِ من الذاكرة المؤقتة: الطلبات الجديدة والملفات وسجل المحادثة. وهو العمود input في التقرير، ويُحتسب بسعر الإدخال الكامل.',
  'Prompt text the model had already seen and could read from its cache. It is the cache_read column of the report and is charged at a much lower rate than fresh input. The cache hit rate is built from it.':
    'نص الطلب الذي سبق أن رآه النموذج وأمكنه قراءته من ذاكرته المؤقتة. وهو العمود cache_read في التقرير، ويُحتسب بسعر أقل بكثير من الإدخال الجديد. ومنه يُحسب معدل الإصابة في الذاكرة المؤقتة.',
  'Prompt text that the model stored in its cache so that later requests can reuse it. It is the cache_write column of the report. Some models charge a separate rate for it and others charge nothing extra.':
    'نص الطلب الذي خزّنه النموذج في ذاكرته المؤقتة لتعيد الطلبات اللاحقة استخدامه. وهو العمود cache_write في التقرير. بعض النماذج تحتسب له سعرًا منفصلًا وبعضها لا يحتسب شيئًا إضافيًا.',
  'Text the model wrote back: answers, code and reasoning. It is the output column of the report. Each model has its own rate for it, separate from the rate for input tokens.':
    'النص الذي كتبه النموذج في رده: الإجابات والشيفرة والاستدلال. وهو العمود output في التقرير. لكل نموذج سعره الخاص له، منفصلًا عن سعر رموز الإدخال.',
  'Included credits and the pool': 'الأرصدة المشمولة والرصيد المشترك',
  'Each seat includes credits every month: {business} for Business and {enterprise} for Enterprise. The credits of all seats are pooled, so a user can go past their own share at no charge, and billing starts only when the pool is used up. The pool also counts the seats in the license list and the extra seats from the License list section, when no filter is set.':
    'يشمل كل ترخيص أرصدة كل شهر: {business} لخطة Business و{enterprise} لخطة Enterprise. تُجمع أرصدة كل التراخيص في رصيد مشترك، فيمكن للمستخدم تجاوز حصته دون رسوم، ولا يبدأ الدفع الإضافي إلا عند نفاد الرصيد المشترك. ويحسب الرصيد المشترك أيضًا التراخيص الموجودة في قائمة التراخيص والتراخيص الإضافية من قسم قائمة التراخيص، عندما لا يكون هناك عامل تصفية.',
  'Allotment': 'الحصة',
  "A user's own share of the pool: the included credits of their seat in each month they appear in the report, in dollars. When the report has no seat size for a user, the most common seat size in the report is used.":
    'حصة المستخدم من الرصيد المشترك: الأرصدة المشمولة في ترخيصه عن كل شهر يظهر فيه في التقرير، بالدولار. عندما لا يذكر التقرير حجم ترخيص المستخدم، يُستخدم حجم الترخيص الأكثر شيوعًا في التقرير.',
  'Utilization': 'نسبة الاستخدام',
  'For a user, usage divided by their allotment, so 100% means they used exactly their own share. For the pool, the covered credits divided by the pool size. The pool figure is not shown when the pool size cannot be worked out from the report.':
    'للمستخدم: الاستخدام مقسومًا على حصته، فتعني 100% أنه استخدم حصته بالضبط. وللرصيد المشترك: الأرصدة المشمولة المستخدمة مقسومة على حجم الرصيد المشترك. لا تظهر نسبة الرصيد المشترك عندما يتعذر حساب حجمه من التقرير.',
  "A user's allotment minus their usage. A positive balance means the user left credits in the pool for others, and a negative balance means the user drew on the pool.":
    'حصة المستخدم مطروحًا منها استخدامه. الرصيد الموجب يعني أن المستخدم ترك أرصدة في الرصيد المشترك لغيره، والرصيد السالب يعني أنه سحب من الرصيد المشترك.',
  "The plan of a seat, read from the user's monthly quota in the report. Business is {business}, Enterprise is {enterprise}, and any other quota shows as Custom with its credits, valued at $0.01 each. A seat in the license list uses the plan from the list, or the most common plan in the report when none is given.":
    'خطة الترخيص، وتُقرأ من الحصة الشهرية للمستخدم في التقرير. خطة Business هي {business}، وخطة Enterprise هي {enterprise}، وأي حصة أخرى تظهر كخطة مخصصة مع أرصدتها، بقيمة $0.01 لكل رصيد. الترخيص الموجود في قائمة التراخيص يأخذ الخطة من القائمة، أو الخطة الأكثر شيوعًا في التقرير إذا لم تُذكر.',
  'Idle seat': 'ترخيص خامل',
  'A seat whose user is in the Minimal tier and is Dormant or Lapsed. Reclaiming it saves the seat price of its plan.':
    'ترخيص مستخدمه في الشريحة الضئيلة وهو خامل أو متوقف. استرداده يوفر سعر الترخيص في خطته.',
  'Downgrade candidate': 'مرشح لخفض الخطة',
  'An Enterprise user who is not idle or new and whose highest month of usage stayed at or below {headroom} of a Business allotment ({allotment}). Moving them to Business saves {saving} a month per seat.':
    'مستخدم Enterprise ليس خاملًا ولا جديدًا، وبقي أعلى شهر استخدام لديه عند {headroom} أو أقل من حصة Business ({allotment}). نقله إلى Business يوفر {saving} في الشهر لكل ترخيص.',
  'Unused seat': 'ترخيص غير مستخدم',
  'A seat in the license list whose user never appears in the report, so it is paid for with no AI-credit usage. Its value is the price of its plan.':
    'ترخيص في قائمة التراخيص لا يظهر مستخدمه في التقرير أبدًا، فهو مدفوع دون أي استخدام لأرصدة الذكاء الاصطناعي. قيمته هي سعر خطته.',

  // Glossary: activity, classification, Auto model selection
  "A day on which a user's usage adds up to at least {amount}. The amount is set under Classification thresholds.":
    'يوم يبلغ فيه استخدام المستخدم {amount} على الأقل. يُضبط هذا المبلغ في حدود التصنيف.',
  'A day with any usage row for the user, because the active-day amount is set to $0.': 'أي يوم فيه صف استخدام للمستخدم، لأن مبلغ يوم النشاط مضبوط على $0.',
  "The share of workdays on which a user was active. Workdays are Monday to Friday, counted from the user's first day in the report, or the start of the period in view if that is later, up to the end of the period. The count is at least 5 workdays, and the rate never goes above 100%.":
    'نسبة أيام العمل التي كان فيها المستخدم نشطًا. أيام العمل من الاثنين إلى الجمعة، وتُعدّ من أول يوم للمستخدم في التقرير، أو من بداية الفترة المعروضة إن كانت لاحقة، حتى نهاية الفترة. لا يقل العدد عن 5 أيام عمل، ولا تتجاوز النسبة 100% أبدًا.',
  'How often a user is active, from the active rate: Daily at {daily} of workdays or more, Regular from {regular}, Occasional from {occasional}, and Rare below that.':
    'مدى تكرار نشاط المستخدم، بحسب نسبة النشاط: يومي عند {daily} من أيام العمل أو أكثر، ومنتظم من {regular}، ومتقطع من {occasional}، ونادر دون ذلك.',
  'New and lapsed users': 'المستخدمون الجدد والمتوقفون',
  'A user is New when their first day in the report is within the last {newDays} of the period in view and at least {newDays} after the report starts, so people who were already active at the start are not new. A user is Lapsed when they are not new and have had no usage for the last {lapsedDays} or more.':
    'يكون المستخدم جديدًا عندما يقع أول يوم له في التقرير ضمن آخر {newDays} من الفترة المعروضة، وبعد بداية التقرير بمدة {newDays} على الأقل، فمن كان نشطًا منذ البداية لا يُعدّ جديدًا. ويكون المستخدم متوقفًا عندما لا يكون جديدًا ولم يكن له استخدام في آخر {lapsedDays} أو أكثر.',
  "A user's usage divided by their active days. It compares what a day of use costs across users, and it shows as a dash when the user has no active day.":
    'استخدام المستخدم مقسومًا على أيام نشاطه. يقارن تكلفة يوم الاستخدام بين المستخدمين، ويظهر كشَرطة عندما لا يكون للمستخدم أي يوم نشاط.',
  'Usage in the report with no username, such as repository-level usage. It is part of the totals, but it belongs to no user, so it has no tier, persona or seat.':
    'استخدام في التقرير بلا اسم مستخدم، مثل الاستخدام على مستوى المستودع. وهو جزء من المجاميع، لكنه لا ينتمي إلى أي مستخدم، فليس له شريحة ولا نمط مستخدم ولا ترخيص.',
  'Spend tier': 'شريحة الإنفاق',
  "A band for a user's utilization: Minimal below {minimal}, Light from {minimal} to {light}, Core from {light} to {core}, Power from {core} to {power}, and Runaway at {power} or more. Core is the range in which the included credits of a seat are well used.":
    'نطاق لنسبة استخدام المستخدم: ضئيل دون {minimal}، وخفيف من {minimal} إلى {light}، وأساسي من {light} إلى {core}، ومكثف من {core} إلى {power}، ومفرط عند {power} أو أكثر. الأساسي هو النطاق الذي تُستخدم فيه الأرصدة المشمولة في الترخيص استخدامًا جيدًا.',
  'Each user gets one label, checked in this order: Runaway users (the Runaway tier), New users, then Lapsed users. Everyone else is split by two tests: active on at least {regular} of workdays, and utilization of at least {light}. Passing both makes a Champion, utilization only makes a Burst user, activity only makes a Steady light user, and neither makes a Dormant user.':
    'يحصل كل مستخدم على تصنيف واحد، ويُفحص بهذا الترتيب: المستخدمون المفرطون (الشريحة المفرطة)، ثم المستخدمون الجدد، ثم المستخدمون المتوقفون. ويُقسَم الباقون باختبارين: النشاط في {regular} من أيام العمل على الأقل، ونسبة استخدام {light} على الأقل. من يجتاز الاثنين من الروّاد، ومن يجتاز نسبة الاستخدام وحدها مستخدم على دفعات، ومن يجتاز النشاط وحده مستخدم منتظم باستخدام خفيف، ومن لا يجتاز أيًّا منهما مستخدم خامل.',
  'How a user splits usage across model tiers. A user is Frontier-heavy when at least {frontier} of their usage is on Powerful models, otherwise Efficient when at least {efficient} is on Versatile and Lightweight models, and Balanced when neither holds.':
    'كيف يوزّع المستخدم استخدامه على فئات النماذج. يكون المستخدم معتمدًا على النماذج القوية عندما يكون {frontier} من استخدامه على الأقل على النماذج القوية، وإلا يكون موفّرًا عندما يكون {efficient} على الأقل على النماذج متعددة الاستخدامات والخفيفة، ومتوازنًا عندما لا يتحقق أيٌّ منهما.',
  'Users sorted by usage, highest first, and grouped by the running share of total usage. Class A is the users who together make up the first {a}, class B the next {b} and class C the last {c}. A user whose usage carries the running share over a cutoff stays in the earlier class.':
    'المستخدمون مرتبون حسب الاستخدام من الأعلى، ومجمّعون حسب الحصة التراكمية من إجمالي الاستخدام. الفئة A هي المستخدمون الذين يشكلون معًا أول {a}، والفئة B الـ {b} التالية، والفئة C آخر {c}. المستخدم الذي يتخطى استخدامُه بالحصة التراكمية حدًّا فاصلًا يبقى في الفئة السابقة.',
  'A label for what kind of work a model suits: Powerful for hard reasoning, Versatile for everyday work and Lightweight for small, fast and low-cost tasks. Right-sizing moves usage only away from Powerful models that have a price, and the usage profile counts usage by tier. A model with no tier is Unknown, and its usage counts toward neither side of the profile.':
    'تصنيف لنوع العمل الذي يناسبه النموذج: قوي للاستدلال الصعب، ومتعدد الاستخدامات للعمل اليومي، وخفيف للمهام الصغيرة والسريعة منخفضة التكلفة. اختيار النموذج المناسب ينقل الاستخدام فقط بعيدًا عن النماذج القوية التي لها سعر، وملف الاستخدام يعدّ الاستخدام حسب الفئة. النموذج الذي ليس له فئة يكون غير معروف، ولا يُحسب استخدامه في أي جانب من ملف الاستخدام.',
  "The share of a user's usage that went through Auto model selection, where GitHub Copilot picks the model for each request. It is usage on Auto rows divided by total usage. Without a model column Auto cannot be told apart, and the share is shown as unknown.":
    'حصة استخدام المستخدم التي مرت عبر الاختيار التلقائي للنموذج (Auto)، حيث يختار GitHub Copilot النموذج لكل طلب. وهي الاستخدام في صفوف Auto مقسومًا على إجمالي الاستخدام. بدون عمود النموذج لا يمكن تمييز Auto، فتظهر الحصة على أنها غير معروفة.',
  'How much cheaper the Auto usage was than the same tokens at the original price of the models. The report has no column for it, so the app measures it by comparing the amount charged with the price card. A plan with no Auto usage to measure from uses the Auto model discount setting ({rate} now), and that rate is called assumed. It is not the discount_amount column, which holds the included credits.':
    'مقدار ما كان استخدام Auto أرخص من الرموز نفسها بالسعر الأصلي للنماذج. ليس في التقرير عمود له، فيقيسه التطبيق بمقارنة المبلغ المحتسب بقائمة الأسعار. الخطة التي ليس فيها استخدام Auto يُقاس منه تستخدم إعداد خصم نموذج Auto ({rate} حاليًا)، ويُسمى هذا المعدل مفترضًا. وهو ليس العمود discount_amount، الذي يحمل الأرصدة المشمولة.',
  'What the same Auto usage would have cost at the original price of the models on the price card, without the Auto discount. It is the Auto usage in the report plus the Auto discount received, and it is not an amount on an invoice.':
    'ما كانت ستكلفه استخدامات Auto نفسها بالسعر الأصلي للنماذج في قائمة الأسعار، دون خصم Auto. وهي استخدام Auto في التقرير مضافًا إليه خصم Auto المستلم، وليست مبلغًا في فاتورة.',
  "What the Auto discount would have been on the usage that a user sent to models they picked by hand, had it gone through Auto. It is that usage times the Auto discount rate of the user's plan. It is a potential saving, not money that was lost.":
    'ما كان سيبلغه خصم Auto على الاستخدام الذي أرسله المستخدم إلى نماذج اختارها يدويًا، لو مرّ عبر Auto. وهو ذلك الاستخدام مضروبًا في معدل خصم Auto لخطة المستخدم. وهو توفير محتمل، وليس مالًا ضائعًا.',
  'Where a user sits between Auto and models picked by hand. Auto-first: {autoFirst} or more of their usage goes through Auto. Direct models: less than {lowAuto}. Mixed: in between. Not enough data: the report has no model column, or the user has no usage. Both limits are set under Classification thresholds, and the lower one must stay below the upper one.':
    'موقع المستخدم بين Auto والنماذج المختارة يدويًا. يعتمد على Auto: يمر {autoFirst} أو أكثر من استخدامه عبر Auto. نماذج مباشرة: أقل من {lowAuto}. مختلط: بين الحدين. لا توجد بيانات كافية: ليس في التقرير عمود النموذج، أو ليس للمستخدم استخدام. يُضبط الحدان في حدود التصنيف، ويجب أن يبقى الحد الأدنى أقل من الحد الأعلى.',

  // Glossary: traits, savings and efficiency, trends and projections
  'Labels for habits that a user can have in any combination. Most need at least {min} of usage, so that small accounts are not flagged. Each trait is listed below.':
    'تصنيفات لعادات يمكن أن تجتمع لدى المستخدم بأي تركيبة. يحتاج معظمها إلى {min} من الاستخدام على الأقل، حتى لا تُعلَّم الحسابات الصغيرة. كل سمة مذكورة أدناه.',
  'Cache hit rate below {rate}, so context is paid for again instead of being read from the cache. It needs at least {min} of usage, with at least half of it on models that have a price.':
    'معدل إصابة في الذاكرة المؤقتة أقل من {rate}، فيُدفع ثمن السياق مرة أخرى بدل قراءته من الذاكرة المؤقتة. تحتاج إلى {min} من الاستخدام على الأقل، نصفه على الأقل على نماذج لها سعر.',
  "At least {share} of the user's usage is long-context premium. It needs at least {min} of usage.":
    '{share} على الأقل من استخدام المستخدم هو علاوة السياق الطويل. تحتاج إلى {min} من الاستخدام على الأقل.',
  "One day makes up at least {share} of the user's usage. It needs at least {min} of usage and at least 3 active days.":
    'يوم واحد يشكل {share} على الأقل من استخدام المستخدم. تحتاج إلى {min} من الاستخدام على الأقل و3 أيام نشاط على الأقل.',
  "Less than {lowAuto} of the user's usage goes through Auto model selection, the same limit that puts a user in the Direct models class. The trait needs at least {min} of usage and a model column in the report.":
    'أقل من {lowAuto} من استخدام المستخدم يمر عبر الاختيار التلقائي للنموذج (Auto)، وهو الحد نفسه الذي يضع المستخدم في فئة النماذج المباشرة. تحتاج السمة إلى {min} من الاستخدام على الأقل وإلى عمود النموذج في التقرير.',
  'The user used four or more different models in the period.': 'استخدم المستخدم أربعة نماذج مختلفة أو أكثر في الفترة.',
  'Usage in the last 7 days is at least 1.5 times the 7 days before. It needs a period of 14 days or more and at least {min} in the last 7 days, and a user with nothing in the 7 days before counts unless they are new.':
    'الاستخدام في آخر 7 أيام يبلغ 1.5 ضعف الأيام السبعة التي قبلها على الأقل. تحتاج إلى فترة 14 يومًا أو أكثر و{min} على الأقل في آخر 7 أيام، ويُحتسب المستخدم الذي لم يكن له شيء في الأيام السبعة السابقة ما لم يكن جديدًا.',
  'Usage in the last 7 days is half or less of the 7 days before. It needs a period of 14 days or more and at least {min} in the 7 days before.':
    'الاستخدام في آخر 7 أيام نصف الأيام السبعة التي قبلها أو أقل. تحتاج إلى فترة 14 يومًا أو أكثر و{min} على الأقل في الأيام السبعة السابقة.',
  'The user has no cost center, in a report where other users do. It is not used when the report has no cost centers at all.':
    'ليس للمستخدم مركز تكلفة، في تقرير لغيره من المستخدمين مراكز تكلفة. لا تُستخدم عندما لا يحتوي التقرير على مراكز تكلفة إطلاقًا.',
  "The share of a user's prompt tokens that were read from the cache: cache read tokens divided by input, cache read and cache write tokens. It shows as a dash when the report has no token columns.":
    'حصة رموز طلبات المستخدم التي قُرئت من الذاكرة المؤقتة: رموز القراءة من الذاكرة المؤقتة مقسومة على مجموع رموز الإدخال والقراءة من الذاكرة المؤقتة والكتابة في الذاكرة المؤقتة. تظهر كشَرطة عندما لا يحتوي التقرير على أعمدة الرموز.',
  'The extra cost billed when a prompt is longer than the long-context threshold of a model. The app estimates it from token counts, and only for models that have a price and a long-context rate, so it is a lower bound.':
    'التكلفة الإضافية المحتسبة عندما يكون الطلب أطول من حد السياق الطويل للنموذج. يقدّرها التطبيق من أعداد الرموز، وفقط للنماذج التي لها سعر وسعر للسياق الطويل، فهي حد أدنى.',
  'Potential savings and levers': 'التوفير المحتمل وتغييرات العادات',
  'Usage that habit changes could avoid, from six levers: right-size models, use Auto model selection, cache discipline, leaner context, avoid long-context surcharges and cap runaway users. The levers are applied one after the other, each on what is left, so the same usage is never counted twice, and the shares can be changed in the simulator on the Recommendations page. The Auto lever applies the Auto discount rate of each plan: the rate measured in the report or, for a plan with no Auto usage to measure from, {rate} from the Auto model discount setting. All of it is an estimate of usage, not of cash.':
    'الاستخدام الذي يمكن تجنبه بتغيير العادات، من ستة تغييرات: اختيار النموذج المناسب، واستخدام الاختيار التلقائي للنموذج (Auto)، والاستفادة من الذاكرة المؤقتة، وسياق أخف، وتجنب رسوم السياق الطويل الإضافية، ووضع حد للمستخدمين المفرطين. تُطبق التغييرات واحدًا بعد الآخر، كلٌّ على ما تبقى، فلا يُحسب الاستخدام نفسه مرتين، ويمكن تعديل النسب في المحاكي في صفحة التوصيات. يطبق تغيير Auto معدل خصم Auto لكل خطة: المعدل المقيس في التقرير، أو {rate} من إعداد خصم نموذج Auto للخطة التي ليس فيها استخدام Auto يُقاس منه. وكل ذلك تقدير للاستخدام، وليس للنقد.',
  'A score from 0 to 100 for one user: 100 minus the share of their usage that the savings levers could remove. A score of 100 means no savings were found, and a user with no usage scores 100.':
    'درجة من 0 إلى 100 لكل مستخدم: 100 مطروحًا منها حصة استخدامه التي يمكن أن تزيلها تغييرات التوفير. الدرجة 100 تعني أنه لم يُعثر على توفير، والمستخدم الذي ليس له استخدام يحصل على 100.',
  'Anomaly day': 'يوم غير معتاد',
  'A day with usage far above the typical day. It is flagged when it is at least 1.5 times the median day and has a modified z-score of 3.5 or more, which compares it with the usual spread of days using the median absolute deviation. The check needs at least 10 days with usage and lists at most 6 days.':
    'يوم استخدامه أعلى بكثير من اليوم المعتاد. يُعلَّم عندما يبلغ 1.5 ضعف اليوم الوسيط على الأقل ويكون له z-score معدّل 3.5 أو أكثر، وهو يقارنه بالتشتت المعتاد للأيام باستخدام الانحراف المطلق الوسيط. يحتاج الفحص إلى 10 أيام فيها استخدام على الأقل، ويعرض 6 أيام على الأكثر.',
  'Projection (low, mid, high)': 'التوقع (منخفض، متوسط، مرتفع)',
  'An estimate for the rest of the latest month, made only when that month is not finished: usage so far plus the days left times a daily rate. Low uses the lower of two daily rates (the month-to-date average and the average of the last 7 days), High uses the higher one, and Mid uses their average. Projected billed usage is whatever goes above the pool, and once the pool is used up all further usage is billed.':
    'تقدير لبقية أحدث شهر، ولا يُحسب إلا إذا لم ينتهِ ذلك الشهر: الاستخدام حتى الآن مضافًا إليه الأيام المتبقية مضروبة في معدل يومي. المنخفض يستخدم الأقل من معدلين يوميين (متوسط الشهر حتى الآن ومتوسط آخر 7 أيام)، والمرتفع يستخدم الأعلى، والمتوسط يستخدم متوسطهما. الاستخدام المتوقع دفعه إضافيًا هو ما يتجاوز الرصيد المشترك، وبعد نفاد الرصيد المشترك يُدفع كل استخدام لاحق إضافيًا.',
};

export default arabic;
