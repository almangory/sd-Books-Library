import React, { useState, useEffect } from "react";
import { Book, ReadingSettings } from "./types";
import LibraryShelf from "./components/LibraryShelf";
import ThreeDFlipbook from "./components/ThreeDFlipbook";
import SupabaseRequirements from "./components/SupabaseRequirements";
import OnboardingTutorial from "./components/OnboardingTutorial";
import ReadingStatsPanel from "./components/ReadingStatsPanel";
import { LogOut, X, AlertCircle } from "lucide-react";
import { getTranslation } from "./utils/translations";
import { AnimatePresence } from "motion/react";

// Curated default books representing traditional Sudanese literature, history, and education.
const DEFAULT_BOOKS: Book[] = [];

export default function App() {
  const [view, setView] = useState<"shelf" | "reader" | "supabase">("shelf");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return localStorage.getItem("flipbook_onboarding_completed") !== "true";
  });
  
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem("flipbook_is_admin") === "true";
  });
  
  const [adminPassword, setAdminPassword] = useState<string>("20302060");
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== "undefined" ? navigator.onLine : true);

  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem("flipbook_persisted_books_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_BOOKS;
      }
    }
    return DEFAULT_BOOKS;
  });

  // Reading statistics state tracking
  const [readBookIds, setReadBookIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("flipbook_read_book_ids");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [readingTimeByDate, setReadingTimeByDate] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("flipbook_reading_time_by_date");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Track book when opened
  useEffect(() => {
    if (view === "reader" && selectedBook?.id) {
      const bookId = selectedBook.id;
      setReadBookIds(prev => {
        if (prev.includes(bookId)) return prev;
        const updated = [...prev, bookId];
        localStorage.setItem("flipbook_read_book_ids", JSON.stringify(updated));
        return updated;
      });
    }
  }, [view, selectedBook?.id]);

  // Track daily reading time (1 second interval when active in reader)
  useEffect(() => {
    if (view !== "reader" || !selectedBook?.id) return;

    const interval = setInterval(() => {
      const todayStr = new Date().toISOString().split("T")[0];
      setReadingTimeByDate(prev => {
        const currentSeconds = prev[todayStr] || 0;
        const updated = {
          ...prev,
          [todayStr]: currentSeconds + 1
        };
        localStorage.setItem("flipbook_reading_time_by_date", JSON.stringify(updated));
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [view, selectedBook?.id]);

  // Monitor network status
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load Admin Password and Books from Supabase on mount
  useEffect(() => {
    async function initSupabaseData() {
      try {
        const { getAdminPassword, getSupabaseBooks, isSupabaseConfigured } = await import("./utils/supabaseClient");
        
        // 1. Load password safely
        if (typeof getAdminPassword === "function") {
          const pass = await getAdminPassword();
          if (pass) setAdminPassword(pass);
        }
        
        // 2. Load books if configured
        if (isSupabaseConfigured && typeof getSupabaseBooks === "function") {
          const supabaseBooks = await getSupabaseBooks();
          
          if (supabaseBooks && Array.isArray(supabaseBooks)) {
            // Mapping incoming database fields to support both snake_case and camelCase safely
            const formattedBooks: Book[] = supabaseBooks.map((b: any) => ({
              id: b.id,
              title: b.title,
              author: b.author,
              description: b.description || "",
              pdfUrl: b.pdfUrl || b.pdf_url || "",
              coverUrl: b.coverUrl || b.cover_url || "",
              isCustom: b.isCustom !== undefined ? b.isCustom : true,
              addedAt: b.addedAt || b.added_at || Date.now(),
              category: b.category || "general",
              tags: b.tags || [],
              fileSize: b.fileSize || b.file_size || ""
            }));

            setBooks(prev => {
              const merged = [...formattedBooks];
              const mergedIds = new Set(merged.map(b => b.id));
              
              // Keep any local custom books that aren't already fetched from Supabase
              prev.forEach(b => {
                if (b.isCustom && !mergedIds.has(b.id)) {
                  merged.push(b);
                  mergedIds.add(b.id);
                }
              });
              
              // Ensure all default books are included
              DEFAULT_BOOKS.forEach(b => {
                if (!mergedIds.has(b.id)) {
                  merged.push(b);
                  mergedIds.add(b.id);
                }
              });
              
              return merged;
            });
          }
        }
      } catch (err) {
        console.error("خطأ حرج أثناء جلب إعدادات وبينات Supabase:", err);
      }
    }
    initSupabaseData();
  }, []);

  // Persist books changes to local storage as fallback
  useEffect(() => {
    if (books) {
      localStorage.setItem("flipbook_persisted_books_v2", JSON.stringify(books));
    }
  }, [books]);

  // Global settings
  const [settings, setSettings] = useState<ReadingSettings>(() => {
    const saved = localStorage.getItem("flipbook_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.language) {
          parsed.language = "ar";
        }
        return parsed;
      } catch (e) {
        // Fallback below
      }
    }
    return {
      darkMode: false,
      sepiaMode: true,
      readingMode: false,
      zoom: 100,
      language: "ar"
    };
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem("flipbook_settings", JSON.stringify(settings));
  }, [settings]);

  // Screen Wake Lock to prevent screen dimming/sleeping automatically on mobiles & tablets
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      if (typeof window === "undefined" || !("wakeLock" in navigator)) {
        console.log("Wake Lock API is not supported by this browser.");
        return;
      }
      try {
        wakeLock = await (navigator as any).wakeLock.request("screen");
        console.log("Screen Wake Lock activated successfully!");
      } catch (err: any) {
        console.warn(`Screen Wake Lock failed: ${err.name}, ${err.message}`);
      }
    };

    // Request wake lock initially
    requestWakeLock();

    // Re-request when page becomes visible again (e.g., user returns to tab)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        await requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLock) {
        try {
          wakeLock.release();
          console.log("Screen Wake Lock released.");
        } catch (e) {
          console.warn("Error releasing wake lock:", e);
        }
      }
    };
  }, []);

  // Protect content
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === "IMG") {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);

  // Set up browser history navigation (History API) to handle mobile back button smoothly
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Push base guard states if history doesn't contain them
    if (!window.history.state) {
      window.history.replaceState({ view: "shelf_base" }, "");
      window.history.pushState({ view: "shelf" }, "");
    }

    const handlePopState = (event: PopStateEvent) => {
      if (isExiting) return;

      const state = event.state;
      if (state) {
        if (state.view === "reader") {
          setView("reader");
          if (state.bookId) {
            const foundBook = books.find(b => b.id === state.bookId);
            if (foundBook) setSelectedBook(foundBook);
          }
        } else if (state.view === "supabase") {
          setView("supabase");
        } else if (state.view === "shelf") {
          setView("shelf");
          setSelectedBook(null);
          setSettings(prev => ({ ...prev, readingMode: false }));
        } else if (state.view === "shelf_base") {
          // Guard state popped - user wants to exit from the library screen
          setShowExitConfirm(true);
          // Re-push shelf state to lock the browser page and await confirmation
          window.history.pushState({ view: "shelf" }, "");
        }
      } else {
        // Fallback guard
        setShowExitConfirm(true);
        window.history.pushState({ view: "shelf" }, "");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [books, isExiting]);

  // Alert before unloading tab (reloads/closing page)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isExiting) return;
      const message = "هل أنت متأكد من المغادرة؟";
      e.returnValue = message;
      return message;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isExiting]);

  const handleAdminLogin = (passwordEntered: string): boolean => {
    if (passwordEntered === adminPassword) {
      setIsAdmin(true);
      sessionStorage.setItem("flipbook_is_admin", "true");
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem("flipbook_is_admin");
  };

  const handleAddBook = async (newBook: Book) => {
    setBooks(prev => [newBook, ...prev]);
    try {
      const { insertSupabaseBook, isSupabaseConfigured } = await import("./utils/supabaseClient");
      if (isSupabaseConfigured && typeof insertSupabaseBook === "function") {
        const savedBook = await insertSupabaseBook(newBook);
        if (savedBook) {
          setBooks(prev => prev.map(b => b.id === newBook.id ? savedBook : b));
        }
      }
    } catch (err) {
      console.error("فشل إدخال الكتاب في سوبابيس، تم الحفظ محلياً فقط:", err);
    }
  };

  const handleUpdateBook = async (updatedBook: Book) => {
    setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
    try {
      const { updateSupabaseBook, isSupabaseConfigured } = await import("./utils/supabaseClient");
      if (isSupabaseConfigured && typeof updateSupabaseBook === "function") {
        await updateSupabaseBook(updatedBook);
      }
    } catch (err) {
      console.error("فشل تعديل الكتاب في سوبابيس:", err);
    }
  };

  const handleDeleteBook = async (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
    
    try {
      const { removeCachedBookBlob } = await import("./utils/indexedDB");
      if (typeof removeCachedBookBlob === "function") {
        await removeCachedBookBlob(id);
      }
    } catch (e) {
      console.warn("IndexedDB clean error:", e);
    }

    try {
      const { deleteSupabaseBook, isSupabaseConfigured } = await import("./utils/supabaseClient");
      if (isSupabaseConfigured && typeof deleteSupabaseBook === "function") {
        await deleteSupabaseBook(id);
      }
    } catch (err) {
      console.error("فشل حذف الكتاب من سوبابيس:", err);
    }
  };

  const handleBackToLibrary = () => {
    if (window.history.state && window.history.state.view !== "shelf_base" && window.history.state.view !== "shelf") {
      window.history.back();
    } else {
      setView("shelf");
      setSelectedBook(null);
      setSettings(prev => ({ ...prev, readingMode: false }));
    }
  };

  const handleSelectBook = async (book: Book) => {
    // Attempt automatic full screen on reader activation
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn("Fullscreen auto-request was blocked/denied:", err);
        });
      }
    } catch (fsErr) {
      console.warn("Fullscreen auto-request not supported in this frame:", fsErr);
    }

    try {
      const { getCachedBookBlob } = await import("./utils/indexedDB");
      if (typeof getCachedBookBlob === "function") {
        const cachedBlob = await getCachedBookBlob(book.id);
        if (cachedBlob) {
          if (selectedBook && selectedBook.pdfUrl.startsWith("blob:")) {
            URL.revokeObjectURL(selectedBook.pdfUrl);
          }
          const freshBlobUrl = URL.createObjectURL(cachedBlob);
          setSelectedBook({ ...book, pdfUrl: freshBlobUrl });
          setView("reader");
          window.history.pushState({ view: "reader", bookId: book.id }, "");
          return;
        }
      }
    } catch (e) {
      console.warn("خطأ في قراءة الـ Blob المحلي، سيتم التشغيل عبر الرابط المباشر", e);
    }
    
    setSelectedBook(book);
    setView("reader");
    window.history.pushState({ view: "reader", bookId: book.id }, "");
  };

  // Handle shared book URL on initial load
  useEffect(() => {
    if (typeof window === "undefined" || books.length === 0 || selectedBook) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const bId = urlParams.get("bookId") || urlParams.get("book");
    if (bId) {
      const foundBook = books.find(b => b.id === bId);
      if (foundBook) {
        const pageParam = urlParams.get("page");
        if (pageParam) {
          localStorage.setItem(`progress_${foundBook.id}`, pageParam);
        }
        
        // Open the book
        handleSelectBook(foundBook);
        
        // Clean URL to keep it pristine and avoid re-opening on manual refresh
        try {
          const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.replaceState({ view: "reader", bookId: foundBook.id }, "", cleanUrl);
        } catch (e) {
          console.warn("Failed to clean shared URL parameters:", e);
        }
      }
    }
  }, [books, selectedBook]);

  const currentLang = settings.language || "ar";
  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, currentLang);

  return (
    <div 
      dir={currentLang === "en" ? "ltr" : "rtl"}
      className={`min-h-screen transition-all duration-500 ease-in-out ${
        settings.darkMode 
          ? "bg-[#1E1916] text-[#EADDC9]" 
          : settings.sepiaMode 
            ? "bg-[#F5EEDC] text-[#5C4033]" 
            : "bg-[#FDFBF7] text-[#4A3B32]"
      }`}
    >
      
      {!settings.readingMode && view === "shelf" && (
        <div className="bg-[#4A3B32] text-[#FAF6EE] text-xs px-4 py-2 flex justify-between items-center shadow-sm">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="flex items-center gap-1 hover:text-red-300 transition-all font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span> {t("backToPlatform")}</span>
          </button>
          
          <div className="flex items-center gap-1.5 opacity-85 font-mono">
            <span>{t("localTime")} {new Date().toLocaleDateString(currentLang === "en" ? "en-US" : "ar-EG")}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          </div>
        </div>
      )}

      {view === "shelf" && (
        <LibraryShelf 
          books={books}
          onSelectBook={handleSelectBook}
          onAddBook={handleAddBook}
          onDeleteBook={handleDeleteBook}
          onUpdateBook={handleUpdateBook}
          onOpenSupabaseSchema={() => {
            setView("supabase");
            window.history.pushState({ view: "supabase" }, "");
          }}
          isAdmin={isAdmin}
          onAdminLogin={handleAdminLogin}
          onAdminLogout={handleAdminLogout}
          adminPassword={adminPassword}
          isOnline={isOnline}
          language={currentLang}
          onChangeLanguage={(lang) => setSettings(prev => ({ ...prev, language: lang }))}
          onOpenTutorial={() => setShowOnboarding(true)}
          readBookIds={readBookIds}
          readingTimeByDate={readingTimeByDate}
        />
      )}

      {view === "reader" && selectedBook && (
        <ThreeDFlipbook 
          book={selectedBook}
          onBackToLibrary={handleBackToLibrary}
          settings={settings}
          setSettings={setSettings}
        />
      )}

      {view === "supabase" && (
        <SupabaseRequirements onBack={() => {
          if (window.history.state && window.history.state.view !== "shelf_base" && window.history.state.view !== "shelf") {
            window.history.back();
          } else {
            setView("shelf");
          }
        }} />
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" dir={currentLang === "en" ? "ltr" : "rtl"}>
          <div className={`w-full max-w-sm p-6 rounded-2xl bg-[#FDFBF7] border border-[#E6E0D4] shadow-2xl ${currentLang === "en" ? "text-left" : "text-right"}`}>
            <div className={`flex items-center gap-3 text-amber-700 mb-3 ${currentLang === "en" ? "justify-start" : "justify-end"}`}>
              {currentLang === "en" ? (
                <>
                  <AlertCircle className="w-6 h-6 text-[#9E4233]" />
                  <span className="font-serif font-bold text-md">{t("exitConfirmTitle")}</span>
                </>
              ) : (
                <>
                  <span className="font-serif font-bold text-md">{t("exitConfirmTitle")}</span>
                  <AlertCircle className="w-6 h-6 text-[#9E4233]" />
                </>
              )}
            </div>
            <p className="text-xs text-[#6D4C41] leading-relaxed mb-6">
              {t("exitConfirmDesc")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-xs font-bold text-neutral-600"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => {
                  setIsExiting(true);
                  setShowExitConfirm(false);
                  window.location.href = "https://sudan-interactive-curricula.vercel.app/";
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#9E4233] hover:bg-[#853225] text-xs font-bold text-white"
              >
                {t("leave")}
              </button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showOnboarding && (
          <OnboardingTutorial 
            language={currentLang} 
            onClose={() => setShowOnboarding(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}