import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { listPendingTeacherRequests, subscribeToProfileChanges } from '../lib/services';
import {
  getUnreadDmCount, markDmThreadRead, subscribeToMyIncomingDms,
} from '../lib/adminChatService';
import { playNotificationChime } from '../lib/notificationSound';

interface AdminNotificationsValue {
  unreadDmCount: number;
  pendingTeacherCount: number;
  setActiveDmPartner: (uid: string | null) => void;
  refreshUnreadDm: () => void;
}

const AdminNotificationsContext = createContext<AdminNotificationsValue>({
  unreadDmCount: 0,
  pendingTeacherCount: 0,
  setActiveDmPartner: () => {},
  refreshUnreadDm: () => {},
});

export function AdminNotificationsProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [unreadDmCount, setUnreadDmCount] = useState(0);
  const [pendingTeacherCount, setPendingTeacherCount] = useState(0);
  const activePartnerRef = useRef<string | null>(null);

  const refreshUnreadDm = () => {
    if (!profile) return;
    getUnreadDmCount(profile.uid).then(setUnreadDmCount);
  };

  const refreshPendingTeachers = () => {
    listPendingTeacherRequests().then((list) => setPendingTeacherCount(list.length));
  };

  const setActiveDmPartner = (uid: string | null) => {
    activePartnerRef.current = uid;
  };

  useEffect(() => {
    if (!isAdmin || !profile) {
      setUnreadDmCount(0);
      setPendingTeacherCount(0);
      return;
    }

    refreshUnreadDm();
    refreshPendingTeachers();

    const unsubDm = subscribeToMyIncomingDms(profile.uid, async (msg) => {
      if (activePartnerRef.current === msg.senderId) {
        await markDmThreadRead(profile.uid, msg.senderId);
      } else {
        playNotificationChime();
      }
      refreshUnreadDm();
    });

    const unsubProfiles = subscribeToProfileChanges(() => refreshPendingTeachers());

    return () => {
      unsubDm();
      unsubProfiles();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, profile?.uid]);

  return (
    <AdminNotificationsContext.Provider value={{ unreadDmCount, pendingTeacherCount, setActiveDmPartner, refreshUnreadDm }}>
      {children}
    </AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications() {
  return useContext(AdminNotificationsContext);
}
