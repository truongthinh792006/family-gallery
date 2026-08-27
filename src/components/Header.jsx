import { Heart, Sparkles, Camera, CalendarHeart } from "lucide-react";

export default function Header({ totalAlbums = 0, totalPhotos = 0 }) {
  return (
    <header className="relative pt-12 pb-10 sm:pt-16 sm:pb-14 px-4 sm:px-6 lg:px-8 border-b border-stone-200/80 bg-gradient-to-b from-[#F7F2EA]/80 via-[#FAF7F2] to-[#FAF7F2]">
      {/* Họa tiết trang trí nền tinh tế */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-rose-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Huy hiệu gia đình */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-100/90 border border-stone-200/90 text-stone-700 text-xs sm:text-sm font-medium tracking-wide mb-6 shadow-xs backdrop-blur-sm">
          <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600 animate-pulse" />
          <span>KỶ NIỆM GIA ĐÌNH • FAMILY MEMORIES</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        </div>

        {/* Tiêu đề chính theo font Serif sang trọng, ấm cúng */}
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 mb-4 leading-[1.15]">
          Những Khoảnh Khắc <span className="italic font-normal text-amber-900">Vô Giá</span>
        </h1>

        {/* Lời tựa tình cảm */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-stone-600 font-normal leading-relaxed mb-8">
          Mỗi bức ảnh là một chiếc vé du hành về miền ký ức ngọt ngào — nơi tình thân luôn ấm áp,
          tiếng cười luôn vang mãi và yêu thương là bến đỗ bình yên nhất.
        </p>

        {/* Thông số thống kê nhanh */}
        <div className="inline-flex items-center justify-center flex-wrap gap-4 sm:gap-8 px-6 py-3 rounded-2xl bg-white/70 border border-stone-200/80 shadow-xs backdrop-blur-md text-stone-600 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-amber-700" />
            <span>
              <strong className="font-semibold text-stone-800">{totalAlbums}</strong> Album Kỷ Niệm
            </span>
          </div>

          <span className="hidden sm:inline w-1 h-1 rounded-full bg-stone-300" />

          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-600" />
            <span>
              <strong className="font-semibold text-stone-800">{totalPhotos}</strong> Bức Ảnh Đẹp
            </span>
          </div>

          <span className="hidden sm:inline w-1 h-1 rounded-full bg-stone-300" />

          <div className="flex items-center gap-2">
            <CalendarHeart className="w-4 h-4 text-stone-700" />
            <span>
              Mốc thời gian: <strong className="font-semibold text-stone-800">2023 - 2024</strong>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
