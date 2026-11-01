import { describe, expect, it } from 'vitest';
import { ALGORITHM_IDS, type GridProblem, type SearchResult } from '../src/domain/types';

describe('hợp đồng nền', () => {
  it('bao gồm đủ năm thuật toán đã duyệt', () => {
    expect(ALGORITHM_IDS).toEqual(['bfs', 'dfs', 'ucs', 'greedy', 'astar']);
  });

  it('biểu diễn được start trùng goal và kết quả một ô', () => {
    const problem: GridProblem = {
      rows: 1, cols: 1, walls: new Set(),
      start: { row: 0, col: 0 }, goal: { row: 0, col: 0 },
    };
    const result: SearchResult = {
      algorithm: 'ucs', found: true, path: ['0,0'], pathCost: 0,
      expandedCount: 1, steps: [{ current: '0,0', frontier: [], explored: ['0,0'] }],
    };
    expect(problem.start).toEqual(problem.goal);
    expect(result.pathCost).toBe(result.path.length - 1);
    expect(result.expandedCount).toBe(result.steps.length);
  });
});
