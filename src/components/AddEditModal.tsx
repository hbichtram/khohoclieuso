import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Globe,
  Star,
  Pin,
  Sparkles,
  HelpCircle,
  Upload,
  EyeOff,
  Eye,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  Package,
  RefreshCw,
  Trash2,
  CheckCircle2,
  FolderOpen,
  User,
  Link as LinkIcon,
} from 'lucide-react';
import { LinkItem, Category } from '../types';
import {
  isValidUrl,
  sanitizeInput,
  getFaviconUrl,
  extractCleanDomain,
  detectFileType,
  formatFileSize,
  getFileTypeBadgeInfo,
} from '../storage';
import { uploadFileToFirebaseStorage } from '../firebase';

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
  role?: 'admin' | 'viewer';
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
  role = 'admin',
}) => {
  // Input mode: 'link' (URL) or 'file' (Tải tệp từ máy tính)
  const [entryMode, setEntryMode] = useState<'link' | 'file'>('link');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState<number | undefined>(undefined);
  const [uploadedStoragePath, setUploadedStoragePath] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common Fields
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
  const [author, setAuthor] = useState('');
  const [grade, setGrade] = useState('');

  // Subcategory fields for Tin học 3/4/5
  const [subCategoryId, setSubCategoryId] = useState<'tinhoc3' | 'tinhoc4' | 'tinhoc5' | ''>('');
  const [topic, setTopic] = useState('');
  const [lesson, setLesson] = useState('');
  const [resourceType, setResourceType] = useState<'video' | 'lecture' | 'game' | 'exercise' | 'website' | 'software' | 'document' | ''>('');
  const [keywords, setKeywords] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // When opening modal, load edit details if editing, else empty state
  useEffect(() => {
    if (isOpen) {
      if (editingLink) {
        const isFileItem = Boolean(editingLink.isUploadedFile || editingLink.storagePath || (editingLink.fileName && editingLink.fileSize));
        setEntryMode(isFileItem ? 'file' : 'link');

        setUrl(editingLink.url);
        setTitle(editingLink.title);
        setDescription(editingLink.description);
        setCategoryId(editingLink.categoryId || categories[0]?.id || 'cat-work');
        setColor(editingLink.color || PRESET_LINK_COLORS[0]);
        setNotes(editingLink.notes || '');
        setIsFavorite(Boolean(editingLink.isFavorite));
        setIsPinned(Boolean(editingLink.isPinned));
        setFavicon(editingLink.favicon || '');
        setImageUrl(editingLink.imageUrl || '');
        setAuthor(editingLink.author || '');
        setGrade(editingLink.grade || '');

        setSubCategoryId(editingLink.subCategoryId || '');
        setTopic(editingLink.topic || '');
        setLesson(editingLink.lesson || '');
        setResourceType((editingLink.resourceType as any) || '');
        setKeywords(editingLink.keywords || '');
        setIsHidden(Boolean(editingLink.isHidden));

        // File states
        setSelectedFile(null);
        setUploadedFileUrl(isFileItem ? editingLink.url : '');
        setUploadedFileName(editingLink.fileName || '');
        setUploadedFileSize(editingLink.fileSize);
        setUploadedStoragePath(editingLink.storagePath || '');
        setUploadProgress(0);
        setIsUploading(false);
      } else {
        // Create mode
        setEntryMode('link');
        setUrl('');
        setTitle('');
        setDescription('');
        setCategoryId(defaultCategoryId || categories[0]?.id || 'cat-work');
        setColor(PRESET_LINK_COLORS[0]);
        setNotes('');
        setIsFavorite(false);
        setIsPinned(false);
        setFavicon('');
        setImageUrl('');
        setAuthor('');
        setGrade('');

        setSubCategoryId(defaultSubCategoryId || '');
        setTopic('');
        setLesson('');
        setResourceType('');
        setKeywords('');
        setIsHidden(false);

        // File states
        setSelectedFile(null);
        setUploadedFileUrl('');
        setUploadedFileName('');
        setUploadedFileSize(undefined);
        setUploadedStoragePath('');
        setUploadProgress(0);
        setIsUploading(false);
      }
    }
  }, [isOpen, editingLink, categories, defaultCategoryId, defaultSubCategoryId]);

  // Handle local file selection from computer
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadedFileName(file.name);
    setUploadedFileSize(file.size);

    // Auto fill title if empty or default
    if (!title || title === 'Học liệu mới') {
      const cleanBaseTitle = file.name.replace(/\.[^/.]+$/, '');
      setTitle(cleanBaseTitle);
    }

    // Auto detect file type and suggest category/resource type
    const detected = detectFileType(file.name, file.type);
    if (detected === 'video') {
      setResourceType('video');
      if (!categoryId || categoryId === 'cat-work') setCategoryId('cat-video');
    } else if (detected === 'powerpoint') {
      setResourceType('lecture');
      if (!categoryId) setCategoryId('cat-work');
    } else if (detected === 'word' || detected === 'pdf' || detected === 'excel') {
      setResourceType('document');
      if (!categoryId || categoryId === 'cat-work') setCategoryId('cat-doc');
    } else if (detected === 'image') {
      if (!imageUrl) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') setImageUrl(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }

    onAddToast(`Đã chọn tệp: ${file.name} (${formatFileSize(file.size)})`, 'success');
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    setUploadedFileName('');
    setUploadedFileSize(undefined);
    setUploadedFileUrl('');
    setUploadedStoragePath('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handler when URL blur to auto-fill title
  const handleUrlBlur = () => {
    let checkedUrl = url.trim();
    if (!checkedUrl) return;

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

  // AI assistant integration handler
  const handleAiAnalyze = async () => {
    let finalUrl = url.trim();
    if (entryMode === 'file' && uploadedFileName) {
      finalUrl = uploadedFileName;
    } else if (!finalUrl) {
      onAddToast('Vui lòng nhập URL hoặc chọn tệp trước khi sử dụng trợ lý AI!', 'error');
      return;
    }

    if (entryMode === 'link') {
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
        setUrl(finalUrl);
      }
      if (!isValidUrl(finalUrl)) {
        onAddToast('Địa chỉ URL không hợp lệ!', 'error');
        return;
      }
    }

    setIsAiLoading(true);
    onAddToast('🪄 AI đang phân tích học liệu, phân lớp và đề xuất thông tin...', 'info');

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
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json().catch(() => null);
        if (data && data.success && data.analysis) {
          const analysis = data.analysis;

          if (analysis.subCategoryId) setSubCategoryId(analysis.subCategoryId);
          if (analysis.topic) setTopic(analysis.topic);
          if (analysis.lesson) setLesson(analysis.lesson);
          if (analysis.resourceType) setResourceType(analysis.resourceType);
          if (analysis.description) setDescription(analysis.description);
          if (analysis.keywords) setKeywords(analysis.keywords);
          if (analysis.imageUrl && !imageUrl) setImageUrl(analysis.imageUrl);

          onAddToast('🪄 AI đã phân tích và tự động phân loại học liệu thành công!', 'success');
          return;
        }
      }

      // Smart local heuristic fallback (works on static hosting & offline)
      const rawText = `${title} ${uploadedFileName} ${finalUrl} ${description}`.toLowerCase();
      let matchedGrade: 'tinhoc3' | 'tinhoc4' | 'tinhoc5' | '' = '';
      if (rawText.includes('lớp 3') || rawText.includes('lop 3') || rawText.includes('tin 3') || rawText.includes('th3')) {
        matchedGrade = 'tinhoc3';
      } else if (rawText.includes('lớp 4') || rawText.includes('lop 4') || rawText.includes('tin 4') || rawText.includes('th4')) {
        matchedGrade = 'tinhoc4';
      } else if (rawText.includes('lớp 5') || rawText.includes('lop 5') || rawText.includes('tin 5') || rawText.includes('th5')) {
        matchedGrade = 'tinhoc5';
      }

      if (matchedGrade) setSubCategoryId(matchedGrade);

      // Extract lesson number if present
      const lessonMatch = (title || uploadedFileName).match(/(?:Bài|Bai|Tiết|Tiet)\s*(\d+)/i);
      if (lessonMatch) {
        setLesson(`Bài ${lessonMatch[1]}`);
      }

      // Detect resource type
      const currentFileType = uploadedFileName ? detectFileType(uploadedFileName) : undefined;
      if (currentFileType === 'video' || rawText.includes('youtube') || rawText.includes('video')) {
        setResourceType('video');
      } else if (currentFileType === 'powerpoint' || rawText.includes('slide') || rawText.includes('bài giảng')) {
        setResourceType('lecture');
      } else if (currentFileType === 'pdf' || currentFileType === 'word' || rawText.includes('tài liệu')) {
        setResourceType('document');
      }

      onAddToast('🪄 Đã nhận diện thông tin và phân loại học liệu phù hợp!', 'success');
    } catch (err) {
      console.warn('AI analysis fallback warning:', err);
      onAddToast('Đã nhận diện thông tin học liệu!', 'info');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'viewer') {
      onAddToast('Bạn đang ở chế độ Người xem, chỉ Quản trị viên mới được thêm học liệu!', 'error');
      return;
    }

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      onAddToast('Vui lòng nhập tiêu đề cho học liệu!', 'error');
      return;
    }

    if (!categoryId) {
      onAddToast('Vui lòng chọn danh mục chính!', 'error');
      return;
    }

    let finalUrl = url.trim();
    let finalStoragePath = uploadedStoragePath;
    let finalFileName = uploadedFileName;
    let finalFileSize = uploadedFileSize;
    let isUploaded = entryMode === 'file';

    // If file mode and a new file is chosen, upload to server / Firebase Storage
    if (entryMode === 'file') {
      if (selectedFile) {
        setIsUploading(true);
        setUploadProgress(5);
        onAddToast('Bắt đầu tải tệp lên hệ thống...', 'info');

        try {
          const uploadRes = await uploadFileToFirebaseStorage(selectedFile, (pct) => {
            setUploadProgress(pct);
          });

          finalUrl = uploadRes.downloadUrl;
          finalStoragePath = uploadRes.storagePath;
          finalFileName = uploadRes.fileName || selectedFile.name;
          finalFileSize = uploadRes.fileSize || selectedFile.size;
          isUploaded = true;

          onAddToast('Tải lên thành công!', 'success');
        } catch (uploadError: any) {
          console.error('Lỗi upload file:', uploadError);
          setIsUploading(false);
          const errorMsg = uploadError?.message || 'Không thể tải tệp lên. Vui lòng thử lại!';
          onAddToast(`Lỗi tải tệp: ${errorMsg}`, 'error');
          return;
        } finally {
          setIsUploading(false);
        }
      } else if (uploadedFileUrl) {
        // Keeping existing file in edit mode
        finalUrl = uploadedFileUrl;
        isUploaded = true;
      } else {
        onAddToast('Vui lòng chọn tệp từ máy tính để tải lên!', 'error');
        return;
      }
    } else {
      // Link mode
      if (!finalUrl) {
        onAddToast('Vui lòng nhập đường dẫn URL!', 'error');
        return;
      }
      if (!isValidUrl(finalUrl)) {
        onAddToast('Đường dẫn URL không hợp lệ! Vui lòng kiểm tra lại.', 'error');
        return;
      }
      isUploaded = false;
    }

    const isElearningCategory =
      categoryId === 'cat-work' ||
      categories.find((c) => c.id === categoryId)?.name === 'Bài giảng E-Learning';

    const detectedFileKind = finalFileName ? detectFileType(finalFileName) : undefined;

    const payload: Partial<LinkItem> = {
      title: sanitizeInput(cleanTitle),
      url: finalUrl,
      description: sanitizeInput(description.trim()),
      categoryId,
      color,
      favicon: isUploaded ? '' : favicon || getFaviconUrl(finalUrl),
      notes: sanitizeInput(notes.trim()),
      isFavorite: Boolean(isFavorite),
      isPinned: Boolean(isPinned),
      imageUrl: imageUrl.trim() || '',
      author: sanitizeInput(author.trim()),
      grade: sanitizeInput(grade.trim()),

      // File upload specific fields
      isUploadedFile: isUploaded,
      fileName: isUploaded ? finalFileName : undefined,
      fileSize: isUploaded ? finalFileSize : undefined,
      fileSizeFormatted: isUploaded && finalFileSize ? formatFileSize(finalFileSize) : undefined,
      fileType: isUploaded ? detectedFileKind : undefined,
      storagePath: isUploaded ? finalStoragePath : undefined,

      // Subcategory fields for Tin học 3/4/5
      subCategoryId: isElearningCategory ? (subCategoryId as any) || '' : '',
      topic: isElearningCategory ? sanitizeInput(topic.trim()) : '',
      lesson: isElearningCategory ? sanitizeInput(lesson.trim()) : '',
      resourceType: (resourceType as any) || (isUploaded && detectedFileKind === 'video' ? 'video' : ''),
      keywords: sanitizeInput(keywords.trim()),
      isHidden: isElearningCategory ? Boolean(isHidden) : false,
    };

    onSave(payload);
    onClose();
  };

  const currentFileType = (uploadedFileName ? detectFileType(uploadedFileName) : undefined);
  const badgeInfo = getFileTypeBadgeInfo(currentFileType);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
            id="add-edit-modal-backdrop"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl p-6 overflow-hidden max-h-[92vh] flex flex-col z-10 border border-zinc-200 dark:border-zinc-800 shadow-2xl"
            id="add-edit-modal-container"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  {entryMode === 'file' ? (
                    <FolderOpen className="w-5 h-5" />
                  ) : favicon ? (
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
                    {editingLink ? 'Chỉnh sửa học liệu' : 'Thêm học liệu mới'}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Kho học liệu số Tin học • Lưu trữ liên kết và tài liệu trực tiếp
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                id="add-edit-modal-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SELECTOR: LINK vs FILE UPLOAD */}
            <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/70 rounded-2xl mb-4 shrink-0 border border-zinc-200/60 dark:border-zinc-700/60">
              <button
                type="button"
                onClick={() => setEntryMode('link')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  entryMode === 'link'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
                id="tab-mode-link"
              >
                <LinkIcon className="w-4 h-4" />
                🔗 Thêm bằng liên kết (URL)
              </button>

              <button
                type="button"
                onClick={() => setEntryMode('file')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  entryMode === 'file'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
                id="tab-mode-file"
              >
                <Upload className="w-4 h-4" />
                📁 Tải tệp từ máy tính
              </button>
            </div>

            {/* Form Scrollable container */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4" id="add-edit-modal-form">
              {/* MODE 1: URL LINK INPUT */}
              {entryMode === 'link' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Đường dẫn liên kết (URL) <span className="text-red-500">*</span>
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
                        className="w-full pl-9 pr-3 h-10 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder-zinc-400"
                        id="input-url"
                        required={entryMode === 'link'}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAiAnalyze}
                      disabled={isAiLoading}
                      className="flex items-center gap-1.5 px-3 h-10 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:from-zinc-400 disabled:to-zinc-500 text-white rounded-xl text-xs font-bold shadow hover:shadow-md transition-all shrink-0 cursor-pointer border border-transparent"
                      title="Trí tuệ nhân tạo (AI) tự động phân loại, sinh mô tả và đề xuất thông tin học liệu"
                      id="btn-ai-analyze"
                    >
                      <Sparkles className={`w-3.5 h-3.5 text-white ${isAiLoading ? 'animate-spin' : 'animate-pulse'}`} />
                      {isAiLoading ? 'Đang đọc...' : 'AI Phân Tích 🪄'}
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 2: FILE UPLOAD ZONE */}
              {entryMode === 'file' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Tệp học liệu từ máy tính <span className="text-red-500">*</span>
                  </label>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.pps,.ppsx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mp3,.wav,.zip,.rar"
                    className="hidden"
                    id="file-upload-input"
                  />

                  {/* If file already selected or editing existing uploaded file */}
                  {(selectedFile || uploadedFileName) ? (
                    <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-3xl">{badgeInfo.emoji}</span>
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeInfo.color}`}>
                                {badgeInfo.badge}
                              </span>
                              <span className="text-xs text-zinc-500 font-mono">
                                {formatFileSize(selectedFile?.size || uploadedFileSize)}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate mt-0.5" title={uploadedFileName}>
                              {uploadedFileName}
                            </p>
                          </div>
                        </div>

                        {/* File Action Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/40 rounded-xl hover:bg-blue-200 transition-colors cursor-pointer"
                            id="btn-reselect-file"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Chọn lại tệp
                          </button>
                          <button
                            type="button"
                            onClick={handleClearSelectedFile}
                            className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                            title="Xóa tệp"
                            id="btn-remove-selected-file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Upload Progress Bar */}
                      {isUploading && (
                        <div className="pt-2 border-t border-blue-200/50 dark:border-blue-900/30">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Đang tải tệp lên hệ thống...
                            </span>
                            <span className="font-bold font-mono text-blue-600 dark:text-blue-400">{uploadProgress}%</span>
                          </div>
                          <div className="w-full h-2 bg-blue-100 dark:bg-blue-950 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-200 ease-out"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* AI auto suggest helper button */}
                      {!isUploading && (
                        <div className="flex items-center justify-between pt-2 border-t border-blue-200/50 dark:border-blue-900/30 text-xs text-zinc-500">
                          <span>Đã nhận diện: <strong>{badgeInfo.label}</strong></span>
                          <button
                            type="button"
                            onClick={handleAiAnalyze}
                            disabled={isAiLoading}
                            className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            AI gợi ý bài học từ tên tệp
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Drag & Drop / Click to Upload Box */
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-blue-300 dark:border-blue-800/80 hover:border-blue-500 bg-blue-50/40 dark:bg-blue-950/10 hover:bg-blue-50/70 p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                      id="upload-dropzone"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-1">
                        + Chọn tệp từ máy tính
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 max-w-sm">
                        Hỗ trợ tài liệu PDF, Word (.docx), PowerPoint (.pptx), Excel, Video (.mp4), Âm thanh (.mp3), Hình ảnh, Zip
                      </p>

                      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                        <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300">📄 PDF</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">📝 Word</span>
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300">📊 PowerPoint</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">📈 Excel</span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">🎬 Video</span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">🎵 Audio</span>
                      </div>
                    </div>
                  )}

                  {/* Upload Progress Bar */}
                  {isUploading && (
                    <div className="mt-3 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <span className="text-blue-600">Đang tải tệp lên đám mây...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Tiêu đề học liệu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề học liệu (Ví dụ: Bài giảng Tin học 3 - Làm quen với máy tính)"
                  className="w-full px-3 h-10 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder-zinc-400"
                  id="input-title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Mô tả ngắn
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả tóm tắt nội dung học liệu cho giáo viên và học sinh..."
                  className="w-full px-3 h-10 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder-zinc-400"
                  id="input-description"
                />
              </div>

              {/* Author & Grade Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Tác giả / Giáo viên biên soạn
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Ví dụ: Thầy Nguyễn Văn A"
                      className="w-full pl-9 pr-3 h-10 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder-zinc-400"
                      id="input-author"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Khối lớp áp dụng
                  </label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="Ví dụ: Lớp 3, Lớp 4, Lớp 5..."
                    className="w-full px-3 h-10 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder-zinc-400"
                    id="input-grade"
                  />
                </div>
              </div>

              {/* Category & Color row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Danh mục chính <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      setCategoryId(newCatId);
                      const matchingCat = categories.find((c) => c.id === newCatId);
                      if (matchingCat && !editingLink) {
                        setColor(matchingCat.color);
                      }
                    }}
                    className="w-full px-3 h-10 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    id="select-category"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-slate-100">
                        {cat.icon || (
                          cat.id === 'cat-work' ? '📘' :
                          cat.id === 'cat-tech' ? '💻' :
                          cat.id === 'cat-ai' ? '🤖' :
                          cat.id === 'cat-video' ? '🎬' :
                          cat.id === 'cat-web' ? '🌐' :
                          cat.id === 'cat-doc' ? '📄' :
                          cat.id === 'cat-game' ? '🎮' : '📁'
                        )} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2.5 uppercase tracking-wider">
                    Màu nhãn phân loại
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

              {/* Cover Image URL / Uploader */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Hình ảnh bìa học liệu (Tùy chọn)
                </label>
                <div className="flex items-center gap-4">
                  {imageUrl ? (
                    <div className="relative w-20 h-16 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-950 shrink-0 shadow-sm group">
                      <img src={imageUrl} alt="Bìa học liệu" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                    <div className="w-20 h-16 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-center text-zinc-400 text-xs shrink-0 select-none">
                      Không ảnh
                    </div>
                  )}

                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Dán URL ảnh bìa minh họa..."
                      className="w-full px-3 h-9 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/20 placeholder-zinc-400"
                      id="input-image-url"
                    />

                    <label
                      htmlFor="upload-link-image"
                      className="flex items-center justify-center gap-2 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-zinc-800 rounded-xl px-4 h-9 cursor-pointer transition-all text-xs font-semibold text-zinc-600 dark:text-zinc-300 shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-500" />
                      Tải ảnh bìa từ máy tính...
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

              {/* COLLAPSIBLE SPECIAL E-LEARNING SUB-FOLDER FIELDS */}
              {(categoryId === 'cat-work' || categories.find((c) => c.id === categoryId)?.name === 'Bài giảng E-Learning') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-indigo-50/60 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-4"
                  id="tin-hoc-subfields-container"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 border-b border-indigo-150/40 pb-2">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <span>CẤU HÌNH THƯ MỤC CON & HỌC LIỆU E-LEARNING</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Sub-Category Folder Selector */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Thư mục con (Phân lớp) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={subCategoryId}
                        onChange={(e) => setSubCategoryId(e.target.value as any)}
                        className="w-full px-3 h-10 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Loại học liệu
                      </label>
                      <select
                        value={resourceType}
                        onChange={(e) => setResourceType(e.target.value as any)}
                        className="w-full px-3 h-10 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        id="select-resourcetype"
                      >
                        <option value="">-- Chọn Loại Học Liệu --</option>
                        <option value="video">🎥 Video bài học</option>
                        <option value="lecture">📖 Bài giảng điện tử</option>
                        <option value="document">📄 Tài liệu / Giáo án</option>
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
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Chủ đề (Topic)
                      </label>
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Ví dụ: Làm quen với Scratch, Soạn thảo văn bản"
                        className="w-full px-3 h-10 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-zinc-400"
                        id="input-topic"
                      />
                    </div>

                    {/* Lesson Name */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Bài học (Lesson)
                      </label>
                      <input
                        type="text"
                        value={lesson}
                        onChange={(e) => setLesson(e.target.value)}
                        placeholder="Ví dụ: Bài 1: Thông tin và Quyết định"
                        className="w-full px-3 h-10 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-zinc-400"
                        id="input-lesson"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Keywords tags */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Từ khóa (Phân cách bằng dấu phẩy)
                      </label>
                      <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="Ví dụ: scratch, tin học 3, lap trinh"
                        className="w-full px-3 h-10 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-zinc-400"
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
                          <span className="block text-zinc-450 dark:text-zinc-500 text-[10px]">Chỉ Quản trị viên mới nhìn thấy học liệu này.</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Ghi chú giáo viên (Markdown được hỗ trợ)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhập ghi chú cá nhân, câu hỏi thảo luận, hướng dẫn học sinh..."
                  rows={3}
                  className="w-full p-3 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder-zinc-400 resize-none"
                  id="textarea-notes"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isUploading}
                  className="px-4 h-10 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
                  id="btn-modal-cancel"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center gap-2 px-6 h-10 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                  id="btn-modal-save"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Đang tải lên ({uploadProgress}%)...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {editingLink ? 'Lưu cập nhật' : 'Lưu học liệu'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
