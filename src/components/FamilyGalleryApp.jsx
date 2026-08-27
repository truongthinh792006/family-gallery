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
  const [albums, setAlbums] = useState(initialAlbums);
  const [siteInfo, setSiteInfo] = useState(DEFAULT_SITE_INFO);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);

  // Đọc dữ liệu từ localStorage khi client mount để giữ đồng bộ dữ liệu người dùng tùy biến
  useEffect(() => {
    setIsClientReady(true);
    try {
      const savedAlbums = localStorage.getItem('family_gallery_albums');
      if (savedAlbums) {
        setAlbums(JSON.parse(savedAlbums));
      }

      const savedSiteInfo = localStorage.getItem('family_gallery_site_info');
      if (savedSiteInfo) {
        setSiteInfo(JSON.parse(savedSiteInfo));
      }
    } catch {
      // Bỏ qua nếu môi trường không hỗ trợ localStorage
    }
  }, []);

  // Tổng hợp số lượng thống kê động
  const totalAlbums = albums.length;
  const totalPhotos = useMemo(() => {
    return albums.reduce(
      (acc, album) => acc + (album.photos ? album.photos.length : 0),
      0
    );
  }, [albums]);

  // Lưu danh sách Album mới vào localStorage
  const handleSaveAlbums = (newAlbums) => {
    setAlbums(newAlbums);
    try {
      localStorage.setItem('family_gallery_albums', JSON.stringify(newAlbums));
    } catch {}
  };

  // Lưu thông tin Trang web mới vào localStorage
  const handleSaveSiteInfo = (newSiteInfo) => {
    setSiteInfo(newSiteInfo);
    try {
      localStorage.setItem(
        'family_gallery_site_info',
        JSON.stringify(newSiteInfo)
      );
    } catch {}
  };

  // Khôi phục về dữ liệu mặc định từ data/albums.json
  const handleResetDefault = () => {
    setAlbums(initialAlbums);
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
      <Gallery albums={albums} />

      {/* Footer với nút vào nhanh Quản Trị */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Modal Bảng Quản Trị & Cài Đặt (có khóa mật khẩu PIN) */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        albums={albums}
        siteInfo={siteInfo}
        onSaveAlbums={handleSaveAlbums}
        onSaveSiteInfo={handleSaveSiteInfo}
        onResetDefault={handleResetDefault}
      />
    </main>
  );
}
