import { AlgorithmId, CellId, GridProblem, SearchAlgorithm, SearchResult, SearchStep } from '../domain/types';
import { kiemTraBanDo, layLangGieng, taoCellId, docCellId } from '../domain/index';
function dungLaiDuongDi(chaMap: Map<CellId, CellId>, startId: CellId, goalId: CellId): CellId[] {
  const duongDi: CellId[] = [];
  let hienTai: CellId | undefined = goalId;
  while (hienTai) {
    duongDi.push(hienTai);
    if (hienTai === startId) break;
    hienTai = chaMap.get(hienTai);
  }
  return duongDi.reverse();
}
export const timBFS: SearchAlgorithm = (problem: GridProblem): SearchResult => {
  kiemTraBanDo(problem);
  const startId = taoCellId(problem.start);
  const goalId = taoCellId(problem.goal);
  const steps: SearchStep[] = [];
  const explored: CellId[] = [];
  const checkedExplored = new Set<CellId>();
  const frontier: CellId[] = [startId];
  const inFrontier = new Set<CellId>([startId]);
  const chaMap = new Map<CellId, CellId>();
  while (frontier.length > 0) {
    const currId = frontier.shift()!;
    inFrontier.delete(currId);
    explored.push(currId);
    checkedExplored.add(currId);
    if (currId !== goalId) {
      const hangXom = layLangGieng(problem, docCellId(currId));
      for (const neighborPos of hangXom) {
        const nId = taoCellId(neighborPos);
        if (!checkedExplored.has(nId) && !inFrontier.has(nId)) {
          chaMap.set(nId, currId);
          frontier.push(nId);
          inFrontier.add(nId);
        }
      }
    }
    steps.push({
      current: currId,
      frontier: [...frontier],
      explored: [...explored]
    });
    if (currId === goalId) {
      const path = dungLaiDuongDi(chaMap, startId, goalId);
      return {
        algorithm: 'bfs',
        found: true,
        path,
        pathCost: path.length - 1,
        expandedCount: steps.length,
        steps
      };
    }
  }
  return {
    algorithm: 'bfs',
    found: false,
    path: [],
    pathCost: null,
    expandedCount: steps.length,
    steps
  };
};
export const timDFS: SearchAlgorithm = (problem: GridProblem): SearchResult => {
  kiemTraBanDo(problem);
  const startId = taoCellId(problem.start);
  const goalId = taoCellId(problem.goal);
  const steps: SearchStep[] = [];
  const explored: CellId[] = [];
  const checkedExplored = new Set<CellId>();
  let frontierStack: CellId[] = [startId];
  const chaMap = new Map<CellId, CellId>();
  while (frontierStack.length > 0) {
    const currId = frontierStack.pop()!;
    if (checkedExplored.has(currId)) continue;
    explored.push(currId);
    checkedExplored.add(currId);
    if (currId !== goalId) {
      const hangXom = layLangGieng(problem, docCellId(currId));
      for (let i = hangXom.length - 1; i >= 0; i--) {
        const nId = taoCellId(hangXom[i]);
        if (!checkedExplored.has(nId)) {
          chaMap.set(nId, currId);
          frontierStack.push(nId);
        }
      }
    }
    const locFrontier: CellId[] = [];
    const daXetTrongFrontier = new Set<CellId>();
    for (let i = frontierStack.length - 1; i >= 0; i--) {
      const id = frontierStack[i];
      if (!checkedExplored.has(id) && !daXetTrongFrontier.has(id)) {
        locFrontier.push(id);
        daXetTrongFrontier.add(id);
      }
    }
    steps.push({
      current: currId,
      frontier: locFrontier,
      explored: [...explored]
    });
    if (currId === goalId) {
      const path = dungLaiDuongDi(chaMap, startId, goalId);
      return {
        algorithm: 'dfs',
        found: true,
        path,
        pathCost: path.length - 1,
        expandedCount: steps.length,
        steps
      };
    }
  }
  return {
    algorithm: 'dfs',
    found: false,
    path: [],
    pathCost: null,
    expandedCount: steps.length,
    steps
  };
};
interface PriorityItem {
  id: CellId;
  priority: number;
  sequence: number;
}
function timKiemUuTien(problem: GridProblem, algoId: 'ucs' | 'greedy' | 'astar'): SearchResult {
  kiemTraBanDo(problem);
  const startId = taoCellId(problem.start);
  const goalId = taoCellId(problem.goal);
  const steps: SearchStep[] = [];
  const explored: CellId[] = [];
  const checkedExplored = new Set<CellId>();
  let orderSequence = 0;
  const tinhH = (id: CellId) => {
    const pos = docCellId(id);
    return Math.abs(pos.row - problem.goal.row) + Math.abs(pos.col - problem.goal.col);
  };
  const gScore = new Map<CellId, number>();
  gScore.set(startId, 0);
  const layDoUuTien = (id: CellId, g: number): number => {
    if (algoId === 'ucs') return g;
    if (algoId === 'greedy') return tinhH(id);
    return g + tinhH(id);
  };
  let frontier: PriorityItem[] = [{
    id: startId,
    priority: layDoUuTien(startId, 0),
    sequence: orderSequence++
  }];
  const chaMap = new Map<CellId, CellId>();
  while (frontier.length > 0) {
    frontier.sort((a, b) => a.priority - b.priority || a.sequence - b.sequence);
    const hienTai = frontier.shift()!;
    const currId = hienTai.id;
    if (checkedExplored.has(currId)) continue;
    explored.push(currId);
    checkedExplored.add(currId);
    if (currId !== goalId) {
      const hangXom = layLangGieng(problem, docCellId(currId));
      const currG = gScore.get(currId)!;
      for (const neighborPos of hangXom) {
        const nId = taoCellId(neighborPos);
        const tiepG = currG + 1;
        if (checkedExplored.has(nId)) continue;
        if (!gScore.has(nId) || tiepG < gScore.get(nId)!) {
          gScore.set(nId, tiepG);
          chaMap.set(nId, currId);
          frontier = frontier.filter(item => item.id !== nId);
          frontier.push({
            id: nId,
            priority: layDoUuTien(nId, tiepG),
            sequence: orderSequence++
          });
        }
      }
    }
    frontier.sort((a, b) => a.priority - b.priority || a.sequence - b.sequence);
    steps.push({
      current: currId,
      frontier: frontier.map(item => item.id),
      explored: [...explored]
    });
    if (currId === goalId) {
      const path = dungLaiDuongDi(chaMap, startId, goalId);
      return {
        algorithm: algoId,
        found: true,
        path,
        pathCost: path.length - 1,
        expandedCount: steps.length,
        steps
      };
    }
  }
  return {
    algorithm: algoId,
    found: false,
    path: [],
    pathCost: null,
    expandedCount: steps.length,
    steps
  };
}
export const timUCS: SearchAlgorithm = (problem: GridProblem) => timKiemUuTien(problem, 'ucs');
export const timGreedy: SearchAlgorithm = (problem: GridProblem) => timKiemUuTien(problem, 'greedy');
export const timAStar: SearchAlgorithm = (problem: GridProblem) => timKiemUuTien(problem, 'astar');
export function layThuatToan(algorithmId: AlgorithmId): SearchAlgorithm {
  switch (algorithmId) {
    case 'bfs': return timBFS;
    case 'dfs': return timDFS;
    case 'ucs': return timUCS;
    case 'greedy': return timGreedy;
    case 'astar': return timAStar;
    default: {
      const _check: any = algorithmId;
      throw new Error(`ID thuật toán không hợp lệ: ${_check}`);
    }
  }
}
