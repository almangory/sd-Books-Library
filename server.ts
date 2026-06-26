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
      
      let targetUrl = "";
      if (id && typeof id === "string") {
        targetUrl = `https://docs.google.com/uc?export=download&id=${id}`;
      } else if (url && typeof url === "string") {
        targetUrl = url;
      } else {
        return res.status(400).json({ error: "Missing id or url parameter" });
      }

      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      if (!response.ok) {
        throw new Error(`Target returned status: ${response.status}`);
      }

      // Check content-type. If it's HTML, we might have hit a virus scan page or error.
      const contentType = response.headers.get("content-type") || "";
      if (id && contentType.includes("text/html")) {
        const text = await response.text();
        
        // Match a confirmation code like `confirm=xxxx`
        const confirmMatch = text.match(/confirm=([a-zA-Z0-9_]+)/);
        if (confirmMatch && confirmMatch[1]) {
          const confirmToken = confirmMatch[1];
          const confirmUrl = `https://docs.google.com/uc?export=download&confirm=${confirmToken}&id=${id}`;
          
          const confirmResponse = await fetch(confirmUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
          });
          
          if (confirmResponse.ok) {
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Access-Control-Allow-Origin", "*");
            const arrayBuffer = await confirmResponse.arrayBuffer();
            return res.send(Buffer.from(arrayBuffer));
          }
        }
        
        return res.status(400).json({ error: "Failed to download Google Drive PDF (possibly private or too large)" });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Access-Control-Allow-Origin", "*");
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.error("Proxy error:", err);
      res.status(500).json({ error: err.message || "Internal server error proxying PDF" });
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
