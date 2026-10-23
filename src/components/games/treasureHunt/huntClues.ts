import type { WorldId } from './huntAssets';

/**
 * Indirect clues: they describe a landmark without naming it exactly.
 * Every landmark has a few versions so a replay does not read the same.
 */
export const CLUES: Record<WorldId, Record<string, string[]>> = {
  jungle: {
    waterfall: [
      'Listen for the roar of rushing water. The chest is hiding where the river tumbles over the rocks.',
      'Where the cliff pours a ribbon of water into a pool, something shiny waits.',
      'Follow the sound of falling water to its cool, misty home.',
    ],
    statue: [
      'A stone face has watched this jungle for a thousand years. Look near its feet.',
      'An old guardian made of stone never blinks. The chest sits close to him.',
      'Someone carved a face into a tall block of stone and left a gift beside it.',
    ],
    arch: [
      'Walk under a gateway covered in green vines. The chest waits right beside it.',
      'Two old pillars hold up a curved doorway to nowhere. Find it.',
      'Look for the stone arch that the jungle has been trying to hide.',
    ],
    ruins: [
      'A mossy wall of broken stones keeps a secret. Look beside it.',
      'Square stones with ancient patterns lean in a row. The chest hides next to them.',
      'Once there was a temple here. Only a crumbling wall is left, and a chest next to it.',
    ],
    tree: [
      'The oldest, widest tree in the jungle shades something golden.',
      'Look for the giant tree with vines hanging from its branches like curtains.',
      'A huge tree stands taller than all the others. The chest rests at its roots.',
    ],
    torch: [
      'A flame burns on top of a stone pillar and never goes out. Find the fire.',
      'Follow the flickering light of an old torch.',
      'Where a flame dances in the jungle, a chest waits close by.',
    ],
  },
  desert: {
    well: [
      'Travelers come here to drink. The chest is resting beside a deep, round hole in the ground.',
      'A bucket hangs on a rope above cool water. Look next to it.',
      'Where the thirsty stop to fill their jugs, a treasure is hiding.',
    ],
    house: [
      'A mud-brick home with a bright red awning keeps something safe by its door.',
      'Look for the little house with a rug drawn over its roof.',
      'Someone lives in the sandy corner with the striped cloth. The chest is right by their house.',
    ],
    camel: [
      'A sleepy traveler with a hump on its back is resting in the sand. The chest is near.',
      'Look for the animal that can cross the desert without a drink. It is taking a nap.',
      'A saddled camel is lying down and guarding something.',
    ],
    arch: [
      'Pass through an old sandstone gateway. The chest waits beside it.',
      'A curved doorway of sand-coloured stone stands alone in the desert. Find it.',
      'Look for ruins with a round top where a door once stood.',
    ],
    statue: [
      'A guardian of stone with crossed arms stands very still. Look at his feet.',
      'Someone carved a tall, silent figure from sandstone. The chest is hiding near him.',
      'A stone watcher has been here longer than anyone remembers.',
    ],
    column: [
      'One lonely pillar is still standing tall while the rest has fallen.',
      'Look for a broken column that once held up a roof.',
      'A tall stone pole rises from the sand. The treasure sits at its base.',
    ],
  },
};

const WORD: Record<string, string> = { up: 'up', down: 'down', left: 'left', right: 'right' };

/** "the treasure is up and to the right of you" for the hint button (directions as seen on the screen). */
export function directionWords(dx: number, dy: number): string {
  const parts: string[] = [];
  if (Math.abs(dy) > 25) parts.push(dy < 0 ? WORD.up : WORD.down);
  if (Math.abs(dx) > 25) parts.push(dx < 0 ? WORD.left : WORD.right);
  return parts.length ? parts.join(' and ') : 'very close';
}
