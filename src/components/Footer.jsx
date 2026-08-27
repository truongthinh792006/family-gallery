'use client';

import { Heart, Lock } from "lucide-react";

export default function Footer() {
  const handleLock = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('family_auth_token');
      } catch {}
      window.dispatchEvent(new CustomEvent('family-lock'));
    }
  };

  return (
    <footer className="mt-auto border-t border-stone-200/80 bg-[#F5EFE6]/50 py-10 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-4xl mx-auto space-y-3">
        <p className="font-serif text-lg text-stone-700 italic">
          &ldquo;Gia đình là nơi cuộc sống bắt đầu và tình yêu không bao giờ kết thúc.&rdquo;
        </p>
        <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-stone-500">
          <span>Gìn giữ bởi Đại gia đình với</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>• Tất cả khoảnh khắc đẹp nhất</span>
        </div>

        {/* Nút Khóa Thư Viện để dễ dàng test lại màn hình khóa */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLock}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-stone-500 hover:text-stone-800 bg-stone-200/60 hover:bg-stone-200 border border-stone-300/50 transition-colors cursor-pointer shadow-2xs"
            title="Khóa lại màn hình album"
          >
            <Lock className="w-3.5 h-3.5 text-stone-600" />
            <span>Khóa Thư Viện</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
