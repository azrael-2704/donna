/**
 * Donna OS Kernel — LLM Healer
 * Automatically debugs and patches failing scripts.
 */

import { GoogleGenAI } from '@google/genai';

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

export interface HealerResult {
  code: string;
  usage?: any;
}

export async function healScript(options: HealerOptions): Promise<HealerResult> {
  const model = options.model || 'gemini-3.5-flash';
  const ai = new GoogleGenAI({ apiKey: options.apiKey });

  const promptText = `ORIGINAL CODE:\n${options.code}\n\nERROR TRACE:\n${options.errorTrace}\n\nPlease provide the complete, patched Python script.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: promptText,
      config: {
        systemInstruction: HEALER_SYSTEM_PROMPT,
        temperature: 0.1,
        maxOutputTokens: 4096,
      }
    });

    let rawText = response.text || '';

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

    return {
      code: rawText.trim(),
      usage: response.usageMetadata
    };
  } catch (error: any) {
    throw new Error(`Donna Healer failed: ${error.message}`);
  }
}
