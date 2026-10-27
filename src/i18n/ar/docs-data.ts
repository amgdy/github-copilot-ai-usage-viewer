import type { Dict } from '../core';

/** Arabic for the Data page metric docs in `lib/metrics/docs/data.ts`. Titles shared with the page live in `data.ts`. */
const arabic: Dict = {
  // Files and columns
  'The number of CSV files you loaded together. Every number in the app is built from the rows of these files.':
    'عدد ملفات CSV التي حمّلتها معًا. كل رقم في التطبيق مبني من صفوف هذه الملفات.',
  'Files = number of files read in the last load': 'الملفات = عدد الملفات المقروءة في آخر تحميل',
  'Loading replaces the data. Files from an earlier load are not kept.': 'التحميل يستبدل البيانات. لا تُحفظ ملفات التحميل السابق.',
  'The files are read in the order you picked them. When two files hold the same row, the first file keeps it.':
    'تُقرأ الملفات بالترتيب الذي اخترتها به. عندما يحتوي ملفان على الصف نفسه، يحتفظ به الملف الأول.',
  'If one file cannot be read, nothing is loaded and the data from before stays. A file needs a date column and either a gross_amount or a quantity column.':
    'إذا تعذّرت قراءة ملف واحد، لا يُحمّل شيء وتبقى البيانات السابقة. يحتاج الملف إلى عمود تاريخ وإلى عمود gross_amount أو quantity.',
  'A file counts even when all its rows were dropped. Its Rows kept is then 0.': 'يُحسب الملف حتى لو حُذفت كل صفوفه. وتكون الصفوف المحتفظ بها عندئذ 0.',
  'The count says nothing about the period or the people the files cover. The Date span and Users numbers show that.':
    'العدد لا يقول شيئًا عن الفترة أو الأشخاص الذين تغطيهم الملفات. يُظهر ذلك رقما المدة الزمنية والمستخدمين.',
  'The line under the number adds up the sizes of the files.': 'السطر تحت الرقم يجمع أحجام الملفات.',
  'Three monthly exports of the same enterprise show 3 files.': 'ثلاثة ملفات شهرية مصدّرة لحساب المؤسسة نفسه تُظهر 3 ملفات.',
  'How big each file is. It helps you tell the files apart and spot one that is much smaller than the others.':
    'حجم كل ملف. يساعدك على التمييز بين الملفات وملاحظة ملف أصغر بكثير من غيره.',
  'File size = number of bytes the browser reports for the file': 'حجم الملف = عدد البايتات التي يذكرها المتصفح للملف',
  'It is shown in KB, MB or GB, where 1 KB is 1,024 bytes. The total adds up all the files.': 'يُعرض بوحدة KB أو MB أو GB، حيث 1 KB يساوي 1,024 بايت. الإجمالي يجمع كل الملفات.',
  'A bigger file does not mean more usage. Rows kept and Total usage show how much a file holds.':
    'الملف الأكبر لا يعني استخدامًا أكثر. الصفوف المحتفظ بها وإجمالي الاستخدام يُظهران ما يحتويه الملف.',
  'A file of 1,572,864 bytes is shown as 1.50 MB.': 'الملف الذي حجمه 1,572,864 بايت يُعرض على أنه 1.50 MB.',
  'Columns found': 'الأعمدة الموجودة',
  'How the app finds each column in the first line of a file. It knows the names used by the GitHub report and a few common alternatives, so a renamed export still loads.':
    'كيف يجد التطبيق كل عمود في السطر الأول من الملف. يعرف الأسماء التي يستخدمها تقرير GitHub وبعض البدائل الشائعة، لذا يُحمّل الملف المصدّر حتى لو تغيرت أسماء أعمدته.',
  'Column found = a header that, once cleaned up, is exactly one of the names the app accepts for that column':
    'عمود موجود = عنوان يطابق تمامًا، بعد تنظيفه، أحد الأسماء التي يقبلها التطبيق لذلك العمود',
  'Each header is cleaned up. The byte order mark and the spaces at the ends are removed, letters become lower case, and every run of other characters becomes one underscore. "Gross Amount" becomes gross_amount.':
    'يُنظّف كل عنوان. تُزال علامة ترتيب البايتات والمسافات في الطرفين، وتصبح الأحرف صغيرة، وتتحول كل سلسلة من الأحرف الأخرى إلى شرطة سفلية واحدة. فيصبح "Gross Amount" بالشكل gross_amount.',
  'For each column the app tries its accepted names in a fixed order. The first name that matches a header wins. For the date the names are date, usage_date, day and usagedate.':
    'لكل عمود يجرّب التطبيق أسماءه المقبولة بترتيب ثابت. أول اسم يطابق عنوانًا هو المعتمد. أسماء التاريخ هي date وusage_date وday وusagedate.',
  'A file is rejected when it has no date column, or has neither a gross_amount nor a quantity column. Then nothing is loaded and the data from before stays.':
    'يُرفض الملف عندما لا يكون فيه عمود تاريخ، أو لا يكون فيه عمود gross_amount ولا quantity. عندئذ لا يُحمّل شيء وتبقى البيانات السابقة.',
  'Columns are found by name only. A column that is found but holds no values still counts as found.':
    'تُعرف الأعمدة بأسمائها فقط. العمود الموجود الذي لا يحتوي على قيم يُحسب موجودًا.',
  'When a file has two headers for the same column, only one is read. The other one is listed under Extra columns.':
    'عندما يكون في الملف عنوانان للعمود نفسه، يُقرأ واحد فقط. ويُدرج الآخر ضمن الأعمدة الإضافية.',
  'Other accepted names: usage_date, day and usagedate for date; user, login, user_name, github_username and user_login for username; model_name for model; qty, ai_credits and credits for quantity; unit for unit_type; price_per_unit, unit_price and cost_per_quantity for applied_cost_per_quantity; gross for gross_amount; discount for discount_amount; net for net_amount; monthly_quota and quota for total_monthly_quota; org and organization_name for organization; app for app_client_id; repo and repository_name for repository; cost_center and costcenter for cost_center_name; input_tokens, output_tokens, cache_read_tokens, cached_input and cache_write_tokens for the token columns.':
    'أسماء مقبولة أخرى: usage_date وday وusagedate لـdate؛ وuser وlogin وuser_name وgithub_username وuser_login لـusername؛ وmodel_name لـmodel؛ وqty وai_credits وcredits لـquantity؛ وunit لـunit_type؛ وprice_per_unit وunit_price وcost_per_quantity لـapplied_cost_per_quantity؛ وgross لـgross_amount؛ وdiscount لـdiscount_amount؛ وnet لـnet_amount؛ وmonthly_quota وquota لـtotal_monthly_quota؛ وorg وorganization_name لـorganization؛ وapp لـapp_client_id؛ وrepo وrepository_name لـrepository؛ وcost_center وcostcenter لـcost_center_name؛ وinput_tokens وoutput_tokens وcache_read_tokens وcached_input وcache_write_tokens لأعمدة الرموز.',
  'The unit_type column is recognized but the app does not use it.': 'يتعرّف التطبيق على عمود unit_type لكنه لا يستخدمه.',
  'A file with the headers Date, User, Model, Gross and Notes gives date, username, model and gross_amount. Notes is an extra column, and the other optional columns are missing.':
    'ملف بالعناوين Date وUser وModel وGross وNotes يعطي date وusername وmodel وgross_amount. العمود Notes إضافي، والأعمدة الاختيارية الأخرى ناقصة.',
  'The optional columns that a file does not have. Each one limits something the app can show. The checks on this page say what.':
    'الأعمدة الاختيارية التي لا يحتوي عليها الملف. غياب كل منها يحدّ شيئًا مما يستطيع التطبيق عرضه. تذكر الفحوص في هذه الصفحة ما هو.',
  'Missing columns = optional columns with no matching header in the file': 'الأعمدة الناقصة = الأعمدة الاختيارية التي لا يطابقها أي عنوان في الملف',
  'The app looks for the 17 optional columns listed under "Columns of the report used" in this explanation.':
    'يبحث التطبيق عن الأعمدة الاختيارية الـ17 المذكورة تحت "أعمدة التقرير المستخدمة" في هذا الشرح.',
  'A column is missing when no header of the file matches it once the header is cleaned up. See Columns found.':
    'يكون العمود ناقصًا عندما لا يطابقه أي عنوان في الملف بعد تنظيف العنوان. انظر الأعمدة الموجودة.',
  'The date column and app_client_id are never listed. A file with no date, or with neither gross_amount nor quantity, is rejected.':
    'لا يُدرج عمود التاريخ ولا app_client_id أبدًا. يُرفض الملف الذي ليس فيه تاريخ، أو ليس فيه gross_amount ولا quantity.',
  'When a file has no gross_amount column, usage is worked out as quantity × the unit price, and gross_amount is listed here. When it has no unit price, each AI credit is taken to cost $0.01.':
    'عندما لا يكون في الملف عمود gross_amount، يُحسب الاستخدام بالصيغة الكمية × سعر الوحدة، ويُدرج gross_amount هنا. وعندما لا يكون فيه سعر وحدة، يُفترض أن كل رصيد ذكاء اصطناعي يكلّف $0.01.',
  'The list looks at headers only, so a column with a header and no values is not missing. The Expected columns are present check also warns when every file has a total_monthly_quota column and no row has a value above 0. The Models with prices check says so when no row has a model name.':
    'تنظر القائمة إلى العناوين فقط، لذا العمود الذي له عنوان وليس فيه قيم لا يُعد ناقصًا. ينبّه فحص "الأعمدة المتوقعة موجودة" أيضًا عندما يكون في كل ملف عمود total_monthly_quota ولا يوجد صف بقيمة أكبر من 0. ويذكر فحص "النماذج التي لها أسعار" ذلك عندما لا يوجد صف فيه اسم نموذج.',
  'A file with only the columns date, username, model and gross_amount is missing 14 of the 17 optional columns. The list starts with product, sku and quantity.':
    'الملف الذي فيه الأعمدة date وusername وmodel وgross_amount فقط تنقصه 14 من الأعمدة الاختيارية الـ17. تبدأ القائمة بـproduct وsku وquantity.',
  'The headers of a file that no column of the app uses. The app ignores them, so an extra column never changes a number.':
    'عناوين الملف التي لا يستخدمها أي عمود في التطبيق. يتجاهلها التطبيق، لذا لا يغيّر العمود الإضافي أي رقم.',
  'Extra columns = headers of the file that match no column of the app': 'الأعمدة الإضافية = عناوين الملف التي لا تطابق أي عمود في التطبيق',
  'Each header is cleaned up and matched to the columns of the app. See Columns found.': 'يُنظّف كل عنوان ويُطابق مع أعمدة التطبيق. انظر الأعمدة الموجودة.',
  'A header that was not used is listed in its cleaned-up form. Empty headers are left out.': 'يُدرج العنوان غير المستخدم بشكله بعد التنظيف. تُستبعد العناوين الفارغة.',
  'A second header for a column that was already found is extra too. When a file has both gross_amount and gross, gross_amount is read and gross is listed here.':
    'العنوان الثاني لعمود موجود بالفعل يُعد إضافيًا أيضًا. عندما يكون في الملف gross_amount وgross معًا، يُقرأ gross_amount ويُدرج gross هنا.',
  'A header with a typo, such as usr_name, is listed here, and the column it should have been shows as missing.':
    'العنوان الذي فيه خطأ إملائي، مثل usr_name، يُدرج هنا، ويظهر العمود الذي كان يُفترض أن يكونه على أنه ناقص.',
  'The aic_quantity and aic_gross_amount columns are never listed, and neither is unit_type. The app knows these names and does not use them.':
    'لا يُدرج العمودان aic_quantity وaic_gross_amount أبدًا، ولا unit_type. يعرف التطبيق هذه الأسماء ولا يستخدمها.',
  'A file with the headers date, gross_amount, Team Name and Notes lists team_name and notes as extra columns.':
    'الملف الذي عناوينه date وgross_amount وTeam Name وNotes يُدرج team_name وnotes كأعمدة إضافية.',
  'What the optional columns enable': 'ما الذي تتيحه الأعمدة الاختيارية',
  'Five features of the app depend on columns that not every report has. This explains what each one needs and what you lose without it.':
    'خمس ميزات في التطبيق تعتمد على أعمدة ليست في كل تقرير. يشرح هذا ما تحتاجه كل ميزة وما تفقده بدونها.',
  'A feature is on when the loaded files meet its rule, and off when they do not': 'تعمل الميزة عندما تحقق الملفات المحمّلة شرطها، وتتوقف عندما لا تحققه',
  'Billing split (covered and billed): on when every file has a discount_amount or a net_amount column. When it is off, covered and billed are left at $0, and the findings about overage, the pool and seats are hidden.':
    'تقسيم الفوترة (المشمول بالخطة والمدفوع إضافيًا): يعمل عندما يكون في كل ملف عمود discount_amount أو net_amount. عندما يتوقف، يبقى المشمول بالخطة والمدفوع إضافيًا عند $0، وتُخفى النتائج المتعلقة بالتجاوز والرصيد المشترك والتراخيص.',
  'Seat sizes: on when at least one row has a total_monthly_quota above 0. When it is off, the size of the pool is unknown, the pool and seat findings are hidden, and the per-user view assumes a default seat size. Importing your license list on the Licenses page gives a better estimate.':
    'أحجام التراخيص: تعمل عندما يكون في صف واحد على الأقل total_monthly_quota أكبر من 0. عندما تتوقف، يكون حجم الرصيد المشترك غير معروف، وتُخفى نتائج الرصيد المشترك والتراخيص، ويفترض العرض لكل مستخدم حجم ترخيص افتراضيًا. استيراد قائمة التراخيص في صفحة التراخيص يعطي تقديرًا أفضل.',
  'Usernames: on when at least one file has a username column. When it is off, all usage sits in one unnamed bucket, so the rankings, the segments and the seat findings do not apply.':
    'أسماء المستخدمين: تعمل عندما يكون في ملف واحد على الأقل عمود username. عندما تتوقف، يوضع كل الاستخدام في مجموعة واحدة بلا اسم، لذا لا تنطبق الترتيبات والشرائح ونتائج التراخيص.',
  'Models: on when at least one row names a model. When it is off, the model comparison, the Auto share and the savings by model are not available.':
    'النماذج: تعمل عندما يذكر صف واحد على الأقل نموذجًا. عندما تتوقف، لا تتوفر مقارنة النماذج وحصة Auto والتوفير حسب النموذج.',
  'Token counts: on when a file with at least one readable row has an input or an output column. When it is off, only credit totals are available. The cost by token type, the cache hit rate and the long-context premium cannot be worked out, and the Auto discount can only be estimated.':
    'أعداد الرموز: تعمل عندما يكون في ملف فيه صف مقروء واحد على الأقل عمود input أو output. عندما تتوقف، تتوفر مجاميع الأرصدة فقط. لا يمكن حساب التكلفة حسب نوع الرمز ولا نسبة الإصابة في الذاكرة المؤقتة ولا علاوة السياق الطويل، ولا يمكن إلا تقدير خصم Auto.',
  'The billing split, the usernames and the token counts look at headers only. The seat sizes and the models look at values, so an empty column does not turn them on.':
    'تقسيم الفوترة وأسماء المستخدمين وأعداد الرموز تنظر إلى العناوين فقط. أما أحجام التراخيص والنماذج فتنظر إلى القيم، لذا لا يشغّلها عمود فارغ.',
  'A file with only cache_read and cache_write columns does not turn the token counts on.': 'الملف الذي فيه عمودا cache_read وcache_write فقط لا يشغّل أعداد الرموز.',
  'On the other pages a notice at the top warns when the billing split, the seat sizes or the usernames are off, because they change figures on screen. This page lists every missing column and its effect in the checks.':
    'في الصفحات الأخرى ينبّه إشعار في الأعلى عندما يتوقف تقسيم الفوترة أو أحجام التراخيص أو أسماء المستخدمين، لأنها تغيّر الأرقام المعروضة. تُدرج هذه الصفحة كل عمود ناقص وأثره في الفحوص.',
  'A feature being on does not mean its data is right. It only means the columns are there.': 'عمل الميزة لا يعني أن بياناتها صحيحة. يعني فقط أن الأعمدة موجودة.',
  'A file with net_amount but no discount_amount keeps the billing split on. Covered is worked out as usage − billed.':
    'الملف الذي فيه net_amount وليس فيه discount_amount يُبقي تقسيم الفوترة يعمل. يُحسب المشمول بالخطة على أنه الاستخدام − المدفوع إضافيًا.',
  'The character that separates the fields of a file. The app picks it from the first line, so files with commas, semicolons, tabs or pipes all load.':
    'الحرف الذي يفصل بين حقول الملف. يختاره التطبيق من السطر الأول، لذا تُحمّل الملفات التي تستخدم الفاصلة أو الفاصلة المنقوطة أو علامة الجدولة أو الخط العمودي.',
  'Delimiter = the most frequent of comma, semicolon, tab and pipe in the first line, outside quotes':
    'الفاصل = الأكثر تكرارًا بين الفاصلة والفاصلة المنقوطة وعلامة الجدولة والخط العمودي في السطر الأول، خارج علامات الاقتباس',
  'The app counts the commas, semicolons, tabs and pipes in the first line. Characters inside quotes are not counted.':
    'يعدّ التطبيق الفواصل والفواصل المنقوطة وعلامات الجدولة والخطوط العمودية في السطر الأول. لا تُحسب الأحرف داخل علامات الاقتباس.',
  'The one with the highest count wins. On a tie, the first in the order comma, semicolon, tab, pipe wins. When the line has none of them, it is a comma.':
    'يُعتمد الأكثر عددًا. عند التعادل، يُعتمد الأول بالترتيب: فاصلة، فاصلة منقوطة، علامة جدولة، خط عمودي. عندما لا يحتوي السطر على أي منها، تُعتمد الفاصلة.',
  'Only the first line is looked at. When it has few separators or an unusual one, the guess can be wrong. The signs are missing columns or a rejected file.':
    'يُنظر إلى السطر الأول فقط. عندما يكون فيه فواصل قليلة أو فاصل غير معتاد، قد يكون التخمين خاطئًا. علامات ذلك أعمدة ناقصة أو ملف مرفوض.',
  'Each file gets its own delimiter, so a comma file and a semicolon file can be loaded together.': 'لكل ملف فاصله الخاص، لذا يمكن تحميل ملف بالفواصل وملف بالفواصل المنقوطة معًا.',
  'The header line date;username;model;gross_amount has 3 semicolons and no commas, so the file is read as a semicolon file.':
    'سطر العناوين date;username;model;gross_amount فيه 3 فواصل منقوطة ولا فواصل، لذا يُقرأ الملف على أنه ملف بالفواصل المنقوطة.',
  'The number of data rows in a file before anything is dropped. Compare it with Rows kept to see how much of the file the app used.':
    'عدد صفوف البيانات في الملف قبل حذف أي شيء. قارنه بالصفوف المحتفظ بها لترى كم استخدم التطبيق من الملف.',
  'Rows read = number of rows after the header row': 'الصفوف المقروءة = عدد الصفوف بعد صف العناوين',
  'The first row is the header. Every row after it counts, even when the app drops it later.': 'الصف الأول هو العناوين. كل صف بعده يُحسب، حتى لو حذفه التطبيق لاحقًا.',
  'A line with nothing in it is skipped and not counted. A line with only spaces or only separators counts as a row, and is then dropped as a bad date.':
    'السطر الفارغ تمامًا يُتخطى ولا يُحسب. السطر الذي فيه مسافات فقط أو فواصل فقط يُحسب صفًا، ثم يُحذف لأن تاريخه غير مقروء.',
  'A row with fewer fields than the header is filled up with empty values, and extra fields at the end are ignored. Neither is counted anywhere.':
    'الصف الذي فيه حقول أقل من العناوين يُكمل بقيم فارغة، والحقول الزائدة في آخره يتم تجاهلها. ولا يُحسب أي منهما في أي مكان.',
  'A quoted field can hold a line break. It stays part of one row.': 'الحقل بين علامتي اقتباس يمكن أن يحتوي على سطر جديد. ويبقى جزءًا من صف واحد.',
  'A file with a header and no rows has 0 rows read and 0 rows kept.': 'الملف الذي فيه عناوين ولا صفوف له 0 صفوف مقروءة و0 صفوف محتفظ بها.',
  'A file with a header line and 1,000 lines of usage has 1,000 rows read.': 'الملف الذي فيه سطر عناوين و1,000 سطر استخدام له 1,000 صف مقروء.',
  'The rows that every other number is built from. A row is left out for only two reasons: its date cannot be read, or it repeats a row from a file loaded before it.':
    'الصفوف التي يُبنى منها كل رقم آخر. يُستبعد الصف لسببين فقط: تعذّر قراءة تاريخه، أو أنه يكرر صفًا من ملف حُمّل قبله.',
  'Rows kept = rows read − duplicates dropped − bad dates': 'الصفوف المحتفظ بها = الصفوف المقروءة − المكررات المحذوفة − التواريخ غير المقروءة',
  'Start with the rows read of the file, or of all the files.': 'ابدأ بالصفوف المقروءة من الملف، أو من كل الملفات.',
  'Take away the rows with a date the app cannot read. See Bad dates.': 'اطرح الصفوف ذات التاريخ الذي لا يستطيع التطبيق قراءته. انظر التواريخ غير المقروءة.',
  'Take away the rows that repeat a row from an earlier file. See Duplicates dropped.': 'اطرح الصفوف التي تكرر صفًا من ملف سابق. انظر المكررات المحذوفة.',
  'The number ignores the date range and the filters. It counts every row that was loaded and not dropped.':
    'يتجاهل الرقم نطاق التاريخ وعوامل التصفية. يعدّ كل صف حُمّل ولم يُحذف.',
  'The line under the number shows the rows read, the duplicates dropped and, when there are any, the bad dates.':
    'يُظهر السطر تحت الرقم الصفوف المقروءة والمكررات المحذوفة، والتواريخ غير المقروءة إن وُجدت.',
  'The number turns amber when a date could not be read, because the usage on those rows is missing from every total.':
    'يصبح الرقم كهرمانيًا عندما يتعذّر قراءة تاريخ، لأن استخدام تلك الصفوف غائب عن كل المجاميع.',
  'In the Files table, a file with 0 rows kept is marked amber because it added nothing.': 'في جدول الملفات، يُعلَّم الملف الذي له 0 صفوف محتفظ بها بالكهرماني لأنه لم يضف شيئًا.',
  'A high number does not show that the file is complete. A file that stopped early or has no rows for some users still keeps every row it has.':
    'الرقم المرتفع لا يُثبت أن الملف كامل. الملف الذي توقف مبكرًا أو ليس فيه صفوف لبعض المستخدمين يحتفظ مع ذلك بكل صف فيه.',
  'A file has 1,000 rows read. 20 repeat rows of an earlier file and 5 have an unreadable date. Rows kept = 1,000 − 20 − 5 = 975.':
    'ملف فيه 1,000 صف مقروء. 20 منها تكرر صفوفًا من ملف سابق و5 تاريخها غير مقروء. الصفوف المحتفظ بها = 1,000 − 20 − 5 = 975.',
  'The rows the app skipped because it could not read their date. Their usage is missing from every number in the app.':
    'الصفوف التي تخطاها التطبيق لأنه لم يستطع قراءة تاريخها. استخدامها غائب عن كل رقم في التطبيق.',
  'Bad dates = rows whose date cell is empty or is not a real date in a form the app reads': 'التواريخ غير المقروءة = الصفوف التي خلية تاريخها فارغة أو ليست تاريخًا حقيقيًا بصيغة يقرأها التطبيق',
  'The app reads 2026-10-03 (also 2026/10/03 and 2026.10.03, with one or two digits for the month and the day), 10/3/2026, Oct 3, 2026 and 3 Oct 2026. A time of day after the date is ignored.':
    'يقرأ التطبيق 2026-10-03 (وكذلك 2026/10/03 و2026.10.03، برقم أو رقمين للشهر واليوم)، و10/3/2026، وOct 3, 2026، و3 Oct 2026. يتم تجاهل الوقت بعد التاريخ.',
  'The date has to exist. 2026-02-30 is a bad date. Leap years are respected.': 'يجب أن يكون التاريخ موجودًا فعلًا. 2026-02-30 تاريخ غير صالح. تُراعى السنوات الكبيسة.',
  'A year of 1970 or earlier, or of 10,000 or later, is a bad date. An unset date is often exported as 1970-01-01.':
    'السنة 1970 أو ما قبلها، أو 10,000 أو ما بعدها، تجعل التاريخ غير صالح. غالبًا ما يُصدَّر التاريخ غير المحدد بالشكل 1970-01-01.',
  'A row with a bad date is skipped completely. It is not in Rows kept, and no other count includes it.':
    'الصف ذو التاريخ غير المقروء يُتخطى بالكامل. لا يدخل في الصفوف المحتفظ بها، ولا يشمله أي عدد آخر.',
  'With slashes the first number is the month. It is read as the day only when it is above 12 and the second number is 12 or less. A day-first file such as 03/04/2026 for April 3 is read as March 4, and nothing flags it.':
    'مع الشرطات المائلة يكون الرقم الأول هو الشهر. يُقرأ يومًا فقط عندما يكون أكبر من 12 والرقم الثاني 12 أو أقل. الملف الذي يبدأ باليوم، مثل 03/04/2026 بمعنى 3 أبريل، يُقرأ 4 مارس، ولا يُنبَّه إلى ذلك.',
  'Other forms, such as 03-04-2026, 20260403 or 10/03/26, are bad dates.': 'الصيغ الأخرى، مثل 03-04-2026 أو 20260403 أو 10/03/26، تواريخ غير مقروءة.',
  'Rows kept turns amber when any date could not be read.': 'تصبح الصفوف المحتفظ بها كهرمانية عندما يتعذّر قراءة أي تاريخ.',
  'A single file of 1,000 rows has 3 rows dated 2026-02-30 and 2 rows with no date. Bad dates is 5 and Rows kept is 995.':
    'ملف واحد فيه 1,000 صف، منها 3 صفوف بتاريخ 2026-02-30 وصفّان بلا تاريخ. التواريخ غير المقروءة 5 والصفوف المحتفظ بها 995.',
  'The cells that should hold a number but hold something else. Each one is read as 0 and the row is kept, so what that cell should have added is missing from the totals.':
    'الخلايا التي يُفترض أن تحتوي على رقم لكنها تحتوي على شيء آخر. تُقرأ كل منها 0 ويُحتفظ بالصف، لذا ما كان يُفترض أن تضيفه تلك الخلية غائب عن المجاميع.',
  'Bad numbers = cells in the numeric columns that are not empty and cannot be read as a number':
    'الأرقام غير المقروءة = خلايا الأعمدة الرقمية غير الفارغة التي لا يمكن قراءتها رقمًا',
  'The app checks the quantity, gross_amount, discount_amount, net_amount, total_monthly_quota, input, output, cache_read and cache_write columns.':
    'يفحص التطبيق الأعمدة quantity وgross_amount وdiscount_amount وnet_amount وtotal_monthly_quota وinput وoutput وcache_read وcache_write.',
  'An empty cell is read as 0 and is not counted. A cell with text such as n/a, a currency sign as in $5, or a thousands separator as in 1,234 is counted and read as 0.':
    'الخلية الفارغة تُقرأ 0 ولا تُحسب. الخلية التي فيها نص مثل n/a، أو رمز عملة كما في $5، أو فاصل آلاف كما في 1,234 تُحسب وتُقرأ 0.',
  'Only rows with a readable date are checked. The count is of cells, so one row can add more than one.':
    'تُفحص الصفوف ذات التاريخ المقروء فقط. العدد للخلايا، لذا قد يضيف صف واحد أكثر من واحد.',
  'Numbers need a dot as the decimal mark. 1,5 is a bad number.': 'تحتاج الأرقام إلى نقطة علامةً عشرية. 1,5 رقم غير مقروء.',
  'The unit price column (applied_cost_per_quantity) is not checked. An empty or unreadable price is read as $0.01 and nothing is counted.':
    'لا يُفحص عمود سعر الوحدة (applied_cost_per_quantity). السعر الفارغ أو غير المقروء يُقرأ $0.01 ولا يُحسب شيء.',
  'A pass means every filled-in cell can be read as a number. It does not mean the numbers are right.':
    'النجاح يعني أن كل خلية مملوءة يمكن قراءتها رقمًا. ولا يعني أن الأرقام صحيحة.',
  'A row has a quantity of 250 and a gross_amount of n/a. The gross_amount is read as 0, so Bad numbers goes up by 1 and the $2.50 of usage of the row is missing from the totals. The row also counts as a price mismatch, because 0 is not 250 × $0.01.':
    'صف فيه quantity بقيمة 250 وgross_amount بقيمة n/a. يُقرأ gross_amount على أنه 0، فتزيد الأرقام غير المقروءة 1 ويغيب استخدام الصف البالغ $2.50 عن المجاميع. ويُحسب الصف أيضًا عدم تطابق في السعر، لأن 0 لا يساوي 250 × $0.01.',
  'The rows left out because they repeat a row from a file loaded earlier. It stops the same usage from counting twice when exports overlap, for example when two files both hold the same days.':
    'الصفوف المستبعدة لأنها تكرر صفًا من ملف حُمّل سابقًا. يمنع ذلك حساب الاستخدام نفسه مرتين عندما تتداخل الملفات المصدّرة، مثلًا عندما يحتوي ملفان على الأيام نفسها.',
  'Duplicates dropped = rows that match a row from an earlier file in every compared field':
    'المكررات المحذوفة = الصفوف التي تطابق صفًا من ملف سابق في كل حقل تتم مقارنته',
  'The check runs only when more than one file is loaded.': 'يعمل الفحص فقط عند تحميل أكثر من ملف واحد.',
  'Each row gets a fingerprint from its day, username, product, SKU, model, Auto flag, organization, app, repository, cost center, quantity, usage, covered, billed and the four token counts.':
    'يحصل كل صف على بصمة من يومه واسم المستخدم والمنتج وSKU والنموذج وعلامة Auto والمؤسسة والتطبيق والمستودع ومركز التكلفة والكمية والاستخدام والمشمول بالخطة والمدفوع إضافيًا وأعداد الرموز الأربعة.',
  'A row is dropped when an earlier file already holds a row with the same fingerprint. The first file keeps the row.':
    'يُحذف الصف عندما يحتوي ملف سابق بالفعل على صف بالبصمة نفسها. يحتفظ الملف الأول بالصف.',
  'The seat size, the unit price and the file name are not part of the fingerprint.': 'حجم الترخيص وسعر الوحدة واسم الملف ليست جزءًا من البصمة.',
  'Identical rows inside the same file are all kept. Only a match with another file counts, so a file can hold many rows that look the same.':
    'الصفوف المتطابقة داخل الملف نفسه يُحتفظ بها كلها. لا يُحسب إلا التطابق مع ملف آخر، لذا قد يحتوي الملف على صفوف كثيرة متشابهة.',
  'A row that differs in any compared field is not a duplicate, and both rows stay. A corrected re-export with different amounts therefore counts twice. Load only the final export of each period.':
    'الصف الذي يختلف في أي حقل تتم مقارنته ليس مكررًا، ويبقى الصفان. لذا تُحسب إعادة التصدير المصحّحة ذات المبالغ المختلفة مرتين. حمّل الملف النهائي فقط لكل فترة.',
  'The fingerprint is a compact code, not a comparison of every field. Two different rows share one only by an extremely unlikely chance.':
    'البصمة رمز مختصر، وليست مقارنة لكل حقل. لا يشترك صفان مختلفان في بصمة واحدة إلا بمصادفة نادرة جدًا.',
  'File A has 1,000 rows of January. File B has the same 1,000 rows plus 1,100 rows of February. The 1,000 repeated rows of file B are dropped, so 2,100 rows are kept in total.':
    'الملف A فيه 1,000 صف من يناير. الملف B فيه الصفوف الـ1,000 نفسها و1,100 صف من فبراير. تُحذف الصفوف الـ1,000 المكررة من الملف B، فيُحتفظ بـ2,100 صف إجمالًا.',
  'The rows where usage is not what the included credits covered plus what was billed. In a consistent report the three amounts add up on every row.':
    'الصفوف التي لا يساوي فيها الاستخدام ما غطته الأرصدة المشمولة مضافًا إليه ما دُفع إضافيًا. في التقرير المتسق تتطابق المبالغ الثلاثة في كل صف.',
  'Balance mismatch = a row where |usage − (covered + billed)| is above 0.0001 + 0.000001 × |usage|':
    'عدم تطابق الرصيد = صف تكون فيه |الاستخدام − (المشمول بالخطة + المدفوع إضافيًا)| أكبر من 0.0001 + 0.000001 × |الاستخدام|',
  'For each row with a readable date, take gross_amount (usage), discount_amount (covered) and net_amount (billed).':
    'لكل صف بتاريخ مقروء، خذ gross_amount (الاستخدام) وdiscount_amount (المشمول بالخطة) وnet_amount (المدفوع إضافيًا).',
  'When one of the columns covered and billed is missing, the app works it out as usage minus the other one, and never below 0.':
    'عندما يكون أحد عمودي المشمول بالخطة والمدفوع إضافيًا ناقصًا، يحسبه التطبيق على أنه الاستخدام ناقص الآخر، ولا يقل أبدًا عن 0.',
  'The row counts when the gap between usage and covered plus billed is more than the small allowance in the formula. The allowance is there for rounding.':
    'يُحسب الصف عندما يكون الفرق بين الاستخدام ومجموع المشمول بالخطة والمدفوع إضافيًا أكبر من الهامش الصغير في الصيغة. الهامش موجود للتقريب.',
  'A file with neither a discount_amount nor a net_amount column is not checked.': 'الملف الذي ليس فيه عمود discount_amount ولا net_amount لا يُفحص.',
  'With only one of the two columns, a row can mismatch only when the missing amount would have been below 0 and was set to 0.':
    'مع وجود أحد العمودين فقط، لا يختلف الصف إلا عندما يكون المبلغ الناقص أقل من 0 فيُضبط على 0.',
  'Rows are counted before duplicates are dropped, so a duplicate row can count too.': 'تُعدّ الصفوف قبل حذف المكررات، لذا قد يُحسب الصف المكرر أيضًا.',
  'Rows are counted before duplicates are dropped, so a duplicate row can count too. Rows with an unreadable date are not counted.':
    'تُعدّ الصفوف قبل حذف المكررات، لذا قد يُحسب الصف المكرر أيضًا. لا تُعدّ الصفوف ذات التاريخ غير المقروء.',
  'A pass does not prove the amounts are right. It shows that they add up. A mismatch shows that they do not, and not which of the three amounts is wrong.':
    'النجاح لا يُثبت أن المبالغ صحيحة. بل يُظهر أنها متطابقة. وعدم التطابق يُظهر أنها لا تتطابق، ولا يحدد أيّ المبالغ الثلاثة هو الخاطئ.',
  'Covered is not a price reduction. It is the part of usage that the included credits paid for.':
    'المشمول بالخطة ليس تخفيضًا في السعر. إنه جزء الاستخدام الذي دفعته الأرصدة المشمولة.',
  'A row has usage of $10.00, covered of $6.00 and billed of $3.00. The gap is $1.00, which is above the allowance of $0.00011, so the row is a balance mismatch.':
    'صف فيه استخدام $10.00 ومشمول بالخطة $6.00 ومدفوع إضافي $3.00. الفرق $1.00، وهو أكبر من الهامش $0.00011، لذا يُعد الصف عدم تطابق في الرصيد.',
  'The rows where usage is not the number of AI credits times the unit price. At $0.01 a credit, a row of 250 credits should show $2.50.':
    'الصفوف التي لا يساوي فيها الاستخدام عدد أرصدة الذكاء الاصطناعي مضروبًا في سعر الوحدة. بسعر $0.01 للرصيد، يجب أن يُظهر صف من 250 رصيدًا $2.50.',
  'Price mismatch = a row where |usage − quantity × unit price| is above 0.0001 + 0.000001 × |usage|':
    'عدم تطابق السعر = صف تكون فيه |الاستخدام − الكمية × سعر الوحدة| أكبر من 0.0001 + 0.000001 × |الاستخدام|',
  'For each row with a readable date, take gross_amount (usage), quantity (AI credits) and applied_cost_per_quantity (the unit price).':
    'لكل صف بتاريخ مقروء، خذ gross_amount (الاستخدام) وquantity (أرصدة الذكاء الاصطناعي) وapplied_cost_per_quantity (سعر الوحدة).',
  'A unit price that is empty, unreadable or missing is read as $0.01.': 'سعر الوحدة الفارغ أو غير المقروء أو الناقص يُقرأ $0.01.',
  'The row counts when the gap is more than the small allowance in the formula. The allowance is there for rounding.':
    'يُحسب الصف عندما يكون الفرق أكبر من الهامش الصغير في الصيغة. الهامش موجود للتقريب.',
  'The check needs both a quantity and a gross_amount column. A file with only one of them is not checked.':
    'يحتاج الفحص إلى عمودي quantity وgross_amount معًا. الملف الذي فيه أحدهما فقط لا يُفحص.',
  'The check makes no exception for Auto rows. If their amounts are not quantity × the unit price, they count like any other row.':
    'لا يستثني الفحص صفوف Auto. إذا لم تكن مبالغها الكمية × سعر الوحدة، تُحسب مثل أي صف آخر.',
  'The check does not know why an amount differs. A rounding rule, a price change or an error in the export can all cause it.':
    'لا يعرف الفحص سبب اختلاف المبلغ. قد تسببه قاعدة تقريب أو تغيير في السعر أو خطأ في التصدير.',
  'A row has 250 credits at $0.01, so the expected usage is $2.50. A file that says $3.00 has a gap of $0.50, far above the small allowance, so the row is a price mismatch.':
    'صف فيه 250 رصيدًا بسعر $0.01، فالاستخدام المتوقع $2.50. الملف الذي يذكر $3.00 فيه فرق $0.50، وهو أكبر بكثير من الهامش الصغير، لذا يُعد الصف عدم تطابق في السعر.',
  'The rows with a negative usage, covered or billed amount. They lower the totals instead of adding to them.':
    'الصفوف التي فيها مبلغ سالب للاستخدام أو المشمول بالخطة أو المدفوع إضافيًا. تُنقص المجاميع بدلًا من أن تضيف إليها.',
  'Negative rows = rows where usage, covered or billed is below 0': 'الصفوف السالبة = الصفوف التي يكون فيها الاستخدام أو المشمول بالخطة أو المدفوع إضافيًا أقل من 0',
  'A row counts once, even when more than one of its amounts is negative.': 'يُحسب الصف مرة واحدة، حتى لو كان أكثر من مبلغ فيه سالبًا.',
  'Negative rows are kept and included in every total, so a total can be lower than the sum of the positive rows.':
    'يُحتفظ بالصفوف السالبة وتُدرج في كل مجموع، لذا قد يكون المجموع أقل من مجموع الصفوف الموجبة.',
  'The app does not know why an amount is negative. A credit or a refund can look like this, and so can an error in the export.':
    'لا يعرف التطبيق سبب كون المبلغ سالبًا. قد يبدو الرصيد الدائن أو الاسترداد هكذا، وكذلك الخطأ في التصدير.',
  'Covered or billed that is worked out because its column is missing is never below 0.': 'المشمول بالخطة أو المدفوع إضافيًا المحسوب لأن عموده ناقص لا يقل أبدًا عن 0.',
  'A row with a usage of −$2.50 counts as 1 negative row and lowers Total usage by $2.50.': 'الصف الذي استخدامه −$2.50 يُحسب صفًا سالبًا واحدًا ويُنقص إجمالي الاستخدام بمقدار $2.50.',
  'The earliest date among the rows kept from a file. Together with the last day it shows which period the file covers.':
    'أقدم تاريخ بين الصفوف المحتفظ بها من الملف. مع اليوم الأخير يُظهر الفترة التي يغطيها الملف.',
  'First day = earliest date of the rows kept from the file': 'اليوم الأول = أقدم تاريخ للصفوف المحتفظ بها من الملف',
  'Rows that were dropped do not move it. The time of day is ignored.': 'الصفوف المحذوفة لا تغيّره. يتم تجاهل الوقت.',
  'A file with no rows kept shows a dash.': 'الملف الذي ليس له صفوف محتفظ بها يُظهر شرطة.',
  'The total row takes the earliest first day of the files that kept rows.': 'يأخذ صف الإجمالي أقدم يوم أول بين الملفات التي احتُفظ بصفوف منها.',
  'A file can have a gap between its first and its last day. The "No gaps in the date range" check looks for those.':
    'قد تكون في الملف فجوة بين يومه الأول ويومه الأخير. يبحث فحص "لا فجوات في نطاق التاريخ" عنها.',
  'A file has rows dated 2026-09-03, 2026-09-17 and 2026-09-30. Its first day is 2026-09-03.': 'ملف فيه صفوف بتاريخ 2026-09-03 و2026-09-17 و2026-09-30. يومه الأول 2026-09-03.',
  'The latest date among the rows kept from a file. Together with the first day it shows which period the file covers.':
    'أحدث تاريخ بين الصفوف المحتفظ بها من الملف. مع اليوم الأول يُظهر الفترة التي يغطيها الملف.',
  'Last day = latest date of the rows kept from the file': 'اليوم الأخير = أحدث تاريخ للصفوف المحتفظ بها من الملف',
  'The total row takes the latest last day of the files that kept rows.': 'يأخذ صف الإجمالي أحدث يوم أخير بين الملفات التي احتُفظ بصفوف منها.',
  'A last day before the end of the month can mean the export was made in the middle of the month. The "The last month is complete" check looks at that.':
    'اليوم الأخير قبل نهاية الشهر قد يعني أن التصدير تم في منتصف الشهر. يفحص ذلك فحص "الشهر الأخير مكتمل".',
  'A file has rows dated 2026-09-03, 2026-09-17 and 2026-09-30. Its last day is 2026-09-30.': 'ملف فيه صفوف بتاريخ 2026-09-03 و2026-09-17 و2026-09-30. يومه الأخير 2026-09-30.',
  'How many calendar days the data stretches over, from the first day with rows to the last. The line under the number says how many of those days have rows.':
    'عدد الأيام التقويمية التي تمتد عليها البيانات، من أول يوم فيه صفوف إلى آخر يوم. يذكر السطر تحت الرقم كم من هذه الأيام فيه صفوف.',
  'Date span = last day − first day + 1, over all rows kept': 'المدة الزمنية = اليوم الأخير − اليوم الأول + 1، على كل الصفوف المحتفظ بها',
  'The first and the last day are the earliest and the latest date of the rows kept.': 'اليوم الأول واليوم الأخير هما أقدم وأحدث تاريخ للصفوف المحتفظ بها.',
  'The line under the number shows the two dates, then how many days in the span have rows and how many are empty.':
    'يُظهر السطر تحت الرقم التاريخين، ثم كم يومًا في المدة فيه صفوف وكم يومًا فارغ.',
  'The number turns amber when a weekday inside the span has no rows. Empty Saturdays and Sundays do not turn it amber.':
    'يصبح الرقم كهرمانيًا عندما لا تكون صفوف في يوم عمل داخل المدة. أيام السبت والأحد الفارغة لا تجعله كهرمانيًا.',
  'It ignores the date range and the filters. It describes everything that was loaded.': 'يتجاهل نطاق التاريخ وعوامل التصفية. يصف كل ما حُمّل.',
  'A holiday on a weekday turns it amber too. The app has no holiday calendar.': 'العطلة في يوم عمل تجعله كهرمانيًا أيضًا. لا يوجد في التطبيق تقويم للعطلات.',
  'The span does not show that the period is complete. Data that stops early still has a span. The "The last month is complete" check looks at the end.':
    'المدة لا تُثبت أن الفترة مكتملة. البيانات التي تتوقف مبكرًا لها مدة أيضًا. يفحص فحص "الشهر الأخير مكتمل" النهاية.',
  'Dates are the calendar dates as written in the file. The time of day is ignored, so the time zone cannot move a date.':
    'التواريخ هي التواريخ التقويمية كما كُتبت في الملف. يتم تجاهل الوقت، لذا لا تستطيع المنطقة الزمنية تغيير التاريخ.',
  '2026-09-01 to 2026-09-30 is a span of 30 days. When Saturday 12 and Sunday 13 September have no rows, the line says 28 with rows, 2 empty, and the number stays neutral.':
    'من 2026-09-01 إلى 2026-09-30 مدة 30 يومًا. عندما لا تكون صفوف يومي السبت 12 والأحد 13 سبتمبر، يذكر السطر 28 يومًا فيها صفوف ويومين فارغين، ويبقى الرقم محايدًا.',
  'Gaps in the date range': 'الفجوات في نطاق التاريخ',
  'The weekdays between the first and the last day that have no rows at all. A gap can mean that part of the period is missing from the files.':
    'أيام العمل بين اليوم الأول واليوم الأخير التي ليس فيها أي صفوف. قد تعني الفجوة أن جزءًا من الفترة غائب عن الملفات.',
  'Gap = a weekday between the first and the last day that has no rows': 'الفجوة = يوم عمل بين اليوم الأول واليوم الأخير ليس فيه صفوف',
  'Take every day from the first to the last day of the data, and mark the days that have at least one row.':
    'خذ كل يوم من اليوم الأول إلى اليوم الأخير في البيانات، وعلّم الأيام التي فيها صف واحد على الأقل.',
  'Count the empty days that fall on a Monday to Friday. These are the missing weekdays. Empty Saturdays and Sundays are counted apart and are not a problem.':
    'عُدّ الأيام الفارغة التي تقع من الاثنين إلى الجمعة. هذه أيام العمل الناقصة. أيام السبت والأحد الفارغة تُعدّ منفصلة وليست مشكلة.',
  'Neighboring empty days form a run. The check lists up to five runs, with the weekend days at the ends of a run left out.':
    'الأيام الفارغة المتجاورة تشكّل سلسلة. يُدرج الفحص حتى خمس سلاسل، مع استبعاد أيام عطلة نهاية الأسبوع في طرفي السلسلة.',
  'The check has no holiday calendar. A public holiday with no usage counts as a gap.': 'لا يوجد في الفحص تقويم للعطلات. العطلة الرسمية التي لا استخدام فيها تُحسب فجوة.',
  'The days before the first row and after the last row cannot be gaps. The "The last month is complete" check looks at data that stops early.':
    'الأيام قبل أول صف وبعد آخر صف لا يمكن أن تكون فجوات. يفحص فحص "الشهر الأخير مكتمل" البيانات التي تتوقف مبكرًا.',
  'A day with only a few rows passes. The check does not compare the amount of usage between days.': 'اليوم الذي فيه صفوف قليلة فقط ينجح. لا يقارن الفحص مقدار الاستخدام بين الأيام.',
  'With a single day there is no range to check.': 'مع يوم واحد لا يوجد نطاق للفحص.',
  'The Date span number turns amber when there is at least one missing weekday.': 'يصبح رقم المدة الزمنية كهرمانيًا عندما يكون هناك يوم عمل ناقص واحد على الأقل.',
  'The data runs from Monday 2026-09-07 to Friday 2026-09-18 and has no rows on Wednesday the 9th and Thursday the 10th. That is 2 missing weekdays in one run. The empty weekend of the 12th and 13th is not a problem.':
    'تمتد البيانات من الاثنين 2026-09-07 إلى الجمعة 2026-09-18 وليس فيها صفوف يوم الأربعاء 9 ويوم الخميس 10. هذان يوما عمل ناقصان في سلسلة واحدة. عطلة نهاية الأسبوع الفارغة في 12 و13 ليست مشكلة.',
  'Months of data': 'أشهر البيانات',
  'How many calendar months the rows reach into. With one month, the trends and the projection of the month are limited.':
    'عدد الأشهر التقويمية التي تصل إليها الصفوف. مع شهر واحد، تكون الاتجاهات وتوقع الشهر محدودة.',
  'Months of data = number of calendar months with at least one day that has rows': 'أشهر البيانات = عدد الأشهر التقويمية التي فيها يوم واحد على الأقل فيه صفوف',
  'Take the days that have at least one row and note the calendar month of each.': 'خذ الأيام التي فيها صف واحد على الأقل وسجّل الشهر التقويمي لكل منها.',
  'Count the different months. The check passes with 2 or more and gives information with 1.': 'عُدّ الأشهر المختلفة. ينجح الفحص مع شهرين أو أكثر ويعطي معلومة مع شهر واحد.',
  'A month with only a few days of data counts as a month. The check does not look at how complete each month is.':
    'الشهر الذي فيه أيام قليلة فقط من البيانات يُحسب شهرًا. لا ينظر الفحص إلى مدى اكتمال كل شهر.',
  'A month with no rows at all does not count. A file with January and March rows has 2 months.': 'الشهر الذي ليس فيه أي صفوف لا يُحسب. الملف الذي فيه صفوف يناير ومارس له شهران.',
  'Several files can be loaded together to cover more months.': 'يمكن تحميل عدة ملفات معًا لتغطية أشهر أكثر.',
  'Rows on 2026-08-20 and on 2026-09-03 give 2 months, even though each month has only a few days of data.':
    'صفوف في 2026-08-20 و2026-09-03 تعطي شهرين، رغم أن كل شهر فيه أيام قليلة فقط من البيانات.',
  'Last month complete': 'اكتمال الشهر الأخير',
  'Whether the data reaches the end of its last month. When it stops earlier, that month is partial, and its month-end figures are projected from the days so far.':
    'هل تصل البيانات إلى نهاية شهرها الأخير. عندما تتوقف قبل ذلك، يكون الشهر جزئيًا، وتُتوقع أرقام نهاية الشهر من الأيام حتى الآن.',
  'Complete = last day with rows is on or after the last day of its month': 'مكتمل = آخر يوم فيه صفوف يقع في آخر يوم من شهره أو بعده',
  'Take the last day with rows and the last day of that calendar month.': 'خذ آخر يوم فيه صفوف وآخر يوم من ذلك الشهر التقويمي.',
  'When the data reaches or passes the last day of the month, the check passes.': 'عندما تصل البيانات إلى آخر يوم في الشهر أو تتجاوزه، ينجح الفحص.',
  'Otherwise it gives information with the number of days before the end of the month.': 'وإلا فإنه يعطي معلومة بعدد الأيام المتبقية قبل نهاية الشهر.',
  'It compares dates only. It does not check that every day of the month has rows. The "No gaps in the date range" check does that.':
    'يقارن التواريخ فقط. لا يتحقق من أن كل يوم في الشهر فيه صفوف. يقوم بذلك فحص "لا فجوات في نطاق التاريخ".',
  'It gives information and not a warning, because a partial month is normal when you load the report in the middle of a month.':
    'يعطي معلومة وليس تحذيرًا، لأن الشهر الجزئي أمر طبيعي عندما تحمّل التقرير في منتصف الشهر.',
  'It also notes when the first month starts after the first day of that month.': 'ويذكر أيضًا عندما يبدأ الشهر الأول بعد أول يوم في ذلك الشهر.',
  'Data that ends on 2026-09-24 is 6 days before the end of September, so the last month is not complete.':
    'البيانات التي تنتهي في 2026-09-24 تتوقف قبل نهاية سبتمبر بـ6 أيام، لذا الشهر الأخير غير مكتمل.',
  'Users in the data': 'المستخدمون في البيانات',
  'How many different usernames appear in the rows you loaded.': 'عدد أسماء المستخدمين المختلفة التي تظهر في الصفوف التي حمّلتها.',
  'Users = number of different non-empty usernames in the rows kept': 'المستخدمون = عدد أسماء المستخدمين المختلفة غير الفارغة في الصفوف المحتفظ بها',
  'Spaces at the start and the end of a username are removed. Two usernames are the same only when they match exactly, capitals included.':
    'تُزال المسافات في بداية اسم المستخدم ونهايته. يكون اسما المستخدمين متماثلين فقط عندما يتطابقان تمامًا، بما في ذلك الأحرف الكبيرة.',
  'Rows with an empty username are not counted as a user. The line under the number says how many rows have none.':
    'الصفوف ذات اسم المستخدم الفارغ لا تُحسب مستخدمًا. يذكر السطر تحت الرقم كم صفًا ليس فيه اسم.',
  'It counts every row kept, whatever the date range and the filters. Active users on the Overview page counts the period you selected, so the two can differ.':
    'يعدّ كل صف محتفظ به، أيًا كان نطاق التاريخ وعوامل التصفية. أما المستخدمون النشطون في صفحة نظرة عامة فيعدّ الفترة التي اخترتها، لذا قد يختلف الرقمان.',
  'It is not the number of licensed seats. A seat that never used GitHub Copilot has no row in the report.':
    'ليس عدد التراخيص. الترخيص الذي لم يستخدم GitHub Copilot أبدًا ليس له صف في التقرير.',
  'One person written in two ways, such as User-A and user-a, counts as two users.': 'الشخص الواحد المكتوب بطريقتين، مثل User-A وuser-a، يُحسب مستخدمَين.',
  'The rows hold the usernames user-a, user-b, user-a and an empty value. Users is 2, and 1 row has no username.':
    'تحتوي الصفوف على أسماء المستخدمين user-a وuser-b وuser-a وقيمة فارغة. المستخدمون 2، وصف واحد ليس فيه اسم مستخدم.',
  'Rows without a username': 'صفوف بلا اسم مستخدم',
  'The rows that belong to no named user, such as the usage of repository-level products. Their usage counts in every total but cannot be given to a person.':
    'الصفوف التي لا تخص أي مستخدم مسمّى، مثل استخدام المنتجات على مستوى المستودع. يُحسب استخدامها في كل مجموع لكن لا يمكن نسبته إلى شخص.',
  'Rows without a username = rows kept whose username is empty': 'صفوف بلا اسم مستخدم = الصفوف المحتفظ بها التي اسم المستخدم فيها فارغ',
  'Count the rows kept with an empty username and add up their usage.': 'عُدّ الصفوف المحتفظ بها ذات اسم المستخدم الفارغ واجمع استخدامها.',
  'The check shows them as a share of all rows kept and, when the total usage is above 0, as a share of all usage.':
    'يعرضها الفحص حصةً من كل الصفوف المحتفظ بها، وعندما يكون إجمالي الاستخدام أكبر من 0، حصةً من كل الاستخدام.',
  'When some rows have no username, the check lists up to three products that hold the most of their usage.':
    'عندما تكون بعض الصفوف بلا اسم مستخدم، يُدرج الفحص حتى ثلاثة منتجات تحمل معظم استخدامها.',
  'The check passes when every row has a username, gives information when some rows have none, and warns when no row has one.':
    'ينجح الفحص عندما يكون لكل صف اسم مستخدم، ويعطي معلومة عندما تكون بعض الصفوف بلا اسم، وينبّه عندما لا يكون لأي صف اسم.',
  'A file with no username column gives every one of its rows an empty username.': 'الملف الذي ليس فيه عمود username يعطي كل صفوفه اسم مستخدم فارغًا.',
  'The check cannot tell a product that has no user, such as a repository-level product, from a username that was lost in the export. The products it lists help you judge.':
    'لا يستطيع الفحص التمييز بين منتج ليس له مستخدم، مثل منتج على مستوى المستودع، واسم مستخدم ضاع في التصدير. المنتجات التي يُدرجها تساعدك على الحكم.',
  '40 of 1,000 rows have no username, which is 4% of the rows. Their usage is $120 of $3,000, which is also 4%.':
    '40 من 1,000 صف ليس فيها اسم مستخدم، أي 4% من الصفوف. استخدامها $120 من $3,000، أي 4% أيضًا.',
  'Models in the data': 'النماذج في البيانات',
  'How many different models appear in the rows you loaded.': 'عدد النماذج المختلفة التي تظهر في الصفوف التي حمّلتها.',
  'Models = number of different model names in the rows kept, after the Auto prefix is removed': 'النماذج = عدد أسماء النماذج المختلفة في الصفوف المحتفظ بها، بعد إزالة البادئة Auto',
  'Extra spaces inside a model name are reduced to one.': 'المسافات الزائدة داخل اسم النموذج تُختصر إلى مسافة واحدة.',
  'A model written as Auto: Model A is stored as Model A, and the row is flagged as an Auto row. The flag is a separate column in the app and is not part of the name.':
    'النموذج المكتوب Auto: Model A يُحفظ Model A، ويُعلَّم الصف على أنه صف Auto. العلامة عمود منفصل في التطبيق وليست جزءًا من الاسم.',
  'A model called only Auto is counted as a model named Auto.': 'النموذج المسمّى Auto فقط يُحسب نموذجًا اسمه Auto.',
  'Rows with an empty model are not counted. The line under the number says how many rows have none.': 'الصفوف ذات النموذج الفارغ لا تُحسب. يذكر السطر تحت الرقم كم صفًا ليس فيه نموذج.',
  'Names match exactly, so Model A and model a are two models.': 'تتطابق الأسماء تمامًا، لذا Model A وmodel a نموذجان.',
  'The names are not matched to the price card here. The "Models with prices" check does that.': 'لا تُطابق الأسماء مع قائمة الأسعار هنا. يقوم بذلك فحص "النماذج التي لها أسعار".',
  'Rows with the models Model A, Auto: Model A and Model B give 2 models. The Auto row counts under Model A and is flagged as Auto.':
    'الصفوف ذات النماذج Model A وAuto: Model A وModel B تعطي نموذجين. يُحسب صف Auto ضمن Model A ويُعلَّم على أنه Auto.',
  'Organizations, cost centers and repositories': 'المؤسسات ومراكز التكلفة والمستودعات',
  'How many different organizations, cost centers or repositories appear in the rows you loaded. The tiles of the card What is in the data count products, SKUs and apps the same way.':
    'عدد المؤسسات أو مراكز التكلفة أو المستودعات المختلفة التي تظهر في الصفوف التي حمّلتها. مربعات بطاقة "ما في البيانات" تعدّ المنتجات وSKU والتطبيقات بالطريقة نفسها.',
  'Count = number of different non-empty values in the column, over the rows kept': 'العدد = عدد القيم المختلفة غير الفارغة في العمود، على الصفوف المحتفظ بها',
  'Spaces at the start and the end of a value are removed. Two values are the same only when they match exactly, capitals included.':
    'تُزال المسافات في بداية القيمة ونهايتها. تكون القيمتان متماثلتين فقط عندما تتطابقان تمامًا، بما في ذلك الأحرف الكبيرة.',
  'Rows with an empty value are not counted as a value. The line under the number says whether every row has a value, none has one, or how many rows have none.':
    'الصفوف ذات القيمة الفارغة لا تُحسب قيمة. يذكر السطر تحت الرقم هل لكل صف قيمة، أو لا قيمة لأي صف، أو كم صفًا ليس فيه قيمة.',
  'It counts every row kept, whatever the date range and the filters.': 'يعدّ كل صف محتفظ به، أيًا كان نطاق التاريخ وعوامل التصفية.',
  'One value written in two ways counts twice.': 'القيمة الواحدة المكتوبة بطريقتين تُحسب مرتين.',
  'A column that is missing from the files has no values, so the count is 0 and the line says Empty on every row.': 'العمود الناقص من الملفات ليس فيه قيم، لذا العدد 0 ويذكر السطر أنه فارغ في كل صف.',
  'A count says how many different values there are, not how much usage each one has. The card What is in the data shows the biggest values by usage.':
    'العدد يذكر كم قيمة مختلفة توجد، لا مقدار استخدام كل منها. تُظهر بطاقة "ما في البيانات" أكبر القيم حسب الاستخدام.',
  'The rows hold the organizations org-a, org-b, org-a and an empty value. The count is 2, and 1 row has no organization.':
    'تحتوي الصفوف على المؤسسات org-a وorg-b وorg-a وقيمة فارغة. العدد 2، وصف واحد ليس فيه مؤسسة.',
  'Biggest values by usage': 'أكبر القيم حسب الاستخدام',
  'In each tile of the card What is in the data, the three values with the most usage and their share of all usage. It shows where the usage sits.':
    'في كل مربع من بطاقة "ما في البيانات"، القيم الثلاث الأكثر استخدامًا وحصتها من كل الاستخدام. يُظهر أين يتركز الاستخدام.',
  'Share of a value = usage of the rows with that value ÷ usage of all rows kept': 'حصة القيمة = استخدام الصفوف ذات تلك القيمة ÷ استخدام كل الصفوف المحتفظ بها',
  'Add up the usage of the rows kept for each value, such as each repository.': 'اجمع استخدام الصفوف المحتفظ بها لكل قيمة، مثل كل مستودع.',
  'Show the three values with the most usage. A value with no usage above 0 is not shown, and neither is the empty value.':
    'اعرض القيم الثلاث الأكثر استخدامًا. لا تُعرض القيمة التي ليس لها استخدام أكبر من 0، ولا القيمة الفارغة.',
  'The share divides by the usage of all rows kept, including the rows with an empty value, so the three shares add up to less than 100%.':
    'تُقسم الحصة على استخدام كل الصفوف المحتفظ بها، بما فيها الصفوف ذات القيمة الفارغة، لذا مجموع الحصص الثلاث أقل من 100%.',
  'When no value in a tile has usage above 0, the tile ranks by rows instead and says so. The share is then the share of all rows kept.':
    'عندما لا تكون لأي قيمة في المربع استخدام أكبر من 0، يرتّب المربع حسب الصفوف بدلًا من ذلك ويذكر ذلك. تكون الحصة عندئذ حصةً من كل الصفوف المحتفظ بها.',
  'It covers every row kept, whatever the date range and the filters.': 'يشمل كل صف محتفظ به، أيًا كان نطاق التاريخ وعوامل التصفية.',
  'The model tile groups rows by model name without the Auto prefix, so the Auto rows of a model count with that model.':
    'يجمع مربع النماذج الصفوف حسب اسم النموذج دون البادئة Auto، لذا تُحسب صفوف Auto لنموذج ما مع ذلك النموذج.',
  'The ranking says where usage is. It does not say whether that usage is too high.': 'الترتيب يذكر أين يوجد الاستخدام. ولا يذكر هل هذا الاستخدام مرتفع أكثر من اللازم.',
  'Hover over a value to see its usage and its number of rows.': 'مرّر المؤشر فوق قيمة لترى استخدامها وعدد صفوفها.',
  'Usage is $1,000 in total. repo-a has $500, repo-b has $300, repo-c has $100, and $100 sits on rows with no repository. The tile shows 50%, 30% and 10%.':
    'إجمالي الاستخدام $1,000. للمستودع repo-a مبلغ $500، وrepo-b مبلغ $300، وrepo-c مبلغ $100، و$100 على صفوف بلا مستودع. يُظهر المربع 50% و30% و10%.',
  'Whether the app knows a price for each model in the data. A model without a price is left out of the cost by token type and the long-context premium, and the Auto discount of its rows can only be estimated. Its usage still counts in every total.':
    'هل يعرف التطبيق سعرًا لكل نموذج في البيانات. النموذج الذي ليس له سعر يُستبعد من التكلفة حسب نوع الرمز ومن علاوة السياق الطويل، ولا يمكن إلا تقدير خصم Auto لصفوفه. ويبقى استخدامه محسوبًا في كل مجموع.',
  'A model has a price = it is on the built-in price card, or you set a price for it in Settings':
    'للنموذج سعر = هو موجود في قائمة الأسعار المدمجة، أو حددت له سعرًا في الإعدادات',
  'Each model name in the rows kept is looked up on the price card. Capitals, spaces, hyphens and the words claude, anthropic, openai, google, github and copilot are ignored, so claude-sonnet-4.5 and Sonnet 4.5 find the same entry.':
    'يُبحث عن كل اسم نموذج في الصفوف المحتفظ بها في قائمة الأسعار. يتم تجاهل الأحرف الكبيرة والمسافات والشرطات والكلمات claude وanthropic وopenai وgoogle وgithub وcopilot، لذا يجد claude-sonnet-4.5 وSonnet 4.5 الإدخال نفسه.',
  'A name that ends in a qualifier in brackets, such as (preview), is also tried without it. A fast mode qualifier is never dropped, because it changes the price.':
    'الاسم الذي ينتهي بوصف بين قوسين، مثل (preview)، يُجرَّب أيضًا بدونه. لا يُحذف وصف الوضع السريع أبدًا، لأنه يغيّر السعر.',
  'A price you set in Settings for the exact name of the model replaces the card.': 'السعر الذي تحدده في الإعدادات للاسم الدقيق للنموذج يحل محل القائمة.',
  'The check lists up to five models without a price, with their usage, and gives the share of all usage they hold.':
    'يُدرج الفحص حتى خمسة نماذج ليس لها سعر، مع استخدامها، ويعطي حصتها من كل الاستخدام.',
  'A model called only Auto is not on the price card, so it is listed as a model without a price.': 'النموذج المسمّى Auto فقط ليس في قائمة الأسعار، لذا يُدرج نموذجًا بلا سعر.',
  'The card is built into the app and can be out of date. A new model is listed until the card or your Settings know it.':
    'القائمة مدمجة في التطبيق وقد تكون قديمة. يبقى النموذج الجديد مُدرجًا حتى تعرفه القائمة أو إعداداتك.',
  'Having a price does not mean the tokens can be priced. Token coverage shows how much of the usage has both a price and token counts.':
    'وجود سعر لا يعني أنه يمكن تسعير الرموز. تُظهر تغطية الرموز كم من الاستخدام له سعر وأعداد رموز معًا.',
  'The check looks at names only. It does not test that a price is right.': 'ينظر الفحص إلى الأسماء فقط. لا يختبر صحة السعر.',
  'The data has 3 models and one of them is not on the price card. The check says that 1 of 3 models has no price, and shows the usage of that model.':
    'في البيانات 3 نماذج وأحدها ليس في قائمة الأسعار. يذكر الفحص أن نموذجًا واحدًا من 3 ليس له سعر، ويُظهر استخدام ذلك النموذج.',
  'Everything that was used in the files, whatever the date range and the filters. It is the same measure as Usage on the other pages, taken over every row kept.':
    'كل ما استُخدم في الملفات، أيًا كان نطاق التاريخ وعوامل التصفية. إنه المقياس نفسه للاستخدام في الصفحات الأخرى، محسوبًا على كل صف محتفظ به.',
  'Total usage = sum of gross_amount over all rows kept': 'إجمالي الاستخدام = مجموع gross_amount على كل الصفوف المحتفظ بها',
  'Add up gross_amount of the rows kept. A file without a gross_amount column uses quantity × the unit price instead, and $0.01 when the price is missing too.':
    'اجمع gross_amount للصفوف المحتفظ بها. الملف الذي ليس فيه عمود gross_amount يستخدم الكمية × سعر الوحدة بدلًا من ذلك، و$0.01 عندما يكون السعر ناقصًا أيضًا.',
  'The line under the number gives the AI credits (the sum of quantity, rounded) and, when every file has a discount_amount or a net_amount column, the billed amount.':
    'يعطي السطر تحت الرقم أرصدة الذكاء الاصطناعي (مجموع quantity مقرّبًا)، والمبلغ المدفوع إضافيًا عندما يكون في كل ملف عمود discount_amount أو net_amount.',
  'When a file has neither of those columns, the line says that the billed amount is not in the file.': 'عندما لا يكون في الملف أي من هذين العمودين، يذكر السطر أن المبلغ المدفوع إضافيًا ليس في الملف.',
  'Rows that were dropped are not in the total. See Rows kept.': 'الصفوف المحذوفة ليست في المجموع. انظر الصفوف المحتفظ بها.',
  'Usage is not the bill. The included credits of the seats pay for part of it, and only the rest is billed on top of the seat prices.':
    'الاستخدام ليس الفاتورة. الأرصدة المشمولة في التراخيص تدفع جزءًا منه، والباقي فقط يُدفع إضافيًا فوق أسعار التراخيص.',
  'Rows that went through Auto are already shown after the Auto discount.': 'الصفوف التي مرت عبر Auto تُعرض بالفعل بعد خصم Auto.',
  'Three rows with $2.50, $4.00 and $3.50 of usage, 1,000 AI credits in all, give a total usage of $10.00. If $6.00 of it is covered by included credits, $4.00 is billed.':
    'ثلاثة صفوف باستخدام $2.50 و$4.00 و$3.50، أي 1,000 رصيد ذكاء اصطناعي إجمالًا، تعطي إجمالي استخدام $10.00. إذا كان $6.00 منه مشمولًا بالأرصدة المشمولة، يُدفع $4.00 إضافيًا.',
  'The AI credits a month that the seat of the user includes, as the report states it on each row. The app uses it to work out the pool of included credits.':
    'أرصدة الذكاء الاصطناعي الشهرية التي يتضمنها ترخيص المستخدم، كما يذكرها التقرير في كل صف. يستخدمها التطبيق لحساب الرصيد المشترك من الأرصدة المشمولة.',
  'Seat size = total_monthly_quota of the row': 'حجم الترخيص = total_monthly_quota في الصف',
  'The value is in credits, not dollars. A Business seat is 1,900 credits ($19) and an Enterprise seat is 3,900 credits ($39).':
    'القيمة بالأرصدة، لا بالدولار. ترخيص Business يساوي 1,900 رصيد ($19) وترخيص Enterprise يساوي 3,900 رصيد ($39).',
  'An empty cell is read as 0. The pool of included credits skips users that have no seat size above 0.':
    'الخلية الفارغة تُقرأ 0. يتخطى الرصيد المشترك من الأرصدة المشمولة المستخدمين الذين ليس لهم حجم ترخيص أكبر من 0.',
  'The value can differ between the rows of one user. The pool takes the largest value of each user in each month.':
    'قد تختلف القيمة بين صفوف المستخدم الواحد. يأخذ الرصيد المشترك أكبر قيمة لكل مستخدم في كل شهر.',
  'It is the size of a seat, not the number of seats, and it does not show who has a seat.': 'إنه حجم الترخيص، لا عدد التراخيص، ولا يُظهر من لديه ترخيص.',
  'A row with a seat size of 1,900 belongs to a Business seat, which includes 1,900 credits ($19) a month.':
    'الصف الذي حجم ترخيصه 1,900 يخص ترخيص Business، الذي يتضمن 1,900 رصيد ($19) شهريًا.',
  'The rows behind the numbers, with a search and a download. The totals under the table add up every matching row, not only the page you see.':
    'الصفوف التي تقف خلف الأرقام، مع بحث وتنزيل. تجمع المجاميع تحت الجدول كل صف مطابق، لا الصفحة التي تراها فقط.',
  'Totals = sum of usage, covered and billed over all rows that match the date range, the filters and the search':
    'المجاميع = مجموع الاستخدام والمشمول بالخطة والمدفوع إضافيًا على كل الصفوف المطابقة لنطاق التاريخ وعوامل التصفية والبحث',
  'The rows are the rows kept, narrowed by the date range and the filters you set.': 'الصفوف هي الصفوف المحتفظ بها، مضيّقة بنطاق التاريخ وعوامل التصفية التي حددتها.',
  'The search takes up to 8 words. A row matches when every word appears in its username, model, repository, SKU, organization or cost center, in any capitalization. The word auto also matches Auto rows.':
    'يقبل البحث حتى 8 كلمات. يطابق الصف عندما تظهر كل كلمة في اسم المستخدم أو النموذج أو المستودع أو SKU أو المؤسسة أو مركز التكلفة، بأي حالة أحرف. وتطابق الكلمة auto أيضًا صفوف Auto.',
  'The table shows one page at a time. The totals under it cover all matching rows.': 'يعرض الجدول صفحة واحدة في كل مرة. تشمل المجاميع تحته كل الصفوف المطابقة.',
  'The download writes the matching rows as a CSV file with the columns of the report. It is rebuilt from what the app holds, not copied from your files.':
    'يكتب التنزيل الصفوف المطابقة في ملف CSV بأعمدة التقرير. يُعاد بناؤه مما يحتفظ به التطبيق، ولا يُنسخ من ملفاتك.',
  'In the rebuilt file unit_type is always ai-credits and the unit price is always 0.01. The aic_ columns are not written.':
    'في الملف المعاد بناؤه يكون unit_type دائمًا ai-credits وسعر الوحدة دائمًا 0.01. لا تُكتب أعمدة aic_.',
  'Covered and billed are written as 0 when your files had no columns for them.': 'يُكتب المشمول بالخطة والمدفوع إضافيًا 0 عندما لا يكون في ملفاتك أعمدة لهما.',
  'Dropped rows are in neither the table nor the download.': 'الصفوف المحذوفة ليست في الجدول ولا في التنزيل.',
  'The search and the filters do not change the other numbers on this page. They describe everything you loaded.':
    'البحث وعوامل التصفية لا تغيّر الأرقام الأخرى في هذه الصفحة. فهي تصف كل ما حمّلته.',
  'A search for the two words user-a and auto shows the Auto rows of user-a. The totals under the table cover all of them, even when the table has several pages.':
    'البحث بالكلمتين user-a وauto يُظهر صفوف Auto للمستخدم user-a. تشملها كلها المجاميع تحت الجدول، حتى لو كان للجدول عدة صفحات.',
  'A list of tests on the files you loaded. Each one looks for one kind of problem that can limit or distort the numbers on the other pages, and says what it found.':
    'قائمة اختبارات على الملفات التي حمّلتها. يبحث كل منها عن نوع واحد من المشكلات التي قد تحدّ الأرقام في الصفحات الأخرى أو تشوّهها، ويذكر ما وجده.',
  'Check result = the outcome of one test on the loaded files and rows, shown as Needs attention, For your information or Passed':
    'نتيجة الفحص = حصيلة اختبار واحد على الملفات والصفوف المحمّلة، تُعرض على أنها يحتاج إلى انتباه أو للعلم أو ناجح',
  'The checks on columns, bad dates, bad numbers, duplicates, mismatches and negative rows use counts that were made while each file was read.':
    'فحوص الأعمدة والتواريخ غير المقروءة والأرقام غير المقروءة والمكررات وعدم التطابق والصفوف السالبة تستخدم أعدادًا جُمعت أثناء قراءة كل ملف.',
  'The checks on usernames, models, tokens, gaps and months look at the rows that were kept.': 'فحوص أسماء المستخدمين والنماذج والرموز والفجوات والأشهر تنظر إلى الصفوف المحتفظ بها.',
  'Needs attention means the data can limit or distort a number on the other pages. For your information is a fact that is often normal, such as a repeated row or a missing username on a repository-level product. Passed means the test found nothing.':
    'يحتاج إلى انتباه يعني أن البيانات قد تحدّ رقمًا في الصفحات الأخرى أو تشوّهه. للعلم حقيقة غالبًا ما تكون طبيعية، مثل صف مكرر أو اسم مستخدم ناقص في منتج على مستوى المستودع. ناجح يعني أن الاختبار لم يجد شيئًا.',
  'The list shows Needs attention first, then For your information, then Passed. The badges count the checks in each status, and For your information checks are counted as notes.':
    'تعرض القائمة يحتاج إلى انتباه أولًا، ثم للعلم، ثم ناجح. تعدّ الشارات الفحوص في كل حالة، وتُعدّ فحوص للعلم ملاحظات.',
  'The checks look at all the files you loaded. The date range and the filters do not change them.': 'تنظر الفحوص إلى كل الملفات التي حمّلتها. نطاق التاريخ وعوامل التصفية لا تغيّرها.',
  'Each check has its own information icon that explains its test and what it cannot prove.': 'لكل فحص أيقونة معلومات خاصة به تشرح اختباره وما لا يستطيع إثباته.',
  'The checks never change a number. They only report what the reading of the files found.': 'لا تغيّر الفحوص أي رقم أبدًا. إنما تذكر فقط ما وجدته قراءة الملفات.',
  'A check that passes shows only that its test found nothing. It does not show that the export is complete or that the amounts are right. A file that stops early can pass every check.':
    'الفحص الناجح يُظهر فقط أن اختباره لم يجد شيئًا. ولا يُظهر أن الملف المصدّر مكتمل أو أن المبالغ صحيحة. الملف الذي يتوقف مبكرًا قد ينجح في كل الفحوص.',
};

export default arabic;
