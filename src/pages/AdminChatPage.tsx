import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdminNotifications } from '../contexts/AdminNotificationsContext';
import { listAdmins, type SimpleProfile } from '../lib/services';
import { uploadToCloudinary } from '../lib/cloudinary';
import { useVoiceRecorder } from '../lib/useVoiceRecorder';
import {
  getGroupMessages, sendGroupMessage, subscribeToGroupMessages, clearGroupChat,
  getDirectMessages, sendDirectMessage, subscribeToDirectMessages, clearDmThread,
  markDmThreadRead, getUnreadDmCountsBySender,
  markGroupChatRead, getGroupReadReceipts, subscribeToGroupReadReceipts,
  type GroupMessage, type DirectMessage,
} from '../lib/adminChatService';

type Thread = { type: 'group' } | { type: 'dm'; uid: string; name: string };

function formatTimestamp(date: Date): string {
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AdminChatPage() {
  const { profile } = useAuth();
  const { setActiveDmPartner, refreshUnreadDm } = useAdminNotifications();
  const [admins, setAdmins] = useState<SimpleProfile[]>([]);
  const [thread, setThread] = useState<Thread>({ type: 'group' });
  const [messages, setMessages] = useState<(GroupMessage | DirectMessage)[]>([]);
  const [input, setInput] = useState('');
  const [showSidebarOnMobile, setShowSidebarOnMobile] = useState(true);
  const [unreadBySender, setUnreadBySender] = useState<Record<string, number>>({});
  const [clearing, setClearing] = useState(false);
  const [sending, setSending] = useState(false);
  const [groupReadReceipts, setGroupReadReceipts] = useState<Record<string, Date>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const recorder = useVoiceRecorder();

  useEffect(() => {
    listAdmins().then((list) => setAdmins(list.filter((a) => a.uid !== profile?.uid)));
  }, [profile]);

  const refreshUnreadBySender = () => {
    if (!profile) return;
    getUnreadDmCountsBySender(profile.uid).then(setUnreadBySender);
  };

  useEffect(() => { refreshUnreadBySender(); }, [profile]);

  // Everyone's "last read the group chat at" cursor, kept live so seen
  // avatars appear under a message as soon as another admin catches up.
  useEffect(() => {
    getGroupReadReceipts().then(setGroupReadReceipts);
    const unsub = subscribeToGroupReadReceipts((adminId, lastReadAt) => {
      setGroupReadReceipts((prev) => ({ ...prev, [adminId]: lastReadAt }));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!profile) return;
    let unsubscribe: () => void;

    if (thread.type === 'group') {
      setActiveDmPartner(null);
      getGroupMessages().then(setMessages);
      markGroupChatRead(profile.uid).then(() =>
        setGroupReadReceipts((prev) => ({ ...prev, [profile.uid]: new Date() }))
      );
      unsubscribe = subscribeToGroupMessages(
        (msg) => {
          setMessages((m) => [...m, msg]);
          // Viewing the thread live counts as reading it too.
          markGroupChatRead(profile.uid).then(() =>
            setGroupReadReceipts((prev) => ({ ...prev, [profile.uid]: new Date() }))
          );
        },
        () => setMessages([])
      );
    } else {
      setActiveDmPartner(thread.uid);
      markDmThreadRead(profile.uid, thread.uid).then(() => {
        refreshUnreadDm();
        refreshUnreadBySender();
      });
      getDirectMessages(profile.uid, thread.uid).then(setMessages);
      unsubscribe = subscribeToDirectMessages(
        profile.uid,
        thread.uid,
        (msg) => {
          setMessages((m) => [...m, msg]);
          if (msg.senderId === thread.uid) {
            markDmThreadRead(profile.uid, thread.uid).then(() => {
              refreshUnreadDm();
              refreshUnreadBySender();
            });
          }
        },
        () => getDirectMessages(profile.uid, thread.uid).then(setMessages),
        (updatedMsg) => {
          // e.g. read_at flipped once the other admin opened the thread
          setMessages((m) => m.map((existing) => (existing.id === updatedMsg.id ? updatedMsg : existing)));
        }
      );
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

  useEffect(() => {
    // Clean up mic/preview if the admin navigates away mid-recording.
    return () => recorder.discard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread]);

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

  const handleSendVoiceNote = async () => {
    if (!profile || !recorder.audioBlob) return;
    setSending(true);
    try {
      const file = new File([recorder.audioBlob], `voice-note-${Date.now()}.webm`, { type: recorder.audioBlob.type || 'audio/webm' });
      const audioUrl = await uploadToCloudinary(file, 'video');
      const voiceNote = { audioUrl, audioDurationSeconds: recorder.seconds };
      if (thread.type === 'group') {
        await sendGroupMessage(profile.uid, profile.displayName ?? 'Admin', '', voiceNote);
      } else {
        await sendDirectMessage(profile.uid, thread.uid, '', voiceNote);
      }
      recorder.discard();
    } catch (err: any) {
      alert(err.message ?? 'Could not send the voice note.');
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    if (!profile) return;
    const label = thread.type === 'group' ? 'the group chat for every admin' : `your chat with ${thread.name}`;
    if (!confirm(`Clear ${label}? This can't be undone.`)) return;
    setClearing(true);
    try {
      if (thread.type === 'group') {
        await clearGroupChat();
      } else {
        await clearDmThread(profile.uid, thread.uid);
      }
      setMessages([]);
      refreshUnreadDm();
      refreshUnreadBySender();
    } catch (err: any) {
      alert(err.message ?? 'Could not clear chat.');
    } finally {
      setClearing(false);
    }
  };

  const selectThread = (t: Thread) => {
    recorder.discard();
    setThread(t);
    setShowSidebarOnMobile(false);
  };

  if (!profile) return null;

  const canClearThisChat = thread.type === 'dm' || (thread.type === 'group' && profile.isProtected);

  // Which other admins have "seen" a given message (their group read
  // cursor is at/after the message's timestamp). Only relevant for
  // messages I sent - shown as small avatar stamps underneath.
  const seenByForGroupMessage = (msg: GroupMessage): SimpleProfile[] => {
    return admins.filter((a) => {
      const lastRead = groupReadReceipts[a.uid];
      return lastRead && lastRead.getTime() >= msg.createdAt.getTime();
    });
  };

  const dmPartnerAvatar = thread.type === 'dm' ? admins.find((a) => a.uid === thread.uid) : null;

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
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSidebarOnMobile(true)} className="text-primary sm:hidden">←</button>
          <p className="font-display font-semibold text-primary">
            {thread.type === 'group' ? '👥 Admin Group Chat' : thread.name}
          </p>
        </div>
        {canClearThisChat && messages.length > 0 && (
          <button
            onClick={handleClear}
            disabled={clearing}
            className="text-xs font-semibold text-destructive hover:opacity-80 disabled:opacity-40"
          >
            {clearing ? 'Clearing...' : 'Clear chat'}
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3" style={{ maxHeight: '55vh' }}>
        {messages.length === 0 ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">No messages yet - say hello.</p>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === profile.uid;
            const isVoiceNote = !!m.audioUrl;

            // "Seen by" avatars - only shown under my own messages.
            let seenAvatars: SimpleProfile[] = [];
            if (isMine) {
              if (thread.type === 'group') {
                seenAvatars = seenByForGroupMessage(m as GroupMessage);
              } else {
                const dm = m as DirectMessage;
                if (dm.readAt && dmPartnerAvatar) seenAvatars = [dmPartnerAvatar];
              }
            }

            return (
              <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${isMine ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'}`}>
                  {thread.type === 'group' && !isMine && (
                    <p className="mb-0.5 text-xs font-semibold text-secondary">{(m as GroupMessage).senderName}</p>
                  )}
                  {isVoiceNote ? (
                    <div className="flex items-center gap-2">
                      <span>🎤</span>
                      <audio controls src={m.audioUrl ?? undefined} className="h-8 max-w-[220px]" />
                      {m.audioDurationSeconds != null && (
                        <span className="text-[10px] opacity-80">{formatDuration(m.audioDurationSeconds)}</span>
                      )}
                    </div>
                  ) : (
                    <p>{m.content}</p>
                  )}
                </div>

                <div className="mt-0.5 flex items-center gap-1 px-1">
                  <span className="text-[10px] text-muted-foreground">{formatTimestamp(m.createdAt)}</span>
                  {seenAvatars.length > 0 && (
                    <span className="ms-1 flex -space-x-1.5">
                      {seenAvatars.map((a) =>
                        a.photoURL ? (
                          <img
                            key={a.uid}
                            src={a.photoURL}
                            alt={`Seen by ${a.displayName}`}
                            title={`Seen by ${a.displayName}`}
                            className="h-3.5 w-3.5 rounded-full border border-background"
                          />
                        ) : (
                          <span
                            key={a.uid}
                            title={`Seen by ${a.displayName}`}
                            className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-background bg-secondary text-[7px] font-bold text-secondary-foreground"
                          >
                            {(a.displayName ?? '?').charAt(0).toUpperCase()}
                          </span>
                        )
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3">
        {recorder.error && <p className="mb-2 text-xs font-medium text-destructive">{recorder.error}</p>}

        {recorder.state === 'recording' ? (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" />
            <span className="flex-1 text-sm font-medium text-primary">Recording... {formatDuration(recorder.seconds)}</span>
            <button onClick={recorder.stop} className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white">
              Stop
            </button>
          </div>
        ) : recorder.state === 'stopped' && recorder.audioPreviewUrl ? (
          <div className="flex items-center gap-2 rounded-lg border border-secondary/40 bg-secondary/5 px-3 py-2">
            <audio controls src={recorder.audioPreviewUrl} className="h-8 flex-1" />
            <button
              onClick={recorder.discard}
              disabled={sending}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary/70 disabled:opacity-40"
            >
              Discard
            </button>
            <button
              onClick={handleSendVoiceNote}
              disabled={sending}
              className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground disabled:opacity-40"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-secondary"
            />
            <button
              onClick={recorder.start}
              title="Record a voice note"
              className="rounded-lg border border-border px-3 py-2 text-sm text-primary hover:bg-muted/50"
            >
              🎤
            </button>
            <button onClick={handleSend} disabled={!input.trim()} className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground disabled:opacity-40">
              Send
            </button>
          </div>
        )}
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
