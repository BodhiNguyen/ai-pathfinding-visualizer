# P2 — Quyết định phê duyệt

Trạng thái: **APPROVED_WITH_CONDITIONS** theo quyết định trưởng nhóm ngày 01/11/2026. Hợp đồng đã duyệt ở `01_REQUIREMENTS.md` và `src/domain/types.ts` giữ nguyên; API bổ sung được ghi tại `P2_API_CONTRACT.md`.

- **P2-D01:** TV01 kiểm tra và tạo Git baseline chung trên `main` trước khi tách branch.
- **P2-D02:** TV01 sở hữu domain API, validation và file cấu hình chung.
- **P2-D03:** TV02 sở hữu BFS, DFS, UCS, Greedy, A* và algorithm registry.
- **P2-D04:** TV03 sở hữu UI và playback, sử dụng mock đúng interface.
- **P2-D05:** Dùng Vitest cho unit test và logic playback; kiểm thử UI thủ công bằng checklist; không thêm framework E2E trong MVP.
- **P2-D06:** TV01 chịu trách nhiệm tích hợp, review và merge.

## Playback

- Chưa chạy: không có current. Mỗi bước hiển thị current, frontier và explored theo `SearchStep`.
- Kết thúc thành công hiển thị path; không có đường thông báo thất bại và path rỗng.
- Start trùng goal có một snapshot, path một ô, `pathCost = 0`.
- Chỉnh bản đồ dừng animation và xóa kết quả cũ.

Không thay đổi phạm vi MVP hoặc hợp đồng đã duyệt nếu chưa báo cáo và được thống nhất.
