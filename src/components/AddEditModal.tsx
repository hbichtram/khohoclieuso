import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Star, Pin, Sparkles, HelpCircle, Upload, EyeOff, Eye } from 'lucide-react';
import { LinkItem, Category } from '../types';
import { isValidUrl, sanitizeInput, getFaviconUrl, extractCleanDomain } from '../storage';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (link: Partial<LinkItem>) => void;
  categories: Category[];
  editingLink: LinkItem | null;
  onAddToast: (message: string, type: 'success' | 'error' | 'info') => void;
  links: LinkItem[];
  defaultCategoryId?: string | null;
  defaultSubCategoryId?: 'tinhoc3' | 'tinhoc4' | 'tinhoc5' | null;
}

const PRESET_LINK_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Yellow
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
];

export const AddEditModal: React.FC<AddEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  editingLink,
  onAddToast,
  links,
  defaultCategoryId,
  defaultSubCategoryId,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [color, setColor] = useState(PRESET_LINK_COLORS[0]);
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [favicon, setFavicon] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Subcategory fields for Tin học 3/4/5
  const [subCategoryId, setSubCategoryId] = useState<'tinhoc3' | 'tinhoc4' | 'tinhoc5' | ''>('');
  const [topic, setTopic] = useState('');
  const [lesson, setLesson] = useState('');
  const [resourceType, setResourceType] = useState<'video' | 'lecture' | 'game' | 'exercise' | 'website' | 'software' | ''>('');
  const [keywords, setKeywords] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // When opening modal, load edit details if editing, else empty state
  useEffect(() => {
    if (isOpen) {
      if (editingLink) {
        setUrl(editingLink.url);
        setTitle(editingLink.title);
        setDescription(editingLink.description);
        setCategoryId(editingLink.categoryId);
        setColor(editingLink.color || PRESET_LINK_COLORS[0]);
        setNotes(editingLink.notes);
        setIsFavorite(editingLink.isFavorite);
        setIsPinned(editingLink.isPinned);
        setFavicon(editingLink.favicon);
        setImageUrl(editingLink.imageUrl || '');

        setSubCategoryId(editingLink.subCategoryId || '');
        setTopic(editingLink.topic || '');
        setLesson(editingLink.lesson || '');
        setResourceType(editingLink.resourceType || '');
        setKeywords(editingLink.keywords || '');
        setIsHidden(!!editingLink.isHidden);
      } else {
        // Create mode
        setUrl('');
        setTitle('');
        setDescription('');
        setCategoryId(defaultCategoryId || categories[0]?.id || '');
        setColor(PRESET_LINK_COLORS[0]);
        setNotes('');
        setIsFavorite(false);
        setIsPinned(false);
        setFavicon('');
        setImageUrl('');

        setSubCategoryId(defaultSubCategoryId || '');
        setTopic('');
        setLesson('');
        setResourceType('');
        setKeywords('');
        setIsHidden(false);
      }
    }
  }, [isOpen, editingLink, categories, defaultCategoryId, defaultSubCategoryId]);

  // Handler when URL blur to auto-fill title
  const handleUrlBlur = () => {
    let checkedUrl = url.trim();
    if (!checkedUrl) return;

    // Auto prepend https:// if missing
    if (!checkedUrl.startsWith('http://') && !checkedUrl.startsWith('https://')) {
      checkedUrl = 'https://' + checkedUrl;
      setUrl(checkedUrl);
    }

    if (isValidUrl(checkedUrl)) {
      setFavicon(getFaviconUrl(checkedUrl));
      if (!title) {
        const autoTitle = extractCleanDomain(checkedUrl);
        setTitle(autoTitle);
        onAddToast(`Tự động gợi ý tiêu đề từ tên miền: ${autoTitle}`, 'info');
      }
    }
  };

  // Helper to trigger manual AI/domain title suggestion
  const handleAutoSuggest = () => {
    const checkedUrl = url.trim();
    if (!checkedUrl) {
      onAddToast('Vui lòng nhập URL trước khi lấy gợi ý!', 'error');
      return;
    }
    if (!isValidUrl(checkedUrl)) {
      onAddToast('Địa chỉ URL không hợp lệ!', 'error');
      return;
    }
    const autoTitle = extractCleanDomain(checkedUrl);
    setTitle(autoTitle);
    setFavicon(getFaviconUrl(checkedUrl));
    onAddToast('Đã trích xuất tiêu đề website thành công!', 'success');
  };

  // AI assistant integration handler
  const handleAiAnalyze = async () => {
    const checkedUrl = url.trim();
    if (!checkedUrl) {
      onAddToast('Vui lòng nhập URL trước khi sử dụng trợ lý AI!', 'error');
      return;
    }

    // Auto prepend https:// if missing
    let finalUrl = checkedUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
      setUrl(finalUrl);
    }

    if (!isValidUrl(finalUrl)) {
      onAddToast('Địa chỉ URL không hợp lệ!', 'error');
      return;
    }

    setIsAiLoading(true);
    onAddToast('🪄 AI đang phân tích liên kết, phân loại học liệu và đề xuất thông tin...', 'info');

    try {
      const response = await fetch('/api/ai/analyze-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: finalUrl,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        const analysis = data.analysis;
        
        // Auto fill states
        setCategoryId('cat-tech'); // Classify under Tin học
        setSubCategoryId(analysis.subCategoryId || 'tinhoc3');
        setTopic(analysis.topic || '');
        setLesson(analysis.lesson || '');
        setResourceType(analysis.resourceType || 'website');
        setDescription(analysis.description || '');
        setKeywords(analysis.keywords || '');
        if (analysis.imageUrl) {
          setImageUrl(analysis.imageUrl);
        }

        onAddToast('🪄 AI đã phân tích và tự động phân loại học liệu thành công!', 'success');

        // Check active link
        if (!data.isLinkActive) {
          onAddToast('⚠️ Cảnh báo: AI phát hiện đường dẫn này phản hồi không hợp lệ hoặc có lỗi!', 'error');
        }

        // Check duplicates
        const isDuplicate = links.some(
          (l) => l.url.toLowerCase().trim() === finalUrl.toLowerCase().trim() && l.id !== editingLink?.id
        );
        if (isDuplicate) {
          onAddToast('⚠️ Cảnh báo: Liên kết này đã tồn tại trong danh sách học liệu của bạn!', 'error');
        }
      } else {
        onAddToast('Không thể phân tích dữ liệu bằng AI. Hãy tự điền thủ công!', 'error');
      }
    } catch (err) {
      console.error(err);
      onAddToast('Đã có lỗi xảy ra khi gọi AI trợ lý!', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    const cleanTitle = title.trim();

    if (!cleanUrl) {
      onAddToast('Vui lòng nhập đường dẫn URL!', 'error');
      return;
    }
    if (!isValidUrl(cleanUrl)) {
      onAddToast('Đường dẫn URL không hợp lệ! Vui lòng kiểm tra lại.', 'error');
      return;
    }
    if (!cleanTitle) {
      onAddToast('Vui lòng nhập tiêu đề cho liên kết!', 'error');
      return;
    }
    if (!categoryId) {
      onAddToast('Vui lòng chọn hoặc thêm danh mục trước!', 'error');
      return;
    }

    const isElearningCategory = categoryId === 'cat-work' || categories.find(c => c.id === categoryId)?.name === 'Bài giảng E-Learning';

    const payload: Partial<LinkItem> = {
      url: cleanUrl,
      title: sanitizeInput(cleanTitle),
      description: sanitizeInput(description.trim()),
      categoryId,
      color,
      favicon: favicon || getFaviconUrl(cleanUrl),
      notes: sanitizeInput(notes.trim()),
      isFavorite: Boolean(isFavorite),
      isPinned: Boolean(isPinned),
      imageUrl: imageUrl.trim() || '',
      
      // Dynamic fields for subcategory (when selected category is Bài giảng E-Learning)
      subCategoryId: isElearningCategory ? (subCategoryId as any) || '' : '',
      topic: isElearningCategory ? sanitizeInput(topic.trim()) : '',
      lesson: isElearningCategory ? sanitizeInput(lesson.trim()) : '',
      resourceType: isElearningCategory ? (resourceType as any) || '' : '',
      keywords: isElearningCategory ? sanitizeInput(keywords.trim()) : '',
      isHidden: isElearningCategory ? Boolean(isHidden) : false,
    };

    onSave(payload);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-md"
            id="add-edit-modal-backdrop"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-xl glass-modal rounded-3xl p-6 overflow-hidden max-h-[90vh] flex flex-col z-10 border border-white/10 dark:border-white/5 shadow-2xl"
            id="add-edit-modal-container"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {favicon ? (
                    <img
                      src={favicon}
                      alt="favicon"
                      className="w-6 h-6 object-contain rounded"
                      referrerPolicy="no-referrer"
                      onError={() => setFavicon('')}
                    />
                  ) : (
                    <Globe className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50" id="add-edit-modal-title">
                    {editingLink ? 'Chỉnh sửa liên kết' : 'Thêm liên kết mới'}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {editingLink ? 'Cập nhật lại thông tin học liệu học tập' : 'Lưu trữ một tài nguyên hoặc website giáo dục'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-white/10 dark:hover:bg-white/5 transition-colors cursor-pointer"
                id="add-edit-modal-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Scrollable container */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4" id="add-edit-modal-form">
              {/* URL */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Đường dẫn (URL) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onBlur={handleUrlBlur}
                      placeholder="e.g. scratch.mit.edu hoặc https://youtube.com/..."
                      className="w-full pl-9 pr-3 h-10 text-sm glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)]/20 placeholder-zinc-400"
                      id="input-url"
                      required
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAiAnalyze}
                    disabled={isAiLoading}
                    className="flex items-center gap-1.5 px-3 h-10 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:from-zinc-400 disabled:to-zinc-500 text-white rounded-xl text-xs font-bold shadow hover:shadow-md transition-all shrink-0 cursor-pointer border border-transparent"
                    title="Trí tuệ nhân tạo (AI) tự động phân loại, sinh mô tả và đề xuất hình ảnh học liệu"
                    id="btn-ai-analyze"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-white ${isAiLoading ? 'animate-spin' : 'animate-pulse'}`} />
                    {isAiLoading ? 'Đang đọc...' : 'AI Hỗ Trợ 🪄'}
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Tiêu đề học liệu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề học liệu (Ví dụ: Lập trình Scratch Lớp 3 - Bài 1)"
                  className="w-full px-3 h-10 text-sm glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)]/20 placeholder-zinc-400"
                  id="input-title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Mô tả ngắn
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Học liệu giúp học sinh thực hành lập trình..."
                  className="w-full px-3 h-10 text-sm glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)]/20 placeholder-zinc-400"
                  id="input-description"
                />
              </div>

              {/* Cover Image URL / Uploader */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Hình ảnh bìa học liệu (Đường dẫn URL hoặc tải file)
                </label>
                <div className="flex items-center gap-4">
                  {imageUrl ? (
                    <div className="relative w-20 h-16 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 shrink-0 shadow-sm group">
                      <img src={imageUrl} alt="Bìa liên kết" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition-all font-bold text-xs cursor-pointer"
                        id="btn-remove-link-cover"
                      >
                        Xóa
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-16 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-xs shrink-0 select-none">
                      Không ảnh
                    </div>
                  )}
                  
                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Hoặc dán URL ảnh bìa (Unsplash, v.v.)..."
                      className="w-full px-3 h-9 text-xs glass-input rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--primary-accent)]/20 placeholder-zinc-400"
                      id="input-image-url"
                    />
                    
                    <label
                      htmlFor="upload-link-image"
                      className="flex items-center justify-center gap-2 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-[var(--primary-accent)]/50 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-zinc-900 rounded-xl px-4 h-9 cursor-pointer transition-all text-xs font-semibold text-zinc-600 dark:text-zinc-300 shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5 text-[var(--primary-accent)]" />
                      Tải file từ máy tính...
                    </label>
                    <input
                      type="file"
                      id="upload-link-image"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setImageUrl(reader.result);
                              onAddToast('Đã tải lên ảnh bìa thành công!', 'success');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Category & Color row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Danh mục chính <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 h-10 text-sm glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)]/20"
                    id="select-category"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-slate-100">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2.5 uppercase tracking-wider">
                    Màu nhãn liên kết
                  </label>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {PRESET_LINK_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className="w-6 h-6 rounded-full border border-black/10 dark:border-white/10 transition-transform relative flex items-center justify-center shrink-0 cursor-pointer"
                        style={{ backgroundColor: c }}
                        id={`link-color-${c.replace('#', '')}`}
                      >
                        {color === c && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* COLLAPSIBLE SPECIAL E-LEARNING SUB-FOLDER FIELDS */}
              {(categoryId === 'cat-work' || categories.find(c => c.id === categoryId)?.name === 'Bài giảng E-Learning') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/35 space-y-4"
                  id="tin-hoc-subfields-container"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 border-b border-indigo-150/30 pb-2">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <span>CẤU HÌNH THƯ MỤC CON & HỌC LIỆU E-LEARNING</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Sub-Category Folder Selector */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-350 mb-1.5">
                        Thư mục con (Phân lớp) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={subCategoryId}
                        onChange={(e) => setSubCategoryId(e.target.value as any)}
                        className="w-full px-3 h-10 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        id="select-subcategory"
                        required
                      >
                        <option value="" className="text-zinc-400">-- Chọn Thư Mục Lớp --</option>
                        <option value="tinhoc3" className="text-blue-500 font-medium">📘 Tin học Lớp 3</option>
                        <option value="tinhoc4" className="text-emerald-500 font-medium">📗 Tin học Lớp 4</option>
                        <option value="tinhoc5" className="text-amber-500 font-medium">📙 Tin học Lớp 5</option>
                      </select>
                    </div>

                    {/* Resource Type */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-350 mb-1.5">
                        Loại học liệu
                      </label>
                      <select
                        value={resourceType}
                        onChange={(e) => setResourceType(e.target.value as any)}
                        className="w-full px-3 h-10 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        id="select-resourcetype"
                      >
                        <option value="">-- Chọn Loại Học Liệu --</option>
                        <option value="video">🎥 Video bài học</option>
                        <option value="lecture">📖 Bài giảng điện tử</option>
                        <option value="game">🎮 Trò chơi học tập</option>
                        <option value="exercise">📝 Bài tập / Trắc nghiệm</option>
                        <option value="website">🌐 Website học tập</option>
                        <option value="software">💻 Phần mềm học tập</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Topic Name */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-350 mb-1.5">
                        Chủ đề (Topic)
                      </label>
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Ví dụ: Làm quen với Scratch, Soạn thảo văn bản"
                        className="w-full px-3 h-10 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-zinc-400"
                        id="input-topic"
                      />
                    </div>

                    {/* Lesson Name */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-350 mb-1.5">
                        Bài học (Lesson)
                      </label>
                      <input
                        type="text"
                        value={lesson}
                        onChange={(e) => setLesson(e.target.value)}
                        placeholder="Ví dụ: Bài 1: Thông tin và Quyết định"
                        className="w-full px-3 h-10 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-zinc-400"
                        id="input-lesson"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Keywords tags */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-350 mb-1.5">
                        Từ khóa (Phân cách bằng dấu phẩy)
                      </label>
                      <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="Ví dụ: scratch, lap trinh, game, tin học 3"
                        className="w-full px-3 h-10 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-zinc-400"
                        id="input-keywords"
                      />
                    </div>

                    {/* Visibility status */}
                    <div className="flex items-center pt-7">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isHidden}
                          onChange={(e) => setIsHidden(e.target.checked)}
                          className="w-4.5 h-4.5 text-indigo-600 bg-zinc-100 border-zinc-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-zinc-800 dark:bg-zinc-700 dark:border-zinc-600"
                        />
                        <div className="text-xs">
                          <span className="block font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                            {isHidden ? <EyeOff className="w-3.5 h-3.5 text-rose-500" /> : <Eye className="w-3.5 h-3.5 text-emerald-500" />}
                            Ẩn học liệu với học sinh
                          </span>
                          <span className="block text-zinc-450 dark:text-zinc-500 text-[10px]">Chỉ tài khoản Quản trị viên mới nhìn thấy tài nguyên này.</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Ghi chú giáo viên (Markdown được hỗ trợ)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhập ghi chú cá nhân, câu hỏi thảo luận, dặn dò hoặc bài học liên quan..."
                  rows={3}
                  className="w-full p-3 text-sm glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)]/20 placeholder-zinc-400 resize-none"
                  id="textarea-notes"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/10 dark:border-white/5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 h-10 text-sm font-semibold text-zinc-650 dark:text-zinc-350 hover:bg-white/10 dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                  id="btn-modal-cancel"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: 'var(--primary-accent)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  className="px-5 h-10 text-sm font-semibold text-white rounded-xl hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  id="btn-modal-save"
                >
                  Lưu liên kết
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
