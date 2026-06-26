import { createClient } from "@supabase/supabase-js";
import { Book } from "../types";

const supabaseUrl = (((import.meta as any).env?.VITE_SUPABASE_URL || "") as string).trim();
const supabaseAnonKey = (((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "") as string).trim();

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
        id: item.id,
        title: item.title,
        author: item.author,
        description: item.description || "",
        pdfUrl: item.google_drive_url || item.pdfUrl,
        coverUrl: item.cover_url || "",
        isCustom: item.is_custom !== undefined ? item.is_custom : true,
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
export async function insertSupabaseBook(book: Book): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("books").insert([
      {
        id: book.id.startsWith("drive_") ? undefined : book.id, // let Supabase auto-generate uuid if it's drive_ random
        title: book.title,
        author: book.author,
        description: book.description,
        google_drive_url: book.pdfUrl,
        category: book.category || "general",
        is_custom: true,
      },
    ]);

    if (error) {
      console.error("Error inserting book to Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Supabase insert failure:", err);
    return false;
  }
}

/**
 * Update an existing book in Supabase
 */
export async function updateSupabaseBook(book: Book): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from("books")
      .update({
        title: book.title,
        author: book.author,
        description: book.description,
        google_drive_url: book.pdfUrl,
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
 * Falls back to default password '20302060' if not set or if there is an error.
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
      // If table doesn't exist yet or is empty, fallback gracefully to default password
      return DEFAULT_PASS;
    }

    return data?.value || DEFAULT_PASS;
  } catch (err) {
    console.error("Error getting admin password from Supabase:", err);
    return DEFAULT_PASS;
  }
}
