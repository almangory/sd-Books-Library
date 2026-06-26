/**
 * Helper to parse Google Drive URLs and convert them into direct download/stream URLs.
 */
export function getGoogleDriveDirectLink(url: string): string {
  if (!url) return "";
  
  // Clean URL
  const trimmed = url.trim();
  
  // Match file ID from various formats
  // Format 1: https://drive.google.com/file/d/{FILE_ID}/view...
  // Format 2: https://drive.google.com/open?id={FILE_ID}
  // Format 3: google drive short links or doc links
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
    // Return standard, clean shareable Google Drive link to store in database
    return `https://drive.google.com/file/d/${fileId}/view`;
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
