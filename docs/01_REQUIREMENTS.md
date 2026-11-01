# Yêu cầu và hợp đồng module

## Yêu cầu chức năng MVP

| ID | Yêu cầu | Tiêu chí nghiệm thu |
| --- | --- | --- |
| FR01 | Tạo/chỉnh lưới, tường, start, goal | Lưới mặc định 10×10, mỗi chiều 1–20; mỗi loại có đúng một vị trí, có thể trùng nhau, không nằm trên tường |
| FR02 | Chọn BFS, DFS, UCS, Greedy, A* | Cùng bản đồ đầu vào cho mọi thuật toán |
| FR03 | Mô phỏng | Bước, chạy, tạm dừng, đặt lại; hiển thị nút đang xét, frontier, explored, đường cuối |
| FR04 | Kết quả | Phân biệt tìm thấy/không có đường; đường theo thứ tự start đến goal; start trùng goal trả một ô, chi phí 0 |
| FR05 | So sánh | Cùng định nghĩa số bước, chi phí, số nút mở rộng và thời gian thực đo |
| FR06 | Giải thích | Hiển thị quy tắc chọn nút và lưu ý tính tối ưu của từng thuật toán |

## Quy ước chung

- Tọa độ `(row, col)` bắt đầu từ 0. Xét láng giềng theo thứ tự lên, phải, xuống, trái; bỏ ô ngoài lưới và tường. DFS phải xử lý stack để thứ tự lấy nút chưa thăm tuân theo thứ tự này.
- Mỗi bước giá 1; khi tìm thấy, `pathCost = path.length - 1`; không có đường: `path=[]`, `pathCost=null`.
- Manhattan `h=|row-goal.row|+|col-goal.col|`; UCS ưu tiên `g`, Greedy ưu tiên `h`, A* ưu tiên `g+h`. Cùng ưu tiên thì lấy mục được thêm vào frontier trước; khi cập nhật ưu tiên, mục mới lấy thứ tự thêm mới.
- Graph search tránh vòng lặp. A* cập nhật khi tìm thấy đường tốt hơn; các mục frontier cũ không còn hợp lệ bị bỏ qua, không tính mở rộng.
- Một nút được tính mở rộng mỗi lần lấy mục hợp lệ khỏi frontier để xử lý, **bao gồm goal**; mục cũ không hợp lệ không được đếm. `steps` ghi một snapshot sau mỗi lần xử lý hợp lệ, kể cả goal; goal không sinh láng giềng. `expandedCount = steps.length`. Vì thế start trùng goal có một bước mở rộng.
- `frontier` trong snapshot theo thứ tự sẽ lấy tiếp; `explored` là các ID đã xử lý theo thứ tự xử lý. Đầu vào sai bị từ chối với lỗi mô tả, không coi là không có đường.
- `durationMs` đo bằng `performance.now()` ngay trước và sau lời gọi thuật toán đồng bộ, bao gồm tạo các snapshot, không gồm animation/render; không nằm trong `SearchResult`. Ghi thiết bị, trình duyệt và số lần chạy khi thực nghiệm.

## Interface dùng chung

Định nghĩa TypeScript chính thức nằm tại `src/domain/types.ts`; ID thuật toán gồm `bfs`, `dfs`, `ucs`, `greedy`, `astar`. `SearchAlgorithm` nhận `GridProblem` và trả `SearchResult`; UI dùng snapshot để phát lại. Kiểu `MeasuredSearchResult` ghép kết quả với thời gian đo.

## Kiểm thử và phi chức năng

Xem `03_TEST_PLAN.md`. Mã rõ ràng, tách domain/algorithm/UI, không dùng thư viện tìm đường; khi chỉnh bản đồ trong lúc chạy phải dừng và xóa kết quả cũ. Chỉ ghi số liệu thực nghiệm sau khi đo thật.
