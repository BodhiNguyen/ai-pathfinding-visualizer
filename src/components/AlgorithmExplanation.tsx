import {
  ALGORITHM_METADATA,
  ORDERED_ALGORITHMS,
} from '../app/algorithmInfo';
import type { AlgorithmId } from '../domain/types';

export interface AlgorithmExplanationProps {
  readonly selectedAlgorithm: AlgorithmId;
  readonly onSelectAlgorithm: (algorithm: AlgorithmId) => void;
}

export function AlgorithmExplanation({
  selectedAlgorithm,
  onSelectAlgorithm,
}: AlgorithmExplanationProps) {
  const active = ALGORITHM_METADATA[selectedAlgorithm];

  return (
    <section
      className="panel explanation-panel"
      aria-label="Giải thích quy tắc chọn nút và tính tối ưu"
    >
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Giải thích thuật toán (FR06)</h2>
          <p className="panel-subtitle">
            Quy tắc chọn nút tiếp theo từ Frontier và tính tối ưu trên lưới đồng chi phí (c = 1)
          </p>
        </div>
        <span
          className={`badge ${
            active.isOptimalOnUnitGrid ? 'badge--optimal' : 'badge--warning'
          }`}
        >
          {active.optimalitySummary}
        </span>
      </div>

      <article className="algo-detail-card">
        <div className="algo-detail-header">
          <h3>{active.fullName}</h3>
          <span className="algo-category">{active.category}</span>
        </div>

        <dl className="algo-specs">
          <div>
            <dt>Cấu trúc Frontier</dt>
            <dd>{active.frontierStructure}</dd>
          </div>
          <div>
            <dt>Hàm đánh giá</dt>
            <dd>
              <code>{active.evaluationFormula}</code>
            </dd>
          </div>
          <div className="algo-specs--wide">
            <dt>Quy tắc chọn nút & hòa ưu tiên</dt>
            <dd>{active.selectionRule}</dd>
          </div>
          <div className="algo-specs--wide">
            <dt>Nhận xét tính tối ưu</dt>
            <dd>{active.explanation}</dd>
          </div>
        </dl>
      </article>

      <div className="algo-quick-list" aria-label="Tóm tắt nhanh 5 thuật toán">
        {ORDERED_ALGORITHMS.map((algo) => (
          <button
            key={algo.id}
            type="button"
            className={`algo-summary-chip ${
              algo.id === selectedAlgorithm ? 'algo-summary-chip--active' : ''
            }`}
            onClick={() => onSelectAlgorithm(algo.id)}
          >
            <strong>{algo.shortName}</strong>
            <span>{algo.evaluationFormula}</span>
            <em className={algo.isOptimalOnUnitGrid ? 'text-optimal' : 'text-nonoptimal'}>
              {algo.isOptimalOnUnitGrid ? 'Tối ưu' : 'Không bảo đảm tối ưu'}
            </em>
          </button>
        ))}
      </div>
    </section>
  );
}
