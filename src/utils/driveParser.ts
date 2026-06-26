/**
 * Helper to parse Google Drive URLs and convert them into direct preview/stream URLs.
 * تم التعديل النهائي لصيغة المعاينة لتفادي حظر سيرفرات قوقل وصفحات الفحص نهائياً
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
    // الحسم هنا: إرجاع رابط المعاينة المباشر، وهو الرابط الأضمن لتخطي جدار الـ CORS وحظر التحميل
    return `https://drive.google.com/file/d/${fileId}/preview`;
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