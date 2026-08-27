import { Heart } from "lucide-react";

export default function Footer() {
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
      </div>
    </footer>
  );
}
