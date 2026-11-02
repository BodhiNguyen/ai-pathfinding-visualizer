import { ALGORITHM_METADATA } from '../app/algorithmInfo';
import type { DerivedPlaybackView } from '../app/playbackState';
import type { MeasuredSearchResult } from '../domain/types';

export interface StatsPanelProps {
  readonly measuredResult: MeasuredSearchResult | null;
  readonly playbackView: DerivedPlaybackView;
  readonly isMockMode: boolean;
}

export function StatsPanel({
  measuredResult,
  playbackView,
  isMockMode,
}: StatsPanelProps) {
  const result = measuredResult?.result ?? null;
  const meta = result ? ALGORITHM_METADATA[result.algorithm] : null;
  const isFinished = playbackView.status === 'FINISHED';

  return (
    <section className="panel stats-panel" aria-label="Thống kê kết quả tìm kiếm">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Kết quả & Thống kê (FR04, FR05)</h2>
          <p className="panel-subtitle">
            {meta ? meta.fullName : 'Chọn thuật toán và bấm Mô phỏng hoặc Play để xem số liệu'}
          </p>
        </div>
      </div>

      {playbackView.outcome === 'FOUND' && result && (
        <div className="outcome-banner outcome-banner--success" role="status">
          <strong>Tìm thấy đường đi!</strong>
          <span>
            {result.path.length === 1 && result.pathCost === 0
              ? 'Trường hợp biên Start trùng Goal: lộ trình gồm đúng 1 ô, chi phí bằng 0, 1 bước mở rộng.'
              : `Độ dài ${result.path.length} ô (chi phí ${result.pathCost} cạnh) sau ${result.expandedCount} bước mở rộng.`}
          </span>
        </div>
      )}

      {playbackView.outcome === 'NOT_FOUND' && (
        <div className="outcome-banner outcome-banner--failure" role="status">
          <strong>Không tìm thấy đường đi!</strong>
          <span>
            Frontier đã rỗng mà chưa chạm Goal (<code>found = false</code>,{' '}
            <code>path = []</code>, <code>pathCost = null</code>).
          </span>
        </div>
      )}

      {playbackView.outcome === 'IN_PROGRESS' && (
        <div className="outcome-banner outcome-banner--progress" role="status">
          <strong>Đang phát mô phỏng...</strong>
          <span>
            Đang ở bước {playbackView.currentStepNumber}/{playbackView.totalSteps}. Đường đi cuối cùng sẽ hiển thị khi tới bước kết thúc.
          </span>
        </div>
      )}

      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Số nút mở rộng (Expanded)</span>
          <strong className="metric-value">
            {result ? result.expandedCount : '—'}
          </strong>
          <span className="metric-sub">
            Hiện xét: {playbackView.activeStep ? playbackView.activeStep.explored.length : 0} nút
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Chi phí đường đi (Path Cost)</span>
          <strong className="metric-value">
            {!result
              ? '—'
              : result.pathCost !== null
                ? result.pathCost
                : 'Không có (null)'}
          </strong>
          <span className="metric-sub">
            {!result
              ? 'Mỗi cạnh giá 1'
              : result.found
                ? `${result.path.length} ô trên đường đi`
                : 'path = []'}
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Tổng số bước (Steps)</span>
          <strong className="metric-value">
            {result ? result.steps.length : '—'}
          </strong>
          <span className="metric-sub">
            Bước đang xem: {playbackView.currentStepNumber}
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Thời gian đo (Duration)</span>
          <strong className="metric-value">
            {measuredResult ? `${measuredResult.durationMs.toFixed(2)} ms` : '—'}
          </strong>
          <span className="metric-sub">
            {isMockMode ? 'Giá trị mẫu hợp đồng Mock' : 'Đo bằng performance.now()'}
          </span>
        </div>
      </div>

      <div className="path-box">
        <span className="inspector-label">
          Lộ trình từ Start đến Goal ({isFinished ? 'đã hoàn tất' : 'hiển thị khi kết thúc'}):
        </span>
        <code className="code-wrap">
          {!result
            ? '—'
            : !isFinished
              ? '(Hoàn tất phát lại tới bước cuối để hiển thị đường đi)'
              : result.found
                ? result.path.join(' → ')
                : '[] (Không có đường)'}
        </code>
      </div>
    </section>
  );
}
