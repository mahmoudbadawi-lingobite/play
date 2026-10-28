import type { WorldId } from './huntAssets';

/**
 * Indirect clues: they describe a landmark without naming it exactly.
 * Every landmark has a few versions so a replay does not read the same.
 */
const BASE_CLUES: Partial<Record<WorldId, Record<string, string[]>>> = {
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
    treehouse: [
      'A little wooden house sits high in the branches of a giant tree. Climb up with your eyes and find it.',
      'Someone built a home with a ladder up in the leaves. The chest waits at the roots.',
      'Look for a tree so wide that a family could live inside its branches.',
    ],
    hut: [
      'A straw-roof hut with a red banner and two burning torches keeps a secret at its door.',
      'Look for the bamboo house with a roof made of dry grass.',
      'Where the villagers sleep, a clay pot and a chest wait by the steps.',
    ],
    jaguar: [
      'A great stone cat roars from the wall of an ancient temple. The chest sits below its teeth.',
      'Find the temple with a fierce stone face carved above its doorway.',
      'Cover your eyes if you must, but the stone jaguar guards a chest right in front of it.',
    ],
    totem: [
      'A tall wooden pole with carved faces and bright stripes stands in the clearing. Find it.',
      'Faces are stacked one over the other on a painted pillar of wood. The chest is at its feet.',
      'Look for the carved wooden totem that watches the jungle from above the bushes.',
    ],
    lookout: [
      'Climb the ladder of a tall wooden tower with a straw roof. The chest waits at its base.',
      'A watchtower stands over the trees with a lantern hanging from its side.',
      'Where a lookout can see for miles, a treasure sits at the bottom of the stairs.',
    ],
    hollow: [
      'A mossy hill has a dark doorway with two torches burning on either side. Look for the cave.',
      'Follow the flames to a tunnel hidden under vines and rocks.',
      'A cave mouth glows with firelight. The chest hides at its entrance.',
    ],
    pyramid: [
      'A stepped stone pyramid rises out of the green with stairs on one side. The chest sits at its base.',
      'Look for the old temple with square patterns on every level and a staircase to the top.',
      'Many steps lead up a mountain made by people long ago. Find the pyramid.',
    ],
    canoe: [
      'A wooden boat rests on the ground with a paddle inside. It has not seen water for a long time.',
      'Look for a small boat for two explorers, resting on dry land among the leaves.',
      'A canoe with a coil of rope sits waiting for the river. The chest is next to it.',
    ],
    parrot: [
      'A bird with red, blue and yellow feathers sits on a branch and squawks. The chest is below its tree.',
      'Look for the colourful bird that can copy your words. Its tree hides a treasure.',
      'Listen for a loud squawk! A scarlet macaw guards a chest at its perch.',
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
    tent: [
      'A striped tent with a red rug at the door shelters travelers from the sun. The chest is by its entrance.',
      'Look for the dark tent that nomads carry from place to place.',
      'Beside the woven carpet and a clay jar, a treasure waits at a desert tent.',
    ],
    lookout: [
      'A tall wooden tower with a red roof lets guards watch the dunes for miles.',
      'Look for the watchtower with a lantern on its side. The chest sits at its feet.',
      'Climb up to see the whole desert from a wooden tower. The treasure is at the bottom.',
    ],
    skull: [
      'Bleached white horns and bones lie in the sand. Be brave and find the skull.',
      'An animal skull with big curved horns warns travelers to carry water. The chest is beside it.',
      'Look for the pale head of a long-lost bull among the stones.',
    ],
    signpost: [
      'A wooden sign with two painted arrows points the way for lost travelers.',
      'Look for the post with two boards pointing in different directions.',
      'Two arrows, one post. Follow the signpost to find the chest.',
    ],
    campfire: [
      'A circle of stones holds burning logs. Follow the smoke and the warmth.',
      'Travelers cook and keep warm here at night. Look for the campfire.',
      'Where flames dance inside a ring of rocks, a chest is waiting.',
    ],
    oasispool: [
      'A little pool of clear water hides behind a wall of stones, a quiet place in the dry land.',
      'Look for the spring surrounded by square rocks, where the water never dries.',
      'Cool water, warm stones, and a chest at the edge of the stone pool.',
    ],
    sandfort: [
      'A small castle of sand-coloured bricks has two towers with red flags on top.',
      'Look for the fort with a wooden door and flags flying over its walls.',
      'Guards once lived behind these brick walls and towers. The chest is near the fort gate.',
    ],
    fossil: [
      'A swirl of ancient shell is stuck in a rock. It lived long, long before the desert.',
      'Look for a spiral in the stone: the fossil of a sea animal in the middle of the sand.',
      'An ammonite, a shell that turned to stone, marks the place of the chest.',
    ],
    mesa: [
      'A tall block of orange rock with flat layers rises from the sand like a giant staircase.',
      'Look for the red mountain made of stacked stone steps.',
      'The wind carved this rocky tower, layer by layer. The chest sleeps at its foot.',
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
    khobar: [
      'A tall tower with a round top stands in the middle of the sea on a little island in Al Khobar.',
      'Look for the old water tower surrounded by waves and palm trees on the Eastern coast.',
      'A pink and white tower rises out of the sea like a big mushroom. Find it.',
    ],
    ithra: [
      'Big round stones that look like giant pebbles stand in a park in Dhahran. They are full of books and ideas.',
      'Look for the shiny silver building that is a world of culture and knowledge.',
      'Silver rocks that are really a centre for art, books and science. The chest sits near them.',
    ],
    halfmoon: [
      'A beautiful beach in the shape of a crescent in the Eastern Province. The waves are calm and the sand is soft.',
      'Look for the beach with turquoise water, a road beside the sand and palms along the shore.',
      'Sand curves like the new moon along the Arabian Gulf. The chest is hiding on this beach.',
    ],
    fanateer: [
      'A walkway beside the sea with palm trees, a bike path and a small marina in Jubail.',
      'Look for the seaside promenade where families walk and boats rest beside a wooden pier.',
      'Green lawns, palms and a pier meet the blue Gulf. Find the corniche.',
    ],
    tarout: [
      'An old castle stands on a rocky hill on an island in the Gulf, with little houses of clay below it.',
      'Look for the fortress with two round towers high up above the old village.',
      'A castle older than most cities watches the sea from its hill in Qatif.',
    ],
    ibrahim: [
      'A palace with thick walls, round towers and a white domed mosque inside its courtyard in Al-Ahsa.',
      'Look for the fortress with four corner towers around a courtyard and a small white mosque.',
      'The Ottoman governor lived here. The chest waits at the walls of his palace.',
    ],
    uqair: [
      'An old fort stands on the Gulf shore with fishing boats rocking beside it. It was once a very busy port.',
      'Look for the fortress on the coast with wooden boats on the water.',
      'Traders once crossed the sea to reach this fort in Al-Ahsa. The chest waits at its gate.',
    ],
    jawatha: [
      'Palm trees surround one of the oldest mosques in the Gulf, built from mud and stone.',
      'Look for the old mosque with round towers, standing among date palms.',
      'The first mosque in the east to hold Friday prayers outside Madinah. Find it among the palms.',
    ],
    qaisariya: [
      'A long covered market with arches and carved patterns, where sellers have called out to buyers for hundreds of years.',
      'Look for the old souq with many arched doors and traders sitting in the shade.',
      'Spices, cloth and gold were sold under these arches in Hofuf.',
    ],
    qatif: [
      'Two tall houses with carved wooden windows and flat roofs stand side by side in an old town of the east.',
      'Look for the traditional houses with brown wooden shutters that keep the rooms cool.',
      'Old homes with windows of carved wood are waiting in Qatif. Find the pair.',
    ],
    dammam: [
      'A fort with towers and flags stands in a village that shows how people of the Gulf lived long ago.',
      'Look for the heritage village with mud walls, tower and a busy courtyard in Dammam.',
      'Old crafts, old houses and flags above the walls. The chest is near the heritage village.',
    ],
    dougha: [
      'Dozens of red clay pots sit in the sun near workshops where potters shape them by hand.',
      'Look for the yard filled with pots and jars next to old mud buildings.',
      'Clay, fire and skilled hands make pots in this old factory in Al-Ahsa.',
    ],
    qarah: [
      'A mountain of orange rock has caves inside and palm trees at its foot. The caves stay cool in summer.',
      'Look for the sandstone mountain with dark holes in its side near Al-Ahsa.',
      'Climb in your mind to the rocky mountain with caves that hold a cool, quiet air.',
    ],
    asfar: [
      'A calm lake of blue water among reeds and sand, where birds come to rest. Look in the Eastern Province.',
      'Look for the lake surrounded by golden dunes with green plants growing at its edge.',
      'Birds visit the water here and the chest is hiding at the lake shore.',
    ],
    ahsa: [
      'The biggest natural palm grove in the world, with water running between the trees.',
      'Look for thousands of date palms with little canals running through the fields.',
      'A green sea of palms in the middle of the desert, an oasis recognised by the whole world.',
    ],
    darin: [
      'An old port town on an island, with wooden boats and ruins of a castle on the hill.',
      'Look for the little harbour where pearl divers once sailed, with the stones of an old fort above it.',
      'Boats rest on the blue water in front of an old fortress in Tarout Bay.',
    ],
  },
  egypt: {
    giza: [
      'Three huge triangles of stone rise from the sand. They are the oldest wonder of the ancient world.',
      'Look for the great pyramids, built for kings more than four thousand years ago.',
      'Camels walk past giant stone mountains made by hand near Cairo. The chest waits at their feet.',
    ],
    sphinx: [
      'A giant lion with a human face lies in the sand and has guarded the pyramids for thousands of years.',
      'Look for the statue with the body of a lion and the head of a king.',
      'It has watched the desert sunrise for ages and keeps its riddles to itself. Find the Sphinx.',
    ],
    karnak: [
      'A forest of giant stone columns stands inside huge gates beside the river in Luxor.',
      'Look for the biggest temple complex in the world, with tall gates and a maze of pillars.',
      'Kings added rooms to this temple for two thousand years. The chest waits near its great gate.',
    ],
    valleykings: [
      'Pharaohs were buried in secret tombs under a rocky hill. A staircase leads down to a dark door.',
      'Look for the stone doorway hidden in the cliff where kings were laid to rest.',
      'Treasure hunters have searched this valley for centuries, because the tombs hold golden secrets.',
    ],
    hatshepsut: [
      'A queen built a temple with long ramps and terraces cut into the cliff at Deir el-Bahari.',
      'Look for the flat white temple with rows of columns on three levels, built by a female pharaoh.',
      'Camels rest near the ramps of a great temple built for a queen who ruled as a king.',
    ],
    abusimbel: [
      'Four giant statues of a king sit in front of a mountain, carved straight into the rock by the Nile.',
      'Look for the huge rock temple where the sun lights up the faces twice a year.',
      'Ramses sits in stone, tall as a building, at the edge of Lake Nasser. Find his temple.',
    ],
    djoser: [
      'A pyramid built in steps, like a giant staircase to the sky. It is the first pyramid ever built.',
      'Look for the pyramid with six levels at Saqqara.',
      'Before smooth pyramids came a stair of stone. The chest rests at the foot of the step pyramid.',
    ],
    philae: [
      'A temple stands on a little green island in the Nile, dedicated to the goddess Isis.',
      'Look for the temple surrounded by water and palm trees. It was moved stone by stone to save it from the flood.',
      'Row a boat to the island of Isis near Aswan to find the chest.',
    ],
    citadel: [
      'A great fortress on a hill above Cairo has a mosque with blue domes and thin minarets.',
      'Look for the castle of Saladin with the Muhammad Ali Mosque inside.',
      'A leader of the Ayyubids built this hilltop citadel to protect the city. Find the domes.',
    ],
    luxor: [
      'A temple with a tall gate and a row of tall columns stands beside the Nile in the city of Luxor.',
      'Look for the temple lit up at night, with an obelisk and a line of sphinxes leading to it.',
      'Palm trees line the entrance to an ancient temple in the middle of the modern city.',
    ],
    stcatherine: [
      'Brown walls surround an ancient monastery at the foot of a holy mountain in Sinai.',
      'Look for the oldest working monastery in the world, in the desert below Mount Sinai.',
      'Monks have lived here for about fifteen hundred years behind thick stone walls. The chest is by the gate.',
    ],
    qaitbay: [
      'A fort at the edge of the sea in Alexandria, built where an ancient lighthouse once stood.',
      'Look for the castle by the Mediterranean built with stones of a fallen wonder.',
      'Waves hit the walls of a medieval fort at the harbour of Alexandria. The chest waits on the pier.',
    ],
    edfu: [
      'Two tall towers guard the doorway of a temple to a falcon god, one of the best-kept temples in Egypt.',
      'Look for the temple of Horus with huge carved figures on its walls.',
      'A falcon-headed god lived here, and stone giants still stand at his gate.',
    ],
    gem: [
      'A huge modern museum next to the pyramids is home to the treasures of Tutankhamun.',
      'Look for the glass and stone building that holds more ancient things than any other museum.',
      'A new building with a giant glass wall faces the pyramids. The treasure hides inside the Grand Egyptian Museum.',
    ],
    catacombs: [
      'A spiral staircase leads deep underground to a tomb from Roman times, in Alexandria.',
      'Look for the hole in the ground with a winding stair that goes down into dark tombs.',
      'Underground rooms were carved in the rock long ago, and the chest waits at the entrance of the catacombs.',
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

const retell = (src: Record<string, string[]>, swaps: [RegExp, string][]) =>
  Object.fromEntries(Object.entries(src).map(([k, v]) => [k, v.map((t) => swaps.reduce((acc, [re, to]) => acc.replace(re, to), t))]));

export const CLUES: Record<WorldId, Record<string, string[]>> = {
  ...(BASE_CLUES as Record<WorldId, Record<string, string[]>>),
  autumn: retell(BASE_CLUES.jungle as Record<string, string[]>, [[/in the jungle/g, 'in the woods'], [/this jungle/g, 'these woods'], [/the jungle/g, 'the woods'], [/jungle/g, 'forest'], [/green vines/g, 'red and orange vines']]),
  night: retell(BASE_CLUES.jungle as Record<string, string[]>, [[/in the jungle/g, 'in the dark'], [/this jungle/g, 'this night'], [/the jungle/g, 'the night'], [/jungle/g, 'night'], [/green vines/g, 'vines glowing in the moonlight']]),
  frost: {
    well: [
      'A round stone ring with a frozen bucket on a rope. The chest is resting beside it.',
      'Where the villagers once drew water, now covered in ice, a treasure is hiding.',
      'Look for a deep, round hole with a wooden beam above it. Snow has piled up around it.',
    ],
    house: [
      'A little stone house with a striped awning, covered in snow. The chest sits by its door.',
      'Someone left a cosy home in the snow. Find the roof with the red rug.',
      'Look for the only house in the valley. A chest is waiting at its front step.',
    ],
    arch: [
      'Pass through an old gateway of ice-covered stone. The chest waits beside it.',
      'A curved doorway stands alone in the snow. Find it.',
      'Look for ruins with a round top where a door once stood, now dusted with frost.',
    ],
    statue: [
      'A guardian of stone with crossed arms stands very still in the snow. Look at his feet.',
      'Someone carved a tall, silent figure and the snow has covered his shoulders.',
      'A stone watcher has been standing in the cold longer than anyone remembers.',
    ],
    column: [
      'One lonely pillar is still standing tall while the rest has fallen into the snow.',
      'Look for a broken column that once held up a roof.',
      'A tall stone pole rises from the white ground. The treasure sits at its base.',
    ],
    torch: [
      'A flame burns on top of a stone pillar even in the snow. Find the fire.',
      'Follow the flickering light of an old torch in the cold.',
      'Where a warm flame dances in the frozen valley, a chest waits close by.',
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
    khobar: 'Khobar Water Tower, Al Khobar',
    ithra: 'Ithra, Dhahran',
    halfmoon: 'Half Moon Beach, Eastern Province',
    fanateer: 'Al-Fanateer Corniche, Jubail',
    tarout: 'Tarout Castle, Qatif',
    ibrahim: 'Ibrahim Palace, Al-Ahsa',
    uqair: 'Al-Uqair Fort, Al-Ahsa',
    jawatha: 'Jawatha Mosque, Al-Ahsa',
    qaisariya: 'Al-Qaisariya Souq, Hofuf',
    qatif: 'Traditional houses of Qatif',
    dammam: 'Dammam Heritage Village',
    dougha: 'Dougha Pottery Factory, Al-Ahsa',
    qarah: 'Jabal Al Qarah, Al-Ahsa',
    asfar: 'Al-Asfar Lake, Eastern Province',
    ahsa: 'Al-Ahsa Oasis',
    darin: 'Darin Port and Castle, Tarout Bay',
  },
  egypt: {
    giza: 'Pyramids of Giza',
    sphinx: 'The Great Sphinx, Giza',
    karnak: 'Karnak Temple Complex, Luxor',
    valleykings: 'Valley of the Kings, Luxor',
    hatshepsut: 'Temple of Hatshepsut',
    abusimbel: 'Abu Simbel Temples',
    djoser: 'Step Pyramid of Djoser, Saqqara',
    philae: 'Philae Temple, Aswan',
    citadel: 'Citadel of Saladin, Cairo',
    luxor: 'Luxor Temple',
    stcatherine: 'St. Catherine\'s Monastery, Sinai',
    qaitbay: 'Citadel of Qaitbay, Alexandria',
    edfu: 'Temple of Edfu',
    gem: 'Grand Egyptian Museum, Giza',
    catacombs: 'Catacombs of Kom El Shoqafa, Alexandria',
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
