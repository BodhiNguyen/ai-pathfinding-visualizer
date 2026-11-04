import { describe, expect, it, vi } from 'vitest';
import type { Position } from '../../src/domain/types';
import {
  activateCellByKeyboard,
  beginCellMouseDrag,
  continueCellMouseDrag,
  type GridCellActionCallbacks,
} from '../../src/components/GridCanvas';

function createRecordedCallbacks() {
  const toggled: Position[] = [];
  const painted: Array<{ position: Position; shouldBeWall: boolean }> = [];
  const placedStart: Position[] = [];
  const placedGoal: Position[] = [];

  const callbacks: GridCellActionCallbacks = {
    onToggleWall: vi.fn((pos: Position) => toggled.push(pos)),
    onPaintWall: vi.fn((pos: Position, shouldBeWall: boolean) =>
      painted.push({ position: pos, shouldBeWall }),
    ),
    onPlaceStart: vi.fn((pos: Position) => placedStart.push(pos)),
    onPlaceGoal: vi.fn((pos: Position) => placedGoal.push(pos)),
  };

  return { callbacks, toggled, painted, placedStart, placedGoal };
}

describe('GridCanvas interactions — FRONTEND-001 regression (keyboard vs mouse drag)', () => {
  it('Enter và Space chỉ bật/tắt đúng ô đang focus, giữ dragPaintValue = null và không tự vẽ khi di chuột sau đó', () => {
    const { callbacks, toggled, painted } = createRecordedCallbacks();

    // Focus ô (4,4) và nhấn Enter ở chế độ vẽ tường
    const enterOutcome = activateCellByKeyboard(
      'Enter',
      { row: 4, col: 4 },
      'wall',
      callbacks,
    );
    expect(enterOutcome).toEqual({ handled: true, nextDragPaintValue: null });
    expect(toggled).toEqual([{ row: 4, col: 4 }]);

    // Di chuột qua các ô lân cận không giữ nút chuột (mouseButtons = 0)
    const hoverAfterEnter1 = continueCellMouseDrag(
      { row: 4, col: 5 },
      'wall',
      enterOutcome.nextDragPaintValue,
      0,
      callbacks,
    );
    const hoverAfterEnter2 = continueCellMouseDrag(
      { row: 4, col: 6 },
      'wall',
      hoverAfterEnter1,
      0,
      callbacks,
    );

    expect(hoverAfterEnter1).toBeNull();
    expect(hoverAfterEnter2).toBeNull();
    expect(painted).toEqual([]);

    // Tương tự với phím Space trên ô (5,5)
    const spaceOutcome = activateCellByKeyboard(
      ' ',
      { row: 5, col: 5 },
      'wall',
      callbacks,
    );
    expect(spaceOutcome).toEqual({ handled: true, nextDragPaintValue: null });
    expect(toggled).toEqual([
      { row: 4, col: 4 },
      { row: 5, col: 5 },
    ]);

    continueCellMouseDrag(
      { row: 5, col: 6 },
      'wall',
      spaceOutcome.nextDragPaintValue,
      0,
      callbacks,
    );
    expect(painted).toEqual([]);
  });

  it('phím khác ngoài Enter/Space không kích hoạt thao tác ô; chế độ start/goal chỉ đặt một lần', () => {
    const { callbacks, toggled, placedStart, placedGoal } = createRecordedCallbacks();

    const tabOutcome = activateCellByKeyboard(
      'Tab',
      { row: 1, col: 1 },
      'wall',
      callbacks,
    );
    expect(tabOutcome.handled).toBe(false);
    expect(toggled).toEqual([]);

    // Nhấn giữ phím (key auto-repeat = true) vẫn chặn hành vi mặc định nhưng không bật/tắt lặp lại liên tục
    const repeatOutcome = activateCellByKeyboard(
      ' ',
      { row: 1, col: 1 },
      'wall',
      callbacks,
      true,
    );
    expect(repeatOutcome).toEqual({ handled: true, nextDragPaintValue: null });
    expect(toggled).toEqual([]);

    activateCellByKeyboard('Enter', { row: 2, col: 3 }, 'start', callbacks);
    activateCellByKeyboard(' ', { row: 6, col: 7 }, 'goal', callbacks);

    expect(placedStart).toEqual([{ row: 2, col: 3 }]);
    expect(placedGoal).toEqual([{ row: 6, col: 7 }]);
  });

  it('kéo chuột trái liên tiếp vẽ/xóa tường bình thường và tự ngắt khi nhả nút chuột', () => {
    const { callbacks, toggled, painted } = createRecordedCallbacks();

    // Chuột phải (button = 2) bị bỏ qua
    expect(
      beginCellMouseDrag({ row: 0, col: 1, isWall: false }, 'wall', 2, callbacks),
    ).toBeNull();
    expect(toggled).toEqual([]);

    // Nhấn chuột trái lên ô trống (4,1) -> bật tường và bắt đầu drag với shouldBeWall = true
    let dragValue = beginCellMouseDrag(
      { row: 4, col: 1, isWall: false },
      'wall',
      0,
      callbacks,
    );
    expect(dragValue).toBe(true);
    expect(toggled).toEqual([{ row: 4, col: 1 }]);

    // Kéo chuột qua (4,2) và (4,3) khi đang giữ chuột trái (buttons = 1)
    dragValue = continueCellMouseDrag(
      { row: 4, col: 2 },
      'wall',
      dragValue,
      1,
      callbacks,
    );
    dragValue = continueCellMouseDrag(
      { row: 4, col: 3 },
      'wall',
      dragValue,
      1,
      callbacks,
    );
    expect(dragValue).toBe(true);
    expect(painted).toEqual([
      { position: { row: 4, col: 2 }, shouldBeWall: true },
      { position: { row: 4, col: 3 }, shouldBeWall: true },
    ]);

    // Nếu nhả chuột ngoài cửa sổ rồi đưa chuột vào (buttons = 0), tự động hủy drag và không vẽ tiếp
    dragValue = continueCellMouseDrag(
      { row: 4, col: 4 },
      'wall',
      dragValue,
      0,
      callbacks,
    );
    expect(dragValue).toBeNull();
    expect(painted).toHaveLength(2);
  });
});
