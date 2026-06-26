import React, { useState, useEffect } from "react";
import { Book, ReadingSettings } from "./types";
import LibraryShelf from "./components/LibraryShelf";
import ThreeDFlipbook from "./components/ThreeDFlipbook";
import SupabaseRequirements from "./components/SupabaseRequirements";
import { LogOut, X, AlertCircle } from "lucide-react";

// Curated default books representing traditional Sudanese literature, history, and education.
// These point to extremely fast and reliable sample PDFs to allow the interactive book flipping to work instantly for testing, 
// while fully supporting user custom URLs and local drag-and-drop PDFs!
const DEFAULT_BOOKS: Book[] = [
  {
    id: "def_1",
    title: "موسم الهجرة إلى الشمال",
    author: "الطيب صالح",
    description: "تعتبر هذه الرواية التاريخية الخالدة واحدة من أفضل مئة رواية عربية في القرن العشرين، حيث توازن ببراعة وثقافة فلسفية نادرة بين صراع الشرق والغرب، والبحث عن الذات على ضفاف نهر النيل المعطاء.",
    pdfUrl: "https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf",
    coverUrl: "",
    isCustom: false,
    addedAt: Date.now() - 8000,
    category: "general"
  },
  {
    id: "def_2",
    title: "كتاب الجغرافيا - الصف الثالث الثانوي",
    author: "وزارة التربية والتعليم السودانية",
    description: "كتاب الجغرافيا المعتمد لطلاب الشهادة الثانوية بجمهورية السودان، يغطي المظاهر الطبيعية والبشرية والاقتصادية بالتفصيل.",
    pdfUrl: "https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf",
    coverUrl: "",
    isCustom: false,
    addedAt: Date.now() - 7000,
    category: "curriculum"
  },
  {
    id: "def_3",
    title: "ديوان عيون الشعر السوداني الكلاسيكي",
    author: "الهادي آدم وآخرون",
    description: "مجموعة أنيقة تضم روائع القصائد السودانية الخالدة المليئة بالحنين وعشق التراب والأرض ونبض الهوية والمفردة السودانية الدافئة العذبة.",
    pdfUrl: "https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf",
    coverUrl: "",
    isCustom: false,
    addedAt: Date.now() - 6000,
    category: "general"
  },
  {
    id: "def_4",
    title: "حكايات جدتي فاطمة للأطفال",
    author: "عبد الله الطيب",
    description: "قصص وحكايات تراثية مشوقة للأطفال والناشئة مستوحاة من عمق التراث والثقافة السودانية الجميلة، لزرع القيم والأخلاق الحميدة.",
    pdfUrl: "https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf",
    coverUrl: "",
    isCustom: false,
    addedAt: Date.now() - 5000,
    category: "children"
  },
  {
    id: "def_5",
    title: "منهج التربية الإسلامية - الصف الثامن",
    author: "وزارة التربية والتعليم السودانية",
    description: "كتاب الطالب لمقرر التربية الإسلامية للصف الثامن الأساسي، يتضمن السيرة النبوية العطرة، الأخلاق الإسلامية، وأحكام التلاوة والقرآن الكريم.",
    pdfUrl: "https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf",
    coverUrl: "",
    isCustom: false,
    addedAt: Date.now() - 4000,
    category: "curriculum"
  },
  {
    id: "def_6",
    title: "رياض الصالحين للناشئة والأطفال",
    author: "تبسيط الشيوخ الأجلاء",
    description: "أحاديث نبوية شريفة منتقاة بعناية للأطفال واليافعين، مشروحة بأسلوب مبسط ومحبب يناسب المدارك الحديثة لتنشئة جيل ملتزم.",
    pdfUrl: "https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf",
    coverUrl: "",
    isCustom: false,
    addedAt: Date.now() - 3000,
    category: "religious"
  },
  {
    id: "def_7",
    title: "الخلاصة الشافية في علم العقيدة والتصوف",
    author: "الشيخ محمد أحمد الصائم",
    description: "مخطوط ديني مبسط يتناول مبادئ العقيدة الإسلامية السليمة وتزكية النفوس والسلوك الروحي القويم المستمد من الكتاب والسنة.",
    pdfUrl: "https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf",
    coverUrl: "",
    isCustom: false,
    addedAt: Date.now() - 2000,
    category: "religious"
  },
  {
    id: "def_8",
    title: "قصص الأنبياء المصورة للبراعم",
    author: "أحمد بهجت",
    description: "سلسلة قصص الأنبياء بأسلوب ميسر وصور توضيحية لتعريف البراعم بمسيرة الرسل عليهم السلام بأسلوب قصصي تفاعلي رائع.",
    pdfUrl: "https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf",
    coverUrl: "",
    isCustom: false,
    addedAt: Date.now() - 1000,
    category: "children"
  }
];

export default function App() {
  // Application View: shelf (Library shelf), reader (Active Book Viewer), supabase (Supabase DDL SQL setup view)
  const [view, setView] = useState<"shelf" | "reader" | "supabase">("shelf");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // Admin Mode state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem("flipbook_is_admin") === "true";
  });
  
  // Administrator Password - loaded dynamically from Supabase or defaults to '20302060'
  const [adminPassword, setAdminPassword] = useState<string>("20302060");

  // Persisted books state (Default + Custom uploaded or linked books)
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem("flipbook_persisted_books_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_BOOKS;
      }
    }
    return DEFAULT_BOOKS;
  });

  // Load Admin Password and Books from Supabase on mount
  useEffect(() => {
    async function initSupabaseData() {
      try {
        const { getAdminPassword, getSupabaseBooks, isSupabaseConfigured } = await import("./utils/supabaseClient");
        
        // 1. Load password
        const pass = await getAdminPassword();
        setAdminPassword(pass);
        
        // 2. Load books if configured
        if (isSupabaseConfigured) {
          const supabaseBooks = await getSupabaseBooks();
          if (supabaseBooks) {
            setBooks(prev => {
              // Merge books: keep default books, and overlay with books fetched from Supabase
              const dbIds = new Set(supabaseBooks.map(b => b.id));
              const filteredDefaults = DEFAULT_BOOKS.filter(b => !dbIds.has(b.id));
              return [...supabaseBooks, ...filteredDefaults];
            });
          }
        }
      } catch (err) {
        console.error("Failed to load Supabase configurations:", err);
      }
    }
    initSupabaseData();
  }, []);

  // Persist books changes to local storage as fallback
  useEffect(() => {
    localStorage.setItem("flipbook_persisted_books_v1", JSON.stringify(books));
  }, [books]);

  // Global settings
  const [settings, setSettings] = useState<ReadingSettings>(() => {
    const saved = localStorage.getItem("flipbook_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // default settings
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

  // Protect content: Disable right-click, context menu, and image dragging
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
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

  // App Exit confirmation modal state
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // Authenticate Admin
  const handleAdminLogin = (passwordEntered: string): boolean => {
    if (passwordEntered === adminPassword) {
      setIsAdmin(true);
      sessionStorage.setItem("flipbook_is_admin", "true");
      return true;
    }
    return false;
  };

  // Logout Admin
  const handleAdminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem("flipbook_is_admin");
  };

  // Add Book to personal collection & Supabase
  const handleAddBook = async (newBook: Book) => {
    setBooks(prev => [newBook, ...prev]);
    try {
      const { insertSupabaseBook, isSupabaseConfigured } = await import("./utils/supabaseClient");
      if (isSupabaseConfigured) {
        await insertSupabaseBook(newBook);
      }
    } catch (err) {
      console.error("Failed to insert book to Supabase:", err);
    }
  };

  // Update Book details (title, author, url, description, category) & Supabase
  const handleUpdateBook = async (updatedBook: Book) => {
    setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
    try {
      const { updateSupabaseBook, isSupabaseConfigured } = await import("./utils/supabaseClient");
      if (isSupabaseConfigured) {
        await updateSupabaseBook(updatedBook);
      }
    } catch (err) {
      console.error("Failed to update book in Supabase:", err);
    }
  };

  // Delete Book from personal collection, remove cached blob, and delete in Supabase
  const handleDeleteBook = async (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
    
    // Attempt cleaning blob cache in IndexedDB
    try {
      const { removeCachedBookBlob } = await import("./utils/indexedDB");
      await removeCachedBookBlob(id);
    } catch (e) {
      console.warn("IndexDB clean error:", e);
    }

    // Delete in Supabase
    try {
      const { deleteSupabaseBook, isSupabaseConfigured } = await import("./utils/supabaseClient");
      if (isSupabaseConfigured) {
        await deleteSupabaseBook(id);
      }
    } catch (err) {
      console.error("Failed to delete book from Supabase:", err);
    }
  };

  // Handle mobile Back Button or general screen-back logic
  const handleBackToLibrary = () => {
    // Return to main shelf instead of exiting program
    setView("shelf");
    setSelectedBook(null);
    
    // Restore normal screen focus
    setSettings(prev => ({ ...prev, readingMode: false }));
  };

  // Select Book to open in interactive reader
  const handleSelectBook = async (book: Book) => {
    try {
      // Check if we have a cached local blob for this book (offline capability)
      const { getCachedBookBlob } = await import("./utils/indexedDB");
      const cachedBlob = await getCachedBookBlob(book.id);
      
      if (cachedBlob) {
        // Revoke previous session URL if applicable to avoid leaks
        if (selectedBook && selectedBook.pdfUrl.startsWith("blob:")) {
          URL.revokeObjectURL(selectedBook.pdfUrl);
        }
        
        // Re-generate fresh blob url for this viewing session
        const freshBlobUrl = URL.createObjectURL(cachedBlob);
        setSelectedBook({
          ...book,
          pdfUrl: freshBlobUrl
        });
      } else {
        setSelectedBook(book);
      }
    } catch (e) {
      console.warn("Could not check local cached blob, fallback to original url", e);
      setSelectedBook(book);
    }
    
    setView("reader");
  };

  // Exit trigger action
  const handleExitApp = () => {
    setShowExitConfirm(true);
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    // Standard visual feedback indicating exit success
    alert("تم الخروج الآمن من نظام قارئ التقليب الورقي. يمكنك غلق علامة التبويب بأمان. مع تمنياتنا لك بأسعد الأوقات في القراءة!");
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      settings.darkMode 
        ? "bg-[#1E1916] text-[#EADDC9]" 
        : "bg-[#FDFBF7] text-[#4A3B32]"
    }`}>
      
      {/* Tiny subtle top bar with exit action (Only visible when not in immersive reading mode) */}
      {!settings.readingMode && view === "shelf" && (
        <div className="bg-[#4A3B32] text-[#FAF6EE] text-xs px-4 py-2 flex justify-between items-center shadow-sm">
          <button
            onClick={handleExitApp}
            className="flex items-center gap-1 hover:text-red-300 transition-all font-semibold"
            title="مغادرة البرنامج"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج من البرنامج</span>
          </button>
          
          <div className="flex items-center gap-1.5 opacity-85 font-mono">
            <span>التوقيت المحلي: {new Date().toLocaleDateString("ar-EG")}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          </div>
        </div>
      )}

      {/* CORE VIEW ROUTER */}
      {view === "shelf" && (
        <LibraryShelf 
          books={books}
          onSelectBook={handleSelectBook}
          onAddBook={handleAddBook}
          onDeleteBook={handleDeleteBook}
          onUpdateBook={handleUpdateBook}
          onOpenSupabaseSchema={() => setView("supabase")}
          isAdmin={isAdmin}
          onAdminLogin={handleAdminLogin}
          onAdminLogout={handleAdminLogout}
          adminPassword={adminPassword}
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
        <SupabaseRequirements 
          onBack={() => setView("shelf")}
        />
      )}

      {/* 5. ELEGANT DESIGNED EXIT CONFIRMATION DIALOG MODAL */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#FDFBF7] border border-[#E6E0D4] shadow-2xl text-right">
            
            <div className="flex items-center gap-3 justify-end text-amber-700 mb-3">
              <span className="font-serif font-bold text-md">هل تود مغادرة مكتبتك الرقمية؟</span>
              <AlertCircle className="w-6 h-6 text-[#9E4233]" />
            </div>

            <p className="text-xs text-[#6D4C41] leading-relaxed mb-6">
              بمغادرتك التطبيق، ستفقد إمكانية مواصلة القراءة السريعة لصفحتك المفتوحة حالياً، على الرغم من أن إشاراتك المرجعية وهوامشك المكتوبة ستبقى محفوظة بأمان في ذاكرة متصفحك وسجلات سوبابيس للزيارة القادمة!
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-xs font-bold text-neutral-600 transition-colors"
              >
                لا، تراجع (مواصلة القراءة)
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 py-2.5 rounded-xl bg-[#9E4233] hover:bg-[#853225] text-xs font-bold text-white transition-colors"
              >
                نعم، متأكد من المغادرة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
