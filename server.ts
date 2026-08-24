import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy initialization of Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API endpoint for AI analysis of links
app.post("/api/ai/analyze-link", async (req, res) => {
  const { url, title, description } = req.body;
  if (!url) {
    return res.status(400).json({ error: "Yêu cầu cung cấp URL" });
  }

  // 1. Check if the link is active
  let isLinkActive = true;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout
    const checkRes = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    isLinkActive = checkRes.status < 500;
  } catch (err) {
    isLinkActive = false;
  }

  // 2. Call Gemini for smart extraction and classification
  try {
    const ai = getGeminiClient();
    const prompt = `Bạn là một trợ lý giáo dục tiểu học thông minh người Việt Nam. 
Nhiệm vụ của bạn là phân tích một liên kết học liệu giáo dục (URL: "${url}", Tiêu đề gợi ý: "${title || 'Chưa rõ'}", Mô tả gợi ý: "${description || 'Chưa rõ'}") và đưa ra đề xuất phân loại cho môn học "Tin học" ở cấp tiểu học.

Hãy phân tích xem tài liệu này thuộc lớp nào (Lớp 3, Lớp 4, hay Lớp 5), chủ đề gì, tên bài học là gì, loại học liệu nào (video, bài giảng, trò chơi, bài tập, website, hay phần mềm), từ khóa liên quan, và sinh mô tả tiếng Việt ngắn gọn, hấp dẫn cho học sinh tiểu học.

Trả về kết quả dưới dạng một đối tượng JSON duy nhất có các trường sau:
{
  "subCategoryId": "tinhoc3" | "tinhoc4" | "tinhoc5",
  "topic": "Ví dụ: Làm quen với máy tính, Sử dụng Internet, Thiết kế slide, Lập trình Scratch...",
  "lesson": "Ví dụ: Bài 1: Thông tin và quyết định, Bài 4: Sử dụng chuột...",
  "resourceType": "video" | "lecture" | "game" | "exercise" | "website" | "software",
  "description": "Một câu mô tả tiếng Việt ngắn gọn, sinh động, dễ thương cho học sinh lớp 3-4-5 (tối đa 150 ký tự).",
  "keywords": "từ khóa 1, từ khóa 2, từ khóa 3 (phân cách bằng dấu phẩy, từ 2 đến 4 từ khóa tiếng Việt)",
  "imageUrl": "URL ảnh Unsplash chất lượng cao mô tả chủ đề tin học này (ví dụ ảnh robot, máy tính hoạt họa, scratch coding, ipad học tập) lấy từ Unsplash. Hãy chọn một URL ảnh thật sự tồn tại hoặc sử dụng ảnh học tập chất lượng cao có sẵn."
}

Hãy tự động phân loại thông minh nhất dựa trên tiêu đề, tên miền hoặc nội dung mô tả của bạn. Nếu không thể phân biệt rõ ràng, hãy mặc định chọn subCategoryId là "tinhoc3".
Đối với imageUrl, hãy trả về một URL Unsplash phù hợp mô tả chủ đề đó. Ví dụ:
- Lập trình/Scratch/Coding: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80"
- Máy tính/Tin học chung: "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=600&q=80"
- Trò chơi học tập: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80"
- Video bài học: "https://images.unsplash.com/photo-1610483178736-9a155d22009e?auto=format&fit=crop&w=600&q=80"
- Sử dụng Internet an toàn: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80"

Chỉ trả về chuỗi JSON thô, KHÔNG bao quanh bởi block \`\`\`json hay bất kỳ chữ nào khác.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "{}";
    const result = JSON.parse(responseText);

    return res.json({
      success: true,
      isLinkActive,
      analysis: result
    });
  } catch (err: any) {
    console.error("Gemini analyze link error:", err);
    // Fallback analysis if Gemini fails or is not ready
    const isScratch = url.toLowerCase().includes("scratch") || (title || "").toLowerCase().includes("scratch");
    return res.json({
      success: false,
      isLinkActive,
      error: err.message || "Failed to call Gemini API",
      analysis: {
        subCategoryId: "tinhoc3",
        topic: isScratch ? "Lập trình kéo thả" : "Sử dụng máy tính",
        lesson: "Bài học tự chọn",
        resourceType: isScratch ? "game" : "website",
        description: "Tài nguyên học tập môn Tin học dành cho các em học sinh.",
        keywords: "tin học, học tập, công nghệ",
        imageUrl: isScratch 
          ? "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80"
          : "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=600&q=80"
      }
    });
  }
});

// Vite middleware setup
async function startServer() {
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
