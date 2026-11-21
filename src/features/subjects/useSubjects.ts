import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { listMyTeacherSubjects, loadCatalog } from './api';
import type { Catalog, Subject, TeacherSubject } from './types';

let cache: Promise<Catalog> | null = null;
const catalog = (force = false) => { if (!cache || force) cache = loadCatalog().catch((e) => { cache = null; throw e; }); return cache; };

/**
 * The subject catalogue plus what the signed-in user may use.
 * Teachers: only their approved subjects. Admins: every active subject. Everyone else: none.
 */
export function useSubjects() {
  const { profile } = useAuth();
  const [cat, setCat] = useState<Catalog>({ subjects: [], questionTypes: [] });
  const [mine, setMine] = useState<TeacherSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const uid = profile?.uid, role = profile?.role;

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [c, m] = await Promise.all([catalog(true), uid && role === 'teacher' ? listMyTeacherSubjects(uid) : Promise.resolve([] as TeacherSubject[])]);
      setCat(c); setMine(m);
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }, [uid, role]);

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      try {
        const [c, m] = await Promise.all([catalog(), uid && role === 'teacher' ? listMyTeacherSubjects(uid) : Promise.resolve([] as TeacherSubject[])]);
        if (live) { setCat(c); setMine(m); setError(null); }
      } catch (e) { if (live) setError((e as Error).message); } finally { if (live) setLoading(false); }
    })();
    return () => { live = false; };
  }, [uid, role]);

  const allowed: Subject[] = useMemo(() => {
    const active = cat.subjects.filter((s) => s.active);
    if (role === 'admin') return active;
    if (role === 'teacher') { const ok = new Set(mine.filter((m) => m.status === 'approved').map((m) => m.subjectId)); return active.filter((s) => ok.has(s.id)); }
    return [];
  }, [cat.subjects, mine, role]);

  const subjectById = useCallback((id: string | null | undefined) => cat.subjects.find((s) => s.id === id), [cat.subjects]);
  /** Question types a subject allows. A subject with none configured allows every type. */
  const typesFor = useCallback((subjectId: string | null | undefined) => {
    const all = cat.questionTypes;
    const s = cat.subjects.find((x) => x.id === subjectId);
    if (!s || s.questionTypes.length === 0) return all;
    return all.filter((t) => s.questionTypes.includes(t.id));
  }, [cat.subjects, cat.questionTypes]);

  return { loading, error, subjects: cat.subjects, questionTypes: cat.questionTypes, allowed, mine, subjectById, typesFor, reload, ready: !loading && !error };
}
