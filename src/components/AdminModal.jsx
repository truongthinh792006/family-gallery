'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Save,
  Download,
  Copy,
  Check,
  RotateCcw,
  Images,
  Globe,
  Camera,
  LogOut,
  AlertTriangle,
  Loader2,
  CloudUpload,
} from 'lucide-react';

export default function AdminModal({
  isOpen,
  onClose,
  albums = [],
  siteInfo = {},
  onSaveAlbums,
  onSaveSiteInfo,
  onResetDefault,
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Tabs: 'albums' | 'site'
  const [activeTab, setActiveTab] = useState('albums');

  // Bản sao cục bộ để chỉnh sửa
  const [localAlbums, setLocalAlbums] = useState(albums);
  const [localSiteInfo, setLocalSiteInfo] = useState(siteInfo);

  // Trạng thái khi chỉnh sửa / thêm album
  // editingIndex: null (đang ở danh sách), -1 (thêm album mới), >= 0 (sửa album tại index)
  const [editingIndex, setEditingIndex] = useState(null);
  const [albumForm, setAlbumForm] = useState({
    id: '',
    title: '',
    year: new Date().getFullYear().toString(),
    tag: 'Gia đình',
    cover: '',
    description: '',
    photos: [],
  });

  // Trạng thái phản hồi thông báo & đồng bộ đám mây
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState('');

  const adminPassword =
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

  // Đồng bộ props vào local state khi modal mở
  useEffect(() => {
    if (isOpen) {
      setLocalAlbums(albums);
      setLocalSiteInfo(siteInfo);
      setEditingIndex(null);
      setSaveSuccess(false);
      setSyncStatusMessage('');

      // Kiểm tra phiên đăng nhập admin trong sessionStorage
      try {
        if (sessionStorage.getItem('admin_session_auth') === 'true') {
          setIsAuthenticated(true);
        }
      } catch {}
    }
  }, [isOpen, albums, siteInfo]);

  if (!isOpen) return null;

  // Xử lý xác thực mật khẩu Admin
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput.trim() === adminPassword) {
      try {
        sessionStorage.setItem('admin_session_auth', 'true');
      } catch {}
      setIsAuthenticated(true);
      setError('');
      setPasswordInput('');
    } else {
      setError('Mật khẩu quản trị chưa đúng!');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('admin_session_auth');
    } catch {}
    setIsAuthenticated(false);
    setPasswordInput('');
  };

  // Mở form thêm album mới
  const handleStartAddAlbum = () => {
    setAlbumForm({
      id: `album-${Date.now()}`,
      title: '',
      year: new Date().getFullYear().toString(),
      tag: 'Gia đình',
      cover: '',
      description: '',
      photos: [
        {
          src: '',
          title: '',
          description: '',
        },
      ],
    });
    setEditingIndex(-1);
  };

  // Mở form sửa album đã có
  const handleStartEditAlbum = (index) => {
    const target = localAlbums[index];
    setAlbumForm(JSON.parse(JSON.stringify(target)));
    setEditingIndex(index);
  };

  // Xóa album
  const handleDeleteAlbum = (index) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa album "${localAlbums[index].title}" không?`
    );
    if (confirmDelete) {
      const updated = localAlbums.filter((_, idx) => idx !== index);
      setLocalAlbums(updated);
    }
  };

  // Thêm ảnh vào form album đang sửa
  const handleAddPhotoField = () => {
    setAlbumForm((prev) => ({
      ...prev,
      photos: [
        ...prev.photos,
        {
          src: '',
          title: '',
          description: '',
        },
      ],
    }));
  };

  // Xóa ảnh khỏi form album đang sửa
  const handleRemovePhotoField = (photoIndex) => {
    setAlbumForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, idx) => idx !== photoIndex),
    }));
  };

  // Cập nhật thông tin từng ảnh trong album
  const handlePhotoChange = (photoIndex, field, value) => {
    setAlbumForm((prev) => {
      const updatedPhotos = [...prev.photos];
      updatedPhotos[photoIndex] = {
        ...updatedPhotos[photoIndex],
        [field]: value,
      };
      return { ...prev, photos: updatedPhotos };
    });
  };

  // Lưu form album (thêm mới hoặc cập nhật vào local state)
  const handleSaveAlbumForm = (e) => {
    e.preventDefault();
    if (!albumForm.title.trim()) {
      alert('Vui lòng nhập tiêu đề album!');
      return;
    }

    // Nếu chưa có ảnh bìa, lấy ảnh con đầu tiên nếu có
    let coverUrl = albumForm.cover.trim();
    if (!coverUrl && albumForm.photos.length > 0 && albumForm.photos[0].src) {
      coverUrl = albumForm.photos[0].src.trim();
    }
    if (!coverUrl) {
      coverUrl =
        'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80';
    }

    const cleanedAlbum = {
      ...albumForm,
      cover: coverUrl,
      photos: albumForm.photos.filter((p) => p.src.trim() !== ''),
    };

    if (editingIndex === -1) {
      // Thêm mới lên đầu
      setLocalAlbums([cleanedAlbum, ...localAlbums]);
    } else if (editingIndex >= 0) {
      // Cập nhật vị trí cũ
      const updated = [...localAlbums];
      updated[editingIndex] = cleanedAlbum;
      setLocalAlbums(updated);
    }

    setEditingIndex(null);
  };

  // Lưu thay đổi: Gửi POST lên /api/gallery (Vercel KV) và cập nhật App state
  const handleApplyChanges = async () => {
    setIsSyncing(true);
    setSyncStatusMessage('Đang lưu lên đám mây...');

    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          albums: localAlbums,
          siteInfo: localSiteInfo,
          password: adminPassword,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        onSaveAlbums(localAlbums);
        onSaveSiteInfo(localSiteInfo);
        setSaveSuccess(true);
        setSyncStatusMessage(
          result.isKvConfigured
            ? 'Đã đồng bộ thành công trên mọi thiết bị!'
            : 'Đã lưu thành công! (Chưa cấu hình KV, lưu cục bộ)'
        );
      } else {
        alert(result.message || 'Lỗi khi lưu lên máy chủ');
        // Vẫn lưu vào bộ nhớ cục bộ để không mất công nhập
        onSaveAlbums(localAlbums);
        onSaveSiteInfo(localSiteInfo);
      }
    } catch (err) {
      // Khi mất mạng hoặc offline, lưu cục bộ dự phòng
      onSaveAlbums(localAlbums);
      onSaveSiteInfo(localSiteInfo);
      setSaveSuccess(true);
      setSyncStatusMessage('Đã lưu cục bộ vào trình duyệt!');
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSaveSuccess(false);
        setSyncStatusMessage('');
      }, 4000);
    }
  };

  // Xuất file JSON tải về
  const handleExportJSON = () => {
    const jsonString = JSON.stringify(localAlbums, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = 'albums.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  // Sao chép JSON vào Clipboard
  const handleCopyJSON = async () => {
    try {
      const jsonString = JSON.stringify(localAlbums, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Không thể sao chép vào bộ nhớ đệm.');
    }
  };

  // Khôi phục mặc định
  const handleResetToDefault = () => {
    const confirmReset = window.confirm(
      'Khôi phục về dữ liệu mặc định ban đầu từ data/albums.json? Mọi thay đổi chưa export sẽ bị xóa.'
    );
    if (confirmReset) {
      onResetDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      {/* Màn hình 1: Nhập mật khẩu xác thực Admin */}
      {!isAuthenticated ? (
        <div
          className={`relative w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 sm:p-8 ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 stroke-[1.8]" />
          </div>

          <div className="text-center mb-6">
            <h2 className="font-serif text-2xl font-bold text-stone-900 mb-1">
              Bảng Quản Trị
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm">
              Vui lòng nhập mật khẩu quản trị viên để mở khóa bảng cài đặt, chỉnh sửa album và đồng bộ đa thiết bị.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Nhập mật khẩu Admin..."
                  autoFocus
                  className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-800 focus:outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-xs text-rose-600 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>{error}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 text-sm font-medium transition cursor-pointer shadow-sm"
            >
              Đăng Nhập Quản Trị
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] text-stone-400">
            Mật khẩu mặc định: <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700 font-mono">admin123</code>
          </p>
        </div>
      ) : (
        /* Màn hình 2: Bảng Điều Khiển Quản Trị Toàn Diện */
        <div className="relative w-full max-w-4xl bg-[#FAF7F2] rounded-3xl border border-stone-300/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header Bảng Điều Khiển */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white/90 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100/70 text-amber-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-stone-900 leading-tight">
                  Quản Lý Album & Đồng Bộ Đám Mây
                </h2>
                <span className="text-[11px] text-stone-500">
                  {localAlbums.length} album • Tự động đồng bộ đa thiết bị (Vercel KV)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLogout}
                title="Khóa lại Admin"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Khóa lại</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Thanh chuyển Tab */}
          <div className="flex items-center gap-2 px-6 pt-3 border-b border-stone-200 bg-stone-100/50">
            <button
              type="button"
              onClick={() => {
                setActiveTab('albums');
                setEditingIndex(null);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition cursor-pointer ${
                activeTab === 'albums'
                  ? 'border-amber-800 text-amber-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Images className="w-4 h-4" />
              <span>Danh Sách Album ({localAlbums.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('site');
                setEditingIndex(null);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition cursor-pointer ${
                activeTab === 'site'
                  ? 'border-amber-800 text-amber-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Thông Tin Trang Web</span>
            </button>
          </div>

          {/* Nội dung chính cuộn được */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* TAB 1: Quản lý Album */}
            {activeTab === 'albums' && (
              <>
                {/* Form chỉnh sửa / thêm album con */}
                {editingIndex !== null ? (
                  <form
                    onSubmit={handleSaveAlbumForm}
                    className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-5"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <h3 className="font-serif text-base font-bold text-stone-800">
                        {editingIndex === -1 ? '✨ Thêm Album Mới' : '✏️ Chỉnh Sửa Album'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingIndex(null)}
                        className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                      >
                        Quay lại danh sách
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Tiêu đề Album *
                        </label>
                        <input
                          type="text"
                          required
                          value={albumForm.title}
                          onChange={(e) =>
                            setAlbumForm({ ...albumForm, title: e.target.value })
                          }
                          placeholder="VD: Kỳ Nghỉ Hè Nha Trang"
                          className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Năm *
                          </label>
                          <input
                            type="text"
                            required
                            value={albumForm.year}
                            onChange={(e) =>
                              setAlbumForm({ ...albumForm, year: e.target.value })
                            }
                            placeholder="2024"
                            className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Thể loại (Tag)
                          </label>
                          <select
                            value={albumForm.tag}
                            onChange={(e) =>
                              setAlbumForm({ ...albumForm, tag: e.target.value })
                            }
                            className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700"
                          >
                            <option value="Gia đình">Gia đình</option>
                            <option value="Du lịch">Du lịch</option>
                            <option value="Lễ Tết">Lễ Tết</option>
                            <option value="Kỷ niệm">Kỷ niệm</option>
                            <option value="Khác">Khác</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Link Ảnh Bìa (Cover URL - Unsplash / Google Drive)
                      </label>
                      <input
                        type="url"
                        value={albumForm.cover}
                        onChange={(e) =>
                          setAlbumForm({ ...albumForm, cover: e.target.value })
                        }
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Lời tựa / Mô tả Album
                      </label>
                      <textarea
                        rows={2}
                        value={albumForm.description}
                        onChange={(e) =>
                          setAlbumForm({ ...albumForm, description: e.target.value })
                        }
                        placeholder="Cảm xúc, câu chuyện ngắn về chuyến đi hoặc kỷ niệm này..."
                        className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700"
                      />
                    </div>

                    {/* Danh sách ảnh con */}
                    <div className="pt-3 border-t border-stone-100">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-semibold text-stone-800">
                          Danh Sách Ảnh Trong Album ({albumForm.photos.length})
                        </label>
                        <button
                          type="button"
                          onClick={handleAddPhotoField}
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm ảnh</span>
                        </button>
                      </div>

                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {albumForm.photos.map((photo, pIdx) => (
                          <div
                            key={pIdx}
                            className="p-3 bg-stone-50 border border-stone-200 rounded-xl relative group flex flex-col sm:flex-row gap-2 items-start sm:items-center"
                          >
                            <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-600 text-xs flex items-center justify-center shrink-0 font-bold">
                              {pIdx + 1}
                            </span>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                              <input
                                type="url"
                                required
                                value={photo.src}
                                onChange={(e) =>
                                  handlePhotoChange(pIdx, 'src', e.target.value)
                                }
                                placeholder="Link ảnh (src) *"
                                className="px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700"
                              />
                              <input
                                type="text"
                                value={photo.title}
                                onChange={(e) =>
                                  handlePhotoChange(pIdx, 'title', e.target.value)
                                }
                                placeholder="Tiêu đề ảnh (tùy chọn)"
                                className="px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePhotoField(pIdx)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition cursor-pointer shrink-0"
                              title="Xóa ảnh này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        {albumForm.photos.length === 0 && (
                          <p className="text-xs text-stone-400 text-center py-4 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                            Chưa có ảnh nào. Bấm &ldquo;Thêm ảnh&rdquo; ở trên để nạp ảnh vào album.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => setEditingIndex(null)}
                        className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition cursor-pointer shadow-sm"
                      >
                        Xong (Cập nhật Album)
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Danh sách album tổng quan */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-stone-500">
                        Quản lý và sắp xếp các album ảnh hiển thị trên trang chủ
                      </p>
                      <button
                        type="button"
                        onClick={handleStartAddAlbum}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-amber-50 text-xs font-medium shadow-sm transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Thêm Album Mới</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {localAlbums.map((album, idx) => (
                        <div
                          key={album.id || idx}
                          className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-stone-200 shadow-xs hover:border-stone-300 transition"
                        >
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                            <Image
                              src={album.cover}
                              alt={album.title}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif font-bold text-sm text-stone-900 truncate">
                              {album.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
                                {album.tag}
                              </span>
                              <span>• {album.year}</span>
                              <span>• {album.photos?.length || 0} ảnh</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditAlbum(idx)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-amber-800 hover:bg-amber-50 transition cursor-pointer"
                              title="Sửa album"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAlbum(idx)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Xóa album"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB 2: Thông tin Trang Web */}
            {activeTab === 'site' && (
              <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Tiêu Đề Chính Website
                  </label>
                  <input
                    type="text"
                    value={localSiteInfo.title || ''}
                    onChange={(e) =>
                      setLocalSiteInfo({ ...localSiteInfo, title: e.target.value })
                    }
                    placeholder="VD: Những Khoảnh Khắc Vô Giá"
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Lời Tựa / Thông Điệp Yêu Thương
                  </label>
                  <textarea
                    rows={3}
                    value={localSiteInfo.subtitle || ''}
                    onChange={(e) =>
                      setLocalSiteInfo({ ...localSiteInfo, subtitle: e.target.value })
                    }
                    placeholder="Mỗi bức ảnh là một chiếc vé du hành..."
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Mốc Thời Gian Hiển Thị
                  </label>
                  <input
                    type="text"
                    value={localSiteInfo.timeRange || ''}
                    onChange={(e) =>
                      setLocalSiteInfo({ ...localSiteInfo, timeRange: e.target.value })
                    }
                    placeholder="2023 - 2024"
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-700"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-white border-t border-stone-200">
            {/* Nhóm nút xuất dữ liệu */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleExportJSON}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition cursor-pointer"
                title="Tải tệp albums.json về máy tính"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất JSON</span>
              </button>

              <button
                type="button"
                onClick={handleCopyJSON}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition cursor-pointer"
                title="Sao chép toàn bộ mã JSON để dán đè vào data/albums.json"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép JSON</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetToDefault}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition cursor-pointer ml-1"
                title="Khôi phục về dữ liệu mặc định ban đầu"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Khôi phục gốc</span>
              </button>
            </div>

            {/* Nhóm nút Lưu & Đồng Bộ Lên Đám Mây */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {saveSuccess && (
                <span className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{syncStatusMessage || 'Đã lưu thành công!'}</span>
                </span>
              )}

              <button
                type="button"
                disabled={isSyncing}
                onClick={handleApplyChanges}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md transition cursor-pointer w-full sm:w-auto ${
                  isSyncing
                    ? 'bg-amber-900/60 text-amber-200 cursor-not-allowed'
                    : 'bg-amber-800 hover:bg-amber-900 text-amber-50'
                }`}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu lên đám mây...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4 text-amber-200" />
                    <span>Lưu & Đồng Bộ Đám Mây</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
