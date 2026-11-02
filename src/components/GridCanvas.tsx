import { useEffect, useState } from 'react';
import type { GridProblem, Position } from '../domain/types';
import type { EditToolMode } from '../app/gridState';
import {
  deriveCellVisualInfo,
  type CellVisualInfo,
  type DerivedPlaybackView,
} from '../app/playbackState';

export interface GridCanvasProps {
  readonly problem: GridProblem;
  readonly playbackView: DerivedPlaybackView;
  readonly editMode: EditToolMode;
  readonly onToggleWall: (position: Position) => void;
  readonly onPaintWall: (position: Position, shouldBeWall: boolean) => void;
  readonly onPlaceStart: (position: Position) => void;
  readonly onPlaceGoal: (position: Position) => void;
}

function buildCellTooltip(cell: CellVisualInfo): string {
  const tags: string[] = [`Ô (${cell.row}, ${cell.col})`];
  if (cell.isStart && cell.isGoal) {
    tags.push('Start trùng Goal');
  } else if (cell.isStart) {
    tags.push('Start');
  } else if (cell.isGoal) {
    tags.push('Goal');
  }
  if (cell.isWall) {
    tags.push('Tường');
  }
  if (cell.isCurrent) {
    tags.push('Đang xét (Current)');
  }
  if (cell.isPath && cell.pathOrder !== null) {
    tags.push(`Thuộc đường đi (bước ${cell.pathOrder})`);
  }
  if (cell.isFrontier && cell.frontierOrder !== null) {
    tags.push(`Frontier (ưu tiên lấy thứ #${cell.frontierOrder})`);
  }
  if (cell.isExplored) {
    tags.push('Đã mở rộng (Explored)');
  }
  return tags.join(' • ');
}

export function GridCanvas({
  problem,
  playbackView,
  editMode,
  onToggleWall,
  onPaintWall,
  onPlaceStart,
  onPlaceGoal,
}: GridCanvasProps) {
  const [dragPaintValue, setDragPaintValue] = useState<boolean | null>(null);

  useEffect(() => {
    function stopDragging() {
      setDragPaintValue(null);
    }
    window.addEventListener('mouseup', stopDragging);
    return () => window.removeEventListener('mouseup', stopDragging);
  }, []);

  function handleCellMouseDown(cell: CellVisualInfo) {
    const position: Position = { row: cell.row, col: cell.col };
    if (editMode === 'wall') {
      const targetWallState = !cell.isWall;
      setDragPaintValue(targetWallState);
      onToggleWall(position);
    } else if (editMode === 'start') {
      onPlaceStart(position);
    } else {
      onPlaceGoal(position);
    }
  }

  function handleCellMouseEnter(cell: CellVisualInfo) {
    if (editMode === 'wall' && dragPaintValue !== null) {
      onPaintWall({ row: cell.row, col: cell.col }, dragPaintValue);
    }
  }

  const isCompact = problem.cols > 14 || problem.rows > 14;
  const colIndices = Array.from({ length: problem.cols }, (_, idx) => idx);
  const rowIndices = Array.from({ length: problem.rows }, (_, idx) => idx);

  return (
    <section className="panel grid-panel" aria-label="Bản đồ lưới 2D">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">
            Lưới trạng thái 2D ({problem.rows} × {problem.cols})
          </h2>
          <p className="panel-subtitle">
            Start: <strong>({problem.start.row}, {problem.start.col})</strong> • Goal:{' '}
            <strong>({problem.goal.row}, {problem.goal.col})</strong> • Tường:{' '}
            <strong>{problem.walls.size}</strong> ô
            {problem.start.row === problem.goal.row &&
              problem.start.col === problem.goal.col && (
                <span className="inline-pill">Start trùng Goal</span>
              )}
          </p>
        </div>
        <span className="mode-indicator">
          Công cụ:{' '}
          <strong>
            {editMode === 'wall'
              ? 'Vẽ / Xóa tường (nhấn hoặc kéo chuột)'
              : editMode === 'start'
                ? 'Chọn ô đặt Start'
                : 'Chọn ô đặt Goal'}
          </strong>
        </span>
      </div>

      <div className="grid-scroll-wrapper">
        <div
          className={`grid-board ${isCompact ? 'grid-board--compact' : ''}`}
          style={{
            gridTemplateColumns: `28px repeat(${problem.cols}, var(--cell-size))`,
          }}
          role="grid"
          aria-label={`Lưới tìm đường ${problem.rows} hàng ${problem.cols} cột`}
        >
          <div className="grid-axis-corner" aria-hidden="true" />
          {colIndices.map((col) => (
            <div key={`col-${col}`} className="grid-axis-label" aria-hidden="true">
              {col}
            </div>
          ))}

          {rowIndices.flatMap((row) => [
            <div key={`row-label-${row}`} className="grid-axis-label" aria-hidden="true">
              {row}
            </div>,
            ...colIndices.map((col) => {
              const cell = deriveCellVisualInfo(problem, row, col, playbackView);
              const classes = [
                'grid-cell',
                `grid-cell--${cell.primaryState}`,
                cell.isCurrent ? 'grid-cell--ring-current' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={cell.cellId}
                  type="button"
                  role="gridcell"
                  className={classes}
                  data-cell-id={cell.cellId}
                  data-state={cell.primaryState}
                  data-current={cell.isCurrent ? 'true' : 'false'}
                  data-path={cell.isPath ? 'true' : 'false'}
                  title={buildCellTooltip(cell)}
                  aria-label={buildCellTooltip(cell)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCellMouseDown(cell);
                  }}
                  onMouseEnter={() => handleCellMouseEnter(cell)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCellMouseDown(cell);
                    }
                  }}
                >
                  {cell.isStart && cell.isGoal && (
                    <span className="endpoint-badge endpoint-badge--both">S=G</span>
                  )}
                  {cell.isStart && !cell.isGoal && (
                    <span className="endpoint-badge endpoint-badge--start">S</span>
                  )}
                  {!cell.isStart && cell.isGoal && (
                    <span className="endpoint-badge endpoint-badge--goal">G</span>
                  )}
                  {!cell.isStart &&
                    !cell.isGoal &&
                    !isCompact &&
                    cell.isPath &&
                    cell.pathOrder !== null && (
                      <span className="cell-subtag cell-subtag--path">{cell.pathOrder}</span>
                    )}
                  {!cell.isStart &&
                    !cell.isGoal &&
                    !cell.isPath &&
                    !isCompact &&
                    cell.isFrontier &&
                    cell.frontierOrder !== null && (
                      <span className="cell-subtag">#{cell.frontierOrder}</span>
                    )}
                </button>
              );
            }),
          ])}
        </div>
      </div>

      <div className="legend-bar" aria-label="Chú giải màu sắc ô lưới">
        <span className="legend-item">
          <i className="swatch swatch--start" /> Start (S)
        </span>
        <span className="legend-item">
          <i className="swatch swatch--goal" /> Goal (G)
        </span>
        <span className="legend-item">
          <i className="swatch swatch--both" /> Start trùng Goal (S=G)
        </span>
        <span className="legend-item">
          <i className="swatch swatch--wall" /> Tường vật cản
        </span>
        <span className="legend-item">
          <i className="swatch swatch--current" /> Đang xét (Current)
        </span>
        <span className="legend-item">
          <i className="swatch swatch--frontier" /> Biên (Frontier)
        </span>
        <span className="legend-item">
          <i className="swatch swatch--explored" /> Đã mở rộng (Explored)
        </span>
        <span className="legend-item">
          <i className="swatch swatch--path" /> Đường đi cuối (Path)
        </span>
      </div>
    </section>
  );
}
