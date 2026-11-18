export class ScreenShake {
  remaining = 0;
  duration = 0;
  intensity = 0;
  offsetX = 0;
  offsetY = 0;

  trigger(intensity: number, duration: number) {
    this.intensity = Math.max(this.intensity, intensity);
    this.duration = Math.max(this.duration, duration);
    this.remaining = Math.max(this.remaining, duration);
  }

  advance(dt: number) {
    if (this.remaining <= 0) return;
    this.remaining = Math.max(0, this.remaining - dt);
    if (this.remaining === 0) this.clear();
  }

  offset(random = Math.random, enabled = true) {
    if (!enabled || this.remaining <= 0) return this.clearOffset();
    const amount = (this.intensity * this.remaining) / Math.max(this.duration, 0.001);
    this.offsetX = (random() - 0.5) * 2 * amount;
    this.offsetY = (random() - 0.5) * 1.5 * amount;
    return { x: this.offsetX, y: this.offsetY };
  }

  clearOffset() {
    this.offsetX = 0;
    this.offsetY = 0;
    return { x: 0, y: 0 };
  }

  clear() {
    this.remaining = 0;
    this.duration = 0;
    this.intensity = 0;
    this.clearOffset();
  }
}
