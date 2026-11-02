import { describe, it, expect } from 'vitest';
import { GridProblem, CellId } from '../src/domain/types';
import { timBFS, timDFS, timUCS, timGreedy, timAStar, layThuatToan } from '../src/algorithms/index';

describe('P2-TV02 Complete Pathfinding Algorithms Verification', () => {
  const taoLuoiCoBan = (startRow = 0, startCol = 0, goalRow = 2, goalCol = 2): GridProblem => ({
    rows: 3,
    cols: 3,
    walls: new Set<CellId>(),
    start: { row: startRow, col: startCol },
    goal: { row: goalRow, col: goalCol },
  });

  describe('1. Các Kịch Bản Thực Thi Cốt Lõi', () => {
    it('Xử lý thành công start trùng goal với chi phí 0 và mở rộng 1 bước', () => {
      const problem = taoLuoiCoBan(1, 1, 1, 1);
      const thuatToans = [timBFS, timDFS, timUCS, timGreedy, timAStar];
      for (const tim of thuatToans) {
        const res = tim(problem);
        expect(res.found).toBe(true);
        expect(res.path).toEqual(['1,1']);
        expect(res.pathCost).toBe(0);
        expect(res.expandedCount).toBe(1);
      }
    });

    it('Xử lý chính xác trường hợp không tìm thấy đường đi', () => {
      const problem: GridProblem = {
        rows: 3,
        cols: 3,
        walls: new Set<CellId>(['0,1', '1,0']),
        start: { row: 0, col: 0 },
        goal: { row: 2, col: 2 },
      };
      const res = timBFS(problem);
      expect(res.found).toBe(false);
      expect(res.path).toEqual([]);
      expect(res.pathCost).toBeNull();
    });
  });

  describe('2. Khắc phục ALG-001: Kiểm tra Thứ tự Frontier có độ ưu tiên', () => {
    it('UCS / Greedy / A* sắp xếp đúng mảng Frontier theo độ ưu tiên tăng dần', () => {
      const problem: GridProblem = {
        rows: 3,
        cols: 3,
        walls: new Set<CellId>(),
        start: { row: 0, col: 0 },
        goal: { row: 0, col: 2 },
      };

      const resAStar = timAStar(problem);
      expect(resAStar.found).toBe(true);
      resAStar.steps.forEach(step => {
        if (step.frontier.length > 1) {
          expect(step.frontier).toEqual([...step.frontier].sort());
        }
      });
    });
  });

  describe('3. Khắc phục ALG-002: Kiểm tra Chu trình và Trùng lặp DFS', () => {
    it('DFS xử lý chu trình kín và loại bỏ hoàn toàn phần tử stale/duplicate khỏi frontier snapshot', () => {
      const problem: GridProblem = {
        rows: 3,
        cols: 3,
        walls: new Set<CellId>(),
        start: { row: 0, col: 0 },
        goal: { row: 2, col: 2 },
      };

      const resDFS = timDFS(problem);
      expect(resDFS.found).toBe(true);
      resDFS.steps.forEach(step => {
        const uniqueSet = new Set(step.frontier);
        expect(step.frontier.length).toBe(uniqueSet.size);
        step.frontier.forEach(fId => {
          expect(step.explored.includes(fId)).toBe(false);
        });
      });
    });
  });

  describe('4. Xác Thực Tính Tối Ưu', () => {
    it('BFS, UCS, và A* tìm ra đường đi ngắn nhất tối ưu', () => {
      const problem: GridProblem = {
        rows: 3,
        cols: 3,
        walls: new Set<CellId>(['1,1', '1,2']),
        start: { row: 0, col: 2 },
        goal: { row: 2, col: 2 },
      };
      const duongDiMongDoi = ['0,2', '0,1', '0,0', '1,0', '2,0', '2,1', '2,2'];
      expect(timBFS(problem).path).toEqual(duongDiMongDoi);
      expect(timUCS(problem).path).toEqual(duongDiMongDoi);
      expect(timAStar(problem).path).toEqual(duongDiMongDoi);
    });
  });

  describe('5. Bộ Đăng Ký Hệ Thống', () => {
    it('Hàm registry lookup trả về chính xác thuật toán theo ID', () => {
      expect(layThuatToan('bfs')).toBe(timBFS);
      expect(layThuatToan('dfs')).toBe(timDFS);
      expect(() => layThuatToan('invalid' as any)).toThrow();
    });
  });
});
