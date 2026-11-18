import { describe, expect, it } from 'vitest';
import { DAMAGE_INVULNERABILITY, STARTING_LIVES, takeHit } from './lives';

describe('three-life damage system', () => {
  it('starts with exactly three lives', () => expect(STARTING_LIVES).toBe(3));
  it('removes one life and starts invulnerability after a collision', () => {
    expect(takeHit(3, 0)).toEqual({ lives: 2, invulnerable: DAMAGE_INVULNERABILITY, hit: true });
  });
  it('ignores additional hits during invulnerability and ends at zero', () => {
    expect(takeHit(2, .5).hit).toBe(false);
    expect(takeHit(1, 0)).toEqual({ lives: 0, invulnerable: DAMAGE_INVULNERABILITY, hit: true });
    expect(takeHit(0, 0).hit).toBe(false);
  });
});
