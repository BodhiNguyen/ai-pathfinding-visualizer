# AI Pathfinding Visualizer

Ứng dụng web trực quan hóa **thuật toán tìm kiếm đường đi trên lưới 2D**, phục vụ đồ án môn **Nhập môn Trí tuệ nhân tạo**. Người học có thể tạo chướng ngại vật, thay đổi điểm bắt đầu/đích, quan sát quá trình tìm kiếm và so sánh các thuật toán trên cùng một bản đồ.

**Repository:** https://github.com/BodhiNguyen/ai-pathfinding-visualizer

## Tính năng

- Tạo và chỉnh sửa lưới, tường, điểm bắt đầu (**Start**) và điểm đích (**Goal**).
- Chạy từng thuật toán và trực quan hóa ô đang xét, frontier, các ô đã duyệt và đường đi tìm được.
- Điều khiển mô phỏng: phát/tạm dừng, đi từng bước, đặt lại và điều chỉnh tốc độ.
- So sánh năm thuật toán trên cùng một lưới theo chi phí đường đi, số nút mở rộng, số bước và thời gian thực thi đo được.
- Hiển thị thông tin giải thích cơ bản về thuật toán.

## Thuật toán

| Thuật toán | Nguyên tắc lựa chọn | Đường đi ngắn nhất trong mô hình này |
| --- | --- | --- |
| **BFS** (Breadth-First Search) | Duyệt theo hàng đợi FIFO | Có |
| **DFS** (Depth-First Search) | Duyệt theo ngăn xếp LIFO | Không bảo đảm |
| **UCS** (Uniform-Cost Search) | Ưu tiên chi phí tích lũy `g(n)` nhỏ nhất | Có |
| **Greedy Best-First Search** | Ưu tiên heuristic `h(n)` nhỏ nhất | Không bảo đảm |
| **A\*** | Ưu tiên `f(n) = g(n) + h(n)` nhỏ nhất | Có |

**Mô hình lưới:** 1–20 hàng và 1–20 cột (mặc định 10×10); di chuyển **lên, phải, xuống, trái**, mỗi bước có chi phí 1. Không đi xuyên tường, không hỗ trợ đường chéo hoặc ô có trọng số khác nhau. Heuristic được sử dụng là **khoảng cách Manhattan**. Các nhận định tối ưu trong bảng chỉ áp dụng cho mô hình này.

## Công nghệ

- **React + TypeScript** — giao diện và logic ứng dụng.
- **Vite** — development server và production build.
- **Vitest + jsdom** — kiểm thử tự động.

## Cài đặt và chạy

Yêu cầu **Node.js** và **npm**. Môi trường tham chiếu đã sử dụng: Node.js `24.18.0`, npm `11.16.0`; phiên bản khác cần kiểm tra tương thích với `package-lock.json`.

```bash
git clone https://github.com/BodhiNguyen/ai-pathfinding-visualizer.git
cd ai-pathfinding-visualizer
git checkout main
npm ci
npm run dev
```

Mở địa chỉ localhost do Vite hiển thị trong terminal.

### Kiểm thử

```bash
npm test
```

### Build và xem bản production tại máy

```bash
npm run build
npm run preview
```

`npm run preview` chỉ chạy bản build **tại máy**, không phải địa chỉ demo đã triển khai công khai.

## Hướng dẫn trải nghiệm

1. Mở ứng dụng, chọn **Vẽ / Xóa tường**, **Đặt Start (S)** hoặc **Đặt Goal (G)** để cấu hình lưới.
2. Chọn một trong năm thuật toán, nhấn **Mô phỏng** để quan sát tiến trình tìm kiếm.
3. Sử dụng các nút điều khiển playback để xem từng bước hoặc thay đổi tốc độ.
4. Chọn **So sánh cả 5 thuật toán** để xem các chỉ số trên cùng bản đồ.
5. Thay đổi tường hoặc vị trí Start/Goal, sau đó chạy lại để quan sát sự khác biệt.

## Trạng thái xác minh

Trong lần **P4-RC.1 isolated verification**, bản ứng viên với tám file P3 đã được TV01 phê duyệt fingerprint có kết quả:

| Hạng mục | Kết quả |
| --- | --- |
| `npm ci` | PASS |
| Unit/integration tests | **160/160 PASS**, 10 suites |
| Production build | PASS |
| Browser: tải ứng dụng, so sánh 5 thuật toán, BFS path, thay đổi lưới, step/reset | Đã kiểm tra |
| Browser: đường đi riêng từng thuật toán, validation, start/pause/resume, speed, rerun, error states, đối chiếu đầy đủ expected results | **Chưa xác minh đầy đủ** |
| Tổng trạng thái P4-RC | **PARTIAL** |

Đây là kết quả kiểm tra trên **bản sao cô lập**, không phải bằng chứng một bản deploy công khai đã được nghiệm thu. Thời gian chạy thuật toán thay đổi theo thiết bị và môi trường, không nên xem một phép đo là benchmark tổng quát.

## Giới hạn

- Chỉ hỗ trợ lưới nhỏ, không trọng số và di chuyển bốn hướng.
- DFS và Greedy không bảo đảm tìm đường đi ngắn nhất.
- Một số kịch bản kiểm thử giao diện vẫn cần được xác minh thêm.
- Chưa công bố URL demo trực tuyến đã xác nhận trong tài liệu này.

## Nhóm thực hiện

**Môn học:** Nhập môn Trí tuệ nhân tạo — PTIT.

| Thành viên | Mã sinh viên | Vai trò chính | Đóng góp |
| --- | --- | --- | ---: |
| Nguyễn Đăng Khoa (TV01) | K24DTCN398 | Trưởng nhóm; domain, kiểm thử, điều phối tích hợp và báo cáo | 40% |
| Nguyễn Trung Dũng (TV02) | K24DTCN412 | Thuật toán tìm kiếm, đường đi, snapshots và kiểm thử | 30% |
| Nguyễn Cao Thắng (TV03) | K24DTCN406 | Giao diện, playback, thống kê và kiểm thử | 30% |

Phân công và tỷ lệ đóng góp theo xác nhận của trưởng nhóm; không hàm ý mọi hạng mục đã nghiệm thu hoàn toàn.

## Tài liệu tham khảo

Nội dung lý thuyết được xây dựng trong phạm vi học phần Nhập môn Trí tuệ nhân tạo và tài liệu giảng dạy của môn học. Chi tiết trích dẫn học thuật được trình bày trong báo cáo đồ án.
