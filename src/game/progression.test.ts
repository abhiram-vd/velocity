import { describe, expect, it } from 'vitest';
import { DIFFICULTY } from './config';
import { difficultyStage, recoverySection, scrollSpeed, sectionSpacing } from './progression';
import { patternsForStage } from './generator';

describe('run pacing', () => {
  it('ramps speed gradually, then reaches a fixed cap', () => {
    expect(scrollSpeed(0)).toBe(DIFFICULTY.startSpeed);
    expect(scrollSpeed(500)).toBeLessThan(DIFFICULTY.startSpeed + 30);
    expect(scrollSpeed(4_000)).toBeLessThan(DIFFICULTY.maxSpeed - 100);
    expect(scrollSpeed(DIFFICULTY.speedCapDistance)).toBe(DIFFICULTY.maxSpeed);
    expect(scrollSpeed(40_000)).toBe(DIFFICULTY.maxSpeed);
    let prior = 0;
    for (let distance = 0; distance <= 40_000; distance += 250) {
      const speed = scrollSpeed(distance);
      expect(speed).toBeGreaterThanOrEqual(prior);
      expect(speed).toBeLessThanOrEqual(DIFFICULTY.maxSpeed);
      prior = speed;
    }
  });
  it('unlocks pattern complexity in stages while preserving recovery beats', () => {
    expect(difficultyStage(0)).toBe(0);
    expect(difficultyStage(1_500)).toBe(1);
    expect(difficultyStage(4_000)).toBe(2);
    expect(difficultyStage(8_000)).toBe(3);
    expect(recoverySection(4)).toBe(true);
    expect(recoverySection(5)).toBe(false);
    expect(sectionSpacing(3)).toBeLessThan(sectionSpacing(0));
    expect(patternsForStage(0)).not.toContain(4);
    expect(patternsForStage(1)).toContain(4);
    expect(patternsForStage(1)).not.toContain(6);
    expect(patternsForStage(2)).toContain(5);
    expect(patternsForStage(2)).not.toContain(6);
    expect(patternsForStage(3)).toContain(6);
  });
});
