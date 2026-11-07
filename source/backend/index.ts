import { ai, router, json, error } from '@appdeploy/sdk';

type QuoteRequest = {
  category?: string;
  topic?: string;
  length?: string;
};

export const handler = router({
  'POST /api/quotes/generate': [
    async ({ body }) => {
      const input = (body || {}) as QuoteRequest;
      const category = String(input.category || 'Motivation').slice(0, 40);
      const topic = String(input.topic || '')
        .trim()
        .slice(0, 100);
      const length = String(input.length || 'Any length').slice(0, 40);

      if (!category && !topic)
        return error('Choose a category or enter a topic.', 400);

      const prompt = [
        'Create exactly four distinct, original inspirational quotes for a quote-design app.',
        'Category: ' + category + '.',
        topic ? 'Specific topic or idea: ' + topic + '.' : '',
        'Length preference: ' + length + '.',
        'Each quote must be fresh, concise, natural, thoughtful, and suitable for sharing.',
        'Do not imitate a living writer. Do not quote copyrighted lyrics or passages.',
        'Do not attribute generated words to real people. Use the author label "Quotify Original".',
        'Avoid clichés and avoid repeating the same idea.',
        'Return four quote objects.',
      ]
        .filter(Boolean)
        .join('\n');

      try {
        const result = await ai.generate({
          prompt,
          system:
            'You are a thoughtful original quote writer. Return only valid structured output matching the supplied schema.',
          schema: {
            type: 'object',
            properties: {
              quotes: {
                type: 'array',
                minItems: 4,
                maxItems: 4,
                items: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    author: { type: 'string' },
                  },
                  required: ['text', 'author'],
                  additionalProperties: false,
                },
              },
            },
            required: ['quotes'],
            additionalProperties: false,
          },
          maxTokens: 700,
          temperature: 0.9,
          thinkingMode: 'FAST',
        });
        const fallbackQuotes = [
          'Progress becomes powerful when you keep showing up for the small steps.',
          'A clear purpose can turn an ordinary day into meaningful progress.',
          'Your next chapter is shaped by the choices you make today.',
          'Stay curious, keep learning, and let every experience make you wiser.',
        ];
        const parsePayload = (raw: string) => {
          const cleaned = String(raw || '')
            .trim()
            .replace(/^\uFEFF/, '')
            .replace(/^\x60{3}(?:json)?\s*/i, '')
            .replace(/\s*\x60{3}$/i, '');
          try {
            return JSON.parse(cleaned) as { quotes?: Array<{ text?: string; author?: string }> };
          } catch {
            const start = cleaned.indexOf('{');
            const end = cleaned.lastIndexOf('}');
            if (start >= 0 && end > start) {
              try {
                return JSON.parse(cleaned.slice(start, end + 1)) as {
                  quotes?: Array<{ text?: string; author?: string }>;
                };
              } catch {
                return null;
              }
            }
            return null;
          }
        };
        const parsed = parsePayload(result.text);
        const generated = Array.isArray(parsed?.quotes)
          ? parsed!.quotes!
              .filter(item => typeof item.text === 'string' && item.text.trim())
              .slice(0, 4)
              .map(item => ({
                text: item.text!.trim().slice(0, 400),
                author: 'Quotify Original',
              }))
          : [];
        const quotes = generated.length
          ? generated
          : fallbackQuotes.map(text => ({ text, author: 'Quotify Original' }));
        return json({ quotes, category, fallbackUsed: generated.length === 0 });
      } catch (err) {
        console.error('Quote generation failed:', err);
        return error(
          'The AI quote service is temporarily unavailable. Please try again.',
          503
        );
      }
    },
  ],
});
