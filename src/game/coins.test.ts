import { describe, expect, it } from 'vitest';
import { generateCoinPattern, pullCoin } from './coins';
import { scoreCoin, scoreDistance } from './scoring';
import { findPowerUpSpot, powerUpCollision, worldScrollSpeed } from './powerups';
import { collidesObstacle } from './collision';
import { stepPlayer } from './physics';
import type { Player } from './physics';

describe('coin collection and scoring',()=>{
  it('creates intentional coin lines outside obstacle hitboxes',()=>{
    const obstacles=[{id:1,x:0,y:-300,w:250,h:30,kind:'block' as const,phase:0,amplitude:0,period:1,angle:0}];
    const coins=generateCoinPattern(1,800,-250,obstacles);expect(coins.length).toBeGreaterThan(0);expect(coins.every(c=>c.x>=0&&c.x<=800)).toBe(true);
  });
  it('pulls coins smoothly toward the player inside magnet range',()=>{
    const coin={id:1,x:100,y:100,vx:0,vy:0,value:1,phase:0};const attracted=pullCoin(coin,200,100,.1,160,300);
    expect(attracted.x).toBeGreaterThan(coin.x);expect(attracted.x-coin.x).toBeLessThan(100);
    expect(pullCoin(coin,300,100,.1,100,300)).toEqual(coin);
  });
  it('applies the multiplier exactly once to distance and coin bonuses',()=>{
    expect(scoreDistance(5,false)).toBe(5);expect(scoreDistance(5,true)).toBe(10);
    expect(scoreCoin(1,false)).toBe(12);expect(scoreCoin(1,true)).toBe(24);
  });
  it('freezes only the world and consumes shield before life loss',()=>{
    expect(worldScrollSpeed(400,2)).toBe(0);expect(worldScrollSpeed(400,0)).toBe(400);
    const frozenPlayer:Player={x:100,vx:0,invulnerable:0};stepPlayer(frozenPlayer,{left:false,right:true},.1,800);expect(frozenPlayer.x).toBeGreaterThan(100);
    const shield=powerUpCollision(3,0,4);expect(shield).toMatchObject({lives:3,shieldRemaining:0,absorbed:true});
    const unshielded=powerUpCollision(3,0,0);expect(unshielded).toMatchObject({lives:2,absorbed:false,hit:true});
  });
  it('makes grip reverse faster while retaining horizontal inertia',()=>{
    const normal:Player={x:400,vx:300,invulnerable:0},grip:Player={...normal};
    stepPlayer(normal,{left:true,right:false},.1,800);stepPlayer(grip,{left:true,right:false},.1,800,1.6);
    expect(Math.abs(grip.vx)).toBeLessThan(Math.abs(normal.vx));expect(grip.vx).toBeGreaterThanOrEqual(0);
  });
  it('places power-ups in open, non-overlapping lanes near the player line',()=>{
    const obstacles=[{id:1,x:360,y:-300,w:80,h:40,kind:'block' as const,phase:0,amplitude:0,period:1,angle:0}];
    const spot=findPowerUpSpot(2,800,-300,obstacles,400,[{x:400,y:-450}]);
    expect(spot).not.toBeNull();expect(Math.hypot(spot!.x-400,spot!.y+450)).toBeGreaterThanOrEqual(55);
    expect(obstacles.some(o=>collidesObstacle(spot!.x,spot!.y,11,o))).toBe(false);
  });
});
