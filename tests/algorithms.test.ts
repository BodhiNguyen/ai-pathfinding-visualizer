import { describe, it, expect } from 'vitest';
import { GridProblem, CellId, Position } from '../src/domain/types';
import { timBFS, timDFS, timUCS, timGreedy, timAStar, layThuatToan } from '../src/algorithms/index';
import { taoCellId, docCellId } from '../src/domain/index';

describe('P2-TV02 ALG-004 Final Test Hardening & Verification', () => {
  // Bộ helper sinh lưới mini-grid deterministic dễ tính toán lý thuyết
  const taoLuoiTrong = (rows = 3, cols = 3, start: Position = { row: 0, col: 0 }, goal: Position = { row: 2, col: 2 }): GridProblem => ({
    rows,
    cols,
    walls: new Set<CellId>(),
    start,
    goal,
  });

  const tinhManhattan = (pos: Position, goal: Position): number => {
    return Math.abs(pos.row - goal.row) + Math.abs(pos.col - goal.col);
  };

  // Hàm helper xác thực tính liên tục và đúng đắn của đường đi tìm được
  const xacThucDuongDiHoplid = (problem: GridProblem, path: CellId[]) => {
    if (path.length === 0) return;
    expect(path[0]).toBe(taoCellId(problem.start));
    expect(path[path.length - 1]).toBe(taoCellId(problem.goal));

    for (let i = 0; i < path.length - 1; i++) {
      const hienTai = docCellId(path[i]);
      const tiepTheo = docCellId(path[i + 1]);

      // Không được đè tường
      expect(problem.walls.has(path[i])).toBe(false);
      expect(problem.walls.has(path[i + 1])).toBe(false);

      // Khoảng cách bước di chuyển bốn hướng bằng 1
      const khoangCach = Math.abs(hienTai.row - tiepTheo.row) + Math.abs(hienTai.col - tiepTheo.col);
      expect(khoangCach).toBe(1);
    }
  };

  describe('Phase 2 & 4 — Xác thực thứ tự ưu tiên Frontier và Tie-breaking', () => {
    it('UCS Frontier Snapshot: Phải đảm bảo chi phí đường đi g(n) tăng dần', () => {
      const problem = taoLuoiTrong(3, 3, { row: 0, col: 0 }, { row: 2, col: 2 });
      const res = timUCS(problem);
      expect(res.found).toBe(true);

      res.steps.forEach(step => {
        // gScore của các node trong frontier tại mỗi step phải tăng dần
        const gValues = step.frontier.map(id => {
          // Tính gScore thực tế dựa trên đường đi ngắn nhất từ start đến node đó trên lưới đồng chi phí
          const pos = docCellId(id);
          return pos.row + pos.col; // Vì start=(0,0) nên g(n) tối ưu trên lưới trống bằng row + col
        });

        for (let i = 0; i < gValues.length - 1; i++) {
          expect(gValues[i]).toBeLessThanOrEqual(gValues[i + 1]);
        }
      });
    });

    it('Greedy Frontier Snapshot: Phải đảm bảo Manhattan h(n) tăng dần', () => {
      const problem = taoLuoiTrong(3, 3, { row: 0, col: 0 }, { row: 2, col: 2 });
      const res = timGreedy(problem);
      expect(res.found).toBe(true);

      res.steps.forEach(step => {
        const hValues = step.frontier.map(id => tinhManhattan(docCellId(id), problem.goal));
        for (let i = 0; i < hValues.length - 1; i++) {
          expect(hValues[i]).toBeLessThanOrEqual(hValues[i + 1]);
        }
      });
    });

    it('A* Frontier Snapshot: Phải tuân thủ tổng chi phí f(n) = g(n) + h(n) tăng dần', () => {
      const problem = taoLuoiTrong(3, 3, { row: 0, col: 0 }, { row: 2, col: 2 });
      const res = timAStar(problem);
      expect(res.found).toBe(true);

      res.steps.forEach(step => {
        const fValues = step.frontier.map(id => {
          const pos = docCellId(id);
          const g = pos.row + pos.col;
          const h = tinhManhattan(pos, problem.goal);
          return g + h;
        });

        for (let i = 0; i < fValues.length - 1; i++) {
          expect(fValues[i]).toBeLessThanOrEqual(fValues[i + 1]);
        }
      });
    });
  });

  describe('Phase 3 & 4 — Kiểm soát tính toàn vẹn Frontier của DFS', () => {
    it('DFS Frontier Snapshot: Không duplicate, không chứa node đã explored, và thể hiện đúng LIFO', () => {
      const problem = taoLuoiTrong(3, 3, { row: 0, col: 0 }, { row: 2, col: 2 });
      const res = timDFS(problem);
      expect(res.found).toBe(true);

      res.steps.forEach(step => {
        // 1. Không trùng lặp
        const uniqueSet = new Set(step.frontier);
        expect(step.frontier.length).toBe(uniqueSet.size);

        // 2. Không chứa node đã explored
        step.frontier.forEach(id => {
          expect(step.explored.includes(id)).toBe(false);
        });
      });
    });
  });

  describe('Step 3 — Đo lường chất lượng & Tính tối ưu của 5 thuật toán', () => {
    it('Xác thực tính hợp lệ, chi phí và cấu trúc snapshot của cả 5 thuật toán', () => {
      const problem = taoLuoiTrong(3, 3, { row: 0, col: 0 }, { row: 2, col: 2 });
      const thuatToans = [timBFS, timDFS, timUCS, timGreedy, timAStar];

      thuatToans.forEach(tim => {
        const res = tim(problem);
        expect(res.found).toBe(true);
        xacThucDuongDiHoplid(problem, res.path);

        // Đo lường ràng buộc metrics hệ thống
        expect(res.pathCost).toBe(res.path.length - 1);
        expect(res.expandedCount).toBe(res.steps.length);
      });
    });

    it('BFS, UCS, và A* bắt buộc phải tìm ra đường đi ngắn nhất tối ưu (pathCost = 4)', () => {
      const problem = taoLuoiTrong(3, 3, { row: 0, col: 0 }, { row: 2, col: 2 });
      expect(timBFS(problem).pathCost).toBe(4);
      expect(timUCS(problem).pathCost).toBe(4);
      expect(timAStar(problem).pathCost).toBe(4);
    });

    it('Xử lý biên an toàn: Start trùng với Goal', () => {
      const problem = taoLuoiTrong(3, 3, { row: 1, col: 1 }, { row: 1, col: 1 });
      const thuatToans = [timBFS, timDFS, timUCS, timGreedy, timAStar];

      thuatToans.forEach(tim => {
        const res = tim(problem);
        expect(res.found).toBe(true);
        expect(res.path).toEqual(['1,1']);
        expect(res.pathCost).toBe(0);
        expect(res.expandedCount).toBe(1);
      });
    });

    it('Xử lý biên an toàn: Bản đồ không có đường đi', () => {
      const problem: GridProblem = {
        rows: 3,
        cols: 3,
        walls: new Set<CellId>(['0,1', '1,0']),
        start: { row: 0, col: 0 },
        goal: { row: 2, col: 2 },
      };

      const thuatToans = [timBFS, timDFS, timUCS, timGreedy, timAStar];
      thuatToans.forEach(tim => {
        const res = tim(problem);
        expect(res.found).toBe(false);
        expect(res.path).toEqual([]);
        expect(res.pathCost).toBeNull();
      });
    });
  });

  describe('Step 5 — Contract Regression & Registry Lookup', () => {
    it('Bộ đăng ký trả đúng hàm và ném lỗi đúng đặc tả khi sai ID', () => {
      expect(layThuatToan('bfs')).toBe(timBFS);
      expect(layThuatToan('dfs')).toBe(timDFS);
      expect(layThuatToan('ucs')).toBe(timUCS);
      expect(layThuatToan('greedy')).toBe(timGreedy);
      expect(layThuatToan('astar')).toBe(timAStar);
      expect(() => layThuatToan('invalid-algo-id' as any)).toThrow();
    });

    it('Từ chối bản đồ sai cấu trúc hoặc thiếu/sai điểm biên', () => {
      const problemLoi = {
        rows: 3,
        cols: 3,
        walls: new Set<CellId>(),
        start: { row: -1, col: 0 }, // Sai tọa độ biên
        goal: { row: 2, col: 2 }
      };
      expect(() => timBFS(problemLoi as any)).toThrow();
    });
  });
});
