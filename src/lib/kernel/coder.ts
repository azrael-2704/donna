/**
 * Donna OS Kernel — LLM Coder
 * Synthesizes Python code based on user intent.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface CoderOptions {
  instruction: string;
  context?: string;      // Any prior conversation or schema context
  model?: string;        // 'gemini-2.0-flash' or 'gemini-1.5-pro'
  apiKey: string;
}

const CODER_SYSTEM_PROMPT = `You are the Donna OS Coder, an expert Python automation engineer.
Your job is to translate user intents into a single, complete, and highly robust Python script.

CRITICAL RULES:
1. OUTPUT ONLY VALID PYTHON CODE. Do not wrap your response in markdown code blocks (\`\`\`python ... \`\`\`). The raw output must be directly executable.
2. The script must be completely self-contained. 
3. Include error handling. Use try-except blocks and print clear error messages to stderr.
4. Output results as structured JSON to stdout by printing it (e.g. print(json.dumps(...))).
5. Use libraries like requests, bs4, playwright if needed. 
6. DO NOT hardcode sensitive credentials. Read them from os.environ.get('VAR_NAME').
7. When scraping, ensure you set a realistic User-Agent.

Example Output format:
import os
import json
import requests

def main():
    try:
        # logic here
        print(json.dumps({"success": True, "data": ...}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
`;

export async function synthesizeScript(options: CoderOptions): Promise<string> {
  const model = options.model || 'gemini-2.0-flash';
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${options.apiKey}`;

  const promptText = options.context 
    ? `Context: ${options.context}\n\nTask: ${options.instruction}`
    : `Task: ${options.instruction}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: promptText }],
      },
    ],
    systemInstruction: {
      parts: [{ text: CODER_SYSTEM_PROMPT }],
    },
    generationConfig: {
      temperature: 0.1, // Low temperature for code generation
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
    throw new Error(`Donna Coder failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

  // Defensive cleanup in case the LLM ignored instructions and included markdown
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
