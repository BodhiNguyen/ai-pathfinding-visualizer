import { useEffect, useState, type FormEvent } from 'react';
import type { AlgorithmId } from '../domain/types';
import { ORDERED_ALGORITHMS } from '../app/algorithmInfo';
import {
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
  type EditToolMode,
} from '../app/gridState';
import {
  MOCK_SCENARIO_PRESETS,
  type MockScenarioId,
} from '../app/mockSearchService';

export interface ControlPanelProps {
  readonly rows: number;
  readonly cols: number;
  readonly selectedAlgorithm: AlgorithmId;
  readonly editMode: EditToolMode;
  readonly activeScenario: MockScenarioId | null;
  readonly isMockMode: boolean;
  readonly onSelectAlgorithm: (algorithm: AlgorithmId) => void;
  readonly onSelectEditMode: (mode: EditToolMode) => void;
  readonly onResizeGrid: (rows: number, cols: number) => void;
  readonly onClearWalls: () => void;
  readonly onResetDefaultGrid: () => void;
  readonly onSelectScenario: (scenarioId: MockScenarioId) => void;
  readonly onRunSelected: () => void;
  readonly onCompareAll: () => void;
}

export function ControlPanel({
  rows,
  cols,
  selectedAlgorithm,
  editMode,
  activeScenario,
  isMockMode,
  onSelectAlgorithm,
  onSelectEditMode,
  onResizeGrid,
  onClearWalls,
  onResetDefaultGrid,
  onSelectScenario,
  onRunSelected,
  onCompareAll,
}: ControlPanelProps) {
  const [draftRows, setDraftRows] = useState<string>(String(rows));
  const [draftCols, setDraftCols] = useState<string>(String(cols));

  useEffect(() => {
    setDraftRows(String(rows));
    setDraftCols(String(cols));
  }, [rows, cols]);

  function handleSizeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedRows = Number(draftRows);
    const parsedCols = Number(draftCols);
    onResizeGrid(parsedRows, parsedCols);
  }

  return (
    <section className="panel control-panel" aria-label="Bảng điều khiển cấu hình">
      <div className="control-grid">
        <div className="control-group">
          <span className="control-label">1. Thuật toán tìm kiếm (FR02)</span>
          <div className="segmented-buttons" role="radiogroup" aria-label="Chọn thuật toán">
            {ORDERED_ALGORITHMS.map((algo) => {
              const isSelected = algo.id === selectedAlgorithm;
              return (
                <button
                  key={algo.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`seg-btn ${isSelected ? 'seg-btn--active' : ''}`}
                  onClick={() => onSelectAlgorithm(algo.id)}
                >
                  <strong>{algo.shortName}</strong>
                  <span className="seg-sub">
                    {algo.isOptimalOnUnitGrid ? 'Tối ưu' : 'Không bảo đảm tối ưu'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="control-group">
          <span className="control-label">2. Công cụ chỉnh bản đồ (FR01)</span>
          <div className="tool-row">
            <button
              type="button"
              className={`tool-btn ${editMode === 'wall' ? 'tool-btn--active' : ''}`}
              aria-pressed={editMode === 'wall'}
              onClick={() => onSelectEditMode('wall')}
            >
              <span className="swatch swatch--wall" aria-hidden="true" />
              Vẽ / Xóa tường
            </button>
            <button
              type="button"
              className={`tool-btn ${editMode === 'start' ? 'tool-btn--active' : ''}`}
              aria-pressed={editMode === 'start'}
              onClick={() => onSelectEditMode('start')}
            >
              <span className="swatch swatch--start" aria-hidden="true" />
              Đặt Start (S)
            </button>
            <button
              type="button"
              className={`tool-btn ${editMode === 'goal' ? 'tool-btn--active' : ''}`}
              aria-pressed={editMode === 'goal'}
              onClick={() => onSelectEditMode('goal')}
            >
              <span className="swatch swatch--goal" aria-hidden="true" />
              Đặt Goal (G)
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={onClearWalls}
            >
              Xóa hết tường
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={onResetDefaultGrid}
            >
              Mặc định 10×10
            </button>
          </div>
        </div>

        <div className="control-group control-group--inline">
          <form className="size-form" onSubmit={handleSizeSubmit}>
            <span className="control-label">
              3. Kích thước lưới ({MIN_GRID_SIZE}–{MAX_GRID_SIZE})
            </span>
            <div className="size-inputs">
              <label className="field-inline">
                <span>Hàng</span>
                <input
                  type="number"
                  min={MIN_GRID_SIZE}
                  max={MAX_GRID_SIZE}
                  step={1}
                  value={draftRows}
                  onChange={(e) => setDraftRows(e.target.value)}
                  aria-label="Số hàng"
                />
              </label>
              <span className="size-sep" aria-hidden="true">
                ×
              </span>
              <label className="field-inline">
                <span>Cột</span>
                <input
                  type="number"
                  min={MIN_GRID_SIZE}
                  max={MAX_GRID_SIZE}
                  step={1}
                  value={draftCols}
                  onChange={(e) => setDraftCols(e.target.value)}
                  aria-label="Số cột"
                />
              </label>
              <button type="submit" className="secondary-btn">
                Áp dụng
              </button>
            </div>
          </form>

          <div className="run-actions">
            <span className="control-label">4. Thực thi & So sánh</span>
            <div className="action-buttons">
              <button type="button" className="primary-btn" onClick={onRunSelected}>
                Mô phỏng {ORDERED_ALGORITHMS.find((a) => a.id === selectedAlgorithm)?.shortName}
              </button>
              <button type="button" className="accent-btn" onClick={onCompareAll}>
                So sánh cả 5 thuật toán
              </button>
            </div>
          </div>
        </div>

        {isMockMode && (
          <div className="control-group scenario-bar">
            <div className="scenario-header">
              <span className="control-label">
                Bộ kịch bản Mock chuẩn hợp đồng (P2-03)
              </span>
              <span className="badge badge--mock">Mock MeasuredSearchResult</span>
            </div>
            <div className="scenario-buttons">
              {MOCK_SCENARIO_PRESETS.map((preset) => {
                const isCurrent = activeScenario === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`scenario-btn ${isCurrent ? 'scenario-btn--active' : ''}`}
                    onClick={() => onSelectScenario(preset.id)}
                    title={preset.description}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
