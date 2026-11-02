import { docCellId, kiemTraBanDo, taoCellId } from '../domain';
import type { CellId, GridProblem, Position } from '../domain/types';

export const MIN_GRID_SIZE = 1;
export const MAX_GRID_SIZE = 20;
export const DEFAULT_GRID_ROWS = 10;
export const DEFAULT_GRID_COLS = 10;

export type EditToolMode = 'wall' | 'start' | 'goal';

export type GridMutationResult =
  | { readonly ok: true; readonly problem: GridProblem; readonly changed: boolean }
  | { readonly ok: false; readonly error: string };

export function cloneGridProblem(problem: GridProblem): GridProblem {
  return {
    rows: problem.rows,
    cols: problem.cols,
    walls: new Set(problem.walls),
    start: { row: problem.start.row, col: problem.start.col },
    goal: { row: problem.goal.row, col: problem.goal.col },
  };
}

export function areGridProblemsEqual(a: GridProblem, b: GridProblem): boolean {
  if (
    a.rows !== b.rows ||
    a.cols !== b.cols ||
    a.start.row !== b.start.row ||
    a.start.col !== b.start.col ||
    a.goal.row !== b.goal.row ||
    a.goal.col !== b.goal.col ||
    a.walls.size !== b.walls.size
  ) {
    return false;
  }

  for (const wall of a.walls) {
    if (!b.walls.has(wall)) {
      return false;
    }
  }

  return true;
}

function validateCellWithinBounds(problem: GridProblem, position: Position): string | null {
  if (
    !Number.isInteger(position.row) ||
    !Number.isInteger(position.col) ||
    position.row < 0 ||
    position.col < 0 ||
    position.row >= problem.rows ||
    position.col >= problem.cols
  ) {
    return 'Tọa độ ô chỉnh sửa nằm ngoài phạm vi lưới hiện tại.';
  }
  return null;
}

export function setWallInGrid(
  problem: GridProblem,
  position: Position,
  shouldBeWall: boolean,
): GridMutationResult {
  const boundsError = validateCellWithinBounds(problem, position);
  if (boundsError) {
    return { ok: false, error: boundsError };
  }

  const cellId = taoCellId(position);
  const startId = taoCellId(problem.start);
  const goalId = taoCellId(problem.goal);

  if (shouldBeWall && (cellId === startId || cellId === goalId)) {
    return {
      ok: false,
      error: 'Không thể đặt tường lên vị trí Start hoặc Goal.',
    };
  }

  const alreadyWall = problem.walls.has(cellId);
  if (alreadyWall === shouldBeWall) {
    return { ok: true, problem, changed: false };
  }

  const nextWalls = new Set(problem.walls);
  if (shouldBeWall) {
    nextWalls.add(cellId);
  } else {
    nextWalls.delete(cellId);
  }

  const nextProblem: GridProblem = {
    ...problem,
    walls: nextWalls,
  };

  try {
    kiemTraBanDo(nextProblem);
    return { ok: true, problem: nextProblem, changed: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function toggleWallInGrid(
  problem: GridProblem,
  position: Position,
): GridMutationResult {
  const boundsError = validateCellWithinBounds(problem, position);
  if (boundsError) {
    return { ok: false, error: boundsError };
  }

  const cellId = taoCellId(position);
  return setWallInGrid(problem, position, !problem.walls.has(cellId));
}

export function moveStartInGrid(
  problem: GridProblem,
  position: Position,
): GridMutationResult {
  const boundsError = validateCellWithinBounds(problem, position);
  if (boundsError) {
    return { ok: false, error: boundsError };
  }

  const cellId = taoCellId(position);
  if (problem.walls.has(cellId)) {
    return {
      ok: false,
      error: 'Không thể đặt Start lên ô tường. Hãy xóa tường tại ô này trước.',
    };
  }

  if (problem.start.row === position.row && problem.start.col === position.col) {
    return { ok: true, problem, changed: false };
  }

  const nextProblem: GridProblem = {
    ...problem,
    start: { row: position.row, col: position.col },
  };

  try {
    kiemTraBanDo(nextProblem);
    return { ok: true, problem: nextProblem, changed: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function moveGoalInGrid(
  problem: GridProblem,
  position: Position,
): GridMutationResult {
  const boundsError = validateCellWithinBounds(problem, position);
  if (boundsError) {
    return { ok: false, error: boundsError };
  }

  const cellId = taoCellId(position);
  if (problem.walls.has(cellId)) {
    return {
      ok: false,
      error: 'Không thể đặt Goal lên ô tường. Hãy xóa tường tại ô này trước.',
    };
  }

  if (problem.goal.row === position.row && problem.goal.col === position.col) {
    return { ok: true, problem, changed: false };
  }

  const nextProblem: GridProblem = {
    ...problem,
    goal: { row: position.row, col: position.col },
  };

  try {
    kiemTraBanDo(nextProblem);
    return { ok: true, problem: nextProblem, changed: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function clearWallsInGrid(problem: GridProblem): GridMutationResult {
  if (problem.walls.size === 0) {
    return { ok: true, problem, changed: false };
  }

  const nextProblem: GridProblem = {
    ...problem,
    walls: new Set<CellId>(),
  };

  try {
    kiemTraBanDo(nextProblem);
    return { ok: true, problem: nextProblem, changed: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function resizeGridProblem(
  problem: GridProblem,
  rows: number,
  cols: number,
): GridMutationResult {
  if (
    !Number.isInteger(rows) ||
    rows < MIN_GRID_SIZE ||
    rows > MAX_GRID_SIZE ||
    !Number.isInteger(cols) ||
    cols < MIN_GRID_SIZE ||
    cols > MAX_GRID_SIZE
  ) {
    return {
      ok: false,
      error: `Kích thước lưới phải là số nguyên từ ${MIN_GRID_SIZE} đến ${MAX_GRID_SIZE}.`,
    };
  }

  if (rows === problem.rows && cols === problem.cols) {
    return { ok: true, problem, changed: false };
  }

  const nextStart: Position = {
    row: Math.min(problem.start.row, rows - 1),
    col: Math.min(problem.start.col, cols - 1),
  };
  const nextGoal: Position = {
    row: Math.min(problem.goal.row, rows - 1),
    col: Math.min(problem.goal.col, cols - 1),
  };
  const startId = taoCellId(nextStart);
  const goalId = taoCellId(nextGoal);

  const nextWalls = new Set<CellId>();
  for (const wallId of problem.walls) {
    const pos = docCellId(wallId);
    if (pos.row < rows && pos.col < cols && wallId !== startId && wallId !== goalId) {
      nextWalls.add(wallId);
    }
  }

  const nextProblem: GridProblem = {
    rows,
    cols,
    walls: nextWalls,
    start: nextStart,
    goal: nextGoal,
  };

  try {
    kiemTraBanDo(nextProblem);
    return { ok: true, problem: nextProblem, changed: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
