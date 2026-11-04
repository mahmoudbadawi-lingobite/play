/** Client-side world progress (visited places, flags, opened chests). Rewards are never decided here; see the notes in Explore. */
export interface Progress { flags: string[]; visited: string[]; chests: string[]; seenTutorial: boolean; calm: boolean; character: string }
const key = (uid: string) => `mq.world.v1.${uid}`;
export function loadProgress(uid: string): Progress {
  try { const raw = localStorage.getItem(key(uid)); if (raw) return { flags: [], visited: [], chests: [], seenTutorial: false, calm: false, character: '', ...JSON.parse(raw) }; } catch { /* private mode */ }
  return { flags: [], visited: [], chests: [], seenTutorial: false, calm: false, character: '' };
}
export function saveProgress(uid: string, p: Progress) { try { localStorage.setItem(key(uid), JSON.stringify(p)); } catch { /* ignore */ } }

export interface QuestStep { text: string; done: (flags: Set<string>) => boolean }
export const EMBERLANDS_QUEST: QuestStep[] = [
  { text: 'Talk to the village guide', done: (f) => f.has('talk:guide') },
  { text: 'Walk east to Mushroom Valley', done: (f) => f.has('visit:mushroom-valley') },
  { text: 'Check both ? spots in the valley', done: (f) => f.has('mystery:q1') && f.has('mystery:q2') },
  { text: 'Find the Ancient Ember Ruins', done: (f) => f.has('visit:ember-ruins') },
  { text: 'Light both glowing tiles in the ruins', done: (f) => f.has('plate:plateA') && f.has('plate:plateB') },
  { text: 'Enter the Molten Caverns', done: (f) => f.has('visit:molten-caverns') },
  { text: 'Find the glowing doorway', done: (f) => f.has('touch:molten-caverns:exit') },
];
export const currentQuest = (flags: Set<string>) => EMBERLANDS_QUEST.find((q) => !q.done(flags))?.text ?? 'Emberlands explored! Try for rare monsters.';
