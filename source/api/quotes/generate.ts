type QuoteRequest = {
  category?: unknown;
  topic?: unknown;
  length?: unknown;
};

type ApiRequest = {
  method?: string;
  body?: QuoteRequest | string;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (value: unknown) => void;
  setHeader?: (name: string, value: string) => void;
};

function clean(value: unknown, fallback: string, max: number): string {
  return String(value ?? fallback).trim().slice(0, max) || fallback;
}

function extractJson(text: string): { quotes?: Array<{ text?: string; author?: string }> } | null {
  const cleaned = text.trim().replace(/^\uFEFF/, "").replace(/^\x60{3}(?:json)?\s*/i, "").replace(/\s*\x60{3}$/i, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader?.("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader?.("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  let body = req.body ?? {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body) as QuoteRequest;
    } catch {
      return res.status(400).json({ error: "Request body must be valid JSON." });
    }
  }

  const input = body as QuoteRequest;
  const category = clean(input.category, "Motivation", 40);
  const topic = clean(input.topic, category.toLowerCase(), 100);
  const length = clean(input.length, "Any length", 40);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      error: "Live AI is not configured yet. Add GEMINI_API_KEY to the Vercel project environment variables, then redeploy.",
    });
  }

  const prompt = [
    "Create exactly four distinct, original inspirational quotes for a quote-design app.",
    "Category: " + category + ".",
    "Topic: " + topic + ".",
    "Length preference: " + length + ".",
    "Make each quote natural, thoughtful, memorable, and suitable for sharing.",
    "Do not imitate a living writer or reproduce existing quotations, lyrics, or copyrighted passages.",
    'Do not attribute generated words to real people. Set every author to "Quotify Original".',
    "Return only a JSON object with this exact shape: { quotes: [{ text: string, author: string }] }.",
  ].join("\n");

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.9,
            maxOutputTokens: 900,
          },
        }),
        signal: AbortSignal.timeout(25000),
      }
    );

    if (!response.ok) {
      const providerError = await response.json().catch(() => ({})) as {
        error?: { message?: string };
      };
      console.error("Gemini API request failed:", response.status, providerError.error?.message);
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        return res.status(502).json({
          error: "Gemini rejected the API request. Check that GEMINI_API_KEY is valid and enabled for the Gemini API.",
        });
      }
      if (response.status === 429) {
        return res.status(429).json({
          error: "The AI service is busy or its usage limit has been reached. Please try again later.",
        });
      }
      return res.status(502).json({ error: "The AI quote service is temporarily unavailable. Please try again." });
    }

    const payload = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const generatedText = payload.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("\n") || "";
    const parsed = extractJson(generatedText);
    const quotes = Array.isArray(parsed?.quotes)
      ? parsed!.quotes!
          .filter(item => typeof item.text === "string" && item.text.trim())
          .slice(0, 4)
          .map(item => ({
            text: item.text!.trim().slice(0, 500),
            author: "Quotify Original",
          }))
      : [];

    if (quotes.length !== 4) {
      return res.status(502).json({
        error: "The AI returned an incomplete response. Please generate again.",
      });
    }

    return res.status(200).json({ quotes, category, fallbackUsed: false, provider: "Gemini" });
  } catch (err) {
    console.error("Gemini quote generation failed:", err);
    return res.status(502).json({
      error: "Could not reach the AI quote service. Please check your connection and try again.",
    });
  }
}
