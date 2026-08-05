export const ESCAPE_ROOM_THEMES = [
  'Ancient Egyptian temple', 'Pirate island', 'Secret laboratory', 'Haunted castle',
  'Jungle expedition', 'Space station', 'Medieval village', 'Underwater city',
  'Wizard school', 'Detective office',
];

export interface CongratsMessage {
  title: string;
  emoji: string;
}

export const GENERIC_CONGRATS: CongratsMessage[] = [
  { title: 'You escaped!', emoji: '🔓' },
  { title: 'Room cleared!', emoji: '🏆' },
  { title: 'Mission complete!', emoji: '🎉' },
  { title: 'You cracked it!', emoji: '⭐' },
  { title: 'Freedom!', emoji: '🗝️' },
  { title: 'Case closed!', emoji: '🕵️' },
  { title: 'Brilliant escape!', emoji: '✨' },
];

export const THEMED_CONGRATS: Record<string, CongratsMessage[]> = {
  'Ancient Egyptian temple': [
    { title: 'The Curse is Lifted!', emoji: '🏺' },
    { title: "Pharaoh's Blessing!", emoji: '👑' },
    { title: 'Tomb Conquered!', emoji: '⚱️' },
    { title: 'Ancient Secrets Unlocked!', emoji: '🔓' },
  ],
  'Pirate island': [
    { title: 'The Curse is Broken! Set Sail for Glory!', emoji: '🏴‍☠️' },
    { title: 'Treasure Found!', emoji: '⚓' },
    { title: "Ahoy, Captain! You Escaped!", emoji: '🚢' },
    { title: 'Buried Treasure Claimed!', emoji: '💰' },
  ],
  'Secret laboratory': [
    { title: 'Experiment Complete!', emoji: '🧪' },
    { title: 'Formula Cracked!', emoji: '⚗️' },
    { title: 'Lab Breach Contained!', emoji: '🔬' },
    { title: 'Genius Unlocked!', emoji: '🧠' },
  ],
  'Haunted castle': [
    { title: 'The Haunting Ends!', emoji: '👻' },
    { title: 'Ghosts Banished!', emoji: '🏰' },
    { title: "Curse Lifted! You're Free!", emoji: '⚰️' },
    { title: 'Spirits at Rest!', emoji: '🕯️' },
  ],
  'Jungle expedition': [
    { title: 'Jungle Conquered!', emoji: '🌴' },
    { title: "Explorer's Triumph!", emoji: '🦜' },
    { title: 'Lost Temple Found!', emoji: '🗺️' },
    { title: 'Survived the Wild!', emoji: '🌿' },
  ],
  'Space station': [
    { title: 'Mission Accomplished, Astronaut!', emoji: '🚀' },
    { title: 'Station Secured!', emoji: '🛰️' },
    { title: 'Houston, We Escaped!', emoji: '👨‍🚀' },
    { title: 'Orbit Achieved!', emoji: '🌌' },
  ],
  'Medieval village': [
    { title: 'The Kingdom is Saved!', emoji: '⚔️' },
    { title: 'Quest Complete, Brave Knight!', emoji: '🛡️' },
    { title: 'Village Freed!', emoji: '🏘️' },
    { title: 'Royal Victory!', emoji: '👑' },
  ],
  'Underwater city': [
    { title: "You've Surfaced!", emoji: '🌊' },
    { title: 'Atlantis Awaits!', emoji: '🔱' },
    { title: 'Deep Sea Victory!', emoji: '🐚' },
    { title: "Ocean's Secret Revealed!", emoji: '🐬' },
  ],
  'Wizard school': [
    { title: 'Spell Mastered!', emoji: '🪄' },
    { title: 'Graduation Day, Young Wizard!', emoji: '🎓' },
    { title: 'Magic Unlocked!', emoji: '✨' },
    { title: "Sorcerer's Triumph!", emoji: '🧙' },
  ],
  'Detective office': [
    { title: 'Case Closed!', emoji: '🕵️' },
    { title: 'Mystery Solved!', emoji: '🔍' },
    { title: 'Elementary, Detective!', emoji: '🎩' },
    { title: 'The Truth Revealed!', emoji: '📋' },
  ],
};

export function pickCongratsMessage(theme: string | null | undefined): CongratsMessage {
  const pool = (theme && THEMED_CONGRATS[theme]) || GENERIC_CONGRATS;
  return pool[Math.floor(Math.random() * pool.length)];
}
