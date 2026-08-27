'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize,
  Minimize,
  Play,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';

/**
 * Kiểm tra xem một đường dẫn URL có phải là định dạng Video hay không
 */
export const isVideo = (src = '') => {
  if (!src || typeof src !== 'string') return false;
  const clean = src.toLowerCase().split('?')[0];
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.ogg') ||
    clean.endsWith('.m4v') ||
    src.includes('video') ||
    src.includes('googlevideo.com')
  );
};

export default function Lightbox({
  isOpen = false,
  open, // Tương thích ngược nếu prop được truyền là open
  onClose,
  close, // Tương thích ngược nếu prop được truyền là close
  slides = [],
  initialIndex = 0,
  index, // Tương thích ngược nếu prop được truyền là index
  albumTitle = '',
}) {
  const isModalOpen = isOpen || open || false;
  const handleCloseModal = onClose || close || (() => {});
  const startIndex = initialIndex ?? index ?? 0;

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const activeThumbnailRef = useRef(null);

  // Xử lý vuốt chạm (Touch Swipe) trên thiết bị di động
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 45;

  // Đồng bộ index khi mở modal hoặc khi initialIndex thay đổi
  useEffect(() => {
    if (isModalOpen) {
      const validIndex =
        startIndex >= 0 && startIndex < slides.length ? startIndex : 0;
      setCurrentIndex(validIndex);
    }
  }, [isModalOpen, startIndex, slides.length]);

  // Khóa cuộn trang (Body Scroll Lock) khi Lightbox đang mở
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen]);

  // Tự động cuộn thumbnail đang chọn vào vị trí chính giữa màn hình
  useEffect(() => {
    if (isModalOpen && showThumbnails && activeThumbnailRef.current) {
      activeThumbnailRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentIndex, isModalOpen, showThumbnails]);

  // Chuyển ảnh tiếp theo
  const handleNext = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  // Quay lại ảnh trước
  const handlePrev = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Lắng nghe phím tắt bàn phím (Desktop Keyboard Shortcuts)
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ' || e.code === 'Space') {
        // Phím cách: Tạm dừng / Phát video nếu slide hiện tại là video
        if (videoRef.current) {
          e.preventDefault();
          if (videoRef.current.paused) {
            videoRef.current.play();
          } else {
            videoRef.current.pause();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, handleNext, handlePrev, handleCloseModal]);

  // Xử lý bật/tắt toàn màn hình (Fullscreen)
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.warn('Lỗi khi chuyển đổi chế độ toàn màn hình:', err);
    }
  };

  // Tải trực tiếp ảnh / video về thiết bị
  const handleDownload = async () => {
    const currentSlide = slides[currentIndex];
    if (!currentSlide?.src) return;

    try {
      const response = await fetch(currentSlide.src);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const ext = isVideo(currentSlide.src) ? 'mp4' : 'jpg';
      const cleanTitle = (albumTitle || 'ky-niem')
        .toLowerCase()
        .replace(/\s+/g, '-');
      link.download = `${cleanTitle}-${currentIndex + 1}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: Mở tab mới nếu CORS chặn fetch blob
      window.open(currentSlide.src, '_blank');
    }
  };

  // Cử chỉ vuốt chạm trên màn hình cảm ứng
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
  };

  if (!isModalOpen || slides.length === 0) return null;

  const currentSlide = slides[currentIndex] || {};
  const currentIsVideo = isVideo(currentSlide.src);

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Trình xem chi tiết ảnh và video"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none overflow-hidden"
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER & THANH ĐIỀU KHIỂN TRÊN CÙNG */}
      {/* ------------------------------------------------------------- */}
      <header className="relative z-30 flex items-center justify-between px-3 sm:px-6 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Góc trái: Tag thông tin thanh lịch [Tên Album] • [Vị trí / Tổng số] */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-md text-xs sm:text-sm font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="max-w-[120px] sm:max-w-[260px] truncate font-serif font-semibold">
            {albumTitle || currentSlide.title || 'Kỷ Niệm'}
          </span>
          <span className="text-white/40">•</span>
          <span className="font-mono text-white/90 text-[11px] sm:text-xs shrink-0">
            {currentIndex + 1} / {slides.length}
          </span>
        </div>

        {/* Góc phải: Cụm nút công cụ kính mờ */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Nút Ẩn / Hiện dải thumbnail */}
          <button
            type="button"
            onClick={() => setShowThumbnails(!showThumbnails)}
            title={showThumbnails ? 'Ẩn thanh ảnh thu nhỏ' : 'Hiện thanh ảnh thu nhỏ'}
            className={`p-2 sm:p-2.5 rounded-full backdrop-blur-md border transition cursor-pointer ${
              showThumbnails
                ? 'bg-white/20 border-white/30 text-white'
                : 'bg-white/10 border-white/15 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Nút Tải ảnh / video về máy */}
          <button
            type="button"
            onClick={handleDownload}
            title="Tải về thiết bị"
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white transition cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Nút Toàn màn hình (Fullscreen) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            className="hidden sm:inline-flex p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white transition cursor-pointer shadow-md"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>

          {/* Nút Đóng (Close) nổi bật, dễ bấm trên mobile */}
          <button
            type="button"
            onClick={handleCloseModal}
            title="Đóng trình xem (Esc)"
            className="p-2 sm:p-2.5 rounded-full bg-rose-600/80 hover:bg-rose-600 backdrop-blur-md border border-rose-400/40 text-white transition cursor-pointer shadow-lg active:scale-95 ml-1"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. KHU VỰC HIỂN THỊ CHÍNH (ẢNH / VIDEO & NÚT ĐIỀU HƯỚNG) */}
      {/* ------------------------------------------------------------- */}
      <main
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative flex-1 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden w-full h-full"
      >
        {/* Nút Prev lơ lửng bên trái (Desktop) */}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 backdrop-blur-md border border-white/20 text-white items-center justify-center shadow-2xl transition duration-200 cursor-pointer"
            aria-label="Ảnh trước đó (Mũi tên trái)"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
        )}

        {/* Nút Next lơ lửng bên phải (Desktop) */}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 backdrop-blur-md border border-white/20 text-white items-center justify-center shadow-2xl transition duration-200 cursor-pointer"
            aria-label="Ảnh tiếp theo (Mũi tên phải)"
          >
            <ChevronRight className="w-6 h-6 stroke-[2.5]" />
          </button>
        )}

        {/* Khung chứa Media: Phân biệt Video hoặc Ảnh */}
        <div className="relative flex items-center justify-center w-full h-full max-h-[78vh] sm:max-h-[82vh]">
          {currentIsVideo ? (
            <video
              ref={videoRef}
              key={currentSlide.src}
              src={currentSlide.src}
              controls
              autoPlay
              playsInline
              className="max-h-[75vh] sm:max-h-[80vh] max-w-full w-auto h-auto rounded-2xl shadow-2xl object-contain bg-black/50"
            />
          ) : (
            <img
              key={currentSlide.src}
              src={currentSlide.src}
              alt={currentSlide.title || albumTitle || 'Kỷ niệm'}
              className="max-h-[75vh] sm:max-h-[80vh] max-w-full w-auto h-auto object-contain rounded-2xl shadow-2xl select-none transition-transform duration-300"
              draggable={false}
            />
          )}
        </div>

        {/* Chú thích ảnh (Caption & Description) bên dưới media */}
        {(currentSlide.title || currentSlide.description) && (
          <div className="mt-2 text-center max-w-2xl px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-lg pointer-events-auto">
            {currentSlide.title && (
              <p className="text-xs sm:text-sm font-semibold text-white/95 truncate">
                {currentSlide.title}
              </p>
            )}
            {currentSlide.description &&
              currentSlide.description !== currentSlide.title && (
                <p className="text-[11px] sm:text-xs text-white/70 line-clamp-1">
                  {currentSlide.description}
                </p>
              )}
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 3. THANH THUMBNAIL HIỆN ĐẠI CỐ ĐỊNH SÁT ĐÁY */}
      {/* ------------------------------------------------------------- */}
      {showThumbnails && slides.length > 1 && (
        <footer className="relative z-30 w-full px-3 sm:px-6 py-2.5 sm:py-3 bg-black/60 backdrop-blur-md border-t border-white/10 flex items-center justify-center">
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto max-w-5xl py-1 px-2 scrollbar-none">
            {slides.map((item, idx) => {
              const active = idx === currentIndex;
              const itemIsVideo = isVideo(item.src);

              return (
                <button
                  key={idx}
                  ref={active ? activeThumbnailRef : null}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-14 sm:w-16 h-10 sm:h-12 rounded-xl overflow-hidden shrink-0 border transition-all duration-200 cursor-pointer ${
                    active
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-105 opacity-100 border-transparent shadow-lg'
                      : 'opacity-50 hover:opacity-90 hover:scale-105 border-white/15'
                  }`}
                  aria-label={`Chuyển đến ảnh ${idx + 1}`}
                >
                  {itemIsVideo ? (
                    <div className="w-full h-full bg-stone-800 flex items-center justify-center relative">
                      {item.poster || item.thumbnail ? (
                        <img
                          src={item.poster || item.thumbnail}
                          alt={item.title || `Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-md">
                          <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.src}
                      alt={item.title || `Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </footer>
      )}
    </div>
  );
}
