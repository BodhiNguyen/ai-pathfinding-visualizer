import { layThuatToan } from '../algorithms';
import type { SearchExecutor } from './mockSearchService';

export const runRealSearch: SearchExecutor = (problem, algorithmId) => {
  const search = layThuatToan(algorithmId);
  const start = performance.now();
  const result = search(problem);
  const durationMs = performance.now() - start;
  return { result, durationMs };
};
