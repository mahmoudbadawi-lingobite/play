import { supabase } from '../../lib/supabase';
import type { Catalog, Domain, Skill, Subject, TeacherSubject, TeacherSubjectStatus } from './types';

const fail = (e: { message: string }): never => { throw new Error(e.message); };

const mapSkill = (r: any): Skill => ({ id: r.id, domainId: r.domain_id, subjectId: r.subject_id, name: r.name, description: r.description ?? null, sort: r.sort ?? 0, active: r.active !== false });

/** True once subjects_grade_language_patch.sql has been run (the grade column exists). */
export async function probeGrade(): Promise<boolean> {
  const { error } = await supabase.from('content_sets').select('grade').limit(1);
  return !error;
}

/** True once subjects_multi_skills_patch.sql has been run (the skill_ids column exists). */
export async function probeMulti(): Promise<boolean> {
  const { error } = await supabase.from('content_sets').select('skill_ids').limit(1);
  return !error;
}

/** Everything: subjects with their domains, skills and allowed question types. Readable by everyone. */
export async function loadCatalog(): Promise<Catalog> {
  const [s, t] = await Promise.all([
    supabase.from('subjects').select('*, subject_domains(*, subject_skills(*)), subject_question_types(question_type)').order('sort').order('name'),
    supabase.from('question_types').select('*').order('sort'),
  ]);
  if (s.error) fail(s.error);
  if (t.error) fail(t.error);
  const subjects: Subject[] = (s.data ?? []).map((r: any) => ({
    id: r.id, name: r.name, icon: r.icon ?? null, sort: r.sort ?? 0, active: r.active !== false,
    language: r.language === undefined ? undefined : r.language === 'ar' ? 'ar' : 'en', parentId: r.parent_id ?? null,
    questionTypes: (r.subject_question_types ?? []).map((x: any) => x.question_type),
    domains: (r.subject_domains ?? [])
      .map((d: any): Domain => ({ id: d.id, subjectId: d.subject_id, name: d.name, sort: d.sort ?? 0, skills: (d.subject_skills ?? []).map(mapSkill).sort((a: Skill, b: Skill) => a.sort - b.sort || a.name.localeCompare(b.name)) }))
      .sort((a: Domain, b: Domain) => a.sort - b.sort || a.name.localeCompare(b.name)),
  }));
  return { subjects, questionTypes: (t.data ?? []).map((r: any) => ({ id: r.id, label: r.label, sort: r.sort ?? 0 })) };
}

const mapTs = (r: any): TeacherSubject => ({
  teacherId: r.teacher_id, subjectId: r.subject_id, status: r.status, requestedAt: r.requested_at,
  teacherName: r.profiles?.display_name ?? undefined, teacherEmail: r.profiles?.email ?? undefined,
});

export async function listMyTeacherSubjects(teacherId: string): Promise<TeacherSubject[]> {
  const { data, error } = await supabase.from('teacher_subjects').select('*').eq('teacher_id', teacherId);
  if (error) fail(error);
  return (data ?? []).map(mapTs);
}
export async function requestSubject(teacherId: string, subjectId: string): Promise<void> {
  // a rejected request is replaced by a fresh pending one
  await supabase.from('teacher_subjects').delete().eq('teacher_id', teacherId).eq('subject_id', subjectId).eq('status', 'rejected');
  const { error } = await supabase.from('teacher_subjects').insert({ teacher_id: teacherId, subject_id: subjectId, status: 'pending' });
  if (error) fail(error);
}
export async function dropSubject(teacherId: string, subjectId: string): Promise<void> {
  const { error } = await supabase.from('teacher_subjects').delete().eq('teacher_id', teacherId).eq('subject_id', subjectId);
  if (error) fail(error);
}

// ------------------------------------------------------------------ admin
export async function listAllTeacherSubjects(): Promise<TeacherSubject[]> {
  const { data, error } = await supabase.from('teacher_subjects').select('*, profiles!teacher_subjects_teacher_id_fkey(display_name, email)').order('requested_at', { ascending: false });
  if (error) fail(error);
  return (data ?? []).map(mapTs);
}
export async function decideTeacherSubject(teacherId: string, subjectId: string, status: TeacherSubjectStatus): Promise<void> {
  const { error } = await supabase.from('teacher_subjects').update({ status }).eq('teacher_id', teacherId).eq('subject_id', subjectId);
  if (error) fail(error);
}
export async function saveSubject(s: { id: string; name: string; icon: string | null; sort: number; active: boolean; language?: 'en' | 'ar'; parentId?: string | null }): Promise<void> {
  // language / parent only once the grade-language SQL has been run (the caller leaves them undefined before that)
  const { error } = await supabase.from('subjects').upsert({ id: s.id, name: s.name, icon: s.icon, sort: s.sort, active: s.active, ...(s.language ? { language: s.language, parent_id: s.parentId ?? null } : {}) });
  if (error) fail(error);
}
export async function deleteSubject(id: string): Promise<void> {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) fail(error);
}
export async function saveDomain(d: { id: string; subjectId: string; name: string; sort: number }): Promise<void> {
  const { error } = await supabase.from('subject_domains').upsert({ id: d.id, subject_id: d.subjectId, name: d.name, sort: d.sort });
  if (error) fail(error);
}
export async function deleteDomain(id: string): Promise<void> {
  const { error } = await supabase.from('subject_domains').delete().eq('id', id);
  if (error) fail(error);
}
export async function saveSkills(rows: Skill[]): Promise<void> {
  if (!rows.length) return;
  const { error } = await supabase.from('subject_skills').upsert(rows.map((r) => ({ id: r.id, domain_id: r.domainId, subject_id: r.subjectId, name: r.name, description: r.description, sort: r.sort, active: r.active })));
  if (error) fail(error);
}
export async function deleteSkill(id: string): Promise<void> {
  const { error } = await supabase.from('subject_skills').delete().eq('id', id);
  if (error) fail(error);
}
/** Replace the list of question types a subject allows. */
export async function setSubjectQuestionTypes(subjectId: string, types: string[]): Promise<void> {
  const del = await supabase.from('subject_question_types').delete().eq('subject_id', subjectId);
  if (del.error) fail(del.error);
  if (!types.length) return;
  const { error } = await supabase.from('subject_question_types').insert(types.map((t) => ({ subject_id: subjectId, question_type: t })));
  if (error) fail(error);
}
