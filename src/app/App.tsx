import { useEffect, useMemo, useReducer, useState } from 'react';
import { kiemTraBanDo } from '../domain';
import type {
  AlgorithmId,
  GridProblem,
  MeasuredSearchResult,
  Position,
} from '../domain/types';
import { AlgorithmExplanation } from '../components/AlgorithmExplanation';
import { ComparisonTable } from '../components/ComparisonTable';
import { ControlPanel } from '../components/ControlPanel';
import { GridCanvas } from '../components/GridCanvas';
import { PlaybackControls } from '../components/PlaybackControls';
import { StatsPanel } from '../components/StatsPanel';
import {
  clearWallsInGrid,
  moveGoalInGrid,
  moveStartInGrid,
  resizeGridProblem,
  setWallInGrid,
  toggleWallInGrid,
  type EditToolMode,
  type GridMutationResult,
} from './gridState';
import {
  MOCK_SCENARIO_PRESETS,
  MockCustomMapNoticeError,
  createDefaultGridProblem,
  detectMatchingMockScenario,
  runAllAlgorithmsComparison,
  runMockSearch,
  type MockScenarioId,
  type SearchExecutor,
} from './mockSearchService';
import {
  createInitialPlaybackState,
  derivePlaybackSnapshot,
  playbackReducer,
  type LoadPlaybackMode,
} from './playbackState';
import './App.css';
import { runRealSearch } from './realSearchService';

export interface AppProps {
  readonly executor?: SearchExecutor;
}

export default function App({ executor = runRealSearch }: AppProps = {}) {
  const isMockMode = executor === runMockSearch;

  const [problem, setProblem] = useState<GridProblem>(() => createDefaultGridProblem());
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmId>('bfs');
  const [editMode, setEditMode] = useState<EditToolMode>('wall');
  const [playbackState, dispatchPlayback] = useReducer(
    playbackReducer,
    undefined,
    createInitialPlaybackState,
  );
  const [comparisonResults, setComparisonResults] = useState<
    Readonly<Record<AlgorithmId, MeasuredSearchResult>> | null
  >(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [mockNotice, setMockNotice] = useState<string | null>(null);

  const playbackView = useMemo(
    () => derivePlaybackSnapshot(playbackState),
    [playbackState],
  );

  const activeScenario = useMemo(
    () => detectMatchingMockScenario(problem),
    [problem],
  );

  // Vòng lặp timer cho chế độ phát tự động (Play).
  useEffect(() => {
    if (!playbackState.isPlaying) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      dispatchPlayback({ type: 'STEP_FORWARD' });
    }, playbackState.speedMs);

    return () => window.clearInterval(timerId);
  }, [playbackState.isPlaying, playbackState.speedMs]);

  function resetSearchFeedbackAndResults() {
    dispatchPlayback({ type: 'MAP_EDITED' });
    setComparisonResults(null);
    setValidationError(null);
    setMockNotice(null);
  }

  function applyMutation(mutation: GridMutationResult) {
    if (!mutation.ok) {
      if (playbackState.isPlaying) {
        dispatchPlayback({ type: 'PAUSE' });
      }
      setValidationError(mutation.error);
      return;
    }

    setValidationError(null);
    if (mutation.changed) {
      setProblem(mutation.problem);
      resetSearchFeedbackAndResults();
    }
  }

  function executeSingleAlgorithm(
    algorithmId: AlgorithmId,
    mode: LoadPlaybackMode,
  ): boolean {
    try {
      kiemTraBanDo(problem);
      const measuredResult = executor(problem, algorithmId);
      setValidationError(null);
      setMockNotice(null);
      dispatchPlayback({
        type: 'LOAD_RESULT',
        measuredResult,
        mode,
      });
      return true;
    } catch (err) {
      dispatchPlayback({ type: 'MAP_EDITED' });
      if (err instanceof MockCustomMapNoticeError) {
        setValidationError(null);
        setMockNotice(err.message);
      } else {
        setMockNotice(null);
        setValidationError(
          err instanceof Error ? err.message : 'Lỗi không xác định khi kiểm tra bản đồ.',
        );
      }
      return false;
    }
  }

  function handleSelectAlgorithm(algorithmId: AlgorithmId) {
    setSelectedAlgorithm(algorithmId);
    setValidationError(null);
    setMockNotice(null);

    if (comparisonResults && comparisonResults[algorithmId]) {
      dispatchPlayback({
        type: 'LOAD_RESULT',
        measuredResult: comparisonResults[algorithmId],
        mode: 'ready',
      });
    } else if (
      playbackState.measuredResult &&
      playbackState.measuredResult.result.algorithm !== algorithmId
    ) {
      dispatchPlayback({ type: 'MAP_EDITED' });
    }
  }

  function handleToggleWall(position: Position) {
    applyMutation(toggleWallInGrid(problem, position));
  }

  function handlePaintWall(position: Position, shouldBeWall: boolean) {
    applyMutation(setWallInGrid(problem, position, shouldBeWall));
  }

  function handlePlaceStart(position: Position) {
    applyMutation(moveStartInGrid(problem, position));
  }

  function handlePlaceGoal(position: Position) {
    applyMutation(moveGoalInGrid(problem, position));
  }

  function handleResizeGrid(rows: number, cols: number) {
    applyMutation(resizeGridProblem(problem, rows, cols));
  }

  function handleClearWalls() {
    applyMutation(clearWallsInGrid(problem));
  }

  function handleResetDefaultGrid() {
    setProblem(createDefaultGridProblem());
    resetSearchFeedbackAndResults();
  }

  function handleSelectScenario(scenarioId: MockScenarioId) {
    const preset = MOCK_SCENARIO_PRESETS.find((item) => item.id === scenarioId);
    if (!preset) {
      return;
    }
    setProblem(preset.createProblem());
    resetSearchFeedbackAndResults();
  }

  function handleRunSelected() {
    executeSingleAlgorithm(selectedAlgorithm, 'play');
  }

  function handleCompareAll() {
    try {
      kiemTraBanDo(problem);
      const allResults = runAllAlgorithmsComparison(problem, executor);
      setValidationError(null);
      setMockNotice(null);
      setComparisonResults(allResults);
      dispatchPlayback({
        type: 'LOAD_RESULT',
        measuredResult: allResults[selectedAlgorithm],
        mode: 'final',
      });
    } catch (err) {
      dispatchPlayback({ type: 'MAP_EDITED' });
      setComparisonResults(null);
      if (err instanceof MockCustomMapNoticeError) {
        setValidationError(null);
        setMockNotice(err.message);
      } else {
        setMockNotice(null);
        setValidationError(
          err instanceof Error ? err.message : 'Lỗi không xác định khi chạy so sánh.',
        );
      }
    }
  }

  function handleInspectAlgorithmFromComparison(algorithmId: AlgorithmId) {
    setSelectedAlgorithm(algorithmId);
    if (comparisonResults && comparisonResults[algorithmId]) {
      dispatchPlayback({
        type: 'LOAD_RESULT',
        measuredResult: comparisonResults[algorithmId],
        mode: 'final',
      });
    }
  }

  function handlePlay() {
    if (!playbackState.measuredResult) {
      executeSingleAlgorithm(selectedAlgorithm, 'play');
      return;
    }
    dispatchPlayback({ type: 'PLAY' });
  }

  function handleStepForward() {
    if (!playbackState.measuredResult) {
      executeSingleAlgorithm(selectedAlgorithm, 'first-step');
      return;
    }
    if (playbackState.isPlaying) {
      dispatchPlayback({ type: 'PAUSE' });
    }
    dispatchPlayback({ type: 'STEP_FORWARD' });
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>AI Pathfinding Visualizer</h1>
          <p>
            Mô phỏng từng bước và so sánh BFS, DFS, UCS, Greedy Best-First Search và A*
            trên lưới trạng thái 2D đồng chi phí
          </p>
        </div>
        <div className="header-badges">
          <span className="badge badge--optimal">4 hướng • Chi phí c = 1</span>
          {isMockMode && (
            <span className="badge badge--mock">P2-03 • Mock Contract Mode</span>
          )}
        </div>
      </header>

      {validationError && (
        <div className="alert-banner alert-banner--error" role="alert">
          <div>
            <strong>Lỗi kiểm tra đầu vào: </strong>
            <span>{validationError}</span>
          </div>
          <button
            type="button"
            className="mini-btn"
            onClick={() => setValidationError(null)}
          >
            Đóng
          </button>
        </div>
      )}

      {mockNotice && (
        <div className="alert-banner alert-banner--notice" role="status">
          <div>
            <strong>Chế độ Mock tĩnh (P2-03): </strong>
            <span>{mockNotice}</span>
          </div>
          <button
            type="button"
            className="mini-btn"
            onClick={() => handleSelectScenario('success')}
          >
            Nạp kịch bản 10×10 mẫu
          </button>
        </div>
      )}

      <ControlPanel
        rows={problem.rows}
        cols={problem.cols}
        selectedAlgorithm={selectedAlgorithm}
        editMode={editMode}
        activeScenario={activeScenario}
        isMockMode={isMockMode}
        onSelectAlgorithm={handleSelectAlgorithm}
        onSelectEditMode={setEditMode}
        onResizeGrid={handleResizeGrid}
        onClearWalls={handleClearWalls}
        onResetDefaultGrid={handleResetDefaultGrid}
        onSelectScenario={handleSelectScenario}
        onRunSelected={handleRunSelected}
        onCompareAll={handleCompareAll}
      />

      <div className="workspace-grid">
        <GridCanvas
          problem={problem}
          playbackView={playbackView}
          editMode={editMode}
          onToggleWall={handleToggleWall}
          onPaintWall={handlePaintWall}
          onPlaceStart={handlePlaceStart}
          onPlaceGoal={handlePlaceGoal}
        />

        <div className="right-column">
          <PlaybackControls
            playbackState={playbackState}
            playbackView={playbackView}
            onPlay={handlePlay}
            onPause={() => dispatchPlayback({ type: 'PAUSE' })}
            onStepForward={handleStepForward}
            onStepBackward={() => dispatchPlayback({ type: 'STEP_BACKWARD' })}
            onReset={() => dispatchPlayback({ type: 'RESET' })}
            onJumpToStep={(idx) =>
              dispatchPlayback({ type: 'JUMP_TO_STEP', stepIndex: idx })
            }
            onChangeSpeed={(speedMs) =>
              dispatchPlayback({ type: 'SET_SPEED', speedMs })
            }
          />

          <StatsPanel
            measuredResult={playbackState.measuredResult}
            playbackView={playbackView}
            isMockMode={isMockMode}
          />
        </div>
      </div>

      <div className="bottom-grid">
        <ComparisonTable
          comparisonResults={comparisonResults}
          selectedAlgorithm={selectedAlgorithm}
          isMockMode={isMockMode}
          onRunComparison={handleCompareAll}
          onInspectAlgorithm={handleInspectAlgorithmFromComparison}
        />

        <AlgorithmExplanation
          selectedAlgorithm={selectedAlgorithm}
          onSelectAlgorithm={handleSelectAlgorithm}
        />
      </div>
    </main>
  );
}
