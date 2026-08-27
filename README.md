# 📸 Album Kỷ Niệm Gia Đình (Family Gallery)

Một ứng dụng web tinh tế, ấm cúng và hiện đại dùng để lưu giữ và trình chiếu những khoảnh khắc kỷ niệm vô giá của gia đình. Được xây dựng trên nền tảng **Next.js (App Router)**, **Tailwind CSS**, **Lucide Icons** và trình xem ảnh trượt mượt mà **yet-another-react-lightbox**.

---

## ✨ Tính năng nổi bật

- 🔒 **Khóa mật khẩu bảo vệ gia đình (Password Gatekeeper)**:
  - Bảo vệ không gian riêng tư của gia đình, yêu cầu mật khẩu để xem ảnh.
  - Hiệu ứng rung phản hồi (shake animation) khi gõ sai mã, hỗ trợ ẩn/hiện mật khẩu.
  - Lưu phiên đăng nhập an toàn vào `localStorage` (không phải nhập lại khi F5).
  - Nút **"Khóa Thư Viện"** tiện lợi tại Footer để dễ dàng khóa lại khi rời máy.
  - Tránh lỗi SSR Hydration mismatch hoàn toàn bằng cơ chế mounting state mượt mà.
- 🎨 **Thiết kế ấm áp & tinh tế**: Gam màu be/stone trung tính, font chữ Serif (`Playfair Display`) sang trọng, tạo cảm giác thân thuộc như một cuốn album kỷ niệm truyền thống.
- 🏷️ **Bộ lọc Tag thông minh**: Dễ dàng chuyển đổi giữa các chủ đề: *Gia đình*, *Du lịch*, *Lễ Tết*, *Kỷ niệm*... kèm số lượng album theo từng nhóm.
- 🔍 **Tìm kiếm tức thì**: Tìm kiếm album nhanh chóng theo tiêu đề, năm hoặc nội dung mô tả.
- 📱 **Giao diện Responsive**: Tự động co giãn mượt mà trên mọi thiết bị (1 cột trên điện thoại, 2 cột trên tablet, 3 cột trên máy tính).
- 🖼️ **Trình xem ảnh Lightbox toàn diện (`yet-another-react-lightbox`)**:
  - Tích hợp 4 plugin cao cấp: **Thumbnails** (dải ảnh thu nhỏ phía dưới), **Zoom** (phóng to chi tiết), **Captions** (tiêu đề & mô tả ảnh), **Counter** (đếm số thứ tự ảnh).
  - Hỗ trợ vuốt chạm cảm ứng (swipe), phím mũi tên bàn phím, phóng to/thu nhỏ ảnh.
  - Xem trực tiếp từng ảnh từ dải thumbnail preview tròn trên mỗi thẻ album.
- ⚡ **Tối ưu hiệu năng**: Server Component (`src/app/page.js`) đọc trực tiếp dữ liệu tĩnh kết hợp Client Component (`src/components/Gallery.jsx`) đảm bảo tốc độ tải trang cực nhanh.
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
├── .env.example                 # File mẫu cấu hình biến môi trường
├── .env.local                   # Mật khẩu gia đình thực tế (được gitignore)
├── data/
│   └── albums.json              # Dữ liệu album & ảnh kỷ niệm
├── src/
│   ├── app/
│   │   ├── globals.css          # Cấu hình Tailwind CSS, animation shake & scrollbar
│   │   ├── layout.js            # Root layout tích hợp Google Fonts
│   │   └── page.js              # Server Component chính bọc PasswordGate
│   └── components/
│       ├── PasswordGate.jsx     # Màn hình khóa mật khẩu gia đình
│       ├── Header.jsx           # Header trang trí & thống kê kỷ niệm
│       ├── Gallery.jsx          # Client Component bộ lọc & Lightbox
│       └── Footer.jsx           # Chân trang & nút Khóa Thư Viện
├── next.config.mjs              # Cấu hình domain ảnh (Unsplash, Google)
├── package.json
└── README.md
```

---

## 🔑 Cấu hình Mật khẩu Gia đình

Dự án sử dụng biến môi trường `NEXT_PUBLIC_FAMILY_PASSWORD`. Mật khẩu mặc định là: **`giadinh2024`**.

Để thay đổi mật khẩu:
1. Mở file `.env.local` trong thư mục gốc.
2. Sửa giá trị thành mật khẩu bạn muốn:
   ```env
   NEXT_PUBLIC_FAMILY_PASSWORD=mat_khau_moi_cua_ban
   ```
3. Khởi động lại dev server nếu đang chạy (`npm run dev`).

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

- Màn hình khóa sẽ xuất hiện. Nhập mật khẩu: `giadinh2024` và bấm **Mở Khóa Album**.
- Để thử lại màn hình khóa, cuộn xuống chân trang (Footer) và bấm nút **"Khóa Thư Viện"**.

### 3. Build kiểm tra phiên bản sản xuất
```bash
npm run build
npm run start
```

---

## 📝 Cách thêm hoặc chỉnh sửa Album ảnh

Mở tệp `data/albums.json` và thêm đối tượng album mới theo cấu trúc sau:

```json
{
  "id": "chuyen-di-da-lat-2024",
  "title": "Chuyến Đi Đà Lạt Mộng Mơ",
  "year": "2024",
  "tag": "Du lịch",
  "cover": "https://images.unsplash.com/photo-...",
  "description": "Những ngày nghỉ thảnh thơi giữa rừng thông mát lành cùng gia đình nhỏ.",
  "photos": [
    {
      "src": "https://images.unsplash.com/photo-...",
      "title": "Săn mây sớm tại đồi Đa Phú",
      "description": "Bình minh tuyệt đẹp giữa làn mây trắng bồng bềnh."
    }
  ]
}
```

---

## 📤 Hướng dẫn đẩy mã nguồn lên GitHub cá nhân

### Cách 1: Sử dụng GitHub CLI (`gh`) - Nhanh nhất

```bash
git add .
git commit -m "feat: add password protection gatekeeper"
git push
```

### Cách 2: Sử dụng Git truyền thống

```bash
git add .
git commit -m "feat: add password protection gatekeeper"
git push -u origin main
```
