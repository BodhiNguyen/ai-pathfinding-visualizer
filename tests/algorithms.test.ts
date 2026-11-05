import { describe, expect, it } from 'vitest';
import type { AlgorithmId, GridProblem, SearchResult } from '../src/domain/types';
import { timBFS, timDFS, timUCS, timGreedy, timAStar, layThuatToan } from '../src/algorithms';

const algorithms = [
  ['bfs', timBFS], ['dfs', timDFS], ['ucs', timUCS],
  ['greedy', timGreedy], ['astar', timAStar],
] as const;

const grid = (overrides: Partial<GridProblem> = {}): GridProblem => ({
  rows: 3, cols: 3, walls: new Set(),
  start: { row: 0, col: 0 }, goal: { row: 2, col: 2 }, ...overrides,
});

function expectValidPath(problem: GridProblem, result: SearchResult) {
  expect(result.found).toBe(true);
  expect(result.path[0]).toBe(`${problem.start.row},${problem.start.col}`);
  expect(result.path.at(-1)).toBe(`${problem.goal.row},${problem.goal.col}`);
  expect(result.pathCost).toBe(result.path.length - 1);
  expect(new Set(result.path).size).toBe(result.path.length);
  for (const [index, id] of result.path.entries()) {
    expect(id).toMatch(/^(0|[1-9]\d*),(0|[1-9]\d*)$/);
    const [row, col] = id.split(',').map(Number);
    expect(row).toBeLessThan(problem.rows);
    expect(col).toBeLessThan(problem.cols);
    expect(problem.walls.has(id)).toBe(false);
    if (index > 0) {
      const [prevRow, prevCol] = result.path[index - 1].split(',').map(Number);
      expect(Math.abs(row - prevRow) + Math.abs(col - prevCol)).toBe(1);
    }
  }
}

describe.each(algorithms)('%s contract', (id, search) => {
  it('finds a valid path on a cyclic grid with multiple paths', () => {
    const problem = grid();
    const result = search(problem);
    expect(result.algorithm).toBe(id);
    expectValidPath(problem, result);
    expect(result.expandedCount).toBe(result.steps.length);
    expect(result.steps.map(step => step.current)).toEqual(result.steps.at(-1)?.explored);
    expect(new Set(result.steps.map(step => step.current)).size).toBe(result.steps.length);
    for (const step of result.steps) {
      expect(new Set(step.frontier).size).toBe(step.frontier.length);
      expect(step.frontier.every(cell => !step.explored.includes(cell))).toBe(true);
    }
  });

  it('handles start equal to goal without expanding neighbors', () => {
    const result = search(grid({ start: { row: 1, col: 1 }, goal: { row: 1, col: 1 } }));
    expect(result).toEqual({ algorithm: id, found: true, path: ['1,1'], pathCost: 0,
      expandedCount: 1, steps: [{ current: '1,1', frontier: [], explored: ['1,1'] }] });
  });

  it('reports no path after exhausting the reachable component', () => {
    const result = search(grid({ walls: new Set(['0,1', '1,0']) }));
    expect(result).toEqual({ algorithm: id, found: false, path: [], pathCost: null,
      expandedCount: 1, steps: [{ current: '0,0', frontier: [], explored: ['0,0'] }] });
  });

  it('rejects invalid grids with an error', () => {
    for (const problem of [grid({ rows: 0 }), grid({ walls: new Set(['0,0']) }),
      grid({ goal: { row: 3, col: 0 } }), grid({ walls: new Set(['bad']) })]) {
      expect(() => search(problem)).toThrowError(/.+/);
    }
  });

  it('does not mutate the problem or share mutable snapshots', () => {
    const problem = grid({ walls: new Set(['1,1']) });
    const before = structuredClone(problem);
    const result = search(problem);
    expect(problem).toEqual(before);
    expect(result.steps.length).toBeGreaterThan(1);
    const second = structuredClone(result.steps[1]);
    (result.steps[0].frontier as string[]).push('sentinel');
    (result.steps[0].explored as string[]).push('sentinel');
    expect(result.steps[1]).toEqual(second);
    expect(problem).toEqual(before);
    expectValidPath(problem, search(problem));
  });

  it('exhausts a multi-cell reachable component when the goal is blocked off', () => {
    const problem = grid({ rows: 3, cols: 4, goal: { row: 1, col: 3 },
      walls: new Set(['0,2', '1,2', '2,2']) });
    const reachable = ['0,0', '0,1', '1,0', '1,1', '2,0', '2,1'];
    const result = search(problem);
    const expanded = result.steps.map(step => step.current);
    expect(result.found).toBe(false);
    expect(result.path).toEqual([]);
    expect(result.pathCost).toBeNull();
    expect(result.expandedCount).toBe(reachable.length);
    expect(result.expandedCount).toBe(result.steps.length);
    expect(new Set(expanded).size).toBe(reachable.length);
    expect([...expanded].sort()).toEqual([...reachable].sort());
  });

  it('keeps every snapshot array independent in both directions', () => {
    const problem = grid({ walls: new Set(['1,1']) });
    const before = structuredClone(problem);
    const { steps } = search(problem);
    expect(steps.length).toBeGreaterThan(2);
    const arrays = steps.flatMap(step => [step.frontier, step.explored]);
    expect(new Set(arrays).size).toBe(arrays.length);

    for (const index of [0, steps.length - 1]) {
      const otherSnapshots = steps.map(step => structuredClone(step));
      (steps[index].frontier as string[]).push('frontier sentinel');
      (steps[index].explored as string[]).push('explored sentinel');
      steps.forEach((step, otherIndex) => {
        if (otherIndex !== index) expect(step).toEqual(otherSnapshots[otherIndex]);
      });
    }
    expect(problem).toEqual(before);
  });
});

describe('algorithm ordering and cost', () => {
  it.each([['bfs', timBFS], ['ucs', timUCS], ['astar', timAStar]] as const)(
    '%s chooses the independently bounded shortest route over a longer branch', (_id, search) => {
      const problem = grid({ rows: 5, cols: 5, start: { row: 2, col: 0 },
        goal: { row: 2, col: 4 }, walls: new Set(['2,1', '2,2', '2,3', '1,2']) });
      const result = search(problem);
      // The direct row is blocked, so at least one vertical move each way is
      // needed in addition to four horizontal moves. Row 3 realizes cost 6.
      // The upper branch, encountered first in neighbor order, must reach row 0
      // to cross column 2 and therefore has cost at least 8.
      expect(result.found).toBe(true);
      expectValidPath(problem, result);
      expect(result.pathCost).toBe(6);
      expect(result.pathCost).toBeLessThan(8);
      expect(result.expandedCount).toBe(result.steps.length);
    },
  );

  it('BFS takes FIFO, with neighbors enqueued up, right, down, left', () => {
    const result = timBFS(grid({ start: { row: 1, col: 1 }, goal: { row: 2, col: 2 } }));
    expect(result.steps[0].frontier).toEqual(['0,1', '1,2', '2,1', '1,0']);
    expect(result.steps.slice(0, 5).map(step => step.current)).toEqual(['1,1', '0,1', '1,2', '2,1', '1,0']);
  });

  it('DFS takes LIFO in neighbor order and removes duplicate and stale frontier entries', () => {
    const result = timDFS(grid({ goal: { row: 2, col: 0 } }));
    expect(result.steps.slice(0, 5).map(step => step.current)).toEqual(['0,0', '0,1', '0,2', '1,2', '2,2']);
    expect(result.steps[4].frontier).toEqual(['2,1', '1,1', '1,0']);
    for (const step of result.steps) {
      expect(new Set(step.frontier).size).toBe(step.frontier.length);
      expect(step.frontier.every(cell => !step.explored.includes(cell))).toBe(true);
    }
  });

  it('UCS orders by g and preserves FIFO for equal costs', () => {
    const result = timUCS(grid({ start: { row: 1, col: 1 }, goal: { row: 2, col: 2 } }));
    expect(result.steps[0].frontier).toEqual(['0,1', '1,2', '2,1', '1,0']);
    expect(result.steps[1].frontier).toEqual(['1,2', '2,1', '1,0', '0,2', '0,0']);
    expect(result.steps.slice(0, 5).map(step => step.current)).toEqual(['1,1', '0,1', '1,2', '2,1', '1,0']);
  });

  it('Greedy orders by Manhattan h and uses FIFO for equal h', () => {
    const result = timGreedy(grid({ start: { row: 1, col: 1 }, goal: { row: 2, col: 2 } }));
    // h=1 for right/down, h=3 for up/left; each equal pair keeps insertion order.
    expect(result.steps[0].frontier).toEqual(['1,2', '2,1', '0,1', '1,0']);
    expect(result.steps[1].frontier).toEqual(['2,2', '2,1', '0,2', '0,1', '1,0']);
    expect(result.steps[2].current).toBe('2,2');
  });

  it('A* orders by g+h and uses FIFO when f ties', () => {
    const result = timAStar(grid({ start: { row: 1, col: 1 }, goal: { row: 2, col: 2 } }));
    // Right/down have f=2; up/left have f=4. The new goal also has f=2.
    expect(result.steps[0].frontier).toEqual(['1,2', '2,1', '0,1', '1,0']);
    expect(result.steps[1].frontier).toEqual(['2,1', '2,2', '0,1', '1,0', '0,2']);
    expect(result.steps[2].current).toBe('2,1');
  });

  it('A* replaces a worse frontier route with a better one', () => {
    // .....   The first route to N=(1,2) is S-(3,0)-(3,1)-(3,2)-
    // ..N..   (2,2)-N, g=5. The later route S-(1,0)-(1,1)-N has g=3.
    // S#.#.   Goal (3,4) can only be entered from (2,4); the wall at
    // ...#G   (2,1) forces a detour of at least two steps to get there.
    // ...#.   Thus the shortest cost is 7, realized by the path below.
    const problem = grid({ rows: 5, cols: 5, start: { row: 2, col: 0 },
      goal: { row: 3, col: 4 }, walls: new Set(['2,1', '2,3', '3,3', '4,3']) });
    const result = timAStar(problem);
    expectValidPath(problem, result);
    expect(result.path).toEqual(['2,0', '1,0', '1,1', '1,2', '1,3', '1,4', '2,4', '3,4']);
    expect(result.pathCost).toBe(7);

    const steps = result.steps;
    // (2,2) discovers N via the five-step route. N remains queued when
    // (1,1) supplies the three-step route, moving N ahead of (0,0).
    expect(steps[7].current).toBe('2,2');
    expect(steps[7].frontier).toEqual(['4,2', '1,1', '0,0', '1,2']);
    expect(steps[8].frontier).toEqual(['1,1', '0,0', '1,2']);
    expect(steps[9].current).toBe('1,1');
    expect(steps[9].frontier).toEqual(['1,2', '0,0', '0,1']);
    expect(steps[10].current).toBe('1,2');
    expect(result.expandedCount).toBe(steps.length);
    expect(new Set(steps.map(step => step.current)).size).toBe(steps.length);
    for (const step of steps) {
      expect(new Set(step.frontier).size).toBe(step.frontier.length);
    }

    // Isolate the same goal so the search exhausts the frontier, including
    // any obsolete entry left behind after the improvement.
    const exhausted = timAStar({ ...problem, walls: new Set([...problem.walls, '2,4', '4,4']) });
    expect(exhausted.found).toBe(false);
    expect(exhausted.path).toEqual([]);
    expect(exhausted.pathCost).toBeNull();
    expect(exhausted.steps[7].current).toBe('2,2');
    expect(exhausted.steps[9].current).toBe('1,1');
    expect(exhausted.steps[9].frontier).toEqual(['1,2', '0,0', '0,1']);
    expect(exhausted.steps.at(-1)?.frontier).toEqual([]);
    expect(exhausted.steps.filter(step => step.current === '1,2')).toHaveLength(1);
    expect(new Set(exhausted.steps.map(step => step.current)).size).toBe(exhausted.steps.length);
    expect(exhausted.expandedCount).toBe(exhausted.steps.length);
  });


});

describe('registry', () => {
  it.each(algorithms)('maps %s to its implementation', (id, search) => {
    expect(layThuatToan(id)).toBe(search);
  });
  it('rejects an unknown runtime ID', () => {
    expect(() => layThuatToan('invalid' as AlgorithmId)).toThrowError(/.+/);
  });
});

describe('frontier priority across an open grid', () => {
  it('keeps UCS frontier in nondecreasing g order', () => {
    const result = timUCS(grid());
    for (const step of result.steps) {
      const priorities = step.frontier.map(id => {
        const [row, col] = id.split(',').map(Number);
        return row + col;
      });
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i - 1]).toBeLessThanOrEqual(priorities[i]);
      }
    }
  });

  it('keeps Greedy frontier in nondecreasing Manhattan h order', () => {
    const result = timGreedy(grid());
    for (const step of result.steps) {
      const priorities = step.frontier.map(id => {
        const [row, col] = id.split(',').map(Number);
        return Math.abs(2 - row) + Math.abs(2 - col);
      });
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i - 1]).toBeLessThanOrEqual(priorities[i]);
      }
    }
  });
});
