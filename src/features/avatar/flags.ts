/**
 * Country flags for the Accessories category.
 * Pure data (no three.js). The pictures live in public/flags/<file>.png.
 * A worn flag is held by the character (see buildFlag in items3d.ts).
 */
export interface FlagInfo {
  /** file name in public/flags (without .png) - also used as the item id suffix */
  id: string;
  name: string;
  /** coins; the Gulf / Arab flags are a little cheaper, the UN flag is rarer */
  price: number;
}

export const FLAGS: FlagInfo[] = [
  // Arab world
  { id: 'saudi-arabia', name: 'Saudi Arabia', price: 40 },
  { id: 'uae', name: 'UAE', price: 40 },
  { id: 'egypt', name: 'Egypt', price: 40 },
  { id: 'qatar', name: 'Qatar', price: 40 },
  { id: 'kuwait', name: 'Kuwait', price: 40 },
  { id: 'oman', name: 'Oman', price: 40 },
  { id: 'jordan', name: 'Jordan', price: 40 },
  { id: 'iraq', name: 'Iraq', price: 40 },
  { id: 'algeria', name: 'Algeria', price: 40 },
  { id: 'tunisia', name: 'Tunisia', price: 40 },
  { id: 'libya', name: 'Libya', price: 40 },
  { id: 'lebanon', name: 'Lebanon', price: 40 },
  { id: 'yemen', name: 'Yemen', price: 40 },
  { id: 'bahrain', name: 'Bahrain', price: 40 },
  { id: 'sudan', name: 'Sudan', price: 40 },
  { id: 'morocco', name: 'Morocco', price: 40 },
  { id: 'syria', name: 'Syria', price: 40 },
  { id: 'palestine', name: 'Palestine', price: 40 },
  { id: 'mali', name: 'Mali', price: 40 },
  // Muslim-majority and nearby countries
  { id: 'turkey', name: 'Turkey', price: 40 },
  { id: 'iran', name: 'Iran', price: 40 },
  { id: 'pakistan', name: 'Pakistan', price: 40 },
  { id: 'indonesia', name: 'Indonesia', price: 40 },
  { id: 'malaysia', name: 'Malaysia', price: 40 },
  { id: 'brunei', name: 'Brunei', price: 40 },
  { id: 'bangladesh', name: 'Bangladesh', price: 40 },
  // The world
  { id: 'united-states', name: 'United States', price: 40 },
  { id: 'united-kingdom', name: 'United Kingdom', price: 40 },
  { id: 'canada', name: 'Canada', price: 40 },
  { id: 'germany', name: 'Germany', price: 40 },
  { id: 'france', name: 'France', price: 40 },
  { id: 'italy', name: 'Italy', price: 40 },
  { id: 'japan', name: 'Japan', price: 40 },
  { id: 'south-korea', name: 'South Korea', price: 40 },
  { id: 'china', name: 'China', price: 40 },
  { id: 'australia', name: 'Australia', price: 40 },
  { id: 'brazil', name: 'Brazil', price: 40 },
  { id: 'india', name: 'India', price: 40 },
  { id: 'russia', name: 'Russia', price: 40 },
  { id: 'south-africa', name: 'South Africa', price: 40 },
  { id: 'new-zealand', name: 'New Zealand', price: 40 },
  { id: 'united-nations', name: 'United Nations', price: 60 },
];

export const FLAG_IDS = FLAGS.map((f) => f.id);
export const flagName = (id: string) => FLAGS.find((f) => f.id === id)?.name ?? id;
