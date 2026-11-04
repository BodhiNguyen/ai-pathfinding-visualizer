import { ALGORITHM_IDS, type AlgorithmId } from '../domain/types';

export interface AlgorithmMetadata {
  readonly id: AlgorithmId;
  readonly shortName: string;
  readonly fullName: string;
  readonly category: 'Không có thông tin (Uninformed)' | 'Có thông tin (Informed)';
  readonly frontierStructure: string;
  readonly selectionRule: string;
  readonly evaluationFormula: string;
  readonly isOptimalOnUnitGrid: boolean;
  readonly optimalitySummary: string;
  readonly explanation: string;
}

export const ALGORITHM_METADATA: Readonly<Record<AlgorithmId, AlgorithmMetadata>> = {
  bfs: {
    id: 'bfs',
    shortName: 'BFS',
    fullName: 'Breadth-First Search (Tìm kiếm theo chiều rộng)',
    category: 'Không có thông tin (Uninformed)',
    frontierStructure: 'Hàng đợi FIFO (First-In, First-Out)',
    selectionRule:
      'Lấy nút được đưa vào frontier sớm nhất; mở rộng lần lượt theo từng lớp khoảng cách từ Start (xét láng giềng Lên → Phải → Xuống → Trái).',
    evaluationFormula: 'Theo độ sâu lớp duyệt d(n)',
    isOptimalOnUnitGrid: true,
    optimalitySummary: 'Đảm bảo tối ưu (lưới đồng chi phí c = 1)',
    explanation:
      'Vì mọi bước di chuyển đều có chi phí bằng 1, việc duyệt hết các nút ở khoảng cách k trước khi sang k + 1 bảo đảm đường tìm thấy đầu tiên tới Goal có số cạnh và chi phí nhỏ nhất.',
  },
  dfs: {
    id: 'dfs',
    shortName: 'DFS',
    fullName: 'Depth-First Search (Tìm kiếm theo chiều sâu)',
    category: 'Không có thông tin (Uninformed)',
    frontierStructure: 'Ngăn xếp LIFO (Last-In, First-Out)',
    selectionRule:
      'Ưu tiên đi sâu vào nhánh con mới nhất chưa thăm theo thứ tự láng giềng hợp đồng (Lên → Phải → Xuống → Trái), chỉ quay lui khi gặp ngõ cụt.',
    evaluationFormula: 'Ưu tiên độ sâu lớn nhất trên nhánh hiện tại',
    isOptimalOnUnitGrid: false,
    optimalitySummary: 'Không bảo đảm tối ưu',
    explanation:
      'DFS không xét chi phí đường đi hay khoảng cách tới đích nên có thể đi vòng rất dài trước khi chạm Goal, ngay cả khi tồn tại đường ngắn hơn ở nhánh chưa xét.',
  },
  ucs: {
    id: 'ucs',
    shortName: 'UCS',
    fullName: 'Uniform-Cost Search (Tìm kiếm chi phí đồng nhất)',
    category: 'Không có thông tin (Uninformed)',
    frontierStructure: 'Hàng đợi ưu tiên (Priority Queue) theo g(n)',
    selectionRule:
      'Luôn chọn nút trong frontier có chi phí đường đi tích lũy g(n) từ Start nhỏ nhất; nếu bằng nhau thì ưu tiên mục được thêm vào trước (FIFO).',
    evaluationFormula: 'f(n) = g(n)',
    isOptimalOnUnitGrid: true,
    optimalitySummary: 'Đảm bảo tối ưu (chi phí bước dương)',
    explanation:
      'UCS mở rộng các trạng thái theo thứ tự chi phí g(n) không giảm. Trên lưới đồng chi phí c = 1, hành vi mở rộng của UCS tương đương BFS và luôn trả về chi phí tối ưu.',
  },
  greedy: {
    id: 'greedy',
    shortName: 'Greedy',
    fullName: 'Greedy Best-First Search (Tìm kiếm tham lam)',
    category: 'Có thông tin (Informed)',
    frontierStructure: 'Hàng đợi ưu tiên (Priority Queue) theo h(n)',
    selectionRule:
      'Chọn nút có ước lượng khoảng cách Manhattan h(n) tới Goal nhỏ nhất mà không tính chi phí đã đi g(n); hòa ưu tiên xử lý theo thứ tự thêm (FIFO).',
    evaluationFormula: 'f(n) = h(n) = |r - r_goal| + |c - c_goal|',
    isOptimalOnUnitGrid: false,
    optimalitySummary: 'Không bảo đảm tối ưu',
    explanation:
      'Greedy thường hướng rất nhanh về phía Goal và mở rộng ít nút hơn tìm kiếm mù, nhưng vì bỏ qua g(n) nên dễ bị vật cản dẫn sang lộ trình dài hơn đường ngắn nhất.',
  },
  astar: {
    id: 'astar',
    shortName: 'A*',
    fullName: 'A* Search (Giải thuật tìm kiếm A*)',
    category: 'Có thông tin (Informed)',
    frontierStructure: 'Hàng đợi ưu tiên (Priority Queue) theo g(n) + h(n)',
    selectionRule:
      'Chọn nút có tổng chi phí thực tế g(n) và ước lượng Manhattan h(n) nhỏ nhất; hòa f(n) lấy mục thêm trước (FIFO), bỏ qua mục frontier cũ khi đã có đường tốt hơn.',
    evaluationFormula: 'f(n) = g(n) + h(n)',
    isOptimalOnUnitGrid: true,
    optimalitySummary: 'Đảm bảo tối ưu (Manhattan admissible & consistent)',
    explanation:
      'Trên lưới 4 hướng mỗi bước giá 1, khoảng cách Manhattan không bao giờ vượt quá chi phí thực tế (admissible) và thỏa bất đẳng thức tam giác (consistent), giúp A* vừa tìm đường tối ưu vừa giảm số nút mở rộng.',
  },
};

export const ORDERED_ALGORITHMS: readonly AlgorithmMetadata[] = ALGORITHM_IDS.map(
  (id) => ALGORITHM_METADATA[id],
);
