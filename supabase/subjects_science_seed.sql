-- =====================================================================
-- Science, as TWO subjects with the same skills: 'Science' (English) and 'العلوم' (Arabic).
-- 5 domains (Biology, Chemistry, Physics, Earth & Space, Scientific Inquiry) and 22 skills each. Approve the edition a teacher teaches.
-- Run AFTER subjects_grade_language_patch.sql. Safe to re-run (never overwrites edits made in the admin screen).
-- =====================================================================

-- science
insert into public.subjects (id, name, icon, sort, language) values ('science', 'Science', '🔬', 5, 'en') on conflict (id) do nothing;
insert into public.subject_domains (id, subject_id, name, sort) values
  ('science.biology', 'science', 'Biology', 1),
  ('science.chemistry', 'science', 'Chemistry', 2),
  ('science.physics', 'science', 'Physics', 3),
  ('science.earth-space', 'science', 'Earth & Space Science', 4),
  ('science.inquiry', 'science', 'Scientific Inquiry & Lab Skills', 5)
on conflict (id) do nothing;
insert into public.subject_skills (id, domain_id, subject_id, name, description, sort) values
  ('science.biology.cell-structure', 'science.biology', 'science', 'Cell Structure & Organization', 'Identifying plant and animal cell organelles and their functions, and distinguishing unicellular from multicellular organisms.', 1),
  ('science.biology.human-body-systems', 'science.biology', 'science', 'Human Body Systems & Functions', 'Matching organs to their respective body systems (digestive, respiratory, circulatory, nervous, etc.) and identifying their primary functions.', 2),
  ('science.biology.classification', 'science.biology', 'science', 'Classification of Living Organisms', 'Classifying plants and animals (vertebrates/invertebrates, mammals, reptiles, etc.) based on observable traits.', 3),
  ('science.biology.ecology-food-chains', 'science.biology', 'science', 'Ecology & Food Chains', 'Ordering trophic levels in a food chain (producers, consumers, decomposers) and identifying ecological relationships.', 4),
  ('science.biology.adaptation-genetics', 'science.biology', 'science', 'Adaptation & Basic Genetics', 'Identifying structural vs. behavioral adaptations and distinguishing inherited traits from acquired ones.', 5),
  ('science.chemistry.states-of-matter', 'science.chemistry', 'science', 'States of Matter & Phase Changes', 'Distinguishing solids, liquids, and gases, and identifying phase transitions (melting, evaporation, condensation, freezing, sublimation).', 1),
  ('science.chemistry.physical-chemical-changes', 'science.chemistry', 'science', 'Physical vs. Chemical Changes', 'Classifying everyday examples (e.g., rusting iron, melting ice, burning paper) as physical or chemical changes.', 2),
  ('science.chemistry.elements-compounds-mixtures', 'science.chemistry', 'science', 'Elements, Compounds & Mixtures', 'Distinguishing elements, compounds, and mixtures, and selecting appropriate separation methods (filtration, distillation, magnetism).', 3),
  ('science.chemistry.atoms-periodic-table', 'science.chemistry', 'science', 'Atoms & The Periodic Table', 'Identifying subatomic particles and their charges, and matching common chemical symbols to element names.', 4),
  ('science.chemistry.acids-bases-reactions', 'science.chemistry', 'science', 'Acids, Bases & Simple Reactions', 'Identifying acidic, basic, or neutral substances using the pH scale or indicators, and distinguishing reactants from products.', 5),
  ('science.physics.forces-motion', 'science.physics', 'science', 'Forces & Motion', 'Identifying types of forces (gravity, friction, push, pull) and calculating speed, distance, or time in one-step problems.', 1),
  ('science.physics.energy-forms', 'science.physics', 'science', 'Forms of Energy & Transformations', 'Distinguishing kinetic, potential, thermal, light, and electrical energy, and identifying energy conversions in simple devices.', 2),
  ('science.physics.electricity-magnetism', 'science.physics', 'science', 'Electricity & Magnetism', 'Distinguishing open/closed circuits, series/parallel connections, conductors/insulators, and magnetic poles.', 3),
  ('science.physics.light-sound-waves', 'science.physics', 'science', 'Light, Sound & Waves', 'Identifying light behaviors (reflection, refraction, absorption) and sound properties (pitch, loudness, medium).', 4),
  ('science.physics.heat-transfer', 'science.physics', 'science', 'Heat & Thermal Transfer', 'Distinguishing heat transfer methods (conduction, convection, radiation) through brief scenarios.', 5),
  ('science.earth-space.solar-system', 'science.earth-space', 'science', 'The Solar System & Earth''s Motion', 'Ordering planets in the solar system, and linking Earth''s rotation and revolution to day/night and seasons.', 1),
  ('science.earth-space.earth-layers-rocks', 'science.earth-space', 'science', 'Earth''s Layers, Rocks & Minerals', 'Ordering Earth''s layers (crust, mantle, core) and distinguishing rock types (igneous, sedimentary, metamorphic).', 2),
  ('science.earth-space.weather-water-cycle', 'science.earth-space', 'science', 'Weather, Climate & The Water Cycle', 'Distinguishing weather from climate, and identifying water cycle stages and weather instruments.', 3),
  ('science.earth-space.resources-renewable-energy', 'science.earth-space', 'science', 'Natural Resources & Renewable Energy', 'Classifying natural resources and energy sources into renewable and non-renewable, and identifying their environmental impact.', 4),
  ('science.inquiry.scientific-method', 'science.inquiry', 'science', 'Steps of the Scientific Method', 'Ordering steps of the scientific method and identifying independent and dependent variables.', 1),
  ('science.inquiry.lab-tools-safety', 'science.inquiry', 'science', 'Lab Tools & Safety', 'Matching scientific instruments to what they measure (balance, graduated cylinder, thermometer, microscope) and identifying lab safety rules.', 2),
  ('science.inquiry.interpreting-data', 'science.inquiry', 'science', 'Interpreting Data & Brief Experiments', 'Drawing a direct conclusion from an experimental data table, scientific graph, or a 2–3 sentence passage.', 3)
on conflict (id) do nothing;
insert into public.subject_question_types (subject_id, question_type)
select 'science', id from public.question_types on conflict do nothing;

-- science-ar
insert into public.subjects (id, name, icon, sort, language) values ('science-ar', 'العلوم', '🔬', 6, 'ar') on conflict (id) do nothing;
insert into public.subject_domains (id, subject_id, name, sort) values
  ('science-ar.biology', 'science-ar', 'الأحياء', 1),
  ('science-ar.chemistry', 'science-ar', 'الكيمياء', 2),
  ('science-ar.physics', 'science-ar', 'الفيزياء', 3),
  ('science-ar.earth-space', 'science-ar', 'علوم الأرض والفضاء', 4),
  ('science-ar.inquiry', 'science-ar', 'الاستقصاء العلمي والمهارات التجريبية', 5)
on conflict (id) do nothing;
insert into public.subject_skills (id, domain_id, subject_id, name, description, sort) values
  ('science-ar.biology.cell-structure', 'science-ar.biology', 'science-ar', 'الخلية وتركيب الكائنات الحية', 'تحديد عضيات الخلية النباتية والحيوانية ووظائفها، والتمييز بين الكائنات وحيدة الخلية ومتعددة الخلايا.', 1),
  ('science-ar.biology.human-body-systems', 'science-ar.biology', 'science-ar', 'أجهزة جسم الإنسان ووظائفها', 'ربط كل عضو بالجهاز الذي ينتمي إليه (الهضمي، التنفسي، الدوري، العصبي...) وتحديد وظيفته الأساسية.', 2),
  ('science-ar.biology.classification', 'science-ar.biology', 'science-ar', 'تصنيف الكائنات الحية', 'تصنيف النباتات والحيوانات (فقاريات ولافقاريات، ثدييات، زواحف، إلخ) بناءً على خصائصها الظاهرة.', 3),
  ('science-ar.biology.ecology-food-chains', 'science-ar.biology', 'science-ar', 'البيئة والسلاسل الغذائية', 'ترتيب مستويات السلسلة الغذائية (منتجات، مستهلكات، محللات) وتحديد العلاقات البيئية (تطفل، تكافل، افتراس).', 4),
  ('science-ar.biology.adaptation-genetics', 'science-ar.biology', 'science-ar', 'التكيف والوراثة البسيطة', 'تحديد نوع التكيف (تركيبي أو سلوكي) لكائن حي في بيئته، والتمييز بين الصفات الوراثية والمكتسبة.', 5),
  ('science-ar.chemistry.states-of-matter', 'science-ar.chemistry', 'science-ar', 'حالات المادة وتغيراتها', 'التمييز بين الحالة الصلبة والسائلة والغازية، وتحديد عمليات التحول (انصهار، تبخر، تكثف، تجمد، تسامي).', 1),
  ('science-ar.chemistry.physical-chemical-changes', 'science-ar.chemistry', 'science-ar', 'التغيرات الفيزيائية والكيميائية', 'تصنيف أمثلة حياتية سريعة (مثل صدأ الحديد، ذوبان الجليد، احتراق الورق) إلى تغير فيزيائي أو كيميائي.', 2),
  ('science-ar.chemistry.elements-compounds-mixtures', 'science-ar.chemistry', 'science-ar', 'العناصر والمركبات والمخاليط', 'التمييز بين العنصر والمركب والمخلوط المتجانس وغير المتجانس، واختيار طريقة الفصل المناسبة (ترشيح، تقطير، مغناطيس).', 3),
  ('science-ar.chemistry.atoms-periodic-table', 'science-ar.chemistry', 'science-ar', 'الذرة والجدول الدوري', 'تحديد مكونات الذرة وشحناتها (بروتون، نيوترون، إلكترون)، وربط الرموز الكيميائية الشائعة بأسماء العناصر.', 4),
  ('science-ar.chemistry.acids-bases-reactions', 'science-ar.chemistry', 'science-ar', 'الأحماض والقواعد والتفاعلات البسيطة', 'تحديد طبيعة المادة (حمضية، قاعدية، متعادلة) باستخدام مقياس الرقم الهيدروجيني (pH) أو الكواشف، وتمييز المتفاعلات والنواتج.', 5),
  ('science-ar.physics.forces-motion', 'science-ar.physics', 'science-ar', 'القوى والحركة', 'تحديد أنواع القوى (الجاذبية، الاحتكاك، الدفع، السحب)، وحساب السرعة أو المسافة أو الزمن في مسائل خطوة واحدة.', 1),
  ('science-ar.physics.energy-forms', 'science-ar.physics', 'science-ar', 'أشكال الطاقة وتحولاتها', 'التمييز بين الطاقة الحركية وطاقة الوضع والحرارية والضوئية والكهربائية، وتحديد تحولات الطاقة في الأجهزة البسيطة.', 2),
  ('science-ar.physics.electricity-magnetism', 'science-ar.physics', 'science-ar', 'الكهرباء والمغناطيسية', 'التمييز بين الدائرة الكهربائية المفتوحة والمغلقة، والتوصيل على التوالي والتوازي، والمواد الموصلة والعازلة، وأقطاب المغناطيس.', 3),
  ('science-ar.physics.light-sound-waves', 'science-ar.physics', 'science-ar', 'الضوء والصوت والموجات', 'تحديد خصائص الضوء (الانعكاس، الانكسار، الامتصاص) وخصائص الصوت (الحدة، الشدة، الوسط الناقل).', 4),
  ('science-ar.physics.heat-transfer', 'science-ar.physics', 'science-ar', 'الحرارة وانتقالها', 'التمييز بين طرق انتقال الحرارة (التوصيل، الحمل، الإشعاع) من خلال مواقف وأمثلة قصيرة.', 5),
  ('science-ar.earth-space.solar-system', 'science-ar.earth-space', 'science-ar', 'النظام الشمسي وحركة الأرض', 'ترتيب كواكب المجموعة الشمسية، وربط دوران الأرض حول محورها وحول الشمس بتعاقب الليل والنهار والفصول الأربعة.', 1),
  ('science-ar.earth-space.earth-layers-rocks', 'science-ar.earth-space', 'science-ar', 'طبقات الأرض والصخور والمعادن', 'ترتيب طبقات الأرض (القشرة، الستار، اللب)، والتمييز بين أنواع الصخور (نارية، رسوبية، متحولة).', 2),
  ('science-ar.earth-space.weather-water-cycle', 'science-ar.earth-space', 'science-ar', 'الطقس والمناخ ودورة الماء', 'التمييز بين الطقس والمناخ، وتحديد مراحل دورة الماء في الطبيعة (تبخر، تكثف، هطول) وأدوات قياس الطقس.', 3),
  ('science-ar.earth-space.resources-renewable-energy', 'science-ar.earth-space', 'science-ar', 'الموارد الطبيعية والطاقة المتجددة', 'تصنيف مصادر الطاقة والموارد الطبيعية إلى متجددة وغير متجددة، وتحديد أثرها البيئي.', 4),
  ('science-ar.inquiry.scientific-method', 'science-ar.inquiry', 'science-ar', 'خطوات الطريقة العلمية', 'ترتيب خطوات البحث العلمي (الملاحظة، الفرضية، التجربة، تحليل البيانات، الاستنتاج) أو تحديد المتغير المستقل والتابع.', 1),
  ('science-ar.inquiry.lab-tools-safety', 'science-ar.inquiry', 'science-ar', 'أدوات القياس والسلامة المخبرية', 'ربط الأداة العلمية بالكمية التي تقيسها (ميزان، مخبار مدرج، ترمومتر، مجهر) وتحديد قواعد السلامة في المختبر.', 2),
  ('science-ar.inquiry.interpreting-data', 'science-ar.inquiry', 'science-ar', 'قراءة البيانات والتجارب القصيرة', 'استنتاج نتيجة مباشرة من جدول بيانات تجربة أو رسم بياني علمي أو فقرة وصفية من جملتين إلى ثلاث جمل.', 3)
on conflict (id) do nothing;
insert into public.subject_question_types (subject_id, question_type)
select 'science-ar', id from public.question_types on conflict do nothing;
