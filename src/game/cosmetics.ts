export type CosmeticSlot = 'ball' | 'trail' | 'theme';
export type Cosmetic = { id: string; name: string; slot: CosmeticSlot; price: number; color: string; description: string };
export const COSMETICS: Cosmetic[] = [
  { id: 'ball-pulse', name: 'Pulse', slot: 'ball', price: 0, color: '#55d8ce', description: 'Classic mint core' },
  { id: 'ball-solar', name: 'Solar', slot: 'ball', price: 26, color: '#ffb55c', description: 'Warm amber core' },
  { id: 'ball-arcade', name: 'Arcade', slot: 'ball', price: 34, color: '#db83cc', description: 'Pink violet core' },
  { id: 'trail-none', name: 'No trail', slot: 'trail', price: 0, color: '#55d8ce', description: 'Clean movement' },
  { id: 'trail-pixel', name: 'Pixel sparks', slot: 'trail', price: 24, color: '#f5d26a', description: 'Short square sparks' },
  { id: 'trail-comet', name: 'Comet', slot: 'trail', price: 32, color: '#8bb6ff', description: 'Cool blue streak' },
  { id: 'theme-midnight', name: 'Midnight', slot: 'theme', price: 0, color: '#101d2a', description: 'Deep blue field' },
  { id: 'theme-ember', name: 'Ember', slot: 'theme', price: 42, color: '#27131b', description: 'Warm arcade field' },
  { id: 'theme-oxide', name: 'Oxide', slot: 'theme', price: 48, color: '#12251f', description: 'Dark green field' },
];
export const DEFAULT_EQUIPPED: Record<CosmeticSlot, string> = { ball: 'ball-pulse', trail: 'trail-none', theme: 'theme-midnight' };
export function cosmeticColor(id:string,fallback:string){return COSMETICS.find(item=>item.id===id)?.color??fallback;}
