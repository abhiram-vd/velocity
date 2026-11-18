import { COSMETICS, type CosmeticSlot } from './cosmetics';
import type { SaveData } from './save';

export function buyCosmetic(save:SaveData,id:string){
  const item=COSMETICS.find(c=>c.id===id);
  if(!item||save.ownedCosmetics.includes(id)||save.coins<item.price)return{ok:false,cost:item?.price??0,save};
  return{ok:true,cost:item.price,save:{...save,coins:save.coins-item.price,ownedCosmetics:[...save.ownedCosmetics,id]}};
}
export function equipCosmetic(save:SaveData,id:string){
  const item=COSMETICS.find(c=>c.id===id);if(!item||!save.ownedCosmetics.includes(id))return{ok:false,save};
  return{ok:true,save:{...save,equipped:{...save.equipped,[item.slot as CosmeticSlot]:id}}};
}
