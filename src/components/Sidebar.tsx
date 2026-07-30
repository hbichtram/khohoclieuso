import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Layers,
  Star,
  Pin,
  ListFilter,
  Grid,
  List,
  Sun,
  Moon,
  Plus,
  Settings as SettingsIcon,
  Download,
  Upload,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Folder,
  Database,
  BarChart,
  Grid3X3,
  LogOut,
  ShieldCheck,
  Camera,
  User,
} from 'lucide-react';
import { Category, Settings, THEME_COLORS } from '../types';

interface SidebarProps {
  role: 'admin' | 'viewer';
  categories: Category[];
  activeCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  activeSubCategoryId: 'tinhoc3' | 'tinhoc4' | 'tinhoc5' | null;
  onSelectSubCategory: (id: 'tinhoc3' | 'tinhoc4' | 'tinhoc5' | null) => void;
  activeFilter: 'all' | 'favorites' | 'pinned' | 'dashboard';
  onChangeFilter: (filter: 'all' | 'favorites' | 'pinned' | 'dashboard') => void;
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
  onOpenCategoryManager: () => void;
  onTriggerImport: () => void;
  onTriggerExportJSON: () => void;
  onTriggerExportCSV: () => void;
  linksCountByCategory: Record<string, number>;
  tinhoc3Count?: number;
  tinhoc4Count?: number;
  tinhoc5Count?: number;
  totalLinksCount: number;
  user: any;
  onLogout: () => void;
  avatarUrl?: string | null;
  onOpenAvatarModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  categories,
  activeCategoryId,
  onSelectCategory,
  activeSubCategoryId,
  onSelectSubCategory,
  activeFilter,
  onChangeFilter,
  settings,
  onUpdateSettings,
  onOpenCategoryManager,
  onTriggerImport,
  onTriggerExportJSON,
  onTriggerExportCSV,
  linksCountByCategory,
  tinhoc3Count = 0,
  tinhoc4Count = 0,
  tinhoc5Count = 0,
  totalLinksCount,
  user,
  onLogout,
  avatarUrl,
  onOpenAvatarModal,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isElearningExpanded, setIsElearningExpanded] = useState(true);
  const [showConfig, setShowConfig] = useState(false);

  const isAdmin = role === 'admin';

  const toggleTheme = () => {
    onUpdateSettings({
      ...settings,
      theme: settings.theme === 'light' ? 'dark' : 'light',
    });
  };

  const selectPrimaryColor = (colorHex: string) => {
    onUpdateSettings({
      ...settings,
      primaryColor: colorHex,
    });
  };

  const toggleLayout = () => {
    onUpdateSettings({
      ...settings,
      layout: settings.layout === 'grid' ? 'list' : 'grid',
    });
  };

  const toggleAnimations = () => {
    onUpdateSettings({
      ...settings,
      animationsEnabled: !settings.animationsEnabled,
    });
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 76 : 280 }}
      transition={{ duration: settings.animationsEnabled ? 0.3 : 0 }}
      className={`h-screen glass-sidebar flex flex-col relative shrink-0 z-20 ${
        isCollapsed ? 'items-center' : ''
      }`}
      id="app-sidebar"
    >
      {/* Sidebar Header Title */}
      <div className="h-16 flex items-center justify-between px-4 w-full border-b border-white/10 dark:border-white/5 overflow-hidden">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div
              style={{ backgroundColor: settings.primaryColor, boxShadow: `0 4px 12px ${settings.primaryColor}30` }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
            >
              <Database className="w-4.5 h-4.5" />
            </div>
            <span className="font-extrabold text-xs tracking-wider" style={{ color: settings.primaryColor }}>
              LINK MANAGER
            </span>
          </div>
        )}
        {isCollapsed && (
          <div
            style={{ backgroundColor: settings.primaryColor, boxShadow: `0 4px 12px ${settings.primaryColor}30` }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white mx-auto shadow-md"
          >
            <Database className="w-4.5 h-4.5" />
          </div>
        )}

        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg border border-white/10 dark:border-white/5 text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-150 hover:bg-white/10 dark:hover:bg-white/5 transition-colors cursor-pointer hidden md:block shrink-0"
          title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          id="btn-toggle-sidebar"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 w-full">
        {/* Teacher Profile & Avatar Section (Placed right below LOGO) */}
        {!isCollapsed ? (
          <div className="px-1 mb-2">
            <div className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-white/20 dark:bg-black/25 border border-white/10 dark:border-white/5 relative group transition-all duration-300 hover:shadow-md">
              {/* Circular Avatar 80-90px */}
              <div
                onClick={isAdmin ? onOpenAvatarModal : undefined}
                className={`relative w-20 h-20 rounded-full p-1 border-2 border-white/60 dark:border-white/10 shadow-md bg-white/40 dark:bg-zinc-800/60 overflow-hidden mb-2 ${
                  isAdmin
                    ? 'hover:border-blue-500/60 transition-all duration-300 cursor-pointer group/avatar'
                    : 'cursor-default'
                }`}
                title={isAdmin ? 'Nhấp để đổi hoặc xóa ảnh đại diện' : 'Ảnh đại diện giáo viên'}
                id="sidebar-teacher-avatar"
              >
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Giáo viên Hồng Bích Trâm"
                      className={`w-full h-full object-cover rounded-full ${
                        isAdmin ? 'transition-transform duration-300 group-hover/avatar:scale-105' : ''
                      }`}
                    />
                  ) : user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Giáo viên'}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover rounded-full ${
                        isAdmin ? 'transition-transform duration-300 group-hover/avatar:scale-105' : ''
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Hover Camera Overlay - ONLY FOR ADMIN */}
                {isAdmin && (
                  <div className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] font-bold">Đổi ảnh</span>
                  </div>
                )}
              </div>

              {/* Teacher info */}
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-zinc-850 dark:text-zinc-100">
                  Hồng Bích Trâm
                </p>
                <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                  Giáo viên Tin học
                </p>
              </div>

              {/* Action Button - ONLY FOR ADMIN */}
              {isAdmin && (
                <button
                  onClick={onOpenAvatarModal}
                  className="mt-2 px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-blue-500/20"
                  id="btn-edit-teacher-avatar"
                >
                  <Camera className="w-3 h-3" />
                  <span>Đổi ảnh đại diện</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="px-1 mb-2 flex items-center justify-center">
            <div
              onClick={isAdmin ? onOpenAvatarModal : undefined}
              className={`w-10 h-10 rounded-full border-2 border-white/40 dark:border-white/10 shadow-sm overflow-hidden relative flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 ${
                isAdmin ? 'hover:border-blue-500/60 cursor-pointer group' : 'cursor-default'
              }`}
              title={isAdmin ? 'Ảnh đại diện - Bấm để thay đổi' : 'Ảnh đại diện giáo viên'}
              id="sidebar-teacher-avatar-collapsed"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-zinc-400" />
              )}
            </div>
          </div>
        )}

        {/* Administrator / User profile card */}
        {user && (
          <div className="px-1 mb-4">
            <div className={`p-3.5 rounded-xl border border-white/10 dark:border-white/5 bg-white/20 dark:bg-black/20 ${isCollapsed ? 'flex flex-col items-center justify-center gap-2' : 'space-y-3'}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                {!isCollapsed && (
                  <div className="overflow-hidden min-w-0">
                    <p className="text-xs font-bold truncate text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                      {user.displayName || 'Quản trị viên'}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{user.email}</p>
                  </div>
                )}
              </div>
              
              {!isCollapsed ? (
                <div className="flex items-center justify-between pt-1.5 border-t border-white/10 dark:border-white/5">
                  <span className="text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Quản trị viên
                  </span>
                  <button 
                    onClick={onLogout}
                    className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    id="btn-sidebar-logout"
                  >
                    <LogOut className="w-3 h-3" />
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <button 
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                  title="Đăng xuất"
                  id="btn-sidebar-logout-collapsed"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Core Sections */}
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 mb-2">
              Bộ điều hướng
            </p>
          )}

          {/* Dashboard view */}
          <button
            onClick={() => {
              onChangeFilter('dashboard');
              onSelectCategory(null);
            }}
            style={activeFilter === 'dashboard' ? { backgroundColor: settings.primaryColor, boxShadow: `0 4px 12px ${settings.primaryColor}25` } : undefined}
            className={`w-full flex items-center justify-between px-3 h-10 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'dashboard'
                ? 'text-white'
                : 'text-zinc-650 dark:text-zinc-350 hover:bg-white/10 dark:hover:bg-white/5'
            }`}
            title="Thống kê Dashboard"
            id="nav-btn-dashboard"
          >
            <div className="flex items-center gap-3">
              <BarChart className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Bảng thống kê</span>}
            </div>
          </button>

          {/* All Links */}
          <button
            onClick={() => {
              onChangeFilter('all');
              onSelectCategory(null);
            }}
            style={activeFilter === 'all' && activeCategoryId === null ? { backgroundColor: `${settings.primaryColor}20`, borderColor: `${settings.primaryColor}30`, borderWidth: 1 } : undefined}
            className={`w-full flex items-center justify-between px-3 h-10 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'all' && activeCategoryId === null
                ? 'text-[var(--primary-accent)] font-bold'
                : 'text-zinc-650 dark:text-zinc-350 hover:bg-white/10 dark:hover:bg-white/5'
            }`}
            title="Tất cả liên kết"
            id="nav-btn-all"
          >
            <div className="flex items-center gap-3">
              <Grid3X3 className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Tất cả liên kết</span>}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-bold bg-white/20 dark:bg-black/20 text-zinc-650 dark:text-zinc-350 px-1.5 py-0.5 rounded-full border border-white/10">
                {totalLinksCount}
              </span>
            )}
          </button>
        </div>

        {/* Categories List Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-2">
            {!isCollapsed ? (
              <>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Danh mục
                </p>
                <button
                  onClick={onOpenCategoryManager}
                  className="p-1 rounded text-blue-500 hover:bg-blue-500/10 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Quản lý danh mục"
                  id="btn-manage-categories-sidebar"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Quản lý
                </button>
              </>
            ) : (
              <button
                onClick={onOpenCategoryManager}
                className="mx-auto p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-white/10 dark:hover:bg-white/5 cursor-pointer"
                title="Quản lý danh mục"
                id="btn-manage-categories-sidebar-collapsed"
              >
                <Layers className="w-4.5 h-4.5" />
              </button>
            )}
          </div>

          <div className="space-y-0.5">
            {categories.map((cat) => {
              const count = linksCountByCategory[cat.id] || 0;
              const isSelected = activeCategoryId === cat.id && activeFilter === 'all';
              const isElearning = cat.id === 'cat-work' || cat.name === 'Bài giảng E-Learning';
              
              return (
                <div key={cat.id} className="space-y-1">
                  <button
                    onClick={() => {
                      onChangeFilter('all');
                      onSelectCategory(cat.id);
                      onSelectSubCategory(null); // Reset subcategory when category is clicked
                      if (isElearning && !isElearningExpanded) {
                        setIsElearningExpanded(true);
                      }
                    }}
                    style={isSelected ? { backgroundColor: `${settings.primaryColor}20`, borderColor: `${settings.primaryColor}30`, borderWidth: 1 } : undefined}
                    className={`w-full flex items-center justify-between px-3 h-9 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'text-[var(--primary-accent)] font-bold'
                        : 'text-zinc-650 dark:text-zinc-350 hover:bg-white/10 dark:hover:bg-white/5'
                    }`}
                    title={cat.name}
                    id={`sidebar-cat-btn-${cat.id}`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {isElearning && !isCollapsed && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsElearningExpanded(!isElearningExpanded);
                          }}
                          className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-zinc-400 cursor-pointer shrink-0"
                          title={isElearningExpanded ? "Thu gọn" : "Mở rộng"}
                        >
                          {isElearningExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </span>
                      )}
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      {!isCollapsed && <span className="truncate">{cat.name}</span>}
                    </div>
                    {!isCollapsed && (
                      <span className="text-[10px] font-semibold text-zinc-450 dark:text-zinc-400 bg-white/20 dark:bg-black/20 px-1.5 py-0.5 rounded-full border border-white/10">
                        {count}
                      </span>
                    )}
                  </button>

                  {/* Nested grade level subfolders for Bài giảng E-Learning */}
                  {isElearning && isElearningExpanded && !isCollapsed && (
                    <div className="pl-6 pr-1 py-1 space-y-1 border-l border-zinc-200 dark:border-zinc-800 ml-4 animate-fade-in">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeFilter('all');
                          onSelectCategory(cat.id);
                          onSelectSubCategory('tinhoc3');
                        }}
                        className={`w-full flex items-center justify-between px-2 h-8 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          activeSubCategoryId === 'tinhoc3'
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold'
                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                        }`}
                        id="sidebar-sub-btn-tinhoc3"
                      >
                        <span className="truncate flex items-center gap-1.5">📂 Tin học 3</span>
                        <span className="text-[10px] font-semibold text-zinc-450 dark:text-zinc-400 bg-white/20 dark:bg-black/20 px-1.5 py-0.5 rounded-full border border-white/10">
                          {tinhoc3Count}
                        </span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeFilter('all');
                          onSelectCategory(cat.id);
                          onSelectSubCategory('tinhoc4');
                        }}
                        className={`w-full flex items-center justify-between px-2 h-8 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          activeSubCategoryId === 'tinhoc4'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold'
                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                        }`}
                        id="sidebar-sub-btn-tinhoc4"
                      >
                        <span className="truncate flex items-center gap-1.5">📂 Tin học 4</span>
                        <span className="text-[10px] font-semibold text-zinc-450 dark:text-zinc-400 bg-white/20 dark:bg-black/20 px-1.5 py-0.5 rounded-full border border-white/10">
                          {tinhoc4Count}
                        </span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeFilter('all');
                          onSelectCategory(cat.id);
                          onSelectSubCategory('tinhoc5');
                        }}
                        className={`w-full flex items-center justify-between px-2 h-8 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          activeSubCategoryId === 'tinhoc5'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold'
                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                        }`}
                        id="sidebar-sub-btn-tinhoc5"
                      >
                        <span className="truncate flex items-center gap-1.5">📂 Tin học 5</span>
                        <span className="text-[10px] font-semibold text-zinc-450 dark:text-zinc-400 bg-white/20 dark:bg-black/20 px-1.5 py-0.5 rounded-full border border-white/10">
                          {tinhoc5Count}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Backup / CSV Options */}
        <div className="space-y-1 pt-3 border-t border-white/10 dark:border-white/5">
          {!isCollapsed && (
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 mb-2">
              Dữ liệu sao lưu
            </p>
          )}

          {/* Export JSON */}
          <button
            onClick={onTriggerExportJSON}
            className="w-full flex items-center gap-3 px-3 h-9 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-white/10 dark:hover:bg-white/5 cursor-pointer"
            title="Xuất JSON Backup"
            id="btn-export-json"
          >
            <Download className="w-4 h-4 text-blue-500 shrink-0" />
            {!isCollapsed && <span>Xuất Sao lưu (JSON)</span>}
          </button>

          {/* Export CSV */}
          <button
            onClick={onTriggerExportCSV}
            className="w-full flex items-center gap-3 px-3 h-9 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-white/10 dark:hover:bg-white/5 cursor-pointer"
            title="Xuất bảng Excel (CSV)"
            id="btn-export-csv"
          >
            <Download className="w-4 h-4 text-emerald-500 shrink-0" />
            {!isCollapsed && <span>Xuất dữ liệu (CSV)</span>}
          </button>

          {/* Import JSON */}
          {role === 'admin' && (
            <button
              onClick={onTriggerImport}
              className="w-full flex items-center gap-3 px-3 h-9 rounded-xl text-xs font-semibold text-zinc-650 dark:text-zinc-400 hover:bg-white/10 dark:hover:bg-white/5 cursor-pointer"
              title="Nhập lại từ JSON"
              id="btn-import-json"
            >
              <Upload className="w-4 h-4 text-purple-500 shrink-0" />
              {!isCollapsed && <span>Nhập Sao lưu (JSON)</span>}
            </button>
          )}
        </div>
      </div>

      {/* Sidebar Footer Controls & Settings Panel */}
      <div className="p-3 border-t border-white/10 dark:border-white/5 bg-white/10 dark:bg-black/10 w-full shrink-0">
        {showConfig && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-3 rounded-xl mb-3 space-y-3.5 shadow-lg"
            id="sidebar-config-dropdown"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500">Màu chủ đạo</span>
              <span
                className="w-3 h-3 rounded-full shadow-sm border border-white/20"
                style={{ backgroundColor: settings.primaryColor }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {THEME_COLORS.map((col) => (
                <button
                  key={col.hex}
                  onClick={() => selectPrimaryColor(col.hex)}
                  className="w-5.5 h-5.5 rounded-full border border-black/10 transition-transform hover:scale-110 cursor-pointer shadow-sm"
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                  id={`btn-accent-color-${col.hex.replace('#', '')}`}
                />
              ))}
            </div>

            <div className="h-px bg-white/10 dark:bg-white/5" />

            <div className="space-y-2">
              {/* Layout Switcher */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500">Kiểu hiển thị</span>
                <button
                  onClick={toggleLayout}
                  className="p-1 rounded bg-white/20 dark:bg-black/20 hover:bg-white/30 text-zinc-650 dark:text-zinc-300 flex items-center gap-1 cursor-pointer border border-white/10"
                  id="btn-toggle-layout"
                >
                  {settings.layout === 'grid' ? (
                    <Grid className="w-3.5 h-3.5" />
                  ) : (
                    <List className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[9px] uppercase font-bold">
                    {settings.layout === 'grid' ? 'Lưới' : 'Danh sách'}
                  </span>
                </button>
              </div>

              {/* Animations Switcher */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500">Hiệu ứng</span>
                <button
                  onClick={toggleAnimations}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors cursor-pointer border ${
                    settings.animationsEnabled
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-white/10 dark:bg-black/20 text-zinc-500 border-white/10'
                  }`}
                  id="btn-toggle-animations"
                >
                  {settings.animationsEnabled ? 'BẬT' : 'TẮT'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between gap-1.5">
          {/* Quick theme toggler */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-100 hover:bg-white/10 dark:hover:bg-white/5 transition-colors cursor-pointer flex-1 flex items-center justify-center border border-white/10 dark:border-white/5"
            title={settings.theme === 'light' ? 'Chế độ Tối' : 'Chế độ Sáng'}
            id="btn-toggle-theme"
          >
            {settings.theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Config expander */}
          {!isCollapsed && (
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`p-2 rounded-xl border transition-colors flex-1 flex items-center justify-center gap-1.5 cursor-pointer ${
                showConfig
                  ? 'bg-white/20 dark:bg-white/10 text-[var(--primary-accent)] border-[var(--primary-accent)]/35 shadow-sm font-bold'
                  : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-100 hover:bg-white/10 dark:hover:bg-white/5 border-white/10 dark:border-white/5'
              }`}
              title="Cài đặt giao diện"
              id="btn-toggle-config-panel"
            >
              <SettingsIcon className="w-4 h-4" />
              <span className="text-xs font-semibold">Cài đặt</span>
            </button>
          )}
        </div>

        {/* Author Credit */}
        {!isCollapsed && (
          <div className="mt-3 pt-2.5 border-t border-white/10 dark:border-white/5 flex items-center justify-between text-[10px] tracking-wide text-zinc-400 dark:text-zinc-500 px-1 font-medium select-none">
            <span>Tác giả:</span>
            <span className="font-bold text-[11px] text-zinc-650 dark:text-zinc-350 bg-white/20 dark:bg-black/20 px-2 py-0.5 rounded-full border border-white/10">
              Hồng Bích Trâm
            </span>
          </div>
        )}
      </div>
    </motion.aside>
  );
};
