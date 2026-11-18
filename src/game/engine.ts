import { COLORS, PHYSICS, WORLD } from './config';
import { collidesObstacle } from './collision';
import { createPickup, generateSection, movingOffset } from './generator';
import { STARTING_LIVES, takeHit } from './lives';
import { stepPlayer, type Player } from './physics';
import { difficultyStage, scrollSpeed, sectionSpacing } from './progression';
import type { GameStatus, InputState, Obstacle, Pickup } from './types';

function drawObstacle(c: CanvasRenderingContext2D, o: Obstacle) {
  const palette: Record<Obstacle['kind'], string> = { block: COLORS.orange, vertical: COLORS.cream, moving: COLORS.cyan, orb: COLORS.red, rotor: COLORS.yellow, diamond: COLORS.purple };
  const color = palette[o.kind]; c.save(); c.fillStyle = color; c.strokeStyle = color; c.shadowBlur = 10; c.shadowColor = color;
  if (o.kind === 'orb') { c.beginPath(); c.arc(o.x + o.w / 2, o.y + o.h / 2, Math.min(o.w, o.h) * .48, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0; c.fillStyle = '#ffe0ba'; c.fillRect(o.x + o.w * .34, o.y + o.h * .28, Math.max(2, o.w * .13), Math.max(2, o.h * .13)); }
  else if (o.kind === 'diamond') { c.beginPath(); c.moveTo(o.x + o.w / 2, o.y); c.lineTo(o.x + o.w, o.y + o.h / 2); c.lineTo(o.x + o.w / 2, o.y + o.h); c.lineTo(o.x, o.y + o.h / 2); c.closePath(); c.fill(); c.shadowBlur = 0; c.strokeStyle = 'rgba(255,255,255,.62)'; c.stroke(); }
    else if (o.kind === 'rotor') { c.translate(o.x + o.w / 2, o.y + o.h / 2); c.rotate(o.angle); c.fillRect(-o.w / 2, -o.h / 2, o.w, o.h); c.shadowBlur = 0; c.strokeStyle = 'rgba(255,255,255,.58)'; c.lineWidth = 2; c.strokeRect(-o.w / 2 + 3, -o.h / 2 + 3, o.w - 6, o.h - 6); }
  else { c.fillRect(o.x, o.y, o.w, o.h); c.shadowBlur = 0; c.fillStyle = 'rgba(255,255,255,.50)'; c.fillRect(o.x + 3, o.y + 3, Math.max(0, o.w - 6), 2); c.fillStyle = 'rgba(0,0,0,.24)'; c.fillRect(o.x + 3, o.y + o.h - 4, Math.max(0, o.w - 6), 2); }
  c.restore();
}

type Particle = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string };
export type Snapshot = { status: GameStatus; distance: number; speed: number; lives: number; slow: number; best: number };
export class GameEngine {
  canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; cssWidth = 0; player: Player = { x: 400, vx: 0, invulnerable: 0 };
  obstacles: Obstacle[] = []; pickups: Pickup[] = []; particles: Particle[] = []; input: InputState = { left: false, right: false };
  status: GameStatus = 'menu'; distance = 0; speed = scrollSpeed(0); lives = STARTING_LIVES; slow = 0; elapsed = 0; nextY = 0; section = 0; recentPatterns: number[] = []; last = 0; accumulator = 0; raf = 0; damageFlash = 0; best = Number(localStorage.getItem('velocity-best') || 0); listeners = new Set<(s: Snapshot) => void>();
  constructor(canvas: HTMLCanvasElement) { this.canvas = canvas; this.ctx = canvas.getContext('2d')!; this.resize(); window.addEventListener('resize', this.resize); }
  destroy() { cancelAnimationFrame(this.raf); window.removeEventListener('resize', this.resize); }
  subscribe(fn: (s: Snapshot) => void) { this.listeners.add(fn); fn(this.snapshot()); return () => this.listeners.delete(fn); }
  snapshot(): Snapshot { return { status: this.status, distance: this.distance, speed: this.speed, lives: this.lives, slow: this.slow, best: this.best }; }
  emit() { const s = this.snapshot(); this.listeners.forEach(fn => fn(s)); }
  start() {
    this.player = { x: this.canvas.clientWidth / 2, vx: 0, invulnerable: 0 }; this.obstacles = []; this.pickups = []; this.particles = [];
    this.distance = 0; this.speed = scrollSpeed(0); this.lives = STARTING_LIVES; this.slow = 0; this.elapsed = 0; this.damageFlash = 0; this.section = 0; this.recentPatterns = [];
    this.obstacles.push(...this.makeSection()); this.nextY = -sectionSpacing(0);
    this.status = 'playing'; this.last = 0; this.accumulator = 0; this.emit(); if (!this.raf) this.raf = requestAnimationFrame(this.frame);
  }
  togglePause() { if (this.status === 'playing') this.status = 'paused'; else if (this.status === 'paused') this.status = 'playing'; this.emit(); }
  private resize = () => { const dpr = Math.min(devicePixelRatio || 1, 2), r = this.canvas.getBoundingClientRect(), ratio = this.cssWidth ? r.width / this.cssWidth : 1; this.canvas.width = Math.max(1, Math.floor(r.width * dpr)); this.canvas.height = Math.max(1, Math.floor(r.height * dpr)); this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.cssWidth = r.width; if (ratio !== 1) this.obstacles.forEach(o => { o.x *= ratio; o.w *= ratio; if (o.baseX !== undefined) o.baseX *= ratio; o.amplitude *= ratio; }); this.player.x = Math.min(r.width - PHYSICS.radius, Math.max(PHYSICS.radius, this.player.x * ratio)); };
  private get playerY() { return this.canvas.clientHeight * .73; }
  private makeSection() {
    const tier = difficultyStage(this.distance), pattern = generateSection(-120, tier, this.section, this.canvas.clientWidth, { playerX: this.player.x, playerVx: this.player.vx, playerY: this.playerY, speed: this.speed, elapsed: this.elapsed, recentPatternIds: this.recentPatterns });
    this.section++;
    const id = pattern[0]?.patternId ?? 0; this.recentPatterns.push(id); this.recentPatterns = this.recentPatterns.slice(-2);
    return pattern;
  }
  private frame = (now: number) => { this.raf = requestAnimationFrame(this.frame); const dt = Math.min(.05, this.last ? (now - this.last) / 1000 : 0); this.last = now; if (this.status === 'playing') { this.accumulator += dt; while (this.accumulator >= WORLD.fixedStep) { this.update(WORLD.fixedStep); this.accumulator -= WORLD.fixedStep; } } this.render(now / 1000); };
  private update(dt: number) {
    this.elapsed += dt; this.distance += this.speed * dt / 10; this.speed = scrollSpeed(this.distance); const stage = difficultyStage(this.distance);
    if (this.slow > 0) this.slow = Math.max(0, this.slow - dt);
    const scroll = this.speed * (this.slow > 0 ? .62 : 1); stepPlayer(this.player, this.input, dt, this.canvas.clientWidth);
    this.obstacles.forEach(o => { o.y += scroll * dt; if (o.kind === 'moving') o.x = (o.baseX ?? o.x) + movingOffset(o, this.elapsed); if (o.kind === 'rotor') o.angle = (o.angle + (o.angularVelocity ?? 1) * dt) % (Math.PI * 2); });
    this.pickups.forEach(p => { p.y += scroll * dt; if (!p.taken && Math.hypot(p.x - this.player.x, p.y - this.playerY) < PHYSICS.radius + 12) { p.taken = true; this.slow = 5; } });
    if (this.player.invulnerable <= 0) {
      const hit = this.obstacles.find(o => collidesObstacle(this.player.x, this.playerY, PHYSICS.radius, o));
      if (hit) this.damage();
    }
    if (this.nextY >= 0) { this.obstacles.push(...this.makeSection()); if (this.section % 4 === 0) this.pickups.push(createPickup(this.section, -350, this.canvas.clientWidth)); this.nextY = -sectionSpacing(stage); }
    this.nextY += scroll * dt; this.obstacles = this.obstacles.filter(o => o.y < this.canvas.clientHeight + 90); this.pickups = this.pickups.filter(p => p.y < this.canvas.clientHeight + 40 && !p.taken);
    this.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(.15, dt); p.vy *= Math.pow(.15, dt); p.life -= dt; }); this.particles = this.particles.filter(p => p.life > 0); this.damageFlash = Math.max(0, this.damageFlash - dt);
    if (Math.floor(this.elapsed * 10) !== Math.floor((this.elapsed - dt) * 10)) this.emit();
  }
  private damage() {
    const result = takeHit(this.lives, this.player.invulnerable); if (!result.hit) return;
    this.lives = result.lives; this.player.invulnerable = result.invulnerable; this.damageFlash = .32;
    for (let i = 0; i < 20; i++) { const a = Math.PI * 2 * i / 20, velocity = 90 + (i % 4) * 30; this.particles.push({ x: this.player.x, y: this.playerY, vx: Math.cos(a) * velocity, vy: Math.sin(a) * velocity, life: .38 + (i % 3) * .08, maxLife: .54, color: i % 2 ? '#ff6b86' : '#ffd07a' }); }
    if (this.lives <= 0) { this.status = 'over'; this.best = Math.max(this.best, Math.floor(this.distance)); localStorage.setItem('velocity-best', String(this.best)); }
    this.emit();
  }
  private render(t: number) {
    const c = this.ctx, w = this.canvas.clientWidth, h = this.canvas.clientHeight; c.clearRect(0, 0, w, h); c.fillStyle = '#040811'; c.fillRect(0, 0, w, h);
    c.save(); if (this.damageFlash > 0) c.translate((Math.random() - .5) * 12 * this.damageFlash / .32, (Math.random() - .5) * 8 * this.damageFlash / .32);
    const drift = (this.distance * 4) % 62; c.strokeStyle = 'rgba(67, 164, 190, .075)'; c.lineWidth = 1; c.beginPath(); for (let x = 0; x < w; x += 62) { c.moveTo(x, 0); c.lineTo(x, h); } for (let y = -62 + drift; y < h; y += 62) { c.moveTo(0, y); c.lineTo(w, y); } c.stroke();
    // Small streaks add a sense of speed without narrowing the playable field.
    c.strokeStyle = 'rgba(117, 219, 226, .16)'; c.lineWidth = 1; for (let i = 0; i < 18; i++) { const x = (i * 173 + 47) % Math.max(w, 1), y = ((i * 211 + this.distance * (1.5 + i % 3)) % (h + 100)) - 50; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 13 + i % 4 * 5); c.stroke(); }
    this.obstacles.forEach(o => drawObstacle(c, o));
    this.pickups.forEach(p => { c.save(); c.translate(p.x, p.y); c.rotate(t * 1.8); c.shadowBlur = 16; c.shadowColor = '#ffb454'; c.strokeStyle = '#ffbd60'; c.lineWidth = 2; c.strokeRect(-8, -8, 16, 16); c.restore(); });
    this.particles.forEach(p => { c.globalAlpha = Math.max(0, p.life / p.maxLife); c.fillStyle = p.color; c.beginPath(); c.arc(p.x, p.y, 2.2 * p.life / p.maxLife, 0, Math.PI * 2); c.fill(); }); c.globalAlpha = 1;
    const py = this.playerY; c.save(); c.translate(this.player.x, py); c.shadowBlur = 26; c.shadowColor = this.damageFlash ? '#ff617a' : '#65f5f0'; c.fillStyle = this.player.invulnerable > 0 && Math.floor(t * 15) % 2 ? '#ffbdc5' : '#ecffff'; c.beginPath(); c.arc(0, 0, PHYSICS.radius, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0; c.strokeStyle = this.damageFlash ? 'rgba(255,91,119,.95)' : 'rgba(88,240,238,.72)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 19 + Math.sin(t * 5) * 2, 0, Math.PI * 2); c.stroke(); c.restore(); c.restore();
    if (this.status === 'paused' || this.status === 'over') { c.fillStyle = 'rgba(3,7,15,.56)'; c.fillRect(0, 0, w, h); }
  }
}
