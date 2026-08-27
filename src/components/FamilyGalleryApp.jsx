'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import Gallery from '@/components/Gallery';
import Footer from '@/components/Footer';
import AdminModal from '@/components/AdminModal';

const DEFAULT_SITE_INFO = {
  title: 'Những Khoảnh Khắc Vô Giá',
  subtitle:
    'Mỗi bức ảnh là một chiếc vé du hành về miền ký ức ngọt ngào — nơi tình thân luôn ấm áp, tiếng cười luôn vang mãi và yêu thương là bến đỗ bình yên nhất.',
  timeRange: '2023 - 2024',
};

export default function FamilyGalleryApp({ initialAlbums = [] }) {
  const safeInitialAlbums = Array.isArray(initialAlbums) ? initialAlbums : [];
  const [albums, setAlbums] = useState(safeInitialAlbums);
  const [siteInfo, setSiteInfo] = useState(DEFAULT_SITE_INFO);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);

  // Đọc dữ liệu từ localStorage (offline cache) và đồng bộ đám mây Vercel KV (/api/gallery)
  useEffect(() => {
    setIsClientReady(true);

    // 1. Đọc an toàn từ localStorage để hiển thị tức thời (Instant UI)
    try {
      const savedAlbums = localStorage.getItem('family_gallery_albums');
      if (savedAlbums) {
        const parsed = JSON.parse(savedAlbums);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAlbums(parsed);
        }
      }

      const savedSiteInfo = localStorage.getItem('family_gallery_site_info');
      if (savedSiteInfo) {
        const parsedInfo = JSON.parse(savedSiteInfo);
        if (parsedInfo && typeof parsedInfo === 'object') {
          setSiteInfo((prev) => ({ ...prev, ...parsedInfo }));
        }
      }
    } catch (e) {
      console.warn('Không thể đọc bộ nhớ tạm localStorage:', e);
    }

    // 2. Fetch dữ liệu mới nhất từ Vercel KV thông qua API trung gian an toàn
    const fetchLatestData = async () => {
      try {
        const res = await fetch('/api/gallery', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.albums)) {
            setAlbums(data.albums);
            if (data.siteInfo && typeof data.siteInfo === 'object') {
              setSiteInfo(data.siteInfo);
            }
            // Đồng bộ lại vào localStorage làm bộ nhớ đệm ngoại tuyến
            try {
              localStorage.setItem(
                'family_gallery_albums',
                JSON.stringify(data.albums)
              );
              if (data.siteInfo) {
                localStorage.setItem(
                  'family_gallery_site_info',
                  JSON.stringify(data.siteInfo)
                );
              }
            } catch {}
          }
        }
      } catch (err) {
        // Nếu offline hoặc lỗi mạng, ứng dụng vẫn chạy mượt mà từ cache
        console.warn('Lỗi khi fetch dữ liệu từ đám mây, sử dụng dữ liệu cục bộ:', err);
      }
    };

    fetchLatestData();
  }, []);

  // Tổng hợp số lượng thống kê động an toàn
  const safeAlbumsList = Array.isArray(albums) ? albums : [];
  const totalAlbums = safeAlbumsList.length;
  const totalPhotos = useMemo(() => {
    if (!Array.isArray(albums)) return 0;
    return albums.reduce(
      (acc, album) =>
        acc + (album && Array.isArray(album.photos) ? album.photos.length : 0),
      0
    );
  }, [albums]);

  // Lưu danh sách Album mới vào localStorage và cập nhật UI
  const handleSaveAlbums = (newAlbums) => {
    const listToSave = Array.isArray(newAlbums) ? newAlbums : [];
    setAlbums(listToSave);
    try {
      localStorage.setItem('family_gallery_albums', JSON.stringify(listToSave));
    } catch {}
  };

  // Lưu thông tin Trang web mới vào localStorage và cập nhật UI
  const handleSaveSiteInfo = (newSiteInfo) => {
    const infoToSave =
      newSiteInfo && typeof newSiteInfo === 'object'
        ? newSiteInfo
        : DEFAULT_SITE_INFO;
    setSiteInfo(infoToSave);
    try {
      localStorage.setItem(
        'family_gallery_site_info',
        JSON.stringify(infoToSave)
      );
    } catch {}
  };

  // Khôi phục về dữ liệu mặc định từ data/albums.json
  const handleResetDefault = () => {
    setAlbums(safeInitialAlbums);
    setSiteInfo(DEFAULT_SITE_INFO);
    try {
      localStorage.removeItem('family_gallery_albums');
      localStorage.removeItem('family_gallery_site_info');
    } catch {}
  };

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      {/* Header trang web với nút Cài đặt ở góc */}
      <Header
        siteInfo={siteInfo}
        totalAlbums={totalAlbums}
        totalPhotos={totalPhotos}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Danh sách Album & Lightbox mở công khai */}
      <Gallery albums={safeAlbumsList} />

      {/* Footer với nút vào nhanh Quản Trị */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Modal Bảng Quản Trị & Cài Đặt (có đồng bộ Vercel KV) */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        albums={safeAlbumsList}
        siteInfo={siteInfo}
        onSaveAlbums={handleSaveAlbums}
        onSaveSiteInfo={handleSaveSiteInfo}
        onResetDefault={handleResetDefault}
      />
    </main>
  );
}
