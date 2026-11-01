# P0 — APPROVED_WITH_CONDITIONS

Quyết định của trưởng nhóm, 01/11/2026. Phạm vi và hợp đồng triển khai được ghi tại `00_PROJECT_BRIEF.md` và `01_REQUIREMENTS.md`.

## Quyết định

- **D01:** Lưới 2D hữu hạn, bốn hướng lên/phải/xuống/trái, mỗi bước giá 1; chưa có đồ thị tổng quát hoặc trọng số.
- **D02:** MVP gồm BFS, DFS, UCS, Greedy Best-First Search và A*.
- **D03:** Cho phép start trùng goal; đường một ô, chi phí 0, có kiểm thử.
- **D04:** Mặc định 10×10, tối đa 20×20; không sinh mê cung hoặc đi chéo trong MVP.
- **D05:** TV01 trưởng nhóm phụ trách domain, tích hợp, kiểm thử tổng thể và bản nộp; TV02 thuật toán; TV03 giao diện.

## Điều kiện

- **R01:** Bổ sung UCS vào tài liệu, interface và kế hoạch test.
- **R02:** FR01 hỗ trợ start trùng goal.
- **R03:** 31/10 duyệt phạm vi, interface, khởi tạo; 01–02/11 module độc lập; 03/11 tích hợp lần đầu; 04/11 hoàn thiện MVP và test; 05/11 thực nghiệm, báo cáo; 06/11 nghiệm thu nội bộ, deploy; 07/11 nộp.
- **R04:** Thống nhất nút mở rộng, thứ tự láng giềng, hòa ưu tiên và đo thời gian trong `01_REQUIREMENTS.md`.
- **R05:** Test đường hợp lệ, không có đường, start trùng goal, đầu vào sai và tính tối ưu BFS/UCS/A* trong mô hình đồng chi phí; chi tiết trong `03_TEST_PLAN.md`.

## Kết quả khởi tạo kỹ thuật

Ngày 01/11/2026: `npm run build` thành công (TypeScript và Vite 7.3.7); `npm test` thành công (Vitest 4.1.12, 1 file, 2 test). Hai test chỉ kiểm tra danh sách ID và khả năng biểu diễn hợp đồng; chưa kiểm chứng hành vi domain hoặc thuật toán. `npm install` báo 0 lỗ hổng; npm cảnh báo script cài đặt esbuild chưa được duyệt, nhưng build và test đã chạy thành công.
