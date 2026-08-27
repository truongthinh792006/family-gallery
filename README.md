# 📸 Album Kỷ Niệm Gia Đình (Family Gallery)

Một ứng dụng web tinh tế, ấm cúng và hiện đại dùng để lưu giữ và trình chiếu những khoảnh khắc kỷ niệm vô giá của gia đình. Được xây dựng trên nền tảng **Next.js (App Router)**, **Tailwind CSS**, **Lucide Icons** và trình xem ảnh trượt mượt mà **yet-another-react-lightbox**.

---

## ✨ Tính năng nổi bật

- 🌍 **Xem ảnh công khai & mượt mà**: Trang chủ mở công khai cho tất cả mọi người cùng vào ngắm nhìn những bức ảnh kỷ niệm gia đình mà không gặp rào cản.
- ⚙️ **Bảng Quản Trị & Cài Đặt (Admin Settings Modal) có khóa mật khẩu**:
  - Nhấn nút **Quản Trị / Settings** ở góc Header hoặc Footer để mở cửa sổ đăng nhập Admin.
  - Khóa mật khẩu an toàn (mặc định: `admin123`, tùy biến qua `.env.local`), có hiệu ứng rung phản hồi (shake animation) khi gõ sai.
  - **Quản lý Album trực tiếp**: Thêm album mới, sửa thông tin (tiêu đề, năm, tag, link cover, mô tả), thêm/xóa ảnh con (`src`, `title`, `description`), hoặc xóa album.
  - **Chỉnh sửa Thông tin Website**: Sửa tiêu đề chính trang web, lời tựa tình cảm và mốc thời gian hiển thị.
  - **Đồng bộ hóa tức thì**: Lưu trạng thái vào `localStorage` để giao diện web lập tức cập nhật mà không cần reload.
  - **Xuất file JSON (Export JSON / Copy)**: Tải về hoặc sao chép nhanh toàn bộ dữ liệu `albums.json` mới để dán đè vào `data/albums.json` khi muốn commit cố định vào Git.
  - **Khôi phục mặc định (Reset)**: Xóa bộ nhớ tạm và nạp lại dữ liệu gốc ban đầu bất kỳ lúc nào.
- 🎨 **Thiết kế ấm áp & tinh tế**: Gam màu be/stone trung tính (`#FAF7F2`), font chữ Serif (`Playfair Display`) sang trọng, tạo cảm giác thân thuộc như một cuốn album kỷ niệm truyền thống.
- 🏷️ **Bộ lọc Tag thông minh**: Dễ dàng chuyển đổi giữa các chủ đề: *Gia đình*, *Du lịch*, *Lễ Tết*, *Kỷ niệm*... kèm số lượng album theo từng nhóm.
- 🔍 **Tìm kiếm tức thì**: Tìm kiếm album nhanh chóng theo tiêu đề, năm hoặc nội dung mô tả.
- 📱 **Giao diện Responsive**: Tự động co giãn mượt mà trên mọi thiết bị (1 cột trên điện thoại, 2 cột trên tablet, 3 cột trên máy tính).
- 🖼️ **Trình xem ảnh Lightbox toàn diện (`yet-another-react-lightbox`)**:
  - Tích hợp 4 plugin cao cấp: **Thumbnails** (dải ảnh thu nhỏ phía dưới), **Zoom** (phóng to chi tiết), **Captions** (tiêu đề & mô tả ảnh), **Counter** (đếm số thứ tự ảnh).
  - Hỗ trợ vuốt chạm cảm ứng (swipe), phím mũi tên bàn phím, phóng to/thu nhỏ ảnh.
  - Xem trực tiếp từng ảnh từ dải thumbnail preview tròn trên mỗi thẻ album.
- 🌐 **Sẵn sàng cho Google Photos / Drive & Unsplash**: Cấu hình sẵn `remotePatterns` trong `next.config.mjs` cho `images.unsplash.com`, `drive.google.com`, và `lh3.googleusercontent.com`.

---

## 🛠️ Công nghệ sử dụng

- **Framework**: [Next.js](https://nextjs.org/) (App Router, JavaScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icon**: [Lucide React](https://lucide.dev/)
- **Lightbox**: [yet-another-react-lightbox](https://yet-another-react-lightbox.com/)
- **Typography**: Google Fonts (`Playfair Display` & `Plus Jakarta Sans`)

---

## 📂 Cấu trúc thư mục

```text
family-gallery/
├── .env.example                 # File mẫu cấu hình mật khẩu Admin
├── .env.local                   # Mật khẩu Admin thực tế (được gitignore)
├── data/
│   └── albums.json              # Dữ liệu album & ảnh kỷ niệm gốc
├── src/
│   ├── app/
│   │   ├── globals.css          # Cấu hình Tailwind CSS, animation shake & scrollbar
│   │   ├── layout.js            # Root layout tích hợp Google Fonts
│   │   └── page.js              # Server Component đọc data/albums.json
│   └── components/
│       ├── FamilyGalleryApp.jsx # Component điều phối dữ liệu động & LocalStorage
│       ├── AdminModal.jsx       # Bảng Quản Trị & Cài Đặt (có khóa PIN Admin)
│       ├── Header.jsx           # Header trang trí, thống kê & nút Cài đặt
│       ├── Gallery.jsx          # Lưới Album, bộ lọc tag & Lightbox
│       └── Footer.jsx           # Chân trang & nút Quản Trị Album
├── next.config.mjs              # Cấu hình domain ảnh (Unsplash, Google)
├── package.json
└── README.md
```

---

## 🔑 Mật khẩu Quản trị (Admin Password)

- Mật khẩu Admin mặc định: **`admin123`**.
- Để đổi mật khẩu: Mở file `.env.local` và sửa giá trị:
  ```env
  NEXT_PUBLIC_ADMIN_PASSWORD=mat_khau_moi_cua_ban
  ```
  *(Khởi động lại `npm run dev` nếu đang chạy để áp dụng)*

---

## 🚀 Hướng dẫn chạy thử nghiệm cục bộ

### 1. Cài đặt các gói phụ thuộc (nếu clone từ git)
```bash
npm install
```

### 2. Khởi động môi trường phát triển (Dev Server)
```bash
npm run dev
```
Mở trình duyệt và truy cập: **`http://localhost:3000`**

- **Xem ảnh**: Toàn bộ album ảnh mở công khai, nhấp vào thẻ album để mở trình xem slide Lightbox.
- **Vào Bảng Quản Trị**: Nhấn nút **Quản Trị** (icon bánh răng `Settings`) ở góc trên Header hoặc nút **Quản Trị Album** ở chân trang Footer.
- Nhập mật khẩu: `admin123` để mở bảng điều khiển.

### 3. Build kiểm tra phiên bản sản xuất
```bash
npm run build
npm run start
```

---

## 📤 Hướng dẫn đẩy mã nguồn lên GitHub cá nhân

```bash
git add .
git commit -m "feat: add admin settings modal with password pin and album management"
git push
```
*(Nếu là repository mới tạo, dùng `git push -u origin main`)*
