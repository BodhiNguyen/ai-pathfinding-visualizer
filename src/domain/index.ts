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

export function kiemTraBanDo(problem: GridProblem): void {
  if (!problem || !Number.isInteger(problem.rows) || problem.rows < 1 || problem.rows > 20 ||
      !Number.isInteger(problem.cols) || problem.cols < 1 || problem.cols > 20) {
    throw new Error('Kích thước bản đồ phải là số nguyên từ 1 đến 20');
  }
  if (!(problem.walls instanceof Set)) {
    throw new Error('Danh sách tường phải là một Set các Cell ID');
  }
  for (const wall of problem.walls) {
    kiemTraTrongLuoi(problem, docCellId(wall), 'Tường');
  }
  kiemTraTrongLuoi(problem, problem.start, 'Start');
  kiemTraTrongLuoi(problem, problem.goal, 'Goal');
  if (problem.walls.has(taoCellId(problem.start))) {
    throw new Error('Start không được nằm trên tường');
  }
  if (problem.walls.has(taoCellId(problem.goal))) {
    throw new Error('Goal không được nằm trên tường');
  }
}

export function layLangGieng(problem: GridProblem, position: Position): readonly Position[] {
  kiemTraBanDo(problem);
  kiemTraTrongLuoi(problem, position, 'Vị trí');
  if (problem.walls.has(taoCellId(position))) {
    throw new Error('Vị trí không được nằm trên tường');
  }
  const { row, col } = position;
  return [
    { row: row - 1, col }, { row, col: col + 1 },
    { row: row + 1, col }, { row, col: col - 1 },
  ].filter((neighbor) => neighbor.row >= 0 && neighbor.row < problem.rows &&
    neighbor.col >= 0 && neighbor.col < problem.cols && !problem.walls.has(taoCellId(neighbor)));
}
