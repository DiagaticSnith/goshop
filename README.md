# Goshop

Ứng dụng web đặt nội thất nhanh trực tuyến, xây dựng với React, Node.js, Express, MySQL (Prisma), và Stripe. Người dùng có thể duyệt thực đơn, thêm sản phẩm vào giỏ hàng, và đặt món. Quản trị viên có thể quản lý thực đơn và đơn hàng.
</br></br>
Firebase Authentication dùng để xác thực, cho phép đăng nhập Google. Redux Toolkit quản lý giỏ hàng và danh sách sản phẩm yêu thích. Cloudinary lưu trữ hình ảnh sản phẩm và avatar. Thanh toán qua Stripe. Prisma ORM kết nối MySQL. TailwindCSS dùng để thiết kế giao diện. Kiểm thử E2E với Cypress.
</br>

## Mục lục

-   [Tính năng](#tinh-nang)
-   [Demo](#demo)
-   [Công nghệ](#cong-nghe)

## Tính năng

-   Xác thực (đăng nhập, đăng ký, đăng xuất)
    -   Đăng nhập Google
    -   Phân quyền người dùng
-   Quản lý thực đơn
    -   Duyệt các sản phẩm
    -   Tìm kiếm sản phẩm theo tên hoặc mô tả
    -   Lọc sản phẩm theo loại
    -   Sắp xếp sản phẩm theo giá
    -   Thêm/xóa sản phẩm vào giỏ hàng
    -   Thêm/xóa sản phẩm vào danh sách yêu thích
-   Quản lý đơn hàng
    -   Đặt đơn
    -   Xem chi tiết đơn hàng
-   Thanh toán
    -   Thanh toán qua Stripe
-   Hồ sơ người dùng
    -  Xem và cập nhật thông tin cá nhân
-   Quản trị viên
    -   Xem tất cả sản phẩm
    -   Tạo, cập nhật, xóa sản phẩm
    -   Xem tất cả đơn hàng
    -   Xem và cập nhật thông tin cá nhân
-   Giao diện đáp ứng trên thiết bị di động
-   Hỗ trợ Progressive Web App (PWA)
-   Kiểm thử E2E với Cypress

## Demo
### [Xem website mẫu](https://ecommerce-goshop.onrender.com)
https://github.com/ke444a/ecommerce-goshop/assets/81090139/3dc1cb1f-b47d-4177-b805-d45688c319f2

### Trang chủ
<img width="60%" height="50%" src="https://github.com/ke444a/ecommerce-goshop/assets/81090139/8c35717c-ca67-49f6-8a96-c02fc36e08f7">

### Sản phẩm
<img width="60%" height="50%" src="https://github.com/ke444a/ecommerce-goshop/assets/81090139/c0cdd67a-a367-4d50-9255-2b10491d244b">

### Giỏ hàng
<img width="60%" height="50%" src="https://github.com/ke444a/ecommerce-goshop/assets/81090139/1426e48e-4035-457d-87f2-502f60a82a24">

### Đơn hàng
<img width="60%" height="50%" src="https://github.com/ke444a/ecommerce-goshop/assets/81090139/8280a299-52b7-4a87-8910-e41a9d31988d">

### Quản trị viên
<img width="60%" height="50%" src="https://github.com/ke444a/ecommerce-goshop/assets/81090139/047396bd-56be-4b6d-8fe7-aced3a1a55b5">

## Công nghệ

-   ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
-   ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
-   ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
-   ![Redux](https://img.shields.io/badge/redux-%23593d88.svg?style=for-the-badge&logo=redux&logoColor=white)
-   ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
-   ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
-   ![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)
-   ![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
-   ![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=Stripe&logoColor=white)
-   ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=Tailwind-CSS&logoColor=white)
-   ![Cypress](https://img.shields.io/badge/Cypress-17202C?style=for-the-badge&logo=Cypress&logoColor=white)
-   ![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)
-   ![React Query](https://img.shields.io/badge/-React%20Query-FF4154?style=for-the-badge&logo=react%20query&logoColor=white)
-   ![React Hook Form](https://img.shields.io/badge/React_Hook_Form-0088CC?style=for-the-badge&logo=react-hook-form&logoColor=white)
-   ![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)

## Hướng dẫn cài đặt nhanh

Những bước tối thiểu để khởi chạy project cục bộ (mô tả ngắn, dùng PowerShell trên Windows):

1. Pull/clone về rồi vào thư mục project

```powershell
git clone <your-repo-url>
cd goshop
```

Hoặc nếu đã clone trước đó:

```powershell
git pull origin main
```

2. Chỉnh cấu hình

- Mở `docker-compose.yml` và điều chỉnh các cấu hình service (port, volume, tên container) cho phù hợp với môi trường của bạn.
- Chỉnh các file `.env` (ở `backend/`, `frontend/`, `frontend-admin/` nếu có): khai báo thông tin Firebase (UID/service account), Stripe keys, Cloudinary, MySQL password, v.v.

3. Khởi động Docker

```powershell
docker-compose up --build
```

4. Đẩy schema Prisma vào database

Sau khi backend container đã khởi động, chạy:

```powershell
docker-compose exec backend sh -c "npx prisma db push --accept-data-loss"
```

5. Import dữ liệu từ `data.sql`

File `data.sql` nằm ở gốc repo (`./data.sql`). Có hai cách import:

- Tùy chọn A — dùng shell MySQL trong container (thủ công):

```powershell
docker-compose exec db sh -c "mysql -uroot -p123123"
# trong mysql prompt:  -- chạy các lệnh sau
USE goshop;
# rồi copy-n-paste nội dung của file data.sql vào và chạy
```

- Tùy chọn B — import trực tiếp từ host (khuyên dùng khi file data.sql ở host):

```powershell
docker exec -i $(docker-compose ps -q db) mysql -uroot -p123123 goshop < ./data.sql
```

Lưu ý: nếu container database dùng password khác, thay `123123` bằng mật khẩu tương ứng. Nếu container DB không có file `data.sql`, dùng Tùy chọn B để gửi file từ host vào DB.

6. Kiểm tra

- Sau khi import, truy cập backend và frontend theo cấu hình `docker-compose` (thường là http://localhost:3000 cho backend và http://localhost:5173 cho frontend tùy cấu hình).

Nếu gặp lỗi, kiểm tra logs:

```powershell
docker-compose logs -f backend
docker-compose logs -f db
```
