# P2 — API contract freeze

`src/domain/types.ts` và `01_REQUIREMENTS.md` là hợp đồng hiện hành; tài liệu này chốt tên, chữ ký và vị trí export bổ sung, chưa phải implementation. Không tự thay đổi hợp đồng đã duyệt.

## Domain — `src/domain/index.ts`

```ts
export function taoCellId(position: Position): CellId;
export function docCellId(cellId: CellId): Position;
export function kiemTraBanDo(problem: GridProblem): void;
export function layLangGieng(problem: GridProblem, position: Position): readonly Position[];
```

Các kiểu lấy từ `src/domain/types.ts`. `taoCellId` tạo chuỗi `row,col` từ tọa độ nguyên không âm; `docCellId` chỉ nhận đúng định dạng đó và trả tọa độ tương ứng. Hai hàm ném `Error` mô tả nếu đầu vào không hợp lệ. `kiemTraBanDo` trả `void` nếu hợp lệ, nếu không ném `Error` mô tả: kích thước nguyên 1–20, tọa độ và ID tường hợp lệ trong lưới, start/goal không nằm trên tường; start được trùng goal. `layLangGieng` xác thực bản đồ và position trong lưới, không phải tường; sai thì ném `Error` mô tả. Kết quả theo thứ tự lên, phải, xuống, trái, bỏ ô ngoài lưới và tường.

## Algorithms — `src/algorithms/index.ts`

```ts
export const timBFS: SearchAlgorithm;
export const timDFS: SearchAlgorithm;
export const timUCS: SearchAlgorithm;
export const timGreedy: SearchAlgorithm;
export const timAStar: SearchAlgorithm;
export function layThuatToan(algorithmId: AlgorithmId): SearchAlgorithm;
```

`SearchAlgorithm` nhận `GridProblem` và đồng bộ trả `SearchResult`. Mỗi hàm kiểm tra đầu vào và ném `Error` mô tả khi sai; không chuyển lỗi thành kết quả không có đường. Registry trả đúng hàm theo ID `bfs`, `dfs`, `ucs`, `greedy`, `astar`; ID không hợp lệ tại runtime bị từ chối bằng `Error` mô tả. Quy tắc snapshot, thứ tự, chi phí và trường hợp biên theo `01_REQUIREMENTS.md`; thời gian nằm trong `MeasuredSearchResult`, không nằm trong `SearchResult`.
