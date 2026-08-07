import { supabase } from './supabase';
import type { ContentItem, ContentSet, GameKey, GameResult, SchoolClass, SkillTemplate, Visibility } from '../types';

// ------------------------------------------------------------------
// Content sets
// ------------------------------------------------------------------

function rowToContentSet(row: any): ContentSet {
  return {
    id: row.id,
    title: row.title,
    skill: row.skill,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    visibility: row.visibility,
    items: row.items ?? [],
    playCount: row.play_count ?? 0,
    reportCount: row.report_count ?? 0,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function checkDuplicateTitle(title: string): Promise<ContentSet | null> {
  const normalized = title.trim().toLowerCase();
  if (!normalized) return null;
  const { data, error } = await supabase
    .from('content_sets')
    .select('*')
    .eq('title_lower', normalized)
    .eq('visibility', 'public')
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return rowToContentSet(data);
}

export async function createContentSet(input: {
  title: string;
  skill: SkillTemplate;
  teacherId: string;
  teacherName: string;
  visibility: Visibility;
  items: ContentItem[];
}): Promise<string> {
  const { data, error } = await supabase
    .from('content_sets')
    .insert({
      title: input.title,
      title_lower: input.title.trim().toLowerCase(),
      skill: input.skill,
      teacher_id: input.teacherId,
      teacher_name: input.teacherName,
      visibility: input.visibility,
      items: input.items,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function getContentSet(id: string): Promise<ContentSet | null> {
  const { data, error } = await supabase.from('content_sets').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return rowToContentSet(data);
}

export async function listPublicContentSets(skill?: SkillTemplate): Promise<ContentSet[]> {
  let query = supabase.from('content_sets').select('*').eq('visibility', 'public').order('play_count', { ascending: false }).limit(50);
  if (skill) query = query.eq('skill', skill);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(rowToContentSet);
}

export async function listMyContentSets(teacherId: string): Promise<ContentSet[]> {
  const { data, error } = await supabase
    .from('content_sets')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  return data.map(rowToContentSet);
}

export async function incrementPlayCount(id: string): Promise<void> {
  await supabase.rpc('increment_play_count', { set_id: id });
}

export async function deleteContentSet(id: string): Promise<void> {
  await supabase.from('content_sets').delete().eq('id', id);
}

export async function reportContentSet(id: string, reason: string, _reporterId: string): Promise<void> {
  await supabase.rpc('report_content_set', { set_id: id, reason });
}

export async function listReportedContentSets(): Promise<ContentSet[]> {
  const { data, error } = await supabase
    .from('content_sets')
    .select('*')
    .gt('report_count', 0)
    .order('report_count', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data.map(rowToContentSet);
}

export async function unpublishContentSet(id: string): Promise<void> {
  await supabase.rpc('unpublish_content_set', { set_id: id });
}

export async function republishContentSet(id: string): Promise<void> {
  await supabase.rpc('republish_content_set', { set_id: id });
}

export async function updateContentSet(id: string, input: {
  title: string;
  skill: SkillTemplate;
  visibility: Visibility;
  items?: ContentItem[];
}): Promise<void> {
  const updates: Record<string, unknown> = {
    title: input.title,
    title_lower: input.title.trim().toLowerCase(),
    skill: input.skill,
    visibility: input.visibility,
    updated_at: new Date().toISOString(),
  };
  if (input.items) updates.items = input.items;
  await supabase.from('content_sets').update(updates).eq('id', id);
}

export async function dismissReports(id: string): Promise<void> {
  await supabase.rpc('dismiss_content_reports', { set_id: id });
}

// ------------------------------------------------------------------
// Classes / rosters (independent within LingoBite Play)
// ------------------------------------------------------------------

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/I/1 ambiguity
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createClass(teacherId: string, name: string): Promise<string> {
  const { data, error } = await supabase
    .from('classes')
    .insert({ name, teacher_id: teacherId, join_code: generateJoinCode() })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function listMyClasses(teacherId: string): Promise<SchoolClass[]> {
  const { data: classRows, error } = await supabase.from('classes').select('*').eq('teacher_id', teacherId);
  if (error || !classRows) return [];

  const { data: studentRows } = await supabase
    .from('class_students')
    .select('class_id, student_id')
    .in('class_id', classRows.map((c) => c.id));

  return classRows.map((c) => ({
    id: c.id,
    name: c.name,
    teacherId: c.teacher_id,
    joinCode: c.join_code,
    studentIds: (studentRows ?? []).filter((s) => s.class_id === c.id).map((s) => s.student_id),
    createdAt: new Date(c.created_at),
  }));
}

export async function addStudentToClass(classId: string, studentId: string): Promise<void> {
  await supabase.from('class_students').insert({ class_id: classId, student_id: studentId });
}

export interface RosterEntry {
  studentId: string;
  displayName: string;
  photoURL: string | null;
  totalXP: number;
  gamesPlayed: number;
  avgAccuracy: number;
}

export async function getClassRoster(classId: string): Promise<RosterEntry[]> {
  const { data: studentRows, error: studentsError } = await supabase
    .from('class_students')
    .select('student_id, profiles(display_name, photo_url)')
    .eq('class_id', classId);
  if (studentsError || !studentRows) return [];

  const studentIds = studentRows.map((row: any) => row.student_id);
  // Games aren't currently assigned per-class, so a play isn't tagged with
  // a class_id - roster stats reflect each student's overall activity
  // rather than only plays attributed to this specific class.
  const { data: resultRows } = studentIds.length
    ? await supabase.from('game_results').select('student_id, xp_earned, accuracy').in('student_id', studentIds)
    : { data: [] as any[] };

  return studentRows.map((row: any) => {
    const results = (resultRows ?? []).filter((r: any) => r.student_id === row.student_id);
    const totalXP = results.reduce((sum: number, r: any) => sum + (r.xp_earned ?? 0), 0);
    const gamesPlayed = results.length;
    const avgAccuracy = gamesPlayed
      ? Math.round(results.reduce((s: number, r: any) => s + (r.accuracy ?? 0), 0) / gamesPlayed)
      : 0;
    return {
      studentId: row.student_id,
      displayName: row.profiles?.display_name ?? 'Student',
      photoURL: row.profiles?.photo_url ?? null,
      totalXP,
      gamesPlayed,
      avgAccuracy,
    };
  });
}

export async function joinClassByCode(code: string, _studentId: string): Promise<SchoolClass | null> {
  const { data, error } = await supabase.rpc('join_class_by_code', { code });
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    teacherId: data.teacher_id,
    joinCode: data.join_code,
    studentIds: [],
    createdAt: new Date(data.created_at),
  };
}

export async function listMyEnrolledClasses(studentId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('class_students')
    .select('classes(id, name)')
    .eq('student_id', studentId);
  if (error || !data) return [];
  return data.map((row: any) => row.classes).filter(Boolean);
}

// ------------------------------------------------------------------
// Game results / leaderboard / XP
// ------------------------------------------------------------------

function rowToGameResult(row: any): GameResult {
  return {
    id: row.id,
    contentSetId: row.content_set_id,
    contentSetTitle: row.content_set_title,
    gameKey: row.game_key,
    studentId: row.student_id,
    studentName: row.student_name,
    classId: row.class_id ?? undefined,
    xpEarned: row.xp_earned,
    accuracy: row.accuracy,
    durationSeconds: row.duration_seconds,
    playedAt: new Date(row.played_at),
  };
}

export async function recordGameResult(input: Omit<GameResult, 'id' | 'playedAt'>): Promise<void> {
  await supabase.rpc('record_game_result', {
    p_content_set_id: input.contentSetId,
    p_content_set_title: input.contentSetTitle,
    p_game_key: input.gameKey,
    p_class_id: input.classId ?? null,
    p_xp_earned: input.xpEarned,
    p_accuracy: input.accuracy,
    p_duration_seconds: input.durationSeconds,
  });
}

export async function getClassLeaderboard(classId: string): Promise<GameResult[]> {
  const { data, error } = await supabase
    .from('game_results')
    .select('*')
    .eq('class_id', classId)
    .order('xp_earned', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data.map(rowToGameResult);
}

export async function getGameLeaderboard(gameKey: GameKey): Promise<GameResult[]> {
  const { data, error } = await supabase
    .from('game_results')
    .select('*')
    .eq('game_key', gameKey)
    .order('xp_earned', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data.map(rowToGameResult);
}

// ------------------------------------------------------------------
// Teacher access requests (approved from LingoBite Play's own Admin
// dashboard - not shared with LingoBite / LingoTrace)
// ------------------------------------------------------------------

export async function requestTeacherAccess(uid: string): Promise<void> {
  await supabase.from('profiles').update({ teacher_status: 'pending' }).eq('id', uid);
}

export async function listPendingTeacherRequests() {
  const { data, error } = await supabase.from('profiles').select('*').eq('teacher_status', 'pending');
  if (error || !data) return [];
  return data.map((row) => ({
    uid: row.id,
    displayName: row.display_name,
    email: row.email,
    photoURL: row.photo_url,
  }));
}

export async function approveTeacher(uid: string): Promise<void> {
  await supabase.rpc('approve_teacher', { target_uid: uid });
}

export async function rejectTeacher(uid: string): Promise<void> {
  await supabase.rpc('reject_teacher', { target_uid: uid });
}

// ------------------------------------------------------------------
// Admin management - search any account by email, promote/demote Admin
// ------------------------------------------------------------------

export interface SimpleProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: string;
}

function rowToSimpleProfile(row: any): SimpleProfile {
  return { uid: row.id, displayName: row.display_name, email: row.email, photoURL: row.photo_url, role: row.role };
}

export async function searchProfilesByEmail(query: string): Promise<SimpleProfile[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase.from('profiles').select('*').ilike('email', `%${query.trim()}%`).limit(10);
  if (error || !data) return [];
  return data.map(rowToSimpleProfile);
}

export async function listAdmins(): Promise<SimpleProfile[]> {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'admin');
  if (error || !data) return [];
  return data.map(rowToSimpleProfile);
}

export async function promoteToAdmin(uid: string): Promise<void> {
  await supabase.rpc('promote_to_admin', { target_uid: uid });
}

export async function demoteAdmin(uid: string): Promise<void> {
  await supabase.rpc('demote_admin', { target_uid: uid });
}

// ------------------------------------------------------------------
// Site-wide announcement banner (admin-managed, shown to everyone)
// Text or image only - see hero_media below for the video banner.
// ------------------------------------------------------------------

export type AnnouncementType = 'text' | 'image';

export interface Announcement {
  id: string;
  type: AnnouncementType;
  textContent: string | null;
  textColor: string | null;
  mediaUrl: string | null;
  isActive: boolean;
  updatedAt: Date;
}

function rowToAnnouncement(row: any): Announcement {
  return {
    id: row.id,
    type: row.type,
    textContent: row.text_content,
    textColor: row.text_color,
    mediaUrl: row.media_url,
    isActive: row.is_active,
    updatedAt: new Date(row.updated_at),
  };
}

export async function getActiveAnnouncement(): Promise<Announcement | null> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return rowToAnnouncement(data);
}

export async function setAnnouncement(input: {
  type: AnnouncementType;
  textContent?: string;
  textColor?: string;
  mediaUrl?: string;
  createdBy: string;
}): Promise<void> {
  // Deactivate any existing announcements, then insert the new one - keeps
  // exactly one active banner at a time without needing a separate "current"
  // pointer row.
  const { error: deactivateError } = await supabase.from('announcements').update({ is_active: false }).eq('is_active', true);
  if (deactivateError) throw deactivateError;
  const { error: insertError } = await supabase.from('announcements').insert({
    type: input.type,
    text_content: input.textContent ?? null,
    text_color: input.textColor ?? null,
    media_url: input.mediaUrl ?? null,
    is_active: true,
    created_by: input.createdBy,
  });
  if (insertError) throw insertError;
}

export async function clearAnnouncement(): Promise<void> {
  await supabase.from('announcements').update({ is_active: false }).eq('is_active', true);
}

// ------------------------------------------------------------------
// Hero media banner - a single image/video shown centered right below
// the header, admin-managed, autoplays if it's a video.
// ------------------------------------------------------------------

export type HeroMediaType = 'image' | 'video';

export interface HeroMedia {
  id: string;
  type: HeroMediaType;
  mediaUrl: string;
  isActive: boolean;
  updatedAt: Date;
}

function rowToHeroMedia(row: any): HeroMedia {
  return {
    id: row.id,
    type: row.type,
    mediaUrl: row.media_url,
    isActive: row.is_active,
    updatedAt: new Date(row.updated_at),
  };
}

export async function getActiveHeroMedia(): Promise<HeroMedia | null> {
  const { data, error } = await supabase
    .from('hero_media')
    .select('*')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return rowToHeroMedia(data);
}

export async function setHeroMedia(input: {
  type: HeroMediaType;
  mediaUrl: string;
  createdBy: string;
}): Promise<void> {
  const { error: deactivateError } = await supabase.from('hero_media').update({ is_active: false }).eq('is_active', true);
  if (deactivateError) throw deactivateError;
  const { error: insertError } = await supabase.from('hero_media').insert({
    type: input.type,
    media_url: input.mediaUrl,
    is_active: true,
    created_by: input.createdBy,
  });
  if (insertError) throw insertError;
}

export async function clearHeroMedia(): Promise<void> {
  await supabase.from('hero_media').update({ is_active: false }).eq('is_active', true);
}
