import React, { useState, useEffect } from "react";
import { Book, ReadingSettings } from "./types";
import LibraryShelf from "./components/LibraryShelf";
import ThreeDFlipbook from "./components/ThreeDFlipbook";
import SupabaseRequirements from "./components/SupabaseRequirements";
import { LogOut, X, AlertCircle } from "lucide-react";

// Curated default books representing traditional Sudanese literature, history, and education.
const DEFAULT_BOOKS: Book[] = [];

export default function App() {
  const [view, setView] = useState<"shelf" | "reader" | "supabase">("shelf");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
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
              category: b.category || "general"
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
        return JSON.parse(saved);
      } catch (e) {
        // Fallback below
      }
    }
    return {
      darkMode: false,
      sepiaMode: true,
      readingMode: false,
      zoom: 100
    };
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem("flipbook_settings", JSON.stringify(settings));
  }, [settings]);

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

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      settings.darkMode ? "bg-[#1E1916] text-[#EADDC9]" : "bg-[#FDFBF7] text-[#4A3B32]"
    }`}>
      
      {!settings.readingMode && view === "shelf" && (
        <div className="bg-[#4A3B32] text-[#FAF6EE] text-xs px-4 py-2 flex justify-between items-center shadow-sm">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="flex items-center gap-1 hover:text-red-300 transition-all font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span> الرجوع للمنصة</span>
          </button>
          
          <div className="flex items-center gap-1.5 opacity-85 font-mono">
            <span>التوقيت المحلي: {new Date().toLocaleDateString("ar-EG")}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#FDFBF7] border border-[#E6E0D4] shadow-2xl text-right">
            <div className="flex items-center gap-3 justify-end text-amber-700 mb-3">
              <span className="font-serif font-bold text-md">هل تود مغادرة مكتبتك الرقمية؟</span>
              <AlertCircle className="w-6 h-6 text-[#9E4233]" />
            </div>
            <p className="text-xs text-[#6D4C41] leading-relaxed mb-6">
              بمغادرتك التطبيق، ستفقد إمكانية مواصلة القراءة السريعة لصفحتك المفتوحة حالياً.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-xs font-bold text-neutral-600"
              >
                تراجع
              </button>
              <button
                onClick={() => {
                  setIsExiting(true);
                  setShowExitConfirm(false);
                  window.location.href = "https://sudan-interactive-curricula.vercel.app/";
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#9E4233] hover:bg-[#853225] text-xs font-bold text-white"
              >
                مغادرة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}