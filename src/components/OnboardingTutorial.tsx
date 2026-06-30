import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Layers, 
  Mic, 
  Sparkles, 
  Bookmark, 
  Eye, 
  Volume2
} from "lucide-react";

interface OnboardingTutorialProps {
  language: string;
  onClose: () => void;
}

export default function OnboardingTutorial({ language, onClose }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const isRtl = language !== "en";

  const steps = [
    {
      title: isRtl ? "أهلاً بك في واحة المناهج والكتب التفاعلية! 🇸🇩" : "Welcome to the Interactive Sudan Library! 🇸🇩",
      description: isRtl 
        ? "بوابتك الإلكترونية المتكاملة لتصفح وقراءة الكتب المدرسية والمناهج السودانية والكتب الثقافية بتقنية تقليب الصفحات ثلاثية الأبعاد المذهلة."
        : "Your integrated portal to browse and read school textbooks, Sudanese curriculums, and cultural books with a stunning 3D page-flipping experience.",
      icon: <BookOpen className="w-12 h-12 text-[#9E4233] animate-pulse" />,
      features: isRtl 
        ? [
            "تصفح واقعي ثلاثي الأبعاد وكأنك تقلب كتاباً حقيقياً.",
            "مؤشر لحفظ تقدم القراءة تلقائياً لكل كتاب.",
            "مساعد ذكي وقراءة نصوص وصناعة هوامش."
          ]
        : [
            "Realistic 3D flipping, just like a physical book.",
            "Automatic reading progress tracker for every book.",
            "Smart AI assistant, text-to-speech, and margin notes."
          ],
      color: "from-[#FDFBF7] to-[#FAF5EC]"
    },
    {
      title: isRtl ? "تصنيفات الرفوف والأقسام 🏫" : "Shelves & Smart Categories 🏫",
      description: isRtl
        ? "قمنا بتنظيم الكتب في رفوف تفاعلية أنيقة مستوحاة من التراث السوداني العريق لتسهيل الوصول إليها."
        : "We have organized all books into elegant interactive shelves inspired by rich Sudanese heritage to make access easy.",
      icon: <Layers className="w-12 h-12 text-[#1b4d3e]" />,
      features: isRtl
        ? [
            "رف المناهج الدراسية: منظم حسب الصفوف والمراحل التعليمية.",
            "رف حكايات وقصص الأطفال: عالم ممتع وبراعم ملونة.",
            "رف الكتب العامة وروايات الأدب السوداني والعربي الخالد."
          ]
        : [
            "School Curriculums: organized by grades and stages.",
            "Kids & Stories: picture books and fun stories.",
            "General Literature: timeless novels, poetry, and history."
          ],
      color: "from-[#FAF5EC] to-[#FAF6EE]"
    },
    {
      title: isRtl ? "البحث الصوتي والذكي باللغة العربية 🎙️" : "Smart Arabic Voice Search 🎙️",
      description: isRtl
        ? "لا داعي للكتابة الطويلة! وفرنا لك محرك بحث ذكي للغاية يفهم صوتك ويسهل وصولك للكتب بلمشة زر."
        : "No more typing! We have integrated a smart voice search engine that understands Arabic commands and speeds up your lookup.",
      icon: <Mic className="w-12 h-12 text-rose-500 animate-bounce" />,
      features: isRtl
        ? [
            "ابحث بصوتك: انقر على زر الميكروفون وتحدث باسم الكتاب.",
            "ابحث باسم المؤلف أو الكلمات المفتاحية للموضوع.",
            "تصفية سريعة حسب التاريخ أو الترتيب الأبجدي."
          ]
        : [
            "Voice search: click the mic and speak the book title in Arabic.",
            "Look up by title, author, or keyword topics.",
            "Fast sorting by date added or alphabetical index."
          ],
      color: "from-[#FDFBF7] to-[#FFF5F5]"
    },
    {
      title: isRtl ? "مساعد القراءة والأدوات المتقدمة 📖" : "Reading Assistant & Margin Notes 📖",
      description: isRtl
        ? "عند فتح أي كتاب، ستحصل على ورقة تحكم قوية لتقديم أفضل تجربة دراسة ومطالعة مريحة."
        : "Opening any book gives you a powerful panel designed for the best comfortable reading and studying experience.",
      icon: <Sparkles className="w-12 h-12 text-amber-500" />,
      features: isRtl
        ? [
            "وضع القراءة المريحة: إخفاء القوائم لقراءة كاملة الشاشة.",
            "صناعة هوامش: اكتب ملاحظاتك وتلخيصاتك الخاصة بكل صفحة.",
            "النطق الصوتي والذكاء الاصطناعي للإجابة على الأسئلة وشرح المحتوى."
          ]
        : [
            "Comfort Reading Mode: hides controls for full-screen study.",
            "Margin Notes: write down your custom notes for each page.",
            "Speech synthesis and AI to answer questions and explain topics."
          ],
      color: "from-[#FFFDF9] to-[#FAF5EC]"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("flipbook_onboarding_completed", "true");
    onClose();
  };

  const current = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md select-none">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full max-w-lg overflow-hidden rounded-3xl border border-[#E6E0D4] bg-gradient-to-br ${current.color} p-6 shadow-2xl relative text-[#4A3B32] transition-colors duration-500`}
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Skip button / Close */}
        <button 
          onClick={handleComplete}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 text-[#8D7B68] hover:text-[#4A3B32] transition-colors"
          title={isRtl ? "تخطي الإرشادات" : "Skip Tutorial"}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header decoration */}
        <div className="flex justify-center mb-6 mt-2">
          <div className="p-4 bg-white/80 rounded-2xl shadow-md border border-[#E6E0D4]">
            {current.icon}
          </div>
        </div>

        {/* Content Panel with Animated text transition */}
        <div className="text-center px-2 min-h-[170px] flex flex-col justify-center">
          <motion.h3 
            key={`title-${currentStep}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg md:text-xl font-serif font-extrabold text-[#5C4033] mb-3"
          >
            {current.title}
          </motion.h3>

          <motion.p 
            key={`desc-${currentStep}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-xs md:text-sm text-[#6D4C41] leading-relaxed mb-4 max-w-md mx-auto"
          >
            {current.description}
          </motion.p>
        </div>

        {/* Feature Checkmarks list */}
        <div className="bg-white/50 border border-[#E6E0D4]/60 rounded-2xl p-4 mb-6 mx-2">
          <h4 className="text-[11px] font-bold text-[#8D7B68] uppercase tracking-wide mb-2">
            {isRtl ? "۞ أبرز المزايا:" : "۞ Highlights:"}
          </h4>
          <ul className="space-y-2 text-xs text-stone-700">
            {current.features.map((feature, idx) => (
              <motion.li 
                key={`feat-${currentStep}-${idx}`}
                initial={{ opacity: 0, x: isRtl ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                className="flex items-start gap-2.5"
              >
                <span className="text-emerald-600 mt-0.5 shrink-0">✓</span>
                <span className="leading-tight">{feature}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Bottom controls row */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E6E0D4] px-1">
          {/* Progress indicators dots */}
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <span 
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStep === idx ? "w-6 bg-[#9E4233]" : "w-2 bg-[#8D7B68]/30"
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#DFCDB0] hover:bg-[#FAF5EC] text-[#8D7B68] hover:text-[#4A3B32] transition-colors flex items-center gap-1"
              >
                {isRtl ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                <span>{isRtl ? "السابق" : "Back"}</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4.5 py-2 rounded-xl text-xs font-extrabold bg-[#1b4d3e] text-white hover:bg-[#12352b] shadow-md hover:shadow-lg transition-all flex items-center gap-1 hover:scale-105 active:scale-95"
            >
              <span>
                {currentStep === steps.length - 1 
                  ? (isRtl ? "ابدأ الاستخدام 🚀" : "Get Started 🚀")
                  : (isRtl ? "التالي" : "Next")}
              </span>
              {currentStep < steps.length - 1 && (
                isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Footer subtle brand */}
        <p className="text-[10px] text-center text-[#8D7B68]/60 mt-4 font-mono">
          {isRtl ? "۞ المناهج السودانية التفاعلية ٢٠٢٦" : "۞ Sudanese Interactive Curriculums 2026"}
        </p>
      </motion.div>
    </div>
  );
}
