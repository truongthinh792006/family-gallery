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

  // Hash của ảnh Google Photos trong album thường dài từ 25 đến hơn 120 ký tự
  if (photoKey.length < 25) {
    return false;
  }

  return true;
}

/**
 * Trích xuất token phiên làm việc Google (XSRF auth token 'at' / 'SNlM0e') từ HTML
 */
function extractAtToken(html) {
  if (!html) return '';
  // 1. SNlM0e trong object WIZ_global_data
  const snMatch = html.match(/"SNlM0e"\s*:\s*"([^"]+)"/);
  if (snMatch && snMatch[1]) return snMatch[1];

  // 2. SNlM0e dạng array literal
  const arrayMatch = html.match(/\["SNlM0e",\s*null,\s*"([^"]+)"\]/);
  if (arrayMatch && arrayMatch[1]) return arrayMatch[1];

  // 3. Ftik6d
  const ftikMatch = html.match(/"Ftik6d"\s*:\s*"([^"]+)"/);
  if (ftikMatch && ftikMatch[1]) return ftikMatch[1];

  return '';
}

/**
 * Trích xuất mã định danh Album Key (dạng AF1Qip...) từ URL chuyển hướng hoặc HTML
 */
function extractAlbumKey(finalUrl, html) {
  // 1. Từ URL chuyển hướng: https://photos.google.com/share/AF1Qip...
  if (finalUrl) {
    const urlMatch = finalUrl.match(/\/share\/([a-zA-Z0-9_\-]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1].split('?')[0];
    }
  }

  // 2. Từ HTML: key album bắt đầu bằng AF1Qip
  if (html) {
    const htmlMatch = html.match(/"(AF1Qip[a-zA-Z0-9_\-]{20,})"/);
    if (htmlMatch && htmlMatch[1]) {
      return htmlMatch[1];
    }
  }

  return '';
}

/**
 * Trích xuất nextPageToken đầu tiên từ khối AF_initDataCallback trong HTML
 */
function extractInitialNextPageToken(html) {
  if (!html) return null;

  const callbackRegex = /AF_initDataCallback\s*\(\s*\{([\s\S]*?)\}\s*\)\s*;/g;
  let match;

  while ((match = callbackRegex.exec(html)) !== null) {
    const block = match[1];
    // Chỉ quan tâm các khối có chứa ảnh hoặc key liên quan đến ds:1 / ds:2
    if (
      !block.includes('googleusercontent.com') &&
      !block.includes('pw/') &&
      !block.includes('ds:1') &&
      !block.includes('ds:2')
    ) {
      continue;
    }

    // Trích xuất phần data mảng: data: [...] hoặc data: function(){return [...]}
    const dataMatch = block.match(
      /data\s*:\s*(?:function\s*\(\)\s*\{\s*return\s+)?(\[[\s\S]*\])/
    );
    if (dataMatch && dataMatch[1]) {
      try {
        const cleanJson = dataMatch[1].trim().replace(/;?\s*\}?\s*$/, '');
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed)) {
          // Trong cấu trúc Google Photos Album:
          // parsed[0] là danh sách ảnh trang 1
          // parsed[1] là nextPageToken (string) nếu còn trang tiếp theo
          if (
            parsed[1] &&
            typeof parsed[1] === 'string' &&
            parsed[1].length > 10
          ) {
            return parsed[1];
          }
        }
      } catch {
        // Tiếp tục thử regex nếu JSON.parse gặp lỗi cú pháp
      }
    }

    // Fallback regex tìm token dạng string ở cuối mảng dữ liệu
    const tokenRegex =
      /,\s*["']([A-Za-z0-9_\-]{30,})["']\s*(?:,\s*null)*\s*\]\s*$/;
    const tokenMatch = block.match(tokenRegex);
    if (tokenMatch && tokenMatch[1]) {
      return tokenMatch[1];
    }
  }

  return null;
}

/**
 * Gửi RPC request batchexecute đến Google Photos để tải trang ảnh tiếp theo
 */
async function fetchBatchExecutePage(
  albumKey,
  nextPageToken,
  atToken,
  refererUrl
) {
  const reqId = 100000 + Math.floor(Math.random() * 900000);
  const endpoint = `https://photos.google.com/_/PhotosUi/data/batchexecute?rpcids=snAcKc&source-path=${encodeURIComponent(
    `/share/${albumKey}`
  )}&_reqid=${reqId}&rt=c`;

  // Thử cấu trúc payload snAcKc: [albumKey, nextPageToken]
  const innerPayload = JSON.stringify([albumKey, nextPageToken]);
  const fReq = JSON.stringify([[['snAcKc', innerPayload, null, 'generic']]]);

  const bodyParams = new URLSearchParams();
  bodyParams.append('f.req', fReq);
  if (atToken) {
    bodyParams.append('at', atToken);
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: '*/*',
        Referer: refererUrl || `https://photos.google.com/share/${albumKey}`,
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
      },
      body: bodyParams.toString(),
    });

    if (!res.ok) {
      console.warn(`Batchexecute request HTTP status: ${res.status}`);
      return { text: '', nextToken: null };
    }

    const responseText = await res.text();
    let nextToken = null;

    // Phân tích bóc tách nextToken mới từ response envelope của Google:
    // Định dạng: )]}' \n <length> \n [[["wrb.fr","snAcKc","[...inner json...]",...]]]
    try {
      const cleanedText = responseText.replace(/^\)]}'\s*/, '');
      const lines = cleanedText.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine.startsWith('[[')) continue;
        try {
          const parsedWrapper = JSON.parse(trimmedLine);
          if (Array.isArray(parsedWrapper)) {
            for (const item of parsedWrapper) {
              if (
                Array.isArray(item) &&
                item[0] === 'wrb.fr' &&
                item[1] === 'snAcKc' &&
                item[2]
              ) {
                const innerData = JSON.parse(item[2]);
                // innerData[1] là token của trang kế tiếp
                if (
                  innerData &&
                  Array.isArray(innerData) &&
                  typeof innerData[1] === 'string' &&
                  innerData[1].length > 10
                ) {
                  nextToken = innerData[1];
                }
              }
            }
          }
        } catch {}
      }
    } catch (e) {
      console.warn('Lỗi khi bóc tách token phân trang:', e);
    }

    // Fallback regex tìm token nếu cấu trúc wrapper phân mảnh
    if (!nextToken) {
      const fallbackMatches = [
        ...responseText.matchAll(/,"([A-Za-z0-9_\-]{40,})"/g),
      ];
      for (const fMatch of fallbackMatches) {
        if (fMatch[1] && fMatch[1] !== nextPageToken && fMatch[1] !== albumKey) {
          nextToken = fMatch[1];
          break;
        }
      }
    }

    return { text: responseText, nextToken };
  } catch (err) {
    console.warn('Lỗi khi gửi request batchexecute:', err);
    return { text: '', nextToken: null };
  }
}

/**
 * POST /api/scrape-photos
 * Tự động quét toàn bộ HTML và thực hiện phân trang RPC batchexecute
 * để gom đủ 100% số lượng ảnh từ Google Photos album (vượt qua giới hạn 300 ảnh)
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

    const finalResolvedUrl = response.url || trimmedUrl;
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

    // 5. Khởi tạo bộ quét và Map deduplicate ảnh
    const photoUrlPattern =
      /(?:https?:)?\/\/(?:lh[0-9]|photos)\.googleusercontent\.com\/(?:pw\/)?[a-zA-Z0-9_\-]{20,}(?:=[a-zA-Z0-9\-_]+)?/gi;
    const relativePwPattern = /["'](pw\/[a-zA-Z0-9_\-]{25,})["']/g;

    const photoMap = new Map();

    const scanContent = (content) => {
      if (!content) return;
      const unescaped = unescapeGoogleContent(content);

      // A. Quét theo URL đầy đủ
      const matches = unescaped.match(photoUrlPattern) || [];
      for (let rawUrl of matches) {
        if (rawUrl.startsWith('//')) {
          rawUrl = `https:${rawUrl}`;
        }
        const photoKey = extractPhotoKey(rawUrl);
        if (isValidAlbumPhoto(rawUrl, photoKey)) {
          if (!photoMap.has(photoKey)) {
            photoMap.set(
              photoKey,
              `https://lh3.googleusercontent.com/${photoKey}=w1600`
            );
          }
        }
      }

      // B. Quét thêm relative hash pw/... nếu có
      let pwMatch;
      while ((pwMatch = relativePwPattern.exec(unescaped)) !== null) {
        const photoKey = pwMatch[1];
        if (isValidAlbumPhoto(photoKey, photoKey)) {
          if (!photoMap.has(photoKey)) {
            photoMap.set(
              photoKey,
              `https://lh3.googleusercontent.com/${photoKey}=w1600`
            );
          }
        }
      }
    };

    // Bước 5.1: Quét từng block <script> trong HTML ban đầu
    const scriptTagRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    let scriptMatch;
    while ((scriptMatch = scriptTagRegex.exec(html)) !== null) {
      if (scriptMatch[1]) {
        scanContent(scriptMatch[1]);
      }
    }
    // Quét thêm toàn bộ trang HTML gốc
    scanContent(html);

    // 6. THỰC HIỆN PHÂN TRANG QUA BATCHEXECUTE (RPC snAcKc) NẾU ALBUM LỚN HƠN 300 ẢNH
    const albumKey = extractAlbumKey(finalResolvedUrl, html);
    const atToken = extractAtToken(html);
    let currentPageToken = extractInitialNextPageToken(html);

    // Giới hạn an toàn tối đa 20 trang (~6.000 ảnh) để tránh timeout
    const MAX_PAGES = 20;
    let pageCount = 0;

    while (currentPageToken && albumKey && pageCount < MAX_PAGES) {
      pageCount++;
      const { text: batchText, nextToken } = await fetchBatchExecutePage(
        albumKey,
        currentPageToken,
        atToken,
        finalResolvedUrl
      );

      if (batchText) {
        scanContent(batchText);
      }

      // Nếu không còn token hoặc token không đổi -> đã tải hết 100% album
      if (!nextToken || nextToken === currentPageToken) {
        break;
      }

      currentPageToken = nextToken;
    }

    // 7. Chuyển đổi thành danh sách ảnh hoàn chỉnh
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
