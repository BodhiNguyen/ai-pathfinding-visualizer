// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/app/App';
import { runRealSearch } from '../../src/app/realSearchService';
import { DEFAULT_PLAYBACK_SPEED_MS } from '../../src/app/playbackState';
import { kiemTraBanDo } from '../../src/domain';

let container: HTMLDivElement;
let root: Root | null;

function clickButton(label: string) {
  const button = [...container.querySelectorAll('button')].find((item) => item.textContent?.trim() === label);
  expect(button, `button ${label}`).toBeDefined();
  act(() => button!.click());
}

function playbackText() {
  return container.querySelector('[aria-label="Điều khiển phát lại mô phỏng"]')!.textContent!;
}

beforeEach(() => {
  vi.useFakeTimers();
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  if (root) act(() => root!.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
});

describe('mounted App evidence', () => {
  it('F06: recovers from an executor failure in the same mounted app', () => {
    const executor = vi.fn<typeof runRealSearch>()
      .mockImplementationOnce(() => { throw new Error('Distinctive executor failure'); })
      .mockImplementation((problem, algorithm) => runRealSearch(problem, algorithm));
    act(() => root!.render(<App executor={executor} />));
    clickButton('Mô phỏng BFS');
    expect(executor).toHaveBeenCalledTimes(1);
    const [problem, algorithm] = executor.mock.calls[0];
    expect(algorithm).toBe('bfs');
    expect(() => kiemTraBanDo(problem)).not.toThrow();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Distinctive executor failure');
    expect(playbackText()).toContain('Chưa nạp kết quả');
    expect(playbackText()).toContain('0 / 0');
    expect(container.querySelectorAll('.metric-value')[0].textContent).toBe('—');
    expect(container.querySelector('[data-path="true"]')).toBeNull();

    clickButton('Mô phỏng BFS');
    expect(executor).toHaveBeenCalledTimes(2);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    const result = executor.mock.results[1].value!.result;
    expect(result.found).toBe(true);
    expect(playbackText()).toContain(`0 / ${result.steps.length}`);
    const metrics = [...container.querySelectorAll('.metric-value')].map((node) => node.textContent);
    expect(metrics.slice(0, 3)).toEqual([String(result.expandedCount), String(result.pathCost), String(result.steps.length)]);
    expect(container.querySelector('.path-box code')?.textContent).not.toBe(result.path.join(' → '));
    for (let i = 0; i < result.steps.length; i++) {
      act(() => { vi.advanceTimersByTime(DEFAULT_PLAYBACK_SPEED_MS); });
    }
    expect(playbackText()).toContain('Đã kết thúc');
    expect(container.querySelector('.path-box code')?.textContent).toBe(result.path.join(' → '));
    expect([...container.querySelectorAll('[data-path="true"]')].map((node) => node.getAttribute('data-cell-id')).sort()).toEqual([...result.path].sort());
  });

  it('G04: clears the active playback interval on unmount and prevents further ticks', () => {
    const baseline = vi.getTimerCount();
    const originalSetInterval = window.setInterval.bind(window);
    const tick = vi.fn();
    const setIntervalSpy = vi.spyOn(window, 'setInterval').mockImplementation((handler, timeout) =>
      originalSetInterval(() => { tick(); (handler as () => void)(); }, timeout),
    );
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    const executor = vi.fn<typeof runRealSearch>().mockImplementation((problem, algorithm) => runRealSearch(problem, algorithm));
    act(() => root!.render(<App executor={executor} />));
    clickButton('Mô phỏng BFS');
    expect(executor.mock.results[0].value!.result.steps.length).toBeGreaterThan(2);
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    expect(setIntervalSpy.mock.calls[0][1]).toBe(DEFAULT_PLAYBACK_SPEED_MS);
    const timerId = setIntervalSpy.mock.results[0].value;
    expect(vi.getTimerCount()).toBe(baseline + 1);
    expect(playbackText()).toContain('0 /');
    act(() => { vi.advanceTimersByTime(DEFAULT_PLAYBACK_SPEED_MS); });
    expect(tick).toHaveBeenCalledTimes(1);
    expect(playbackText()).toContain('1 /');
    expect(playbackText()).toContain('Đang phát tự động');
    act(() => root!.unmount());
    root = null;
    expect(clearIntervalSpy).toHaveBeenCalledWith(timerId);
    expect(vi.getTimerCount()).toBe(baseline);
    act(() => { vi.advanceTimersByTime(DEFAULT_PLAYBACK_SPEED_MS * 3); });
    expect(tick).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(baseline);
  });
});
