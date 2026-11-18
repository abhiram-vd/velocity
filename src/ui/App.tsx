import { useEffect, useRef, useState } from 'react';
import { GameEngine, type Snapshot } from '../game/engine';
import { COSMETICS, type CosmeticSlot } from '../game/cosmetics';
import { POWERUPS } from '../game/powerups';
import { buyCosmetic, equipCosmetic } from '../game/shop';
import { loadSave, persistSave, type SaveData } from '../game/save';
import { buyUpgrade, POWERUP_IDS, UPGRADE_DESCRIPTIONS, UPGRADE_NAMES, upgradeCost } from '../game/upgrades';
import type { PowerUpId } from '../game/types';
import { playSound } from '../game/sound';

type Page='home'|'game'|'gameover'|'shop'|'upgrades'|'settings';
const blankSnapshot=(save:SaveData):Snapshot=>({status:'menu',score:0,distance:0,speed:260,lives:3,runCoins:0,balance:save.coins,bestScore:save.bestScore,bestDistance:save.bestDistance,newBest:false,active:{shield:0,magnet:0,multiplier:0,freeze:0,grip:0}});
export default function App(){
  const canvasRef=useRef<HTMLCanvasElement>(null),engineRef=useRef<GameEngine|null>(null);const [save,setSave]=useState(()=>loadSave()),[page,setPage]=useState<Page>('home'),[game,setGame]=useState(()=>blankSnapshot(loadSave()));
  const commitSave=(next:SaveData)=>{persistSave(next);setSave(next);};
  useEffect(()=>{
    if(!canvasRef.current)return;const engine=new GameEngine(canvasRef.current,save,commitSave);engineRef.current=engine;
    const unsub=engine.subscribe(snapshot=>{setGame(snapshot);if(snapshot.status==='over')setPage('gameover');});
    const key=(e:KeyboardEvent)=>{const k=e.key.toLowerCase();if(['arrowleft','arrowright',' ','escape','a','d'].includes(k))e.preventDefault();if(k==='arrowleft'||k==='a')engine.input.left=e.type==='keydown';if(k==='arrowright'||k==='d')engine.input.right=e.type==='keydown';if(e.type==='keydown'&&!e.repeat&&(k===' '||k==='escape'))engine.togglePause();};
    const down=(e:KeyboardEvent)=>key(e),up=(e:KeyboardEvent)=>key(e),blur=()=>{engine.input.left=false;engine.input.right=false;};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
    return()=>{unsub();engine.destroy();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};
  },[]);
  useEffect(()=>{engineRef.current?.setSave(save);},[save]);
  const goHome=()=>{engineRef.current?.showHome();setPage('home');};
  const play=()=>{engineRef.current?.start();setPage('game');playSound('power',save.settings.sound);};
  const saveAction=(next:SaveData)=>{commitSave(next);engineRef.current?.setSave(next);};
  const purchaseUpgrade=(id:PowerUpId)=>{const result=buyUpgrade(save,id);if(result.ok){saveAction(result.save);playSound('buy',save.settings.sound);}};
  const purchaseCosmetic=(id:string)=>{const result=buyCosmetic(save,id);if(result.ok){saveAction(result.save);playSound('buy',save.settings.sound);}};
  const equip=(id:string)=>{const result=equipCosmetic(save,id);if(result.ok)saveAction(result.save);};
  const toggleSetting=(key:'sound'|'screenShake')=>saveAction({...save,settings:{...save.settings,[key]:!save.settings[key]}});
  const powerActive=(id:PowerUpId)=>game.active[id]>0;
  const labelPage=page==='shop'?'SHOP':page==='upgrades'?'UPGRADES':'SETTINGS';
  return <main className={`arcade theme-${save.equipped.theme}`}>
    <canvas ref={canvasRef} className="game-canvas" aria-label="VELOCITY arcade game" />
    {page==='home'&&<section className="home-screen">
      <header className="menu-top"><div className="account-chip"><span className="coin-mark">●</span>{save.coins}</div><div className="record-chip">BEST <b>{save.bestScore.toLocaleString()}</b></div></header>
      <div className="home-core"><div className="logo-mark">V<span>·</span></div><h1>VELOCITY</h1><button className="play-button" onClick={play}>PLAY <span>▶</span></button><div className="home-record">DISTANCE RECORD <b>{save.bestDistance.toLocaleString()}m</b></div></div>
      <nav className="home-nav"><button onClick={()=>setPage('shop')}>SHOP</button><button onClick={()=>setPage('upgrades')}>UPGRADES</button><button onClick={()=>setPage('settings')}>SETTINGS</button></nav>
    </section>}
    {page==='game'&&<>
      <div className="game-hud">
        <div className="hud-score"><span>SCORE</span><strong>{game.score.toLocaleString()}</strong><small>{game.distance.toLocaleString()}m</small></div>
        <div className="hud-speed">{(game.speed/260).toFixed(1)}<small>×</small></div>
        <div className="hud-account"><span className="coin-mark">●</span>{game.runCoins}<div className="life-row" aria-label={`${game.lives} lives remaining`}>{[0,1,2].map(i=><i key={i} className={i<game.lives?'life-dot full':'life-dot'}/>)}</div><button className="pause-control" aria-label="Pause" onClick={()=>engineRef.current?.togglePause()}>Ⅱ</button></div>
        <div className="active-powerups">{POWERUP_IDS.filter(powerActive).map(id=><span key={id} style={{'--power-color':POWERUPS[id].color} as React.CSSProperties}><b>{POWERUPS[id].glyph}</b>{POWERUPS[id].label}<i>{game.active[id].toFixed(1)}s</i></span>)}</div>
      </div>
      {game.status==='paused'&&<div className="screen-shade"><div className="pause-menu"><span>PAUSED</span><button className="play-button" onClick={()=>engineRef.current?.togglePause()}>RESUME</button><button className="quiet-button" onClick={goHome}>HOME</button></div></div>}
      {game.status==='playing'&&<div className="touch-controls"><button aria-label="Steer left" onPointerDown={()=>engineRef.current&&(engineRef.current.input.left=true)} onPointerUp={()=>engineRef.current&&(engineRef.current.input.left=false)} onPointerCancel={()=>engineRef.current&&(engineRef.current.input.left=false)} onPointerLeave={()=>engineRef.current&&(engineRef.current.input.left=false)}>‹</button><button aria-label="Steer right" onPointerDown={()=>engineRef.current&&(engineRef.current.input.right=true)} onPointerUp={()=>engineRef.current&&(engineRef.current.input.right=false)} onPointerCancel={()=>engineRef.current&&(engineRef.current.input.right=false)} onPointerLeave={()=>engineRef.current&&(engineRef.current.input.right=false)}>›</button></div>}
    </>}
    {page==='gameover'&&<div className="screen-shade"><section className="result-screen"><span className="screen-kicker">RUN COMPLETE</span><h2>{game.newBest?'NEW RECORD':'GAME OVER'}</h2><div className="final-score">{game.score.toLocaleString()}<small> SCORE</small></div><div className="result-stats"><span>DISTANCE <b>{game.distance.toLocaleString()}m</b></span><span>COINS <b className="coin-text">+{game.runCoins}</b></span><span>BEST <b>{game.bestScore.toLocaleString()}</b></span></div><div className="result-actions"><button className="play-button" onClick={play}>RETRY <span>↻</span></button><button className="quiet-button" onClick={goHome}>HOME</button></div></section></div>}
    {(page==='shop'||page==='upgrades'||page==='settings')&&<div className="screen-shade menu-shade"><section className="subscreen"><header className="subscreen-head"><button className="back-button" onClick={()=>setPage('home')}>←</button><h2>{labelPage}</h2><div className="balance"><span className="coin-mark">●</span>{save.coins}</div></header>
      {page==='shop'&&<div className="shop-grid">{COSMETICS.filter(item=>item.price>0).map(item=>{const owned=save.ownedCosmetics.includes(item.id),equipped=save.equipped[item.slot as CosmeticSlot];const isEquipped=equipped===item.id;return <article className="shop-item" key={item.id}><div className="swatch" style={{'--swatch':item.color} as React.CSSProperties}><span>{item.slot==='ball'?'●':item.slot==='trail'?'✦':'▦'}</span></div><div className="item-info"><b>{item.name}</b><small>{item.description}</small></div><button className={`item-action ${!owned?'locked':''}`} disabled={isEquipped||(!owned&&save.coins<item.price)} onClick={()=>owned?equip(item.id):purchaseCosmetic(item.id)}>{isEquipped?'EQUIPPED':owned?'EQUIP':save.coins<item.price?`LOCKED · ${item.price}`:<><span className="coin-mark">●</span>{item.price} · BUY</>}</button></article>;})}</div>}
      {page==='upgrades'&&<div className="upgrade-grid">{POWERUP_IDS.map(id=>{const level=save.upgrades[id],max=level>=5,cost=upgradeCost(level);return <article className="upgrade-item" key={id} style={{'--power-color':POWERUPS[id].color} as React.CSSProperties}><div className="upgrade-title"><span>{POWERUPS[id].glyph}</span><b>{UPGRADE_NAMES[id]}</b><small>LV {level}/5</small></div><p>{UPGRADE_DESCRIPTIONS[id]}</p><div className="level-track">{[0,1,2,3,4].map(n=><i key={n} className={n<level?'filled':''}/>)}</div><button className="item-action" disabled={max||save.coins<cost} onClick={()=>purchaseUpgrade(id)}>{max?'MAX LEVEL':<><span className="coin-mark">●</span>{cost} · UPGRADE</>}</button></article>;})}</div>}
      {page==='settings'&&<div className="settings-list"><button onClick={()=>toggleSetting('sound')}><span><b>SOUND</b><small>Arcade effects</small></span><strong>{save.settings.sound?'ON':'OFF'}</strong></button><button onClick={()=>toggleSetting('screenShake')}><span><b>SCREEN SHAKE</b><small>Impact feedback</small></span><strong>{save.settings.screenShake?'ON':'OFF'}</strong></button><p>CONTROLS <span>← / A&nbsp;&nbsp; → / D&nbsp;&nbsp; SPACE / ESC</span></p></div>}
    </section></div>}
  </main>;
}
