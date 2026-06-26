import React, { useState, useEffect } from "react";
import { Book } from "../types";
import { getGoogleDriveDirectLink, isValidUrl } from "../utils/driveParser";
import { cacheBookBlob, removeCachedBookBlob, getCachedBookBlob } from "../utils/indexedDB";
import { 
  Plus, 
  BookOpen, 
  Trash2, 
  Upload, 
  HelpCircle, 
  Database, 
  AlertCircle, 
  FileCheck,
  Compass,
  Cpu,
  Bookmark,
  Edit,
  Lock,
  Unlock,
  LogOut,
  UserCheck,
  ShieldAlert
} from "lucide-react";

interface LibraryShelfProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onAddBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  onUpdateBook: (updatedBook: Book) => void;
  onOpenSupabaseSchema: () => void;
  isAdmin: boolean;
  onAdminLogin: (password: string) => boolean;
  onAdminLogout: () => void;
  adminPassword?: string;
}

export default function LibraryShelf({
  books,
  onSelectBook,
  onAddBook,
  onDeleteBook,
  onUpdateBook,
  onOpenSupabaseSchema,
  isAdmin,
  onAdminLogin,
  onAdminLogout,
  adminPassword
}: LibraryShelfProps) {
  // Admin password prompting flow
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // States for adding custom Google Drive links
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newAuthor, setNewAuthor] = useState<string>("");
  const [newUrl, setNewUrl] = useState<string>("");
  const [newDesc, setNewDesc] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("general");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States for uploading local files (Stored in IndexedDB)
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>("");
  const [uploadAuthor, setUploadAuthor] = useState<string>("");
  const [uploadDesc, setUploadDesc] = useState<string>("");
  const [uploadCategory, setUploadCategory] = useState<string>("general");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // States for editing book details
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editAuthor, setEditAuthor] = useState<string>("");
  const [editUrl, setEditUrl] = useState<string>("");
  const [editDesc, setEditDesc] = useState<string>("");
  const [editCategory, setEditCategory] = useState<string>("general");

  // Filter tab state
  const [activeTab, setActiveTab] = useState<string>("all");

  // Help tips toggler
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Form submission handler for Google Drive Link
  const handleAddDriveBook = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newTitle.trim() || !newAuthor.trim() || !newUrl.trim()) {
      setErrorMsg("الرجاء ملء حقول العنوان، الكاتب، ورابط المجلد بشكل صحيح.");
      return;
    }

    if (!isValidUrl(newUrl)) {
      setErrorMsg("رابط المجلد المدخل غير صالح. تأكد من إدخال الرابط بالكامل.");
      return;
    }

    // Convert to direct Google Drive Link
    const parsedDirectUrl = getGoogleDriveDirectLink(newUrl);

    const customBook: Book = {
      id: "drive_" + Math.random().toString(36).substr(2, 9),
      title: newTitle.trim(),
      author: newAuthor.trim(),
      description: newDesc.trim() || "كتاب تم إضافته عبر رابط Google Drive المباشر.",
      pdfUrl: parsedDirectUrl,
      coverUrl: "", // Generate abstract traditional cover dynamically
      isCustom: true,
      addedAt: Date.now(),
      category: newCategory
    };

    onAddBook(customBook);
    
    // Clear state
    setNewTitle("");
    setNewAuthor("");
    setNewUrl("");
    setNewDesc("");
    setNewCategory("general");
    setShowAddModal(false);
  };

  // Form submission handler for local file upload to IndexedDB
  const handleLocalFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!uploadTitle.trim() || !uploadAuthor.trim() || !uploadFile) {
      setErrorMsg("الرجاء تحديد ملف PDF وكتابة العنوان والكاتب.");
      return;
    }

    if (uploadFile.type !== "application/pdf" && !uploadFile.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("الملف المحدد ليس ملف PDF صالح. يرجى اختيار ملف PDF فقط.");
      return;
    }

    try {
      setIsUploading(true);
      const bookId = "local_" + Math.random().toString(36).substr(2, 9);
      
      // Cache file blob in IndexedDB
      await cacheBookBlob(bookId, uploadFile);

      // Create local object URL for preview (or standard fallback)
      const blobUrl = URL.createObjectURL(uploadFile);

      // Helper to convert bytes to human-readable size
      const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
      };

      const localBook: Book = {
        id: bookId,
        title: uploadTitle.trim(),
        author: uploadAuthor.trim(),
        description: uploadDesc.trim() || "ملف كتاب محلي تم رفعه وحفظه في ذاكرة المتصفح.",
        pdfUrl: blobUrl,
        coverUrl: "",
        isCustom: true,
        addedAt: Date.now(),
        category: uploadCategory,
        fileSize: formatBytes(uploadFile.size)
      };

      onAddBook(localBook);

      // Reset
      setUploadTitle("");
      setUploadAuthor("");
      setUploadDesc("");
      setUploadCategory("general");
      setUploadFile(null);
      setShowUploadModal(false);
    } catch (err: any) {
      console.error("Local file cache error:", err);
      setErrorMsg(`حدث خطأ أثناء حفظ الملف محلياً: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Helper to run action if admin, otherwise open admin password prompt first
  const runAdminProtectedAction = (action: () => void) => {
    if (isAdmin) {
      action();
    } else {
      setPendingAction(() => action);
      setShowLoginModal(true);
      setLoginPassword("");
      setLoginError(null);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onAdminLogin(loginPassword);
    if (success) {
      setShowLoginModal(false);
      setLoginError(null);
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } else {
      setLoginError("رمز مرور المشرف غير صحيح. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleOpenEditModal = (e: React.MouseEvent, book: Book) => {
    e.stopPropagation();
    runAdminProtectedAction(() => {
      setEditingBook(book);
      setEditTitle(book.title);
      setEditAuthor(book.author);
      
      // Map internal proxy URL back to clean Google Drive URL for elegant presentation
      let displayUrl = book.pdfUrl;
      if (displayUrl.startsWith("/api/proxy-pdf?id=")) {
        const fileId = displayUrl.split("?id=")[1];
        if (fileId) {
          displayUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
        }
      }
      setEditUrl(displayUrl);
      
      setEditDesc(book.description || "");
      setEditCategory(book.category || "general");
      setShowEditModal(true);
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!editingBook) return;
    if (!editTitle.trim() || !editAuthor.trim() || !editUrl.trim()) {
      setErrorMsg("الرجاء ملء حقول العنوان، الكاتب، ورابط المجلد بشكل صحيح.");
      return;
    }

    if (!isValidUrl(editUrl)) {
      setErrorMsg("الرجاء إدخال رابط قوقل درايف أو رابط ويب صحيح ومباشر لملف الـ PDF.");
      return;
    }

    const parsedDirectUrl = getGoogleDriveDirectLink(editUrl);

    const updatedBook: Book = {
      ...editingBook,
      title: editTitle.trim(),
      author: editAuthor.trim(),
      pdfUrl: parsedDirectUrl,
      description: editDesc.trim(),
      category: editCategory
    };

    onUpdateBook(updatedBook);
    
    // reset states
    setShowEditModal(false);
    setEditingBook(null);
    setEditTitle("");
    setEditAuthor("");
    setEditUrl("");
    setEditDesc("");
    setEditCategory("general");
    setErrorMsg(null);
  };

  // Dynamic aesthetic generator for abstract book cover colors representing Sudanese Earth tones
  const getTraditionalCoverColors = (title: string, id: string) => {
    // Generate simple seed based on characters
    const val = (title.length + id.charCodeAt(id.length - 1 || 0)) % 4;
    
    // Warm Sudanese traditional color palettes
    const palettes = [
      {
        bg: "bg-gradient-to-br from-[#4A3B32] to-[#2B211C]", // Deep Acacia wood / خشب السنط
        accent: "border-[#D4A373]", // Sudanese Gold
        banner: "bg-[#9E4233]", // Terracotta Red / طمي النيل
        text: "text-[#FAF6EE]"
      },
      {
        bg: "bg-gradient-to-br from-[#9E4233] to-[#5C2117]", // Red Nile Clay / الطين الآجر
        accent: "border-[#E6D5B8]", // Sand Beige
        banner: "bg-[#D4A373]", // Sudan Ochre
        text: "text-[#FAF6EE]"
      },
      {
        bg: "bg-gradient-to-br from-[#5D4037] to-[#3E2723]", // Roasted Arabic Coffee / البن المحمص
        accent: "border-[#FFB74D]", // Gold glow
        banner: "bg-[#4A3B32]", // Charcoal
        text: "text-[#FFE0B2]"
      },
      {
        bg: "bg-gradient-to-br from-[#D4A373] to-[#8B5E34]", // Golden desert sand / رمال الصحراء الذهبية
        accent: "border-[#4A3B32]", // Deep Wood
        banner: "bg-[#9E4233]", // Terracotta
        text: "text-[#FAF6EE]"
      }
    ];

    return palettes[val];
  };

  return (
    <div className="flex-1 bg-[#FDFBF7] text-[#4A3B32] min-h-screen px-4 py-8 md:px-8 max-w-7xl mx-auto flex flex-col justify-between selection:bg-[#5A5A40] selection:text-white">
      
      {/* 1. Sudan traditional Header Motif & Title Banner */}
      <div>
        <header className="relative py-8 px-6 text-center rounded-3xl bg-gradient-to-b from-[#FAF5EC] to-[#F5F0E6] border border-[#E6E0D4] shadow-sm mb-10 overflow-hidden">
          {/* Nubian geometric background pattern decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(#C84B31_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#9E4233] via-[#5A5A40] to-[#4A3B32]"></div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] text-xs font-bold mb-3 border border-[#5A5A40]/20">
              <Compass className="w-3.5 h-3.5" />
              <span>هوية سودانية أصيلة ۞ فضاء القراءة الرقمية</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#4A3B32] font-serif mb-2.5">
              مكتبة الكتب التفاعلية
            </h1>
            
            <p className="text-sm md:text-base text-[#6D4C41] leading-relaxed max-w-xl mx-auto">
              تصفح وقراءة الكتب الإلكترونية وتجربة تقليب الصفحات الورقية ثلاثي الأبعاد. ادعم قراءتك دون اتصال وعبر روابط قوقل درايف بلمسات ترابية دافئة.
            </p>

            {/* Quick stats shelf overview */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              <button
                id="add_drive_link_modal_btn"
                onClick={() => runAdminProtectedAction(() => setShowAddModal(true))}
                className="flex items-center gap-2 px-4.5 py-2 rounded-xl text-xs font-semibold bg-[#5A5A40] text-white hover:bg-[#4A4A32] transition-all shadow-sm"
              >
                {isAdmin ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 opacity-80" />}
                <span>إضافة كتاب من Google Drive</span>
              </button>

              <button
                id="upload_local_pdf_btn"
                onClick={() => runAdminProtectedAction(() => setShowUploadModal(true))}
                className="flex items-center gap-2 px-4.5 py-2 rounded-xl text-xs font-semibold bg-[#9E4233] text-white hover:bg-[#853428] transition-all shadow-sm"
              >
                {isAdmin ? <Upload className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 opacity-80" />}
                <span>رفع كتاب محلي (PDF)</span>
              </button>

              {/* Admin Mode Badge & Toggle Button */}
              {isAdmin ? (
                <button
                  onClick={onAdminLogout}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all text-xs font-bold"
                  title="تسجيل خروج المشرف"
                >
                  <Unlock className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                  <span>۩ المشرف (خروج)</span>
                </button>
              ) : (
                <button
                  onClick={() => runAdminProtectedAction(() => {})}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50/60 text-amber-800 hover:bg-amber-100 transition-all text-xs font-semibold"
                  title="تسجيل دخول المشرف"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>۩ دخول المشرف</span>
                </button>
              )}

              <button
                onClick={() => setShowHelp(!showHelp)}
                className="p-2 rounded-xl border border-[#E6E0D4] bg-white text-[#6D4C41] hover:bg-[#FAF5EC] transition-all"
                title="مساعدة وإرشادات"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              <button
                id="view_supabase_schema_btn"
                onClick={onOpenSupabaseSchema}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E0D4] bg-white hover:bg-[#F5F0E6] text-xs font-medium text-neutral-600"
              >
                <Database className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span>جداول Supabase</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic help section */}
        {showHelp && (
          <div className="p-5 mb-8 rounded-2xl bg-[#5A5A40]/5 border border-[#5A5A40]/15 text-xs text-[#6D4C41] leading-relaxed">
            <h3 className="font-bold text-[#5A5A40] text-sm mb-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              <span>ملاحظة فنية هامة حول روابط Google Drive و CORS:</span>
            </h3>
            <p className="mb-2">
              بسبب جدران حماية CORS المفروضة من جوجل، قد يتعذر على المتصفح فتح الملفات المباشرة من Google Drive أحياناً إذا لم يتم نشر الرابط للعامة بشكل صحيح. لتجربة مثالية وموثوقة 100%:
            </p>
            <ul className="list-decimal list-inside space-y-1 bg-white/50 p-2.5 rounded-lg border border-[#5A5A40]/10">
              <li>تأكد من تعديل إذن الملف في قوقل درايف إلى <strong>"أي شخص لديه الرابط يمكنه العرض" (Public Share link)</strong>.</li>
              <li>لضمان القراءة دون انقطاع، يُفضّل دائماً استخدام زر <strong>"رفع كتاب محلي (PDF)"</strong>؛ حيث يقوم التطبيق بتخزين الملف بالكامل في ذاكرة <strong>IndexedDB</strong> بالمتصفح ليفتح فوراً وبسرعة فائقة حتى لو انقطع الإنترنت تماماً وبسرعة تصفح مذهلة!</li>
            </ul>
          </div>
        )}

        {/* 2. THE PHYSICAL WOOD SHELF SECTION */}
        <section className="mb-14">
          {/* Category Tabs */}
          <div className="mb-8 border-b border-[#E6E0D4] pb-4">
            <h3 className="text-xs font-bold text-[#6D4C41] mb-2.5 text-right">۞ تصنيفات المكتبة التفاعلية:</h3>
            <div className="flex items-center gap-2 justify-start overflow-x-auto py-1.5 scrollbar-none flex-row-reverse">
              {[
                { id: "all", label: "الكل", icon: "📚", count: books.length },
                { id: "curriculum", label: "مناهج وزارة التربية والتعليم", icon: "🏫", count: books.filter(b => b.category === "curriculum").length },
                { id: "children", label: "كتب للأطفال", icon: "👶", count: books.filter(b => b.category === "children").length },
                { id: "religious", label: "المكتبة الدينية", icon: "🕌", count: books.filter(b => b.category === "religious").length },
                { id: "general", label: "كتب عامة وروايات", icon: "🖋️", count: books.filter(b => b.category === "general" || !b.category).length }
              ].map((cat) => {
                const isActive = activeTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap select-none ${
                      isActive
                        ? "bg-[#5A5A40] text-[#FAF6EE] shadow-md border border-[#5A5A40]"
                        : "bg-[#FAF5EC]/80 text-[#6D4C41] border border-[#E6E0D4] hover:bg-[#FAF5EC]"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
                      isActive ? "bg-white/20 text-white" : "bg-[#5A5A40]/10 text-[#5A5A40]"
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <h2 className="text-xl font-bold text-[#4A3B32] font-serif mb-6 flex items-center gap-2 flex-row-reverse">
            <BookOpen className="w-5.5 h-5.5 text-[#9E4233]" />
            <span>
              {activeTab === "all" && "رفوف القراءة الخاصة بك"}
              {activeTab === "curriculum" && "مناهج وزارة التربية والتعليم"}
              {activeTab === "children" && "كتب للأطفال والبراعم"}
              {activeTab === "religious" && "المكتبة الإسلامية والدينية"}
              {activeTab === "general" && "الكتب العامة والروايات الأدبية"}
            </span>
          </h2>

          {books.filter(book => {
            if (activeTab === "all") return true;
            if (activeTab === "general") return book.category === "general" || !book.category;
            return book.category === activeTab;
          }).length === 0 ? (
            <div className="text-center py-16 px-4 bg-[#FAF5EC]/40 rounded-3xl border border-[#E6E0D4] border-dashed">
              <span className="text-3xl">📭</span>
              <p className="text-xs font-bold text-[#8D7B68] mt-3">لا توجد كتب مضافة في هذا التصنيف حالياً.</p>
              <p className="text-[11px] text-[#8D7B68]/70 mt-1">انقر على أزرار الإضافة في الأعلى لملء هذا الرف!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-12 gap-x-6 md:gap-x-8">
              {books.filter(book => {
                if (activeTab === "all") return true;
                if (activeTab === "general") return book.category === "general" || !book.category;
                return book.category === activeTab;
              }).map((book) => {
                const colors = getTraditionalCoverColors(book.title, book.id);
                
                return (
                <div 
                  key={book.id} 
                  className="flex flex-col group relative"
                >
                  
                  {/* The stylized 3D realistic book spine & cover cover */}
                  <div 
                    onClick={() => onSelectBook(book)}
                    className="cursor-pointer relative aspect-[3/4] rounded-r-lg rounded-l-md shadow-lg hover:shadow-2xl hover:-translate-y-2.5 transition-all duration-300 transform preserve-3d overflow-hidden flex flex-col justify-between p-3.5 border-r border-[#ffffff30]"
                  >
                    {/* The Cover gradient and background pattern */}
                    <div className={`absolute inset-0 ${colors.bg} z-0`}></div>
                    {/* Ornamental Gold Motif Background */}
                    <div className="absolute inset-2 border border-dashed border-white/20 rounded-md z-0 pointer-events-none"></div>
                    <div className="absolute top-2 right-2 left-2 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

                    {/* Left Spine Thickness Shader for 3D Feel */}
                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/50 to-transparent z-10"></div>
                    <div className="absolute left-[3px] top-0 bottom-0 w-[1px] bg-white/20 z-10"></div>

                    {/* Cover Content Overlay */}
                    <div className="relative z-10 flex-1 flex flex-col justify-between">
                      
                      {/* Top banner / Sudanese pattern */}
                      <div className={`py-1 px-1.5 rounded-md text-center ${colors.banner} text-[9px] font-bold tracking-wider ${colors.text} truncate uppercase max-w-full`}>
                        {book.isCustom ? (book.fileSize ? `ملف محلي • ${book.fileSize}` : "رابط سحابي") : "مخطوطة عريقة"}
                      </div>

                      {/* Center Title */}
                      <div className="my-auto text-center py-2 px-1">
                        <p className="font-serif font-extrabold text-xs md:text-sm text-amber-100 leading-snug tracking-wide line-clamp-3">
                          {book.title}
                        </p>
                        <p className="text-[10px] text-amber-200/80 mt-1.5 line-clamp-1 italic">
                          {book.author}
                        </p>
                      </div>

                      {/* Decorative medallion badge at the bottom */}
                      <div className="mx-auto mt-2 text-center">
                        <div className={`w-7 h-7 rounded-full border ${colors.accent} flex items-center justify-center bg-black/10 text-amber-300/60`}>
                          <span className="text-[9px] font-mono">۞</span>
                        </div>
                      </div>

                    </div>

                    {/* Book pages physical thickness edge shader (on the right) */}
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-white/30 to-transparent z-10"></div>
                  </div>

                  {/* Book Metadata & Deletion Below shelf */}
                  <div className="mt-3 text-right">
                    <h3 className="font-bold text-xs line-clamp-1 text-[#4A3B32]">
                      {book.title}
                    </h3>
                    <p className="text-[10px] opacity-75 line-clamp-1 mt-0.5">
                      {book.author}
                    </p>
                    
                    <div className="flex items-center justify-start gap-3 mt-2">
                      <button
                        onClick={(e) => handleOpenEditModal(e, book)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5A5A40] hover:text-[#4A3B32] transition-all bg-[#5A5A40]/10 hover:bg-[#5A5A40]/20 px-2 py-1 rounded shadow-sm"
                        title="تعديل تفاصيل الكتاب"
                      >
                        {isAdmin ? <Edit className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3 text-[#5A5A40]/70" />}
                        <span>تعديل</span>
                      </button>

                      {/* Custom books have delete option */}
                      {book.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            runAdminProtectedAction(() => {
                              if (confirm(`هل أنت متأكد من رغبتك في حذف كتاب "${book.title}" من رفوف مكتبتك؟`)) {
                                onDeleteBook(book.id);
                              }
                            });
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 hover:text-red-800 transition-all bg-red-50 hover:bg-red-100 px-2 py-1 rounded shadow-sm"
                          title="حذف هذا المجلد"
                        >
                          {isAdmin ? <Trash2 className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3 text-red-400" />}
                          <span>حذف</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Physical Acacia Wooden Plank under each book row */}
                  <div className="absolute -bottom-6 left-[-10px] right-[-10px] h-3.5 bg-gradient-to-b from-[#6D4C41] to-[#4A3B32] rounded-full shadow-md z-[-1] border-b border-black/20">
                    <div className="absolute inset-0 bg-repeat-x bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:20px_100%] opacity-20"></div>
                  </div>

                </div>
              );
            })}
          </div>
          )}
        </section>
      </div>

      {/* 3. Bottom decorative Sudanese banner */}
      <footer className="mt-16 border-t border-[#E6D5B8] pt-6 pb-2 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-[#8D7B68]">
          <span>۞</span>
          <span>تطبيق قارئ التقليب الورقي التفاعلي مصمم بنقاء الهوية والرموز السودانية الأصيلة</span>
          <span>۞</span>
        </div>
        <p className="text-[10px] opacity-60 mt-1 font-mono">جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
      </footer>

      {/* 4. MODAL FOR ADDING DIRECT GOOGLE DRIVE URLS */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white border border-[#E6E0D4] shadow-2xl text-right">
            
            <h3 className="text-lg font-bold text-[#4A3B32] font-serif mb-1 flex items-center gap-2 justify-end">
              <span>إدراج كتاب جديد من Google Drive</span>
              <BookOpen className="w-5 h-5 text-[#5A5A40]" />
            </h3>
            <p className="text-xs text-[#8D7B68] mb-5 leading-relaxed">
              قم بلصق رابط قوقل درايف العام للملف (PDF) وسيقوم النظام بتحويله تلقائياً لربطه مع قارئ التقليب الذكي.
            </p>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2 justify-end">
                <span>{errorMsg}</span>
                <AlertCircle className="w-4 h-4 shrink-0" />
              </div>
            )}

            <form onSubmit={handleAddDriveBook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">عنوان المجلد الإلكتروني</label>
                <input 
                  type="text" 
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: موسم الهجرة إلى الشمال"
                  className="w-full p-2.5 text-xs rounded-xl border border-neutral-300 focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">اسم الكاتب أو المؤلف</label>
                <input 
                  type="text" 
                  required
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="مثال: الطيب صالح"
                  className="w-full p-2.5 text-xs rounded-xl border border-neutral-300 focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">رابط مشاركة Google Drive</label>
                <input 
                  type="url" 
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full p-2.5 text-xs font-mono rounded-xl border border-neutral-300 focus:ring-1 focus:ring-[#5A5A40] outline-none text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">تصنيف الكتاب</label>
                <select 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-neutral-300 focus:ring-1 focus:ring-[#5A5A40] outline-none bg-white text-[#4A3B32]"
                >
                  <option value="general">كتب عامة وروايات</option>
                  <option value="curriculum">مناهج وزارة التربية والتعليم</option>
                  <option value="children">كتب للأطفال</option>
                  <option value="religious">المكتبة الدينية</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">نبذة مختصرة عن الكتاب (اختياري)</label>
                <textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="اكتب خلاصة أو فكرة عامة عن هذا الكتاب..."
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl border border-neutral-300 focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-xs font-bold text-neutral-600 transition-colors"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A32] text-xs font-bold text-white transition-colors"
                >
                  إدراج وربط الكتاب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BOOK MODAL */}
      {showEditModal && editingBook && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#FAF6F0] rounded-2xl max-w-md w-full p-6 border-2 border-[#E6DCC8] shadow-2xl text-right">
            <h2 className="text-xl font-bold font-serif text-[#4A3B32] mb-1.5 flex items-center justify-between border-b border-[#E6DCC8] pb-3">
              <span>تعديل تفاصيل المجلد</span>
              <span className="text-xs font-sans text-neutral-400 font-normal">تحديث المحتوى</span>
            </h2>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">عنوان المجلد الإلكتروني</label>
                <input 
                  type="text" 
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-neutral-300 focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">اسم الكاتب أو المؤلف</label>
                <input 
                  type="text" 
                  required
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-neutral-300 focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">رابط الملف PDF أو Google Drive</label>
                <input 
                  type="url" 
                  required
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full p-2.5 text-xs font-mono rounded-xl border border-neutral-300 focus:ring-1 focus:ring-[#5A5A40] outline-none text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">تصنيف الكتاب</label>
                <select 
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-neutral-300 focus:ring-1 focus:ring-[#5A5A40] outline-none bg-white text-[#4A3B32]"
                >
                  <option value="general">كتب عامة وروايات</option>
                  <option value="curriculum">مناهج وزارة التربية والتعليم</option>
                  <option value="children">كتب للأطفال</option>
                  <option value="religious">المكتبة الدينية</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">نبذة مختصرة عن الكتاب (اختياري)</label>
                <textarea 
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl border border-neutral-300 focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBook(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-xs font-bold text-neutral-600 transition-colors"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A32] text-xs font-bold text-white transition-colors"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL FOR UPLOADING LOCAL PDF FILE (SAVED IN INDEXEDDB) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white border border-[#E6E0D4] shadow-2xl text-right animate-fadeIn">
            
            <h3 className="text-lg font-bold text-[#4A3B32] font-serif mb-1 flex items-center gap-2 justify-end">
              <span>رفع كتاب محلي وتخزينه بالمتصفح</span>
              <Upload className="w-5 h-5 text-[#9E4233]" />
            </h3>
            <p className="text-xs text-[#8D7B68] mb-5 leading-relaxed">
              سيتم حفظ هذا الملف بالكامل وبشكل آمن داخل متصفحك (IndexedDB)، لفتحه فوراً حتى دون إنترنت وبشكل فائق السرعة وبدون قيود CORS.
            </p>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2 justify-end">
                <span>{errorMsg}</span>
                <AlertCircle className="w-4 h-4 shrink-0" />
              </div>
            )}

            <form onSubmit={handleLocalFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">ملف الكتاب (PDF)</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    uploadFile ? "border-emerald-500 bg-emerald-50/20" : "border-neutral-300 hover:border-[#5A5A40] bg-neutral-50"
                  }`}
                  onClick={() => document.getElementById("local-pdf-input")?.click()}
                >
                  <input 
                    type="file" 
                    id="local-pdf-input"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setUploadFile(file);
                        if (!uploadTitle) {
                          // Auto-fill title from filename
                          const cleanName = file.name.replace(/\.[^/.]+$/, "");
                          setUploadTitle(cleanName);
                        }
                      }
                    }}
                  />
                  {uploadFile ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <FileCheck className="w-8 h-8 text-emerald-600" />
                      <p className="text-xs font-bold text-emerald-700 truncate max-w-xs">{uploadFile.name}</p>
                      <p className="text-[10px] text-neutral-500">{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Upload className="w-8 h-8 text-neutral-400" />
                      <p className="text-xs text-neutral-600 font-medium">اسحب وأفلت الملف هنا أو انقر للتصفح</p>
                      <p className="text-[10px] text-neutral-400">يدعم ملفات PDF فقط حتى 150 ميجابايت</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">عنوان المجلد الإلكتروني</label>
                <input 
                  type="text" 
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="مثال: ديوان الهبّاب"
                  className="w-full p-2.5 text-xs rounded-xl border border-neutral-300 focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">اسم الكاتب أو المؤلف</label>
                <input 
                  type="text" 
                  required
                  value={uploadAuthor}
                  onChange={(e) => setUploadAuthor(e.target.value)}
                  placeholder="مثال: حمزة الملك طمبل"
                  className="w-full p-2.5 text-xs rounded-xl border border-neutral-300 focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">تصنيف الكتاب</label>
                <select 
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-neutral-300 focus:ring-1 focus:ring-[#5A5A40] outline-none bg-white text-[#4A3B32]"
                >
                  <option value="general">كتب عامة وروايات</option>
                  <option value="curriculum">مناهج وزارة التربية والتعليم</option>
                  <option value="children">كتب للأطفال</option>
                  <option value="religious">المكتبة الدينية</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">نبذة مختصرة عن الكتاب (اختياري)</label>
                <textarea 
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="اكتب خلاصة أو فكرة عامة عن هذا الكتاب ليرى القراء ملخصاً عنه..."
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl border border-neutral-300 focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setErrorMsg(null);
                  }}
                  disabled={isUploading}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-xs font-bold text-neutral-600 transition-colors disabled:opacity-50"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A32] text-xs font-bold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isUploading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>جاري الحفظ محلياً...</span>
                    </>
                  ) : (
                    <span>حفظ وتخزين الكتاب</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN LOGIN DIALOG MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#FAF6F0] rounded-2xl max-w-sm w-full p-6 border-2 border-[#E6DCC8] shadow-2xl text-right">
            
            <div className="flex items-center gap-2 justify-end text-amber-800 mb-3 border-b border-[#E6DCC8] pb-3">
              <span className="font-serif font-bold text-md">مطلوب صلاحية مدير النظام</span>
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>

            <p className="text-xs text-[#6D4C41] leading-relaxed mb-4">
              لإضافة كتب جديدة أو تعديل المحتوى الحالي، يرجى إدخال رمز مرور المشرف المخصص.
            </p>

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">رمز مرور المشرف</label>
                <input 
                  type="password" 
                  required
                  autoFocus
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full p-2.5 text-xs text-center font-mono rounded-xl border border-neutral-300 focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setPendingAction(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-xs font-bold text-neutral-600 transition-colors"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A32] text-xs font-bold text-white transition-colors"
                >
                  تسجيل الدخول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
