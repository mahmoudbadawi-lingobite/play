import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdminNotifications } from '../contexts/AdminNotificationsContext';
import { listAdmins, type SimpleProfile } from '../lib/services';
import {
  getGroupMessages, sendGroupMessage, subscribeToGroupMessages,
  getDirectMessages, sendDirectMessage, subscribeToDirectMessages,
  markDmThreadRead, getUnreadDmCountsBySender,
  type GroupMessage, type DirectMessage,
} from '../lib/adminChatService';

type Thread = { type: 'group' } | { type: 'dm'; uid: string; name: string };

export function AdminChatPage() {
  const { profile } = useAuth();
  const { setActiveDmPartner, refreshUnreadDm } = useAdminNotifications();
  const [admins, setAdmins] = useState<SimpleProfile[]>([]);
  const [thread, setThread] = useState<Thread>({ type: 'group' });
  const [messages, setMessages] = useState<(GroupMessage | DirectMessage)[]>([]);
  const [input, setInput] = useState('');
  const [showSidebarOnMobile, setShowSidebarOnMobile] = useState(true);
  const [unreadBySender, setUnreadBySender] = useState<Record<string, number>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listAdmins().then((list) => setAdmins(list.filter((a) => a.uid !== profile?.uid)));
  }, [profile]);

  const refreshUnreadBySender = () => {
    if (!profile) return;
    getUnreadDmCountsBySender(profile.uid).then(setUnreadBySender);
  };

  useEffect(() => { refreshUnreadBySender(); }, [profile]);

  useEffect(() => {
    if (!profile) return;
    let unsubscribe: () => void;

    if (thread.type === 'group') {
      setActiveDmPartner(null);
      getGroupMessages().then(setMessages);
      unsubscribe = subscribeToGroupMessages((msg) => setMessages((m) => [...m, msg]));
    } else {
      setActiveDmPartner(thread.uid);
      markDmThreadRead(profile.uid, thread.uid).then(() => {
        refreshUnreadDm();
        refreshUnreadBySender();
      });
      getDirectMessages(profile.uid, thread.uid).then(setMessages);
      unsubscribe = subscribeToDirectMessages(profile.uid, thread.uid, (msg) => {
        setMessages((m) => [...m, msg]);
        if (msg.senderId === thread.uid) {
          markDmThreadRead(profile.uid, thread.uid).then(() => {
            refreshUnreadDm();
            refreshUnreadBySender();
          });
        }
      });
    }

    return () => {
      unsubscribe?.();
      setActiveDmPartner(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread, profile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!profile || !input.trim()) return;
    const content = input.trim();
    setInput('');
    if (thread.type === 'group') {
      await sendGroupMessage(profile.uid, profile.displayName ?? 'Admin', content);
    } else {
      await sendDirectMessage(profile.uid, thread.uid, content);
    }
  };

  const selectThread = (t: Thread) => {
    setThread(t);
    setShowSidebarOnMobile(false);
  };

  if (!profile) return null;

  const sidebar = (
    <div className="w-full shrink-0 border-border sm:w-64 sm:border-e">
      <p className="px-4 pb-2 pt-4 text-xs font-semibold uppercase text-muted-foreground">Chat</p>
      <button
        onClick={() => selectThread({ type: 'group' })}
        className={`flex w-full items-center gap-2 px-4 py-2.5 text-start text-sm font-medium ${
          thread.type === 'group' ? 'bg-secondary/10 text-primary' : 'text-primary/70 hover:bg-muted/50'
        }`}
      >
        👥 Admin Group Chat
      </button>

      <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase text-muted-foreground">Direct messages</p>
      {admins.length === 0 ? (
        <p className="px-4 py-2 text-sm text-muted-foreground">No other admins yet.</p>
      ) : (
        admins.map((a) => (
          <button
            key={a.uid}
            onClick={() => selectThread({ type: 'dm', uid: a.uid, name: a.displayName ?? 'Admin' })}
            className={`flex w-full items-center gap-2 px-4 py-2.5 text-start text-sm font-medium ${
              thread.type === 'dm' && thread.uid === a.uid ? 'bg-secondary/10 text-primary' : 'text-primary/70 hover:bg-muted/50'
            }`}
          >
            {a.photoURL && <img src={a.photoURL} alt="" className="h-6 w-6 rounded-full" />}
            <span className="flex-1">{a.displayName}</span>
            {unreadBySender[a.uid] > 0 && (
              <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                {unreadBySender[a.uid]}
              </span>
            )}
          </button>
        ))
      )}
    </div>
  );

  const conversation = (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button onClick={() => setShowSidebarOnMobile(true)} className="text-primary sm:hidden">←</button>
        <p className="font-display font-semibold text-primary">
          {thread.type === 'group' ? '👥 Admin Group Chat' : thread.name}
        </p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3" style={{ maxHeight: '55vh' }}>
        {messages.length === 0 ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">No messages yet - say hello.</p>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === profile.uid;
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${isMine ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'}`}>
                  {thread.type === 'group' && !isMine && (
                    <p className="mb-0.5 text-xs font-semibold text-secondary">{(m as GroupMessage).senderName}</p>
                  )}
                  <p>{m.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary"
        />
        <button onClick={handleSend} disabled={!input.trim()} className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground disabled:opacity-40">
          Send
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-primary">Admin Chat</h1>
      <p className="mt-1 text-sm text-muted-foreground">Admins only - not visible to teachers or students.</p>

      <div className="card-surface mt-6 flex flex-col overflow-hidden sm:flex-row">
        <div className={showSidebarOnMobile ? 'block' : 'hidden sm:block'}>{sidebar}</div>
        <div className={showSidebarOnMobile ? 'hidden sm:flex sm:flex-1' : 'flex flex-1'}>{conversation}</div>
      </div>
    </div>
  );
}
