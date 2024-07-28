Giả sử có 1 hệ thống đặt bàn cho 1 nhà hàng với yêu cầu sau:

-   Đơn hàng được tạo bởi người dùng không được trùng thời gian và số bàn với những đơn đặt hàng khác đang có trạng thái là **Created** hoặc **Paid**.
-   Khi đơn đặt bàn tạo ra sẽ có trạng thái mặc định là **Created** sau khi thanh toán sẽ được chuyển về **Paid**.
-   Sau khi đặt bàn **15 phút** nếu Khách hàng không thực hiện thanh toán trước hoặc giao dịch thanh toán không thành công thì sẽ tự động chuyển trạng thái về **Canceled** để nhường chỗ cho người khác.

**Mô tả cách xử lý đặt hàng để đảm bảo không bị trùng và cách để hệ thống có thể update trạng thái các đơn đặt sau 15 phút.**

**Viết câu query CSDL cho từng yêu cầu nếu có.**

* * * * *

Để xử lý hệ thống đặt bàn theo yêu cầu của bạn, chúng ta cần:

1.  Đảm bảo không có đơn đặt hàng nào trùng thời gian và số bàn với các đơn đặt hàng khác đang ở trạng thái `Created` hoặc `Paid`.
2.  Tự động cập nhật trạng thái của các đơn đặt bàn thành `Canceled` sau 15 phút nếu không được thanh toán thành công.

1\. Thiết kế cơ sở dữ liệu
--------------------------

Giả sử chúng ta có bảng `reservations` với cấu trúc như sau:

```
CREATE TABLE reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    table_number INT NOT NULL,
    reservation_time DATETIME NOT NULL,
    status ENUM('Created', 'Paid', 'Canceled') NOT NULL DEFAULT 'Created',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

```

### Đảm bảo không trùng lặp đặt bàn

Khi người dùng tạo đơn đặt bàn, chúng ta sẽ kiểm tra xem có đơn đặt bàn nào trùng thời gian và số bàn với các đơn đặt hàng khác đang ở trạng thái `Created` hoặc `Paid` hay không. Nếu không có, chúng ta sẽ cho phép tạo đơn đặt bàn mới.

```
INSERT INTO reservations (user_id, table_number, reservation_time)
SELECT ?, ?, ?
WHERE NOT EXISTS (
    SELECT 1 FROM reservations
    WHERE table_number = ?
      AND status IN ('Created', 'Paid')
      AND reservation_time BETWEEN ? AND DATE_SUB(?, INTERVAL 15 MINUTE)
);

```

2\. Cập nhật trạng thái đơn đặt bàn sau 15 phút
-----------------------------------------------

Chúng ta cần một cách để tự động cập nhật trạng thái của các đơn đặt bàn thành `Canceled` sau 15 phút nếu không được thanh toán thành công. Có hai cách để thực hiện điều này:

-   Sử dụng một tác vụ định kỳ (cron job)
-   Sử dụng một sự kiện trong SQL (event).

### Sử dụng cron job

Chạy một cron job mỗi phút để cập nhật trạng thái của các đơn đặt bàn đã quá 15 phút và chưa được thanh toán.

```
UPDATE reservations
SET status = 'Canceled'
WHERE status = 'Created'
  AND created_at < NOW() - INTERVAL 15 MINUTE;

```

### Sử dụng sự kiện trong SQL (MySQL Event Scheduler)

Tạo một sự kiện định kỳ trong MySQL để tự động cập nhật trạng thái.

```
CREATE EVENT cancel_unpaid_reservations
ON SCHEDULE EVERY 1 MINUTE
DO
  UPDATE reservations
  SET status = 'Canceled'
  WHERE status = 'Created'
    AND created_at < NOW() - INTERVAL 15 MINUTE;

```

3\. Toàn bộ quy trình xử lý
---------------------------

1.  **Người dùng tạo đơn đặt bàn**:

    -   Kiểm tra trùng lặp và tạo đơn đặt bàn mới nếu không trùng.
    -   Sử dụng câu query:

    ```
    INSERT INTO reservations (user_id, table_number, reservation_time)
    SELECT ?, ?, ?
    WHERE NOT EXISTS (
        SELECT 1 FROM reservations
        WHERE table_number = ?
          AND reservation_time BETWEEN ? AND DATE_SUB(?, INTERVAL 15 MINUTE)
          AND status IN ('Created', 'Paid')
    );

    ```

2.  **Thanh toán đơn đặt bàn**:

    -   Cập nhật trạng thái đơn đặt bàn thành `Paid` sau khi thanh toán thành công.
    -   Sử dụng câu query:

    ```
    UPDATE reservations
    SET status = 'Paid'
    WHERE id = ?;

    ```

3.  **Hủy đơn đặt bàn sau 15 phút nếu không thanh toán**:

    -   Sử dụng cron job hoặc SQL event để cập nhật trạng thái.
    -   Sử dụng câu query:

    ```
    UPDATE reservations
    SET status = 'Canceled'
    WHERE status = 'Created'
      AND created_at < NOW() - INTERVAL 15 MINUTE;

    ```

Với cách này, hệ thống của bạn sẽ đảm bảo không bị trùng lặp đơn đặt bàn và tự động cập nhật trạng thái các đơn đặt bàn sau 15 phút nếu không thanh toán thành công.