import { POWERUP_CONFIG } from './config';
import { collidesObstacle } from './collision';
import type { Coin, Obstacle } from './types';

export function generateCoinPattern(section: number, width: number, y: number, obstacles: Obstacle[]): Coin[] {
  const mode=section%3, candidates:Array<{x:number;y:number}>=[];
  if(mode===0){const x=width*[.5,.78,.38,.62][section%4];for(let i=0;i<4;i++)candidates.push({x,y:y-i*45});}
  else if(mode===1){for(let i=0;i<4;i++)candidates.push({x:width*(.22+i*.18),y:y-i*62});}
  else {const x=section%2?.82:.18;for(let i=0;i<4;i++)candidates.push({x:width*(x+(i%2?-.035:.035)),y:y-i*58});}
  const clear=candidates.filter(p=>p.x>14&&p.x<width-14&&!obstacles.some(o=>collidesObstacle(p.x,p.y,9,o)));
  return clear.map((p,i)=>({id:section*100+i,x:p.x,y:p.y,vx:0,vy:0,value:POWERUP_CONFIG.coinValue,phase:(section+i)*.75}));
}
export function pullCoin(coin:Coin,x:number,y:number,dt:number,radius:number,strength:number):Coin{
  const dx=x-coin.x,dy=y-coin.y,distance=Math.hypot(dx,dy);if(distance<=1||distance>=radius)return coin;
  const force=strength*(1-distance/radius),vx=coin.vx+dx/distance*force*dt,vy=coin.vy+dy/distance*force*dt;
  return {...coin,vx,vy,x:coin.x+vx*dt,y:coin.y+vy*dt};
}
