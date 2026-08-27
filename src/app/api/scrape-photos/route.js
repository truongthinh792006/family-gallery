import { NextResponse } from 'next/server';

/**
 * POST /api/scrape-photos
 * Tự động bóc tách danh sách ảnh trực tiếp từ đường link chia sẻ công khai Google Photos
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { url, password } = body;

    // 1. Xác thực mật khẩu quản trị viên
    const adminPassword =
      process.env.ADMIN_PASSWORD ||
      process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
      'admin123';

    if (!password || password.trim() !== adminPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Mật khẩu quản trị viên không chính xác.',
        },
        { status: 401 }
      );
    }

    // 2. Kiểm tra định dạng link Google Photos hợp lệ
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'Vui lòng cung cấp đường link chia sẻ Google Photos.',
        },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();
    const isGooglePhotos =
      trimmedUrl.includes('photos.app.goo.gl') ||
      trimmedUrl.includes('photos.google.com/share') ||
      trimmedUrl.includes('photos.google.com/album');

    if (!isGooglePhotos) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Đường link không hợp lệ. Vui lòng sử dụng link chia sẻ công khai từ Google Photos (dạng photos.app.goo.gl/... hoặc photos.google.com/share/...).',
        },
        { status: 400 }
      );
    }

    // 3. Tải nội dung HTML từ trang Google Photos công khai (theo dõi chuyển hướng)
    const response = await fetch(trimmedUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Không thể kết nối đến Google Photos (Mã lỗi: ${response.status}). Vui lòng kiểm tra lại link album.`,
        },
        { status: 400 }
      );
    }

    const html = await response.text();

    // 4. Trích xuất Tiêu đề Album và Ảnh đại diện (og:image)
    let albumTitle = '';
    const ogTitleMatch = html.match(
      /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i
    );
    const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);

    if (ogTitleMatch && ogTitleMatch[1]) {
      albumTitle = ogTitleMatch[1];
    } else if (titleTagMatch && titleTagMatch[1]) {
      albumTitle = titleTagMatch[1];
    }
    // Loại bỏ hậu tố "- Google Photos" hoặc "- Google Ảnh"
    albumTitle = albumTitle
      .replace(/\s*-\s*Google\s*(?:Photos|Ảnh)$/i, '')
      .trim();

    let coverPhoto = '';
    const ogImageMatch = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
    );
    if (ogImageMatch && ogImageMatch[1]) {
      const baseCover = ogImageMatch[1].split('=')[0];
      coverPhoto = `${baseCover}=w1600`;
    }

    // 5. Sử dụng Regex bóc tách toàn bộ link ảnh lh3.googleusercontent.com
    // Định dạng ảnh Google Photos thường là: https://lh3.googleusercontent.com/pw/... hoặc https://lh3.googleusercontent.com/[hash dài]
    const photoRegex =
      /https:\/\/lh3\.googleusercontent\.com\/(?:pw\/)?[a-zA-Z0-9_\-]{25,}/g;
    const matches = html.match(photoRegex) || [];

    // Tập hợp lọc trùng lặp và loại trừ link icon/avatar
    const uniqueBaseUrls = new Set();
    const extractedPhotos = [];

    for (const rawUrl of matches) {
      // Loại bỏ link avatar tài khoản Google (/a/ hoặc /ogw/)
      if (
        rawUrl.includes('/a/') ||
        rawUrl.includes('/ogw/') ||
        rawUrl.includes('/d/')
      ) {
        continue;
      }

      const baseUrl = rawUrl.split('=')[0];
      if (!uniqueBaseUrls.has(baseUrl)) {
        uniqueBaseUrls.add(baseUrl);
        const index = extractedPhotos.length + 1;
        extractedPhotos.push({
          src: `${baseUrl}=w1600`,
          title: `Khoảnh khắc ${index}`,
          description: albumTitle || '',
        });
      }
    }

    if (extractedPhotos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Không tìm thấy ảnh trong liên kết này. Hãy đảm bảo album đã được bật chế độ Chia sẻ Công Khai (Bất kỳ ai có liên kết đều xem được).',
        },
        { status: 404 }
      );
    }

    // Nếu chưa có ảnh bìa từ og:image, dùng ảnh đầu tiên trích xuất được
    if (!coverPhoto && extractedPhotos.length > 0) {
      coverPhoto = extractedPhotos[0].src;
    }

    return NextResponse.json({
      success: true,
      title: albumTitle,
      coverPhoto,
      count: extractedPhotos.length,
      photos: extractedPhotos,
      message: `Đã trích xuất thành công ${extractedPhotos.length} ảnh từ Google Photos!`,
    });
  } catch (error) {
    console.error('Lỗi khi bóc tách ảnh từ Google Photos:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Lỗi trong quá trình xử lý: ' + error.message,
      },
      { status: 500 }
    );
  }
}
