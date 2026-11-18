import {
  COLORS,
  COLLECTIBLE_RADIUS,
  DIFFICULTY,
  NEAR_MISS_GAP,
  PHYSICS,
  POWERUP_CONFIG,
  WORLD,
} from './config';
import { collidesObstacle, obstacleClearance, qualifiesNearMiss } from './collision';
import { cosmeticColor } from './cosmetics';
import { generateCoinPattern, pullCoin } from './coins';
import { generateSection, movingOffset } from './generator';
import {
  findPowerUpSpot,
  makePowerUp,
  choosePowerUp,
  powerUpInterval,
  powerUpShouldSpawn,
  POWERUPS,
  worldScrollSpeed,
  powerUpCollision,
} from './powerups';
import { STARTING_LIVES } from './lives';
import { stepPlayer, type Player } from './physics';
import { difficultyStage, scrollSpeed, sectionSpacing } from './progression';
import { bankRun, freshActivePowerUps, type SaveData } from './save';
import { scoreCoin, scoreDistance } from './scoring';
import { playSound } from './sound';
import { ScreenShake } from './screenShake';
import { gripBrake, magnetRadius, magnetStrength, powerUpDuration } from './upgrades';
import type {
  ActivePowerUps,
  Coin,
  GameStatus,
  InputState,
  Obstacle,
  PowerUpId,
  PowerUpPickup,
} from './types';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  square?: boolean;
};
export type Snapshot = {
  status: GameStatus;
  score: number;
  distance: number;
  speed: number;
  lives: number;
  runCoins: number;
  balance: number;
  bestScore: number;
  bestDistance: number;
  newBest: boolean;
  active: ActivePowerUps;
  combo: number;
  event: string;
};

function drawObstacle(c: CanvasRenderingContext2D, o: Obstacle) {
  const palette: Record<Obstacle['kind'], string> = {
    block: COLORS.orange,
    vertical: COLORS.cream,
    moving: COLORS.cyan,
    orb: COLORS.red,
    rotor: COLORS.yellow,
    diamond: COLORS.purple,
  };
  const color = palette[o.kind];
  c.save();
  c.fillStyle = color;
  c.strokeStyle = color;
  c.shadowBlur = 10;
  c.shadowColor = color;
  if (o.kind === 'orb') {
    c.beginPath();
    c.arc(o.x + o.w / 2, o.y + o.h / 2, Math.min(o.w, o.h) * 0.48, 0, Math.PI * 2);
    c.fill();
    c.shadowBlur = 0;
    c.fillStyle = '#ffe0ba';
    c.fillRect(
      o.x + o.w * 0.34,
      o.y + o.h * 0.28,
      Math.max(2, o.w * 0.13),
      Math.max(2, o.h * 0.13),
    );
  } else if (o.kind === 'diamond') {
    c.beginPath();
    c.moveTo(o.x + o.w / 2, o.y);
    c.lineTo(o.x + o.w, o.y + o.h / 2);
    c.lineTo(o.x + o.w / 2, o.y + o.h);
    c.lineTo(o.x, o.y + o.h / 2);
    c.closePath();
    c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = 'rgba(255,255,255,.62)';
    c.stroke();
  } else if (o.kind === 'rotor') {
    c.translate(o.x + o.w / 2, o.y + o.h / 2);
    c.rotate(o.angle);
    c.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
    c.shadowBlur = 0;
    c.strokeStyle = 'rgba(255,255,255,.58)';
    c.lineWidth = 2;
    c.strokeRect(-o.w / 2 + 3, -o.h / 2 + 3, o.w - 6, o.h - 6);
  } else {
    c.fillRect(o.x, o.y, o.w, o.h);
    c.shadowBlur = 0;
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.fillRect(o.x + 3, o.y + 3, Math.max(0, o.w - 6), 2);
    c.fillStyle = 'rgba(0,0,0,.24)';
    c.fillRect(o.x + 3, o.y + o.h - 4, Math.max(0, o.w - 6), 2);
  }
  c.restore();
}
function drawPowerUp(c: CanvasRenderingContext2D, p: PowerUpPickup, t: number) {
  const style = POWERUPS[p.type],
    pulse = 1 + Math.sin(t * 5 + p.phase) * 0.08;
  c.save();
  c.translate(p.x, p.y);
  c.scale(pulse, pulse);
  // A high-contrast, player-sized badge keeps the powerup readable on every theme.
  c.shadowBlur = 20;
  c.shadowColor = style.color;
  c.fillStyle = 'rgba(5,12,20,.96)';
  c.beginPath();
  c.arc(0, 0, COLLECTIBLE_RADIUS + 1, 0, Math.PI * 2);
  c.fill();
  c.shadowBlur = 0;
  c.strokeStyle = style.color;
  c.fillStyle = style.color;
  c.lineWidth = 2.5;
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i - Math.PI / 8,
      r = COLLECTIBLE_RADIUS;
    i === 0
      ? c.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      : c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  c.closePath();
  c.stroke();
  c.lineWidth = 2.4;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (p.type === 'shield') {
    c.beginPath();
    c.moveTo(0, -7);
    c.lineTo(6, -4);
    c.lineTo(5, 3);
    c.lineTo(0, 7);
    c.lineTo(-5, 3);
    c.lineTo(-6, -4);
    c.closePath();
    c.stroke();
  } else if (p.type === 'freeze') {
    c.beginPath();
    c.moveTo(-6, 0);
    c.lineTo(6, 0);
    c.moveTo(0, -6);
    c.lineTo(0, 6);
    c.moveTo(-4, -4);
    c.lineTo(4, 4);
    c.moveTo(4, -4);
    c.lineTo(-4, 4);
    c.stroke();
  } else if (p.type === 'magnet') {
    c.beginPath();
    c.moveTo(-6, -5);
    c.lineTo(-6, 2);
    c.quadraticCurveTo(-6, 7, 0, 7);
    c.quadraticCurveTo(6, 7, 6, 2);
    c.lineTo(6, -5);
    c.stroke();
    c.beginPath();
    c.moveTo(-7, -5);
    c.lineTo(-3, -5);
    c.moveTo(3, -5);
    c.lineTo(7, -5);
    c.stroke();
  } else if (p.type === 'multiplier') {
    c.font = '8px "Press Start 2P",monospace';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('2×', 0, 1);
  } else {
    c.strokeRect(-6, -5, 12, 10);
    c.beginPath();
    c.moveTo(-3, -8);
    c.lineTo(3, -8);
    c.moveTo(-3, 8);
    c.lineTo(3, 8);
    c.stroke();
  }
  c.restore();
}

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  player: Player = { x: WORLD.width / 2, vx: 0, invulnerable: 0 };
  obstacles: Obstacle[] = [];
  powerUps: PowerUpPickup[] = [];
  coins: Coin[] = [];
  particles: Particle[] = [];
  input: InputState = { left: false, right: false };
  active: ActivePowerUps = freshActivePowerUps();
  nearMissEncounters = new Map<number, { closest: number; collided: boolean }>();
  cameraShake = new ScreenShake();
  status: GameStatus = 'menu';
  score = 0;
  distance = 0;
  speed: number = DIFFICULTY.startSpeed;
  lives = STARTING_LIVES;
  runCoins = 0;
  elapsed = 0;
  nextY = 0;
  section = 0;
  recentPatterns: number[] = [];
  recentPowerUps: PowerUpId[] = [];
  powerSequence = 0;
  nextPowerDistance = 400;
  runBanked = false;
  newBest = false;
  last = 0;
  accumulator = 0;
  raf = 0;
  damageFlash = 0;
  shieldCharges = 0;
  trailAt = 0;
  combo = 0;
  comboTimer = 0;
  event = '';
  eventTimer = 0;
  milestoneIndex = 0;
  listeners = new Set<(s: Snapshot) => void>();
  save: SaveData;
  onSave: (save: SaveData) => void;
  constructor(canvas: HTMLCanvasElement, save: SaveData, onSave: (save: SaveData) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.save = save;
    this.onSave = onSave;
    this.resize();
    window.addEventListener('resize', this.resize);
    this.raf = requestAnimationFrame(this.frame);
  }
  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
  }
  setSave(save: SaveData) {
    this.save = save;
    this.emit();
  }
  subscribe(fn: (s: Snapshot) => void) {
    this.listeners.add(fn);
    fn(this.snapshot());
    return () => this.listeners.delete(fn);
  }
  snapshot(): Snapshot {
    return {
      status: this.status,
      score: Math.floor(this.score),
      distance: Math.floor(this.distance),
      speed: this.speed,
      lives: this.lives,
      runCoins: this.runCoins,
      balance: this.save.coins,
      bestScore: this.save.bestScore,
      bestDistance: this.save.bestDistance,
      newBest: this.newBest,
      active: { ...this.active },
      combo: this.combo,
      event: this.event,
    };
  }
  emit() {
    const state = this.snapshot();
    this.listeners.forEach((fn) => fn(state));
  }
  start() {
    this.clearShake();
    this.player = { x: WORLD.width / 2, vx: 0, invulnerable: 0 };
    this.obstacles = [];
    this.powerUps = [];
    this.coins = [];
    this.particles = [];
    this.active = freshActivePowerUps();
    this.nearMissEncounters.clear();
    this.shieldCharges = 0;
    this.score = 0;
    this.distance = 0;
    this.speed = DIFFICULTY.startSpeed;
    this.lives = STARTING_LIVES;
    this.runCoins = 0;
    this.elapsed = 0;
    this.damageFlash = 0;
    this.section = 0;
    this.recentPatterns = [];
    this.recentPowerUps = [];
    this.powerSequence = 0;
    this.nextPowerDistance = 260;
    this.runBanked = false;
    this.newBest = false;
    this.combo = 0;
    this.comboTimer = 0;
    this.event = '';
    this.eventTimer = 0;
    this.milestoneIndex = 0;
    this.obstacles.push(...this.makeSection());
    this.nextY = -sectionSpacing(0);
    this.status = 'playing';
    this.last = 0;
    this.accumulator = 0;
    this.emit();
  }
  showHome() {
    if ((this.status === 'playing' || this.status === 'paused') && !this.runBanked) this.bankRun();
    this.clearShake();
    this.damageFlash = 0;
    this.status = 'menu';
    this.input = { left: false, right: false };
    this.active = freshActivePowerUps();
    this.obstacles = [];
    this.powerUps = [];
    this.coins = [];
    this.particles = [];
    this.nearMissEncounters.clear();
    this.player = { x: WORLD.width / 2, vx: 0, invulnerable: 0 };
    this.emit();
  }
  togglePause() {
    if (this.status === 'playing') this.status = 'paused';
    else if (this.status === 'paused') this.status = 'playing';
    this.emit();
  }
  private resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2),
      r = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.floor(r.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(r.height * dpr));
    this.ctx.setTransform(
      (dpr * r.width) / WORLD.width,
      0,
      0,
      (dpr * r.height) / WORLD.height,
      0,
      0,
    );
  };
  private get playerY() {
    return WORLD.height * 0.73;
  }
  private makeSection() {
    const id = this.section++,
      tier = difficultyStage(this.distance),
      pattern = generateSection(-100, tier, id, WORLD.width, {
        playerX: this.player.x,
        playerVx: this.player.vx,
        playerY: this.playerY,
        speed: Math.max(this.speed, 1),
        elapsed: this.elapsed,
        recentPatternIds: this.recentPatterns,
      });
    const patternId = pattern[0]?.patternId ?? 0;
    this.recentPatterns.push(patternId);
    this.recentPatterns = this.recentPatterns.slice(-2);
    if (id % 2 === 0) this.coins.push(...generateCoinPattern(id, WORLD.width, -210, pattern));
    return pattern;
  }
  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.05, this.last ? (now - this.last) / 1000 : 0);
    this.last = now;
    this.cameraShake.advance(dt);
    this.damageFlash = Math.max(0, this.damageFlash - dt);
    if (this.status === 'playing') {
      this.accumulator += dt;
      while (this.accumulator >= WORLD.fixedStep) {
        this.update(WORLD.fixedStep);
        this.accumulator -= WORLD.fixedStep;
      }
    }
    this.render(now / 1000);
  };
  private update(dt: number) {
    this.elapsed += dt;
    const freezeWasActive = this.active.freeze > 0;
    this.tickActive(dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (!this.comboTimer) this.combo = 0;
    this.eventTimer = Math.max(0, this.eventTimer - dt);
    if (!this.eventTimer) this.event = '';
    this.speed = scrollSpeed(this.distance);
    const stage = difficultyStage(this.distance),
      scroll = worldScrollSpeed(this.speed, this.active.freeze);
    const multiplier = this.active.multiplier > 0;
    const distanceDelta = (scroll * dt) / 10;
    this.distance += distanceDelta;
    this.score += scoreDistance(distanceDelta, multiplier);
    const gripLevel = this.save.upgrades.grip,
      brake = this.active.grip > 0 ? gripBrake(gripLevel) : 1;
    stepPlayer(this.player, this.input, dt, WORLD.width, brake);
    if (scroll > 0) {
      this.obstacles.forEach((o) => {
        o.y += scroll * dt;
        if (o.kind === 'moving') o.x = (o.baseX ?? o.x) + movingOffset(o, this.elapsed);
        if (o.kind === 'rotor' && !freezeWasActive)
          o.angle = (o.angle + (o.angularVelocity ?? 1) * dt) % (Math.PI * 2);
      });
    }
    this.updateCoins(dt, scroll);
    this.updatePickups(dt, scroll);
    this.checkNearMisses();
    this.checkCollision();
    this.spawnPowerUpIfDue(stage);
    if (this.nextY >= 0) {
      this.obstacles.push(...this.makeSection());
      this.nextY = -sectionSpacing(stage);
    }
    if (scroll > 0) this.nextY += scroll * dt;
    this.obstacles = this.obstacles.filter((o) => o.y < WORLD.height + 110);
    const liveObstacleIds = new Set(this.obstacles.map((o) => o.id));
    this.nearMissEncounters = new Map(
      [...this.nearMissEncounters].filter(([id]) => liveObstacleIds.has(id)),
    );
    this.coins = this.coins.filter((c) => c.y < WORLD.height + 40);
    this.powerUps = this.powerUps.filter((p) => p.y < WORLD.height + 40);
    this.checkMilestones();
    this.updateParticles(dt);
    this.emitOnTick(dt);
    if (freezeWasActive && this.active.freeze <= 0)
      this.burst(this.player.x, this.playerY, '#8bc8ff', 14);
  }
  private tickActive(dt: number) {
    for (const id of Object.keys(this.active) as PowerUpId[]) {
      if (this.active[id] <= 0) continue;
      this.active[id] = Math.max(0, this.active[id] - dt);
      if (this.active[id] === 0) this.burst(this.player.x, this.playerY, POWERUPS[id].color, 10);
    }
  }
  private updateCoins(dt: number, scroll: number) {
    const magnet = this.active.magnet > 0,
      level = this.save.upgrades.magnet,
      radius = magnetRadius(level),
      strength = magnetStrength(level),
      kept: Coin[] = [];
    for (const coin of this.coins) {
      coin.y += scroll * dt;
      const drag = Math.pow(magnet ? 0.4 : 0.08, dt);
      coin.vx *= drag;
      coin.vy *= drag;
      if (magnet) {
        const moved = pullCoin(coin, this.player.x, this.playerY, dt, radius, strength);
        coin.x = moved.x;
        coin.y = moved.y;
        coin.vx = moved.vx;
        coin.vy = moved.vy;
      } else {
        coin.x += coin.vx * dt;
        coin.y += coin.vy * dt;
      }
      if (
        Math.hypot(coin.x - this.player.x, coin.y - this.playerY) <
        PHYSICS.radius + COLLECTIBLE_RADIUS
      ) {
        this.runCoins += coin.value;
        this.score += scoreCoin(coin.value, this.active.multiplier > 0) * this.comboMultiplier();
        this.advanceCombo();
        this.burst(coin.x, coin.y, '#ffd467', 7);
        playSound('coin', this.save.settings.sound);
      } else kept.push(coin);
    }
    this.coins = kept;
  }
  private updatePickups(dt: number, scroll: number) {
    for (const pickup of this.powerUps) {
      pickup.y += scroll * dt;
      if (
        Math.hypot(pickup.x - this.player.x, pickup.y - this.playerY) <
        PHYSICS.radius + COLLECTIBLE_RADIUS
      ) {
        this.activate(pickup.type);
        pickup.y = WORLD.height + 100;
      }
    }
  }
  private activate(id: PowerUpId) {
    this.active[id] = powerUpDuration(id, this.save.upgrades[id]);
    if (id === 'shield') this.shieldCharges = 1 + Math.floor(this.save.upgrades.shield / 3);
    this.burst(this.player.x, this.playerY, POWERUPS[id].color, 12);
    playSound('power', this.save.settings.sound);
  }
  private spawnPowerUpIfDue(stage: number) {
    if (this.distance < this.nextPowerDistance) return;
    const seed = this.powerSequence++,
      chance = powerUpShouldSpawn(stage, seed),
      interval = powerUpInterval(stage);
    if (chance) {
      const type = choosePowerUp(stage, seed, this.recentPowerUps, this.save.upgrades.shield),
        spot = findPowerUpSpot(seed, WORLD.width, -270, this.obstacles, this.player.x, [
          ...this.coins,
          ...this.powerUps,
        ]);
      if (spot) {
        this.powerUps.push(makePowerUp(seed, type, spot));
        this.recentPowerUps.push(type);
        this.recentPowerUps = this.recentPowerUps.slice(-2);
      }
    }
    this.nextPowerDistance = this.distance + interval * (0.88 + (seed % 5) * 0.055);
  }
  private checkCollision() {
    if (this.player.invulnerable > 0) return;
    const hit = this.obstacles.find((o) =>
      collidesObstacle(this.player.x, this.playerY, PHYSICS.radius, o),
    );
    if (!hit) return;
    const result = powerUpCollision(
      this.lives,
      this.player.invulnerable,
      this.active.shield,
      this.shieldCharges,
    );
    this.active.shield = result.shieldRemaining;
    this.shieldCharges = result.shieldCharges;
    this.player.invulnerable = result.invulnerable;
    if (result.absorbed) {
      this.burst(this.player.x, this.playerY, POWERUPS.shield.color, 22);
      this.damageFlash = 0.12;
      this.triggerShake(5, 0.22);
      playSound('power', this.save.settings.sound);
      return;
    }
    if (result.hit) {
      this.lives = result.lives;
      this.damageFlash = 0.32;
      this.burst(this.player.x, this.playerY, COLORS.red, 20);
      this.triggerShake(this.lives <= 0 ? 14 : 8, this.lives <= 0 ? 1.8 : 0.42);
      playSound('hit', this.save.settings.sound);
      if (this.lives <= 0) {
        this.status = 'over';
        this.bankRun();
      }
    }
  }
  private comboMultiplier() {
    return Math.min(3, 1 + Math.floor(this.combo / 3));
  }
  private advanceCombo() {
    this.combo++;
    this.comboTimer = 2.8;
    if (this.combo === 3 || this.combo === 6 || this.combo === 9)
      this.showEvent(`COMBO ×${this.comboMultiplier()}`);
  }
  private showEvent(message: string) {
    this.event = message;
    this.eventTimer = 1.25;
  }
  private checkNearMisses() {
    for (const obstacle of this.obstacles) {
      const encounter = this.nearMissEncounters.get(obstacle.id),
        inPassWindow =
          obstacle.y + obstacle.h >= this.playerY - PHYSICS.radius - NEAR_MISS_GAP &&
          obstacle.y <= this.playerY + PHYSICS.radius + NEAR_MISS_GAP;
      if (inPassWindow) {
        const state = encounter ?? { closest: Infinity, collided: false };
        const clearance = obstacleClearance(
          this.player.x,
          this.playerY,
          PHYSICS.radius,
          obstacle,
          NEAR_MISS_GAP,
        );
        if (clearance < 0) state.collided = true;
        else state.closest = Math.min(state.closest, clearance);
        this.nearMissEncounters.set(obstacle.id, state);
      } else if (encounter && obstacle.y > this.playerY + PHYSICS.radius + NEAR_MISS_GAP) {
        this.nearMissEncounters.delete(obstacle.id);
        if (qualifiesNearMiss(encounter.closest, encounter.collided, NEAR_MISS_GAP)) {
          const bonus = 15 * this.comboMultiplier();
          this.score += bonus;
          this.advanceCombo();
          this.showEvent(`NEAR MISS +${bonus}`);
          this.burst(this.player.x, this.playerY, '#8be6d6', 5);
        }
      }
    }
  }
  private triggerShake(strength: number, duration: number) {
    this.cameraShake.trigger(strength, duration);
  }
  private clearShake() {
    this.cameraShake.clear();
  }
  private checkMilestones() {
    const milestones = DIFFICULTY.milestones;
    while (
      this.milestoneIndex < milestones.length &&
      this.distance >= milestones[this.milestoneIndex]
    ) {
      const reward = DIFFICULTY.milestoneCoinRewards[this.milestoneIndex];
      this.runCoins += reward;
      this.score += reward * POWERUP_CONFIG.coinScore;
      this.showEvent(`${milestones[this.milestoneIndex].toLocaleString()}M · +${reward} COINS`);
      this.burst(WORLD.width / 2, this.playerY - 40, '#f5d26a', 18);
      this.milestoneIndex++;
    }
  }
  private bankRun() {
    const result = bankRun(
      this.save,
      { coins: this.runCoins, score: this.score, distance: this.distance },
      this.runBanked,
    );
    if (!result.banked) return;
    this.save = result.save;
    this.newBest = result.newBest;
    this.runBanked = true;
    this.onSave(this.save);
  }
  private updateParticles(dt: number) {
    this.particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.15, dt);
      p.vy *= Math.pow(0.15, dt);
      p.life -= dt;
    });
    this.particles = this.particles.filter((p) => p.life > 0);
    if (
      this.status === 'playing' &&
      (this.active.grip > 0 || this.save.equipped.trail !== 'trail-none') &&
      Math.abs(this.player.vx) > 45 &&
      this.elapsed - this.trailAt > 0.055
    ) {
      this.trailAt = this.elapsed;
      const col =
        this.active.grip > 0 ? '#a7e77c' : cosmeticColor(this.save.equipped.trail, COLORS.cyan);
      this.particles.push({
        x: this.player.x,
        y: this.playerY,
        vx: -this.player.vx * 0.12,
        vy: 70,
        life: 0.28,
        maxLife: 0.28,
        color: col,
        square: this.save.equipped.trail === 'trail-pixel',
      });
    }
  }
  private emitOnTick(dt: number) {
    if (Math.floor(this.elapsed * 10) !== Math.floor((this.elapsed - dt) * 10)) this.emit();
  }
  private burst(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count,
        v = 50 + (i % 4) * 23;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.28 + (i % 3) * 0.08,
        maxLife: 0.44,
        color,
        square: i % 2 === 0,
      });
    }
  }
  private render(t: number) {
    const c = this.ctx,
      w = WORLD.width,
      h = WORLD.height,
      theme = this.save.equipped.theme,
      stage = difficultyStage(this.distance),
      environments = ['#080b12', '#0b1019', '#100b12', '#08120e'],
      base = theme === 'theme-ember' ? 2 : theme === 'theme-oxide' ? 3 : 0,
      bg = environments[Math.min(3, (base + stage) % 4)];
    c.clearRect(0, 0, w, h);
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    const ambient = this.status === 'menu' ? t * 4 : 0;
    for (let i = 0; i < 36; i++) {
      const x = (i * 173 + 47) % Math.max(w, 1),
        y =
          (i * 211 + this.distance * (this.status === 'menu' ? 0.2 : 0.55) + ambient) %
          Math.max(h, 1);
      c.fillStyle = 'rgba(237,225,194,.22)';
      c.fillRect(Math.floor(x / 3) * 3, Math.floor(y / 3) * 3, 2, 2);
    }
    c.save();
    const offset = this.cameraShake.offset(Math.random, this.save.settings.screenShake);
    c.translate(offset.x, offset.y);
    if (this.active.freeze > 0) {
      c.fillStyle = 'rgba(120,190,255,.08)';
      c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(165,220,255,.16)';
      c.lineWidth = 2;
      c.strokeRect(7, 7, w - 14, h - 14);
    }
    this.obstacles.forEach((o) => drawObstacle(c, o));
    this.coins.forEach((coin) => {
      c.save();
      c.translate(coin.x, coin.y);
      const pulse = 1 + Math.sin(t * 7 + coin.phase) * 0.06;
      c.scale(pulse, pulse);
      c.shadowBlur = 19;
      c.shadowColor = '#ffc83d';
      c.fillStyle = '#f4b82f';
      c.beginPath();
      c.arc(0, 0, COLLECTIBLE_RADIUS, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      c.strokeStyle = '#fff0a0';
      c.lineWidth = 2;
      c.stroke();
      c.fillStyle = '#fff1ae';
      c.beginPath();
      c.arc(0, 0, COLLECTIBLE_RADIUS - 3, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#a96518';
      c.beginPath();
      c.arc(0, 0, COLLECTIBLE_RADIUS - 5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#fff0a0';
      c.beginPath();
      c.moveTo(2, -6);
      c.lineTo(-3, 0);
      c.lineTo(0, 0);
      c.lineTo(-2, 6);
      c.lineTo(4, -1);
      c.lineTo(1, -1);
      c.closePath();
      c.fill();
      c.restore();
    });
    this.powerUps.forEach((p) => drawPowerUp(c, p, t));
    if (this.eventTimer > 0) {
      c.save();
      c.globalAlpha = Math.min(1, this.eventTimer * 1.5);
      c.textAlign = 'center';
      c.font = '10px "Press Start 2P",monospace';
      c.shadowColor = '#071015';
      c.shadowBlur = 8;
      c.fillStyle = '#fff0a0';
      c.fillText(this.event, WORLD.width / 2, this.playerY - 55);
      c.restore();
    }
    if (this.active.magnet > 0) {
      const radius = magnetRadius(this.save.upgrades.magnet);
      c.strokeStyle = 'rgba(237,121,206,.22)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(this.player.x, this.playerY, radius + Math.sin(t * 5) * 4, 0, Math.PI * 2);
      c.stroke();
      for (const coin of this.coins) {
        if (Math.hypot(coin.x - this.player.x, coin.y - this.playerY) < radius) {
          c.strokeStyle = 'rgba(237,121,206,.16)';
          c.beginPath();
          c.moveTo(this.player.x, this.playerY);
          c.lineTo(coin.x, coin.y);
          c.stroke();
        }
      }
    }
    this.particles.forEach((p) => {
      c.globalAlpha = Math.max(0, p.life / p.maxLife);
      c.fillStyle = p.color;
      if (p.square) c.fillRect(p.x - 2, p.y - 2, 4, 4);
      else {
        c.beginPath();
        c.arc(p.x, p.y, (2.5 * p.life) / p.maxLife, 0, Math.PI * 2);
        c.fill();
      }
    });
    c.globalAlpha = 1;
    const themeBall = cosmeticColor(this.save.equipped.ball, COLORS.cyan),
      ballColor =
        this.active.multiplier > 0
          ? '#ffd467'
          : this.active.shield > 0
            ? POWERUPS.shield.color
            : themeBall;
    c.save();
    c.translate(this.player.x, this.playerY);
    c.shadowBlur = 25;
    c.shadowColor = this.damageFlash ? COLORS.red : ballColor;
    c.fillStyle = this.player.invulnerable > 0 && Math.floor(t * 15) % 2 ? '#ffbdc5' : '#f1fff9';
    c.beginPath();
    c.arc(0, 0, PHYSICS.radius, 0, Math.PI * 2);
    c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = this.damageFlash ? 'rgba(255,91,119,.95)' : ballColor;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, 0, 19 + Math.sin(t * 5) * 2, 0, Math.PI * 2);
    c.stroke();
    if (this.active.freeze > 0) {
      c.strokeStyle = 'rgba(190,230,255,.75)';
      c.beginPath();
      c.arc(0, 0, 25, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
    if (this.status === 'paused' || this.status === 'over') {
      c.fillStyle = 'rgba(3,7,15,.48)';
      c.fillRect(0, 0, w, h);
    }
    c.restore();
    this.cameraShake.clearOffset();
  }
}
