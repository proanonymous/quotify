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

const categoryIdeas: Record<string, string[]> = {
  Motivation: ["consistent effort", "small beginnings", "the courage to continue", "steady progress"],
  Success: ["meaningful progress", "patient ambition", "learning through action", "purposeful work"],
  Life: ["new beginnings", "everyday moments", "change and growth", "living with intention"],
  Love: ["kindness", "trust", "understanding", "care shown through actions"],
  Wisdom: ["experience", "patience", "clear thinking", "the questions we ask"],
  Friendship: ["loyalty", "shared laughter", "showing up", "honest connection"],
  Business: ["solving real problems", "creating value", "thoughtful decisions", "long-term vision"],
  Leadership: ["leading by example", "listening well", "shared purpose", "responsibility"],
  Education: ["curiosity", "practice", "asking better questions", "lifelong learning"],
  Discipline: ["daily habits", "keeping promises to yourself", "focus", "repeated effort"],
  Faith: ["hope", "trust", "gratitude", "quiet strength"],
  Confidence: ["self-belief", "preparation", "taking the first step", "knowing your values"],
  Happiness: ["gratitude", "simple joys", "connection", "being present"],
  "Personal Growth": ["self-awareness", "learning from change", "brave choices", "becoming wiser"],
};

const shortTemplates = [
  (idea: string, topic: string) => `Let ${idea} guide the way you approach ${topic}.`,
  (idea: string, topic: string) => `${topic} grows brighter when you make room for ${idea}.`,
  (idea: string, topic: string) => `Choose ${idea}; let ${topic} become the result of that choice.`,
  (idea: string, topic: string) => `A little more ${idea} can change how you experience ${topic}.`,
  (idea: string, topic: string) => `Build ${topic} one thoughtful step at a time, with ${idea} at the centre.`,
  (idea: string, topic: string) => `Where ${idea} leads, ${topic} can find a stronger direction.`,
];

const detailedTemplates = [
  (idea: string, topic: string) => `You do not have to master ${topic} all at once. Keep choosing ${idea}, and let each small decision teach you what the next step should be.`,
  (idea: string, topic: string) => `The meaning of ${topic} is shaped less by one perfect moment and more by the habits you build. Make space for ${idea}, and progress will have somewhere to begin.`,
  (idea: string, topic: string) => `When the path around ${topic} feels uncertain, return to what you can practise today. ${idea} is not a finish line; it is a useful way to take the next step.`,
  (idea: string, topic: string) => `A worthwhile journey with ${topic} leaves room for mistakes, questions, and fresh attempts. Hold on to ${idea}, learn from what happens, and keep moving with intention.`,
  (idea: string, topic: string) => `You shape ${topic} through the choices that may seem ordinary at first. Let ${idea} influence those choices, and give meaningful change the time it needs.`,
  (idea: string, topic: string) => `There is no single moment that defines ${topic}. It is the steady combination of reflection, action, and ${idea} that gives your effort direction over time.`,
];

function clean(value: unknown, fallback: string, max: number): string {
  return String(value ?? fallback).trim().slice(0, max) || fallback;
}

export default function handler(req: ApiRequest, res: ApiResponse) {
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

  const category = clean(body.category, "Motivation", 40);
  const topic = clean(body.topic, category.toLowerCase(), 100);
  const length = clean(body.length, "Any length", 40);
  const ideas = categoryIdeas[category] ?? ["fresh perspective", "steady effort", "curiosity", "purpose"];
  const templates = length === "Thoughtful and detailed" ? detailedTemplates : shortTemplates;
  const seed = Array.from(category + topic).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const quotes = Array.from({ length: 4 }, (_, index) => {
    const idea = ideas[(seed + index * 3) % ideas.length];
    const template = templates[(seed + index * 2) % templates.length];
    return {
      text: template(idea, topic),
      author: "Quotify Original",
    };
  });

  return res.status(200).json({ quotes, category, fallbackUsed: true });
}
