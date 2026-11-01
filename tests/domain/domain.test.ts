import { describe, expect, it } from 'vitest';
import { docCellId, kiemTraBanDo, layLangGieng, taoCellId } from '../../src/domain';
import type { GridProblem, Position } from '../../src/domain/types';

const map = (changes: Partial<GridProblem> = {}): GridProblem => ({
  rows: 3, cols: 3, walls: new Set(), start: { row: 0, col: 0 },
  goal: { row: 2, col: 2 }, ...changes,
});

describe('Cell ID', () => {
  it('chuyển đổi hai chiều tọa độ nguyên không âm', () => {
    expect(taoCellId({ row: 12, col: 0 })).toBe('12,0');
    expect(docCellId('12,0')).toEqual({ row: 12, col: 0 });
  });
  it.each([{ row: -1, col: 0 }, { row: 0, col: 1.5 }, { row: NaN, col: 0 },
    { row: Infinity, col: 0 }, { row: Number.MAX_SAFE_INTEGER + 1, col: 0 }])
  ('từ chối tọa độ sai %o', (position) => {
    expect(() => taoCellId(position)).toThrowError(/tọa độ/i);
  });
  it.each(['', '1', '1,2,3', '-1,0', '1.5,0', ' 1,0', '01,0', '1,02', '1e2,0', '9007199254740992,0'])
  ('từ chối ID sai %s', (id) => {
    expect(() => docCellId(id)).toThrowError();
  });
});

describe('kiểm tra bản đồ', () => {
  it('chấp nhận kích thước biên và start trùng goal', () => {
    expect(() => kiemTraBanDo(map({ rows: 1, cols: 1, goal: { row: 0, col: 0 } }))).not.toThrow();
    expect(() => kiemTraBanDo(map({ rows: 20, cols: 20, walls: new Set(['19,19']) }))).not.toThrow();
  });
  it.each([{ rows: 0 }, { cols: 21 }, { rows: 1.5 }, { cols: -1 }, { rows: NaN }])
  ('từ chối kích thước sai %o', (changes) => {
    expect(() => kiemTraBanDo(map(changes))).toThrowError(/kích thước/i);
  });
  it.each([
    { start: { row: -1, col: 0 } }, { goal: { row: 3, col: 0 } },
    { start: { row: 0, col: 1.2 } }, { goal: { row: 0, col: 3 } },
  ])('từ chối start hoặc goal sai %o', (changes) => {
    expect(() => kiemTraBanDo(map(changes))).toThrowError(/start|goal/i);
  });
  it.each(['x,1', '3,0', '0,3', '-1,0'])('từ chối tường sai %s', (wall) => {
    expect(() => kiemTraBanDo(map({ walls: new Set([wall]) }))).toThrowError();
  });
  it.each(['0,0', '2,2'])('từ chối start hoặc goal trên tường %s', (wall) => {
    expect(() => kiemTraBanDo(map({ walls: new Set([wall]) }))).toThrowError(/tường/i);
  });
  it('từ chối tập tường không hợp lệ', () => {
    expect(() => kiemTraBanDo(map({ walls: null as unknown as ReadonlySet<string> }))).toThrowError(/tường/i);
  });
});

describe('láng giềng', () => {
  it('trả theo thứ tự lên, phải, xuống, trái', () => {
    expect(layLangGieng(map(), { row: 1, col: 1 })).toEqual([
      { row: 0, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 1 }, { row: 1, col: 0 },
    ]);
  });
  it('bỏ ô ngoài biên và tường', () => {
    expect(layLangGieng(map({ walls: new Set(['0,1']) }), { row: 0, col: 0 }))
      .toEqual([{ row: 1, col: 0 }]);
    expect(layLangGieng(map({ rows: 1, cols: 1, goal: { row: 0, col: 0 } }), { row: 0, col: 0 })).toEqual([]);
  });
  it.each([{ row: -1, col: 0 }, { row: 3, col: 0 }, { row: 0, col: 0.5 }])
  ('từ chối vị trí sai %o', (position: Position) => {
    expect(() => layLangGieng(map(), position)).toThrowError(/vị trí/i);
  });
  it('từ chối vị trí trên tường và bản đồ sai', () => {
    expect(() => layLangGieng(map({ walls: new Set(['1,1']) }), { row: 1, col: 1 })).toThrowError(/tường/i);
    expect(() => layLangGieng(map({ rows: 0 }), { row: 0, col: 0 })).toThrowError(/kích thước/i);
  });
});
