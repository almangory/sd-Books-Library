import React, { useState } from "react";
import { Copy, Check, ChevronRight, Database, Terminal, ShieldAlert, Sparkles } from "lucide-react";

interface SupabaseRequirementsProps {
  onBack: () => void;
}

export default function SupabaseRequirements({ onBack }: SupabaseRequirementsProps) {
  const [copied, setCopied] = useState<boolean>(false);

  // The SQL code containing a single simple table for adding Google Drive books with categories without login registration!
  const sqlSchema = `-- ==========================================
-- سكيما قاعدة البيانات لقارئ الكتب التفاعلي (Supabase SQL)
-- لتنصيب جداول إضافة روابط Google Drive مباشرة وتخزين كلمة مرور المشرف
-- ==========================================

-- 1. جدول إعدادات المشرف (لتخزين كلمة مرور النظام)
create table if not exists public.admin_settings (
  id text primary key,
  value text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- إدراج كلمة المرور الافتراضية للمشرف (يمكن تغييرها لاحقاً من جدول قاعدة البيانات)
insert into public.admin_settings (id, value)
values ('admin_password', '20302060')
on conflict (id) do update set value = excluded.value;

-- 2. جدول كتب روابط Google Drive المصنفة
create table if not exists public.books (
  id uuid default gen_random_uuid() primary key,
  title text not null,                       -- عنوان الكتاب
  author text not null,                      -- اسم الكاتب أو المؤلف
  description text,                          -- نبذة مختصرة عن الكتاب
  google_drive_url text not null,            -- رابط مشاركة ملف Google Drive الأصلي أو المباشر
  category text not null default 'general',  -- التصنيف (curriculum, children, religious, general)
  added_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- تمكين حماية البيانات الأساسية وتفعيل الوصول العام لتسهيل قراءة وإضافة الروابط
alter table public.books enable row level security;
alter table public.admin_settings enable row level security;

-- سياسة تمكن الجميع من رؤية الكتب المدخلة وإعدادات المشرف
create policy "الكتب مرئية للجميع" on public.books for select using (true);
create policy "الإعدادات مرئية للجميع للقراءة" on public.admin_settings for select using (true);

-- سياسة تمكن الجميع من إضافة روابط قوقل درايف جديدة وتعديلها
create policy "الجميع يمكنهم إضافة روابط الكتب" on public.books for insert with check (true);
create policy "الجميع يمكنهم تعديل وحذف الكتب" on public.books for all using (true);
create policy "المشرف يمكنه تعديل الإعدادات" on public.admin_settings for all using (true);
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 bg-[#FDFBF7] text-[#4A3B32] min-h-screen px-4 py-8 md:px-8 max-w-4xl mx-auto flex flex-col justify-between selection:bg-[#5A5A40] selection:text-white">
      
      <div>
        {/* Navigation back button */}
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E6E0D4] hover:bg-[#F5F0E6] text-xs font-semibold text-[#4A3B32] mb-6 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          <span>العودة للمكتبة الرئيسية</span>
        </button>

        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-b from-[#FAF5EC] to-[#F5F0E6] border border-[#E6E0D4] shadow-sm mb-8 relative overflow-hidden text-right">
          <div className="absolute inset-0 bg-[radial-gradient(#C84B31_0.5px,transparent_0.5px)] [background-size:20px_20px] opacity-5 pointer-events-none"></div>
          
          <div className="flex items-center gap-3 justify-end mb-4">
            <h1 className="text-xl md:text-2xl font-bold font-serif">جدول قاعدة البيانات في Supabase لإضافة الروابط</h1>
            <Database className="w-6 h-6 text-[#9E4233]" />
          </div>

          <p className="text-xs md:text-sm text-[#6D4C41] leading-relaxed mb-6">
            لتخزين روابط <strong>Google Drive</strong> والكتب المصنفة سحابياً دون الحاجة لتسجيل معقد أو رفع ملفات PDF ضخمة، يمكنك استخدام منصة <strong>Supabase (PostgreSQL)</strong>. قمنا بتصميم جدول مبسط ومستقل يمكنك إضافته بلمسة واحدة.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-right">
            <div className="bg-white/60 p-4 rounded-xl border border-[#E6E0D4]">
              <span className="font-bold text-xs text-[#9E4233] block mb-1">۞ جدول الكتب والروابط</span>
              <p className="text-[11px] opacity-80 leading-relaxed">تخزين بيانات وعناوين الكتب والروابط القادمة من Google Drive مصنفة حسب الأقسام المحددة.</p>
            </div>
            
            <div className="bg-white/60 p-4 rounded-xl border border-[#E6E0D4]">
              <span className="font-bold text-xs text-[#5A5A40] block mb-1">۞ تقسيم الكتب الإلكترونية</span>
              <p className="text-[11px] opacity-80 leading-relaxed">دعم تقسيم وتصنيف الكتب تلقائياً (مناهج دراسية، كتب أطفال، كتب دينية، وروايات عامة).</p>
            </div>

            <div className="bg-white/60 p-4 rounded-xl border border-[#E6E0D4]">
              <span className="font-bold text-xs text-[#4A3B32] block mb-1">۞ سهولة وبساطة تامة</span>
              <p className="text-[11px] opacity-80 leading-relaxed">لا يتطلب هذا الهيكل أي عمليات رفع ملفات أو تسجيل مستخدمين معقد لضمان السرعة الفائقة.</p>
            </div>
          </div>

          {/* Quick instructions panel */}
          <div className="p-4 rounded-2xl bg-[#5A5A40]/5 border border-[#5A5A40]/15 text-xs text-[#6D4C41] mb-6 leading-relaxed">
            <h4 className="font-bold text-[#5A5A40] mb-1.5 flex items-center gap-1.5 justify-end">
              <span>خطوات التنصيب داخل لوحة تحكم سوبابيس</span>
              <Sparkles className="w-4 h-4 text-[#5A5A40]" />
            </h4>
            <ol className="list-decimal list-inside space-y-1 pr-1">
              <li>سجل الدخول إلى مشروعك في موقع <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-bold text-[#5A5A40]">Supabase</a>.</li>
              <li>انقر على قسم <strong>SQL Editor</strong> في شريط القائمة الجانبي.</li>
              <li>انقر على زر <strong>New Query</strong> لإنشاء استعلام فارغ جديد.</li>
              <li>انسخ كود SQL البرمجي أدناه والصقه بالكامل داخل المحرر.</li>
              <li>انقر على زر <strong>Run</strong> لتنفيذ الكود، وسيتم إنشاء جدول الكتب المخصص لروابط Google Drive فوراً.</li>
            </ol>
          </div>

          {/* Code block box */}
          <div className="relative rounded-2xl overflow-hidden border border-[#E6E0D4] bg-neutral-900 text-neutral-100 text-left font-mono text-xs shadow-lg">
            <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-800 border-b border-neutral-700">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#5A5A40] hover:bg-[#4A4A32] text-white text-[11px] font-bold transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ كود SQL</span>
                  </>
                )}
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-400 font-bold">SUPABASE SCHEMA SQL</span>
                <Terminal className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            
            <div className="p-4 overflow-x-auto max-h-[350px] overflow-y-auto leading-relaxed">
              <pre>{sqlSchema}</pre>
            </div>
          </div>

        </div>
      </div>

      <footer className="border-t border-[#E6E0D4] pt-6 pb-2 text-center text-xs opacity-60">
        <p>مكتبة الكتب التفاعلية • إعدادات الجداول وربط قواعد البيانات</p>
      </footer>

    </div>
  );
}
