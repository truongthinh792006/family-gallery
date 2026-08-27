# 📸 Album Kỷ Niệm Gia Đình (Family Gallery)

Một ứng dụng web tinh tế, ấm cúng và hiện đại dùng để lưu giữ và trình chiếu những khoảnh khắc kỷ niệm vô giá của gia đình. Được xây dựng trên nền tảng **Next.js (App Router)**, **Tailwind CSS**, **Lucide Icons** và trình xem ảnh trượt mượt mà **yet-another-react-lightbox**.

---

## ✨ Tính năng nổi bật

- 🎨 **Thiết kế ấm áp & tinh tế**: Sử dụng gam màu be/stone trung tính, font chữ Serif (`Playfair Display`) sang trọng, tạo cảm giác thân thuộc như lật từng trang album ảnh gia đình truyền thống.
- 🏷️ **Bộ lọc Tag thông minh**: Dễ dàng phân loại và chuyển đổi nhanh giữa các chủ đề: *Gia đình*, *Du lịch*, *Lễ Tết*, *Kỷ niệm*... kèm số lượng album theo từng nhóm.
- 🔍 **Tìm kiếm tức thì**: Tìm kiếm album nhanh chóng theo tiêu đề, năm hoặc nội dung mô tả.
- 📱 **Giao diện Responsive**: Tự động co giãn mượt mà trên mọi thiết bị (1 cột trên điện thoại, 2 cột trên tablet, 3 cột trên máy tính).
- 🖼️ **Trình xem ảnh Lightbox toàn diện (`yet-another-react-lightbox`)**:
  - Tích hợp 4 plugin cao cấp: **Thumbnails** (dải ảnh thu nhỏ phía dưới), **Zoom** (phóng to chi tiết), **Captions** (tiêu đề & mô tả ảnh), **Counter** (đếm số thứ tự ảnh).
  - Hỗ trợ vuốt chạm cảm ứng (swipe), phím mũi tên bàn phím, phóng to/thu nhỏ ảnh.
  - Xem trực tiếp từng ảnh từ dải thumbnail preview trên mỗi thẻ album.
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
├── data/
│   └── albums.json              # Dữ liệu album & ảnh kỷ niệm
├── src/
│   ├── app/
│   │   ├── globals.css          # Cấu hình Tailwind CSS & theme màu ấm
│   │   ├── layout.js            # Root layout tích hợp Google Fonts
│   │   └── page.js              # Server Component chính
│   └── components/
│       ├── Header.jsx           # Header trang trí & thống kê kỷ niệm
│       ├── Gallery.jsx          # Client Component bộ lọc & Lightbox
│       └── Footer.jsx           # Chân trang thông điệp yêu thương
├── next.config.mjs              # Cấu hình domain ảnh (Unsplash, Google)
├── package.json
└── README.md
```

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

1. **Kiểm tra đăng nhập GitHub CLI**:
   ```bash
   gh auth status
   ```
   *(Nếu chưa đăng nhập, chạy `gh auth login` và làm theo hướng dẫn trên trình duyệt)*

2. **Tạo repository mới và đẩy code lên ngay lập tức**:
   ```bash
   git add .
   git commit -m "feat: complete family gallery with nextjs and lightbox"
   gh repo create family-gallery --public --source=. --remote=origin --push
   ```

### Cách 2: Sử dụng lệnh Git truyền thống

1. Truy cập [github.com/new](https://github.com/new) và tạo một repository mới (ví dụ: `family-gallery`).
2. Chạy chuỗi lệnh sau trong terminal của thư mục dự án:
   ```bash
   git add .
   git commit -m "feat: complete family gallery with nextjs and lightbox"
   git branch -M main
   git remote add origin https://github.com/<USERNAME-CUA-BAN>/family-gallery.git
   git push -u origin main
   ```
*(Thay `<USERNAME-CUA-BAN>` bằng tên tài khoản GitHub của bạn)*
