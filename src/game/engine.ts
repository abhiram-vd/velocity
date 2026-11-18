import { COLORS, DIFFICULTY, PHYSICS, WORLD } from './config';
import { collidesObstacle } from './collision';
import { cosmeticColor } from './cosmetics';
import { generateCoinPattern, pullCoin } from './coins';
import { generateSection, movingOffset } from './generator';
import { findPowerUpSpot, makePowerUp, choosePowerUp, powerUpInterval, powerUpShouldSpawn, POWERUPS, worldScrollSpeed, powerUpCollision } from './powerups';
import { STARTING_LIVES } from './lives';
import { stepPlayer, type Player } from './physics';
import { difficultyStage, scrollSpeed, sectionSpacing } from './progression';
import { bankRun, freshActivePowerUps, type SaveData } from './save';
import { scoreCoin, scoreDistance } from './scoring';
import { playSound } from './sound';
import { gripBrake, magnetRadius, magnetStrength, powerUpDuration } from './upgrades';
import type { ActivePowerUps, Coin, GameStatus, InputState, Obstacle, PowerUpId, PowerUpPickup } from './types';

type Particle = { x:number;y:number;vx:number;vy:number;life:number;maxLife:number;color:string;square?:boolean };
export type Snapshot = { status:GameStatus;score:number;distance:number;speed:number;lives:number;runCoins:number;balance:number;bestScore:number;bestDistance:number;newBest:boolean;active:ActivePowerUps };

function drawObstacle(c:CanvasRenderingContext2D,o:Obstacle){
  const palette:Record<Obstacle['kind'],string>={block:COLORS.orange,vertical:COLORS.cream,moving:COLORS.cyan,orb:COLORS.red,rotor:COLORS.yellow,diamond:COLORS.purple};
  const color=palette[o.kind];c.save();c.fillStyle=color;c.strokeStyle=color;c.shadowBlur=10;c.shadowColor=color;
  if(o.kind==='orb'){c.beginPath();c.arc(o.x+o.w/2,o.y+o.h/2,Math.min(o.w,o.h)*.48,0,Math.PI*2);c.fill();c.shadowBlur=0;c.fillStyle='#ffe0ba';c.fillRect(o.x+o.w*.34,o.y+o.h*.28,Math.max(2,o.w*.13),Math.max(2,o.h*.13));}
  else if(o.kind==='diamond'){c.beginPath();c.moveTo(o.x+o.w/2,o.y);c.lineTo(o.x+o.w,o.y+o.h/2);c.lineTo(o.x+o.w/2,o.y+o.h);c.lineTo(o.x,o.y+o.h/2);c.closePath();c.fill();c.shadowBlur=0;c.strokeStyle='rgba(255,255,255,.62)';c.stroke();}
  else if(o.kind==='rotor'){c.translate(o.x+o.w/2,o.y+o.h/2);c.rotate(o.angle);c.fillRect(-o.w/2,-o.h/2,o.w,o.h);c.shadowBlur=0;c.strokeStyle='rgba(255,255,255,.58)';c.lineWidth=2;c.strokeRect(-o.w/2+3,-o.h/2+3,o.w-6,o.h-6);}
  else{c.fillRect(o.x,o.y,o.w,o.h);c.shadowBlur=0;c.fillStyle='rgba(255,255,255,.5)';c.fillRect(o.x+3,o.y+3,Math.max(0,o.w-6),2);c.fillStyle='rgba(0,0,0,.24)';c.fillRect(o.x+3,o.y+o.h-4,Math.max(0,o.w-6),2);}
  c.restore();
}
function drawPowerUp(c:CanvasRenderingContext2D,p:PowerUpPickup,t:number){
  const style=POWERUPS[p.type],pulse=1+Math.sin(t*5+p.phase)*.12;c.save();c.translate(p.x,p.y);c.rotate(t*1.2+p.phase);c.scale(pulse,pulse);c.strokeStyle=style.color;c.fillStyle=style.color;c.lineWidth=2;c.shadowBlur=14;c.shadowColor=style.color;
  if(p.type==='shield'||p.type==='freeze'){c.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/6,r=11;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.stroke();if(p.type==='freeze'){c.beginPath();c.moveTo(-5,0);c.lineTo(5,0);c.moveTo(0,-5);c.lineTo(0,5);c.stroke();}}
  else if(p.type==='magnet'){c.beginPath();c.arc(0,-1,8,0,Math.PI);c.lineTo(-8,5);c.moveTo(8,0);c.lineTo(8,5);c.stroke();}
  else if(p.type==='multiplier'){c.beginPath();c.moveTo(-8,-8);c.lineTo(8,8);c.moveTo(8,-8);c.lineTo(-8,8);c.stroke();c.beginPath();c.arc(-7,-7,2,0,Math.PI*2);c.arc(7,7,2,0,Math.PI*2);c.fill();}
  else{c.strokeRect(-8,-6,16,12);c.beginPath();c.moveTo(-4,-9);c.lineTo(4,-9);c.moveTo(-4,9);c.lineTo(4,9);c.stroke();}
  c.restore();
}

export class GameEngine{
  canvas:HTMLCanvasElement;ctx:CanvasRenderingContext2D;cssWidth=0;player:Player={x:400,vx:0,invulnerable:0};
  obstacles:Obstacle[]=[];powerUps:PowerUpPickup[]=[];coins:Coin[]=[];particles:Particle[]=[];input:InputState={left:false,right:false};active:ActivePowerUps=freshActivePowerUps();
  status:GameStatus='menu';score=0;distance=0;speed:number=DIFFICULTY.startSpeed;lives=STARTING_LIVES;runCoins=0;elapsed=0;nextY=0;section=0;recentPatterns:number[]=[];recentPowerUps:PowerUpId[]=[];powerSequence=0;nextPowerDistance=400;runBanked=false;newBest=false;last=0;accumulator=0;raf=0;damageFlash=0;trailAt=0;listeners=new Set<(s:Snapshot)=>void>();save:SaveData;onSave:(save:SaveData)=>void;
  constructor(canvas:HTMLCanvasElement,save:SaveData,onSave:(save:SaveData)=>void){this.canvas=canvas;this.ctx=canvas.getContext('2d')!;this.save=save;this.onSave=onSave;this.resize();window.addEventListener('resize',this.resize);this.raf=requestAnimationFrame(this.frame);}
  destroy(){cancelAnimationFrame(this.raf);window.removeEventListener('resize',this.resize);}
  setSave(save:SaveData){this.save=save;this.emit();}
  subscribe(fn:(s:Snapshot)=>void){this.listeners.add(fn);fn(this.snapshot());return()=>this.listeners.delete(fn);}
  snapshot():Snapshot{return{status:this.status,score:Math.floor(this.score),distance:Math.floor(this.distance),speed:this.speed,lives:this.lives,runCoins:this.runCoins,balance:this.save.coins,bestScore:this.save.bestScore,bestDistance:this.save.bestDistance,newBest:this.newBest,active:{...this.active}};}
  emit(){const state=this.snapshot();this.listeners.forEach(fn=>fn(state));}
  start(){
    this.player={x:this.canvas.clientWidth/2,vx:0,invulnerable:0};this.obstacles=[];this.powerUps=[];this.coins=[];this.particles=[];this.active=freshActivePowerUps();
    this.score=0;this.distance=0;this.speed=DIFFICULTY.startSpeed;this.lives=STARTING_LIVES;this.runCoins=0;this.elapsed=0;this.damageFlash=0;this.section=0;this.recentPatterns=[];this.recentPowerUps=[];this.powerSequence=0;this.nextPowerDistance=420;this.runBanked=false;this.newBest=false;
    this.obstacles.push(...this.makeSection());this.nextY=-sectionSpacing(0);this.status='playing';this.last=0;this.accumulator=0;this.emit();
  }
  showHome(){if((this.status==='playing'||this.status==='paused')&&!this.runBanked)this.bankRun();this.status='menu';this.input={left:false,right:false};this.active=freshActivePowerUps();this.obstacles=[];this.powerUps=[];this.coins=[];this.particles=[];this.player={x:this.canvas.clientWidth/2,vx:0,invulnerable:0};this.emit();}
  togglePause(){if(this.status==='playing')this.status='paused';else if(this.status==='paused')this.status='playing';this.emit();}
  private resize=()=>{const dpr=Math.min(devicePixelRatio||1,2),r=this.canvas.getBoundingClientRect(),ratio=this.cssWidth?r.width/this.cssWidth:1;this.canvas.width=Math.max(1,Math.floor(r.width*dpr));this.canvas.height=Math.max(1,Math.floor(r.height*dpr));this.ctx.setTransform(dpr,0,0,dpr,0,0);this.cssWidth=r.width;if(ratio!==1){this.obstacles.forEach(o=>{o.x*=ratio;o.w*=ratio;if(o.baseX!==undefined)o.baseX*=ratio;o.amplitude*=ratio;});this.coins.forEach(o=>{o.x*=ratio;o.vx*=ratio;});this.powerUps.forEach(o=>o.x*=ratio);}this.player.x=Math.min(r.width-PHYSICS.radius,Math.max(PHYSICS.radius,this.player.x*ratio));};
  private get playerY(){return this.canvas.clientHeight*.73;}
  private makeSection(){
    const id=this.section++,tier=difficultyStage(this.distance),pattern=generateSection(-100,tier,id,this.canvas.clientWidth,{playerX:this.player.x,playerVx:this.player.vx,playerY:this.playerY,speed:Math.max(this.speed,1),elapsed:this.elapsed,recentPatternIds:this.recentPatterns});
    const patternId=pattern[0]?.patternId??0;this.recentPatterns.push(patternId);this.recentPatterns=this.recentPatterns.slice(-2);if(id%2===0)this.coins.push(...generateCoinPattern(id,this.canvas.clientWidth,-210,pattern));return pattern;
  }
  private frame=(now:number)=>{this.raf=requestAnimationFrame(this.frame);const dt=Math.min(.05,this.last?(now-this.last)/1000:0);this.last=now;if(this.status==='playing'){this.accumulator+=dt;while(this.accumulator>=WORLD.fixedStep){this.update(WORLD.fixedStep);this.accumulator-=WORLD.fixedStep;}}this.render(now/1000);};
  private update(dt:number){
    this.elapsed+=dt;const freezeWasActive=this.active.freeze>0;this.tickActive(dt);this.speed=scrollSpeed(this.distance);const stage=difficultyStage(this.distance),scroll=worldScrollSpeed(this.speed,this.active.freeze);
    const multiplier=this.active.multiplier>0;const distanceDelta=scroll*dt/10;this.distance+=distanceDelta;this.score+=scoreDistance(distanceDelta,multiplier);
    const gripLevel=this.save.upgrades.grip,brake=this.active.grip>0?gripBrake(gripLevel):1;stepPlayer(this.player,this.input,dt,this.canvas.clientWidth,brake);
    if(scroll>0){this.obstacles.forEach(o=>{o.y+=scroll*dt;if(o.kind==='moving')o.x=(o.baseX??o.x)+movingOffset(o,this.elapsed);if(o.kind==='rotor'&&!freezeWasActive)o.angle=(o.angle+(o.angularVelocity??1)*dt)%(Math.PI*2);});}
    this.updateCoins(dt,scroll);
    this.updatePickups(dt,scroll);
    this.checkCollision();
    this.spawnPowerUpIfDue(stage);
    if(this.nextY>=0){this.obstacles.push(...this.makeSection());this.nextY=-sectionSpacing(stage);}if(scroll>0)this.nextY+=scroll*dt;
    this.obstacles=this.obstacles.filter(o=>o.y<this.canvas.clientHeight+110);this.coins=this.coins.filter(c=>c.y<this.canvas.clientHeight+40);this.powerUps=this.powerUps.filter(p=>p.y<this.canvas.clientHeight+40);
    this.updateParticles(dt);this.emitOnTick(dt);
    if(freezeWasActive&&this.active.freeze<=0)this.burst(this.player.x,this.playerY,'#8bc8ff',14);
  }
  private tickActive(dt:number){for(const id of Object.keys(this.active) as PowerUpId[]){if(this.active[id]<=0)continue;this.active[id]=Math.max(0,this.active[id]-dt);if(this.active[id]===0)this.burst(this.player.x,this.playerY,POWERUPS[id].color,10);}}
  private updateCoins(dt:number,scroll:number){
    const magnet=this.active.magnet>0,level=this.save.upgrades.magnet,radius=magnetRadius(level),strength=magnetStrength(level),kept:Coin[]=[];
    for(const coin of this.coins){coin.y+=scroll*dt;const drag=Math.pow(magnet?.4:.08,dt);coin.vx*=drag;coin.vy*=drag;if(magnet){const moved=pullCoin(coin,this.player.x,this.playerY,dt,radius,strength);coin.x=moved.x;coin.y=moved.y;coin.vx=moved.vx;coin.vy=moved.vy;}else{coin.x+=coin.vx*dt;coin.y+=coin.vy*dt;}
      if(Math.hypot(coin.x-this.player.x,coin.y-this.playerY)<PHYSICS.radius+8){this.runCoins+=coin.value;this.score+=scoreCoin(coin.value,this.active.multiplier>0);this.burst(coin.x,coin.y,'#ffd467',5);playSound('coin',this.save.settings.sound);}else kept.push(coin);
    }this.coins=kept;
  }
  private updatePickups(dt:number,scroll:number){
    for(const pickup of this.powerUps){pickup.y+=scroll*dt;if(Math.hypot(pickup.x-this.player.x,pickup.y-this.playerY)<PHYSICS.radius+13){this.activate(pickup.type);pickup.y=this.canvas.clientHeight+100;}}
  }
  private activate(id:PowerUpId){this.active[id]=powerUpDuration(id,this.save.upgrades[id]);this.burst(this.player.x,this.playerY,POWERUPS[id].color,12);playSound('power',this.save.settings.sound);}
  private spawnPowerUpIfDue(stage:number){
    if(this.distance<this.nextPowerDistance)return;
    const seed=this.powerSequence++,chance=powerUpShouldSpawn(stage,seed),interval=powerUpInterval(stage);
    if(chance){const type=choosePowerUp(stage,seed,this.recentPowerUps,this.save.upgrades.shield),spot=findPowerUpSpot(seed,this.canvas.clientWidth,-270,this.obstacles,this.player.x,[...this.coins,...this.powerUps]);if(spot){this.powerUps.push(makePowerUp(seed,type,spot));this.recentPowerUps.push(type);this.recentPowerUps=this.recentPowerUps.slice(-2);}}
    this.nextPowerDistance=this.distance+interval*(.88+(seed%5)*.055);
  }
  private checkCollision(){
    if(this.player.invulnerable>0)return;const hit=this.obstacles.find(o=>collidesObstacle(this.player.x,this.playerY,PHYSICS.radius,o));if(!hit)return;
    const result=powerUpCollision(this.lives,this.player.invulnerable,this.active.shield);this.active.shield=result.shieldRemaining;this.player.invulnerable=result.invulnerable;
    if(result.absorbed){this.burst(this.player.x,this.playerY,POWERUPS.shield.color,22);this.damageFlash=.1;playSound('power',this.save.settings.sound);return;}
    if(result.hit){this.lives=result.lives;this.damageFlash=.32;this.burst(this.player.x,this.playerY,COLORS.red,20);playSound('hit',this.save.settings.sound);if(this.lives<=0){this.status='over';this.bankRun();}}
  }
  private bankRun(){const result=bankRun(this.save,{coins:this.runCoins,score:this.score,distance:this.distance},this.runBanked);if(!result.banked)return;this.save=result.save;this.newBest=result.newBest;this.runBanked=true;this.onSave(this.save);}
  private updateParticles(dt:number){
    this.particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.15,dt);p.vy*=Math.pow(.15,dt);p.life-=dt;});this.particles=this.particles.filter(p=>p.life>0);this.damageFlash=Math.max(0,this.damageFlash-dt);
    if(this.status==='playing'&&(this.active.grip>0||this.save.equipped.trail!=='trail-none')&&Math.abs(this.player.vx)>45&&this.elapsed-this.trailAt>.055){this.trailAt=this.elapsed;const col=this.active.grip>0?'#a7e77c':cosmeticColor(this.save.equipped.trail,COLORS.cyan);this.particles.push({x:this.player.x,y:this.playerY,vx:-this.player.vx*.12,vy:70,life:.28,maxLife:.28,color:col,square:this.save.equipped.trail==='trail-pixel'});}
  }
  private emitOnTick(dt:number){if(Math.floor(this.elapsed*10)!==Math.floor((this.elapsed-dt)*10))this.emit();}
  private burst(x:number,y:number,color:string,count:number){for(let i=0;i<count;i++){const a=Math.PI*2*i/count,v=50+(i%4)*23;this.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.28+(i%3)*.08,maxLife:.44,color,square:i%2===0});}}
  private render(t:number){
    const c=this.ctx,w=this.canvas.clientWidth,h=this.canvas.clientHeight,theme=this.save.equipped.theme,bg=theme==='theme-ember'?'#100b12':theme==='theme-oxide'?'#08120e':COLORS.background,grid=theme==='theme-ember'?'rgba(220,130,115,.075)':theme==='theme-oxide'?'rgba(105,205,148,.07)':'rgba(95,165,185,.075)';
    c.clearRect(0,0,w,h);c.fillStyle=bg;c.fillRect(0,0,w,h);
    const ambient=this.status==='menu'?t*4:0,drift=(this.distance*4+ambient)%62;c.strokeStyle=grid;c.lineWidth=1;c.beginPath();for(let x=0;x<w;x+=62){c.moveTo(x,0);c.lineTo(x,h);}for(let y=-62+drift;y<h;y+=62){c.moveTo(0,y);c.lineTo(w,y);}c.stroke();
    for(let i=0;i<36;i++){const x=(i*173+47)%Math.max(w,1),y=(i*211+this.distance*(this.status==='menu'?.2:.55)+ambient)%Math.max(h,1);c.fillStyle='rgba(237,225,194,.22)';c.fillRect(Math.floor(x/3)*3,Math.floor(y/3)*3,2,2);}
    c.save();if(this.save.settings.screenShake&&this.damageFlash>0)c.translate((Math.random()-.5)*12*this.damageFlash/.32,(Math.random()-.5)*8*this.damageFlash/.32);
    if(this.active.freeze>0){c.fillStyle='rgba(120,190,255,.08)';c.fillRect(0,0,w,h);c.strokeStyle='rgba(165,220,255,.16)';c.lineWidth=2;c.strokeRect(7,7,w-14,h-14);}
    this.obstacles.forEach(o=>drawObstacle(c,o));
    this.coins.forEach(coin=>{c.save();c.translate(coin.x,coin.y);const pulse=1+Math.sin(t*7+coin.phase)*.12;c.scale(pulse,pulse);c.fillStyle='#f8c64e';c.strokeStyle='#ffe595';c.lineWidth=2;c.shadowBlur=11;c.shadowColor='#f4ac35';c.beginPath();c.arc(0,0,7,0,Math.PI*2);c.fill();c.shadowBlur=0;c.stroke();c.fillStyle='#b7792c';c.fillRect(-1, -3,2,6);c.restore();});
    this.powerUps.forEach(p=>drawPowerUp(c,p,t));
    if(this.active.magnet>0){const radius=magnetRadius(this.save.upgrades.magnet);c.strokeStyle='rgba(237,121,206,.22)';c.lineWidth=1.5;c.beginPath();c.arc(this.player.x,this.playerY,radius+Math.sin(t*5)*4,0,Math.PI*2);c.stroke();for(const coin of this.coins){if(Math.hypot(coin.x-this.player.x,coin.y-this.playerY)<radius){c.strokeStyle='rgba(237,121,206,.16)';c.beginPath();c.moveTo(this.player.x,this.playerY);c.lineTo(coin.x,coin.y);c.stroke();}}}
    this.particles.forEach(p=>{c.globalAlpha=Math.max(0,p.life/p.maxLife);c.fillStyle=p.color;if(p.square)c.fillRect(p.x-2,p.y-2,4,4);else{c.beginPath();c.arc(p.x,p.y,2.5*p.life/p.maxLife,0,Math.PI*2);c.fill();}});c.globalAlpha=1;
    const themeBall=cosmeticColor(this.save.equipped.ball,COLORS.cyan),ballColor=this.active.multiplier>0?'#ffd467':this.active.shield>0?POWERUPS.shield.color:themeBall;c.save();c.translate(this.player.x,this.playerY);c.shadowBlur=25;c.shadowColor=this.damageFlash?COLORS.red:ballColor;c.fillStyle=this.player.invulnerable>0&&Math.floor(t*15)%2?'#ffbdc5':'#f1fff9';c.beginPath();c.arc(0,0,PHYSICS.radius,0,Math.PI*2);c.fill();c.shadowBlur=0;c.strokeStyle=this.damageFlash?'rgba(255,91,119,.95)':ballColor;c.lineWidth=2;c.beginPath();c.arc(0,0,19+Math.sin(t*5)*2,0,Math.PI*2);c.stroke();if(this.active.freeze>0){c.strokeStyle='rgba(190,230,255,.75)';c.beginPath();c.arc(0,0,25,0,Math.PI*2);c.stroke();}c.restore();c.restore();
    if(this.status==='paused'||this.status==='over'){c.fillStyle='rgba(3,7,15,.48)';c.fillRect(0,0,w,h);}
  }
}
