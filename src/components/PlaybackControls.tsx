import {
  MAX_PLAYBACK_SPEED_MS,
  MIN_PLAYBACK_SPEED_MS,
  type DerivedPlaybackView,
  type PlaybackState,
} from '../app/playbackState';

export interface PlaybackControlsProps {
  readonly playbackState: PlaybackState;
  readonly playbackView: DerivedPlaybackView;
  readonly onPlay: () => void;
  readonly onPause: () => void;
  readonly onStepForward: () => void;
  readonly onStepBackward: () => void;
  readonly onReset: () => void;
  readonly onJumpToStep: (stepIndex: number) => void;
  readonly onChangeSpeed: (speedMs: number) => void;
}

const STATUS_LABELS: Record<PlaybackState['status'], string> = {
  IDLE: 'Chưa nạp kết quả',
  READY: 'Sẵn sàng (trước bước 1)',
  PLAYING: 'Đang phát tự động',
  PAUSED: 'Tạm dừng',
  FINISHED: 'Đã kết thúc',
};

export function PlaybackControls({
  playbackState,
  playbackView,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onReset,
  onJumpToStep,
  onChangeSpeed,
}: PlaybackControlsProps) {
  const { isPlaying, speedMs, status } = playbackState;
  const { hasResult, currentStepNumber, totalSteps, activeStep } = playbackView;

  const canStepBackward = hasResult && playbackState.stepIndex >= 0;
  const canStepForward = !hasResult || playbackState.stepIndex < totalSteps - 1;
  const canReset = hasResult && (playbackState.stepIndex >= 0 || isPlaying);

  return (
    <section className="panel playback-panel" aria-label="Điều khiển phát lại mô phỏng">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Điều khiển mô phỏng (FR03)</h2>
          <p className="panel-subtitle">
            Trạng thái: <strong>{STATUS_LABELS[status]}</strong> • Tiến độ:{' '}
            <strong>
              {currentStepNumber} / {totalSteps}
            </strong>{' '}
            snapshot
          </p>
        </div>
        <span className={`status-pill status-pill--${status.toLowerCase()}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      <div className="playback-buttons">
        {isPlaying ? (
          <button type="button" className="primary-btn" onClick={onPause}>
            ⏸ Pause (Tạm dừng)
          </button>
        ) : (
          <button type="button" className="primary-btn" onClick={onPlay}>
            ▶ {status === 'FINISHED' ? 'Play lại từ đầu' : 'Play (Chạy)'}
          </button>
        )}

        <button
          type="button"
          className="secondary-btn"
          onClick={onStepBackward}
          disabled={!canStepBackward}
        >
          ⏮ Lùi
        </button>

        <button
          type="button"
          className="secondary-btn"
          onClick={onStepForward}
          disabled={!canStepForward}
        >
          ⏭ Step (Từng bước)
        </button>

        <button
          type="button"
          className="secondary-btn"
          onClick={onReset}
          disabled={!canReset}
        >
          ↺ Reset (Đặt lại)
        </button>
      </div>

      <div className="scrubber-row">
        <label className="slider-field">
          <span>
            Thanh bước phát ({currentStepNumber}/{totalSteps})
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0, totalSteps)}
            step={1}
            value={currentStepNumber}
            disabled={!hasResult || totalSteps === 0}
            onChange={(e) => onJumpToStep(Number(e.target.value) - 1)}
            aria-label="Thanh trượt bước snapshot"
          />
        </label>

        <label className="slider-field">
          <span>Tốc độ mỗi bước: {speedMs} ms</span>
          <input
            type="range"
            min={MIN_PLAYBACK_SPEED_MS}
            max={MAX_PLAYBACK_SPEED_MS}
            step={20}
            value={speedMs}
            onChange={(e) => onChangeSpeed(Number(e.target.value))}
            aria-label="Tốc độ phát mỗi bước tính bằng mili-giây"
          />
        </label>
      </div>

      <div className="snapshot-inspector" aria-live="polite">
        <div className="inspector-item">
          <span className="inspector-label">Current node:</span>
          <code>{activeStep ? activeStep.current : '— (chưa chạy)'}</code>
        </div>
        <div className="inspector-item">
          <span className="inspector-label">
            Frontier ({activeStep ? activeStep.frontier.length : 0}, thứ tự lấy tiếp):
          </span>
          <code className="code-wrap">
            {activeStep && activeStep.frontier.length > 0
              ? activeStep.frontier.join(' → ')
              : '[]'}
          </code>
        </div>
        <div className="inspector-item">
          <span className="inspector-label">
            Explored ({activeStep ? activeStep.explored.length : 0}, thứ tự xử lý):
          </span>
          <code className="code-wrap">
            {activeStep && activeStep.explored.length > 0
              ? activeStep.explored.join(' → ')
              : '[]'}
          </code>
        </div>
      </div>
    </section>
  );
}
