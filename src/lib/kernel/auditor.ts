/**
 * Donna OS Kernel — LLM Auditor
 * Audits generated Python code for safety before execution.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface AuditorOptions {
  code: string;
  apiKey: string;
  model?: string;
}

export interface AuditResult {
  approved: boolean;
  reason: string;
}

const AUDITOR_SYSTEM_PROMPT = `You are the Donna OS Security Auditor. 
Your job is to review synthesized Python scripts to ensure they are safe to run in the local environment.

CRITICAL SAFETY POLICIES:
1. Block any script that attempts to delete system files or write outside the local directory/temp folder.
2. Block any script that imports 'subprocess' or 'os.system' to run arbitrary shell commands (unless it's explicitly part of a whitelisted automation, like opening a specific app, but be very strict).
3. Block any script that contains hardcoded passwords, API keys, or secrets (they must use os.environ).
4. Block scripts that seem malicious (e.g. reverse shells, cryptominers, infinite forks).
5. Allow safe automations like web scraping (requests, bs4, playwright), API calls, calendar integrations, and file processing.

You MUST respond in strictly valid JSON format with exactly two keys:
{
  "approved": boolean,
  "reason": "String explaining why it was approved or rejected"
}
Do not include any other text or markdown formatting.`;

export async function auditScript(options: AuditorOptions): Promise<AuditResult> {
  const model = options.model || 'gemini-2.0-flash';
  const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${options.apiKey}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `Audit the following Python script:\n\n${options.code}` }],
      },
    ],
    systemInstruction: {
      parts: [{ text: AUDITOR_SYSTEM_PROMPT }],
    },
    generationConfig: {
      temperature: 0.0, // Zero temperature for deterministic auditing
      responseMimeType: 'application/json', // Force JSON output
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Donna Auditor failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

  try {
    const parsed = JSON.parse(rawText) as AuditResult;
    return parsed;
  } catch (err) {
    // If JSON parsing fails, reject by default for safety
    return {
      approved: false,
      reason: `Auditor returned invalid JSON. Rejecting for safety. Raw response: ${rawText}`,
    };
  }
}
