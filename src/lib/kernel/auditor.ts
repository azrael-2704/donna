/**
 * Donna OS Kernel — LLM Auditor
 * Audits generated Python code for safety before execution.
 */

import { GoogleGenAI } from '@google/genai';

export interface AuditorOptions {
  code: string;
  apiKey: string;
  model?: string;
}

export interface AuditResult {
  approved: boolean;
  reason: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  blockedFunctions: string[];
  _usage?: any;
}

const AUDITOR_SYSTEM_PROMPT = `You are the Donna OS Security Auditor. 
Your job is to review synthesized Python scripts to ensure they are safe to run in the local environment.

CRITICAL SAFETY POLICIES:
1. Block any script that attempts to delete system files or write outside the local directory/temp folder.
2. Block any script that imports 'subprocess' or 'os.system' to run arbitrary shell commands (unless it's explicitly part of a whitelisted automation, like opening a specific app, OR sending desktop notifications using 'osascript', 'notify-send', or 'powershell', but be very strict otherwise).
3. Block any script that contains hardcoded passwords, API keys, or secrets (they must use os.environ).
4. Block scripts that seem malicious (e.g. reverse shells, cryptominers, infinite forks).
5. Allow safe automations like web scraping (requests, bs4, playwright), API calls, calendar integrations, and file processing.
6. Explicitly ALLOW the script to make HTTP POST/GET requests to 'http://localhost:3000/api/kernel/memory'. This is the native OS Memory API and is 100% trusted.

You MUST respond in strictly valid JSON format with exactly four keys:
{
  "approved": boolean,
  "reason": "String explaining why it was approved or rejected",
  "riskLevel": "LOW", "MEDIUM", or "HIGH",
  "blockedFunctions": ["List", "of", "blocked", "APIs", "if", "any"]
}
Do not include any other text or markdown formatting.`;

export async function auditScript(options: AuditorOptions): Promise<AuditResult> {
  const model = options.model || 'gemini-3.1-flash-lite';
  const ai = new GoogleGenAI({ apiKey: options.apiKey });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Audit the following Python script:\n\n${options.code}`,
      config: {
        systemInstruction: AUDITOR_SYSTEM_PROMPT,
        temperature: 0.0, // Zero temperature for deterministic auditing
        responseMimeType: 'application/json', // Force JSON output
      }
    });

    const rawText = response.text || '';

    try {
      const parsed = JSON.parse(rawText) as AuditResult;
      parsed._usage = response.usageMetadata;
      return parsed;
    } catch (err) {
      // If JSON parsing fails, reject by default for safety
      return {
        approved: false,
        reason: `Auditor returned invalid JSON. Rejecting for safety. Raw response: ${rawText}`,
        riskLevel: 'HIGH',
        blockedFunctions: [],
      };
    }
  } catch (error: any) {
    throw new Error(`Donna Auditor failed: ${error.message}`);
  }
}
