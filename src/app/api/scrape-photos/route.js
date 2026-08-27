import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Giải mã các ký tự escape trong JSON string từ Google Photos
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
  const withoutDomain = url.replace(/^(?:https?:)?\/\/[^\/]+\//, '');
  const baseHash = withoutDomain
    .split('=')[0]
    .split('?')[0]
    .split('#')[0]
    .trim();
  return baseHash || null;
}

/**
 * Kiểm tra xem URL / hash có phải là ảnh hợp lệ từ album hay không
 */
function isValidAlbumPhoto(url, photoKey) {
  if (!url || !photoKey) return false;

  // Loại trừ ảnh đại diện tài khoản Google (/a/, /a-/, /ogw/, /d/, /fife/)
  if (
    url.includes('/a/') ||
    url.includes('/a-/') ||
    url.includes('/ogw/') ||
    url.includes('/d/') ||
    url.includes('/fife/')
  ) {
    return false;
  }

  // Hash của ảnh Google Photos thông thường rất dài (thường >= 25 ký tự)
  if (photoKey.length < 25) {
    return false;
  }

  return true;
}

/**
 * POST /api/scrape-photos
 * Tự động bóc tách 100% số lượng ảnh từ Google Photos qua HTML ban đầu và RPC batchexecute
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

    console.log('\n======================================================');
    console.log('[Scraper Google Photos] Bắt đầu xử lý link:', trimmedUrl);

    // 3. Tải nội dung HTML từ trang Google Photos công khai (theo dõi redirect)
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
      console.error(
        `[Scraper Google Photos] Kết nối thất bại (Mã: ${response.status})`
      );
      return NextResponse.json(
        {
          success: false,
          message: `Không thể kết nối đến Google Photos (Mã phản hồi: ${response.status}). Vui lòng kiểm tra lại link album.`,
        },
        { status: 400 }
      );
    }

    const finalResolvedUrl = response.url || trimmedUrl;
    console.log('[Scraper Google Photos] URL chuyển hướng cuối:', finalResolvedUrl);
    const html = await response.text();

    // 4. Trích xuất Album Key & Auth Key
    const albumKeyMatch = finalResolvedUrl.match(/\/share\/([a-zA-Z0-9_\-]+)/);
    let albumKey = albumKeyMatch ? albumKeyMatch[1].split('?')[0] : '';
    const authKeyMatch = finalResolvedUrl.match(/[?&]key=([a-zA-Z0-9_\-]+)/);
    let authKey = authKeyMatch ? authKeyMatch[1] : '';

    // 5. Phân tích cấu trúc khối AF_initDataCallback
    const callbackRegex = /AF_initDataCallback\s*\(\s*\{([\s\S]*?)\}\s*\)\s*;/g;
    let cbMatch;
    let albumData = null;

    while ((cbMatch = callbackRegex.exec(html)) !== null) {
      const block = cbMatch[1];
      if (block.includes('googleusercontent.com') || block.includes('ds:1')) {
        const dataMatch = block.match(
          /data\s*:\s*(?:function\s*\(\)\s*\{\s*return\s+)?(\[[\s\S]*\])\s*,\s*sideChannel/
        );
        if (dataMatch) {
          try {
            const parsed = JSON.parse(dataMatch[1]);
            if (Array.isArray(parsed) && Array.isArray(parsed[1])) {
              albumData = parsed;
              break;
            }
          } catch {
            // Thử tiếp các khối khác nếu gặp lỗi parse
          }
        }
      }
    }

    let albumTitle = '';
    let totalReported = 0;
    let initialNextPageToken = null;

    if (albumData) {
      // Cấu trúc chuẩn của Google Photos Album:
      // albumData[1]: Mảng ảnh trang 1
      // albumData[2]: nextPageToken (nếu còn ảnh ở trang sau)
      // albumData[3]: Metadata ([3][0]: albumKey, [3][1]: title, [3][19]: authKey, [3][21]: totalItems)
      if (typeof albumData[2] === 'string' && albumData[2].trim().length > 0) {
        initialNextPageToken = albumData[2].trim();
      }

      if (albumData[3] && Array.isArray(albumData[3])) {
        albumTitle = albumData[3][1] || '';
        totalReported = albumData[3][21] || 0;
        if (!albumKey && albumData[3][0]) {
          albumKey = albumData[3][0];
        }
        if (!authKey && albumData[3][19]) {
          authKey = albumData[3][19];
        }
      }
    }

    // Fallback lấy Tiêu đề từ thẻ Meta nếu chưa có
    if (!albumTitle) {
      const ogTitleMatch = html.match(
        /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i
      );
      const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (ogTitleMatch && ogTitleMatch[1]) {
        albumTitle = ogTitleMatch[1];
      } else if (titleTagMatch && titleTagMatch[1]) {
        albumTitle = titleTagMatch[1];
      }
    }
    albumTitle = albumTitle
      .replace(/\s*-\s*Google\s*(?:Photos|Ảnh|相簿)$/i, '')
      .trim();

    // Fallback ảnh đại diện từ og:image
    let coverPhoto = '';
    const ogImageMatch = html.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
    );
    if (ogImageMatch && ogImageMatch[1]) {
      const baseCover = ogImageMatch[1].split('=')[0];
      coverPhoto = `${baseCover}=w1600`;
    }

    console.log('[Scraper Google Photos] Thông tin bóc tách ban đầu:');
    console.log('  -> Tiêu đề:', albumTitle || '(Chưa đặt tên)');
    console.log('  -> Album Key:', albumKey || '(Không tìm thấy)');
    console.log('  -> Auth Key:', authKey || '(Công khai không cần authKey)');
    console.log(
      '  -> Google báo cáo tổng mục (totalReported):',
      totalReported || 'Không xác định'
    );
    console.log(
      '  -> Token phân trang tiếp theo:',
      initialNextPageToken
        ? `${initialNextPageToken.slice(0, 30)}...`
        : '(Đã gom hết trong trang 1)'
    );

    // 6. Quét ảnh từ trang 1
    const photoMap = new Map();

    const addPhoto = (rawUrl) => {
      if (!rawUrl) return;
      let cleanUrl = rawUrl;
      if (cleanUrl.startsWith('//')) cleanUrl = `https:${cleanUrl}`;
      const key = extractPhotoKey(cleanUrl);
      if (isValidAlbumPhoto(cleanUrl, key) && !photoMap.has(key)) {
        photoMap.set(key, `https://lh3.googleusercontent.com/${key}=w1600`);
      }
    };

    // A. Nạp từ cấu trúc mảng albumData[1]
    if (albumData && Array.isArray(albumData[1])) {
      for (const item of albumData[1]) {
        const photoUrl = item[1]?.[0];
        if (photoUrl) addPhoto(photoUrl);
      }
    }

    // B. Quét thêm Regex bổ trợ từ toàn bộ HTML
    const photoUrlPattern =
      /(?:https?:)?\/\/(?:lh[0-9]|photos)\.googleusercontent\.com\/(?:pw\/)?[a-zA-Z0-9_\-]{20,}(?:=[a-zA-Z0-9\-_]+)?/gi;
    const relativePwPattern = /["'](pw\/[a-zA-Z0-9_\-]{25,})["']/g;

    const scanRegex = (text) => {
      if (!text) return;
      const unescaped = unescapeGoogleContent(text);
      const m1 = unescaped.match(photoUrlPattern) || [];
      for (const urlItem of m1) addPhoto(urlItem);

      let m2;
      while ((m2 = relativePwPattern.exec(unescaped)) !== null) {
        if (m2[1]) addPhoto(m2[1]);
      }
    };

    scanRegex(html);

    console.log(
      `[Scraper Google Photos] Đã tải trang 1: gom được ${photoMap.size} ảnh`
    );

    // 7. THỰC HIỆN PHÂN TRANG QUA BATCHEXECUTE (RPC snAcKc)
    let currentPageToken = initialNextPageToken;
    let pageCount = 1;
    const MAX_PAGES = 20;

    while (currentPageToken && albumKey && pageCount < MAX_PAGES) {
      pageCount++;
      console.log(
        `\n[Scraper RPC batchexecute] Đang gửi yêu cầu trang #${pageCount}...`
      );

      const reqId = 100000 + Math.floor(Math.random() * 900000);
      const endpoint = `https://photos.google.com/_/PhotosUi/data/batchexecute?rpcids=snAcKc&source-path=${encodeURIComponent(
        `/share/${albumKey}`
      )}&_reqid=${reqId}&rt=c`;

      // Payload chuẩn: [albumKey, nextPageToken, null, authKey || null]
      const payload = [albumKey, currentPageToken, null, authKey || null];
      const fReq = JSON.stringify([
        [['snAcKc', JSON.stringify(payload), null, 'generic']],
      ]);
      const bodyParams = new URLSearchParams();
      bodyParams.append('f.req', fReq);

      const countBefore = photoMap.size;
      let nextToken = null;

      try {
        const rpcRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Referer: finalResolvedUrl,
            'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
          },
          body: bodyParams.toString(),
        });

        console.log(`  -> RPC Status Code: ${rpcRes.status}`);
        if (!rpcRes.ok) {
          console.warn(`  -> Lỗi kết nối RPC (Mã: ${rpcRes.status}). Thoát phân trang.`);
          break;
        }

        const rpcText = await rpcRes.text();
        const cleaned = rpcText.replace(/^\)]}'\s*/, '');
        const lines = cleaned.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('[[')) continue;
          try {
            const parsedWrapper = JSON.parse(trimmed);
            for (const item of parsedWrapper) {
              if (item[0] === 'wrb.fr' && item[1] === 'snAcKc' && item[2]) {
                const inner = JSON.parse(item[2]);
                // inner[1] là mảng ảnh mới
                if (inner && Array.isArray(inner[1])) {
                  for (const pItem of inner[1]) {
                    const pUrl = pItem[1]?.[0];
                    if (pUrl) addPhoto(pUrl);
                  }
                }
                // inner[2] là nextPageToken của trang tiếp theo
                if (
                  inner &&
                  typeof inner[2] === 'string' &&
                  inner[2].trim().length > 0
                ) {
                  nextToken = inner[2].trim();
                }
              }
            }
          } catch {
            // Tiếp tục nếu chunk không phải JSON
          }
        }

        // Quét thêm regex từ rpcText để không bỏ sót
        scanRegex(rpcText);

        const added = photoMap.size - countBefore;
        console.log(
          `  -> Đã nạp thêm ${added} ảnh! Tổng số ảnh hiện tại: ${photoMap.size}/${totalReported || photoMap.size}`
        );

        if (!nextToken || nextToken === currentPageToken) {
          console.log('  -> Đã tải đến trang cuối cùng. Hoàn tất phân trang!');
          break;
        }

        currentPageToken = nextToken;
      } catch (err) {
        console.error('  -> Lỗi trong lượt gọi phân trang RPC:', err);
        break;
      }
    }

    // 8. Chuyển đổi thành mảng kết quả hoàn chỉnh
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

    console.log('======================================================');
    console.log(
      `[Scraper Google Photos Hoàn Tất] Tổng số ảnh: ${extractedPhotos.length} | Báo cáo: ${totalReported || extractedPhotos.length}`
    );
    console.log('======================================================\n');

    return NextResponse.json({
      success: true,
      title: albumTitle,
      coverPhoto,
      count: extractedPhotos.length,
      totalReported: totalReported || extractedPhotos.length,
      photos: extractedPhotos,
      message: `Đã bóc tách thành công ${extractedPhotos.length} ảnh từ Google Photos!`,
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
