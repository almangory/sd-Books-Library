import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Serve API routes first
  app.get("/api/proxy-pdf", async (req: express.Request, res: express.Response) => {
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
        res.setHeader("Access-Control-Allow-Origin", "*");
        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));
      }

      // If it's a Google Drive ID
      if (id && typeof id === "string") {
        // Attempt 1: Fetch from the new official download subdomain which is highly reliable
        let targetUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download`;
        
        let response = await fetch(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });

        let contentType = response.headers.get("content-type") || "";

        // If Google Drive returns an HTML page, it is either a virus scan warning or an error page
        if (contentType.includes("text/html")) {
          const text = await response.text();
          
          // Look for confirmation token in the HTML (usually confirm=xxxx)
          const confirmMatch = text.match(/confirm=([a-zA-Z0-9_]+)/) || text.match(/uuid=([a-zA-Z0-9_-]+)/);
          if (confirmMatch && confirmMatch[1]) {
            const confirmToken = confirmMatch[1];
            const confirmUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=${confirmToken}`;
            
            // Get the set-cookie headers from the initial response (CRITICAL for Google Drive authorization)
            const cookies = response.headers.get("set-cookie") || "";
            
            const confirmResponse = await fetch(confirmUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Cookie": cookies
              }
            });

            if (confirmResponse.ok) {
              res.setHeader("Content-Type", "application/pdf");
              res.setHeader("Access-Control-Allow-Origin", "*");
              const arrayBuffer = await confirmResponse.arrayBuffer();
              return res.send(Buffer.from(arrayBuffer));
            }
          }

          // Attempt 2: Fallback to the classic docs.google.com endpoint if usercontent failed
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
                res.setHeader("Access-Control-Allow-Origin", "*");
                const arrayBuffer = await secondFallbackResponse.arrayBuffer();
                return res.send(Buffer.from(arrayBuffer));
              }
            }
            
            // If we get an HTML page and can't find a confirmation token, the file is probably restricted (private)
            return res.status(403).json({
              error: "الملف قد يكون خاصاً أو غير مشارك علناً. يرجى تعديل الإذن في Google Drive إلى 'أي شخص لديه الرابط يمكنه العرض'."
            });
          } else if (fallbackResponse.ok) {
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Access-Control-Allow-Origin", "*");
            const arrayBuffer = await fallbackResponse.arrayBuffer();
            return res.send(Buffer.from(arrayBuffer));
          }
        } else if (response.ok) {
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Access-Control-Allow-Origin", "*");
          const arrayBuffer = await response.arrayBuffer();
          return res.send(Buffer.from(arrayBuffer));
        }

        throw new Error(`Google Drive proxy returned status: ${response.status}`);
      }
    } catch (err: any) {
      console.error("Proxy error:", err);
      res.status(500).json({ error: err.message || "حدث خطأ أثناء تحميل الملف من قوقل درايف." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
