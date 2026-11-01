# Project brief — AI Pathfinding Visualizer

## Bối cảnh và mục tiêu

Nhóm ba sinh viên thực hiện bài tập lớn Nhập môn Trí tuệ nhân tạo, hạn nộp 07/11/2026 lúc 23:59 giờ Việt Nam. Ứng dụng mô phỏng từng bước và so sánh các thuật toán tìm đường trong không gian trạng thái.

## MVP đã duyệt

Lưới 2D hình chữ nhật hữu hạn gồm ô trống và tường, mặc định 10×10, tối đa 20×20; đi lên, phải, xuống, trái với chi phí 1 mỗi bước. Start được phép trùng goal: đường kết quả gồm một ô, chi phí 0. Năm thuật toán: BFS, DFS, Uniform-Cost Search (UCS), Greedy Best-First Search và A*. Người dùng chọn thuật toán, bước/chạy/tạm dừng/đặt lại và xem frontier, các nút mở rộng, đường đi và bảng so sánh trên cùng bản đồ.

BFS, UCS và A* với heuristic Manhattan tìm đường tối ưu trong mô hình đồng chi phí này; DFS và Greedy không bảo đảm tối ưu. Không đưa đồ thị tổng quát, bản đồ trọng số, đi chéo, sinh mê cung, backend hay thư viện tìm đường có sẵn vào MVP.

## Kiến trúc

- `src/domain/`: kiểu dữ liệu, kiểm tra đầu vào và láng giềng.
- `src/algorithms/`: thuật toán TypeScript thuần, không phụ thuộc React.
- `src/metrics/`: đo thời gian và số liệu.
- `src/components/`: lưới, điều khiển, bảng so sánh.
- `src/app/`: state và điều phối phát lại.
- `tests/`: kiểm thử domain, thuật toán và số liệu.

UI phát lại `SearchStep`; `SearchResult` là nguồn dữ liệu kết quả. Quy ước chi tiết và interface ở `01_REQUIREMENTS.md`, quyết định chính thức ở `P0_DECISION.md`.

## Timeline

- 31/10: duyệt phạm vi, interface, khởi tạo project.
- 01–02/11: triển khai module độc lập.
- 03/11: tích hợp lần đầu.
- 04/11: hoàn thiện MVP và kiểm thử.
- 05/11: thực nghiệm và báo cáo.
- 06/11: nghiệm thu nội bộ, deploy.
- 07/11: nộp bài.

Tài liệu môn học tham khảo: `course_materials/TTNT 03 SOLVING PROBLEMS BY SEARCHING.pdf` và `course_materials/TTNT 04 INFORMED SEARCH.pdf`.
