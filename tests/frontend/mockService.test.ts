import { describe, expect, it } from 'vitest';
import { docCellId, kiemTraBanDo, layLangGieng, taoCellId } from '../../src/domain';
import {
  ALGORITHM_IDS,
  type GridProblem,
  type MeasuredSearchResult,
} from '../../src/domain/types';
import {
  ALGORITHM_METADATA,
  ORDERED_ALGORITHMS,
} from '../../src/app/algorithmInfo';
import {
  DEFAULT_GRID_COLS,
  DEFAULT_GRID_ROWS,
  clearWallsInGrid,
  moveGoalInGrid,
  moveStartInGrid,
  resizeGridProblem,
  setWallInGrid,
  toggleWallInGrid,
} from '../../src/app/gridState';
import {
  MockCustomMapNoticeError,
  createDefaultGridProblem,
  createNoPathGridProblem,
  createSameStartGoalGridProblem,
  runAllAlgorithmsComparison,
  runMockSearch,
} from '../../src/app/mockSearchService';

function assertContractCompliantResult(
  problem: GridProblem,
  measured: MeasuredSearchResult,
): void {
  expect(measured.durationMs).toBeGreaterThanOrEqual(0);
  expect('durationMs' in measured.result).toBe(false);

  const { result } = measured;
  expect(result.expandedCount).toBe(result.steps.length);

  for (const step of result.steps) {
    expect(problem.walls.has(step.current)).toBe(false);
    expect(step.explored).toContain(step.current);
    for (const fId of step.frontier) {
      expect(problem.walls.has(fId)).toBe(false);
    }
    for (const eId of step.explored) {
      expect(problem.walls.has(eId)).toBe(false);
    }
  }

  if (result.found) {
    expect(result.path.length).toBeGreaterThanOrEqual(1);
    expect(result.path[0]).toBe(taoCellId(problem.start));
    expect(result.path[result.path.length - 1]).toBe(taoCellId(problem.goal));
    expect(result.pathCost).toBe(result.path.length - 1);

    for (let i = 0; i < result.path.length - 1; i += 1) {
      const fromPos = docCellId(result.path[i]);
      const neighbors = layLangGieng(problem, fromPos).map(taoCellId);
      expect(neighbors).toContain(result.path[i + 1]);
    }
  } else {
    expect(result.path).toEqual([]);
    expect(result.pathCost).toBeNull();
  }
}

describe('mockSearchService — tuân thủ hợp đồng SearchResult & MeasuredSearchResult', () => {
  it('kịch bản mặc định 10×10: cả 5 thuật toán hợp lệ, BFS/UCS/A* tối ưu (3), DFS không tối ưu (5)', () => {
    const problem = createDefaultGridProblem();
    expect(problem.rows).toBe(DEFAULT_GRID_ROWS);
    expect(problem.cols).toBe(DEFAULT_GRID_COLS);
    expect(() => kiemTraBanDo(problem)).not.toThrow();

    const comparison = runAllAlgorithmsComparison(problem);
    for (const id of ALGORITHM_IDS) {
      expect(comparison[id].result.algorithm).toBe(id);
      assertContractCompliantResult(problem, comparison[id]);
      expect(comparison[id].result.found).toBe(true);
    }

    expect(comparison.bfs.result.pathCost).toBe(3);
    expect(comparison.ucs.result.pathCost).toBe(3);
    expect(comparison.astar.result.pathCost).toBe(3);
    expect(comparison.greedy.result.pathCost).toBe(3);
    expect(comparison.dfs.result.pathCost).toBe(5);
    expect(comparison.astar.result.expandedCount).toBeLessThan(
      comparison.bfs.result.expandedCount,
    );
  });

  it('kịch bản không có đường: cả 5 thuật toán trả found=false, path=[], pathCost=null', () => {
    const problem = createNoPathGridProblem();
    const comparison = runAllAlgorithmsComparison(problem);

    for (const id of ALGORITHM_IDS) {
      assertContractCompliantResult(problem, comparison[id]);
      expect(comparison[id].result.found).toBe(false);
      expect(comparison[id].result.path).toEqual([]);
      expect(comparison[id].result.pathCost).toBeNull();
      expect(comparison[id].result.expandedCount).toBe(3);
    }
  });

  it('kịch bản Start trùng Goal trên cả lưới 10×10 và 1×1: 1 ô, pathCost=0, expandedCount=1', () => {
    const presetSame = createSameStartGoalGridProblem();
    const oneByOne: GridProblem = {
      rows: 1,
      cols: 1,
      walls: new Set(),
      start: { row: 0, col: 0 },
      goal: { row: 0, col: 0 },
    };

    for (const grid of [presetSame, oneByOne]) {
      const comparison = runAllAlgorithmsComparison(grid);
      for (const id of ALGORITHM_IDS) {
        assertContractCompliantResult(grid, comparison[id]);
        expect(comparison[id].result.found).toBe(true);
        expect(comparison[id].result.path).toEqual([taoCellId(grid.start)]);
        expect(comparison[id].result.pathCost).toBe(0);
        expect(comparison[id].result.expandedCount).toBe(1);
      }
    }
  });

  it('từ chối đầu vào sai bằng Error mô tả, không biến thành kết quả không có đường', () => {
    const invalidSize: GridProblem = {
      rows: 25,
      cols: 10,
      walls: new Set(),
      start: { row: 0, col: 0 },
      goal: { row: 1, col: 1 },
    };
    const startOnWall: GridProblem = {
      rows: 5,
      cols: 5,
      walls: new Set(['0,0']),
      start: { row: 0, col: 0 },
      goal: { row: 2, col: 2 },
    };

    expect(() => runMockSearch(invalidSize, 'bfs')).toThrowError(/kích thước/i);
    expect(() => runMockSearch(startOnWall, 'astar')).toThrowError(/start/i);
  });

  it('bản đồ tùy chỉnh tự do báo MockCustomMapNoticeError thay vì chạy thuật toán giả', () => {
    const customOpenMap: GridProblem = {
      rows: 6,
      cols: 6,
      walls: new Set(),
      start: { row: 0, col: 0 },
      goal: { row: 5, col: 5 },
    };

    expect(() => runMockSearch(customOpenMap, 'bfs')).toThrow(MockCustomMapNoticeError);
  });
});

describe('gridState & algorithmInfo — chỉnh sửa lưới an toàn và thông tin FR06', () => {
  it('ngăn đặt tường lên Start/Goal và ngăn đặt Start/Goal lên tường; cho phép Start trùng Goal', () => {
    const base = createDefaultGridProblem(); // Start (0,0), Goal (2,1), tường có '1,1'

    const wallOnStart = setWallInGrid(base, { row: 0, col: 0 }, true);
    expect(wallOnStart.ok).toBe(false);

    const wallOnGoal = toggleWallInGrid(base, { row: 2, col: 1 });
    expect(wallOnGoal.ok).toBe(false);

    const startOnWall = moveStartInGrid(base, { row: 1, col: 1 });
    expect(startOnWall.ok).toBe(false);

    const goalOnWall = moveGoalInGrid(base, { row: 1, col: 1 });
    expect(goalOnWall.ok).toBe(false);

    const startEqualsGoal = moveStartInGrid(base, { row: 2, col: 1 });
    expect(startEqualsGoal.ok).toBe(true);
    if (startEqualsGoal.ok) {
      expect(startEqualsGoal.problem.start).toEqual({ row: 2, col: 1 });
      expect(() => kiemTraBanDo(startEqualsGoal.problem)).not.toThrow();
    }
  });

  it('cho phép đổi kích thước 1–20, tự thu gọn Start/Goal/tường hợp lệ và từ chối ngoài biên', () => {
    const base = createDefaultGridProblem();

    expect(resizeGridProblem(base, 0, 10).ok).toBe(false);
    expect(resizeGridProblem(base, 10, 21).ok).toBe(false);

    const shrunk = resizeGridProblem(base, 1, 1);
    expect(shrunk.ok).toBe(true);
    if (shrunk.ok) {
      expect(shrunk.problem.rows).toBe(1);
      expect(shrunk.problem.cols).toBe(1);
      expect(shrunk.problem.start).toEqual({ row: 0, col: 0 });
      expect(shrunk.problem.goal).toEqual({ row: 0, col: 0 });
      expect(shrunk.problem.walls.size).toBe(0);
    }

    const expanded = resizeGridProblem(base, 20, 20);
    expect(expanded.ok).toBe(true);
    if (expanded.ok) {
      const cleared = clearWallsInGrid(expanded.problem);
      expect(cleared.ok).toBe(true);
      if (cleared.ok) {
        expect(cleared.problem.walls.size).toBe(0);
      }
    }
  });

  it('bao phủ đủ thông tin giải thích và tính tối ưu cho cả 5 thuật toán (FR06)', () => {
    expect(ORDERED_ALGORITHMS.map((a) => a.id)).toEqual([...ALGORITHM_IDS]);
    expect(ALGORITHM_METADATA.bfs.isOptimalOnUnitGrid).toBe(true);
    expect(ALGORITHM_METADATA.ucs.isOptimalOnUnitGrid).toBe(true);
    expect(ALGORITHM_METADATA.astar.isOptimalOnUnitGrid).toBe(true);
    expect(ALGORITHM_METADATA.dfs.isOptimalOnUnitGrid).toBe(false);
    expect(ALGORITHM_METADATA.greedy.isOptimalOnUnitGrid).toBe(false);
  });
});
