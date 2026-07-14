import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry User-Agent
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Server-side API endpoint for AI summarization
app.post("/api/summarize", async (req, res) => {
  const { text, style } = req.body;

  if (!text || typeof text !== "string" || text.trim() === "") {
    return res.status(400).json({ error: "Text is required and must be a string." });
  }

  const validStyle = ["short", "medium", "detailed"].includes(style) ? style : "medium";

  if (!apiKey) {
    return res.status(500).json({
      error: "Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets.",
    });
  }

  try {
    const prompt = `Please summarize the following educational/lesson text. 
The user requests a "${validStyle}" summary style.
Input Text:
"""
${text}
"""`;

    const systemInstruction = `You are an expert academic tutor and AI Summarizer.
Analyze the user's input text and extract structured notes:
1. "title": A brief, engaging title for this summary/lesson.
2. "summary": A well-written, coherent summary paragraph. If style is "short", keep it under 3-4 sentences. If "medium", 5-8 sentences. If "detailed", provide a comprehensive 2-3 paragraph summary.
3. "keyPoints": An array of central concepts/ideas (bullets) from the text.
4. "keywords": 4 to 8 critical technical terms, vocabulary, or keywords.
5. "studyQA": 3 to 6 high-quality, conceptual questions and detailed answers directly based on the text.

You MUST respond strictly in valid JSON format matching the requested schema. Do not include markdown code block formatting (like \`\`\`json) inside the JSON response.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "A short, descriptive title for the lesson content.",
            },
            summary: {
              type: Type.STRING,
              description: "A cohesive, beautifully articulated summary in the requested style.",
            },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of core takeaways and bullet points.",
            },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of key terms or technical vocabulary words.",
            },
            studyQA: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                },
                required: ["question", "answer"],
              },
              description: "High-value study questions and detailed answers based on the material.",
            },
          },
          required: ["title", "summary", "keyPoints", "keywords", "studyQA"],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response received from Gemini.");
    }

    const parsedData = JSON.parse(responseText.trim());
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Summarization error:", error);
    return res.status(500).json({
      error: "Failed to generate AI summary.",
      details: error.message || String(error),
    });
  }
});

// Setup Vite Dev Server / Serve static build in production
async function setupVite() {
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
    console.log(`Server running on port http://localhost:${PORT}`);
  });
}

setupVite();
