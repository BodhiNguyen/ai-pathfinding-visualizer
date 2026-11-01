export const ALGORITHM_IDS = ['bfs', 'dfs', 'ucs', 'greedy', 'astar'] as const;
export type AlgorithmId = (typeof ALGORITHM_IDS)[number];

// Cell IDs use the format `${row},${col}`.
export type CellId = string;
export type Position = Readonly<{ row: number; col: number }>;

export interface GridProblem {
  rows: number;
  cols: number;
  walls: ReadonlySet<CellId>;
  start: Position;
  goal: Position;
}

export interface SearchStep {
  current: CellId;
  frontier: readonly CellId[];
  explored: readonly CellId[];
}

export interface SearchResult {
  algorithm: AlgorithmId;
  found: boolean;
  path: readonly CellId[];
  pathCost: number | null;
  expandedCount: number;
  steps: readonly SearchStep[];
}

export type SearchAlgorithm = (problem: GridProblem) => SearchResult;

export interface MeasuredSearchResult {
  result: SearchResult;
  durationMs: number;
}
