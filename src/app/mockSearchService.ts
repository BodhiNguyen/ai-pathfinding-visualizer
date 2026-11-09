import { kiemTraBanDo, layLangGieng, taoCellId } from '../domain';
import {
  ALGORITHM_IDS,
  type AlgorithmId,
  type GridProblem,
  type MeasuredSearchResult,
  type SearchResult,
  type SearchStep,
} from '../domain/types';
import { areGridProblemsEqual, cloneGridProblem } from './gridState';

export type SearchExecutor = (
  problem: GridProblem,
  algorithm: AlgorithmId,
) => MeasuredSearchResult;

export type MockScenarioId = 'success' | 'no-path' | 'start-goal-same';

export interface MockScenarioPreset {
  readonly id: MockScenarioId;
  readonly label: string;
  readonly description: string;
  readonly createProblem: () => GridProblem;
}

/**
 * Thrown only in standalone P2-03 mock mode when the user edits the grid into a
 * custom layout that is valid (`kiemTraBanDo` passes) yet requires real graph
 * search from `src/algorithms` (to avoid implementing fake pathfinding in UI).
 */
export class MockCustomMapNoticeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MockCustomMapNoticeError';
  }
}

/**
 * Bản đồ mặc định 10×10 cho kịch bản tìm thấy đường:
 * Khu vực mở 3×3 ở góc trên-trái có trụ tường (1,1) tạo 2 nhánh:
 * - Nhánh dưới tối ưu (chi phí 3): 0,0 -> 1,0 -> 2,0 -> 2,1 (BFS, UCS, Greedy, A*)
 * - Nhánh phải-trên dài hơn (chi phí 5): 0,0 -> 0,1 -> 0,2 -> 1,2 -> 2,2 -> 2,1 (DFS)
 */
const SUCCESS_BASE_PROBLEM: GridProblem = {
  rows: 10,
  cols: 10,
  walls: new Set(['0,3', '1,1', '1,3', '2,3', '3,0', '3,1', '3,2']),
  start: { row: 0, col: 0 },
  goal: { row: 2, col: 1 },
};

/**
 * Bản đồ 10×10 cho kịch bản không có đường đi:
 * Start (0,0) chỉ thông với (0,1) và (1,0), bị tường (0,2), (1,1), (2,0) khóa kín.
 */
const NO_PATH_BASE_PROBLEM: GridProblem = {
  rows: 10,
  cols: 10,
  walls: new Set(['0,2', '1,1', '2,0']),
  start: { row: 0, col: 0 },
  goal: { row: 2, col: 1 },
};

/**
 * Bản đồ 10×10 cho kịch bản Start trùng Goal tại (1,1):
 * Kết quả hợp đồng gồm đúng 1 ô, chi phí 0 và 1 snapshot mở rộng.
 */
const SAME_START_GOAL_BASE_PROBLEM: GridProblem = {
  rows: 10,
  cols: 10,
  walls: new Set(['0,3', '1,3', '2,3']),
  start: { row: 1, col: 1 },
  goal: { row: 1, col: 1 },
};

export function createDefaultGridProblem(): GridProblem {
  return cloneGridProblem(SUCCESS_BASE_PROBLEM);
}

export function createNoPathGridProblem(): GridProblem {
  return cloneGridProblem(NO_PATH_BASE_PROBLEM);
}

export function createSameStartGoalGridProblem(): GridProblem {
  return cloneGridProblem(SAME_START_GOAL_BASE_PROBLEM);
}

export const MOCK_SCENARIO_PRESETS: readonly MockScenarioPreset[] = [
  {
    id: 'success',
    label: 'Mặc định 10×10 — Có đường đi',
    description:
      'Bản đồ 10×10 có vật cản phân nhánh: BFS/UCS/A* đạt chi phí tối ưu 3, DFS đi nhánh vòng chi phí 5.',
    createProblem: createDefaultGridProblem,
  },
  {
    id: 'no-path',
    label: 'Bản đồ 10×10 — Không có đường',
    description:
      'Start (0,0) bị tường bao kín sau 3 ô liên thông; thuật toán kết thúc với found=false, path=[], pathCost=null.',
    createProblem: createNoPathGridProblem,
  },
  {
    id: 'start-goal-same',
    label: 'Bản đồ 10×10 — Start trùng Goal',
    description:
      'Start và Goal cùng ở (1,1); trả về đường 1 ô, pathCost=0 và đúng 1 snapshot mở rộng.',
    createProblem: createSameStartGoalGridProblem,
  },
];

export function detectMatchingMockScenario(problem: GridProblem): MockScenarioId | null {
  if (problem.start.row === problem.goal.row && problem.start.col === problem.goal.col) {
    return 'start-goal-same';
  }
  if (areGridProblemsEqual(problem, SUCCESS_BASE_PROBLEM)) {
    return 'success';
  }
  if (areGridProblemsEqual(problem, NO_PATH_BASE_PROBLEM)) {
    return 'no-path';
  }
  return null;
}

const SUCCESS_STEPS_BFS_UCS: readonly SearchStep[] = [
  { current: '0,0', frontier: ['0,1', '1,0'], explored: ['0,0'] },
  { current: '0,1', frontier: ['1,0', '0,2'], explored: ['0,0', '0,1'] },
  { current: '1,0', frontier: ['0,2', '2,0'], explored: ['0,0', '0,1', '1,0'] },
  { current: '0,2', frontier: ['2,0', '1,2'], explored: ['0,0', '0,1', '1,0', '0,2'] },
  { current: '2,0', frontier: ['1,2', '2,1'], explored: ['0,0', '0,1', '1,0', '0,2', '2,0'] },
  {
    current: '1,2',
    frontier: ['2,1', '2,2'],
    explored: ['0,0', '0,1', '1,0', '0,2', '2,0', '1,2'],
  },
  {
    current: '2,1',
    frontier: ['2,2'],
    explored: ['0,0', '0,1', '1,0', '0,2', '2,0', '1,2', '2,1'],
  },
];

const SUCCESS_STEPS_DFS: readonly SearchStep[] = [
  { current: '0,0', frontier: ['0,1', '1,0'], explored: ['0,0'] },
  { current: '0,1', frontier: ['0,2', '1,0'], explored: ['0,0', '0,1'] },
  { current: '0,2', frontier: ['1,2', '1,0'], explored: ['0,0', '0,1', '0,2'] },
  { current: '1,2', frontier: ['2,2', '1,0'], explored: ['0,0', '0,1', '0,2', '1,2'] },
  { current: '2,2', frontier: ['2,1', '1,0'], explored: ['0,0', '0,1', '0,2', '1,2', '2,2'] },
  {
    current: '2,1',
    frontier: ['1,0'],
    explored: ['0,0', '0,1', '0,2', '1,2', '2,2', '2,1'],
  },
];

const SUCCESS_STEPS_GREEDY_ASTAR: readonly SearchStep[] = [
  { current: '0,0', frontier: ['0,1', '1,0'], explored: ['0,0'] },
  { current: '0,1', frontier: ['1,0', '0,2'], explored: ['0,0', '0,1'] },
  { current: '1,0', frontier: ['2,0', '0,2'], explored: ['0,0', '0,1', '1,0'] },
  { current: '2,0', frontier: ['2,1', '0,2'], explored: ['0,0', '0,1', '1,0', '2,0'] },
  { current: '2,1', frontier: ['0,2'], explored: ['0,0', '0,1', '1,0', '2,0', '2,1'] },
];

const MOCK_DURATION_MS: Readonly<Record<AlgorithmId, number>> = {
  bfs: 0.18,
  dfs: 0.14,
  ucs: 0.25,
  greedy: 0.16,
  astar: 0.21,
};

function cloneSteps(steps: readonly SearchStep[]): SearchStep[] {
  return steps.map((step) => ({
    current: step.current,
    frontier: [...step.frontier],
    explored: [...step.explored],
  }));
}

export function createSuccessMock(algorithm: AlgorithmId): MeasuredSearchResult {
  let result: SearchResult;

  switch (algorithm) {
    case 'bfs':
    case 'ucs': {
      const steps = cloneSteps(SUCCESS_STEPS_BFS_UCS);
      result = {
        algorithm,
        found: true,
        path: ['0,0', '1,0', '2,0', '2,1'],
        pathCost: 3,
        expandedCount: steps.length,
        steps,
      };
      break;
    }
    case 'dfs': {
      const steps = cloneSteps(SUCCESS_STEPS_DFS);
      result = {
        algorithm,
        found: true,
        path: ['0,0', '0,1', '0,2', '1,2', '2,2', '2,1'],
        pathCost: 5,
        expandedCount: steps.length,
        steps,
      };
      break;
    }
    case 'greedy':
    case 'astar': {
      const steps = cloneSteps(SUCCESS_STEPS_GREEDY_ASTAR);
      result = {
        algorithm,
        found: true,
        path: ['0,0', '1,0', '2,0', '2,1'],
        pathCost: 3,
        expandedCount: steps.length,
        steps,
      };
      break;
    }
  }

  return {
    result,
    durationMs: MOCK_DURATION_MS[algorithm],
  };
}

const NO_PATH_STEPS: readonly SearchStep[] = [
  { current: '0,0', frontier: ['0,1', '1,0'], explored: ['0,0'] },
  { current: '0,1', frontier: ['1,0'], explored: ['0,0', '0,1'] },
  { current: '1,0', frontier: [], explored: ['0,0', '0,1', '1,0'] },
];

export function createNoPathMock(algorithm: AlgorithmId): MeasuredSearchResult {
  const steps = cloneSteps(NO_PATH_STEPS);
  return {
    result: {
      algorithm,
      found: false,
      path: [],
      pathCost: null,
      expandedCount: steps.length,
      steps,
    },
    durationMs: Number((MOCK_DURATION_MS[algorithm] * 0.75).toFixed(2)),
  };
}

export function createStartEqualsGoalMock(
  problem: GridProblem,
  algorithm: AlgorithmId,
): MeasuredSearchResult {
  kiemTraBanDo(problem);
  if (problem.start.row !== problem.goal.row || problem.start.col !== problem.goal.col) {
    throw new Error('createStartEqualsGoalMock yêu cầu vị trí Start trùng Goal.');
  }

  const cellId = taoCellId(problem.start);
  const steps: SearchStep[] = [
    {
      current: cellId,
      frontier: [],
      explored: [cellId],
    },
  ];

  return {
    result: {
      algorithm,
      found: true,
      path: [cellId],
      pathCost: 0,
      expandedCount: 1,
      steps,
    },
    durationMs: 0.05,
  };
}

function createIsolatedStartNoPathMock(
  problem: GridProblem,
  algorithm: AlgorithmId,
): MeasuredSearchResult {
  const startId = taoCellId(problem.start);
  const steps: SearchStep[] = [
    {
      current: startId,
      frontier: [],
      explored: [startId],
    },
  ];

  return {
    result: {
      algorithm,
      found: false,
      path: [],
      pathCost: null,
      expandedCount: 1,
      steps,
    },
    durationMs: 0.06,
  };
}

export function runMockSearch(
  problem: GridProblem,
  algorithm: AlgorithmId,
): MeasuredSearchResult {
  if (!ALGORITHM_IDS.includes(algorithm)) {
    throw new Error(`Thuật toán không hợp lệ: ${String(algorithm)}`);
  }

  // Luôn xác thực đầu vào bằng domain thật trước khi trả dữ liệu mock.
  kiemTraBanDo(problem);

  if (problem.start.row === problem.goal.row && problem.start.col === problem.goal.col) {
    return createStartEqualsGoalMock(problem, algorithm);
  }

  if (areGridProblemsEqual(problem, SUCCESS_BASE_PROBLEM)) {
    return createSuccessMock(algorithm);
  }

  if (areGridProblemsEqual(problem, NO_PATH_BASE_PROBLEM)) {
    return createNoPathMock(algorithm);
  }

  // Trường hợp Start bị bao kín hoàn toàn ngay bước đầu (0 láng giềng hợp lệ):
  // kết quả 1 bước xác định theo hợp đồng mà không cần chạy bất kỳ thuật toán duyệt nào.
  if (layLangGieng(problem, problem.start).length === 0) {
    return createIsolatedStartNoPathMock(problem, algorithm);
  }

  throw new MockCustomMapNoticeError(
    'Bản đồ tùy chỉnh đã hợp lệ, nhưng giao diện P2-03 không chạy thuật toán giả trên lưới tự do. Hãy chọn một trong 3 kịch bản Mock mẫu phía trên (hoặc đặt Start trùng Goal / bao kín Start bằng tường) để phát lại snapshot hợp đồng; thuật toán thật sẽ được nối ở P2-04.',
  );
}

export function runAllAlgorithmsComparison(
  problem: GridProblem,
  executor: SearchExecutor = runMockSearch,
): Record<AlgorithmId, MeasuredSearchResult> {
  // Capture once, then isolate each invocation even from a mutating executor.
  const snapshot: GridProblem = {
    rows: problem.rows, cols: problem.cols,
    start: { ...problem.start }, goal: { ...problem.goal },
    walls: new Set(problem.walls),
  };
  const entries = ALGORITHM_IDS.map((algorithmId) => [algorithmId, executor({
    rows: snapshot.rows, cols: snapshot.cols,
    start: { ...snapshot.start }, goal: { ...snapshot.goal },
    walls: new Set(snapshot.walls),
  }, algorithmId)] as const);
  return Object.fromEntries(entries) as Record<AlgorithmId, MeasuredSearchResult>;
}
