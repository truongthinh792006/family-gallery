'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Layers,
  Heart,
  Palmtree,
  Sparkles,
  CalendarHeart,
  Camera,
  Calendar,
  Search,
  X,
  Maximize2,
  Images,
  ArrowRight,
} from 'lucide-react';

import Lightbox from 'yet-another-react-lightbox';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Counter from 'yet-another-react-lightbox/plugins/counter';

import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/counter.css';

// Ánh xạ icon cho từng loại danh mục
const TAG_ICONS = {
  'Tất cả': Layers,
  'Gia đình': Heart,
  'Du lịch': Palmtree,
  'Lễ Tết': Sparkles,
  'Kỷ niệm': CalendarHeart,
};

export default function Gallery({ albums = [] }) {
  const [selectedTag, setSelectedTag] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trạng thái cho Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentSlides, setCurrentSlides] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Danh sách các tag độc nhất có trong dữ liệu
  const tags = useMemo(() => {
    const uniqueTags = Array.from(new Set(albums.map((item) => item.tag)));
    return ['Tất cả', ...uniqueTags];
  }, [albums]);

  // Bộ lọc theo tag và từ khóa tìm kiếm
  const filteredAlbums = useMemo(() => {
    return albums.filter((album) => {
      const matchTag = selectedTag === 'Tất cả' || album.tag === selectedTag;
      const normalizedQuery = searchQuery.trim().toLowerCase();
      const matchSearch =
        normalizedQuery === '' ||
        album.title.toLowerCase().includes(normalizedQuery) ||
        album.description.toLowerCase().includes(normalizedQuery) ||
        album.year.toString().includes(normalizedQuery) ||
        album.tag.toLowerCase().includes(normalizedQuery);

      return matchTag && matchSearch;
    });
  }, [albums, selectedTag, searchQuery]);

  // Mở Lightbox xem toàn bộ album hoặc bắt đầu từ một ảnh cụ thể
  const handleOpenAlbum = (album, initialIndex = 0) => {
    const slides = (album.photos || []).map((photo) => ({
      src: photo.src,
      title: photo.title || album.title,
      description: photo.description || `${album.title} • Năm ${album.year}`,
    }));

    // Nếu album chưa có ảnh con, dùng tạm ảnh cover
    if (slides.length === 0) {
      slides.push({
        src: album.cover,
        title: album.title,
        description: album.description,
      });
    }

    setCurrentSlides(slides);
    setLightboxIndex(initialIndex >= 0 && initialIndex < slides.length ? initialIndex : 0);
    setLightboxOpen(true);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full">
      {/* Thanh công cụ: Bộ lọc Tag & Tìm kiếm */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-5 mb-10">
        {/* Nhóm nút lọc danh mục Tag */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {tags.map((tag) => {
            const IconComponent = TAG_ICONS[tag] || Camera;
            const isActive = selectedTag === tag;
            const count =
              tag === 'Tất cả'
                ? albums.length
                : albums.filter((a) => a.tag === tag).length;

            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 text-stone-50 shadow-md scale-102'
                    : 'bg-white/80 text-stone-600 border border-stone-200/90 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <IconComponent
                  className={`w-4 h-4 ${
                    isActive ? 'text-amber-300' : 'text-stone-500'
                  }`}
                />
                <span>{tag}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-stone-800 text-stone-300'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Ô tìm kiếm album */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, năm, mô tả..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-white/90 border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-700/30 focus:border-amber-700 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Thông báo kết quả tìm kiếm nếu có từ khóa */}
      {searchQuery && (
        <div className="text-sm text-stone-600 mb-6 flex items-center gap-2">
          <span>
            Tìm thấy <strong>{filteredAlbums.length}</strong> album cho từ khóa
            &ldquo;{searchQuery}&rdquo;
          </span>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-amber-800 underline hover:text-amber-900 text-xs font-medium cursor-pointer"
          >
            Bỏ lọc tìm kiếm
          </button>
        </div>
      )}

      {/* Lưới Album Responsive */}
      {filteredAlbums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAlbums.map((album) => {
            const photoCount = album.photos ? album.photos.length : 0;
            const previewPhotos = (album.photos || []).slice(0, 4);

            return (
              <article
                key={album.id}
                className="group flex flex-col bg-white/90 rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Khung ảnh bìa album */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenAlbum(album, 0)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenAlbum(album, 0);
                    }
                  }}
                  className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100 cursor-pointer block"
                >
                  <Image
                    src={album.cover}
                    alt={album.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Lớp phủ chuyển màu dịu nhẹ */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-70 group-hover:opacity-80 transition-opacity" />

                  {/* Huy hiệu danh mục & số lượng ảnh trên góc */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/95 text-stone-800 shadow-sm backdrop-blur-md">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      {album.tag}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 text-white shadow-sm backdrop-blur-md">
                      <Camera className="w-3 h-3 text-amber-300" />
                      {photoCount} ảnh
                    </span>
                  </div>

                  {/* Nút phóng to / xem ngay xuất hiện khi hover */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 text-stone-800 text-xs font-medium shadow-md backdrop-blur-sm">
                    <Maximize2 className="w-3.5 h-3.5 text-amber-800" />
                    <span>Xem Album</span>
                  </div>

                  {/* Năm thực hiện ở góc trái dưới */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs text-white/90 font-medium drop-shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-amber-300" />
                    <span>Năm {album.year}</span>
                  </div>
                </div>

                {/* Nội dung thông tin Album */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h2
                      onClick={() => handleOpenAlbum(album, 0)}
                      className="font-serif text-xl font-bold text-stone-900 hover:text-amber-800 transition-colors cursor-pointer leading-snug mb-2"
                    >
                      {album.title}
                    </h2>
                    <p className="text-stone-600 text-sm leading-relaxed line-clamp-2 mb-4 font-normal">
                      {album.description}
                    </p>
                  </div>

                  {/* Dải ảnh thu nhỏ preview & nút mở chi tiết */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    {/* Danh sách ảnh thu nhỏ có thể click xem trực tiếp ảnh đó */}
                    <div className="flex items-center -space-x-2 overflow-hidden py-1">
                      {previewPhotos.map((photo, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          title={photo.title || `Xem ảnh ${pIdx + 1}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAlbum(album, pIdx);
                          }}
                          className="relative w-8 h-8 rounded-full border-2 border-white shadow-xs overflow-hidden cursor-pointer hover:scale-110 hover:z-10 transition-transform focus:outline-none"
                        >
                          <Image
                            src={photo.src}
                            alt={photo.title || `Ảnh ${pIdx + 1}`}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </button>
                      ))}
                      {photoCount > 4 && (
                        <div
                          onClick={() => handleOpenAlbum(album, 4)}
                          className="relative w-8 h-8 rounded-full border-2 border-white bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center justify-center cursor-pointer hover:bg-stone-300 transition-colors"
                        >
                          +{photoCount - 4}
                        </div>
                      )}
                    </div>

                    {/* Nút Xem chi tiết */}
                    <button
                      type="button"
                      onClick={() => handleOpenAlbum(album, 0)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:text-amber-700 transition cursor-pointer group/btn"
                    >
                      <span>Khám phá</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Trạng thái không tìm thấy kết quả */
        <div className="text-center py-16 px-4 bg-white/60 rounded-3xl border border-dashed border-stone-300 max-w-lg mx-auto">
          <Images className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-stone-800 mb-1">
            Không tìm thấy album nào phù hợp
          </h3>
          <p className="text-stone-500 text-sm mb-5">
            Hãy thử tìm bằng từ khóa khác hoặc chọn danh mục &ldquo;Tất cả&rdquo; để xem toàn bộ album.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedTag('Tất cả');
              setSearchQuery('');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition cursor-pointer"
          >
            <span>Xem lại tất cả</span>
          </button>
        </div>
      )}

      {/* Trình xem ảnh dạng slide chuyên nghiệp Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={currentSlides}
        plugins={[Thumbnails, Zoom, Captions, Counter]}
        captions={{
          showToggle: true,
          descriptionTextAlign: 'center',
        }}
        thumbnails={{
          position: 'bottom',
          width: 100,
          height: 66,
          border: 2,
          gap: 12,
        }}
        zoom={{
          maxZoomPixelRatio: 3,
          zoomInMultiplier: 1.5,
        }}
        animation={{
          swipe: 250,
        }}
      />
    </section>
  );
}
