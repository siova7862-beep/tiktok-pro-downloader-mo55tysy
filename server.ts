import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import AdmZip from "adm-zip";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- TIKTOK SCRAPER ENDPOINT ---
  app.get("/api/tiktok", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      console.log(`[*] Analisando link: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
        maxRedirects: 10,
      });

      const $ = cheerio.load(response.data);
      let scriptData = $("#__UNIVERSAL_DATA_FOR_REHYDRATION__").text();
      
      if (!scriptData) {
        scriptData = $("#SIGI_STATE").text();
      }

      if (!scriptData) {
        return res.status(404).json({ error: "Dados não encontrados no TikTok." });
      }

      const fullData = JSON.parse(scriptData);
      
      // Attempt to find itemStruct
      let itemData: any = null;
      try {
        // Path 1
        itemData = fullData?.__DEFAULT_SCOPE__?.["webapp.reflow.video.detail"]?.itemInfo?.itemStruct;
        if (!itemData) {
          // Path 2
          const itemModule = fullData?.ItemModule;
          if (itemModule) {
            itemData = Object.values(itemModule)[0];
          }
        }
        if (!itemData) {
          // Path 3 (Newer layouts)
          itemData = fullData?.__DEFAULT_SCOPE__?.["webapp.video-detail"]?.itemInfo?.itemStruct;
        }
      } catch (e) {
        console.error("Error parsing itemStruct:", e);
      }

      if (!itemData) {
        return res.status(404).json({ error: "Informações do vídeo não encontradas." });
      }

      const videoUrl = itemData.video?.playAddr || itemData.video?.downloadAddr;
      const cover = itemData.video?.cover || itemData.video?.originCover;
      const musicUrl = itemData.music?.playUrl;
      const images = itemData.imagePost?.images?.map((img: any) => img.imageURL?.urlList?.[0]);
      
      res.json({
        id: itemData.id,
        desc: itemData.desc,
        author: itemData.author?.nickname || itemData.author?.uniqueId,
        avatar: itemData.author?.avatarLarger || itemData.author?.avatarThumb,
        stats: itemData.stats,
        video: videoUrl,
        duration: itemData.video?.duration,
        cover: cover,
        music: musicUrl,
        images: images || [],
        isCarousel: !!images?.length,
      });

    } catch (error: any) {
      console.error("TikTok Error:", error.message);
      res.status(500).json({ error: "Erro ao processar o link do TikTok." });
    }
  });

  // --- PROXY FOR VIDEO DOWNLOADS (Saves from 403) ---
  app.get("/api/download", async (req, res) => {
    const { url, filename } = req.query;
    if (!url || typeof url !== "string") return res.status(400).send("URL required");

    try {
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        headers: {
          'Referer': 'https://www.tiktok.com/',
          'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }
      });

      res.setHeader('Content-Disposition', `attachment; filename="${filename || 'tiktok_video.mp4'}"`);
      response.data.pipe(res);
    } catch (e: any) {
      res.status(500).send("Failed to stream download");
    }
  });

  // --- GITHUB PUBLISHER ENDPOINT ---
  app.post("/api/publish-github", async (req, res) => {
    const GITHUB_USER = process.env.GITHUB_USER;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    if (!GITHUB_USER || !GITHUB_TOKEN) {
      return res.status(400).json({ error: "Missing GITHUB_USER or GITHUB_TOKEN in environment." });
    }

    const repoName = `tiktok-downloader-${Math.random().toString(36).substring(7)}`;

    try {
      // 1. Create Repo
      const createRes = await axios.post(
        "https://api.github.com/user/repos",
        { name: repoName, private: false },
        { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" } }
      );

      // 2. Upload files (Simplified: just upload basic files)
      const filesToUpload = [
        "package.json", "server.ts", "src/App.tsx", "src/main.tsx", "src/index.css", "index.html", "vite.config.ts", "tsconfig.json", ".gitignore"
      ];

      for (const file of filesToUpload) {
        if (fs.existsSync(path.join(process.cwd(), file))) {
          const content = fs.readFileSync(path.join(process.cwd(), file));
          const base64Content = content.toString("base64");
          
          await axios.put(
            `https://api.github.com/repos/${GITHUB_USER}/${repoName}/contents/${file}`,
            {
              message: `Initial upload: ${file}`,
              content: base64Content
            },
            { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" } }
          );
        }
      }

      res.json({ success: true, url: `https://github.com/${GITHUB_USER}/${repoName}` });
    } catch (error: any) {
      console.error("GitHub Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Erro ao publicar no GitHub." });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
