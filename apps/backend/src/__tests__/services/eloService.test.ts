// Mock the DB so importing eloService doesn't require a live connection
jest.mock('../../config/database', () => ({
  db: jest.fn(),
  t: (name: string) => `tourneo_${name}`,
}));

import { EloService } from '../../services/eloService';

describe('EloService.calculate', () => {
  it('returns symmetric delta when both ratings are equal', () => {
    const result = EloService.calculate(1000, 1000);
    // Expected = 0.5, K=32, delta = round(32 * 0.5) = 16
    expect(result.delta).toBe(16);
    expect(result.newWinner).toBe(1016);
    expect(result.newLoser).toBe(984);
  });

  it('gives the underdog a larger gain when winning', () => {
    const upsetWin = EloService.calculate(900, 1100);
    const expectedWin = EloService.calculate(1100, 900);
    expect(upsetWin.delta).toBeGreaterThan(expectedWin.delta);
  });

  it('keeps total rating constant (zero-sum)', () => {
    const a = 1234;
    const b = 987;
    const { newWinner, newLoser } = EloService.calculate(a, b);
    expect(newWinner + newLoser).toBe(a + b);
  });

  it('clamps to integer values', () => {
    const { delta, newWinner, newLoser } = EloService.calculate(1325, 1411);
    expect(Number.isInteger(delta)).toBe(true);
    expect(Number.isInteger(newWinner)).toBe(true);
    expect(Number.isInteger(newLoser)).toBe(true);
  });

  it('caps maximum delta at K factor', () => {
    const { delta } = EloService.calculate(500, 2500);
    expect(delta).toBeLessThanOrEqual(EloService.K_FACTOR);
    expect(delta).toBeGreaterThan(0);
  });
});

describe('EloService.getTier', () => {
  it.each([
    [800, 'bronze'],
    [899, 'bronze'],
    [900, 'silver'],
    [999, 'silver'],
    [1000, 'gold'],
    [1099, 'gold'],
    [1100, 'platinum'],
    [1199, 'platinum'],
    [1200, 'diamond'],
    [1349, 'diamond'],
    [1350, 'elite'],
    [1800, 'elite'],
  ])('elo %i → %s', (elo, expected) => {
    expect(EloService.getTier(elo)).toBe(expected);
  });
});
