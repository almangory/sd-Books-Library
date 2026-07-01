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
  AlertTriangle,
  Maximize,
  Minimize,
  Play,
  Pause,
  Headphones,
  Loader2,
  Settings,
  Globe,
  Share2,
  Trash2,
  PenSquare,
  Plus,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as pdfjsLib from "pdfjs-dist";
import { getTranslation } from "../utils/translations";
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
  const currentLang = settings.language || "ar";
  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, currentLang);

  // Navigation & Page State
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isBookLoaded, setIsBookLoaded] = useState<boolean>(false);
  const [isProgressRestored, setIsProgressRestored] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFallbackGenerated, setIsFallbackGenerated] = useState<boolean>(false);
  
  // Zoom Pinching States
  const [isPinching, setIsPinching] = useState<boolean>(false);
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Audio Context Ref to reuse single Web Audio instance
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch((err) => {
          console.warn("Error closing AudioContext on unmount:", err);
        });
      }
    };
  }, []);

  // Refs and effect to auto-save page on unmount/close
  const currentPageRef = useRef(currentPage);
  const isBookLoadedRef = useRef(isBookLoaded);
  const isProgressRestoredRef = useRef(isProgressRestored);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    isBookLoadedRef.current = isBookLoaded;
  }, [isBookLoaded]);

  useEffect(() => {
    isProgressRestoredRef.current = isProgressRestored;
  }, [isProgressRestored]);

  useEffect(() => {
    return () => {
      if (isBookLoadedRef.current && isProgressRestoredRef.current && currentPageRef.current > 0) {
        localStorage.setItem(`progress_${book.id}`, currentPageRef.current.toString());
        localStorage.setItem("flipbook_last_opened_id", book.id);
      }
    };
  }, [book.id]);
  
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

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

  // Share current book and page state & handler
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  const handleShareCurrentPage = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?bookId=${book.id}&page=${currentPage}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: book.title,
          text: `اقرأ الصفحة ${currentPage} من كتاب "${book.title}" للكاتب ${book.author} عبر تطبيق مكتبتي الرقمية السودانية التفاعلية.`,
          url: shareUrl
        });
        return;
      } catch (err) {
        console.warn("Navigator share failed, falling back to clipboard: ", err);
      }
    }
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    } catch (clipboardErr) {
      console.error("Failed to copy link: ", clipboardErr);
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

  const imageFilterStyle = {
    transition: "filter 0.5s ease-in-out, opacity 0.3s ease-in-out",
    filter: settings.darkMode 
      ? "invert(0.92) hue-rotate(180deg) brightness(0.95) contrast(0.9)" 
      : settings.sepiaMode 
        ? "sepia(0.55) contrast(0.98) brightness(0.96)" 
        : "none"
  };

  const getButtonClass = (isActive: boolean = false) => {
    if (isActive) {
      return "bg-[#5A5A40] text-white p-2 rounded-lg transition-all duration-300";
    }
    return `p-2 rounded-lg transition-all duration-300 ${
      settings.darkMode 
        ? "text-[#FAF6EE] hover:bg-[#3A3029]" 
        : settings.sepiaMode 
          ? "text-[#5C4033] hover:bg-[#DFCDB0]" 
          : "text-[#4A3B32] hover:bg-[#E6D5B8]"
    }`;
  };

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn("Fullscreen permission denied or blocked:", err);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Fullscreen API is not supported in this environment:", err);
    }
  };

  // Text-to-Speech (TTS) States
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isExtractingText, setIsExtractingText] = useState<boolean>(false);
  const [ttsSpeed, setTtsSpeed] = useState<number>(0.9);
  const [ttsLang, setTtsLang] = useState<string>("auto");
  const [showTtsSettings, setShowTtsSettings] = useState<boolean>(false);

  // Stop speech synthesis on component unmount or book change
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [book.id]);

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Arabic characters detection regex
    const isArabic = /[\u0600-\u06FF]/.test(text);
    
    let targetLang = ttsLang;
    if (targetLang === "auto") {
      targetLang = isArabic ? "ar-SA" : "en-US";
    }

    utterance.lang = targetLang;
    utterance.rate = ttsSpeed;

    // Set matching voice if possible
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(targetLang.split("-")[0]));
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const getArabicBookPageText = (bookId: string, pageNum: number): string => {
    const isDef1 = bookId === "def_1" || book.title.includes("الهجرة") || book.title.includes("موسم");
    const isDef2 = bookId === "def_2" || book.title.includes("كوش") || book.title.includes("حضارة");
    const isDef3 = bookId === "def_3" || book.title.includes("ديوان") || book.title.includes("الشعر");
    const isDef4 = bookId === "def_4" || book.title.includes("الأمثال") || book.title.includes("الفولكلور");

    if (isDef1) {
      const chapters = [
        `غلاف رواية موسم الهجرة إلى الشمال، للكاتب الروائي السوداني العالمي الطيب صالح. تحفة الأدب العربي الحديث.`,
        `العودة إلى الوطن والأهل. عدت إلى أهلي يا سادتي بعد سبعة أعوام قضيتها في أوروبا... كان ذلك في مساء دافئ من مساوئ النيل العظيم، حيث تفوح رائحة الأرض الطيبة والتربة المبتلة بالماء الهادئ، وشعرت أنني لست ريشة في مهب الريح، بل شجرة وارفة تضرب بجذورها في أعماق التربة الطينية الخصبة لبلدي العزيز.`,
        `لغز مصطفى سعيد ومجلس السمر. كان مصطفى سعيد رجلاً صامتاً يحمل في عينيه لغزاً غامضاً وهو يمشى في طرقات القرية بهدوء وجاذبية غريبة. وتحت ظلال النخيل الوارفة ومجلس السمر الدافئ، كان يتحدث بنبرة منسابة كالمياه الهادئة، يحمل في طياتها أسراراً دفينة وعواصف قادمة من صخب ليالي لندن الباردة وتأثيرها على حياته.`,
        `صراع الهوية والذات الكولونيالية. يتأمل الراوي في هويته ويتساءل: هل أنا مصطفى سعيد؟ أم أنني نبتة صالحة نمت في هذه الأرض الطيبة وارتوت من فيضان النيل؟ إن الصراع الأزلي بين برودة الشمال الكولونيالي الأوروبي ودفء الجنوب الإفريقي الخصيب يتجلى في أعمق صور الصدام الحضاري وجدلية الشرق والغرب الممتدة في عروق الأجيال.`,
        `الغرفة السرية وميراث الندم الإنجليزي. غرفة غامضة مغلقة في قلب القرية السودانية، مبنية بالآجر الأحمر، تحوي مئات الكتب باللغة الإنجليزية، ودافئة بموقد حطب كأنها في لندن، مع صور تذكارية وشواهد قديمة. إنها بقعة غريبة مستقطعة من بريطانيا ومثبتة بعناية فائقة في وسط الصحراء الإفريقية الحارة لتكون شاهداً على ازدواجية مروعة.`,
        `جريان النيل الخالد وصدى الأصوات القديمة للأسلاف والأجداد. إن النيل يجري صامتاً مهيباً، لا يبالي بمسرحياتنا البشرية المؤقتة ولا صراعاتنا الصغيرة وعواطفنا العابرة. وعلى ضفافه الخضراء ننسج قصص الحب والموت والرحيل، بينما تتردد أصوات السواقي القديمة منشدة ترانيم الصبر والبقاء والولادة المتجددة في كل موسم.`,
        `تحت سموات الصحراء والنجوم الصافية المتلألئة. عند الجلوس ليلاً في الصحراء المترامية الأطراف، تلمع النجوم مثل جمرات بيضاء متوهجة مرصعة في سقف السماء المخملية الداكنة. هدوء الكون يبعث الطمأنينة في النفس، شاهداً على عظمة الخالق وكفاح الإنسان السوداني الأبيّ في مجابهة صعاب الطبيعة وصنع المعجزات بصمت وكبرياء.`,
        `خاتمة الرواية: صرخة بطل الرواية في وسط النيل طالباً الحياة والنجاة. تتصاعد وتيرة الأحداث حتى يجد البطل نفسه يسبح في النهر بين الحياة والموت، في صراع مرير مع التيار الجارف. ويصرخ صرخته التاريخية المدوية: "الحياة! الحياة!" مقرراً أن يسبح بقوة نحو الضفة الأخرى، واضعاً حداً لرحلة التيه الطويلة ليعيش ويصنع مصيره بيديه.`
      ];
      return chapters[pageNum - 1] || "مزيد من الفصول الأدبية العميقة في رواية موسم الهجرة إلى الشمال للطيب صالح.";
    } else if (isDef2) {
      const chapters = [
        `غلاف كتاب حضارة كوش العريقة، مهد الفراعنة السود وسلالة النوبة العظيمة في شمال السودان.`,
        `مهد الفراعنة السود وسلالة النوبة. نشأت مملكة كوش العظيمة وازدهرت في منطقة النيل الأوسط، مشكلة قوة عسكرية وحضارية عظمى نافست الإمبراطورية المصرية القديمة بل وحكمت وادي النيل بأكمله لقرون طويلة من خلال الفراعنة الكوشيين السود الذين شيّدوا عهداً من الاستقرار والقوة والنهضة العمرانية.`,
        `أهرامات مروي وتشييد الآثار الخالدة. تقف أهرامات مروي بشموخ وجلال في الرمال الذهبية اللامعة بمنطقة البجراوية. هذه الأهرامات الفريدة التي يتجاوز عددها المائتين تتميز بزواياها الحادة الضيقة وتصميمها الهندسي البديع، شاهدة على مهارة البنائين والمصممين الكوشيين وعقيدتهم الخالدة في الحياة والبعث والخلود.`,
        `الكنداكات، ملكات المحاربين العظماء في كوش القديمة. كنداكات كوش كنّ رمزاً حياً للقوة والشرف والقيادة الحكيمة، حيث حكمن البلاد وقدن الجيوش بأنفسهن لمجابهة الغزو وحماية الحدود، مثل الكنداكة أماني ريناس التي تصدت للغزو الروماني بكل شجاعة وبسالة، لتخلد اسمها كرمز للصمود والسيادة الإفريقية الدائمة.`,
        `صناعة الحديد والتجارة في مروي القديمة. عرفت مروي في العصور القديمة بلقب "برمنغهام إفريقيا القديمة" نظراً لازدهار أفران صهر الحديد الكبرى بها وتصدير الأدوات والأسلحة المتطورة لكافة أنحاء القارة والشرق الأدنى، مما شكل ركيزة اقتصادية وصناعية هائلة مكنت المملكة الكوشية من الازدهار والتطور لقرون طويلة.`,
        `المدينة الملكية المقدسة ومعابد النقعة البديعة. معابد النقعة والمصورات الصفراء تجسد أرقى مستويات الفنون الكوشية، حيث يبرز معبد الأسد المخصص للإله المحارب أبادماك بنقوشه الغائرة وتماثيله المهيبة التي تمزج بتناغم ساحر بين الرموز الإفريقية المحلية، والتأثيرات الفرعونية المصرية، واللمسات الكلاسيكية الهلنسية واليونانية الرومانية.`,
        `جبل البركل المقدس وموطن الآلهة الفرعونية. كان جبل البركل يُعتقد بأنه المسكن الروحي للإله آمون ومصدر منح شرعية الحكم للملوك الكوشيين والمصريين على حد سواء. ويضم الجبل في باطنه معابد منحوتة في الصخر وتماثيل ضخمة غاية في الإتقان، تشهد على عمق العقيدة الروحية والقداسة الدينية التي ربطت هذا الجبل بوادي النيل.`,
        `الخاتمة: جهود حماية وتوثيق التراث السوداني القديم. يمثل الكشف المستمر عن آثار كوش ونفض الغبار عنها جهداً حيوياً لتوثيق الهوية الوطنية واستعادة فصول تاريخية مشرقة من تاريخ البشرية، لتظل أهرامات ومعابد السودان منارة تلهم الأجيال الحاضرة والمستقبلية بقيم العطاء والبناء والصمود الحضاري.`
      ];
      return chapters[pageNum - 1] || "مزيد من الفصول التاريخية والاستكشافات الأثرية لحضارة كوش النوبية العظيمة.";
    } else if (isDef3) {
      const chapters = [
        `غلاف ديوان الشعر السوداني، عيون القصائد والأنشودة الخالدة للنيل والأرض والحرية والثورة الشعبية.`,
        `القصيدة الأولى: أنشودة النيل والفيضان والأرض المعطاءة. يا نيل يا سليل الفراديس، يا من تغسل بأمواجك العذبة أحزان السنين وتروي نخيلنا الشامخ بالخير والنماء، تسري في عروقنا نغمة أزلية من الحب والوفاء للوطن المعطاء والأرض الخصبة التي تزهو بالأمل والثورة والجمال المتجدد.`,
        `القصيدة الثانية: حنين ووجد إلى الخرطوم ملتقى النيلين. الخرطوم يا ملتقى النيلين، الأزرق الصاخب بالأشواق والأبيض الهادئ بالعهود، حيث تلتف غابات السنط والظل، ويفوح أريج التراب المبتل بدعاش المطر، وتلتقي القلوب والثقافات من أقصى الوطن لتصنع أنشودة السلام والتعايش والإخاء الإنساني الفريد.`,
        `القصيدة الثالثة: كبرياء الصحراء وخصال الكرم والشهامة والفروسية. نحن أبناء الشمس الساطعة، والبادية الشاسعة، كرام النفوس، بيوتنا عامرة ترحب بالمسافر والغريب بغير منّ، وخصالنا منسوجة من الصدق والشهامة والمروءة التي نتوارثها جيلاً بعد جيل كتاج فخر نزين به هام القوافي والقصيد الشامخ.`,
        `القصيدة الرابعة: همسات أشجار السنط والظل تحت الهجير الوارف. تحت أغصان السنط والطلح، وفي ظلال الهجير الحار، تولد معاني الصبر والتأمل والعشق البكر لبلاد النيل والخيرات، حيث تنطق الطبيعة بأبلغ العبر، وتحكي كل ورقة وشجرة قصة صبر إنسان هذه الأرض وسعيه الدؤوب نحو غد وارف بالسلام والعدالة والاستقرار.`,
        `القصيدة الخامسة: مزمار الراعي في سهول كردفان الغناء وسحر الغروب البنفسجي. ينساب صوت مزمار الراعي هادئاً عذباً يعزف للوديان الشاسعة وسهول كردفان الغناء ومزارع الصمغ العربي، مردداً تباريك الأرض والطبيعة البكر وهي تتزين بوشاح الغروب البنفسجي الدافئ، في ترنيمة تعبر عن بساطة العيش وعمق السكينة الروحية.`,
        `القصيدة السادسة: نشيد الحرية وكفاح الكلمة الثائرة ضد القيود والظلام. سطرت دماء الشعراء الأحرار فجر الخلاص وكتبت مجد الوطن بأحرف من نور متوهج لا ينطفئ. الكلمة الحرة رصاصة في صدر الطغيان ونور يضيء دروب الثائرين الساعين نحو الكرامة والحرية والعدالة الاجتماعية لتشرق شمس الوطن حرة أبية دون قيود.`,
        `الخاتمة: شهادة فنية خالدة لروح السودان الشاعر والمعطاء. يظل الشعر هو ديوان السودانيين وسجل وجدانهم النابض بالجمال والثورة، ومرآة مشاعرهم وتطلعاتهم نحو غد أفضل وأجمل ترفرف فيه رايات الحب والسلام والحرية، وتظل القصيدة السودانية منارة للأدب والوجدان الإنساني النبيل الخالد.`
      ];
      return chapters[pageNum - 1] || "مزيد من عيون القصائد وروائع الشعر السوداني الكلاسيكي والحديث.";
    } else if (isDef4) {
      const chapters = [
        `غلاف كتاب الأمثال السودانية وروائع الفولكلور الشعبي الأصيل للبروفيسور والتربوي الكبير بابكر بدري.`,
        `المثل الأول: 'الجرح بالجرح والبلسم الوفاء الكاشف'. يعلمنا هذا المثل الشعبي أن النفوس الكريمة تتسامح ولكن الجروح العميقة تترك أثراً لا يمحى بسهولة، لذا يجب صون الود وحفظ لسان المرء وبلسمة جراح الآخرين بالكلمة الطيبة والوفاء الصادق لبناء مجتمع متماسك.`,
        `المثل الثاني: 'إذا الغيم كتر وبشائر الخير والبركات القادمة'. يدل هذا المثل على التفاؤل واليقين بالفرج القريب، فعندما تتكاثف السحب والغيوم وتتجمع أسباب الخير والنجاح والمقدمات الإيجابية، تتبعها بشائر المطر والنتائج المفرحة والأرزاق الوفيرة حتماً، معززةً روح التكاتف والأمل في النفوس.`,
        `المثل الثالث: 'الأخوات في السدة ومحك الشدائد والنوائب الصعبة'. يضرب هذا المثل البليغ لبيان أن معادن الناس والروابط الحقيقية والصلات الوثيقة تظهر بوضوح في أوقات الشدائد والأزمات والمحن الصعبة، وليس في أوقات الرخاء والسهولة، فالصديق الحقيقي والقريب المخلص هو من يقف معك في 'السدة'.`,
        `المثل الرابع: 'الباب البيجيب الريح استريح وسدو'. دعوة حكيمة للغاية لتجنب المشاكل وإغلاق أبواب النزاعات والابتعاد عن مواطن الفتن والخصومات العقيمة التي تستهلك الطاقة بلا طائل، وهي وسيلة مجربة وذكية من الفولكلور لحفظ سلامة القلوب وعيش حياة هادئة هانئة ومستقرة.`,
        `المثل الخامس: 'الأعور في وسط العميان ملك ونسبية القدرات البشرية'. يوضح هذا المثل الشعبي كيف أن المعرفة البسيطة والمهارة المحدودة قد تبدو عظيمة وهائلة في مجتمع يفتقر تماماً إليها، ويدعو للتواضع ومواصلة التعلم وعدم الغرور بالقدرات الذاتية المحدودة في بحار العلوم والمهارات الواسعة.`,
        `المثل السادس: 'الكلام في شط النهر ساهل وميزان التجربة والأفعال الحية'. يعلمنا هذا المثل أن التنظير والقول وإبداء الآراء من موقع الأمان والحياد يختلف تماماً عن خوض غمار الصعاب والنزول لساحة العمل الفعلي ومواجهة الأمواج، فالفعل الحقيقي يزن أكثر من آلاف الكلمات والخطب الرنانة.`,
        `الخاتمة: فكر البروفيسور بابكر بدري وأهمية التوثيق الشعبي لحفظ الهوية السودانية ونقل الحكمة والوعي المتوارث للأجيال الصاعدة لبناء غد متماسك وقوي.`
      ];
      return chapters[pageNum - 1] || "مزيد من الأمثال والحكم الشعبية وفولكلور الثقافة السودانية الأصيلة.";
    }

    return `الصفحة رقم ${pageNum} من كتاب "${book.title}" لمؤلفه "${book.author}".`;
  };

  const handleSpeakCurrentPage = async () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("عذراً، ميزة القراءة الصوتية (Text-to-Speech) غير مدعومة في متصفحك الحالي.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const isPredefined = book.id.startsWith("def_") || ["def_1", "def_2", "def_3", "def_4"].includes(book.id) || book.id === "1" || book.id === "2" || book.id === "3" || book.id === "4";

    if (isPredefined) {
      // Prioritize Arabic high-quality literary text for default predefined books
      let arabicText = getArabicBookPageText(book.id, currentPage);
      if (isDoublePage) {
        const { left, right } = getDoublePagePair();
        const otherPageNum = currentPage === right ? left : right;
        if (otherPageNum && otherPageNum <= numPages) {
          const secondPageText = getArabicBookPageText(book.id, otherPageNum);
          arabicText = isRTL ? `${secondPageText} \n\n ${arabicText}` : `${arabicText} \n\n ${secondPageText}`;
        }
      }
      speakText(arabicText);
      return;
    }

    if (!pdfDoc) {
      // Speak generic title metadata for non-pdf fallback placeholders
      speakText(`هذا الكتاب بعنوان ${book.title}، للكاتب ${book.author}. الصفحة الحالية هي رقم ${currentPage}.`);
      return;
    }

    try {
      setIsExtractingText(true);
      
      // Get current page
      const page = await pdfDoc.getPage(currentPage);
      const textContent = await page.getTextContent();
      let text = textContent.items
        .map((item: any) => item.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      // If in double page mode and the other page is visible, concatenate it
      if (isDoublePage) {
        const { left, right } = getDoublePagePair();
        const otherPageNum = currentPage === right ? left : right;
        if (otherPageNum && otherPageNum <= numPages) {
          try {
            const otherPage = await pdfDoc.getPage(otherPageNum);
            const otherTextContent = await otherPage.getTextContent();
            const otherText = otherTextContent.items
              .map((item: any) => item.str)
              .join(" ")
              .replace(/\s+/g, " ")
              .trim();
            if (otherText) {
              text = isRTL ? `${otherText} \n\n ${text}` : `${text} \n\n ${otherText}`;
            }
          } catch (err) {
            console.warn("Failed to extract second page text for speech:", err);
          }
        }
      }

      setIsExtractingText(false);

      if (!text || text.length < 5) {
        text = `الصفحة رقم ${currentPage}. هذا الملف قد يكون عبارة عن صور ممسوحة ضوئياً، يرجى تشغيل القراءة الصوتية لصفحة أخرى تحتوي على نصوص قابلة للنسخ.`;
      }

      speakText(text);

    } catch (err) {
      console.error("Error extracting text for speech:", err);
      setIsExtractingText(false);
      speakText(`عذراً، حدث خطأ أثناء استخراج النص من الصفحة رقم ${currentPage}.`);
    }
  };

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
  const [onPageNoteText, setOnPageNoteText] = useState<string>("");
  const [activePageNoteOverlay, setActivePageNoteOverlay] = useState<number | null>(null);
  const [showNotesPanel, setShowNotesPanel] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<"index" | "bookmarks" | "notes">("index");
  const [parsedOutline, setParsedOutline] = useState<{ title: string; page: number }[]>([]);
  
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

  // Pinch-to-zoom on mobile devices with 2 fingers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialDist = 0;
    let initialZoom = 100;
    let isPinchingActive = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinchingActive = true;
        setIsPinching(true);
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDist = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        initialZoom = settingsRef.current.zoom;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isPinchingActive && e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDist = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        
        if (initialDist > 0) {
          const scale = currentDist / initialDist;
          // Scale between 100% and 300%
          const targetZoom = Math.max(100, Math.min(300, Math.round(initialZoom * scale)));
          setSettings(prev => ({ ...prev, zoom: targetZoom }));
        }
        
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (isPinchingActive) {
        isPinchingActive = false;
        setIsPinching(false);
        initialDist = 0;
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isBookLoaded, setSettings]);

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

  // Close notes panel, sidebar, and hide HUD when entering Comfortable Reading Mode
  useEffect(() => {
    if (settings.readingMode) {
      setShowNotesPanel(false);
      setShowSidebar(false);
      setShowReadingHud(false);
    }
  }, [settings.readingMode]);

  // Web Audio synthesized paper turning effect (Highly realistic physical model of page rustling, flipping, and landing)
  const playPageTurnSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      let ctx = audioContextRef.current;
      if (!ctx || ctx.state === "closed") {
        ctx = new AudioContextClass();
        audioContextRef.current = ctx;
      }
      
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      const duration = 0.65; // realistic human page turn speed
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      // Node 1: Crisp "Flick/Crinkle" at the very beginning of the page turn (finger grip friction)
      const crispNoise = ctx.createBufferSource();
      crispNoise.buffer = buffer;
      
      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.setValueAtTime(4500, ctx.currentTime);
      highpass.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.15);
      
      const crispGain = ctx.createGain();
      crispGain.gain.setValueAtTime(0.001, ctx.currentTime);
      crispGain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.03); // quick snap attack
      crispGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18); // very quick fade out
      
      crispNoise.connect(highpass);
      highpass.connect(crispGain);
      crispGain.connect(ctx.destination);
      
      // Node 2: Main "Rustle/Slide" friction of one paper page moving across another
      const rustleNoise = ctx.createBufferSource();
      rustleNoise.buffer = buffer;
      
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(1200, ctx.currentTime); // mid-range rustling frequency
      bandpass.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + duration);
      bandpass.Q.setValueAtTime(3.0, ctx.currentTime);
      
      const rustleGain = ctx.createGain();
      rustleGain.gain.setValueAtTime(0.001, ctx.currentTime);
      rustleGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.12); // smooth build-up
      rustleGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      
      rustleNoise.connect(bandpass);
      bandpass.connect(rustleGain);
      rustleGain.connect(ctx.destination);
      
      // Node 3: Deep "Air Whoosh" representing the air displacement of the heavy paper sheet
      const whooshOsc = ctx.createOscillator();
      whooshOsc.type = "triangle"; // soft, deep, and organic wave
      whooshOsc.frequency.setValueAtTime(130, ctx.currentTime); // deeper register
      whooshOsc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + duration - 0.05);
      
      const whooshGain = ctx.createGain();
      whooshGain.gain.setValueAtTime(0.001, ctx.currentTime);
      whooshGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.22); // peaked as page lifts half-way
      whooshGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      
      whooshOsc.connect(whooshGain);
      whooshGain.connect(ctx.destination);

      // Node 4: Soft Physical Landing Thup (Lowpass-filtered noise + soft bass sine thud)
      // This represents the page hitting the rest of the pages on the opposite side, which is very prominent in the video
      const landingOsc = ctx.createOscillator();
      landingOsc.type = "sine";
      landingOsc.frequency.setValueAtTime(80, ctx.currentTime);
      landingOsc.frequency.setValueAtTime(80, ctx.currentTime + 0.38);
      landingOsc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.58);
      
      const landingOscGain = ctx.createGain();
      landingOscGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      landingOscGain.gain.setValueAtTime(0.0001, ctx.currentTime + 0.38);
      landingOscGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.44); // soft landing thud peak
      landingOscGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.58);
      
      landingOsc.connect(landingOscGain);
      landingOscGain.connect(ctx.destination);

      // Soft lowpass noise thud component
      const thudNoise = ctx.createBufferSource();
      thudNoise.buffer = buffer;
      
      const lowpassFilter = ctx.createBiquadFilter();
      lowpassFilter.type = "lowpass";
      lowpassFilter.frequency.setValueAtTime(130, ctx.currentTime);
      
      const thudGain = ctx.createGain();
      thudGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      thudGain.gain.setValueAtTime(0.0001, ctx.currentTime + 0.38);
      thudGain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.44); // soft rustle landing impact peak
      thudGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.58);
      
      thudNoise.connect(lowpassFilter);
      lowpassFilter.connect(thudGain);
      thudGain.connect(ctx.destination);
      
      // Start all sound components in perfect synchronization
      crispNoise.start();
      rustleNoise.start();
      whooshOsc.start();
      landingOsc.start();
      thudNoise.start();
      
      // Stop oscillators
      whooshOsc.stop(ctx.currentTime + duration);
      landingOsc.stop(ctx.currentTime + 0.60);
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  };

  // Convert Google Drive Links or load standard / Local URLs
  useEffect(() => {
    let active = true;
    setParsedOutline([]);

    const extractOutline = async (docObj: any) => {
      try {
        const rawOutline = await docObj.getOutline();
        if (rawOutline && rawOutline.length > 0) {
          const items: { title: string; page: number }[] = [];
          const traverse = async (nodes: any[]) => {
            for (const node of nodes) {
              try {
                let pageNum = 0;
                if (node.dest) {
                  let dest = node.dest;
                  if (typeof dest === "string") {
                    dest = await docObj.getDestination(dest);
                  }
                  if (Array.isArray(dest) && dest[0]) {
                    const pageRef = dest[0];
                    const pageIdx = await docObj.getPageIndex(pageRef);
                    pageNum = pageIdx + 1;
                  }
                }
                if (pageNum > 0) {
                  items.push({ title: node.title, page: pageNum });
                }
                if (node.items && node.items.length > 0) {
                  await traverse(node.items);
                }
              } catch (err) {
                console.error("Error parsing node:", err);
              }
            }
          };
          await traverse(rawOutline);
          if (active) {
            setParsedOutline(items);
          }
        } else {
          if (active) setParsedOutline([]);
        }
      } catch (err) {
        console.error("Error loading PDF outline:", err);
        if (active) setParsedOutline([]);
      }
    };

    const loadPdf = async () => {
      setIsBookLoaded(false);
      setIsProgressRestored(false);
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
        await extractOutline(doc);
        
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
        setIsProgressRestored(true);
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
          await extractOutline(doc);
          
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
          setIsProgressRestored(true);
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
    if (isBookLoaded && isProgressRestored && currentPage) {
      localStorage.setItem(`progress_${book.id}`, currentPage.toString());
      localStorage.setItem("flipbook_last_opened_id", book.id);
    }
  }, [currentPage, book.id, isBookLoaded, isProgressRestored]);

  // Generate Table of Contents (فهرس الكتاب) list
  const getChapterList = () => {
    if (parsedOutline && parsedOutline.length > 0) {
      return parsedOutline;
    }
    
    // Fallback/Default chapter definitions for default Sudanese literature
    if (book.id === "def_1" || book.title.includes("الهجرة") || book.title.includes("موسم")) {
      return [
        { title: "غلاف الرواية والواجهة الرئيسية", page: 1 },
        { title: "الفصل الأول: العودة إلى ديار الأهل والوطن", page: 2 },
        { title: "الفصل الثاني: لغز مصطفى سعيد ومجلس السمر", page: 3 },
        { title: "الفصل الثالث: صراع الهوية والذات الكولونيالية", page: 4 },
        { title: "الفصل الرابع: الغرفة السرية وميراث الندم الإنجليزي", page: 5 },
        { title: "الفصل الخامس: جريان النيل وصدى الأصوات القديمة", page: 6 },
        { title: "الفصل السادس: تحت سموات الصحراء والنجوم الصافية", page: 7 },
        { title: "الخاتمة: عبقرية السرد وتأملات النهاية الغامضة", page: 8 }
      ];
    } else if (book.id === "def_2" || book.title.includes("كوش") || book.title.includes("حضارة")) {
      return [
        { title: "غلاف الكتاب والواجهة الرئيسية", page: 1 },
        { title: "الفصل الأول: مهد الفراعنة السود وسلالة النوبة", page: 2 },
        { title: "الفصل الثاني: أهرامات مروي وتشييد الآثار الخالدة", page: 3 },
        { title: "الفصل الثالث: الكنداكات (ملكات المحاربين العظماء)", page: 4 },
        { title: "الفصل الرابع: صناعة الحديد والتجارة في مروي القديمة", page: 5 },
        { title: "الفصل الخامس: المدينة الملكية المقدسة في معابد النقعة", page: 6 },
        { title: "الفصل السادس: جبل البركل المقدس وموطن الآلهة الفرعونية", page: 7 },
        { title: "الخاتمة: جهود حماية وتوثيق التراث السوداني القديم", page: 8 }
      ];
    } else if (book.id === "def_3" || book.title.includes("ديوان") || book.title.includes("الشعر")) {
      return [
        { title: "غلاف الديوان والواجهة الرئيسية", page: 1 },
        { title: "القصيدة الأولى: أنشودة النيل والفيضان والأرض المعطاءة", page: 2 },
        { title: "القصيدة الثانية: حنين ووجد إلى الخرطوم ملتقى النيلين", page: 3 },
        { title: "القصيدة الثالثة: كبرياء الصحراء وخصال الكرم والشهامة", page: 4 },
        { title: "القصيدة الرابعة: همسات أشجار السنط والظل تحت الهجير", page: 5 },
        { title: "القصيدة الخامسة: مزمار الراعي في سهول كردفان الغنّاء", page: 6 },
        { title: "القصيدة السادسة: نشيد الحرية وكفاح الكلمة الثائرة", page: 7 },
        { title: "الخاتمة: شهادة فنية خالدة لروح السودان الشاعر والمعطاء", page: 8 }
      ];
    } else if (book.id === "def_4" || book.title.includes("الأمثال") || book.title.includes("الفولكلور")) {
      return [
        { title: "غلاف الكتاب والواجهة الرئيسية", page: 1 },
        { title: "المثل الأول: 'الجرح بالجرح' وبلسم المودة والوفاء الكاشف", page: 2 },
        { title: "المثل الثاني: 'إذا الغيم كتر' وبشائر الخير والبركات القادمة", page: 3 },
        { title: "المثل الثالث: 'الأخوات في السدة' ومحك الشدائد والنوائب الصعبة", page: 4 },
        { title: "المثل الرابع: 'الباب البيجيب الريح' وعافية التسامح والسلامة", page: 5 },
        { title: "المثل الخامس: 'الأعور في وسط العميان' ونسبية المعارف والقدرات", page: 6 },
        { title: "المثل السادس: 'الكلام في شط النهر' وميزان التجربة والأفعال الحية", page: 7 },
        { title: "الخاتمة: فكر البروفيسور بابكر بدري وأهمية التوثيق الشعبي", page: 8 }
      ];
    }
    
    // Fallback for general uploaded or customized books
    const list = [{ title: "صفحة الغلاف والواجهة الأولى", page: 1 }];
    if (numPages > 1) {
      if (numPages <= 15) {
        for (let i = 2; i <= numPages; i++) {
          if (i === numPages) {
            list.push({ title: `الخاتمة والمراجع النهائية (الصفحة ${i})`, page: i });
          } else {
            list.push({ title: `القسم أو الفصل الفرعي ${i - 1} (الصفحة ${i})`, page: i });
          }
        }
      } else {
        list.push({ title: "مقدمة وتمهيد الكتاب والمدخل العام (الصفحة 2)", page: 2 });
        const step = Math.max(3, Math.floor((numPages - 4) / 5));
        let chapterIdx = 1;
        for (let p = 5; p < numPages - 2; p += step) {
          list.push({ title: `الباب ${chapterIdx}: تفاصيل الموضوع العام (الصفحة ${p})`, page: p });
          chapterIdx++;
        }
        list.push({ title: `الخاتمة والملخص وقائمة المراجع (الصفحة ${numPages})`, page: numPages });
      }
    }
    return list;
  };

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
    if (settings.zoom > 100) return; // Allow normal scroll/pan when zoomed
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    dragStartX.current = clientX;
    isMouseDown.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (settings.zoom > 100) return; // Allow normal scroll/pan when zoomed
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

  // Add Note on specific page
  const handleAddPageNote = (pageNumber: number, text: string) => {
    if (!text.trim()) return;
    
    const newNote: BookNote = {
      id: Math.random().toString(36).substr(2, 9),
      bookId: book.id,
      page: pageNumber,
      text: text.trim(),
      createdAt: Date.now()
    };
    
    const updated = [newNote, ...notes];
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

  const renderPageNotes = (pageNumber: number | null) => {
    if (!pageNumber) return null;
    
    const pageNotes = notes.filter(n => n.page === pageNumber);
    const isOpen = activePageNoteOverlay === pageNumber;
    
    return (
      <div 
        className="absolute top-3 left-3 z-30 select-none"
        onClick={(e) => e.stopPropagation()} // Prevent turning pages when interacting with notes
      >
        {/* Toggle Button / Badge */}
        <button
          onClick={() => {
            if (isOpen) {
              setActivePageNoteOverlay(null);
            } else {
              setActivePageNoteOverlay(pageNumber);
              setOnPageNoteText("");
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-md border text-xs font-bold transition-all duration-300 hover:scale-105 active:scale-95 ${
            pageNotes.length > 0
              ? "bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900"
              : settings.darkMode
                ? "bg-[#27211D] hover:bg-[#3A3029] border-[#3A3029] text-amber-200"
                : settings.sepiaMode
                  ? "bg-[#FAF2DF] hover:bg-[#FAF0D9] border-[#DFCDB0] text-[#5C4033]"
                  : "bg-white hover:bg-stone-50 border-stone-200 text-stone-700"
          }`}
          title={currentLang === "en" ? `Page ${pageNumber} Notes` : `ملاحظات الصفحة ${pageNumber}`}
        >
          <PenSquare className="w-3.5 h-3.5" />
          <span>
            {currentLang === "en" ? "Notes" : "ملاحظات"}
            {pageNotes.length > 0 && ` (${pageNotes.length})`}
          </span>
        </button>

        {/* Overlay Card */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              dir={currentLang === "en" ? "ltr" : "rtl"}
              className={`absolute top-10 left-0 w-72 max-h-96 rounded-2xl shadow-2xl border-2 p-4 flex flex-col z-40 ${
                settings.darkMode
                  ? "bg-[#27211D] border-[#3A3029] text-[#FAF6EE]"
                  : settings.sepiaMode
                    ? "bg-[#FAF2DF] border-[#DFCDB0] text-[#4E3529]"
                    : "bg-white border-stone-200 text-stone-800"
              }`}
              style={{
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-stone-200/40 mb-3">
                <span className="font-serif font-bold text-xs">
                  {currentLang === "en" ? `Notes on Page ${pageNumber}` : `ملاحظات الصفحة ${pageNumber}`}
                </span>
                <button
                  onClick={() => setActivePageNoteOverlay(null)}
                  className="p-1 rounded-lg hover:bg-black/5 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* List of existing notes on this page */}
              <div className="flex-1 overflow-y-auto mb-3 space-y-2 px-1 max-h-40 custom-scrollbar">
                {pageNotes.length === 0 ? (
                  <p className="text-[10px] text-stone-400 text-center py-4">
                    {currentLang === "en" ? "No notes on this page yet." : "لا توجد ملاحظات على هذه الصفحة بعد."}
                  </p>
                ) : (
                  pageNotes.map((note) => (
                    <div 
                      key={note.id} 
                      className={`p-2.5 rounded-xl text-xs relative group border ${
                        settings.darkMode
                          ? "bg-[#1E1916] border-[#3A3029]"
                          : "bg-amber-50/70 border-amber-100"
                      }`}
                    >
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className={`absolute top-1.5 ${currentLang === "en" ? "right-1.5" : "left-1.5"} p-1 rounded hover:bg-rose-50 text-stone-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity`}
                        title={currentLang === "en" ? "Delete note" : "حذف الملاحظة"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      
                      <p className={`whitespace-pre-wrap font-sans leading-relaxed text-[11px] ${currentLang === "en" ? "pr-6 pl-1" : "pl-6 pr-1"}`}>
                        {note.text}
                      </p>
                      
                      <span className="block text-[8px] opacity-40 mt-1">
                        {new Date(note.createdAt).toLocaleTimeString(currentLang === "en" ? "en-US" : "ar-EG", {
                          hour: "numeric",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Form to add note */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!onPageNoteText.trim()) return;
                  handleAddPageNote(pageNumber, onPageNoteText);
                  setOnPageNoteText("");
                }}
                className="flex flex-col gap-2 pt-2 border-t border-stone-200/40"
              >
                <textarea
                  value={onPageNoteText}
                  onChange={(e) => setOnPageNoteText(e.target.value)}
                  placeholder={currentLang === "en" ? "Type note here..." : "اكتب ملاحظتك القصيرة هنا..."}
                  className={`w-full p-2 text-xs rounded-xl border focus:ring-2 focus:ring-amber-500/50 focus:outline-none resize-none h-14 ${
                    settings.darkMode
                      ? "bg-[#1E1916] border-[#3A3029] text-[#FAF6EE]"
                      : "bg-stone-50 border-stone-200 text-stone-800"
                  }`}
                  maxLength={200}
                />
                
                <div className="flex justify-between items-center text-[9px] text-stone-400">
                  <span>{onPageNoteText.length}/200</span>
                  <button
                    type="submit"
                    disabled={!onPageNoteText.trim()}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      onPageNoteText.trim()
                        ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                        : "bg-stone-100 text-stone-400 cursor-not-allowed"
                    }`}
                  >
                    {currentLang === "en" ? "Add Note" : "إضافة"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
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
    <div className={`flex flex-col min-h-screen transition-all duration-500 ease-in-out ${
      settings.darkMode 
        ? "bg-[#1E1916] text-[#EADDC9]" 
        : settings.sepiaMode
          ? "bg-[#F5EEDC] text-[#5C4033]"
          : "bg-[#FDFBF7] text-[#4A3B32]"
    } selection:bg-[#D4A373] selection:text-white`}>
      
      {/* 1. Header Toolbar (Hidden in absolute Reading Mode) */}
      {!settings.readingMode && (
        <header className={`border-b px-4 lg:px-8 py-3 transition-all duration-500 ease-in-out ${
          settings.darkMode 
            ? "border-[#3A3029] bg-[#27211D]" 
            : settings.sepiaMode
              ? "border-[#DFCDB0] bg-[#EADDC9]"
              : "border-[#E6D5B8] bg-[#FAF6EE]"
        }`}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
            
            {/* Right: Book Meta & Back button */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <button 
                id="back_to_library_btn"
                onClick={onBackToLibrary}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  settings.darkMode 
                    ? "bg-[#3A3029] text-[#FAF6EE] hover:bg-[#4E4138]" 
                    : settings.sepiaMode
                      ? "bg-[#E6D5B8] text-[#5C4033] hover:bg-[#DFCDB0]"
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
                      {currentLang === "en" ? "Interactive Copy" : "نسخة تفاعلية محاورة"}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    pdfOrientation === "landscape"
                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50"
                      : "bg-[#5A5A40]/10 text-[#5A5A40] dark:text-[#CBB59C] border-[#5A5A40]/20"
                  }`}>
                    {pdfOrientation === "landscape" 
                      ? (currentLang === "en" ? "Horizontal Layout" : "مخطوطة أفقية") 
                      : (currentLang === "en" ? "Vertical Layout" : "مخطوطة رأسية")}
                  </span>
                  <h1 className="font-bold text-base md:text-lg tracking-tight line-clamp-1">
                    {book.title}
                  </h1>
                </div>
                <p className={`text-xs transition-colors duration-500 ${settings.darkMode ? "text-[#CBB59C]" : settings.sepiaMode ? "text-[#7D6B58]" : "text-[#8D7B68]"}`}>
                  {t("authorLabel")}: {book.author}
                </p>
              </div>
            </div>

            {/* Left: Global Toolbars */}
            <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end">
              
              {/* RTL / LTR Toggle */}
              <button
                onClick={() => setIsRTL(!isRTL)}
                className={`text-xs font-semibold flex items-center gap-1 ${getButtonClass()}`}
                title={t("rtlLayout")}
              >
                <Compass className="w-4 h-4" />
                <span>{isRTL ? t("rtlLayoutOn") : t("rtlLayoutOff")}</span>
              </button>

              {/* Page Layout Mode Toggle */}
              <button
                onClick={() => setIsDoublePage(!isDoublePage)}
                className={`text-xs font-semibold flex items-center gap-1 ${getButtonClass()}`}
                title={t("pageLayoutMode")}
              >
                {isDoublePage ? <FileText className="w-4 h-4 text-[#5A5A40]" /> : <BookOpen className="w-4 h-4 text-[#5A5A40]" />}
                <span>{isDoublePage ? t("singlePage") : t("doublePage")}</span>
              </button>

              {/* Sound FX Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={getButtonClass()}
                title={soundEnabled ? t("soundFxOff") : t("soundFxOn")}
              >
                {soundEnabled ? <Volume2 className="w-4.5 h-4.5 text-[#5A5A40]" /> : <VolumeX className="w-4.5 h-4.5 opacity-50" />}
              </button>

              {/* Reading Theme Modes Selector (Light, Sepia, Dark) */}
              <div className={`flex items-center p-0.5 rounded-xl border transition-all duration-500 ease-in-out ${
                settings.darkMode 
                  ? "bg-[#27211D] border-[#3D322A]" 
                  : settings.sepiaMode 
                    ? "bg-[#EADDC9] border-[#DFCDB0]" 
                    : "bg-[#E6D5B8] border-[#DED6C7]"
              }`}>
                {/* Light Button */}
                <button
                  onClick={() => setSettings(prev => ({ ...prev, darkMode: false, sepiaMode: false }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all duration-300 ${
                    !settings.darkMode && !settings.sepiaMode
                      ? "bg-[#FAF6EE] text-[#4A3B32] shadow-sm scale-105"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                  title={currentLang === "en" ? "Normal Light (Light)" : "الإضاءة العادية (فاتح)"}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden lg:inline">{currentLang === "en" ? "Light" : "فاتح"}</span>
                </button>

                {/* Sepia Button */}
                <button
                  onClick={() => setSettings(prev => ({ ...prev, darkMode: false, sepiaMode: true }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all duration-300 ${
                    !settings.darkMode && settings.sepiaMode
                      ? "bg-[#FAF6EE] text-[#5C4033] shadow-sm scale-105"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                  title={currentLang === "en" ? "Warm Sudan Ochre (Sepia)" : "الإضاءة الدافئة (سيبيا)"}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-[#E6D5B8] border border-amber-600/30"></span>
                  <span className="hidden lg:inline">{currentLang === "en" ? "Sepia" : "دافئ"}</span>
                </button>

                {/* Dark Button */}
                <button
                  onClick={() => setSettings(prev => ({ ...prev, darkMode: true, sepiaMode: false }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all duration-300 ${
                    settings.darkMode
                      ? "bg-[#3A3029] text-[#FAF6EE] shadow-sm scale-105"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                  title={currentLang === "en" ? "Night Mode (Dark)" : "الإضاءة الليلية (داكن)"}
                >
                  <Moon className="w-3.5 h-3.5 text-[#CBB59C]" />
                  <span className="hidden lg:inline">{currentLang === "en" ? "Dark" : "داكن"}</span>
                </button>
              </div>

              {/* Fullscreen toggle */}
              <button
                onClick={toggleFullscreen}
                className={isFullscreen ? "bg-[#5A5A40] text-white p-2 rounded-lg transition-all duration-300" : getButtonClass()}
                title={isFullscreen ? t("exitFullscreenBtn") : t("fullscreenBtn")}
              >
                {isFullscreen ? <Minimize className="w-4.5 h-4.5" /> : <Maximize className="w-4.5 h-4.5" />}
              </button>

              {/* Share Book/Page button */}
              <button
                onClick={handleShareCurrentPage}
                className={shareSuccess ? "bg-emerald-600 text-white p-2 rounded-lg transition-all duration-300 text-xs font-semibold flex items-center gap-1" : `text-xs font-semibold flex items-center gap-1 ${getButtonClass()}`}
                title={t("sharePage")}
              >
                <Share2 className="w-4 h-4" />
                <span>{shareSuccess ? (currentLang === "en" ? "Copied!" : "تم النسخ!") : (currentLang === "en" ? "Share" : "مشاركة")}</span>
              </button>

              {/* Zoom buttons */}
              <div className="flex items-center bg-transparent rounded-lg border border-neutral-300 dark:border-[#52453D] overflow-hidden">
                <button
                  onClick={handleZoomOut}
                  disabled={settings.zoom <= 100}
                  className={`p-1.5 transition-all duration-300 ${
                    settings.darkMode ? "hover:bg-[#3A3029]" : settings.sepiaMode ? "hover:bg-[#DFCDB0]" : "hover:bg-[#E6E0D4]"
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
                  className={`p-1.5 transition-all duration-300 ${
                    settings.darkMode ? "hover:bg-[#3A3029]" : settings.sepiaMode ? "hover:bg-[#DFCDB0]" : "hover:bg-[#E6E0D4]"
                  } disabled:opacity-30`}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>



              {/* Bookmark Toggle (Adds/removes bookmark for current page) */}
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  bookmarks.some(b => b.page === currentPage)
                    ? "bg-[#9E4233] text-white animate-pulse"
                    : settings.darkMode ? "hover:bg-[#3A3029] text-[#FAF6EE]" : settings.sepiaMode ? "hover:bg-[#DFCDB0] text-[#5C4033]" : "hover:bg-[#E6E0D4] text-[#4A3B32]"
                }`}
                title={t("bookmarkBtn")}
              >
                <BookmarkIcon className="w-4.5 h-4.5" />
              </button>

              {/* Table of Contents (الفهرس) */}
              <button
                onClick={() => {
                  if (showSidebar && sidebarTab === "index") {
                    setShowSidebar(false);
                  } else {
                    setShowSidebar(true);
                    setSidebarTab("index");
                  }
                }}
                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${
                  showSidebar && sidebarTab === "index"
                    ? "bg-[#5A5A40] text-white"
                    : settings.darkMode ? "hover:bg-[#3A3029] text-[#FAF6EE]" : settings.sepiaMode ? "hover:bg-[#DFCDB0] text-[#5C4033]" : "hover:bg-[#E6E0D4] text-[#4A3B32]"
                }`}
                title={t("indexTab")}
              >
                <BookOpen className="w-4.5 h-4.5 text-amber-500" />
                <span className="text-xs hidden md:inline">{currentLang === "en" ? "Index" : "الفهرس"}</span>
              </button>

              {/* Bookmarks List Sidebar Toggle */}
              <button
                onClick={() => {
                  if (showSidebar && sidebarTab === "bookmarks") {
                    setShowSidebar(false);
                  } else {
                    setShowSidebar(true);
                    setSidebarTab("bookmarks");
                  }
                }}
                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${
                  showSidebar && sidebarTab === "bookmarks"
                    ? "bg-[#5A5A40] text-white"
                    : settings.darkMode ? "hover:bg-[#3A3029] text-[#FAF6EE]" : settings.sepiaMode ? "hover:bg-[#DFCDB0] text-[#5C4033]" : "hover:bg-[#E6E0D4] text-[#4A3B32]"
                }`}
                title={t("bookmarksTab")}
              >
                <Compass className="w-4.5 h-4.5 text-emerald-500" />
                <span className="text-xs hidden md:inline">{currentLang === "en" ? "Bookmarks" : "العلامات المرجعية"}</span>
              </button>

              {/* Notes Sidebar Toggle */}
              <button
                onClick={() => {
                  if (showSidebar && sidebarTab === "notes") {
                    setShowSidebar(false);
                  } else {
                    setShowSidebar(true);
                    setSidebarTab("notes");
                  }
                }}
                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 ${
                  showSidebar && sidebarTab === "notes"
                    ? "bg-[#4A3B32] text-white dark:bg-[#5A5A40]"
                    : settings.darkMode ? "hover:bg-[#3A3029] text-[#FAF6EE]" : settings.sepiaMode ? "hover:bg-[#DFCDB0] text-[#5C4033]" : "hover:bg-[#E6E0D4] text-[#4A3B32]"
                }`}
                title={t("notesTab")}
              >
                <FileText className="w-4.5 h-4.5 text-sky-500" />
                <span className="text-xs hidden md:inline">{currentLang === "en" ? "Margins" : "الهوامش"}</span>
              </button>
            </div>

          </div>
        </header>
      )}

      {/* Fallback Notice Banner */}
      {isFallbackGenerated && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 text-center text-xs md:text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-center gap-2 animate-fade-in relative z-20">
          <span>⚠️</span>
          <span>
            عذراً، تعذر تحميل ملف الكتاب الأصلي من Google Drive (قد يكون الملف تالفاً، أو ليس بتنسيق PDF صالح مثل ملفات الفيديو MP4، أو يحتاج إذن مشاركة عام). تم توليد هذه النسخة التفاعلية للمعاينة وتصفح الموقع.
          </span>
        </div>
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

      {/* Persistent Prominent Floating Back to Library Button at the Edge of the Screen (Fullscreen & Reading Mode) */}
      {(settings.readingMode || isFullscreen) && (
        <div 
          className={`fixed top-4 ${currentLang === "en" ? "left-4" : "right-4"} z-50 animate-fade-in`}
          id="reading_mode_persistent_back"
        >
          <button
            onClick={onBackToLibrary}
            className={`flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-3 rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.45)] transition-all duration-300 hover:scale-105 active:scale-95 group font-extrabold text-xs border-2 select-none ${
              settings.darkMode
                ? "bg-amber-600 border-amber-400 text-[#1E1916] hover:bg-amber-500"
                : settings.sepiaMode
                  ? "bg-[#5C4033] border-[#FAF6EE] text-white hover:bg-[#4E3529]"
                  : "bg-[#1b4d3e] border-white text-white hover:bg-[#12352b]"
            }`}
            title={currentLang === "en" ? "Back to Library" : "الرجوع للمكتبة"}
          >
            {currentLang === "en" ? (
              <>
                <ChevronLeft className="w-4 h-4 md:w-4.5 md:h-4.5 text-white transition-transform group-hover:-translate-x-1 animate-pulse" />
                <span className="tracking-wide text-[11px] md:text-sm">Back to Library 📚</span>
              </>
            ) : (
              <>
                <ChevronRight className="w-4 h-4 md:w-4.5 md:h-4.5 text-white transition-transform group-hover:translate-x-1 animate-pulse" />
                <span className="font-serif text-[11px] md:text-sm">الرجوع للمكتبة 📚</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Reading Mode floating HUD (on opposite side of back button) */}
      {settings.readingMode && showReadingHud && (
        <div className={`fixed top-5 ${currentLang === "en" ? "right-5" : "left-5"} z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200`}>
          <button
            onClick={() => {
              setSettings(prev => ({ ...prev, readingMode: false }));
              setShowReadingHud(false);
            }}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-full shadow-xl text-xs font-semibold backdrop-blur-md transition-all duration-300 border ${
              settings.darkMode 
                ? "bg-[#27211D]/95 text-[#FAF6EE] hover:bg-[#3A3029] border-[#3A3029]" 
                : settings.sepiaMode
                  ? "bg-[#FAF6EE]/95 text-[#5C4033] border-[#DFCDB0] hover:bg-[#FAF0D9]"
                  : "bg-white/95 text-[#4A3B32] border border-[#E6E0D4] hover:bg-[#FDFBF7]"
            }`}
            title={currentLang === "en" ? "Show standard toolbar" : "عرض شريط الأدوات العادي"}
          >
            <Eye className="w-4 h-4 text-amber-600" />
            <span>{currentLang === "en" ? "Show Interface" : "عرض بقية الواجهة"}</span>
          </button>
        </div>
      )}

      {/* Main viewer workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side Menu - Bookmarks list and Info (Floating or side panel) */}
        {!settings.readingMode && (
          <aside className={`w-80 hidden xl:flex flex-col border-l transition-all duration-500 ease-in-out overflow-y-auto ${
            settings.darkMode 
              ? "border-[#3A3029] bg-[#27211D]/60" 
              : settings.sepiaMode
                ? "border-[#DFCDB0] bg-[#EADDC9]/60"
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
          className={`flex-1 flex flex-col items-center justify-center relative select-none transition-all duration-300 ${
            settings.zoom > 100 ? "overflow-auto scrollbar-thin" : "overflow-hidden"
          } ${
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
                    <h3 className="font-bold text-[#5A5A40] text-md">جاري فتح الكتاب...</h3>
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
                className={`relative flex items-center justify-center ${isPinching ? "" : "transition-transform duration-300"}`}
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
                      className={`relative w-full h-full rounded-xl overflow-hidden shadow-2xl border-4 cursor-pointer transition-all duration-500 ease-in-out active:scale-[0.99] select-none ${
                        settings.darkMode 
                          ? "bg-[#2D2520] border-[#3D322A]" 
                          : settings.sepiaMode
                            ? "bg-[#FAF2DF] border-[#DFCDB0]"
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
                          style={imageFilterStyle}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <span className="animate-pulse text-xs text-[#5A5A40]">جاري صقل الحروف... ({currentPage})</span>
                        </div>
                      )}
                      
                      {renderPageNotes(currentPage)}
                      
                      {/* Page number footer */}
                      <div className="absolute bottom-2 left-4 right-4 flex justify-between items-center text-[10px] font-mono opacity-60">
                        <span>{book.title}</span>
                        <span>{currentPage} / {numPages}</span>
                      </div>
                    </div>
                  ) : (
                    
                    /* DOUBLE PAGE VIEW MODE (Desktop) WITH REALISTIC SHADOWS & LIGHT BURSTS */
                    (() => {
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
                        <div className="flex w-full h-full" style={{ transformStyle: "preserve-3d" }}>
                          
                          {/* LEFT PAGE CONTAINER */}
                          <div 
                            onClick={() => {
                              if (isRTL) handleNextPage();
                              else handlePrevPage();
                            }}
                            className={`w-1/2 h-full relative rounded-r-none rounded-l-2xl border-4 border-r-0 shadow-2xl flex flex-col justify-between overflow-hidden transition-all duration-500 ease-in-out transform-gpu cursor-pointer active:brightness-95 ${
                              settings.darkMode 
                                ? "bg-[#261F1A] border-[#3D322A]" 
                                : settings.sepiaMode
                                  ? "bg-[#FAF2DF] border-[#DFCDB0]"
                                  : "bg-[#FAF7EE] border-[#EADDC9]"
                            }`}
                            style={{
                              transformOrigin: "right center"
                            }}
                          >
                            {/* Shadow on inner spine */}
                            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/25 to-transparent pointer-events-none z-10"></div>
                            <div className="absolute inset-0 bg-[radial-gradient(#5A5A40_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-5 pointer-events-none"></div>

                            {/* Dynamic Ambient Shadow cast by the turning page onto Left page */}
                            {isSheetActive && (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: activeDirection === "next" ? (isRTL ? [0.35, 0.1, 0] : [0, 0.25, 0.45]) : (isRTL ? [0, 0.25, 0.45] : [0.35, 0.1, 0]) }}
                                transition={transitionState}
                                className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-transparent pointer-events-none z-20 mix-blend-multiply"
                              />
                            )}

                            {/* Page Content */}
                            {doubleLeftPage ? (
                              renderedPages[doubleLeftPage] ? (
                                <img 
                                  src={renderedPages[doubleLeftPage]} 
                                  alt={`الصفحة ${doubleLeftPage}`} 
                                  className="w-full h-full object-contain pointer-events-none"
                                  referrerPolicy="no-referrer"
                                  style={imageFilterStyle}
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

                            {renderPageNotes(doubleLeftPage)}

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
                            className={`w-1/2 h-full relative rounded-l-none rounded-r-2xl border-4 border-l-0 shadow-2xl flex flex-col justify-between overflow-hidden transition-all duration-500 ease-in-out transform-gpu cursor-pointer active:brightness-95 ${
                              settings.darkMode 
                                ? "bg-[#261F1A] border-[#3D322A]" 
                                : settings.sepiaMode
                                  ? "bg-[#FAF2DF] border-[#DFCDB0]"
                                  : "bg-[#FAF7EE] border-[#EADDC9]"
                            }`}
                          >
                            {/* Shadow on inner spine */}
                            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/25 to-transparent pointer-events-none z-10"></div>
                            <div className="absolute inset-0 bg-[radial-gradient(#5A5A40_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-5 pointer-events-none"></div>

                            {/* Dynamic Ambient Shadow cast by the turning page onto Right page */}
                            {isSheetActive && (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: activeDirection === "next" ? (isRTL ? [0, 0.25, 0.45] : [0.35, 0.1, 0]) : (isRTL ? [0.35, 0.1, 0] : [0, 0.25, 0.45]) }}
                                transition={transitionState}
                                className="absolute inset-0 bg-gradient-to-l from-black/35 via-black/10 to-transparent pointer-events-none z-20 mix-blend-multiply"
                              />
                            )}

                            {/* Page Content */}
                            {doubleRightPage ? (
                              renderedPages[doubleRightPage] ? (
                                <img 
                                  src={renderedPages[doubleRightPage]} 
                                  alt={`الصفحة ${doubleRightPage}`} 
                                  className="w-full h-full object-contain pointer-events-none"
                                  referrerPolicy="no-referrer"
                                  style={imageFilterStyle}
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

                            {renderPageNotes(doubleRightPage)}

                            {/* Page Indicator */}
                            {doubleRightPage && (
                              <div className="absolute bottom-2.5 left-3 right-6 flex justify-between text-[10px] font-mono opacity-65">
                                <span>{book.title}</span>
                                <span>{doubleRightPage}</span>
                              </div>
                            )}
                          </div>

                          {/* 3D CAST SHADOW UNDER THE FLIPPING SHEET */}
                          <AnimatePresence>
                            {isSheetActive && activeDirection && (
                              <motion.div
                                initial={{ 
                                  rotateY: isRTL 
                                    ? (activeDirection === "next" ? 0 : -180) 
                                    : (activeDirection === "next" ? 0 : 180),
                                  z: -8,
                                  skewY: 0,
                                  opacity: 0
                                }}
                                animate={animateState}
                                transition={transitionState}
                                style={{
                                  position: "absolute",
                                  width: "50%",
                                  height: "100%",
                                  top: 0,
                                  left: isRTL ? 0 : "50%",
                                  transformOrigin: isRTL ? "right center" : "left center",
                                  transformStyle: "preserve-3d",
                                  zIndex: 35, // just under the turning page sheet
                                  pointerEvents: "none",
                                  boxShadow: isRTL 
                                    ? "-25px 25px 50px rgba(0,0,0,0.5), 15px 15px 35px rgba(0,0,0,0.3)"
                                    : "25px 25px 50px rgba(0,0,0,0.5), -15px 15px 35px rgba(0,0,0,0.3)",
                                  filter: "blur(14px)",
                                }}
                              />
                            )}
                          </AnimatePresence>

                          {/* 3D FLIPPING PAGE SHEET (CSS preserve-3d animation layered absolutely on top) */}
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
                                  className={`absolute inset-0 w-full h-full overflow-hidden flex flex-col justify-between border-4 transition-all duration-500 ease-in-out ${
                                    settings.darkMode 
                                      ? "bg-[#2B231D] border-[#3D322A]" 
                                      : settings.sepiaMode
                                        ? "bg-[#FAF2DF] border-[#DFCDB0]"
                                        : "bg-[#FDFBF7] border-[#EADDC9]"
                                  }`}
                                  style={{
                                    backfaceVisibility: "hidden",
                                    transform: "rotateY(0deg)",
                                    borderRadius: isRTL ? "2px 12px 12px 2px" : "12px 2px 2px 12px"
                                  }}
                                >
                                  {/* Soft organic shading gradient and paper fiber texture */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-white/5 to-black/25 pointer-events-none z-20"></div>
                                  <div className="absolute inset-0 bg-[radial-gradient(#5A5A40_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-5 pointer-events-none"></div>

                                  {/* Show next or prev page content based on directions */}
                                  {renderedPages[activeDirection === "next" ? currentPage + (isRTL ? 1 : 1) : currentPage - 1] ? (
                                    <img 
                                      src={renderedPages[activeDirection === "next" ? currentPage + 1 : currentPage - 1]} 
                                      className="w-full h-full object-contain pointer-events-none"
                                      alt="تحميل"
                                      referrerPolicy="no-referrer"
                                      style={imageFilterStyle}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-transparent">
                                      <span className="text-xs text-amber-600">...</span>
                                    </div>
                                  )}
                                </div>

                                {/* Back of flipping sheet */}
                                <div 
                                  className={`absolute inset-0 w-full h-full overflow-hidden flex flex-col justify-between border-4 transition-all duration-500 ease-in-out ${
                                    settings.darkMode 
                                      ? "bg-[#2B231D] border-[#3D322A]" 
                                      : settings.sepiaMode
                                        ? "bg-[#FAF2DF] border-[#DFCDB0]"
                                        : "bg-[#FDFBF7] border-[#EADDC9]"
                                  }`}
                                  style={{
                                    backfaceVisibility: "hidden",
                                    transform: "rotateY(180deg)",
                                    borderRadius: isRTL ? "12px 2px 2px 12px" : "2px 12px 12px 2px"
                                  }}
                                >
                                  {/* Soft organic shading gradient and paper fiber texture */}
                                  <div className="absolute inset-0 bg-gradient-to-l from-black/10 via-white/5 to-black/25 pointer-events-none z-20"></div>
                                  <div className="absolute inset-0 bg-[radial-gradient(#5A5A40_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-5 pointer-events-none"></div>

                                  {renderedPages[activeDirection === "next" ? currentPage + 2 : currentPage] ? (
                                    <img 
                                      src={renderedPages[activeDirection === "next" ? currentPage + 2 : currentPage]} 
                                      className="w-full h-full object-contain pointer-events-none"
                                      alt="تحميل"
                                      referrerPolicy="no-referrer"
                                      style={imageFilterStyle}
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

                        </div>
                      );
                    })()
                  )}

                  {/* Desktop Margin Touch Overlays for Easy Clicking */}
                  {!settings.readingMode && (
                    <>
                      <div className="absolute inset-y-0 -left-6 md:-left-12 w-12 md:w-20 flex items-center justify-center z-30">
                        <button
                          onClick={isRTL ? handleNextPage : handlePrevPage}
                          className={`p-2.5 rounded-full shadow-lg backdrop-blur-md border transition-all duration-500 ease-in-out ${
                            settings.darkMode 
                              ? "bg-[#27211D]/80 border-[#3A3029] text-[#FAF6EE] hover:bg-[#3A3029]" 
                              : settings.sepiaMode
                                ? "bg-[#FAF6EE]/80 border-[#DFCDB0] text-[#5C4033] hover:bg-[#FAF0D9]"
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
                          className={`p-2.5 rounded-full shadow-lg backdrop-blur-md border transition-all duration-500 ease-in-out ${
                            settings.darkMode 
                              ? "bg-[#27211D]/80 border-[#3A3029] text-[#FAF6EE] hover:bg-[#3A3029]" 
                              : settings.sepiaMode
                                ? "bg-[#FAF6EE]/80 border-[#DFCDB0] text-[#5C4033] hover:bg-[#FAF0D9]"
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
            <div className={`mt-6 md:mt-10 w-full max-w-xl p-4 rounded-2xl shadow-md border transition-all duration-500 ease-in-out ${
              settings.darkMode 
                ? "bg-[#27211D] border-[#3A3029]" 
                : settings.sepiaMode
                  ? "bg-[#EADDC9] border-[#DFCDB0]"
                  : "bg-[#FAF6EE] border-[#E6E0D4]"
            }`}>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="font-mono text-[#5A5A40]">{currentPage} / {numPages}</span>
                <span className="text-[#8D7B68] dark:text-[#CBB59C]">{currentLang === "en" ? "Reading Progress" : "مؤشر تقدم القراءة"}</span>
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
                  {currentLang === "en" ? "Start (Cover)" : "البداية (الغلاف)"}
                </button>

                {/* Comfortable Reading Mode Quick Switch */}
                <button
                  onClick={() => setSettings(prev => ({ ...prev, readingMode: !prev.readingMode }))}
                  className={`text-[11px] font-medium flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all duration-300 ${
                    settings.darkMode 
                      ? "border-[#5A5A40]/40 bg-[#5A5A40]/10 text-[#CBB59C] hover:bg-[#5A5A40]/25" 
                      : settings.sepiaMode
                        ? "border-[#5C4033]/30 bg-[#5C4033]/10 text-[#5C4033] hover:bg-[#5C4033]/20"
                        : "border-[#5A5A40]/20 bg-[#5A5A40]/5 text-[#5A5A40] hover:bg-[#5A5A40]/15"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{settings.readingMode ? t("readingModeOn") : t("readingModeOff")}</span>
                </button>

                <button
                  disabled={currentPage >= numPages}
                  onClick={() => {
                    setCurrentPage(numPages);
                    playPageTurnSound();
                  }}
                  className="text-[11px] font-medium opacity-75 hover:opacity-100 disabled:opacity-30 hover:text-[#5A5A40]"
                >
                  {currentLang === "en" ? "End" : "النهاية"}
                </button>
              </div>
            </div>
          )}

        </main>

        {/* Comprehensive Reader Sidebar Panel (TOC, Bookmarks, and Notes) */}
        <AnimatePresence>
          {showSidebar && (
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className={`fixed top-0 bottom-0 left-0 w-80 md:w-96 z-50 border-r shadow-2xl flex flex-col transition-all duration-500 ease-in-out ${
                settings.darkMode 
                  ? "border-[#3A3029] bg-[#221B17] text-[#FAF6EE]" 
                  : settings.sepiaMode
                    ? "border-[#DFCDB0] bg-[#FAF2DF] text-[#5C4033]"
                    : "border-[#E6E0D4] bg-[#FDFBF7] text-[#4A3B32]"
              }`}
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-[#E6E0D4] dark:border-[#3A3029] flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4.5 h-4.5 text-[#5A5A40]" />
                  <h3 className="font-bold text-[#5A5A40] text-sm">{currentLang === "en" ? "Reading Assistant" : "مساعد القراءة الجانبي"}</h3>
                </div>
                <button 
                  onClick={() => setShowSidebar(false)}
                  className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-[#3A3029] transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sidebar Tabs Switcher */}
              <div className="flex border-b border-[#E6E0D4] dark:border-[#3A3029] bg-black/5 dark:bg-white/5">
                <button
                  onClick={() => setSidebarTab("index")}
                  className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 text-center ${
                    sidebarTab === "index"
                      ? "border-[#5A5A40] text-[#5A5A40] bg-[#5A5A40]/10"
                      : "border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  }`}
                >
                  {currentLang === "en" ? "Index" : "فهرس الكتاب"}
                </button>
                <button
                  onClick={() => setSidebarTab("bookmarks")}
                  className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 text-center ${
                    sidebarTab === "bookmarks"
                      ? "border-[#5A5A40] text-[#5A5A40] bg-[#5A5A40]/10"
                      : "border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  }`}
                >
                  {currentLang === "en" ? `Bookmarks (${bookmarks.length})` : `العلامات (${bookmarks.length})`}
                </button>
                <button
                  onClick={() => setSidebarTab("notes")}
                  className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 text-center ${
                    sidebarTab === "notes"
                      ? "border-[#5A5A40] text-[#5A5A40] bg-[#5A5A40]/10"
                      : "border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  }`}
                >
                  {currentLang === "en" ? `Notes (${notes.length})` : `الهوامش (${notes.length})`}
                </button>
              </div>

              {/* TAB CONTENT: TABLE OF CONTENTS (فهرس الكتاب) */}
              {sidebarTab === "index" && (
                <div className="flex-1 p-4 overflow-y-auto space-y-2">
                  <h4 className="text-xs font-bold text-[#5A5A40] mb-3 flex items-center gap-1">
                    <span>فهرس الأبواب والمباحث</span>
                    <span className="text-[10px] opacity-60">({getChapterList().length})</span>
                  </h4>
                  {getChapterList().map((ch, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (!isFlipping) {
                          setCurrentPage(ch.page);
                          playPageTurnSound();
                        }
                      }}
                      className={`w-full text-right p-3 rounded-xl border text-xs flex justify-between items-center transition-all ${
                        currentPage === ch.page
                          ? "bg-[#5A5A40] text-white border-[#5A5A40]"
                          : settings.darkMode
                            ? "bg-[#2D2520] border-[#3D322A] hover:bg-[#3D322A]"
                            : "bg-[#FAF6EE] border-[#EADDC9] hover:bg-[#FAF0D9]"
                      }`}
                    >
                      <span className="font-bold truncate max-w-[210px]">{ch.title}</span>
                      <span className="text-[10px] font-semibold opacity-80 font-mono px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded">صفحة {ch.page}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* TAB CONTENT: BOOKMARKS (العلامات المرجعية) */}
              {sidebarTab === "bookmarks" && (
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#5A5A40] font-bold mb-2">
                    <span>{currentLang === "en" ? "Saved Bookmarks" : "العلامات المرجعية المحفوظة"}</span>
                    <button
                      onClick={toggleBookmark}
                      className="text-[10px] bg-[#9E4233] text-white px-2.5 py-1 rounded-lg hover:bg-[#853428] transition-colors shadow-sm"
                    >
                      {bookmarks.some(b => b.page === currentPage) 
                        ? (currentLang === "en" ? "Remove Current" : "إزالة الحالية") 
                        : (currentLang === "en" ? "Save Current" : "حفظ الحالية")}
                    </button>
                  </div>

                  {bookmarks.length === 0 ? (
                    <div className="text-center py-10 opacity-60 text-xs italic bg-[#5A5A40]/5 p-4 rounded-xl border border-dashed border-[#5A5A40]/20">
                      {currentLang === "en" 
                        ? "No bookmarks saved yet. Click the bookmark icon to save your progress and return here with one click." 
                        : "لا توجد أي علامات محفوظة بعد. اضغط على أيقونة العلامة لحفظ صفحة توقفك لتتمكن من العودة لاحقاً بضغطة واحدة."}
                    </div>
                  ) : (
                    bookmarks.map((bm) => (
                      <div
                        key={bm.id}
                        className={`p-3 rounded-xl border text-xs flex justify-between items-center transition-all relative ${
                          currentPage === bm.page ? "ring-2 ring-[#5A5A40]" : ""
                        } ${
                          settings.darkMode 
                            ? "bg-[#2D2520] border-[#3D322A]" 
                            : "bg-[#FAF6EE] border-[#E6E0D4]"
                        }`}
                      >
                        <button
                          onClick={() => {
                            if (!isFlipping) {
                              setCurrentPage(bm.page);
                              playPageTurnSound();
                            }
                          }}
                          className={`hover:underline flex-1 ${currentLang === "en" ? "text-left" : "text-right"}`}
                        >
                          <div className="font-bold text-[#5A5A40]">
                            {currentLang === "en" ? `Page ${bm.page}` : `الصفحة ${bm.page}`}
                          </div>
                          <div className="text-[10px] opacity-50 mt-1">
                            {currentLang === "en" ? "Saved on:" : "تم الحفظ:"} {new Date(bm.createdAt).toLocaleDateString(currentLang === "en" ? "en-US" : "ar-EG")}
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            const updated = bookmarks.filter(b => b.id !== bm.id);
                            setBookmarks(updated);
                            localStorage.setItem(`bookmarks_${book.id}`, JSON.stringify(updated));
                          }}
                          className="text-red-500 hover:text-red-700 font-bold text-[11px] px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
                          title="إزالة العلامة"
                        >
                          {currentLang === "en" ? "Delete" : "حذف"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB CONTENT: NOTES & MARGINS (الهوامش) */}
              {sidebarTab === "notes" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Note adding form */}
                  <form onSubmit={handleAddNote} className="p-4 border-b border-[#E6E0D4] dark:border-[#3A3029]">
                    <div className="flex justify-between text-xs mb-2 text-[#5A5A40] font-bold">
                      <span>{currentLang === "en" ? "Compose Margin Note on Current Page" : "تأليف الهامش على الصفحة الحالية"}</span>
                      <span>{currentLang === "en" ? `Page ${currentPage}` : `الصفحة ${currentPage}`}</span>
                    </div>
                    <textarea
                      value={activeNoteText}
                      onChange={(e) => setActiveNoteText(e.target.value)}
                      placeholder={currentLang === "en" ? "Write your thoughts or quote here..." : "اكتب فكرتك أو اقتباسك هنا للرجوع إليها لاحقاً..."}
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
                      {currentLang === "en" ? "Save Note" : "حفظ الهامش"}
                    </button>
                  </form>

                  {/* Notes list */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    <h4 className="text-xs font-semibold opacity-70 mb-2">
                      {currentLang === "en" ? `Saved margins for the book (${notes.length})` : `الهوامش المحفوظة للكتاب (${notes.length})`}
                    </h4>
                    
                    {notes.length === 0 ? (
                      <div className="text-center py-10 opacity-60 text-xs italic">
                        {currentLang === "en" ? "No margins written yet." : "لا توجد أي هوامش مكتوبة بعد."}
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
                              {currentLang === "en" ? `Page ${nt.page}` : `الصفحة ${nt.page}`}
                            </button>
                            <button
                              onClick={() => handleDeleteNote(nt.id)}
                              className="text-red-500 hover:text-red-700 font-semibold"
                              title="حذف الهامش"
                            >
                              {currentLang === "en" ? "Delete" : "حذف"}
                            </button>
                          </div>
                          <p className="leading-relaxed opacity-90 break-words">{nt.text}</p>
                          <div className={`text-[9px] opacity-50 mt-2 ${currentLang === "en" ? "text-right" : "text-left"}`}>
                            {new Date(nt.createdAt).toLocaleString(currentLang === "en" ? "en-US" : "ar-EG")}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
