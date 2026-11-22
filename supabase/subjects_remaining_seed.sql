-- =====================================================================
-- The remaining subjects, each as TWO editions with the same skills: English (id) and Arabic (id-ar).
-- Social Studies (History, Geography, Civics, Economics), Digital Skills, Islamic Studies, Art Education, Physical Education, and Other (no skills yet; add your own in the admin screen).
-- Run AFTER subjects_grade_language_patch.sql. Safe to re-run (never overwrites edits made in the admin screen).
-- =====================================================================

-- social-studies
insert into public.subjects (id, name, icon, sort, language) values ('social-studies', 'Social Studies', '🌍', 7, 'en') on conflict (id) do nothing;
insert into public.subject_domains (id, subject_id, name, sort) values
  ('social-studies.history', 'social-studies', 'History', 1),
  ('social-studies.geography', 'social-studies', 'Geography', 2),
  ('social-studies.civics-and-citizenship', 'social-studies', 'Civics & Citizenship', 3),
  ('social-studies.basic-economics', 'social-studies', 'Basic Economics', 4)
on conflict (id) do nothing;
insert into public.subject_skills (id, domain_id, subject_id, name, description, sort) values
  ('social-studies.history.chronology-and-historical-eras', 'social-studies.history', 'social-studies', 'Chronology & Historical Eras', 'Ordering historical events, eras, or dynasties chronologically on a timeline, and identifying centuries and periods.', 1),
  ('social-studies.history.historical-figures-events-and-landmarks', 'social-studies.history', 'social-studies', 'Historical Figures, Events & Landmarks', 'Matching historical figures to their key achievements or battles, and identifying the locations and significance of landmarks.', 2),
  ('social-studies.history.historical-cause-and-effect', 'social-studies.history', 'social-studies', 'Historical Cause & Effect', 'Identifying the direct cause or outcome of a historical event from a brief statement or 2–3 sentence passage.', 3),
  ('social-studies.history.civilizations-and-cultural-heritage', 'social-studies.history', 'social-studies', 'Civilizations & Cultural Heritage', 'Classifying civilizational achievements (writing, architecture, science, trade) and linking them to their originating civilization or region.', 4),
  ('social-studies.history.reading-short-historical-texts-and', 'social-studies.history', 'social-studies', 'Reading Short Historical Texts & Sources', 'Extracting explicit information or distinguishing fact from opinion in a very short historical text or quote.', 5),
  ('social-studies.geography.map-reading-directions-and-coordinates', 'social-studies.geography', 'social-studies', 'Map Reading, Directions & Coordinates', 'Identifying cardinal/intermediate directions, using map keys and scales, and locating places via latitude and longitude.', 1),
  ('social-studies.geography.landforms-and-physical-features', 'social-studies.geography', 'social-studies', 'Landforms & Physical Features', 'Recognizing landforms and bodies of water (mountains, plateaus, plains, valleys, islands, straits, seas) on a blank map or image.', 2),
  ('social-studies.geography.climate-and-environmental-regions', 'social-studies.geography', 'social-studies', 'Climate & Environmental Regions', 'Distinguishing weather from climate, and matching climate zones (desert, tropical, polar, temperate) to their flora and fauna.', 3),
  ('social-studies.geography.human-geography-and-population', 'social-studies.geography', 'social-studies', 'Human Geography & Population', 'Matching countries to their capitals, languages, and currencies, and understanding population distribution and migration factors.', 4),
  ('social-studies.geography.natural-resources-and-economic-activities', 'social-studies.geography', 'social-studies', 'Natural Resources & Economic Activities', 'Classifying natural resources (oil, minerals, water, forests) and linking geographic regions to their main economic activities.', 5),
  ('social-studies.civics-and-citizenship.national-identity-symbols-and-systems', 'social-studies.civics-and-citizenship', 'social-studies', 'National Identity, Symbols & Systems', 'Recognizing national symbols (flag, emblem, anthem, currency) and understanding basic citizen rights and responsibilities.', 1),
  ('social-studies.civics-and-citizenship.institutions-and-community-services', 'social-studies.civics-and-citizenship', 'social-studies', 'Institutions & Community Services', 'Matching government institutions, ministries, and public services to their respective roles in serving the community.', 2),
  ('social-studies.civics-and-citizenship.community-values-and-volunteering', 'social-studies.civics-and-citizenship', 'social-studies', 'Community Values & Volunteering', 'Identifying positive behavior and responsible citizenship in brief real-life scenarios (protecting public property, following laws, volunteering).', 3),
  ('social-studies.basic-economics.needs-wants-and-saving', 'social-studies.basic-economics', 'social-studies', 'Needs, Wants & Saving', 'Quickly distinguishing basic needs from wants, and understanding saving, wise spending, and simple budgeting.', 1),
  ('social-studies.basic-economics.production-consumption-and-trade', 'social-studies.basic-economics', 'social-studies', 'Production, Consumption & Trade', 'Distinguishing goods from services, producers from consumers, and exports from imports in brief examples.', 2)
on conflict (id) do nothing;
insert into public.subject_question_types (subject_id, question_type)
select 'social-studies', id from public.question_types on conflict do nothing;

-- social-studies-ar
insert into public.subjects (id, name, icon, sort, language) values ('social-studies-ar', 'الدراسات الاجتماعية', '🌍', 8, 'ar') on conflict (id) do nothing;
insert into public.subject_domains (id, subject_id, name, sort) values
  ('social-studies-ar.history', 'social-studies-ar', 'التاريخ', 1),
  ('social-studies-ar.geography', 'social-studies-ar', 'الجغرافيا', 2),
  ('social-studies-ar.civics-and-citizenship', 'social-studies-ar', 'التربية الوطنية والمواطنة', 3),
  ('social-studies-ar.basic-economics', 'social-studies-ar', 'مبادئ الاقتصاد والتعاملات', 4)
on conflict (id) do nothing;
insert into public.subject_skills (id, domain_id, subject_id, name, description, sort) values
  ('social-studies-ar.history.chronology-and-historical-eras', 'social-studies-ar.history', 'social-studies-ar', 'التسلسل الزمني والعصور التاريخية', 'ترتيب الأحداث التاريخية أو العصور أو الدول من الأقدم إلى الأحدث على خط زمني، وتحديد القرون والحقب التاريخية.', 1),
  ('social-studies-ar.history.historical-figures-events-and-landmarks', 'social-studies-ar.history', 'social-studies-ar', 'الشخصيات والأحداث والمعالم التاريخية', 'ربط الشخصيات التاريخية بأهم إنجازاتها أو معاركها، وتحديد مواقع وأهمية المعالم الأثرية والحضارية.', 2),
  ('social-studies-ar.history.historical-cause-and-effect', 'social-studies-ar.history', 'social-studies-ar', 'الأسباب والنتائج التاريخية', 'تحديد السبب المباشر لحدث تاريخي أو النتيجة المترتبة عليه من خلال عبارة أو فقرة قصيرة من جملتين إلى ثلاث.', 3),
  ('social-studies-ar.history.civilizations-and-cultural-heritage', 'social-studies-ar.history', 'social-studies-ar', 'الحضارات والتراث الثقافي', 'تصنيف المنجزات الحضارية (الكتابة، العمارة، العلوم، التجارة) وربطها بالحضارة أو المنطقة التي نشأت فيها.', 4),
  ('social-studies-ar.history.reading-short-historical-texts-and', 'social-studies-ar.history', 'social-studies-ar', 'قراءة النصوص والوثائق التاريخية القصيرة', 'استخراج معلومة صريحة أو التمييز بين الحقيقة والرأي في نص تاريخي قصير جداً أو مقولة تاريخية.', 5),
  ('social-studies-ar.geography.map-reading-directions-and-coordinates', 'social-studies-ar.geography', 'social-studies-ar', 'قراءة الخرائط والاتجاهات والإحداثيات', 'تحديد الاتجاهات الأصلية والفرعية، واستخدام مفتاح الخريطة ومقياس الرسم، وتحديد المواقع عبر خطوط الطول ودوائر العرض.', 1),
  ('social-studies-ar.geography.landforms-and-physical-features', 'social-studies-ar.geography', 'social-studies-ar', 'التضاريس والظواهر الطبيعية', 'التعرف على أشكال سطح الأرض (جبال، هضاب، سهول، أودية، جزر، مضائق، بحار) وتحديدها على خريطة صماء أو صورة.', 2),
  ('social-studies-ar.geography.climate-and-environmental-regions', 'social-studies-ar.geography', 'social-studies-ar', 'المناخ والأقاليم البيئية', 'التمييز بين عناصر الطقس والمناخ، وربط كل إقليم مناخي (صحراوي، استوائي، قطبي، معتدل) بخصائصه النباتية والحيوانية.', 3),
  ('social-studies-ar.geography.human-geography-and-population', 'social-studies-ar.geography', 'social-studies-ar', 'الجغرافيا البشرية والسكان', 'ربط الدول بعواصمها ولغاتها وعملاتها، وفهم توزيع السكان وعوامل الجذب والطرد السكاني.', 4),
  ('social-studies-ar.geography.natural-resources-and-economic-activities', 'social-studies-ar.geography', 'social-studies-ar', 'الموارد الطبيعية والأنشطة الاقتصادية', 'تصنيف الموارد الطبيعية (نفط، معادن، مياه، غابات) وربط المناطق الجغرافية بأبرز أنشطتها (زراعة، صناعة، تجارة، سياحة).', 5),
  ('social-studies-ar.civics-and-citizenship.national-identity-symbols-and-systems', 'social-studies-ar.civics-and-citizenship', 'social-studies-ar', 'الهوية الوطنية والرموز والأنظمة', 'التعرف على الرموز الوطنية (العلم، الشعار، النشيد، العملة)، وفهم الحقوق والواجبات الأساسية للمواطن.', 1),
  ('social-studies-ar.civics-and-citizenship.institutions-and-community-services', 'social-studies-ar.civics-and-citizenship', 'social-studies-ar', 'المؤسسات والخدمات المجتمعية', 'ربط المؤسسات والوزارات الحكومية والخدمات العامة بالدور الذي تؤديه في خدمة المجتمع.', 2),
  ('social-studies-ar.civics-and-citizenship.community-values-and-volunteering', 'social-studies-ar.civics-and-citizenship', 'social-studies-ar', 'القيم المجتمعية والعمل التطوعي', 'تحديد السلوك الإيجابي والمواطنة المسؤولة في مواقف حياتية قصيرة (المحافظة على الممتلكات العامة، الالتزام بالأنظمة، التطوع).', 3),
  ('social-studies-ar.basic-economics.needs-wants-and-saving', 'social-studies-ar.basic-economics', 'social-studies-ar', 'الحاجات والرغبات والادخار', 'التمييز السريع بين الحاجات الأساسية والرغبات، وفهم مفاهيم الادخار والإنفاق الرشيد والميزانية البسيطة.', 1),
  ('social-studies-ar.basic-economics.production-consumption-and-trade', 'social-studies-ar.basic-economics', 'social-studies-ar', 'الإنتاج والاستهلاك والتبادل التجاري', 'التمييز بين السلعة والخدمة، والمنتِج والمستهلِك، ومفهوم الصادرات والواردات في أمثلة قصيرة.', 2)
on conflict (id) do nothing;
insert into public.subject_question_types (subject_id, question_type)
select 'social-studies-ar', id from public.question_types on conflict do nothing;

-- digital-skills
insert into public.subjects (id, name, icon, sort, language) values ('digital-skills', 'Digital Skills', '💻', 9, 'en') on conflict (id) do nothing;
insert into public.subject_domains (id, subject_id, name, sort) values
  ('digital-skills.computer-fundamentals-and-operating-systems', 'digital-skills', 'Computer Fundamentals & Operating Systems', 1),
  ('digital-skills.programming-and-computational-thinking', 'digital-skills', 'Programming & Computational Thinking', 2),
  ('digital-skills.artificial-intelligence-and-data', 'digital-skills', 'Artificial Intelligence & Data', 3),
  ('digital-skills.internet-networks-and-cloud-computing', 'digital-skills', 'Internet, Networks & Cloud Computing', 4),
  ('digital-skills.digital-citizenship-and-cybersecurity', 'digital-skills', 'Digital Citizenship & Cybersecurity', 5),
  ('digital-skills.productivity-and-multimedia-software', 'digital-skills', 'Productivity & Multimedia Software', 6)
on conflict (id) do nothing;
insert into public.subject_skills (id, domain_id, subject_id, name, description, sort) values
  ('digital-skills.computer-fundamentals-and-operating-systems.hardware-and-software-components', 'digital-skills.computer-fundamentals-and-operating-systems', 'digital-skills', 'Hardware & Software Components', 'Classifying input, output, storage, and processing devices, and distinguishing system software from application software.', 1),
  ('digital-skills.computer-fundamentals-and-operating-systems.file-management-and-extensions', 'digital-skills.computer-fundamentals-and-operating-systems', 'digital-skills', 'File Management & Extensions', 'Matching file extensions to file types and programs (e.g., .docx, .xlsx, .pptx, .mp4, .pdf, .py), and ordering folder organization steps.', 2),
  ('digital-skills.computer-fundamentals-and-operating-systems.os-interface-and-keyboard-shortcuts', 'digital-skills.computer-fundamentals-and-operating-systems', 'digital-skills', 'OS Interface & Keyboard Shortcuts', 'Identifying core OS icon functions and common keyboard shortcuts (copy, paste, undo, save).', 3),
  ('digital-skills.programming-and-computational-thinking.algorithms-and-logical-sequencing', 'digital-skills.programming-and-computational-thinking', 'digital-skills', 'Algorithms & Logical Sequencing', 'Ordering steps to solve a problem or complete a flowchart sequentially, and matching flowchart shapes to their functions.', 1),
  ('digital-skills.programming-and-computational-thinking.coding-blocks-and-basic-commands', 'digital-skills.programming-and-computational-thinking', 'digital-skills', 'Coding Blocks & Basic Commands', 'Ordering visual coding blocks (e.g., Scratch) to achieve a specific action, or completing a short text-based command (e.g., Python).', 2),
  ('digital-skills.programming-and-computational-thinking.variables-conditionals-and-loops', 'digital-skills.programming-and-computational-thinking', 'digital-skills', 'Variables, Conditionals & Loops', 'Tracing the output of a 2–3 line code snippet containing conditional statements (If/Else) or loops (For/While).', 3),
  ('digital-skills.programming-and-computational-thinking.debugging-simple-code', 'digital-skills.programming-and-computational-thinking', 'digital-skills', 'Debugging Simple Code', 'Identifying a logic or syntax error in a short line of code and selecting the correct fix.', 4),
  ('digital-skills.artificial-intelligence-and-data.ai-concepts-and-applications', 'digital-skills.artificial-intelligence-and-data', 'digital-skills', 'AI Concepts & Applications', 'Distinguishing AI from Machine Learning, and matching AI applications (speech recognition, computer vision, NLP) to everyday examples.', 1),
  ('digital-skills.artificial-intelligence-and-data.data-information-and-knowledge', 'digital-skills.artificial-intelligence-and-data', 'digital-skills', 'Data, Information & Knowledge', 'Distinguishing raw data from processed information, and identifying data types (text, numeric, boolean, media).', 2),
  ('digital-skills.artificial-intelligence-and-data.spreadsheets-and-simple-formulas', 'digital-skills.artificial-intelligence-and-data', 'digital-skills', 'Spreadsheets & Simple Formulas', 'Identifying cell references (e.g., B3) and selecting the appropriate function (SUM, AVERAGE, MAX, MIN) for a quick calculation.', 3),
  ('digital-skills.internet-networks-and-cloud-computing.network-concepts-and-devices', 'digital-skills.internet-networks-and-cloud-computing', 'digital-skills', 'Network Concepts & Devices', 'Distinguishing network types (LAN, WAN) and matching network devices (Router, Switch, Modem) to their functions.', 1),
  ('digital-skills.internet-networks-and-cloud-computing.urls-and-search-engines', 'digital-skills.internet-networks-and-cloud-computing', 'digital-skills', 'URLs & Search Engines', 'Analyzing URL components (protocol, domain name, extensions like .edu, .gov, .org) and using precise search operators.', 2),
  ('digital-skills.internet-networks-and-cloud-computing.cloud-computing-and-digital-collaboration', 'digital-skills.internet-networks-and-cloud-computing', 'digital-skills', 'Cloud Computing & Digital Collaboration', 'Distinguishing local storage from cloud storage, and identifying sharing permissions (view, comment, edit).', 3),
  ('digital-skills.digital-citizenship-and-cybersecurity.account-security-and-passwords', 'digital-skills.digital-citizenship-and-cybersecurity', 'digital-skills', 'Account Security & Passwords', 'Distinguishing strong vs. weak passwords, and understanding Two-Factor Authentication (2FA) and security updates.', 1),
  ('digital-skills.digital-citizenship-and-cybersecurity.cyber-threats-and-phishing', 'digital-skills.digital-citizenship-and-cybersecurity', 'digital-skills', 'Cyber Threats & Phishing', 'Spotting signs of phishing messages, suspicious links, and malware in brief scenarios.', 2),
  ('digital-skills.digital-citizenship-and-cybersecurity.digital-ethics-and-copyright', 'digital-skills.digital-citizenship-and-cybersecurity', 'digital-skills', 'Digital Ethics & Copyright', 'Distinguishing safe, responsible digital behavior from cyberbullying, and respecting copyright and intellectual property.', 3),
  ('digital-skills.productivity-and-multimedia-software.word-processing-and-presentations', 'digital-skills.productivity-and-multimedia-software', 'digital-skills', 'Word Processing & Presentations', 'Matching formatting icons (alignment, lists, insert table/image, transitions) to their visual functions.', 1),
  ('digital-skills.productivity-and-multimedia-software.image-audio-and-video-editing', 'digital-skills.productivity-and-multimedia-software', 'digital-skills', 'Image, Audio & Video Editing', 'Identifying basic editing tools (crop, rotate, merge clips, remove background) via description or icon.', 2)
on conflict (id) do nothing;
insert into public.subject_question_types (subject_id, question_type)
select 'digital-skills', id from public.question_types on conflict do nothing;

-- digital-skills-ar
insert into public.subjects (id, name, icon, sort, language) values ('digital-skills-ar', 'المهارات الرقمية', '💻', 10, 'ar') on conflict (id) do nothing;
insert into public.subject_domains (id, subject_id, name, sort) values
  ('digital-skills-ar.computer-fundamentals-and-operating-systems', 'digital-skills-ar', 'أساسيات الحاسب وأنظمة التشغيل', 1),
  ('digital-skills-ar.programming-and-computational-thinking', 'digital-skills-ar', 'البرمجة والتفكير الحاسوبي', 2),
  ('digital-skills-ar.artificial-intelligence-and-data', 'digital-skills-ar', 'الذكاء الاصطناعي والبيانات', 3),
  ('digital-skills-ar.internet-networks-and-cloud-computing', 'digital-skills-ar', 'الإنترنت والشبكات والحوسبة السحابية', 4),
  ('digital-skills-ar.digital-citizenship-and-cybersecurity', 'digital-skills-ar', 'المواطنة الرقمية والأمن السيبراني', 5),
  ('digital-skills-ar.productivity-and-multimedia-software', 'digital-skills-ar', 'برامج الإنتاجية والوسائط المتعددة', 6)
on conflict (id) do nothing;
insert into public.subject_skills (id, domain_id, subject_id, name, description, sort) values
  ('digital-skills-ar.computer-fundamentals-and-operating-systems.hardware-and-software-components', 'digital-skills-ar.computer-fundamentals-and-operating-systems', 'digital-skills-ar', 'مكونات الحاسب المادية والبرمجية', 'تصنيف وحدات الإدخال والإخراج والتخزين والمعالجة، والتمييز بين برمجيات النظام والبرمجيات التطبيقية.', 1),
  ('digital-skills-ar.computer-fundamentals-and-operating-systems.file-management-and-extensions', 'digital-skills-ar.computer-fundamentals-and-operating-systems', 'digital-skills-ar', 'إدارة الملفات وامتداداتها', 'ربط امتداد الملف بنوعه والبرنامج المشغّل له (مثل: .docx, .xlsx, .pptx, .mp4, .pdf, .py)، وترتيب خطوات تنظيم المجلدات.', 2),
  ('digital-skills-ar.computer-fundamentals-and-operating-systems.os-interface-and-keyboard-shortcuts', 'digital-skills-ar.computer-fundamentals-and-operating-systems', 'digital-skills-ar', 'واجهة نظام التشغيل والاختصارات', 'تحديد وظائف أيقونات النظام الأساسية واختصارات لوحة المفاتيح الشائعة (النسخ، اللصق، التراجع، الحفظ).', 3),
  ('digital-skills-ar.programming-and-computational-thinking.algorithms-and-logical-sequencing', 'digital-skills-ar.programming-and-computational-thinking', 'digital-skills-ar', 'الخوارزميات والخطوات المنطقية', 'ترتيب خطوات حل مشكلة برمجية أو مخطط انسيابي (Flowchart) بالتسلسل الصحيح، وربط أشكال المخطط الانسيابي بوظائفها.', 1),
  ('digital-skills-ar.programming-and-computational-thinking.coding-blocks-and-basic-commands', 'digital-skills-ar.programming-and-computational-thinking', 'digital-skills-ar', 'اللبنات البرمجية والأوامر الأساسية', 'ترتيب لبنات برمجية (مثل Scratch) لتحقيق حركة أو نتيجة محددة، أو إكمال أمر برمجي قصير (مثل Python).', 2),
  ('digital-skills-ar.programming-and-computational-thinking.variables-conditionals-and-loops', 'digital-skills-ar.programming-and-computational-thinking', 'digital-skills-ar', 'المتغيرات والشروط والتكرار', 'تتبع مخرجات كود قصير من سطرين إلى ثلاثة أسطر يتضمن جملة شرطية (If/Else) أو حلقة تكرار (For/While).', 3),
  ('digital-skills-ar.programming-and-computational-thinking.debugging-simple-code', 'digital-skills-ar.programming-and-computational-thinking', 'digital-skills-ar', 'اكتشاف الأخطاء البرمجية', 'تحديد الخطأ المنطقي أو الإملائي (Syntax Error) في سطر برمجي قصير واختيار التصحيح المناسب.', 4),
  ('digital-skills-ar.artificial-intelligence-and-data.ai-concepts-and-applications', 'digital-skills-ar.artificial-intelligence-and-data', 'digital-skills-ar', 'مفاهيم وتطبيقات الذكاء الاصطناعي', 'التمييز بين الذكاء الاصطناعي وتعلم الآلة، وربط تطبيقات الذكاء الاصطناعي (التعرف على الصوت، الرؤية الحاسوبية، معالجة اللغات) بأمثلتها اليومية.', 1),
  ('digital-skills-ar.artificial-intelligence-and-data.data-information-and-knowledge', 'digital-skills-ar.artificial-intelligence-and-data', 'digital-skills-ar', 'البيانات والمعلومات والمعرفة', 'التمييز بين البيانات الخام والمعلومات المعالجة، وتحديد أنواع البيانات (نصية، رقمية، منطقية، وسائط).', 2),
  ('digital-skills-ar.artificial-intelligence-and-data.spreadsheets-and-simple-formulas', 'digital-skills-ar.artificial-intelligence-and-data', 'digital-skills-ar', 'الجداول الإلكترونية والصيغ البسيطة', 'تحديد اسم الخلية (مثل B3)، واختيار الدالة المناسبة (SUM, AVERAGE, MAX, MIN) لإتمام عملية حسابية سريعة.', 3),
  ('digital-skills-ar.internet-networks-and-cloud-computing.network-concepts-and-devices', 'digital-skills-ar.internet-networks-and-cloud-computing', 'digital-skills-ar', 'مفاهيم الشبكات وأجهزتها', 'التمييز بين أنواع الشبكات (LAN, WAN)، وربط أجهزة الشبكة (الموجّه Router، المبدّل Switch، المودم) بوظائفها.', 1),
  ('digital-skills-ar.internet-networks-and-cloud-computing.urls-and-search-engines', 'digital-skills-ar.internet-networks-and-cloud-computing', 'digital-skills-ar', 'عناوين المواقع ومحركات البحث', 'تحليل مكونات عنوان الموقع الإلكتروني (البروتوكول، اسم النطاق، اللاحقة .edu, .gov, .org)، واستخدام رموز البحث الدقيق.', 2),
  ('digital-skills-ar.internet-networks-and-cloud-computing.cloud-computing-and-digital-collaboration', 'digital-skills-ar.internet-networks-and-cloud-computing', 'digital-skills-ar', 'الحوسبة السحابية والتعاون الرقمي', 'التمييز بين التخزين المحلي والتخزين السحابي، وتحديد أذونات المشاركة (عرض، تعليق، تحرير).', 3),
  ('digital-skills-ar.digital-citizenship-and-cybersecurity.account-security-and-passwords', 'digital-skills-ar.digital-citizenship-and-cybersecurity', 'digital-skills-ar', 'حماية الحسابات وكلمات المرور', 'التمييز بين كلمة المرور القوية والضعيفة، وفهم أهمية المصادقة الثنائية (2FA) وتحديثات الأمان.', 1),
  ('digital-skills-ar.digital-citizenship-and-cybersecurity.cyber-threats-and-phishing', 'digital-skills-ar.digital-citizenship-and-cybersecurity', 'digital-skills-ar', 'التهديدات السيبرانية والتصيد الإلكتروني', 'اكتشاف علامات الرسائل الاحتيالية (Phishing) والروابط المشبوهة والبرمجيات الخبيثة في أمثلة قصيرة.', 2),
  ('digital-skills-ar.digital-citizenship-and-cybersecurity.digital-ethics-and-copyright', 'digital-skills-ar.digital-citizenship-and-cybersecurity', 'digital-skills-ar', 'أخلاقيات التعامل الرقمي وحقوق الملكية', 'التمييز بين السلوك الرقمي الآمن والمسؤول والتنمر الإلكتروني، واحترام حقوق النشر والملكية الفكرية.', 3),
  ('digital-skills-ar.productivity-and-multimedia-software.word-processing-and-presentations', 'digital-skills-ar.productivity-and-multimedia-software', 'digital-skills-ar', 'معالجة النصوص والعروض التقديمية', 'ربط أيقونات التنسيق (المحاذاة، التعداد، إدراج جدول/صورة، الحركات الانتقالية) بوظيفتها البصرية.', 1),
  ('digital-skills-ar.productivity-and-multimedia-software.image-audio-and-video-editing', 'digital-skills-ar.productivity-and-multimedia-software', 'digital-skills-ar', 'تحرير الصور والصوت والفيديو', 'تحديد أدوات التحرير الأساسية (القص Crop، التدوير، دمج المقاطع، إزالة الخلفية) من خلال وصف أو أيقونة.', 2)
on conflict (id) do nothing;
insert into public.subject_question_types (subject_id, question_type)
select 'digital-skills-ar', id from public.question_types on conflict do nothing;

-- islamic-studies
insert into public.subjects (id, name, icon, sort, language) values ('islamic-studies', 'Islamic Studies', '🕌', 11, 'en') on conflict (id) do nothing;
insert into public.subject_domains (id, subject_id, name, sort) values
  ('islamic-studies.the-holy-quran-and-tajweed', 'islamic-studies', 'The Holy Quran & Tajweed', 1),
  ('islamic-studies.prophetic-hadith-and-sunnah', 'islamic-studies', 'Prophetic Hadith & Sunnah', 2),
  ('islamic-studies.aqeedah', 'islamic-studies', 'Aqeedah (Islamic Creed)', 3),
  ('islamic-studies.fiqh', 'islamic-studies', 'Fiqh (Islamic Jurisprudence & Worship)', 4),
  ('islamic-studies.prophetic-seerah-and-islamic-etiquette', 'islamic-studies', 'Prophetic Seerah & Islamic Etiquette', 5)
on conflict (id) do nothing;
insert into public.subject_skills (id, domain_id, subject_id, name, description, sort) values
  ('islamic-studies.the-holy-quran-and-tajweed.completing-and-ordering-verses', 'islamic-studies.the-holy-quran-and-tajweed', 'islamic-studies', 'Completing & Ordering Verses', 'Filling in a missing word in a verse, ordering 3–4 consecutive verses from an assigned Surah, or matching a verse to its Surah name.', 1),
  ('islamic-studies.the-holy-quran-and-tajweed.quranic-vocabulary-and-meanings', 'islamic-studies.the-holy-quran-and-tajweed', 'islamic-studies', 'Quranic Vocabulary & Meanings', 'Selecting the correct meaning of a Quranic term appearing in a short verse via matching or multiple-choice.', 2),
  ('islamic-studies.the-holy-quran-and-tajweed.applied-tajweed-rules', 'islamic-studies.the-holy-quran-and-tajweed', 'islamic-studies', 'Applied Tajweed Rules', 'Identifying the Tajweed rule in a word or short audio clip, such as Noon Sakinah & Tanween, Meem Sakinah, Qalqalah, or basic Madd.', 3),
  ('islamic-studies.the-holy-quran-and-tajweed.general-comprehension-and-guidance', 'islamic-studies.the-holy-quran-and-tajweed', 'islamic-studies', 'General Comprehension & Guidance', 'Inferring the core moral value or guidance derived from one or two short verses.', 4),
  ('islamic-studies.prophetic-hadith-and-sunnah.completing-and-ordering-hadith-texts', 'islamic-studies.prophetic-hadith-and-sunnah', 'islamic-studies', 'Completing & Ordering Hadith Texts', 'Filling in a missing word in a short Hadith, ordering sequential phrases of a Hadith, or matching a Hadith to its Companion narrator.', 1),
  ('islamic-studies.prophetic-hadith-and-sunnah.hadith-vocabulary', 'islamic-studies.prophetic-hadith-and-sunnah', 'islamic-studies', 'Hadith Vocabulary', 'Identifying the meaning of a word or Prophetic phrase within the context of a Hadith.', 2),
  ('islamic-studies.prophetic-hadith-and-sunnah.extracting-lessons-and-rulings', 'islamic-studies.prophetic-hadith-and-sunnah', 'islamic-studies', 'Extracting Lessons & Rulings', 'Selecting the recommended behavior or lesson derived from a short Hadith in a direct real-life scenario.', 3),
  ('islamic-studies.aqeedah.pillars-of-islam-and-pillars', 'islamic-studies.aqeedah', 'islamic-studies', 'Pillars of Islam & Pillars of Iman', 'Distinguishing between the Five Pillars of Islam and the Six Pillars of Iman, ordering them, and identifying their meanings.', 1),
  ('islamic-studies.aqeedah.names-and-attributes-of-allah', 'islamic-studies.aqeedah', 'islamic-studies', 'Names & Attributes of Allah', 'Matching one of Allah''s Beautiful Names to its accurate meaning and its behavioral impact on a believer.', 2),
  ('islamic-studies.aqeedah.nullifiers-of-tawheed-and-shirk', 'islamic-studies.aqeedah', 'islamic-studies', 'Nullifiers of Tawheed & Shirk', 'Classifying specific statements or actions (e.g., supplication, seeking help, reliance, swearing) as pure Tawheed, major Shirk, or minor Shirk.', 3),
  ('islamic-studies.aqeedah.belief-in-angels-books-messengers', 'islamic-studies.aqeedah', 'islamic-studies', 'Belief in Angels, Books, Messengers & the Last Day', 'Matching angels to their duties, revealed scriptures to their respective Messengers, and identifying signs and events of the Last Day.', 4),
  ('islamic-studies.fiqh.purification-wudu-and-tayammum', 'islamic-studies.fiqh', 'islamic-studies', 'Purification, Wudu & Tayammum', 'Ordering obligatory and Sunnah acts of Wudu, distinguishing nullifiers of Wudu, and identifying conditions for wiping over socks and Tayammum.', 1),
  ('islamic-studies.fiqh.salah-and-its-rulings', 'islamic-studies.fiqh', 'islamic-studies', 'Salah (Prayer) & Its Rulings', 'Distinguishing conditions, pillars, obligations, Sunnahs, and invalidators of Salah, as well as prayer times and number of Rak''ahs.', 2),
  ('islamic-studies.fiqh.zakah-fasting-and-hajj', 'islamic-studies.fiqh', 'islamic-studies', 'Zakah, Fasting & Hajj', 'Identifying Zakah eligibility and recipients, invalidators and recommended acts of fasting, and pillars/obligations of Hajj and Umrah.', 3),
  ('islamic-studies.fiqh.legal-rulings-and-basic-transactions', 'islamic-studies.fiqh', 'islamic-studies', 'Legal Rulings & Basic Transactions', 'Classifying actions into obligatory, recommended, permissible, disliked, or forbidden, and distinguishing lawful vs. unlawful transactions in brief scenarios.', 4),
  ('islamic-studies.prophetic-seerah-and-islamic-etiquette.chronology-of-seerah-events', 'islamic-studies.prophetic-seerah-and-islamic-etiquette', 'islamic-studies', 'Chronology of Seerah Events', 'Ordering major milestones of the Prophet''s biography (birth, revelation, Hijrah, major battles, Conquest of Makkah, Farewell Pilgrimage) and linking them to places and dates.', 1),
  ('islamic-studies.prophetic-seerah-and-islamic-etiquette.prophetic-lineage-companions-and-mothers', 'islamic-studies.prophetic-seerah-and-islamic-etiquette', 'islamic-studies', 'Prophetic Lineage, Companions & Mothers of the Believers', 'Identifying the Prophet''s lineage, the Ten Promised Paradise, the Mothers of the Believers, and key stances of the Companions.', 2),
  ('islamic-studies.prophetic-seerah-and-islamic-etiquette.authentic-supplications-and-adhkar', 'islamic-studies.prophetic-seerah-and-islamic-etiquette', 'islamic-studies', 'Authentic Supplications & Adhkar', 'Matching specific supplications/Adhkar to their corresponding occasions (entering the mosque, traveling, eating, sleeping, waking up).', 3),
  ('islamic-studies.prophetic-seerah-and-islamic-etiquette.islamic-manners-and-ethics', 'islamic-studies.prophetic-seerah-and-islamic-etiquette', 'islamic-studies', 'Islamic Manners & Ethics', 'Selecting the behavior aligned with Islamic manners in brief scenarios (honoring parents, seeking permission, gathering etiquette, removing harm).', 4)
on conflict (id) do nothing;
insert into public.subject_question_types (subject_id, question_type)
select 'islamic-studies', id from public.question_types on conflict do nothing;

-- islamic-studies-ar
insert into public.subjects (id, name, icon, sort, language) values ('islamic-studies-ar', 'الدراسات الإسلامية', '🕌', 12, 'ar') on conflict (id) do nothing;
insert into public.subject_domains (id, subject_id, name, sort) values
  ('islamic-studies-ar.the-holy-quran-and-tajweed', 'islamic-studies-ar', 'القرآن الكريم وعلومه والتجويد', 1),
  ('islamic-studies-ar.prophetic-hadith-and-sunnah', 'islamic-studies-ar', 'الحديث الشريف والسنة النبوية', 2),
  ('islamic-studies-ar.aqeedah', 'islamic-studies-ar', 'التوحيد والعقيدة الإسلامية', 3),
  ('islamic-studies-ar.fiqh', 'islamic-studies-ar', 'الفقه والعبادات والمعاملات', 4),
  ('islamic-studies-ar.prophetic-seerah-and-islamic-etiquette', 'islamic-studies-ar', 'السيرة النبوية والآداب الإسلامية', 5)
on conflict (id) do nothing;
insert into public.subject_skills (id, domain_id, subject_id, name, description, sort) values
  ('islamic-studies-ar.the-holy-quran-and-tajweed.completing-and-ordering-verses', 'islamic-studies-ar.the-holy-quran-and-tajweed', 'islamic-studies-ar', 'إكمال الآيات وترتيبها', 'إكمال الكلمة الناقصة في آية كريمة، أو ترتيب 3–4 آيات متتالية من سورة مقررة، أو ربط الآية باسم السورة.', 1),
  ('islamic-studies-ar.the-holy-quran-and-tajweed.quranic-vocabulary-and-meanings', 'islamic-studies-ar.the-holy-quran-and-tajweed', 'islamic-studies-ar', 'معاني الكلمات القرآنية', 'اختيار المعنى الصحيح لمفردة قرآنية وردت في آية قصيرة عبر التوصيل أو الاختيار من متعدد.', 2),
  ('islamic-studies-ar.the-holy-quran-and-tajweed.applied-tajweed-rules', 'islamic-studies-ar.the-holy-quran-and-tajweed', 'islamic-studies-ar', 'أحكام التجويد التطبيقية', 'تحديد حكم التجويد في كلمة أو مقطع صوتي قصير (مثل: أحكام النون الساكنة والتنوين، الميم الساكنة، القلقلة، المدود الأساسية).', 3),
  ('islamic-studies-ar.the-holy-quran-and-tajweed.general-comprehension-and-guidance', 'islamic-studies-ar.the-holy-quran-and-tajweed', 'islamic-studies-ar', 'الفهم العام والهدايات القرآنية', 'استنتاج القيمة أو التوجيه المستفاد من آية أو آيتين قصيرتين.', 4),
  ('islamic-studies-ar.prophetic-hadith-and-sunnah.completing-and-ordering-hadith-texts', 'islamic-studies-ar.prophetic-hadith-and-sunnah', 'islamic-studies-ar', 'إكمال نص الحديث وترتيبه', 'إكمال كلمة محذوفة من حديث نبوي قصير، أو ترتيب عبارات الحديث المتسلسلة، أو ربط الحديث براويه من الصحابة.', 1),
  ('islamic-studies-ar.prophetic-hadith-and-sunnah.hadith-vocabulary', 'islamic-studies-ar.prophetic-hadith-and-sunnah', 'islamic-studies-ar', 'معاني مفردات الحديث', 'تحديد معنى كلمة أو عبارة نبوية ضمن سياق الحديث الشريف.', 2),
  ('islamic-studies-ar.prophetic-hadith-and-sunnah.extracting-lessons-and-rulings', 'islamic-studies-ar.prophetic-hadith-and-sunnah', 'islamic-studies-ar', 'استنباط الفوائد والأحكام من الحديث', 'اختيار السلوك أو الفائدة المستنبطة من حديث قصير في موقف حياتي مباشر.', 3),
  ('islamic-studies-ar.aqeedah.pillars-of-islam-and-pillars', 'islamic-studies-ar.aqeedah', 'islamic-studies-ar', 'أركان الإسلام وأركان الإيمان', 'التمييز بين أركان الإسلام الخمسة وأركان الإيمان الستة وترتيبها وتحديد مدلول كل ركن.', 1),
  ('islamic-studies-ar.aqeedah.names-and-attributes-of-allah', 'islamic-studies-ar.aqeedah', 'islamic-studies-ar', 'أسماء الله الحسنى وصفاتها', 'ربط اسم من أسماء الله الحسنى بمعناه الصحيح وأثر الإيمان به في سلوك المسلم.', 2),
  ('islamic-studies-ar.aqeedah.nullifiers-of-tawheed-and-shirk', 'islamic-studies-ar.aqeedah', 'islamic-studies-ar', 'نواقض التوحيد ومظاهر الشرك والبدع', 'تصنيف أقوال أو أفعال معينة (مثل الدعاء، الاستعانة، التوكل، الحلف) إلى توحيد خالص أو شرك أكبر أو أصغر.', 3),
  ('islamic-studies-ar.aqeedah.belief-in-angels-books-messengers', 'islamic-studies-ar.aqeedah', 'islamic-studies-ar', 'الإيمان بالملائكة والكتب والرسل واليوم الآخر', 'ربط الملائكة بوظائفهم، والكتب السماوية بالرسل الذين أُنزلت عليهم، ومعرفة أشراط الساعة وأحداث اليوم الآخر.', 4),
  ('islamic-studies-ar.fiqh.purification-wudu-and-tayammum', 'islamic-studies-ar.fiqh', 'islamic-studies-ar', 'الطهارة والوضوء والتيمم', 'ترتيب فروض وسنن الوضوء، والتمييز بين نواقض الوضوء ومكروهاته، وتحديد شروط المسح على الخفين والتيمم.', 1),
  ('islamic-studies-ar.fiqh.salah-and-its-rulings', 'islamic-studies-ar.fiqh', 'islamic-studies-ar', 'الصلاة وأحكامها', 'التمييز بين شروط الصلاة وأركانها وواجباتها وسننها ومبطلاتها، وتحديد مواقيت الصلوات وعدد ركعاتها.', 2),
  ('islamic-studies-ar.fiqh.zakah-fasting-and-hajj', 'islamic-studies-ar.fiqh', 'islamic-studies-ar', 'الزكاة والصيام والحج', 'تحديد شروط وجوب الزكاة ومصارفها، ومفطرات الصيام ومستحباته، وأركان الحج والعمرة وواجباتهما ومواقيتهما.', 3),
  ('islamic-studies-ar.fiqh.legal-rulings-and-basic-transactions', 'islamic-studies-ar.fiqh', 'islamic-studies-ar', 'الأحكام التكليفية والمعاملات الأساسية', 'تصنيف الأفعال إلى (واجب، مستحب، مباح، مكروه، محرم)، والتمييز بين البيوع الجائزة والمحرمة في أمثلة قصيرة.', 4),
  ('islamic-studies-ar.prophetic-seerah-and-islamic-etiquette.chronology-of-seerah-events', 'islamic-studies-ar.prophetic-seerah-and-islamic-etiquette', 'islamic-studies-ar', 'أحداث السيرة النبوية وتسلسلها', 'ترتيب أبرز محطات السيرة النبوية (المولد، البعثة، الهجرة، الغزوات الكبرى، فتح مكة، حجة الوداع) وربطها بأماكنها وتواريخها.', 1),
  ('islamic-studies-ar.prophetic-seerah-and-islamic-etiquette.prophetic-lineage-companions-and-mothers', 'islamic-studies-ar.prophetic-seerah-and-islamic-etiquette', 'islamic-studies-ar', 'نسب النبي ﷺ والصحابة وأمهات المؤمنين', 'التعرف على نسب النبي ﷺ، وأسماء العشرة المبشرين بالجنة، وأمهات المؤمنين، وأبرز مواقف الصحابة.', 2),
  ('islamic-studies-ar.prophetic-seerah-and-islamic-etiquette.authentic-supplications-and-adhkar', 'islamic-studies-ar.prophetic-seerah-and-islamic-etiquette', 'islamic-studies-ar', 'الأذكار والأدعية المأثورة', 'ربط الذكر أو الدعاء بالمناسبة الشرعية المرتبطة به (دخول المسجد، السفر، الطعام، النوم، الاستيقاظ).', 3),
  ('islamic-studies-ar.prophetic-seerah-and-islamic-etiquette.islamic-manners-and-ethics', 'islamic-studies-ar.prophetic-seerah-and-islamic-etiquette', 'islamic-studies-ar', 'الآداب والأخلاق الإسلامية', 'اختيار التصرف الموافق للآداب الإسلامية في مواقف حياتية قصيرة (بر الوالدين، آداب الاستئذان، آداب المجلس، إماطة الأذى).', 4)
on conflict (id) do nothing;
insert into public.subject_question_types (subject_id, question_type)
select 'islamic-studies-ar', id from public.question_types on conflict do nothing;

-- art
insert into public.subjects (id, name, icon, sort, language) values ('art', 'Art Education', '🎨', 13, 'en') on conflict (id) do nothing;
insert into public.subject_domains (id, subject_id, name, sort) values
  ('art.elements-of-art-and-principles', 'art', 'Elements of Art & Principles of Design', 1),
  ('art.visual-and-applied-arts-domains', 'art', 'Visual & Applied Arts Domains', 2),
  ('art.art-appreciation-and-art-history', 'art', 'Art Appreciation & Art History', 3)
on conflict (id) do nothing;
insert into public.subject_skills (id, domain_id, subject_id, name, description, sort) values
  ('art.elements-of-art-and-principles.elements-of-art', 'art.elements-of-art-and-principles', 'art', 'Elements of Art', 'Identifying lines, geometric/organic shapes, texture (rough/smooth), space, and light/shadow via images or drawings.', 1),
  ('art.elements-of-art-and-principles.color-theory-and-mixing', 'art.elements-of-art-and-principles', 'art', 'Color Theory & Mixing', 'Classifying primary, secondary, and neutral colors, distinguishing warm vs. cool colors, and identifying color mixing outcomes.', 2),
  ('art.elements-of-art-and-principles.principles-of-design', 'art.elements-of-art-and-principles', 'art', 'Principles of Design', 'Recognizing balance (symmetrical/asymmetrical), contrast, repetition, rhythm, and unity in a displayed artwork.', 3),
  ('art.visual-and-applied-arts-domains.drawing-and-painting', 'art.visual-and-applied-arts-domains', 'art', 'Drawing & Painting', 'Matching drawing/painting mediums (watercolor, oil, acrylic, pastel, charcoal) to their properties and visual effects.', 1),
  ('art.visual-and-applied-arts-domains.islamic-and-geometric-ornamentation', 'art.visual-and-applied-arts-domains', 'art', 'Islamic & Geometric Ornamentation', 'Distinguishing geometric, floral/arabesque, and calligraphic ornamentation, and identifying their rules (repetition, symmetry, branching).', 2),
  ('art.visual-and-applied-arts-domains.crafts-ceramics-and-printmaking', 'art.visual-and-applied-arts-domains', 'art', 'Crafts, Ceramics & Printmaking', 'Ordering steps of clay modeling or stencil/block printing, and matching craft tools to their functions (loom, modeling tool, mold).', 3),
  ('art.art-appreciation-and-art-history.art-movements-and-famous-works', 'art.art-appreciation-and-art-history', 'art', 'Art Movements & Famous Works', 'Matching a painting or style to its art movement (Realism, Impressionism, Abstract, Cubism) or artist/culture.', 1),
  ('art.art-appreciation-and-art-history.basic-art-critique-and-appreciation', 'art.art-appreciation-and-art-history', 'art', 'Basic Art Critique & Appreciation', 'Inferring the theme or emotion expressed in an artwork, or identifying its functional and aesthetic purpose.', 2)
on conflict (id) do nothing;
insert into public.subject_question_types (subject_id, question_type)
select 'art', id from public.question_types on conflict do nothing;

-- art-ar
insert into public.subjects (id, name, icon, sort, language) values ('art-ar', 'التربية الفنية', '🎨', 14, 'ar') on conflict (id) do nothing;
insert into public.subject_domains (id, subject_id, name, sort) values
  ('art-ar.elements-of-art-and-principles', 'art-ar', 'عناصر الفن وأسس التصميم', 1),
  ('art-ar.visual-and-applied-arts-domains', 'art-ar', 'مجالات الفنون التشكيلية والتطبيقية', 2),
  ('art-ar.art-appreciation-and-art-history', 'art-ar', 'التذوق الفني وتاريخ الفن', 3)
on conflict (id) do nothing;
insert into public.subject_skills (id, domain_id, subject_id, name, description, sort) values
  ('art-ar.elements-of-art-and-principles.elements-of-art', 'art-ar.elements-of-art-and-principles', 'art-ar', 'عناصر الفن التشكيلي', 'التعرف على الخطوط، الأشكال الهندسية والعضوية، الملمس (الخشن والناعم)، الفراغ، والظل والنور من خلال صورة أو رسم.', 1),
  ('art-ar.elements-of-art-and-principles.color-theory-and-mixing', 'art-ar.elements-of-art-and-principles', 'art-ar', 'نظرية الألوان ومزجها', 'تصنيف الألوان إلى أساسية، ثانوية، ومحايدة، والتمييز بين الألوان الدافئة والباردة، وتحديد ناتج مزج لونين أساسيين.', 2),
  ('art-ar.elements-of-art-and-principles.principles-of-design', 'art-ar.elements-of-art-and-principles', 'art-ar', 'أسس التكوين والتصميم', 'تمييز التوازن (المتماثل وغير المتماثل)، التباين، التكرار، الإيقاع، والوحدة في عمل فني معروض.', 3),
  ('art-ar.visual-and-applied-arts-domains.drawing-and-painting', 'art-ar.visual-and-applied-arts-domains', 'art-ar', 'الرسم والتلوين', 'ربط أنواع الأقلام والألوان (المائية، الزيتية، الأكريليك، الباستيل، الفحم) بخصائصها وتأثيرها البصري.', 1),
  ('art-ar.visual-and-applied-arts-domains.islamic-and-geometric-ornamentation', 'art-ar.visual-and-applied-arts-domains', 'art-ar', 'الزخرفة الإسلامية والهندسية', 'التمييز بين الزخرفة الهندسية والنباتية والكتابية، وتحديد قواعدها (التكرار، التناظر، التشعب).', 2),
  ('art-ar.visual-and-applied-arts-domains.crafts-ceramics-and-printmaking', 'art-ar.visual-and-applied-arts-domains', 'art-ar', 'الأشغال اليدوية والخزف والطباعة', 'ترتيب خطوات تشكيل الطين أو الطباعة بالاستنسل/البصمة، وربط الأدوات الحرفية بوظائفها (النول، الدفرة، القالب).', 3),
  ('art-ar.art-appreciation-and-art-history.art-movements-and-famous-works', 'art-ar.art-appreciation-and-art-history', 'art-ar', 'المدارس الفنية والأعمال العالمية والمحلية', 'ربط لوحة أو أسلوب فني بالمدرسة التي ينتمي إليها (الواقعية، الانطباعية، التجريدية، التكعيبية) أو بالفنان/الثقافة.', 1),
  ('art-ar.art-appreciation-and-art-history.basic-art-critique-and-appreciation', 'art-ar.art-appreciation-and-art-history', 'art-ar', 'النقد والتذوق الفني البسيط', 'استنتاج الفكرة أو الشعور الذي يعبر عنه عمل فني، أو تحديد الغرض الوظيفي والجمالي لقطعة فنية.', 2)
on conflict (id) do nothing;
insert into public.subject_question_types (subject_id, question_type)
select 'art-ar', id from public.question_types on conflict do nothing;

-- pe
insert into public.subjects (id, name, icon, sort, language) values ('pe', 'Physical Education', '🏃', 15, 'en') on conflict (id) do nothing;
insert into public.subject_domains (id, subject_id, name, sort) values
  ('pe.physical-fitness-and-health', 'pe', 'Physical Fitness & Health', 1),
  ('pe.fundamental-motor-skills', 'pe', 'Fundamental Motor Skills', 2),
  ('pe.sports-rules-and-game-concepts', 'pe', 'Sports Rules & Game Concepts', 3)
on conflict (id) do nothing;
insert into public.subject_skills (id, domain_id, subject_id, name, description, sort) values
  ('pe.physical-fitness-and-health.components-of-physical-fitness', 'pe.physical-fitness-and-health', 'pe', 'Components of Physical Fitness', 'Matching exercises or activities to the fitness component they develop (speed, muscular strength, flexibility, endurance, balance, agility).', 1),
  ('pe.physical-fitness-and-health.warm-up-cool-down-and', 'pe.physical-fitness-and-health', 'pe', 'Warm-Up, Cool-Down & Injury Prevention', 'Ordering workout phases (warm-up, main activity, cool-down), and distinguishing safe vs. unsafe practices to prevent injuries.', 2),
  ('pe.physical-fitness-and-health.healthy-nutrition-and-active-lifestyle', 'pe.physical-fitness-and-health', 'pe', 'Healthy Nutrition & Active Lifestyle', 'Distinguishing healthy vs. unhealthy foods for athletes, and understanding hydration, sleep, and daily physical activity.', 3),
  ('pe.fundamental-motor-skills.locomotor-and-non-locomotor-skills', 'pe.fundamental-motor-skills', 'pe', 'Locomotor & Non-Locomotor Skills', 'Classifying basic movements into locomotor (running, jumping, hopping, crawling) and non-locomotor (bending, stretching, twisting, static balance).', 1),
  ('pe.fundamental-motor-skills.manipulative-skills', 'pe.fundamental-motor-skills', 'pe', 'Manipulative Skills', 'Identifying proper form for throwing, catching, kicking, dribbling, and striking via description or image.', 2),
  ('pe.sports-rules-and-game-concepts.team-sports-rules', 'pe.sports-rules-and-game-concepts', 'pe', 'Team Sports Rules', 'Identifying player counts, court zones, key fouls, and scoring rules in football/soccer, basketball, volleyball, and handball.', 1),
  ('pe.sports-rules-and-game-concepts.individual-sports-and-self-defense', 'pe.sports-rules-and-game-concepts', 'pe', 'Individual Sports & Self-Defense', 'Matching equipment or techniques to the appropriate sport (track & field, swimming, gymnastics, table tennis, karate/taekwondo).', 2),
  ('pe.sports-rules-and-game-concepts.sportsmanship-and-teamwork', 'pe.sports-rules-and-game-concepts', 'pe', 'Sportsmanship & Teamwork', 'Selecting appropriate sportsmanlike behavior in competitive scenarios (respecting referees, accepting loss, teamwork).', 3)
on conflict (id) do nothing;
insert into public.subject_question_types (subject_id, question_type)
select 'pe', id from public.question_types on conflict do nothing;

-- pe-ar
insert into public.subjects (id, name, icon, sort, language) values ('pe-ar', 'التربية البدنية', '🏃', 16, 'ar') on conflict (id) do nothing;
insert into public.subject_domains (id, subject_id, name, sort) values
  ('pe-ar.physical-fitness-and-health', 'pe-ar', 'اللياقة البدنية والصحة', 1),
  ('pe-ar.fundamental-motor-skills', 'pe-ar', 'المهارات الحركية الأساسية', 2),
  ('pe-ar.sports-rules-and-game-concepts', 'pe-ar', 'الألعاب الرياضية وقوانينها', 3)
on conflict (id) do nothing;
insert into public.subject_skills (id, domain_id, subject_id, name, description, sort) values
  ('pe-ar.physical-fitness-and-health.components-of-physical-fitness', 'pe-ar.physical-fitness-and-health', 'pe-ar', 'عناصر اللياقة البدنية', 'ربط كل تمرين أو نشاط رياضي بعنصر اللياقة الذي ينمّيه (السرعة، القوة العضلية، المرونة، التحمل الدوري التنفسي، التوازن، الرشاقة).', 1),
  ('pe-ar.physical-fitness-and-health.warm-up-cool-down-and', 'pe-ar.physical-fitness-and-health', 'pe-ar', 'الإحماء والتهدئة والوقاية من الإصابات', 'ترتيب مراحل الحصة الرياضية (الإحماء، النشاط الرئيس، التهدئة)، والتمييز بين السلوك الآمن والخاطئ لتجنب الإصابات.', 2),
  ('pe-ar.physical-fitness-and-health.healthy-nutrition-and-active-lifestyle', 'pe-ar.physical-fitness-and-health', 'pe-ar', 'التغذية الصحية ونمط الحياة النشط', 'التمييز بين الغذاء الصحي والضار للرياضي، وفهم أهمية شرب الماء والنوم والنشاط البدني اليومي.', 3),
  ('pe-ar.fundamental-motor-skills.locomotor-and-non-locomotor-skills', 'pe-ar.fundamental-motor-skills', 'pe-ar', 'الحركات الانتقالية وغير الانتقالية', 'تصنيف الحركات الأساسية إلى انتقالية (الجري، الوثب، الحجل، الزحف) وغير انتقالية (الثني، المد، الدوران، التوازن الثابت).', 1),
  ('pe-ar.fundamental-motor-skills.manipulative-skills', 'pe-ar.fundamental-motor-skills', 'pe-ar', 'مهارات التحكم والسيطرة (المعالجة)', 'التعرف على الأداء الصحيح لمهارات الرمي، اللقف (الاستلام)، الركل، التنطيط، والضرب بالمضرب من خلال وصف أو صورة.', 2),
  ('pe-ar.sports-rules-and-game-concepts.team-sports-rules', 'pe-ar.sports-rules-and-game-concepts', 'pe-ar', 'قوانين الألعاب الجماعية', 'تحديد عدد اللاعبين، أبعاد أو مناطق الملعب، وأبرز المخالفات أو طرق احتساب النقاط في (كرة القدم، كرة السلة، الكرة الطائرة، كرة اليد).', 1),
  ('pe-ar.sports-rules-and-game-concepts.individual-sports-and-self-defense', 'pe-ar.sports-rules-and-game-concepts', 'pe-ar', 'الألعاب الفردية والدفاع عن النفس', 'ربط الأداة أو المهارة بالرياضة المناسبة (ألعاب القوى، السباحة، الجمباز، تنس الطاولة، الكاراتيه/التايكوندو).', 2),
  ('pe-ar.sports-rules-and-game-concepts.sportsmanship-and-teamwork', 'pe-ar.sports-rules-and-game-concepts', 'pe-ar', 'الروح الرياضية والعمل الجماعي', 'اختيار التصرف الرياضي السليم في مواقف اللعب التنافسية (احترام الحكم، تقبل الخسارة، التعاون مع الفريق).', 3)
on conflict (id) do nothing;
insert into public.subject_question_types (subject_id, question_type)
select 'pe-ar', id from public.question_types on conflict do nothing;

-- other
insert into public.subjects (id, name, icon, sort, language) values ('other', 'Other', '📦', 17, 'en') on conflict (id) do nothing;
insert into public.subject_question_types (subject_id, question_type)
select 'other', id from public.question_types on conflict do nothing;

-- other-ar
insert into public.subjects (id, name, icon, sort, language) values ('other-ar', 'أخرى', '📦', 18, 'ar') on conflict (id) do nothing;
insert into public.subject_question_types (subject_id, question_type)
select 'other-ar', id from public.question_types on conflict do nothing;
