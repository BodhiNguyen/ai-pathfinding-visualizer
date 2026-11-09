import { describe, expect, it } from 'vitest';
import { ALGORITHM_IDS, type GridProblem } from '../../src/domain/types';
import { runRealSearch } from '../../src/app/realSearchService';
import { runAllAlgorithmsComparison } from '../../src/app/mockSearchService';
import { createInitialPlaybackState, derivePlaybackSnapshot, playbackReducer } from '../../src/app/playbackState';

const grid = (): GridProblem => ({ rows: 3, cols: 3, start: { row: 0, col: 0 }, goal: { row: 2, col: 2 }, walls: new Set(['1,1']) });

describe('real playback integration', () => {
  it.each(ALGORITHM_IDS)('renders every %s frame directly and reveals path only at completion', (id) => {
    const measured = runRealSearch(grid(), id);
    let state = playbackReducer(createInitialPlaybackState(), { type: 'LOAD_RESULT', measuredResult: measured, mode: 'play' });
    measured.result.steps.forEach((step, index) => {
      state = playbackReducer(state, { type: 'STEP_FORWARD' });
      const view = derivePlaybackSnapshot(state);
      expect(view.currentCell).toBe(step.current);
      expect([...view.frontierSet]).toEqual(step.frontier);
      expect([...view.exploredSet]).toEqual(step.explored);
      expect([...view.frontierOrderMap.values()]).toEqual(step.frontier.map((_, i) => i + 1));
      expect(view.visiblePath).toEqual(index === measured.result.steps.length - 1 ? measured.result.path : []);
    });
    expect(state.isPlaying).toBe(false);
    state = playbackReducer(state, { type: 'STEP_BACKWARD' });
    expect(state.stepIndex).toBe(measured.result.steps.length - 2);
    state = playbackReducer(state, { type: 'RESET' });
    expect(state.stepIndex).toBe(-1);
    state = playbackReducer(state, { type: 'PLAY' });
    state = playbackReducer(state, { type: 'PAUSE' });
    expect(state.isPlaying).toBe(false);
    state = playbackReducer(state, { type: 'SET_SPEED', speedMs: 100 });
    expect(state.speedMs).toBe(100);
    state = playbackReducer(state, { type: 'MAP_EDITED' });
    expect(state.measuredResult).toBeNull();
    const next = runRealSearch(grid(), id);
    state = playbackReducer(state, { type: 'LOAD_RESULT', measuredResult: next, mode: 'play' });
    expect(state.stepIndex).toBe(-1);
    expect(state.measuredResult).toBe(next);
  });
  it.each([
    { rows: 2, cols: 2, start: { row: 0, col: 0 }, goal: { row: 1, col: 1 }, walls: new Set(['0,1', '1,0']) },
    { rows: 1, cols: 1, start: { row: 0, col: 0 }, goal: { row: 0, col: 0 }, walls: new Set<string>() },
  ])('handles real edge cases', (problem) => {
    const measured = runRealSearch(problem, 'bfs');
    const state = playbackReducer(createInitialPlaybackState(), { type: 'LOAD_RESULT', measuredResult: measured, mode: 'first-step' });
    expect(derivePlaybackSnapshot(state).outcome).toBe(measured.result.found ? 'FOUND' : 'NOT_FOUND');
    expect(derivePlaybackSnapshot(state).visiblePath).toEqual(measured.result.path);
  });
});

describe('comparison isolation', () => {
  it('uses five independent equivalent snapshots even if an executor mutates its input', () => {
    const problem = grid();
    const inputs: GridProblem[] = [];
    const results = runAllAlgorithmsComparison(problem, (input, id) => {
      expect(input).toEqual(grid());
      inputs.push(input);
      const result = runRealSearch(input, id);
      (input.walls as Set<string>).add('2,0');
      (input.start as { row: number }).row = 2;
      return result;
    });
    expect(inputs).toHaveLength(5);
    expect(new Set(inputs).size).toBe(5);
    expect(new Set(inputs.map(i => i.walls)).size).toBe(5);
    expect(new Set(inputs.map(i => i.start)).size).toBe(5);
    expect(new Set(inputs.map(i => i.goal)).size).toBe(5);
    expect(problem).toEqual(grid());
    for (const id of ALGORITHM_IDS) {
      expect(results[id].result).toEqual(runRealSearch(grid(), id).result);
      expect(results[id].durationMs).toBeGreaterThanOrEqual(0);
      expect(results[id].result).not.toHaveProperty('durationMs');
    }
    const repeated = runAllAlgorithmsComparison(problem, runRealSearch);
    for (const id of ALGORITHM_IDS) expect(repeated[id].result).toEqual(results[id].result);
  });
  it('propagates executor errors instead of returning partial metrics', () => {
    expect(() => runAllAlgorithmsComparison(grid(), (_input, id) => {
      if (id === 'ucs') throw new Error('executor failed');
      return runRealSearch(grid(), id);
    })).toThrow('executor failed');
  });
});
