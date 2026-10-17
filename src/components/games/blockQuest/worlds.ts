export type SceneryKind = 'islands' | 'candy' | 'lava' | 'sea' | 'space';

/**
 * The nine Block Quest worlds. The ids match the 3D worlds in features/world3d.
 * The colours here are only used by the flat 2D fallback (devices without WebGL)
 * and the card placeholders.
 */
export interface World {
  id: string;
  name: string;
  emoji: string;
  scenery: SceneryKind;
  sky: string;
  skyFar: string;
  ground: string;
  groundDark: string;
  track: string;
  trackLine: string;
  trackStripe: string;
  /** Colour of the gap the letter bridge crosses (water, lava, syrup...). */
  hazard: string;
  congrats: string[];
}

export const WORLDS: World[] = [
  {
    id: 'english-village',
    name: 'English Village',
    emoji: '🚌',
    scenery: 'islands',
    sky: '#9BDCFF',
    skyFar: '#D7EEFF',
    ground: '#6FC85A',
    groundDark: '#4BB35F',
    track: '#C3BCAF',
    trackLine: '#9C958A',
    trackStripe: '#B3AC9F',
    hazard: '#3E8FD6',
    congrats: ['Jolly good run!', 'You ruled English Village!', 'Brilliant, well done!'],
  },
  {
    id: 'adventure-awaits',
    name: 'Adventure Awaits',
    emoji: '🏜️',
    scenery: 'islands',
    sky: '#8CC8F5',
    skyFar: '#FFE9BE',
    ground: '#E8C98A',
    groundDark: '#D9B778',
    track: '#D9B778',
    trackLine: '#B98B4A',
    trackStripe: '#CFA966',
    hazard: '#2FA9E8',
    congrats: ['Temple treasure found!', 'What an adventure!', 'You cracked the desert!'],
  },
  {
    id: 'explore-learn-grow',
    name: 'Explore Learn Grow',
    emoji: '🌆',
    scenery: 'space',
    sky: '#241B7A',
    skyFar: '#4B3FD0',
    ground: '#161338',
    groundDark: '#1B1850',
    track: '#232059',
    trackLine: '#4AE3FF',
    trackStripe: '#3A3799',
    hazard: '#7B3FE4',
    congrats: ['Neon city conquered!', 'Future-fast run!', 'You lit up the skyline!'],
  },
  {
    id: 'keep-going',
    name: 'Keep Going',
    emoji: '⛄',
    scenery: 'islands',
    sky: '#9CCBFF',
    skyFar: '#EAF5FF',
    ground: '#F3F8FF',
    groundDark: '#D4E3F4',
    track: '#DCE8F7',
    trackLine: '#B8CCE6',
    trackStripe: '#D0E0F2',
    hazard: '#8FD0FF',
    congrats: ['Snow problem for you!', 'Cool run, champion!', 'You kept going!'],
  },
  {
    id: 'big-dreams',
    name: 'Big Dreams',
    emoji: '🏰',
    scenery: 'candy',
    sky: '#8CC6FF',
    skyFar: '#FFE3F1',
    ground: '#7CD65F',
    groundDark: '#55C26A',
    track: '#F4EEFF',
    trackLine: '#FFC9D9',
    trackStripe: '#E3D6FF',
    hazard: '#58B8F5',
    congrats: ['Dream castle reached!', 'Royal run!', 'Dreams do come true!'],
  },
  {
    id: 'be-brave',
    name: 'Be Brave',
    emoji: '🏴‍☠️',
    scenery: 'sea',
    sky: '#86C5FF',
    skyFar: '#E6F4FF',
    ground: '#2E9BE8',
    groundDark: '#1E88D6',
    track: '#B56B35',
    trackLine: '#6B4223',
    trackStripe: '#A35F2D',
    hazard: '#0F5FB0',
    congrats: ['Ahoy, brave sailor!', 'Treasure is yours!', 'You sailed through!'],
  },
  {
    id: 'play-learn-achieve',
    name: 'Play Learn Achieve',
    emoji: '🎡',
    scenery: 'candy',
    sky: '#8CCBFF',
    skyFar: '#EAF6FF',
    ground: '#7ED65F',
    groundDark: '#55C26A',
    track: '#FFC2DD',
    trackLine: '#BDE0FF',
    trackStripe: '#FFF0A6',
    hazard: '#FF8AC0',
    congrats: ['Theme park champion!', 'What a ride!', 'You achieved it!'],
  },
  {
    id: 'reach-higher',
    name: 'Reach Higher',
    emoji: '🚀',
    scenery: 'space',
    sky: '#0A0F30',
    skyFar: '#1B2250',
    ground: '#7C7E8E',
    groundDark: '#6B6D7B',
    track: '#59607A',
    trackLine: '#FFC83D',
    trackStripe: '#626A86',
    hazard: '#7B3FE4',
    congrats: ['Mission accomplished!', 'Blast-off success!', 'You reached higher!'],
  },
  {
    id: 'small-steps',
    name: 'Small Steps, Big Progress',
    emoji: '🌄',
    scenery: 'islands',
    sky: '#8CC8FF',
    skyFar: '#EAF6FF',
    ground: '#62C24E',
    groundDark: '#4FB343',
    track: '#A35F2D',
    trackLine: '#6B4223',
    trackStripe: '#B56B35',
    hazard: '#3FAEF0',
    congrats: ['Step by step, you did it!', 'Big progress!', 'Valley victory!'],
  },
];

export function getWorld(id: string): World {
  return WORLDS.find((w) => w.id === id) ?? WORLDS[0];
}
