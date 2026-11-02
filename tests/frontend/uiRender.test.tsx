import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from '../../src/app/App';
import {
  createDefaultGridProblem,
  createNoPathGridProblem,
  createNoPathMock,
  createSameStartGoalGridProblem,
  createStartEqualsGoalMock,
  createSuccessMock,
  runAllAlgorithmsComparison,
} from '../../src/app/mockSearchService';
import {
  createInitialPlaybackState,
  derivePlaybackSnapshot,
  playbackReducer,
} from '../../src/app/playbackState';
import { AlgorithmExplanation } from '../../src/components/AlgorithmExplanation';
import { ComparisonTable } from '../../src/components/ComparisonTable';
import { GridCanvas } from '../../src/components/GridCanvas';
import { PlaybackControls } from '../../src/components/PlaybackControls';
import { StatsPanel } from '../../src/components/StatsPanel';

const noop = () => {};

describe('UI Components — kiểm tra kết xuất giao diện không lỗi', () => {
  it('App kết xuất mặc định lưới 10×10 (100 ô gridcell), đủ 5 thuật toán và khung giải thích', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('AI Pathfinding Visualizer');
    expect(html).toContain('Lưới trạng thái 2D (10 × 10)');
    expect((html.match(/role="gridcell"/g) ?? []).length).toBe(100);
    expect(html).toContain('BFS');
    expect(html).toContain('DFS');
    expect(html).toContain('UCS');
    expect(html).toContain('Greedy');
    expect(html).toContain('A*');
  });

  it('GridCanvas, PlaybackControls và StatsPanel kết xuất đúng trạng thái giữa chừng và kết thúc', () => {
    const problem = createDefaultGridProblem();
    const measured = createSuccessMock('astar');

    const midState = playbackReducer(
      playbackReducer(createInitialPlaybackState(), {
        type: 'LOAD_RESULT',
        measuredResult: measured,
      }),
      { type: 'JUMP_TO_STEP', stepIndex: 1 },
    );
    const midView = derivePlaybackSnapshot(midState);

    const midGridHtml = renderToStaticMarkup(
      <GridCanvas
        problem={problem}
        playbackView={midView}
        editMode="wall"
        onToggleWall={noop}
        onPaintWall={noop}
        onPlaceStart={noop}
        onPlaceGoal={noop}
      />,
    );
    expect(midGridHtml).toContain('data-state="current"');
    expect(midGridHtml).toContain('data-state="frontier"');
    expect(midGridHtml).toContain('data-state="explored"');
    expect(midGridHtml).not.toContain('data-state="path"');

    const finalState = playbackReducer(midState, {
      type: 'JUMP_TO_STEP',
      stepIndex: 4,
    });
    const finalView = derivePlaybackSnapshot(finalState);

    const finalGridHtml = renderToStaticMarkup(
      <GridCanvas
        problem={problem}
        playbackView={finalView}
        editMode="wall"
        onToggleWall={noop}
        onPaintWall={noop}
        onPlaceStart={noop}
        onPlaceGoal={noop}
      />,
    );
    const controlsHtml = renderToStaticMarkup(
      <PlaybackControls
        playbackState={finalState}
        playbackView={finalView}
        onPlay={noop}
        onPause={noop}
        onStepForward={noop}
        onStepBackward={noop}
        onReset={noop}
        onJumpToStep={noop}
        onChangeSpeed={noop}
      />,
    );
    const statsHtml = renderToStaticMarkup(
      <StatsPanel
        measuredResult={measured}
        playbackView={finalView}
        isMockMode={true}
      />,
    );

    expect(finalGridHtml).toContain('data-state="path"');
    expect(controlsHtml).toContain('Đã kết thúc');
    expect(statsHtml).toContain('Tìm thấy đường đi!');
    expect(statsHtml).toContain('0,0 → 1,0 → 2,0 → 2,1');
  });

  it('kết xuất đúng thông báo không có đường, huy hiệu S=G khi Start trùng Goal và bảng so sánh 5 dòng', () => {
    const noPathProblem = createNoPathGridProblem();
    const noPathMeasured = createNoPathMock('dfs');
    const noPathState = playbackReducer(createInitialPlaybackState(), {
      type: 'LOAD_RESULT',
      measuredResult: noPathMeasured,
      mode: 'final',
    });
    const noPathStatsHtml = renderToStaticMarkup(
      <StatsPanel
        measuredResult={noPathMeasured}
        playbackView={derivePlaybackSnapshot(noPathState)}
        isMockMode={true}
      />,
    );
    expect(noPathStatsHtml).toContain('Không tìm thấy đường đi!');
    expect(noPathProblem.rows).toBe(10);

    const sameProblem = createSameStartGoalGridProblem();
    const sameMeasured = createStartEqualsGoalMock(sameProblem, 'bfs');
    const sameState = playbackReducer(createInitialPlaybackState(), {
      type: 'LOAD_RESULT',
      measuredResult: sameMeasured,
      mode: 'final',
    });
    const sameGridHtml = renderToStaticMarkup(
      <GridCanvas
        problem={sameProblem}
        playbackView={derivePlaybackSnapshot(sameState)}
        editMode="start"
        onToggleWall={noop}
        onPaintWall={noop}
        onPlaceStart={noop}
        onPlaceGoal={noop}
      />,
    );
    expect(sameGridHtml).toContain('S=G');
    expect(sameGridHtml).toContain('Start trùng Goal');

    const comparison = runAllAlgorithmsComparison(createDefaultGridProblem());
    const tableHtml = renderToStaticMarkup(
      <ComparisonTable
        comparisonResults={comparison}
        selectedAlgorithm="astar"
        isMockMode={true}
        onRunComparison={noop}
        onInspectAlgorithm={noop}
      />,
    );
    expect((tableHtml.match(/Xem trên lưới/g) ?? []).length).toBe(5);
    expect(tableHtml).toContain('Ngắn nhất');

    const explainHtml = renderToStaticMarkup(
      <AlgorithmExplanation selectedAlgorithm="dfs" onSelectAlgorithm={noop} />,
    );
    expect(explainHtml).toContain('Không bảo đảm tối ưu');
  });
});
