/**
 * Donna OS Kernel — LLM Coder
 * Synthesizes Python code based on user intent.
 */

import { GoogleGenAI, Type, Schema } from '@google/genai';

export interface CoderOptions {
  instruction: string;
  context?: string;
  model?: string;
  apiKey: string;
}

export interface CoderResult {
  code: string;
  execution_type: 'ONCE' | 'DAEMON' | 'CRON';
  cron_schedule?: string;
  reasoning: string;
  _usage?: any;
}

const CODER_SYSTEM_PROMPT = `You are the Donna OS Coder, an expert Python automation engineer.
Your job is to translate user intents into a single, complete, and highly robust Python script.

ENVIRONMENT:
- The script will run on a standard local environment (macOS/Linux/Windows).
- The script executes in a virtual environment. You can use standard libraries (os, sys, json, requests) freely.
- Your code must be robust, error-handled, and print clear standard output/error so the OS can parse the result.

MEMORY ENGINE (DDS Syntax & Markdown):
- If the user asks you to "remember", "track", "save", or "log" data, you must write a Python script that appends to the appropriate Markdown file in '.donna/memory/' (e.g. transactions.md, profile.md, goals.md).
- ALL MEMORY MUST BE WRITTEN IN 'DDS' (Donna Data Syntax) format.
- DDS Grammar Rules:
  1. Start with a block header: \`@domain identifier:\` (Domains: @tx, @user, @goal, @habit, @audit)
  2. Indent properties by exactly 2 spaces.
  3. Use extremely short keys (e.g. amt:, cat:, txt:, st:). DO NOT use quotes, brackets, or commas.
- Example Python snippet:
  with open('.donna/memory/transactions.md', 'a') as f:
      f.write("\\n@tx 231025_0900:\\n  amt: -5.50\\n  cat: Food\\n  txt: Starbucks")

BROWSER AUTOMATION (PLAYWRIGHT):
- If the user asks to "scrape", "search the web", "find earphones", etc., use Playwright.
- Assume \`playwright\` is installed. Use \`from playwright.sync_api import sync_playwright\`.
- ALWAYS run the browser in HEADLESS mode.
- Example:
  with sync_playwright() as p:
      browser = p.chromium.launch(headless=True)
      page = browser.new_page()
      page.goto("https://example.com")
      # Extract data, then close
      browser.close()

EXECUTION TYPES:
You must analyze the user's intent to determine how the script should be executed:
- 'ONCE': A standard script that runs immediately and finishes.
- 'DAEMON': A permanent background script that runs continuously.
- 'CRON': A recurring task (e.g., "every 24 hours").

CRITICAL INSTRUCTIONS:
1. Include error handling. Use try-except blocks and print clear error messages to stderr.
2. DO NOT hardcode sensitive credentials. Read them from os.environ.get('VAR_NAME').
3. Keep it modular and clean.
`;

const SCRIPT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    code: {
      type: Type.STRING,
      description: 'The raw, runnable Python script. Do not wrap in markdown backticks.',
    },
    execution_type: {
      type: Type.STRING,
      description: 'Must be one of: ONCE, DAEMON, CRON',
    },
    cron_schedule: {
      type: Type.STRING,
      description: 'A standard cron expression if execution_type is CRON (e.g., "0 0 * * *"). Leave empty otherwise.',
    },
    reasoning: {
      type: Type.STRING,
      description: 'Your internal reasoning for how you structured the code and execution type.',
    },
  },
  required: ['code', 'execution_type', 'reasoning'],
};

export async function synthesizeScript(options: CoderOptions): Promise<CoderResult> {
  const model = options.model || 'gemini-3.5-flash';
  const ai = new GoogleGenAI({ apiKey: options.apiKey });

  const promptText = options.context 
    ? `Context: ${options.context}\n\nTask: ${options.instruction}`
    : `Task: ${options.instruction}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: promptText,
      config: {
        systemInstruction: CODER_SYSTEM_PROMPT,
        temperature: 0.1,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        responseSchema: SCRIPT_SCHEMA,
      }
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText) as CoderResult;
    parsed._usage = response.usageMetadata;
    return parsed;
  } catch (error: any) {
    throw new Error(`Donna Coder failed: ${error.message}`);
  }
}
