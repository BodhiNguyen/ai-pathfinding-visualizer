import type { CellId, GridProblem, Position } from './types';

function kiemTraToaDo(position: Position, ten: string): void {
  if (!position || !Number.isSafeInteger(position.row) || position.row < 0 ||
      !Number.isSafeInteger(position.col) || position.col < 0) {
    throw new Error(`${ten} phải có row và col là số nguyên không âm`);
  }
}

export function taoCellId(position: Position): CellId {
  kiemTraToaDo(position, 'Tọa độ');
  return `${position.row},${position.col}`;
}

export function docCellId(cellId: CellId): Position {
  if (typeof cellId !== 'string' || !/^(0|[1-9]\d*),(0|[1-9]\d*)$/.test(cellId)) {
    throw new Error('Cell ID phải có định dạng row,col với tọa độ nguyên không âm');
  }
  const [row, col] = cellId.split(',').map(Number);
  const position = { row, col };
  kiemTraToaDo(position, 'Tọa độ trong Cell ID');
  return position;
}

function kiemTraTrongLuoi(problem: GridProblem, position: Position, ten: string): void {
  kiemTraToaDo(position, ten);
  if (position.row >= problem.rows || position.col >= problem.cols) {
    throw new Error(`${ten} phải nằm trong lưới`);
  }
}

function coTuong(walls: ReadonlySet<CellId>, cellId: CellId): boolean {
  try {
    return walls.has(cellId);
  } catch {
    throw new Error('Không thể kiểm tra Cell ID trong danh sách tường');
  }
}

export function kiemTraBanDo(problem: GridProblem): void {
  if (!problem || !Number.isInteger(problem.rows) || problem.rows < 1 || problem.rows > 20 ||
      !Number.isInteger(problem.cols) || problem.cols < 1 || problem.cols > 20) {
    throw new Error('Kích thước bản đồ phải là số nguyên từ 1 đến 20');
  }
  const walls = problem.walls;
  if (!walls || !Number.isSafeInteger(walls.size) || walls.size < 0 ||
      typeof walls.has !== 'function' || typeof walls.forEach !== 'function' ||
      typeof walls.entries !== 'function' || typeof walls.keys !== 'function' ||
      typeof walls.values !== 'function' || typeof walls[Symbol.iterator] !== 'function') {
    throw new Error('Danh sách tường phải có cấu trúc ReadonlySet các Cell ID');
  }
  try {
    for (const wall of walls) {
      kiemTraTrongLuoi(problem, docCellId(wall), 'Tường');
    }
  } catch (error) {
    throw new Error(`Không thể duyệt danh sách tường: ${error instanceof Error ? error.message : String(error)}`);
  }
  kiemTraTrongLuoi(problem, problem.start, 'Start');
  kiemTraTrongLuoi(problem, problem.goal, 'Goal');
  if (coTuong(walls, taoCellId(problem.start))) {
    throw new Error('Start không được nằm trên tường');
  }
  if (coTuong(walls, taoCellId(problem.goal))) {
    throw new Error('Goal không được nằm trên tường');
  }
}

export function layLangGieng(problem: GridProblem, position: Position): readonly Position[] {
  kiemTraBanDo(problem);
  kiemTraTrongLuoi(problem, position, 'Vị trí');
  if (coTuong(problem.walls, taoCellId(position))) {
    throw new Error('Vị trí không được nằm trên tường');
  }
  const { row, col } = position;
  return [
    { row: row - 1, col }, { row, col: col + 1 },
    { row: row + 1, col }, { row, col: col - 1 },
  ].filter((neighbor) => neighbor.row >= 0 && neighbor.row < problem.rows &&
    neighbor.col >= 0 && neighbor.col < problem.cols && !coTuong(problem.walls, taoCellId(neighbor)));
}
