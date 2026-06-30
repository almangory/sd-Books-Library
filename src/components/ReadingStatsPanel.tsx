import React, { useState, useEffect } from "react";
import { Book } from "../types";
import { 
  Trophy, 
  Clock, 
  BookOpen, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Flame, 
  Sparkles, 
  TrendingUp, 
  RotateCcw 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ReadingStatsPanelProps {
  language: "ar" | "en";
  readBookIds: string[];
  readingTimeByDate: Record<string, number>;
  books: Book[];
}

export default function ReadingStatsPanel({
  language,
  readBookIds,
  readingTimeByDate,
  books
}: ReadingStatsPanelProps) {
  const isRtl = language !== "en";
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // Daily goal in minutes (default to 10 minutes)
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("flipbook_daily_reading_goal");
      return saved ? parseInt(saved, 10) : 10;
    } catch (e) {
      return 10;
    }
  });

  // Save goal changes
  const handleSetGoal = (mins: number) => {
    setDailyGoalMinutes(mins);
    try {
      localStorage.setItem("flipbook_daily_reading_goal", mins.toString());
    } catch (e) {
      console.warn("Could not save daily goal:", e);
    }
  };

  // Compute today's date string in local time format YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];
  const todaySeconds = readingTimeByDate[todayStr] || 0;
  const todayMinutes = Math.floor(todaySeconds / 60);
  const todaySecRemainder = todaySeconds % 60;

  // Percentage of daily goal completed
  const goalSeconds = dailyGoalMinutes * 60;
  const goalPercentage = Math.min(100, Math.round((todaySeconds / goalSeconds) * 100));

  // Generate last 7 days stats
  const daysOfWeekAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const daysOfWeekEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const seconds = readingTimeByDate[dateStr] || 0;
    const minutes = Math.round((seconds / 60) * 10) / 10; // 1 decimal place
    
    const dayIndex = d.getDay();
    const label = isRtl ? daysOfWeekAr[dayIndex] : daysOfWeekEn[dayIndex];
    const isToday = dateStr === todayStr;

    return {
      dateStr,
      label,
      minutes,
      seconds,
      isToday
    };
  });

  // Calculate stats
  const totalSecondsAllTime = Object.values(readingTimeByDate).reduce((acc, curr) => acc + curr, 0);
  const totalMinutesAllTime = Math.round(totalSecondsAllTime / 60);
  
  // Calculate current streak (consecutive days with reading > 0)
  const calculateStreak = (): number => {
    let streak = 0;
    const checkDate = new Date();
    
    // Check back up to 30 days
    for (let i = 0; i < 30; i++) {
      const dateStr = checkDate.toISOString().split("T")[0];
      const seconds = readingTimeByDate[dateStr] || 0;
      
      if (seconds > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today has no reading yet, but yesterday did, keep the streak alive!
        if (i === 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];
          const yesterdaySeconds = readingTimeByDate[yesterdayStr] || 0;
          if (yesterdaySeconds > 0) {
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  // Reset stats helper (with warning)
  const handleResetStats = () => {
    const msg = isRtl 
      ? "هل أنت متأكد من تصفير وإعادة تعيين جميع إحصائيات القراءة والوقت اليومي؟"
      : "Are you sure you want to reset all reading progress and statistics?";
    if (window.confirm(msg)) {
      try {
        localStorage.removeItem("flipbook_reading_time_by_date");
        localStorage.removeItem("flipbook_read_book_ids");
        window.location.reload();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="w-full mb-8 bg-[#FAF6EE] border border-[#E6E0D4] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header Bar */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`px-6 py-4 bg-gradient-to-r from-[#FAF5EC] to-[#FAF6EE] ${
          isCollapsed ? "" : "border-b border-[#E6E0D4]/60"
        } flex items-center justify-between cursor-pointer select-none hover:bg-black/[0.01] transition-colors`}
      >
        <div className={`flex items-center gap-2.5 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
          <div className="p-2 rounded-xl bg-[#5A5A40]/10 text-[#5A5A40]">
            <Trophy className="w-5 h-5 animate-pulse" />
          </div>
          <div className={isRtl ? "text-right" : "text-left"}>
            <h3 className="font-serif font-extrabold text-sm md:text-base text-[#4A3B32]">
              {isRtl ? "لوحة الإنجاز وإحصائيات القراءة 📊" : "Reading Achievement Dashboard 📊"}
            </h3>
            <p className="text-[10px] md:text-xs text-[#8D7B68]">
              {isRtl 
                ? "تتبع وقتك اليومي، مستوى إنجازك والكتب التي قرأتها لبناء شغفك بالمطالعة."
                : "Track your daily study, active streak, and books opened to grow your reading habits."}
            </p>
          </div>
        </div>

        <button className="p-1.5 rounded-lg hover:bg-black/5 text-[#8D7B68] transition-colors">
          {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6">
              {/* Stats Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                
                {/* 1. Time Spent Today */}
                <div className="p-4 rounded-2xl bg-white border border-[#E6E0D4]/80 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600">
                    <Clock className="w-6 h-6 animate-spin-slow" />
                  </div>
                  <div className={isRtl ? "text-right" : "text-left"}>
                    <p className="text-[10px] font-bold text-[#8D7B68] uppercase tracking-wide">
                      {isRtl ? "وقت القراءة اليوم" : "Reading Time Today"}
                    </p>
                    <p className="font-mono font-extrabold text-lg text-[#4A3B32] mt-0.5">
                      {todayMinutes > 0 ? (
                        isRtl ? `${todayMinutes} د و ${todaySecRemainder} ث` : `${todayMinutes}m ${todaySecRemainder}s`
                      ) : (
                        isRtl ? `${todaySecRemainder} ثوانٍ` : `${todaySecRemainder}s`
                      )}
                    </p>
                    <p className="text-[9px] text-[#8D7B68]/80 mt-1">
                      {isRtl ? "الهدف: " : "Goal: "}{dailyGoalMinutes} {isRtl ? "دقائق" : "mins"}
                    </p>
                  </div>
                  <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
                </div>

                {/* 2. Books Read */}
                <div className="p-4 rounded-2xl bg-white border border-[#E6E0D4]/80 shadow-sm flex items-center gap-4 relative overflow-hidden">
                  <div className="p-3 rounded-xl bg-[#5A5A40]/10 text-[#5A5A40]">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className={isRtl ? "text-right" : "text-left"}>
                    <p className="text-[10px] font-bold text-[#8D7B68] uppercase tracking-wide">
                      {isRtl ? "الكتب المفتوحة والمقروءة" : "Books Opened & Read"}
                    </p>
                    <p className="font-mono font-extrabold text-lg text-[#4A3B32] mt-0.5">
                      {readBookIds.length} {isRtl ? "كتب" : "books"}
                    </p>
                    <p className="text-[9px] text-[#8D7B68]/80 mt-1">
                      {isRtl ? "من إجمالي " : "Out of "}{books.length} {isRtl ? "كتب متوفرة" : "total books"}
                    </p>
                  </div>
                  <div className="absolute top-0 right-0 w-2 h-full bg-[#5A5A40]" />
                </div>

                {/* 3. Streak Card */}
                <div className="p-4 rounded-2xl bg-white border border-[#E6E0D4]/80 shadow-sm flex items-center gap-4 relative overflow-hidden">
                  <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600">
                    <Flame className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className={isRtl ? "text-right" : "text-left"}>
                    <p className="text-[10px] font-bold text-[#8D7B68] uppercase tracking-wide">
                      {isRtl ? "سلسلة القراءة المتتالية" : "Consecutive Streak"}
                    </p>
                    <p className="font-mono font-extrabold text-lg text-[#4A3B32] mt-0.5">
                      {currentStreak} {isRtl ? "أيام 🔥" : "days 🔥"}
                    </p>
                    <p className="text-[9px] text-[#8D7B68]/80 mt-1">
                      {currentStreak > 0 
                        ? (isRtl ? "حافظ على وتيرتك الرائعة!" : "Keep the fire burning!") 
                        : (isRtl ? "ابدأ القراءة اليوم للبدء!" : "Read today to start streak!")}
                    </p>
                  </div>
                  <div className="absolute top-0 right-0 w-2 h-full bg-orange-500" />
                </div>

                {/* 4. Total Study Time */}
                <div className="p-4 rounded-2xl bg-white border border-[#E6E0D4]/80 shadow-sm flex items-center gap-4 relative overflow-hidden">
                  <div className="p-3 rounded-xl bg-[#9E4233]/10 text-[#9E4233]">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className={isRtl ? "text-right" : "text-left"}>
                    <p className="text-[10px] font-bold text-[#8D7B68] uppercase tracking-wide">
                      {isRtl ? "إجمالي وقت الدراسة والمطالعة" : "Total Reading/Study Time"}
                    </p>
                    <p className="font-mono font-extrabold text-lg text-[#4A3B32] mt-0.5">
                      {totalMinutesAllTime} {isRtl ? "دقائق" : "minutes"}
                    </p>
                    <p className="text-[9px] text-[#8D7B68]/80 mt-1">
                      {isRtl ? "مستوى الاهتمام: عالي 🌟" : "Focus Level: High 🌟"}
                    </p>
                  </div>
                  <div className="absolute top-0 right-0 w-2 h-full bg-[#9E4233]" />
                </div>

              </div>

              {/* Goal Setting & Goal Ring & Weekly Chart Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Left (or Right in RTL): Reading Goal Ring & Interactive Select */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E6E0D4]/80 p-5 flex flex-col justify-between">
                  <div className={isRtl ? "text-right" : "text-left"}>
                    <h4 className="font-bold text-xs text-[#5C4033] mb-1.5 flex items-center gap-1.5 justify-start">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isRtl ? "هدف القراءة اليومي التفاعلي" : "Interactive Daily Study Goal"}</span>
                    </h4>
                    <p className="text-[10px] text-[#8D7B68]">
                      {isRtl 
                        ? "حدد الوقت الذي تود الالتزام به يومياً وسنساعدك في متابعة تقدمك."
                        : "Set your daily reading target and watch your target fill up as you read."}
                    </p>
                  </div>

                  {/* Goal circle visualization */}
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      {/* SVG Progress Ring */}
                      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle 
                          cx="56" 
                          cy="56" 
                          r="48" 
                          className="stroke-stone-100 fill-none" 
                          strokeWidth="8"
                        />
                        <circle 
                          cx="56" 
                          cy="56" 
                          r="48" 
                          className="stroke-amber-500 fill-none transition-all duration-1000 ease-out" 
                          strokeWidth="8"
                          strokeDasharray={2 * Math.PI * 48}
                          strokeDashoffset={2 * Math.PI * 48 * (1 - goalPercentage / 100)}
                          strokeLinecap="round"
                        />
                      </svg>
                      
                      <div className="text-center z-10">
                        <span className="text-xl md:text-2xl font-black font-mono text-[#4A3B32]">
                          {goalPercentage}%
                        </span>
                        <span className="block text-[8px] text-[#8D7B68] font-bold uppercase">
                          {isRtl ? "مكتمل" : "completed"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 text-center">
                      {goalPercentage >= 100 ? (
                        <div className="text-emerald-700 bg-emerald-50 text-[10px] font-bold py-1 px-3 rounded-full border border-emerald-200/50 animate-bounce">
                          {isRtl ? "🏆 أحسنت! لقد حققت هدف القراءة اليومي!" : "🏆 Congratulations! Daily Goal Met!"}
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#8D7B68]">
                          {isRtl 
                            ? `تحتاج إلى ${Math.max(0, dailyGoalMinutes - todayMinutes)} دقيقة إضافية لتحقيق هدف اليوم`
                            : `Study for ${Math.max(0, dailyGoalMinutes - todayMinutes)} more mins to hit your goal`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Interactive Buttons for Goals */}
                  <div>
                    <span className="block text-[9px] font-bold text-[#8D7B68] mb-2 text-center uppercase tracking-wider">
                      {isRtl ? "تعديل هدف اليوم الحالي:" : "Change today's study target:"}
                    </span>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {[1, 5, 10, 15, 30, 60].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => handleSetGoal(mins)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            dailyGoalMinutes === mins
                              ? "bg-amber-600 text-white shadow-sm scale-105"
                              : "bg-stone-100 hover:bg-stone-200/80 text-[#6D4C41]"
                          }`}
                        >
                          {mins} {isRtl ? "دقائق" : "m"}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right (or Left in RTL): Weekly Study Bar Chart */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E6E0D4]/80 p-5 flex flex-col justify-between">
                  <div className={`flex items-center justify-between gap-3 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={isRtl ? "text-right" : "text-left"}>
                      <h4 className="font-bold text-xs text-[#5C4033] flex items-center gap-1.5 justify-start">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{isRtl ? "مخطط القراءة الأسبوعي المنصرم" : "Weekly Reading Patterns"}</span>
                      </h4>
                      <p className="text-[10px] text-[#8D7B68] mt-0.5">
                        {isRtl 
                          ? "سجل قراءتك لآخر سبعة أيام (بالدقائق)."
                          : "Your active reading duration logged over the last 7 days."}
                      </p>
                    </div>

                    <button 
                      onClick={handleResetStats}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-100 text-[10px] font-bold transition-all flex items-center gap-1"
                      title={isRtl ? "تصفير الإحصائيات" : "Reset Data"}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{isRtl ? "تصفير" : "Reset"}</span>
                    </button>
                  </div>

                  {/* Visual Bar Columns with Tooltip/Hover */}
                  <div className="h-44 flex items-end justify-between px-3 md:px-6 pt-6 pb-2 relative border-b border-stone-100">
                    
                    {/* Background Guideline Helper */}
                    <div className="absolute left-0 right-0 top-1/4 border-t border-dashed border-stone-100 pointer-events-none" />
                    <div className="absolute left-0 right-0 top-2/4 border-t border-dashed border-stone-100 pointer-events-none" />
                    <div className="absolute left-0 right-0 top-3/4 border-t border-dashed border-stone-100 pointer-events-none" />

                    {last7DaysData.map((day, idx) => {
                      // Max height representation helper
                      const maxMinutes = Math.max(10, ...last7DaysData.map(d => d.minutes));
                      const barPercentage = Math.max(4, Math.min(100, (day.minutes / maxMinutes) * 100));

                      return (
                        <div key={idx} className="flex flex-col items-center flex-1 group relative">
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-2 bg-stone-800 text-white text-[9px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-nowrap shadow-md">
                            {day.minutes} {isRtl ? "دقائق قراءة" : "minutes read"}
                          </div>

                          {/* Bar */}
                          <div className="w-6 sm:w-8 bg-stone-100 rounded-t-lg overflow-hidden h-32 flex items-end">
                            <div 
                              style={{ height: `${barPercentage}%` }}
                              className={`w-full rounded-t-lg transition-all duration-700 ease-out ${
                                day.isToday 
                                  ? "bg-amber-600" 
                                  : day.minutes > 0 
                                    ? "bg-[#5A5A40]" 
                                    : "bg-stone-300/40"
                              }`}
                            />
                          </div>

                          {/* Day Label */}
                          <span className={`text-[9px] mt-2 font-bold ${
                            day.isToday ? "text-amber-700 font-extrabold" : "text-stone-500"
                          }`}>
                            {day.label}
                            {day.isToday && (isRtl ? " (اليوم)" : " (Today)")}
                          </span>
                        </div>
                      );
                    })}

                  </div>

                  {/* Bottom legend block */}
                  <div className={`mt-3 flex items-center justify-between text-[9px] text-[#8D7B68] px-2 ${isRtl ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-amber-600" />
                      <span>{isRtl ? "اليوم الحالي" : "Today"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-[#5A5A40]" />
                      <span>{isRtl ? "أيام سابقة مقروءة" : "Read on previous days"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded bg-stone-200" />
                      <span>{isRtl ? "لم تقرأ" : "No reading logged"}</span>
                    </div>
                  </div>

                </div>

              </div>
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
