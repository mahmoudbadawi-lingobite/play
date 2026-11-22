-- =====================================================================
-- Arabic (اللغة العربية): 6 domains and 25 skills from the uploaded skill taxonomy.
-- Run AFTER subjects_grade_language_patch.sql. Safe to re-run (never overwrites edits you made in the admin screen).
-- =====================================================================
insert into public.subjects (id, name, icon, sort, language) values ('arabic', 'اللغة العربية', '📗', 2, 'ar') on conflict (id) do nothing;
insert into public.subject_domains (id, subject_id, name, sort) values
  ('arabic.listening', 'arabic', 'الاستماع', 1),
  ('arabic.reading', 'arabic', 'القراءة والفهم القصير', 2),
  ('arabic.vocabulary', 'arabic', 'المفردات والثروة اللغوية', 3),
  ('arabic.grammar', 'arabic', 'القواعد النحوية والصرفية', 4),
  ('arabic.spelling', 'arabic', 'الإملاء وعلامات الترقيم', 5),
  ('arabic.rhetoric', 'arabic', 'التذوق البلاغي والأسلوبي', 6)
on conflict (id) do nothing;
insert into public.subject_skills (id, domain_id, subject_id, name, description, sort) values
  ('arabic.listening.explicit-understanding', 'arabic.listening', 'arabic', 'الفهم الصريح للمسموع', 'التقاط معلومة مباشرة (اسم، زمان، مكان، عدد، سبب) من مقطع صوتي قصير.', 1),
  ('arabic.listening.main-idea-inference', 'arabic.listening', 'arabic', 'الفكرة العامة والاستنتاج السمعي', 'تحديد الفكرة الرئيسة للمقطع أو استنتاج شعور المتحدث أو نتيجة بسيطة.', 2),
  ('arabic.listening.sound-discrimination', 'arabic.listening', 'arabic', 'التمييز الصوتي والسمعي', 'التفريق بين الأصوات المتقاربة، والحركات القصيرة والطويلة، أو الكلمات المتشابهة في النطق.', 3),
  ('arabic.listening.sound-meaning-link', 'arabic.listening', 'arabic', 'الربط بين الصوت والمعنى/السياق', 'اختيار الجملة أو الصورة أو الكلمة التي تطابق ما سُمع في المقطع القصير.', 4),
  ('arabic.reading.extract-information', 'arabic.reading', 'arabic', 'استخراج المعلومات المباشرة', 'الإجابة عن سؤال يعتمد على جملتين أو ثلاث جمل مكتوبة بوضوح.', 1),
  ('arabic.reading.main-idea-title', 'arabic.reading', 'arabic', 'تحديد الفكرة الرئيسة أو العنوان', 'اختيار الفكرة الأعم أو العنوان الأنسب لفقرة قصيرة جداً.', 2),
  ('arabic.reading.inference-interpretation', 'arabic.reading', 'arabic', 'الاستنتاج والتفسير البسيط', 'فهم علاقة غير مصرح بها مباشرةً (مثل السبب أو النتيجة أو الدافع) من سياق الجمل.', 3),
  ('arabic.reading.fact-vs-opinion', 'arabic.reading', 'arabic', 'التمييز بين الحقيقة والرأي', 'تصنيف عبارة قصيرة إلى حقيقة قابلة للتحقق أو رأي شخصي.', 4),
  ('arabic.reading.sequencing-sentences', 'arabic.reading', 'arabic', 'الترابط والترتيب النصي', 'ترتيب 3–4 جمل قصيرة لتكوين تسلسل زمني أو منطقي سليم.', 5),
  ('arabic.vocabulary.synonyms', 'arabic.vocabulary', 'arabic', 'الترادف', 'إيجاد كلمة قريبة أو مطابقة في المعنى لكلمة محددة.', 1),
  ('arabic.vocabulary.antonyms', 'arabic.vocabulary', 'arabic', 'التضاد', 'إيجاد عكس كلمة أو ضد معنى تعبير قصير.', 2),
  ('arabic.vocabulary.contextual-meaning', 'arabic.vocabulary', 'arabic', 'المعنى السياقي والمشترك اللفظي', 'تحديد معنى الكلمة بحسب السياق الذي وردت فيه.', 3),
  ('arabic.vocabulary.word-relations-classification', 'arabic.vocabulary', 'arabic', 'العلاقات اللغوية والتصنيف', 'ربط الكلمة بمفردها/جمعها، أو جذرها/عائلتها، أو تمييز الكلمة المختلفة عن المجموعة.', 4),
  ('arabic.grammar.parsing-diacritics', 'arabic.grammar', 'arabic', 'الضبط والإعراب', 'اختيار الضبط الصحيح أو الحالة/العلامة الإعرابية أو الموقع النحوي في جملة قصيرة.', 1),
  ('arabic.grammar.particles-connectors', 'arabic.grammar', 'arabic', 'الأدوات والروابط', 'اختيار حرف الجر أو أداة الاستفهام أو النفي أو الربط المناسبة لإتمام المعنى.', 2),
  ('arabic.grammar.sentence-building', 'arabic.grammar', 'arabic', 'بناء الجملة وترتيبها', 'ترتيب كلمات متفرقة لتكوين جملة صحيحة المعنى والتركيب.', 3),
  ('arabic.grammar.morphological-forms', 'arabic.grammar', 'arabic', 'الصيغ الصرفية والتحويل', 'التمييز بين المفرد والمثنى والجمع، والمذكر والمؤنث، والأزمنة، أو اختيار صيغة مشتقة/جذر مناسب.', 4),
  ('arabic.grammar.error-correction', 'arabic.grammar', 'arabic', 'اكتشاف الخطأ وتصويبه', 'تحديد الكلمة المخالفة للقاعدة النحوية أو الصرفية في جملة قصيرة واختيار صوابها.', 5),
  ('arabic.spelling.hamza-forms', 'arabic.spelling', 'arabic', 'رسم الهمزات', 'اختيار الكتابة الصحيحة للهمزة الأولية أو المتوسطة أو المتطرفة.', 1),
  ('arabic.spelling.taa-haa-alif-maqsura', 'arabic.spelling', 'arabic', 'التاءات والهاء والألف اللينة', 'التمييز بين التاء المربوطة والمفتوحة والهاء، واختيار الرسم الصحيح للألف اللينة.', 2),
  ('arabic.spelling.addition-omission', 'arabic.spelling', 'arabic', 'الزيادة والحذف', 'اختيار الكلمة السليمة إملائياً في الحالات التي يُزاد فيها حرف أو يُحذف (مثل التنوين، أو «ال» مع اللام، أو بعض الأسماء).', 3),
  ('arabic.spelling.punctuation', 'arabic.spelling', 'arabic', 'علامات الترقيم', 'وضع أو اختيار علامة الترقيم المناسبة (نقطة، فاصلة، استفهام، تعجب، نقطتان رأسيتان) في نهاية الجملة أو داخلها.', 4),
  ('arabic.rhetoric.sentence-styles', 'arabic.rhetoric', 'arabic', 'الأساليب الإنشائية والخبرية', 'التمييز بين أسلوب الاستفهام والأمر والنهي والتعجب والنداء والنفي وغيرها.', 1),
  ('arabic.rhetoric.simple-figures', 'arabic.rhetoric', 'arabic', 'الصور البيانية البسيطة', 'تمييز التشبيه أو التعبير المجازي في عبارة أو جملة قصيرة.', 2),
  ('arabic.rhetoric.stylistic-effect', 'arabic.rhetoric', 'arabic', 'الأثر الأسلوبي', 'اختيار الغرض أو المعنى الضمني الذي يخدمه أسلوب أو تعبير قصير في سياقه.', 3)
on conflict (id) do nothing;
insert into public.subject_question_types (subject_id, question_type)
select 'arabic', id from public.question_types on conflict do nothing;
