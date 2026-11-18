import { DIFFICULTY } from './config';

export function difficultyStage(distance: number) {
  const [early, mid, late] = DIFFICULTY.stageDistances;
  return distance < early ? 0 : distance < mid ? 1 : distance < late ? 2 : 3;
}

export function complexity(distance: number) {
  return Math.min(1, Math.max(0, distance / DIFFICULTY.stageDistances[2]));
}

export function scrollSpeed(distance: number) {
  const progress = Math.min(1, Math.max(0, distance / DIFFICULTY.speedCapDistance));
  const eased = progress * progress * (3 - 2 * progress);
  return DIFFICULTY.startSpeed + (DIFFICULTY.maxSpeed - DIFFICULTY.startSpeed) * eased;
}

export function sectionSpacing(stage: number) {
  const progress = Math.max(0, Math.min(1, stage / 3));
  return (
    DIFFICULTY.sectionGapStart + (DIFFICULTY.sectionGapEnd - DIFFICULTY.sectionGapStart) * progress
  );
}

export function recoverySection(sectionIndex: number) {
  return (
    sectionIndex > 0 && sectionIndex % DIFFICULTY.recoveryEvery === DIFFICULTY.recoveryEvery - 1
  );
}
