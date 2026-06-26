/**
 * Helper to parse Google Drive URLs and convert them into direct download/stream URLs.
 * تم تعديلها لتخطي حماية CORS وفتح المخطوطات والكتب مباشرة في القارئ التفاعلي
 */
export function getGoogleDriveDirectLink(url: string): string {
  if (!url) return "";
  
  // Clean URL
  const trimmed = url.trim();
  
  // Match file ID from various formats
  const fileIdRegexes = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/
  ];
  
  let fileId = "";
  for (const regex of fileIdRegexes) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      fileId = match[1];
      break;
    }
  }
  
  if (fileId) {
    // الحسم هنا: إرجاع الرابط المباشر والنظيف المعتمد للبث والتحميل السريع في المتصفح
    return `https://docs.google.com/uc?export=download&id=${fileId}`;
  }
  
  return trimmed;
}

/**
 * Validates if a string is a valid URL or Google Drive link
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}