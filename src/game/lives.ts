export const STARTING_LIVES = 3;
export const DAMAGE_INVULNERABILITY = 1.15;
export function takeHit(lives: number, invulnerable: number) {
  if (invulnerable > 0 || lives <= 0) return { lives, invulnerable, hit: false };
  return { lives: lives - 1, invulnerable: DAMAGE_INVULNERABILITY, hit: true };
}
