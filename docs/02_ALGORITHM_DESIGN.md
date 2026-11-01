# Thiết kế thuật toán

Hợp đồng và quy ước chung tại `01_REQUIREMENTS.md`. Cả năm thuật toán dùng graph search trên cùng lưới đồng chi phí, trả `SearchResult` và snapshot `SearchStep` để phát lại.

| Thuật toán | Chọn nút | Tối ưu trong mô hình này |
| --- | --- | --- |
| BFS | FIFO | Có |
| DFS | LIFO, xử lý thứ tự láng giềng theo hợp đồng | Không bảo đảm |
| UCS | `g` nhỏ nhất | Có |
| Greedy Best-First Search | Manhattan `h` nhỏ nhất | Không bảo đảm |
| A* | `g+h` nhỏ nhất | Có |

Quy tắc hòa của các hàng đợi ưu tiên: thêm trước lấy trước. Thiết kế chi tiết và triển khai do TV02 bổ sung; hiện chưa có thuật toán.
