-- =====================================================================
-- Math, as TWO subjects with the same skills: 'Mathematics' (English) and 'الرياضيات' (Arabic).
-- Schools teach math either in English or in Arabic, so a teacher is approved for the one they teach (or both).
-- 5 domains and 19 skills each. Run AFTER subjects_grade_language_patch.sql. Safe to re-run (never overwrites edits made in the admin screen).
-- =====================================================================

-- math
insert into public.subjects (id, name, icon, sort, language) values ('math', 'Mathematics', '➗', 3, 'en') on conflict (id) do nothing;
insert into public.subject_domains (id, subject_id, name, sort) values
  ('math.numbers', 'math', 'Numbers & Operations', 1),
  ('math.algebra', 'math', 'Algebra, Patterns & Functions', 2),
  ('math.geometry', 'math', 'Geometry & Measurement', 3),
  ('math.statistics', 'math', 'Statistics, Probability & Data Analysis', 4),
  ('math.reasoning', 'math', 'Logical Reasoning & Quick Problem Solving', 5)
on conflict (id) do nothing;
insert into public.subject_skills (id, domain_id, subject_id, name, description, sort) values
  ('math.numbers.place-value', 'math.numbers', 'math', 'Place Value & Number Representation', 'Identifying digit values, standard/expanded/word forms, and rounding numbers.', 1),
  ('math.numbers.comparing-ordering', 'math.numbers', 'math', 'Comparing & Ordering', 'Comparing integers, fractions, or decimals using >, <, =, and ordering them ascending or descending.', 2),
  ('math.numbers.basic-operations', 'math.numbers', 'math', 'Basic Operations & Mental Math', 'Performing quick addition, subtraction, multiplication, and division, and applying the order of operations.', 3),
  ('math.numbers.fractions-decimals-percent', 'math.numbers', 'math', 'Fractions, Decimals & Percentages', 'Quick conversions between fractions, decimals, and percentages, simplifying fractions, and finding equivalents.', 4),
  ('math.numbers.number-properties', 'math.numbers', 'math', 'Number Properties', 'Identifying even/odd numbers, prime numbers, factors, and multiples.', 5),
  ('math.algebra.patterns-sequences', 'math.algebra', 'math', 'Patterns & Sequences', 'Identifying numerical or geometric pattern rules and completing the missing term.', 1),
  ('math.algebra.expressions-substitution', 'math.algebra', 'math', 'Algebraic Expressions & Substitution', 'Simplifying basic algebraic expressions or evaluating them via direct substitution.', 2),
  ('math.algebra.equations-inequalities', 'math.algebra', 'math', 'Solving Simple Equations & Inequalities', 'Finding the unknown variable in one- or two-step linear equations via multiple choice or fill-in-the-blank.', 3),
  ('math.algebra.ratio-proportion', 'math.algebra', 'math', 'Ratios & Proportions', 'Finding unit rates, solving simple proportions, and identifying direct or inverse relationships.', 4),
  ('math.geometry.shapes-properties', 'math.geometry', 'math', 'Shape Recognition & Properties', 'Classifying 2D and 3D shapes, and identifying sides, angles, faces, and vertices.', 1),
  ('math.geometry.angles-lines', 'math.geometry', 'math', 'Angles & Lines', 'Distinguishing angle types (acute, right, obtuse, straight), parallel/perpendicular lines, and finding missing angles.', 2),
  ('math.geometry.perimeter-area-volume', 'math.geometry', 'math', 'Perimeter, Area & Volume', 'Calculating perimeter and area of basic shapes (square, rectangle, triangle, circle) and volume of simple solids.', 3),
  ('math.geometry.transformations-symmetry', 'math.geometry', 'math', 'Geometric Transformations & Symmetry', 'Identifying lines of symmetry and visually distinguishing reflection, translation, and rotation.', 4),
  ('math.geometry.measurement-units', 'math.geometry', 'math', 'Measurement & Unit Conversion', 'Quickly converting units of length, mass, capacity, and time, and reading clocks and measurement tools.', 5),
  ('math.statistics.reading-graphs', 'math.statistics', 'math', 'Reading Graphs & Charts', 'Extracting direct information or comparing values from bar graphs, line charts, pie charts, or tables.', 1),
  ('math.statistics.central-tendency-spread', 'math.statistics', 'math', 'Measures of Central Tendency & Spread', 'Calculating the mean, median, mode, and range for a small set of data.', 2),
  ('math.statistics.simple-probability', 'math.statistics', 'math', 'Simple Probability', 'Describing event likelihood (certain, impossible, equally likely) or calculating probability as a simple fraction.', 3),
  ('math.reasoning.word-problems', 'math.reasoning', 'math', 'Short Word Problems (2–3 Sentences)', 'Identifying the appropriate operation or selecting the correct solution for a brief real-life scenario.', 1),
  ('math.reasoning.estimation-reasonableness', 'math.reasoning', 'math', 'Estimation & Reasonableness', 'Quickly estimating calculation results or spotting the mathematical error in a given step.', 2)
on conflict (id) do nothing;
insert into public.subject_question_types (subject_id, question_type)
select 'math', id from public.question_types on conflict do nothing;

-- math-ar
insert into public.subjects (id, name, icon, sort, language) values ('math-ar', 'الرياضيات', '➗', 4, 'ar') on conflict (id) do nothing;
insert into public.subject_domains (id, subject_id, name, sort) values
  ('math-ar.numbers', 'math-ar', 'الأعداد والعمليات الحسابية', 1),
  ('math-ar.algebra', 'math-ar', 'الجبر والأنماط والدوال', 2),
  ('math-ar.geometry', 'math-ar', 'الهندسة والقياس', 3),
  ('math-ar.statistics', 'math-ar', 'الإحصاء والاحتمالات وتحليل البيانات', 4),
  ('math-ar.reasoning', 'math-ar', 'التفكير المنطقي وحل المسائل السريعة', 5)
on conflict (id) do nothing;
insert into public.subject_skills (id, domain_id, subject_id, name, description, sort) values
  ('math-ar.numbers.place-value', 'math-ar.numbers', 'math-ar', 'القيمة المنزلية وتمثيل الأعداد', 'تحديد قيمة الرقم في العدد، الصيغة القياسية والتحليلية واللفظية، وتقريب الأعداد.', 1),
  ('math-ar.numbers.comparing-ordering', 'math-ar.numbers', 'math-ar', 'المقارنة والترتيب', 'المقارنة بين الأعداد الصحيحة أو الكسور أو الأعداد العشرية باستخدام (>, <, =) وترتيبها تصاعدياً أو تنازلياً.', 2),
  ('math-ar.numbers.basic-operations', 'math-ar.numbers', 'math-ar', 'العمليات الأساسية والحساب الذهني', 'إجراء عمليات الجمع والطرح والضرب والقسمة السريعة، وتطبيق أولويات العمليات الحسابية.', 3),
  ('math-ar.numbers.fractions-decimals-percent', 'math-ar.numbers', 'math-ar', 'الكسور والأعداد العشرية والنسب المئوية', 'التحويل السريع بين الكسور والأعداد العشرية والنسب المئوية، وتبسيط الكسور وإيجاد الكسور المتكافئة.', 4),
  ('math-ar.numbers.number-properties', 'math-ar.numbers', 'math-ar', 'خصائص الأعداد', 'تمييز الأعداد الزوجية والفردية، الأعداد الأولية، والعوامل والمضاعفات المشتركة.', 5),
  ('math-ar.algebra.patterns-sequences', 'math-ar.algebra', 'math-ar', 'الأنماط والمتتاليات', 'اكتشاف قاعدة النمط العددي أو الهندسي وإكمال الحد الناقص.', 1),
  ('math-ar.algebra.expressions-substitution', 'math-ar.algebra', 'math-ar', 'العبارات الجبرية والتعويض', 'تبسيط العبارات الجبرية البسيطة أو إيجاد قيمتها بالتعويض المباشر عن المتغير.', 2),
  ('math-ar.algebra.equations-inequalities', 'math-ar.algebra', 'math-ar', 'حل المعادلات والمتباينات البسيطة', 'إيجاد قيمة المجهول في معادلة خطية من خطوة أو خطوتين عبر الاختيار أو الإكمال.', 3),
  ('math-ar.algebra.ratio-proportion', 'math-ar.algebra', 'math-ar', 'النسبة والتناسب', 'إيجاد معدل الوحدة، وحل التناسب البسيط، وتحديد العلاقات الطردية أو العكسية.', 4),
  ('math-ar.geometry.shapes-properties', 'math-ar.geometry', 'math-ar', 'التعرف على الأشكال وخصائصها', 'تصنيف الأشكال ثنائية وثلاثية الأبعاد، وتحديد عدد الأضلاع والزوايا والأوجه والرؤوس.', 1),
  ('math-ar.geometry.angles-lines', 'math-ar.geometry', 'math-ar', 'الزوايا والمستقيمات', 'التمييز بين أنواع الزوايا (حادة، قائمة، منفرجة، مستقيمة)، والمستقيمات المتوازية والمتعامدة، وإيجاد زاوية مجهولة.', 2),
  ('math-ar.geometry.perimeter-area-volume', 'math-ar.geometry', 'math-ar', 'المحيط والمساحة والحجم', 'حساب المحيط والمساحة للأشكال الأساسية (مربع، مستطيل، مثلث، دائرة) وحجم المجسمات البسيطة.', 3),
  ('math-ar.geometry.transformations-symmetry', 'math-ar.geometry', 'math-ar', 'التحويلات الهندسية والتماثل', 'تحديد خطوط التماثل، والتمييز بين الانعكاس والانسحاب والدوران بصرياً.', 4),
  ('math-ar.geometry.measurement-units', 'math-ar.geometry', 'math-ar', 'القياس والتحويل بين الوحدات', 'التحويل السريع بين وحدات الطول والكتلة والسعة والزمن، وقراءة الساعة وأدوات القياس.', 5),
  ('math-ar.statistics.reading-graphs', 'math-ar.statistics', 'math-ar', 'قراءة التمثيلات البيانية', 'استخراج معلومة مباشرة أو مقارنة قيم من رسم بياني بالأعمدة أو الخطوط أو القطاعات الدائرية أو الجداول.', 1),
  ('math-ar.statistics.central-tendency-spread', 'math-ar.statistics', 'math-ar', 'مقاييس النزعة المركزية والتشتت', 'حساب المتوسط الحسابي، والوسيط، والمنوال، والمدى لمجموعة صغيرة من البيانات.', 2),
  ('math-ar.statistics.simple-probability', 'math-ar.statistics', 'math-ar', 'الاحتمالات البسيطة', 'وصف احتمالية وقوع حدث (مؤكد، مستحيل، متساوي الإمكانية) أو حساب الاحتمال ككسر بسيط.', 3),
  ('math-ar.reasoning.word-problems', 'math-ar.reasoning', 'math-ar', 'المسائل اللفظية القصيرة (جملتان إلى ثلاث)', 'تحديد العملية الحسابية المناسبة أو اختيار الحل الصحيح لموقف حياتي قصير.', 1),
  ('math-ar.reasoning.estimation-reasonableness', 'math-ar.reasoning', 'math-ar', 'التقدير والتحقق من معقولية الإجابة', 'تقدير ناتج عملية حسابية بسرعة أو اكتشاف الخطأ الرياضي في خطوة معطاة.', 2)
on conflict (id) do nothing;
insert into public.subject_question_types (subject_id, question_type)
select 'math-ar', id from public.question_types on conflict do nothing;
