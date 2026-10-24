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
  saudi: {
    haram: [
      'Pilgrims from all over the world walk in circles around a black cube inside a giant white mosque. The chest waits close by.',
      'Look for the holiest place in Islam: a huge white mosque with tall minarets and a black cloth-covered house in its middle.',
      'Millions of people turn their faces towards one black cube every day to pray. Find the mosque around it.',
    ],
    medina: [
      'Find the mosque with the bright green dome and many tall minarets, in the city of the Prophet. The chest is beside it.',
      'A big square with giant folding umbrellas gives shade to worshippers. Look for the green dome next to it.',
      'In the second holiest city, a green dome shines above a peaceful mosque. Something golden waits near it.',
    ],
    tower: [
      'A glass skyscraper with a giant hole near the top, like a bottle opener, stands in the capital city. Look at its feet.',
      'Look up! A tall blue tower in Riyadh has a bridge across its top. The chest is at the bottom.',
      'The capital has a tower shaped like a huge gateway made of glass. The treasure is hiding near it.',
    ],
    tomb: [
      'Long ago, people carved a tomb into a big rose-coloured rock in AlUla. The chest waits at its door.',
      'A grand doorway is cut right into the sandstone. The Nabataeans made it more than two thousand years ago.',
      'Look for the rock that has a hidden house inside it, with columns carved in stone, in a desert city of the Nabataeans.',
    ],
    albalad: [
      'In the old town of Jeddah, coral-stone houses have carved wooden balconies. The chest is in the lane.',
      'Tall old houses with wooden window screens, called roshan, stand close together. Look beside them.',
      'Where merchants once sold spices by the Red Sea, the old houses still lean on each other. Find them.',
    ],
    fort: [
      'A fortress built of mud bricks stands in Diriyah, where the first Saudi state began. The chest is near its wall.',
      'Sand-coloured walls and little towers guard the old capital of the first Saudi state. Find the mud-brick castle.',
      'Look for a castle that was made from the earth itself, with walls and stairs of baked mud.',
    ],
    cliff: [
      'Stand at the Edge of the World, where the land ends in a giant cliff and the view goes on forever.',
      'A steep orange cliff drops down from a flat desert plateau near Riyadh. The chest is close to the edge, but be careful!',
      'The path ends where the rock falls away. Look for the tall wall of stone that looks like the end of the earth.',
    ],
    asir: [
      'High in the green mountains of Asir, stone houses are stacked up like building blocks. The chest waits below.',
      'A village clings to a mountain, with white-painted windows and many floors. Find it in the south.',
      'Look for the houses made of stone and slate that climb the hill, with colourful little windows.',
    ],
    maraya: [
      'A giant building covered in mirrors shows the desert and the sky, so it almost disappears. Find it in AlUla.',
      'Look for a huge glass box that reflects the red rocks around it like a magic trick.',
      'The biggest mirror building in the world hides in the desert. The chest sits beside its shiny wall.',
    ],
    fountain: [
      'A fountain shoots water higher than any other in the world, from the Red Sea next to Jeddah.',
      'Look for a tall white jet of water that rises from the sea. It is named after a king.',
      'Where the waves meet the shore in Jeddah, a very tall stream of water reaches for the sky.',
    ],
  },
  crystal: {
    waterfall: [
      'Listen for glowing water that tumbles down a rocky ledge into a pool. The chest is hiding there.',
      'A cool, misty waterfall shines blue in the dark. Look beside the pool at its feet.',
      'Follow the sound of falling water to the stone ledge where it pours.',
    ],
    gate: [
      'A big stone wall has a bronze door covered in glowing letters. Find the doors that nobody can read.',
      'Ancient runes glow blue on a heavy gate made of stone and copper. The chest waits by it.',
      'Look for a sealed doorway with a shining keyhole shape. A treasure is hiding next to it.',
    ],
    shrine: [
      'A tiny stone house with a copper roof and a dark doorway stands in the cave. Look beside it.',
      'Someone built a little temple from grey stone and bronze. The chest rests near its door.',
      'Find the small hut with a glowing symbol above its entrance.',
    ],
    arch: [
      'Walk under a stone arch covered in moss and glowing letters. The chest waits right beside it.',
      'An old gateway with blue runes and green vines curves over the path. Find it.',
      'Two stone pillars hold up a curved doorway that leads nowhere. Look for the moss on top.',
    ],
    statue: [
      'A grumpy stone face watches over the cave and never blinks. Look near its chin.',
      'Someone carved a giant head from stone, and moss grows on its hat. The chest is close to it.',
      'An ancient guardian with a heavy frown sits on a stone seat. Find him.',
    ],
    lamp: [
      'A crystal glows on top of a stone stand like a lamp that never goes out. Find the light.',
      'Look for a tall, shining crystal sitting on a round base, glowing pink and blue.',
      'Follow the soft glow of a gem on a pedestal. A chest waits by its light.',
    ],
    bluecrystal: [
      'The biggest blue crystal in the cave sparkles like ice. The chest sits at its base.',
      'Look for a giant cluster of icy blue gems pointing up to the roof.',
      'Blue spikes of crystal glow in the dark. Find the largest group.',
    ],
    purplecrystal: [
      'A huge purple crystal shines like a giant amethyst. The treasure is hiding at its feet.',
      'Look for the tallest purple gem with sharp points all around it.',
      'Among the blue lights, one big violet crystal stands alone. Find it.',
    ],
    cave: [
      'A tall grey rock has a dark hole at the bottom, like the mouth of a tiny cave inside the cave.',
      'Look for the rocky mountain with a hollow door at its base. The chest waits by the opening.',
      'A pile of tall stones hides a dark tunnel. Look near its entrance.',
    ],
    flowers: [
      'Glowing flowers with purple and blue petals grow beside a crystal. Find the garden of the cave.',
      'Look for flowers that shine in the dark, with a little crystal growing among their leaves.',
      'Where the cave floor turns into a tiny garden, a chest is hiding among the petals.',
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

/** What the player has just found: the real name of the landmark, shown when the chest opens (worlds with real places only). */
export const LANDMARK_LABELS: Partial<Record<WorldId, Record<string, string>>> = {
  saudi: {
    haram: 'Masjid al-Haram and the Kaaba, Makkah',
    medina: 'Al-Masjid an-Nabawi, Al-Madinah',
    tower: 'Kingdom Centre Tower, Riyadh',
    tomb: 'Hegra rock tombs, AlUla',
    albalad: 'Al-Balad, old Jeddah',
    fort: 'At-Turaif, Diriyah',
    cliff: 'Edge of the World, near Riyadh',
    asir: 'The mountain villages of Asir',
    maraya: 'Maraya, AlUla',
    fountain: "King Fahd's Fountain, Jeddah",
  },
  crystal: {
    waterfall: 'The Glowing Waterfall',
    gate: 'The Rune Gate',
    shrine: 'The Little Shrine',
    arch: 'The Mossy Arch',
    statue: 'The Stone Guardian',
    lamp: 'The Crystal Lamp',
    bluecrystal: 'The Giant Blue Crystal',
    purplecrystal: 'The Giant Purple Crystal',
    cave: 'The Hollow Rock',
    flowers: 'The Glowing Garden',
  },
};
