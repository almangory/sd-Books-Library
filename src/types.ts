export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  pdfUrl: string;
  coverUrl: string;
  isCustom: boolean;
  fileSize?: string;
  addedAt: number;
  category?: string; // e.g. "curriculum", "children", "religious", "general"
  tags?: string[];
}

export interface Bookmark {
  id: string;
  bookId: string;
  page: number;
  label?: string;
  createdAt: number;
}

export interface BookNote {
  id: string;
  bookId: string;
  page: number;
  text: string;
  createdAt: number;
}

export interface ReadingProgress {
  bookId: string;
  lastPage: number;
  updatedAt: number;
}

export interface ReadingSettings {
  darkMode: boolean;
  sepiaMode: boolean; // Warm Sudan Ochre
  readingMode: boolean; // Distraction-free (وضع القراءة المريح)
  zoom: number; // Percentage, e.g. 100, 120, 150
}
