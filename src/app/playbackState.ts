import { taoCellId } from '../domain';
import type {
  CellId,
  GridProblem,
  MeasuredSearchResult,
  SearchStep,
} from '../domain/types';

export const DEFAULT_PLAYBACK_SPEED_MS = 260;
export const MIN_PLAYBACK_SPEED_MS = 40;
export const MAX_PLAYBACK_SPEED_MS = 1000;

export type PlaybackStatus = 'IDLE' | 'READY' | 'PLAYING' | 'PAUSED' | 'FINISHED';

export type PlaybackOutcome = 'NONE' | 'IN_PROGRESS' | 'FOUND' | 'NOT_FOUND';

export type LoadPlaybackMode = 'ready' | 'first-step' | 'play' | 'final';

export interface PlaybackState {
  readonly measuredResult: MeasuredSearchResult | null;
  /** -1 nghĩa là trạng thái trước bước đầu tiên (chưa có current/frontier/explored). */
  readonly stepIndex: number;
  readonly isPlaying: boolean;
  readonly speedMs: number;
  readonly status: PlaybackStatus;
}

export type PlaybackAction =
  | {
      readonly type: 'LOAD_RESULT';
      readonly measuredResult: MeasuredSearchResult;
      readonly mode?: LoadPlaybackMode;
    }
  | { readonly type: 'STEP_FORWARD' }
  | { readonly type: 'STEP_BACKWARD' }
  | { readonly type: 'JUMP_TO_STEP'; readonly stepIndex: number }
  | { readonly type: 'PLAY' }
  | { readonly type: 'PAUSE' }
  | { readonly type: 'RESET' }
  | { readonly type: 'MAP_EDITED' }
  | { readonly type: 'SET_SPEED'; readonly speedMs: number };

export type PrimaryCellVisualState =
  | 'wall'
  | 'path'
  | 'current'
  | 'frontier'
  | 'explored'
  | 'start-goal'
  | 'start'
  | 'goal'
  | 'empty';

export interface CellVisualInfo {
  readonly cellId: CellId;
  readonly row: number;
  readonly col: number;
  readonly isWall: boolean;
  readonly isStart: boolean;
  readonly isGoal: boolean;
  readonly isCurrent: boolean;
  readonly isFrontier: boolean;
  readonly isExplored: boolean;
  readonly isPath: boolean;
  /** Thứ tự lấy ra tiếp theo trong frontier (bắt đầu từ 1), null nếu không thuộc frontier. */
  readonly frontierOrder: number | null;
  /** Chỉ số trên đường đi kết quả (0..pathCost), null nếu đường đi chưa hiển thị hoặc không thuộc path. */
  readonly pathOrder: number | null;
  readonly primaryState: PrimaryCellVisualState;
}

export interface DerivedPlaybackView {
  readonly status: PlaybackStatus;
  readonly outcome: PlaybackOutcome;
  readonly hasResult: boolean;
  readonly currentStepNumber: number;
  readonly totalSteps: number;
  readonly activeStep: SearchStep | null;
  readonly currentCell: CellId | null;
  readonly frontierSet: ReadonlySet<CellId>;
  readonly frontierOrderMap: ReadonlyMap<CellId, number>;
  readonly exploredSet: ReadonlySet<CellId>;
  readonly visiblePath: readonly CellId[];
  readonly pathSet: ReadonlySet<CellId>;
  readonly pathOrderMap: ReadonlyMap<CellId, number>;
}

export function clampPlaybackSpeed(speedMs: number): number {
  if (!Number.isFinite(speedMs)) {
    return DEFAULT_PLAYBACK_SPEED_MS;
  }
  return Math.min(MAX_PLAYBACK_SPEED_MS, Math.max(MIN_PLAYBACK_SPEED_MS, Math.round(speedMs)));
}

export function createInitialPlaybackState(
  speedMs: number = DEFAULT_PLAYBACK_SPEED_MS,
): PlaybackState {
  return {
    measuredResult: null,
    stepIndex: -1,
    isPlaying: false,
    speedMs: clampPlaybackSpeed(speedMs),
    status: 'IDLE',
  };
}

export function playbackReducer(
  state: PlaybackState,
  action: PlaybackAction,
): PlaybackState {
  switch (action.type) {
    case 'LOAD_RESULT': {
      const { measuredResult, mode = 'ready' } = action;
      const totalSteps = measuredResult.result.steps.length;

      if (totalSteps === 0) {
        return {
          ...state,
          measuredResult,
          stepIndex: -1,
          isPlaying: false,
          status: 'FINISHED',
        };
      }

      if (mode === 'final') {
        return {
          ...state,
          measuredResult,
          stepIndex: totalSteps - 1,
          isPlaying: false,
          status: 'FINISHED',
        };
      }

      if (mode === 'first-step') {
        const isLast = totalSteps === 1;
        return {
          ...state,
          measuredResult,
          stepIndex: 0,
          isPlaying: false,
          status: isLast ? 'FINISHED' : 'PAUSED',
        };
      }

      if (mode === 'play') {
        return {
          ...state,
          measuredResult,
          stepIndex: -1,
          isPlaying: true,
          status: 'PLAYING',
        };
      }

      return {
        ...state,
        measuredResult,
        stepIndex: -1,
        isPlaying: false,
        status: 'READY',
      };
    }

    case 'PLAY': {
      if (!state.measuredResult) {
        return state;
      }

      const totalSteps = state.measuredResult.result.steps.length;
      if (totalSteps === 0) {
        return {
          ...state,
          stepIndex: -1,
          isPlaying: false,
          status: 'FINISHED',
        };
      }

      // Nếu đã ở bước cuối, phát lại từ đầu (trước bước 1 để chạy tuần tự từng snapshot).
      if (state.status === 'FINISHED' || state.stepIndex >= totalSteps - 1) {
        return {
          ...state,
          stepIndex: -1,
          isPlaying: true,
          status: 'PLAYING',
        };
      }

      return {
        ...state,
        isPlaying: true,
        status: 'PLAYING',
      };
    }

    case 'PAUSE': {
      if (!state.measuredResult || !state.isPlaying) {
        return state;
      }

      return {
        ...state,
        isPlaying: false,
        status: state.stepIndex < 0 ? 'READY' : 'PAUSED',
      };
    }

    case 'STEP_FORWARD': {
      if (!state.measuredResult) {
        return state;
      }

      const totalSteps = state.measuredResult.result.steps.length;
      if (totalSteps === 0) {
        return {
          ...state,
          stepIndex: -1,
          isPlaying: false,
          status: 'FINISHED',
        };
      }

      if (state.stepIndex >= totalSteps - 1) {
        return {
          ...state,
          stepIndex: totalSteps - 1,
          isPlaying: false,
          status: 'FINISHED',
        };
      }

      const nextIndex = state.stepIndex + 1;
      if (nextIndex >= totalSteps - 1) {
        return {
          ...state,
          stepIndex: totalSteps - 1,
          isPlaying: false,
          status: 'FINISHED',
        };
      }

      return {
        ...state,
        stepIndex: nextIndex,
        status: state.isPlaying ? 'PLAYING' : 'PAUSED',
      };
    }

    case 'STEP_BACKWARD': {
      if (!state.measuredResult) {
        return state;
      }

      if (state.stepIndex <= 0) {
        return {
          ...state,
          stepIndex: -1,
          isPlaying: false,
          status: 'READY',
        };
      }

      return {
        ...state,
        stepIndex: state.stepIndex - 1,
        isPlaying: false,
        status: 'PAUSED',
      };
    }

    case 'JUMP_TO_STEP': {
      if (!state.measuredResult) {
        return state;
      }

      const totalSteps = state.measuredResult.result.steps.length;
      if (totalSteps === 0) {
        return {
          ...state,
          stepIndex: -1,
          isPlaying: false,
          status: 'FINISHED',
        };
      }

      const clamped = Math.min(totalSteps - 1, Math.max(-1, Math.trunc(action.stepIndex)));
      if (clamped < 0) {
        return {
          ...state,
          stepIndex: -1,
          isPlaying: false,
          status: 'READY',
        };
      }

      if (clamped >= totalSteps - 1) {
        return {
          ...state,
          stepIndex: totalSteps - 1,
          isPlaying: false,
          status: 'FINISHED',
        };
      }

      return {
        ...state,
        stepIndex: clamped,
        isPlaying: false,
        status: 'PAUSED',
      };
    }

    case 'RESET': {
      if (!state.measuredResult) {
        return {
          ...state,
          stepIndex: -1,
          isPlaying: false,
          status: 'IDLE',
        };
      }

      return {
        ...state,
        stepIndex: -1,
        isPlaying: false,
        status: 'READY',
      };
    }

    case 'MAP_EDITED': {
      return {
        ...state,
        measuredResult: null,
        stepIndex: -1,
        isPlaying: false,
        status: 'IDLE',
      };
    }

    case 'SET_SPEED': {
      return {
        ...state,
        speedMs: clampPlaybackSpeed(action.speedMs),
      };
    }
  }
}

export function derivePlaybackSnapshot(state: PlaybackState): DerivedPlaybackView {
  const emptySet = new Set<CellId>();
  const emptyMap = new Map<CellId, number>();

  if (!state.measuredResult) {
    return {
      status: state.status,
      outcome: 'NONE',
      hasResult: false,
      currentStepNumber: 0,
      totalSteps: 0,
      activeStep: null,
      currentCell: null,
      frontierSet: emptySet,
      frontierOrderMap: emptyMap,
      exploredSet: emptySet,
      visiblePath: [],
      pathSet: emptySet,
      pathOrderMap: emptyMap,
    };
  }

  const { result } = state.measuredResult;
  const totalSteps = result.steps.length;

  if (state.stepIndex < 0 && state.status !== 'FINISHED') {
    return {
      status: state.status,
      outcome: 'NONE',
      hasResult: true,
      currentStepNumber: 0,
      totalSteps,
      activeStep: null,
      currentCell: null,
      frontierSet: emptySet,
      frontierOrderMap: emptyMap,
      exploredSet: emptySet,
      visiblePath: [],
      pathSet: emptySet,
      pathOrderMap: emptyMap,
    };
  }

  const activeStep =
    state.stepIndex >= 0 && state.stepIndex < totalSteps
      ? result.steps[state.stepIndex]
      : null;

  const frontierOrderMap = new Map<CellId, number>();
  if (activeStep) {
    activeStep.frontier.forEach((cellId, index) => {
      if (!frontierOrderMap.has(cellId)) {
        frontierOrderMap.set(cellId, index + 1);
      }
    });
  }

  const frontierSet = new Set<CellId>(activeStep ? activeStep.frontier : []);
  const exploredSet = new Set<CellId>(activeStep ? activeStep.explored : []);

  const isFinished = state.status === 'FINISHED';
  const visiblePath = isFinished && result.found ? result.path : [];
  const pathSet = new Set<CellId>(visiblePath);
  const pathOrderMap = new Map<CellId, number>();
  visiblePath.forEach((cellId, index) => {
    pathOrderMap.set(cellId, index);
  });

  const outcome: PlaybackOutcome = isFinished
    ? result.found
      ? 'FOUND'
      : 'NOT_FOUND'
    : 'IN_PROGRESS';

  return {
    status: state.status,
    outcome,
    hasResult: true,
    currentStepNumber: activeStep ? state.stepIndex + 1 : 0,
    totalSteps,
    activeStep,
    currentCell: activeStep ? activeStep.current : null,
    frontierSet,
    frontierOrderMap,
    exploredSet,
    visiblePath,
    pathSet,
    pathOrderMap,
  };
}

export function deriveCellVisualInfo(
  problem: GridProblem,
  row: number,
  col: number,
  playbackView: DerivedPlaybackView,
): CellVisualInfo {
  const cellId = taoCellId({ row, col });
  const isWall = problem.walls.has(cellId);
  const isStart = problem.start.row === row && problem.start.col === col;
  const isGoal = problem.goal.row === row && problem.goal.col === col;

  const isCurrent = !isWall && playbackView.currentCell === cellId;
  const isFrontier = !isWall && playbackView.frontierSet.has(cellId);
  const isExplored = !isWall && playbackView.exploredSet.has(cellId);
  const isPath = !isWall && playbackView.pathSet.has(cellId);

  const frontierOrder = !isWall ? (playbackView.frontierOrderMap.get(cellId) ?? null) : null;
  const pathOrder = !isWall ? (playbackView.pathOrderMap.get(cellId) ?? null) : null;

  let primaryState: PrimaryCellVisualState;
  if (isWall) {
    primaryState = 'wall';
  } else if (isPath) {
    primaryState = 'path';
  } else if (isCurrent) {
    primaryState = 'current';
  } else if (isFrontier) {
    primaryState = 'frontier';
  } else if (isExplored) {
    primaryState = 'explored';
  } else if (isStart && isGoal) {
    primaryState = 'start-goal';
  } else if (isStart) {
    primaryState = 'start';
  } else if (isGoal) {
    primaryState = 'goal';
  } else {
    primaryState = 'empty';
  }

  return {
    cellId,
    row,
    col,
    isWall,
    isStart,
    isGoal,
    isCurrent,
    isFrontier,
    isExplored,
    isPath,
    frontierOrder,
    pathOrder,
    primaryState,
  };
}

export function deriveGridVisualMatrix(
  problem: GridProblem,
  state: PlaybackState,
): readonly (readonly CellVisualInfo[])[] {
  const view = derivePlaybackSnapshot(state);
  const matrix: CellVisualInfo[][] = [];

  for (let row = 0; row < problem.rows; row += 1) {
    const rowCells: CellVisualInfo[] = [];
    for (let col = 0; col < problem.cols; col += 1) {
      rowCells.push(deriveCellVisualInfo(problem, row, col, view));
    }
    matrix.push(rowCells);
  }

  return matrix;
}
