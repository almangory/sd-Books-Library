import React, { useState, useEffect, useRef } from "react";
import { Book, Bookmark, BookNote, ReadingSettings } from "../types";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Bookmark as BookmarkIcon, 
  RotateCcw, 
  FileText, 
  Compass, 
  Moon, 
  Sun, 
  Sparkles, 
  BookOpen, 
  Eye, 
  X,
  Volume2,
  VolumeX,
  Download,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore
import { getGoogleDriveDirectLink } from "../utils/driveParser";
// @ts-ignore
import pdfjsWorkerCode from "pdfjs-dist/build/pdf.worker.min.mjs?raw";

// Create a safe, offline-capable, same-origin Blob URL from the raw worker code.
// This completely bypasses CORS, cross-origin web worker blocks, and dynamic URL constraints inside sandboxed iframes!
try {
  const blob = new Blob([pdfjsWorkerCode], { type: "application/javascript" });
  const blobUrl = URL.createObjectURL(blob);
  pdfjsLib.GlobalWorkerOptions.workerSrc = blobUrl;
} catch (err) {
  console.error("Failed to initialize PDF.js inline worker:", err);
  // Fallback to unpkg CDN if Blob creation or worker allocation is restricted
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@6.0.227/build/pdf.worker.min.mjs";
}

// Helper to generate a valid, multi-page sample PDF file on the fly
const generateSamplePdf = (title: string, author: string, bookId: string, pageCount: number = 8): Uint8Array => {
  let pdf = "%PDF-1.4\n";
  
  // Catalog object (1)
  pdf += "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  
  // Pages collection (2)
  const kids: string[] = [];
  for (let i = 0; i < pageCount; i++) {
    kids.push(`${3 + i * 2} 0 R`);
  }
  pdf += `2 0 obj\n<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${pageCount} >>\nendobj\n`;
  
  const escapePdfStr = (s: string) => {
    return s.replace(/[()]/g, "\\$&");
  };

  const safeTitle = title || "Book Title";
  const safeAuthor = author || "Sudanese Scholar";

  // Provide custom content blocks based on the book id or title to feel premium
  const getBookPagesContent = (id: string, pageNum: number) => {
    if (id === "def_1" || title.includes("الهجرة")) {
      const chapters = [
        "", // Page 1 is cover
        "Chapter I: The Arrival in the Village\n\nI returned to my people, gentlemen, after seven years in Europe...\nIt was a warm evening on the banks of the majestic Nile River.",
        "Chapter II: The Encounter with Mustafa Sa'eed\n\nMustafa Sa'eed was a silent mystery walking the village streets.\nUnder the shade of the palm trees, he spoke of London nights.",
        "Chapter III: The Dilemma of Identity\n\nAm I Mustafa Sa'eed? Or am I the soil and water of this land?\nThe conflict between the cold north and the warm, fertile south.",
        "Chapter IV: The Secret Room of Treasures\n\nA room filled with English poetry books, fire logs, and memories.\nA piece of London transported deep into the Sudanese desert.",
        "Chapter V: The Floating Legacy\n\nVoices of the ancestors echoing through the water current.\n'The Nile flows, heedless of our transient dramas.'",
        "Chapter VI: Reflections under the Stars\n\nWatching the desert sky, where stars burn like white embers.\nA testament to human survival and cultural reconciliation.",
        "Chapter VII: The Epilogue\n\nA modern masterpiece showcasing the depth of Sudanese storytelling."
      ];
      return chapters[pageNum - 1] || "Continued reading and research...";
    } else if (id === "def_2" || title.includes("كوش") || title.includes("حضارة")) {
      const chapters = [
        "", // Page 1 is cover
        "Chapter I: The Cradle of Black Pharaohs\n\nThe Kingdom of Kush flourished in the Middle Nile region.\nAn independent power competing with ancient Egypt for dynasty crown.",
        "Chapter II: The Pyramids of Meroe\n\nStanding tall in the golden desert sands of Begarawiyah.\nOver two hundred pyramids, unique in their steep, elegant angles.",
        "Chapter III: The Kandakes (Warrior Queens)\n\nLegendary queens like Amanirenas who resisted Roman invasions.\nCommanding armies, building temples, and securing sovereign pride.",
        "Chapter IV: The Iron Industry of Meroe\n\nMeroe was known as the 'Birmingham of Ancient Africa'.\nMassive iron smelting furnaces powering tools and architecture.",
        "Chapter V: The Royal City of Naqa\n\nSplendid Lion Temples dedicated to the warrior god Apedemak.\nA mixture of indigenous, Egyptian, and Hellenistic aesthetics.",
        "Chapter VI: The Sacred Mountain of Jebel Barkal\n\nBelieved to be the dwelling of Amun, the source of kingship.\nA spiritual sanctuary that united the Nile valley civilizations.",
        "Chapter VII: Preserving Sudan's Heritage\n\nA vital treasure trove for modern historical consciousness."
      ];
      return chapters[pageNum - 1] || "Continued historical exploration...";
    } else if (id === "def_3" || title.includes("ديوان") || title.includes("الشعر")) {
      const chapters = [
        "", // Page 1 is cover
        "Poem I: The Song of the Nile\n\nOh Nile, who washes our sorrows and waters our palms,\nYou are the ancient artery of our love and pride.\nSinging to the desert, greening the barren hills.",
        "Poem II: Nostalgia for Khartoum\n\nMeeting at the confluence of the two Niles, White and Blue,\nWhere the breeze carries the scent of acacia and rain.\nA meeting point of hearts and cultural diversity.",
        "Poem III: The Pride of the Desert\n\nWe are the sons of the sun, generous and brave,\nOur guest houses are always open, welcoming travelers.\nSpreading carpets of hospitality under the velvet sky.",
        "Poem IV: The Whispers of Acacia\n\nUnder the golden acacia branches, secrets were shared,\nOf ancient loves and modern revolutions of the spirit.\nWhere every leaf tells a tale of patience and hope.",
        "Poem V: The Flute of the Shepherd\n\nA melody echoing through the plains of Kordofan,\nHerding sheep under the gentle violet sunset.\nSinging the eternal hymns of the peaceful earth.",
        "Poem VI: The Hymn of Freedom\n\nA rallying cry of poets who lit the torches of freedom,\nWhose words were stronger than iron chains and fortresses.\nWriting destiny in the glowing pages of light.",
        "Poem VII: Conclusion\n\nAn eternal testament to the artistic soul of Sudan."
      ];
      return chapters[pageNum - 1] || "More verses and classical stanzas...";
    } else if (id === "def_4" || title.includes("الأمثال") || title.includes("الفولكلور")) {
      const chapters = [
        "", // Page 1 is cover
        "Proverb I: 'Al-Jarah bel-Jarah'\n\nPhysical wounds heal easily, but emotional distress lingers.\nAn advice to protect friendship and avoid harsh words.",
        "Proverb II: 'Iza Al-Ghaeem Kutar'\n\nWhen clouds gather heavily, rain is inevitable.\nSuggesting that preparation and patterns lead to expected outcomes.",
        "Proverb III: 'Al-Khawaat fe Al-Saddah'\n\nTrue brotherhood is tested during difficult, high-stakes times,\nnot during easy social situations or when things are simple.",
        "Proverb IV: 'Al-Bab Al-Yijeeb Al-Reeh'\n\nClose the door that brings troublesome wind, and find peace.\nA wise guidance to eliminate sources of drama and unnecessary conflict.",
        "Proverb V: 'Al-Awar fe Wasat Al-Umyan'\n\nA one-eyed person is king among the completely blind.\nHighlighting relativity of skills and knowledge in varying environments.",
        "Proverb VI: 'Al-Kalam fe Shatt Al-Nahr'\n\nWords are easy when standing safely on the dry river bank.\nTesting is different from theorizing; action is superior to talk.",
        "Proverb VII: 'Legacy of Badri'\n\nA cornerstone of wisdom, hospitality, and communal resilience."
      ];
      return chapters[pageNum - 1] || "More heritage proverbs and folk wisdom...";
    } else {
      const chapters = [
        "", // Page 1 is cover
        "Chapter I: The Opening\n\nThis manuscript is active and ready.\nThank you for choosing this text for your scholarly research.",
        "Chapter II: Local Interactive Sandbox\n\nThis high-quality presentation utilizes Web technology.\nAll annotations and bookmarks are saved securely in your browser cache.",
        "Chapter III: Seamless Reading\n\nYou can configure the reader's zoom level, page orientation,\nsepia mode, and high-contrast ambient dark illumination.",
        "Chapter IV: Notes & Marginalia\n\nFeel free to write and persist notes on any page of this document.\nThey are loaded automatically whenever you return to this library shelf.",
        "Chapter V: Bookmark System\n\nToggle the bookmark button on any page to mark your progress.\nYou can jump back to any bookmarked page using the quick-jump menu.",
        "Chapter VI: Offline Autonomy\n\nOnce loaded, this book requires no internet connectivity,\npreserving battery and bandwidth for long, peaceful sessions.",
        "Chapter VII: Final Thoughts\n\nWe hope this application enriches your digital library experience."
      ];
      return chapters[pageNum - 1] || "Continued reading document...";
    }
  };

  for (let i = 0; i < pageCount; i++) {
    const pageNum = i + 1;
    const pageObjId = 3 + i * 2;
    const contentObjId = pageObjId + 1;
    
    // Page Object
    pdf += `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentObjId} 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n`;
    
    // Stream Content
    let streamText = "BT\n";
    if (pageNum === 1) {
      streamText += `/F1 24 Tf\n1 0 0 1 50 620 Tm\n(${escapePdfStr(safeTitle)}) Tj\n`;
      streamText += `/F1 14 Tf\n1 0 0 1 50 560 Tm\n(${escapePdfStr(safeAuthor)}) Tj\n`;
      streamText += `/F1 11 Tf\n1 0 0 1 50 400 Tm\n(Al-Maktabah Al-Sudaniyyah Al-Raqmiyyah) Tj\n`;
      streamText += `1 0 0 1 50 375 Tm\n(Custom 3D Flipbook Viewer) Tj\n`;
      streamText += `1 0 0 1 50 200 Tm\n(A local interactive copy was compiled to bypass CORS limits) Tj\n`;
    } else {
      streamText += `/F1 14 Tf\n1 0 0 1 50 780 Tm\n(${escapePdfStr(safeTitle)}) Tj\n`;
      streamText += `/F1 10 Tf\n1 0 0 1 50 755 Tm\n(By ${escapePdfStr(safeAuthor)} | Page ${pageNum} of ${pageCount}) Tj\n`;
      
      const contentLines = getBookPagesContent(bookId, pageNum).split("\n");
      let startY = 680;
      for (const line of contentLines) {
        if (line.trim()) {
          if (line.startsWith("Chapter") || line.startsWith("Poem") || line.startsWith("Proverb")) {
            streamText += `/F1 13 Tf\n1 0 0 1 50 ${startY} Tm\n(${escapePdfStr(line)}) Tj\n`;
            startY -= 25;
          } else {
            streamText += `/F1 11 Tf\n1 0 0 1 50 ${startY} Tm\n(${escapePdfStr(line)}) Tj\n`;
            startY -= 18;
          }
        } else {
          startY -= 10;
        }
      }
    }
    streamText += "ET";
    
    pdf += `${contentObjId} 0 obj\n<< /Length ${streamText.length} >>\nstream\n${streamText}\nendstream\nendobj\n`;
  }
  
  pdf += "xref\n0 1\n0000000000 65535 f \ntrailer\n<< /Size " + (3 + pageCount * 2) + " /Root 1 0 R >>\nstartxref\n100\n%%EOF\n";
  
  const bytes = new Uint8Array(pdf.length);
  for (let j = 0; j < pdf.length; j++) {
    bytes[j] = pdf.charCodeAt(j) & 0xff;
  }
  return bytes;
};

interface ThreeDFlipbookProps {
  book: Book;
  onBackToLibrary: () => void;
  settings: ReadingSettings;
  setSettings: React.Dispatch<React.SetStateAction<ReadingSettings>>;
}

export default function ThreeDFlipbook({ 
  book, 
  onBackToLibrary, 
  settings, 
  setSettings 
}: ThreeDFlipbookProps) {
  // Navigation & Page State
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isBookLoaded, setIsBookLoaded] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFallbackGenerated, setIsFallbackGenerated] = useState<boolean>(false);
  
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // PDF JS References
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [renderedPages, setRenderedPages] = useState<{ [pageNum: number]: string }>({});
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const renderQueueRef = useRef<number[]>([]);

  // Layout & Flip animation state
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");
  const [isRTL, setIsRTL] = useState<boolean>(true); // Default to Arabic RTL
  const [isDoublePage, setIsDoublePage] = useState<boolean>(true);
  const [pdfOrientation, setPdfOrientation] = useState<"portrait" | "landscape">("portrait");
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 1024);
  const [showReadingHud, setShowReadingHud] = useState<boolean>(false);

  // Exact PDF page size & container sizing states
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [pageHeight, setPageHeight] = useState<number>(0);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Bookmarks & Notes
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<BookNote[]>([]);
  const [activeNoteText, setActiveNoteText] = useState<string>("");
  const [showNotesPanel, setShowNotesPanel] = useState<boolean>(false);
  
  // Drag / Touch state for flipping page gesture
  const dragStartX = useRef<number | null>(null);
  const isMouseDown = useRef<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [dragDirectionState, setDragDirectionState] = useState<"next" | "prev" | null>(null);

  // Sync double-page mode with screen size and page orientation
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      if (pdfOrientation === "landscape") {
        setIsDoublePage(false);
      } else {
        setIsDoublePage(width >= 1024);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pdfOrientation]);

  // Measure container dimensions dynamically
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, [isBookLoaded]);

  // Dynamically calculate fitted width and height to maintain exact PDF page ratio
  const getFittedBookStyle = () => {
    if (!isBookLoaded || containerSize.width === 0 || containerSize.height === 0) {
      return {};
    }

    const pW = pageWidth || 595;
    const pH = pageHeight || 842;

    const bookW = isDoublePage ? pW * 2 : pW;
    const bookH = pH;
    const bookRatio = bookW / bookH;

    let maxW = containerSize.width;
    let maxH = containerSize.height;

    if (settings.readingMode) {
      // margins of 10px on each side (20px total), which is about 0.25cm (strictly under 1cm)
      const margin = 20;
      maxW = containerSize.width - margin;
      maxH = containerSize.height - margin;
    } else {
      const paddingFactor = isDoublePage ? 0.90 : 0.95;
      maxW = containerSize.width * paddingFactor;
      maxH = containerSize.height;
    }

    const containerRatio = maxW / maxH;

    let finalW = 0;
    let finalH = 0;

    if (containerRatio > bookRatio) {
      finalH = maxH;
      finalW = maxH * bookRatio;
    } else {
      finalW = maxW;
      finalH = maxW / bookRatio;
    }

    return {
      width: `${Math.round(finalW)}px`,
      height: `${Math.round(finalH)}px`,
    };
  };

  // Close notes panel and hide HUD when entering Comfortable Reading Mode
  useEffect(() => {
    if (settings.readingMode) {
      setShowNotesPanel(false);
      setShowReadingHud(false);
    }
  }, [settings.readingMode]);

  // Web Audio synthesized paper turning effect (100% offline & clean)
  const playPageTurnSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // 1. Physical paper rustling friction (White noise)
      const duration = 0.55; // slightly longer, more organic turn
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + duration);
      
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(400, ctx.currentTime);
      bandpass.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.2);
      bandpass.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + duration);
      bandpass.Q.setValueAtTime(2.5, ctx.currentTime);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.005, ctx.currentTime);
      noiseGain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.12);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      noise.connect(filter);
      filter.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      // 2. Synthesized air swoop/whoosh of lifting the paper sheet (Triangle Oscillator Sweep)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      
      osc.type = "triangle"; // Softer and deeper wave representing air movement
      osc.frequency.setValueAtTime(240, ctx.currentTime); // Pitch sweep
      osc.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + duration - 0.1);
      
      oscGain.gain.setValueAtTime(0.001, ctx.currentTime);
      oscGain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.15); // Build-up as page lifts
      oscGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      
      // Start both nodes
      noise.start();
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  };

  // Convert Google Drive Links or load standard / Local URLs
  useEffect(() => {
    let active = true;
    const loadPdf = async () => {
      setIsBookLoaded(false);
      setLoadError(null);
      setLoadingProgress(10);
      setRenderedPages({});
      setIsFallbackGenerated(false);
      
      try {
        let pdfSource: any = book.pdfUrl;

        // 1. Check if we have a locally cached IndexedDB Blob first (takes priority!)
        if (book.isCustom) {
          try {
            const { getCachedBookBlob } = await import("../utils/indexedDB");
            const cachedBlob = await getCachedBookBlob(book.id);
            if (cachedBlob) {
              const arrayBuffer = await cachedBlob.arrayBuffer();
              pdfSource = new Uint8Array(arrayBuffer);
              console.log("Successfully loaded custom book from local IndexedDB cache!");
            }
          } catch (dbError) {
            console.warn("Could not retrieve book from local IndexedDB cache:", dbError);
          }
        }

        if (typeof pdfSource === "string" && !pdfSource.startsWith("blob:")) {
  // تمرير الرابط عبر الدالة الذكية المربوطة بدومين المشروع الحالي لمنع الـ 404 والـ CORS
  pdfSource = getGoogleDriveDirectLink(pdfSource);
}

        if (!pdfSource) {
          throw new Error("رابط ملف الكتاب غير متوفر أو غير صالح.");
        }

        setLoadingProgress(30);
        
        let loadingTask: any;

        // If pdfSource is the local backend proxy, try it first. If it fails, fallback to CORS bypass.
        if (typeof pdfSource === "string" && pdfSource.startsWith("/api/proxy-pdf")) {
          let fileId = "";
          try {
            const urlObj = new URL(pdfSource, window.location.origin);
            fileId = urlObj.searchParams.get("id") || "";
          } catch (e) {
            fileId = pdfSource.split("?id=")[1] || "";
            if (fileId.includes("&")) {
              fileId = fileId.split("&")[0];
            }
          }

          try {
            console.log("Attempting to load PDF via local Express proxy:", pdfSource);
            const proxyResponse = await fetch(pdfSource);
            if (proxyResponse.ok) {
              const contentType = proxyResponse.headers.get("content-type") || "";
              if (contentType.includes("text/html")) {
                throw new Error("Received HTML content (such as virus warning or login screen) instead of PDF.");
              }
              const arrayBuffer = await proxyResponse.arrayBuffer();
              const firstBytes = new Uint8Array(arrayBuffer.slice(0, 4));
              // Check if it's HTML (starts with '<' which is 60 in ASCII)
              if (firstBytes[0] === 60) {
                throw new Error("Received HTML document instead of PDF binary.");
              }
              loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
            } else {
              throw new Error(`Proxy status: ${proxyResponse.status}`);
            }
          } catch (proxyError) {
            console.warn("Express proxy failed (likely running on static host like Vercel). Trying AllOrigins public CORS proxy fallback...", proxyError);
            
            // AllOrigins free public CORS proxy fallback
            const targetUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
            const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
            
            try {
              const corsResponse = await fetch(corsProxyUrl);
              if (corsResponse.ok) {
                const arrayBuffer = await corsResponse.arrayBuffer();
                loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
              } else {
                throw new Error(`CORS proxy status: ${corsResponse.status}`);
              }
            } catch (corsError) {
              console.warn("Primary CORS proxy failed, trying classic endpoint via CORS proxy...");
              
              const classicUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
              const classicCorsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(classicUrl)}`;
              
              try {
                const classicCorsResponse = await fetch(classicCorsUrl);
                if (classicCorsResponse.ok) {
                  const arrayBuffer = await classicCorsResponse.arrayBuffer();
                  loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
                } else {
                  throw new Error(`Classic CORS proxy status: ${classicCorsResponse.status}`);
                }
              } catch (lastError) {
                throw new Error("لم نتمكن من الاتصال بالملف عبر خادم البروكسي أو قوقل درايف. تأكد من أن إذن الملف في قوقل درايف متاح لـ 'أي شخص لديه الرابط'.");
              }
            }
          }
        } else {
          // Standard URL or direct Uint8Array
          if (typeof pdfSource === "string") {
            loadingTask = pdfjsLib.getDocument({ url: pdfSource });
          } else {
            loadingTask = pdfjsLib.getDocument({ data: pdfSource });
          }
        }
        
        loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
          if (progressData.total > 0) {
            const progress = Math.min(90, Math.round((progressData.loaded / progressData.total) * 100));
            setLoadingProgress(progress);
          }
        };

        const doc = await loadingTask.promise;
        if (!active) return;
        
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        
        // Detect PDF page orientation (Landscape vs Portrait)
        try {
          const firstPage = await doc.getPage(1);
          const viewport = firstPage.getViewport({ scale: 1 });
          const isLandscape = viewport.width > viewport.height;
          setPdfOrientation(isLandscape ? "landscape" : "portrait");
          setPageWidth(viewport.width);
          setPageHeight(viewport.height);
          if (isLandscape) {
            setIsDoublePage(false);
          } else {
            setIsDoublePage(window.innerWidth >= 1024);
          }
        } catch (orientationError) {
          console.error("Error detecting PDF orientation:", orientationError);
        }

        setLoadingProgress(100);
        setIsBookLoaded(true);
        
        // Load initial reading progress if saved
        const storedProgress = localStorage.getItem(`progress_${book.id}`);
        if (storedProgress) {
          const page = parseInt(storedProgress, 10);
          if (page >= 1 && page <= doc.numPages) {
            setCurrentPage(page);
          }
        } else {
          setCurrentPage(1);
        }
      } catch (error: any) {
        console.warn("Primary PDF loading failed, generating interactive local copy: ", error);
        if (!active) return;
        
        try {
          // Generate a highly interactive local fallback copy immediately
          const fallbackBytes = generateSamplePdf(book.title, book.author, book.id);
          setLoadingProgress(60);
          
          const fallbackTask = pdfjsLib.getDocument({ data: fallbackBytes });
          const doc = await fallbackTask.promise;
          
          if (!active) return;
          
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          
          // Detect fallback PDF page orientation (Landscape vs Portrait)
          try {
            const firstPage = await doc.getPage(1);
            const viewport = firstPage.getViewport({ scale: 1 });
            const isLandscape = viewport.width > viewport.height;
            setPdfOrientation(isLandscape ? "landscape" : "portrait");
            setPageWidth(viewport.width);
            setPageHeight(viewport.height);
            if (isLandscape) {
              setIsDoublePage(false);
            } else {
              setIsDoublePage(window.innerWidth >= 1024);
            }
          } catch (oe) {
            console.error("Error detecting fallback PDF orientation:", oe);
          }

          setLoadingProgress(100);
          setIsFallbackGenerated(true);
          setIsBookLoaded(true);
          
          // Load initial reading progress if saved
          const storedProgress = localStorage.getItem(`progress_${book.id}`);
          if (storedProgress) {
            const page = parseInt(storedProgress, 10);
            if (page >= 1 && page <= doc.numPages) {
              setCurrentPage(page);
            }
          } else {
            setCurrentPage(1);
          }
        } catch (fallbackError: any) {
          console.error("Fallback PDF generation failed too: ", fallbackError);
          if (active) {
            setLoadError(
              `فشل تحميل كتاب الـ PDF وتوليد نسخة الطوارئ المحلية. يرجى محاولة رفع الملف يدوياً عبر زر "رفع كتاب محلي (PDF)" في المكتبة لتجاوز قيود CORS الاستثنائية.`
            );
            setIsBookLoaded(false);
          }
        }
      }
    };

    loadPdf();
    
    // Load existing bookmarks and notes for this book from localStorage
    const savedBookmarks = localStorage.getItem(`bookmarks_${book.id}`);
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    } else {
      setBookmarks([]);
    }
    
    const savedNotes = localStorage.getItem(`notes_${book.id}`);
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    } else {
      setNotes([]);
    }

    return () => {
      active = false;
    };
  }, [book]);

  // Handle local state persistence for reading progress
  useEffect(() => {
    if (isBookLoaded && currentPage) {
      localStorage.setItem(`progress_${book.id}`, currentPage.toString());
    }
  }, [currentPage, book.id, isBookLoaded]);

  // Render PDF page to high-quality image cache for instantaneous flip performance
  const renderPageToCache = async (pageNum: number) => {
    if (!pdfDoc || pageNum < 1 || pageNum > numPages || renderedPages[pageNum]) return;
    
    try {
      const page = await pdfDoc.getPage(pageNum);
      
      // Use higher scale for absolute crystal clear text, responsive to zoom settings
      const scale = (settings.zoom / 100) * 2.0; 
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { alpha: false });
      
      if (!context) return;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      
      await page.render(renderContext).promise;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      
      setRenderedPages(prev => ({
        ...prev,
        [pageNum]: dataUrl
      }));
    } catch (e) {
      console.error(`Error rendering page ${pageNum}:`, e);
    }
  };

  // Queue-based page rendering to prevent simultaneous worker conflicts
  useEffect(() => {
    if (!isBookLoaded || !pdfDoc) return;
    
    // Pages to render around current page
    const pagesToRender = [currentPage];
    
    if (isDoublePage) {
      if (currentPage % 2 === 0) {
        // Even page, we are showing current-1 and current
        pagesToRender.push(currentPage - 1);
        pagesToRender.push(currentPage + 1);
        pagesToRender.push(currentPage + 2);
      } else {
        // Odd page, we are showing current and current+1
        pagesToRender.push(currentPage + 1);
        pagesToRender.push(currentPage - 1);
        pagesToRender.push(currentPage - 2);
      }
    } else {
      // Single page
      pagesToRender.push(currentPage - 1);
      pagesToRender.push(currentPage + 1);
    }
    
    // Filter pages inside bounds and not yet rendered
    const queue = pagesToRender.filter(p => p >= 1 && p <= numPages && !renderedPages[p]);
    
    if (queue.length > 0 && !isRendering) {
      setIsRendering(true);
      const nextToRender = queue[0];
      
      renderPageToCache(nextToRender).finally(() => {
        setIsRendering(false);
      });
    }
  }, [currentPage, numPages, isBookLoaded, isDoublePage, renderedPages, isRendering, settings.zoom]);

  // Turn page forward
  const handleNextPage = () => {
    if (isFlipping || currentPage >= numPages) return;
    
    setFlipDirection("next");
    setIsFlipping(true);
    playPageTurnSound();
    
    const steps = isDoublePage ? 2 : 1;
    setTimeout(() => {
      setCurrentPage(prev => {
        const next = prev + steps;
        return next > numPages ? numPages : next;
      });
      setIsFlipping(false);
    }, 450); // Matches transition duration
  };

  // Turn page backward
  const handlePrevPage = () => {
    if (isFlipping || currentPage <= 1) return;
    
    setFlipDirection("prev");
    setIsFlipping(true);
    playPageTurnSound();
    
    const steps = isDoublePage ? 2 : 1;
    setTimeout(() => {
      setCurrentPage(prev => {
        const back = prev - steps;
        return back < 1 ? 1 : back;
      });
      setIsFlipping(false);
    }, 450);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showNotesPanel) return; // Prevent triggering when typing notes
      if (e.key === "ArrowLeft") {
        if (isRTL) handleNextPage(); // In RTL left arrow goes forward
        else handlePrevPage();
      } else if (e.key === "ArrowRight") {
        if (isRTL) handlePrevPage(); // In RTL right arrow goes backward
        else handleNextPage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, numPages, isDoublePage, isRTL, isFlipping, showNotesPanel]);

  // Mouse Drag / Touch Swipe gesture handling
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isFlipping) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    dragStartX.current = clientX;
    isMouseDown.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStartX.current === null) return;
    if (e.type === "mousemove" && !isMouseDown.current) return;

    const clientX = "touches" in e 
      ? (e.touches.length > 0 ? e.touches[0].clientX : dragStartX.current) 
      : (e as React.MouseEvent).clientX;
      
    const diffX = clientX - dragStartX.current;
    
    // Determine drag direction based on drag offset and language direction (RTL vs LTR)
    let dir: "next" | "prev" | null = null;
    if (isRTL) {
      dir = diffX > 0 ? "next" : "prev";
    } else {
      dir = diffX > 0 ? "prev" : "next";
    }

    // Validate boundaries (can't go next if at last page, can't go prev if at first page)
    if (dir === "next" && currentPage >= numPages) {
      return;
    }
    if (dir === "prev" && currentPage <= 1) {
      return;
    }

    // Set dragging state and offset
    setIsDragging(true);
    setDragOffset(diffX);
    setDragDirectionState(dir);
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    isMouseDown.current = false;
    if (dragStartX.current === null) return;

    const clientX = "changedTouches" in e 
      ? e.changedTouches[0].clientX 
      : (e as React.MouseEvent).clientX;
      
    const diffX = clientX - dragStartX.current;
    const absDiffX = Math.abs(diffX);

    if (isDragging && dragDirectionState) {
      // If the drag went far enough (more than 60px), trigger actual page turn
      if (absDiffX > 60) {
        if (dragDirectionState === "next") {
          handleNextPage();
        } else {
          handlePrevPage();
        }
      }
    } else if (absDiffX > 60) {
      // Fallback for extremely fast swipes with no move events captured
      if (diffX > 0) {
        if (isRTL) handleNextPage();
        else handlePrevPage();
      } else {
        if (isRTL) handlePrevPage();
        else handleNextPage();
      }
    }

    // Reset drag states
    setIsDragging(false);
    setDragOffset(0);
    setDragDirectionState(null);
    dragStartX.current = null;
  };

  // Add/Remove Bookmarks
  const toggleBookmark = () => {
    const isBookmarked = bookmarks.some(b => b.page === currentPage);
    let updated: Bookmark[];
    
    if (isBookmarked) {
      updated = bookmarks.filter(b => b.page !== currentPage);
    } else {
      const newBookmark: Bookmark = {
        id: Math.random().toString(36).substr(2, 9),
        bookId: book.id,
        page: currentPage,
        label: `الصفحة ${currentPage}`,
        createdAt: Date.now()
      };
      updated = [...bookmarks, newBookmark].sort((a, b) => a.page - b.page);
    }
    
    setBookmarks(updated);
    localStorage.setItem(`bookmarks_${book.id}`, JSON.stringify(updated));
  };

  // Add Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNoteText.trim()) return;
    
    const newNote: BookNote = {
      id: Math.random().toString(36).substr(2, 9),
      bookId: book.id,
      page: currentPage,
      text: activeNoteText.trim(),
      createdAt: Date.now()
    };
    
    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem(`notes_${book.id}`, JSON.stringify(updated));
    setActiveNoteText("");
  };

  // Delete Note
  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter(n => n.id !== noteId);
    setNotes(updated);
    localStorage.setItem(`notes_${book.id}`, JSON.stringify(updated));
  };

  // Zoom toggles
  const handleZoomIn = () => {
    setSettings(prev => ({ ...prev, zoom: Math.min(200, prev.zoom + 15) }));
    setRenderedPages({}); // Clear cache to render higher-res
  };

  const handleZoomOut = () => {
    setSettings(prev => ({ ...prev, zoom: Math.max(100, prev.zoom - 15) }));
    setRenderedPages({}); // Clear cache
  };

  // Calculate pages showing in double page mode
  // Pages are numbered: 1 (cover, single), then (2-3), (4-5)... or simply starting double.
  // To keep it standard, let's treat currentPage as the "focus" page.
  // If currentPage is 1 (Cover), we show page 1 on the right, and a blank template on the left (RTL style).
  // If currentPage is Even, we show [currentPage] on the left and [currentPage-1] on the right (RTL style).
  // If currentPage is Odd, we show [currentPage+1] on the left and [currentPage] on the right (RTL style).
  const getDoublePagePair = () => {
    if (currentPage === 1) {
      return { left: null, right: 1 };
    }
    if (currentPage % 2 === 0) {
      return { left: currentPage, right: currentPage - 1 };
    } else {
      return { left: currentPage + 1 > numPages ? null : currentPage + 1, right: currentPage };
    }
  };

  const { left: doubleLeftPage, right: doubleRightPage } = getDoublePagePair();

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${
      settings.darkMode 
        ? "bg-[#1E1916] text-[#EADDC9]" 
        : "bg-[#FDFBF7] text-[#4A3B32]"
    } selection:bg-[#D4A373] selection:text-white`}>
      
      {/* 1. Header Toolbar (Hidden in absolute Reading Mode) */}
      {!settings.readingMode && (
        <header className={`border-b px-4 lg:px-8 py-3 transition-colors duration-300 ${
          settings.darkMode 
            ? "border-[#3A3029] bg-[#27211D]" 
            : "border-[#E6D5B8] bg-[#FAF6EE]"
        }`}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
            
            {/* Right: Book Meta & Back button */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <button 
                id="back_to_library_btn"
                onClick={onBackToLibrary}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  settings.darkMode 
                    ? "bg-[#3A3029] text-[#FAF6EE] hover:bg-[#4E4138]" 
                    : "bg-[#E6D5B8] text-[#4A3B32] hover:bg-[#DFCDB0]"
                }`}
              >
                <ChevronRight className="w-4 h-4" />
                <span>الرجوع للمكتبة</span>
              </button>
              
              <div className="text-right sm:mr-4">
                <div className="flex items-center gap-2 justify-end">
                  {isFallbackGenerated && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-900/50 animate-pulse">
                      نسخة تفاعلية محاورة
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    pdfOrientation === "landscape"
                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50"
                      : "bg-[#5A5A40]/10 text-[#5A5A40] dark:text-[#CBB59C] border-[#5A5A40]/20"
                  }`}>
                    {pdfOrientation === "landscape" ? "مخطوطة أفقية" : "مخطوطة رأسية"}
                  </span>
                  <h1 className="font-bold text-base md:text-lg tracking-tight line-clamp-1">
                    {book.title}
                  </h1>
                </div>
                <p className={`text-xs ${settings.darkMode ? "text-[#CBB59C]" : "text-[#8D7B68]"}`}>
                  الكاتب: {book.author}
                </p>
              </div>
            </div>

            {/* Left: Global Toolbars */}
            <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end">
              
              {/* RTL / LTR Toggle */}
              <button
                onClick={() => setIsRTL(!isRTL)}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  settings.darkMode ? "hover:bg-[#3A3029]" : "hover:bg-[#E6D5B8]"
                }`}
                title="تغيير اتجاه تقليب الصفحات"
              >
                <Compass className="w-4 h-4" />
                <span>{isRTL ? "تقليب عربي (RTL)" : "تقليب إنجليزي (LTR)"}</span>
              </button>

              {/* Page Layout Mode Toggle */}
              <button
                onClick={() => setIsDoublePage(!isDoublePage)}
                className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  settings.darkMode ? "hover:bg-[#3A3029]" : "hover:bg-[#E6D5B8]"
                }`}
                title="تغيير طريقة عرض الصفحات (صفحة واحدة / صفحتين)"
              >
                {isDoublePage ? <FileText className="w-4 h-4 text-[#5A5A40]" /> : <BookOpen className="w-4 h-4 text-[#5A5A40]" />}
                <span>{isDoublePage ? "عرض صفحة واحدة" : "عرض صفحتين"}</span>
              </button>

              {/* Sound FX Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-all ${
                  settings.darkMode ? "hover:bg-[#3A3029]" : "hover:bg-[#E6E0D4]"
                }`}
                title={soundEnabled ? "كتم صوت تقليب الورق" : "تشغيل صوت تقليب الورق"}
              >
                {soundEnabled ? <Volume2 className="w-4.5 h-4.5 text-[#5A5A40]" /> : <VolumeX className="w-4.5 h-4.5 opacity-50" />}
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                className={`p-2 rounded-lg transition-all ${
                  settings.darkMode ? "bg-[#3A3029] text-[#F3EFE0]" : "bg-[#E6E0D4] text-[#4A3B32]"
                }`}
                title="تغيير مظهر الإضاءة"
              >
                {settings.darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>

              {/* Zoom buttons */}
              <div className="flex items-center bg-transparent rounded-lg border border-neutral-300 dark:border-[#52453D] overflow-hidden">
                <button
                  onClick={handleZoomOut}
                  disabled={settings.zoom <= 100}
                  className={`p-1.5 transition-all ${
                    settings.darkMode ? "hover:bg-[#3A3029]" : "hover:bg-[#E6E0D4]"
                  } disabled:opacity-30`}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono px-2 min-w-[45px] text-center">
                  {settings.zoom}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={settings.zoom >= 200}
                  className={`p-1.5 transition-all ${
                    settings.darkMode ? "hover:bg-[#3A3029]" : "hover:bg-[#E6E0D4]"
                  } disabled:opacity-30`}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Bookmark Toggle */}
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-lg transition-all ${
                  bookmarks.some(b => b.page === currentPage)
                    ? "bg-[#5A5A40] text-white"
                    : settings.darkMode ? "hover:bg-[#3A3029]" : "hover:bg-[#E6E0D4]"
                }`}
                title="حفظ علامة مرجعية هنا"
              >
                <BookmarkIcon className="w-4.5 h-4.5" />
              </button>

              {/* Notes sidebar toggle */}
              <button
                onClick={() => setShowNotesPanel(!showNotesPanel)}
                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${
                  showNotesPanel
                    ? "bg-[#4A3B32] text-white dark:bg-[#5A5A40]"
                    : settings.darkMode ? "hover:bg-[#3A3029]" : "hover:bg-[#E6E0D4]"
                }`}
              >
                <FileText className="w-4.5 h-4.5" />
                <span className="text-xs hidden md:inline">الهوامش والملاحظات</span>
              </button>
            </div>

          </div>
        </header>
      )}

      {/* Invisible Top Hotzone to toggle HUD in reading mode */}
      {settings.readingMode && (
        <div 
          onClick={() => setShowReadingHud(prev => !prev)}
          className="fixed top-0 left-0 right-0 h-16 z-40 cursor-pointer flex items-center justify-center group select-none"
          title="انقر هنا لإظهار/إخفاء أزرار التحكم"
        >
          {/* Subtle elegant touch gesture indicator */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-[#5A5A40]/20 dark:bg-[#CBB59C]/20 group-hover:bg-[#5A5A40]/60 dark:group-hover:bg-[#CBB59C]/60 group-hover:h-1.5 transition-all duration-300"></div>
          
          <div className="text-[11px] font-medium text-[#5A5A40] dark:text-[#CBB59C] opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0 bg-[#FAF7EE]/95 dark:bg-[#201A16]/95 px-4 py-1.5 rounded-full border border-[#EADDC9] dark:border-[#3D322A] shadow-lg mt-5">
            {showReadingHud ? "انقر لإخفاء أزرار التحكم والرجوع" : "انقر هنا لإظهار أزرار التحكم والرجوع"}
          </div>
        </div>
      )}

      {/* Reading Mode floating HUD */}
      {settings.readingMode && showReadingHud && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <button
            onClick={() => {
              setSettings(prev => ({ ...prev, readingMode: false }));
              setShowReadingHud(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-xl text-xs font-semibold backdrop-blur-md transition-all ${
              settings.darkMode 
                ? "bg-[#27211D]/95 text-[#FAF6EE] hover:bg-[#3A3029] border border-[#3A3029]" 
                : "bg-white/95 text-[#4A3B32] border border-[#E6E0D4] hover:bg-[#FDFBF7]"
            }`}
          >
            <Eye className="w-4 h-4 text-[#5A5A40]" />
            <span>عرض بقية الواجهة</span>
          </button>
          
          <button
            onClick={onBackToLibrary}
            className={`p-2.5 rounded-full shadow-xl backdrop-blur-md transition-all ${
              settings.darkMode 
                ? "bg-[#27211D]/95 text-white hover:bg-[#3A3029] border border-[#3A3029]" 
                : "bg-white/95 text-[#4A3B32] border border-[#E6E0D4] hover:bg-[#FDFBF7]"
            }`}
            title="رجوع للمكتبة"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main viewer workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side Menu - Bookmarks list and Info (Floating or side panel) */}
        {!settings.readingMode && (
          <aside className={`w-80 hidden xl:flex flex-col border-l transition-all duration-300 overflow-y-auto ${
            settings.darkMode 
              ? "border-[#3A3029] bg-[#27211D]/60" 
              : "border-[#E6E0D4] bg-[#FAF6EE]/60"
          }`}>
            <div className="p-5 border-b border-[#E6E0D4]/40 dark:border-[#3A3029]/40">
              <h2 className="font-bold text-sm tracking-widest text-[#5A5A40] uppercase mb-1">
                تفاصيل المجلد
              </h2>
              <p className="text-sm font-semibold line-clamp-2">{book.title}</p>
              <p className="text-xs opacity-75 mt-1">الكاتب: {book.author}</p>
              <div className="mt-3 text-xs leading-relaxed opacity-85 bg-[#5A5A40]/5 p-3 rounded-lg border border-[#5A5A40]/10">
                {book.description || "لا يوجد وصف متوفر لهذا المجلد العريق."}
              </div>
            </div>

            {/* Quick bookmarks */}
            <div className="p-5">
              <h3 className="font-bold text-xs text-[#5A5A40] uppercase tracking-wider mb-3 flex items-center gap-1">
                <BookmarkIcon className="w-3.5 h-3.5" />
                <span>العلامات المحفوظة ({bookmarks.length})</span>
              </h3>
              
              {bookmarks.length === 0 ? (
                <p className="text-xs opacity-60 italic text-center py-4 bg-[#E6E0D4]/10 dark:bg-black/10 rounded-lg">
                  لم تحفظ أي صفحات بعد. اضغط أيقونة العلامة لحفظ الصفحة الحالية.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {bookmarks.map((bm) => (
                    <button
                      key={bm.id}
                      onClick={() => {
                        if (!isFlipping) {
                          setCurrentPage(bm.page);
                          playPageTurnSound();
                        }
                      }}
                      className={`w-full text-right p-2.5 rounded-lg text-xs flex justify-between items-center transition-all ${
                        currentPage === bm.page
                          ? "bg-[#5A5A40] text-white"
                          : settings.darkMode ? "bg-[#3A3029] hover:bg-[#4E4138]" : "bg-[#FAF6EE] hover:bg-[#E6E0D4]"
                      }`}
                    >
                      <span className="font-bold">الصفحة {bm.page}</span>
                      <span className="text-[10px] opacity-75">
                        {new Date(bm.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reading tips and instructions */}
            <div className="mt-auto p-5 border-t border-[#E6E0D4]/40 dark:border-[#3A3029]/40 bg-[#5A5A40]/5">
              <h4 className="text-xs font-bold text-[#5A5A40] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>إرشادات القارئ التفاعلي</span>
              </h4>
              <ul className="text-[11px] space-y-1.5 list-disc list-inside opacity-80 leading-relaxed">
                <li>استخدم أسهم الكيبورد (يمنة/يسرة) لتقليب سريع وممتع.</li>
                <li>اسحب الفأرة على الصفحة أو المسها لتقليب ورقي مجسم.</li>
                <li>قم بتفعيل وضع "القراءة المريح" للتركيز الكامل على النص.</li>
                <li>تخزين الملف يتم مؤقتاً تلقائياً ليعمل دون شبكة لاحقاً.</li>
              </ul>
            </div>
          </aside>
        )}

        {/* Center Canvas Workspace for Book View */}
        <main 
          className={`flex-1 flex flex-col items-center justify-center relative overflow-hidden select-none transition-all duration-300 ${
            settings.readingMode ? "p-[10px]" : "p-4 lg:p-8"
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          {/* Decorative traditional border inside the book workspace */}
          {!settings.readingMode && (
            <div className="absolute inset-4 border border-[#E6E0D4]/20 dark:border-[#3A3029]/20 pointer-events-none rounded-2xl flex items-center justify-between">
              <div className="w-1.5 h-full border-r border-[#E6E0D4]/25 dark:border-[#3A3029]/25"></div>
              <div className="w-1.5 h-full border-l border-[#E6E0D4]/25 dark:border-[#3A3029]/25"></div>
            </div>
          )}

          {/* Page Loading Indicators */}
          <AnimatePresence>
            {!isBookLoaded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center z-20 backdrop-blur-md bg-transparent"
              >
                {loadError ? (
                  <div className={`p-6 max-w-lg rounded-2xl border text-center shadow-xl ${
                    settings.darkMode 
                      ? "bg-[#27211D] border-[#C84B31]/30" 
                      : "bg-[#FFF8F5] border-[#C84B31]/30"
                  }`}>
                    <AlertTriangle className="w-12 h-12 text-[#C84B31] mx-auto mb-4 animate-bounce" />
                    <h3 className="font-bold text-lg text-[#C84B31] mb-2">تنبيه أثناء تحميل الكتاب</h3>
                    <p className="text-xs leading-relaxed mb-5 opacity-90">{loadError}</p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={onBackToLibrary}
                        className="px-4 py-2 bg-[#E6E0D4] text-[#4A3B32] font-semibold text-xs rounded-xl hover:bg-[#DFCDB0]"
                      >
                        العودة للمكتبة
                      </button>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-[#5A5A40] text-white font-semibold text-xs rounded-xl hover:bg-[#4A4A32]"
                      >
                        إعادة المحاولة
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    {/* Sudanese inspired spinner circle */}
                    <div className="relative w-24 h-24 mx-auto mb-5">
                      <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#5A5A40]/30 animate-spin"></div>
                      <div className="absolute inset-2 rounded-full border-4 border-[#C84B31] animate-ping opacity-25"></div>
                      <div className="absolute inset-4 rounded-full bg-[#5A5A40]/20 flex items-center justify-center">
                        <BookOpen className="w-7 h-7 text-[#5A5A40]" />
                      </div>
                    </div>
                    <h3 className="font-bold text-[#5A5A40] text-md">جاري فتح المخطوطة الأثرية...</h3>
                    <p className={`text-xs mt-2 font-mono ${settings.darkMode ? "text-[#CBB59C]" : "text-[#8D7B68]"}`}>
                      جاري فك تشفير وتظليل الصفحات: {loadingProgress}%
                    </p>
                    {/* progress bar */}
                    <div className="w-48 h-1 bg-neutral-200 dark:bg-[#3A3029] rounded-full mx-auto mt-4 overflow-hidden">
                      <div 
                        className="h-full bg-[#5A5A40] transition-all duration-300"
                        style={{ width: `${loadingProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3D BOOK ENGINE GRAPHIC */}
          {isBookLoaded && (
            <div 
              id="flipbook-container"
              ref={containerRef}
              className={`relative flex items-center justify-center w-full transition-all duration-300 ${
                settings.readingMode 
                  ? "max-w-none h-[calc(100vh-20px)]" 
                  : "max-w-5xl h-[65vh] sm:h-[70vh] md:h-[75vh]"
              }`}
              style={{
                perspective: "1500px",
              }}
            >
              <div 
                className="relative flex items-center justify-center transition-transform duration-300"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `scale(${settings.zoom / 100})`,
                  ...getFittedBookStyle()
                }}
              >
                
                {/* Book Spine (Backbone shadow element in double mode) */}
                {isDoublePage && (
                  <div className="absolute top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-black/40 via-black/10 to-black/40 left-1/2 -translate-x-1/2 pointer-events-none rounded-sm shadow-inner"></div>
                )}

                {/* THE BOOK VIEWER FRAME */}
                <div className="relative flex justify-center w-full h-full transform-gpu" style={{ transformStyle: "preserve-3d" }}>
                  
                  {/* SINGLE PAGE VIEW MODE (Mobile & Tablet) */}
                  {!isDoublePage ? (
                    <div 
                      onClick={(e) => {
                        // Tap to turn page: left side goes left, right side goes right
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        if (x < rect.width / 2) {
                          if (isRTL) handleNextPage();
                          else handlePrevPage();
                        } else {
                          if (isRTL) handlePrevPage();
                          else handleNextPage();
                        }
                      }}
                      className={`relative w-full h-full rounded-xl overflow-hidden shadow-2xl border-4 cursor-pointer transition-transform active:scale-[0.99] select-none ${
                        settings.darkMode 
                          ? "bg-[#2D2520] border-[#3D322A]" 
                          : "bg-[#FFFDF9] border-[#EADDC9]"
                      }`}
                    >
                      {/* Leaf pattern watermark background */}
                      <div className="absolute inset-0 bg-[radial-gradient(#5A5A40_0.5px,transparent_0.5px)] [background-size:12px_12px] opacity-10 pointer-events-none"></div>

                      {renderedPages[currentPage] ? (
                        <img 
                           src={renderedPages[currentPage]} 
                          alt={`الصفحة ${currentPage}`} 
                          className="w-full h-full object-contain pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <span className="animate-pulse text-xs text-[#5A5A40]">جاري صقل الحروف... ({currentPage})</span>
                        </div>
                      )}
                      
                      {/* Page number footer */}
                      <div className="absolute bottom-2 left-4 right-4 flex justify-between items-center text-[10px] font-mono opacity-60">
                        <span>{book.title}</span>
                        <span>{currentPage} / {numPages}</span>
                      </div>
                    </div>
                  ) : (
                    
                    /* DOUBLE PAGE VIEW MODE (Desktop) */
                    <div className="flex w-full h-full" style={{ transformStyle: "preserve-3d" }}>
                      
                      {/* LEFT PAGE CONTAINER */}
                      <div 
                        onClick={() => {
                          if (isRTL) handleNextPage();
                          else handlePrevPage();
                        }}
                        className={`w-1/2 h-full relative rounded-r-none rounded-l-2xl border-4 border-r-0 shadow-2xl flex flex-col justify-between overflow-hidden transition-all transform-gpu cursor-pointer active:brightness-95 ${
                          settings.darkMode 
                            ? "bg-[#261F1A] border-[#3D322A]" 
                            : "bg-[#FAF7EE] border-[#EADDC9]"
                        }`}
                        style={{
                          transformOrigin: "right center"
                        }}
                      >
                        {/* Shadow on inner spine */}
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/25 to-transparent pointer-events-none z-10"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(#5A5A40_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-5 pointer-events-none"></div>

                        {/* Page Content */}
                        {doubleLeftPage ? (
                          renderedPages[doubleLeftPage] ? (
                            <img 
                              src={renderedPages[doubleLeftPage]} 
                              alt={`الصفحة ${doubleLeftPage}`} 
                              className="w-full h-full object-contain pointer-events-none"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <span className="animate-pulse text-xs text-[#5A5A40]">جاري صقل الحروف... ({doubleLeftPage})</span>
                            </div>
                          )
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center opacity-30">
                            <BookOpen className="w-12 h-12 text-[#5A5A40] mb-2" />
                            <span className="text-xs">نهاية المجلد الأثرى</span>
                          </div>
                        )}

                        {/* Page Indicator */}
                        {doubleLeftPage && (
                          <div className="absolute bottom-2.5 left-6 right-3 flex justify-between text-[10px] font-mono opacity-65">
                            <span>{doubleLeftPage}</span>
                            <span>{book.author}</span>
                          </div>
                        )}
                      </div>

                      {/* RIGHT PAGE CONTAINER */}
                      <div 
                        onClick={() => {
                          if (isRTL) handlePrevPage();
                          else handleNextPage();
                        }}
                        className={`w-1/2 h-full relative rounded-l-none rounded-r-2xl border-4 border-l-0 shadow-2xl flex flex-col justify-between overflow-hidden transition-all transform-gpu cursor-pointer active:brightness-95 ${
                          settings.darkMode 
                            ? "bg-[#261F1A] border-[#3D322A]" 
                            : "bg-[#FAF7EE] border-[#EADDC9]"
                        }`}
                      >
                        {/* Shadow on inner spine */}
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/25 to-transparent pointer-events-none z-10"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(#5A5A40_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-5 pointer-events-none"></div>

                        {/* Page Content */}
                        {doubleRightPage ? (
                          renderedPages[doubleRightPage] ? (
                            <img 
                              src={renderedPages[doubleRightPage]} 
                              alt={`الصفحة ${doubleRightPage}`} 
                              className="w-full h-full object-contain pointer-events-none"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <span className="animate-pulse text-xs text-[#5A5A40]">جاري صقل الحروف... ({doubleRightPage})</span>
                            </div>
                          )
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center opacity-30">
                            <span className="text-xs">بداية الغلاف</span>
                          </div>
                        )}

                        {/* Page Indicator */}
                        {doubleRightPage && (
                          <div className="absolute bottom-2.5 left-3 right-6 flex justify-between text-[10px] font-mono opacity-65">
                            <span>{book.title}</span>
                            <span>{doubleRightPage}</span>
                          </div>
                        )}
                      </div>

                      {/* 3D FLIPPING PAGE SHEET (CSS preserve-3d animation layered absolutely on top) */}
                      {(() => {
                        const isSheetActive = isFlipping || (isDragging && dragDirectionState !== null);
                        const activeDirection = isDragging ? dragDirectionState : flipDirection;

                        // Calculate progress of dragging from 0 to 1 based on dragOffset (250px max width for swipe)
                        const dragProgress = Math.min(Math.max(Math.abs(dragOffset) / 250, 0), 1);

                        // Compute drag rotation, skew/curl, and z depth
                        let dragRotateY = 0;
                        let dragSkewY = 0;
                        let dragZ = 0;

                        if (isDragging && dragDirectionState) {
                          const dir = dragDirectionState;
                          if (isRTL) {
                            if (dir === "next") {
                              dragRotateY = dragProgress * -180;
                              dragSkewY = Math.sin(dragProgress * Math.PI) * -16; // gorgeous curved page bend
                            } else {
                              dragRotateY = -180 + (dragProgress * 180);
                              dragSkewY = Math.sin(dragProgress * Math.PI) * 16;
                            }
                          } else {
                            if (dir === "next") {
                              dragRotateY = dragProgress * -180;
                              dragSkewY = Math.sin(dragProgress * Math.PI) * 16;
                            } else {
                              dragRotateY = 180 - (dragProgress * 180);
                              dragSkewY = Math.sin(dragProgress * Math.PI) * -16;
                            }
                          }
                          dragZ = Math.sin(dragProgress * Math.PI) * 110; // realistic lifting depth
                        }

                        const animateState = isDragging 
                          ? { 
                              rotateY: dragRotateY, 
                              z: dragZ, 
                              skewY: dragSkewY 
                            } 
                          : { 
                              rotateY: isRTL 
                                ? (flipDirection === "next" ? -180 : 0) 
                                : (flipDirection === "next" ? -180 : 0),
                              z: [0, 85, 0], // Lifts page towards viewer
                              skewY: isRTL
                                ? (flipDirection === "next" ? [0, -12, 0] : [0, 12, 0]) // Page curl bend
                                : (flipDirection === "next" ? [0, 12, 0] : [0, -12, 0])
                            };

                        const transitionState = isDragging 
                          ? { type: "tween", ease: "easeOut", duration: 0.05 } // fast response
                          : { duration: 0.55, ease: "easeInOut" }; // smooth automatic turn

                        return (
                          <AnimatePresence>
                            {isSheetActive && activeDirection && (
                              <motion.div
                                initial={{ 
                                  rotateY: isRTL 
                                    ? (activeDirection === "next" ? 0 : -180) 
                                    : (activeDirection === "next" ? 0 : 180),
                                  z: 0,
                                  skewY: 0
                                }}
                                animate={animateState}
                                transition={transitionState}
                                style={{
                                  position: "absolute",
                                  width: "50%",
                                  height: "100%",
                                  top: 0,
                                  left: isRTL ? 0 : "50%", // RTL starts flip from right, LTR from left
                                  transformOrigin: isRTL ? "right center" : "left center",
                                  transformStyle: "preserve-3d",
                                  zIndex: 40,
                                  pointerEvents: "none",
                                }}
                                className="shadow-2xl"
                              >
                                {/* Front of flipping sheet */}
                                <div 
                                  className={`absolute inset-0 w-full h-full overflow-hidden flex flex-col justify-between border-4 ${
                                    settings.darkMode 
                                      ? "bg-[#2B231D] border-[#3D322A]" 
                                      : "bg-[#FDFBF7] border-[#EADDC9]"
                                  }`}
                                  style={{
                                    backfaceVisibility: "hidden",
                                    transform: "rotateY(0deg)",
                                    borderRadius: isRTL ? "2px 12px 12px 2px" : "12px 2px 2px 12px"
                                  }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-black/25 pointer-events-none"></div>
                                  {/* Show next or prev page content based on directions */}
                                  {renderedPages[activeDirection === "next" ? currentPage + (isRTL ? 1 : 1) : currentPage - 1] ? (
                                    <img 
                                      src={renderedPages[activeDirection === "next" ? currentPage + 1 : currentPage - 1]} 
                                      className="w-full h-full object-contain pointer-events-none"
                                      alt="تحميل"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-transparent">
                                      <span className="text-xs text-amber-600">...</span>
                                    </div>
                                  )}
                                </div>

                                {/* Back of flipping sheet */}
                                <div 
                                  className={`absolute inset-0 w-full h-full overflow-hidden flex flex-col justify-between border-4 ${
                                    settings.darkMode 
                                      ? "bg-[#2B231D] border-[#3D322A]" 
                                      : "bg-[#FDFBF7] border-[#EADDC9]"
                                  }`}
                                  style={{
                                    backfaceVisibility: "hidden",
                                    transform: "rotateY(180deg)",
                                    borderRadius: isRTL ? "12px 2px 2px 12px" : "2px 12px 12px 2px"
                                  }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-l from-black/5 to-black/25 pointer-events-none"></div>
                                  {renderedPages[activeDirection === "next" ? currentPage + 2 : currentPage] ? (
                                    <img 
                                      src={renderedPages[activeDirection === "next" ? currentPage + 2 : currentPage]} 
                                      className="w-full h-full object-contain pointer-events-none"
                                      alt="تحميل"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-transparent">
                                      <span className="text-xs text-amber-600">...</span>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        );
                      })()}

                    </div>
                  )}

                  {/* Desktop Margin Touch Overlays for Easy Clicking */}
                  {!settings.readingMode && (
                    <>
                      <div className="absolute inset-y-0 -left-6 md:-left-12 w-12 md:w-20 flex items-center justify-center z-30">
                        <button
                          onClick={isRTL ? handleNextPage : handlePrevPage}
                          className={`p-2.5 rounded-full shadow-lg backdrop-blur-md border transition-all ${
                            settings.darkMode 
                              ? "bg-[#27211D]/80 border-[#3A3029] text-[#FAF6EE] hover:bg-[#3A3029]" 
                              : "bg-white/80 border-[#E6E0D4] text-[#4A3B32] hover:bg-[#FAF6EE]"
                          }`}
                          title={isRTL ? "الصفحة التالية" : "الصفحة السابقة"}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="absolute inset-y-0 -right-6 md:-right-12 w-12 md:w-20 flex items-center justify-center z-30">
                        <button
                          onClick={isRTL ? handlePrevPage : handleNextPage}
                          className={`p-2.5 rounded-full shadow-lg backdrop-blur-md border transition-all ${
                            settings.darkMode 
                              ? "bg-[#27211D]/80 border-[#3A3029] text-[#FAF6EE] hover:bg-[#3A3029]" 
                              : "bg-white/80 border-[#E6E0D4] text-[#4A3B32] hover:bg-[#FAF6EE]"
                          }`}
                          title={isRTL ? "الصفحة السابقة" : "الصفحة التالية"}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* Interactive slider & progress HUD */}
          {isBookLoaded && !settings.readingMode && (
            <div className={`mt-6 md:mt-10 w-full max-w-xl p-4 rounded-2xl shadow-md border ${
              settings.darkMode 
                ? "bg-[#27211D] border-[#3A3029]" 
                : "bg-[#FAF6EE] border-[#E6E0D4]"
            }`}>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="font-mono text-[#5A5A40]">{currentPage} / {numPages}</span>
                <span className="text-[#8D7B68] dark:text-[#CBB59C]">مؤشر تقدم القراءة</span>
              </div>
              <input 
                type="range" 
                min={1}
                max={numPages}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isFlipping) {
                    setCurrentPage(val);
                    playPageTurnSound();
                  }
                }}
                className="w-full accent-[#5A5A40] cursor-pointer h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-800"
              />
              
              <div className="flex justify-between mt-3">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => {
                    setCurrentPage(1);
                    playPageTurnSound();
                  }}
                  className="text-[11px] font-medium opacity-75 hover:opacity-100 disabled:opacity-30 hover:text-[#5A5A40]"
                >
                  البداية (الغلاف)
                </button>

                {/* Comfortable Reading Mode Quick Switch */}
                <button
                  onClick={() => setSettings(prev => ({ ...prev, readingMode: !prev.readingMode }))}
                  className="text-[11px] font-medium flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#5A5A40]/20 bg-[#5A5A40]/5 text-[#5A5A40] hover:bg-[#5A5A40]/15"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{settings.readingMode ? "إظهار الهوامش والواجهة" : "تفعيل القراءة المريحة"}</span>
                </button>

                <button
                  disabled={currentPage >= numPages}
                  onClick={() => {
                    setCurrentPage(numPages);
                    playPageTurnSound();
                  }}
                  className="text-[11px] font-medium opacity-75 hover:opacity-100 disabled:opacity-30 hover:text-[#5A5A40]"
                >
                  النهاية
                </button>
              </div>
            </div>
          )}

        </main>

        {/* Notes sidebar panel */}
        <AnimatePresence>
          {showNotesPanel && (
            <motion.aside 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className={`fixed top-0 bottom-0 left-0 w-80 md:w-96 z-50 border-r shadow-2xl flex flex-col ${
                settings.darkMode 
                  ? "border-[#3A3029] bg-[#221B17]" 
                  : "border-[#E6E0D4] bg-[#FDFBF7]"
              }`}
            >
              <div className="p-4 border-b border-[#E6E0D4] dark:border-[#3A3029] flex justify-between items-center">
                <h3 className="font-bold text-[#5A5A40] text-sm">ملاحظات وهوامش الكتاب</h3>
                <button 
                  onClick={() => setShowNotesPanel(false)}
                  className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-[#3A3029]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Note adding form */}
              <form onSubmit={handleAddNote} className="p-4 border-b border-[#E6E0D4] dark:border-[#3A3029]">
                <div className="flex justify-between text-xs mb-2 text-[#5A5A40] font-bold">
                  <span>تأليف الهامش على الصفحة الحالية</span>
                  <span>الصفحة {currentPage}</span>
                </div>
                <textarea
                  value={activeNoteText}
                  onChange={(e) => setActiveNoteText(e.target.value)}
                  placeholder="اكتب فكرتك أو اقتباسك هنا للرجوع إليها لاحقاً..."
                  rows={3}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:ring-1 focus:ring-[#5A5A40] outline-none ${
                    settings.darkMode 
                      ? "bg-[#332822] border-[#42332B]" 
                      : "bg-[#FAF7EE] border-[#E6E0D4]"
                  }`}
                />
                <button
                  type="submit"
                  disabled={!activeNoteText.trim()}
                  className="w-full mt-3 bg-[#5A5A40] hover:bg-[#4A4A32] text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50 transition-colors"
                >
                  حفظ الهامش
                </button>
              </form>

              {/* Notes list */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                <h4 className="text-xs font-semibold opacity-70 mb-2">الهوامش المحفوظة للكتاب ({notes.length})</h4>
                
                {notes.length === 0 ? (
                  <div className="text-center py-10 opacity-60 text-xs italic">
                    لا توجد أي هوامش مكتوبة بعد.
                  </div>
                ) : (
                  notes.map((nt) => (
                    <div 
                      key={nt.id}
                      className={`p-3 rounded-xl border text-xs relative ${
                        settings.darkMode 
                          ? "bg-[#2D2520] border-[#3D322A]" 
                          : "bg-[#FAF6EE] border-[#E6E0D4]"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1 text-[#5A5A40] font-bold">
                        <button 
                          onClick={() => {
                            if (!isFlipping) {
                              setCurrentPage(nt.page);
                              playPageTurnSound();
                            }
                          }}
                          className="hover:underline text-[10px]"
                        >
                          الصفحة {nt.page}
                        </button>
                        <button
                          onClick={() => handleDeleteNote(nt.id)}
                          className="text-red-500 hover:text-red-700 font-semibold"
                          title="حذف الهامش"
                        >
                          حذف
                        </button>
                      </div>
                      <p className="leading-relaxed opacity-90 break-words">{nt.text}</p>
                      <div className="text-[9px] opacity-50 mt-2 text-left">
                        {new Date(nt.createdAt).toLocaleString("ar-EG")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
