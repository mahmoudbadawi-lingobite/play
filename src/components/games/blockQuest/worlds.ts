export type SceneryKind = 'islands' | 'candy' | 'lava' | 'sea' | 'space';

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
    id: 'sky-islands',
    name: 'Sky Islands',
    emoji: '🏝️',
    scenery: 'islands',
    sky: '#9BDCFF',
    skyFar: '#CDEEFF',
    ground: '#6BCB5B',
    groundDark: '#4BB35F',
    track: '#FFD36B',
    trackLine: '#E8B94A',
    trackStripe: '#EBC15A',
    hazard: '#3EA8F5',
    congrats: ['You ruled the Sky Islands!', 'Cloud-hopping champion!', 'Top of the world!'],
  },
  {
    id: 'candy-canyon',
    name: 'Candy Canyon',
    emoji: '🍭',
    scenery: 'candy',
    sky: '#FFD6EC',
    skyFar: '#FFEAF5',
    ground: '#B8F0D8',
    groundDark: '#8EE3C0',
    track: '#FFB3D1',
    trackLine: '#F58BB5',
    trackStripe: '#F99EC2',
    hazard: '#FF8AC0',
    congrats: ['Sweet victory!', 'You conquered Candy Canyon!', 'Sugar-sprint superstar!'],
  },
  {
    id: 'lava-lab',
    name: 'Lava Lab',
    emoji: '🌋',
    scenery: 'lava',
    sky: '#3B1B3A',
    skyFar: '#FF8A4C',
    ground: '#FF6A2E',
    groundDark: '#E04E1B',
    track: '#7A6F8F',
    trackLine: '#5E5473',
    trackStripe: '#6B6182',
    hazard: '#FF5A1F',
    congrats: ['You cooled the volcano!', 'Hot-footed hero!', 'Lava Lab cleared!'],
  },
  {
    id: 'deep-sea',
    name: 'Deep Sea',
    emoji: '🐠',
    scenery: 'sea',
    sky: '#7FD4F5',
    skyFar: '#BDEBFA',
    ground: '#1E88D6',
    groundDark: '#1673BD',
    track: '#F4D9A0',
    trackLine: '#D9B974',
    trackStripe: '#E6C885',
    hazard: '#0F5FB0',
    congrats: ['You found the treasure!', 'Deep Sea diver supreme!', 'Splash-tastic run!'],
  },
  {
    id: 'space-blocks',
    name: 'Space Blocks',
    emoji: '🚀',
    scenery: 'space',
    sky: '#14143A',
    skyFar: '#2B2B7A',
    ground: '#241F5C',
    groundDark: '#1B1850',
    track: '#3B3F9E',
    trackLine: '#7B82FF',
    trackStripe: '#4D52B8',
    hazard: '#7B3FE4',
    congrats: ['Mission accomplished!', 'Blast-off success!', 'You orbited every gate!'],
  },
];

export function getWorld(id: string): World {
  return WORLDS.find((w) => w.id === id) ?? WORLDS[0];
}
