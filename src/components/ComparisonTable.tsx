import { ORDERED_ALGORITHMS } from '../app/algorithmInfo';
import type { AlgorithmId, MeasuredSearchResult } from '../domain/types';

export interface ComparisonTableProps {
  readonly comparisonResults: Readonly<Record<AlgorithmId, MeasuredSearchResult>> | null;
  readonly selectedAlgorithm: AlgorithmId;
  readonly isMockMode: boolean;
  readonly onRunComparison: () => void;
  readonly onInspectAlgorithm: (algorithm: AlgorithmId) => void;
}

export function ComparisonTable({
  comparisonResults,
  selectedAlgorithm,
  isMockMode,
  onRunComparison,
  onInspectAlgorithm,
}: ComparisonTableProps) {
  let minPathCost: number | null = null;
  if (comparisonResults) {
    for (const algo of ORDERED_ALGORITHMS) {
      const cost = comparisonResults[algo.id]?.result.pathCost ?? null;
      if (cost !== null && (minPathCost === null || cost < minPathCost)) {
        minPathCost = cost;
      }
    }
  }

  return (
    <section className="panel comparison-panel" aria-label="Bảng so sánh 5 thuật toán">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">So sánh trên cùng bản đồ (FR05)</h2>
          <p className="panel-subtitle">
            Cùng định nghĩa số bước duyệt, chi phí cạnh, số nút mở rộng và thời gian{' '}
            {isMockMode ? '(Mock MeasuredSearchResult)' : '(thực đo)'}
          </p>
        </div>
        <button type="button" className="accent-btn" onClick={onRunComparison}>
          Chạy so sánh 5 thuật toán
        </button>
      </div>

      {!comparisonResults ? (
        <p className="empty-hint">
          Bấm <strong>“So sánh cả 5 thuật toán”</strong> để chạy đồng thời BFS, DFS, UCS,
          Greedy và A* trên bản đồ hiện tại (mỗi khi chỉnh sửa bản đồ, bảng kết quả cũ sẽ được xóa tự động).
        </p>
      ) : (
        <div className="table-scroll">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Thuật toán</th>
                <th>Kết quả</th>
                <th>Chi phí (Path Cost)</th>
                <th>Nút mở rộng (Expanded)</th>
                <th>Số bước (Steps)</th>
                <th>Thời gian (ms)</th>
                <th>Bảo đảm tối ưu</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {ORDERED_ALGORITHMS.map((algo) => {
                const entry = comparisonResults[algo.id];
                const { result, durationMs } = entry;
                const isBestCost =
                  minPathCost !== null &&
                  result.found &&
                  result.pathCost === minPathCost;
                const isActive = algo.id === selectedAlgorithm;

                return (
                  <tr
                    key={algo.id}
                    className={isActive ? 'comparison-row--active' : undefined}
                  >
                    <td>
                      <strong>{algo.shortName}</strong>
                    </td>
                    <td>
                      <span
                        className={`table-badge ${
                          result.found ? 'table-badge--ok' : 'table-badge--fail'
                        }`}
                      >
                        {result.found ? 'Tìm thấy' : 'Không có đường'}
                      </span>
                    </td>
                    <td>
                      {result.pathCost === null ? (
                        '—'
                      ) : (
                        <>
                          <strong>{result.pathCost}</strong>
                          {isBestCost && (
                            <span className="optimal-chip">Ngắn nhất</span>
                          )}
                        </>
                      )}
                    </td>
                    <td>{result.expandedCount}</td>
                    <td>{result.steps.length}</td>
                    <td>{durationMs.toFixed(2)}</td>
                    <td>
                      <span
                        className={
                          algo.isOptimalOnUnitGrid ? 'text-optimal' : 'text-nonoptimal'
                        }
                      >
                        {algo.isOptimalOnUnitGrid ? 'Có' : 'Không bảo đảm tối ưu'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="mini-btn"
                        onClick={() => onInspectAlgorithm(algo.id)}
                      >
                        Xem trên lưới
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
