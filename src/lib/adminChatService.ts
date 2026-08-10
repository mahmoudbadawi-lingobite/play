import { supabase } from './supabase';

export interface GroupMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: Date;
}

function rowToGroupMessage(row: any): GroupMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    content: row.content,
    createdAt: new Date(row.created_at),
  };
}

function rowToDirectMessage(row: any): DirectMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    content: row.content,
    createdAt: new Date(row.created_at),
  };
}

// ------------------------------------------------------------------
// Group thread (all admins)
// ------------------------------------------------------------------

export async function getGroupMessages(): Promise<GroupMessage[]> {
  const { data, error } = await supabase
    .from('admin_group_messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(200);
  if (error || !data) return [];
  return data.map(rowToGroupMessage);
}

export async function sendGroupMessage(senderId: string, senderName: string, content: string): Promise<void> {
  await supabase.from('admin_group_messages').insert({ sender_id: senderId, sender_name: senderName, content });
}

export function subscribeToGroupMessages(onInsert: (msg: GroupMessage) => void, onClear?: () => void) {
  const channel = supabase
    .channel('admin_group_messages_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'admin_group_messages' },
      (payload) => onInsert(rowToGroupMessage(payload.new))
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'admin_group_messages' },
      () => onClear?.()
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export async function clearGroupChat(): Promise<void> {
  const { error } = await supabase.rpc('clear_group_chat');
  if (error) throw error;
}

// ------------------------------------------------------------------
// Direct messages (1:1 between two specific admins)
// ------------------------------------------------------------------

export async function getDirectMessages(myUid: string, otherUid: string): Promise<DirectMessage[]> {
  const { data, error } = await supabase
    .from('admin_direct_messages')
    .select('*')
    .or(`and(sender_id.eq.${myUid},recipient_id.eq.${otherUid}),and(sender_id.eq.${otherUid},recipient_id.eq.${myUid})`)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error || !data) return [];
  return data.map(rowToDirectMessage);
}

export async function sendDirectMessage(senderId: string, recipientId: string, content: string): Promise<void> {
  await supabase.from('admin_direct_messages').insert({ sender_id: senderId, recipient_id: recipientId, content });
}

export function subscribeToDirectMessages(
  myUid: string, otherUid: string,
  onInsert: (msg: DirectMessage) => void,
  onClear?: () => void
) {
  const channel = supabase
    .channel(`admin_dm_${[myUid, otherUid].sort().join('_')}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'admin_direct_messages' },
      (payload) => {
        const msg = rowToDirectMessage(payload.new);
        const isThisConversation =
          (msg.senderId === myUid && msg.recipientId === otherUid) ||
          (msg.senderId === otherUid && msg.recipientId === myUid);
        if (isThisConversation) onInsert(msg);
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'admin_direct_messages' },
      () => onClear?.()
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

export async function clearDmThread(myUid: string, otherUid: string): Promise<void> {
  const { error } = await supabase
    .from('admin_direct_messages')
    .delete()
    .or(`and(sender_id.eq.${myUid},recipient_id.eq.${otherUid}),and(sender_id.eq.${otherUid},recipient_id.eq.${myUid})`);
  if (error) throw error;
}

export async function markDmThreadRead(myUid: string, otherUid: string): Promise<void> {
  await supabase
    .from('admin_direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', myUid)
    .eq('sender_id', otherUid)
    .is('read_at', null);
}

export async function getUnreadDmCount(myUid: string): Promise<number> {
  const { count, error } = await supabase
    .from('admin_direct_messages')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', myUid)
    .is('read_at', null);
  if (error) return 0;
  return count ?? 0;
}

export async function getUnreadDmCountsBySender(myUid: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('admin_direct_messages')
    .select('sender_id')
    .eq('recipient_id', myUid)
    .is('read_at', null);
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const row of data) counts[row.sender_id] = (counts[row.sender_id] ?? 0) + 1;
  return counts;
}

/** Fires for any new DM addressed to this admin, regardless of which
 * conversation is currently open - used to drive the global unread
 * badge/chime from anywhere in the app. */
export function subscribeToMyIncomingDms(myUid: string, onInsert: (msg: DirectMessage) => void) {
  const channel = supabase
    .channel(`admin_dm_inbox_${myUid}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'admin_direct_messages', filter: `recipient_id=eq.${myUid}` },
      (payload) => onInsert(rowToDirectMessage(payload.new))
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
