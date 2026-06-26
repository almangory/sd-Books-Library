import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: any, res: any) {
  // Enable CORS for Vercel Serverless Function
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { id, url } = req.query;

    if (!id && !url) {
      return res.status(400).json({ error: "Missing id or url parameter" });
    }

    // If it's a direct URL that is not Google Drive
    if (url && typeof url === "string") {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      if (!response.ok) {
        throw new Error(`Target returned status: ${response.status}`);
      }

      res.setHeader("Content-Type", "application/pdf");
      const arrayBuffer = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    }

    // If it's a Google Drive ID
    if (id && typeof id === "string") {
      let targetUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download`;
      
      let response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      let contentType = response.headers.get("content-type") || "";

      // If Google Drive returns an HTML page (either a virus scan warning or error page)
      if (contentType.includes("text/html")) {
        const text = await response.text();
        
        // Search for verification/confirmation token
        const confirmMatch = text.match(/confirm=([a-zA-Z0-9_]+)/) || text.match(/uuid=([a-zA-Z0-9_-]+)/);
        if (confirmMatch && confirmMatch[1]) {
          const confirmToken = confirmMatch[1];
          const confirmUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=${confirmToken}`;
          const cookies = response.headers.get("set-cookie") || "";
          
          const confirmResponse = await fetch(confirmUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Cookie": cookies
            }
          });

          if (confirmResponse.ok) {
            res.setHeader("Content-Type", "application/pdf");
            const arrayBuffer = await confirmResponse.arrayBuffer();
            return res.send(Buffer.from(arrayBuffer));
          }
        }

        // Try classic docs.google.com endpoint as fallback
        const fallbackUrl = `https://docs.google.com/uc?export=download&id=${id}`;
        const fallbackResponse = await fetch(fallbackUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });

        const fallbackContentType = fallbackResponse.headers.get("content-type") || "";
        if (fallbackContentType.includes("text/html")) {
          const fallbackText = await fallbackResponse.text();
          const fallbackConfirmMatch = fallbackText.match(/confirm=([a-zA-Z0-9_]+)/);
          if (fallbackConfirmMatch && fallbackConfirmMatch[1]) {
            const fallbackConfirmToken = fallbackConfirmMatch[1];
            const fallbackConfirmUrl = `https://docs.google.com/uc?export=download&confirm=${fallbackConfirmToken}&id=${id}`;
            const fallbackCookies = fallbackResponse.headers.get("set-cookie") || "";

            const secondFallbackResponse = await fetch(fallbackConfirmUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Cookie": fallbackCookies
              }
            });

            if (secondFallbackResponse.ok) {
              res.setHeader("Content-Type", "application/pdf");
              const arrayBuffer = await secondFallbackResponse.arrayBuffer();
              return res.send(Buffer.from(arrayBuffer));
            }
          }
          
          return res.status(403).json({
            error: "الملف قد يكون خاصاً أو غير مشارك علناً. يرجى تعديل الإذن في Google Drive إلى 'أي شخص لديه الرابط يمكنه العرض'."
          });
        } else if (fallbackResponse.ok) {
          res.setHeader("Content-Type", "application/pdf");
          const arrayBuffer = await fallbackResponse.arrayBuffer();
          return res.send(Buffer.from(arrayBuffer));
        }
      } else if (response.ok) {
        res.setHeader("Content-Type", "application/pdf");
        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));
      }

      throw new Error(`Google Drive proxy returned status: ${response.status}`);
    }
  } catch (err: any) {
    console.error("Vercel Proxy error:", err);
    res.status(500).json({ error: err.message || "حدث خطأ أثناء تحميل الملف من قوقل درايف." });
  }
}
