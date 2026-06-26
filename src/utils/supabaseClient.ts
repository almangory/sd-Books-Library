import { createClient } from "@supabase/supabase-js";
import { Book } from "../types";

// الروابط الحقيقية والخاصة بمشروعك
const supabaseUrl = "https://jzztpvefyqqyewiygdaa.supabase.co".trim();
const supabaseAnonKey = "sb_publishable_8T3dT2NJqcSHX0FkG0K6eg_IknNAY2b".trim();

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Fetch books from Supabase database
 */
export async function getSupabaseBooks(): Promise<Book[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("added_at", { ascending: false });

    if (error) {
      console.error("Error fetching books from Supabase:", error);
      return null;
    }

    if (data) {
      return data.map((item: any) => ({
        id: String(item.id),
        title: item.title,
        author: item.author,
        description: item.description || "",
        pdfUrl: item.pdf_url || item.pdfUrl || "",
        coverUrl: item.cover_url || item.coverUrl || "",
        isCustom: item.is_custom !== undefined ? item.is_custom : true,
        // تحويل التاريخ القادم من timestamptz إلى رقم ليطابق الفروينت إند
        addedAt: item.added_at ? new Date(item.added_at).getTime() : Date.now(),
        category: item.category || "general",
      }));
    }
    return [];
  } catch (err) {
    console.error("Supabase communication failure:", err);
    return null;
  }
}

/**
 * Insert a book into Supabase
 */
export async function insertSupabaseBook(book: Book): Promise<Book | null> {
  if (!supabase) return null;
  try {
    const insertData: any = {
      title: book.title,
      author: book.author,
      description: book.description,
      pdf_url: book.pdfUrl, // مطابق لجدولك الحالي
      category: book.category || "general",
      // الحسم هنا: تحويل الرقم إلى صيغة ISO String متوافقة تماماً مع timestamptz في سوبابيس
      added_at: new Date(book.addedAt || Date.now()).toISOString(),
    };

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(book.id);
    if (isUuid) {
      insertData.id = book.id;
    }

    const { data, error } = await supabase
      .from("books")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("Error inserting book to Supabase:", error);
      return null;
    }

    if (data) {
      return {
        id: String(data.id),
        title: data.title,
        author: data.author,
        description: data.description || "",
        pdfUrl: data.pdf_url,
        coverUrl: data.cover_url || "",
        isCustom: true,
        addedAt: data.added_at ? new Date(data.added_at).getTime() : Date.now(),
        category: data.category || "general",
      };
    }
    return null;
  } catch (err) {
    console.error("Supabase insert failure:", err);
    return null;
  }
}

/**
 * Update an existing book in Supabase
 */
export async function updateSupabaseBook(book: Book): Promise<boolean> {
  if (!supabase) return false;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(book.id);
    if (!isUuid) {
      console.warn("تنبيه: لا يمكن تعديل الكتب الافتراضية داخل سوبابيس لأن معرّفها ليس UUID");
      return false; 
    }

    const { error } = await supabase
      .from("books")
      .update({
        title: book.title,
        author: book.author,
        description: book.description,
        pdf_url: book.pdfUrl,
        category: book.category || "general",
      })
      .eq("id", book.id);

    if (error) {
      console.error("Error updating book in Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase update failure:", err);
    return false;
  }
}

/**
 * Delete a book from Supabase
 */
export async function deleteSupabaseBook(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) return false; 

    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) {
      console.error("Error deleting book from Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase delete failure:", err);
    return false;
  }
}

/**
 * Fetch Admin password from Supabase.
 */
export async function getAdminPassword(): Promise<string> {
  const DEFAULT_PASS = "20302060";
  if (!supabase) return DEFAULT_PASS;
  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("id", "admin_password")
      .single();

    if (error) {
      return DEFAULT_PASS;
    }

    return data?.value || DEFAULT_PASS;
  } catch (err) {
    console.error("Error getting admin password from Supabase:", err);
    return DEFAULT_PASS;
  }
}