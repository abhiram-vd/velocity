import { useEffect, useRef, useState } from 'react';
import { GameEngine, type Snapshot } from '../game/engine';

const initial: Snapshot = { status: 'playing', distance: 0, speed: 270, lives: 3, slow: 0, best: Number(localStorage.getItem('velocity-best') || 0) };
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null), engineRef = useRef<GameEngine | null>(null); const [game, setGame] = useState(initial);
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new GameEngine(canvasRef.current); engineRef.current = engine; engine.start(); const unsub = engine.subscribe(setGame);
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowleft','arrowright',' ','escape'].includes(key)) e.preventDefault();
      if (key === 'arrowleft' || key === 'a') engine.input.left = e.type === 'keydown';
      if (key === 'arrowright' || key === 'd') engine.input.right = e.type === 'keydown';
      if (e.type === 'keydown' && !e.repeat && (key === ' ' || key === 'escape')) engine.togglePause();
    };
    const down = (e: KeyboardEvent) => handleKey(e), up = (e: KeyboardEvent) => handleKey(e), blur = () => { engine.input.left = false; engine.input.right = false; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    return () => { unsub(); engine.destroy(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);
  const control = (side: 'left'|'right', value: boolean) => { if (engineRef.current) engineRef.current.input[side] = value; };
  return <main className="game-screen">
    <canvas className="game-canvas" ref={canvasRef} aria-label="VELOCITY arcade game" />
    <div className="hud" aria-live="off">
      <div className="hud-distance"><strong>{Math.floor(game.distance).toLocaleString()}</strong><span>m</span></div>
      <div className="hud-center"><span className="run-dot"/><span>{(game.speed / 270).toFixed(1)}×</span></div>
      <div className="hud-right"><div className="life-row" aria-label={`${game.lives} lives remaining`}>{[0,1,2].map(i => <i key={i} className={i < game.lives ? 'life-dot full' : 'life-dot'} />)}</div><button className="pause-control" onClick={() => engineRef.current?.togglePause()} aria-label={game.status === 'paused' ? 'Resume' : 'Pause'}>{game.status === 'paused' ? '▶' : 'Ⅱ'}</button></div>
    </div>
    {game.slow > 0 && <div className="power-timer">SLOW <span>{game.slow.toFixed(1)}s</span></div>}
    {game.status === 'paused' && <div className="state-overlay"><span>PAUSED</span><button onClick={() => engineRef.current?.togglePause()}>RESUME</button></div>}
    {game.status === 'over' && <div className="state-overlay game-over"><span>RUN OVER</span><strong>{Math.floor(game.distance).toLocaleString()}<small>m</small></strong><p>BEST {game.best.toLocaleString()}m</p><button onClick={() => engineRef.current?.start()}>RETRY</button></div>}
    {game.status !== 'over' && <div className="touch-controls"><button aria-label="Steer left" onPointerDown={() => control('left',true)} onPointerUp={() => control('left',false)} onPointerCancel={() => control('left',false)} onPointerLeave={() => control('left',false)}>‹</button><button aria-label="Steer right" onPointerDown={() => control('right',true)} onPointerUp={() => control('right',false)} onPointerCancel={() => control('right',false)} onPointerLeave={() => control('right',false)}>›</button></div>}
  </main>;
}
