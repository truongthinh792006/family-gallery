import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Hàm giải mã và chuẩn hóa chuỗi JSON / HTML từ Google Photos
 * Xử lý triệt để các ký tự escape: \/, \\/, \u002F, \x2f, \u003D, \x3d, \u0026
 */
function unescapeGoogleContent(content) {
  if (!content || typeof content !== 'string') return '';
  return content
    .replace(/\\+u002[fF]/g, '/')
    .replace(/\\+x2[fF]/g, '/')
    .replace(/\\+u003[dD]/g, '=')
    .replace(/\\+x3[dD]/g, '=')
    .replace(/\\+u0026/g, '&')
    .replace(/\\+x26/g, '&')
    .replace(/\\+\//g, '/')
    .replace(/\\\//g, '/');
}

/**
 * Trích xuất photo ID / hash duy nhất của ảnh (loại bỏ domain và query params)
 */
function extractPhotoKey(url) {
  if (!url || typeof url !== 'string') return null;
  // Loại bỏ giao thức và domain (ví dụ: https://lh3.googleusercontent.com/ hoặc //lh4...)
  const withoutDomain = url.replace(/^(?:https?:)?\/\/[^\/]+\//, '');
  // Cắt bỏ phần kích thước sau dấu '=' hoặc '?'
  const baseHash = withoutDomain
    .split('=')[0]
    .split('?')[0]
    .split('#')[0]
    .trim();
  return baseHash || null;
}

/**
 * Kiểm tra xem URL / hash có phải là ảnh hợp lệ từ album hay không
 * Loại bỏ avatar người dùng, icon giao diện và chuỗi quá ngắn
 */
function isValidAlbumPhoto(url, photoKey) {
  if (!url || !photoKey) return false;

  // Loại trừ ảnh đại diện người dùng Google (/a/, /a-/, /ogw/, /d/, /fife/)
  if (
    url.includes('/a/') ||
    url.includes('/a-/') ||
    url.includes('/ogw/') ||
    url.includes('/d/') ||
    url.includes('/fife/')
  ) {
    return false;
  }

  // Hash của ảnh Google Photos trong album thường dài từ 25 đến hơn 100 ký tự
  if (photoKey.length < 25) {
    return false;
  }

  return true;
}

/**
 * POST /api/scrape-photos
 * Tự động quét toàn bộ các khối <script> (AF_initDataCallback, JSON mảng sâu)
 * để bóc tách 100% số lượng ảnh từ album Google Photos lớn
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

    // 3. Tải toàn bộ nội dung HTML từ trang Google Photos công khai (theo dõi redirect)
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
          message: `Không thể kết nối đến Google Photos (Mã phản hồi: ${response.status}). Vui lòng kiểm tra lại link album.`,
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

    // Loại bỏ các hậu tố thương hiệu của Google
    albumTitle = albumTitle
      .replace(/\s*-\s*Google\s*(?:Photos|Ảnh|相簿)$/i, '')
      .trim();

    let coverPhoto = '';
    const ogImageMatch = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
    );
    if (ogImageMatch && ogImageMatch[1]) {
      const baseCover = ogImageMatch[1].split('=')[0];
      coverPhoto = `${baseCover}=w1600`;
    }

    // 5. Bóc tách chuyên sâu từ TẤT CẢ các khối <script> (AF_initDataCallback & JSON arrays)
    const scriptTagRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    const scriptBlocks = [];
    let scriptMatch;
    while ((scriptMatch = scriptTagRegex.exec(html)) !== null) {
      if (scriptMatch[1]) {
        scriptBlocks.push(scriptMatch[1]);
      }
    }

    // Pattern nhận diện URL ảnh Google Photos (hỗ trợ mọi CDN lh0-lh9, photos)
    const photoUrlPattern =
      /(?:https?:)?\/\/(?:lh[0-9]|photos)\.googleusercontent\.com\/(?:pw\/)?[a-zA-Z0-9_\-]{20,}(?:=[a-zA-Z0-9\-_]+)?/gi;

    // Pattern nhận diện relative hash dạng pw/... trong các mảng dữ liệu sâu
    const relativePwPattern = /["'](pw\/[a-zA-Z0-9_\-]{25,})["']/g;

    // Map deduplicate dựa trên photoKey duy nhất
    const photoMap = new Map();

    const scanContent = (content) => {
      if (!content) return;
      const unescaped = unescapeGoogleContent(content);

      // 1. Quét theo URL đầy đủ
      const matches = unescaped.match(photoUrlPattern) || [];
      for (let rawUrl of matches) {
        if (rawUrl.startsWith('//')) {
          rawUrl = `https:${rawUrl}`;
        }
        const photoKey = extractPhotoKey(rawUrl);
        if (isValidAlbumPhoto(rawUrl, photoKey)) {
          if (!photoMap.has(photoKey)) {
            photoMap.set(photoKey, `https://lh3.googleusercontent.com/${photoKey}=w1600`);
          }
        }
      }

      // 2. Quét thêm relative hash pw/... nếu có
      let pwMatch;
      while ((pwMatch = relativePwPattern.exec(unescaped)) !== null) {
        const photoKey = pwMatch[1];
        if (isValidAlbumPhoto(photoKey, photoKey)) {
          if (!photoMap.has(photoKey)) {
            photoMap.set(photoKey, `https://lh3.googleusercontent.com/${photoKey}=w1600`);
          }
        }
      }
    };

    // Bước A: Quét từng block <script> riêng biệt (chứa AF_initDataCallback và các chunk data)
    for (const scriptContent of scriptBlocks) {
      scanContent(scriptContent);
    }

    // Bước B: Quét toàn bộ trang HTML đã giải mã để không bỏ sót bất kỳ ảnh nào
    scanContent(html);

    // 6. Chuyển đổi thành danh sách ảnh hoàn chỉnh
    const extractedPhotos = [];
    let photoIndex = 1;
    for (const [, srcUrl] of photoMap.entries()) {
      extractedPhotos.push({
        src: srcUrl,
        title: `Khoảnh khắc ${photoIndex}`,
        description: albumTitle || '',
      });
      photoIndex++;
    }

    if (extractedPhotos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Không tìm thấy ảnh trong liên kết này. Hãy đảm bảo album đã được bật chế độ "Chia sẻ Công Khai" (Bất kỳ ai có liên kết đều xem được).',
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
      message: `Đã trích xuất thành công toàn bộ ${extractedPhotos.length} ảnh từ Google Photos!`,
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
