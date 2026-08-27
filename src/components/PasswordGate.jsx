'use client';

import { useState, useEffect } from 'react';
import { LockKeyhole, Eye, EyeOff, Heart, Sparkles, ArrowRight } from 'lucide-react';

export default function PasswordGate({ children }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Mật khẩu dự kiến từ biến môi trường (fallback mặc định 'giadinh2024')
  const expectedPassword =
    process.env.NEXT_PUBLIC_FAMILY_PASSWORD || 'giadinh2024';

  useEffect(() => {
    setIsMounted(true);

    // Kiểm tra phiên đăng nhập đã lưu trong localStorage
    try {
      const savedAuth = localStorage.getItem('family_auth_token');
      if (savedAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch {
      // Bỏ qua nếu môi trường không hỗ trợ localStorage
    }

    // Lắng nghe sự kiện khóa lại từ nút ở Footer
    const handleLockEvent = () => {
      try {
        localStorage.removeItem('family_auth_token');
      } catch {}
      setIsAuthenticated(false);
      setPasswordInput('');
      setError('');
    };

    window.addEventListener('family-lock', handleLockEvent);
    return () => window.removeEventListener('family-lock', handleLockEvent);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (passwordInput.trim() === expectedPassword) {
      try {
        localStorage.setItem('family_auth_token', 'true');
      } catch {}
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Mật khẩu chưa chính xác, vui lòng thử lại nhé!');
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
      }, 500);
    }
  };

  // Tránh lỗi Hydration Mismatch giữa SSR và Client:
  // Khi chưa mount xong, render màn hình chờ ấm cúng cùng tone màu nền
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-amber-800/30 border-t-amber-800 animate-spin" />
          <span className="font-serif text-stone-600 text-sm tracking-wide">
            Đang tải album gia đình...
          </span>
        </div>
      </div>
    );
  }

  // Đã xác thực thành công: Hiển thị trọn vẹn website
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Chưa xác thực: Hiển thị Màn hình Khóa Mật Khẩu (Password Gate)
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F2EA] via-[#FAF7F2] to-[#FAF7F2] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Hiệu ứng ánh sáng nền mờ ảo ấm áp */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-amber-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-rose-200/30 rounded-full blur-3xl" />
      </div>

      <div
        className={`relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl border border-stone-200/90 shadow-2xl p-6 sm:p-9 transition-transform duration-300 ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Biểu tượng khóa chính */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-800 mb-5 shadow-xs">
          <LockKeyhole className="w-7 h-7 stroke-[1.8]" />
        </div>

        {/* Tiêu đề & Lời nhắn */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-600 text-xs font-medium mb-3">
            <Heart className="w-3 h-3 text-rose-600 fill-rose-600" />
            <span>KHO BÁU KÝ ỨC</span>
            <Sparkles className="w-3 h-3 text-amber-600" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mb-2">
            Kỷ Niệm Gia Đình
          </h1>
          <p className="text-stone-600 text-sm leading-relaxed">
            Không gian riêng tư của gia đình chúng ta. Vui lòng nhập mật khẩu để mở khóa và xem album ảnh.
          </p>
        </div>

        {/* Biểu mẫu nhập mật khẩu */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Nhập mật khẩu gia đình..."
                autoFocus
                className={`w-full pl-4 pr-11 py-3 rounded-xl bg-stone-50/80 border text-stone-800 text-sm placeholder-stone-400 focus:outline-none transition ${
                  error
                    ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/30'
                    : 'border-stone-200 focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Thông báo lỗi nhẹ nhàng khi nhập sai */}
            {error && (
              <p className="mt-2 text-xs text-rose-600 flex items-center gap-1">
                <span>⚠️</span>
                <span>{error}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 text-sm font-medium shadow-md transition-all cursor-pointer active:scale-98"
          >
            <span>Mở Khóa Album</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </button>
        </form>

        {/* Gợi ý tinh tế */}
        <div className="mt-6 pt-5 border-t border-stone-100 text-center">
          <p className="text-[11px] text-stone-400">
            Mật khẩu mặc định: <code className="text-stone-600 bg-stone-100 px-1 py-0.5 rounded font-mono">giadinh2024</code>
          </p>
        </div>
      </div>
    </div>
  );
}
