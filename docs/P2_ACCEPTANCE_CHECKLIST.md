# P2 — Checklist nghiệm thu

Chưa nghiệm thu: tất cả mục dưới đây đang chờ thực hiện. Hợp đồng và quy ước có thẩm quyền ở `01_REQUIREMENTS.md`; ca kiểm thử chi tiết ở `03_TEST_PLAN.md`. P2 chỉ hoàn tất khi trưởng nhóm kiểm tra bằng chứng và duyệt.

## Điều kiện trước khi triển khai

- [x] Trưởng nhóm duyệt kế hoạch có điều kiện và phân quyền; API, playback và phương án kiểm thử được ghi tại `P2_DECISION.md` và `P2_API_CONTRACT.md`.
- [ ] TV01 kiểm tra, build/test và tạo baseline chung hợp lệ trước khi tách nhánh.
- [ ] Mỗi nhánh xuất phát từ cùng commit được chia sẻ; thay đổi file chung chỉ qua đầu mối TV01.

## TV01 — Domain

- [ ] ID `row,col` chuyển đổi đúng và kiểm tra ID sai; tọa độ nguyên trong lưới, kích thước mỗi chiều 1–20, tường hợp lệ, start/goal không nằm trên tường; cho phép start trùng goal. Đầu vào sai báo lỗi mô tả.
- [ ] Láng giềng chỉ gồm ô hợp lệ, không là tường, theo thứ tự lên/phải/xuống/trái; unit test biên, tường, kích thước và dữ liệu sai đạt.

## TV02 — Algorithms

- [ ] Đủ BFS, DFS, UCS, Greedy, A* thuần TypeScript, đúng `SearchAlgorithm`, không dùng thư viện tìm đường; cả năm từ chối đầu vào sai.
- [ ] Test đường từ start tới goal gồm các ô kề hợp lệ, không qua tường và chi phí bằng số cạnh; test không có đường trả `found=false`, `path=[]`, `pathCost=null`; start trùng goal trả một ô, giá 0 và một bước.
- [ ] BFS/UCS/A* đạt chi phí tối ưu đã biết trên bản đồ đồng chi phí; DFS/Greedy không được khẳng định luôn tối ưu. Test thứ tự DFS, hòa ưu tiên FIFO, Manhattan và cập nhật đường tốt hơn theo hợp đồng.
- [ ] Snapshot sau mỗi lần xử lý hợp lệ kể cả goal, goal không sinh láng giềng; frontier theo thứ tự lấy tiếp, explored theo thứ tự xử lý, `expandedCount=steps.length`; mục cũ không hợp lệ không được đếm. Có test tương ứng.

## TV03 — Frontend với mock

- [ ] Lưới mặc định 10×10, cho phép chỉnh kích thước 1–20, tường, một start và một goal có thể trùng; không đặt start/goal trên tường.
- [ ] Chọn đủ năm thuật toán; bước/chạy/tạm dừng/reset và hiển thị current, frontier, explored, đường cuối đúng snapshot. Chỉnh bản đồ trong lúc chạy dừng phát và xóa kết quả cũ.
- [ ] Mock hợp đồng thể hiện thành công, không có đường, start trùng goal; hiển thị kết quả, thống kê, so sánh cùng bản đồ và giải thích lựa chọn/tính tối ưu của từng thuật toán. Có bằng chứng kiểm thử logic playback bằng Vitest và thao tác UI thủ công; không thêm framework E2E trong MVP.

## Tích hợp và hoàn tất

- [ ] UI dùng thuật toán và domain thật thay mock; lỗi đầu vào được hiển thị rõ, không bị coi là không có đường. Kiểm tra đủ năm thuật toán trên cùng bản đồ và các ca biên.
- [ ] Metrics đo `performance.now()` ngay trước/sau lời gọi đồng bộ, bao gồm tạo snapshot, không gồm animation/render; `durationMs` nằm trong `MeasuredSearchResult`, không nằm trong `SearchResult`. Thống kê nhất quán FR05.
- [ ] `npm run build`, `npm test` và các kiểm thử tổng thể trong `03_TEST_PLAN.md` đạt trên baseline tích hợp; ghi lệnh, kết quả và các kiểm tra UI thủ công.
- [ ] Review quyền sở hữu file, không thêm phạm vi MVP hoặc thư viện tìm đường; trưởng nhóm xác nhận các mục và lỗi còn lại trước nghiệm thu.
