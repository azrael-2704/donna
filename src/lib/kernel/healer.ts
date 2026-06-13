/**
 * Donna OS Kernel — LLM Healer
 * Automatically debugs and patches failing scripts.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface HealerOptions {
  code: string;
  errorTrace: string;
  apiKey: string;
  model?: string;
}

const HEALER_SYSTEM_PROMPT = `You are the Donna OS Self-Healing Agent.
A Python automation script generated an error during execution. Your job is to analyze the error trace and provide the patched Python code.

CRITICAL RULES:
1. OUTPUT ONLY VALID PYTHON CODE. Do not wrap your response in markdown code blocks (\`\`\`python ... \`\`\`). The raw output must be directly executable.
2. Fix the error described in the trace while preserving the original intent and structure as much as possible.
3. Ensure the script still outputs structured JSON to stdout.
4. Do not include explanations, apologies, or comments outside the code block.
`;

export async function healScript(options: HealerOptions): Promise<string> {
  const model = options.model || 'gemini-2.0-flash';
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${options.apiKey}`;

  const promptText = `ORIGINAL CODE:\n${options.code}\n\nERROR TRACE:\n${options.errorTrace}\n\nPlease provide the complete, patched Python script.`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: promptText }],
      },
    ],
    systemInstruction: {
      parts: [{ text: HEALER_SYSTEM_PROMPT }],
    },
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Donna Healer failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

  // Defensive cleanup
  if (rawText.startsWith('\`\`\`python')) {
    rawText = rawText.replace(/^\`\`\`python\n/, '');
  }
  if (rawText.startsWith('\`\`\`')) {
    rawText = rawText.replace(/^\`\`\`\n?/, '');
  }
  if (rawText.endsWith('\`\`\`')) {
    rawText = rawText.replace(/\n?\`\`\`$/, '');
  }

  return rawText.trim();
}
