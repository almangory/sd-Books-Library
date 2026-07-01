import React, { useState, useEffect } from "react";
import { Book } from "../types";
import { getGoogleDriveDirectLink, isValidUrl } from "../utils/driveParser";
import { cacheBookBlob, removeCachedBookBlob, getCachedBookBlob, getAllCachedBookIds } from "../utils/indexedDB";
import { getTranslation } from "../utils/translations";
import ReadingStatsPanel from "./ReadingStatsPanel";
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
  ShieldAlert,
  Wifi,
  WifiOff,
  Maximize,
  Minimize,
  Search,
  X,
  Heart,
  ListPlus,
  Bell,
  BellRing,
  Share2,
  Mic,
  MicOff,
  Globe
} from "lucide-react";

export const CURRICULUM_STAGES = [
  "الروضة الأولى",
  "الروضة الثانية",
  "الروضة الثالثة",
  "الصف الأول الابتدائي",
  "الصف الثاني الابتدائي",
  "الصف الثالث الابتدائي",
  "الصف الرابع الابتدائي",
  "الصف الخامس الابتدائي",
  "الصف السادس الابتدائي",
  "أولى متوسط",
  "ثاني متوسط",
  "ثالث متوسط",
  "الأول ثانوي",
  "الثاني ثانوي",
  "الثالث ثانوي"
];

export const getBookCurriculumStage = (book: Book): string | null => {
  if (book.category !== "curriculum") return null;
  
  // 1. Try to find from tags
  if (book.tags && Array.isArray(book.tags)) {
    const found = CURRICULUM_STAGES.find(stage => 
      book.tags?.some(tag => tag.trim() === stage)
    );
    if (found) return found;
  }
  
  // 2. Try to find from title
  const foundInTitle = CURRICULUM_STAGES.find(stage => 
    book.title.includes(stage)
  );
  if (foundInTitle) return foundInTitle;

  // 3. Try to find from description
  const foundInDesc = CURRICULUM_STAGES.find(stage => 
    book.description && book.description.includes(stage)
  );
  if (foundInDesc) return foundInDesc;

  return null;
};

export const CHILDREN_SECTIONS = [
  "انجليزي",
  "عربي",
  "باللهجة السودانية",
  "تاريخ"
];

export const getBookChildrenSection = (book: Book): string | null => {
  if (book.category !== "children") return null;

  // 1. Try to find from tags
  if (book.tags && Array.isArray(book.tags)) {
    const found = CHILDREN_SECTIONS.find(sec => 
      book.tags?.some(tag => tag.trim() === sec)
    );
    if (found) return found;
  }

  // 2. Try to find from title
  const titleLower = book.title.toLowerCase();
  if (titleLower.includes("تاريخ") || titleLower.includes("حضارة") || titleLower.includes("قديم") || titleLower.includes("فرعون") || titleLower.includes("ملوك") || titleLower.includes("history") || titleLower.includes("ancient") || titleLower.includes("civilization")) {
    return "تاريخ";
  }
  if (titleLower.includes("سوداني") || titleLower.includes("سودانية") || titleLower.includes("السودان") || titleLower.includes("سودان")) {
    return "باللهجة السودانية";
  }
  if (titleLower.includes("انجليزي") || titleLower.includes("english") || titleLower.includes("إنجليزي") || titleLower.includes("انقليزي") || titleLower.includes("eng")) {
    return "انجليزي";
  }
  if (titleLower.includes("عربي") || titleLower.includes("العربية") || titleLower.includes("عربية")) {
    return "عربي";
  }

  // 3. Try to find from description
  if (book.description) {
    const descLower = book.description.toLowerCase();
    if (descLower.includes("تاريخ") || descLower.includes("حضارة") || descLower.includes("قديم") || descLower.includes("فرعون") || descLower.includes("ملوك") || descLower.includes("history") || descLower.includes("ancient") || descLower.includes("civilization")) {
      return "تاريخ";
    }
    if (descLower.includes("سوداني") || descLower.includes("سودانية") || descLower.includes("السودان") || descLower.includes("سودان")) {
      return "باللهجة السودانية";
    }
    if (descLower.includes("انجليزي") || descLower.includes("english") || descLower.includes("إنجليزي") || descLower.includes("انقليزي") || descLower.includes("eng")) {
      return "انجليزي";
    }
    if (descLower.includes("عربي") || descLower.includes("العربية") || descLower.includes("عربية")) {
      return "عربي";
    }
  }

  // Default fallback for children books if nothing specified can be "عربي"
  return "عربي";
};

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
  isOnline?: boolean;
  language?: "ar" | "en";
  onChangeLanguage?: (lang: "ar" | "en") => void;
  onOpenTutorial?: () => void;
  readBookIds?: string[];
  readingTimeByDate?: Record<string, number>;
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
  adminPassword,
  isOnline = true,
  language = "ar",
  onChangeLanguage,
  onOpenTutorial,
  readBookIds = [],
  readingTimeByDate = {}
}: LibraryShelfProps) {
  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, language);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn("Fullscreen permission denied:", err);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Fullscreen API not supported in this environment:", err);
    }
  };

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editAuthor, setEditAuthor] = useState<string>("");
  const [editUrl, setEditUrl] = useState<string>("");
  const [editDesc, setEditDesc] = useState<string>("");
  const [editCategory, setEditCategory] = useState<string>("general");

  // Filter tab state
  const [activeTab, setActiveTab] = useState<string>("all");

  // Favorites State
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("library_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("library_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (bookId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setFavorites(prev => 
      prev.includes(bookId) ? prev.filter(id => id !== bookId) : [...prev, bookId]
    );
  };

  // Reading Lists State
  interface ReadingList {
    id: string;
    name: string;
    bookIds: string[];
  }

  const [readingLists, setReadingLists] = useState<ReadingList[]>(() => {
    try {
      const saved = localStorage.getItem("library_reading_lists");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeReadingListId, setActiveReadingListId] = useState<string | null>(null);
  const [newReadingListName, setNewReadingListName] = useState<string>("");
  const [showCreateListInput, setShowCreateListInput] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem("library_reading_lists", JSON.stringify(readingLists));
  }, [readingLists]);

  const handleCreateReadingList = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newReadingListName.trim();
    if (!name) return;
    
    // Check duplicate
    if (readingLists.some(l => l.name.toLowerCase() === name.toLowerCase())) {
      alert("توجد قائمة قراءة بهذا الاسم بالفعل!");
      return;
    }

    const newList: ReadingList = {
      id: "list_" + Math.random().toString(36).substr(2, 9),
      name,
      bookIds: []
    };

    setReadingLists(prev => [...prev, newList]);
    setNewReadingListName("");
    setShowCreateListInput(false);
  };

  const handleDeleteReadingList = (listId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("هل أنت متأكد من حذف قائمة القراءة هذه؟ (لن يتم حذف الكتب من المكتبة)")) {
      setReadingLists(prev => prev.filter(l => l.id !== listId));
      if (activeReadingListId === listId) {
        setActiveReadingListId(null);
      }
    }
  };

  const toggleBookInReadingList = (listId: string, bookId: string) => {
    setReadingLists(prev => prev.map(list => {
      if (list.id === listId) {
        const alreadyIn = list.bookIds.includes(bookId);
        return {
          ...list,
          bookIds: alreadyIn ? list.bookIds.filter(id => id !== bookId) : [...list.bookIds, bookId]
        };
      }
      return list;
    }));
  };

  // Sorting & Tagging States
  const [sortBy, setSortBy] = useState<"date" | "alphabet">("date");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Voice Search States and Handlers
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  useEffect(() => {
    return () => {
      if ((window as any)._activeSpeechRecognition) {
        try {
          (window as any)._activeSpeechRecognition.stop();
        } catch (e) {}
      }
    };
  }, []);

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("عذراً، متصفحك أو جهازك الحالي لا يدعم ميزة التعرف على الصوت. يرجى استخدام متصفح Google Chrome أو Safari لتفعيل ميزات البحث الصوتي.");
      setSpeechSupported(false);
      return;
    }

    if (isListening) {
      if ((window as any)._activeSpeechRecognition) {
        try {
          (window as any)._activeSpeechRecognition.stop();
        } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = "ar-SA"; // Arabic
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript;
          setSearchQuery(transcript);
        }
      };

      rec.onerror = (err: any) => {
        console.error("Speech recognition error:", err.error);
        setIsListening(false);
        
        const errorType = err.error;
        if (errorType === "not-allowed") {
          alert("عذراً، لم نتمكن من الوصول إلى الميكروفون (تم رفض إذن التشغيل).\n\n💡 الحلول المقترحة:\n١. تأكد من السماح بإذن استخدام الميكروفون لهذا التطبيق من خلال إعدادات المتصفح أو أيقونة القفل في شريط العنوان.\n٢. إذا كنت تتصفح من داخل إطار المعاينة التفاعلي لـ AI Studio، يرجى فتح التطبيق في علامة تبويب مستقلة كاملة (Open in a new tab) ليتمكن المتصفح من طلب وتشغيل صلاحيات الميكروفون بنجاح.");
        } else if (errorType === "no-speech") {
          alert("لم يتم كشف أي صوت. يرجى المحاولة مجدداً والتحدث بوضوح أمام الميكروفون.");
        } else if (errorType === "audio-capture") {
          alert("لم نتمكن من العثور على ميكروفون متاح أو متصل بجهازك. يرجى التحقق من توصيل الميكروفون.");
        } else if (errorType === "network") {
          alert("حدث خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.");
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      (window as any)._activeSpeechRecognition = rec;
      rec.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      setIsListening(false);
    }
  };
  
  // Curriculum Stage States
  const [selectedCurriculumStage, setSelectedCurriculumStage] = useState<string>("all");
  const [newCurriculumStage, setNewCurriculumStage] = useState<string>("");
  const [uploadCurriculumStage, setUploadCurriculumStage] = useState<string>("");
  const [editCurriculumStage, setEditCurriculumStage] = useState<string>("");

  // Children Section States
  const [selectedChildrenSection, setSelectedChildrenSection] = useState<string>("all");
  const [newChildrenSection, setNewChildrenSection] = useState<string>("");
  const [uploadChildrenSection, setUploadChildrenSection] = useState<string>("");
  const [editChildrenSection, setEditChildrenSection] = useState<string>("");

  // Comma-separated tag input string states for modals
  const [newTagsStr, setNewTagsStr] = useState<string>("");
  const [uploadTagsStr, setUploadTagsStr] = useState<string>("");
  const [editTagsStr, setEditTagsStr] = useState<string>("");

  // Last opened book for 'Continue Reading' feature
  const [lastOpenedBook, setLastOpenedBook] = useState<Book | null>(null);
  const [lastOpenedPage, setLastOpenedPage] = useState<number | null>(null);

  // Long-press detailed preview modal states
  const [previewBook, setPreviewBook] = useState<Book | null>(null);

  // Notifications States
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [lastSeenNotifications, setLastSeenNotifications] = useState<number>(() => {
    try {
      return Number(localStorage.getItem("library_last_seen_notifications") || "0");
    } catch (e) {
      return 0;
    }
  });

  const notificationsRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatRelativeTime = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const secs = Math.floor(diff / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (secs < 60) return "الآن";
    if (mins === 1) return "منذ دقيقة";
    if (mins === 2) return "منذ دقيقتين";
    if (mins < 11) return `منذ ${mins} دقائق`;
    if (mins < 60) return `منذ ${mins} دقيقة`;
    if (hours === 1) return "منذ ساعة";
    if (hours === 2) return "منذ ساعتين";
    if (hours < 11) return `منذ ${hours} ساعات`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days === 1) return "أمس";
    if (days === 2) return "منذ يومين";
    if (days < 11) return `منذ ${days} أيام`;
    return `منذ ${days} يوم`;
  };

  const recentBooks = [...books]
    .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
    .slice(0, 10);

  const unreadCount = books.filter(b => (b.addedAt || 0) > lastSeenNotifications).length;

  const toggleNotifications = () => {
    setShowNotifications(prev => {
      const next = !prev;
      if (next) {
        const now = Date.now();
        setLastSeenNotifications(now);
        try {
          localStorage.setItem("library_last_seen_notifications", String(now));
        } catch (e) {
          console.warn(e);
        }
      }
      return next;
    });
  };

  // Cached Offline Book IDs State
  const [cachedBookIds, setCachedBookIds] = useState<string[]>([]);
  const [isPreviewBookCached, setIsPreviewBookCached] = useState<boolean>(false);
  const [isCachingInProgress, setIsCachingInProgress] = useState<boolean>(false);
  const [cachingError, setCachingError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  const handleShareBook = async (book: Book) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?bookId=${book.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: `اقرأ كتاب "${book.title}" للكاتب ${book.author} عبر تطبيق مكتبتي الرقمية السودانية التفاعلية.`,
          url: shareUrl
        });
        return;
      } catch (err) {
        console.warn("Navigator share failed, falling back to clipboard: ", err);
      }
    }
    
    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    } catch (clipboardErr) {
      console.error("Failed to copy link: ", clipboardErr);
      // Fallback for older browsers
      const tempInput = document.createElement("input");
      tempInput.value = shareUrl;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    }
  };

  const refreshCachedBooks = async () => {
    try {
      const ids = await getAllCachedBookIds();
      setCachedBookIds(ids || []);
    } catch (e) {
      console.warn("Error loading cached books:", e);
    }
  };

  useEffect(() => {
    refreshCachedBooks();
  }, [books]);

  // Check if previewBook is cached when previewBook changes
  useEffect(() => {
    if (!previewBook) {
      setIsPreviewBookCached(false);
      setIsCachingInProgress(false);
      setCachingError(null);
      return;
    }

    const checkCache = async () => {
      try {
        const cached = await getCachedBookBlob(previewBook.id);
        setIsPreviewBookCached(!!cached);
      } catch (err) {
        setIsPreviewBookCached(false);
      }
    };
    checkCache();
  }, [previewBook]);

  // Download and cache remote PDF offline
  const handleCacheBookOffline = async (book: Book) => {
    if (!book.pdfUrl) {
      alert("عذراً، هذا الكتاب لا يحتوي على رابط ملف صالح للتحميل.");
      return;
    }
    setIsCachingInProgress(true);
    setCachingError(null);
    try {
      // Fetch direct link if it's a google drive link
      let fetchUrl = book.pdfUrl;
      if (book.pdfUrl.includes("drive.google.com")) {
        const directLink = getGoogleDriveDirectLink(book.pdfUrl);
        if (directLink) {
          fetchUrl = directLink;
        }
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`تعذر تحميل الملف من السيرفر. كود الخطأ: ${response.status}`);
      }
      const blob = await response.blob();
      await cacheBookBlob(book.id, blob);
      setIsPreviewBookCached(true);
      await refreshCachedBooks();
      alert("تم حفظ الكتاب بنجاح في ذاكرة المتصفح المحلية! يمكنك الآن تصفحه وقراءته بالكامل بدون الحاجة لاتصال بالإنترنت.");
    } catch (err: any) {
      console.error("Failed to cache book:", err);
      setCachingError(err.message || "فشل التحميل من الرابط");
      alert(`عذراً، فشل تحميل وحفظ الملف للقراءة دون اتصال. يرجى التأكد من اتصالك بالإنترنت والمحاولة مجدداً. الخطأ: ${err.message || ""}`);
    } finally {
      setIsCachingInProgress(false);
    }
  };

  const handleRemoveBookCache = async (book: Book) => {
    if (confirm("هل أنت متأكد من رغبتك في إزالة هذا الكتاب من الذاكرة المؤقتة لقراءته دون اتصال؟ (لن يتم حذف بيانات الكتاب أو الملاحظات، فقط ملف الـ PDF لتقليل استهلاك المساحة)")) {
      try {
        await removeCachedBookBlob(book.id);
        setIsPreviewBookCached(false);
        await refreshCachedBooks();
        alert("تمت إزالة الملف بنجاح من الذاكرة المؤقتة.");
      } catch (err) {
        alert("فشل إزالة الملف.");
      }
    }
  };

  const [longPressTimer, setLongPressTimer] = useState<any>(null);
  const [isLongPressTriggered, setIsLongPressTriggered] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const lastId = localStorage.getItem("flipbook_last_opened_id");
    if (lastId && books && books.length > 0) {
      const found = books.find(b => b.id === lastId);
      if (found) {
        setLastOpenedBook(found);
        const savedPage = localStorage.getItem(`progress_${found.id}`);
        if (savedPage) {
          setLastOpenedPage(parseInt(savedPage, 10));
        } else {
          setLastOpenedPage(1);
        }
      }
    }
  }, [books]);

  // Unique list of tags from books
  const allUniqueTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    books.forEach(b => {
      if (b.tags && Array.isArray(b.tags)) {
        b.tags.forEach(tag => {
          const t = tag.trim();
          if (t) tagsSet.add(t);
        });
      }
    });
    return Array.from(tagsSet);
  }, [books]);

  // Reset curriculum stage when tab switches
  useEffect(() => {
    setSelectedCurriculumStage("all");
    setSelectedChildrenSection("all");
  }, [activeTab]);

  // Combined sorted and filtered books selector
  const sortedAndFilteredBooks = React.useMemo(() => {
    // 1. Filter by category tab
    let list = books.filter(book => {
      if (activeTab === "all") return true;
      if (activeTab === "favorites") return favorites.includes(book.id);
      if (activeTab === "general") return book.category === "general" || !book.category;
      return book.category === activeTab;
    });

    // 1.5. Filter by active reading list
    if (activeReadingListId) {
      const activeList = readingLists.find(l => l.id === activeReadingListId);
      if (activeList) {
        list = list.filter(book => activeList.bookIds.includes(book.id));
      }
    }

    // 1.8. Filter by curriculum stage
    if (activeTab === "curriculum" && selectedCurriculumStage !== "all") {
      list = list.filter(book => getBookCurriculumStage(book) === selectedCurriculumStage);
    }

    // 1.9. Filter by children section
    if (activeTab === "children" && selectedChildrenSection !== "all") {
      list = list.filter(book => getBookChildrenSection(book) === selectedChildrenSection);
    }

    // 2. Filter by selected tag/group
    if (selectedTag !== "all") {
      list = list.filter(book => {
        if (book.tags && Array.isArray(book.tags)) {
          return book.tags.some(t => t.trim().toLowerCase() === selectedTag.toLowerCase());
        }
        return false;
      });
    }

    // 3. Filter by search query (title or author)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.trim().toLowerCase();
      list = list.filter(book => {
        const titleMatch = book.title ? book.title.toLowerCase().includes(query) : false;
        const authorMatch = book.author ? book.author.toLowerCase().includes(query) : false;
        return titleMatch || authorMatch;
      });
    }

    // 4. Sort by date added or alphabetically
    return [...list].sort((a, b) => {
      if (sortBy === "alphabet") {
        return a.title.localeCompare(b.title, "ar", { sensitivity: "base" });
      } else {
        // Sort by addition date (descending)
        return (b.addedAt || 0) - (a.addedAt || 0);
      }
    });
  }, [books, activeTab, selectedTag, selectedCurriculumStage, selectedChildrenSection, sortBy, searchQuery, favorites, activeReadingListId, readingLists]);

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

    const parsedTags = newTagsStr
      .split(/[,،]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (newCategory === "curriculum" && newCurriculumStage) {
      if (!parsedTags.includes(newCurriculumStage)) {
        parsedTags.push(newCurriculumStage);
      }
    }

    if (newCategory === "children" && newChildrenSection) {
      if (!parsedTags.includes(newChildrenSection)) {
        parsedTags.push(newChildrenSection);
      }
    }

    const customBook: Book = {
      id: "drive_" + Math.random().toString(36).substr(2, 9),
      title: newTitle.trim(),
      author: newAuthor.trim(),
      description: newDesc.trim() || "كتاب تم إضافته عبر رابط Google Drive المباشر.",
      pdfUrl: parsedDirectUrl,
      coverUrl: "", // Generate abstract traditional cover dynamically
      isCustom: true,
      addedAt: Date.now(),
      category: newCategory,
      tags: parsedTags
    };

    onAddBook(customBook);
    
    // Clear state
    setNewTitle("");
    setNewAuthor("");
    setNewUrl("");
    setNewDesc("");
    setNewCategory("general");
    setNewTagsStr("");
    setNewCurriculumStage("");
    setNewChildrenSection("");
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

      const parsedTags = uploadTagsStr
        .split(/[,،]/)
        .map(t => t.trim())
        .filter(t => t.length > 0);

      if (uploadCategory === "curriculum" && uploadCurriculumStage) {
        if (!parsedTags.includes(uploadCurriculumStage)) {
          parsedTags.push(uploadCurriculumStage);
        }
      }

      if (uploadCategory === "children" && uploadChildrenSection) {
        if (!parsedTags.includes(uploadChildrenSection)) {
          parsedTags.push(uploadChildrenSection);
        }
      }

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
        fileSize: formatBytes(uploadFile.size),
        tags: parsedTags
      };

      onAddBook(localBook);

      // Reset
      setUploadTitle("");
      setUploadAuthor("");
      setUploadDesc("");
      setUploadCategory("general");
      setUploadTagsStr("");
      setUploadCurriculumStage("");
      setUploadChildrenSection("");
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
      const currentStage = getBookCurriculumStage(book) || "";
      setEditCurriculumStage(currentStage);
      const currentSection = getBookChildrenSection(book) || "";
      setEditChildrenSection(currentSection);
      setEditTagsStr(book.tags && Array.isArray(book.tags) ? book.tags.join("، ") : "");
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

    const parsedTags = editTagsStr
      .split(/[,،]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const cleanedTags = parsedTags.filter(tag => !CURRICULUM_STAGES.includes(tag) && !CHILDREN_SECTIONS.includes(tag));
    if (editCategory === "curriculum" && editCurriculumStage) {
      if (!cleanedTags.includes(editCurriculumStage)) {
        cleanedTags.push(editCurriculumStage);
      }
    }

    if (editCategory === "children" && editChildrenSection) {
      if (!cleanedTags.includes(editChildrenSection)) {
        cleanedTags.push(editChildrenSection);
      }
    }

    const updatedBook: Book = {
      ...editingBook,
      title: editTitle.trim(),
      author: editAuthor.trim(),
      pdfUrl: parsedDirectUrl,
      description: editDesc.trim(),
      category: editCategory,
      tags: cleanedTags
    };

    onUpdateBook(updatedBook);
    
    // reset states
    setShowEditModal(false);
    setEditingBook(null);
    setEditTitle("");
    setEditAuthor("");
    setEditUrl("");
    setEditDesc("");
    setEditCurriculumStage("");
    setEditChildrenSection("");
    setEditCategory("general");
    setEditTagsStr("");
    setErrorMsg(null);
  };

  // Long-press detection helpers for touch and mouse
  const handleBookTouchStart = (book: Book) => {
    setIsLongPressTriggered(false);
    const timer = setTimeout(() => {
      setPreviewBook(book);
      setIsLongPressTriggered(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(50);
        } catch (e) {
          // ignore potential iframe security restriction
        }
      }
    }, 550); // 550ms hold
    setLongPressTimer(timer);
  };

  const handleBookTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
    if (isLongPressTriggered) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleBookMouseDown = (book: Book) => {
    setIsLongPressTriggered(false);
    const timer = setTimeout(() => {
      setPreviewBook(book);
      setIsLongPressTriggered(true);
    }, 550);
    setLongPressTimer(timer);
  };

  const handleBookMouseUp = (e: React.MouseEvent, book: Book) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
    if (isLongPressTriggered) {
      e.preventDefault();
      e.stopPropagation();
    } else {
      onSelectBook(book);
    }
  };

  const handleBookMouseLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
  };

  // Dynamic aesthetic generator for abstract book cover colors representing Sudanese Earth tones or colorful kids stories
  const getTraditionalCoverColors = (title: string, id: string, category?: string) => {
    // Generate simple seed based on characters
    const val = (title.length + id.charCodeAt(id.length - 1 || 0)) % 4;
    
    if (category === "children") {
      // Cheerful, kids-friendly colors for children's books to inspire them!
      const kidsPalettes = [
        {
          bg: "bg-gradient-to-br from-[#FF6B6B] via-[#FF8E53] to-[#FFD254]", // Cheerful sunburst
          accent: "border-[#FFF9C4]",
          banner: "bg-[#FFEB3B] text-[#9E2A2B]",
          text: "text-[#9E2A2B]"
        },
        {
          bg: "bg-gradient-to-br from-[#4E65FF] to-[#92EFFD]", // Magic bright blue/lagoon
          accent: "border-[#E0F7FA]",
          banner: "bg-[#00E676] text-neutral-900",
          text: "text-neutral-900"
        },
        {
          bg: "bg-gradient-to-br from-[#AB47BC] via-[#EC407A] to-[#FF7043]", // Magical pink/violet fairy tale
          accent: "border-[#FCE4EC]",
          banner: "bg-[#FFEB3B] text-neutral-900",
          text: "text-neutral-900"
        },
        {
          bg: "bg-gradient-to-br from-[#9CCC65] via-[#D4E157] to-[#80DEEA]", // Bright playful nature green
          accent: "border-[#F1F8E9]",
          banner: "bg-[#E91E63] text-white",
          text: "text-white"
        }
      ];
      return kidsPalettes[val];
    }

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
        {/* Offline & Persistence status notice banners */}
        {!isOnline && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 flex items-center justify-between gap-4 flex-row-reverse shadow-sm animate-fade-in">
            <div className="flex items-center gap-2.5 flex-row-reverse">
              <WifiOff className="w-5 h-5 text-[#9E4233] animate-bounce shrink-0" />
              <div className="text-right">
                <p className="text-xs font-bold text-[#9E4233]">أنت تعمل حالياً دون اتصال بالإنترنت (Offline Mode)</p>
                <p className="text-[11px] text-[#6D4C41]">تم تفعيل ذاكرة التصفح التلقائي؛ يمكنك مواصلة قراءة كتبك المفضلة ومخطوطاتك المحفوظة محلياً بأمان.</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-md bg-[#9E4233] text-white font-mono font-bold whitespace-nowrap">محلي فقط</span>
          </div>
        )}

        {isOnline && (
          <div className="mb-6 p-3.5 rounded-2xl bg-[#5A5A40]/5 border border-[#5A5A40]/15 text-[#5A5A40] flex items-center justify-between gap-4 flex-row-reverse shadow-sm">
            <div className="flex items-center gap-2 flex-row-reverse">
              <Wifi className="w-4 h-4 text-[#5A5A40] animate-pulse shrink-0" />
              <div className="text-right">
                <p className="text-xs font-bold">{language === "en" ? "Offline Reading Mode Enabled Automatically ✔" : "وضع القراءة دون اتصال مفعّل تلقائياً ✔"}</p>
                <p className="text-[10px] text-[#6D4C41]">{language === "en" ? "All your readings, bookmarks, and written notes are securely synchronized and saved locally on your device." : "جميع قراءاتك، علاماتك المرجعية، وملاحظاتك المكتوبة يتم مزامنتها وحفظها بأمان على ذاكرة جهازك الحالي."}</p>
              </div>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#5A5A40]/15 text-[#5A5A40] font-bold whitespace-nowrap">{language === "en" ? "Active Auto-Save" : "حفظ ذاتي نشط"}</span>
          </div>
        )}

        <header className="relative z-30 py-8 px-6 text-center rounded-3xl bg-gradient-to-b from-[#FAF5EC] to-[#F5F0E6] border border-[#E6E0D4] shadow-sm mb-10">
          {/* Nubian geometric background pattern decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(#C84B31_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-10 pointer-events-none rounded-3xl"></div>
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#9E4233] via-[#5A5A40] to-[#4A3B32] rounded-t-3xl"></div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] text-xs font-bold mb-3 border border-[#5A5A40]/20">
              <Compass className="w-3.5 h-3.5" />
              <span>{language === "en" ? "Authentic Sudanese Identity ۞ Digital Reading Space" : "هوية سودانية أصيلة ۞ فضاء القراءة الرقمية"}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#4A3B32] font-serif mb-2.5">
              {language === "en" ? "Interactive Digital Library" : "مكتبة الكتب التفاعلية"}
            </h1>
            
            <p className="text-sm md:text-base text-[#6D4C41] leading-relaxed max-w-xl mx-auto">
              {language === "en" 
                ? "Browse and read electronic books with a 3D paper page-flipping experience. Support offline reading and Google Drive links with warm earthy tones." 
                : "تصفح وقراءة الكتب الإلكترونية وتجربة تقليب الصفحات الورقية ثلاثي الأبعاد. ادعم قراءتك دون اتصال وعبر روابط قوقل درايف بلمسات ترابية دافئة."}
            </p>

            {/* Quick stats shelf overview */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              {isAdmin && (
                <>
                  <button
                    id="add_drive_link_modal_btn"
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4.5 py-2 rounded-xl text-xs font-semibold bg-[#5A5A40] text-white hover:bg-[#4A4A32] transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة كتاب من Google Drive</span>
                  </button>

                  <button
                    id="upload_local_pdf_btn"
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-2 px-4.5 py-2 rounded-xl text-xs font-semibold bg-[#9E4233] text-white hover:bg-[#853428] transition-all shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>رفع كتاب محلي (PDF)</span>
                  </button>
                </>
              )}

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

              {onOpenTutorial && (
                <button
                  onClick={onOpenTutorial}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/50 text-amber-800 hover:bg-amber-100/80 transition-all text-xs font-bold shadow-sm"
                  title={language === "en" ? "Interactive User Guide" : "دليل الاستخدام والتشغيل"}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                  <span>{language === "en" ? "User Guide 💡" : "دليل الاستخدام 💡"}</span>
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="p-2 rounded-xl border border-[#E6E0D4] bg-white text-[#6D4C41] hover:bg-[#FAF5EC] transition-all"
                  title="مساعدة وإرشادات المشرف"
                >
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                </button>
              )}

              {/* Bilingual Language Switcher */}
              {onChangeLanguage && (
                <button
                  onClick={() => onChangeLanguage(language === "ar" ? "en" : "ar")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E0D4] bg-white text-[#6D4C41] hover:bg-[#FAF5EC] transition-all text-xs font-bold shadow-sm"
                  title={language === "ar" ? "Switch to English" : "التحويل للغة العربية"}
                >
                  <Globe className="w-3.5 h-3.5 text-[#5A5A40]" />
                  <span>{language === "ar" ? "English" : "العربية"}</span>
                </button>
              )}

              <button
                onClick={toggleFullscreen}
                className={`p-2 rounded-xl border transition-all ${
                  isFullscreen 
                    ? "bg-[#5A5A40] border-[#5A5A40] text-white" 
                    : "border-[#E6E0D4] bg-white text-[#6D4C41] hover:bg-[#FAF5EC]"
                }`}
                title={isFullscreen ? (language === "en" ? "Exit Fullscreen" : "إنهاء ملء الشاشة") : (language === "en" ? "Enter Fullscreen" : "ملء الشاشة بالكامل")}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>

              {/* Notification Bell */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={toggleNotifications}
                  className={`p-2 rounded-xl border transition-all relative ${
                    showNotifications 
                      ? "bg-[#5A5A40] border-[#5A5A40] text-white" 
                      : "border-[#E6E0D4] bg-white text-[#6D4C41] hover:bg-[#FAF5EC]"
                  }`}
                  title="الإشعارات والكتب المضافة حديثاً"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#9E4233] text-[9px] font-bold text-white shadow-sm ring-2 ring-white animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-72 sm:w-80 md:w-96 rounded-2xl border border-[#E6E0D4] bg-white text-[#4A3B32] shadow-xl z-50 overflow-hidden text-right animate-fade-in">
                    <div className="p-3.5 border-b border-[#FAF5EC] bg-[#FAF5EC] flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#5A5A40] px-2 py-1 rounded-full bg-[#5A5A40]/10">
                        {books.length} كتب بالمكتبة
                      </span>
                      <h3 className="font-bold text-xs sm:text-sm text-[#4A3B32] flex items-center gap-1.5">
                        <BellRing className="w-3.5 h-3.5 text-[#9E4233]" />
                        <span>آخر الكتب المضافة</span>
                      </h3>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                      {recentBooks.length > 0 ? (
                        recentBooks.map(book => {
                          const isUnread = (book.addedAt || 0) > lastSeenNotifications;
                          return (
                            <div 
                              key={book.id}
                              onClick={() => {
                                onSelectBook(book);
                                setShowNotifications(false);
                              }}
                              className={`p-3 hover:bg-[#FAF5EC]/50 transition-all cursor-pointer flex gap-3 text-right group ${
                                isUnread ? "bg-amber-50/40 border-r-2 border-[#9E4233]" : ""
                              }`}
                            >
                              {/* Book cover thumbnail */}
                              <div className="w-9 h-12 bg-amber-100/50 rounded-md border border-amber-200/40 flex-shrink-0 overflow-hidden shadow-sm relative group-hover:scale-105 transition-all">
                                {book.coverUrl ? (
                                  <img 
                                    src={book.coverUrl} 
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-amber-800 bg-[#E6DBC4]/30 font-serif text-[9px] font-bold leading-none p-1 text-center">
                                    كتاب
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0 flex flex-col justify-between text-right">
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-[9px] text-[#9E4233] bg-[#9E4233]/10 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                                      {book.category === "curriculum" ? "منهج دراسي" : 
                                       book.category === "children" ? "قصص أطفال" : 
                                       book.category === "religious" ? "ديني" : "عام"}
                                    </span>
                                    <h4 className="font-bold text-xs text-[#4A3B32] line-clamp-1 group-hover:text-[#9E4233] transition-colors text-right">
                                      {book.title}
                                    </h4>
                                  </div>
                                  <p className="text-[10px] text-[#6D4C41] mt-0.5 line-clamp-1 text-right">
                                    الكاتب: {book.author || "بخت الرضا"}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between mt-1 text-[9px] text-[#8C8273]">
                                  <span>{book.fileSize || "1.2 MB"}</span>
                                  <span>{formatRelativeTime(book.addedAt || 0)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center text-xs text-neutral-500">
                          {language === "en" ? "No books added to the library currently" : "لا توجد كتب مضافة في المكتبة حالياً"}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {isAdmin && (
                <button
                  id="view_supabase_schema_btn"
                  onClick={onOpenSupabaseSchema}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E0D4] bg-white hover:bg-[#F5F0E6] text-xs font-medium text-neutral-600"
                >
                  <Database className="w-3.5 h-3.5 text-[#5A5A40]" />
                  <span>جداول Supabase</span>
                </button>
              )}
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

        {/* 'Continue Reading' Section */}
        {lastOpenedBook && (
          <div className="mb-10 p-5 rounded-3xl bg-gradient-to-r from-[#FAF6EE] to-[#F5EFE4] border-2 border-[#D4A373]/30 shadow-md flex flex-col md:flex-row-reverse items-center justify-between gap-5 animate-fade-in">
            <div className="flex items-center gap-4 flex-row-reverse text-right">
              <div className="w-12 h-16 rounded shadow-md bg-gradient-to-br from-[#4A3B32] to-[#2B211C] flex items-center justify-center border border-[#FAF6EE]/20 shrink-0 overflow-hidden">
                <span className="text-white text-[10px] font-bold font-serif line-clamp-2 px-1 text-center leading-none">
                  {lastOpenedBook.title}
                </span>
              </div>
              <div>
                <span className="text-[10px] bg-[#9E4233]/10 text-[#9E4233] font-bold px-2.5 py-1 rounded-full">۞ متابعة القراءة</span>
                <h3 className="font-serif font-extrabold text-sm text-[#4A3B32] mt-1.5 leading-snug">
                  {lastOpenedBook.title}
                </h3>
                <p className="text-xs text-[#6D4C41] mt-0.5">
                  تأليف: {lastOpenedBook.author} {lastOpenedPage && `• وصلت إلى صفحة ${lastOpenedPage}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => onSelectBook(lastOpenedBook)}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#9E4233] hover:bg-[#853428] text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              <span>استكمال القراءة الآن</span>
            </button>
          </div>
        )}

        {/* Statistics Dashboard Panel */}
        <ReadingStatsPanel 
          language={language}
          readBookIds={readBookIds}
          readingTimeByDate={readingTimeByDate}
          books={books}
        />

        {/* 2. THE PHYSICAL WOOD SHELF SECTION */}
        <section className="mb-14">
          {/* Category Tabs */}
          <div className="mb-8 border-b border-[#E6E0D4] pb-4">
            <h3 className={`text-xs font-bold text-[#6D4C41] mb-2.5 ${language === "en" ? "text-left" : "text-right"}`}>
              {language === "en" ? "۞ Interactive Library Categories:" : "۞ تصنيفات المكتبة التفاعلية:"}
            </h3>
            <div className={`flex items-center gap-2 justify-start overflow-x-auto py-1.5 scrollbar-none ${language === "en" ? "flex-row" : "flex-row-reverse"}`}>
              {[
                { id: "all", label: language === "en" ? "All" : "الكل", icon: "📚", count: books.length },
                { id: "favorites", label: language === "en" ? "Favorites 💖" : "المفضلة 💖", icon: "❤️", count: books.filter(b => favorites.includes(b.id)).length },
                { id: "curriculum", label: language === "en" ? "Ministry of Education" : "مناهج وزارة التربية والتعليم", icon: "🏫", count: books.filter(b => b.category === "curriculum").length },
                { id: "children", label: language === "en" ? "Children's Books" : "كتب للأطفال", icon: "👶", count: books.filter(b => b.category === "children").length },
                { id: "religious", label: language === "en" ? "Religious Library" : "المكتبة الدينية", icon: "🕌", count: books.filter(b => b.category === "religious").length },
                { id: "general", label: language === "en" ? "General Books" : "كتب عامة وروايات", icon: "🖋️", count: books.filter(b => b.category === "general" || !b.category).length }
              ].map((cat) => {
                const isActive = activeTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveTab(cat.id);
                      setSelectedTag("all"); // Reset tag filter when category tab changes
                    }}
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

          {/* My Reading Lists Dashboard (قوائم القراءة المخصصة) */}
          <div className="mb-6 p-4 bg-[#FAF5EC]/90 rounded-2xl border border-[#E6E0D4] text-right" dir="rtl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-[#E6E0D4]/60 pb-3">
              <div className="flex items-center gap-2 flex-row-reverse">
                <span className="text-xl">📋</span>
                <div>
                  <h4 className="text-xs font-bold text-[#6D4C41]">قوائم القراءة الخاصة بك</h4>
                  <p className="text-[10px] text-[#8D7B68]/80 mt-0.5">أنشئ قوائم مخصصة لتجميع كتبك وتنسيق مكتبتك الخاصة</p>
                </div>
              </div>

              {/* Toggle new list form button */}
              <button
                type="button"
                onClick={() => setShowCreateListInput(!showCreateListInput)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#5A5A40] hover:bg-[#4A4A32] text-white text-[11px] font-bold transition-all shadow-sm self-start sm:self-auto"
              >
                <Plus size={13} />
                <span>إنشاء قائمة جديدة</span>
              </button>
            </div>

            {/* Create reading list inline form */}
            {showCreateListInput && (
              <form onSubmit={handleCreateReadingList} className="flex gap-2 items-center mb-4 max-w-md ml-auto flex-row-reverse">
                <input
                  type="text"
                  placeholder="اكتب اسم القائمة الجديدة (مثال: قراءات الصيف)..."
                  value={newReadingListName}
                  onChange={(e) => setNewReadingListName(e.target.value)}
                  className="flex-1 bg-white border border-[#E6E0D4] rounded-lg px-3 py-1.5 text-xs text-[#4A3B32] font-semibold placeholder-[#8D7B68]/50 focus:outline-none focus:ring-1 focus:ring-[#5A5A40] text-right"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#5A5A40] text-white rounded-lg text-xs font-bold hover:bg-[#4A4A32] transition-colors"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateListInput(false);
                    setNewReadingListName("");
                  }}
                  className="px-3 py-1.5 bg-neutral-200 text-neutral-600 rounded-lg text-xs font-bold hover:bg-neutral-300 transition-colors"
                >
                  إلغاء
                </button>
              </form>
            )}

            {/* List of custom reading lists */}
            {readingLists.length === 0 ? (
              <p className="text-[11px] text-[#8D7B68]/80 italic py-1">
                ليس لديك أي قوائم مخصصة بعد. انقر على "إنشاء قائمة جديدة" للبدء في تنظيم كتبك المفضلة!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 justify-start flex-row-reverse">
                {/* Clear reading list filter button (All Books) */}
                <button
                  type="button"
                  onClick={() => setActiveReadingListId(null)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 select-none ${
                    activeReadingListId === null
                      ? "bg-[#6D4C41] text-white shadow-sm border border-[#6D4C41]"
                      : "bg-white text-[#6D4C41] border border-[#E6E0D4] hover:bg-amber-50/50"
                  }`}
                >
                  <span>كل كتب القسم</span>
                </button>

                {readingLists.map((list) => {
                  const isActive = activeReadingListId === list.id;
                  return (
                    <div
                      key={list.id}
                      className="inline-flex items-center gap-1"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveReadingListId(isActive ? null : list.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 select-none ${
                          isActive
                            ? "bg-[#5A5A40] text-[#FAF6EE] shadow-sm border border-[#5A5A40]"
                            : "bg-white text-[#6D4C41] border border-[#E6E0D4] hover:bg-[#FAF5EC]"
                        }`}
                      >
                        <span>📂</span>
                        <span>{list.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
                          isActive ? "bg-white/20 text-white" : "bg-[#5A5A40]/10 text-[#5A5A40]"
                        }`}>
                          {list.bookIds.length}
                        </span>
                      </button>

                      {/* Delete Reading List Button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteReadingList(list.id, e)}
                        className="p-1 rounded-full text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        title="حذف القائمة"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sorting and Tagging Controls Row */}
          <div className="mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between p-4 bg-[#FAF5EC]/70 rounded-2xl border border-[#E6E0D4] text-xs">
            {/* Search Input */}
            <div className="relative w-full lg:w-80 flex items-center" dir={language === "en" ? "ltr" : "rtl"}>
              <input
                type="text"
                placeholder={language === "en" ? "Search by book title or author..." : "ابحث عن اسم الكتاب أو المؤلف..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-white border border-[#E6E0D4] rounded-xl py-2 text-xs text-[#4A3B32] font-semibold placeholder-[#8D7B68]/50 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/35 focus:border-[#5A5A40] transition-all ${
                  language === "en" ? "pl-8 pr-16 text-left" : "pl-16 pr-8 text-right"
                }`}
                dir={language === "en" ? "ltr" : "rtl"}
              />
              <div className={`absolute top-1/2 -translate-y-1/2 text-[#8D7B68]/60 pointer-events-none ${
                language === "en" ? "right-3" : "left-3"
              }`}>
                <Search className="w-4 h-4" />
              </div>
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all duration-300 ${
                  isListening 
                    ? "text-[#D32F2F] bg-red-50 hover:bg-red-100 animate-pulse scale-110 ring-2 ring-red-300" 
                    : "text-[#8D7B68]/60 hover:text-[#5A5A40] hover:bg-[#FAF5EC]"
                } ${
                  language === "en" ? "right-9" : "left-9"
                }`}
                title={isListening ? (language === "en" ? "Stop Voice Search" : "إيقاف البحث الصوتي") : (language === "en" ? "Smart Voice Search (Arabic)" : "البحث الصوتي الذكي (بالعربية)")}
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className={`absolute top-1/2 -translate-y-1/2 text-[#8D7B68]/60 hover:text-[#9E4233] transition-colors ${
                    language === "en" ? "left-3" : "right-3"
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className={`flex flex-wrap items-center gap-3 w-full lg:w-auto ${language === "en" ? "justify-start flex-row" : "justify-end flex-row-reverse"}`}>
              <span className="font-bold text-[#6D4C41] shrink-0">
                {language === "en" ? "۞ Filter & Sort Options:" : "۞ خيارات التصفية والفرز:"}
              </span>
              
              <div className={`flex items-center gap-1.5 ${language === "en" ? "flex-row" : "flex-row-reverse"}`}>
                <label className="text-[#8D7B68] font-medium whitespace-nowrap">
                  {language === "en" ? "Sort by:" : "الفرز حسب:"}
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "date" | "alphabet")}
                  className="bg-white border border-[#E6E0D4] rounded-lg px-2.5 py-1.5 text-[#4A3B32] font-semibold focus:outline-none focus:ring-1 focus:ring-[#5A5A40] cursor-pointer"
                >
                  <option value="date">{language === "en" ? "Date Added (Newest First)" : "تاريخ الإضافة (الأحدث أولاً)"}</option>
                  <option value="alphabet">{language === "en" ? "Alphabetical Order (A - Z)" : "الترتيب الأبجدي (أ - ي)"}</option>
                </select>
              </div>

              {allUniqueTags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-row-reverse">
                  <label className="text-[#8D7B68] font-medium whitespace-nowrap">المجموعة / الوسم:</label>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="bg-white border border-[#E6E0D4] rounded-lg px-2.5 py-1.5 text-[#4A3B32] font-semibold focus:outline-none focus:ring-1 focus:ring-[#5A5A40] cursor-pointer"
                  >
                    <option value="all">كل المجموعات والوسوم</option>
                    {allUniqueTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="text-[#8D7B68] text-[11px] font-medium text-right lg:text-left w-full lg:w-auto">
              عدد الكتب المعروضة: <span className="font-bold text-[#9E4233]">{sortedAndFilteredBooks.length}</span> كتاب
            </div>
          </div>

          <h2 className="text-xl font-bold text-[#4A3B32] font-serif mb-8 flex items-center gap-2 flex-row-reverse">
            <BookOpen className="w-5.5 h-5.5 text-[#9E4233]" />
            <span>
              {activeTab === "all" && "رفوف القراءة الخاصة بك"}
              {activeTab === "curriculum" && (
                selectedCurriculumStage === "all"
                  ? "مناهج وزارة التربية والتعليم"
                  : `مناهج وزارة التربية والتعليم • ${selectedCurriculumStage}`
              )}
              {activeTab === "children" && (
                selectedChildrenSection === "all"
                  ? "كتب للأطفال والبراعم"
                  : `كتب للأطفال والبراعم • قصص ${selectedChildrenSection}`
              )}
              {activeTab === "religious" && "المكتبة الإسلامية والدينية"}
              {activeTab === "general" && "الكتب العامة والروايات الأدبية"}
              {selectedTag !== "all" && ` • مجموعة (${selectedTag})`}
            </span>
          </h2>
          {activeTab === "all" && searchQuery.trim() === "" ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-y-12 sm:gap-y-16 gap-x-4 sm:gap-x-6 md:gap-x-8">
              {/* Render the 4 main departments as physical Books on the shelf */}
              {[
                {
                  id: "curriculum",
                  title: language === "en" ? "Ministry of Education Curriculums" : "مناهج وزارة التربية والتعليم",
                  description: language === "en" ? "Official school curricula and educational books for various educational stages in Sudan." : "المناهج المدرسية الرسمية والكتب التعليمية لمختلف المراحل الدراسية في السودان.",
                  icon: "🏫",
                  badge: language === "en" ? "Academic Library" : "المكتبة الأكاديمية",
                  count: books.filter(b => b.category === "curriculum").length,
                  bg: "bg-gradient-to-br from-[#1b4d3e] to-[#0f2d24]",
                  banner: "bg-[#FFD54F] text-stone-900 font-extrabold",
                  accent: "border-[#FFD54F]/50 text-[#FFD54F]",
                  motif: "🎓",
                  leaningClass: "origin-bottom -rotate-3 hover:rotate-0 hover:scale-105 hover:-translate-y-3"
                },
                {
                  id: "children",
                  title: language === "en" ? "Children's Books & Stories" : "كتب وحكايات الأطفال",
                  description: language === "en" ? "The kingdom of little ones! Picture stories and exciting adventures to nourish children's minds." : "مملكة الصغار! قصص مصورة ومغامرات شيقة وممتعة تنمي عقول أبطالنا وبراعمنا.",
                  icon: "🧸⭐🎈",
                  badge: language === "en" ? "Kids Kingdom 🎈" : "مملكة البراعم 🎈",
                  count: books.filter(b => b.category === "children").length,
                  bg: "bg-gradient-to-br from-[#FF4E50] via-[#F9D423] to-[#FF4E50]", // Bright vibrant warm candy gradient
                  banner: "bg-white text-rose-600 font-extrabold shadow-md border-2 border-rose-100 animate-pulse",
                  accent: "border-white/65 text-yellow-300",
                  motif: "🧸",
                  leaningClass: "origin-bottom rotate-3 hover:rotate-0 hover:scale-105 hover:-translate-y-3",
                  isKids: true
                },
                {
                  id: "religious",
                  title: language === "en" ? "Islamic & Religious Library" : "المكتبة الدينية والشرعية",
                  description: language === "en" ? "Holy Qurans, Tafsir, Prophet's Biography, and manuscripts of Islamic sciences." : "المصاحف الشريفة، التفسير، السيرة النبوية العطرة، ومخطوطات العلوم الشرعية.",
                  icon: "🕌",
                  badge: language === "en" ? "Islamic Sciences" : "العلوم الإسلامية",
                  count: books.filter(b => b.category === "religious").length,
                  bg: "bg-gradient-to-br from-[#06331e] via-[#0b5331] to-[#041a10]",
                  banner: "bg-[#D4A373] text-stone-900 font-bold",
                  accent: "border-[#D4A373]/60 text-amber-200",
                  motif: "🕌",
                  leaningClass: "origin-bottom -rotate-1.5 hover:rotate-0 hover:scale-105 hover:-translate-y-3"
                },
                {
                  id: "general",
                  title: language === "en" ? "General Books & Literary Novels" : "الكتب العامة وروايات الأدب",
                  description: language === "en" ? "International and local novels, timeless Arabic and Sudanese poetry, and cultural books." : "روايات عالمية ومحلية، دواوين الشعر العربي والسوداني الخالد، وكتب التاريخ والثقافة.",
                  icon: "🖋️",
                  badge: language === "en" ? "Literature & Culture" : "الأدب والثقافة",
                  count: books.filter(b => b.category === "general" || !b.category).length,
                  bg: "bg-gradient-to-br from-[#5D4037] to-[#2B1B17]",
                  banner: "bg-[#9E4233] text-white font-bold",
                  accent: "border-[#D4A373]/50 text-amber-100",
                  motif: "🖋️",
                  leaningClass: "origin-bottom rotate-2 hover:rotate-0 hover:scale-105 hover:-translate-y-3"
                }
              ].map((dept) => {
                return (
                  <div key={dept.id} className="flex flex-col group relative pb-10">
                    <div className="relative aspect-[3/4] w-full z-10">
                      <div 
                        onClick={() => {
                          setActiveTab(dept.id);
                          setSelectedTag("all");
                        }}
                        className={`cursor-pointer absolute inset-0 rounded-r-xl rounded-l-md shadow-lg hover:shadow-2xl transition-all duration-300 transform preserve-3d overflow-hidden flex flex-col justify-between p-4 border-r border-[#ffffff30] z-10 ${dept.leaningClass} ${
                          dept.isKids ? "ring-4 ring-yellow-400/30 hover:ring-yellow-400/60 transition-all duration-300" : ""
                        }`}
                      >
                        <div className={`absolute inset-0 ${dept.bg} z-0`}></div>
                        
                        {/* Playful floating elements for kids category */}
                        {dept.isKids && (
                          <>
                            <div className="absolute top-1 right-1 text-2xl animate-bounce z-20" style={{ animationDuration: "3s" }}>🎈</div>
                            <div className="absolute bottom-2 left-1 text-2xl animate-spin z-20" style={{ animationDuration: "12s" }}>⭐</div>
                          </>
                        )}

                        <div className="absolute inset-2 border-2 border-dashed border-white/20 rounded-lg z-0 pointer-events-none"></div>
                        <div className="absolute left-0 top-0 bottom-0 w-3.5 bg-gradient-to-r from-black/55 to-transparent z-10"></div>
                        <div className="absolute left-[3px] top-0 bottom-0 w-[1px] bg-white/20 z-10"></div>

                        <div className="relative z-10 flex-1 flex flex-col justify-between h-full">
                          <div className={`py-1 px-2 rounded-md text-center text-[10px] font-extrabold tracking-wider ${dept.banner} truncate uppercase max-w-full`}>
                            {dept.badge}
                          </div>

                          <div className="my-auto text-center py-2 px-1">
                            <span className="text-3xl filter drop-shadow mb-2 block">{dept.icon}</span>
                            <p className="font-serif font-extrabold text-xs md:text-sm text-yellow-50 leading-snug tracking-wide line-clamp-2">
                              {dept.title}
                            </p>
                            <p className="text-[10px] text-amber-100/70 mt-1 line-clamp-2 leading-relaxed hidden sm:block">
                              {dept.description}
                            </p>
                          </div>

                          <div className="mx-auto mt-2 text-center">
                            <span className="inline-block px-3 py-1 bg-black/30 rounded-full border border-white/10 text-[10px] font-bold text-amber-200">
                              📚 {dept.count} كتاباً متاحاً
                            </span>
                          </div>
                        </div>

                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-white/30 to-transparent z-10"></div>
                      </div>

                      {/* Wooden Shelf */}
                      <div className="absolute bottom-[-14px] left-[-12px] right-[-12px] md:left-[-16px] md:right-[-16px] h-6 bg-gradient-to-b from-[#A05C3F] via-[#7B3F27] to-[#4A2010] rounded-sm shadow-[0_12px_18px_rgba(0,0,0,0.55),0_3px_5px_rgba(0,0,0,0.25)] z-0 border-b border-black/50">
                        <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#C18260] opacity-80 border-b border-black/25"></div>
                        <div className="absolute inset-0 bg-repeat-x bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:25px_100%] opacity-25"></div>
                      </div>
                    </div>

                    <div className="mt-8 text-right z-10 px-1">
                      <h3 className={`font-bold text-xs line-clamp-1 text-[#4A3B32] ${dept.isKids ? "text-rose-600 font-extrabold text-sm" : ""}`}>
                        {dept.title}
                      </h3>
                      <p className="text-[10px] opacity-75 line-clamp-1 mt-0.5">
                        اضغط لفتح هذا القسم وتصفحه
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeTab === "curriculum" && selectedCurriculumStage === "all" && searchQuery.trim() === "" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-12 sm:gap-y-16 gap-x-4 sm:gap-x-6 md:gap-x-8">
              {/* Return Card inside curriculum list */}
              <div className="flex flex-col group relative pb-10 animate-fade-in">
                <div className="relative aspect-[3/4] w-full z-10">
                  <div 
                    onClick={() => {
                      setActiveTab("all");
                      setSelectedTag("all");
                    }}
                    className="cursor-pointer absolute inset-0 rounded-r-xl rounded-l-md shadow-lg hover:shadow-2xl transition-all duration-300 transform preserve-3d overflow-hidden flex flex-col justify-between p-4 border-r border-[#ffffff30] z-10 origin-bottom -rotate-3 hover:rotate-0 hover:scale-105 hover:-translate-y-3 bg-gradient-to-br from-[#735F53] to-[#45372E] text-white border-2 border-[#FAF5EC]/20"
                  >
                    <div className="absolute inset-0 bg-[#4A3B32]/10 z-0"></div>
                    <div className="absolute inset-2 border border-dashed border-white/20 rounded-md z-0 pointer-events-none"></div>
                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/55 to-transparent z-10"></div>
                    
                    <div className="relative z-10 flex-1 flex flex-col justify-between h-full">
                      <div className="py-1 px-1.5 rounded-md text-center bg-white/20 text-[9px] font-extrabold tracking-wider text-amber-100 truncate">
                        {language === "en" ? "Main Departments" : "الأقسام الرئيسية"}
                      </div>
                      
                      <div className="my-auto text-center py-2 px-1 flex flex-col items-center">
                        <span className="text-3xl animate-bounce">↩</span>
                        <p className="font-serif font-extrabold text-xs md:text-sm text-yellow-50 leading-snug mt-2">
                          {language === "en" ? "Back to Main Shelf" : "الرجوع للرف الرئيسي"}
                        </p>
                        <p className="text-[9px] text-amber-200/80 mt-1 leading-normal">
                          {language === "en" ? "Browse other departments" : "تصفح باقي الأقسام"}
                        </p>
                      </div>
                      
                      <div className="mx-auto mt-2 text-center">
                        <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center bg-black/10 text-amber-300/60">
                          <span className="text-[10px]">۞</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Wooden Shelf */}
                  <div className="absolute bottom-[-14px] left-[-12px] right-[-12px] md:left-[-16px] md:right-[-16px] h-6 bg-gradient-to-b from-[#A05C3F] via-[#7B3F27] to-[#4A2010] rounded-sm shadow-[0_12px_18px_rgba(0,0,0,0.55),0_3px_5px_rgba(0,0,0,0.25)] z-0 border-b border-black/50">
                    <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#C18260] opacity-80 border-b border-black/25"></div>
                  </div>
                </div>
                
                <div className="mt-8 text-right z-10 px-1">
                  <h3 className="font-bold text-xs text-[#6D4C41]">
                    {language === "en" ? "Back to Main Shelf" : "رجوع للرف الرئيسي"}
                  </h3>
                  <p className="text-[10px] opacity-75">
                    {language === "en" ? "Browse other shelves & departments" : "تصفح الرفوف والأقسام الأخرى"}
                  </p>
                </div>
              </div>

              {[
                { id: "الروضة الأولى", title: "الروضة الأولى", level: "مرحلة الرياض", icon: "🧸", bg: "from-[#FF8D80] to-[#E53935]" },
                { id: "الروضة الثانية", title: "الروضة الثانية", level: "مرحلة الرياض", icon: "🎨", bg: "from-[#FFA726] to-[#FB8C00]" },
                { id: "الروضة الثالثة", title: "الروضة الثالثة", level: "التمهيدي", icon: "✏️", bg: "from-[#FFEE58] to-[#FDD835]" },
                { id: "الصف الأول الابتدائي", title: "الصف الأول الابتدائي", level: "الابتدائي", icon: "🎒", bg: "from-[#66BB6A] to-[#43A047]" },
                { id: "الصف الثاني الابتدائي", title: "الصف الثاني الابتدائي", level: "الابتدائي", icon: "📖", bg: "from-[#4CAF50] to-[#2E7D32]" },
                { id: "الصف الثالث الابتدائي", title: "الصف الثالث الابتدائي", level: "الابتدائي", icon: "📝", bg: "from-[#26A69A] to-[#00897B]" },
                { id: "الصف الرابع الابتدائي", title: "الصف الرابع الابتدائي", level: "الابتدائي", icon: "📐", bg: "from-[#26C6DA] to-[#00ACC1]" },
                { id: "الصف الخامس الابتدائي", title: "الصف الخامس الابتدائي", level: "الابتدائي", icon: "🎨", bg: "from-[#42A5F5] to-[#1E88E5]" },
                { id: "الصف السادس الابتدائي", title: "الصف السادس الابتدائي", level: "الابتدائي", icon: "🧬", bg: "from-[#5C6BC0] to-[#3949AB]" },
                { id: "أولى متوسط", title: "أولى متوسط", level: "المتوسط", icon: "🧠", bg: "from-[#7E57C2] to-[#5E35B1]" },
                { id: "ثاني متوسط", title: "ثاني متوسط", level: "المتوسط", icon: "📐", bg: "from-[#AB47BC] to-[#8E24AA]" },
                { id: "ثالث متوسط", title: "ثالث متوسط", level: "المتوسط", icon: "🔬", bg: "from-[#EC407A] to-[#D81B60]" },
                { id: "الأول ثانوي", title: "الأول ثانوي", level: "الثانوي", icon: "📐", bg: "from-[#8D6E63] to-[#5D4037]" },
                { id: "الثاني ثانوي", title: "الثاني ثانوي", level: "الثانوي", icon: "🧪", bg: "from-[#78909C] to-[#546E7A]" },
                { id: "الثالث ثانوي", title: "الثالث ثانوي", level: "الثانوي", icon: "🔬", bg: "from-[#3E2723] to-[#271510]" }
              ].map((stage, sIdx) => {
                const count = books.filter(b => b.category === "curriculum" && getBookCurriculumStage(b) === stage.id).length;
                let leaningClass = "";
                if (sIdx % 3 === 0) {
                  leaningClass = "origin-bottom -rotate-3 hover:rotate-0 hover:scale-105 hover:-translate-y-3";
                } else if (sIdx % 3 === 1) {
                  leaningClass = "origin-bottom rotate-3 hover:rotate-0 hover:scale-105 hover:-translate-y-3";
                } else {
                  leaningClass = "origin-bottom rotate-1 hover:rotate-0 hover:scale-105 hover:-translate-y-3";
                }

                return (
                  <div key={stage.id} className="flex flex-col group relative pb-10 animate-fade-in">
                    <div className="relative aspect-[3/4] w-full z-10">
                      <div 
                        onClick={() => {
                          setSelectedCurriculumStage(stage.id);
                        }}
                        className={`cursor-pointer absolute inset-0 rounded-r-xl rounded-l-md shadow-lg hover:shadow-2xl transition-all duration-300 transform preserve-3d overflow-hidden flex flex-col justify-between p-4 border-r border-[#ffffff30] z-10 ${leaningClass}`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${stage.bg} z-0`}></div>
                        <div className="absolute inset-2 border border-dashed border-white/20 rounded-md z-0 pointer-events-none"></div>
                        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/55 to-transparent z-10"></div>
                        <div className="absolute left-[2px] top-0 bottom-0 w-[0.5px] bg-white/25 z-10"></div>

                        <div className="relative z-10 flex-1 flex flex-col justify-between h-full">
                          <div className="py-1 px-1.5 rounded bg-white/20 text-[9px] font-extrabold text-white text-center truncate shadow-xs">
                            {stage.level}
                          </div>

                          <div className="my-auto text-center py-2 px-1">
                            <span className="text-3xl filter drop-shadow mb-2 block">{stage.icon}</span>
                            <p className="font-serif font-extrabold text-xs md:text-sm text-white leading-snug tracking-wide line-clamp-2">
                              {stage.title}
                            </p>
                          </div>

                          <div className="mx-auto mt-2 text-center">
                            <span className="inline-block px-2.5 py-0.5 bg-black/30 rounded-full border border-white/10 text-[9px] font-bold text-amber-200">
                              📚 {count} كتب
                            </span>
                          </div>
                        </div>

                        <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-gradient-to-l from-white/30 to-transparent z-10"></div>
                      </div>

                      {/* Wooden Shelf */}
                      <div className="absolute bottom-[-14px] left-[-12px] right-[-12px] md:left-[-16px] md:right-[-16px] h-6 bg-gradient-to-b from-[#A05C3F] via-[#7B3F27] to-[#4A2010] rounded-sm shadow-[0_12px_18px_rgba(0,0,0,0.55),0_3px_5px_rgba(0,0,0,0.25)] z-0 border-b border-black/50">
                        <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#C18260] opacity-80 border-b border-black/25"></div>
                      </div>
                    </div>

                    <div className="mt-8 text-right z-10 px-1">
                      <h3 className="font-bold text-xs text-[#4A3B32] line-clamp-1">{stage.title}</h3>
                      <p className="text-[10px] opacity-75 line-clamp-1 mt-0.5">اضغط لتصفح كتب هذا القسم</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeTab === "children" && selectedChildrenSection === "all" && searchQuery.trim() === "" ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-y-12 sm:gap-y-16 gap-x-4 sm:gap-x-6 md:gap-x-8">
              {/* Return Card inside children list */}
              <div className="flex flex-col group relative pb-10 animate-fade-in">
                <div className="relative aspect-[3/4] w-full z-10">
                  <div 
                    onClick={() => {
                      setActiveTab("all");
                      setSelectedTag("all");
                    }}
                    className="cursor-pointer absolute inset-0 rounded-r-xl rounded-l-md shadow-lg hover:shadow-2xl transition-all duration-300 transform preserve-3d overflow-hidden flex flex-col justify-between p-4 border-r border-[#ffffff30] z-10 origin-bottom -rotate-3 hover:rotate-0 hover:scale-105 hover:-translate-y-3 bg-gradient-to-br from-[#735F53] to-[#45372E] text-white border-2 border-[#FAF5EC]/20"
                  >
                    <div className="absolute inset-0 bg-[#4A3B32]/10 z-0"></div>
                    <div className="absolute inset-2 border border-dashed border-white/20 rounded-md z-0 pointer-events-none"></div>
                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/55 to-transparent z-10"></div>
                    
                    <div className="relative z-10 flex-1 flex flex-col justify-between h-full">
                      <div className="py-1 px-1.5 rounded-md text-center bg-white/20 text-[9px] font-extrabold tracking-wider text-amber-100 truncate">
                        {language === "en" ? "Main Departments" : "الأقسام الرئيسية"}
                      </div>
                      
                      <div className="my-auto text-center py-2 px-1 flex flex-col items-center">
                        <span className="text-3xl animate-bounce">↩</span>
                        <p className="font-serif font-extrabold text-xs md:text-sm text-yellow-50 leading-snug mt-2">
                          {language === "en" ? "Back to Main Shelf" : "الرجوع للرف الرئيسي"}
                        </p>
                        <p className="text-[9px] text-amber-200/80 mt-1 leading-normal">
                          {language === "en" ? "Browse other departments" : "تصفح باقي الأقسام"}
                        </p>
                      </div>
                      
                      <div className="mx-auto mt-2 text-center">
                        <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center bg-black/10 text-amber-300/60">
                          <span className="text-[10px]">۞</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Wooden Shelf */}
                  <div className="absolute bottom-[-14px] left-[-12px] right-[-12px] md:left-[-16px] md:right-[-16px] h-6 bg-gradient-to-b from-[#A05C3F] via-[#7B3F27] to-[#4A2010] rounded-sm shadow-[0_12px_18px_rgba(0,0,0,0.55),0_3px_5px_rgba(0,0,0,0.25)] z-0 border-b border-black/50">
                    <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#C18260] opacity-80 border-b border-black/25"></div>
                  </div>
                </div>
                
                <div className="mt-8 text-right z-10 px-1">
                  <h3 className="font-bold text-xs text-[#6D4C41]">
                    {language === "en" ? "Back to Main Shelf" : "رجوع للرف الرئيسي"}
                  </h3>
                  <p className="text-[10px] opacity-75">
                    {language === "en" ? "Browse other shelves & departments" : "تصفح الرفوف والأقسام الأخرى"}
                  </p>
                </div>
              </div>

              {[
                { id: "عربي", title: language === "en" ? "Stories in Arabic" : "قصص باللغة العربية", level: language === "en" ? "Arabic" : "عربي", icon: "🦁", bg: "from-amber-500 to-amber-700" },
                { id: "انجليزي", title: language === "en" ? "Stories in English" : "قصص باللغة الإنجليزية", level: language === "en" ? "English" : "انجليزي", icon: "🧸", bg: "from-indigo-500 to-indigo-700" },
                { id: "باللهجة السودانية", title: language === "en" ? "Tales in Sudanese Dialect" : "حكايات باللهجة السودانية", level: language === "en" ? "Sudanese" : "سوداني", icon: "🇸🇩", bg: "from-emerald-600 to-emerald-800" },
                { id: "تاريخ", title: language === "en" ? "Historical Tales & Civilization" : "قصص تاريخية وحضارة", level: language === "en" ? "History" : "تاريخ", icon: "⏳", bg: "from-orange-800 to-amber-950" }
              ].map((stage, sIdx) => {
                const count = books.filter(b => b.category === "children" && getBookChildrenSection(b) === stage.id).length;
                let leaningClass = "";
                if (sIdx % 3 === 0) {
                  leaningClass = "origin-bottom -rotate-3 hover:rotate-0 hover:scale-105 hover:-translate-y-3";
                } else if (sIdx % 3 === 1) {
                  leaningClass = "origin-bottom rotate-3 hover:rotate-0 hover:scale-105 hover:-translate-y-3";
                } else {
                  leaningClass = "origin-bottom rotate-1 hover:rotate-0 hover:scale-105 hover:-translate-y-3";
                }

                return (
                  <div key={stage.id} className="flex flex-col group relative pb-10 animate-fade-in">
                    <div className="relative aspect-[3/4] w-full z-10">
                      <div 
                        onClick={() => {
                          setSelectedChildrenSection(stage.id);
                        }}
                        className={`cursor-pointer absolute inset-0 rounded-r-xl rounded-l-md shadow-lg hover:shadow-2xl transition-all duration-300 transform preserve-3d overflow-hidden flex flex-col justify-between p-4 border-r border-[#ffffff30] z-10 ${leaningClass}`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${stage.bg} z-0`}></div>
                        <div className="absolute inset-2 border border-dashed border-white/20 rounded-md z-0 pointer-events-none"></div>
                        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/55 to-transparent z-10"></div>
                        <div className="absolute left-[2px] top-0 bottom-0 w-[0.5px] bg-white/25 z-10"></div>

                        <div className="relative z-10 flex-1 flex flex-col justify-between h-full">
                          <div className="py-1 px-1.5 rounded bg-white/20 text-[9px] font-extrabold text-white text-center truncate shadow-xs">
                            {stage.level}
                          </div>

                          <div className="my-auto text-center py-2 px-1">
                            <span className="text-3xl filter drop-shadow mb-2 block">{stage.icon}</span>
                            <p className="font-serif font-extrabold text-xs md:text-sm text-white leading-snug tracking-wide line-clamp-2">
                              {stage.title}
                            </p>
                          </div>

                          <div className="mx-auto mt-2 text-center">
                            <span className="inline-block px-2.5 py-0.5 bg-black/30 rounded-full border border-white/10 text-[9px] font-bold text-amber-200">
                              📚 {count} {language === "en" ? (count === 1 ? "book" : "books") : "كتب"}
                            </span>
                          </div>
                        </div>

                        <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-gradient-to-l from-white/30 to-transparent z-10"></div>
                      </div>

                      {/* Wooden Shelf */}
                      <div className="absolute bottom-[-14px] left-[-12px] right-[-12px] md:left-[-16px] md:right-[-16px] h-6 bg-gradient-to-b from-[#A05C3F] via-[#7B3F27] to-[#4A2010] rounded-sm shadow-[0_12px_18px_rgba(0,0,0,0.55),0_3px_5px_rgba(0,0,0,0.25)] z-0 border-b border-black/50">
                        <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#C18260] opacity-80 border-b border-black/25"></div>
                      </div>
                    </div>

                    <div className="mt-8 text-right z-10 px-1">
                      <h3 className="font-bold text-xs text-[#4A3B32] line-clamp-1">{stage.title}</h3>
                      <p className="text-[10px] opacity-75 line-clamp-1 mt-0.5">اضغط لتصفح كتب هذا القسم</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : sortedAndFilteredBooks.length === 0 ? (
            <div className="text-center py-16 px-4 bg-[#FAF5EC]/40 rounded-3xl border border-[#E6E0D4] border-dashed">
              <span className="text-3xl">📭</span>
              <p className="text-xs font-bold text-[#8D7B68] mt-3">
                {language === "en" ? "No books match the current filter options." : "لا توجد كتب مطابقة لخيارات التصفية الحالية."}
              </p>
              <p className="text-[11px] text-[#8D7B68]/70 mt-1">
                {language === "en" ? "Click the add buttons above or reset filters to view books!" : "انقر على أزرار الإضافة في الأعلى لملء هذا الرف!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-12 sm:gap-y-16 gap-x-4 sm:gap-x-6 md:gap-x-8">
              
              {/* Show Return/Back Book Card inside filtered category views */}
              {activeTab !== "all" && searchQuery.trim() === "" && (
                <div className="flex flex-col group relative pb-10 animate-fade-in">
                  <div className="relative aspect-[3/4] w-full z-10">
                    <div 
                      onClick={() => {
                        if (activeTab === "curriculum" && selectedCurriculumStage !== "all") {
                          setSelectedCurriculumStage("all");
                        } else if (activeTab === "children" && selectedChildrenSection !== "all") {
                          setSelectedChildrenSection("all");
                        } else {
                          setActiveTab("all");
                          setSelectedTag("all");
                        }
                      }}
                      className="cursor-pointer absolute inset-0 rounded-r-xl rounded-l-md shadow-lg hover:shadow-2xl transition-all duration-300 transform preserve-3d overflow-hidden flex flex-col justify-between p-4 border-r border-[#ffffff30] z-10 origin-bottom -rotate-3 hover:rotate-0 hover:scale-105 hover:-translate-y-3 bg-gradient-to-br from-[#735F53] to-[#45372E] text-white border-2 border-[#FAF5EC]/20"
                    >
                      <div className="absolute inset-0 bg-[#4A3B32]/10 z-0"></div>
                      <div className="absolute inset-2 border border-dashed border-white/20 rounded-md z-0 pointer-events-none"></div>
                      <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/55 to-transparent z-10"></div>
                      
                      <div className="relative z-10 flex-1 flex flex-col justify-between h-full">
                        <div className="py-1 px-1.5 rounded-md text-center bg-white/20 text-[9px] font-extrabold tracking-wider text-amber-100 truncate">
                          {activeTab === "curriculum" && selectedCurriculumStage !== "all" 
                            ? (language === "en" ? "Ministry Curriculums" : "مناهج وزارة التربية") 
                            : activeTab === "children" && selectedChildrenSection !== "all"
                            ? (language === "en" ? "Kids Stories" : "قصص وحكايات الأطفال")
                            : (language === "en" ? "Main Shelves" : "رفوف الأقسام الرئيسية")}
                        </div>
                        
                        <div className="my-auto text-center py-2 px-1 flex flex-col items-center">
                          <span className="text-3xl animate-bounce">↩</span>
                          <p className="font-serif font-extrabold text-xs md:text-sm text-yellow-50 leading-snug mt-2">
                            {activeTab === "curriculum" && selectedCurriculumStage !== "all" 
                              ? (language === "en" ? "Back to Grade Levels" : "الرجوع للمراحل الدراسية") 
                              : activeTab === "children" && selectedChildrenSection !== "all"
                              ? (language === "en" ? "Back to Kids Sections" : "الرجوع لأقسام الأطفال")
                              : (language === "en" ? "Back to Main Shelf" : "الرجوع للرف الرئيسي")}
                          </p>
                          <p className="text-[9px] text-amber-200/80 mt-1 leading-normal">
                            {activeTab === "curriculum" && selectedCurriculumStage !== "all" 
                              ? (language === "en" ? "Browse other grades & stages" : "تصفح باقي الصفوف والمراحل") 
                              : activeTab === "children" && selectedChildrenSection !== "all"
                              ? (language === "en" ? "Browse other story categories" : "تصفح باقي تصنيفات حكايات الأطفال")
                              : (language === "en" ? "Browse other categories" : "تصفح باقي التصنيفات")}
                          </p>
                        </div>
                        
                        <div className="mx-auto mt-2 text-center">
                          <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center bg-black/10 text-amber-300/60">
                            <span className="text-[10px]">۞</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Wooden Shelf */}
                    <div className="absolute bottom-[-14px] left-[-12px] right-[-12px] md:left-[-16px] md:right-[-16px] h-6 bg-gradient-to-b from-[#A05C3F] via-[#7B3F27] to-[#4A2010] rounded-sm shadow-[0_12px_18px_rgba(0,0,0,0.55),0_3px_5px_rgba(0,0,0,0.25)] z-0 border-b border-black/50">
                      <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#C18260] opacity-80 border-b border-black/25"></div>
                    </div>
                  </div>
                  
                  <div className="mt-8 text-right z-10 px-1">
                    <h3 className="font-bold text-xs text-[#6D4C41]">
                      {activeTab === "curriculum" && selectedCurriculumStage !== "all" 
                        ? (language === "en" ? "Back to Grade Levels" : "رجوع للمراحل الدراسية") 
                        : activeTab === "children" && selectedChildrenSection !== "all"
                        ? (language === "en" ? "Back to Kids Sections" : "رجوع لأقسام الأطفال")
                        : (language === "en" ? "Back to Main Shelf" : "رجوع للرف الرئيسي")}
                    </h3>
                    <p className="text-[10px] opacity-75">
                      {activeTab === "curriculum" && selectedCurriculumStage !== "all" 
                        ? (language === "en" ? "Browse school grades & academic stages" : "تصفح الصفوف والمراحل التعليمية") 
                        : activeTab === "children" && selectedChildrenSection !== "all"
                        ? (language === "en" ? "Browse children story sections" : "تصفح تصنيفات قصص الأطفال")
                        : (language === "en" ? "Browse other shelves & departments" : "تصفح الرفوف والأقسام الأخرى")}
                    </p>
                  </div>
                </div>
              )}

              {sortedAndFilteredBooks.map((book, idx) => {
                const colors = getTraditionalCoverColors(book.title, book.id, book.category);
                const isKidsBook = book.category === "children";
                
                // Determine leaning styles for books to make them look like cozy physical books
                let leaningClass = "";
                if (idx % 3 === 0) {
                  // Leans slightly left
                  leaningClass = "origin-bottom -rotate-4 hover:rotate-0 hover:scale-105 hover:-translate-y-3";
                } else if (idx % 3 === 1) {
                  // Leans slightly right
                  leaningClass = "origin-bottom rotate-4 hover:rotate-0 hover:scale-105 hover:-translate-y-3";
                } else {
                  // Stands almost straight but tilted slightly back/left
                  leaningClass = "origin-bottom rotate-1.5 hover:rotate-0 hover:scale-105 hover:-translate-y-3";
                }

                return (
                <div 
                  key={book.id} 
                  className={`flex flex-col group relative pb-10 ${isKidsBook ? "animate-fade-in" : ""}`}
                >
                  {/* Container of book cover standing on top of the shelf */}
                  <div className="relative aspect-[3/4] w-full z-10">
                    {/* The stylized 3D realistic book spine & cover cover */}
                    <div 
                      onMouseDown={() => handleBookMouseDown(book)}
                      onMouseUp={(e) => handleBookMouseUp(e, book)}
                      onMouseLeave={handleBookMouseLeave}
                      onTouchStart={() => handleBookTouchStart(book)}
                      onTouchEnd={(e) => handleBookTouchEnd(e)}
                      onTouchMove={handleBookMouseLeave}
                      className={`cursor-pointer absolute inset-0 rounded-r-lg rounded-l-md shadow-lg hover:shadow-2xl transition-all duration-300 transform preserve-3d overflow-hidden flex flex-col justify-between p-3.5 border-r border-[#ffffff30] z-10 ${leaningClass} ${
                        isKidsBook ? "ring-2 ring-yellow-300/40 hover:ring-yellow-300/80 shadow-rose-300/25" : ""
                      }`}
                    >
                      {/* The Cover gradient and background pattern */}
                      <div className={`absolute inset-0 ${colors.bg} z-0`}></div>
                      
                      {/* Favorite Heart Button on the top left of the card */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(book.id, e)}
                        className="absolute top-2.5 left-2.5 z-30 p-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xs border border-white/10 transition-all duration-200"
                        title={favorites.includes(book.id) ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                      >
                        <Heart 
                          size={11} 
                          className={`transition-all duration-300 ${
                            favorites.includes(book.id) ? "fill-rose-500 text-rose-500 scale-110" : "text-white/80 hover:text-white"
                          }`} 
                        />
                      </button>

                      {/* Offline saved badge */}
                      {cachedBookIds.includes(book.id) && (
                        <div 
                          className="absolute top-2.5 right-2.5 z-30 flex items-center justify-center p-1 px-1.5 rounded-full bg-emerald-600/95 text-white text-[8px] font-extrabold gap-0.5 shadow-sm border border-emerald-500/20 leading-none select-none"
                          title="محفوظ ومتاح للقراءة بدون اتصال بالإنترنت"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <span className="text-[7px]">✓</span>
                          <span>دون اتصال</span>
                        </div>
                      )}
                      
                      {/* Playful Stickers on kids book cover */}
                      {isKidsBook && (
                        <>
                          <div className="absolute top-1 right-1 text-md animate-bounce z-20" style={{ animationDuration: "4s" }}>🎈</div>
                          <div className="absolute bottom-1 left-1 text-md animate-bounce z-20" style={{ animationDuration: "6s", animationDelay: "1.5s" }}>⭐</div>
                        </>
                      )}

                      {/* Ornamental Motif Background */}
                      <div className={`absolute inset-2 border border-dashed rounded-md z-0 pointer-events-none ${
                        isKidsBook ? "border-white/50" : "border-white/20"
                      }`}></div>
                      
                      <div className="absolute top-2 right-2 left-2 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
 
                      {/* Left Spine Thickness Shader for 3D Feel */}
                      <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/50 to-transparent z-10"></div>
                      <div className="absolute left-[3px] top-0 bottom-0 w-[1px] bg-white/20 z-10"></div>
 
                      {/* Cover Content Overlay */}
                      <div className="relative z-10 flex-1 flex flex-col justify-between">
                        
                        {/* Top banner / Sudanese pattern */}
                        <div className={`py-1 px-1.5 rounded-md text-center ${colors.banner} text-[9px] font-extrabold tracking-wider ${colors.text} truncate uppercase max-w-full`}>
                          {isKidsBook ? "🧸 حكاية الأذكياء" : (book.isCustom ? (book.fileSize ? `ملف محلي • ${book.fileSize}` : "رابط سحابي") : "مخطوطة عريقة")}
                        </div>
 
                        {/* Center Title */}
                        <div className="my-auto text-center py-2 px-1">
                          <p className={`font-serif font-extrabold text-xs md:text-sm leading-snug tracking-wide line-clamp-3 ${
                            isKidsBook ? "text-yellow-50 font-sans tracking-normal" : "text-amber-100"
                          }`}>
                            {book.title}
                          </p>
                          <p className={`text-[10px] mt-1.5 line-clamp-1 italic ${
                            isKidsBook ? "text-yellow-200/90 font-sans" : "text-amber-200/80"
                          }`}>
                            {book.author}
                          </p>
                        </div>
 
                        {/* Decorative medallion badge at the bottom with quick-preview info button */}
                        {isKidsBook ? (
                          <div className="mx-auto mt-2 text-center relative flex items-center justify-center w-full">
                            <div className="w-7 h-7 rounded-full border border-yellow-300 flex items-center justify-center bg-yellow-400/20 text-yellow-300 animate-pulse">
                              <span className="text-xs">⭐</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setPreviewBook(book);
                              }}
                              className="absolute left-1/2 translate-x-4 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center border border-white/20 text-[10px] transition-all"
                              title="تفاصيل الكتاب"
                            >
                              ℹ️
                            </button>
                          </div>
                        ) : (
                          <div className="mx-auto mt-2 text-center relative flex items-center justify-center w-full">
                            <div className={`w-7 h-7 rounded-full border ${colors.accent} flex items-center justify-center bg-black/10 text-amber-300/60`}>
                              <span className="text-[9px] font-mono">۞</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setPreviewBook(book);
                              }}
                              className="absolute left-1/2 translate-x-4.5 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center border border-white/20 text-[10px] transition-all"
                              title="تفاصيل الكتاب"
                            >
                              ℹ️
                            </button>
                          </div>
                        )}
 
                      </div>
 
                      {/* Book pages physical thickness edge shader (on the right) */}
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-white/30 to-transparent z-10"></div>
                    </div>
 
                    {/* Continuous 3D heavy acacia wooden shelf running directly underneath the standing books */}
                    <div className="absolute bottom-[-14px] left-[-12px] right-[-12px] md:left-[-16px] md:right-[-16px] h-6 bg-gradient-to-b from-[#A05C3F] via-[#7B3F27] to-[#4A2010] rounded-sm shadow-[0_12px_18px_rgba(0,0,0,0.55),0_3px_5px_rgba(0,0,0,0.25)] z-0 border-b border-black/50">
                      {/* 3D Top bevel surface of the shelf */}
                      <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#C18260] opacity-80 border-b border-black/25"></div>
                      {/* Subtle organic wood grain texture lines */}
                      <div className="absolute inset-0 bg-repeat-x bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:25px_100%] opacity-25"></div>
                      {/* Soft side drop-shadows to blend connected shelves */}
                      <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/35 to-transparent"></div>
                      <div className="absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-l from-black/35 to-transparent"></div>
                      {/* Depth shading on the wall below */}
                      <div className="absolute top-6 left-2 right-2 h-3 bg-black/45 blur-[3px] rounded-full pointer-events-none"></div>
                    </div>
                  </div>
 
                  {/* Book Metadata & Deletion placed elegantly BELOW the wooden shelf */}
                  <div className="mt-8 text-right z-10 px-1">
                    <h3 className={`font-bold text-xs line-clamp-1 ${isKidsBook ? "text-rose-600 font-extrabold" : "text-[#4A3B32]"}`}>
                      {book.title}
                    </h3>
                    <p className="text-[10px] opacity-75 line-clamp-1 mt-0.5">
                      {book.author}
                    </p>
                    
                    {/* Display Kids Encouragement Badges */}
                    {isKidsBook && (
                      <span className="inline-block mt-1 text-[9px] bg-rose-500/10 text-rose-600 border border-rose-500/15 px-2 py-0.5 rounded-full font-bold shadow-sm">
                        🧸 البطل الذكي
                      </span>
                    )}

                    {/* Display tags if present */}
                    {book.tags && book.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-end mt-1.5">
                        {book.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="text-[9px] bg-[#5A5A40]/10 text-[#5A5A40] px-1.5 py-0.5 rounded-md font-bold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {isAdmin && (
                      <div className="flex items-center justify-start gap-3 mt-2.5">
                        <button
                          onClick={(e) => handleOpenEditModal(e, book)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5A5A40] hover:text-[#4A3B32] transition-all bg-[#5A5A40]/10 hover:bg-[#5A5A40]/20 px-2 py-1 rounded shadow-sm"
                          title="تعديل تفاصيل الكتاب"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>

                        {confirmDeleteId === book.id ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded border border-red-200" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[9px] text-red-700 font-bold">تأكيد؟</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteBook(book.id);
                                setConfirmDeleteId(null);
                              }}
                              className="text-[9px] font-bold text-white bg-red-600 hover:bg-red-700 px-1.5 py-0.5 rounded shadow"
                            >
                              نعم
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              className="text-[9px] font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 px-1.5 py-0.5 rounded shadow"
                            >
                              لا
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(book.id);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 hover:text-red-800 transition-all bg-red-50 hover:bg-red-100 px-2 py-1 rounded shadow-sm"
                            title="حذف هذا المجلد"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
                    )}
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

              {newCategory === "curriculum" && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-emerald-800 mb-1.5">الصف أو المرحلة الدراسية</label>
                  <select 
                    value={newCurriculumStage}
                    onChange={(e) => setNewCurriculumStage(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-emerald-300 focus:ring-1 focus:ring-emerald-500 outline-none bg-emerald-50/50 text-[#4A3B32] font-semibold"
                  >
                    <option value="">-- اختر المرحلة / الصف الدراسي --</option>
                    {CURRICULUM_STAGES.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
              )}

              {newCategory === "children" && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-rose-800 mb-1.5">قسم الأطفال الفرعي</label>
                  <select 
                    value={newChildrenSection}
                    onChange={(e) => setNewChildrenSection(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-rose-300 focus:ring-1 focus:ring-rose-500 outline-none bg-rose-50/50 text-[#4A3B32] font-semibold"
                  >
                    <option value="">-- اختر القسم الفرعي --</option>
                    {CHILDREN_SECTIONS.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
              )}

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

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">المجموعات / الوسوم (تفصل بفواصل ، أو ,)</label>
                <input 
                  type="text" 
                  value={newTagsStr}
                  onChange={(e) => setNewTagsStr(e.target.value)}
                  placeholder="مثال: رواية، سوداني، أدب عريق"
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

              {editCategory === "curriculum" && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-emerald-800 mb-1.5">الصف أو المرحلة الدراسية</label>
                  <select 
                    value={editCurriculumStage}
                    onChange={(e) => setEditCurriculumStage(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-emerald-300 focus:ring-1 focus:ring-emerald-500 outline-none bg-emerald-50/50 text-[#4A3B32] font-semibold"
                  >
                    <option value="">-- اختر المرحلة / الصف الدراسي --</option>
                    {CURRICULUM_STAGES.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
              )}

              {editCategory === "children" && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-rose-800 mb-1.5">قسم الأطفال الفرعي</label>
                  <select 
                    value={editChildrenSection}
                    onChange={(e) => setEditChildrenSection(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-rose-300 focus:ring-1 focus:ring-rose-500 outline-none bg-rose-50/50 text-[#4A3B32] font-semibold"
                  >
                    <option value="">-- اختر القسم الفرعي --</option>
                    {CHILDREN_SECTIONS.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">نبذة مختصرة عن الكتاب (اختياري)</label>
                <textarea 
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl border border-neutral-300 focus:ring-1 focus:ring-[#5A5A40] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">المجموعات / الوسوم (تفصل بفواصل ، أو ,)</label>
                <input 
                  type="text" 
                  value={editTagsStr}
                  onChange={(e) => setEditTagsStr(e.target.value)}
                  placeholder="مثال: رواية، سوداني، أدب عريق"
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

              {uploadCategory === "curriculum" && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-emerald-800 mb-1.5">الصف أو المرحلة الدراسية</label>
                  <select 
                    value={uploadCurriculumStage}
                    onChange={(e) => setUploadCurriculumStage(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-emerald-300 focus:ring-1 focus:ring-emerald-500 outline-none bg-emerald-50/50 text-[#4A3B32] font-semibold"
                  >
                    <option value="">-- اختر المرحلة / الصف الدراسي --</option>
                    {CURRICULUM_STAGES.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
              )}

              {uploadCategory === "children" && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-rose-800 mb-1.5">قسم الأطفال الفرعي</label>
                  <select 
                    value={uploadChildrenSection}
                    onChange={(e) => setUploadChildrenSection(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-rose-300 focus:ring-1 focus:ring-rose-500 outline-none bg-rose-50/50 text-[#4A3B32] font-semibold"
                  >
                    <option value="">-- اختر القسم الفرعي --</option>
                    {CHILDREN_SECTIONS.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
              )}

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

              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">المجموعات / الوسوم (تفصل بفواصل ، أو ,)</label>
                <input 
                  type="text" 
                  value={uploadTagsStr}
                  onChange={(e) => setUploadTagsStr(e.target.value)}
                  placeholder="مثال: منهج، رياضيات، الصف السادس"
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

      {/* 8. DETAIL PREVIEW MODAL (ON LONG PRESS OR INFO CLICK) */}
      {previewBook && (() => {
        const colors = getTraditionalCoverColors(previewBook.title, previewBook.id, previewBook.category);
        const isKidsBook = previewBook.category === "children";
        
        // Translate department names
        const categoryNames: Record<string, string> = {
          curriculum: "مناهج وزارة التربية والتعليم",
          children: "كتب للأطفال والبراعم",
          religious: "المكتبة الإسلامية والدينية",
          general: "الكتب العامة والروايات الأدبية"
        };
        const categoryName = categoryNames[previewBook.category || "general"] || "الكتب العامة";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in text-right">
            <div className="w-full max-w-2xl bg-[#FAF6F0] rounded-3xl border-2 border-[#E6DCC8] shadow-2xl overflow-hidden flex flex-col md:flex-row-reverse">
              
              {/* Cover Preview Section */}
              <div className="md:w-2/5 p-6 bg-gradient-to-br from-[#F5EFE4] to-[#E9DFCE] border-b md:border-b-0 md:border-l border-[#E6DCC8] flex flex-col items-center justify-center">
                <div className="relative w-32 aspect-[3/4] shadow-2xl rounded-r-lg rounded-l-md overflow-hidden transform hover:scale-105 transition-all duration-300 preserve-3d flex flex-col justify-between p-4 border border-[#ffffff30] select-none">
                  <div className={`absolute inset-0 ${colors.bg} z-0`}></div>
                  {/* Decorative motif */}
                  <div className={`absolute inset-2 border border-dashed rounded-md z-0 pointer-events-none ${
                    isKidsBook ? "border-white/50" : "border-white/20"
                  }`}></div>
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/50 to-transparent z-10"></div>
                  
                  {/* Banner */}
                  <div className="relative z-10 py-1 px-1.5 rounded bg-white/25 text-[8px] font-extrabold text-white text-center truncate">
                    {categoryName}
                  </div>
                  
                  {/* Title */}
                  <div className="relative z-10 my-auto text-center py-2">
                    <p className={`font-serif font-extrabold text-[10px] leading-snug text-yellow-50 line-clamp-3`}>
                      {previewBook.title}
                    </p>
                    <p className="text-[8px] mt-1 text-yellow-100 opacity-90 truncate italic">
                      {previewBook.author}
                    </p>
                  </div>

                  {/* Icon medallion */}
                  <div className="relative z-10 mx-auto w-6 h-6 rounded-full border border-white/20 flex items-center justify-center bg-black/10 text-amber-200 text-[9px]">
                    {isKidsBook ? "⭐" : "۞"}
                  </div>
                </div>
                
                {/* Book size / format */}
                <div className="mt-4 px-3 py-1 bg-white/50 rounded-full border border-neutral-200 text-[10px] font-bold text-neutral-600">
                  {previewBook.isCustom 
                    ? (previewBook.fileSize ? `ملف محلي • ${previewBook.fileSize}` : "رابط سحابي مباشر") 
                    : "مخطوطة مدمجة بالنظام"
                  }
                </div>
              </div>

              {/* Book Metadata & Actions Section */}
              <div className="md:w-3/5 p-6 flex flex-col justify-between text-right">
                <div>
                  <div className="flex items-center gap-1.5 justify-end text-[#5A5A40] mb-1">
                    <span className="text-[10px] font-extrabold bg-[#5A5A40]/10 px-2.5 py-1 rounded-full">{categoryName}</span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs text-neutral-500 font-bold">تفاصيل الكتاب</span>
                  </div>

                  <h3 className="text-lg font-extrabold text-[#4A3B32] font-serif leading-snug mt-2">
                    {previewBook.title}
                  </h3>

                  <p className="text-xs text-neutral-500 mt-1 font-medium">
                    المؤلف: <span className="text-[#8D7B68] font-bold">{previewBook.author}</span>
                  </p>

                  <div className="my-4 border-t border-dashed border-[#E6DCC8]" />

                  <h4 className="text-xs font-extrabold text-[#4A3B32] mb-1.5">نبذة عن الكتاب:</h4>
                  <p className="text-xs text-[#6D4C41] leading-relaxed max-h-36 overflow-y-auto pl-2 scrollbar-thin scrollbar-thumb-amber-200 text-right">
                    {previewBook.description || "لا يوجد وصف مفصل متاح لهذا الكتاب حالياً في خزانة الكتب. يمكنك فتح الكتاب لاستكشاف كامل محتوياته القيمة وقراءة فصوله الأثرية."}
                  </p>

                  {/* Tags */}
                  {previewBook.tags && previewBook.tags.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-extrabold text-[#4A3B32] mb-1.5">المجموعات والوسوم:</h4>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {previewBook.tags.map((tag) => (
                          <span 
                            key={tag} 
                            className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/40"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reading Lists Selection */}
                  <div className="mt-4 pt-3 border-t border-dashed border-[#E6DCC8]">
                    <h4 className="text-xs font-extrabold text-[#4A3B32] mb-1.5 flex items-center gap-1 flex-row-reverse">
                      <span>إضافة إلى قائمة قراءة مخصصة:</span>
                    </h4>
                    {readingLists.length === 0 ? (
                      <p className="text-[10px] text-[#8D7B68] italic leading-normal">
                        لا توجد قوائم قراءة مخصصة حالياً. أنشئ قائمة جديدة من شريط القوائم في الأعلى لتنظيم كتبك المفضلة وتجميعها.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {readingLists.map((list) => {
                          const isInList = list.bookIds.includes(previewBook.id);
                          return (
                            <button
                              key={list.id}
                              type="button"
                              onClick={() => toggleBookInReadingList(list.id, previewBook.id)}
                              className={`text-[9px] font-bold px-2 py-1 rounded-full border transition-all duration-200 flex items-center gap-1 ${
                                isInList
                                  ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-xs"
                                  : "bg-white text-[#6D4C41] border-[#E6DCC8] hover:bg-[#FAF5EC]"
                              }`}
                            >
                              <span>{isInList ? "✓" : "+"}</span>
                              <span>{list.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Offline Cache Status and Button */}
                  <div className="mt-4 pt-3 border-t border-dashed border-[#E6DCC8]">
                    <h4 className="text-xs font-extrabold text-[#4A3B32] mb-2 flex items-center gap-1 flex-row-reverse">
                      <span>التحميل والقراءة دون اتصال:</span>
                    </h4>
                    
                    {isPreviewBookCached ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-right flex-row-reverse">
                          <div className="flex items-center gap-2 flex-row-reverse">
                            <span className="text-emerald-600 text-sm">✓</span>
                            <div>
                              <p className="text-[11px] font-bold text-emerald-800 leading-none text-right">جاهز للقراءة بدون إنترنت</p>
                              <p className="text-[9px] text-emerald-600/80 mt-0.5 text-right font-semibold">تم حفظ نسخة كاملة بأمان في ذاكرة جهازك</p>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveBookCache(previewBook)}
                            className="text-[9px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 transition-colors"
                          >
                            إلغاء الحفظ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {isCachingInProgress ? (
                          <div className="bg-amber-50/75 border border-amber-100 rounded-xl p-2.5 text-center">
                            <div className="flex items-center justify-center gap-2 flex-row-reverse">
                              <span className="w-3.5 h-3.5 border-2 border-[#5A5A40] border-t-transparent rounded-full animate-spin"></span>
                              <span className="text-[11px] font-bold text-[#5A5A40]">جاري تحميل وحفظ الكتاب بالكامل... يرجى الانتظار</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF5EC]/50 border border-[#E6DCC8]/60 rounded-xl p-2.5 flex-row-reverse">
                            <p className="text-[10px] text-stone-500 text-right leading-relaxed max-w-xs font-semibold">
                              هذا الكتاب متاح أونلاين. يمكنك تحميله وحفظه في ذاكرة جهازك لقراءته في أي وقت بدون إنترنت (مثال: أثناء انقطاع الشبكة).
                            </p>
                            <button
                              type="button"
                              onClick={() => handleCacheBookOffline(previewBook)}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#5A5A40] hover:bg-[#4A4A32] text-white text-[11px] font-extrabold transition-all shadow-sm"
                            >
                              <span>📥 حفظ للقراءة دون اتصال</span>
                            </button>
                          </div>
                        )}
                        {cachingError && (
                          <p className="text-[9px] text-red-600 font-bold mt-1 text-right">⚠️ خطأ: {cachingError}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-[#E6DCC8]">
                  <button
                    type="button"
                    onClick={() => setPreviewBook(null)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-xs font-bold text-neutral-600 transition-colors"
                  >
                    إغلاق النافذة
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleShareBook(previewBook)}
                    className={`flex-1 py-2.5 rounded-xl border transition-colors flex items-center justify-center gap-1.5 text-xs font-bold ${
                      shareSuccess 
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100" 
                        : "border-[#D6CAB2] hover:bg-[#F3ECE0] text-[#6D4C41]"
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{shareSuccess ? "تم النسخ!" : "مشاركة"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const bookToOpen = previewBook;
                      setPreviewBook(null);
                      onSelectBook(bookToOpen);
                    }}
                    className="flex-1.5 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A32] text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#5A5A40]/10"
                  >
                    <span>📖 فتح قراءة الكتاب</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
