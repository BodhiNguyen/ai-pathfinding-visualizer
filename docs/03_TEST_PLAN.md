# Kế hoạch kiểm thử

| Trường hợp | Kỳ vọng | Phạm vi |
| --- | --- | --- |
| Đường hợp lệ | Bắt đầu/kết thúc đúng, ô liên tiếp kề bốn hướng, không qua tường, chi phí bằng số cạnh | Cả năm thuật toán |
| Không có đường | `found=false`, đường rỗng, chi phí null | Cả năm |
| Start trùng goal, kể cả lưới 1×1 | Một ô, chi phí 0, một nút mở rộng | Cả năm |
| Đầu vào sai | Lỗi mô tả; không nhầm với không có đường | Domain và cả năm |
| Nhiều đường và bản đồ có vật cản | Chi phí bằng đường ngắn nhất đã biết | BFS, UCS, A* |
| Thứ tự và hòa | Láng giềng lên/phải/xuống/trái; ưu tiên bằng nhau theo thứ tự thêm; kết quả ổn định | Domain và thuật toán liên quan |
| Số liệu | Mỗi bước xử lý hợp lệ kể cả goal được đếm; không đếm mục cũ; thời gian chỉ bao lời gọi thuật toán | Cả năm / metrics |
| Biên | Kích thước 1–20, tọa độ ngoài lưới, tường, start/goal trên tường, ID sai | Domain |

Kiểm thử nền hiện chỉ xác nhận hợp đồng và runner; kiểm thử hành vi thuật toán và domain sẽ được TV01/TV02 triển khai cùng module. Không đánh dấu các trường hợp trên đã đạt khi chưa có implementation.
