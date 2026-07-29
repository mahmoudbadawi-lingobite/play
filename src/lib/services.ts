import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, increment, arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ContentItem, ContentSet, GameKey, GameResult, SchoolClass, SkillTemplate, Visibility } from '../types';

// ------------------------------------------------------------------
// Content sets
// ------------------------------------------------------------------

const contentCol = collection(db, 'contentSets');

export async function checkDuplicateTitle(title: string): Promise<ContentSet | null> {
  const normalized = title.trim().toLowerCase();
  if (!normalized) return null;
  const q = query(contentCol, where('titleLower', '==', normalized), where('visibility', '==', 'public'), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return docToContentSet(snap.docs[0]);
}

export async function createContentSet(input: {
  title: string;
  skill: SkillTemplate;
  teacherId: string;
  teacherName: string;
  visibility: Visibility;
  items: ContentItem[];
}): Promise<string> {
  const ref = await addDoc(contentCol, {
    title: input.title,
    titleLower: input.title.trim().toLowerCase(),
    skill: input.skill,
    teacherId: input.teacherId,
    teacherName: input.teacherName,
    visibility: input.visibility,
    items: input.items,
    playCount: 0,
    reportCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getContentSet(id: string): Promise<ContentSet | null> {
  const snap = await getDoc(doc(db, 'contentSets', id));
  if (!snap.exists()) return null;
  return docToContentSet(snap);
}

export async function listPublicContentSets(skill?: SkillTemplate): Promise<ContentSet[]> {
  const clauses = [where('visibility', '==', 'public')];
  if (skill) clauses.push(where('skill', '==', skill));
  const q = query(contentCol, ...clauses, orderBy('playCount', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(docToContentSet);
}

export async function listMyContentSets(teacherId: string): Promise<ContentSet[]> {
  const q = query(contentCol, where('teacherId', '==', teacherId), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(docToContentSet);
}

export async function incrementPlayCount(id: string): Promise<void> {
  await updateDoc(doc(db, 'contentSets', id), { playCount: increment(1) });
}

export async function deleteContentSet(id: string): Promise<void> {
  await deleteDoc(doc(db, 'contentSets', id));
}

export async function reportContentSet(id: string, reason: string, reporterId: string): Promise<void> {
  await updateDoc(doc(db, 'contentSets', id), { reportCount: increment(1) });
  await addDoc(collection(db, 'contentReports'), {
    contentSetId: id, reason, reporterId, createdAt: serverTimestamp(),
  });
}

export async function listReportedContentSets(): Promise<ContentSet[]> {
  const q = query(contentCol, where('reportCount', '>', 0), orderBy('reportCount', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(docToContentSet);
}

export async function unpublishContentSet(id: string): Promise<void> {
  await updateDoc(doc(db, 'contentSets', id), { visibility: 'private' });
}

export async function dismissReports(id: string): Promise<void> {
  await updateDoc(doc(db, 'contentSets', id), { reportCount: 0 });
}

function docToContentSet(d: any): ContentSet {
  const data = d.data();
  return {
    id: d.id,
    title: data.title,
    skill: data.skill,
    teacherId: data.teacherId,
    teacherName: data.teacherName,
    visibility: data.visibility,
    items: data.items ?? [],
    playCount: data.playCount ?? 0,
    reportCount: data.reportCount ?? 0,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

// ------------------------------------------------------------------
// Classes / rosters (independent within LingoBite Play)
// ------------------------------------------------------------------

const classCol = collection(db, 'classes');

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/I/1 ambiguity
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createClass(teacherId: string, name: string): Promise<string> {
  const ref = await addDoc(classCol, {
    name, teacherId, studentIds: [], joinCode: generateJoinCode(), createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listMyClasses(teacherId: string): Promise<SchoolClass[]> {
  const q = query(classCol, where('teacherId', '==', teacherId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      teacherId: data.teacherId,
      studentIds: data.studentIds ?? [],
      joinCode: data.joinCode ?? '',
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    };
  });
}

export async function addStudentToClass(classId: string, studentId: string): Promise<void> {
  await updateDoc(doc(db, 'classes', classId), { studentIds: arrayUnion(studentId) });
}

export async function joinClassByCode(code: string, studentId: string): Promise<SchoolClass | null> {
  const normalized = code.trim().toUpperCase();
  const q = query(classCol, where('joinCode', '==', normalized), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const classDoc = snap.docs[0];
  await addStudentToClass(classDoc.id, studentId);
  await updateDoc(doc(db, 'users', studentId), { classIds: arrayUnion(classDoc.id) });
  const data = classDoc.data();
  return {
    id: classDoc.id,
    name: data.name,
    teacherId: data.teacherId,
    studentIds: [...(data.studentIds ?? []), studentId],
    joinCode: data.joinCode,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  };
}

// ------------------------------------------------------------------
// Game results / leaderboard / XP
// ------------------------------------------------------------------

const resultsCol = collection(db, 'gameResults');

export async function recordGameResult(input: Omit<GameResult, 'id' | 'playedAt'>): Promise<void> {
  await addDoc(resultsCol, { ...input, playedAt: serverTimestamp() });
  await updateDoc(doc(db, 'users', input.studentId), { totalXP: increment(input.xpEarned) });
}

export async function getClassLeaderboard(classId: string): Promise<GameResult[]> {
  const q = query(resultsCol, where('classId', '==', classId), orderBy('xpEarned', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, playedAt: data.playedAt?.toDate?.() ?? new Date() } as GameResult;
  });
}

export async function getGameLeaderboard(gameKey: GameKey): Promise<GameResult[]> {
  const q = query(resultsCol, where('gameKey', '==', gameKey), orderBy('xpEarned', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, playedAt: data.playedAt?.toDate?.() ?? new Date() } as GameResult;
  });
}

// ------------------------------------------------------------------
// Teacher access requests (approved from LingoBite Play's own Admin
// dashboard - not shared with LingoBite / LingoTrace)
// ------------------------------------------------------------------

export async function requestTeacherAccess(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { teacherStatus: 'pending' });
}

export async function listPendingTeacherRequests() {
  const q = query(collection(db, 'users'), where('teacherStatus', '==', 'pending'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export async function approveTeacher(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { role: 'teacher', teacherStatus: 'approved' });
}

export async function rejectTeacher(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { teacherStatus: 'rejected' });
}
