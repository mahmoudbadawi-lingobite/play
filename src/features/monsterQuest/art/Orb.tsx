import { ui } from '../uiAssets';

/** Capture orb. The item colour picks which painted orb to show (quest = blue, great = teal, ultra = orange, prism = rainbow). */
const BY_COLOR: Record<string, string> = { '#3b82f6': 'quest_orb', '#06b6d4': 'great_orb', '#f59e0b': 'ultra_orb', '#d946ef': 'prism_orb' };

export function Orb({ color = '#3b82f6', size = 48, className }: { color?: string; size?: number; className?: string }) {
  const key = BY_COLOR[color.toLowerCase()] ?? 'quest_orb';
  return <img src={ui(`item-${key}`)} alt="" aria-hidden="true" draggable={false} width={size} height={size} className={className} style={{ width: size, height: size, objectFit: 'contain' }} />;
}
