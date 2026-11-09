import { afterEach, describe, expect, it, vi } from 'vitest';
import { layThuatToan } from '../../src/algorithms';
import { ALGORITHM_IDS, type AlgorithmId, type GridProblem } from '../../src/domain/types';
import { runRealSearch } from '../../src/app/realSearchService';
import { createInitialPlaybackState, derivePlaybackSnapshot, playbackReducer } from '../../src/app/playbackState';

const grid = (overrides: Partial<GridProblem> = {}): GridProblem => ({
  rows: 5, cols: 5, start: { row: 2, col: 0 }, goal: { row: 2, col: 4 },
  walls: new Set(['2,1', '2,2', '2,3', '1,2']), ...overrides,
});

afterEach(() => vi.restoreAllMocks());

describe.each(ALGORITHM_IDS)('real executor: %s', (id) => {
  it('uses registry output on a custom grid without mutating input, across repeated runs', () => {
    const problem = grid();
    const before = structuredClone(problem);
    const first = runRealSearch(problem, id);
    const second = runRealSearch(problem, id);
    expect(first.result).toEqual(layThuatToan(id)(problem));
    expect(second.result).toEqual(first.result);
    expect(second.result).not.toBe(first.result);
    expect(problem).toEqual(before);
    expect(first.result.found).toBe(true);
    expect(first.result.path[0]).toBe('2,0');
    expect(first.result.path.at(-1)).toBe('2,4');
    for (const [index, cell] of first.result.path.entries()) {
      expect(problem.walls.has(cell)).toBe(false);
      if (index) {
        const [r, c] = cell.split(',').map(Number);
        const [pr, pc] = first.result.path[index - 1].split(',').map(Number);
        expect(Math.abs(r - pr) + Math.abs(c - pc)).toBe(1);
      }
    }
    if (id === 'bfs' || id === 'ucs' || id === 'astar') expect(first.result.pathCost).toBe(6);
    expect('durationMs' in first.result).toBe(false);
  });

  it.each([grid({ rows: 1, cols: 1, walls: new Set(), start: { row: 0, col: 0 }, goal: { row: 0, col: 0 } }),
    grid({ start: { row: 3, col: 3 }, goal: { row: 3, col: 3 }, walls: new Set() })])
  ('handles coincident start and goal', (problem) => {
    const result = runRealSearch(problem, id).result;
    expect(result.path).toEqual([`${problem.start.row},${problem.start.col}`]);
    expect(result.pathCost).toBe(0);
    expect(result.steps).toHaveLength(1);
  });

  it('returns an unreachable goal as a valid result', () => {
    const result = runRealSearch(grid({ walls: new Set(['1,0', '2,1', '3,0']) }), id).result;
    expect(result.found).toBe(false);
    expect(result.path).toEqual([]);
    expect(result.pathCost).toBeNull();
    expect(result.steps.at(-1)?.frontier).toEqual([]);
  });
});

it('measures only the synchronous search using an external clock', () => {
  vi.spyOn(performance, 'now').mockReturnValueOnce(12.5).mockReturnValueOnce(15.75);
  const measured = runRealSearch(grid(), 'bfs');
  expect(measured.durationMs).toBe(3.25);
  expect(performance.now).toHaveBeenCalledTimes(2);
  expect('durationMs' in measured.result).toBe(false);
});

it.each([
  grid({ rows: 0 }), grid({ cols: 21 }), grid({ rows: 1.5 }),
  grid({ start: { row: -1, col: 0 } }), grid({ goal: { row: 5, col: 0 } }),
  grid({ walls: new Set(['bad']) }), grid({ walls: new Set(['5,0']) }),
  grid({ walls: new Set(['2,0']) }),
])('propagates domain validation errors', (problem) => {
  let original: unknown;
  try { layThuatToan('bfs')(problem); } catch (error) { original = error; }
  expect(original).toBeInstanceOf(Error);
  expect(() => runRealSearch(problem, 'bfs')).toThrowError((original as Error).message);
});

it('propagates an invalid registry ID error', () => {
  expect(() => runRealSearch(grid(), 'invalid' as AlgorithmId)).toThrowError(/ID thuật toán/i);
});

it('feeds real steps to the existing playback reducer', () => {
  const measured = runRealSearch(grid(), 'bfs');
  const state = playbackReducer(createInitialPlaybackState(), { type: 'LOAD_RESULT', measuredResult: measured, mode: 'final' });
  const view = derivePlaybackSnapshot(state);
  expect(state.measuredResult?.result).toBe(measured.result);
  expect(view).toBeDefined();
  expect(state.stepIndex).toBe(measured.result.steps.length - 1);
});
