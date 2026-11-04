import { describe, expect, it } from 'vitest';
import {
  createDefaultGridProblem,
  createNoPathGridProblem,
  createNoPathMock,
  createSameStartGoalGridProblem,
  createStartEqualsGoalMock,
  createSuccessMock,
} from '../../src/app/mockSearchService';
import {
  MAX_PLAYBACK_SPEED_MS,
  MIN_PLAYBACK_SPEED_MS,
  createInitialPlaybackState,
  deriveCellVisualInfo,
  deriveGridVisualMatrix,
  derivePlaybackSnapshot,
  playbackReducer,
} from '../../src/app/playbackState';

describe('playbackState — vòng đời Step, Play/Pause, Reset và chỉnh sửa bản đồ', () => {
  it('khởi tạo ở trạng thái IDLE chưa có current, frontier, explored hay path', () => {
    const initial = createInitialPlaybackState();
    const view = derivePlaybackSnapshot(initial);

    expect(initial.status).toBe('IDLE');
    expect(initial.isPlaying).toBe(false);
    expect(initial.stepIndex).toBe(-1);
    expect(view.hasResult).toBe(false);
    expect(view.currentCell).toBeNull();
    expect(view.frontierSet.size).toBe(0);
    expect(view.exploredSet.size).toBe(0);
    expect(view.visiblePath).toEqual([]);
    expect(view.outcome).toBe('NONE');
  });

  it('Step tiến/lùi từng bước theo đúng dữ liệu SearchStep và dừng ở biên', () => {
    const astarResult = createSuccessMock('astar'); // 5 bước: index 0..4
    let state = playbackReducer(createInitialPlaybackState(), {
      type: 'LOAD_RESULT',
      measuredResult: astarResult,
      mode: 'ready',
    });

    // Trước bước 1: chưa có current
    expect(state.status).toBe('READY');
    expect(derivePlaybackSnapshot(state).currentCell).toBeNull();

    // Bước 1 (index 0)
    state = playbackReducer(state, { type: 'STEP_FORWARD' });
    let view = derivePlaybackSnapshot(state);
    expect(state.stepIndex).toBe(0);
    expect(state.status).toBe('PAUSED');
    expect(view.currentStepNumber).toBe(1);
    expect(view.currentCell).toBe('0,0');
    expect([...view.frontierSet]).toEqual(['0,1', '1,0']);
    expect([...view.exploredSet]).toEqual(['0,0']);
    expect(view.visiblePath).toEqual([]);
    expect(view.outcome).toBe('IN_PROGRESS');

    // Bước 2 (index 1)
    state = playbackReducer(state, { type: 'STEP_FORWARD' });
    view = derivePlaybackSnapshot(state);
    expect(state.stepIndex).toBe(1);
    expect(view.currentCell).toBe('0,1');
    expect([...view.frontierSet]).toEqual(['1,0', '0,2']);
    expect([...view.exploredSet]).toEqual(['0,0', '0,1']);

    // Lùi 1 bước về index 0
    state = playbackReducer(state, { type: 'STEP_BACKWARD' });
    expect(state.stepIndex).toBe(0);
    expect(state.status).toBe('PAUSED');

    // Lùi thêm 1 bước về trạng thái trước bước 1 (index -1)
    state = playbackReducer(state, { type: 'STEP_BACKWARD' });
    expect(state.stepIndex).toBe(-1);
    expect(state.status).toBe('READY');
    expect(derivePlaybackSnapshot(state).currentCell).toBeNull();

    // Lùi quá biên dưới vẫn giữ ở -1
    state = playbackReducer(state, { type: 'STEP_BACKWARD' });
    expect(state.stepIndex).toBe(-1);

    // Nhảy tới bước áp chót rồi Step tới bước cuối
    state = playbackReducer(state, { type: 'JUMP_TO_STEP', stepIndex: 3 });
    expect(state.status).toBe('PAUSED');
    state = playbackReducer(state, { type: 'STEP_FORWARD' });
    expect(state.stepIndex).toBe(4);
    expect(state.status).toBe('FINISHED');

    // Step vượt quá bước cuối không tăng thêm
    const afterEnd = playbackReducer(state, { type: 'STEP_FORWARD' });
    expect(afterEnd.stepIndex).toBe(4);
    expect(afterEnd.status).toBe('FINISHED');
  });

  it('Play / Pause tự động tiến từng bước và tự dừng khi chạm bước cuối', () => {
    const greedyResult = createSuccessMock('greedy'); // 5 bước
    let state = playbackReducer(createInitialPlaybackState(), {
      type: 'LOAD_RESULT',
      measuredResult: greedyResult,
      mode: 'play',
    });

    expect(state.isPlaying).toBe(true);
    expect(state.status).toBe('PLAYING');

    // 2 nhịp timer
    state = playbackReducer(state, { type: 'STEP_FORWARD' });
    state = playbackReducer(state, { type: 'STEP_FORWARD' });
    expect(state.stepIndex).toBe(1);
    expect(state.isPlaying).toBe(true);
    expect(state.status).toBe('PLAYING');

    // Pause giữa chừng
    state = playbackReducer(state, { type: 'PAUSE' });
    expect(state.isPlaying).toBe(false);
    expect(state.status).toBe('PAUSED');
    expect(state.stepIndex).toBe(1);

    // Tiếp tục Play tới bước cuối
    state = playbackReducer(state, { type: 'PLAY' });
    expect(state.isPlaying).toBe(true);
    state = playbackReducer(state, { type: 'STEP_FORWARD' }); // index 2
    state = playbackReducer(state, { type: 'STEP_FORWARD' }); // index 3
    state = playbackReducer(state, { type: 'STEP_FORWARD' }); // index 4 (cuối)

    expect(state.stepIndex).toBe(4);
    expect(state.isPlaying).toBe(false);
    expect(state.status).toBe('FINISHED');

    // Bấm Play khi đã FINISHED sẽ phát lại từ đầu (-1)
    state = playbackReducer(state, { type: 'PLAY' });
    expect(state.stepIndex).toBe(-1);
    expect(state.isPlaying).toBe(true);
    expect(state.status).toBe('PLAYING');
  });

  it('Reset đưa mô phỏng về trước bước đầu và tắt trạng thái đang phát nhưng giữ kết quả đã nạp', () => {
    const bfsResult = createSuccessMock('bfs');
    let state = playbackReducer(createInitialPlaybackState(), {
      type: 'LOAD_RESULT',
      measuredResult: bfsResult,
      mode: 'play',
    });
    state = playbackReducer(state, { type: 'STEP_FORWARD' });
    state = playbackReducer(state, { type: 'STEP_FORWARD' });

    state = playbackReducer(state, { type: 'RESET' });
    const view = derivePlaybackSnapshot(state);

    expect(state.isPlaying).toBe(false);
    expect(state.stepIndex).toBe(-1);
    expect(state.status).toBe('READY');
    expect(state.measuredResult).toBe(bfsResult);
    expect(view.currentCell).toBeNull();
    expect(view.visiblePath).toEqual([]);
  });

  it('chỉnh sửa bản đồ (MAP_EDITED) lập tức dừng playback và xóa sạch kết quả cũ', () => {
    const dfsResult = createSuccessMock('dfs');
    let state = playbackReducer(createInitialPlaybackState(), {
      type: 'LOAD_RESULT',
      measuredResult: dfsResult,
      mode: 'play',
    });
    state = playbackReducer(state, { type: 'STEP_FORWARD' });
    expect(state.isPlaying).toBe(true);

    state = playbackReducer(state, { type: 'MAP_EDITED' });
    const view = derivePlaybackSnapshot(state);

    expect(state.isPlaying).toBe(false);
    expect(state.measuredResult).toBeNull();
    expect(state.stepIndex).toBe(-1);
    expect(state.status).toBe('IDLE');
    expect(view.hasResult).toBe(false);
    expect(view.currentCell).toBeNull();
    expect(view.visiblePath).toEqual([]);
  });

  it('giới hạn tốc độ phát trong khoảng cho phép', () => {
    let state = createInitialPlaybackState();
    state = playbackReducer(state, { type: 'SET_SPEED', speedMs: 5 });
    expect(state.speedMs).toBe(MIN_PLAYBACK_SPEED_MS);

    state = playbackReducer(state, { type: 'SET_SPEED', speedMs: 9999 });
    expect(state.speedMs).toBe(MAX_PLAYBACK_SPEED_MS);
  });
});

describe('playbackState — hiển thị snapshot cho 3 kịch bản hợp đồng', () => {
  it('kịch bản thành công: phản ánh đúng current, frontier, explored từng bước và path ở bước cuối', () => {
    const problem = createDefaultGridProblem();
    const measured = createSuccessMock('astar');

    // Ở bước thứ 2 (stepIndex = 1): current = '0,1', frontier = ['1,0', '0,2'], explored = ['0,0', '0,1']
    const midState = playbackReducer(
      playbackReducer(createInitialPlaybackState(), {
        type: 'LOAD_RESULT',
        measuredResult: measured,
      }),
      { type: 'JUMP_TO_STEP', stepIndex: 1 },
    );
    const midView = derivePlaybackSnapshot(midState);

    expect(deriveCellVisualInfo(problem, 0, 1, midView).primaryState).toBe('current');
    expect(deriveCellVisualInfo(problem, 1, 0, midView).primaryState).toBe('frontier');
    expect(deriveCellVisualInfo(problem, 1, 0, midView).frontierOrder).toBe(1);
    expect(deriveCellVisualInfo(problem, 0, 2, midView).frontierOrder).toBe(2);
    expect(deriveCellVisualInfo(problem, 0, 0, midView).primaryState).toBe('explored');
    expect(deriveCellVisualInfo(problem, 0, 0, midView).isStart).toBe(true);
    expect(deriveCellVisualInfo(problem, 1, 1, midView).primaryState).toBe('wall');
    expect(midView.visiblePath).toEqual([]);

    // Ở bước cuối (stepIndex = 4): hiển thị đường đi ['0,0', '1,0', '2,0', '2,1']
    const finalState = playbackReducer(midState, {
      type: 'JUMP_TO_STEP',
      stepIndex: 4,
    });
    const finalView = derivePlaybackSnapshot(finalState);
    const matrix = deriveGridVisualMatrix(problem, finalState);

    expect(finalView.outcome).toBe('FOUND');
    expect(finalView.visiblePath).toEqual(['0,0', '1,0', '2,0', '2,1']);
    expect(matrix[0][0].primaryState).toBe('path');
    expect(matrix[1][0].primaryState).toBe('path');
    expect(matrix[2][0].primaryState).toBe('path');
    expect(matrix[2][1].primaryState).toBe('path');
    expect(matrix[2][1].isGoal).toBe(true);
    expect(matrix[2][1].isCurrent).toBe(true);
    expect(matrix[2][1].pathOrder).toBe(3);
  });

  it('kịch bản không có đường: kết thúc với outcome NOT_FOUND, path rỗng và pathCost = null', () => {
    const problem = createNoPathGridProblem();
    const measured = createNoPathMock('bfs');

    const finalState = playbackReducer(createInitialPlaybackState(), {
      type: 'LOAD_RESULT',
      measuredResult: measured,
      mode: 'final',
    });
    const view = derivePlaybackSnapshot(finalState);

    expect(finalState.status).toBe('FINISHED');
    expect(view.outcome).toBe('NOT_FOUND');
    expect(view.visiblePath).toEqual([]);
    expect(measured.result.found).toBe(false);
    expect(measured.result.pathCost).toBeNull();
    expect(view.frontierSet.size).toBe(0);
    expect([...view.exploredSet]).toEqual(['0,0', '0,1', '1,0']);

    // Goal (2,1) chưa từng được mở rộng và không có path
    const goalInfo = deriveCellVisualInfo(problem, 2, 1, view);
    expect(goalInfo.primaryState).toBe('goal');
    expect(goalInfo.isPath).toBe(false);
  });

  it('kịch bản Start trùng Goal: đúng 1 snapshot, bước đầu tiên cũng là bước hoàn tất với pathCost = 0', () => {
    const problem = createSameStartGoalGridProblem();
    const measured = createStartEqualsGoalMock(problem, 'ucs');

    let state = playbackReducer(createInitialPlaybackState(), {
      type: 'LOAD_RESULT',
      measuredResult: measured,
      mode: 'ready',
    });
    expect(state.status).toBe('READY');

    // Chỉ cần 1 lần Step là hoàn tất
    state = playbackReducer(state, { type: 'STEP_FORWARD' });
    const view = derivePlaybackSnapshot(state);
    const cellInfo = deriveCellVisualInfo(problem, 1, 1, view);

    expect(state.status).toBe('FINISHED');
    expect(state.isPlaying).toBe(false);
    expect(view.totalSteps).toBe(1);
    expect(view.currentStepNumber).toBe(1);
    expect(view.outcome).toBe('FOUND');
    expect(view.visiblePath).toEqual(['1,1']);
    expect(measured.result.pathCost).toBe(0);
    expect(measured.result.expandedCount).toBe(1);
    expect(cellInfo.isStart).toBe(true);
    expect(cellInfo.isGoal).toBe(true);
    expect(cellInfo.isPath).toBe(true);
    expect(cellInfo.isCurrent).toBe(true);
  });
});
