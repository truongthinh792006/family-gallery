# 📸 Album Kỷ Niệm Gia Đình (Family Gallery)

Một ứng dụng web tinh tế, ấm cúng và hiện đại dùng để lưu giữ và trình chiếu những khoảnh khắc kỷ niệm vô giá của gia đình. Được xây dựng trên nền tảng **Next.js (App Router)**, **Tailwind CSS**, **Lucide Icons**, **yet-another-react-lightbox** và đồng bộ dữ liệu đám mây đa thiết bị bằng **Vercel KV (@vercel/kv)**.

---

## ✨ Tính năng nổi bật

- 🌍 **Xem ảnh công khai & mượt mà**: Trang chủ mở công khai cho tất cả mọi người cùng vào ngắm nhìn những bức ảnh kỷ niệm gia đình mà không gặp rào cản.
- ☁️ **Đồng bộ đa thiết bị tức thì (Vercel KV)**: Mọi chỉnh sửa, thêm/xóa album từ PC hay điện thoại của Admin sẽ lập tức được đồng bộ lên đám mây và hiển thị cho tất cả thành viên trên mọi thiết bị.
- ⚙️ **Bảng Quản Trị & Cài Đặt (Admin Settings Modal) có khóa mật khẩu**:
  - Nhấn nút **Quản Trị / Settings** ở góc Header hoặc Footer để mở cửa sổ đăng nhập Admin.
  - Khóa mật khẩu an toàn (mặc định: `admin123`, tùy biến qua `.env.local`), có hiệu ứng rung phản hồi (shake animation) khi gõ sai.
  - **Quản lý Album trực tiếp**: Thêm album mới, sửa thông tin (tiêu đề, năm, tag, link cover, mô tả), thêm/xóa ảnh con (`src`, `title`, `description`), hoặc xóa album.
  - **Chỉnh sửa Thông tin Website**: Sửa tiêu đề chính trang web, lời tựa tình cảm và mốc thời gian hiển thị.
  - **Lưu & Đồng Bộ Đám Mây**: Gửi dữ liệu an toàn qua API `/api/gallery` lên Vercel KV và lưu bộ nhớ đệm `localStorage`.
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
- **Database / Cache**: [Vercel KV / Upstash Redis](https://vercel.com/docs/storage/vercel-kv)
- **Typography**: Google Fonts (`Playfair Display` & `Plus Jakarta Sans`)

---

## 📂 Cấu trúc thư mục

```text
family-gallery/
├── .env.example                 # File mẫu cấu hình biến môi trường & Vercel KV
├── .env.local                   # Mật khẩu Admin thực tế (được gitignore)
├── data/
│   └── albums.json              # Dữ liệu album & ảnh kỷ niệm gốc
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── gallery/
│   │   │       └── route.js     # API Route đồng bộ Vercel KV (GET & POST)
│   │   ├── globals.css          # Cấu hình Tailwind CSS, animation shake & scrollbar
│   │   ├── layout.js            # Root layout tích hợp Google Fonts
│   │   └── page.js              # Server Component đọc data/albums.json
│   └── components/
│       ├── FamilyGalleryApp.jsx # Component điều phối dữ liệu động & Vercel KV
│       ├── AdminModal.jsx       # Bảng Quản Trị & Cài Đặt (có khóa PIN & đồng bộ)
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

## ☁️ Hướng dẫn kích hoạt Vercel KV khi Deploy

Khi bạn đưa dự án lên **[Vercel](https://vercel.com/)**:

1. **Import dự án lên Vercel**: Kết nối kho mã nguồn GitHub của bạn.
2. **Kích hoạt KV Storage**:
   - Vào Dashboard của dự án trên Vercel.
   - Nhấp vào tab **Storage** -> Chọn **Create Database** -> Chọn **KV (Redis)**.
   - Đặt tên (ví dụ: `family-gallery-kv`) và bấm **Create**.
   - Vercel sẽ tự động liên kết các biến môi trường:
     - `KV_URL`
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `KV_REST_API_READ_ONLY_TOKEN`
3. **Thêm biến mật khẩu**:
   - Vào **Settings** -> **Environment Variables**.
   - Thêm biến `NEXT_PUBLIC_ADMIN_PASSWORD` với giá trị mật khẩu bạn muốn (ví dụ: `giadinh2024admin`).
4. **Redeploy**: Sau khi liên kết, mọi dữ liệu bạn chỉnh sửa trong Admin Panel trên điện thoại hoặc máy tính sẽ lập tức lưu vào KV và hiển thị cho mọi người!

---

## 🚀 Hướng dẫn chạy thử nghiệm cục bộ

### 1. Cài đặt các gói phụ thuộc
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
- Nhập mật khẩu: `admin123` để mở bảng điều khiển và đồng bộ dữ liệu.

### 3. Build kiểm tra phiên bản sản xuất
```bash
npm run build
npm run start
```

---

## 📤 Hướng dẫn đẩy mã nguồn lên GitHub cá nhân

```bash
git add .
git commit -m "feat: add vercel kv multi-device sync and cloud api"
git push
```
