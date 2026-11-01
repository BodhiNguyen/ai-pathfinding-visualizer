# P2 — Kế hoạch triển khai

Trạng thái: **APPROVED_WITH_CONDITIONS** theo `P2_DECISION.md`. P1 đã được báo nghiệm thu; quyết định phạm vi và hợp đồng tại `P0_DECISION.md`, `00_PROJECT_BRIEF.md`, `01_REQUIREMENTS.md` và `src/domain/types.ts`. Kế hoạch này không thay đổi các quyết định đó.

## Hiện trạng ngày 01/11/2026

- `main` và `origin/main` cùng ở `3dd2b86` (Initial commit); các file project, tài liệu và cấu hình đang chưa được theo dõi, trừ README đã commit. Đây chưa phải baseline được chia sẻ qua Git. Không xóa hoặc ghi đè các file này.
- React/TypeScript/Vite và Vitest đã cấu hình. `npm run build` và `npm test` chạy thành công; 2 test hiện chỉ kiểm tra hợp đồng, không chứng minh hành vi tìm đường.
- `src/domain/types.ts` chứa hợp đồng; `App.tsx` chỉ là màn hình khởi tạo. Chưa có implementation domain, thuật toán, metrics hoặc UI nghiệp vụ. Chưa cấu hình môi trường DOM hay thư viện test giao diện.

## Dependency và triển khai song song

Hợp đồng kiểu và quy ước đã duyệt là đầu vào chung. Domain cung cấp kiểm tra, chuyển ID và láng giềng cho thuật toán; thuật toán trả snapshot/kết quả cho UI; metrics bọc lời gọi thuật toán và UI tiêu thụ kết quả đo. TV03 làm độc lập bằng mock đúng hợp đồng. TV02 viết thuật toán và test dựa trên hợp đồng với fixture/helper tạm trong phạm vi riêng, rồi nối helper domain sau khi API được chốt; không sao chép implementation domain làm giải pháp cuối. Ghép theo thứ tự domain → thuật toán → UI, rồi TV01 nối metrics và kiểm thử tổng thể.

| Người | Việc độc lập 01–02/11 | Bàn giao |
| --- | --- | --- |
| TV01 | Kiểm tra `GridProblem`, chuyển `Position`/`CellId`, láng giềng và test; chuẩn bị tích hợp. | API domain thống nhất, test biên và lỗi; không tự đổi hợp đồng. |
| TV02 | BFS, DFS, UCS, Greedy, A*, dựng đường, snapshot và test với fixture nhỏ; chuẩn bị nối API domain. | Năm hàm `SearchAlgorithm` thuần, test theo checklist, không phụ thuộc React. |
| TV03 | Lưới tương tác, selector, playback, thống kê và so sánh với mock `MeasuredSearchResult`; kiểm thử logic phù hợp. | UI với mock thành công, thất bại, start trùng goal; chỉnh bản đồ dừng và xóa kết quả. |

## Branch và quyền sở hữu file đề xuất

Chỉ tạo branch sau khi TV01 kiểm tra, thống nhất và commit các file baseline hiện untracked vào một mốc chung; cả ba tách từ cùng commit. TV01 tạo baseline sau khi kiểm tra và build/test đạt; chỉ tạo branch sau baseline hợp lệ.

| Branch | Chủ sở hữu và phạm vi ghi |
| --- | --- |
| `feature/p2-domain` | TV01: `src/domain/` trừ hợp đồng đã duyệt nếu chưa thống nhất; `tests/domain/`. |
| `feature/p2-algorithms` | TV02: `src/algorithms/`, `tests/algorithms/`. |
| `feature/p2-frontend` | TV03: `src/components/`, `src/app/`, `tests/frontend/`, mock riêng trong `src/app/` hoặc `tests/frontend/`. |
| `feature/p2-integration` | TV01 sau khi ghép: `src/metrics/`, wiring giữa module, `tests/integration/`, và các file chung cần thiết. |

`src/domain/types.ts`, `src/main.tsx`, `tests/contracts.test.ts`, `package.json`, lockfile, cấu hình build/test và tài liệu chung do TV01 điều phối một đầu mối. Dùng Vitest cho unit test và logic playback; kiểm thử UI thủ công theo checklist, không thêm framework E2E trong MVP. Nếu cần sửa ngoài phạm vi, báo chủ sở hữu và chuyển qua tích hợp. Mỗi nhánh chạy build/test và review trước khi ghép; nhánh thuật toán đồng bộ domain đã merge trước khi nối API, sau đó frontend đồng bộ kết quả tích hợp.

## Điểm phải đồng bộ trước code

1. TV01 công bố chữ ký và đường dẫn export helper kiểm tra, ID, láng giềng; thống nhất ai gọi validation để cả năm thuật toán từ chối lỗi mô tả. Đây là API bổ sung, không tự đổi `types.ts`.
2. Thống nhất tên export/registry thuật toán và cách thay mock bằng kết quả thật; hành vi playback trước bước đầu, sau goal và khi không có đường.
3. Chốt snapshot, frontier/explored, DFS và hòa theo `01_REQUIREMENTS.md`; start trùng goal có một snapshot. Xác nhận fixture chung, đặc biệt dữ liệu lỗi và mục frontier cũ.
4. TV01 sở hữu wrapper `performance.now()` và wiring; thời gian bao gồm snapshot, không gồm render/animation. Chốt cách trình bày số bước và so sánh trên cùng bản đồ theo FR05.
5. Chốt baseline Git, review/merge và môi trường test UI; mọi yêu cầu sửa file chung qua TV01. Không bổ sung tính năng ngoài MVP.

## Mốc tích hợp

- 01–02/11: chốt API, làm ba module song song, chạy test và review module.
- 03/11: TV01 merge domain, TV02 nối và merge thuật toán, TV03 nối UI; TV01 thêm metrics, kiểm thử đường đi dữ liệu và xử lý lỗi.
- 04/11: hoàn thiện FR01–FR06, kiểm thử tổng thể theo `03_TEST_PLAN.md` và checklist P2.
- 05/11: thực nghiệm thật, ghi môi trường/số lần chạy và hoàn thiện báo cáo; 06/11 nghiệm thu và deploy; 07/11 nộp trước 23:59 giờ Việt Nam.

## Rủi ro cần theo dõi

- **Baseline:** TV01 kiểm tra, commit và chia sẻ cùng một mốc trước khi tách branch.
- **API helper/registry chưa có implementation:** tuân theo `P2_API_CONTRACT.md` khi triển khai.
- **Mock và playback lệch snapshot thật:** review fixture chung và chạy ca thành công, thất bại, start trùng goal khi tích hợp.
- **Kiểm thử giao diện:** Vitest cho logic playback và kiểm thử UI thủ công; không thêm framework E2E trong MVP.
- **Số bước và bảng so sánh:** chốt cách trình bày FR05/FR06 và chạy các thuật toán trên cùng bản đồ; không tự thêm tính năng. TV01 chịu trách nhiệm review và merge theo checklist.
