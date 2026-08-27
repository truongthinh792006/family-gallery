import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import defaultAlbums from '../../../../data/albums.json';

export const dynamic = 'force-dynamic';

const DEFAULT_SITE_INFO = {
  title: 'Những Khoảnh Khắc Vô Giá',
  subtitle:
    'Mỗi bức ảnh là một chiếc vé du hành về miền ký ức ngọt ngào — nơi tình thân luôn ấm áp, tiếng cười luôn vang mãi và yêu thương là bến đỗ bình yên nhất.',
  timeRange: '2023 - 2024',
};

// Kiểm tra xem Vercel KV đã được thiết lập biến môi trường hay chưa
const isKvConfigured = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
);

/**
 * GET /api/gallery
 * Lấy dữ liệu album và thông tin website mới nhất từ Vercel KV (hoặc fallback an toàn từ albums.json)
 */
export async function GET() {
  const albumsFallback = Array.isArray(defaultAlbums) ? defaultAlbums : [];

  try {
    if (isKvConfigured) {
      try {
        const cloudData = await kv.get('family_gallery_data');
        if (cloudData && Array.isArray(cloudData.albums)) {
          return NextResponse.json({
            success: true,
            albums: cloudData.albums,
            siteInfo: cloudData.siteInfo || DEFAULT_SITE_INFO,
            isKvConfigured: true,
            updatedAt: cloudData.updatedAt || null,
          });
        }
      } catch (kvError) {
        console.error('Lỗi khi truy xuất dữ liệu từ Vercel KV, fallback về tệp tĩnh:', kvError);
      }
    }

    // Fallback an toàn: Trả về dữ liệu gốc từ tệp data/albums.json
    return NextResponse.json({
      success: true,
      albums: albumsFallback,
      siteInfo: DEFAULT_SITE_INFO,
      isKvConfigured,
      source: 'local_file',
    });
  } catch (error) {
    console.error('Lỗi tổng quát tại GET /api/gallery:', error);
    // Luôn đảm bảo phản hồi HTTP 200 kèm mảng dữ liệu thay vì làm sập trang
    return NextResponse.json({
      success: true,
      albums: albumsFallback,
      siteInfo: DEFAULT_SITE_INFO,
      isKvConfigured: false,
      source: 'fallback_error',
    });
  }
}

/**
 * POST /api/gallery
 * Lưu trữ danh sách album và thông tin trang web lên Vercel KV
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { albums, siteInfo, password } = body;

    const adminPassword =
      process.env.ADMIN_PASSWORD ||
      process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
      'admin123';

    // Xác thực mật khẩu Quản Trị Viên
    if (!password || password.trim() !== adminPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Mật khẩu quản trị viên không chính xác.',
        },
        { status: 401 }
      );
    }

    if (!albums || !Array.isArray(albums)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Dữ liệu album không hợp lệ.',
        },
        { status: 400 }
      );
    }

    const payload = {
      albums,
      siteInfo: siteInfo || DEFAULT_SITE_INFO,
      updatedAt: new Date().toISOString(),
    };

    if (isKvConfigured) {
      try {
        await kv.set('family_gallery_data', payload);
        return NextResponse.json({
          success: true,
          message: 'Đã đồng bộ thành công lên đám mây Vercel KV trên mọi thiết bị!',
          isKvConfigured: true,
          updatedAt: payload.updatedAt,
        });
      } catch (kvSetError) {
        console.error('Lỗi khi ghi dữ liệu lên Vercel KV:', kvSetError);
        return NextResponse.json({
          success: true,
          message: 'Lưu thành công vào bộ nhớ tạm (Lỗi kết nối máy chủ đám mây Vercel KV)',
          isKvConfigured: false,
          updatedAt: payload.updatedAt,
        });
      }
    }

    // Phản hồi khi chưa có Vercel KV trong môi trường dev
    return NextResponse.json({
      success: true,
      message:
        'Đã lưu thành công! (Môi trường hiện tại chưa kết nối Vercel KV, dữ liệu được duy trì qua bộ nhớ trình duyệt)',
      isKvConfigured: false,
      updatedAt: payload.updatedAt,
    });
  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu lên Vercel KV:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Có lỗi xảy ra trong quá trình lưu dữ liệu: ' + error.message,
      },
      { status: 500 }
    );
  }
}
